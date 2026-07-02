import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { AuditPage } from './AuditPage'
import { useTheme } from './useTheme'
import { resolveVarToHex, contrastRatio, grade } from './resolve'
import primitives from '@tokens/color/primitives.json'
import semantic from '@tokens/color/semantic.json'
import derived from '@tokens/color/derived.json'
import semanticLight from '@tokens/modes/light/semantic.json'
import derivedLight from '@tokens/modes/light/derived.json'
import typography from '@tokens/typography.json'
import spacing from '@tokens/spacing.json'
import shape from '@tokens/shape.json'
import elevation from '@tokens/elevation.json'
import motion from '@tokens/motion.json'
import sizing from '@tokens/sizing.json'
import backdrop from '@tokens/backdrop.json'

type TokenEntry = {
  $value?: unknown
  $type?: string
  $description?: string
  $extensions?: Record<string, unknown>
  [key: string]: unknown
}

function flattenTokens(
  obj: Record<string, unknown>,
  prefix = '',
  inheritedType?: string,
): Array<{ name: string; token: TokenEntry }> {
  const results: Array<{ name: string; token: TokenEntry }> = []
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue
    const entry = val as TokenEntry
    const path = prefix ? `${prefix}-${key}` : key
    const type = entry.$type || inheritedType
    if (entry.$value !== undefined) {
      results.push({ name: `--${path}`, token: { ...entry, $type: type } })
    } else {
      results.push(...flattenTokens(entry as Record<string, unknown>, path, type))
    }
  }
  return results
}

// Light-mode overrides keyed by CSS variable name — used to label tokens
// that flip and show both bindings in the catalog.
const lightOverrides = new Map(
  [
    ...flattenTokens(semanticLight.color as Record<string, unknown>, 'color'),
    ...flattenTokens(derivedLight.color as Record<string, unknown>, 'color'),
  ].map(({ name, token }) => [name, token]),
)

// Stable token lists (from static JSON) so the resolved-hex memo can key on mode alone.
const semanticTokens = flattenTokens(semantic.color as Record<string, unknown>, 'color')
const derivedTokens = flattenTokens(derived.color as Record<string, unknown>, 'color')

type ColorMixRecipe = {
  space: string
  color1: string
  amount1?: string
  color2: string
  amount2?: string
}

// The com.cucusa.colorMix recipe rendered as CSS-source color-mix() with the
// DTCG refs kept — "the formula IS the value; read it like source".
function colorMixFormula(token: TokenEntry): string | null {
  const ext = token.$extensions?.['com.cucusa.colorMix'] as ColorMixRecipe | undefined
  if (!ext) return null
  const part = (color: string, amount?: string) => (amount ? `${color} ${amount}` : color)
  const mixed = [part(ext.color1, ext.amount1), part(ext.color2, ext.amount2)].join(', ')
  return `color-mix(in ${ext.space}, ${mixed})` // token-coverage-ignore — docs content, not styling
}

// True for tokens whose value has an alpha channel — they render over the
// checkerboard so the transparency reads.
function hasAlpha(token: TokenEntry): boolean {
  const value = String(token.$value)
  return value.includes('transparent') || /^#[0-9a-fA-F]{8}$/.test(value)
}

// Derived tokens grouped by function (the anti-uniform-grid move). Overlays,
// gradients and glows get their own compositional treatments, not tables.
const derivedTableGroups = [
  { key: 'backgrounds', title: 'Backgrounds', match: (n: string) => n.startsWith('--color-bg-') },
  {
    key: 'tints',
    title: 'Accent tints',
    match: (n: string) => n.startsWith('--color-accent-'),
  },
  { key: 'borders', title: 'Borders', match: (n: string) => n.startsWith('--color-border-') },
  { key: 'status', title: 'Status', match: (n: string) => n.startsWith('--color-status-') },
]
const tagTokens = derivedTokens.filter(({ name }) => name.startsWith('--color-tag-'))

// The canvas-scrim ramp collapses into ONE annotated gradient bar. The two
// sky-2 overlay endpoints are a different base color — they keep table rows
// (putting them on the canvas bar would misstate the ramp).
const overlayRampTokens = derivedTokens.filter(({ name }) =>
  ['faint', 'light', 'medium', 'strong', 'heavy', 'dense'].some(
    (step) => name === `--color-overlay-${step}`,
  ),
)
const overlayEndpointTokens = derivedTokens.filter(
  ({ name }) => name === '--color-overlay-mid' || name === '--color-overlay-mid-heavy',
)

const mixAmount = (token: TokenEntry) =>
  (token.$extensions?.['com.cucusa.colorMix'] as ColorMixRecipe | undefined)?.amount1 ?? ''

// Gradient tokens shown as the gradients they compose, full-bleed, with
// start/mid/end stops labeled beneath the field.
const derivedByName = new Map(derivedTokens.map(({ name, token }) => [name, token]))
const gradientFields = [
  {
    key: 'app',
    label: 'app-bg',
    css: 'linear-gradient(90deg, var(--color-app-bg-start), var(--color-app-bg-mid), var(--color-app-bg-end))',
    stops: ['--color-app-bg-start', '--color-app-bg-mid', '--color-app-bg-end'],
  },
  {
    key: 'slide',
    label: 'slide-base',
    css: 'linear-gradient(90deg, var(--color-slide-base-start), var(--color-slide-base-end))',
    stops: ['--color-slide-base-start', '--color-slide-base-end'],
  },
]
const glowTokens = derivedTokens.filter(({ name }) => name.startsWith('--color-glow-'))

const sections = [
  { id: 'palettes', label: 'Color Palettes' },
  { id: 'semantic', label: 'Semantic Colors' },
  { id: 'derived', label: 'Derived Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'spacing', label: 'Spacing' },
  { id: 'shadows', label: 'Shadows' },
  { id: 'motion', label: 'Motion' },
  { id: 'shape', label: 'Shape' },
  { id: 'sizing', label: 'Sizing' },
  { id: 'backdrop', label: 'Backdrop' },
]

// Full-bleed section band: sections are separated by full-width hairline
// rules and negative space (dividers-not-boxes); content re-insets to the
// reading column. The numbered title doubles as a typographic divider.
// `bleed` lets a section's content run edge-to-edge (palette bands,
// gradients, glows) while title + description stay in the reading column.
function SectionBand({
  id,
  num,
  title,
  description,
  bleed = false,
  children,
}: {
  id: string
  num: string
  title: string
  description: string
  bleed?: boolean
  children: ReactNode
}) {
  return (
    <section className="token-section" id={id}>
      <div className="docs-inset">
        <h2 className="token-section-title">
          <span className="token-section-number" aria-hidden="true">
            {num}
          </span>
          {title}
        </h2>
        <p className="token-section-description">{description}</p>
        {!bleed && children}
      </div>
      {bleed && children}
    </section>
  )
}

// A token gets a contrast badge only against the obligation that actually
// governs it (mirrors check-contrast.mjs): text roles ≥4.5:1 (WCAG 1.4.3),
// fills/rings/interactive borders ≥3:1 (WCAG 1.4.11 non-text). Surfaces,
// overlays, tints, glows and decorative borders carry no obligation — no badge.
type BadgeKind = 'text' | 'ui'
function badgeSpec(name: string): { bg: string; min: number; kind: BadgeKind } | null {
  if (name === '--color-text-on-accent') return { bg: '--color-accent', min: 4.5, kind: 'text' }
  if (name.startsWith('--color-text-')) return { bg: '--color-bg-canvas', min: 4.5, kind: 'text' }
  if (name === '--color-accent' || name.startsWith('--color-border-accent'))
    return { bg: '--color-bg-canvas', min: 3, kind: 'ui' }
  return null
}

function App() {
  const [activeTab, setActiveTab] = useState<'tokens' | 'audit'>('tokens')
  const [toast, setToast] = useState('')
  const [activeSection, setActiveSection] = useState('')
  const { mode, toggle } = useTheme()

  // Scroll-spy for the section index: the section crossing the upper third
  // of the viewport is the active one (underline + magenta in the nav).
  useEffect(() => {
    if (activeTab !== 'tokens') return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        }
      },
      { rootMargin: '-25% 0px -65% 0px' },
    )
    for (const { id } of sections) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [activeTab])

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(`var(${text})`)
    setToast(`Copied var(${text})`)
    setTimeout(() => setToast(''), 1500)
  }, [])

  // role="button" cells must activate on Enter AND Space (2.1.1).
  const onKeyActivate = useCallback((e: KeyboardEvent, fn: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fn()
    }
  }, [])

  const palettes = ['magenta', 'sky', 'frost', 'sand', 'ink'] as const
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const colorPrimitives = primitives.color as any as Record<string, TokenEntry>

  // Resolve every semantic + derived token to a concrete #hex for the active
  // mode (probe reads the live cascade). Recompute when the mode flips.
  const resolvedHex = useMemo(() => {
    const map = new Map<string, string>()
    for (const { name } of [...semanticTokens, ...derivedTokens]) {
      map.set(name, resolveVarToHex(name))
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Contrast badge for a token against the surface its obligation governs.
  const badgeFor = useCallback(
    (name: string) => {
      const spec = badgeSpec(name)
      const fg = resolvedHex.get(name)
      if (!spec || !fg) return null
      const ratio = contrastRatio(fg, resolveVarToHex(spec.bg))
      const pass = ratio >= spec.min
      // text → AA/AAA grade; ui (non-text 1.4.11) → "≥3" pass/fail
      const label = spec.kind === 'text' ? (pass ? grade(ratio) : '✗') : pass ? '≥3' : '✗'
      return { ratio, kind: spec.kind, pass, label }
    },
    [resolvedHex],
  )

  const typeScaleTokens = flattenTokens(typography.text as Record<string, unknown>, 'text')
  const displayTokens = flattenTokens(typography.display as Record<string, unknown>, 'display')
  const fontTokens = flattenTokens(typography.font as Record<string, unknown>, 'font')
  const weightTokens = fontTokens.filter(({ name }) => name.startsWith('--font-weight'))
  const familyTokens = fontTokens.filter(({ name }) => name.startsWith('--font-family'))
  const lineHeightTokens = flattenTokens(
    typography['line-height'] as Record<string, unknown>,
    'line-height',
  )
  const letterSpacingTokens = flattenTokens(
    typography['letter-spacing'] as Record<string, unknown>,
    'letter-spacing',
  )
  const spacingTokens = flattenTokens(spacing.space as Record<string, unknown>, 'space')
  const durationTokens = flattenTokens(motion.duration as Record<string, unknown>, 'duration')
  const dividerTokens = flattenTokens(shape.divider as Record<string, unknown>, 'divider')
  const focusRingTokens = flattenTokens(
    shape['focus-ring'] as Record<string, unknown>,
    'focus-ring',
  )
  const sizingTokens = flattenTokens(sizing.post as Record<string, unknown>, 'post')
  const backdropTokens = flattenTokens(backdrop.backdrop as Record<string, unknown>, 'backdrop')

  // Compact copyable row (label + optional demo + value/description) for the
  // non-visual token families.
  const tokenRow = (name: string, value: string, desc?: string, demo?: ReactNode) => (
    <div key={name} className="spacing-demo">
      <span
        className="spacing-label"
        style={{ color: 'var(--color-accent)', cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        aria-label={`Copy ${name}`}
        onClick={() => copy(name)}
        onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
      >
        {name}
      </span>
      {demo}
      <span className="spacing-value">
        {value}
        {desc ? ` — ${desc}` : ''}
      </span>
    </div>
  )

  // A token's recipe (plus its light override when one exists) in the code
  // tone — first-class content, never tooltips.
  const recipeLines = (name: string, token: TokenEntry) => {
    const light = lightOverrides.get(name)
    return (
      <>
        <code className="token-table-ref">{colorMixFormula(token) ?? String(token.$value)}</code>
        {light && (
          <code className="token-table-ref">
            light: {colorMixFormula(light) ?? String(light.$value)}
          </code>
        )}
      </>
    )
  }

  // Right-margin sidenote for a living specimen (Gwern): token name to copy,
  // value in the code tone, usage from the DTCG $description.
  const specimenNote = (name: string, value: string, desc?: string) => (
    <div className="type-specimen-note">
      <span
        className="token-table-name"
        onClick={() => copy(name)}
        role="button"
        tabIndex={0}
        aria-label={`Copy ${name}`}
        onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
      >
        {name}
      </span>
      {value && <span className="type-specimen-value">{value}</span>}
      {desc && <span className="type-specimen-desc">{desc}</span>}
    </div>
  )

  // Alpha-swatch table for a functional group of derived tokens. Same
  // editorial-table skeleton as §2 (and the same mobile collapse); alpha
  // values sit on the checkerboard, recipes are first-class content in the
  // code tone — never tooltips.
  const derivedTable = (tokens: Array<{ name: string; token: TokenEntry }>) => (
    <div className="token-table-wrap">
      <table className="token-table">
        <thead>
          <tr>
            <th scope="col" aria-label="Swatch" />
            <th scope="col">Token</th>
            <th scope="col">Recipe</th>
            <th scope="col">Resolved ({mode})</th>
            <th scope="col">Contrast</th>
            <th scope="col">$description</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map(({ name, token }) => {
            const aa = badgeFor(name)
            return (
              <tr key={name}>
                <td className="token-table-swatch-cell">
                  <div
                    className={`token-table-swatch ${hasAlpha(token) ? 'checkerboard' : ''}`}
                    onClick={() => copy(name)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy ${name}`}
                    title={
                      hasAlpha(token) ? `${name} — translucent, shown over a checkerboard` : name
                    }
                    onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                  >
                    <div
                      className="token-table-swatch-fill"
                      style={{ backgroundColor: `var(${name})` }}
                    />
                  </div>
                </td>
                <td data-label="token">
                  <span
                    className="token-table-name"
                    onClick={() => copy(name)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy ${name}`}
                    onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                  >
                    {name}
                  </span>
                </td>
                <td data-label="recipe">{recipeLines(name, token)}</td>
                <td data-label={`resolved (${mode})`} className="token-table-hex">
                  {resolvedHex.get(name)}
                </td>
                <td data-label="contrast">
                  {aa ? (
                    <span className={`aa-badge aa-badge--${aa.pass ? aa.kind : 'fail'}`}>
                      {aa.ratio.toFixed(1)}:1 {aa.label}
                    </span>
                  ) : (
                    <span className="token-table-na">—</span>
                  )}
                </td>
                <td data-label="$description" className="token-table-desc">
                  {token.$description}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  // One toggle, two homes: docked at the right end of the sticky index on the
  // tokens tab; a fixed top-right pill on the audit tab (no sticky bar there).
  const modeToggle = (
    <button
      className={`mode-toggle ${activeTab === 'tokens' ? 'mode-toggle--docked' : ''}`}
      onClick={toggle}
      aria-pressed={mode === 'light'}
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
    >
      mode: {mode}
    </button>
  )

  return (
    <div className="docs">
      <header className="docs-header">
        <div className="docs-inset">
          <h1 className="docs-title">
            Cucusa Tokens
            <span className="docs-title-cursor" aria-hidden="true">
              _
            </span>
          </h1>
          <p className="docs-subtitle">Design token reference and system health dashboard.</p>
          <p className="docs-subtitle-note">
            Every value here is live, copyable, and the same source your agents read.
          </p>
          <ul className="docs-legend" aria-label="How to use this catalog">
            <li>
              <strong>Click any token</strong>
              <span>
                copies its <code>var(--name)</code>
              </span>
            </li>
            <li>
              <strong>dark · light</strong>
              <span>toggle top-right — values that differ show both bindings, live</span>
            </li>
            <li>
              <strong>{'{ }'} DTCG $description</strong>
              <span>
                not docs <em>about</em> the tokens — the tokens' own <code>$description</code>{' '}
                fields, one source of truth for humans and agents
              </span>
            </li>
          </ul>
          {/* On the tokens tab the toggle docks into the sticky index instead
              (a fixed pill would sit on top of the scrolling nav items) */}
          {activeTab === 'audit' && modeToggle}
          <div className="docs-tabs" role="tablist" aria-label="Page sections">
            <button
              className={`docs-tab ${activeTab === 'tokens' ? 'docs-tab--active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'tokens'}
              onClick={() => setActiveTab('tokens')}
            >
              Tokens
            </button>
            <button
              className={`docs-tab ${activeTab === 'audit' ? 'docs-tab--active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'audit'}
              onClick={() => setActiveTab('audit')}
            >
              Audit
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'audit' && (
        <div className="docs-inset">
          <AuditPage />
        </div>
      )}

      {activeTab === 'tokens' && (
        <>
          <nav className="docs-nav" aria-label="Token sections">
            <div className="docs-inset docs-nav-bar">
              <div className="docs-nav-row">
                {sections.map((s, i) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`docs-nav-link ${
                      activeSection === s.id ? 'docs-nav-link--active' : ''
                    }`}
                    aria-current={activeSection === s.id ? 'true' : undefined}
                  >
                    <span className="docs-nav-num" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {s.label}
                  </a>
                ))}
              </div>
              {modeToggle}
            </div>
          </nav>

          <SectionBand
            id="palettes"
            num="01"
            title="Color Palettes"
            description="Five palettes, each lifted from a photograph — urban magenta, architectural sky, structural frost, landscape sand, and a pure ink gray. Five stops each, darkest to lightest."
            bleed
          >
            {palettes.map((palette) => {
              const group = colorPrimitives[palette] as Record<string, TokenEntry>
              const desc = group.$description as unknown as string | undefined
              return (
                <div key={palette} className="palette-band">
                  <div className="docs-inset palette-band-caption">
                    <h3 className="palette-band-name">{palette}</h3>
                    {desc && <span className="palette-band-role">{desc}</span>}
                  </div>
                  <div className="palette-band-strip">
                    {['1', '2', '3', '4', '5'].map((stop) => {
                      const token = group[stop] as TokenEntry
                      const name = `--color-${palette}-${stop}`
                      return (
                        <div
                          key={stop}
                          className="palette-stop"
                          style={{ backgroundColor: token.$value as string }}
                          onClick={() => copy(name)}
                          title={`${name}: ${token.$value}\n${token.$description || ''}`}
                          role="button"
                          tabIndex={0}
                          aria-label={`Copy ${name}`}
                          onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                        >
                          <span className="palette-stop-label">{stop}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </SectionBand>

          <SectionBand
            id="semantic"
            num="02"
            title="Semantic Colors"
            description="Intent, not pigment. Each alias points at a palette primitive so meaning survives a re-theme — change magenta.2 and everything that means 'accent' moves with it."
          >
            <div className="token-table-wrap">
              <table className="token-table">
                <thead>
                  <tr>
                    <th scope="col" aria-label="Swatch" />
                    <th scope="col">Token</th>
                    <th scope="col">dark · light</th>
                    <th scope="col">Resolved ({mode})</th>
                    <th scope="col">Contrast</th>
                    <th scope="col">$description</th>
                  </tr>
                </thead>
                <tbody>
                  {semanticTokens.map(({ name, token }) => {
                    const aa = badgeFor(name)
                    const lightRef = lightOverrides.get(name)?.$value
                    return (
                      <tr key={name}>
                        <td className="token-table-swatch-cell">
                          <div
                            className="token-table-swatch"
                            style={{ backgroundColor: `var(${name})` }}
                            onClick={() => copy(name)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Copy ${name}`}
                            onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                          />
                        </td>
                        <td data-label="token">
                          <span
                            className="token-table-name"
                            onClick={() => copy(name)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Copy ${name}`}
                            onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                          >
                            {name}
                          </span>
                        </td>
                        <td data-label="dark · light">
                          <code className="token-table-ref">
                            {String(token.$value)}
                            {lightRef ? ` · ${String(lightRef)}` : ''}
                          </code>
                        </td>
                        <td data-label={`resolved (${mode})`} className="token-table-hex">
                          {resolvedHex.get(name)}
                        </td>
                        <td data-label="contrast">
                          {aa ? (
                            <span className={`aa-badge aa-badge--${aa.pass ? aa.kind : 'fail'}`}>
                              {aa.ratio.toFixed(1)}:1 {aa.label}
                            </span>
                          ) : (
                            <span className="token-table-na">—</span>
                          )}
                        </td>
                        <td data-label="$description" className="token-table-desc">
                          {token.$description}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </SectionBand>

          <SectionBand
            id="derived"
            num="03"
            title="Derived Colors"
            description="Forty-odd tokens, none hand-picked — each is a color-mix() recipe over a primitive. The formula is the value; read it like source."
            bleed
          >
            {derivedTableGroups.map((g) => (
              <div key={g.key} className="derived-group">
                <div className="docs-inset">
                  <h3 className="derived-group-title">{g.title}</h3>
                  {derivedTable(derivedTokens.filter(({ name }) => g.match(name)))}
                </div>
              </div>
            ))}

            <div className="derived-group">
              <div className="docs-inset">
                <h3 className="derived-group-title">Overlays</h3>
                <p className="derived-group-note">
                  One canvas scrim, six strengths — 20% to 90% over whatever sits beneath. The two
                  sky-2 endpoints below serve the gradients, not the ramp.
                </p>
                <div
                  className="overlay-ramp checkerboard"
                  role="img"
                  aria-label="The six overlay strengths as one continuous scrim gradient, shown over a checkerboard so the transparency reads"
                >
                  <div className="overlay-ramp-fill" />
                </div>
                <div className="overlay-ramp-stops">
                  {overlayRampTokens.map(({ name, token }) => (
                    <button
                      key={name}
                      type="button"
                      className="overlay-ramp-stop"
                      onClick={() => copy(name)}
                      aria-label={`Copy ${name}`}
                    >
                      <span className="overlay-ramp-stop-name">
                        {name.replace('--color-overlay-', '')}
                      </span>
                      <span className="overlay-ramp-stop-amount">{mixAmount(token)}</span>
                    </button>
                  ))}
                </div>
                {derivedTable(overlayEndpointTokens)}
              </div>
            </div>

            <div className="derived-group">
              <div className="docs-inset">
                <h3 className="derived-group-title">Gradients</h3>
                <p className="derived-group-note">
                  App and slide backgrounds, shown as the gradients they compose — stops labeled
                  beneath the field.
                </p>
              </div>
              {gradientFields.map((g) => (
                <div key={g.key} className="gradient-field-block">
                  <div
                    className="gradient-field"
                    style={{ background: g.css }}
                    role="img"
                    aria-label={`${g.label} gradient — ${g.stops.join(' → ')}`}
                  />
                  <div className="docs-inset gradient-stops">
                    {g.stops.map((name) => {
                      const token = derivedByName.get(name)
                      return (
                        <div key={name} className="gradient-stop">
                          <span
                            className="token-table-name"
                            onClick={() => copy(name)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Copy ${name}`}
                            onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                          >
                            {name}
                          </span>
                          <span className="gradient-stop-hex">{resolvedHex.get(name)}</span>
                          {token && recipeLines(name, token)}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="derived-group">
              <div className="docs-inset">
                <h3 className="derived-group-title">Glows</h3>
                <p className="derived-group-note">
                  Soft radial fields over the canvas — ambient light, not surfaces.
                </p>
              </div>
              <div className="glow-field-row">
                {glowTokens.map(({ name, token }) => (
                  <div key={name} className="glow-field">
                    <div
                      className="glow-field-orb"
                      style={{
                        background: `radial-gradient(closest-side, var(${name}), transparent)`,
                      }}
                      aria-hidden="true"
                    />
                    <span
                      className="token-table-name"
                      onClick={() => copy(name)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Copy ${name}`}
                      onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                    >
                      {name.replace('--color-glow-', '')}
                    </span>
                    {recipeLines(name, token)}
                  </div>
                ))}
              </div>
            </div>

            <div className="derived-group">
              <div className="docs-inset">
                <h3 className="derived-group-title">Tag</h3>
                {derivedTable(tagTokens)}
              </div>
            </div>
          </SectionBand>

          <SectionBand
            id="typography"
            num="04"
            title="Typography"
            description="JetBrains Mono, sized on a Perfect Fifth (1.5) from a 16px base. One typeface does everything — body, code, and the 87px hero."
            bleed
          >
            {/* --display-xl gets the full-bleed hero row; the scale then
                descends so --text-xs sits quietly at the bottom */}
            {displayTokens.map(({ name, token }) => (
              <div key={name} className="type-hero">
                <div className="docs-inset">
                  <div className="type-hero-sample" style={{ fontSize: `var(${name})` }}>
                    The quick brown fox
                  </div>
                  {specimenNote(name, String(token.$value), token.$description)}
                </div>
              </div>
            ))}

            <div className="docs-inset">
              {[...typeScaleTokens].reverse().map(({ name, token }) => (
                <div key={name} className="type-specimen">
                  <div
                    className="type-specimen-sample"
                    style={{ fontSize: `var(${name})`, lineHeight: 'var(--line-height-tight)' }}
                  >
                    The quick brown fox
                  </div>
                  {specimenNote(name, String(token.$value), token.$description)}
                </div>
              ))}

              <h3 className="token-subsection-title">Weights</h3>
              {weightTokens.map(({ name, token }) => (
                <div key={name} className="type-specimen">
                  <div
                    className="type-specimen-sample"
                    style={{
                      fontSize: 'var(--text-lg)',
                      fontWeight: `var(${name})`,
                      lineHeight: 'var(--line-height-tight)',
                    }}
                  >
                    The quick brown fox
                  </div>
                  {specimenNote(name, String(token.$value), token.$description)}
                </div>
              ))}

              <h3 className="token-subsection-title">Line height</h3>
              {/* The manifesto IS the specimen — the section performs its thesis */}
              {lineHeightTokens.map(({ name, token }) => (
                <div key={name} className="type-specimen">
                  <p
                    className="type-specimen-paragraph"
                    style={{ lineHeight: `var(${name})` }}
                    aria-hidden="true"
                  >
                    Typography leads the interface. Layout follows reading, not decoration.
                    Typography leads the interface. Layout follows reading, not decoration.
                    Typography leads the interface. Layout follows reading, not decoration.
                  </p>
                  {specimenNote(name, String(token.$value), token.$description)}
                </div>
              ))}

              <h3 className="token-subsection-title">Letter spacing</h3>
              {letterSpacingTokens.map(({ name, token }) => (
                <div key={name} className="type-specimen">
                  <div
                    className="type-specimen-sample"
                    style={{
                      fontSize: 'var(--text-lg)',
                      letterSpacing: `var(${name})`,
                      lineHeight: 'var(--line-height-tight)',
                    }}
                  >
                    The quick brown fox
                  </div>
                  {specimenNote(name, String(token.$value), token.$description)}
                </div>
              ))}

              <h3 className="token-subsection-title">Font family</h3>
              {/* One line per stack entry, each set in that font — graceful
                  degradation made visible */}
              {familyTokens.map(({ name, token }) => (
                <div key={name} className="type-specimen">
                  <div className="type-family-stack">
                    {(Array.isArray(token.$value)
                      ? (token.$value as string[])
                      : [String(token.$value)]
                    ).map((family) => (
                      <code
                        key={family}
                        className="type-family-line"
                        style={{ fontFamily: family }}
                      >
                        {family}
                      </code>
                    ))}
                  </div>
                  {specimenNote(name, '', token.$description)}
                </div>
              ))}
            </div>
          </SectionBand>

          <SectionBand
            id="spacing"
            num="05"
            title="Spacing"
            description="A pure doubling scale — 4, 8, 16, 32, 64px. Five steps, no in-between. Rhythm you can predict."
          >
            {/* Rhythm ladder: every bar is the token's actual width, grown
                from one shared baseline rule — the doubling reads at a glance */}
            <div className="space-ladder">
              {spacingTokens.map(({ name, token }) => {
                const px = parseFloat(String(token.$value)) * 16
                return (
                  <div key={name} className="space-rung">
                    <span
                      className="token-table-name"
                      onClick={() => copy(name)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Copy ${name}`}
                      onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                    >
                      {name}
                    </span>
                    <div className="space-rung-track">
                      <div
                        className="space-rung-bar"
                        style={{ width: `${px}px` }}
                        aria-hidden="true"
                      />
                      <span className="space-rung-value">
                        {String(token.$value)} · {px}px
                        {token.$description && ` — ${String(token.$description)}`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionBand>

          <SectionBand
            id="shadows"
            num="06"
            title="Shadows"
            description="Elevation hierarchy for dark mode. From subtle highlights to accent glows."
          >
            <div className="shadow-demo">
              {flattenTokens(elevation.shadow as Record<string, unknown>, 'shadow').map(
                ({ name, token }) => (
                  <div
                    key={name}
                    className="shadow-card"
                    style={{ boxShadow: `var(${name})` }}
                    onClick={() => copy(name)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy ${name}`}
                    onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                  >
                    <span className="shadow-card-name">{name.replace('--shadow-', '')}</span>
                    {token.$description && (
                      <span
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-text-secondary)',
                          textAlign: 'center',
                          padding: '0 var(--space-sm)',
                        }}
                      >
                        {token.$description}
                      </span>
                    )}
                  </div>
                ),
              )}
            </div>
          </SectionBand>

          <SectionBand
            id="motion"
            num="07"
            title="Motion"
            description="Duration scale and easing curves. Hover each card to preview the timing."
          >
            <div className="motion-demo">
              {durationTokens.map(({ name, token }) => {
                const ms = parseInt(String(token.$value), 10)
                return (
                  <div
                    key={name}
                    className="motion-card"
                    onClick={() => copy(name)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy ${name}`}
                    onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                  >
                    <div className="motion-bar-track">
                      <div
                        className="motion-bar"
                        style={{ transition: `width ${ms}ms var(--easing-emphasized)` }}
                      />
                    </div>
                    <div className="motion-card-name">{name.replace('--duration-', '')}</div>
                    <div className="motion-card-value">{ms}ms</div>
                    {token.$description && (
                      <div className="motion-card-desc">{token.$description}</div>
                    )}
                  </div>
                )
              })}
            </div>

            <h3 className="token-subsection-title">Easing</h3>
            {flattenTokens(motion.easing as Record<string, unknown>, 'easing').map(
              ({ name, token }) => (
                <div
                  key={name}
                  className="spacing-demo"
                  style={{ cursor: 'pointer' }}
                  onClick={() => copy(name)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Copy ${name}`}
                  onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                >
                  <span className="spacing-label" style={{ color: 'var(--color-accent)' }}>
                    {name}
                  </span>
                  <span className="spacing-value">
                    {Array.isArray(token.$value)
                      ? `cubic-bezier(${(token.$value as number[]).join(', ')})`
                      : String(token.$value)}
                    {token.$description && ` — ${token.$description}`}
                  </span>
                </div>
              ),
            )}
          </SectionBand>

          <SectionBand
            id="shape"
            num="08"
            title="Shape"
            description="This system defines both radius and divider tokens. This page rations the radius and leans on the rules — honest structure over default corners."
          >
            {flattenTokens(shape.radius as Record<string, unknown>, 'radius').map(
              ({ name, token }) => (
                <div
                  key={name}
                  className="spacing-demo"
                  onClick={() => copy(name)}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  aria-label={`Copy ${name}`}
                  onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                >
                  <span className="spacing-label" style={{ color: 'var(--color-accent)' }}>
                    {name}
                  </span>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: `var(${name})`,
                      border: 'var(--divider-strong)',
                      flexShrink: 0,
                    }}
                  />
                  <span className="spacing-value">
                    {String(token.$value)} {token.$description && `— ${token.$description}`}
                  </span>
                </div>
              ),
            )}

            {dividerTokens.map(({ name, token }) =>
              tokenRow(
                name,
                `${(token.$value as { width: string }).width} ${(token.$value as { style: string }).style}`,
                token.$description,
                <div
                  style={{ width: '48px', borderTop: `var(${name})`, flexShrink: 0 }}
                  aria-hidden="true"
                />,
              ),
            )}
            {focusRingTokens.map(({ name, token }) =>
              tokenRow(name, String(token.$value), token.$description),
            )}
          </SectionBand>

          <SectionBand
            id="sizing"
            num="09"
            title="Sizing"
            description="Layout sizing for the LinkedIn post consumer. card-width renders as a clamp() via a platform extension."
          >
            {sizingTokens.map(({ name, token }) =>
              tokenRow(name, String(token.$value), token.$description),
            )}
          </SectionBand>

          <SectionBand
            id="backdrop"
            num="10"
            title="Backdrop"
            description="Photographic-backdrop opacity caps (photography-to-ui). Contrast-load-bearing — they bound the worst-case backdrop behind translucent panels; flip per mode."
          >
            {backdropTokens.map(({ name, token }) =>
              tokenRow(
                name,
                String(token.$value),
                token.$description,
                <div
                  style={{
                    width: '48px',
                    height: '24px',
                    borderRadius: '3px',
                    border: 'var(--divider-subtle)',
                    backgroundColor: 'var(--color-accent)',
                    opacity: Number(token.$value),
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />,
              ),
            )}
          </SectionBand>
        </>
      )}

      <div className={`copy-toast ${toast ? 'copy-toast--visible' : ''}`}>{toast}</div>
    </div>
  )
}

export default App
