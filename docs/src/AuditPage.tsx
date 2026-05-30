import auditData from './audit-data.json'
import auditInsights from './audit-insights.json'

type AuditData = typeof auditData
type Insights = typeof auditInsights

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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    deferred: 'var(--color-accent)',
    accepted: 'var(--color-status-success)',
    open: 'var(--color-status-error)',
    resolved: 'var(--color-status-success)',
  }
  return (
    <span
      className="audit-badge"
      style={{ backgroundColor: colors[status] || 'var(--color-border-subtle)' }}
    >
      {status}
    </span>
  )
}

export function AuditPage() {
  const data = auditData as AuditData
  const insights = auditInsights as Insights

  return (
    <div className="audit">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="audit-header">
        <div className="audit-score-section">
          <ScoreRing score={data.score} />
          <div className="audit-score-meta">
            <div className="audit-score-label">Design System Health</div>
            <div className="audit-score-detail">
              {data.tokenSource.totalTokens} tokens | {data.cssAnalysis.totalTokenReferences}{' '}
              references | {data.cssAnalysis.filesScanned.length} CSS files scanned
            </div>
            <div className="audit-timestamp">
              Scanned {new Date(data.timestamp).toLocaleDateString()} | Reviewed{' '}
              {insights.lastReviewed} by {insights.reviewer}
            </div>
          </div>
        </div>
        <p className="audit-summary">{insights.summary}</p>
      </div>

      {/* ── Token Coverage ──────────────────────────────── */}
      <section className="audit-section">
        <h3 className="audit-section-title">Token Coverage</h3>
        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>References</th>
                <th>Hardcoded</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.cssAnalysis.tokenUsage).map(([category, count]) => (
                <tr key={category}>
                  <td>{category}</td>
                  <td>{count}</td>
                  <td>0</td>
                  <td>
                    <span className="audit-check">&#10003;</span>
                  </td>
                </tr>
              ))}
              <tr>
                <td>breakpoints</td>
                <td>0 (not tokenized)</td>
                <td>{data.cssAnalysis.breakpoints.length}</td>
                <td>
                  <StatusBadge status="deferred" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Token Source Quality ─────────────────────────── */}
      <section className="audit-section">
        <h3 className="audit-section-title">Token Source Quality</h3>
        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Tokens</th>
                <th>Described</th>
                <th>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {data.tokenSource.files.map((f) => (
                <tr key={f.file}>
                  <td>{f.file}</td>
                  <td>{f.tokens}</td>
                  <td>{f.described}</td>
                  <td>
                    <span className={f.coverage === 100 ? 'audit-check' : 'audit-warn'}>
                      {f.coverage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Accessibility ───────────────────────────────── */}
      <section className="audit-section">
        <h3 className="audit-section-title">Accessibility</h3>
        <div className="audit-stat-row">
          <div className="audit-stat">
            <div className="audit-stat-value">{data.accessibility.totalAriaAttributes}</div>
            <div className="audit-stat-label">ARIA attributes</div>
          </div>
          <div className="audit-stat">
            <div className="audit-stat-value">{data.accessibility.totalInteractiveElements}</div>
            <div className="audit-stat-label">Interactive elements</div>
          </div>
        </div>
        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Buttons</th>
                <th>Inputs</th>
                <th>Links</th>
                <th>aria-label</th>
                <th>aria-pressed</th>
                <th>aria-expanded</th>
              </tr>
            </thead>
            <tbody>
              {data.accessibility.components.map((c) => (
                <tr key={c.file}>
                  <td>{c.file.split('/').pop()}</td>
                  <td>{c.buttons || ''}</td>
                  <td>{c.inputs || ''}</td>
                  <td>{c.links || ''}</td>
                  <td>{c.ariaLabels || ''}</td>
                  <td>{c.ariaPressed || ''}</td>
                  <td>{c.ariaExpanded || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── State Coverage ──────────────────────────────── */}
      <section className="audit-section">
        <h3 className="audit-section-title">CSS State Coverage</h3>
        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>File</th>
                <th>:hover</th>
                <th>:focus</th>
                <th>:active</th>
                <th>:disabled</th>
              </tr>
            </thead>
            <tbody>
              {data.stateCoverage.map((s) => (
                <tr key={s.file}>
                  <td>{s.file.split('/').pop()}</td>
                  <td>{s.hover || ''}</td>
                  <td>{s.focus || ''}</td>
                  <td>{s.active || ''}</td>
                  <td>{s.disabled || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Agent Insights ──────────────────────────────── */}
      <section className="audit-section">
        <h3 className="audit-section-title">Strategic Assessment</h3>
        <p className="audit-reviewed">
          Last reviewed {insights.lastReviewed} by {insights.reviewer}
        </p>

        <h4 className="audit-subsection-title">Priority Actions</h4>
        <div className="audit-priorities">
          {insights.priorities.map((p) => (
            <div key={p.priority} className="audit-priority-card">
              <div className="audit-priority-header">
                <span className="audit-priority-number">P{p.priority}</span>
                <span className="audit-priority-title">{p.title}</span>
                <StatusBadge status={p.status} />
              </div>
              <p className="audit-priority-detail">{p.detail}</p>
            </div>
          ))}
        </div>

        <h4 className="audit-subsection-title">Strengths</h4>
        <ul className="audit-list audit-list--strengths">
          {insights.strengths.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>

        <h4 className="audit-subsection-title">Risks</h4>
        <ul className="audit-list audit-list--risks">
          {insights.risks.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
