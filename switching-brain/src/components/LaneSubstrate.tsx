import type { VizTokens } from '../viz/runtimeTokens'
import { withAlpha } from '../viz/runtimeTokens'
import type { NetworkId } from '../viz/model/types'
import type { SimNode, SimLink } from '../viz/layout'

/**
 * Background render variant — one visual LANGUAGE per network's story
 * (prototype bakeoff; see BrainLanes control panel):
 *   drift   — DMN "the dreamer": a few smooth, aimless meandering lines — the
 *             trail of a wandering mind.
 *   pulse   — SN "the switch": concentric wavefronts broadcasting from the
 *             conductor hub — the switch signal rippling brain-wide.
 *   lattice — FPCN "the builder": an even, faint blueprint grid + measure ticks.
 */
export type BgVariant = 'drift' | 'pulse' | 'lattice'

/** A single network's settled subgraph + its bbox — built by BrainLanes. */
export interface Substrate {
  network: NetworkId
  nodes: SimNode[]
  links: SimLink[]
  viewBox: string
  bbox: { x: number; y: number; w: number; h: number }
}

interface LaneSubstrateProps {
  substrate: Substrate
  tokens: VizTokens
  variant: BgVariant
}

type Net = { dim: string; base: string; bright: string }

// One shared frame for ALL variants → identical zoom + stroke scale across lanes.
// Tall enough that a very tall (stacked, mobile) lane only zooms ~2×, not 6×, and
// slice-fit so lines/rings only scale — never stretch.
const FW = 1000
const FH = 800
const STROKE = 1.2

/**
 * The faint background field for one lane — abstracted into that network's own
 * visual metaphor so it narrates the lane rather than decorating it. All three
 * variants draw in the same slice-fit frame, so their stroke weight and zoom are
 * consistent. Static, low-opacity, network-hued, aria-hidden.
 */
export function LaneSubstrate({ substrate, tokens, variant }: LaneSubstrateProps) {
  const net = tokens.network[substrate.network]

  return (
    <svg
      className={`lane-substrate lane-substrate--${variant}`}
      viewBox={`0 0 ${FW} ${FH}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {variant === 'drift' && <Drift net={net} />}
      {variant === 'pulse' && <Pulse net={net} />}
      {variant === 'lattice' && <Lattice net={net} />}
    </svg>
  )
}

/** A smooth, seeded, aimless 2D meander across the frame → an SVG path string. */
function wanderPath(seed: number): string {
  let s = (seed * 2654435761) & 0x7fffffff
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  const steps = 22
  const stepLen = Math.min(FW, FH) * 0.16
  let x = rnd() * FW
  let y = rnd() * FH
  let ang = rnd() * Math.PI * 2
  const pts: { x: number; y: number }[] = [{ x, y }]
  for (let i = 0; i < steps; i++) {
    ang += (rnd() - 0.5) * 1.7 // veer — an aimless turn each step
    x += Math.cos(ang) * stepLen
    y += Math.sin(ang) * stepLen
    if (x < 0 || x > FW) ang = Math.PI - ang // reflect at the edges, keep drifting
    if (y < 0 || y > FH) ang = -ang
    x = Math.max(0, Math.min(FW, x))
    y = Math.max(0, Math.min(FH, y))
    pts.push({ x, y })
  }
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2
    const my = (pts[i].y + pts[i + 1].y) / 2
    d += ` Q${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`
  }
  return d
}

/** DMN — long, smooth, aimless meandering lines: the trail of a wandering mind.
    Crisp (no blur) so the stroke language matches the pulse/lattice lanes. */
function Drift({ net }: { net: Net }) {
  const seeds = [11, 43, 87, 129, 205, 251]
  return (
    <g fill="none" strokeLinecap="round" strokeWidth={STROKE}>
      {seeds.map((seed, i) => (
        <path key={seed} d={wanderPath(seed)} stroke={withAlpha(net.base, 0.42 - i * 0.03)} />
      ))}
    </g>
  )
}

/** SN — concentric wavefronts broadcasting from the conductor. The switch. */
function Pulse({ net }: { net: Net }) {
  const cx = FW * 0.44
  const cy = FH * 0.5
  const rings = 13
  // Tight spacing so many wavefronts fill the wide/short lane — with large rings
  // the slice-fit crop showed only a few big arcs (read as sparse + zoomed-in).
  const step = FH * 0.09
  return (
    <g fill="none">
      {Array.from({ length: rings }, (_, i) => {
        const r = step * (i + 1)
        // Peak below drift's 0.42 (magenta-bright reads more luminous than the
        // sand/sky bases). Gentle fade so the field stays evenly present, not a
        // bright hub trailing off to nothing.
        const op = 0.38 * (1 - 0.5 * (i / rings))
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            stroke={withAlpha(net.bright, op)}
            strokeWidth={STROKE}
          />
        )
      })}
    </g>
  )
}

/** FPCN — the builder's blueprint: an even, faint orthogonal grid spanning the
 *  whole frame with small measure-point ticks at the crossings. GENERATIVE and
 *  regular (not the sparse real connectome), so it covers the lane evenly like
 *  the sibling fields — and, being a grid rather than clustered nodes+edges,
 *  never reads as a second graph. Kept a whisper (low --lattice opacity). */
function Lattice({ net }: { net: Net }) {
  const step = 150
  const xs: number[] = []
  for (let x = 0; x <= FW; x += step) xs.push(x)
  const ys: number[] = []
  for (let y = 0; y <= FH; y += step) ys.push(y)
  const tick = 3
  return (
    <g>
      <g fill="none" stroke={withAlpha(net.base, 0.3)} strokeWidth={STROKE * 0.7}>
        {xs.map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={FH} />
        ))}
        {ys.map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={FW} y2={y} />
        ))}
      </g>
      <g fill={withAlpha(net.base, 0.42)}>
        {ys.map((y) =>
          xs.map((x) => (
            <rect
              key={`${x}-${y}`}
              x={(x - tick / 2).toFixed(1)}
              y={(y - tick / 2).toFixed(1)}
              width={tick}
              height={tick}
            />
          )),
        )}
      </g>
    </g>
  )
}
