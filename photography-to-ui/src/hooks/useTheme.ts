import { useCallback, useSyncExternalStore } from 'react'

export type ThemeMode = 'dark' | 'light'

const STORAGE_KEY = 'cucusa-theme'

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

    // Suppress transitions for the switch itself, so colors/borders/shadows
    // change instantly instead of animating (which reads as a laggy morph,
    // worst on the menu cards that transition the most properties). Hover
    // transitions are unaffected — the suppressor is dropped next frame.
    root.setAttribute('data-theme-switching', '')

    if (next === 'light') {
      root.setAttribute('data-theme', 'light')
    } else {
      root.removeAttribute('data-theme')
    }
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // storage unavailable — mode still applies for this session
    }

    // Commit the suppressed paint, then re-enable transitions next frame.
    void root.offsetHeight
    requestAnimationFrame(() => root.removeAttribute('data-theme-switching'))
  }, [])

  return { mode, toggle }
}
