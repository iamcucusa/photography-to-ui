/**
 * Top-down brain silhouette — authored like an illustration, not a formula.
 *
 * The RIGHT hemisphere's lateral contour is a set of hand-placed anatomy
 * anchors (frontal lobe → parietal/temporal widest → temporal bulge → occipital
 * pole); a Catmull-Rom spline sweeps through them and gyral scallops are carved
 * along the arc length, so the border reads as folded cortex. The left
 * hemisphere is the mirror. The medial edge is the interhemispheric fissure,
 * bowed into a lens around the centre where the hub sits.
 *
 * The polygons drive the drawn outline, the rim node sampling, and the
 * point-in-polygon clip for the interior scatter. Tune the anchors/scallops.
 */

export interface Pt {
  x: number
  y: number
}

// ── Shape profile (1600×900 viewBox units) — tune here ──────────────────────
const MID_X = 800 // longitudinal fissure / mirror axis
const GAP = 4 // half-width of the fissure — a thin seam, not a void

/** Lobe landmarks of the right hemisphere's lateral contour, traced from the
 *  frontal fissure shoulder clockwise to the occipital one. */
const LATERAL: Pt[] = [
  { x: 804, y: 196 }, // fissure shoulder — frontal notch
  { x: 902, y: 166 }, // superior frontal lobe
  { x: 1014, y: 192 }, // frontal-lateral gyrus
  { x: 1102, y: 280 }, // anterior temporal
  { x: 1150, y: 408 }, // widest — parietal/temporal
  { x: 1120, y: 536 }, // posterior lateral
  { x: 1044, y: 644 }, // temporal lobe bulge
  { x: 936, y: 714 }, // occipital-lateral
  { x: 852, y: 730 }, // occipital pole
  { x: 804, y: 704 }, // fissure shoulder — occipital notch
]

/** Meander of the fissure seam: BOTH medial edges shift by this same offset at
 *  height t, so the division wanders like one organic line (constant thinness,
 *  never straight) — the mockup's brain-division line, not a lens or void. */
function fissureMeander(t: number): number {
  return 5 * Math.sin(t * Math.PI * 4.6 + 1.2) + 3 * Math.sin(t * Math.PI * 9.7 + 0.4)
}
const SCALLOP_AMP = 10 // gyral bump depth
const SCALLOP_LEN = 92 // gyral bump wavelength (arc length)
const HEMI_CENTROID: Pt = { x: 982, y: 450 } // for outward-normal orientation

/** Open Catmull-Rom spline through ctrl points → dense polyline. */
export function catmullRom(ctrl: Pt[], per = 22): Pt[] {
  const P = [ctrl[0], ...ctrl, ctrl[ctrl.length - 1]]
  const out: Pt[] = []
  for (let i = 0; i < P.length - 3; i++) {
    const p0 = P[i]
    const p1 = P[i + 1]
    const p2 = P[i + 2]
    const p3 = P[i + 3]
    for (let j = 0; j < per; j++) {
      const t = j / per
      const t2 = t * t
      const t3 = t2 * t
      out.push({
        x:
          0.5 *
          (2 * p1.x +
            (p2.x - p0.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (3 * p1.x - p0.x - 3 * p2.x + p3.x) * t3),
        y:
          0.5 *
          (2 * p1.y +
            (p2.y - p0.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (3 * p1.y - p0.y - 3 * p2.y + p3.y) * t3),
      })
    }
  }
  out.push(ctrl[ctrl.length - 1])
  return out
}

/** Carve gyral scallops: offset each sample along its outward normal by a
 *  two-band sine of the cumulative arc length, faded to zero at the ends so
 *  the curve still meets the fissure shoulders cleanly. */
function addScallops(path: Pt[], amp: number, wavelen: number): Pt[] {
  const s: number[] = [0]
  for (let i = 1; i < path.length; i++) {
    s.push(s[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y))
  }
  const total = s[s.length - 1]
  return path.map((p, i) => {
    if (i === 0 || i === path.length - 1) return p
    const prev = path[i - 1]
    const next = path[i + 1]
    let nx = -(next.y - prev.y)
    let ny = next.x - prev.x
    const len = Math.hypot(nx, ny) || 1
    nx /= len
    ny /= len
    if (nx * (p.x - HEMI_CENTROID.x) + ny * (p.y - HEMI_CENTROID.y) < 0) {
      nx = -nx
      ny = -ny
    }
    const fade = Math.min(1, s[i] / (wavelen * 0.7), (total - s[i]) / (wavelen * 0.7))
    const wave =
      0.7 * Math.sin((s[i] / wavelen) * Math.PI * 2) +
      0.3 * Math.sin((s[i] / (wavelen * 2.6)) * Math.PI * 2 + 1.3)
    const off = amp * fade * wave
    return { x: p.x + nx * off, y: p.y + ny * off }
  })
}

/** One hemisphere's scalloped lateral contour (open polyline, mirrored for the
 *  left side) — also exported for the rim stroke, which lights ONLY the outer
 *  contour (the fissure stays quiet, as in the mockup). */
function lateralContour(side: 1 | -1): Pt[] {
  const lateral = addScallops(catmullRom(LATERAL), SCALLOP_AMP, SCALLOP_LEN)
  return side === 1 ? lateral : lateral.map((p) => ({ x: 2 * MID_X - p.x, y: p.y }))
}

/** One hemisphere as a closed polygon: the lateral contour + the fissure edge
 *  (a thin meandering seam shared by both hemispheres). */
function hemisphere(side: 1 | -1, lateral: Pt[]): Pt[] {
  const pts = lateral.slice()
  const top = LATERAL[0]
  const bot = LATERAL[LATERAL.length - 1]
  const steps = 40
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const y = bot.y + (top.y - bot.y) * t
    pts.push({ x: MID_X + side * GAP + fissureMeander(t), y })
  }
  return pts
}

export interface Silhouette {
  left: Pt[]
  right: Pt[]
  /** Open lateral contours (no fissure edge) — for the rim stroke. */
  leftLateral: Pt[]
  rightLateral: Pt[]
  midX: number
  center: Pt
  bbox: { x: number; y: number; w: number; h: number }
}

export function buildSilhouette(): Silhouette {
  const rightLateral = lateralContour(1)
  const leftLateral = lateralContour(-1)
  const right = hemisphere(1, rightLateral)
  const left = hemisphere(-1, leftLateral)
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of [...left, ...right]) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  return {
    right,
    left,
    rightLateral,
    leftLateral,
    midX: MID_X,
    center: { x: MID_X, y: (minY + maxY) / 2 },
    bbox: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
  }
}

/** Ray-casting point-in-polygon (dep-free); used to clip the scatter. */
export function pointInPolygon(p: Pt, poly: Pt[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside
    }
  }
  return inside
}

/** Closed SVG path string for a polygon. */
export function polygonPath(poly: Pt[]): string {
  return poly.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'
}

/** Open SVG path string for a polyline (no closing edge). */
export function polylinePath(poly: Pt[]): string {
  return poly.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

/** Resample a closed polygon's perimeter at (roughly) even arc-length spacing —
 *  the boundary nodes that let the mesh triangulate right up to the contour so
 *  the border itself becomes part of the network (as in the mockup). */
export function resamplePolygon(poly: Pt[], spacing: number): Pt[] {
  const out: Pt[] = []
  let carry = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    let d = spacing - carry
    while (d <= len) {
      const t = d / len
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
      d += spacing
    }
    carry = (carry + len) % spacing
  }
  return out
}
