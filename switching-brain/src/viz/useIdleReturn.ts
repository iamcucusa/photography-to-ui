import { useCallback, useEffect, useRef } from 'react'

/**
 * Idle return: after `delayMs` of no `poke()`, call `onIdle` once. The piece is
 * always demo- and screen-record-ready — any active mode eases back to ambient
 * watch when the user stops interacting. Call the returned `poke` on every input.
 */
export function useIdleReturn(delayMs: number, onIdle: () => void): () => void {
  const timer = useRef<number | null>(null)
  const onIdleRef = useRef(onIdle)
  useEffect(() => {
    onIdleRef.current = onIdle
  }, [onIdle])

  const poke = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = window.setTimeout(() => onIdleRef.current(), delayMs)
  }, [delayMs])

  useEffect(() => {
    poke()
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [poke])

  return poke
}
