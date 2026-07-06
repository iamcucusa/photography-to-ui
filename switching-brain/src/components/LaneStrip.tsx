import type { CSSProperties } from 'react'
import type { VizTokens } from '../viz/runtimeTokens'
import { withAlpha } from '../viz/runtimeTokens'
import type { BrainNode, BrainEdge, NetworkId } from '../viz/model/types'
import { networkVoice } from '../viz/model/types'
import { LaneSpark } from './LaneSpark'

export interface LaneStripProps {
  network: NetworkId
  nodes: BrainNode[]
  /** Intra-network edges — the strip's connectome spark. */
  edges: BrainEdge[]
  tokens: VizTokens
  /** aria-expanded (accordion) / active column (board). */
  expanded: boolean
  /** Click / Enter / Space → expand this lane. */
  onToggle: () => void
  /** 'row' = full-width horizontal strip; 'rail' = compact vertical column. */
  variant: 'row' | 'rail'
  /** id of the region this strip toggles (a11y). */
  controlsId?: string
}

/**
 * The collapsed representation of a lane — a boxless seam of light (glow, not a
 * card): lead label · connectome spark · abbr. The whole strip IS the toggle
 * button, so keyboard + focus ring + aria-expanded come for free. It renders NO
 * node entries and NO LaneSubstrate, so a collapsed lane mounts no
 * ResizeObserver — the harness perf win. Shared by the accordion (collapsed
 * lanes, horizontal spark) and the board (unfocused rails, vertical spark).
 */
export function LaneStrip({
  network,
  nodes,
  edges,
  tokens,
  expanded,
  onToggle,
  variant,
  controlsId,
}: LaneStripProps) {
  const net = tokens.network[network]
  const { persona, tagline } = networkVoice(network)
  // Same network glow props Lane sets inline, so the strip glows identically.
  const style = {
    '--lane-base': net.base,
    '--lane-accent': net.bright,
    '--lane-glow-rim': withAlpha(net.base, 0.4),
    '--lane-glow-mid': withAlpha(net.bright, 0.22),
    '--lane-glow-halo': withAlpha(net.dim, 0.18),
  } as CSSProperties

  return (
    <button
      type="button"
      className={`lane-strip lane-strip--${variant}`}
      data-network={network}
      style={style}
      aria-expanded={expanded}
      aria-controls={controlsId}
      onClick={onToggle}
    >
      {/* No swatch dot — the network's hue is already stated by the lead label
          (accent-colored) and the spark. Rail (board) leads with the persona; the
          accordion's row leads with the tagline alone — the persona moves into
          the expanded lane's header. */}
      {variant === 'rail' && <span className="lane-strip__persona">{persona}</span>}
      <span className="lane-strip__gloss">{tagline.replace(/\.$/, '')}</span>
      {/* The spark stripe follows the strip's own shape: horizontal band in the
          row, vertical column in the rail — each echoing the hero's orientation. */}
      <LaneSpark
        network={network}
        nodes={nodes}
        edges={edges}
        tokens={tokens}
        orientation={variant}
      />
      <span className="lane-strip__abbr">{network}</span>
    </button>
  )
}
