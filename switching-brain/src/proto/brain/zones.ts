/**
 * Network zoning — assign each brain node to DMN / SN / FPCN to match the
 * mockup's color distribution:
 *   DMN  (warm sand) — the default majority, the whole outer/upper mantle.
 *   SN   (magenta)   — a central "switch" cluster around the hub + a few salient
 *                      hubs scattered out in the field.
 *   FPCN (cool sky)  — weighted toward the lower / occipital region.
 * Deterministic per-node noise keeps the zones organic rather than hard-banded.
 */

import type { Pt } from './silhouette'
import type { NetworkId } from '../../viz/model/types'
import { hashJitter } from '../../viz/geometry'

export interface Geo {
  cx: number
  cy: number
  semiV: number
  maxW: number
}

export function assignNetwork(p: Pt, geo: Geo): NetworkId {
  const n = hashJitter(`${p.x.toFixed(1)}:${p.y.toFixed(1)}`) // deterministic [-1,1]
  const dc = Math.hypot(p.x - geo.cx, p.y - geo.cy)
  if (dc < 92 + n * 26) return 'SN' // central switch cluster
  const lower = (p.y - geo.cy) / geo.semiV // >0 toward the occipital pole
  if (lower > 0 && lower * 1.15 + n * 0.45 > 0.32) return 'FPCN' // lower / builder
  if (n > 0.9) return 'SN' // occasional salient hub out in the mantle
  return 'DMN'
}
