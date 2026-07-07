import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { networkVoice, type NetworkId } from '../viz/model/types'
import { useReducedMotion } from '../viz/useReducedMotion'
import { Lane } from './Lane'
import { NETWORK_BG, type LanesModeProps } from './laneModeData'

export interface LanesCarouselProps extends LanesModeProps {
  /** The active slide's network, lifted to BrainLanes so it survives a tier swap. */
  active: NetworkId
  onActive: (network: NetworkId) => void
}

const SWIPE_FRACTION = 0.12 // fraction of viewport width to commit a swipe
const DRAG_THRESHOLD = 8 // px of movement before a press becomes a drag (not a tap)
const EDGE_RESIST = 0.35 // rubber-band factor when dragging past an end
const FLICK_VELOCITY = 0.45 // px/ms — a quick flick commits even under the distance threshold

// One swipe-hint nudge per session (module-level so a tier change doesn't repeat it).
let hasHintedSwipe = false

/**
 * Carousel mode — one lane read at a time, its neighbours PEEKING on both sides
 * so it's clear there's more. Navigation is the card itself: grab and drag it
 * anywhere (the cards are tall and unequal, so bottom controls don't cut it)
 * with live follow + snap, click a peek to advance, or — for keyboard/AT — focus
 * the carousel and use ←/→/Home/End. A custom swipe cursor signals the drag on
 * mouse. Neighbours are pre-mounted (smooth swaps); echo-hero still clears 720px
 * since the active card is ~82% of the viewport.
 */
export function LanesCarousel({
  lanes,
  tokens,
  inspectedId,
  onNodeHover,
  onNodeSelect,
  active,
  onActive,
}: LanesCarouselProps) {
  const n = lanes.length
  // Controlled: the active slide is derived from the lifted `active` network.
  const index = Math.max(
    0,
    lanes.findIndex((l) => l.network === active),
  )
  const [dragging, setDragging] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(index)
  const drag = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    dx: 0,
    w: 1,
    lastX: 0,
    lastT: 0,
    vx: 0,
  })
  const raf = useRef(0)
  const dragAbort = useRef<AbortController | null>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    indexRef.current = index
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [index])

  // Unmounting mid-drag (e.g. a tier switch during a swipe) must drop the window
  // pointer listeners — they're normally removed on pointerup, which won't fire.
  useEffect(() => () => dragAbort.current?.abort(), [])

  // Swipe cue — a one-time gentle nudge of the track so the peek moves, hinting
  // the cards are swipeable (the only affordance on touch). Reduced-motion + once
  // per session; the flag is set only AFTER it completes, so StrictMode's dev
  // mount→cleanup→remount doesn't cancel-then-skip it.
  useEffect(() => {
    if (reduce || hasHintedSwipe) return
    const track = trackRef.current
    if (!track) return
    const out = setTimeout(() => {
      if (!drag.current.active) track.style.setProperty('--drag', '-26px')
    }, 650)
    const back = setTimeout(() => {
      if (!drag.current.active) track.style.setProperty('--drag', '0px')
      hasHintedSwipe = true
    }, 1150)
    return () => {
      clearTimeout(out)
      clearTimeout(back)
    }
  }, [reduce])

  const clamp = (i: number) => Math.max(0, Math.min(n - 1, i))
  const go = (i: number) => onActive(lanes[clamp(i)].network)

  const setDrag = (px: number) => trackRef.current?.style.setProperty('--drag', `${px}px`)

  // ── Drag (pointer) — track follows the pointer, snaps on release ────────────
  const onDragMove = (ev: PointerEvent) => {
    const d = drag.current
    if (!d.active) return
    let dx = ev.clientX - d.startX
    const dy = ev.clientY - d.startY
    if (!d.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      if (Math.abs(dx) < Math.abs(dy)) {
        d.active = false // vertical intent → let the page scroll
        return
      }
      d.moved = true
      setDragging(true)
      if (cursorRef.current) cursorRef.current.dataset.show = 'false'
    }
    ev.preventDefault()
    // Velocity (px/ms) for flick-to-commit — lightly smoothed so one jittery
    // sample can't fake a flick.
    const now = ev.timeStamp || performance.now()
    const dt = now - d.lastT
    if (dt > 0.5) {
      // dt floor skips near-duplicate timestamps whose 1/dt would fake a flick.
      d.vx = d.vx * 0.4 + ((ev.clientX - d.lastX) / dt) * 0.6
      d.lastX = ev.clientX
      d.lastT = now
    }
    const i = indexRef.current
    if ((i === 0 && dx > 0) || (i === n - 1 && dx < 0)) dx *= EDGE_RESIST
    d.dx = dx
    // Coalesce style writes to one per frame (steady even on high-refresh input).
    if (!raf.current) {
      raf.current = requestAnimationFrame(() => {
        raf.current = 0
        setDrag(drag.current.dx)
      })
    }
  }

  const onDragEnd = () => {
    const d = drag.current
    dragAbort.current?.abort()
    dragAbort.current = null
    d.active = false
    if (!d.moved) return
    if (raf.current) {
      cancelAnimationFrame(raf.current)
      raf.current = 0
    }
    setDragging(false)
    setDrag(0)
    const farEnough = Math.abs(d.dx) > d.w * SWIPE_FRACTION
    const flicked = Math.abs(d.vx) > FLICK_VELOCITY && Math.abs(d.dx) > 20
    if (farEnough || flicked) {
      // Direction from displacement; fall back to velocity when barely moved.
      const dir = (Math.abs(d.dx) > 4 ? d.dx : d.vx) < 0 ? 1 : -1
      go(indexRef.current + dir)
    }
    d.moved = false
  }

  const onPointerDown = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return
    const vp = viewportRef.current
    drag.current = {
      active: true,
      moved: false,
      startX: ev.clientX,
      startY: ev.clientY,
      dx: 0,
      w: vp ? vp.clientWidth : 1,
      lastX: ev.clientX,
      lastT: ev.timeStamp || performance.now(),
      vx: 0,
    }
    dragAbort.current?.abort()
    const ac = new AbortController()
    dragAbort.current = ac
    const opts = { signal: ac.signal }
    window.addEventListener('pointermove', onDragMove, { passive: false, signal: ac.signal })
    window.addEventListener('pointerup', onDragEnd, opts)
    window.addEventListener('pointercancel', onDragEnd, opts)
  }

  // ── Custom swipe cursor (mouse only) ────────────────────────────────────────
  const onViewportMove = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (ev.pointerType !== 'mouse' || drag.current.moved) return // hidden while grabbing
    const vp = viewportRef.current
    const cur = cursorRef.current
    if (!vp || !cur) return
    const rect = vp.getBoundingClientRect()
    cur.style.transform = `translate3d(${ev.clientX - rect.left}px, ${ev.clientY - rect.top}px, 0)`
    // Over an entry the shared inspect dot (LaneCursor) leads — hide the chevrons.
    const overEntry = (ev.target as Element)?.closest?.('.lane__entry')
    if (!drag.current.moved) cur.dataset.show = overEntry ? 'false' : 'true'
  }
  const hideCursor = () => {
    if (cursorRef.current) cursorRef.current.dataset.show = 'false'
  }

  // ── Keyboard (focus the carousel) — the accessible navigation ───────────────
  const onKeyDown = (ev: ReactKeyboardEvent) => {
    let next: number | null = null
    if (ev.key === 'ArrowRight') next = index + 1
    else if (ev.key === 'ArrowLeft') next = index - 1
    else if (ev.key === 'Home') next = 0
    else if (ev.key === 'End') next = n - 1
    if (next !== null) {
      ev.preventDefault()
      go(next)
    }
  }

  const activeNet = tokens.network[lanes[index].network]

  return (
    <div
      className="lanes-carousel"
      data-dragging={dragging}
      style={{ '--lane-accent': activeNet.bright, '--lane-base': activeNet.base } as CSSProperties}
    >
      {/* Announce the active slide to screen readers on change. */}
      <p className="sr-only" aria-live="polite">
        {networkVoice(lanes[index].network).persona}, {index + 1} of {n}
      </p>
      {/* Position indicator that doubles as the operable control (for
          switch-access / SR / non-drag users). Above the card so it's seen
          without scrolling a tall lane. */}
      <div className="lanes-carousel__dots" role="group" aria-label="Choose a network">
        {lanes.map(({ network }, i) => (
          <button
            type="button"
            key={network}
            className="lanes-carousel__dot"
            data-active={i === index}
            aria-current={i === index ? 'true' : undefined}
            aria-label={networkVoice(network).persona}
            onClick={() => go(i)}
          />
        ))}
      </div>
      {/* WAI-ARIA carousel: a focusable group navigated by ←/→. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="lanes-carousel__viewport"
        ref={viewportRef}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label="The three networks — drag, or use the arrow keys"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onViewportMove}
        onPointerEnter={onViewportMove}
        onPointerLeave={hideCursor}
      >
        <div
          className="lanes-carousel__track"
          ref={trackRef}
          style={{ '--index': index } as CSSProperties}
        >
          {lanes.map(({ network, nodes, substrate }, i) => {
            const mounted = Math.abs(i - index) <= 1
            const active = i === index
            return (
              // Non-active slides are `inert`: their (still-mounted, peeking) Lane
              // entries drop out of the tab order and the AT tree, so nothing
              // focusable hides behind aria-hidden. Navigation is the dots / drag /
              // arrow keys.
              <div
                className="lanes-carousel__slide"
                key={network}
                role="group"
                aria-roledescription="slide"
                aria-label={`${networkVoice(network).persona} — ${i + 1} of ${n}`}
                aria-hidden={!active}
                inert={!active}
                data-active={active}
              >
                {mounted && (
                  <Lane
                    network={network}
                    nodes={nodes}
                    substrate={substrate}
                    tokens={tokens}
                    inspectedId={inspectedId}
                    onNodeHover={onNodeHover}
                    onNodeSelect={onNodeSelect}
                    bgVariant={NETWORK_BG[network]}
                    iaLayout="echo-hero"
                  />
                )}
              </div>
            )
          })}
        </div>

        <div className="lanes-carousel__cursor" ref={cursorRef} aria-hidden="true">
          <span className="lanes-carousel__cursor-glyph">‹&ensp;›</span>
        </div>
      </div>
    </div>
  )
}
