import type { BrainNode } from '../viz/model/types'
import { NETWORK_LABELS, HEMI_LABEL } from '../viz/model/types'

export interface NodeReadoutProps {
  node: BrainNode
  /** BEM block prefix: 'inspect-card' (anchored card) or 'lane-readout' (in-lane). */
  block: 'inspect-card' | 'lane-readout'
  /** Show the network label header (the card does; a lane's header already states it). */
  showNetwork?: boolean
  /** Show the close button (the card, when pinned). */
  showClose?: boolean
  onClose?: () => void
  /** Title element id, for the card's `aria-labelledby`. */
  titleId?: string
  /** Lane only: the contralateral twin's id — renders a mirror mark by the id so
   *  a bilateral pair's repeated role prose reads as symmetry, not duplication. */
  mirror?: string
}

/**
 * The single-node readout — region identity, plain-language craft role,
 * connectivity bar, and rich-club / switcher tags. Shared by the anchored
 * `InspectCard` (`block="inspect-card"`) and the in-lane entries
 * (`block="lane-readout"`); the `block` prop swaps the BEM family so the card
 * path emits byte-identical class strings — no visual regression on the card.
 *
 * The identity line differs by context: the card shows `label` then
 * `hemisphere · id` (it stands alone); a lane entry leads with the `id` then the
 * `name` (the facet grouping already states the hemisphere — no per-entry repeat).
 */
export function NodeReadout({
  node,
  block,
  showNetwork = false,
  showClose = false,
  onClose,
  titleId,
  mirror,
}: NodeReadoutProps) {
  const pct = Math.round(node.degree * 100)
  const showHead = showNetwork || showClose

  return (
    <div className={`${block}__body`}>
      {showHead && (
        <div className={`${block}__head`}>
          {showNetwork && (
            <span className={`${block}__network`}>
              {NETWORK_LABELS[node.network]}{' '}
              <span className={`${block}__abbr`}>{node.network}</span>
            </span>
          )}
          {showClose && (
            <button
              type="button"
              className={`${block}__close`}
              onClick={onClose}
              aria-label="Close details"
            >
              <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {block === 'lane-readout' ? (
        // Lane IA — three lines: an eyebrow (id · mirror · connectivity) so the
        // value never wraps the name, then the name as the headline, then role.
        // The hemisphere is already stated by the facet grouping (no repeat).
        <>
          <p className={`${block}__meta`}>
            <span className={`${block}__id`}>{node.id}</span>
            {mirror && <MirrorMark />}
            {/* Connectivity — details-on-demand: hidden at rest, revealed on the
                hover/focus/tap that selects the entry (touch-safe). aria-hidden:
                the entry aria-label carries the number authoritatively. */}
            <span className={`${block}__value-inline`} aria-hidden="true">
              {pct}%
            </span>
          </p>
          <h3 id={titleId} className={`${block}__title`}>
            <span className={`${block}__name`}>{node.label}</span>
          </h3>
        </>
      ) : (
        <>
          <h3 id={titleId} className={`${block}__title`}>
            {node.label}
          </h3>
          <p className={`${block}__sub`}>
            {HEMI_LABEL[node.hemi]} · <span className={`${block}__id`}>{node.id}</span>
          </p>
        </>
      )}

      {node.role && <p className={`${block}__role`}>{node.role}</p>}

      <div className={`${block}__stats`}>
        {/* The labeled bar + % is the card's canonical datum. In a lane the value
            lives on the eyebrow (or as a foot trace), so the bar isn't rendered. */}
        {block !== 'lane-readout' && (
          <div className={`${block}__stat`}>
            <span className={`${block}__stat-label`}>Connectivity</span>
            <span className={`${block}__bar`} aria-hidden="true">
              <span className={`${block}__bar-fill`} style={{ width: `${pct}%` }} />
            </span>
            <span className={`${block}__stat-value`}>{pct}%</span>
          </div>
        )}

        {(node.richClub || node.switcher) && (
          <ul className={`${block}__tags`}>
            {node.richClub && <li className={`${block}__tag`}>Rich-club hub</li>}
            {node.switcher && <li className={`${block}__tag`}>Initiates switching</li>}
          </ul>
        )}
      </div>
    </div>
  )
}

/** A tiny mirror mark (↔) for a bilateral lane entry — sits by the id to signal
 *  "this region has a contralateral twin", so the twin's repeated role prose
 *  reads as anatomical symmetry rather than a copy-paste. Inherits the lane
 *  accent via currentColor; decorative (the entry's aria-label states it). */
function MirrorMark() {
  return (
    <svg className="lane-readout__mirror" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8H13M3 8L6 5M3 8L6 11M13 8L10 5M13 8L10 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
