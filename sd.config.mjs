import StyleDictionary from 'style-dictionary'

// ── Custom Transforms ──────────────────────────────────────────────
//
// Extension namespaces:
//   com.cucusa.colorMix  — structured color derivation recipe (color1, amount1, color2, amount2, space)
//   com.cucusa.platform  — per-platform value overrides ({ css: "..." })
//
// Transform ordering matters:
//   1. cucusa/platform-css  — must run first; raw override wins over all type-specific transforms
//   2. cucusa/color-mix     — structured color derivation, generates color-mix() CSS
//   3. cucusa/shadow-css    — DTCG shadow composite → CSS shorthand (skipped if platform override exists)
//   4. cucusa/border-css    — DTCG border composite → CSS shorthand
//   5. type-specific        — duration, easing, fontFamily
//   6. color/css            — built-in color format (last, so custom transforms take precedence)

function resolveRefToCssVar(ref) {
  if (ref === 'transparent') return 'transparent'
  const match = ref.match(/^\{(.+)\}$/)
  if (!match) return ref
  return `var(--${match[1].replace(/\./g, '-')})`
}

// Platform override — uses $extensions.com.cucusa.platform.css when building for CSS.
// Use for CSS functions (clamp, calc, min/max) or values that can't be expressed in DTCG.
// The token's $value must still be a valid DTCG fallback for non-CSS consumers.
StyleDictionary.registerTransform({
  name: 'cucusa/platform-css',
  type: 'value',
  transitive: true,
  filter: (token) => token.$extensions?.['com.cucusa.platform']?.css,
  transform: (token) => token.$extensions['com.cucusa.platform'].css,
})

// color-mix() derived colors — reads $extensions.com.cucusa.colorMix
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

// DTCG shadow composite → CSS box-shadow shorthand
// Skipped when a platform override exists (platform-css handles it)
StyleDictionary.registerTransform({
  name: 'cucusa/shadow-css',
  type: 'value',
  transitive: true,
  filter: (token) =>
    token.$type === 'shadow' && !token.$extensions?.['com.cucusa.platform']?.css,
  transform: (token) => {
    const toCSS = (s) =>
      `${s.offsetX} ${s.offsetY} ${s.blur}${s.spread && s.spread !== '0' ? ` ${s.spread}` : ''} ${s.color}`
    const val = token.$value
    if (Array.isArray(val)) return val.map(toCSS).join(', ')
    return toCSS(val)
  },
})

// DTCG border composite → CSS border shorthand
StyleDictionary.registerTransform({
  name: 'cucusa/border-css',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'border',
  transform: (token) => {
    const v = token.$value
    const color =
      typeof v.color === 'string' && v.color.startsWith('{')
        ? resolveRefToCssVar(v.color)
        : v.color
    return `${v.width} ${v.style} ${color}`
  },
})

// DTCG duration (ms) → CSS seconds
StyleDictionary.registerTransform({
  name: 'cucusa/duration-css',
  type: 'value',
  filter: (token) => token.$type === 'duration',
  transform: (token) => {
    const ms = parseInt(token.$value, 10)
    return `${ms / 1000}s`
  },
})

// DTCG cubicBezier → CSS
StyleDictionary.registerTransform({
  name: 'cucusa/easing-css',
  type: 'value',
  filter: (token) => token.$type === 'cubicBezier',
  transform: (token) => {
    const [x1, y1, x2, y2] = token.$value
    // CSS ease keyword = cubic-bezier(0.25, 0.1, 0.25, 1)
    if (x1 === 0.25 && y1 === 0.1 && x2 === 0.25 && y2 === 1) return 'ease'
    return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`
  },
})

// DTCG fontFamily array → CSS font stack
StyleDictionary.registerTransform({
  name: 'cucusa/font-family-css',
  type: 'value',
  filter: (token) => token.$type === 'fontFamily',
  transform: (token) => {
    return token.$value
      .map((f) => (f.includes(' ') ? `'${f}'` : f))
      .join(', ')
  },
})

// ── Build Config ───────────────────────────────────────────────────

const sd = new StyleDictionary({
  log: { verbosity: 'default', warnings: 'disabled' },
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transforms: [
        'attribute/cti',
        'name/kebab',
        // Platform override first — raw CSS wins over type-specific transforms
        'cucusa/platform-css',
        'cucusa/color-mix',
        'cucusa/shadow-css',
        'cucusa/border-css',
        'cucusa/duration-css',
        'cucusa/easing-css',
        'cucusa/font-family-css',
        'color/css',
      ],
      buildPath: 'src/styles/',
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
