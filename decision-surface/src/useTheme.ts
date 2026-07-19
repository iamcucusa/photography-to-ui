import { useCallback, useSyncExternalStore } from 'react'
import { isCaseStudyRoute } from './state/url'

export type ThemeMode = 'dark' | 'light'

// Per-surface theme memory (matches the pre-paint script in index.html):
// the case study defaults light, the app defaults dark, and each surface
// remembers its own explicit choice without affecting the other.
function storageKey(): string {
  return isCaseStudyRoute() ? 'ds-theme-case-study' : 'ds-theme-app'
}

// The <html> data-theme attribute is the single source of truth — the inline
// head script sets it pre-paint, this hook reads and mutates it. Dark is the
// default and carries no attribute.

function readMode(): ThemeMode {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

export function useTheme(): { mode: ThemeMode; toggle: () => void } {
  const mode = useSyncExternalStore(subscribe, readMode)

  const toggle = useCallback(() => {
    const root = document.documentElement
    const next: ThemeMode = readMode() === 'light' ? 'dark' : 'light'

    // Suppress transitions for the switch frame so the recolor is instant,
    // not a staggered morph. Re-enabled next frame (hovers unaffected).
    root.setAttribute('data-theme-switching', '')

    if (next === 'light') {
      root.setAttribute('data-theme', 'light')
    } else {
      root.removeAttribute('data-theme')
    }
    try {
      localStorage.setItem(storageKey(), next)
    } catch {
      // storage unavailable — mode still applies for this session
    }

    void root.offsetHeight
    requestAnimationFrame(() => root.removeAttribute('data-theme-switching'))
  }, [])

  return { mode, toggle }
}
