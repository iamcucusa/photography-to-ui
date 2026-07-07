/**
 * The connectome mesh — Delaunay-triangulate the node scatter into the mockup's
 * web. Triangulated PER HEMISPHERE (so no edges cross the fissure; the callosal
 * fibers that do cross are a separate, later layer) and length-trimmed so the
 * long hull edges spanning the silhouette's concavities don't show.
 */

import { delaunay } from './delaunay'
import type { Pt } from './silhouette'

export interface Edge {
  a: Pt
  b: Pt
  /** [0,1] — 0 = shortest kept edge, 1 = at the trim threshold. Drives fade. */
  t: number
}

function hemisphereEdges(pts: Pt[], maxLen: number): Edge[] {
  const tris = delaunay(pts)
  const seen = new Set<string>()
  const edges: Edge[] = []
  const push = (i: number, j: number) => {
    const key = i < j ? `${i}_${j}` : `${j}_${i}`
    if (seen.has(key)) return
    seen.add(key)
    const a = pts[i]
    const b = pts[j]
    const len = Math.hypot(a.x - b.x, a.y - b.y)
    if (len <= maxLen) edges.push({ a, b, t: len / maxLen })
  }
  for (const tri of tris) {
    push(tri.a, tri.b)
    push(tri.b, tri.c)
    push(tri.c, tri.a)
  }
  return edges
}

/** Split the scatter at the midline and mesh each hemisphere independently. */
export function buildMesh(nodes: Pt[], midX: number, maxLen: number): Edge[] {
  const left: Pt[] = []
  const right: Pt[] = []
  for (const p of nodes) (p.x < midX ? left : right).push(p)
  return [...hemisphereEdges(left, maxLen), ...hemisphereEdges(right, maxLen)]
}
