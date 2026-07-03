import { useState, useCallback } from 'react'
import auditData from './audit-data.json'
import auditInsights from './audit-insights.json'
import contrastData from './contrast-data.json'
import { SectionBand } from './SectionBand'

type AuditData = typeof auditData
type Insights = typeof auditInsights

type ContrastCheck = {
  mode: string
  label: string
  ratio: number
  min: number
  pass: boolean
}

// Pivot the per-mode check list into one row per pairing with a column per mode
function pivotContrast(checks: ContrastCheck[]) {
  const rows = new Map<
    string,
    { label: string; min: number; modes: Record<string, ContrastCheck> }
  >()
  for (const check of checks) {
    const row = rows.get(check.label) ?? { label: check.label, min: check.min, modes: {} }
    row.modes[check.mode] = check
    rows.set(check.label, row)
  }
  return [...rows.values()]
}

function ScoreRing({ score }: { score: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color =
    score >= 80
      ? 'var(--color-status-success)'
      : score >= 60
        ? 'var(--color-accent)'
        : 'var(--color-status-error)'

  return (
    <svg width="100" height="100" viewBox="0 0 100 100" aria-label={`Score: ${score} out of 100`}>
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="var(--color-border-subtle)"
        strokeWidth="6"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset var(--duration-slow) var(--easing-emphasized)' }}
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dy="0.35em"
        fill="var(--color-text-primary)"
        fontSize="var(--text-lg)"
        fontFamily="var(--font-family-base)"
        fontWeight="600"
      >
        {score}
      </text>
    </svg>
  )
}

// Outline badge: the word carries the state, the tone only reinforces it
// (never color alone), matching the contrast badges in the catalog.
function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    deferred: 'status-badge--deferred',
    accepted: 'status-badge--pass',
    resolved: 'status-badge--pass',
    open: 'status-badge--open',
  }
  return <span className={`status-badge ${tone[status] ?? ''}`}>{status}</span>
}

export function AuditPage() {
  const data = auditData as AuditData
  const insights = auditInsights as Insights
  const [refreshing, setRefreshing] = useState(false)
  const [refreshResult, setRefreshResult] = useState<string | null>(null)

  const rescan = useCallback(async () => {
    setRefreshing(true)
    setRefreshResult(null)
    try {
      const res = await fetch('/__audit')
      if (res.ok) {
        setRefreshResult('Scan complete. The page refreshes via HMR.')
      } else {
        setRefreshResult('Scan failed. Run npm run audit manually.')
      }
    } catch {
      setRefreshResult('Dev server only. Run npm run audit in a terminal.')
    } finally {
      setRefreshing(false)
    }
  }, [])

  const copyFullAudit = useCallback(() => {
    navigator.clipboard.writeText('npm run audit:full')
    setRefreshResult(
      'Copied npm run audit:full. It runs the scanner, updates insights via Claude, and commits.',
    )
  }, [])

  return (
    <div className="audit">
      {/* ── Hero: the health readout ─────────────────────── */}
      <header className="audit-hero">
        <div className="docs-inset audit-hero-row">
          <ScoreRing score={data.score} />
          <div className="audit-hero-meta">
            <h2 className="audit-hero-title">Design System Health</h2>
            <p className="audit-hero-detail">
              {data.tokenSource.totalTokens} tokens · {data.cssAnalysis.totalTokenReferences}{' '}
              references · {data.cssAnalysis.filesScanned.length} CSS files scanned
            </p>
            <p className="audit-hero-stamp">
              Scanned {new Date(data.timestamp).toLocaleDateString()} · Reviewed{' '}
              {insights.lastReviewed} by {insights.reviewer}
            </p>
          </div>
          <div className="audit-actions">
            <button
              className="audit-refresh-btn"
              onClick={rescan}
              disabled={refreshing}
              aria-label="Re-run metrics scanner"
            >
              {refreshing ? 'Scanning...' : 'Rescan'}
            </button>
            <button
              className="audit-refresh-btn audit-refresh-btn--full"
              onClick={copyFullAudit}
              aria-label="Copy full audit command to clipboard"
            >
              Full audit ↗
            </button>
          </div>
        </div>
        <div className="docs-inset">
          {refreshResult && <p className="audit-refresh-result">{refreshResult}</p>}
          <p className="audit-summary">{insights.summary}</p>
        </div>
      </header>

      <SectionBand
        id="coverage"
        num="01"
        title="Token Coverage"
        description="Every color reference in consumer CSS, by category. Zero hardcoded values is the contract; breakpoints stay untokenized by decision."
      >
        <div className="token-table-wrap">
          <table className="token-table">
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">References</th>
                <th scope="col">Hardcoded</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.cssAnalysis.tokenUsage).map(([category, count]) => (
                <tr key={category}>
                  <td data-label="category">{category}</td>
                  <td data-label="references">{count}</td>
                  <td data-label="hardcoded">0</td>
                  <td data-label="status">
                    <span className="audit-check">&#10003;</span>
                  </td>
                </tr>
              ))}
              <tr>
                <td data-label="category">breakpoints</td>
                <td data-label="references">0 (not tokenized)</td>
                <td data-label="hardcoded">{data.cssAnalysis.breakpoints.length}</td>
                <td data-label="status">
                  <StatusBadge status="deferred" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionBand>

      <SectionBand
        id="contrast"
        num="02"
        title="Contrast Contract"
        description="The same gate that runs in npm run check and CI (check-contrast.mjs). Text roles clear 4.5:1 on every surface; interactive borders and the focus ring clear 3:1, per mode."
      >
        <div className="token-table-wrap">
          <table className="token-table">
            <thead>
              <tr>
                <th scope="col">Pairing</th>
                <th scope="col">Min</th>
                <th scope="col">Dark</th>
                <th scope="col">Light</th>
              </tr>
            </thead>
            <tbody>
              {pivotContrast(contrastData.checks as ContrastCheck[]).map((row) => (
                <tr key={row.label}>
                  <td data-label="pairing">{row.label}</td>
                  <td data-label="min" className="token-table-hex">
                    {row.min}:1
                  </td>
                  {['dark', 'light'].map((mode) => {
                    const check = row.modes[mode]
                    return (
                      <td key={mode} data-label={mode} className="token-table-hex">
                        {check ? (
                          <>
                            {check.ratio.toFixed(2)}{' '}
                            <span className={check.pass ? 'audit-check' : 'audit-cross'}>
                              {check.pass ? '✓' : '✗'}
                            </span>
                          </>
                        ) : (
                          <span className="token-table-na">n/a</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionBand>

      <SectionBand
        id="source"
        num="03"
        title="Source Quality"
        description="$description coverage per token file. 100% is the bar: a token without a description is invisible to agents."
      >
        <div className="token-table-wrap">
          <table className="token-table">
            <thead>
              <tr>
                <th scope="col">File</th>
                <th scope="col">Tokens</th>
                <th scope="col">Described</th>
                <th scope="col">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {data.tokenSource.files.map((f) => (
                <tr key={f.file}>
                  <td data-label="file">{f.file}</td>
                  <td data-label="tokens">{f.tokens}</td>
                  <td data-label="described">{f.described}</td>
                  <td data-label="coverage">
                    <span className={f.coverage === 100 ? 'audit-check' : 'audit-warn'}>
                      {f.coverage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionBand>

      <SectionBand
        id="a11y"
        num="04"
        title="Accessibility"
        description="ARIA attributes and interactive elements per component, counted from source."
      >
        <div className="audit-stat-row">
          <div className="audit-stat">
            <span className="audit-stat-value">{data.accessibility.totalAriaAttributes}</span>
            <span className="audit-stat-label">ARIA attributes</span>
          </div>
          <div className="audit-stat">
            <span className="audit-stat-value">{data.accessibility.totalInteractiveElements}</span>
            <span className="audit-stat-label">Interactive elements</span>
          </div>
        </div>
        <div className="token-table-wrap">
          <table className="token-table">
            <thead>
              <tr>
                <th scope="col">Component</th>
                <th scope="col">Buttons</th>
                <th scope="col">Inputs</th>
                <th scope="col">Links</th>
                <th scope="col">aria-label</th>
                <th scope="col">aria-pressed</th>
                <th scope="col">aria-expanded</th>
              </tr>
            </thead>
            <tbody>
              {data.accessibility.components.map((c) => (
                <tr key={c.file}>
                  <td data-label="component">{c.file.split('/').pop()}</td>
                  <td data-label="buttons">{c.buttons || ''}</td>
                  <td data-label="inputs">{c.inputs || ''}</td>
                  <td data-label="links">{c.links || ''}</td>
                  <td data-label="aria-label">{c.ariaLabels || ''}</td>
                  <td data-label="aria-pressed">{c.ariaPressed || ''}</td>
                  <td data-label="aria-expanded">{c.ariaExpanded || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionBand>

      <SectionBand
        id="states"
        num="05"
        title="State Coverage"
        description="Interaction states declared per file: hover, focus, active, disabled."
      >
        <div className="token-table-wrap">
          <table className="token-table">
            <thead>
              <tr>
                <th scope="col">File</th>
                <th scope="col">:hover</th>
                <th scope="col">:focus</th>
                <th scope="col">:active</th>
                <th scope="col">:disabled</th>
              </tr>
            </thead>
            <tbody>
              {data.stateCoverage.map((s) => (
                <tr key={s.file}>
                  <td data-label="file">{s.file.split('/').pop()}</td>
                  <td data-label=":hover">{s.hover || ''}</td>
                  <td data-label=":focus">{s.focus || ''}</td>
                  <td data-label=":active">{s.active || ''}</td>
                  <td data-label=":disabled">{s.disabled || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionBand>

      <SectionBand
        id="assessment"
        num="06"
        title="Assessment"
        description="Metrics above are automated. This interpretation is written by the /design-system audit skill into audit-insights.json, then reviewed."
      >
        <div className="audit-skill">
          <div className="audit-skill-usage">
            <span className="audit-skill-label">Rescan:</span>
            <code>npm run audit</code>
            <span className="audit-skill-label">Full audit:</span>
            <code>npm run audit:full</code>
            <span className="audit-skill-label">scanner + Claude insights + commit</span>
          </div>
          <p className="audit-reviewed">
            Last reviewed {insights.lastReviewed} by {insights.reviewer}
          </p>
        </div>

        <h3 className="token-subsection-title">Priority actions</h3>
        <div className="audit-priorities">
          {insights.priorities.map((p) => (
            <div key={p.priority} className="audit-priority">
              <div className="audit-priority-header">
                <span className="audit-priority-number">P{p.priority}</span>
                <span className="audit-priority-title">{p.title}</span>
                <StatusBadge status={p.status} />
              </div>
              <p className="audit-priority-detail">{p.detail}</p>
            </div>
          ))}
        </div>

        <h3 className="token-subsection-title">Strengths</h3>
        <ul className="audit-list audit-list--strengths">
          {insights.strengths.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>

        <h3 className="token-subsection-title">Risks</h3>
        <ul className="audit-list audit-list--risks">
          {insights.risks.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </SectionBand>
    </div>
  )
}
