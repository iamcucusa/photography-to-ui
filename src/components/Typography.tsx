import { useState, useMemo } from 'react'

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

// Pre-sized image sources
const getImageSource = (selectedSize: string): string => {
  const baseUrl = import.meta.env.BASE_URL
  const imageMap: Record<string, string> = {
    'xs': `${baseUrl}assets/magnific/magnific-photo-01_3x2_1_120px.jpg`,
    'sm': `${baseUrl}assets/magnific/magnific-photo-01_3x2_1_150px.jpg`,
    'md': `${baseUrl}assets/magnific/magnific-photo-01_3x2_1_200px.jpg`,
    'lg': `${baseUrl}assets/magnific/magnific-photo-01_3x2_1_250px.jpg`,
    'xl': `${baseUrl}assets/magnific/magnific-photo-01_3x2_1_300px.jpg`,
    'xxl': `${baseUrl}assets/magnific/magnific-photo-01_3x2_1_350px.jpg`,
    'display-xl': `${baseUrl}assets/magnific/magnific-photo-01_3x2_1_400px.jpg`,
  }
  return imageMap[selectedSize] || imageMap['md']
}

const getImageWidth = (selectedSize: string): string => {
  const sizeMap: Record<string, string> = {
    'xs': '120px',
    'sm': '150px',
    'md': '200px',
    'lg': '250px',
    'xl': '300px',
    'xxl': '350px',
    'display-xl': '400px',
  }
  return sizeMap[selectedSize] || '200px'
}

function Typography() {
  const [selectedSize, setSelectedSize] = useState<string>('md')

  // Memoize calculations to prevent unnecessary recalculations
  const selectedScale = useMemo(() => 
    typeScale.find((scale) => scale.name === selectedSize),
    [selectedSize]
  )
  const imageSource = useMemo(() => getImageSource(selectedSize), [selectedSize])
  const imageWidth = useMemo(() => getImageWidth(selectedSize), [selectedSize])

  return (
    <div className="typography-component">
      <div className="typography-scale-selector">
        {typeScale.map((scale) => (
          <button
            key={scale.name}
            className={`typography-size-button ${selectedSize === scale.name ? 'typography-size-button-active' : ''}`}
            onClick={() => setSelectedSize(scale.name)}
          >
            {scale.label}
          </button>
        ))}
      </div>
      <div className="typography-preview">
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
              <img
                src={imageSource}
                alt=""
              />
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

