import { useState, useMemo } from 'react'
import { Picture } from './Picture'

const baseUrl = import.meta.env.BASE_URL
// Single master; the responsive <Picture> serves the right width for the box.
// Replaces the old hand-made _120px…_400px variants (one mechanism, not two).
const previewImage = `${baseUrl}assets/magnific/magnific-photo-01_3x2_1_master.jpeg`

const typeScale = [
  { name: 'xs', token: '--text-xs', label: 'XS' },
  { name: 'sm', token: '--text-sm', label: 'SM' },
  { name: 'md', token: '--text-md', label: 'MD' },
  { name: 'lg', token: '--text-lg', label: 'LG' },
  { name: 'xl', token: '--text-xl', label: 'XL' },
  { name: 'xxl', token: '--text-xxl', label: 'XXL' },
  { name: 'display-xl', token: '--display-xl', label: 'Display XL' },
]

const phrase = 'A beautiful face that codes and design.'

const getImageWidth = (selectedSize: string): string => {
  const sizeMap: Record<string, string> = {
    xs: '120px',
    sm: '150px',
    md: '200px',
    lg: '250px',
    xl: '300px',
    xxl: '350px',
    'display-xl': '400px',
  }
  return sizeMap[selectedSize] || '200px'
}

function Typography() {
  const [selectedSize, setSelectedSize] = useState<string>('md')

  // Memoize calculations to prevent unnecessary recalculations
  const selectedScale = useMemo(
    () => typeScale.find((scale) => scale.name === selectedSize),
    [selectedSize],
  )
  const imageWidth = useMemo(() => getImageWidth(selectedSize), [selectedSize])

  return (
    <div className="typography-component">
      <div className="typography-scale-selector" role="group" aria-label="Type scale selector">
        {typeScale.map((scale) => (
          <button
            key={scale.name}
            className={`typography-size-button ${selectedSize === scale.name ? 'typography-size-button-active' : ''}`}
            onClick={() => setSelectedSize(scale.name)}
            aria-pressed={selectedSize === scale.name}
            aria-label={`Select ${scale.label} type size`}
          >
            {scale.label}
          </button>
        ))}
      </div>
      <div className="typography-preview" aria-live="polite">
        <div className="typography-preview-content">
          <div className="typography-preview-group">
            <p
              className="typography-preview-text"
              style={{
                fontSize: `var(${selectedScale?.token})`,
              }}
            >
              {phrase}
            </p>
            <div
              className="typography-preview-image"
              style={{
                width: imageWidth,
                maxWidth: '100%',
              }}
            >
              <Picture src={previewImage} alt="" sizes={imageWidth} />
            </div>
          </div>
        </div>
        <div className="typography-preview-info">
          <span className="typography-token-name">{selectedScale?.token}</span>
        </div>
      </div>
    </div>
  )
}

export default Typography
