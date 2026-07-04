import { useCallback, useEffect, useRef, useState } from 'react'
import { useGraphData } from './viz/useGraphData'
import { readTokens, type VizTokens } from './viz/runtimeTokens'
import { useReducedMotion } from './viz/useReducedMotion'
import { useMediaQuery } from './viz/useMediaQuery'
import { useIdleReturn } from './viz/useIdleReturn'
import { BrainStage, type InspectTarget } from './viz/BrainStage'
import type { Activation } from './viz/activation'
import { Legend } from './components/Legend'
import { RhythmDial } from './components/RhythmDial'
import { SelfMap } from './components/SelfMap'
import { InspectCard, type Placement } from './components/InspectCard'

/** Concise prose description of the piece — doubles as alt text and caption. */
const TEXT_ALTERNATIVE =
  'A bilateral brain network of three cooperating systems. The Default Mode network ' +
  '(warm, top band) holds design exploration; the Frontoparietal Control network (cool, ' +
  'bottom band) holds live code and rigor; the Salience network (bright accent, middle) is ' +
  'the switch that flips attention between them. The two big networks brighten in turn; at the ' +
  'crossover both are briefly lit — the integration your best work comes from. Left and right ' +
  'regions interleave: the brain is not split between hemispheres, it is one network switching.'

const IDLE_MS = 20000
const BALANCED = 0.5

interface InspectState {
  target: InspectTarget
  placement: Placement
}

/** One-shot eased tween manager (browser rAF). */
function useTween() {
  const raf = useRef<number | null>(null)
  useEffect(
    () => () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    },
    [],
  )
  return useCallback(
    (from: number, to: number, ms: number, onStep: (v: number) => void, onDone?: () => void) => {
      if (raf.current) cancelAnimationFrame(raf.current)
      if (ms <= 0) {
        onStep(to)
        onDone?.()
        return
      }
      const t0 = performance.now()
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / ms)
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
        onStep(from + (to - from) * e)
        if (k < 1) raf.current = requestAnimationFrame(step)
        else {
          raf.current = null
          onDone?.()
        }
      }
      raf.current = requestAnimationFrame(step)
    },
    [],
  )
}

export default function App() {
  const data = useGraphData()
  // Tokens resolve at first render (token CSS imported before mount); read lazily.
  const [tokens] = useState<VizTokens>(() => readTokens())
  const reducedMotion = useReducedMotion()
  // Vertical lanes only on a genuinely narrow (phone-portrait) viewport, where a
  // portrait graph fills the tall screen and aligns the DMN↔FPCN see-saw with the
  // explore→ship self-map. Any wider viewport — landscape phone, iPad, desktop —
  // uses the horizontal bands, which fill the width instead of letterboxing.
  const orientation = useMediaQuery('(max-width: 560px)') ? 'portrait' : 'landscape'

  // ── State model ──────────────────────────────────────────────────────────
  const [rate, setRate] = useState(BALANCED) // always-on, persists across interactions
  const [axis, setAxis] = useState(0) // explore(-1) ↔ ship(+1) self-map; 0 = balanced
  const [playing, setPlaying] = useState(() => !reducedMotion)
  const [hover, setHover] = useState<InspectState | null>(null)
  const [pinned, setPinned] = useState<InspectState | null>(null)

  // The self-map handle is "you": dragging toward explore tilts the brain
  // DMN-dominant, toward ship tilts it FPCN-dominant. 0 = the balanced sweet spot.
  const bias = -axis
  const current = pinned ?? hover
  const inspectedId = current?.target.node.id ?? null

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const outputGlow = useRef<SVGCircleElement | null>(null)
  const tweenRate = useTween()
  const tweenAxis = useTween()

  // Latest state for use inside callbacks without stale closures.
  const axisRef = useRef(axis)
  const rateRef = useRef(rate)
  useEffect(() => {
    axisRef.current = axis
    rateRef.current = rate
  }, [axis, rate])

  const handleFrame = useCallback((a: Activation) => {
    // Drive the dial's core glow from live creative output (the inverted-U).
    // Kept small + contained so it reads as a lit core, not a blob.
    const el = outputGlow.current
    if (el) {
      el.setAttribute('opacity', (0.08 + a.output * 0.5).toFixed(3))
      el.setAttribute('r', (13 + a.output * 11).toFixed(1))
    }
  }, [])

  const easeAxisToBalance = useCallback(
    (ms: number) => {
      tweenAxis(axisRef.current, 0, ms, setAxis)
    },
    [tweenAxis],
  )

  // ── Idle return: ease everything back to ambient watch ───────────────────
  const poke = useIdleReturn(IDLE_MS, () => {
    setHover(null)
    setPinned(null)
    easeAxisToBalance(reducedMotion ? 0 : 700)
    tweenRate(rateRef.current, BALANCED, reducedMotion ? 0 : 1000, setRate)
  })

  function placeFor(t: InspectTarget): Placement {
    const el = canvasRef.current
    const w = el?.clientWidth ?? 1000
    const h = el?.clientHeight ?? 720
    return { flipX: t.cx > w * 0.62, flipY: t.cy < h * 0.3 }
  }

  // ── Inspect ──────────────────────────────────────────────────────────────
  const onInspectHover = useCallback(
    (t: InspectTarget | null) => {
      poke()
      setHover(t ? { target: t, placement: placeFor(t) } : null)
    },
    [poke],
  )

  const onInspectActivate = useCallback(
    (t: InspectTarget) => {
      poke()
      setPinned((p) =>
        p?.target.node.id === t.node.id ? null : { target: t, placement: placeFor(t) },
      )
    },
    [poke],
  )

  const dismissInspect = useCallback(() => {
    setHover(null)
    setPinned(null)
  }, [])

  // Global Escape: unpin the inspect card from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissInspect()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismissInspect])

  // ── Rate ─────────────────────────────────────────────────────────────────
  const onRate = useCallback(
    (v: number) => {
      poke()
      setRate(v)
    },
    [poke],
  )
  const onRateGrab = useCallback(() => {
    poke()
  }, [poke])

  // ── Self-map (the explore↔ship axis IS the entry; no button) ─────────────
  const onAxis = useCallback(
    (v: number) => {
      poke()
      setAxis(v)
    },
    [poke],
  )
  const onSeeBalance = useCallback(() => {
    poke()
    easeAxisToBalance(reducedMotion ? 0 : 800)
  }, [poke, reducedMotion, easeAxisToBalance])

  // Tap empty canvas dismisses the pinned card (no hover trap on touch).
  const onCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (!(e.target as Element).closest('.stage__node')) {
        poke()
        setPinned(null)
      }
    },
    [poke],
  )

  return (
    <main className="app">
      <div className="app__text">
        <div className="app__intro">
          <header className="app__header">
            <p className="app__eyebrow">
              Design-engineer / UX-engineer · the discipline-fusion myth
            </p>
            <h1 className="app__title">The Switching Brain</h1>
            <p className="app__thesis">
              They call design engineers unicorns. You’re not. You’re a brain doing what it does
              best: switching between exploring and building.
            </p>
          </header>

          {data.status === 'ready' && (
            <SelfMap axis={axis} onAxis={onAxis} onSeeBalance={onSeeBalance} />
          )}
        </div>

        {data.status === 'ready' && (
          <div className="app__controls">
            <RhythmDial rate={rate} onRate={onRate} onGrab={onRateGrab} outputRef={outputGlow} />
          </div>
        )}
      </div>

      <section className="stage" aria-label="The switching brain visualization">
        {data.status === 'loading' && (
          <p className="stage__message" role="status">
            Loading the network…
          </p>
        )}

        {data.status === 'error' && (
          <p className="stage__message stage__message--error" role="alert">
            Couldn’t load the brain data ({data.error}). The visualization needs{' '}
            <code>data/nodes.json</code>.
          </p>
        )}

        {data.status === 'ready' && (
          <>
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
            <div className="stage__canvas" ref={canvasRef} onClick={onCanvasClick}>
              <button
                type="button"
                className="play-toggle"
                onClick={() => {
                  poke()
                  setPlaying((p) => !p)
                }}
                aria-pressed={playing}
                aria-label={playing ? 'Pause the animation' : 'Play the animation'}
                title={playing ? 'Pause' : 'Play'}
              >
                {playing ? (
                  <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
                    <rect x="4" y="3" width="3" height="10" rx="1" />
                    <rect x="9" y="3" width="3" height="10" rx="1" />
                  </svg>
                ) : (
                  <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M5 3.2v9.6l8-4.8z" />
                  </svg>
                )}
              </button>

              <BrainStage
                graph={data.graph}
                tokens={tokens}
                rate={rate}
                bias={bias}
                playing={playing}
                reducedMotion={reducedMotion}
                orientation={orientation}
                inspectedId={inspectedId}
                onInspectHover={onInspectHover}
                onInspectActivate={onInspectActivate}
                onEscape={dismissInspect}
                onFrame={handleFrame}
              />

              {current && (
                <InspectCard
                  target={current.target}
                  placement={current.placement}
                  tokens={tokens}
                  pinned={Boolean(pinned)}
                  onClose={dismissInspect}
                />
              )}
            </div>

            <Legend tokens={tokens} />
            <p className="sr-only">{TEXT_ALTERNATIVE}</p>
          </>
        )}
      </section>

      {/* Fixed credit — sits in the viewport's bottom margin, outside the grid. */}
      <div className="credit">
        <a
          href="https://www.linkedin.com/in/iamcucusa"
          target="_blank"
          rel="noopener noreferrer"
          className="credit-link"
        >
          Designed in code by <span className="credit-handle">@iamcucusa</span>
        </a>
      </div>
    </main>
  )
}
