import { useLayoutEffect, useRef, type RefObject } from 'react'

// FLIP-style position transitions for list reorders: measure before paint,
// offset each moved row to its old position, then release it into a CSS
// transition on the contract's duration tokens. One-shot transforms — no
// rAF loops, no animation library. Reduced motion collapses the duration
// custom property to zero, keeping end states (I7).
export function useRowTransitions(
  containerRef: RefObject<HTMLElement | null>,
  orderKey: string,
  settleToken: unknown,
): void {
  const previousTops = useRef<Map<string, number>>(new Map())
  const previousToken = useRef<unknown>(settleToken)

  useLayoutEffect(() => {
    // A reorder caused by a weight save settles at 320 ms so causality is
    // visible; every other reorder moves at the 200 ms standard.
    const durationVar =
      previousToken.current === settleToken ? '--ds-duration-standard' : '--ds-duration-settle'
    previousToken.current = settleToken
    const container = containerRef.current
    if (!container) return
    const rows = container.querySelectorAll<HTMLElement>('[data-flip-key]')
    const nextTops = new Map<string, number>()
    rows.forEach((el) => {
      nextTops.set(el.dataset.flipKey!, el.getBoundingClientRect().top)
    })
    rows.forEach((el) => {
      const key = el.dataset.flipKey!
      const before = previousTops.current.get(key)
      const after = nextTops.get(key)!
      if (before === undefined || before === after) return
      el.style.transition = 'none'
      el.style.transform = `translateY(${before - after}px)`
      void el.offsetHeight
      requestAnimationFrame(() => {
        el.style.transition = `transform var(${durationVar}) var(--ds-ease)`
        el.style.transform = ''
      })
    })
    previousTops.current = nextTops
  }, [containerRef, orderKey, settleToken])
}
