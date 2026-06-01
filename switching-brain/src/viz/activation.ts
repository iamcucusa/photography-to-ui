/**
 * Activation model — turns the looping phase + the switching-rate into the
 * per-network activations and motion *quality* that the draw layer renders.
 * Pure and framework-agnostic (portable/testable per the brief).
 */

import type { NetworkId } from './model/types'
import { loopNoise } from './noise'

export interface Activation {
  /** Phase in [-1,1]; +1 = DMN peak, -1 = FPCN peak, 0 = crossover (both lit). */
  phase: number
  DMN: number
  FPCN: number
  SN: number
  /** True in the narrow window where both networks are lit — the cooperation moment. */
  integrating: number
  /** Output meter [0,1] — the inverted-U: peaks at a balanced rate. */
  output: number
}

/**
 * Motion *quality* as a function of switching-rate [0,1] — the teaching device.
 * The character of the motion changes across the slider, not just its speed:
 *  - low  → slow + damped amplitude: rigidity you can see (explore/ship never meet)
 *  - mid  → full, smooth cooperative swing: flow
 *  - high → fast + jittery: thrash, nothing settles, both-lit never holds
 */
export interface MotionQuality {
  /** Loop traversal speed (loops per second). */
  speed: number
  /** Phase amplitude scale [0,1] — low rate damps the swing toward stillness. */
  amplitude: number
  /** Incoherence [0,1] — high rate adds jitter so nodes never settle. */
  jitter: number
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

const TWO_PI = Math.PI * 2

export function motionQuality(rate: number): MotionQuality {
  const r = Math.max(0, Math.min(1, rate))
  return {
    // ~14s/loop at the low end → ~3.5s/loop at the high end. Balanced ≈ 9s.
    speed: 0.07 + r * 0.22,
    // damped near stillness at low rate, full from the middle up.
    amplitude: 0.28 + 0.72 * smoothstep(0.04, 0.5, r),
    // only the top of the range thrashes.
    jitter: smoothstep(0.62, 1, r),
  }
}

/** Gaussian bump centered at `c` with width `w`, clamped to [0,1]. */
function bump(x: number, c: number, w: number): number {
  const z = (x - c) / w
  return Math.exp(-z * z)
}

/**
 * Compute activations at loop coordinate `u` for a given `rate`.
 *
 * `bias` is the self-map tilt in [-1,1]: it shifts the phase mean so the brain
 * dwells on one network — DMN-dominant (+, explore-forever) or FPCN-dominant
 * (−, build-rigid). At a tilt the crossovers grow rare, so integration seldom
 * happens — the imbalance made visible. bias = 0 is the balanced sweet spot.
 *
 * Salience leads: it is driven by the phase slightly in the FUTURE (`leadFrac`),
 * so the SN pulse precedes the network it announces — causality (salience → network,
 * decision → response), the ~100–200 ms lead the brief asks for.
 */
export function computeActivation(u: number, rate: number, bias = 0, leadFrac = 0.02): Activation {
  const q = motionQuality(rate)
  const b = Math.max(-1, Math.min(1, bias)) * 0.85
  const phase = Math.max(-1, Math.min(1, loopNoise(u) * q.amplitude * (1 - Math.abs(b)) + b))

  const DMN = 0.5 + 0.5 * phase
  const FPCN = 0.5 - 0.5 * phase

  // Salience anticipates the upcoming crossover (phase ahead near zero).
  const phaseAhead = Math.max(
    -1,
    Math.min(1, loopNoise(u + leadFrac) * q.amplitude * (1 - Math.abs(b)) + b),
  )
  const SN = bump(phaseAhead, 0, 0.16)

  const integrating = bump(phase, 0, 0.12)

  // Inverted-U: creative output peaks at a balanced rate, craters at the extremes.
  const output = bump(rate, 0.5, 0.26)

  return { phase, DMN, FPCN, SN, integrating, output }
}

/** Convenience accessor by network id. */
export function networkActivation(a: Activation, id: NetworkId): number {
  return id === 'DMN' ? a.DMN : id === 'FPCN' ? a.FPCN : a.SN
}

/**
 * The loop coordinate of a both-lit crossover (phase ≈ 0) — the single most
 * meaningful frame. Used as the reduced-motion / paused still. Computed once by
 * scanning the (deterministic) noise for its first zero-crossing.
 */
export const CROSSOVER_U: number = (() => {
  let prev = loopNoise(0)
  for (let i = 1; i <= 1000; i++) {
    const u = i / 1000
    const v = loopNoise(u)
    if (prev === 0 || prev * v < 0) return u - 0.5 / 1000
    prev = v
  }
  return 0
})()

/** A small per-node phase offset so a network's nodes don't pulse in lockstep. */
export function nodeJitterPhase(seed: number, u: number, jitter: number): number {
  if (jitter <= 0) return 0
  // deterministic per-node wobble, scaled by incoherence
  return Math.sin(u * TWO_PI * 7 + seed * 12.9898) * jitter * 0.5
}
