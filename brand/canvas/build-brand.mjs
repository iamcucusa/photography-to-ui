import { C, lum, cr, FONTS, ARCH, MONO, page, mono, logos, photo, out, asset } from './lib.mjs'

/** Brand identity page: Palette, Contrast matrix, Pairing sets, Type system, Components, Posts & carousels.
 *  The canvas boards are generated from here; when a board is edited by hand on the canvas, bring the
 *  change back into this file (the folder is the system's source) and republish. */
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
const groundCard = (name, hex, role, sampleHtml, extra = '') => `<div style="width:272px;display:flex;flex-direction:column;gap:10px">
      <div style="height:132px;background:${hex};box-sizing:border-box;display:flex;align-items:flex-end;padding:14px 16px;gap:12px;${extra}">${sampleHtml}</div>
      <div style="display:flex;justify-content:space-between;font-family:${MONO};font-size:13px;font-weight:600"><span>${name}</span><span>${hex}</span></div>
      <div style="font-family:${MONO};font-size:11px;letter-spacing:0.06em;color:${C['slate-deep']};line-height:1.45">${role}<br>Y ${lum(hex).toFixed(3)} · vs ${name === 'navy' ? 'paper' : 'navy'} ${cr(hex, name === 'navy' ? C.paper : C.navy).toFixed(1)}:1</div>
    </div>`
const ruleCard = (name, hex, ground, role) => `<div style="flex-grow:1;display:flex;flex-direction:column;gap:10px">
        <div style="height:132px;background:${ground};border-top:3px solid ${hex};border-bottom:3px solid ${hex};box-sizing:border-box"></div>
        <div style="display:flex;justify-content:space-between;font-family:${MONO};font-size:13px;font-weight:600"><span>${name}</span><span>${hex}</span></div>
        <div style="font-family:${MONO};font-size:11px;letter-spacing:0.06em;color:${C['slate-deep']};line-height:1.45">${role}</div>
      </div>`
const PALETTE_H = 1540
const paletteBody = `<div style="width:1440px;height:${PALETTE_H}px;box-sizing:border-box;padding:56px 64px;display:flex;flex-direction:column;gap:32px;background:${C.paper}">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:40px">
    <div style="display:flex;flex-direction:column;gap:14px">
      ${eyebrow('Cucusa · brand identity v2 · 01 color')}
      ${h('Saturated, flat, verified.', 64)}
    </div>
    <div style="font-family:${MONO};font-size:13px;line-height:1.5;color:${C['slate-deep']};max-width:520px">Three steps per hue, each solved to a luminance target so it has exactly one job. No neon (no step above Y 0.40), no pastel (saturation 64–80% everywhere), no gradients: fields are flat.</div>
  </div>
  <div style="display:flex;gap:32px;align-items:stretch">
    ${groundCard('paper', C.paper, 'DEFAULT GROUND · COOL NEAR-WHITE, NEVER A WARM IVORY', `<span style="font-family:${ARCH};font-size:34px;font-weight:800;color:${C.navy};line-height:1">Aa</span>`, `border:3px solid ${C.navy}`)}
    ${groundCard('navy', C.navy, 'INK ON PAPER · DARK GROUND · PROFESSIONAL LAYER', `<span style="font-family:${ARCH};font-size:34px;font-weight:800;color:${C.paper};line-height:1">Aa</span>`)}
    ${groundCard('mist', C.mist, 'UI GROUND · POSTS THAT SHOW LIGHT UI · WHITE LIFTS 1.2:1', `<span style="font-family:${ARCH};font-size:34px;font-weight:800;color:${C.navy};line-height:1">Aa</span><span style="flex-grow:1;height:40px;background:${C['surface-raised']};border:1px solid ${C['slate-mid']};border-radius:2px"></span>`)}
    <div style="flex-grow:1;display:flex;gap:16px">
      ${ruleCard('rule-paper', C['rule-paper'], C.paper, 'DECORATIVE DIVIDERS ONLY. STRUCTURAL LINES USE SLATE-MID.')}
      ${ruleCard('rule-navy', C['rule-navy'], C.navy, 'DECORATIVE DIVIDERS ON NAVY. STRUCTURAL LINES USE SLATE-LIGHT.')}
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
out('Palette', page({title:'Palette v2', w:1440, h:PALETTE_H, body:paletteBody}))

/* ---------- 2. CONTRAST MATRIX ---------- */
const grounds = ['paper','navy','mist','magenta-deep','magenta-light','sky-light','sand-light']
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
const CONTRAST_H = 1070
const contrastBody = `<div style="width:1440px;height:${CONTRAST_H}px;box-sizing:border-box;padding:56px 64px;display:flex;flex-direction:column;gap:28px;background:${C.paper}">
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
out('Contrast', page({title:'Contrast matrix', w:1440, h:CONTRAST_H, body:contrastBody}))


{ // pairing sets
const grounds = ['paper','navy','mist','magenta-deep','magenta-light','sky-light','sand-light']
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

const block = (title, note, list, big) => `<div style="display:flex;flex-direction:column;gap:14px;border-top:2px solid ${C.navy};padding-top:16px">
    <div style="display:flex;justify-content:space-between;align-items:baseline"><div style="font-family:${ARCH};font-size:28px;font-weight:800;color:${C.navy}">${title}</div><div style="font-family:${MONO};font-size:12px;color:${C['slate-deep']}">${note}</div></div>
    <div style="display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:16px">${list.map(p=>card(p,big)).join('')}</div>
  </div>`
// A ground with several inks gets its own block. The hue grounds carry one ink each (navy or
// paper), so they share one block, four cards in a row, instead of four one-card blocks.
const count = (pairs, g) => pairs.filter(p=>p.g===g).length
const multi = (pairs) => grounds.filter(g=>count(pairs,g) > 1)
const singles = (pairs) => grounds.filter(g=>count(pairs,g) === 1)
function sections(pairs, big){
  const own = multi(pairs).map(g=>block(`On ${g}`, `${C[g]} · ${count(pairs,g)} inks`, pairs.filter(p=>p.g===g), big))
  const one = singles(pairs).flatMap(g=>pairs.filter(p=>p.g===g))
  if(one.length) own.push(block('On a hue', `${one.length} grounds · one ink each, navy or paper`, one, big))
  return own.join('\n')
}
// Height from the layout: padding, header, then per block 32 gap + 66 head, per row of cards 228.
const rowsOf = (pairs) => multi(pairs).reduce((n,g)=>n+Math.ceil(count(pairs,g)/4),0) + Math.ceil(singles(pairs).length/4)
const blocksOf = (pairs) => multi(pairs).length + (singles(pairs).length ? 1 : 0)
const heightOf = (pairs) => 56 + 120 + blocksOf(pairs)*98 + rowsOf(pairs)*228 + 56
const hText = heightOf(text)
const textBody = `<div style="width:1440px;height:${hText}px;box-sizing:border-box;padding:56px 64px;display:flex;flex-direction:column;gap:32px;background:${C.paper}">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:40px">
    <div style="display:flex;flex-direction:column;gap:14px">${eyebrow('Cucusa · pairing sets · text')}${H('Pairings for any text.')}</div>
    <div style="font-family:${MONO};font-size:13px;line-height:1.5;color:${C['slate-deep']};max-width:520px">${text.length} ground-and-ink sets at 4.5:1 or better. Safe for Body 44px and Label 36px on a 1080 post, and for 15px body on the web. AAA sets also pass at 12px on screen.</div>
  </div>
  ${sections(text,false)}
</div>`
out('Pairings-Text', page({title:'Text pairings', w:1440, h:hText, body:textBody}))

const hLarge = heightOf(large)
const largeBody = `<div style="width:1440px;height:${hLarge}px;box-sizing:border-box;padding:56px 64px;display:flex;flex-direction:column;gap:32px;background:${C.paper}">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:40px">
    <div style="display:flex;flex-direction:column;gap:14px">${eyebrow('Cucusa · pairing sets · large text and graphics')}${H('Pairings for H2 and up, lines and shapes.')}</div>
    <div style="font-family:${MONO};font-size:13px;line-height:1.5;color:${C['slate-deep']};max-width:520px">${large.length} sets between 3:1 and 4.5:1. Use for headlines from 72px on a 1080 post (24px on screen), for 19px bold on the web, and for diagram strokes, chart series and icons. Never for body or labels.</div>
  </div>
  ${sections(large,true)}
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
  {step:'Label', li:36, ph:12, web:13, face:'JetBrains Mono 500 · caps', lh:'1.20', ls:'+0.08em', use:'Eyebrows, tags, axes · the floor for post type', fam:MONO, w:500, sls:'0.08em', caps:true},
  {step:'Control', li:36, ph:12, web:18, face:'JetBrains Mono 400 · value 500', lh:'1.00', ls:'0', use:'Inside a component: field value, option · drawn at 2×', fam:MONO, w:500, sls:'0'},
  {step:'Helper', li:32, ph:11, web:16, face:'JetBrains Mono 500 label · 400 text', lh:'1.25', ls:'0', use:'Component label, helper, error · the component floor', fam:MONO, w:400, sls:'0'},
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

const TYPE_H = 2120
const body = `<div style="width:1440px;height:${TYPE_H}px;box-sizing:border-box;padding:64px;display:flex;flex-direction:column;gap:48px;background:${C.paper}">
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
        <div style="font-family:${MONO};font-size:12px;line-height:1.6;color:${C.slateD}">Label 36px is the floor for post type: 12px on a phone, LinkedIn's own caption size. UI drawn inside a post follows components.json at 2×, whose floor is 16px web, 32px on the post. Body at 44px keeps 35 characters per line inside 80px margins, so a paragraph never runs past 4 lines. Headlines break by meaning, by hand, never by width.</div>
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
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":${TYPE_H}}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`)
}

/* ---------- 5. COMPONENTS (03 on the canvas) ---------- */
// The components board as it was authored on the canvas, brought back here so the folder is the
// source. Values are the ones in components.json, drawn at 2× (web px doubled) on the mist ground.
const SHADOW = 'rgba(16,32,58,0.12)' // the brand's only shadow: navy at 12 %, under an open list
const componentsBody = `<div style="width:1440px;height:1820px;box-sizing:border-box;padding:56px 64px;display:flex;flex-direction:column;gap:40px;background:${C.paper}">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:40px">
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="font-family:${MONO};font-size:13px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${C['slate-deep']}">Cucusa · brand identity v2 · 03 components</div>
      <div style="font-family:${ARCH};font-size:64px;font-weight:800;line-height:1;letter-spacing:-0.025em;color:${C.navy};">Near-square, drawn at 2×.</div>
    </div>
    <div style="font-family:${MONO};font-size:13px;line-height:1.5;color:${C['slate-deep']};max-width:560px">When a post shows UI, it shows a real component, drawn from components.json at twice web scale on the mist ground. Corners are near-square, icon strokes end square, and the only shadow in the brand belongs to an open list.</div>
  </div>

  <div style="display:flex;flex-direction:column;gap:16px">
    <div style="font-family:${MONO};font-size:12px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${C['slate-deep']}">01 · Field states · closed</div>
    <div style="background:${C.mist};padding:40px"><div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));column-gap:48px;align-items:start">
      <div><div style="font-family:${MONO};font-size:32px;font-weight:500;line-height:1.25;color:${C.navy};margin-bottom:12px">Rest</div><div style="width:100%;height:88px;box-sizing:border-box;padding:0 24px 0 28px;border:2px solid ${C['slate-mid']};border-radius:4px;background:${C['surface-raised']};display:flex;align-items:center;justify-content:space-between"><span style="font-family:${MONO};font-size:36px;font-weight:500;color:${C['slate-deep']}">Select one</span><svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7 12L16 21L25 12" stroke="${C.navy}" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter"/></svg></div><div style="margin-top:24px"><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']}">slate-mid border, 1 → 2px · corner 2 → 4px · field 44 → 88px</div></div></div>
      <div><div style="font-family:${MONO};font-size:32px;font-weight:500;line-height:1.25;color:${C.navy};margin-bottom:12px">Focused</div><div style="width:100%;height:88px;box-sizing:border-box;padding:0 24px 0 28px;border:2px solid ${C.navy};border-radius:4px;background:${C['surface-raised']};box-shadow:0 0 0 4px ${C.mist},0 0 0 8px ${C['magenta-mid']};display:flex;align-items:center;justify-content:space-between"><span style="font-family:${MONO};font-size:36px;font-weight:500;color:${C['slate-deep']}">Select one</span><svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7 12L16 21L25 12" stroke="${C.navy}" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter"/></svg></div><div style="margin-top:24px"><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']}">keyboard focus, list still closed · navy border · magenta-mid ring 2 + 2 → 4 + 4px, the gap in the ground colour</div></div></div>
      <div><div style="font-family:${MONO};font-size:32px;font-weight:500;line-height:1.25;color:${C.navy};margin-bottom:12px">Error</div><div style="width:100%;height:88px;box-sizing:border-box;padding:0 24px 0 28px;border:2px solid ${C['magenta-deep']};border-radius:4px;background:${C['surface-raised']};display:flex;align-items:center;justify-content:space-between"><span style="font-family:${MONO};font-size:36px;font-weight:500;color:${C.navy}">3 selected</span><svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7 12L16 21L25 12" stroke="${C.navy}" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter"/></svg></div><div style="margin-top:20px;display:flex;align-items:center;gap:12px"><svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="14" cy="14" r="11.5" stroke="${C['magenta-deep']}" stroke-width="3.5"/><path d="M14 8.5V15" stroke="${C['magenta-deep']}" stroke-width="3.5" stroke-linecap="square"/><circle cx="14" cy="19.5" r="1.8" fill="${C['magenta-deep']}"/></svg><span style="font-family:${MONO};font-size:32px;line-height:1.3;color:${C['magenta-deep']};white-space:nowrap">Pick one ground.</span></div><div style="margin-top:24px"><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']}">closed, after leaving the field · magenta-deep at the same border width · circled exclamation and a message, never a heavier border</div></div></div>
    </div></div>
  </div>

  <div style="display:flex;flex-direction:column;gap:16px">
    <div style="font-family:${MONO};font-size:12px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${C['slate-deep']}">02 · The open list · chevron up</div>
    <div style="background:${C.mist};padding:40px"><div style="display:grid;grid-template-columns:600px minmax(0, 1fr);column-gap:64px;align-items:start">
      <div><div style="font-family:${MONO};font-size:32px;font-weight:500;line-height:1.25;color:${C.navy};margin-bottom:12px">Ground</div><div style="width:100%;height:88px;box-sizing:border-box;padding:0 24px 0 28px;border:2px solid ${C.navy};border-radius:4px;background:${C['surface-raised']};box-shadow:0 0 0 4px ${C.mist},0 0 0 8px ${C['magenta-mid']};display:flex;align-items:center;justify-content:space-between"><span style="font-family:${MONO};font-size:36px;font-weight:500;color:${C.navy}">2 selected</span><svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7 20L16 11L25 20" stroke="${C.navy}" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter"/></svg></div><div style="margin-top:20px;padding:8px 0;background:${C['surface-raised']};border:2px solid ${C['rule-paper']};border-radius:4px;box-shadow:0 16px 40px ${SHADOW};display:flex;flex-direction:column"><div style="position:relative;height:64px;margin:0 0px;padding:0 28px;box-sizing:border-box;border-radius:0px;display:flex;align-items:center;gap:20px;background:${C['surface-raised']}"><span aria-hidden="true" style="width:30px;height:30px;flex-shrink:0;box-sizing:border-box;border-radius:2px;background:${C.navy};display:flex;align-items:center;justify-content:center"><svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 15.5L13 20.5L22.5 10" stroke="${C.paper}" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter"/></svg></span><span style="font-family:${MONO};font-size:36px;line-height:1;color:${C.navy}">paper</span></div><div style="position:relative;height:64px;margin:0 0px;padding:0 28px;box-sizing:border-box;border-radius:0px;display:flex;align-items:center;gap:20px;background:${C['surface-hover']}"><span aria-hidden="true" style="width:30px;height:30px;flex-shrink:0;box-sizing:border-box;border-radius:2px;background:${C.navy};display:flex;align-items:center;justify-content:center"><svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 15.5L13 20.5L22.5 10" stroke="${C.paper}" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter"/></svg></span><span style="font-family:${MONO};font-size:36px;line-height:1;color:${C.navy}">navy</span><svg width="30" height="42" viewBox="-2 -2 30 42" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="position:absolute;left:182px;top:24px"><path d="M0 0V30L7.5 23.5L12.5 35L18 32.6L13 21.5H23Z" fill="${C.navy}" stroke="${C['surface-raised']}" stroke-width="2.5" stroke-linejoin="round"/></svg></div><div style="position:relative;height:64px;margin:0 0px;padding:0 28px;box-sizing:border-box;border-radius:0px;display:flex;align-items:center;gap:20px;background:${C['surface-raised']}"><span aria-hidden="true" style="width:30px;height:30px;flex-shrink:0;box-sizing:border-box;border-radius:2px;background:${C['surface-raised']};border:2px solid ${C['slate-mid']}"></span><span style="font-family:${MONO};font-size:36px;line-height:1;color:${C.navy}">mist</span></div></div></div>
      <div style="display:flex;flex-direction:column;gap:16px;padding-top:52px">
        <div style="display:flex;flex-direction:column;gap:6px;border-top:1px solid ${C['rule-paper']};padding-top:12px"><div style="font-family:${ARCH};font-size:18px;font-weight:800;color:${C.navy}">Row</div><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']}">32 → 64px · flush to the list edge · square corners · text 18 → 36px</div></div>
        <div style="display:flex;flex-direction:column;gap:6px;border-top:1px solid ${C['rule-paper']};padding-top:12px"><div style="font-family:${ARCH};font-size:18px;font-weight:800;color:${C.navy}">Checkbox</div><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']}">15 → 30px · corner 1 → 2px · navy when checked · sits under the field's value</div></div>
        <div style="display:flex;flex-direction:column;gap:6px;border-top:1px solid ${C['rule-paper']};padding-top:12px"><div style="font-family:${ARCH};font-size:18px;font-weight:800;color:${C.navy}">Hover</div><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']}">surface.hover on one row, the one under the pointer, as a full-width band</div></div>
        <div style="display:flex;flex-direction:column;gap:6px;border-top:1px solid ${C['rule-paper']};padding-top:12px"><div style="font-family:${ARCH};font-size:18px;font-weight:800;color:${C.navy}">List</div><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']}">rule-paper border · corner 2 → 4px · offset 10 → 20px · the brand's only shadow</div></div>
      </div>
    </div></div>
  </div>

  <div style="display:flex;flex-direction:column;gap:16px">
    <div style="font-family:${MONO};font-size:12px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${C['slate-deep']}">03 · Primitives</div>
    <div style="display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));column-gap:24px">
      <div style="background:${C.paper};border:1px solid ${C['rule-paper']};padding:24px;display:flex;flex-direction:column;gap:16px"><div style="font-family:${ARCH};font-size:18px;font-weight:800;color:${C.navy}">Corners</div><div style="display:flex;gap:24px"><div style="display:flex;flex-direction:column;gap:8px;align-items:flex-start"><div style="width:72px;height:72px;box-sizing:border-box;border:2px solid ${C.navy};border-radius:4px;background:${C['surface-raised']}"></div><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C.navy}">4px · field, list</div></div><div style="display:flex;flex-direction:column;gap:8px;align-items:flex-start"><div style="width:72px;height:72px;box-sizing:border-box;border:2px solid ${C.navy};border-radius:2px;background:${C['surface-raised']}"></div><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C.navy}">2px · checkbox</div></div><div style="display:flex;flex-direction:column;gap:8px;align-items:flex-start"><div style="width:72px;height:72px;box-sizing:border-box;border:2px solid ${C.navy};border-radius:0px;background:${C['surface-raised']}"></div><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C.navy}">0 · row, post</div></div></div><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']}">Near-square: design and engineering, not playful. Round only for a photo or a circular icon.</div></div>
      <div style="background:${C.paper};border:1px solid ${C['rule-paper']};padding:24px;display:flex;flex-direction:column;gap:16px"><div style="font-family:${ARCH};font-size:18px;font-weight:800;color:${C.navy}">Icons</div><div style="display:flex;gap:24px;align-items:center;height:72px"><svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7 12L16 21L25 12" stroke="${C.navy}" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter"/></svg><svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7 20L16 11L25 20" stroke="${C.navy}" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter"/></svg><span aria-hidden="true" style="width:30px;height:30px;flex-shrink:0;box-sizing:border-box;border-radius:2px;background:${C.navy};display:flex;align-items:center;justify-content:center"><svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 15.5L13 20.5L22.5 10" stroke="${C.paper}" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter"/></svg></span><svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="14" cy="14" r="11.5" stroke="${C['magenta-deep']}" stroke-width="3.5"/><path d="M14 8.5V15" stroke="${C['magenta-deep']}" stroke-width="3.5" stroke-linecap="square"/><circle cx="14" cy="19.5" r="1.8" fill="${C['magenta-deep']}"/></svg></div><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']}">One stroke, 1.75px web → 3.5px on a post · square caps · mitred joins.</div></div>
      <div style="background:${C.paper};border:1px solid ${C['rule-paper']};padding:24px;display:flex;flex-direction:column;gap:16px"><div style="font-family:${ARCH};font-size:18px;font-weight:800;color:${C.navy}">Surfaces</div><div style="display:flex;gap:12px"><div style="display:flex;flex-direction:column;gap:6px;flex-grow:1;flex-basis:0"><div style="height:56px;background:${C.mist};border:1px solid ${C['rule-paper']}"></div><div style="font-family:${MONO};font-size:12px;font-weight:600;color:${C.navy}">mist</div><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']}">${C.mist} · navy 13.6:1</div></div><div style="display:flex;flex-direction:column;gap:6px;flex-grow:1;flex-basis:0"><div style="height:56px;background:${C['surface-raised']};border:1px solid ${C['rule-paper']}"></div><div style="font-family:${MONO};font-size:12px;font-weight:600;color:${C.navy}">surface-raised</div><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']}">${C['surface-raised']} · navy 16.3:1</div></div><div style="display:flex;flex-direction:column;gap:6px;flex-grow:1;flex-basis:0"><div style="height:56px;background:${C['surface-hover']};border:1px solid ${C['rule-paper']}"></div><div style="font-family:${MONO};font-size:12px;font-weight:600;color:${C.navy}">surface-hover</div><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']}">${C['surface-hover']} · navy 14.2:1</div></div></div><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']}">White lifts 1.2:1 off mist with no effect.</div></div>
      <div style="background:${C.paper};border:1px solid ${C['rule-paper']};padding:24px;display:flex;flex-direction:column;gap:16px"><div style="font-family:${ARCH};font-size:18px;font-weight:800;color:${C.navy}">Component type</div><div style="display:flex;flex-direction:column;gap:12px"><div style="font-family:${MONO};font-size:36px;font-weight:500;line-height:1;color:${C.navy}">Select one</div><div style="font-family:${MONO};font-size:32px;line-height:1;color:${C.navy}">Pick one ground.</div></div><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']}">control 18 → 36px · helper 16 → 32px, the component floor.</div></div>
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:16px">
    <div style="font-family:${MONO};font-size:12px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${C['slate-deep']}">04 · Signature</div>
    <div style="background:${C.mist};padding:32px"><div style="display:flex;justify-content:space-between;align-items:center;gap:48px">
      <div style="display:flex;align-items:center;gap:20px"><img src="${asset('reference', 'avatar-baked')}" alt="Grace Henriquez" width="96" height="96" style="display:block;width:96px;height:96px;flex-shrink:0"><div style="font-family:${ARCH};font-size:36px;font-weight:700;line-height:1;letter-spacing:-0.01em;color:${C['slate-deep']}">Grace Henriquez</div></div>
      <div style="max-width:620px"><div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']}">96px on a post, about 32px in the phone feed: the size of a comment avatar, still a face. The name sits on the 36px post floor. The avatar is one baked PNG with its circle and ring, so the phone export never has to crop, clip or border it.</div></div>
    </div></div>
  </div>
</div>`
out('Components', page({title:'Components', w:1440, h:1820, body:componentsBody}))

/* ---------- 6. POSTS & CAROUSELS (04 on the canvas) ---------- */
// What the carousel "One sentence per design token" settled for 1080×1350 slides: the grid, the
// type steps, the data marks, the components at post scale, the close, and the print rule.
{
const navyPanel = (inner, extra='') => `<div style="background:${C.navy};padding:40px;display:flex;align-items:center;gap:48px;flex-wrap:wrap;${extra}">${inner}</div>`
const paperPanel = (inner, extra='') => `<div style="background:${C.mist};padding:40px;display:flex;align-items:center;gap:48px;flex-wrap:wrap;${extra}">${inner}</div>`
const note = (t, extra='') => `<div style="font-family:${MONO};font-size:12px;line-height:1.5;color:${C['slate-deep']};${extra}">${t}</div>`
const head = (t) => `<div style="font-family:${ARCH};font-size:18px;font-weight:800;color:${C.navy}">${t}</div>`
const sec = (t) => `<div style="font-family:${MONO};font-size:12px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${C['slate-deep']}">${t}</div>`
const caption = (title, text) => `<div style="display:flex;flex-direction:column;gap:6px;border-top:1px solid ${C['rule-paper']};padding-top:12px">${head(title)}${note(text)}</div>`

// 01 · type: the carousel steps, samples at phone size (÷3), numbers at post size
const GRID = 'display:grid;grid-template-columns:120px minmax(0, 1fr) 100px 100px 240px 90px 100px;column-gap:20px;align-items:baseline'
const steps = [
  {step:'Headline', li:88, face:'Archivo 800 · width 94', lh:'1.00', ls:'-0.025em', use:'The slide’s one claim, two beats, ≤2 lines', fam:ARCH, w:800, st:'94%', sls:'-0.025em'},
  {step:'Subtitle', li:44, face:'JetBrains Mono 500', lh:'1.20', ls:'0', use:'One sentence under it, ≤2 lines; also the call to action', fam:MONO, w:500, sls:'0'},
  {step:'Section', li:36, face:'JetBrains Mono 500', lh:'1.20', ls:'0', use:'A section or table title, one line', fam:MONO, w:500, sls:'0'},
  {step:'Body', li:36, face:'JetBrains Mono 400', lh:'1.33', ls:'0', use:'Rows, steps, cells · 48px lines in a list', fam:MONO, w:400, sls:'0'},
  {step:'Number', li:48, face:'Archivo 700', lh:'1.00', ls:'-0.02em', use:'A count beside its row: totals, ratings', fam:ARCH, w:700, sls:'-0.02em'},
  {step:'Delta', li:64, face:'Archivo 800 · light step', lh:'1.00', ls:'-0.02em', use:'The change on a chart, in its series hue', fam:ARCH, w:800, sls:'-0.02em'},
  {step:'Label', li:32, face:'JetBrains Mono 400 · muted', lh:'1.25', ls:'0', use:'Legend, key, column heads, footnotes · the component floor', fam:MONO, w:400, sls:'0'},
  {step:'Button', li:36, face:'Archivo 700', lh:'1.00', ls:'-0.015em', use:'The pill’s two words', fam:ARCH, w:700, sls:'-0.015em'},
]
const num = v => `<div style="font-family:${MONO};font-size:15px;font-weight:500;color:${C.navy}">${v}</div>`
const cell = v => `<div style="font-family:${MONO};font-size:13px;color:${C.navy}">${v}</div>`
const rows = steps.map(st => `<div style="${GRID};padding:16px 0;border-bottom:1px solid ${C['rule-paper']}">
      <div style="font-family:${ARCH};font-size:22px;font-weight:800;letter-spacing:-0.02em;color:${C.navy}">${st.step}</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="font-family:${st.fam};font-size:${Math.round(st.li/3)}px;font-weight:${st.w};${st.st?`font-stretch:${st.st};`:''}line-height:1;letter-spacing:${st.sls};color:${C.navy}">Handgloves 42</div>
        ${note(st.use)}
      </div>
      ${num(st.li+'px')}${num(Math.round(st.li/3)+'px')}${cell(st.face)}${cell(st.lh)}${cell(st.ls)}
    </div>`).join('\n')

// 02 · marks on navy and on paper
const sq = (fill, ink, filled) => `<span style="width:28px;height:28px;border-radius:2px;box-sizing:border-box;flex-shrink:0;${filled?`background:${ink}`:`border:3px solid ${ink}`}"></span>`
const legend = (ink, muted) => `<div style="display:flex;gap:40px;align-items:center"><span style="display:flex;align-items:center;gap:14px">${sq('',ink,false)}<span style="font-family:${MONO};font-size:32px;color:${muted}">Wrong and doubted</span></span><span style="display:flex;align-items:center;gap:14px">${sq('',ink,true)}<span style="font-family:${MONO};font-size:32px;color:${muted}">Wrong and sure</span></span></div>`
const dot = (fill, ground) => `<span style="width:27px;height:27px;border-radius:50%;box-sizing:border-box;background:${fill};border:5px solid ${ground};flex-shrink:0"></span>`
const ringBadge = (letter, size, ink) => `<span style="width:${size}px;height:${size}px;border-radius:50%;box-sizing:border-box;border:3px solid ${ink};color:${ink};font-family:${ARCH};font-size:${Math.round(size*0.67)}px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${letter}</span>`
const marksNavy = navyPanel(`
  ${legend(C['magenta-light'], C['slate-light'])}
  <div style="display:flex;gap:28px;align-items:center">${dot(C['sky-light'], C.navy)}${dot(C['sand-mid'], C.navy)}<span style="font-family:${MONO};font-size:32px;color:${C['slate-light']}">series on navy</span></div>
  <div style="display:flex;gap:16px;align-items:center">${ringBadge('A',48,C.paper)}${ringBadge('B',48,C.paper)}${ringBadge('1',40,C.paper)}${ringBadge('2',40,C.paper)}</div>`)
const marksPaper = paperPanel(`
  ${legend(C['magenta-deep'], C['slate-deep'])}
  <div style="display:flex;gap:16px;align-items:center">${ringBadge('A',48,C.navy)}${ringBadge('B',48,C.navy)}${ringBadge('1',40,C.navy)}${ringBadge('2',40,C.navy)}</div>`)

// 03 · components at post scale
const chip = (t, look) => `<span style="font-family:${MONO};font-size:36px;line-height:1;border-radius:4px;white-space:nowrap;${look}">${t}</span>`
const chipPlain = chip('sys.signal.bg', `border:2px solid ${C['rule-paper']};background:${C['surface-raised']};color:${C.navy};padding:9px 15px`)
const chipWrong = chip('sys.action.primary.bg', `border:3px solid ${C['magenta-deep']};background:${C['surface-raised']};color:${C.navy};padding:8px 14px`)
const chipSure = chip('sys.action.primary.bg', `border:3px solid ${C['magenta-deep']};background:${C['magenta-deep']};color:${C.paper};padding:8px 14px`)
const query = `<span style="font-family:${MONO};font-size:32px;line-height:1;background:${C.mist};border-radius:4px;padding:11px 17px;white-space:nowrap;color:${C.navy}">the fill of a progress bar, 3 of 5 steps done</span>`
const tableRow = `<div style="display:flex;flex-direction:column;width:100%;border-top:2px solid ${C['slate-mid']}">
    <div style="display:flex;align-items:center;height:40px;border-bottom:2px solid ${C['slate-mid']};font-family:${MONO};font-size:32px;color:${C['slate-deep']}"><span style="width:248px">Run</span><span style="flex-grow:1">Picked</span><span>Rated</span></div>
    <div style="display:flex;align-items:center;height:80px;border-bottom:2px solid ${C['rule-paper']}"><span style="width:248px;font-family:${MONO};font-size:36px;font-weight:500;color:${C.navy}">Haiku 4.5</span><span style="flex-grow:1">${chipSure}</span><span style="font-family:${ARCH};font-size:48px;font-weight:700;letter-spacing:-0.02em;color:${C.navy}">3</span></div>
    <div style="display:flex;align-items:center;height:80px;border-bottom:2px solid ${C['slate-mid']}"><span style="width:248px;font-family:${MONO};font-size:36px;font-weight:500;color:${C.navy}">Sonnet 5</span><span style="flex-grow:1;font-family:${MONO};font-size:36px;color:${C.navy};padding-left:17px">sys.signal.bg</span><span style="font-family:${ARCH};font-size:48px;font-weight:700;letter-spacing:-0.02em;color:${C.navy}">2</span></div>
  </div>`
const bar = (segs) => `<svg width="660" height="60" viewBox="0 0 660 60" style="display:block">${segs.map(([x,w,fill,stroke,label,ink])=>`${stroke?`<rect x="${x+1.5}" y="1.5" width="${w-3}" height="57" rx="6" fill="none" stroke="${stroke}" stroke-width="3"/>`:`<rect x="${x}" y="0" width="${w}" height="60" rx="6" fill="${fill}"/>`}<text x="${x+18}" y="44" font-family="${MONO}" font-size="40" font-weight="500" fill="${ink}">${label}</text>`).join('')}</svg>`
const barsNavy = navyPanel(`
  <div style="display:flex;flex-direction:column;gap:16px">
    <div style="display:flex;align-items:center;gap:16px">${ringBadge('A',36,C.paper)}${bar([[0,446,'',C['slate-light'],'11 doubted',C['slate-light']],[450,210,C['magenta-light'],'','5 sure',C.navy]])}<span style="font-family:${ARCH};font-size:48px;font-weight:700;color:${C.paper}">16</span></div>
    <div style="display:flex;align-items:center;gap:16px">${ringBadge('B',36,C.paper)}${bar([[0,660,C['magenta-light'],'','3 sure',C.navy]])}<span style="font-family:${ARCH};font-size:48px;font-weight:700;color:${C.paper}">3</span></div>
  </div>`)

// 04 · the close
const avatar = (ink) => `<img src="${asset('reference', 'avatar')}" alt="Grace Henriquez" style="width:112px;height:112px;border-radius:50%;object-fit:cover;border:4px solid ${ink};box-sizing:border-box;flex-shrink:0">`
const pill = (t, fill, ink, down) => `<span style="display:inline-flex;align-items:center;gap:16px;height:64px;padding:0 24px 0 32px;border-radius:32px;background:${fill};color:${ink}"><span style="font-family:${ARCH};font-size:36px;font-weight:700;letter-spacing:-0.015em;white-space:nowrap">${t}</span><svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><path d="${down?'M16 4v22M7 18l9 9 9-9':'M4 16h22M18 7l9 9-9 9'}" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`
const closeRow = (ground, ink, fill, t, down) => `<div style="background:${ground};padding:40px 80px;display:flex;align-items:center;justify-content:space-between;gap:32px;${ground === C.paper ? `border:1px solid ${C['rule-paper']};` : ''}">
    <div style="display:flex;align-items:center;gap:20px">${avatar(ink)}<span style="font-family:${ARCH};font-size:44px;font-weight:700;letter-spacing:-0.02em;color:${ink}">Grace Henriquez</span></div>
    ${pill(t, fill, ground, down)}
  </div>`

const POSTS_H = 3400
const postsBody = `<div style="width:1440px;height:${POSTS_H}px;box-sizing:border-box;padding:56px 64px;display:flex;flex-direction:column;gap:40px;background:${C.paper}">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:40px">
    <div style="display:flex;flex-direction:column;gap:14px">
      ${eyebrow('Cucusa · brand identity v2 · 04 posts & carousels')}
      ${h('Dark by default, 80px in.', 64, C.navy, 800, 'white-space:nowrap')}
    </div>
    ${note('1080×1350 slides, 80px of padding (LinkedIn’s arrow and counter zone), one 920px column. Navy with paper type, and one paper slide in a carousel where the reader should look closely. Three groups on a slide: the statement, the evidence, the close; the key and the legend sit at the foot of the evidence, 62px above the close, the same block on every slide.', 'font-size:13px;max-width:460px')}
  </div>

  <div style="display:flex;flex-direction:column;gap:16px">
    ${sec('01 · Type on a slide · samples at phone size')}
    <div style="display:flex;flex-direction:column;border-top:3px solid ${C.navy}">
      <div style="${GRID};padding:12px 0;border-bottom:1px solid ${C.navy}">
        ${['Step','Rendered on a phone','1080 slide','Phone ÷3','Face · weight','Leading','Tracking'].map(t=>`<div style="font-family:${MONO};font-size:11px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:${C['slate-deep']}">${t}</div>`).join('')}
      </div>
      ${rows}
    </div>
    ${note('The post scale’s Body (44) is the carousel’s subtitle and its Label (36) is the carousel’s body: a data slide holds more than a statement post, so it steps down once and takes the 32px component floor for everything that explains a mark. Mono stays at 400 for reading, 500 for a title; Archivo carries the headline, the numbers and the button.')}
  </div>

  <div style="display:flex;flex-direction:column;gap:16px">
    ${sec('02 · Marks · the same two words on every slide')}
    <div style="display:flex;flex-direction:column;gap:16px">${marksNavy}${marksPaper}</div>
    <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));column-gap:24px">
      ${caption('Alarm', 'Magenta is the alarm, in the hue’s text step for the ground: magenta-light on navy, magenta-deep on paper. An outline is the lesser state, a fill the greater: “Wrong and doubted”, “Wrong and sure”. Right answers wear nothing; a title says which answer is right.')}
      ${caption('Series', 'Chart series on navy: sky-light and sand-mid, apart in lightness as well as hue, each labelled by name at its line’s end so identity never depends on colour. Dots take a 5px ring in the ground; deltas sit in the hue’s light step.')}
      ${caption('Ring badges', 'A and B, or a step number, in a 48px ring (40px in the key), the letter in Archivo 800 at two thirds of the ring. The one round shape besides a photo: it is a marker, not type.')}
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:16px">
    ${sec('03 · Components at post scale · 2× web, from components.json')}
    ${paperPanel(`<div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">${chipPlain}${chipWrong}${chipSure}${query}</div>${tableRow}`, 'flex-direction:column;align-items:stretch;gap:32px')}
    ${barsNavy}
    <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));column-gap:24px">
      ${caption('Token chip', 'The field at 36px: white on a 2px rule-paper line, 4px corners. A wrong answer takes a 3px magenta line, a wrong and sure one the magenta fill with paper text. A query sits on mist with no line, at 32px.')}
      ${caption('Table', '80px rows when a row holds a 36px chip (64px otherwise), a 40px head in the label voice, slate-mid rules at the head and between groups, rule-paper between rows, a badge spanning its group, the number in Archivo 700 at 48.')}
      ${caption('Stacked bar', '660×60, 6px corners, segments 4px apart, the label inside when it fits: the doubted segment outlined, the sure one filled, the total beside the bar in Archivo 700 at 48.')}
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:16px">
    ${sec('04 · The close · author left, the next move right')}
    <div style="display:flex;flex-direction:column;gap:16px">${closeRow(C.navy, C.paper, C['magenta-light'], 'The catch', false)}${closeRow(C.paper, C.navy, C['magenta-deep'], 'Why', false)}${closeRow(C.navy, C.paper, C['magenta-light'], 'Comments', true)}</div>
    <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));column-gap:24px">
      ${caption('Lockup on a slide', '112px avatar (37px on a phone), a 4px ring in the ink, the name in Archivo 700 at 44 in the ink. The single-post signature stays 96px with a slate-deep name: a slide is read in a document viewer at a smaller scale than a post in the feed.')}
      ${caption('Pill', 'Two words in Archivo 700 at 36, 64px tall, fully round, magenta in the ground’s text step with the ground’s colour as its type. It names the next slide (“The catch”, “See the mistake”, “Why”); the last slide points down at the comments. No rule above the close: 62px of air separates it.')}
      ${caption('Print', 'One PDF, one page per slide at 1080×1350, fonts embedded. LinkedIn’s viewer rasterises vector curves and clipped images roughly, so the printed pages place baked PNGs (4×, with alpha) for the avatar, the ring badges, the dots and the pill ends. Export name: grace-henriquez-linkedin-carousel-1080x1350-&lt;slug&gt;-NN-&lt;name&gt;.')}
    </div>
  </div>
</div>`
out('Posts-Carousels', page({title:'Posts & carousels', w:1440, h:POSTS_H, body:postsBody}))
}
