/**
 * Shared pieces for the canvas board generators. Colours come from
 * brand/palette.json (via the solver), fonts and page skeleton are the
 * Design-canvas `.dc.html` contract, logos and avatar come from brand/assets.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildPalette, flat, luminance, contrast } from '../palette.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
export const ASSETS = resolve(HERE, '..', 'assets')
export const DIST = resolve(HERE, 'dist')

// ── Colours: flat keys ('magenta-deep') plus the short aliases the generators use
const P = flat(buildPalette())
export const C = {
  ...P,
  magD: P['magenta-deep'], magM: P['magenta-mid'], magL: P['magenta-light'],
  skyD: P['sky-deep'], skyM: P['sky-mid'], skyL: P['sky-light'],
  sandD: P['sand-deep'], sandM: P['sand-mid'], sandL: P['sand-light'],
  slateD: P['slate-deep'], slateM: P['slate-mid'], slateL: P['slate-light'],
  ruleP: P['rule-paper'], ruleN: P['rule-navy'], rule: P['rule-paper'],
}
export const lum = luminance
export const cr = contrast

// ── Type
export const FONTS =
  'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=JetBrains+Mono:wght@100..800&display=swap'
export const ARCH = "'Archivo', 'Helvetica Neue', Arial, sans-serif"
export const MONO = "'JetBrains Mono', ui-monospace, Menlo, monospace"

// ── Assets. Logos are inlined so they take the ground's ink via currentColor.
//    Files are named by index on purpose: see brand/CLAUDE.md → Disclosure.
const logoSvg = (file, h, label) =>
  readFileSync(resolve(ASSETS, file), 'utf8').replace(
    /<svg width="(\d+)" height="(\d+)"/,
    (m, w, hh) => `<svg width="${Math.round((w * h) / hh)}" height="${h}" role="img" aria-label="${label}"`,
  )
export const LOGOS = [logoSvg('logo-01.svg', 24, 'Logo 1'), logoSvg('logo-02.svg', 42, 'Logo 2'), logoSvg('logo-03.svg', 40, 'Logo 3')]
export const logos = (color) =>
  `<div style="display:flex;gap:40px;align-items:center;height:44px;color:${color}">${LOGOS.join('')}</div>`

// ── Canvases. Links and per-canvas asset ids live in canvases.json, the single source of truth
//    for local and cloud sessions alike. An id is only valid on the canvas it was uploaded to.
export const CANVASES = JSON.parse(readFileSync(resolve(HERE, 'canvases.json'), 'utf8'))
/** Asset url for a board that will be published to `canvas` ('reference' | 'posts'). Fails loudly if missing. */
export function asset(canvas, name) {
  const url = CANVASES[canvas]?.assets?.[name]
  if (!url) throw new Error(`canvases.json: no asset "${name}" on the ${canvas} canvas — upload or copy it there and record its /_blob id`)
  return url
}
export const AVATAR = { brand: asset('reference', 'avatar'), posts: asset('posts', 'avatar') }
export const AVATAR_URL = AVATAR.brand
export const photo = (d, left, top) =>
  `<img src="${AVATAR_URL}" alt="Grace Henriquez" style="position:absolute;left:${left}px;top:${top}px;width:${d}px;height:${d}px;border-radius:50%;object-fit:cover;border:4px solid #FFFFFF;box-sizing:border-box;background:#FFFFFF">`

// ── Board skeleton (Design canvas .dc.html)
export function page({ title, w = 1584, h = 396, body, fonts = FONTS, bg = C.paper, fg = C.navy }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="${fonts}">
<style>
body{margin:0;background:${bg};color:${fg};font-family:${MONO}}
a{color:${C['sky-deep']}}a:hover{color:${C.navy}}
</style>
</helmet>
${body}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`
}
export const mono = (t, size, color, extra = '') =>
  `<div style="font-family:${MONO};font-size:${size}px;font-weight:500;line-height:1.2;color:${color};${extra}">${t}</div>`

/** Write a board to brand/canvas/dist/<name>.dc.html */
export function out(name, html) {
  mkdirSync(DIST, { recursive: true })
  writeFileSync(resolve(DIST, `${name}.dc.html`), html)
  console.log('  ' + name + '.dc.html')
}
