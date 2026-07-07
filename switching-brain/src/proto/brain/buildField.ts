/**
 * Assemble the brain field from EXTRACTED mockup geometry: the vectorized
 * mockup's traced node dots (public/proto-nodes.json — exact positions, radii
 * and color classes) → per-hemisphere Delaunay mesh → rim outline swept through
 * the actual boundary nodes → salience spider → callosal butterfly. Colors are
 * re-mapped to DS tokens in the draw layer; fidelity is by construction.
 */

import type { NetworkId } from '../../viz/model/types'
import type { Pt } from './silhouette'
import { catmullRom } from './silhouette'
import { buildMesh, type Edge } from './mesh'

/** One extracted mockup dot (see scratchpad extractor): hue → class. */
export interface RawNode {
  x: number
  y: number
  r: number
  net: 'gold' | 'blue' | 'magenta' | 'white'
}

/** Node class: the three networks, or a neutral (white) sparkle node. */
export type FieldNet = NetworkId | 'neutral'

export interface FieldNode {
  x: number
  y: number
  net: FieldNet
  r: number
  /** big traced dot → hub treatment (glow) */
  hub: boolean
  /** the central super-hub → the focal point */
  sup: boolean
}

/** A callosal light band: a cubic path + a weight for its fade. */
export interface Fiber {
  d: string
  w: number
}

/** A salience spoke — one magenta edge of the hub's sub-network. */
export interface SnEdge {
  x1: number
  y1: number
  x2: number
  y2: number
  w: number
}

export interface Field {
  nodes: FieldNode[]
  edges: Edge[]
  fibers: Fiber[]
  snEdges: SnEdge[]
  /** Smoothed outer contour swept through the actual boundary nodes. */
  outline: Pt[]
  midX: number
  center: Pt
  vw: number
  vh: number
}

// Mockup-native coordinates (the vectorized SVG's viewBox).
const VW = 1672
const VH = 941
const MID_X = 836 // the mockup's dashed midline
const MAX_EDGE = 60 // trim Delaunay edges longer than this
const HUB_R = 5.8 // traced dots this big glow as hubs (mockup: a select few)

const NET_MAP: Record<RawNode['net'], FieldNet> = {
  gold: 'DMN',
  blue: 'FPCN',
  magenta: 'SN',
  white: 'neutral',
}

/** The callosal light bands — a horizontal butterfly of combed strands crossing
 *  the fissure: wide at the hemispheres, pinched at the midline waist, confined
 *  to the brain's middle third and drawn OVER the node field. */
function buildCallosal(cx: number, cy: number): Fiber[] {
  const N = 16
  const reach = 225
  const waistX = 16
  const waistY = 0.22
  const vspread = 140
  const fibers: Fiber[] = []
  for (let i = 0; i < N; i++) {
    const a = -1 + (2 * i) / (N - 1) // [-1,1]
    const yEnd = cy + a * vspread
    const yWaist = cy + a * vspread * waistY
    const d =
      `M${(cx - reach).toFixed(1)},${yEnd.toFixed(1)} ` +
      `C${(cx - waistX).toFixed(1)},${yWaist.toFixed(1)} ` +
      `${(cx + waistX).toFixed(1)},${yWaist.toFixed(1)} ` +
      `${(cx + reach).toFixed(1)},${yEnd.toFixed(1)}`
    fibers.push({ d, w: 1 - Math.abs(a) * 0.4 })
  }
  return fibers
}

/** Sweep the outer contour: furthest node per angular sector around the
 *  centroid, smoothed with Catmull-Rom → the brain's actual traced border. */
function sweepOutline(pts: Pt[], cx: number, cy: number): Pt[] {
  const SECTORS = 84
  const far: (Pt & { d: number })[] = new Array(SECTORS).fill(null)
  for (const p of pts) {
    const ang = Math.atan2(p.y - cy, p.x - cx)
    const s = Math.floor(((ang + Math.PI) / (2 * Math.PI)) * SECTORS) % SECTORS
    const d = (p.x - cx) ** 2 + (p.y - cy) ** 2
    if (!far[s] || d > far[s].d) far[s] = { ...p, d }
  }
  const ring = far.filter(Boolean).map((p) => ({ x: p.x, y: p.y }))
  // Close the loop for smoothing by wrapping the ends.
  const wrapped = [...ring, ring[0], ring[1]]
  return catmullRom(wrapped, 8)
}

export function buildField(raw: RawNode[]): Field {
  // Vertical centroid of the extracted field = the brain's true centre height;
  // horizontally the mockup's midline is authoritative.
  let sy = 0
  for (const n of raw) sy += n.y
  const cx = MID_X
  const cy = sy / raw.length

  const pts: Pt[] = raw.map((n) => ({ x: n.x, y: n.y }))
  const edges = buildMesh(pts, MID_X, MAX_EDGE)

  // The super-hub: the largest magenta dot nearest the midline centre.
  let supIdx = -1
  let supScore = Infinity
  raw.forEach((n, i) => {
    if (n.net !== 'magenta') return
    const d = Math.hypot(n.x - cx, n.y - cy) - n.r * 6
    if (d < supScore) {
      supScore = d
      supIdx = i
    }
  })

  const nodes: FieldNode[] = raw.map((n, i) => ({
    x: n.x,
    y: n.y,
    net: NET_MAP[n.net],
    r: n.r,
    hub: i !== supIdx && n.r >= HUB_R && n.net !== 'white',
    sup: i === supIdx,
  }))
  const sup = supIdx >= 0 ? nodes[supIdx] : { x: cx, y: cy }

  // Salience spider — magenta nodes chain back toward the hub.
  const snNear = nodes
    .filter((n) => n.net === 'SN' && !n.sup)
    .map((n) => ({ n, d: Math.hypot(n.x - sup.x, n.y - sup.y) }))
    .filter((e) => e.d < 320)
    .sort((a, b) => a.d - b.d)
  const snEdges: SnEdge[] = snNear.map(({ n, d }, i) => {
    let best: { x: number; y: number } | null = null
    let bestD = 150
    for (let j = 0; j < i; j++) {
      const m = snNear[j].n
      const dd = Math.hypot(m.x - n.x, m.y - n.y)
      if (dd < bestD) {
        bestD = dd
        best = m
      }
    }
    const t = best ?? sup
    return { x1: n.x, y1: n.y, x2: t.x, y2: t.y, w: 1 - d / 320 }
  })

  const outline = sweepOutline(pts, cx, cy)
  const fibers = buildCallosal(sup.x, sup.y)

  return {
    nodes,
    edges,
    fibers,
    snEdges,
    outline,
    midX: MID_X,
    center: { x: cx, y: cy },
    vw: VW,
    vh: VH,
  }
}
