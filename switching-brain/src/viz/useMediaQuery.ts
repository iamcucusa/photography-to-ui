import { useSyncExternalStore } from 'react'

/**
 * Tracks a CSS media query in React, live. Mirrors useReducedMotion: a
 * useSyncExternalStore binding so there's no setState-in-effect and it updates
 * the moment the query flips (resize / orientation change). Used to pick the
 * graph's orientation from the same breakpoint the compact CSS layout uses.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
