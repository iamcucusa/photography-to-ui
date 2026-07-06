import { useMemo, useState } from 'react'
import type { VizTokens } from '../viz/runtimeTokens'
import type { BrainGraph, NetworkId } from '../viz/model/types'
import { NETWORK_ORDER } from '../viz/model/types'
import { createSubstrateSimulation, settle } from '../viz/layout'
import { nodeRadius } from '../viz/geometry'
import { Lane } from './Lane'
import type { Substrate, BgVariant } from './LaneSubstrate'
import { LanePrototypeControls } from './LanePrototypeControls'
import type { IaLayout } from './laneLayout'

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
  const bbox = { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 }

  return {
    network,
    nodes: sim.nodes,
    links: sim.links,
    bbox,
    viewBox: `${bbox.x.toFixed(1)} ${bbox.y.toFixed(1)} ${bbox.w.toFixed(1)} ${bbox.h.toFixed(1)}`,
  }
}

/** Each network's own metaphor background (the chosen, converged look):
 *  DMN dreamer = drift · SN switch = pulse · FPCN builder = lattice. */
const NETWORK_BG: Record<NetworkId, BgVariant> = { DMN: 'drift', SN: 'pulse', FPCN: 'lattice' }

export interface BrainLanesProps {
  graph: BrainGraph
  tokens: VizTokens
  inspectedId: string | null
  onNodeHover: (id: string | null) => void
  onNodeSelect: (id: string) => void
}

/**
 * The three-lane reading surface — one lane per network (DMN · SN · FPCN), the
 * hero's three bands "unrolled to be read". Rendered below the hero; SN central
 * by source order. Currently carries the reading-experience bakeoff harness
 * (background × IA layout × pairs) — removed on converge.
 */
export function BrainLanes({
  graph,
  tokens,
  inspectedId,
  onNodeHover,
  onNodeSelect,
}: BrainLanesProps) {
  const lanes = useMemo(
    () =>
      NETWORK_ORDER.map((id) => ({
        network: id,
        nodes: graph.nodes.filter((n) => n.network === id),
        substrate: buildSubstrate(id, graph),
      })),
    [graph],
  )

  // Layout is the last prototype axis still under review; background, value
  // treatment, and pairs (keep) are all concluded.
  const [layout, setLayout] = useState<IaLayout>('echo-hero')

  return (
    <section className="lanes" aria-label="Read the three networks">
      <LanePrototypeControls layout={layout} setLayout={setLayout} />
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
          bgVariant={NETWORK_BG[network]}
          iaLayout={layout}
        />
      ))}
    </section>
  )
}
