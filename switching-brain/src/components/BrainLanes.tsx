import { useMemo } from 'react'
import type { VizTokens } from '../viz/runtimeTokens'
import type { BrainGraph, NetworkId } from '../viz/model/types'
import { NETWORK_ORDER } from '../viz/model/types'
import { createSubstrateSimulation, settle } from '../viz/layout'
import { nodeRadius } from '../viz/geometry'
import { Lane } from './Lane'
import type { Substrate } from './LaneSubstrate'

/** Filter the graph to one network's nodes + intra-network edges, lay it out, bbox-fit. */
function buildSubstrate(network: NetworkId, graph: BrainGraph): Substrate {
  const nodes = graph.nodes.filter((n) => n.network === network)
  const ids = new Set(nodes.map((n) => n.id))
  const edges = graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target))

  const sim = createSubstrateSimulation({ nodes, edges })
  settle(sim.sim, 200)
  sim.sim.stop()

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const n of sim.nodes) {
    const r = nodeRadius(n)
    minX = Math.min(minX, n.x - r)
    maxX = Math.max(maxX, n.x + r)
    minY = Math.min(minY, n.y - r)
    maxY = Math.max(maxY, n.y + r)
  }
  const pad = 14
  const x = minX - pad
  const y = minY - pad
  const w = maxX - minX + pad * 2
  const h = maxY - minY + pad * 2

  return {
    network,
    nodes: sim.nodes,
    links: sim.links,
    viewBox: `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`,
  }
}

export interface BrainLanesProps {
  graph: BrainGraph
  tokens: VizTokens
  /** Active node id (from the graph or a lane) — drives graph↔lane highlight. */
  inspectedId: string | null
  onNodeHover: (id: string | null) => void
  onNodeSelect: (id: string) => void
}

/**
 * The three-lane reading surface — one lane per network (DMN · SN · FPCN), the
 * hero's three bands "unrolled to be read". Each lane is a band of emitted light
 * (seams, no boxes) over its own faint connectome, holding readable node
 * readouts. Rendered below the hero; SN central by source order (NETWORK_ORDER).
 */
export function BrainLanes({
  graph,
  tokens,
  inspectedId,
  onNodeHover,
  onNodeSelect,
}: BrainLanesProps) {
  // Per-network nodes + static substrate, rebuilt only when the graph changes.
  const lanes = useMemo(
    () =>
      NETWORK_ORDER.map((id) => ({
        network: id,
        nodes: graph.nodes.filter((n) => n.network === id),
        substrate: buildSubstrate(id, graph),
      })),
    [graph],
  )

  return (
    <section className="lanes" aria-label="Read the three networks">
      {lanes.map(({ network, nodes, substrate }) => (
        <Lane
          key={network}
          network={network}
          nodes={nodes}
          substrate={substrate}
          tokens={tokens}
          inspectedId={inspectedId}
          onNodeHover={onNodeHover}
          onNodeSelect={onNodeSelect}
        />
      ))}
    </section>
  )
}
