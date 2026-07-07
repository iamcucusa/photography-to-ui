import { useEffect, useRef } from 'react'
import { withAlpha } from '../viz/runtimeTokens'

/**
 * Shared inspect cursor for the reading lanes. On mouse hover of ANY node entry
 * (`.lane__entry`, in any mode — accordion / board / carousel) the native cursor
 * is replaced by a small dot in that lane's own colour that glows, reinforcing
 * "hover to illuminate this node" (the entry + graph light up via the existing
 * hover highlight). Mouse-only, pointer-events-none, aria-hidden; mounted once by
 * BrainLanes and scoped to the `.lanes` region.
 */
export function LaneCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const lastEntry = useRef<Element | null>(null)

  useEffect(() => {
    const dot = dotRef.current
    if (!dot) return
    const scope = dot.closest('.lanes') ?? document
    const hide = () => {
      dot.dataset.show = 'false'
      lastEntry.current = null
    }
    const onMove = (e: Event) => {
      const pe = e as PointerEvent
      if (pe.pointerType !== 'mouse') return
      const entry = (pe.target as Element | null)?.closest?.('.lane__entry') ?? null
      if (!entry) {
        if (dot.dataset.show === 'true') hide()
        return
      }
      // Position follows every move; the colour read (a forced style recalc) runs
      // only when the hovered entry actually changes — not per move.
      dot.style.transform = `translate3d(${pe.clientX}px, ${pe.clientY}px, 0)`
      if (entry !== lastEntry.current) {
        lastEntry.current = entry
        const color = getComputedStyle(entry).getPropertyValue('--lane-accent').trim()
        if (color) {
          dot.style.background = color
          dot.style.boxShadow = `0 0 4px ${withAlpha(color, 0.95)}, 0 0 12px 2px ${withAlpha(color, 0.6)}`
        }
      }
      dot.dataset.show = 'true'
    }
    scope.addEventListener('pointermove', onMove, { passive: true })
    scope.addEventListener('pointerleave', hide)
    window.addEventListener('blur', hide)
    return () => {
      scope.removeEventListener('pointermove', onMove)
      scope.removeEventListener('pointerleave', hide)
      window.removeEventListener('blur', hide)
    }
  }, [])

  return <div className="lane-cursor" ref={dotRef} aria-hidden="true" />
}
