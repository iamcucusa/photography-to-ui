/**
 * Lane-strip spark — a tiny connectome FRAGMENT for a collapsed lane, replacing
 * the degree bar-sparkline with a real node-link subset of that network.
 *
 * The most-connected regions of one network (+ their intra-set edges) are laid
 * out by a small, one-shot d3-force sim into a bilateral STRIPE: hemisphere
 * spreads along the strip's long axis (L−, M0, R+) while the short axis is
 * flattened to a centerline, so it echoes the hero graph's own orientation at
 * that breakpoint — a horizontal band for the accordion row, a vertical column
 * for the board rail. Static (build → settle → read positions); no per-frame
 * work, no observer. Colors are applied in the draw layer (LaneSpark).
 */

import { forceSimulation, forceManyBody, forceCollide, forceLink, forceX, forceY } from 'd3-force'
import type { BrainNode, BrainEdge } from './model/types'
import { hemiSign, hashJitter } from './geometry'
import { settle, type SimNode, type SimLink } from './layout'

/** row = horizontal stripe (accordion); rail = vertical stripe (board column). */
export type SparkOrientation = 'row' | 'rail'

export interface SparkNode {
  id: string
  x: number
  y: number
  r: number
  degree: number
  richClub: boolean
}
export interface SparkLink {
  key: string
  x1: number
  y1: number
  x2: number
  y2: number
  weight: number
}
export interface Spark {
  nodes: SparkNode[]
  links: SparkLink[]
  viewBox: string
}

// Tailored per shape: the row is a short wide band (lean subset, hard flatten);
// the rail is a corner piece at the column's foot — a slightly richer, stubbier
// vertical cluster (gentler flatten) that fills its corner in both dimensions
// without competing with the focused lane's content.
const SUBSET: Record<SparkOrientation, number> = { row: 7, rail: 9 }
const HEMI_SPREAD: Record<SparkOrientation, number> = { row: 30, rail: 34 }
const FLATTEN: Record<SparkOrientation, number> = { row: 0.42, rail: 0.3 }
const PAD = 3 // viewBox breathing room (spark units)

/** Small radius from degree, rich-club bump — the spark's own scale, not the hero's. */
function sparkRadius(d: BrainNode): number {
  const r = 2.2 + d.degree * 3.2
  return d.richClub ? r + 1 : r
}

export function buildSpark(
  allNodes: BrainNode[],
  allEdges: BrainEdge[],
  orientation: SparkOrientation,
): Spark {
  const spread = HEMI_SPREAD[orientation]
  const subset = [...allNodes].sort((a, b) => b.degree - a.degree).slice(0, SUBSET[orientation])
  const ids = new Set(subset.map((n) => n.id))
  const edges = allEdges.filter((e) => ids.has(e.source) && ids.has(e.target))

  const nodes: SimNode[] = subset.map((n) => ({
    ...n,
    x: hashJitter(n.id) * spread,
    y: hashJitter(n.id + '#y') * spread,
    vx: 0,
    vy: 0,
  }))
  const links: SimLink[] = edges.map((e) => ({ ...e }))

  const sim = forceSimulation<SimNode, SimLink>(nodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance((l) => 11 + (1 - l.weight) * 11)
        .strength((l) => 0.2 + l.weight * 0.4),
    )
    .force('charge', forceManyBody<SimNode>().strength(-30).distanceMax(120))
    .force('collide', forceCollide<SimNode>((d) => sparkRadius(d) + 1.4).iterations(2))
    .velocityDecay(0.5)

  // Long axis = hemisphere spread; short axis = flatten to a centerline. Charge
  // guarantees a spread even when the subset is midline-heavy (targets pile at 0),
  // so the stripe never collapses into a blob.
  const flatten = FLATTEN[orientation]
  if (orientation === 'row') {
    sim
      .force('hemi', forceX<SimNode>((d) => hemiSign(d.hemi) * spread).strength(0.13))
      .force('flat', forceY<SimNode>(0).strength(flatten))
  } else {
    sim
      .force('hemi', forceY<SimNode>((d) => hemiSign(d.hemi) * spread).strength(0.13))
      .force('flat', forceX<SimNode>(0).strength(flatten))
  }

  settle(sim, 260)
  sim.stop()

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const outNodes: SparkNode[] = nodes.map((n) => {
    const r = sparkRadius(n)
    minX = Math.min(minX, n.x - r)
    maxX = Math.max(maxX, n.x + r)
    minY = Math.min(minY, n.y - r)
    maxY = Math.max(maxY, n.y + r)
    return { id: n.id, x: n.x, y: n.y, r, degree: n.degree, richClub: !!n.richClub }
  })
  const outLinks: SparkLink[] = links.map((l) => {
    const s = l.source as SimNode
    const t = l.target as SimNode
    return { key: `${s.id}-${t.id}`, x1: s.x, y1: s.y, x2: t.x, y2: t.y, weight: l.weight }
  })

  const x = minX - PAD
  const y = minY - PAD
  const w = maxX - minX + PAD * 2
  const h = maxY - minY + PAD * 2
  return {
    nodes: outNodes,
    links: outLinks,
    viewBox: `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`,
  }
}
