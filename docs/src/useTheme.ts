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
    const next: ThemeMode = readMode() === 'light' ? 'dark' : 'light'
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // storage unavailable — mode still applies for this session
    }
  }, [])

  return { mode, toggle }
}
