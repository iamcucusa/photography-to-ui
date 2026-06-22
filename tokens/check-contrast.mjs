/**
 * Contrast contract checker — the executable version of the contract in
 * tokens/CLAUDE.md, verified per mode.
 *
 * Contract:
 *   - text.primary/secondary/muted/accent ≥ 4.5:1 on canvas, surface, elevated
 *   - text.on-accent ≥ 4.5:1 on the accent fill
 *   - border-accent* ≥ 3:1 vs canvas (WCAG 1.4.11 — they signal interactivity)
 *   - focus-ring.color ≥ 3:1 vs canvas and surface
 *
 * Resolves DTCG refs and com.cucusa.colorMix recipes from source, applies
 * modes/<mode>/ overrides, composites alpha over the surface under test.
 *
 * Run: npm run check:contrast (from workspace root)
 * Flags: --report <path>  write the full matrix as JSON (consumed by docs)
 * Zero dependencies. Exits non-zero on failure.
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Token loading ──────────────────────────────────────────────────

const BASE_FILES = [
  'color/primitives.json',
  'color/semantic.json',
  'color/derived.json',
  'shape.json',
  'backdrop.json',
]

function walk(obj, path, out) {
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue
    if (typeof val !== 'object' || val === null) continue
    const tokenPath = path ? `${path}.${key}` : key
    if (val.$value !== undefined) out.set(tokenPath, val)
    else walk(val, tokenPath, out)
  }
}

function loadTokens(mode) {
  const map = new Map()
  for (const file of BASE_FILES) {
    walk(JSON.parse(readFileSync(resolve(__dirname, file), 'utf-8')), '', map)
  }
  if (mode !== 'dark') {
    const modeDir = resolve(__dirname, 'modes', mode)
    if (existsSync(modeDir)) {
      for (const entry of readdirSync(modeDir)) {
        if (!entry.endsWith('.json')) continue
        const overrides = new Map()
        walk(JSON.parse(readFileSync(resolve(modeDir, entry), 'utf-8')), '', overrides)
        for (const [path, token] of overrides) map.set(path, token)
      }
    }
  }
  return map
}

// ── Color resolution ───────────────────────────────────────────────

function parseHex(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
  return { r, g, b, a }
}

function resolveColor(pathOrValue, tokens, seen = new Set()) {
  if (pathOrValue === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }

  let token = null
  let value = pathOrValue
  const refMatch = typeof value === 'string' && value.match(/^\{(.+)\}$/)
  if (refMatch || tokens.has(value)) {
    const path = refMatch ? refMatch[1] : value
    if (seen.has(path)) throw new Error(`circular reference at ${path}`)
    seen.add(path)
    token = tokens.get(path)
    if (!token) throw new Error(`unresolved path: ${path}`)
    value = token.$value
  }

  const mix = token?.$extensions?.['com.cucusa.colorMix']
  if (mix) {
    const c1 = resolveColor(mix.color1, tokens, new Set(seen))
    const c2 = resolveColor(mix.color2, tokens, new Set(seen))
    const w1 = parseFloat(mix.amount1) / 100
    const w2 = mix.amount2 ? parseFloat(mix.amount2) / 100 : 1 - w1
    if (mix.color2 === 'transparent') {
      // color-mix(in srgb, C p%, transparent) → C at alpha p
      return { r: c1.r, g: c1.g, b: c1.b, a: c1.a * w1 }
    }
    const total = w1 + w2
    return {
      r: (c1.r * w1 + c2.r * w2) / total,
      g: (c1.g * w1 + c2.g * w2) / total,
      b: (c1.b * w1 + c2.b * w2) / total,
      a: (c1.a * w1 + c2.a * w2) / total,
    }
  }

  if (typeof value === 'string' && value.startsWith('#')) return parseHex(value)
  if (typeof value === 'string' && value.match(/^\{(.+)\}$/)) {
    return resolveColor(value, tokens, seen)
  }
  throw new Error(`cannot resolve color value: ${JSON.stringify(value)}`)
}

// ── WCAG math ──────────────────────────────────────────────────────

const channelLin = (c) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

const luminance = ({ r, g, b }) =>
  0.2126 * channelLin(r) + 0.7152 * channelLin(g) + 0.0722 * channelLin(b)

const composite = (fg, bg) => ({
  r: fg.r * fg.a + bg.r * (1 - fg.a),
  g: fg.g * fg.a + bg.g * (1 - fg.a),
  b: fg.b * fg.a + bg.b * (1 - fg.a),
  a: 1,
})

function contrast(fg, bg) {
  const f = fg.a < 1 ? composite(fg, bg) : fg
  const [hi, lo] = [luminance(f), luminance(bg)].sort((a, b) => b - a)
  return (hi + 0.05) / (lo + 0.05)
}

// ── Contract ───────────────────────────────────────────────────────

const TEXT_ROLES = [
  'color.text.primary',
  'color.text.secondary',
  'color.text.muted',
  'color.text.accent',
  'color.text.cool',
]
const SURFACES = ['color.bg.canvas', 'color.bg.surface', 'color.bg.elevated']
const INTERACTIVE_BORDERS = [
  'color.border-accent',
  'color.border-accent-hover',
  'color.border-accent-strong',
  'color.border-accent-highlight',
]

function runMode(mode) {
  const tokens = loadTokens(mode)
  const results = []
  const check = (label, fgPath, bgPath, min) => {
    const bg = composite(resolveColor(bgPath, tokens), resolveColor('color.bg.canvas', tokens))
    const ratio = contrast(resolveColor(fgPath, tokens), bg)
    results.push({ mode, label, fg: fgPath, bg: bgPath, ratio: +ratio.toFixed(2), min, pass: ratio >= min })
  }

  for (const surface of SURFACES) {
    for (const role of TEXT_ROLES) {
      check(`${role.split('.').pop()} on ${surface.split('.').pop()}`, role, surface, 4.5)
    }
  }
  check('on-accent on accent fill', 'color.text.on-accent', 'color.accent', 4.5)
  for (const border of INTERACTIVE_BORDERS) {
    check(`${border.split('.').pop()} vs canvas`, border, 'color.bg.canvas', 3)
  }
  check('focus-ring vs canvas', 'focus-ring.color', 'color.bg.canvas', 3)
  check('focus-ring vs surface', 'focus-ring.color', 'color.bg.surface', 3)

  return results
}

// Text roles that appear on translucent panels over the photographic backdrop.
const PANEL_TEXT_ROLES = [
  'color.text.primary',
  'color.text.secondary',
  'color.text.muted',
  'color.text.accent',
  'color.text.cool',
]

// Worst-case backdrop check: a translucent panel sits over the bounded backdrop
// (canvas scrim floor -> photo capped at backdrop.photo-opacity -> tint). The
// photo is a photograph, so treat it as either pure black or pure white at its
// cap; if text stays AA in both extremes, contrast is photo-INDEPENDENT.
// Mirrors the .app layer stack in photography-to-ui/src/styles/app.css.
function runBackdrop(mode) {
  const tokens = loadTokens(mode)
  const canvas = resolveColor('color.bg.canvas', tokens)
  const tintMid = resolveColor('color.app-bg-mid', tokens)
  const panel = resolveColor('color.bg.translucent', tokens) // canvas-based, carries the panel alpha
  const photoA = tokens.get('backdrop.photo-opacity').$value
  const tintA = tokens.get('backdrop.tint-opacity').$value

  const BLACK = { r: 0, g: 0, b: 0, a: 1 }
  const WHITE = { r: 255, g: 255, b: 255, a: 1 }
  const results = []

  for (const role of PANEL_TEXT_ROLES) {
    const text = resolveColor(role, tokens)
    let worst = Infinity
    for (const photo of [BLACK, WHITE]) {
      let bd = composite({ ...photo, a: photoA }, canvas) // photo over canvas floor
      bd = composite({ ...tintMid, a: tintA }, bd) // brand tint over the photo
      const panelBg = composite({ r: panel.r, g: panel.g, b: panel.b, a: panel.a }, bd)
      worst = Math.min(worst, contrast(text, panelBg))
    }
    results.push({
      mode,
      label: `${role.split('.').pop()} on panel over photo`,
      fg: role,
      bg: 'bounded-backdrop',
      ratio: +worst.toFixed(2),
      min: 4.5,
      pass: worst >= 4.5,
    })
  }
  return results
}

// ── Run ────────────────────────────────────────────────────────────

const MODES = ['dark', 'light']
const all = []
let failures = 0

for (const mode of MODES) {
  const results = [...runMode(mode), ...runBackdrop(mode)]
  all.push(...results)
  const failed = results.filter((r) => !r.pass)
  failures += failed.length
  console.log(`\n${mode.toUpperCase()} — ${results.length} checks`)
  for (const r of results) {
    const flag = r.pass ? '✔' : '✗'
    console.log(`  ${flag} ${r.ratio.toFixed(2)} (min ${r.min})  ${r.label}`)
  }
}

const reportIdx = process.argv.indexOf('--report')
if (reportIdx !== -1 && process.argv[reportIdx + 1]) {
  const target = resolve(process.cwd(), process.argv[reportIdx + 1])
  writeFileSync(target, JSON.stringify({ generated: 'check-contrast.mjs', checks: all }, null, 2) + '\n')
  console.log(`\nReport written → ${target}`)
}

if (failures > 0) {
  console.log(`\n✗ ${failures} contrast check(s) failed`)
  process.exit(1)
} else {
  console.log(`\n✔ All ${all.length} contrast checks passed (${MODES.join(' + ')})`)
}
