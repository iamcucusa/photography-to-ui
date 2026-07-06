import { useMemo } from 'react'
import type { VizTokens } from '../viz/runtimeTokens'
import { withAlpha } from '../viz/runtimeTokens'
import type { BrainNode, BrainEdge, NetworkId } from '../viz/model/types'
import { buildSpark, type SparkOrientation } from '../viz/spark'

interface LaneSparkProps {
  network: NetworkId
  nodes: BrainNode[]
  edges: BrainEdge[]
  tokens: VizTokens
  orientation: SparkOrientation
}

/**
 * A collapsed lane's spark — a mini node-link fragment of its network (built by
 * `buildSpark`), replacing the degree bar-sparkline. Rich-club hubs read brightest,
 * edges fade by weight; the whole thing scales to its box via the viewBox. Static
 * and aria-hidden (the readable summary is the tagline beside it).
 */
export function LaneSpark({ network, nodes, edges, tokens, orientation }: LaneSparkProps) {
  const net = tokens.network[network]
  const spark = useMemo(() => buildSpark(nodes, edges, orientation), [nodes, edges, orientation])

  return (
    <svg
      className={`lane-spark lane-spark--${orientation}`}
      viewBox={spark.viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <g strokeLinecap="round" strokeWidth={1}>
        {spark.links.map((l) => (
          <line
            key={l.key}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={withAlpha(net.base, 0.24 + l.weight * 0.32)}
          />
        ))}
      </g>
      <g>
        {spark.nodes.map((n) => (
          <circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={withAlpha(n.richClub ? net.bright : net.base, 0.5 + n.degree * 0.4)}
          />
        ))}
      </g>
    </svg>
  )
}
