import { useState, useMemo } from 'react'
import primitives from '@tokens/color/primitives.json'
import { useTheme } from '../hooks/useTheme'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TokenGroup = Record<string, any>

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

// WCAG 2.1 relative luminance + contrast ratio, computed from the RESOLVED
// values of the active mode (read from the live cascade), so the displayed
// numbers track whichever theme is on screen and can never drift.
type Rgba = { r: number; g: number; b: number; a: number }

const channelLin = (c: number): number => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

const luminance = ({ r, g, b }: Rgba): number =>
  0.2126 * channelLin(r) + 0.7152 * channelLin(g) + 0.0722 * channelLin(b)

const compositeOver = (fg: Rgba, bg: Rgba): Rgba => ({
  r: fg.r * fg.a + bg.r * (1 - fg.a),
  g: fg.g * fg.a + bg.g * (1 - fg.a),
  b: fg.b * fg.a + bg.b * (1 - fg.a),
  a: 1,
})

const contrast = (fg: Rgba, bg: Rgba): number => {
  const f = fg.a < 1 ? compositeOver(fg, bg) : fg
  const [hi, lo] = [luminance(f), luminance(bg)].sort((a, b) => b - a)
  return (hi + 0.05) / (lo + 0.05)
}

// Parse what getComputedStyle returns for a resolved color: rgb()/rgba(),
// or color(srgb r g b [/ a]) with 0–1 channels (how Chromium serializes
// color-mix results).
const parseCssColor = (value: string): Rgba => {
  const srgb = value.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/)
  if (srgb) {
    return {
      r: parseFloat(srgb[1]) * 255,
      g: parseFloat(srgb[2]) * 255,
      b: parseFloat(srgb[3]) * 255,
      a: srgb[4] !== undefined ? parseFloat(srgb[4]) : 1,
    }
  }
  const nums = value.match(/[\d.]+/g)
  if (nums && nums.length >= 3) {
    return {
      r: parseFloat(nums[0]),
      g: parseFloat(nums[1]),
      b: parseFloat(nums[2]),
      a: nums.length >= 4 ? parseFloat(nums[3]) : 1,
    }
  }
  return { r: 0, g: 0, b: 0, a: 1 }
}

// Resolve a custom property to its concrete color through a probe element —
// the browser computes the full var()/color-mix() chain for the ACTIVE mode.
const resolveCssVar = (varName: string): Rgba => {
  const probe = document.createElement('div')
  probe.style.display = 'none'
  probe.style.color = `var(${varName})`
  document.body.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return parseCssColor(resolved)
}

const rgbaToHex = ({ r, g, b }: Rgba): string =>
  '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')

interface ColorInfo {
  name: string
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
}

interface Palette {
  id: string
  name: string
  colors: ColorInfo[]
}

const PALETTE_NAMES = ['magenta', 'sky', 'frost', 'sand', 'ink'] as const

function buildPalettes(): Palette[] {
  const colorData = primitives.color as TokenGroup
  return PALETTE_NAMES.map((id) => {
    const group = colorData[id] as TokenGroup
    const colors: ColorInfo[] = ['1', '2', '3', '4', '5'].map((stop) => {
      const hex = group[stop].$value as string
      const rgb = hexToRgb(hex)
      return {
        name: `${id.charAt(0).toUpperCase() + id.slice(1)} ${stop}`,
        hex: hex.toUpperCase(),
        rgb,
        hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
      }
    })
    return { id, name: id.charAt(0).toUpperCase() + id.slice(1), colors }
  })
}

const formatRatio = (ratio: number): string => `${ratio.toFixed(1)}:1`

const gradeText = (ratio: number): string => (ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : '—')

interface StructureSurface {
  id: string
  label: string
  hex: string
  rows: { id: string; label: string; ratio: number }[]
}

interface Structure {
  surfaces: StructureSurface[]
  onAccent: number
  borders: { id: string; label: string; ratio: number }[]
}

function buildStructure(): Structure {
  const canvas = resolveCssVar('--color-bg-canvas')
  const surfaceColor = resolveCssVar('--color-bg-surface')
  const elevated = resolveCssVar('--color-bg-elevated')

  const roles = [
    { id: 'primary', label: 'text-primary', color: resolveCssVar('--color-text-primary') },
    { id: 'secondary', label: 'text-secondary', color: resolveCssVar('--color-text-secondary') },
    { id: 'muted', label: 'text-muted', color: resolveCssVar('--color-text-muted') },
    { id: 'accent', label: 'text-accent', color: resolveCssVar('--color-text-accent') },
    { id: 'cool', label: 'text-cool', color: resolveCssVar('--color-text-cool') },
  ]

  const surfaces = [
    { id: 'canvas', label: 'bg-canvas', color: canvas },
    { id: 'surface', label: 'bg-surface', color: surfaceColor },
    { id: 'elevated', label: 'bg-elevated', color: elevated },
  ].map((s) => ({
    id: s.id,
    label: s.label,
    hex: rgbaToHex(s.color),
    rows: roles.map((r) => ({ id: r.id, label: r.label, ratio: contrast(r.color, s.color) })),
  }))

  const accent = resolveCssVar('--color-accent')

  return {
    surfaces,
    onAccent: contrast(resolveCssVar('--color-text-on-accent'), accent),
    borders: [
      {
        id: 'accent',
        label: 'border-accent',
        ratio: contrast(resolveCssVar('--color-border-accent'), canvas),
      },
      {
        id: 'strong',
        label: 'border-accent-strong',
        ratio: contrast(resolveCssVar('--color-border-accent-strong'), canvas),
      },
    ],
  }
}

function Colors() {
  const [activePalette, setActivePalette] = useState<string>('magenta')
  const { mode } = useTheme()
  const palettes = useMemo(() => buildPalettes(), [])
  // `mode` is the recompute trigger, not a value dependency: buildStructure
  // reads resolved colors from the live CSS cascade (getComputedStyle), which
  // changes when the theme flips. ESLint can't see that DOM dependency.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const structure = useMemo(() => buildStructure(), [mode])

  const showStructure = activePalette === 'structure'
  const currentPalette = palettes.find((p) => p.id === activePalette) || palettes[0]

  return (
    <div className="colors-component">
      <div className="colors-carousel">
        <div className="colors-carousel-nav" role="group" aria-label="Palette and view selector">
          {palettes.map((palette) => (
            <button
              key={palette.id}
              className={`colors-palette-button ${activePalette === palette.id ? 'colors-palette-button-active' : ''}`}
              onClick={() => setActivePalette(palette.id)}
              aria-pressed={activePalette === palette.id}
              aria-label={`Select ${palette.name} palette`}
            >
              {palette.name}
            </button>
          ))}
          <button
            className={`colors-palette-button ${showStructure ? 'colors-palette-button-active' : ''}`}
            onClick={() => setActivePalette('structure')}
            aria-pressed={showStructure}
            aria-label="Show semantic structure and contrast"
          >
            Structure
          </button>
        </div>
      </div>

      {showStructure ? (
        <div className="colors-palette-display" aria-live="polite">
          <h3 className="colors-palette-name">Structure · {mode}</h3>
          <p className="structure-note">
            Roles, not colors. Every pairing renders in its own tokens and carries its measured
            contrast — resolved live from the active mode.
          </p>
          <div className="structure-surfaces">
            {structure.surfaces.map((surface) => (
              <div key={surface.id} className={`structure-surface structure-surface-${surface.id}`}>
                <div className="structure-surface-name">
                  {surface.label} · {surface.hex}
                </div>
                {surface.rows.map((row) => (
                  <div key={row.id} className={`structure-text structure-text-${row.id}`}>
                    <span>{row.label}</span>
                    <span className="structure-ratio">
                      {formatRatio(row.ratio)} {gradeText(row.ratio)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="structure-accent-row">
            <div className="structure-chip structure-chip-accent">
              <span>text-on-accent</span>
              <span className="structure-ratio">
                {formatRatio(structure.onAccent)} {gradeText(structure.onAccent)}
              </span>
            </div>
            {structure.borders.map((border) => (
              <div key={border.id} className={`structure-chip structure-chip-border-${border.id}`}>
                <span>{border.label}</span>
                <span className="structure-ratio">{formatRatio(border.ratio)} ≥3:1</span>
              </div>
            ))}
            <div className="structure-chip structure-chip-border-subtle">
              <span>divider-subtle</span>
              <span className="structure-ratio">decorative</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="colors-palette-display" aria-live="polite">
          <h3 className="colors-palette-name">{currentPalette.name}</h3>
          <div className="colors-grid">
            {currentPalette.colors.map((color, index) => (
              <div
                key={color.name}
                className="color-swatch"
                style={{
                  backgroundColor: color.hex,
                  gridColumn: index === 0 ? 'span 2' : 'span 1',
                  gridRow: index === 0 ? 'span 2' : 'span 1',
                }}
              >
                <div className="color-swatch-info">
                  <div className="color-info-name">{color.name}</div>
                  <div className="color-info-hex">{color.hex}</div>
                  <div className="color-info-rgb">
                    rgb({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
                  </div>
                  <div className="color-info-hsl">
                    hsl({color.hsl.h}, {color.hsl.s}%, {color.hsl.l}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Colors
