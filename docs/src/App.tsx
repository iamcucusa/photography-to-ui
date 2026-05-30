import { useState, useCallback } from 'react'
import primitives from '../../tokens/color/primitives.json'
import semantic from '../../tokens/color/semantic.json'
import derived from '../../tokens/color/derived.json'
import typography from '../../tokens/typography.json'
import spacing from '../../tokens/spacing.json'
import shape from '../../tokens/shape.json'
import elevation from '../../tokens/elevation.json'
import motion from '../../tokens/motion.json'

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

function App() {
  const [toast, setToast] = useState('')

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(`var(${text})`)
    setToast(`Copied var(${text})`)
    setTimeout(() => setToast(''), 1500)
  }, [])

  const palettes = ['magenta', 'sky', 'frost', 'sand', 'ink'] as const
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const colorPrimitives = primitives.color as any as Record<string, TokenEntry>

  const semanticTokens = flattenTokens(semantic.color as Record<string, unknown>, 'color')
  const derivedTokens = flattenTokens(derived.color as Record<string, unknown>, 'color')
  const typeScaleTokens = flattenTokens(typography.text as Record<string, unknown>, 'text')
  const displayTokens = flattenTokens(typography.display as Record<string, unknown>, 'display')
  const spacingTokens = flattenTokens(spacing.space as Record<string, unknown>, 'space')
  const durationTokens = flattenTokens(motion.duration as Record<string, unknown>, 'duration')

  const sections = [
    { id: 'palettes', label: 'Color Palettes' },
    { id: 'semantic', label: 'Semantic Colors' },
    { id: 'derived', label: 'Derived Colors' },
    { id: 'typography', label: 'Typography' },
    { id: 'spacing', label: 'Spacing' },
    { id: 'shadows', label: 'Shadows' },
    { id: 'motion', label: 'Motion' },
  ]

  return (
    <div className="docs">
      <header className="docs-header">
        <h1 className="docs-title">
          Cucusa Tokens<span style={{ color: 'var(--color-accent)' }}>_</span>
        </h1>
        <p className="docs-subtitle">
          Design token reference. Click any token name to copy its CSS variable.
        </p>
        <nav className="docs-nav" aria-label="Token sections">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="docs-nav-link">
              {s.label}
            </a>
          ))}
        </nav>
      </header>

      {/* ── Color Palettes ──────────────────────────────── */}
      <section className="token-section" id="palettes">
        <h2 className="token-section-title">Color Palettes</h2>
        <p className="token-section-description">
          Five palettes derived from photography. Each palette has 5 stops from darkest to lightest.
        </p>
        {palettes.map((palette) => {
          const group = colorPrimitives[palette] as Record<string, TokenEntry>
          const desc = group.$description as unknown as string | undefined
          return (
            <div key={palette} className="palette-group">
              <h3 className="palette-group-title">
                {palette}{' '}
                {desc && (
                  <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>
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
                      onKeyDown={(e) => e.key === 'Enter' && copy(name)}
                    >
                      <span className="palette-stop-label">{stop}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>

      {/* ── Semantic Colors ──────────────────────────────── */}
      <section className="token-section" id="semantic">
        <h2 className="token-section-title">Semantic Colors</h2>
        <p className="token-section-description">
          Design intent aliases. These map meaning to palette primitives.
        </p>
        <div className="color-grid">
          {semanticTokens.map(({ name, token }) => (
            <div key={name} className="color-card">
              <div className="color-swatch">
                <div className="color-swatch-fill" style={{ backgroundColor: `var(${name})` }} />
              </div>
              <div className="color-info">
                <span
                  className="color-name"
                  onClick={() => copy(name)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Copy ${name}`}
                  onKeyDown={(e) => e.key === 'Enter' && copy(name)}
                >
                  {name}
                </span>
                <span className="color-value">{String(token.$value)}</span>
                {token.$description && (
                  <span className="color-description">{token.$description}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Derived Colors ──────────────────────────────── */}
      <section className="token-section" id="derived">
        <h2 className="token-section-title">Derived Colors</h2>
        <p className="token-section-description">
          Computed via color-mix() from primitives. Overlays, tints, borders, glows, and gradients.
        </p>
        <div className="color-grid">
          {derivedTokens.map(({ name, token }) => {
            const isTransparent =
              String(token.$value).includes('transparent') ||
              (String(token.$value).length === 9 && String(token.$value).startsWith('#'))
            return (
              <div key={name} className="color-card">
                <div
                  className={`color-swatch ${isTransparent ? 'color-swatch--checkerboard' : ''}`}
                >
                  <div className="color-swatch-fill" style={{ backgroundColor: `var(${name})` }} />
                </div>
                <div className="color-info">
                  <span
                    className="color-name"
                    onClick={() => copy(name)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy ${name}`}
                    onKeyDown={(e) => e.key === 'Enter' && copy(name)}
                  >
                    {name}
                  </span>
                  {token.$description && (
                    <span className="color-description">{token.$description}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Typography ──────────────────────────────────── */}
      <section className="token-section" id="typography">
        <h2 className="token-section-title">Typography</h2>
        <p className="token-section-description">
          JetBrains Mono. Perfect Fifth scale (1.5 ratio), base 16px.
        </p>
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
                onKeyDown={(e) => e.key === 'Enter' && copy(name)}
              >
                {name}
              </span>
              <span>{String(token.$value)}</span>
              {token.$description && <span>{token.$description}</span>}
            </div>
          </div>
        ))}
      </section>

      {/* ── Spacing ─────────────────────────────────────── */}
      <section className="token-section" id="spacing">
        <h2 className="token-section-title">Spacing</h2>
        <p className="token-section-description">Doubling progression from 0.25rem to 4rem.</p>
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
                onKeyDown={(e) => e.key === 'Enter' && copy(name)}
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
      </section>

      {/* ── Shadows ──────────────────────────────────────── */}
      <section className="token-section" id="shadows">
        <h2 className="token-section-title">Shadows</h2>
        <p className="token-section-description">
          Elevation hierarchy for dark mode. From subtle highlights to accent glows.
        </p>
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
                onKeyDown={(e) => e.key === 'Enter' && copy(name)}
              >
                <span className="shadow-card-name">{name.replace('--shadow-', '')}</span>
                {token.$description && (
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
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
      </section>

      {/* ── Motion ───────────────────────────────────────── */}
      <section className="token-section" id="motion">
        <h2 className="token-section-title">Motion</h2>
        <p className="token-section-description">
          Duration scale and easing curves. Hover each card to preview the timing.
        </p>
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
                onKeyDown={(e) => e.key === 'Enter' && copy(name)}
              >
                <div className="motion-bar-track">
                  <div
                    className="motion-bar"
                    style={{ transition: `width ${ms}ms var(--easing-emphasized)` }}
                  />
                </div>
                <div className="motion-card-name">{name.replace('--duration-', '')}</div>
                <div className="motion-card-value">{ms}ms</div>
                {token.$description && <div className="motion-card-desc">{token.$description}</div>}
              </div>
            )
          })}
        </div>

        <h3 className="token-section-title" style={{ marginTop: 'var(--space-lg)' }}>
          Easing
        </h3>
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
              onKeyDown={(e) => e.key === 'Enter' && copy(name)}
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

        <h3 className="token-section-title" style={{ marginTop: 'var(--space-lg)' }}>
          Shape
        </h3>
        {flattenTokens(shape.radius as Record<string, unknown>, 'radius').map(({ name, token }) => (
          <div
            key={name}
            className="spacing-demo"
            onClick={() => copy(name)}
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
            aria-label={`Copy ${name}`}
            onKeyDown={(e) => e.key === 'Enter' && copy(name)}
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
        ))}
      </section>

      <div className={`copy-toast ${toast ? 'copy-toast--visible' : ''}`}>{toast}</div>
    </div>
  )
}

export default App
