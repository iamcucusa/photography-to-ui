import type { CSSProperties, KeyboardEvent } from 'react'
import type { VizTokens } from '../viz/runtimeTokens'
import { withAlpha } from '../viz/runtimeTokens'
import type { BrainNode, NetworkId } from '../viz/model/types'
import { NETWORK_LABELS, NETWORK_GLOSS, HEMI_LABEL } from '../viz/model/types'
import { LaneSubstrate, type Substrate } from './LaneSubstrate'
import { NodeReadout } from './NodeReadout'

/** The whole readout as one string — the accessible name for an entry (its rich
 *  visible content is presentational under role="button"). Mirrors the graph
 *  node's aria-label so the lanes are a full non-hover reading path. */
function entryLabel(node: BrainNode): string {
  const pct = Math.round(node.degree * 100)
  const tags = [node.richClub && 'rich-club hub', node.switcher && 'initiates switching']
    .filter(Boolean)
    .join(', ')
  const role = node.role ? ` ${node.role}` : ''
  return `${node.label}, ${HEMI_LABEL[node.hemi]}.${role} ${pct}% connectivity${tags ? `. ${tags}` : ''}`
}

export interface LaneProps {
  network: NetworkId
  nodes: BrainNode[]
  substrate: Substrate
  tokens: VizTokens
  /** The active node (graph or lane), for graph→lane highlight. */
  inspectedId: string | null
  onNodeHover: (id: string | null) => void
  onNodeSelect: (id: string) => void
}

/**
 * One network band: seam of light + faint connectome + a threaded set of node
 * readouts. Each entry is a custom button (rich readout visible, concise
 * aria-label for SR); hovering/focusing it highlights the node in the hero graph,
 * and a graph hover/pin highlights the matching entry here (data-active).
 */
export function Lane({
  network,
  nodes,
  substrate,
  tokens,
  inspectedId,
  onNodeHover,
  onNodeSelect,
}: LaneProps) {
  const net = tokens.network[network]
  const style = {
    '--lane-base': net.base,
    '--lane-seam': withAlpha(net.base, 0.55),
  } as CSSProperties

  const onEntryKey = (e: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onNodeSelect(id)
    }
  }

  return (
    <article className="lane" data-network={network} style={style}>
      <LaneSubstrate substrate={substrate} tokens={tokens} />
      <header className="lane__header">
        <h2 className="lane__name">
          {NETWORK_LABELS[network]} <span className="lane__abbr">{network}</span>
        </h2>
        <p className="lane__gloss">{NETWORK_GLOSS[network]}</p>
      </header>

      <div className="lane__entries">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="lane__entry"
            data-node-id={node.id}
            data-active={inspectedId === node.id || undefined}
            role="button"
            tabIndex={0}
            aria-label={entryLabel(node)}
            onMouseEnter={() => onNodeHover(node.id)}
            onMouseLeave={() => onNodeHover(null)}
            onFocus={() => onNodeHover(node.id)}
            onBlur={() => onNodeHover(null)}
            onClick={() => onNodeSelect(node.id)}
            onKeyDown={(e) => onEntryKey(e, node.id)}
          >
            <NodeReadout node={node} block="lane-readout" />
          </div>
        ))}
      </div>
    </article>
  )
}
