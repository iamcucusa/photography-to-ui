// F.1 `FindingsRail` — capability 6 Assist. Atlas cards beside the list,
// never blocking it. Owns `highlight` (§G.3) through each finding's
// "show me". A finding without derivedFrom and suggestedState never renders
// (BL5); the quiet state is a valid, calm outcome (Flow C).
// Visually: a column of claims separated by rules — no boxes; each claim
// carries the accent evidence bar.

import { useState } from 'react'
import type { CountryCode3, Finding } from '../types'
import { validateFinding } from '../atlas/checks'
import { writeState } from '../state/url'

// The human encoding of the typed fields Atlas cites in `derivedFrom`. The
// card is the human's window (the thesis): it reads the same evidence Atlas
// reads, but in words — Atlas keeps the raw field keys.
const FIELD_LABELS: Record<string, string> = {
  ranking: 'rank',
  historicalMedianEnrollmentRate: 'historical enrollment',
  predictedEnrollmentRate: 'predicted enrollment',
  performanceRatio: 'performance ratio',
  medianStartupTime: 'startup time',
  predictedStartupTime: 'predicted startup',
  siteToSiteVariability: 'site-to-site variability',
  totalSites: 'sites',
  totalInvestigators: 'investigators',
  multiTrialInvestigators: 'multi-trial investigators',
}

interface FindingsRailProps {
  findings: Finding[]
  countryNames: ReadonlyMap<CountryCode3, string>
}

export function FindingsRail({ findings, countryNames }: FindingsRailProps) {
  // Ephemeral: which claim is expanded. Never persisted anywhere.
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const proposed = findings.filter((f) => validateFinding(f) && f.status === 'proposed')

  return (
    <aside className="findings-rail" aria-label={`Atlas findings, ${proposed.length} proposed`}>
      <header className="rail-header">
        <h2>Atlas</h2>
        <span className="rail-badge" aria-hidden="true">
          {proposed.length} proposed
        </span>
      </header>
      {proposed.length === 0 ? (
        <p className="rail-quiet">No findings for this view.</p>
      ) : (
        proposed.map((finding) => {
          const expanded = expandedId === finding.id
          return (
            <article key={finding.id} className="finding">
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
                        {countryNames.get(entityId) ?? entityId} · {FIELD_LABELS[field] ?? field}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="action-link"
                    onClick={() => writeState(finding.suggestedState, 'push')}
                  >
                    Show me →
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
