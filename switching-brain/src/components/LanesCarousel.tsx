import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { NETWORK_ORDER, networkVoice } from '../viz/model/types'
import { Lane } from './Lane'
import { NETWORK_BG, type LanesModeProps } from './laneModeData'

/**
 * Carousel mode — one lane at a time at full width (echo-hero always clears
 * 720px → its 3 facet columns). A tablist (roving tabindex, Arrow/Home/End keys)
 * + prev/next arrows + pointer-swipe move between DMN · SN · FPCN; SN is the
 * default. Only the active slide mounts a `Lane` (one substrate / observer).
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
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const startX = useRef<number | null>(null)

  const go = (i: number, focusTab = false) => {
    const next = ((i % n) + n) % n
    setIndex(next)
    if (focusTab) tabs.current[next]?.focus()
  }

  const onTabKey = (e: KeyboardEvent) => {
    const key = e.key
    let next: number | null = null
    if (key === 'ArrowRight' || key === 'ArrowDown') next = index + 1
    else if (key === 'ArrowLeft' || key === 'ArrowUp') next = index - 1
    else if (key === 'Home') next = 0
    else if (key === 'End') next = n - 1
    if (next !== null) {
      e.preventDefault()
      go(next, true)
    }
  }

  const onDown = (e: PointerEvent) => {
    startX.current = e.clientX
  }
  const onUp = (e: PointerEvent) => {
    if (startX.current == null) return
    const dx = e.clientX - startX.current
    startX.current = null
    if (Math.abs(dx) > 40) go(dx < 0 ? index + 1 : index - 1)
  }

  return (
    <div className="lanes-carousel">
      <div className="lanes-carousel__nav" role="tablist" aria-label="Choose a network">
        {lanes.map(({ network }, i) => {
          const net = tokens.network[network]
          return (
            <button
              type="button"
              key={network}
              ref={(el) => {
                tabs.current[i] = el
              }}
              role="tab"
              id={`carousel-tab-${network}`}
              aria-selected={i === index}
              aria-controls={`carousel-panel-${network}`}
              tabIndex={i === index ? 0 : -1}
              className="lanes-carousel__tab"
              data-network={network}
              style={{ '--lane-base': net.base, '--lane-accent': net.bright } as CSSProperties}
              onClick={() => setIndex(i)}
              onKeyDown={onTabKey}
            >
              <span className="lanes-carousel__dot" style={{ background: net.base }} aria-hidden="true" />
              {networkVoice(network).persona}
            </button>
          )
        })}
      </div>

      <div className="lanes-carousel__viewport" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp}>
        <div
          className="lanes-carousel__track"
          style={{ transform: `translateX(${-index * 100}%)` }}
        >
          {lanes.map(({ network, nodes, substrate }, i) => (
            <div
              className="lanes-carousel__slide"
              key={network}
              role="tabpanel"
              id={`carousel-panel-${network}`}
              aria-labelledby={`carousel-tab-${network}`}
              aria-hidden={i !== index}
            >
              {i === index && (
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
          ))}
        </div>
      </div>

      <div className="lanes-carousel__arrows">
        <button
          type="button"
          className="lanes-carousel__arrow"
          onClick={() => go(index - 1)}
          aria-label="Previous network"
        >
          ‹
        </button>
        <button
          type="button"
          className="lanes-carousel__arrow"
          onClick={() => go(index + 1)}
          aria-label="Next network"
        >
          ›
        </button>
      </div>
    </div>
  )
}
