import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { C, ARCH, MONO, FONTS, ASSETS, page, out, AVATAR } from './lib.mjs'

/**
 * LinkedIn carousel "One sentence per design token: a small test", 1080×1350 pages.
 * Four slides: 1 the result, 2 the confidence, 3 the mistake up close, 4 where to look. Each is
 * a function here; all four print as one PDF.
 *
 * Each page is written twice: a `.dc.html` board for the rolling posts canvas (avatar from the
 * canvas's asset store, like every post board) and a standalone `.html` for printing to the
 * carousel PDF, where the round marks and the avatar are baked bitmaps (see Round shapes).
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
// Two grounds. Slides 1, 2 and 4 are navy with paper type, the strongest pairing and a card that
// keeps its edge on the white feed. Slide 3 turns to paper: the "look closely" moment between the
// dark slides. Every role below is solved for its ground.
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

/* ── Round shapes ──────────────────────────────────────────────────── */
// LinkedIn's document preview rasterises vector curves roughly: CSS rings, SVG circles and polygons
// all came out ragged, and a clipped image rough. Bitmaps it scales cleanly. So the printed pages
// (PRINT on) place PNGs with alpha, baked at 4× from the same CSS (brand/assets/print, and the
// avatar in brand/assets): the ring badges, the chart's dots, the pill's two ends, the avatar.
// Boards on the canvas keep the CSS, which a browser draws cleanly.
let PRINT = false
const withPrint = (fn) => {
  PRINT = true
  try { return fn() } finally { PRINT = false }
}
const bakedCache = new Map()
const baked = (name) => {
  if (!bakedCache.has(name)) bakedCache.set(name, `data:image/png;base64,${readFileSync(resolve(ASSETS, 'print', `${name}.png`)).toString('base64')}`)
  return bakedCache.get(name)
}
const inkName = () => (G.fg === C.paper ? 'paper' : 'navy')
/** The ring badge (A, B, 1, 2): a CSS ring with the letter set in Archivo at two thirds of the size. */
const ring = (letter, size = 48, { font = Math.round(size * 0.67), stroke = 3, extra = '' } = {}) =>
  PRINT && ['A', 'B', '1', '2'].includes(String(letter))
    ? `<img src="${baked(`ring-${letter}-${inkName()}`)}" alt="${letter}" width="${size}" height="${size}" style="display:block;width:${size}px;height:${size}px;flex-shrink:0;${extra}">`
    : `<div style="width:${size}px;height:${size}px;border-radius:50%;box-sizing:border-box;border:${stroke}px solid ${G.fg};color:${G.fg};font-family:${ARCH};font-size:${font}px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;${extra}">${letter}</div>`
/** A chart dot as a CSS box, positioned over the SVG at its centre; a bitmap when printing. */
const cssDot = (cx, cy, r, { fill, stroke = '', width = 0 } = {}) => {
  const d = 2 * r + width
  const pos = `position:absolute;left:${(cx - d / 2).toFixed(1)}px;top:${(cy - d / 2).toFixed(1)}px;width:${d}px;height:${d}px;`
  const hue = fill === C['sky-light'] ? 'sky' : fill === C['sand-mid'] ? 'sand' : ''
  return PRINT && hue
    ? `<img src="${baked(`dot-${hue}${stroke ? '-ringed' : ''}`)}" alt="" width="${d}" height="${d}" style="${pos}display:block">`
    : `<div style="${pos}border-radius:50%;box-sizing:border-box;background:${fill};${stroke ? `border:${width}px solid ${stroke};` : ''}"></div>`
}

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
    return ring(letter, 48, { extra: `position:absolute;left:${x - 24}px;top:${cy - 24}px` })
  }

  // Lines in the SVG; the dots are CSS boxes placed over it after the labels (nothing overlaps).
  const lines = SERIES.map(
    (s) =>
      `<line x1="${xA}" y1="${y(s.a)}" x2="${xB}" y2="${y(s.b)}" stroke="${s.line}" stroke-width="7"/>`,
  ).join('')
  const dots = SERIES.map(
    (s) =>
      `${cssDot(xA, y(s.a), 11, { fill: s.line, stroke: G.bg, width: 5 })}
       ${cssDot(xB, y(s.b), 11, { fill: s.line, stroke: G.bg, width: 5 })}`,
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
    `<line x1="${xB + 14}" y1="${y(s.b) + (yy - y(s.b)) / 3}" x2="${xB + 30}" y2="${yy}" stroke="${s.line}" stroke-width="3"/>`
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
  // The SVG carries lines and text; the dots and the column badges are CSS boxes over it (see
  // Round shapes above). Nothing they cover is text: the labels start clear of the dots.
  return `<div style="position:relative;width:${COL}px;height:${height}px">
  <svg width="${COL}" height="${height}" viewBox="0 0 ${COL} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" style="display:block;overflow:visible">
    ${grid}${ceiling}${lines}${ends}${deltas}
  </svg>
  ${dots}
  ${header(xA, 'A')}
  ${header(xB, 'B')}
  </div>`
}

/* ── Pieces shared by every slide ──────────────────────────────────── */
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
      ${ring(c.letter, 40, { font: 26 })}
      ${mono(c.label, 32, { color: G.muted })}
    </div>`,
).join('')}</div>`
/** The close: the brand's 112px author lockup left, a short button right, no rule. */
// On a board the avatar is the canvas's asset, cropped and ringed by CSS. In the printed pages it is
// the baked bitmap (brand/assets/avatar-ring-*.png: the circle and its ring, with alpha, at 4×),
// because a PDF rasteriser draws a CSS clip path without anti-aliasing and the ring came out rough
// on LinkedIn's preview. The ring is paper on navy and navy on paper, like the CSS one.
/** The pill: a CSS stadium; when printing, its two ends are baked half discs around a flat middle. */
const pill = (cta, ctaLabel, arrow) => {
  const inner = `${arch(cta, 36, { weight: 700, lh: 1, track: '-0.015em', color: G.bg, extra: 'white-space:nowrap' })}
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><path d="${arrow === 'down' ? 'M16 4v22M7 18l9 9 9-9' : 'M4 16h22M18 7l9 9-9 9'}" fill="none" stroke="${G.bg}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  if (!PRINT)
    return `<a href="#next" aria-label="${ctaLabel}" style="display:inline-flex;align-items:center;gap:16px;height:64px;padding:0 24px 0 32px;border-radius:32px;background:${G.hero};color:${G.bg};text-decoration:none;flex-shrink:0">
      ${inner}
    </a>`
  const hue = G.hero === C['magenta-light'] ? 'magenta-light' : 'magenta-deep'
  const end = (side) => `<img src="${baked(`pill-${side}-${hue}`)}" alt="" width="32" height="64" style="display:block;width:32px;height:64px;flex-shrink:0">`
  // The arrow keeps its 24px from the right edge: the middle overlaps the right end by 8px.
  return `<a href="#next" aria-label="${ctaLabel}" style="display:inline-flex;align-items:stretch;height:64px;color:${G.bg};text-decoration:none;flex-shrink:0">
      ${end('left')}
      <span style="position:relative;z-index:1;display:flex;align-items:center;gap:16px;background:${G.hero};color:${G.bg};margin-right:-8px;padding-right:8px">${inner}</span>
      ${end('right')}
    </a>`
}
const close = (avatarUrl, cta, ctaLabel, arrow = 'right') => `<div style="position:absolute;left:${PAD}px;right:${PAD}px;bottom:${PAD}px;display:flex;align-items:center;justify-content:space-between;gap:32px">
    <div style="display:flex;align-items:center;gap:20px;flex-shrink:0">
      ${PRINT
        ? `<img src="${AVATAR_BAKED[G.bg === C.navy ? 'onNavy' : 'onPaper']}" alt="Grace Henriquez" width="112" height="112" style="display:block;width:112px;height:112px;flex-shrink:0">`
        : `<img src="${avatarUrl}" alt="Grace Henriquez" style="width:112px;height:112px;border-radius:50%;object-fit:cover;border:4px solid ${G.fg};box-sizing:border-box;flex-shrink:0">`}
      ${arch('Grace Henriquez', 44, { weight: 700, track: '-0.02em' })}
    </div>
    ${cta ? pill(cta, ctaLabel, arrow) : ''}
  </div>`

/* ── Slide 1: the result ────────────────────────────────────────────── */
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
  const seriesMark = (s) => `<div style="position:relative;width:56px;height:14px;flex-shrink:0"><svg width="56" height="14" viewBox="0 0 56 14" aria-hidden="true" style="display:block"><line x1="0" y1="7" x2="56" y2="7" stroke="${s.line}" stroke-width="7"/></svg>${cssDot(28, 7, 7, { fill: s.line })}</div>`

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

function page2(avatarUrl) {
  // The share of answers rated sure, then the mistakes split into doubted and sure, both as 100%
  // stacked bars (one bar per condition, every bar at full width, so the proportion reads at a
  // glance; the total at the right says how many). Magenta means "sure" (a 3), an outlined
  // segment means "doubted" (a 1 or 2); the sure-answers bars above use neutral marks, so the
  // legend's two marks mean one thing on the slide.
  const badge = (letter, size = 48) =>
    ring(letter, size)
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

  // Mistakes: doubted | sure, each bar filled to its own total. As above, the segments carry the
  // counts and the right column shows only the total.
  const mistakeRows = CONF.map((c) =>
    row(
      c.letter,
      [{ n: c.doubted, sure: false }, { n: c.mistakes - c.doubted, sure: true }],
      c.mistakes,
      `${c.mistakes}`,
      `${c.letter}: ${c.doubted} of ${c.mistakes} mistakes flagged with doubt, ${c.mistakes - c.doubted} made with full confidence`,
    ),
  ).join('')
  const swatch = (sure) => `<div style="width:${SW}px;height:${SW}px;border-radius:2px;box-sizing:border-box;flex-shrink:0;${sure ? `background:${G.hero}` : `border:3px solid ${G.muted}`}"></div>`
  // The legend reads the marks as the mistakes section uses them; the rating scale stays in the post.
  const legend = legendRow([[swatch(false), 'Wrong and doubted'], [swatch(true), 'Wrong and sure']], 56)

  const evidence = `${mono('Answers rated sure, both models', 36, { weight: 500, extra: 'margin-top:56px' })}
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

/* ── Slide 3: the mistake, up close ─────────────────────────────────── */
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

function page3(avatarUrl) {
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
    `${ring(letter, 48)}`
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
  const badge40 = (letter) => `${ring(letter, 40, { font: 26 })}`
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
      ${ring(i + 1, 48)}
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
const avatarData = 'print' // unused: under withPrint, close() places the baked avatar

// Boards for the posts canvas (canvas asset id for the avatar, like every post board).
out('Carousel-Token-Test-01', page({ title: 'Carousel slide 1 of 4: the result', w: W, h: H, body: page1(AVATAR.posts), bg: G.bg, fg: G.fg }))
out('Carousel-Token-Test-02', page({ title: 'Carousel slide 2 of 4: the confidence', w: W, h: H, body: page2(AVATAR.posts), bg: G.bg, fg: G.fg }))
withTheme('light', () => out('Carousel-Token-Test-03', page({ title: 'Carousel slide 3 of 4: the mistake, up close', w: W, h: H, body: page3(AVATAR.posts), bg: G.bg, fg: G.fg })))
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
// One standalone page per slide, for proofs of a single slide.
withPrint(() => out('carousel-token-test-p1', standalone(TITLE, `<div class="page">${page1(avatarData)}</div>`), '.html'))
withPrint(() => out('carousel-token-test-p2', standalone(TITLE, `<div class="page">${page2(avatarData)}</div>`), '.html'))
withPrint(() => out('carousel-token-test-p3', withTheme('light', () => standalone(TITLE, `<div class="page">${page3(avatarData)}</div>`)), '.html'))
withPrint(() => out('carousel-token-test-p4', standalone(TITLE, `<div class="page">${page4(avatarData)}</div>`), '.html'))
// The combined document: every slide in one file, printed to the carousel PDF (one page per slide,
// all 1080×1350, fonts embedded by the print). Slide 3 is on paper, so it is drawn in its theme.
withPrint(() => out(
  'carousel-token-test',
  standalone(
    TITLE,
    [
      `<div class="page">${page1(avatarData)}</div>`,
      `<div class="page">${page2(avatarData)}</div>`,
      withTheme('light', () => `<div class="page">${page3(avatarData)}</div>`),
      `<div class="page">${page4(avatarData)}</div>`,
    ].join(''),
  ),
  '.html',
))
