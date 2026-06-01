/**
 * runtimeTokens — read design-system color at RUNTIME from CSS custom properties.
 *
 * The token-coverage checker rejects any hardcoded hex/rgba/color-mix in src, and
 * the brief requires "discover, don't invent": the draw layer must resolve every
 * color through the design system so theming comes for free. So instead of literal
 * colors we read the resolved values of `--viz-*` / `--color-*` via getComputedStyle
 * and compose any alpha at runtime (string-built rgba — never a literal in source).
 *
 * Values are resolved once against :root and cached; call `readTokens()` again only
 * if the theme could have changed (e.g. a future light/dark toggle).
 */

import type { NetworkId } from './model/types'

export interface NetworkColors {
  dim: string
  base: string
  bright: string
}

export interface VizTokens {
  network: Record<NetworkId, NetworkColors>
  edge: string
  stageBg: string
  nodeStroke: string
  nodeLabel: string
}

/** Resolve a single custom property against the document root. */
function cssVar(name: string, root: HTMLElement): string {
  return getComputedStyle(root).getPropertyValue(name).trim()
}

export function readTokens(root: HTMLElement = document.documentElement): VizTokens {
  const v = (name: string) => cssVar(name, root)
  return {
    network: {
      DMN: { dim: v('--viz-dmn-dim'), base: v('--viz-dmn'), bright: v('--viz-dmn-bright') },
      FPCN: { dim: v('--viz-fpcn-dim'), base: v('--viz-fpcn'), bright: v('--viz-fpcn-bright') },
      SN: { dim: v('--viz-sn-dim'), base: v('--viz-sn'), bright: v('--viz-sn-bright') },
    },
    edge: v('--viz-edge'),
    stageBg: v('--viz-stage-bg'),
    nodeStroke: v('--viz-node-stroke'),
    nodeLabel: v('--viz-node-label'),
  }
}

/**
 * Parse a resolved CSS color (hex #rgb/#rrggbb/#rrggbbaa, or an rgb()/rgba() the
 * browser produced) into [r, g, b]. Returns null if it can't be parsed so callers
 * can fall back gracefully rather than draw a wrong color.
 */
export function parseRgb(color: string): [number, number, number] | null {
  const c = color.trim()
  if (c.startsWith('#')) {
    let hex = c.slice(1)
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split('')
        .map((ch) => ch + ch)
        .join('')
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      if ([r, g, b].every((n) => !Number.isNaN(n))) return [r, g, b]
    }
    return null
  }
  const m = c.match(/(\d+(?:\.\d+)?)/g)
  if (m && m.length >= 3) {
    return [Number(m[0]), Number(m[1]), Number(m[2])]
  }
  return null
}

/** Compose an rgba() string from a resolved token color + alpha [0,1], at runtime. */
export function withAlpha(color: string, alpha: number): string {
  const rgb = parseRgb(color)
  const a = Math.max(0, Math.min(1, alpha))
  if (!rgb) return color
  const [r, g, b] = rgb
  return ['rgba(', r, ',', g, ',', b, ',', a.toFixed(3), ')'].join('')
}

/** Linear blend between two resolved token colors → rgb() string. t in [0,1]. */
export function mix(a: string, b: string, t: number): string {
  const ca = parseRgb(a)
  const cb = parseRgb(b)
  if (!ca || !cb) return a
  const k = Math.max(0, Math.min(1, t))
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * k)
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * k)
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * k)
  return ['rgb(', r, ',', g, ',', bl, ')'].join('')
}
