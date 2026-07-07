/**
 * Poisson-disc node scatter (Bridson's algorithm) — organic-even points with a
 * guaranteed minimum spacing, so the brain reads as a natural stipple, not a
 * grid or random clumps. Deterministic (seeded). Points are then clipped to the
 * silhouette polygons by point-in-polygon.
 */

import { mulberry32 } from '../rng'
import { pointInPolygon, type Pt } from './silhouette'

/** Bridson Poisson-disc sampling over a w×h box with minimum spacing minDist. */
export function poissonDisc(w: number, h: number, minDist: number, seed: number, k = 25): Pt[] {
  const rng = mulberry32(seed)
  const cell = minDist / Math.SQRT2
  const gw = Math.ceil(w / cell)
  const gh = Math.ceil(h / cell)
  const grid: (Pt | null)[] = new Array(gw * gh).fill(null)
  const active: Pt[] = []
  const out: Pt[] = []
  const min2 = minDist * minDist
  const gi = (x: number, y: number) => Math.floor(x / cell) + Math.floor(y / cell) * gw

  const add = (p: Pt) => {
    grid[gi(p.x, p.y)] = p
    active.push(p)
    out.push(p)
  }
  const fits = (q: Pt): boolean => {
    const cx = Math.floor(q.x / cell)
    const cy = Math.floor(q.y / cell)
    for (let ny = Math.max(0, cy - 2); ny <= Math.min(gh - 1, cy + 2); ny++) {
      for (let nx = Math.max(0, cx - 2); nx <= Math.min(gw - 1, cx + 2); nx++) {
        const g = grid[nx + ny * gw]
        if (g && (g.x - q.x) ** 2 + (g.y - q.y) ** 2 < min2) return false
      }
    }
    return true
  }

  add({ x: rng() * w, y: rng() * h })
  while (active.length) {
    const idx = Math.floor(rng() * active.length)
    const p = active[idx]
    let placed = false
    for (let i = 0; i < k; i++) {
      const ang = rng() * Math.PI * 2
      const rad = minDist * (1 + rng())
      const q = { x: p.x + Math.cos(ang) * rad, y: p.y + Math.sin(ang) * rad }
      if (q.x < 0 || q.x >= w || q.y < 0 || q.y >= h) continue
      if (fits(q)) {
        add(q)
        placed = true
        break
      }
    }
    if (!placed) active.splice(idx, 1)
  }
  return out
}

/** Scatter clipped to one or more polygons (the hemispheres). */
export function scatterInside(
  polys: Pt[][],
  w: number,
  h: number,
  minDist: number,
  seed: number,
): Pt[] {
  return poissonDisc(w, h, minDist, seed).filter((p) =>
    polys.some((poly) => pointInPolygon(p, poly)),
  )
}
