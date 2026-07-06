import { useLayoutEffect, useRef, useState } from 'react'
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

// Stroke weight in real pixels — the substrate draws 1:1 into the lane's own box
// (viewBox = measured px, preserveAspectRatio="none"), so the pattern renders at a
// consistent scale on every device instead of a fixed 1000×800 frame slice-fit to
// wildly different lane aspects (near-1:1 on wide desktop lanes, but 2.5× zoomed
// and 88% cropped on the tall stacked mobile lanes). The generative patterns fill
// whatever w×h they're given, so element size stays constant across breakpoints.
const STROKE = 1.2

/**
 * The faint background field for one lane — abstracted into that network's own
 * visual metaphor so it narrates the lane rather than decorating it. Measures its
 * own rendered box (ResizeObserver) and draws the pattern 1:1 in those pixels, so
 * zoom is uniform across devices. Static, low-opacity, network-hued, aria-hidden.
 */
export function LaneSubstrate({ substrate, tokens, variant }: LaneSubstrateProps) {
  const net = tokens.network[substrate.network]
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = svgRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      const w = Math.round(r.width)
      const h = Math.round(r.height)
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { w, h } = size
  const ready = w > 0 && h > 0

  return (
    <svg
      ref={svgRef}
      className={`lane-substrate lane-substrate--${variant}`}
      viewBox={ready ? `0 0 ${w} ${h}` : undefined}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {ready && variant === 'drift' && <Drift net={net} w={w} h={h} />}
      {ready && variant === 'pulse' && <Pulse net={net} w={w} h={h} />}
      {ready && variant === 'lattice' && <Lattice net={net} w={w} h={h} />}
    </svg>
  )
}

/** A smooth, seeded, aimless 2D meander that fills the w×h box → an SVG path.
 *  Fixed pixel step length (constant zoom); step count scales so the line
 *  traverses the whole lane whatever its shape. */
function wanderPath(seed: number, w: number, h: number): string {
  let s = (seed * 2654435761) & 0x7fffffff
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  const stepLen = 128
  const steps = Math.max(20, Math.round(Math.max(w, h) / 110) + 6)
  let x = rnd() * w
  let y = rnd() * h
  let ang = rnd() * Math.PI * 2
  const pts: { x: number; y: number }[] = [{ x, y }]
  for (let i = 0; i < steps; i++) {
    ang += (rnd() - 0.5) * 1.7 // veer — an aimless turn each step
    x += Math.cos(ang) * stepLen
    y += Math.sin(ang) * stepLen
    if (x < 0 || x > w) ang = Math.PI - ang // reflect at the edges, keep drifting
    if (y < 0 || y > h) ang = -ang
    x = Math.max(0, Math.min(w, x))
    y = Math.max(0, Math.min(h, y))
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

/** DMN — long, smooth, aimless meandering lines: the trail of a wandering mind. */
function Drift({ net, w, h }: { net: Net; w: number; h: number }) {
  const seeds = [11, 43, 87, 129, 205, 251]
  return (
    <g fill="none" strokeLinecap="round" strokeWidth={STROKE}>
      {seeds.map((seed, i) => (
        <path key={seed} d={wanderPath(seed, w, h)} stroke={withAlpha(net.base, 0.42 - i * 0.03)} />
      ))}
    </g>
  )
}

/** SN — concentric wavefronts from an off-centre hub, filling the box. The switch.
 *  Fixed pixel ring spacing (constant zoom); ring count reaches the far corner. */
function Pulse({ net, w, h }: { net: Net; w: number; h: number }) {
  const cx = w * 0.44
  const cy = h * 0.5
  const step = 84 // even, generous spacing — clean wavefronts
  const maxR = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy))
  const rings = Math.max(1, Math.ceil(maxR / step))
  return (
    <g fill="none">
      {Array.from({ length: rings }, (_, i) => {
        const r = step * (i + 1)
        // Peak below drift's 0.42 (magenta-bright reads more luminous than the
        // sand/sky bases); fade by radius so the field stays even at any count.
        const op = 0.38 * (1 - 0.5 * (r / maxR))
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

/** FPCN — the builder's blueprint: an even, faint orthogonal grid filling the box
 *  with small measure-point ticks at the crossings. Fixed pixel cell size
 *  (constant zoom); line/tick counts scale to the lane. Never a second graph. */
function Lattice({ net, w, h }: { net: Net; w: number; h: number }) {
  const step = 150
  const tick = 3
  const xs: number[] = []
  for (let x = 0; x <= w; x += step) xs.push(x)
  const ys: number[] = []
  for (let y = 0; y <= h; y += step) ys.push(y)
  return (
    <g>
      <g fill="none" stroke={withAlpha(net.base, 0.3)} strokeWidth={STROKE * 0.7}>
        {xs.map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={h} />
        ))}
        {ys.map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={w} y2={y} />
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
