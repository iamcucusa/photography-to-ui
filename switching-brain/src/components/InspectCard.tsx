import type { CSSProperties } from 'react'
import type { InspectTarget } from '../viz/BrainStage'
import type { VizTokens } from '../viz/runtimeTokens'
import { withAlpha } from '../viz/runtimeTokens'
import { NodeReadout } from './NodeReadout'

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
      <NodeReadout
        node={node}
        block="inspect-card"
        showNetwork
        showClose={pinned}
        onClose={onClose}
        titleId={titleId}
      />
    </div>
  )
}
