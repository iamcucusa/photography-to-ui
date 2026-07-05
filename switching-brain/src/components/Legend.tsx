import type { VizTokens } from '../viz/runtimeTokens'
import { NETWORK_ORDER, NETWORK_LABELS, NETWORK_GLOSS, NETWORK_POSITION } from '../viz/model/types'

interface LegendProps {
  tokens: VizTokens
}

/**
 * Network key. Ordered top-to-bottom to mirror the map's bands (DMN · SN · FPCN),
 * so the legend and the graph read the same way down the page. Each entry is a
 * fixed four-line stack — name / abbr · band / role / phrase — carrying redundant
 * cues (swatch, abbreviation, name, band position) so the mapping survives
 * grayscale / color-blindness, never color alone. The gloss ("Role. Phrase.")
 * is split across its own two lines.
 */
export function Legend({ tokens }: LegendProps) {
  return (
    <ul className="legend" aria-label="The three networks, top to bottom of the map">
      {NETWORK_ORDER.map((id) => {
        const [role, ...rest] = NETWORK_GLOSS[id].split('. ')
        const phrase = rest.join('. ')
        return (
          <li key={id} className="legend__item">
            <span
              className="legend__swatch"
              style={{ background: tokens.network[id].base }}
              aria-hidden="true"
            />
            <div className="legend__body">
              <p className="legend__name">{NETWORK_LABELS[id]}</p>
              <p className="legend__meta">
                {id} · {NETWORK_POSITION[id]}
              </p>
              <p className="legend__role">{role}.</p>
              {phrase && <p className="legend__phrase">{phrase}</p>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
