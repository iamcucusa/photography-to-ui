/**
 * Force layout — direction B (Living Network).
 *
 * Bilateral and interleaved per the brief: hemisphere drives a horizontal lean
 * (L←, R→, M center) while network drives a vertical band (DMN top, SN middle,
 * FPCN bottom). The two are independent, so hemispheres interpenetrate and
 * callosal edges cross the vertical midline constantly — integration, not two
 * opposed halves. The vertical banding also makes the DMN↔FPCN antiphase
 * legible (a see-saw) and gives network a POSITION encoding, not just hue.
 *
 * The custom `anchor` force reads a live per-network cohesion multiplier each
 * tick, so phase 4 can pull the activating network tighter and let the other
 * relax — layout cohesion as data, not decoration.
 */

import {
  forceSimulation,
  forceManyBody,
  forceCollide,
  forceLink,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import type { BrainGraph, BrainNode, NetworkId } from './model/types'
import { STAGE_W, STAGE_H, nodeRadius, hemiSign, hashJitter } from './geometry'

export interface SimNode extends BrainNode, SimulationNodeDatum {
  x: number
  y: number
}

export interface SimLink extends SimulationLinkDatum<SimNode> {
  source: SimNode | string
  target: SimNode | string
  weight: number
  type: BrainGraph['edges'][number]['type']
}

/** Per-network cohesion: 1 = resting. >1 pulls tighter, <1 relaxes/drifts. */
export type CohesionFn = (network: NetworkId) => number

const X_SPREAD = STAGE_W * 0.26
/** Plot is nudged right of center to reserve a left gutter for the band labels. */
export const PLOT_X_OFFSET = STAGE_W * 0.07
/** Vertical band centers per network — also used by the stage for axis labels. */
export const NETWORK_Y: Record<NetworkId, number> = {
  DMN: -STAGE_H * 0.3,
  SN: 0,
  FPCN: STAGE_H * 0.3,
}
const JITTER_X = 95
const JITTER_Y = 95
const ANCHOR_STRENGTH = 0.055

function anchorTargets(node: BrainNode): { tx: number; ty: number } {
  // Two independent deterministic jitters from the id so M nodes don't stack and
  // each network band has spread without random (keeps the export loop stable).
  const jx = hashJitter(node.id)
  const jy = hashJitter(node.id + '#y')
  return {
    tx: PLOT_X_OFFSET + hemiSign(node.hemi) * X_SPREAD + jx * JITTER_X,
    ty: NETWORK_Y[node.network] + jy * JITTER_Y,
  }
}

/** Custom force: nudge each node toward its anchor, scaled by live cohesion. */
function anchorForce(getCohesion: CohesionFn) {
  let nodes: SimNode[] = []
  const force = (alpha: number) => {
    for (const d of nodes) {
      const { tx, ty } = anchorTargets(d)
      const k = ANCHOR_STRENGTH * getCohesion(d.network) * alpha
      d.vx = (d.vx ?? 0) + (tx - d.x) * k
      d.vy = (d.vy ?? 0) + (ty - d.y) * k
    }
  }
  force.initialize = (n: SimNode[]) => {
    nodes = n
  }
  return force
}

export interface BrainSim {
  sim: Simulation<SimNode, SimLink>
  nodes: SimNode[]
  links: SimLink[]
}

export function createBrainSimulation(
  graph: BrainGraph,
  getCohesion: CohesionFn = () => 1,
): BrainSim {
  const nodes: SimNode[] = graph.nodes.map((n) => {
    const { tx, ty } = anchorTargets(n)
    return { ...n, x: tx, y: ty, vx: 0, vy: 0 }
  })
  const links: SimLink[] = graph.edges.map((e) => ({ ...e }))

  const sim = forceSimulation<SimNode, SimLink>(nodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance((l) => 64 + (1 - l.weight) * 72)
        .strength((l) => (l.type === 'callosal' ? 0.04 : l.weight * 0.22)),
    )
    .force('charge', forceManyBody<SimNode>().strength(-58).distanceMax(420))
    .force('collide', forceCollide<SimNode>((d) => nodeRadius(d) + 5).iterations(2))
    .force('anchor', anchorForce(getCohesion))
    .velocityDecay(0.45)

  return { sim, nodes, links }
}

/** Run the simulation to a settled static layout (no animation). */
export function settle(sim: Simulation<SimNode, SimLink>, ticks = 300): void {
  sim.alpha(1).stop()
  for (let i = 0; i < ticks; i++) sim.tick()
}
