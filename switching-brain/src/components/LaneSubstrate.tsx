import type { VizTokens } from '../viz/runtimeTokens'
import { withAlpha } from '../viz/runtimeTokens'
import type { NetworkId } from '../viz/model/types'
import type { SimNode, SimLink } from '../viz/layout'
import { nodeRadius, controlPoint } from '../viz/geometry'

/** A single network's settled subgraph + its bbox viewBox — built by BrainLanes. */
export interface Substrate {
  network: NetworkId
  nodes: SimNode[]
  links: SimLink[]
  viewBox: string
}

/**
 * The faint background field for one lane: the network's real intra-network
 * connectome (nodes + edges), laid out once (static) and drawn low-opacity in the
 * network hue. Real data as substrate, never decoration — kept subtle so it never
 * competes with the hero graph. `aria-hidden`: it's ambient texture, not content.
 */
export function LaneSubstrate({ substrate, tokens }: { substrate: Substrate; tokens: VizTokens }) {
  const net = tokens.network[substrate.network]
  const edgeColor = withAlpha(net.dim, 0.4)
  const nodeColor = withAlpha(net.base, 0.5)

  return (
    <svg
      className="lane-substrate"
      viewBox={substrate.viewBox}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g className="lane-substrate__edges" fill="none" stroke={edgeColor}>
        {substrate.links.map((l, i) => {
          const s = l.source as SimNode
          const t = l.target as SimNode
          const dist = Math.hypot(t.x - s.x, t.y - s.y)
          const { cx, cy } = controlPoint(s.x, s.y, t.x, t.y, 0.08 * dist)
          return (
            <path
              key={i}
              d={`M${s.x.toFixed(1)},${s.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${t.x.toFixed(1)},${t.y.toFixed(1)}`}
              strokeWidth={(0.8 + l.weight * 1.2).toFixed(2)}
            />
          )
        })}
      </g>
      <g className="lane-substrate__nodes" fill={nodeColor}>
        {substrate.nodes.map((n) => (
          <circle key={n.id} cx={n.x.toFixed(1)} cy={n.y.toFixed(1)} r={nodeRadius(n).toFixed(1)} />
        ))}
      </g>
    </svg>
  )
}
