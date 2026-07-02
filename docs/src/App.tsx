import { useState, useCallback, useMemo, type KeyboardEvent, type ReactNode } from 'react'
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
function SectionBand({
  id,
  num,
  title,
  description,
  children,
}: {
  id: string
  num: string
  title: string
  description: string
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
        {children}
      </div>
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
  const { mode, toggle } = useTheme()

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
          <button
            className="mode-toggle"
            onClick={toggle}
            aria-pressed={mode === 'light'}
            aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
          >
            mode: {mode}
          </button>
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
            <div className="docs-inset docs-nav-row">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="docs-nav-link">
                  {s.label}
                </a>
              ))}
            </div>
          </nav>

          <SectionBand
            id="palettes"
            num="01"
            title="Color Palettes"
            description="Five palettes derived from photography. Each palette has 5 stops from darkest to lightest."
          >
            {palettes.map((palette) => {
              const group = colorPrimitives[palette] as Record<string, TokenEntry>
              const desc = group.$description as unknown as string | undefined
              return (
                <div key={palette} className="palette-group">
                  <h3 className="palette-group-title">
                    {palette}{' '}
                    {desc && (
                      <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>
                        {' '}
                        — {desc}
                      </span>
                    )}
                  </h3>
                  <div className="palette-strip">
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
            description="Design intent aliases. These map meaning to palette primitives."
          >
            <div className="color-grid">
              {semanticTokens.map(({ name, token }) => {
                const aa = badgeFor(name)
                return (
                  <div key={name} className="color-card">
                    <div className="color-swatch">
                      <div
                        className="color-swatch-fill"
                        style={{ backgroundColor: `var(${name})` }}
                      />
                    </div>
                    <div className="color-info">
                      <span
                        className="color-name"
                        onClick={() => copy(name)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Copy ${name}`}
                        onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                      >
                        {name}
                      </span>
                      <span className="color-value">
                        {String(token.$value)}
                        {lightOverrides.has(name) &&
                          ` · light: ${String(lightOverrides.get(name)?.$value)}`}
                      </span>
                      <span className="color-resolved">
                        = {resolvedHex.get(name)}{' '}
                        <span className="color-resolved-mode">({mode})</span>
                        {aa && (
                          <span className={`aa-badge aa-badge--${aa.pass ? aa.kind : 'fail'}`}>
                            {aa.ratio.toFixed(1)}:1 {aa.label}
                          </span>
                        )}
                      </span>
                      {token.$description && (
                        <span className="color-description">{token.$description}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionBand>

          <SectionBand
            id="derived"
            num="03"
            title="Derived Colors"
            description="Computed via color-mix() from primitives. Overlays, tints, borders, glows, and gradients."
          >
            <div className="color-grid">
              {derivedTokens.map(({ name, token }) => {
                const isTransparent =
                  String(token.$value).includes('transparent') ||
                  (String(token.$value).length === 9 && String(token.$value).startsWith('#'))
                const aa = badgeFor(name)
                return (
                  <div key={name} className="color-card">
                    <div
                      className={`color-swatch ${isTransparent ? 'color-swatch--checkerboard' : ''}`}
                    >
                      <div
                        className="color-swatch-fill"
                        style={{ backgroundColor: `var(${name})` }}
                      />
                    </div>
                    <div className="color-info">
                      <span
                        className="color-name"
                        onClick={() => copy(name)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Copy ${name}`}
                        onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                      >
                        {name}
                      </span>
                      {lightOverrides.has(name) && (
                        <span className="color-value">
                          light: {String(lightOverrides.get(name)?.$value)}
                        </span>
                      )}
                      <span className="color-resolved">
                        = {resolvedHex.get(name)}{' '}
                        <span className="color-resolved-mode">({mode})</span>
                        {aa && (
                          <span className={`aa-badge aa-badge--${aa.pass ? aa.kind : 'fail'}`}>
                            {aa.ratio.toFixed(1)}:1 {aa.label}
                          </span>
                        )}
                      </span>
                      {token.$description && (
                        <span className="color-description">{token.$description}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionBand>

          <SectionBand
            id="typography"
            num="04"
            title="Typography"
            description="JetBrains Mono. Perfect Fifth scale (1.5 ratio), base 16px."
          >
            {[...displayTokens, ...typeScaleTokens].map(({ name, token }) => (
              <div key={name} className="type-specimen">
                <div
                  className="type-specimen-sample"
                  style={{ fontSize: `var(${name})`, lineHeight: 'var(--line-height-tight)' }}
                >
                  The quick brown fox
                </div>
                <div className="type-specimen-meta">
                  <span
                    className="type-specimen-token"
                    onClick={() => copy(name)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy ${name}`}
                    onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                  >
                    {name}
                  </span>
                  <span>{String(token.$value)}</span>
                  {token.$description && <span>{token.$description}</span>}
                </div>
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
                <div className="type-specimen-meta">
                  <span
                    className="type-specimen-token"
                    onClick={() => copy(name)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy ${name}`}
                    onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                  >
                    {name}
                  </span>
                  <span>{String(token.$value)}</span>
                  {token.$description && <span>{token.$description}</span>}
                </div>
              </div>
            ))}

            <h3 className="token-subsection-title">Line height</h3>
            {lineHeightTokens.map(({ name, token }) =>
              tokenRow(
                name,
                String(token.$value),
                token.$description,
                <div
                  className="type-lh-demo"
                  style={{ lineHeight: `var(${name})` }}
                  aria-hidden="true"
                >
                  Typography leads the interface. Layout follows reading, not decoration.
                </div>,
              ),
            )}

            <h3 className="token-subsection-title">Letter spacing</h3>
            {letterSpacingTokens.map(({ name, token }) =>
              tokenRow(
                name,
                String(token.$value),
                token.$description,
                <span style={{ letterSpacing: `var(${name})` }} aria-hidden="true">
                  Tracking sample
                </span>,
              ),
            )}

            <h3 className="token-subsection-title">Font family</h3>
            {familyTokens.map(({ name, token }) =>
              tokenRow(
                name,
                Array.isArray(token.$value)
                  ? (token.$value as string[]).join(', ')
                  : String(token.$value),
                token.$description,
              ),
            )}
          </SectionBand>

          <SectionBand
            id="spacing"
            num="05"
            title="Spacing"
            description="Doubling progression from 0.25rem to 4rem."
          >
            {spacingTokens.map(({ name, token }) => {
              const rem = parseFloat(String(token.$value))
              const px = rem * 16
              return (
                <div key={name} className="spacing-demo">
                  <span
                    className="spacing-label"
                    onClick={() => copy(name)}
                    role="button"
                    tabIndex={0}
                    style={{ cursor: 'pointer', color: 'var(--color-accent)' }}
                    aria-label={`Copy ${name}`}
                    onKeyDown={(e) => onKeyActivate(e, () => copy(name))}
                  >
                    {name}
                  </span>
                  <div className="spacing-block" style={{ width: `${px}px`, height: '24px' }} />
                  <span className="spacing-value">
                    {String(token.$value)} ({px}px){' '}
                    {token.$description && `— ${String(token.$description)}`}
                  </span>
                </div>
              )
            })}
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
