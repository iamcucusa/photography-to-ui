import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import StyleDictionary from 'style-dictionary'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Custom Transforms ──────────────────────────────────────────────
//
// Extension namespaces:
//   com.cucusa.colorMix  — structured color derivation recipe (color1, amount1, color2, amount2, space)
//   com.cucusa.platform  — per-platform value overrides ({ css: "..." })
//
// ── Transform ordering ─────────────────────────────────────────────
//
// SD4 runs transforms in the order listed. Each matching transform replaces $value.
// Ordering constraints:
//
//   1. attribute/cti, name/kebab — SD4 built-ins, must be first (set token path + CSS name)
//   2. cucusa/platform-css      — MUST be before all type-specific transforms.
//                                  Replaces $value with a raw CSS string (e.g. clamp(), color-mix()).
//                                  All type-specific transforms MUST guard against this:
//                                  they check !hasPlatformOverride(token) to avoid parsing
//                                  the raw CSS string as a DTCG composite/value.
//   3. cucusa/color-mix         — structured derivation, never overlaps with platform overrides
//   4. cucusa/shadow-css        — composite → CSS shorthand (guarded)
//   5. cucusa/border-css        — composite → CSS shorthand (guarded)
//   6. cucusa/duration-css      — ms → seconds (guarded)
//   7. cucusa/easing-css        — array → cubic-bezier() (guarded)
//   8. cucusa/font-family-css   — array → quoted font stack (guarded)
//   9. color/css                — SD4 built-in, must be last (custom transforms take precedence)
//
// If you add a new type-specific transform, always include the hasPlatformOverride guard.
// Without it, a future platform override on that token type will silently break.

function resolveRefToCssVar(ref) {
  if (ref === 'transparent') return 'transparent'
  const match = ref.match(/^\{(.+)\}$/)
  if (!match) return ref
  return `var(--${match[1].replace(/\./g, '-')})`
}

// Guard: returns true when a token has a CSS platform override.
// Used by all type-specific transforms to skip tokens already handled by platform-css.
function hasPlatformOverride(token) {
  return Boolean(token.$extensions?.['com.cucusa.platform']?.css)
}

// ── 2. Platform override ───────────────────────────────────────────
// Uses $extensions.com.cucusa.platform.css when building for CSS.
// For CSS functions (clamp, calc, min/max) or values DTCG can't express.
// The token's $value must still be a valid DTCG fallback for non-CSS consumers.
StyleDictionary.registerTransform({
  name: 'cucusa/platform-css',
  type: 'value',
  transitive: true,
  filter: (token) => hasPlatformOverride(token),
  transform: (token) => token.$extensions['com.cucusa.platform'].css,
})

// ── 3. Color-mix derivation ────────────────────────────────────────
// Reads $extensions.com.cucusa.colorMix and generates color-mix() CSS.
// Does not overlap with platform overrides (a token has one or the other, never both).
StyleDictionary.registerTransform({
  name: 'cucusa/color-mix',
  type: 'value',
  transitive: true,
  filter: (token) => token.$extensions?.['com.cucusa.colorMix'],
  transform: (token) => {
    const mix = token.$extensions['com.cucusa.colorMix']
    const c1 = resolveRefToCssVar(mix.color1)
    const c2 = resolveRefToCssVar(mix.color2)
    const a1 = mix.amount1
    const a2 = mix.amount2
    if (a2) {
      return `color-mix(in ${mix.space}, ${c1} ${a1}, ${c2} ${a2})`
    }
    return `color-mix(in ${mix.space}, ${c1} ${a1}, ${c2})`
  },
})

// ── 4. Shadow composite → CSS ──────────────────────────────────────
StyleDictionary.registerTransform({
  name: 'cucusa/shadow-css',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'shadow' && !hasPlatformOverride(token),
  transform: (token) => {
    const toCSS = (s) =>
      `${s.offsetX} ${s.offsetY} ${s.blur}${s.spread && s.spread !== '0' ? ` ${s.spread}` : ''} ${s.color}`
    const val = token.$value
    if (Array.isArray(val)) return val.map(toCSS).join(', ')
    return toCSS(val)
  },
})

// ── 5. Border composite → CSS ──────────────────────────────────────
StyleDictionary.registerTransform({
  name: 'cucusa/border-css',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'border' && !hasPlatformOverride(token),
  transform: (token) => {
    const v = token.$value
    const color =
      typeof v.color === 'string' && v.color.startsWith('{')
        ? resolveRefToCssVar(v.color)
        : v.color
    return `${v.width} ${v.style} ${color}`
  },
})

// ── 6. Duration ms → CSS seconds ───────────────────────────────────
StyleDictionary.registerTransform({
  name: 'cucusa/duration-css',
  type: 'value',
  filter: (token) => token.$type === 'duration' && !hasPlatformOverride(token),
  transform: (token) => {
    const ms = parseInt(token.$value, 10)
    return `${ms / 1000}s`
  },
})

// ── 7. CubicBezier → CSS ──────────────────────────────────────────
StyleDictionary.registerTransform({
  name: 'cucusa/easing-css',
  type: 'value',
  filter: (token) => token.$type === 'cubicBezier' && !hasPlatformOverride(token),
  transform: (token) => {
    const [x1, y1, x2, y2] = token.$value
    // CSS ease keyword = cubic-bezier(0.25, 0.1, 0.25, 1)
    if (x1 === 0.25 && y1 === 0.1 && x2 === 0.25 && y2 === 1) return 'ease'
    return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`
  },
})

// ── 8. FontFamily array → CSS ──────────────────────────────────────
StyleDictionary.registerTransform({
  name: 'cucusa/font-family-css',
  type: 'value',
  filter: (token) => token.$type === 'fontFamily' && !hasPlatformOverride(token),
  transform: (token) => {
    return token.$value
      .map((f) => (f.includes(' ') ? `'${f}'` : f))
      .join(', ')
  },
})

// ── Build Config ───────────────────────────────────────────────────

const sd = new StyleDictionary({
  log: { verbosity: 'default', warnings: 'disabled' },
  source: [resolve(__dirname, './**/*.json')],
  platforms: {
    css: {
      transforms: [
        // 1. SD4 built-ins — token path and CSS variable naming
        'attribute/cti',
        'name/kebab',
        // 2. Platform override — must be before type-specific transforms
        'cucusa/platform-css',
        // 3. Structured color derivation
        'cucusa/color-mix',
        // 4–8. Type-specific transforms (all guarded against platform overrides)
        'cucusa/shadow-css',
        'cucusa/border-css',
        'cucusa/duration-css',
        'cucusa/easing-css',
        'cucusa/font-family-css',
        // 9. SD4 built-in color format — last so custom transforms take precedence
        'color/css',
      ],
      buildPath: resolve(__dirname, 'dist') + '/',
      options: {
        usesDtcg: true,
      },
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
  },
})

await sd.buildAllPlatforms()
