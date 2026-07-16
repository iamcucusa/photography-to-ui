// F.1 `FindingsRail` — capability 6 Assist. Atlas cards beside the list,
// never blocking it. Owns `highlight` (§G.3) through each finding's
// "show me". A finding without derivedFrom and suggestedState never renders
// (BL5); the quiet state is a valid, calm outcome (Flow C).

import { useState } from 'react'
import type { Finding } from '../types'
import { validateFinding } from '../atlas/checks'
import { writeState } from '../state/url'

interface FindingsRailProps {
  findings: Finding[]
}

export function FindingsRail({ findings }: FindingsRailProps) {
  // Ephemeral: which card is expanded. Never persisted anywhere.
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const proposed = findings.filter((f) => validateFinding(f) && f.status === 'proposed')

  return (
    <aside className="findings-rail" aria-label={`Atlas findings, ${proposed.length} proposed`}>
      <header className="rail-header">
        <h2>Atlas</h2>
        <span className="rail-badge" aria-hidden="true">
          {proposed.length}
        </span>
      </header>
      {proposed.length === 0 ? (
        <p className="rail-quiet">No findings on the current state.</p>
      ) : (
        proposed.map((finding) => {
          const expanded = expandedId === finding.id
          return (
            <article key={finding.id} className="finding-card">
              <button
                type="button"
                className="finding-claim"
                aria-expanded={expanded}
                onClick={() => setExpandedId(expanded ? null : finding.id)}
              >
                {finding.claim}
              </button>
              {expanded && (
                <div className="finding-evidence">
                  <h3>Derived from</h3>
                  <ul>
                    {finding.derivedFrom.map(([entityId, field]) => (
                      <li key={`${entityId}:${field}`}>
                        <code>{entityId}</code> · <code>{field}</code>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="btn btn-accent"
                    onClick={() => writeState(finding.suggestedState, 'push')}
                  >
                    Show me
                  </button>
                </div>
              )}
            </article>
          )
        })
      )}
    </aside>
  )
}
