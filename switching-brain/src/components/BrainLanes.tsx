import { useMemo, type CSSProperties } from 'react'
import type { VizTokens } from '../viz/runtimeTokens'
import { withAlpha } from '../viz/runtimeTokens'
import type { BrainGraph, NetworkId } from '../viz/model/types'
import { NETWORK_ORDER, NETWORK_LABELS, NETWORK_GLOSS } from '../viz/model/types'
import { createSubstrateSimulation, settle } from '../viz/layout'
import { nodeRadius } from '../viz/geometry'
import { LaneSubstrate, type Substrate } from './LaneSubstrate'

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
}

/**
 * The three-lane reading surface — one lane per network (DMN · SN · FPCN), the
 * hero's three bands "unrolled to be read". Each lane is a band of emitted light
 * (seams, no boxes) over its own faint connectome. Rendered below the hero; SN is
 * central by source order (NETWORK_ORDER = [DMN, SN, FPCN]).
 */
export function BrainLanes({ graph, tokens }: BrainLanesProps) {
  // Static substrates: laid out once per graph, no per-frame sim.
  const substrates = useMemo(() => {
    const map = {} as Record<NetworkId, Substrate>
    for (const id of NETWORK_ORDER) map[id] = buildSubstrate(id, graph)
    return map
  }, [graph])

  return (
    <section className="lanes" aria-label="Read the three networks">
      {NETWORK_ORDER.map((id) => {
        const net = tokens.network[id]
        const style = {
          '--lane-base': net.base,
          '--lane-seam': withAlpha(net.base, 0.55),
        } as CSSProperties
        return (
          <article className="lane" key={id} data-network={id} style={style}>
            <LaneSubstrate substrate={substrates[id]} tokens={tokens} />
            <header className="lane__header">
              <h2 className="lane__name">
                {NETWORK_LABELS[id]} <span className="lane__abbr">{id}</span>
              </h2>
              <p className="lane__gloss">{NETWORK_GLOSS[id]}</p>
            </header>
          </article>
        )
      })}
    </section>
  )
}
