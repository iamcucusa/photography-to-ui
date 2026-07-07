import { useSyncExternalStore } from 'react'

/** One MediaQueryList per query string, reused across every hook instance so
 *  getSnapshot reads `.matches` off a cached object instead of re-invoking
 *  matchMedia on every render (there are several live at once, some re-rendering
 *  on each hover). */
const mqlCache = new Map<string, MediaQueryList>()
function getMql(query: string): MediaQueryList {
  let mql = mqlCache.get(query)
  if (!mql) {
    mql = window.matchMedia(query)
    mqlCache.set(query, mql)
  }
  return mql
}

/**
 * Tracks a CSS media query in React, live. Mirrors useReducedMotion: a
 * useSyncExternalStore binding so there's no setState-in-effect and it updates
 * the moment the query flips (resize / orientation change). Used to pick the
 * graph's orientation and the lanes' interaction tier from CSS breakpoints.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = getMql(query)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    () => getMql(query).matches,
    () => false,
  )
}
