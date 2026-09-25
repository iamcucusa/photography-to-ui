/**
 * Brand palette v2 — the solver.
 *
 * Every hue has three steps, and every step is SOLVED to a relative-luminance
 * target rather than picked by eye, so each step has exactly one job:
 *
 *   deep  (Y ≈ 0.112)  text on paper, and the ground under paper text   ≥ 5.7:1
 *   mid   (Y 0.15–0.25) lines, shapes, chart series: ≥ 3:1 on paper AND on navy
 *   light (Y ≈ 0.335)  text on navy, and the ground under navy text     ≥ 6:1
 *
 * The mid steps are staggered in luminance (sky < magenta ≈ slate < sand) so
 * categorical series differ in lightness, not hue alone.
 *
 * This file is the source of truth for the values. It writes palette.json
 * (DTCG-shaped, with the ratios in an extension) and prints the pairing report.
 *
 *   node brand/palette.mjs            regenerate palette.json
 *   node brand/palette.mjs --check    exit 1 if palette.json is stale
 *
 * Zero dependencies. Not wired into the token pipeline yet: see brand/CLAUDE.md.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(HERE, 'palette.json')

// ── WCAG 2.x math ──────────────────────────────────────────────────
const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const lumRGB = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const hex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()
const parse = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
export const luminance = (h) => lumRGB(parse(h))
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function hsl(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

/** Binary-search HSL lightness until the colour hits the luminance target. */
function solve(h, s, Y) {
  let lo = 0, hi = 1
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (lumRGB(hsl(h, s, mid)) < Y) lo = mid
    else hi = mid
  }
  return hex(hsl(h, s, (lo + hi) / 2))
}

// ── The spec: hue, saturation, luminance target ────────────────────
const GROUNDS = {
  paper: { value: '#FBFAF7', description: 'Default ground. Near-white with a trace of warmth so a post edge stays visible on a white feed.' },
  navy: { value: '#10203A', description: 'Ink on paper, and the dark ground. The professional layer.' },
}
const RULES = {
  paper: { value: '#D9D4CB', description: 'Decorative dividers on paper. Structural lines use slate-mid.' },
  navy: { value: '#2A3D56', description: 'Decorative dividers and grids on navy. Structural lines use slate-light.' },
}
const HUES = {
  magenta: { h: 335, s: { deep: 0.8, mid: 0.74, light: 0.8 }, Y: { deep: 0.112, mid: 0.195, light: 0.335 },
    meaning: 'Strength, energy, resilience, fashion. The hero colour: it carries statements, never decoration.' },
  sky: { h: 206, s: 0.64, Y: { deep: 0.112, mid: 0.15, light: 0.335 },
    meaning: 'Empathy, transparency, solidarity. Structure and explanation: diagrams, links, secondary emphasis.' },
  sand: { h: 30, s: 0.66, Y: { deep: 0.112, mid: 0.25, light: 0.335 },
    meaning: 'Warmth and Cuban inheritance. Callouts, highlights, the human note inside technical content.' },
  slate: { h: 214, s: 0.18, Y: { deep: 0.112, mid: 0.195, light: 0.4 },
    meaning: 'Professional neutral tinted toward navy. Secondary text, axes, captions, chrome.' },
}
const STEP_ROLE = {
  deep: 'Text on paper; ground for paper text.',
  mid: 'Lines, shapes, chart series: ≥ 3:1 on both grounds. Never body copy.',
  light: 'Text on navy; ground for navy text.',
}

// ── Build the DTCG document ────────────────────────────────────────
export function buildPalette() {
  const P = GROUNDS.paper.value, N = GROUNDS.navy.value
  const ext = (v) => ({
    'com.cucusa.brand': {
      luminance: +luminance(v).toFixed(3),
      onPaper: +contrast(P, v).toFixed(2),
      onNavy: +contrast(N, v).toFixed(2),
    },
  })
  const token = (value, description) => ({ $value: value, $description: description, $extensions: ext(value) })
  const color = { $type: 'color' }
  color.paper = token(P, GROUNDS.paper.description)
  color.navy = token(N, GROUNDS.navy.description)
  color.rule = { paper: token(RULES.paper.value, RULES.paper.description), navy: token(RULES.navy.value, RULES.navy.description) }
  for (const [name, spec] of Object.entries(HUES)) {
    color[name] = { $description: spec.meaning }
    for (const step of ['deep', 'mid', 'light']) {
      const s = typeof spec.s === 'number' ? spec.s : spec.s[step]
      color[name][step] = token(solve(spec.h, s, spec.Y[step]), STEP_ROLE[step])
    }
  }
  return {
    $schema: 'https://tr.designtokens.org/format/',
    $description: 'Cucusa brand palette v2 — social-first, solved to luminance targets. Generated by brand/palette.mjs; do not edit by hand.',
    color,
  }
}

/** Flat map for scripts: paper, navy, rule-paper, rule-navy, magenta-deep, … */
export function flat(doc = buildPalette()) {
  const out = {}
  for (const [k, v] of Object.entries(doc.color)) {
    if (k.startsWith('$')) continue
    if (v.$value) out[k] = v.$value
    else for (const [s, t] of Object.entries(v)) if (!s.startsWith('$')) out[`${k}-${s}`] = t.$value
  }
  return out
}

// ── CLI ────────────────────────────────────────────────────────────
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const doc = buildPalette()
  const json = JSON.stringify(doc, null, 2) + '\n'
  if (process.argv.includes('--check')) {
    let current = ''
    try { current = readFileSync(OUT, 'utf8') } catch {}
    if (current !== json) { console.error('brand/palette.json is stale — run: node brand/palette.mjs'); process.exit(1) }
    console.log('✔ brand/palette.json is up to date')
    process.exit(0)
  }
  writeFileSync(OUT, json)
  const C = flat(doc)
  const f = (x) => x.toFixed(1).padStart(5)
  console.log('wrote brand/palette.json\n')
  console.log('hue       deep on paper   paper on deep   light on navy   navy on light   mid on paper   mid on navy')
  for (const h of Object.keys(HUES)) {
    console.log(
      h.padEnd(9),
      f(contrast(C.paper, C[`${h}-deep`])), '        ', f(contrast(C[`${h}-deep`], C.paper)), '        ',
      f(contrast(C.navy, C[`${h}-light`])), '        ', f(contrast(C[`${h}-light`], C.navy)), '        ',
      f(contrast(C.paper, C[`${h}-mid`])), '       ', f(contrast(C.navy, C[`${h}-mid`])),
    )
  }
  console.log('\npaper / navy', f(contrast(C.paper, C.navy)))
}
