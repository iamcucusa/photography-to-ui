import { useMemo, useState } from 'react'
import type { VizTokens } from '../viz/runtimeTokens'
import type { BrainGraph, NetworkId } from '../viz/model/types'
import { NETWORK_ORDER } from '../viz/model/types'
import { createSubstrateSimulation, settle } from '../viz/layout'
import { nodeRadius } from '../viz/geometry'
import { useMediaQuery } from '../viz/useMediaQuery'
import type { Substrate } from './LaneSubstrate'
import { LanesAccordion } from './LanesAccordion'
import { LanesBoard } from './LanesBoard'
import { LanesCarousel } from './LanesCarousel'
import { LanesViewToggle, type DeskMode } from './LanesViewToggle'
import { LaneCursor } from './LaneCursor'
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

/**
 * The three-lane reading surface — one lane per network (DMN · SN · FPCN, SN
 * central), the hero's three bands "unrolled to be read". The interaction adapts
 * by viewport tier, each mode owning the breakpoint where it's strongest:
 *
 *   ≥1024px landscape → Board     — 3 columns + focus-morph (room to compare)
 *   ≤560px  portrait  → Carousel  — one-handed swipe; ≤560 is the hero's own
 *                                    orientation flip, so its L→R order rhymes
 *                                    with the phone hero's L→R network columns
 *   in between        → Accordion — stacked bands, matching the wide hero, and
 *                                    the most robust anywhere (tablet, landscape
 *                                    phone, large portrait)
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
      NETWORK_ORDER.map((id) => {
        const nodes = graph.nodes.filter((n) => n.network === id)
        const nodeIds = new Set(nodes.map((n) => n.id))
        const edges = graph.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
        return { network: id, nodes, edges, substrate: buildSubstrate(id, graph) }
      }),
    [graph],
  )

  const shared: SharedLaneProps = { tokens, inspectedId, onNodeHover, onNodeSelect }

  // Tier selection. 1024px+landscape is the board's column threshold; 560px is
  // the hero's orientation-flip line (App.tsx) — below it, in portrait, the
  // device is a one-handed phone and the hero reads as L→R columns.
  const boardTier = useMediaQuery('(min-width: 1024px) and (orientation: landscape)')
  const phoneTier = useMediaQuery('(max-width: 560px) and (orientation: portrait)')

  // On the desktop tier there's room for either arrangement, so let the reader
  // choose: Columns (Board, the default) or Stacked (Accordion). Persists across
  // renders; only surfaced on the board tier.
  const [deskMode, setDeskMode] = useState<DeskMode>('board')

  // The focused network, lifted here so it survives a tier swap — Board's focused
  // column and the Carousel's active slide are the same concept, so rotating a
  // device or resizing a window keeps your place instead of resetting to SN.
  const [activeNetwork, setActiveNetwork] = useState<NetworkId>('SN')

  return (
    <section className="lanes" aria-labelledby="lanes-heading">
      <header className="lanes__intro">
        <h2 id="lanes-heading" className="lanes__title">
          The three networks, up close
        </h2>
        <p className="lanes__lead">
          Each band from the map above, unrolled to read — the dreamer, the switch, and the builder.
        </p>
      </header>
      {boardTier ? (
        <>
          <LanesViewToggle mode={deskMode} onChange={setDeskMode} />
          {deskMode === 'board' ? (
            <LanesBoard
              lanes={lanes}
              {...shared}
              focused={activeNetwork}
              onFocus={setActiveNetwork}
            />
          ) : (
            <LanesAccordion lanes={lanes} {...shared} />
          )}
        </>
      ) : phoneTier ? (
        <LanesCarousel
          lanes={lanes}
          {...shared}
          active={activeNetwork}
          onActive={setActiveNetwork}
        />
      ) : (
        <LanesAccordion lanes={lanes} {...shared} />
      )}
      <LaneCursor />
    </section>
  )
}
