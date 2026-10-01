import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { C, ARCH, MONO, FONTS, ASSETS, page, out, AVATAR } from './lib.mjs'

/**
 * LinkedIn carousel "One sentence per design token: a small test", 1080×1350 pages.
 * Page 1 (the result) is here; page 2 joins it later and both export as one PDF.
 *
 * Each page is written twice: a `.dc.html` board for the rolling posts canvas (avatar from the
 * canvas's asset store, like every post board) and a standalone `.html` with the avatar inlined,
 * which is what gets printed to the carousel PDF. Same markup in both.
 *
 * Geometry: 80px padding keeps everything inside LinkedIn's 80px counter/arrow zone and well
 * inside the 48px safe margin. Chart series are the palette's mid steps (sky < sand in luminance,
 * so the two lines differ in lightness as well as hue); their deep steps label the deltas.
 */
console.log('carousel boards →')

const PAD = 80
const W = 1080, H = 1350
const COL = W - 2 * PAD // 920

/* ── Data (blind choice test, conditions A and B only) ─────────────── */
const SERIES = [
  { key: 'small', name: 'Small model', model: 'Claude Haiku 4.5', a: 33, b: 42, line: C['sky-mid'], ink: C['sky-deep'] },
  { key: 'mid', name: 'Mid-sized model', model: 'Claude Sonnet 5', a: 39, b: 43, line: C['sand-mid'], ink: C['sand-deep'] },
]
const Y_MIN = 30, Y_MAX = 44

/* ── Type helpers (post scale, brand/typography.json) ──────────────── */
const arch = (t, size, { weight = 800, lh = 1, track = '-0.025em', color = C.navy, stretch = 100, extra = '' } = {}) =>
  `<div style="font-family:${ARCH};font-size:${size}px;font-weight:${weight};line-height:${lh};letter-spacing:${track};font-stretch:${stretch}%;color:${color};${extra}">${t}</div>`
const mono = (t, size, { weight = 400, lh = 1.2, color = C.navy, extra = '' } = {}) =>
  `<div style="font-family:${MONO};font-size:${size}px;font-weight:${weight};line-height:${lh};color:${color};${extra}">${t}</div>`

/* ── Slope chart: SVG in page px, no scaling, so every size is literal ─ */
function slopeChart({ height }) {
  const xA = 300, xB = 620 // columns; the short run keeps the slopes steep
  const top = 50 // y of the ceiling (All 44)
  const headerH = 130 // badge + two label lines under the baseline
  const base = height - headerH - 30
  const k = (base - top) / (Y_MAX - Y_MIN)
  const y = (v) => top + (Y_MAX - v) * k

  const knock = `paint-order:stroke;stroke:${C.paper};stroke-width:14px;stroke-linejoin:round`
  const ticks = [30, 35, 40]
  const grid = ticks
    .map(
      (v) =>
        `<line x1="70" y1="${y(v)}" x2="920" y2="${y(v)}" stroke="${v === Y_MIN ? C['slate-mid'] : C['rule-paper']}" stroke-width="2"/>
         <text x="50" y="${y(v) + 12}" text-anchor="end" font-family="${MONO}" font-size="36" fill="${C['slate-deep']}">${v}</text>`,
    )
    .join('')
  const ceiling = `<line x1="70" y1="${top}" x2="920" y2="${top}" stroke="${C['slate-mid']}" stroke-width="3" stroke-dasharray="12 12"/>
    <text x="920" y="${top - 16}" text-anchor="end" font-family="${MONO}" font-size="36" fill="${C['slate-deep']}">All 44</text>`

  const header = (x, letter, l1, l2) => {
    const by = base + 50
    return `<circle cx="${x}" cy="${by}" r="24" fill="${C.navy}"/>
      <text x="${x}" y="${by + 13}" text-anchor="middle" font-family="${ARCH}" font-size="34" font-weight="800" fill="${C.paper}">${letter}</text>
      <text x="${x}" y="${by + 70}" text-anchor="middle" font-family="${MONO}" font-size="36" font-weight="500" fill="${C.navy}">${l1}</text>
      <text x="${x}" y="${by + 112}" text-anchor="middle" font-family="${MONO}" font-size="36" font-weight="500" fill="${C.navy}">${l2}</text>`
  }

  // Lines + dots, drawn before the labels so the labels knock them out where they must.
  const lines = SERIES.map(
    (s) =>
      `<line x1="${xA}" y1="${y(s.a)}" x2="${xB}" y2="${y(s.b)}" stroke="${s.line}" stroke-width="7" stroke-linecap="round"/>`,
  ).join('')
  const dots = SERIES.map(
    (s) =>
      `<circle cx="${xA}" cy="${y(s.a)}" r="11" fill="${s.line}" stroke="${C.paper}" stroke-width="5"/>
       <circle cx="${xB}" cy="${y(s.b)}" r="11" fill="${s.line}" stroke="${C.paper}" stroke-width="5"/>`,
  ).join('')

  // End values: A values sit left of their dots; B values are 1 apart, so the higher one
  // goes up-right and the lower one down-right, each tied to its dot by a short leader.
  const [small, mid] = SERIES
  const endVal = (x, yy, v, anchor) =>
    `<text x="${x}" y="${yy + 17}" text-anchor="${anchor}" font-family="${ARCH}" font-size="48" font-weight="700" letter-spacing="-0.02em" fill="${C.navy}" style="${knock}">${v}</text>`
  const leader = (s, dy) =>
    `<line x1="${xB + 14}" y1="${y(s.b) + dy / 3}" x2="${xB + 30}" y2="${y(s.b) + dy}" stroke="${s.line}" stroke-width="3" stroke-linecap="round"/>`
  const ends = `
    ${endVal(xA - 30, y(small.a), small.a, 'end')}
    ${endVal(xA - 30, y(mid.a), mid.a, 'end')}
    ${leader(mid, -20)}${endVal(xB + 40, y(mid.b) - 20, mid.b, 'start')}
    ${leader(small, 20)}${endVal(xB + 40, y(small.b) + 20, small.b, 'start')}`

  // Deltas: the second element of the hierarchy. Each sits on its own line's side, in the
  // hue's deep step (text-safe on paper), so colour supports what position already says.
  const at = (s, x) => y(s.a) + ((x - xA) / (xB - xA)) * (y(s.b) - y(s.a))
  const deltas = `
    <text x="510" y="${at(small, 510) + 88}" text-anchor="middle" font-family="${ARCH}" font-size="60" font-weight="800" letter-spacing="-0.02em" fill="${small.ink}">+${small.b - small.a}</text>
    <text x="362" y="${at(mid, 362) - 36}" text-anchor="middle" font-family="${ARCH}" font-size="60" font-weight="800" letter-spacing="-0.02em" fill="${mid.ink}">+${mid.b - mid.a}</text>`

  const label = `Slope chart. Small model: ${small.a} right answers with names and values only, ${small.b} with one sentence per role. Mid-sized model: ${mid.a} to ${mid.b}. Ceiling at all 44.`
  return `<svg width="${COL}" height="${height}" viewBox="0 0 ${COL} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" style="display:block;overflow:visible">
    ${grid}${ceiling}${lines}${dots}${ends}${deltas}
    ${header(xA, 'A', 'Names and', 'values only')}
    ${header(xB, 'B', 'One sentence', 'per role')}
  </svg>`
}

/* ── Page 1: the result ─────────────────────────────────────────────── */
function page1(avatarUrl) {
  const CHART_H = 496
  const legendItem = (s) => `<div style="display:flex;align-items:center;gap:20px;height:42px">
      <svg width="56" height="14" viewBox="0 0 56 14" aria-hidden="true"><line x1="0" y1="7" x2="56" y2="7" stroke="${s.line}" stroke-width="7" stroke-linecap="round"/><circle cx="28" cy="7" r="7" fill="${s.line}"/></svg>
      ${mono(`<span style="font-weight:500">${s.name}</span><span style="color:${C['slate-deep']}"> · ${s.model}</span>`, 36)}
    </div>`

  return `<div style="position:relative;width:${W}px;height:${H}px;box-sizing:border-box;padding:${PAD}px;background:${C.paper};color:${C.navy};display:flex;flex-direction:column;overflow:hidden">
  ${arch('One sentence per design token. From 33 to 42 right answers out of 44.', 72, { stretch: 94, extra: 'font-variant-numeric:tabular-nums;text-wrap:balance' })}
  ${arch(
    'Two AI models picked a design token for 44 screen elements, first from names and values only, then with a sentence under each role.',
    36,
    { weight: 500, lh: 1.2, track: '-0.01em', color: C['slate-deep'], extra: 'margin-top:28px;text-wrap:pretty' },
  )}
  <div style="margin-top:24px">${slopeChart({ height: CHART_H })}</div>
  <div style="margin-top:32px;display:flex;flex-direction:column">${SERIES.map(legendItem).join('')}</div>
  <div style="margin-top:28px;display:flex;align-items:center;gap:18px">
    ${arch('Then one more sentence made it worse. Here’s how.', 40, { weight: 600, lh: 1.2, track: '-0.015em', color: C['magenta-deep'], stretch: 92, extra: 'white-space:nowrap' })}
    <svg width="40" height="28" viewBox="0 0 40 28" aria-label="Swipe for page 2" role="img"><path d="M2 14h34M24 3l12 11-12 11" fill="none" stroke="${C['magenta-deep']}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
  <div style="position:absolute;left:${PAD}px;right:${PAD}px;bottom:${PAD + 3}px;display:flex;justify-content:space-between;align-items:center">
    ${mono('One run per condition,<br>colour tokens only.', 36, { color: C['slate-deep'], lh: 1.2 })}
    <div style="display:flex;align-items:center;gap:16px">
      <img src="${avatarUrl}" alt="" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid ${C.navy};box-sizing:border-box;flex-shrink:0">
      ${arch('Graciela<br>Henriquez Fernandez', 36, { weight: 600, lh: 1.15, track: '-0.015em' })}
    </div>
  </div>
</div>`
}

/* ── Output ──────────────────────────────────────────────────────────── */
const TITLE = 'One sentence per design token: a small test'
const avatarData = `data:image/png;base64,${readFileSync(resolve(ASSETS, 'avatar.png')).toString('base64')}`

// Board for the posts canvas (canvas asset id for the avatar, like every post board).
out('Carousel-Token-Test-01', page({ title: 'Carousel: one sentence per token · 1 of 2', w: W, h: H, body: page1(AVATAR.posts) }))

// Standalone page for the PDF export: inline avatar, @page at the artwork size, PDF title from <title>.
export const standalone = (title, inner) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<link rel="stylesheet" href="${FONTS}">
<style>
@page{size:${W}px ${H}px;margin:0}
html,body{margin:0;padding:0;background:${C.paper}}
body{width:${W}px;font-family:${MONO};color:${C.navy};-webkit-print-color-adjust:exact;print-color-adjust:exact}
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
