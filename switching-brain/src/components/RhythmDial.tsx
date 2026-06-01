import { useCallback, useRef, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'

interface Spectrum {
  key: 'stuck' | 'flow' | 'thrash'
  label: string
  /** What your rhythm is doing. */
  lead: string
  /** What it does to the work. */
  result: string
}

/**
 * Switching RHYTHM (distinct from the self-map's direction): how often you flip,
 * not which side you lean. Pure frequency language so it never collides with the
 * explore/ship axis. Two stacked phrases: what your rhythm does, then what that
 * does to the work.
 */
function spectrum(rate: number): Spectrum {
  if (rate < 0.3)
    return {
      key: 'stuck',
      label: 'Stuck',
      lead: 'You hold one mode too long.',
      result: 'The work goes deep, then stalls.',
    }
  if (rate > 0.72)
    return {
      key: 'thrash',
      label: 'Thrash',
      lead: 'You switch before anything lands.',
      result: 'All motion, nothing ships.',
    }
  return {
    key: 'flow',
    label: 'Flow',
    lead: 'You switch right on tempo.',
    result: 'Deep work that still keeps moving.',
  }
}

// Gauge geometry: a 270° arc with the gap at the bottom (rate 0 = bottom-left,
// rate 1 = bottom-right, 0.5 = top). Angles in screen coords (y-down, clockwise).
const SIZE = 168
const CX = SIZE / 2
const CY = SIZE / 2
const R = 62
const START = 135
const SWEEP = 270
const FLOW_LO = 0.3
const FLOW_HI = 0.72
const DEAD_ZONE = 30 // ignore pointer-downs near the center

function polar(r: number, deg: number) {
  const a = (deg * Math.PI) / 180
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }
}

function arcPath(r: number, startDeg: number, endDeg: number): string {
  const s = polar(r, startDeg)
  const e = polar(r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

const angleForRate = (rate: number) => START + rate * SWEEP

interface RhythmDialProps {
  rate: number
  onRate: (rate: number) => void
  /** Fired on pointer-down / key (user grabbed the rhythm) — resets idle. */
  onGrab: () => void
  /** Center glow circle; the parent drives its size/opacity from live output. */
  outputRef: RefObject<SVGCircleElement | null>
}

/**
 * Radial rhythm control. The handle on the ring sets the switching rate; the core
 * glows with live creative output (the inverted-U — brightest at flow). A native
 * `role="slider"` with full keyboard support and aria-valuetext keeps it accessible.
 */
export function RhythmDial({ rate, onRate, onGrab, outputRef }: RhythmDialProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)
  const spec = spectrum(rate)

  const rateFromPointer = useCallback((clientX: number, clientY: number): number | null => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * SIZE
    const y = ((clientY - rect.top) / rect.height) * SIZE
    if (Math.hypot(x - CX, y - CY) < DEAD_ZONE) return null
    const deg = (Math.atan2(y - CY, x - CX) * 180) / Math.PI
    let rel = (deg - START) % 360
    if (rel < 0) rel += 360
    if (rel > SWEEP) rel = rel - SWEEP < 360 - rel ? SWEEP : 0 // snap out of the gap
    return Math.max(0, Math.min(1, rel / SWEEP))
  }, [])

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    dragging.current = true
    onGrab()
    const r = rateFromPointer(e.clientX, e.clientY)
    if (r !== null) onRate(r)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* pointer capture is best-effort — the drag still works without it */
    }
  }

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return
    const r = rateFromPointer(e.clientX, e.clientY)
    if (r !== null) onRate(r)
  }

  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    dragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    let r = rate
    let handled = true
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') r = Math.min(1, rate + 0.02)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') r = Math.max(0, rate - 0.02)
    else if (e.key === 'PageUp') r = Math.min(1, rate + 0.1)
    else if (e.key === 'PageDown') r = Math.max(0, rate - 0.1)
    else if (e.key === 'Home') r = 0
    else if (e.key === 'End') r = 1
    else handled = false
    if (handled) {
      e.preventDefault()
      onGrab()
      onRate(r)
    }
  }

  const handle = polar(R, angleForRate(rate))

  return (
    <div className={`dial dial--${spec.key}`}>
      <p className="dial__prompt">How often do you switch?</p>

      <div className="dial__body">
        <svg
          ref={svgRef}
          className="dial__svg"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="slider"
          tabIndex={0}
          aria-label="Switching rhythm"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(rate * 100)}
          aria-valuetext={`${spec.label}. ${spec.lead} ${spec.result}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
        >
          <defs>
            <radialGradient id="dial-output">
              <stop offset="0%" className="dial__glow-stop dial__glow-stop--in" />
              <stop offset="45%" className="dial__glow-stop dial__glow-stop--mid" />
              <stop offset="100%" className="dial__glow-stop dial__glow-stop--out" />
            </radialGradient>
          </defs>

          <path d={arcPath(R, START, START + SWEEP)} className="dial__track" fill="none" />
          <path
            d={arcPath(R, angleForRate(FLOW_LO), angleForRate(FLOW_HI))}
            className="dial__flow"
            fill="none"
          />

          {/* Core = live creative output (driven imperatively by the parent). */}
          <circle ref={outputRef} cx={CX} cy={CY} r={16} fill="url(#dial-output)" opacity="0.4" />

          <circle cx={handle.x} cy={handle.y} r={7} className="dial__handle" />

          <text
            x={CX}
            y={CY}
            className="dial__label"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {spec.label}
          </text>

          {/* Keyboard focus ring — a vector circle (stays crisp at any zoom), shown
              only on :focus-visible so mouse/touch gets no ring. */}
          <circle cx={CX} cy={CY} r={72} className="dial__focus-ring" fill="none" />
        </svg>

        <span className="sr-only">
          The glow at the center is creative output. It peaks in flow and craters at both extremes.
        </span>
      </div>

      <p className="dial__readout" aria-live="polite">
        <span className="dial__lead">{spec.lead}</span>
        <span className="dial__result">{spec.result}</span>
      </p>
    </div>
  )
}
