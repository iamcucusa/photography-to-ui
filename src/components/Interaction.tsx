import { useState } from 'react'

const legoImages = [
  {
    id: 'banner',
    legoSrc: '/assets/magnific/magnific-linkedin_banner_bg_lego.png',
    originalSrc: '/assets/magnific/magnific-linkedin_banner_bg.jpeg',
    alt: 'LEGO banner mosaic',
    gridClass: 'interaction-image-banner',
  },
  {
    id: 'photo-3x2',
    legoSrc: '/assets/magnific/magnific-photo-02_3x2_1_master_lego.png',
    originalSrc: '/assets/magnific/magnific-photo-02_3x2_1_master.jpeg',
    alt: 'LEGO 3x2 portrait',
    gridClass: 'interaction-image-3x2',
  },
  {
    id: 'photo-4x5',
    legoSrc: '/assets/magnific/magnific-photo-02_4x5_master_lego.png',
    originalSrc: '/assets/magnific/magnific-photo-02_4x5_master.jpeg',
    alt: 'LEGO 4x5 portrait',
    gridClass: 'interaction-image-4x5',
  },
]

function Interaction() {
  const [revealedImages, setRevealedImages] = useState<Set<string>>(new Set())

  const toggleReveal = (imageId: string) => {
    setRevealedImages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
      } else {
        newSet.add(imageId)
      }
      return newSet
    })
  }

  return (
    <div className="interaction-component">
      <div className="interaction-grid">
        {legoImages.map((image) => {
          const isRevealed = revealedImages.has(image.id)
          return (
            <button
              key={image.id}
              className={`interaction-image-container ${image.gridClass} ${isRevealed ? 'interaction-image-revealed' : ''}`}
              onClick={() => toggleReveal(image.id)}
              aria-label={isRevealed ? 'Hide original image' : 'Reveal original image'}
            >
              <div className="interaction-image-overlay">
                <img
                  src={image.legoSrc}
                  alt={image.alt}
                  className="interaction-image-lego"
                />
                <img
                  src={image.originalSrc}
                  alt={image.alt}
                  className={`interaction-image-original ${isRevealed ? 'interaction-image-visible' : ''}`}
                />
                {!isRevealed && (
                  <div className="interaction-image-hint">
                    <span className="interaction-click-hint">Click</span>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
      <div className="interaction-instruction">
        <p className="interaction-instruction-text">
          {revealedImages.size === 0
            ? 'Click each image to reveal the original photograph.'
            : revealedImages.size < legoImages.length
            ? `Revealed ${revealedImages.size} of ${legoImages.length}.`
            : 'All images revealed. Click again to return to LEGO view.'}
        </p>
      </div>
    </div>
  )
}

export default Interaction

