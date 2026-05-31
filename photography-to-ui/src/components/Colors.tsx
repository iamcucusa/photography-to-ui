import { useState, useMemo } from 'react'
import primitives from '@tokens/color/primitives.json'

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

function Colors() {
  const [activePalette, setActivePalette] = useState<string>('magenta')
  const palettes = useMemo(() => buildPalettes(), [])

  const currentPalette = palettes.find((p) => p.id === activePalette) || palettes[0]

  return (
    <div className="colors-component">
      <div className="colors-carousel">
        <div className="colors-carousel-nav" role="group" aria-label="Palette selector">
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
        </div>
      </div>

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
    </div>
  )
}

export default Colors
