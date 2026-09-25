import { C, lum, cr, FONTS, ARCH, MONO, page, mono, logos, photo, out } from './lib.mjs'

/** Brand identity page: Palette, Contrast matrix, Pairing sets, Type system. */
console.log('brand boards →')
const eyebrow = (t, color=C['slate-deep'], size=13) => `<div style="font-family:${MONO};font-size:${size}px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${color}">${t}</div>`
const h = (t, size, color=C.navy, weight=800, extra='') => `<div style="font-family:${ARCH};font-size:${size}px;font-weight:${weight};line-height:1;letter-spacing:-0.025em;color:${color};${extra}">${t}</div>`

/* ---------- 1. PALETTE ---------- */
const hues = [
  {n:'Magenta', key:'magenta', meaning:'Strength, energy, resilience, fashion. The hero color: it carries statements, never decoration.'},
  {n:'Sky', key:'sky', meaning:'Empathy, transparency, solidarity. Structure and explanation: diagrams, links, secondary emphasis.'},
  {n:'Sand', key:'sand', meaning:'Warmth and Cuban inheritance. Callouts, highlights, the human note inside technical content.'},
  {n:'Slate', key:'slate', meaning:'Professional neutral, tinted toward navy. Secondary text, axes, captions, chrome.'},
]
const stepRole = {
  deep:'TEXT ON PAPER · GROUND FOR PAPER TEXT', mid:'LINES, SHAPES, CHART SERIES · 3:1 ON BOTH GROUNDS', light:'TEXT ON NAVY · GROUND FOR NAVY TEXT'
}
function swatch(key, step){
  const hex = C[`${key}-${step}`]
  const Y = lum(hex).toFixed(3)
  const onP = cr(C.paper,hex).toFixed(1), onN = cr(C.navy,hex).toFixed(1)
  const sample = step==='deep' ? `<span style="color:${C.paper}">Aa</span>` : step==='light' ? `<span style="color:${C.navy}">Aa</span>` : ``
  return `<div style="display:flex;flex-direction:column;gap:10px;flex-grow:1;flex-basis:0">
  <div style="height:132px;background:${hex};display:flex;align-items:flex-end;padding:14px 16px;box-sizing:border-box;font-family:${ARCH};font-size:34px;font-weight:800;line-height:1">${sample}</div>
  <div style="display:flex;justify-content:space-between;font-family:${MONO};font-size:13px;font-weight:600;color:${C.navy}"><span>${key}-${step}</span><span>${hex}</span></div>
  <div style="font-family:${MONO};font-size:11px;letter-spacing:0.06em;color:${C['slate-deep']};line-height:1.45">${stepRole[step]}<br>Y ${Y} · paper ${onP}:1 · navy ${onN}:1</div>
</div>`
}
const paletteBody = `<div style="width:1440px;height:960px;box-sizing:border-box;padding:56px 64px;display:flex;flex-direction:column;gap:32px;background:${C.paper}">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:40px">
    <div style="display:flex;flex-direction:column;gap:14px">
      ${eyebrow('Cucusa · brand identity v2 · 01 color')}
      ${h('Saturated, flat, verified.', 64)}
    </div>
    <div style="font-family:${MONO};font-size:13px;line-height:1.5;color:${C['slate-deep']};max-width:520px">Three steps per hue, each solved to a luminance target so it has exactly one job. No neon (no step above Y 0.40), no pastel (saturation 64–80% everywhere), no gradients: fields are flat.</div>
  </div>
  <div style="display:flex;gap:32px;align-items:stretch">
    <div style="width:320px;display:flex;flex-direction:column;gap:10px">
      <div style="height:132px;background:${C.paper};border:3px solid ${C.navy};box-sizing:border-box;display:flex;align-items:flex-end;padding:14px 16px;font-family:${ARCH};font-size:34px;font-weight:800;color:${C.navy}">Aa</div>
      <div style="display:flex;justify-content:space-between;font-family:${MONO};font-size:13px;font-weight:600"><span>paper</span><span>${C.paper}</span></div>
      <div style="font-family:${MONO};font-size:11px;letter-spacing:0.06em;color:${C['slate-deep']};line-height:1.45">DEFAULT GROUND · NEAR-WHITE, A TRACE OF WARMTH<br>Y 0.956 · vs navy 15.6:1</div>
    </div>
    <div style="width:320px;display:flex;flex-direction:column;gap:10px">
      <div style="height:132px;background:${C.navy};display:flex;align-items:flex-end;padding:14px 16px;box-sizing:border-box;font-family:${ARCH};font-size:34px;font-weight:800;color:${C.paper}">Aa</div>
      <div style="display:flex;justify-content:space-between;font-family:${MONO};font-size:13px;font-weight:600"><span>navy</span><span>${C.navy}</span></div>
      <div style="font-family:${MONO};font-size:11px;letter-spacing:0.06em;color:${C['slate-deep']};line-height:1.45">INK ON PAPER · DARK GROUND · PROFESSIONAL LAYER<br>Y 0.014 · vs paper 15.6:1</div>
    </div>
    <div style="flex-grow:1;display:flex;gap:16px">
      <div style="flex-grow:1;display:flex;flex-direction:column;gap:10px">
        <div style="height:132px;background:${C.paper};border-top:3px solid ${C['rule-paper']};border-bottom:3px solid ${C['rule-paper']};box-sizing:border-box"></div>
        <div style="display:flex;justify-content:space-between;font-family:${MONO};font-size:13px;font-weight:600"><span>rule-paper</span><span>${C['rule-paper']}</span></div>
        <div style="font-family:${MONO};font-size:11px;letter-spacing:0.06em;color:${C['slate-deep']};line-height:1.45">DECORATIVE DIVIDERS ONLY. STRUCTURAL LINES USE SLATE-MID.</div>
      </div>
      <div style="flex-grow:1;display:flex;flex-direction:column;gap:10px">
        <div style="height:132px;background:${C.navy};border-top:3px solid ${C['rule-navy']};border-bottom:3px solid ${C['rule-navy']};box-sizing:border-box"></div>
        <div style="display:flex;justify-content:space-between;font-family:${MONO};font-size:13px;font-weight:600"><span>rule-navy</span><span>${C['rule-navy']}</span></div>
        <div style="font-family:${MONO};font-size:11px;letter-spacing:0.06em;color:${C['slate-deep']};line-height:1.45">DECORATIVE DIVIDERS ON NAVY. STRUCTURAL LINES USE SLATE-LIGHT.</div>
      </div>
    </div>
  </div>
  ${hues.map(hu => `<div style="display:flex;gap:32px;align-items:flex-start;border-top:2px solid ${C.navy};padding-top:18px">
    <div style="width:320px;display:flex;flex-direction:column;gap:8px">
      ${h(hu.n, 34, C.navy, 800)}
      <div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']}">${hu.meaning}</div>
    </div>
    <div style="flex-grow:1;display:flex;gap:16px">${swatch(hu.key,'deep')}${swatch(hu.key,'mid')}${swatch(hu.key,'light')}</div>
  </div>`).join('\n')}
</div>`
out('Palette', page({title:'Palette v2', w:1440, h:960, body:paletteBody}))

/* ---------- 2. CONTRAST MATRIX ---------- */
const grounds = ['paper','navy','magenta-deep','magenta-light','sky-light','sand-light']
const inks = ['navy','paper','magenta-deep','magenta-mid','magenta-light','sky-deep','sky-mid','sky-light','sand-deep','sand-mid','sand-light','slate-deep','slate-light']
const grade = r => r>=7?'AAA':r>=4.5?'AA':r>=3?'LG':'NO'
const gradeText = {AAA:'any text', AA:'body 44px+', LG:'72px+ / shapes', NO:'do not pair'}
function cell(g,i){
  if(g===i) return `<div style="flex-grow:1;flex-basis:0;height:104px;background:${C[g]};box-sizing:border-box;border:1px solid ${C['rule-paper']}"></div>`
  const r = cr(C[g],C[i]); const gr = grade(r)
  const badgeFg = lum(C[g])>0.3 ? C.navy : C.paper
  const dim = gr==='NO'
  return `<div style="flex-grow:1;flex-basis:0;height:104px;background:${C[g]};box-sizing:border-box;padding:10px 10px 8px;display:flex;flex-direction:column;justify-content:space-between;border:1px solid ${C['rule-paper']}">
    <div style="font-family:${ARCH};font-size:32px;font-weight:800;line-height:1;color:${C[i]};${dim?'text-decoration:line-through;':''}">Ag</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;font-family:${MONO};font-size:11px;color:${badgeFg}"><span style="font-weight:700">${r.toFixed(1)}</span><span style="font-weight:${gr==='NO'?400:700};letter-spacing:0.06em">${gr}</span></div>
  </div>`
}
const contrastBody = `<div style="width:1440px;height:960px;box-sizing:border-box;padding:56px 64px;display:flex;flex-direction:column;gap:28px;background:${C.paper}">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:40px">
    <div style="display:flex;flex-direction:column;gap:14px">
      ${eyebrow('Cucusa · brand identity v2 · 01 color · pairing matrix')}
      ${h('Every ground × every ink.', 64)}
    </div>
    <div style="display:flex;gap:28px;font-family:${MONO};font-size:12px;color:${C.navy}">
      ${Object.entries(gradeText).map(([k,v])=>`<div style="display:flex;flex-direction:column;gap:4px"><span style="font-weight:700;letter-spacing:0.08em">${k}</span><span style="color:${C['slate-deep']}">${v}</span></div>`).join('')}
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;gap:6px;padding-left:166px">${inks.map(i=>`<div style="flex-grow:1;flex-basis:0;font-family:${MONO};font-size:10px;letter-spacing:0.04em;color:${C['slate-deep']};overflow:hidden;white-space:nowrap">${i}</div>`).join('')}</div>
    ${grounds.map(g=>`<div style="display:flex;gap:6px;align-items:center">
      <div style="width:160px;flex-shrink:0;display:flex;flex-direction:column;gap:4px"><span style="font-family:${MONO};font-size:13px;font-weight:700;color:${C.navy}">${g}</span><span style="font-family:${MONO};font-size:10px;color:${C['slate-deep']}">ground · ${C[g]}</span></div>
      ${inks.map(i=>cell(g,i)).join('')}
    </div>`).join('\n')}
  </div>
  <div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']};max-width:1100px">Ratios are WCAG 2.x. LinkedIn renders a 1080px post at roughly one third on a phone, so “body 44px+” means 15px on screen and “72px+” means 24px, the large-text threshold. The mid step is deliberately at about 4:1 on paper: it is for lines and shapes, never body copy. Same-hue stacks (magenta-light on magenta-deep) never pass; separate hues by a ground, not by a step.</div>
</div>`
out('Contrast', page({title:'Contrast matrix', w:1440, h:960, body:contrastBody}))


{ // pairing sets
const grounds = ['paper','navy','magenta-deep','magenta-light','sky-light','sand-light']
const inks = ['navy','paper','magenta-deep','magenta-mid','magenta-light','sky-deep','sky-mid','sky-light','sand-deep','sand-mid','sand-light','slate-deep','slate-mid','slate-light']
const all = []
for(const g of grounds) for(const i of inks) if(g!==i){ const r=cr(C[g],C[i]); all.push({g,i,r}) }
const text = all.filter(p=>p.r>=4.5).sort((a,b)=>grounds.indexOf(a.g)-grounds.indexOf(b.g)||b.r-a.r)
const large = all.filter(p=>p.r>=3&&p.r<4.5).sort((a,b)=>grounds.indexOf(a.g)-grounds.indexOf(b.g)||b.r-a.r)
console.log('text pairs', text.length, 'large pairs', large.length)

const card = (p, big) => {
  const grade = p.r>=7?'AAA':p.r>=4.5?'AA':'LARGE'
  const sample = big
    ? `<div style="font-family:${ARCH};font-size:64px;font-weight:800;line-height:1;letter-spacing:-0.025em;color:${C[p.i]}">Aa</div>
       <div style="font-family:${ARCH};font-size:26px;font-weight:700;line-height:1.1;letter-spacing:-0.02em;color:${C[p.i]}">Staff isn't a promotion</div>`
    : `<div style="font-family:${ARCH};font-size:64px;font-weight:800;line-height:1;letter-spacing:-0.025em;color:${C[p.i]}">Aa</div>
       <div style="font-family:${MONO};font-size:15px;font-weight:400;line-height:1.4;color:${C[p.i]}">Most frontend bugs are not UI bugs. They're state bugs.</div>`
  return `<div style="background:${C[p.g]};border:1px solid ${C['rule-paper']};box-sizing:border-box;padding:20px 22px;display:flex;flex-direction:column;justify-content:space-between;gap:16px;min-height:212px">
    <div style="display:flex;flex-direction:column;gap:10px">${sample}</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;font-family:${MONO};font-size:11px;letter-spacing:0.06em;color:${C[p.i]}"><span style="font-weight:700">${p.i}</span><span>${C[p.i]}</span></div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;font-family:${MONO};font-size:11px;letter-spacing:0.06em;color:${C[p.i]};border-top:1px solid ${C[p.i]};padding-top:8px"><span>on ${p.g} · ${C[p.g]}</span><span style="font-weight:700">${p.r.toFixed(1)}:1 · ${grade}</span></div>
  </div>`
}
const eyebrow = t => `<div style="font-family:${MONO};font-size:13px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${C['slate-deep']}">${t}</div>`
const H = t => `<div style="font-family:${ARCH};font-size:64px;font-weight:800;line-height:1;letter-spacing:-0.025em;color:${C.navy}">${t}</div>`

function section(g, pairs, big){
  const list = pairs.filter(p=>p.g===g); if(!list.length) return ''
  return `<div style="display:flex;flex-direction:column;gap:14px;border-top:2px solid ${C.navy};padding-top:16px">
    <div style="display:flex;justify-content:space-between;align-items:baseline"><div style="font-family:${ARCH};font-size:28px;font-weight:800;color:${C.navy}">On ${g}</div><div style="font-family:${MONO};font-size:12px;color:${C['slate-deep']}">${C[g]} · ${list.length} ink${list.length>1?'s':''}</div></div>
    <div style="display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:16px">${list.map(p=>card(p,big)).join('')}</div>
  </div>`
}
const rowsText = grounds.reduce((n,g)=>n+Math.ceil(text.filter(p=>p.g===g).length/4),0)
const hText = 56+120+ rowsText*228 + grounds.filter(g=>text.some(p=>p.g===g)).length*90 + 56
const textBody = `<div style="width:1440px;height:${hText}px;box-sizing:border-box;padding:56px 64px;display:flex;flex-direction:column;gap:32px;background:${C.paper}">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:40px">
    <div style="display:flex;flex-direction:column;gap:14px">${eyebrow('Cucusa · pairing sets · text')}${H('Pairings for any text.')}</div>
    <div style="font-family:${MONO};font-size:13px;line-height:1.5;color:${C['slate-deep']};max-width:520px">${text.length} ground-and-ink sets at 4.5:1 or better. Safe for Body 44px and Label 36px on a 1080 post, and for 15px body on the web. AAA sets also pass at 12px on screen.</div>
  </div>
  ${grounds.map(g=>section(g,text,false)).join('\n')}
</div>`
out('Pairings-Text', page({title:'Text pairings', w:1440, h:hText, body:textBody}))

const rowsLarge = grounds.reduce((n,g)=>n+Math.ceil(large.filter(p=>p.g===g).length/4),0)
const hLarge = 56+120+ rowsLarge*228 + grounds.filter(g=>large.some(p=>p.g===g)).length*90 + 56
const largeBody = `<div style="width:1440px;height:${hLarge}px;box-sizing:border-box;padding:56px 64px;display:flex;flex-direction:column;gap:32px;background:${C.paper}">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:40px">
    <div style="display:flex;flex-direction:column;gap:14px">${eyebrow('Cucusa · pairing sets · large text and graphics')}${H('Pairings for H2 and up, lines and shapes.')}</div>
    <div style="font-family:${MONO};font-size:13px;line-height:1.5;color:${C['slate-deep']};max-width:520px">${large.length} sets between 3:1 and 4.5:1. Use for headlines from 72px on a 1080 post (24px on screen), for 19px bold on the web, and for diagram strokes, chart series and icons. Never for body or labels.</div>
  </div>
  ${grounds.map(g=>section(g,large,true)).join('\n')}
</div>`
out('Pairings-Large', page({title:'Large text and graphic pairings', w:1440, h:hLarge, body:largeBody}))

}

{ // type system
const GRID = 'display:grid;grid-template-columns:120px minmax(0, 1fr) 100px 100px 100px 210px 90px 100px;column-gap:20px;align-items:baseline'
const label = (t, color=C.slateD) => `<div style="font-family:${MONO};font-size:12px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${color}">${t}</div>`
const scale = [
  {step:'Display', li:144, ph:48, web:72, face:'Archivo 800', lh:'0.95', ls:'-0.03em', use:'One statement, 2–5 words', fam:ARCH, w:800, sls:'-0.03em'},
  {step:'H1', li:104, ph:35, web:56, face:'Archivo 800', lh:'1.00', ls:'-0.025em', use:'Post headline · ≤3 lines · ≤17 chars per line', fam:ARCH, w:800, sls:'-0.025em'},
  {step:'H2', li:72, ph:24, web:40, face:'Archivo 700', lh:'1.10', ls:'-0.02em', use:'Second thought, section title', fam:ARCH, w:700, sls:'-0.02em'},
  {step:'Lead', li:56, ph:19, web:24, face:'Archivo 500', lh:'1.25', ls:'-0.01em', use:'Subtitle, quote attribution', fam:ARCH, w:500, sls:'-0.01em'},
  {step:'Body', li:44, ph:15, web:18, face:'JetBrains Mono 400', lh:'1.40', ls:'0', use:'Explanations, table cells · ≤35 chars per line', fam:MONO, w:400, sls:'0'},
  {step:'Label', li:36, ph:12, web:13, face:'JetBrains Mono 500 · caps', lh:'1.20', ls:'+0.08em', use:'Eyebrows, tags, axes · the floor, nothing smaller', fam:MONO, w:500, sls:'0.08em', caps:true},
]
const num = v => `<div style="font-family:${MONO};font-size:15px;font-weight:500;color:${C.navy}">${v}</div>`
const cell = v => `<div style="font-family:${MONO};font-size:13px;color:${C.navy}">${v}</div>`
const rows = scale.map(s => `<div style="${GRID};padding:20px 0;border-bottom:1px solid ${C.rule}">
      <div style="font-family:${ARCH};font-size:22px;font-weight:800;letter-spacing:-0.02em;color:${C.navy}">${s.step}</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="font-family:${s.fam};font-size:${s.ph}px;font-weight:${s.w};line-height:1;letter-spacing:${s.sls};color:${C.navy};${s.caps?'text-transform:uppercase;':''}">Handgloves</div>
        <div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C.slateD}">${s.use}</div>
      </div>
      ${num(s.li+'px')}${num(s.ph+'px')}${num(s.web+'px')}${cell(s.face)}${cell(s.lh)}${cell(s.ls)}
    </div>`).join('\n')

const body = `<div style="width:1440px;height:1960px;box-sizing:border-box;padding:64px;display:flex;flex-direction:column;gap:48px;background:${C.paper}">
  <div style="display:grid;grid-template-columns:minmax(0, 1fr) 520px;column-gap:48px;align-items:end">
    <div style="display:flex;flex-direction:column;gap:16px">
      ${label('Cucusa · brand identity v2 · 02 typography')}
      <div style="font-family:${ARCH};font-size:64px;font-weight:800;line-height:1;letter-spacing:-0.025em;color:${C.navy}">Two faces, one voice.</div>
    </div>
    <div style="font-family:${MONO};font-size:13px;line-height:1.6;color:${C.slateD}">Archivo speaks at display sizes; JetBrains Mono keeps the engineering register at reading sizes. Mono never goes above H2: its fixed advance opens up past 100px, and that is the layout limit you hit.</div>
  </div>

  <div style="display:flex;flex-direction:column;gap:20px">
    ${label('01 · The pairing')}
    <div style="display:flex;flex-direction:column;border-top:3px solid ${C.navy}">
      <div style="display:grid;grid-template-columns:minmax(0, 1fr) 380px;column-gap:64px;align-items:end;padding:28px 0 32px;border-bottom:1px solid ${C.rule}">
        <div style="display:flex;flex-direction:column;gap:24px;min-width:0">
          ${label('Display · Archivo · variable width 62–125, weight 100–900', C.magD)}
          <div style="font-family:${ARCH};font-size:140px;font-weight:800;line-height:0.9;letter-spacing:-0.03em;color:${C.navy};white-space:nowrap">Handgloves</div>
          <div style="display:flex;gap:40px;align-items:baseline">
            <span style="font-family:${ARCH};font-size:28px;font-weight:900;font-stretch:125%;line-height:1;color:${C.navy};white-space:nowrap">Expanded 900</span>
            <span style="font-family:${ARCH};font-size:28px;font-weight:700;line-height:1;color:${C.navy};white-space:nowrap">Normal 700</span>
            <span style="font-family:${ARCH};font-size:28px;font-weight:500;font-stretch:62%;line-height:1;color:${C.navy};white-space:nowrap">Condensed 500</span>
          </div>
        </div>
        <div style="font-family:${MONO};font-size:14px;line-height:1.65;color:${C.slateD}">A grotesque with a width axis: one family covers poster-wide headlines and dense tables without a third font. Heavy weights hold up under LinkedIn's compression, and the counters stay open at 35px on a phone.</div>
      </div>
      <div style="display:grid;grid-template-columns:minmax(0, 1fr) 380px;column-gap:64px;align-items:end;padding:28px 0 8px">
        <div style="display:flex;flex-direction:column;gap:24px;min-width:0">
          ${label('Text · JetBrains Mono · weight 100–800', C.skyD)}
          <div style="font-family:${MONO};font-size:44px;font-weight:400;line-height:1.3;letter-spacing:-0.01em;color:${C.navy}">Most frontend bugs are not UI bugs.<br>They're state bugs.</div>
          <div style="display:flex;gap:40px;align-items:baseline">
            <span style="font-family:${MONO};font-size:14px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:${C.navy}">Label caps +0.08em</span>
            <span style="font-family:${MONO};font-size:22px;font-weight:700;color:${C.magD}">status: "success"</span>
            <span style="font-family:${MONO};font-size:22px;font-weight:400;color:${C.slateD}">// comment</span>
          </div>
        </div>
        <div style="font-family:${MONO};font-size:14px;line-height:1.65;color:${C.slateD}">Kept on purpose: it is the engineering signature and it already ships self-hosted in the token package. Its job narrows to body, labels, code, numbers and axes, where monospace reads as precision rather than as a spacing problem.</div>
      </div>
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:20px">
    ${label('02 · The scale · sample column is rendered at phone size')}
    <div style="display:flex;flex-direction:column;border-top:3px solid ${C.navy}">
      <div style="${GRID};padding:16px 0;border-bottom:1px solid ${C.navy}">
        ${['Step','Rendered on a phone','1080 post','Phone ÷3','Web / blog','Face · weight','Leading','Tracking'].map(t=>`<div style="font-family:${MONO};font-size:11px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:${C.slateD}">${t}</div>`).join('')}
      </div>
      ${rows}
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:20px">
    ${label('03 · Rules')}
    <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));column-gap:48px;border-top:3px solid ${C.navy}">
      <div style="display:flex;flex-direction:column;gap:10px;padding-top:20px">
        <div style="font-family:${ARCH};font-size:18px;font-weight:800;color:${C.navy}">Readability</div>
        <div style="font-family:${MONO};font-size:12px;line-height:1.6;color:${C.slateD}">Label 36px is the floor: 12px on a phone, LinkedIn's own caption size. Body at 44px keeps 35 characters per line inside 80px margins, so a paragraph never runs past 4 lines. Headlines break by meaning, by hand, never by width.</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;padding-top:20px">
        <div style="font-family:${ARCH};font-size:18px;font-weight:800;color:${C.navy}">Responsive</div>
        <div style="font-family:${MONO};font-size:12px;line-height:1.6;color:${C.slateD}">Content is designed once at 1080×1350 and only ever scales down, so the scale is fixed in px, not rem. The web column is the same hierarchy re-based on an 18px body for the blog and portfolio, where the reader controls zoom.</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;padding-top:20px">
        <div style="font-family:${ARCH};font-size:18px;font-weight:800;color:${C.navy}">Why two faces</div>
        <div style="font-family:${MONO};font-size:12px;line-height:1.6;color:${C.slateD}">A display-grade mono such as Martian Mono solves the big-size gap, but every body line then inherits the same heavy texture. Two faces let the mono stay quiet where it reads and let Archivo carry the weight where it shows.</div>
      </div>
    </div>
  </div>
</div>`

out('Type-System', `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Type system</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="${FONTS}">
<style>
body{margin:0;background:${C.paper};color:${C.navy};font-family:${MONO}}
a{color:${C.skyD}}a:hover{color:${C.navy}}
</style>
</helmet>
${body}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1960}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`)
}
