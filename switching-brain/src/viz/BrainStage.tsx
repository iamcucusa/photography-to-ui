import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { BrainGraph, BrainNode, NetworkId } from './model/types'
import { NETWORK_IDS, NETWORK_LABELS } from './model/types'
import type { VizTokens } from './runtimeTokens'
import { withAlpha, mix } from './runtimeTokens'
import {
  createBrainSimulation,
  settle,
  NETWORK_Y,
  NETWORK_X,
  type SimNode,
  type Orientation,
} from './layout'
import { STAGE_W, STAGE_H, nodeRadius, controlPoint, quadPoint, hashJitter } from './geometry'
import {
  computeActivation,
  motionQuality,
  networkActivation,
  nodeJitterPhase,
  CROSSOVER_U,
  type Activation,
} from './activation'

/** A node selected for inspection, with its center in canvas pixels for card placement. */
export interface InspectTarget {
  node: BrainNode
  cx: number
  cy: number
}

export interface BrainStageProps {
  graph: BrainGraph
  tokens: VizTokens
  /** Switching rate [0,1] — the core driver. */
  rate: number
  /** Self-map tilt [-1,1]: + = DMN-dominant (explore), − = FPCN-dominant (ship). */
  bias: number
  /** Ambient clock running. When false the piece freezes (still frame). */
  playing: boolean
  /** prefers-reduced-motion: the still frame is the both-lit crossover. */
  reducedMotion: boolean
  /** Layout orientation — portrait rotates the bands into vertical lanes for narrow screens. */
  orientation: Orientation
  /** Currently-inspected node id (hover or pinned) — drives highlight + dim. */
  inspectedId: string | null
  /** Transient inspect (hover / focus enter, or null on leave). */
  onInspectHover: (target: InspectTarget | null) => void
  /** Commit inspect (click / Enter / Space) — pins the card. */
  onInspectActivate: (target: InspectTarget) => void
  /** Esc pressed while a node is focused. */
  onEscape: () => void
  /** Reports the live activation each frame (output meter, captions). */
  onFrame?: (a: Activation) => void
}

interface EdgeMeta {
  s: SimNode
  t: SimNode
  sameNet: NetworkId | null
  isCallosal: boolean
  bowSign: number
  baseWidth: number
}

interface Particle {
  edge: number
  offset: number
}

/** Three-stop brightness ramp: dim → base → bright as activation goes 0 → 1. */
function rampColor(c: { dim: string; base: string; bright: string }, t: number): string {
  return t < 0.5 ? mix(c.dim, c.base, t * 2) : mix(c.base, c.bright, (t - 0.5) * 2)
}

function nodeAriaLabel(n: BrainNode): string {
  const side = n.hemi === 'L' ? 'left' : n.hemi === 'R' ? 'right' : 'midline'
  return `${n.label}, ${side}. ${NETWORK_LABELS[n.network]} network.${n.role ? ' ' + n.role : ''}`
}

/**
 * The animated draw layer. Renders a static SVG skeleton once, then drives every
 * visual attribute imperatively from a requestAnimationFrame loop — the motion IS
 * the data: antiphase brightness, activation-scaled radius, force cohesion, a
 * crossover bloom, a causal salience pulse, and callosal particle surges.
 *
 * Inspect: nodes are focusable (roving tabindex) and respond to hover/focus by
 * lifting while the rest dims; the card itself is rendered by the parent.
 */
export function BrainStage({
  graph,
  tokens,
  rate,
  bias,
  playing,
  reducedMotion,
  orientation,
  inspectedId,
  onInspectHover,
  onInspectActivate,
  onEscape,
  onFrame,
}: BrainStageProps) {
  // Live controls, read inside the loop (not during render) without re-mounting.
  const rateRef = useRef(rate)
  const biasRef = useRef(bias)
  const playingRef = useRef(playing)
  const reducedRef = useRef(reducedMotion)
  const inspectedRef = useRef(inspectedId)
  useEffect(() => {
    rateRef.current = rate
    biasRef.current = bias
    playingRef.current = playing
    reducedRef.current = reducedMotion
    inspectedRef.current = inspectedId
  }, [rate, bias, playing, reducedMotion, inspectedId])

  // Build + warm up the simulation once. d3 auto-starts an internal timer, so we
  // drive sim.tick() ourselves from the rAF loop. The per-network cohesion is a
  // plain object owned by the memo (stable, mutated in the loop) — the force reads
  // it live so the activating network coheres while the other relaxes.
  const sim = useMemo(() => {
    const cohesion: Record<NetworkId, number> = { DMN: 1, FPCN: 1, SN: 1 }
    const s = createBrainSimulation(graph, (net) => cohesion[net], orientation)
    settle(s.sim, 220)
    s.sim.alphaTarget(0.05)
    return { ...s, cohesion }
  }, [graph, orientation])

  const { nodes, links } = sim

  const edgeMeta = useMemo<EdgeMeta[]>(() => {
    return links.map((l) => {
      const s = l.source as SimNode
      const t = l.target as SimNode
      const isCallosal = l.type === 'callosal'
      return {
        s,
        t,
        sameNet: s.network === t.network ? s.network : null,
        isCallosal,
        bowSign: hashJitter(`${s.id}-${t.id}`) >= 0 ? 1 : -1,
        baseWidth: 1 + l.weight * 2.4 + (isCallosal ? 1.4 : 0),
      }
    })
  }, [links])

  // Adjacency: id → {itself + neighbors}, for inspect highlight/dim.
  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const n of nodes) map.set(n.id, new Set([n.id]))
    for (const e of edgeMeta) {
      map.get(e.s.id)?.add(e.t.id)
      map.get(e.t.id)?.add(e.s.id)
    }
    return map
  }, [nodes, edgeMeta])

  // Two particles per callosal edge, phase-staggered.
  const particles = useMemo<Particle[]>(() => {
    const out: Particle[] = []
    edgeMeta.forEach((e, i) => {
      if (e.isCallosal) out.push({ edge: i, offset: 0 }, { edge: i, offset: 0.5 })
    })
    return out
  }, [edgeMeta])

  // Element refs, index-aligned with nodes / links / particles.
  const svgRef = useRef<SVGSVGElement | null>(null)
  const nodeGroup = useRef<(SVGGElement | null)[]>([])
  const nodeCircle = useRef<(SVGCircleElement | null)[]>([])
  const nodeLabel = useRef<(SVGTextElement | null)[]>([])
  const pulseRing = useRef<(SVGCircleElement | null)[]>([])
  const edgeEl = useRef<(SVGPathElement | null)[]>([])
  const particleEl = useRef<(SVGCircleElement | null)[]>([])
  const bloomEl = useRef<SVGCircleElement | null>(null)

  // Roving tabindex: one node is tabbable at a time; arrows move focus.
  const [activeIndex, setActiveIndex] = useState(0)

  // Cached SVG→screen transform so targetFor maps a node's live user-space
  // position to a pixel centre WITHOUT a getBoundingClientRect per hover — that
  // read, interleaved with the rAF loop's attribute writes, forces a synchronous
  // reflow. Refreshed on scroll/resize and when the viewBox flips (orientation).
  const ctmRef = useRef<DOMMatrix | null>(null)
  const svgOriginRef = useRef({ left: 0, top: 0 })
  useEffect(() => {
    const refresh = () => {
      const svg = svgRef.current
      if (!svg) return
      ctmRef.current = svg.getScreenCTM()
      const r = svg.getBoundingClientRect()
      svgOriginRef.current = { left: r.left, top: r.top }
    }
    refresh()
    let raf = 0
    const onScrollResize = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        refresh()
      })
    }
    window.addEventListener('scroll', onScrollResize, { passive: true })
    window.addEventListener('resize', onScrollResize)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScrollResize)
      window.removeEventListener('resize', onScrollResize)
    }
  }, [orientation])

  function targetFor(i: number): InspectTarget {
    const n = nodes[i]
    const ctm = ctmRef.current
    if (ctm) {
      // n.x/n.y are the node group's translate (SVG user space); map to svg-
      // relative pixels via the cached screen CTM — no layout read.
      const sx = ctm.a * n.x + ctm.c * n.y + ctm.e - svgOriginRef.current.left
      const sy = ctm.b * n.x + ctm.d * n.y + ctm.f - svgOriginRef.current.top
      return { node: n, cx: sx, cy: sy }
    }
    // Fallback before the CTM is cached: measure directly.
    const el = nodeCircle.current[i]
    const svg = svgRef.current
    let cx = 0
    let cy = 0
    if (el && svg) {
      const r = el.getBoundingClientRect()
      const s = svg.getBoundingClientRect()
      cx = r.left + r.width / 2 - s.left
      cy = r.top + r.height / 2 - s.top
    }
    return { node: n, cx, cy }
  }

  function focusNode(i: number) {
    setActiveIndex(i)
    nodeCircle.current[i]?.focus()
  }

  function onNodesKeyDown(e: KeyboardEvent<SVGGElement>) {
    const n = nodes.length
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      focusNode((activeIndex + 1) % n)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      focusNode((activeIndex - 1 + n) % n)
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusNode(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      focusNode(n - 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onInspectActivate(targetFor(activeIndex))
    } else if (e.key === 'Escape') {
      onEscape()
    }
  }

  useEffect(() => {
    let raf = 0
    let last = 0
    let u = 0
    const FLOW = 0.6

    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now

      const r = rateRef.current
      const reduced = reducedRef.current
      const animate = playingRef.current
      // Not animating: reduced-motion rests on the both-lit crossover still; a
      // user pause freezes the current frame in place.
      const uu = !animate && reduced ? CROSSOVER_U : u
      const a = computeActivation(uu, r, biasRef.current)
      const q = motionQuality(r)
      if (animate) u = (u + dt * q.speed) % 1

      const inspId = inspectedRef.current
      const related = inspId ? adjacency.get(inspId) : null

      // Force cohesion: the activating network coheres, the other relaxes.
      sim.cohesion.DMN = 0.7 + a.DMN * 0.95
      sim.cohesion.FPCN = 0.7 + a.FPCN * 0.95
      sim.cohesion.SN = 0.85 + a.SN * 0.5
      if (animate) sim.sim.tick()

      // Nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        const g = nodeGroup.current[i]
        const circle = nodeCircle.current[i]
        if (!g || !circle) continue
        const act = networkActivation(a, n.network)
        const wobble = nodeJitterPhase(hashJitter(n.id), uu, animate ? q.jitter : 0)
        const baseR = nodeRadius(n)
        const isInspected = inspId === n.id
        const dimmed = related ? !related.has(n.id) : false
        // No lift under reduced motion — highlight via brightness + dim only.
        const lift = isInspected && !reduced ? 0.4 : 0
        const scale = 1 + act * (n.richClub ? 0.35 : 0.22) + wobble + lift
        const rr = baseR * scale
        g.setAttribute('transform', `translate(${n.x.toFixed(1)},${n.y.toFixed(1)})`)
        circle.setAttribute('r', rr.toFixed(2))
        const tBright = isInspected ? 1 : n.richClub ? Math.min(1, act + 0.25) : act
        circle.setAttribute('fill', rampColor(tokens.network[n.network], tBright))
        circle.setAttribute('opacity', (dimmed ? 0.18 : 0.5 + act * 0.5).toFixed(3))

        const label = nodeLabel.current[i]
        if (label) {
          label.setAttribute('y', (rr + 13).toFixed(1))
          label.setAttribute('opacity', dimmed ? '0.2' : '1')
        }

        // Causal salience pulse — peaks slightly BEFORE the crossover it announces.
        const ring = pulseRing.current[i]
        if (ring) {
          if (n.switcher && a.SN > 0.02 && !dimmed) {
            ring.setAttribute('r', (baseR * (1 + a.SN * 1.6)).toFixed(2))
            ring.setAttribute('opacity', (a.SN * 0.5).toFixed(3))
            ring.setAttribute('stroke', tokens.network.SN.bright)
          } else {
            ring.setAttribute('opacity', '0')
          }
        }
      }

      // Edges — opacity tracks the activation of the networks they bridge.
      for (let i = 0; i < edgeMeta.length; i++) {
        const path = edgeEl.current[i]
        const e = edgeMeta[i]
        if (!path) continue
        const edgeAct = (networkActivation(a, e.s.network) + networkActivation(a, e.t.network)) / 2
        const dist = Math.hypot(e.t.x - e.s.x, e.t.y - e.s.y)
        const bow = (e.isCallosal ? 0.2 : 0.06) * dist * e.bowSign
        const { cx, cy } = controlPoint(e.s.x, e.s.y, e.t.x, e.t.y, bow)
        path.setAttribute(
          'd',
          `M${e.s.x.toFixed(1)},${e.s.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${e.t.x.toFixed(1)},${e.t.y.toFixed(1)}`,
        )
        const touchesInsp = inspId ? e.s.id === inspId || e.t.id === inspId : false
        const color = touchesInsp
          ? tokens.network.SN.bright
          : e.sameNet
            ? tokens.network[e.sameNet].base
            : tokens.edge
        let op = (e.isCallosal ? 0.14 : 0.1) + edgeAct * 0.34
        if (inspId) op = touchesInsp ? 0.85 : op * 0.12
        path.setAttribute('stroke', withAlpha(color, op))
        path.setAttribute('stroke-width', (e.baseWidth * (0.8 + edgeAct * 0.5)).toFixed(2))
      }

      // Callosal particles — surge at the crossover, quiet between switches.
      for (let p = 0; p < particles.length; p++) {
        const el = particleEl.current[p]
        const meta = edgeMeta[particles[p].edge]
        if (!el) continue
        const dir = a.phase >= 0 ? 1 : -1
        let tt = (u * (FLOW * (4 + rateRef.current * 6)) * dir + particles[p].offset) % 1
        if (tt < 0) tt += 1
        const dist = Math.hypot(meta.t.x - meta.s.x, meta.t.y - meta.s.y)
        const bow = 0.2 * dist * meta.bowSign
        const { cx, cy } = controlPoint(meta.s.x, meta.s.y, meta.t.x, meta.t.y, bow)
        const pt = quadPoint(meta.s.x, meta.s.y, cx, cy, meta.t.x, meta.t.y, tt)
        el.setAttribute('cx', pt.x.toFixed(1))
        el.setAttribute('cy', pt.y.toFixed(1))
        el.setAttribute('opacity', ((inspId ? 0.05 : 0.15) + a.integrating * 0.8).toFixed(3))
      }

      // Crossover bloom — the cooperation instant, lifted so the eye is drawn there.
      if (bloomEl.current) bloomEl.current.setAttribute('opacity', (a.integrating * 0.5).toFixed(3))

      onFrame?.(a)
      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      sim.sim.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim, nodes, edgeMeta, adjacency, particles, tokens])

  // Portrait swaps the virtual space (STAGE_H wide × STAGE_W tall) so the rotated
  // lane layout fills a portrait viewport instead of letterboxing.
  const portrait = orientation === 'portrait'
  const vbW = portrait ? STAGE_H : STAGE_W
  const vbH = portrait ? STAGE_W : STAGE_H
  const viewBox = `${-vbW / 2} ${-vbH / 2} ${vbW} ${vbH}`

  return (
    // A named group, NOT role="img": role="img" makes descendants presentational,
    // which would hide the 33 operable node buttons from assistive tech. The full
    // prose description lives in the .sr-only alternative (App.tsx); the decorative
    // layers (edges, bands, particles) are aria-hidden.
    <svg
      ref={svgRef}
      className="stage__svg"
      viewBox={viewBox}
      role="group"
      aria-label="Brain network — three cooperating systems; use the region buttons below."
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="node-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="bloom-grad">
          <stop offset="0%" stopColor={tokens.network.SN.bright} stopOpacity="0.5" />
          <stop offset="100%" stopColor={tokens.network.SN.bright} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Crossover bloom (behind everything) */}
      <circle ref={bloomEl} cx="0" cy="0" r={STAGE_H * 0.42} fill="url(#bloom-grad)" opacity="0" />

      {/* Network band labels — horizontal, word-per-line, right-aligned into the
          reserved left gutter so the inner edge sits just left of the nodes and the
          length grows into empty space, never into the data. Network encoded by
          position + text, not color alone; bright color at full opacity for AA. */}
      <g className="stage__bands" aria-hidden="true">
        {NETWORK_IDS.map((id) => {
          const words = NETWORK_LABELS[id].split(' ')
          // Portrait: centered column headers in a reserved top gutter, stacked
          // word-per-line. Landscape: right-aligned into the reserved left gutter.
          if (portrait) {
            const lx = NETWORK_X[id]
            const topY = -vbH / 2 + 38
            return (
              <text
                key={id}
                className="stage__band-label"
                x={lx}
                y={topY}
                fill={tokens.network[id].bright}
                textAnchor="middle"
              >
                {words.map((w, i) => (
                  <tspan key={i} x={lx} dy={i === 0 ? 0 : '1.16em'}>
                    {w}
                  </tspan>
                ))}
              </text>
            )
          }
          const lx = -STAGE_W / 2 + 165
          const ly = NETWORK_Y[id]
          return (
            <text
              key={id}
              className="stage__band-label"
              x={lx}
              y={ly}
              fill={tokens.network[id].bright}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {words.map((w, i) => (
                <tspan key={i} x={lx} dy={i === 0 ? `${-(words.length - 1) * 0.58}em` : '1.16em'}>
                  {w}
                </tspan>
              ))}
            </text>
          )
        })}
      </g>

      {/* Edges */}
      <g className="stage__edges" aria-hidden="true">
        {edgeMeta.map((_, i) => (
          <path
            key={`e${i}`}
            ref={(el) => {
              edgeEl.current[i] = el
            }}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* Callosal particles */}
      <g className="stage__particles" aria-hidden="true">
        {particles.map((_, i) => (
          <circle
            key={`p${i}`}
            ref={(el) => {
              particleEl.current[i] = el
            }}
            r={2.4}
            fill={tokens.network.SN.bright}
            opacity="0"
          />
        ))}
      </g>

      {/* Nodes — focusable, roving tabindex */}
      <g
        className="stage__nodes"
        role="group"
        aria-label="Brain regions — arrow keys to move, Enter to pin details"
        onKeyDown={onNodesKeyDown}
      >
        {nodes.map((n, i) => {
          const showLabel = Boolean(n.richClub || n.switcher)
          return (
            <g
              key={n.id}
              ref={(el) => {
                nodeGroup.current[i] = el
              }}
            >
              {n.switcher && (
                <circle
                  ref={(el) => {
                    pulseRing.current[i] = el
                  }}
                  r={0}
                  fill="none"
                  strokeWidth={2}
                  opacity="0"
                />
              )}
              <circle
                ref={(el) => {
                  nodeCircle.current[i] = el
                }}
                className="stage__node"
                role="button"
                tabIndex={i === activeIndex ? 0 : -1}
                aria-label={nodeAriaLabel(n)}
                r={nodeRadius(n)}
                fill={tokens.network[n.network].base}
                stroke={tokens.nodeStroke}
                strokeWidth={1.5}
                filter={n.richClub ? 'url(#node-glow)' : undefined}
                onMouseEnter={() => onInspectHover(targetFor(i))}
                onMouseLeave={() => onInspectHover(null)}
                onFocus={() => {
                  setActiveIndex(i)
                  onInspectHover(targetFor(i))
                }}
                onClick={() => onInspectActivate(targetFor(i))}
              />
              {showLabel && (
                <text
                  ref={(el) => {
                    nodeLabel.current[i] = el
                  }}
                  className="stage__node-label"
                  x={0}
                  y={nodeRadius(n) + 13}
                  textAnchor="middle"
                  fill={tokens.nodeLabel}
                  aria-hidden="true"
                >
                  {n.id}
                </text>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
