import type { BrainNode } from '../viz/model/types'
import { NETWORK_LABELS } from '../viz/model/types'

const HEMI_LABEL: Record<string, string> = {
  L: 'Left hemisphere',
  R: 'Right hemisphere',
  M: 'Midline',
}

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
}

/**
 * The single-node readout — region label, hemisphere · id, plain-language craft
 * role, connectivity bar, and rich-club / switcher tags. Shared verbatim by the
 * anchored `InspectCard` (`block="inspect-card"`) and the in-lane entries
 * (`block="lane-readout"`). The `block` prop swaps the BEM family so the card
 * path emits byte-identical class strings — no visual regression on the card.
 */
export function NodeReadout({
  node,
  block,
  showNetwork = false,
  showClose = false,
  onClose,
  titleId,
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

      <h3 id={titleId} className={`${block}__title`}>
        {node.label}
      </h3>
      <p className={`${block}__sub`}>
        {HEMI_LABEL[node.hemi]} · <span className={`${block}__id`}>{node.id}</span>
      </p>

      {node.role && <p className={`${block}__role`}>{node.role}</p>}

      <div className={`${block}__stats`}>
        <div className={`${block}__stat`}>
          <span className={`${block}__stat-label`}>Connectivity</span>
          <span className={`${block}__bar`} aria-hidden="true">
            <span className={`${block}__bar-fill`} style={{ width: `${pct}%` }} />
          </span>
          <span className={`${block}__stat-value`}>{pct}%</span>
        </div>

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
