import type { VizTokens } from '../viz/runtimeTokens'
import { NETWORK_ORDER, NETWORK_LABELS, NETWORK_GLOSS, NETWORK_POSITION } from '../viz/model/types'

interface LegendProps {
  tokens: VizTokens
}

/**
 * Network key. Ordered top-to-bottom to mirror the map's bands (DMN · SN · FPCN),
 * so the legend and the graph read the same way down the page. Each entry carries
 * four redundant cues — swatch (hue), abbreviation, name, and band position — so
 * the mapping survives grayscale / color-blindness, never color alone.
 */
export function Legend({ tokens }: LegendProps) {
  return (
    <ul className="legend" aria-label="The three networks, top to bottom of the map">
      {NETWORK_ORDER.map((id) => (
        <li key={id} className="legend__item">
          <span
            className="legend__swatch"
            style={{ background: tokens.network[id].base }}
            aria-hidden="true"
          />
          <div className="legend__body">
            <p className="legend__name">
              {NETWORK_LABELS[id]}
              <span className="legend__abbr">
                {id} · {NETWORK_POSITION[id]}
              </span>
            </p>
            <p className="legend__gloss">{NETWORK_GLOSS[id]}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
