import type { CSSProperties } from 'react'
import type { InspectTarget } from '../viz/BrainStage'
import type { VizTokens } from '../viz/runtimeTokens'
import { withAlpha } from '../viz/runtimeTokens'
import { NETWORK_LABELS } from '../viz/model/types'

export interface Placement {
  flipX: boolean
  flipY: boolean
}

interface InspectCardProps {
  target: InspectTarget
  placement: Placement
  tokens: VizTokens
  pinned: boolean
  onClose: () => void
}

const HEMI_LABEL: Record<string, string> = {
  L: 'Left hemisphere',
  R: 'Right hemisphere',
  M: 'Midline',
}

/**
 * Inspect card — the single-node reading surface. Anchored near the node (offset
 * so it never covers it, flipped near the edges) with a network-colored accent,
 * the region's plain-language craft role up front, and its connectivity data.
 *
 * A11y: a pinned card is a `dialog` labelled by its title; a transient hover/focus
 * card is `aria-hidden` because the node's own aria-label already conveys the same
 * information to screen readers (avoids a verbose double announcement).
 *
 * Elevation is emitted light: the sheet's glow is tinted by the inspected
 * node's network, composed at runtime (alphas mirror --shadow-glow-accent's
 * ring/mid/halo structure) and handed to CSS as custom properties. One
 * --inspect-network var also colors the bar fill and tag dots. (The old 3px
 * accent edge was removed: the glow states the network; a solid top strip
 * against the 40% rim read as vestigial titlebar chrome.)
 */
export function InspectCard({ target, placement, tokens, pinned, onClose }: InspectCardProps) {
  const { node, cx, cy } = target
  const net = tokens.network[node.network]
  const pct = Math.round(node.degree * 100)
  const titleId = `inspect-title-${node.id}`

  const cls = [
    'inspect-card',
    placement.flipX ? 'inspect-card--left' : 'inspect-card--right',
    placement.flipY ? 'inspect-card--below' : 'inspect-card--above',
  ].join(' ')

  const sheetStyle = {
    left: `${cx}px`,
    top: `${cy}px`,
    '--inspect-network': net.base,
    '--inspect-glow-rim': withAlpha(net.base, 0.4),
    '--inspect-glow-mid': withAlpha(net.bright, 0.22),
    '--inspect-glow-halo': withAlpha(net.dim, 0.18),
  } as CSSProperties

  return (
    <div
      className={cls}
      style={sheetStyle}
      role={pinned ? 'dialog' : undefined}
      aria-labelledby={pinned ? titleId : undefined}
      aria-hidden={pinned ? undefined : true}
    >
      <div className="inspect-card__body">
        <div className="inspect-card__head">
          <span className="inspect-card__network">
            {NETWORK_LABELS[node.network]}{' '}
            <span className="inspect-card__abbr">{node.network}</span>
          </span>
          {pinned && (
            <button
              type="button"
              className="inspect-card__close"
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

        <h3 id={titleId} className="inspect-card__title">
          {node.label}
        </h3>
        <p className="inspect-card__sub">
          {HEMI_LABEL[node.hemi]} · <span className="inspect-card__id">{node.id}</span>
        </p>

        {node.role && <p className="inspect-card__role">{node.role}</p>}

        <div className="inspect-card__stats">
          <div className="inspect-card__stat">
            <span className="inspect-card__stat-label">Connectivity</span>
            <span className="inspect-card__bar" aria-hidden="true">
              <span className="inspect-card__bar-fill" style={{ width: `${pct}%` }} />
            </span>
            <span className="inspect-card__stat-value">{pct}%</span>
          </div>

          {(node.richClub || node.switcher) && (
            <ul className="inspect-card__tags">
              {node.richClub && <li className="inspect-card__tag">Rich-club hub</li>}
              {node.switcher && <li className="inspect-card__tag">Initiates switching</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
