import { useMemo, type ReactNode } from 'react'
import type { VizTokens } from '../viz/runtimeTokens'
import type { BrainGraph, NetworkId } from '../viz/model/types'
import { NETWORK_ORDER } from '../viz/model/types'
import { createSubstrateSimulation, settle } from '../viz/layout'
import { nodeRadius } from '../viz/geometry'
import type { Substrate } from './LaneSubstrate'
import { LanesAccordion } from './LanesAccordion'
import { LanesBoard } from './LanesBoard'
import { LanesCarousel } from './LanesCarousel'
import type { LaneDatum, SharedLaneProps } from './laneModeData'

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

export interface BrainLanesProps {
  graph: BrainGraph
  tokens: VizTokens
  inspectedId: string | null
  onNodeHover: (id: string | null) => void
  onNodeSelect: (id: string) => void
}

/** TEMPORARY bakeoff wrapper: labels each interaction mode being compared. */
function BakeoffSection({
  label,
  note,
  children,
}: {
  label: string
  note: string
  children: ReactNode
}) {
  return (
    <section className="lane-bakeoff" aria-label={label}>
      <p className="lane-bakeoff__head">
        <span className="lane-bakeoff__tag">bakeoff</span>
        <span className="lane-bakeoff__name">{label}</span>
        <span className="lane-bakeoff__note">{note}</span>
      </p>
      {children}
    </section>
  )
}

/**
 * The three-lane reading surface — one lane per network (DMN · SN · FPCN, SN
 * central), the hero's three bands "unrolled to be read". Currently carries the
 * INTERACTION bakeoff: the same lanes rendered three ways (Accordion · Board ·
 * Carousel), stacked, so the maintainer picks one live — then the converge commit
 * keeps the winner and deletes the losers + this harness.
 */
export function BrainLanes({
  graph,
  tokens,
  inspectedId,
  onNodeHover,
  onNodeSelect,
}: BrainLanesProps) {
  const lanes: LaneDatum[] = useMemo(
    () =>
      NETWORK_ORDER.map((id) => ({
        network: id,
        nodes: graph.nodes.filter((n) => n.network === id),
        substrate: buildSubstrate(id, graph),
      })),
    [graph],
  )

  const shared: SharedLaneProps = { tokens, inspectedId, onNodeHover, onNodeSelect }

  return (
    <section className="lanes" aria-label="Read the three networks">
      <BakeoffSection label="A · Accordion" note="stacked · each collapses to a strip">
        <LanesAccordion lanes={lanes} {...shared} />
      </BakeoffSection>
      <BakeoffSection
        label="B · Board → focus"
        note="columns · click to expand · narrow → accordion"
      >
        <LanesBoard lanes={lanes} {...shared} />
      </BakeoffSection>
      <BakeoffSection label="C · Carousel" note="one at a time · swipe / tabs / arrows">
        <LanesCarousel lanes={lanes} {...shared} />
      </BakeoffSection>
    </section>
  )
}
