import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { C, ARCH, MONO, FONTS, ASSETS, page, out, AVATAR } from './lib.mjs'

/**
 * LinkedIn carousel "One sentence per design token: a small test", 1080×1350 pages.
 * Three slides: 1 the result, 2 confidence, 3 the runs. Each is a function here; all export as one PDF.
 *
 * Each page is written twice: a `.dc.html` board for the rolling posts canvas (avatar from the
 * canvas's asset store, like every post board) and a standalone `.html` with the avatar inlined,
 * which is what gets printed to the carousel PDF. Same markup in both.
 *
 * Geometry: 80px padding keeps everything inside LinkedIn's 80px counter/arrow zone and well
 * inside the 48px safe margin.
 *
 * Ground: navy with paper type, the palette's strongest pairing (15.6:1), and a dark card keeps
 * its edge on LinkedIn's white feed where paper nearly vanishes. Series on navy: sky-light and
 * sand-mid, both ≥ 4.5:1 on navy and apart in lightness as well as hue; the light steps (the
 * text steps on navy) label the deltas.
 */
console.log('carousel boards →')

const PAD = 80
const W = 1080, H = 1350
const COL = W - 2 * PAD // 920

/* ── Data (blind choice test, conditions A and B only) ─────────────── */
// Two grounds. Slides 1 and 2 are navy with paper type, the strongest pairing and a card that
// keeps its edge on the white feed. Slide 3 turns to paper: a change of ground where the data
// gets dense, so the reader gets a breath. Every role below is solved for its ground.
const THEMES = {
  dark: {
    bg: C.navy, // ground
    fg: C.paper, // ink: headline, end values, column labels
    muted: C['slate-light'], // subtitle, axis, legend detail
    grid: C['rule-navy'], // decorative gridlines, the "rest" of a bar
    line: C['slate-light'], // structural lines: baseline, ceiling, outlines
    hero: C['magenta-light'], // the one statement: the swipe cue, and a ground under navy text
    mark: C['magenta-mid'], // the sure mistake as a shape: the mid step, ≥ 3:1 on both grounds
  },
  light: {
    bg: C.paper,
    fg: C.navy,
    muted: C['slate-deep'], // 6.2:1 on paper
    grid: C['rule-paper'],
    line: C['slate-mid'], // ≥ 3:1 on paper, for marks not text
    hero: C['magenta-deep'], // 6.2:1 under paper text: the button, never a bare shape
    mark: C['magenta-mid'], // 4.1:1 on paper, the pairing matrix's grade for shapes
  },
}
let G = THEMES.dark
/** Build with another ground for the duration of fn. The helpers read G when they are called. */
const withTheme = (name, fn) => {
  const prev = G
  G = THEMES[name]
  try {
    return fn()
  } finally {
    G = prev
  }
}
const SERIES = [
  { key: 'small', name: 'Haiku 4.5', short: 'Haiku 4.5', a: 33, b: 42, line: C['sky-light'], ink: C['sky-light'] },
  { key: 'mid', name: 'Sonnet 5', short: 'Sonnet 5', a: 39, b: 43, line: C['sand-mid'], ink: C['sand-light'] },
]
const Y_MIN = 30, Y_MAX = 44

/* ── Type helpers (post scale, brand/typography.json) ──────────────── */
const arch = (t, size, { weight = 800, lh = 1, track = '-0.025em', color = G.fg, stretch = 100, extra = '' } = {}) =>
  `<div style="font-family:${ARCH};font-size:${size}px;font-weight:${weight};line-height:${lh};letter-spacing:${track};font-stretch:${stretch}%;color:${color};${extra}">${t}</div>`
const mono = (t, size, { weight = 400, lh = 1.2, color = G.fg, extra = '' } = {}) =>
  `<div style="font-family:${MONO};font-size:${size}px;font-weight:${weight};line-height:${lh};color:${color};${extra}">${t}</div>`

/* ── Slope chart: SVG in page px, no scaling, so every size is literal ─ */
function slopeChart({ height }) {
  const xA = 270, xB = 600 // columns; the end labels at B carry value and model name
  const top = 64 // y of the ceiling (All 44); the label above it gets its own air
  const headerH = 48 // the column badge alone; the conditions are spelled out above the chart
  const base = height - headerH - 24
  const k = (base - top) / (Y_MAX - Y_MIN)
  const y = (v) => top + (Y_MAX - v) * k

  const knock = `paint-order:stroke;stroke:${G.bg};stroke-width:14px;stroke-linejoin:round`
  // Rows of the two B end labels (see below); a gridline one of them would cross stops at column B.
  const yMid = y(SERIES[1].b) + 10, ySmall = y(SERIES[0].b) + 40
  const ticks = [30, 35, 40]
  const grid = ticks
    .map(
      (v) =>
        `<line x1="70" y1="${y(v)}" x2="${Math.min(Math.abs(y(v) - yMid), Math.abs(y(v) - ySmall)) < 30 ? xB + 24 : 920}" y2="${y(v)}" stroke="${v === Y_MIN ? G.line : G.grid}" stroke-width="2"/>
         <text x="50" y="${y(v) + 12}" text-anchor="end" font-family="${MONO}" font-size="36" fill="${G.muted}">${v}</text>`,
    )
    .join('')
  const ceiling = `<line x1="70" y1="${top}" x2="920" y2="${top}" stroke="${G.line}" stroke-width="3" stroke-dasharray="12 12"/>
    <text x="70" y="${top - 16}" font-family="${MONO}" font-size="36" fill="${G.muted}">All 44</text>`

  // Column badge, an outlined ring so it reads as a marker, not as type. Its condition is spelled
  // out in the list above the chart.
  const header = (x, letter) => {
    const cy = base + 24 + headerH / 2
    return `<circle cx="${x}" cy="${cy}" r="22.5" fill="${G.bg}" stroke="${G.fg}" stroke-width="3"/>
      <text x="${x}" y="${cy + 12}" text-anchor="middle" font-family="${ARCH}" font-size="32" font-weight="800" fill="${G.fg}">${letter}</text>`
  }

  // Lines + dots, drawn before the labels so the labels knock them out where they must.
  const lines = SERIES.map(
    (s) =>
      `<line x1="${xA}" y1="${y(s.a)}" x2="${xB}" y2="${y(s.b)}" stroke="${s.line}" stroke-width="7" stroke-linecap="round"/>`,
  ).join('')
  const dots = SERIES.map(
    (s) =>
      `<circle cx="${xA}" cy="${y(s.a)}" r="11" fill="${s.line}" stroke="${G.bg}" stroke-width="5"/>
       <circle cx="${xB}" cy="${y(s.b)}" r="11" fill="${s.line}" stroke="${G.bg}" stroke-width="5"/>`,
  ).join('')

  // End values: A values sit left of their dots. At B each line ends in its value and its model
  // name, so identity never depends on colour. The two B values are 1 apart and the higher one
  // is 1 under the ceiling, so both labels sit clearly below the ceiling: 43 just under it, 42
  // further down, each tied to its dot by a leader that fans out rather than crossing the other.
  // Neither B label carries a knockout: the ceiling is never hidden, and the one gridline a label
  // would cross stops at column B instead.
  const [small, mid] = SERIES
  // The name's mono caps are shorter than the Archivo digits, so it rises 4px to centre on them.
  const endVal = (x, yy, v, anchor, name = '', style = knock) =>
    `<text x="${x}" y="${yy + 17}" text-anchor="${anchor}" font-family="${ARCH}" font-size="48" font-weight="700" letter-spacing="-0.02em" fill="${G.fg}" style="${style}">${v}${name ? `<tspan dx="14" dy="-4" font-family="${MONO}" font-size="36" font-weight="400" letter-spacing="0" fill="${G.muted}">${name}</tspan>` : ''}</text>`
  const leader = (s, yy) =>
    `<line x1="${xB + 14}" y1="${y(s.b) + (yy - y(s.b)) / 3}" x2="${xB + 30}" y2="${yy}" stroke="${s.line}" stroke-width="3" stroke-linecap="round"/>`
  const ends = `
    ${endVal(xA - 30, y(small.a), small.a, 'end')}
    ${endVal(xA - 30, y(mid.a), mid.a, 'end')}
    ${leader(mid, yMid)}${endVal(xB + 40, yMid, mid.b, 'start', mid.short, '')}
    ${leader(small, ySmall)}${endVal(xB + 40, ySmall, small.b, 'start', small.short, '')}`

  // Deltas: the second element of the hierarchy. Each sits on its own line's side, in the
  // hue's light step (the text step on navy), so colour supports what position already says.
  const at = (s, x) => y(s.a) + ((x - xA) / (xB - xA)) * (y(s.b) - y(s.a))
  const deltas = `
    <text x="${xA + 0.68 * (xB - xA)}" y="${at(small, xA + 0.68 * (xB - xA)) + 88}" text-anchor="middle" font-family="${ARCH}" font-size="64" font-weight="800" letter-spacing="-0.02em" fill="${small.ink}">+${small.b - small.a}</text>
    <text x="${xA + 0.2 * (xB - xA)}" y="${at(mid, xA + 0.2 * (xB - xA)) - 36}" text-anchor="middle" font-family="${ARCH}" font-size="64" font-weight="800" letter-spacing="-0.02em" fill="${mid.ink}">+${mid.b - mid.a}</text>`

  const label = `Slope chart. ${small.name}: ${small.a} right answers with names and values only, ${small.b} with one sentence per role. ${mid.name}: ${mid.a} to ${mid.b}. Ceiling at all 44.`
  return `<svg width="${COL}" height="${height}" viewBox="0 0 ${COL} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" style="display:block;overflow:visible">
    ${grid}${ceiling}${lines}${dots}${ends}${deltas}
    ${header(xA, 'A')}
    ${header(xB, 'B')}
  </svg>`
}

/* ── Page 1: the result ─────────────────────────────────────────────── */
/* ── Pieces shared by every slide ──────────────────────────────────── */
/** Condition row: outlined ring badge beside its muted label. The group header on the slide 3 matrix. */
const condition = (letter, text) => `<div style="display:flex;align-items:center;gap:20px;height:48px">
      <div style="width:48px;height:48px;border-radius:50%;box-sizing:border-box;border:3px solid ${G.fg};color:${G.fg};font-family:${ARCH};font-size:32px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${letter}</div>
      ${mono(text, 36, { color: G.muted })}
    </div>`
/** The legend, the same on every slide: 32px muted labels (the component floor, about 11px on a
 *  phone) 14px off their mark, items 48px apart, on a 40px row like the key below it. */
const LEG = 32, SW = 28
const legendRow = (items, gapTop) => `<div style="${gapTop ? `margin-top:${gapTop}px;` : ''}display:flex;gap:48px;align-items:center;height:40px">${items
  .map(([mark, label]) => `<div style="display:flex;align-items:center;gap:14px">${mark}${mono(label, LEG, { color: G.muted })}</div>`)
  .join('')}</div>`
/** The A/B key, the same on every slide: at the foot of the evidence, just above the close, at the
 *  component floor (32px, about 11px on a phone) with a 40px badge, so the conditions read as a
 *  footnote everywhere and the key never moves between slides. */
const keyBlock = (gapTop = 20) => `<div style="margin-top:${gapTop}px;display:flex;flex-direction:column;gap:10px">${CONF.map(
  (c) => `<div style="display:flex;align-items:center;gap:16px;height:40px">
      <div style="width:40px;height:40px;border-radius:50%;box-sizing:border-box;border:3px solid ${G.fg};color:${G.fg};font-family:${ARCH};font-size:26px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${c.letter}</div>
      ${mono(c.label, 32, { color: G.muted })}
    </div>`,
).join('')}</div>`
/** The close: the brand's 112px author lockup left, a short button right, no rule. */
// On a board the avatar is the canvas's asset, cropped and ringed by CSS. In the printed pages it is
// the baked bitmap (brand/assets/avatar-ring-*.png: the circle and its ring, with alpha, at 4×),
// because a PDF rasteriser draws a CSS clip path without anti-aliasing and the ring came out rough
// on LinkedIn's preview. The ring is paper on navy and navy on paper, like the CSS one.
const close = (avatarUrl, cta, ctaLabel, arrow = 'right') => `<div style="position:absolute;left:${PAD}px;right:${PAD}px;bottom:${PAD}px;display:flex;align-items:center;justify-content:space-between;gap:32px">
    <div style="display:flex;align-items:center;gap:20px;flex-shrink:0">
      ${avatarUrl === 'baked'
        ? `<img src="${AVATAR_BAKED[G.bg === C.navy ? 'onNavy' : 'onPaper']}" alt="Grace Henriquez" width="112" height="112" style="display:block;width:112px;height:112px;flex-shrink:0">`
        : `<img src="${avatarUrl}" alt="Grace Henriquez" style="width:112px;height:112px;border-radius:50%;object-fit:cover;border:4px solid ${G.fg};box-sizing:border-box;flex-shrink:0">`}
      ${arch('Grace Henriquez', 44, { weight: 700, track: '-0.02em' })}
    </div>
    ${cta ? `<a href="#next" aria-label="${ctaLabel}" style="display:inline-flex;align-items:center;gap:16px;height:64px;padding:0 24px 0 32px;border-radius:32px;background:${G.hero};color:${G.bg};text-decoration:none;flex-shrink:0">
      ${arch(cta, 36, { weight: 700, lh: 1, track: '-0.015em', color: G.bg, extra: 'white-space:nowrap' })}
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><path d="${arrow === 'down' ? 'M16 4v22M7 18l9 9 9-9' : 'M4 16h22M18 7l9 9-9 9'}" fill="none" stroke="${G.bg}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>` : ''}
  </div>`

function page1(avatarUrl) {
  // Three groups, separated by white space, tight inside: the statement (headline, subtitle),
  // the evidence (A/B key, chart, model legend), the close (author left, a two-word swipe button
  // right, on one row).
  // The A/B key sits at the foot of the evidence on every slide (see keyBlock), so here the chart
  // follows the subtitle directly and takes the room the key used to hold at the top.
  // The close has no rule: white space (62px) separates it. The author lockup is the brand's
  // 112px one (37px on a phone). Budget inside the 80px safe zone (1190px):
  // 176+20+53 · 48 · chart+56+40+20+90 · 62 · 112 → chart 513px.
  const CHART_H = 513
  const seriesMark = (s) => `<svg width="56" height="14" viewBox="0 0 56 14" aria-hidden="true"><line x1="0" y1="7" x2="56" y2="7" stroke="${s.line}" stroke-width="7" stroke-linecap="round"/><circle cx="28" cy="7" r="7" fill="${s.line}"/></svg>`

  return `<div style="position:relative;width:${W}px;height:${H}px;box-sizing:border-box;padding:${PAD}px;background:${G.bg};color:${G.fg};display:flex;flex-direction:column;overflow:hidden">
  ${arch('One sentence per design token.', 88, { stretch: 94, extra: 'text-wrap:balance' })}
  ${mono('33 to 42 right answers out of 44.', 44, { weight: 500, extra: 'margin-top:20px;font-variant-numeric:tabular-nums;white-space:nowrap' })}
  <div style="margin-top:48px">${slopeChart({ height: CHART_H })}</div>
  ${legendRow(SERIES.map((s) => [seriesMark(s), s.name]), 56)}
  ${keyBlock()}
  ${close(avatarUrl, 'The catch', 'The catch: swipe to slide 2')}
</div>`
}

/* ── Slide 2: confidence ────────────────────────────────────────────── */
// Both models counted together: 88 answers per condition. A mistake is "doubted" when the model
// rated it 1 (guess) or 2 (fairly sure); "sure" is a 3. Counts verified against the blind choice test.
const CONF = [
  { letter: 'A', label: 'Names and values only', mistakes: 16, doubted: 11, sure: 59, n: 88 },
  { letter: 'B', label: 'One sentence per role', mistakes: 3, doubted: 0, sure: 84, n: 88 },
]

function page2(avatarUrl, { variant = 'count' } = {}) {
  // Three variants under review. The A/B key sits under the subtitle, as on slide 1, so every
  // row below needs only its badge. All of them open with the share of answers rated sure.
  //   count  the doubted mistakes as one big number per condition.
  //   bars   part-to-whole bars, the horizontal analogue of a pie: one bar per condition, its
  //          length the number of mistakes (16 and 3 on one scale), split into the doubted part
  //          and the sure part. Reads both facts at once: fewer mistakes, and none of them doubted.
  //   share  the same split with every bar at full width (a 100% stacked bar): the proportion
  //          only, which makes B a solid block but hides that B is only 3.
  // In every variant magenta means "sure" (a 3), an outlined segment means "doubted" (a 1 or 2),
  // and the sure answers above use the same two marks, so one legend covers the whole slide.
  const badge = (letter, size = 48) =>
    `<div style="width:${size}px;height:${size}px;border-radius:50%;box-sizing:border-box;border:3px solid ${G.fg};color:${G.fg};font-family:${ARCH};font-size:${Math.round(size * 0.67)}px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${letter}</div>`
  const BAR_W = 660, BAR_H = 60, SEG_GAP = 4, LABEL = 40 // in-bar labels one step above the floor

  // A stacked bar: segments of {n, sure, label}, on a scale of `max` units across BAR_W.
  // A segment is labelled inside when the label fits, after the bar when the bar is short, and
  // otherwise the row's total carries it.
  // Two palettes. 'alarm' is the mistakes section: magenta for sure, an outline for doubted, the
  // two marks the legend names. 'neutral' is the sure-answers count: slate-light for sure, a dark
  // track for the rest, so nothing there borrows the legend's marks.
  const stacked = (segments, max, palette = 'alarm') => {
    const drawn = segments.filter((seg) => seg.n > 0) // an empty segment takes no gap either
    const unit = (BAR_W - SEG_GAP * (drawn.length - 1)) / max
    let x = 0
    const parts = drawn
      .map((seg) => {
        const w = seg.n * unit
        const label = `${seg.n} ${seg.sure ? 'sure' : 'doubted'}`
        const fits = label.length * LABEL * 0.6 + 32 <= w
        const rect = seg.sure
          ? `<rect x="${x}" y="0" width="${w}" height="${BAR_H}" rx="6" fill="${palette === 'alarm' ? G.hero : G.muted}"/>`
          : palette === 'alarm'
            ? `<rect x="${x + 1.5}" y="1.5" width="${w - 3}" height="${BAR_H - 3}" rx="6" fill="none" stroke="${G.muted}" stroke-width="3"/>`
            : `<rect x="${x}" y="0" width="${w}" height="${BAR_H}" rx="6" fill="${G.grid}"/>`
        const after = BAR_W - (x + w) // room to the right of this segment, when the bar is short
        const text = fits && (seg.sure || palette === 'alarm')
          ? `<text x="${x + 18}" y="${BAR_H / 2 + 14}" font-family="${MONO}" font-size="${LABEL}" font-weight="500" fill="${seg.sure ? G.bg : G.muted}">${label}</text>`
          : after >= label.length * LABEL * 0.6 + 16
            ? `<text x="${x + w + 16}" y="${BAR_H / 2 + 14}" font-family="${MONO}" font-size="${LABEL}" font-weight="500" fill="${G.muted}">${label}</text>`
            : ''
        x += w + SEG_GAP
        return rect + text
      })
    return `<svg width="${BAR_W}" height="${BAR_H}" viewBox="0 0 ${BAR_W} ${BAR_H}" aria-hidden="true" style="display:block;flex-shrink:0">${parts.join('')}</svg>`
  }
  // The total at the right is set like slide 1's end values: Archivo, one level above the labels.
  const row = (letter, segments, max, total, aria, palette) => `<div style="display:flex;align-items:center;gap:16px;height:${BAR_H}px" role="img" aria-label="${aria}">
      ${badge(letter, 36)}${stacked(segments, max, palette)}
      ${arch(total, 48, { weight: 700, track: '-0.02em', extra: 'font-variant-numeric:tabular-nums;white-space:nowrap' })}
    </div>`

  // Sure answers: sure | the rest of all 88, both conditions on the 88 scale, in the neutral
  // palette. The segment carries the count; the right column shows only the total.
  const sureRows = CONF.map((c) =>
    row(c.letter, [{ n: c.sure, sure: true }, { n: c.n - c.sure, sure: false }], c.n, `${c.n}`, `${c.letter}: ${c.sure} of ${c.n} answers rated sure`, 'neutral'),
  ).join('')

  // Mistakes: doubted | sure. 'bars' scales both to the larger count; 'share' fills each bar.
  // As above, the segments carry the counts and the right column shows only the total.
  const maxMistakes = Math.max(...CONF.map((c) => c.mistakes))
  const mistakeRows = CONF.map((c) =>
    row(
      c.letter,
      [{ n: c.doubted, sure: false }, { n: c.mistakes - c.doubted, sure: true }],
      variant === 'share' ? c.mistakes : maxMistakes,
      `${c.mistakes}`,
      `${c.letter}: ${c.doubted} of ${c.mistakes} mistakes flagged with doubt, ${c.mistakes - c.doubted} made with full confidence`,
    ),
  ).join('')
  const countRows = CONF.map((c) => `<div role="img" aria-label="${c.letter}: ${c.doubted} of ${c.mistakes} mistakes flagged with doubt" style="display:flex;align-items:center;gap:20px;white-space:nowrap">
      ${badge(c.letter)}
      ${arch(`${c.doubted} of ${c.mistakes}`, 72, { weight: 800, track: '-0.02em', lh: 1, extra: 'font-variant-numeric:tabular-nums' })}
      ${mono('mistakes flagged<br>with doubt', 36, { color: G.muted })}
    </div>`).join('')

  const swatch = (sure) => `<div style="width:${SW}px;height:${SW}px;border-radius:2px;box-sizing:border-box;flex-shrink:0;${sure ? `background:${G.hero}` : `border:3px solid ${G.muted}`}"></div>`
  // The legend reads the marks as the mistakes section uses them; the rating scale stays in the post.
  const legend = legendRow([[swatch(false), 'Wrong and doubted'], [swatch(true), 'Wrong and sure']], 56)

  const evidence = variant === 'count'
    ? `${mono('Answers rated sure, both models', 36, { color: G.muted, extra: 'margin-top:48px' })}
  <div style="margin-top:16px;display:flex;flex-direction:column;gap:12px">${sureRows}</div>
  <div style="margin-top:56px;display:flex;flex-direction:column;gap:40px">${countRows}</div>
  ${mono('Rated 1 guess · 2 fairly sure · 3 sure.<br>Doubt is a 1 or a 2.', 36, { color: G.muted, extra: 'margin-top:48px' })}`
    : `${mono('Answers rated sure, both models', 36, { weight: 500, extra: 'margin-top:56px' })}
  <div style="margin-top:20px;display:flex;flex-direction:column;gap:16px">${sureRows}</div>
  ${mono('Mistakes, both models', 36, { weight: 500, extra: 'margin-top:56px' })}
  <div style="margin-top:20px;display:flex;flex-direction:column;gap:16px">${mistakeRows}</div>
  ${legend}`

  return `<div style="position:relative;width:${W}px;height:${H}px;box-sizing:border-box;padding:${PAD}px;background:${G.bg};color:${G.fg};display:flex;flex-direction:column;overflow:hidden">
  ${arch('3 mistakes left. All rated sure.', 88, { stretch: 94, extra: 'font-variant-numeric:tabular-nums;text-wrap:balance' })}
  ${mono('Confidence stopped flagging mistakes.', 44, { weight: 500, extra: 'margin-top:20px;text-wrap:balance' })}
  ${evidence}
  ${keyBlock()}
  ${close(avatarUrl, 'See the mistake', 'See the mistake it was sure about: swipe to slide 3')}
</div>`
}

/* ── Slide 3: the runs ──────────────────────────────────────────────── */
// Conditions A and B, both models: every wrong answer by element (1–44), with its confidence,
// from the blind choice test. Element 42 is the fill of a progress bar: the small model gave it
// the primary button's colour in A (fairly sure) and again in B (sure). Only the B one is pinned.
const RUNS = [
  { letter: 'A', model: 'Haiku 4.5', right: 33, wrong: [[2, 2], [8, 2], [9, 2], [13, 1], [14, 2], [20, 3], [23, 3], [25, 1], [35, 3], [40, 2], [42, 2]] },
  { letter: 'A', model: 'Sonnet 5', right: 39, wrong: [[20, 3], [25, 2], [30, 2], [35, 3], [40, 2]] },
  { letter: 'B', model: 'Haiku 4.5', right: 42, wrong: [[23, 3], [42, 3]], spotlight: 42 },
  { letter: 'B', model: 'Sonnet 5', right: 43, wrong: [[40, 3]] },
]
const ELEMENTS = 44
// The small model's two sure mistakes in B, as the test recorded them: what it picked, and the key.
const PINNED = [
  { el: 42, description: "The fill of a progress bar showing '3 of 5 steps done'.", picked: 'sys.action.primary.bg', expected: 'sys.signal.bg' },
  { el: 23, description: "Grey text 'Updated 2 hours ago' under a card title.", picked: 'sys.text.secondary', expected: 'sys.text.tertiary' },
]

/** The matrix, compressed for a phone: right answers collapse into a structural line (the brand's
 *  slate-mid on paper, slate-light on navy) whose length is their count, wrong answers stay as
 *  single marks in element order, and each row stretches to the column width. Nothing is written
 *  on the runs: the score beside the model name says how many were right; the total of 44 is
 *  said once, in the headline. One header per condition, in the key's style, groups its two
 *  model rows; the pinned element's tag sits above its mark, in the label row's empty right half. */
function runsMatrix({ compact = false } = {}) {
  // Marks are near-square, 2px corners, like the brand's checkbox. Compact: 32px marks with the
  // row pitch tightened to match, to see what a shorter matrix buys the headline.
  const SQ = compact ? 32 : 40, GAP = compact ? 5 : 6, MIN_RUN = 10
  const BIND = compact ? 12 : 16, ROW = compact ? 28 : 36, GROUP = compact ? 48 : 56
  const row = (r) => {
    // Tokens in element order: a run of right answers {n}, or a wrong answer {el, sure}.
    const wrong = new Map(r.wrong)
    const tokens = []
    for (let el = 1; el <= ELEMENTS; el++) {
      if (wrong.has(el)) tokens.push({ el, sure: wrong.get(el) === 3 })
      else if (tokens.length && tokens.at(-1).n) tokens.at(-1).n++
      else tokens.push({ n: 1 })
    }
    const wrongs = r.wrong.length
    const free = COL - wrongs * SQ - (tokens.length - 1) * GAP
    const unit = free / r.right
    let x = 0
    const marks = tokens.map((t) => {
      let out
      if (t.n) {
        const w = Math.max(MIN_RUN, t.n * unit)
        out = `<rect x="${x}" y="${SQ / 2 - 3}" width="${w}" height="6" rx="3" fill="${G.line}"/>`
        x += w + GAP
      } else {
        const spot = t.el === r.spotlight
        const box = t.sure
          ? `<rect x="${x}" y="0" width="${SQ}" height="${SQ}" rx="2" fill="${G.mark}"/>`
          : `<rect x="${x + 1.5}" y="1.5" width="${SQ - 3}" height="${SQ - 3}" rx="2" fill="none" stroke="${G.line}" stroke-width="3"/>`
        const ring = spot ? `<rect x="${x - 7}" y="-7" width="${SQ + 14}" height="${SQ + 14}" rx="4" fill="none" stroke="${G.fg}" stroke-width="3"/>` : ''
        const tag = spot ? `<text x="${x + SQ / 2}" y="-22" text-anchor="middle" font-family="${MONO}" font-size="36" font-weight="500" fill="${G.fg}">${t.el}</text>` : ''
        out = box + ring + tag
        x += SQ + GAP
      }
      return out
    })
    const aria = `${r.model}: ${r.right} of ${ELEMENTS} right. Wrong: ${r.wrong.map(([el, c]) => `element ${el}${c === 3 ? ', sure' : ''}`).join('; ')}.`
    return `<div role="img" aria-label="${aria}">
      ${mono(`<span style="font-weight:500">${r.model}</span><span style="color:${G.muted};margin-left:0.6em">· ${r.right}</span>`, 36, { extra: 'font-variant-numeric:tabular-nums;height:44px;display:flex;align-items:center' })}
      <svg width="${COL}" height="${SQ}" aria-hidden="true" style="display:block;margin-top:${BIND}px;overflow:visible">${marks.join('')}</svg>
    </div>`
  }
  // Inside a row the label binds to its marks at 16px; rows stand 36px apart, so a label is
  // never read as a caption for the marks above it; groups stand 56px apart.
  const group = (c) => `<div style="display:flex;flex-direction:column;gap:24px">
      ${condition(c.letter, c.label)}
      <div style="display:flex;flex-direction:column;gap:${ROW}px">${RUNS.filter((r) => r.letter === c.letter).map(row).join('')}</div>
    </div>`
  return `<div style="display:flex;flex-direction:column;gap:${GROUP}px">${CONF.map(group).join('')}</div>`
}

/** The same runs as a table, for a phone: a condition badge spanning its two model rows, the model,
 *  then the two mistake counts under the legend marks as column heads (the legend above spells
 *  them out and the A/B key names the badges). Right answers are slide 1's and stay out. Rows are
 *  drawn like the brand's list rows: 64px, square corners, rule-paper dividers, mono at the 36px
 *  floor for cells. The pinned row's sure count is ringed in the wrong-and-sure colour. */
function runsTable() {
  const COLS = [72, 528, 160, 160] // condition · model · wrong · wrong and sure (right was slide 1's)
  const cell = (inner, w, align = 'flex-end') =>
    `<div style="width:${w}px;flex-shrink:0;display:flex;align-items:center;justify-content:${align};box-sizing:border-box">${inner}</div>`
  const mark = (kind, size = 28) =>
    kind === 'right'
      ? `<div style="width:${size}px;height:6px;border-radius:3px;background:${G.line}"></div>`
      : kind === 'sure'
        ? `<div style="width:${size}px;height:${size}px;border-radius:2px;background:${G.mark}"></div>`
        : `<div style="width:${size}px;height:${size}px;border-radius:2px;box-sizing:border-box;border:3px solid ${G.line}"></div>`
  const badge = (letter) =>
    `<div style="width:48px;height:48px;border-radius:50%;box-sizing:border-box;border:3px solid ${G.fg};color:${G.fg};font-family:${ARCH};font-size:32px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${letter}</div>`
  const head = `<div style="display:flex;align-items:center;height:56px;border-bottom:2px solid ${G.line}">
      ${cell('', COLS[0] + COLS[1], 'flex-start')}
      ${cell(mark('wrong'), COLS[2], 'center')}
      ${cell(mark('sure'), COLS[3], 'center')}
    </div>`
  const num = (n) => mono(`${n}`, 36, { weight: 500, extra: 'font-variant-numeric:tabular-nums' })
  // The pinned row's sure count is ringed in the wrong-and-sure colour, the shape step on paper.
  const ringed = (inner) => `<div style="padding:2px 14px;border:3px solid ${G.mark};border-radius:4px;display:flex">${inner}</div>`
  const row = (r, last) => {
    const doubted = r.wrong.filter(([, c]) => c < 3).length
    const sure = r.wrong.filter(([, c]) => c === 3).length
    const aria = `${r.letter}, ${r.model}: ${doubted} wrong, ${sure} wrong and sure${r.spotlight ? ', elements 23 and 42' : ''}.`
    return `<div role="row" aria-label="${aria}" style="display:flex;align-items:center;height:64px;${last ? '' : `border-bottom:2px solid ${G.grid}`}">
      ${cell(mono(r.model, 36, { weight: 500 }), COLS[1], 'flex-start')}
      ${cell(num(doubted), COLS[2], 'center')}
      ${cell(r.spotlight ? ringed(num(sure)) : num(sure), COLS[3], 'center')}
    </div>`
  }
  // The badge spans its two rows: one cell beside a two-row block, the divider only between the rows.
  const group = (c) => {
    const rows = RUNS.filter((r) => r.letter === c.letter)
    return `<div role="rowgroup" aria-label="${c.letter}, ${c.label}" style="display:flex;align-items:stretch;border-bottom:2px solid ${G.line}">
      <div style="width:${COLS[0]}px;flex-shrink:0;display:flex;align-items:center;justify-content:flex-start">${badge(c.letter)}</div>
      <div style="display:flex;flex-direction:column;flex-grow:1">${rows.map((r, i) => row(r, i === rows.length - 1)).join('')}</div>
    </div>`
  }
  return `<div role="table" aria-label="Wrong and wrong-and-sure answers per model and condition" style="display:flex;flex-direction:column">${head}${CONF.map(group).join('')}</div>`
}

function page3(avatarUrl, { compact = true, variant = 'matrix' } = {}) {
  // The evidence first, then the callouts, then the legend and the A/B key just above the close; the
  // close takes its usual place later. The callouts wear the ring's colour, so they read as the
  // pinned count opened up; token names sit in the brand's field: white on a rule-paper border.
  // The legend and the A/B key at the component floor, 32px (about 11px on a phone), one step
  // under the 36px body floor, with swatches and badges scaled to match.
  const swatch = (kind) =>
    kind === 'right'
      ? `<div style="width:${SW}px;height:6px;border-radius:3px;background:${G.line};flex-shrink:0"></div>`
      : kind === 'sure'
        ? `<div style="width:${SW}px;height:${SW}px;border-radius:2px;background:${G.mark};flex-shrink:0"></div>`
        : `<div style="width:${SW}px;height:${SW}px;border-radius:2px;box-sizing:border-box;border:3px solid ${G.line};flex-shrink:0"></div>`
  const legend = legendRow([
    ...(variant === 'table' ? [] : [[swatch('right'), 'Right']]),
    [swatch('wrong'), 'Wrong and doubted'],
    [swatch('sure'), 'Wrong and sure'],
  ], 40)
  // The callout is drawn like the brand's components, at twice web scale: 16px web → 32px here,
  // the component floor, for the description, the labels and the token chips.
  const chip = (t) => `<span style="font-family:${MONO};font-size:32px;line-height:1;padding:6px 12px;border:2px solid ${C['rule-paper']};border-radius:4px;background:${C['surface-raised']};color:${C.navy};white-space:nowrap">${t}</span>`
  const field = (label, value) => `<div style="display:flex;align-items:center;gap:20px;height:44px">
      ${mono(label, 32, { color: G.muted, extra: 'width:176px;flex-shrink:0' })}${chip(value)}
    </div>`
  // One callout per sure mistake, picked and expected only: the progress bar first, then the grey
  // text. Their border is the ring on the count they open up: the wrong-and-sure colour.
  const callout = PINNED.map(
    (m) => `<div role="group" aria-label="Element ${m.el}: ${m.description}" style="border:3px solid ${G.mark};border-radius:4px;padding:24px 28px;display:flex;flex-direction:column;gap:12px">
    ${field('Picked', m.picked)}
    ${field('Expected', m.expected)}
  </div>`,
  ).join('')
  const callouts = `<div style="margin-top:40px;display:flex;flex-direction:column;gap:20px">${callout}</div>`
  // The content sits as low as it can, 62px above the close like the other slides, so the room
  // left at the top is the room a headline has.
  return `<div style="position:relative;width:${W}px;height:${H}px;box-sizing:border-box;padding:${PAD}px ${PAD}px ${PAD + 112 + 62}px;background:${G.bg};color:${G.fg};display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden">
  <div id="p3-content">${variant === 'table' ? runsTable() : runsMatrix({ compact })}
  ${callouts}
  ${legend}
  ${variant === 'table' ? keyBlock() : ''}</div>
  ${close(avatarUrl, 'The fix', 'The fix: the next post in the series')}
</div>`
}

/* ── Slide 3, up close: one element, four runs ──────────────────────── */
// Element 42 of the blind choice test, the fill of a progress bar showing "3 of 5 steps done",
// across the four runs. The small model picked the button's token in both conditions; in B it
// rated that answer 3, surer than the large model's right answer at 2. Confidence as recorded:
// 1 guess, 2 fairly sure, 3 sure. The wrong answers wear slide 2's marks (outline: wrong;
// filled: wrong and sure); the right answers wear none.
const CASE = {
  el: 42,
  expected: 'sys.signal.bg',
  runs: [
    { letter: 'A', model: 'Haiku 4.5', picked: 'sys.action.primary.bg', right: false, rated: 2 },
    { letter: 'A', model: 'Sonnet 5', picked: 'sys.signal.bg', right: true, rated: 2 },
    { letter: 'B', model: 'Haiku 4.5', picked: 'sys.action.primary.bg', right: false, rated: 3, hero: true },
    { letter: 'B', model: 'Sonnet 5', picked: 'sys.signal.bg', right: true, rated: 2 },
  ],
}

function page3Case(avatarUrl) {
  // Statement (headline, subtitle naming the element in plain words), the four runs as list rows (badge spanning its two rows, like the runs table), the
  // right token and the rating scale as two quiet lines, then the shared foot and close.
  // Three groups: the statement, the evidence (titled table), the foot (two stacks: marks and
  // conditions left, rating scale right); the close at its usual 62px. Budget inside the safe
  // zone (1190): 176+20+53+12+58 · 48 · 43+12+40+326 · 40 · 4×40+3×8 · 62+112. The widest gap
  // is the one between the statement and the evidence; the foot's own pitch is the tightest.
  const COLS = [72, 248, 100] // condition · model · rating; the token takes the rest
  const ROW = 80 // list rows a step taller than the brand's 64, so the token names sit at the 36px floor
  const cell = (inner, w, align = 'flex-start') =>
    `<div style="width:${w}px;flex-shrink:0;display:flex;align-items:center;justify-content:${align};box-sizing:border-box">${inner}</div>`
  const badge = (letter) =>
    `<div style="width:48px;height:48px;border-radius:50%;box-sizing:border-box;border:3px solid ${G.fg};color:${G.fg};font-family:${ARCH};font-size:32px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${letter}</div>`
  // The token in three weights, so the mistakes lead and nothing else is boxed: a right answer
  // is plain text (the table's title says which token that is), indented to the boxed tokens'
  // text so the column lines up; a wrong one takes a 3px line in the wrong-and-sure colour; a
  // wrong and sure one is filled with it, paper text on magenta-deep, a pairing from the matrix.
  // On a phone the only outline in A is then the alarm. The legend is slide 2's.
  const chip = (r) => {
    const look = r.right
      ? `color:${G.fg};padding:11px 17px`
      : r.rated === 3
        ? `border:3px solid ${G.hero};background:${G.hero};color:${C.paper};padding:8px 14px`
        : `border:3px solid ${G.hero};background:${C['surface-raised']};color:${G.fg};padding:8px 14px`
    return `<span style="font-family:${MONO};font-size:36px;line-height:1;border-radius:4px;white-space:nowrap;${look}">${r.picked}</span>`
  }
  const num = (n) => arch(`${n}`, 48, { weight: 700, track: '-0.02em', extra: 'font-variant-numeric:tabular-nums' })
  const row = (r, last) => `<div role="row" aria-label="${r.letter}, ${r.model}: picked ${r.picked}, ${r.right ? 'right' : 'wrong'}, rated ${r.rated}." style="display:flex;align-items:center;height:${ROW}px;${last ? '' : `border-bottom:2px solid ${G.grid}`}">
      ${cell(mono(r.model, 36, { weight: 500 }), COLS[1])}
      <div style="flex-grow:1;display:flex;align-items:center">${chip(r)}</div>
      ${cell(num(r.rated), COLS[2], 'flex-end')}
    </div>`
  const group = (c, i) => {
    const rows = CASE.runs.filter((r) => r.letter === c.letter)
    return `<div role="rowgroup" aria-label="${c.letter}, ${c.label}" style="display:flex;align-items:stretch;border-top:${i ? 2 : 0}px solid ${G.line}">
      <div style="width:${COLS[0]}px;flex-shrink:0;display:flex;align-items:center">${badge(c.letter)}</div>
      <div style="display:flex;flex-direction:column;flex-grow:1">${rows.map((r, j) => row(r, j === rows.length - 1)).join('')}</div>
    </div>`
  }
  // The title does the legend's work for the right answers: it names the right token, so a plain
  // chip reads as right and only the mistakes carry a colour. Slide 2's section-title style.
  const title = mono(`The right token is ${CASE.expected}`, 36, { weight: 500 })
  // Column heads in the footer's voice: the run (its condition badge and model, the subtitle's
  // "four runs"), what it picked, and how it rated the answer.
  const head = `<div role="row" style="display:flex;align-items:center;height:40px;border-bottom:2px solid ${G.line}">
      ${cell(mono('Run', 32, { color: G.muted }), COLS[0] + COLS[1])}
      <div style="flex-grow:1">${mono('Picked', 32, { color: G.muted })}</div>
      ${cell(mono('Rated', 32, { color: G.muted }), COLS[2], 'flex-end')}
    </div>`
  const table = `${title}<div role="table" aria-label="Element ${CASE.el} across the four runs: what each model picked and how sure it was" style="margin-top:12px;display:flex;flex-direction:column">${head}<div style="border-bottom:2px solid ${G.line}">${CONF.map(group).join('')}</div></div>`
  // The foot as two stacks on one 50px pitch, so the table ends on its bottom rule and every key
  // the table needs sits in one place: left, the marks then the conditions, each on its own row;
  // right, the rating scale under a "Rated" head, the number in the mark's slot in the table's
  // face. Rows are the shared foot's: 40px, 32px muted labels, 40px marks.
  const swatch = (sure) => `<div style="width:${SW}px;height:${SW}px;border-radius:2px;box-sizing:border-box;flex-shrink:0;${sure ? `background:${G.hero}` : `border:3px solid ${G.hero}`}"></div>`
  const badge40 = (letter) => `<div style="width:40px;height:40px;border-radius:50%;box-sizing:border-box;border:3px solid ${G.fg};color:${G.fg};font-family:${ARCH};font-size:26px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${letter}</div>`
  const slot = (inner) => `<div style="width:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${inner}</div>`
  const frow = (mark, label) => `<div style="display:flex;align-items:center;gap:16px;height:40px">${mark}${mono(label, 32, { color: G.muted })}</div>`
  const stack = (rows, extra = '') => `<div style="display:flex;flex-direction:column;gap:8px;${extra}">${rows.join('')}</div>`
  // The element reads as the query the runs answered, in the words the models were given: the
  // subtitle's second line on mist, the brand's ground under light UI, no line. At the 32px
  // component floor, the one size at which the whole phrase fits the column on one line; the
  // field is padded to the table chips' height. The slide's only colour stays on the mistakes.
  const criteria = (t) => `<span style="font-family:${MONO};font-size:32px;line-height:1;background:${C.mist};border-radius:4px;padding:13px 17px;white-space:nowrap">${t}</span>`
  const foot = `<div style="margin-top:40px;display:flex;align-items:flex-start">
    ${stack([
      frow(slot(swatch(false)), 'Wrong and doubted'),
      frow(slot(swatch(true)), 'Wrong and sure'),
      ...CONF.map((c) => frow(badge40(c.letter), c.label)),
    ], 'width:520px;flex-shrink:0')}
    ${stack([
      `<div style="display:flex;align-items:center;height:40px">${mono('Rated', 32, { color: G.muted })}</div>`,
      ...[[1, 'guess'], [2, 'fairly sure'], [3, 'sure']].map(([n, l]) => frow(slot(arch(`${n}`, 32, { weight: 700, track: '-0.02em' })), l)),
    ])}
  </div>`

  return `<div style="position:relative;width:${W}px;height:${H}px;box-sizing:border-box;padding:${PAD}px;background:${G.bg};color:${G.fg};display:flex;flex-direction:column;overflow:hidden">
  ${arch('Wrong, and surer than right.', 88, { stretch: 94, extra: 'text-wrap:balance' })}
  ${mono('One element, four runs:', 44, { weight: 500, extra: 'margin-top:20px;white-space:nowrap' })}
  <div style="margin-top:12px;display:flex">${criteria('the fill of a progress bar, 3 of 5 steps done')}</div>
  <div style="margin-top:48px">${table}</div>
  ${foot}
  ${close(avatarUrl, 'Why', 'Why: swipe to slide 4')}
</div>`
}

/* ── Slide 4: where to look ─────────────────────────────────────────── */
// Typography only, on navy: the action as the headline, the why as the subtitle, the two
// things done about look-alike pairs as a numbered list, the comments as the call to action.
const LOOK = [
  // A non-breaking hyphen keeps “look‑alike” on one line.
  'Each role’s sentence names its look\u2011alike, and a script checks that claim in both themes.',
  'I review every agent pick where a look\u2011alike exists.',
]

function page4(avatarUrl) {
  // Statement (headline, subtitle), the list under a section title in slide 2's style, the call
  // to action in the foot's place, the close with the pill pointing at the comments.
  // Two steps only; the air between the three groups is the slide's design. One colour accent:
  // the pill. The steps' label is muted, a label like slide 3's column heads; the call to action
  // is paper at weight 500, the statement's weight, so it reads as the last line and not as a
  // second button. Budget inside the safe zone (1190):
  // 176+20+158 · 132 · 43+32+144+40+96 · 132 · 43 · 61+112.
  // The badge sits at the middle of its whole item, so a two- or three-line item reads as one
  // block with its number beside it.
  const step = (t, i) => `<div style="display:flex;align-items:center;gap:24px">
      <div style="width:48px;height:48px;border-radius:50%;box-sizing:border-box;border:3px solid ${G.fg};color:${G.fg};font-family:${ARCH};font-size:32px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i + 1}</div>
      ${mono(t, 36, { extra: 'line-height:48px' })}
    </div>`
  return `<div style="position:relative;width:${W}px;height:${H}px;box-sizing:border-box;padding:${PAD}px;background:${G.bg};color:${G.fg};display:flex;flex-direction:column;overflow:hidden">
  ${arch('Look where two tokens share a value.', 88, { stretch: 94, extra: 'text-wrap:balance' })}
  ${mono('Why: the progress bar and the button are the same cobalt in both themes.', 44, { weight: 500, extra: 'margin-top:20px;text-wrap:balance' })}
  ${mono('What I’m doing:', 36, { color: G.muted, extra: 'margin-top:132px;white-space:nowrap' })}
  <div style="margin-top:32px;display:flex;flex-direction:column;gap:40px">${LOOK.map(step).join('')}</div>
  ${mono('Full test and article in the comments.', 36, { weight: 500, extra: 'margin-top:132px;white-space:nowrap' })}
  ${close(avatarUrl, 'Comments', 'The full test and the article are in the comments', 'down')}
</div>`
}

/* ── Output ──────────────────────────────────────────────────────────── */
const TITLE = 'One sentence per design token: a small test'
const AVATAR_BAKED = {
  onNavy: `data:image/png;base64,${readFileSync(resolve(ASSETS, 'avatar-ring-paper.png')).toString('base64')}`,
  onPaper: `data:image/png;base64,${readFileSync(resolve(ASSETS, 'avatar-ring-navy.png')).toString('base64')}`,
}
const avatarData = 'baked' // the printed pages take the baked avatar, see close()

// Boards for the posts canvas (canvas asset id for the avatar, like every post board): the four
// slides as they stand, slide 2 in its share variant, slide 3 the up-close case on paper.
out('Carousel-Token-Test-01', page({ title: 'Carousel slide 1 of 4: the result', w: W, h: H, body: page1(AVATAR.posts), bg: G.bg, fg: G.fg }))
out('Carousel-Token-Test-02', page({ title: 'Carousel slide 2 of 4: the confidence', w: W, h: H, body: page2(AVATAR.posts, { variant: 'share' }), bg: G.bg, fg: G.fg }))
withTheme('light', () => out('Carousel-Token-Test-03', page({ title: 'Carousel slide 3 of 4: the mistake, up close', w: W, h: H, body: page3Case(AVATAR.posts), bg: G.bg, fg: G.fg })))
out('Carousel-Token-Test-04', page({ title: 'Carousel slide 4 of 4: where to look', w: W, h: H, body: page4(AVATAR.posts), bg: G.bg, fg: G.fg }))

// Standalone page for the PDF export: inline avatar, @page at the artwork size, PDF title from <title>.
export const standalone = (title, inner) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<link rel="stylesheet" href="${FONTS}">
<style>
@page{size:${W}px ${H}px;margin:0}
html,body{margin:0;padding:0;background:${G.bg}}
body{width:${W}px;font-family:${MONO};color:${G.fg};-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:${W}px;height:${H}px;page-break-after:always;break-after:page}
.page:last-child{page-break-after:auto;break-after:auto}
</style>
</head>
<body>
${inner}
</body>
</html>
`
out('carousel-token-test-p1', standalone(TITLE, `<div class="page">${page1(avatarData)}</div>`), '.html')
out('carousel-token-test-p2', standalone(TITLE, `<div class="page">${page2(avatarData)}</div>`), '.html')
out('carousel-token-test-p2-bars', standalone(TITLE, `<div class="page">${page2(avatarData, { variant: 'bars' })}</div>`), '.html')
out('carousel-token-test-p2-share', standalone(TITLE, `<div class="page">${page2(avatarData, { variant: 'share' })}</div>`), '.html')
out('carousel-token-test-p3', withTheme('light', () => standalone(TITLE, `<div class="page">${page3(avatarData)}</div>`)), '.html')
out('carousel-token-test-p3-table', withTheme('light', () => standalone(TITLE, `<div class="page">${page3(avatarData, { variant: 'table' })}</div>`)), '.html')
out('carousel-token-test-p3-case', withTheme('light', () => standalone(TITLE, `<div class="page">${page3Case(avatarData)}</div>`)), '.html')
out('carousel-token-test-p4', standalone(TITLE, `<div class="page">${page4(avatarData)}</div>`), '.html')
// The combined document: every slide in one file, printed to the carousel PDF (one page per slide,
// all 1080×1350, fonts embedded by the print). Slide 3 is on paper, so it is drawn in its theme.
out(
  'carousel-token-test',
  standalone(
    TITLE,
    [
      `<div class="page">${page1(avatarData)}</div>`,
      `<div class="page">${page2(avatarData, { variant: 'share' })}</div>`,
      withTheme('light', () => `<div class="page">${page3Case(avatarData)}</div>`),
      `<div class="page">${page4(avatarData)}</div>`,
    ].join(''),
  ),
  '.html',
)
