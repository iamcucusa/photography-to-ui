import StyleDictionary from 'style-dictionary'

function resolveRefToCssVar(ref) {
  if (ref === 'transparent') return 'transparent'
  const match = ref.match(/^\{(.+)\}$/)
  if (!match) return ref
  return `var(--${match[1].replace(/\./g, '-')})`
}

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

const sd = new StyleDictionary({
  log: { verbosity: 'default', warnings: 'disabled' },
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transforms: [
        'attribute/cti',
        'name/kebab',
        'time/seconds',
        'html/icon',
        'size/rem',
        'color/css',
        'cucusa/color-mix',
      ],
      buildPath: 'build/',
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
