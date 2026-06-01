/**
 * Looping value noise — the oscillation driver.
 *
 * The brief: drive the phase with smoothed LOOPING noise, not a pure sine, so
 * switching has variable dwell times and a perfect sine doesn't read as a loading
 * spinner — while still exporting as a seamless loop (start == end).
 *
 * We sample a periodic 1D value-noise over a loop coordinate u in [0,1). Because
 * the lattice wraps (cells mod N), any u traversal from 0→1 returns exactly to the
 * start — seamless by construction, at any playback speed. Pure and deterministic
 * (no Math.random), so the same loop renders identically every time → stable export.
 */

/** Deterministic lattice value in [-1, 1] for cell i (wrapped to period n). */
function cellValue(i: number, n: number, seed: number): number {
  let h = (((i % n) + n) % n) ^ (seed * 0x9e3779b1)
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  h ^= h >>> 16
  return ((h >>> 0) / 0xffffffff) * 2 - 1
}

/** Quintic smoothstep — C2 continuous, avoids the linear "ramp" look. */
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/** One octave of periodic value noise over u in [0,1), with `cells` lattice points. */
function noiseCells(u: number, cells: number, seed: number): number {
  const x = (((u % 1) + 1) % 1) * cells
  const i0 = Math.floor(x)
  const t = x - i0
  const v0 = cellValue(i0, cells, seed)
  const v1 = cellValue(i0 + 1, cells, seed)
  return v0 + fade(t) * (v1 - v0)
}

/**
 * Looping phase signal in [-1, 1] for loop coordinate u in [0,1).
 * Two periodic octaves give organic, uneven dwell times while staying seamless.
 */
export function loopNoise(u: number, seed = 1): number {
  const a = noiseCells(u, 5, seed)
  const b = noiseCells(u, 11, seed + 17)
  const v = 0.68 * a + 0.32 * b
  return Math.max(-1, Math.min(1, v))
}
