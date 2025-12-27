import { useState } from 'react'
import './photographyContextInsight.css'

const baseUrl = import.meta.env.BASE_URL

type Variant = 'peripheral' | 'asymmetric'

interface PhotographyContextInsightProps {
  variant?: Variant
}

function PhotographyContextInsight({ variant: initialVariant = 'peripheral' }: PhotographyContextInsightProps) {
  const [variant, setVariant] = useState<Variant>(initialVariant)

  return (
    <div className={`photography-context-insight photography-context-insight--${variant}`}>
      <div className="photography-context-header">
        <div className="photography-context-header-top">
          <h2 className="photography-context-headline">Photography is context, not content.</h2>
          <div className="photography-context-variant-toggle">
            <button
              className={`photography-context-variant-btn ${variant === 'peripheral' ? 'photography-context-variant-btn--active' : ''}`}
              onClick={() => setVariant('peripheral')}
              aria-pressed={variant === 'peripheral'}
            >
              A
            </button>
            <button
              className={`photography-context-variant-btn ${variant === 'asymmetric' ? 'photography-context-variant-btn--active' : ''}`}
              onClick={() => setVariant('asymmetric')}
              aria-pressed={variant === 'asymmetric'}
            >
              B
            </button>
          </div>
        </div>
        <p className="photography-context-body">
          It shapes layout and rhythm without competing for hierarchy.
        </p>
        <p className="photography-context-supporting">
          Cropped, muted, and spatially constrained.
        </p>
      </div>

      <div className="photography-context-content">
        {variant === 'peripheral' ? (
          <PeripheralVariant />
        ) : (
          <AsymmetricVariant />
        )}
      </div>
    </div>
  )
}

// Variant A: Peripheral Context Strip
// Images positioned at edges, text remains dominant
function PeripheralVariant() {
  return (
    <div className="photography-context-variant photography-context-variant--peripheral">
      <div className="photography-context-image photography-context-image--left">
        <img
          src={`${baseUrl}assets/magnific/magnific-photo-01_1x1_master.jpeg`}
          alt=""
          className="photography-context-img"
        />
      </div>

      <div className="photography-context-text-block">
        <p>
          Photography informs spatial decisions without demanding attention.
          It appears at the periphery, supporting the narrative structure.
        </p>
        <p>
          Images are cropped and positioned to create rhythm, not to become focal points.
          They suggest context rather than display content.
        </p>
      </div>

      <div className="photography-context-image photography-context-image--right">
        <img
          src={`${baseUrl}assets/magnific/magnific-photo-02_2x3_master.jpeg`}
          alt=""
          className="photography-context-img"
        />
      </div>

      <div className="photography-context-text-block">
        <p>
          The layout uses photography as structural material.
          It shapes white space and guides the eye without competing with typography.
        </p>
      </div>

      <div className="photography-context-image photography-context-image--left">
        <img
          src={`${baseUrl}assets/magnific/magnific-photo-03_3x2_master.jpeg`}
          alt=""
          className="photography-context-img"
        />
      </div>
    </div>
  )
}

// Variant B: Asymmetric Background Planes
// Muted background plane with small counter-image
function AsymmetricVariant() {
  return (
    <div className="photography-context-variant photography-context-variant--asymmetric">
      <div className="photography-context-plane photography-context-plane--background">
        <img
          src={`${baseUrl}assets/magnific/magnific-photo-02_1x1_master.jpeg`}
          alt=""
          className="photography-context-img photography-context-img--muted"
        />
      </div>

      <div className="photography-context-text-block photography-context-text-block--overlay">
        <p>
          Photography creates depth through layering.
          A muted background plane establishes atmosphere without drawing focus.
        </p>
        <p>
          Text remains primary. Images provide context through subtle presence.
        </p>
      </div>

      <div className="photography-context-plane photography-context-plane--counter">
        <img
          src={`${baseUrl}assets/magnific/magnific-photo-03_3x2_master.jpeg`}
          alt=""
          className="photography-context-img photography-context-img--small"
        />
      </div>

      <div className="photography-context-text-block">
        <p>
          A small counter-image balances the composition.
          It adds visual interest without disrupting the reading flow.
        </p>
        <p>
          The asymmetric layout reflects how photography appears in real contexts:
          present but not dominant, supporting but not competing.
        </p>
      </div>

      <div className="photography-context-pattern">
        <img
          src={`${baseUrl}assets/magnific/magnific-photo-01_1x1_master.jpeg`}
          alt=""
          className="photography-context-pattern-img"
        />
      </div>
    </div>
  )
}

export default PhotographyContextInsight

