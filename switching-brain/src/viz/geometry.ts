/**
 * Pure geometry helpers shared by the layout and draw layers. The viewBox is a
 * fixed virtual coordinate space centered on (0,0); the SVG scales it to fit.
 */

import type { BrainNode, Hemisphere } from './model/types'

/** Virtual stage dimensions (viewBox is -W/2..W/2, -H/2..H/2). */
export const STAGE_W = 1000
export const STAGE_H = 720

/** Node radius from connectivity degree, with a rich-club bump. */
export function nodeRadius(node: BrainNode): number {
  const base = 7 + node.degree * 16 // 7..23
  return node.richClub ? base + 4 : base
}

/** Hemisphere → horizontal lean. L pulls left, R right, M centers. */
export function hemiSign(hemi: Hemisphere): number {
  if (hemi === 'L') return -1
  if (hemi === 'R') return 1
  return 0
}

/** Deterministic pseudo-random in [-1,1] from a string id — stable layout seeds. */
export function hashJitter(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // map to [-1, 1]
  return ((h >>> 0) / 0xffffffff) * 2 - 1
}

/**
 * Quadratic-curve path between two points, bowed proportionally to the distance.
 * Callosal (cross-midline) edges get a deeper bow so they read as spanning arcs.
 */
export function edgePath(x1: number, y1: number, x2: number, y2: number, bow: number): string {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  // perpendicular offset for the control point
  const nx = -dy / len
  const ny = dx / len
  const cx = mx + nx * bow
  const cy = my + ny * bow
  return `M${x1.toFixed(1)},${y1.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`
}

/** Sample a point along a quadratic bezier at parameter t in [0,1]. */
export function quadPoint(
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  t: number,
): { x: number; y: number } {
  const mt = 1 - t
  const a = mt * mt
  const b = 2 * mt * t
  const c = t * t
  return { x: a * x1 + b * cx + c * x2, y: a * y1 + b * cy + c * y2 }
}

/** Control point used by both edgePath and quadPoint, kept consistent. */
export function controlPoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bow: number,
): { cx: number; cy: number } {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  return { cx: mx + (-dy / len) * bow, cy: my + (dx / len) * bow }
}
