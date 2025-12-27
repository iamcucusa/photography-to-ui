import { useState } from 'react'

// Helper function to convert hex to RGB
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

// Helper function to convert RGB to HSL
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

const palettes: Palette[] = [
  {
    id: 'magenta',
    name: 'Magenta',
    colors: [
      { name: 'Magenta 1', hex: '#FF0F8F', rgb: hexToRgb('#FF0F8F'), hsl: rgbToHsl(255, 15, 143) },
      { name: 'Magenta 2', hex: '#D60076', rgb: hexToRgb('#D60076'), hsl: rgbToHsl(214, 0, 118) },
      { name: 'Magenta 3', hex: '#B30062', rgb: hexToRgb('#B30062'), hsl: rgbToHsl(179, 0, 98) },
      { name: 'Magenta 4', hex: '#FF4FB1', rgb: hexToRgb('#FF4FB1'), hsl: rgbToHsl(255, 79, 177) },
      { name: 'Magenta 5', hex: '#FFE0F1', rgb: hexToRgb('#FFE0F1'), hsl: rgbToHsl(255, 224, 241) },
    ],
  },
  {
    id: 'sky',
    name: 'Sky',
    colors: [
      { name: 'Sky 1', hex: '#0D1B2A', rgb: hexToRgb('#0D1B2A'), hsl: rgbToHsl(13, 27, 42) },
      { name: 'Sky 2', hex: '#3A506B', rgb: hexToRgb('#3A506B'), hsl: rgbToHsl(58, 80, 107) },
      { name: 'Sky 3', hex: '#5C7A96', rgb: hexToRgb('#5C7A96'), hsl: rgbToHsl(92, 122, 150) },
      { name: 'Sky 4', hex: '#9BB5C9', rgb: hexToRgb('#9BB5C9'), hsl: rgbToHsl(155, 181, 201) },
      { name: 'Sky 5', hex: '#D6E4EE', rgb: hexToRgb('#D6E4EE'), hsl: rgbToHsl(214, 228, 238) },
    ],
  },
  {
    id: 'frost',
    name: 'Frost',
    colors: [
      { name: 'Frost 1', hex: '#1C1C1F', rgb: hexToRgb('#1C1C1F'), hsl: rgbToHsl(28, 28, 31) },
      { name: 'Frost 2', hex: '#6B6B73', rgb: hexToRgb('#6B6B73'), hsl: rgbToHsl(107, 107, 115) },
      { name: 'Frost 3', hex: '#B0B0B8', rgb: hexToRgb('#B0B0B8'), hsl: rgbToHsl(176, 176, 184) },
      { name: 'Frost 4', hex: '#DFDFE6', rgb: hexToRgb('#DFDFE6'), hsl: rgbToHsl(223, 223, 230) },
      { name: 'Frost 5', hex: '#F7F7FB', rgb: hexToRgb('#F7F7FB'), hsl: rgbToHsl(247, 247, 251) },
    ],
  },
  {
    id: 'sand',
    name: 'Sand',
    colors: [
      { name: 'Sand 1', hex: '#5E4630', rgb: hexToRgb('#5E4630'), hsl: rgbToHsl(94, 70, 48) },
      { name: 'Sand 2', hex: '#9E7B5C', rgb: hexToRgb('#9E7B5C'), hsl: rgbToHsl(158, 123, 92) },
      { name: 'Sand 3', hex: '#B28A67', rgb: hexToRgb('#B28A67'), hsl: rgbToHsl(178, 138, 103) },
      { name: 'Sand 4', hex: '#E8D8C9', rgb: hexToRgb('#E8D8C9'), hsl: rgbToHsl(232, 216, 201) },
      { name: 'Sand 5', hex: '#F5EFEA', rgb: hexToRgb('#F5EFEA'), hsl: rgbToHsl(245, 239, 234) },
    ],
  },
  {
    id: 'ink',
    name: 'Ink',
    colors: [
      { name: 'Ink 1', hex: '#1A1A1A', rgb: hexToRgb('#1A1A1A'), hsl: rgbToHsl(26, 26, 26) },
      { name: 'Ink 2', hex: '#4A4A4A', rgb: hexToRgb('#4A4A4A'), hsl: rgbToHsl(74, 74, 74) },
      { name: 'Ink 3', hex: '#7A7A7A', rgb: hexToRgb('#7A7A7A'), hsl: rgbToHsl(122, 122, 122) },
      { name: 'Ink 4', hex: '#B3B3B3', rgb: hexToRgb('#B3B3B3'), hsl: rgbToHsl(179, 179, 179) },
      { name: 'Ink 5', hex: '#E6E6E6', rgb: hexToRgb('#E6E6E6'), hsl: rgbToHsl(230, 230, 230) },
    ],
  },
]

function Colors() {
  const [activePalette, setActivePalette] = useState<string>('magenta')

  const currentPalette = palettes.find((p) => p.id === activePalette) || palettes[0]

  return (
    <div className="colors-component">
      <div className="colors-carousel">
        <div className="colors-carousel-nav">
          {palettes.map((palette) => (
            <button
              key={palette.id}
              className={`colors-palette-button ${activePalette === palette.id ? 'colors-palette-button-active' : ''}`}
              onClick={() => setActivePalette(palette.id)}
            >
              {palette.name}
            </button>
          ))}
        </div>
      </div>

      <div className="colors-palette-display">
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

