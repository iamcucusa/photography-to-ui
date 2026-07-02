/**
 * Runtime token resolution for the catalog. Reads the LIVE cascade via a probe
 * element (same pattern as the playground's Structure view) so the resolved
 * value is exactly what renders — through ref → primitive, color-mix(), and the
 * active mode — with no duplicated resolution logic. Recompute on mode change.
 */

type Rgba = [r: number, g: number, b: number, a: number]

// Parse what getComputedStyle returns: rgb()/rgba() or color(srgb r g b / a).
function parseCssColor(value: string): Rgba {
  const srgb = value.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/)
  if (srgb) {
    return [+srgb[1] * 255, +srgb[2] * 255, +srgb[3] * 255, srgb[4] !== undefined ? +srgb[4] : 1]
  }
  const n = value.match(/[\d.]+/g)
  if (n && n.length >= 3) return [+n[0], +n[1], +n[2], n.length >= 4 ? +n[3] : 1]
  return [0, 0, 0, 1]
}

const toHex = ([r, g, b, a]: Rgba): string => {
  const h = (c: number) => Math.round(c).toString(16).padStart(2, '0')
  return '#' + h(r) + h(g) + h(b) + (a < 1 ? h(a * 255) : '')
}

/** Resolve a CSS custom property to a concrete #hex for the ACTIVE mode. */
export function resolveVarToHex(name: string): string {
  const probe = document.createElement('div')
  probe.style.display = 'none'
  probe.style.color = `var(${name})`
  document.body.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return toHex(parseCssColor(resolved)).toLowerCase()
}

// ── WCAG contrast ──────────────────────────────────────────────────

const channelLin = (c: number): number => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}

const luminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * channelLin(r) + 0.7152 * channelLin(g) + 0.0722 * channelLin(b)
}

/** WCAG contrast ratio between two solid #hex colors. */
export function contrastRatio(fg: string, bg: string): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return (hi + 0.05) / (lo + 0.05)
}

export function grade(ratio: number): 'AAA' | 'AA' | 'fail' {
  return ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'fail'
}
