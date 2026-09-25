import { C, lum, cr, FONTS, ARCH, MONO, page, mono, logos, photo, out, AVATAR_URL } from './lib.mjs'

/** LinkedIn posts page: four posts and the phone check, 1080×1350. */
console.log('post boards →')
const eyebrow = (t, color=C['slate-deep'], size=13) => `<div style="font-family:${MONO};font-size:${size}px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${color}">${t}</div>`
const h = (t, size, color=C.navy, weight=800, extra='') => `<div style="font-family:${ARCH};font-size:${size}px;font-weight:${weight};line-height:1;letter-spacing:-0.025em;color:${color};${extra}">${t}</div>`

/* ---------- POSTS (1080×1350) ---------- */
/** Author lock-up, same on every post: 112px photo ringed in the post's ink, name in Archivo. */
const author = (fg, right = '') => `<div style="display:flex;align-items:center;justify-content:space-between;border-top:4px solid ${fg};padding-top:28px"><div style="display:flex;align-items:center;gap:24px">
  <img src="${AVATAR_URL}" alt="Grace Henriquez" style="width:112px;height:112px;border-radius:50%;object-fit:cover;border:4px solid ${fg};box-sizing:border-box;flex-shrink:0">
  <div style="font-family:${ARCH};font-size:44px;font-weight:700;line-height:1;letter-spacing:-0.02em;color:${fg}">Grace Henriquez</div>
</div>${right}</div>`

const statementInner = `<div style="width:1080px;height:1350px;box-sizing:border-box;padding:80px;display:flex;flex-direction:column;justify-content:space-between;background:${C['magenta-deep']};color:${C.paper}">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div style="font-family:${MONO};font-size:36px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:${C.paper}">Career · 03</div>
    <div style="font-family:${MONO};font-size:36px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:${C.paper};border:4px solid ${C.paper};padding:8px 18px">Staff</div>
  </div>
  <div style="display:flex;flex-direction:column;gap:48px">
    <div style="font-family:${ARCH};font-size:144px;font-weight:800;line-height:0.95;letter-spacing:-0.03em;color:${C.paper}">Senior → Staff isn't a promotion.</div>
    <div style="font-family:${MONO};font-size:44px;font-weight:400;line-height:1.4;color:${C.paper};max-width:820px">It's a shift in responsibility and influence.</div>
    <svg width="920" height="120" viewBox="0 0 920 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="0" y1="100" x2="380" y2="100" stroke="${C.paper}" stroke-width="8"/>
      <line x1="380" y1="100" x2="540" y2="20" stroke="${C.paper}" stroke-width="8"/>
      <line x1="540" y1="20" x2="920" y2="20" stroke="${C.paper}" stroke-width="8"/>
      <rect x="360" y="80" width="40" height="40" fill="${C.paper}"/>
      <rect x="520" y="0" width="40" height="40" fill="${C.paper}"/>
      <line x1="0" y1="100" x2="0" y2="120" stroke="${C.paper}" stroke-width="8"/>
      <line x1="916" y1="0" x2="916" y2="20" stroke="${C.paper}" stroke-width="8"/>
    </svg>
  </div>
  ${author(C.paper)}
</div>`
out('Post-Statement', page({title:'Post: statement', w:1080, h:1350, body:statementInner, bg:C['magenta-deep'], fg:C.paper}))

/* diagram post */
function layer(y, stroke){
  const d = `M320 ${y} L640 ${y+160} L320 ${y+320} L0 ${y+160} Z`
  const hatch = [0.2,0.4,0.6,0.8].map(t=>`<line x1="${320*t}" y1="${y+160-160*t}" x2="${320+320*t}" y2="${y+320-160*t}" stroke="${stroke}" stroke-width="4" stroke-dasharray="14 12"/>`).join('')
  const nodes = [[320,y],[640,y+160],[320,y+320],[0,y+160]].map(([x,yy])=>`<rect x="${x-10}" y="${yy-10}" width="20" height="20" fill="${C.navy}"/>`).join('')
  return `<path d="${d}" stroke="${stroke}" stroke-width="7" fill="${C.paper}"/>${hatch}${nodes}`
}
const diagramInner = `<div style="width:1080px;height:1350px;box-sizing:border-box;padding:80px;display:flex;flex-direction:column;justify-content:space-between;background:${C.paper};color:${C.navy}">
  <div style="display:flex;flex-direction:column;gap:20px">
    <div style="font-family:${MONO};font-size:36px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:${C['slate-deep']}">Frontend · state</div>
    <div style="font-family:${ARCH};font-size:104px;font-weight:800;line-height:1;letter-spacing:-0.025em;color:${C.navy}">Most frontend bugs are not UI bugs.</div>
    <div style="font-family:${ARCH};font-size:72px;font-weight:700;line-height:1.1;letter-spacing:-0.02em;color:${C['magenta-deep']}">They're state bugs.</div>
  </div>
  <svg width="920" height="580" viewBox="0 0 920 680" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three stacked layers: UI state, derived state, server state, joined by dotted connectors">
    <line x1="0" y1="180" x2="0" y2="500" stroke="${C['slate-mid']}" stroke-width="4" stroke-dasharray="4 10"/>
    <line x1="640" y1="180" x2="640" y2="500" stroke="${C['slate-mid']}" stroke-width="4" stroke-dasharray="4 10"/>
    <line x1="320" y1="340" x2="320" y2="660" stroke="${C['slate-mid']}" stroke-width="4" stroke-dasharray="4 10"/>
    ${layer(340, C['sand-mid'])}
    ${layer(180, C['sky-mid'])}
    ${layer(20, C['magenta-mid'])}
    <text x="672" y="190" font-family="JetBrains Mono, monospace" font-size="36" font-weight="500" fill="${C.navy}">UI state</text>
    <text x="672" y="270" font-family="JetBrains Mono, monospace" font-size="30" font-style="italic" fill="${C['magenta-deep']}">stale data</text>
    <text x="672" y="350" font-family="JetBrains Mono, monospace" font-size="36" font-weight="500" fill="${C.navy}">Derived</text>
    <text x="672" y="430" font-family="JetBrains Mono, monospace" font-size="30" font-style="italic" fill="${C['sky-deep']}">race conditions</text>
    <text x="672" y="510" font-family="JetBrains Mono, monospace" font-size="36" font-weight="500" fill="${C.navy}">Server</text>
    <text x="672" y="590" font-family="JetBrains Mono, monospace" font-size="30" font-style="italic" fill="${C['sand-deep']}">two sources of truth</text>
  </svg>
  <div style="font-family:${MONO};font-size:36px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;line-height:1.3;color:${C['slate-deep']}">State has time, ownership and sync dimensions. UI doesn't.</div>
</div>`
out('Post-Diagram', page({title:'Post: diagram', w:1080, h:1350, body:diagramInner}))

/* infographic post */
const arche = [
  {n:'Tech Lead', a:'Delivery leadership', s:'A design system components library across 10 apps'},
  {n:'Architect', a:'Platform architecture', s:'Micro-frontends with a shared DS and routing'},
  {n:'Problem Solver', a:'Production incidents', s:'A memory leak from reactive state subscriptions'},
  {n:'Right Hand', a:'Leadership alignment', s:'Migrate and scale a legacy Angular platform'},
]
const infoInner = `<div style="width:1080px;height:1350px;box-sizing:border-box;padding:80px;display:flex;flex-direction:column;justify-content:space-between;background:${C.navy};color:${C.paper}">
  <div style="display:flex;flex-direction:column;gap:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="font-family:${MONO};font-size:36px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:${C['slate-light']}">Frontend · staff</div>
      <div style="font-family:${MONO};font-size:36px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:${C.navy};background:${C['sand-light']};padding:8px 18px">4 archetypes</div>
    </div>
    <div style="font-family:${ARCH};font-size:72px;font-weight:800;line-height:1.1;letter-spacing:-0.02em;color:${C.paper}">The <span style="color:${C['magenta-light']}">4</span> Staff Engineer<br>archetypes</div>
  </div>
  <div style="display:flex;flex-direction:column;gap:12px">
    ${arche.map((r,i)=>`<div style="display:flex;border:3px solid ${C['slate-light']}">
      <div style="width:280px;flex-shrink:0;background:${i%2===0?C['magenta-light']:C['sky-light']};padding:20px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;gap:12px">
        <div style="font-family:${ARCH};font-size:44px;font-weight:800;line-height:1;letter-spacing:-0.02em;color:${C.navy}">${r.n}</div>
        <div style="font-family:${MONO};font-size:36px;font-weight:500;letter-spacing:0.08em;color:${C.navy}">0${i+1}</div>
      </div>
      <div style="flex-grow:1;padding:16px 24px;display:flex;flex-direction:column;justify-content:center;gap:8px">
        <div style="font-family:${MONO};font-size:44px;font-weight:500;line-height:1.3;color:${C.paper}">${r.a}</div>
        <div style="font-family:${MONO};font-size:36px;font-weight:400;line-height:1.3;color:${C['slate-light']}">${r.s}</div>
      </div>
    </div>`).join('\n')}
  </div>
  ${author(C.paper)}
</div>`
out('Post-Infographic', page({title:'Post: infographic', w:1080, h:1350, body:infoInner, bg:C.navy, fg:C.paper}))

/* quote post */
const quoteInner = `<div style="width:1080px;height:1350px;box-sizing:border-box;padding:80px;display:flex;flex-direction:column;justify-content:space-between;background:${C.paper};color:${C.navy}">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div style="font-family:${MONO};font-size:36px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:${C['slate-deep']}">Design · 07</div>
    <div style="display:flex;gap:10px">
      <div style="width:36px;height:36px;background:${C['magenta-deep']}"></div><div style="width:36px;height:36px;background:${C['sky-deep']}"></div><div style="width:36px;height:36px;background:${C['sand-deep']}"></div>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:40px">
    <div style="font-family:${ARCH};font-size:200px;font-weight:900;line-height:0.6;color:${C['magenta-deep']}">“</div>
    <div style="font-family:${ARCH};font-size:128px;font-weight:800;line-height:0.98;letter-spacing:-0.03em;color:${C.navy}">Good UI is not a layer.</div>
  </div>
  ${author(C.navy, C['slate-deep'])}
</div>`
out('Post-Quote', page({title:'Post: quote', w:1080, h:1350, body:quoteInner}))

/* phone check */
const phone = (inner, caption) => `<div style="width:390px;height:844px;box-sizing:border-box;border:4px solid ${C.navy};border-radius:44px;padding:56px 12px 24px;background:#FFFFFF;display:flex;flex-direction:column;gap:12px;overflow:hidden">
  <div style="display:flex;align-items:center;gap:10px;padding:0 4px">
    <img src="${AVATAR_URL}" alt="Grace Henriquez" style="width:40px;height:40px;border-radius:50%;object-fit:cover">
    <div style="display:flex;flex-direction:column;gap:2px"><span style="font-family:${ARCH};font-size:14px;font-weight:700;color:${C.navy}">Grace Henriquez</span><span style="font-family:${MONO};font-size:11px;color:${C['slate-deep']}">Frontend architecture · 2h</span></div>
  </div>
  <div style="font-family:${ARCH};font-size:14px;line-height:1.4;color:${C.navy};padding:0 4px">${caption}</div>
  <div style="width:358px;height:448px;overflow:hidden;flex-shrink:0">
    <div style="width:1080px;height:1350px;transform:scale(0.3315);transform-origin:0 0">${inner}</div>
  </div>
  <div style="display:flex;gap:18px;padding:6px 4px;font-family:${MONO};font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${C['slate-deep']}"><span>Like</span><span>Comment</span><span>Repost</span><span>Send</span></div>
</div>`
const phoneBody = `<div style="width:1080px;height:1350px;box-sizing:border-box;padding:80px;display:flex;flex-direction:column;justify-content:space-between;background:${C.paper};color:${C.navy}">
  <div style="display:flex;flex-direction:column;gap:14px">
    ${eyebrow('Phone check · 1080px post at ×0.33 · 358px wide in the feed', C['slate-deep'], 18)}
    ${h('Label 36px → 12px. Body 44px → 15px.', 44)}
  </div>
  <div style="display:flex;gap:80px;justify-content:center">
    ${phone(statementInner, 'Senior → Staff isn’t a promotion.')}
    ${phone(diagramInner, 'Most frontend bugs are not UI bugs.')}
  </div>
  <div style="font-family:${MONO};font-size:18px;line-height:1.5;color:${C['slate-deep']}">Both posts are the real artboards scaled, not re-set. Nothing on either is below 12px on screen; every text pairing is ≥5.7:1.</div>
</div>`
out('Phone-Check', page({title:'Phone check', w:1080, h:1350, body:phoneBody}))


/* ── Carousel cover: The 3 layers of API contracts ───────────────────────────
   Navy ground. The three layers ARE the brand's isometric stack (top = product,
   base = runtime), labelled to the right. Avatar + two paper speech bubbles as
   the hook, square CTA bottom-right for "next slide". */
const layers = [
  { n: '01', name: 'Product', trait: 'Flexible', stroke: C.magM, ink: C.magL },
  { n: '02', name: 'Evolution', trait: 'Versioned', stroke: C.skyM, ink: C.skyL },
  { n: '03', name: 'Runtime', trait: 'Predictable', stroke: C.sandM, ink: C.sandL },
]
const W = 480, HH = W / 2, OFF = 130
const layerPath = (y, stroke, solid) => {
  const hatch = solid ? '' : [0.25, 0.5, 0.75].map((t) => `<line x1="${(W / 2) * t}" y1="${y + HH / 2 - (HH / 2) * t}" x2="${W / 2 + (W / 2) * t}" y2="${y + HH - (HH / 2) * t}" stroke="${stroke}" stroke-width="3" stroke-dasharray="12 10"/>`).join('')
  const nodes = [[W / 2, y], [W, y + HH / 2], [W / 2, y + HH], [0, y + HH / 2]].map(([x, yy]) => `<rect x="${x - 7}" y="${yy - 7}" width="14" height="14" fill="${C.paper}"/>`).join('')
  return `<path d="M${W / 2} ${y} L${W} ${y + HH / 2} L${W / 2} ${y + HH} L0 ${y + HH / 2} Z" stroke="${stroke}" stroke-width="6" fill="${C.navy}"/>${hatch}${nodes}`
}
const stackSvg = `<svg width="${W + 16}" height="${HH + 2 * OFF + 16}" viewBox="-8 -8 ${W + 16} ${HH + 2 * OFF + 16}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three stacked layers: product on top, evolution, runtime at the base">
  <line x1="0" y1="${HH / 2}" x2="0" y2="${HH / 2 + 2 * OFF}" stroke="${C.slateM}" stroke-width="3" stroke-dasharray="3 9"/>
  <line x1="${W}" y1="${HH / 2}" x2="${W}" y2="${HH / 2 + 2 * OFF}" stroke="${C.slateM}" stroke-width="3" stroke-dasharray="3 9"/>
  ${layerPath(2 * OFF, C.sandM, false)}${layerPath(OFF, C.skyM, false)}${layerPath(0, C.magM, true)}
</svg>`
const labelRows = layers.map((l) => `<div style="display:flex;flex-direction:column;gap:6px;height:${OFF}px;justify-content:center">
      <div style="font-family:${MONO};font-size:36px;font-weight:500;letter-spacing:0.08em;color:${C.slateL}">${l.n}</div>
      <div style="font-family:${ARCH};font-size:56px;font-weight:700;line-height:1;letter-spacing:-0.02em;color:${C.paper}">${l.name}</div>
      <div style="font-family:${MONO};font-size:36px;font-weight:500;line-height:1.2;color:${l.ink}">${l.trait}</div>
    </div>`).join('\n')
const bubble = (inner) => `<div style="background:${C.paper};color:${C.navy};font-family:${MONO};font-size:36px;font-weight:400;line-height:1.3;padding:12px 24px;align-self:flex-start">${inner}</div>`
const apiInner = `<div style="width:1080px;height:1350px;box-sizing:border-box;padding:80px;display:flex;flex-direction:column;justify-content:space-between;background:${C.navy};color:${C.paper}">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div style="font-family:${MONO};font-size:36px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:${C.slateL}">TypeScript · API contracts</div>
    <a href="#next" aria-label="Next slide" style="width:104px;height:104px;border:4px solid ${C.paper};box-sizing:border-box;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-decoration:none"><svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 24H40M26 10L40 24L26 38" stroke="${C.magL}" stroke-width="5" stroke-linecap="square"/></svg></a>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px">
    <div style="font-family:${ARCH};font-size:104px;font-weight:800;line-height:1;letter-spacing:-0.025em;color:${C.paper}">The 3 layers of</div>
    <div style="font-family:${ARCH};font-size:136px;font-weight:800;font-stretch:82%;line-height:0.95;letter-spacing:-0.03em;color:${C.magL}">API contracts</div>
  </div>
  <div style="display:flex;gap:48px;align-items:center">
    ${stackSvg}
    <div style="display:flex;flex-direction:column;justify-content:space-between;height:${HH + 2 * OFF}px;padding:${HH / 2 - OFF / 2}px 0">${labelRows}</div>
  </div>
  <div style="display:flex;align-items:flex-end;justify-content:flex-start">
    <div style="display:flex;gap:24px;align-items:flex-end">
      <img src="${AVATAR_URL}" alt="Grace Henriquez" style="width:160px;height:160px;border-radius:50%;object-fit:cover;border:5px solid ${C.magL};box-sizing:border-box;flex-shrink:0">
      <div style="display:flex;flex-direction:column;gap:14px;padding-bottom:8px">
        ${bubble(`<span style="font-weight:700;color:${C.magD}">any</span> lets everything pass`)}
        ${bubble(`here's how to fix it for good…`)}
      </div>
    </div>
  </div>
</div>`
out('Post-API-Contracts', page({ title: 'Post: the 3 layers of API contracts', w: 1080, h: 1350, body: apiInner, bg: C.navy, fg: C.paper }))

/* ── Grow people without breaking the system ─────────────────────────────────
   Illustration concept "steps on the grid": people are nodes, the system is the
   grid. Five isometric tiles rise as a staircase, each tied to the ground by a
   dotted line (the system holds every step). Three person-nodes climb it,
   joined by dotted hand-links; the one who has grown most is the magenta node
   at the top. Tile strokes go sand → sky → magenta, base to top. */
const TW = 220, TH = TW / 2, SX = 150, RISE = 135
const stepAt = (k) => [k * SX, -k * (RISE - SX / 2)]                       // along the ground axis, then up
const tile = (k, stroke) => {
  const [x, y] = stepAt(k)
  return `<path d="M${x + TW / 2} ${y} L${x + TW} ${y + TH / 2} L${x + TW / 2} ${y + TH} L${x} ${y + TH / 2} Z" stroke="${stroke}" stroke-width="6" fill="${C.navy}"/>`
}
const BASE = 330
const tieDown = (k) => { const [x, y] = stepAt(k); return `<line x1="${x + TW / 2}" y1="${y + TH}" x2="${x + TW / 2}" y2="${BASE}" stroke="${C.slateM}" stroke-width="3" stroke-dasharray="3 9"/>` }
const person = (k, fill) => { const [x, y] = stepAt(k); return `<rect x="${x + TW / 2 - 15}" y="${y + TH / 2 - 15}" width="30" height="30" fill="${fill}"/>` }
const hand = (a, b) => { const [xa, ya] = stepAt(a), [xb, yb] = stepAt(b); return `<line x1="${xa + TW / 2 + 15}" y1="${ya + TH / 2}" x2="${xb + TW / 2 - 15}" y2="${yb + TH / 2}" stroke="${C.skyL}" stroke-width="4" stroke-dasharray="4 10"/>` }
const strokes = [C.sandM, C.sandM, C.skyM, C.skyM, C.magM]
const growSvg = `<svg width="920" height="640" viewBox="-20 -280 880 612" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Five isometric steps rise from left to right, each tied to the ground by a dotted line. Three people, drawn as nodes, climb them holding hands; the highest one is magenta.">
  <line x1="-20" y1="${BASE}" x2="860" y2="${BASE}" stroke="${C.slateM}" stroke-width="3" stroke-dasharray="14 12"/>
  ${[4, 3, 2, 1, 0].map(tieDown).join('')}
  ${[4, 3, 2, 1, 0].map((k) => tile(k, strokes[k])).join('')}
  ${hand(0, 2)}${hand(2, 4)}
  ${person(0, C.paper)}${person(2, C.paper)}${person(4, C.magL)}
</svg>`
const growInner = `<div style="width:1080px;height:1350px;box-sizing:border-box;padding:80px;display:flex;flex-direction:column;justify-content:space-between;background:${C.navy};color:${C.paper}">
  <div style="display:flex;flex-direction:column;gap:28px">
    <div style="font-family:${MONO};font-size:36px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:${C.slateL}">Engineering leadership</div>
    <div style="font-family:${ARCH};font-size:104px;font-weight:800;line-height:1;letter-spacing:-0.025em;color:${C.paper}"><span style="color:${C.magL}">Grow</span> people<br>without breaking<br>the <span style="color:${C.magL}">system</span></div>
  </div>
  ${growSvg}
  ${author(C.paper)}
</div>`
out('Post-Grow-People', page({ title: 'Post: grow people without breaking the system', w: 1080, h: 1350, body: growInner, bg: C.navy, fg: C.paper }))

/* ── Photo post: "200 OK" (humour) ───────────────────────────────────────────
   Structure follows the original frame: photo full-bleed under a flat tint,
   headline typed straight onto the dark wall top-left, a compact response
   panel at the bottom, a footer band. Brand applied: the tint is navy at 40%
   instead of black; the headline is Archivo, the punchline bigger and in
   magenta-light; the panel is navy with a sky-deep header; code sits on the
   36px floor (the original's 20px is 7px on a phone). Type sits on the photo
   only where the tint makes it navy-dark (the wall); the photo stays at the original 1:1
   scale (chin ≈ y 800); the panel is compact (tight header, 1.15 leading,
   80px footer avatar) so it starts near y 900, below the chin, as the original does. The still is a canvas asset, not a repo file. */
const PHOTO_200OK = '/_blob/42689bce512c37d4de3f4c3e840d32ae'
const tint = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`
const codeLine = (k, v, vc) => `<div style="font-family:${MONO};font-size:36px;line-height:1.15;color:${C.paper}"><span style="color:${C.slateL}">  ${k}:</span> <span style="color:${vc}">${v}</span>,</div>`
const photoInner = `<div style="position:relative;width:1080px;height:1350px;box-sizing:border-box;overflow:hidden;background:${C.navy};color:${C.paper}">
  <img src="${PHOTO_200OK}" alt="" style="position:absolute;left:0;top:0;width:1080px;height:1350px;object-fit:cover;object-position:50% 50%">
  <div style="position:absolute;left:0;top:0;width:1080px;height:1350px;background:${tint(C.navy, 0.4)}"></div>
  <div style="position:absolute;left:0;top:0;width:1080px;height:1350px;box-sizing:border-box;padding:80px 80px 0;display:flex;flex-direction:column;justify-content:space-between">
    <div style="display:flex;flex-direction:column;gap:16px;align-items:flex-start">
      <div style="font-family:${ARCH};font-size:72px;font-weight:800;font-stretch:85%;line-height:1.1;letter-spacing:-0.02em;color:${C.paper}">Me reviewing<br>an API response<br>after seeing</div>
      <div style="font-family:${ARCH};font-size:120px;font-weight:800;font-stretch:85%;line-height:0.95;letter-spacing:-0.03em;color:${C.magL}">200 OK</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;flex-direction:column;background:${C.navy}">
        <div style="background:${C.skyD};padding:8px 32px;font-family:${MONO};font-size:36px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:${C.paper}">Response</div>
        <div style="padding:32px 32px 24px;display:flex;flex-direction:column;gap:0">
          <div style="font-family:${MONO};font-size:36px;line-height:1.15;color:${C.paper}">{</div>
          ${codeLine('data', 'null', C.slateL)}${codeLine('status', '"success"', C.magL)}${codeLine('error', 'undefined', C.slateL)}${codeLine('message', '"something went wrong"', C.magL)}
          <div style="font-family:${MONO};font-size:36px;line-height:1.15;color:${C.paper}">}</div>
        </div>
      </div>
      <div style="margin:0 -80px;background:${C.navy};padding:16px 80px 20px;display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:24px">
          <img src="${AVATAR_URL}" alt="Grace Henriquez" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:4px solid ${C.paper};box-sizing:border-box;flex-shrink:0">
          <div style="font-family:${ARCH};font-size:44px;font-weight:700;line-height:1;letter-spacing:-0.02em;color:${C.paper}">Grace Henriquez</div>
        </div>
        <div style="font-family:${MONO};font-size:36px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:${C.sandL}">#fridayfun</div>
      </div>
    </div>
  </div>
</div>`
out('Post-Photo-200OK', page({ title: 'Post: me reviewing an API response after seeing 200 OK', w: 1080, h: 1350, body: photoInner, bg: C.navy, fg: C.paper }))
