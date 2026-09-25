/** LinkedIn banner page: statement banner, three photo-checked variants, export frames, illustration review. */
import { C, ARCH, MONO, page, mono, logos, photo, out } from './lib.mjs'
console.log('banner boards →')

const ROLES = 'Staff Product Engineer / Design Engineer / Frontend'
const STACK = 'React · Angular · TypeScript · Design Systems'
const PROCESS = 'Spec → Design → Architect → Ship'

/* ── A · Statement: magenta-deep ground, paper only ─────────────── */
const ribbon = (bg, fg) =>
  `<div style="position:absolute;left:-80px;top:44px;transform:rotate(-9deg);transform-origin:left center;background:${bg};color:${fg};font-family:${MONO};font-size:26px;font-weight:600;letter-spacing:0.06em;padding:10px 120px 10px 110px;white-space:nowrap">${PROCESS}</div>`
const statement = `<div style="position:relative;width:1584px;height:396px;box-sizing:border-box;overflow:hidden;background:${C.magD};color:${C.paper}">
  ${ribbon(C.paper, C.navy)}
  <div style="position:absolute;left:560px;top:56px;width:1000px;display:flex;flex-direction:column;gap:22px">
    <div style="font-family:${ARCH};font-size:64px;font-weight:800;font-stretch:85%;line-height:1;letter-spacing:-0.02em;color:${C.paper}">From research to production<br>and the systems that scale it.</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${mono(ROLES, 30, C.paper)}
      ${mono(STACK, 26, C.paper, 'font-weight:400;')}
    </div>
    ${logos(C.paper)}
  </div>
  <div style="position:absolute;left:0;bottom:0;width:1584px;height:12px;background:${C.navy}"></div>
</div>`
out('Banner-Statement', page({ title: 'Banner: statement', body: statement, bg: C.magD, fg: C.paper }))

/* ── Technical grid, no illustration: the working banner ────────── */
const gridLines = []
for (let x = 0; x <= 1584; x += 48) gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="396" stroke="${C.ruleN}" stroke-width="1"/>`)
for (let y = 0; y <= 396; y += 48) gridLines.push(`<line x1="0" y1="${y}" x2="1584" y2="${y}" stroke="${C.ruleN}" stroke-width="1"/>`)
const grid = `<svg style="position:absolute;left:0;top:0" width="1584" height="396" viewBox="0 0 1584 396" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${gridLines.join('')}</svg>`

/** Copy column starts at `left` (460 when the photo is in place, 560 when not) and ends at 1540. */
const banner = (strip, left = 460) => `<div style="position:relative;width:1584px;height:396px;box-sizing:border-box;overflow:hidden;background:${C.navy};color:${C.paper}">
  ${grid}
  <div style="position:absolute;left:${left}px;top:56px;width:${1540 - left}px;font-family:${ARCH};font-size:64px;font-weight:800;font-stretch:85%;line-height:1.02;letter-spacing:-0.02em;color:${C.paper}">From research to production<br>and the systems that <span style="color:${C.magL}">scale it.</span></div>
  <div style="position:absolute;left:${left}px;top:228px;width:${1540 - left}px;font-family:${MONO};font-size:30px;font-weight:500;line-height:1.2;color:${C.sandL}">${ROLES}</div>
  <div style="position:absolute;left:${left}px;top:288px;width:${1540 - left}px;height:108px;display:flex;justify-content:flex-start;align-items:flex-start;border-top:1px solid ${C.slateM};padding-top:14px;box-sizing:border-box">${strip}</div>
</div>`
const line = (t) => `<div style="font-family:${MONO};font-size:26px;font-weight:400;line-height:1.2;color:${C.slateL}">${t}</div>`
const FOOTERS = { stack: line(STACK), logos: logos(C.slateL), process: line(PROCESS) }

/** 560px frame: the banner plus the real profile photo where LinkedIn puts it (330px at 60,190 in banner px). */
const framed = (body) => `<div style="position:relative;width:1584px;height:560px;box-sizing:border-box;overflow:hidden;background:#FFFFFF;color:${C.navy}">
  <div style="position:absolute;left:0;top:0;width:1584px;height:396px;overflow:hidden">${body}</div>
  ${photo(330, 60, 190)}
</div>`

const NAMES = { stack: ['Banner-Photo-Stack', 'stack line only', '01-stack'], logos: ['Banner-Photo-Logos', 'logos only', '02-logos'], process: ['Banner-Photo-Process', 'process line only', '03-process'] }
for (const [key, [board, label, suffix]] of Object.entries(NAMES)) {
  out(board, page({ title: `LinkedIn banner: no illustration, ${label}, with profile photo`, h: 560, body: framed(banner(FOOTERS[key])), bg: '#FFFFFF', fg: C.navy }))
  out(`grace-henriquez-linkedin-banner-1584x396-${suffix}`, page({ title: `Export: banner, ${label.replace(' only', '')}`, body: banner(FOOTERS[key]), bg: C.navy, fg: C.paper }))
}

/* ── Illustration review: four isometric layers stepped along the plane's axes ── */
const isoRun = (w, dx, dy, n, colors) => {
  const hh = w / 2
  const minY = Math.min(0, dy * (n - 1)), W = w + Math.abs(dx) * (n - 1), H = hh + Math.abs(dy) * (n - 1)
  const P = (i) => [i * dx, i * dy - minY]
  const L = (i) => { const [x0, y0] = P(i); return `<path d="M${x0 + w / 2} ${y0} L${x0 + w} ${y0 + hh / 2} L${x0 + w / 2} ${y0 + hh} L${x0} ${y0 + hh / 2} Z" stroke="${colors[i]}" stroke-width="4" ${i === 0 ? '' : 'stroke-dasharray="10 8"'}/>` }
  const order = dy >= 0 ? [...Array(n).keys()] : [...Array(n).keys()].reverse()
  const [xa, ya] = P(0), [xb, yb] = P(n - 1)
  const conn = `<line x1="${xa + w / 2}" y1="${ya}" x2="${xb + w / 2}" y2="${yb}" stroke="${C.slateM}" stroke-width="2" stroke-dasharray="2 6"/><line x1="${xa + w / 2}" y1="${ya + hh}" x2="${xb + w / 2}" y2="${yb + hh}" stroke="${C.slateM}" stroke-width="2" stroke-dasharray="2 6"/>`
  const sq = (x, y) => `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="${C.paper}"/>`
  const nodes = [...Array(n).keys()].map((i) => { const [x0, y0] = P(i); return sq(x0 + w / 2, y0) + sq(x0 + w, y0 + hh / 2) + sq(x0 + w / 2, y0 + hh) + sq(x0, y0 + hh / 2) }).join('')
  return `<svg width="${W + 12}" height="${H + 12}" viewBox="-6 -6 ${W + 12} ${H + 12}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Four isometric layers in sequence">${conn}${order.map(L).join('')}${nodes}</svg>`
}
const cols = [C.magM, C.skyM, C.sandM, C.slateM]
const rowT = (t) => `<div style="font-family:${MONO};font-size:13px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${C.slateL}">${t}</div>`
const review = `<div style="width:1200px;height:1180px;box-sizing:border-box;padding:56px 64px;display:flex;flex-direction:column;gap:40px;background:${C.navy};color:${C.paper}">
  <div style="display:flex;flex-direction:column;gap:14px">${rowT('01 · One after another · overlapping · step 96 along the ground axis')}${isoRun(240, 96, 48, 4, cols)}</div>
  <div style="display:flex;flex-direction:column;gap:14px">${rowT('02 · One after another · tiled on one plane · step 128, edges nearly touch')}${isoRun(240, 128, 64, 4, cols)}</div>
  <div style="display:flex;flex-direction:column;gap:14px">${rowT('03 · At the same time · receding along the depth axis · step 120')}${isoRun(240, 120, -60, 4, cols)}</div>
</div>`
out('Banner-Illustration-Review', page({ title: 'Illustration review: isometric sequence, four layers', w: 1200, h: 1180, body: review, bg: C.navy, fg: C.paper }))
