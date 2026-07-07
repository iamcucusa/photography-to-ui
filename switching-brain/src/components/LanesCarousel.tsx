import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { NETWORK_ORDER, networkVoice } from '../viz/model/types'
import { Lane } from './Lane'
import { NETWORK_BG, type LanesModeProps } from './laneModeData'

const SWIPE_FRACTION = 0.12 // fraction of viewport width to commit a swipe
const DRAG_THRESHOLD = 8 // px of movement before a press becomes a drag (not a tap)
const EDGE_RESIST = 0.35 // rubber-band factor when dragging past an end
const FLICK_VELOCITY = 0.45 // px/ms — a quick flick commits even under the distance threshold

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
}: LanesModeProps) {
  const n = lanes.length
  const [index, setIndex] = useState(() => Math.max(0, NETWORK_ORDER.indexOf('SN')))
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
  const suppressClick = useRef(false)

  useEffect(() => {
    indexRef.current = index
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [index])

  const clamp = (i: number) => Math.max(0, Math.min(n - 1, i))
  const go = (i: number) => setIndex(clamp(i))

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
    window.removeEventListener('pointermove', onDragMove)
    window.removeEventListener('pointerup', onDragEnd)
    window.removeEventListener('pointercancel', onDragEnd)
    d.active = false
    if (!d.moved) return
    if (raf.current) {
      cancelAnimationFrame(raf.current)
      raf.current = 0
    }
    setDragging(false)
    suppressClick.current = true
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
    window.addEventListener('pointermove', onDragMove, { passive: false })
    window.addEventListener('pointerup', onDragEnd)
    window.addEventListener('pointercancel', onDragEnd)
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

  const onSlideClick = (i: number) => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    if (i !== index) go(i)
  }

  const activeNet = tokens.network[lanes[index].network]

  return (
    <div
      className="lanes-carousel"
      data-dragging={dragging}
      style={{ '--lane-accent': activeNet.bright, '--lane-base': activeNet.base } as CSSProperties}
    >
      {/* WAI-ARIA carousel: a focusable group navigated by ←/→ (no visible
          rotation controls — drag and peek-clicks are the primary affordances). */}
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
              // Clicking a peek advances to it — a pointer shortcut; the accessible
              // control is the focusable carousel (arrow keys change slides).
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
              <div
                className="lanes-carousel__slide"
                key={network}
                role="group"
                aria-roledescription="slide"
                aria-label={`${networkVoice(network).persona} — ${i + 1} of ${n}`}
                aria-hidden={!active}
                data-active={active}
                onClick={() => onSlideClick(i)}
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
