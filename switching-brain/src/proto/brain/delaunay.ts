/**
 * Bowyer–Watson Delaunay triangulation — dep-free, so the hero prototype gets
 * the mockup's clean triangulated web (uniform triangles, no crossing edges)
 * without adding d3-delaunay. Deterministic: pure function of the input points.
 *
 * O(n²)-ish for the point counts here (~200/hemisphere); runs once in a useMemo.
 */

import type { Pt } from './silhouette'

export interface Tri {
  a: number
  b: number
  c: number
}

/** Triangle stored counter-clockwise so the in-circle test's sign is consistent. */
function makeTri(i: number, j: number, k: number, pts: Pt[]): Tri {
  const area2 =
    (pts[j].x - pts[i].x) * (pts[k].y - pts[i].y) - (pts[k].x - pts[i].x) * (pts[j].y - pts[i].y)
  return area2 < 0 ? { a: i, b: k, c: j } : { a: i, b: j, c: k }
}

/** True if p lies inside the circumcircle of CCW triangle (a,b,c). */
function inCircumcircle(p: Pt, a: Pt, b: Pt, c: Pt): boolean {
  const adx = a.x - p.x
  const ady = a.y - p.y
  const bdx = b.x - p.x
  const bdy = b.y - p.y
  const cdx = c.x - p.x
  const cdy = c.y - p.y
  const abdet = adx * bdy - bdx * ady
  const bcdet = bdx * cdy - cdx * bdy
  const cadet = cdx * ady - adx * cdy
  const alift = adx * adx + ady * ady
  const blift = bdx * bdx + bdy * bdy
  const clift = cdx * cdx + cdy * cdy
  return alift * bcdet + blift * cadet + clift * abdet > 0
}

function triHasEdge(t: Tri, u: number, v: number): boolean {
  const has = (x: number) => t.a === x || t.b === x || t.c === x
  return has(u) && has(v)
}

/** Delaunay triangulation of pts → triangles as index triples into pts. */
export function delaunay(pts: Pt[]): Tri[] {
  const n = pts.length
  if (n < 3) return []

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of pts) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  const dmax = Math.max(maxX - minX, maxY - minY) || 1
  const midx = (minX + maxX) / 2
  const midy = (minY + maxY) / 2

  // Super-triangle vertices appended after the real points (indices n, n+1, n+2).
  const work = pts.slice()
  work.push({ x: midx - 20 * dmax, y: midy - dmax })
  work.push({ x: midx, y: midy + 20 * dmax })
  work.push({ x: midx + 20 * dmax, y: midy - dmax })

  let tris: Tri[] = [makeTri(n, n + 1, n + 2, work)]

  for (let i = 0; i < n; i++) {
    const p = work[i]
    const bad = tris.filter((t) => inCircumcircle(p, work[t.a], work[t.b], work[t.c]))

    // Boundary of the cavity = edges belonging to exactly one bad triangle.
    const boundary: [number, number][] = []
    for (const t of bad) {
      for (const [u, v] of [
        [t.a, t.b],
        [t.b, t.c],
        [t.c, t.a],
      ] as [number, number][]) {
        const shared = bad.some((t2) => t2 !== t && triHasEdge(t2, u, v))
        if (!shared) boundary.push([u, v])
      }
    }

    tris = tris.filter((t) => !bad.includes(t))
    for (const [u, v] of boundary) tris.push(makeTri(i, u, v, work))
  }

  // Drop any triangle still touching the super-triangle.
  return tris.filter((t) => t.a < n && t.b < n && t.c < n)
}
