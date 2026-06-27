import { useState } from 'react'
import type React from 'react'
import type { PostEntity, CarouselSlide } from '../../model'
import { PostNarrative } from '../PostNarrative/PostNarrative'
import { PostTags } from '../PostTags/PostTags'
import { Picture } from '../../../components/Picture'
import { imageSetCss } from '../../../assets'
import './CarouselPost.css'

export type CarouselPostProps = {
  post: PostEntity
  onOpen?: (postId: string) => void
}

export function CarouselPost({ post }: CarouselPostProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  if (post.type !== 'carousel') {
    return null
  }

  const content = post.content as { aspect: '4:5' | '1:1'; slides: CarouselSlide[] }
  const slides = content.slides
  const currentSlide = slides[currentSlideIndex]

  const handleSlideClick = () => {
    const nextIndex = currentSlideIndex + 1
    if (nextIndex >= slides.length) {
      // Loop back to first slide
      setCurrentSlideIndex(0)
    } else {
      setCurrentSlideIndex(nextIndex)
    }
  }

  const handleDotClick = (index: number) => {
    setCurrentSlideIndex(index)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Arrow key navigation for carousel
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prevIndex = currentSlideIndex - 1
      setCurrentSlideIndex(prevIndex < 0 ? slides.length - 1 : prevIndex)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      const nextIndex = currentSlideIndex + 1
      setCurrentSlideIndex(nextIndex >= slides.length ? 0 : nextIndex)
    }
  }

  /* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
  return (
    <div
      className="carousel-post"
      role="region"
      aria-label={`Carousel: ${post.title}`}
      aria-roledescription="carousel"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {post.narrative && (
        <PostNarrative narrative={post.narrative} className="carousel-post-narrative" />
      )}
      <PostTags tags={post.tags} className="carousel-post-tags" tagClassName="carousel-post-tag" />
      <div className="carousel-post-slides">
        <div className="carousel-slide-wrapper">
          <CarouselSlide
            slide={currentSlide}
            aspect={content.aspect}
            slideIndex={currentSlideIndex}
            totalSlides={slides.length}
            onNavigate={handleSlideClick}
          />
          <div className="carousel-post-indicator" aria-hidden="true">
            {currentSlideIndex + 1} / {slides.length}
          </div>
        </div>
      </div>
      <div className="carousel-post-dots" role="tablist" aria-label="Slide navigation">
        {slides.map((slide, index) => {
          const isActive = index === currentSlideIndex
          return (
            <button
              key={slide.id}
              type="button"
              className={`carousel-post-dot ${isActive ? 'carousel-post-dot--active' : ''}`}
              onClick={() => handleDotClick(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleDotClick(index)
                }
              }}
              aria-label={`Go to slide ${index + 1}: ${slide.headline}`}
              aria-current={isActive ? 'true' : undefined}
              role="tab"
              aria-selected={isActive}
            >
              <span className="carousel-post-dot-indicator" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

type CarouselSlideProps = {
  slide: CarouselSlide
  aspect: '4:5' | '1:1'
  slideIndex: number
  totalSlides: number
  onNavigate: () => void
}

/**
 * Renders text with emphasized words highlighted
 */
function renderTextWithEmphasis(text: string, emphasizedWords?: string[]): React.ReactNode {
  if (!emphasizedWords || emphasizedWords.length === 0) {
    return text
  }

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let key = 0

  // Find all matches and their positions
  const matches: Array<{ word: string; index: number }> = []
  emphasizedWords.forEach((word) => {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    let match
    while ((match = regex.exec(text)) !== null) {
      matches.push({ word: match[0], index: match.index })
    }
  })

  // Sort by index
  matches.sort((a, b) => a.index - b.index)

  // Build the parts array
  matches.forEach((match) => {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>)
    }
    // Add the emphasized word
    parts.push(
      <span key={key++} className="carousel-slide-emphasized">
        {match.word}
      </span>,
    )
    lastIndex = match.index + match.word.length
  })

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>)
  }

  return parts.length > 0 ? parts : text
}

function CarouselSlide({ slide, aspect, slideIndex, totalSlides, onNavigate }: CarouselSlideProps) {
  const aspectRatio = aspect === '4:5' ? '4/5' : '1/1'
  const isLastSlide = slideIndex === totalSlides - 1
  const isTextOnly = !slide.image

  const handleCtaClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onNavigate()
  }

  const handleCtaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      onNavigate()
    }
  }

  return (
    <section
      className={`carousel-slide ${isTextOnly ? 'carousel-slide--text-only' : ''} ${slide.kind ? `carousel-slide--${slide.kind}` : ''}`}
      data-slide-id={slide.id}
      style={{ aspectRatio }}
    >
      {slide.image && (
        <div className={`carousel-slide-image carousel-slide-image--${slide.image.mode}`}>
          <Picture
            src={slide.image.src}
            alt={slide.image.alt}
            sizes="(min-width: 768px) 440px, 100vw"
          />
        </div>
      )}
      <div
        className="carousel-slide-content"
        style={
          slide.image?.mode === 'full'
            ? ({
                '--carousel-slide-full-bg-image':
                  imageSetCss(slide.image.src) ?? `url('${slide.image.src}')`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {slide.eyebrow && <div className="carousel-slide-eyebrow">{slide.eyebrow}</div>}
        {slide.subhead && (
          <p className="carousel-slide-subhead">
            {slide.subhead
              .split(/([.!?])\s*/)
              .filter(Boolean)
              .map((part, index, array) => {
                const isPunctuation = /^[.!?]$/.test(part)
                const nextPart = array[index + 1]
                const shouldBreak = isPunctuation && nextPart && !/^[.!?]$/.test(nextPart)
                return (
                  <span key={index}>
                    {part}
                    {shouldBreak && <br />}
                  </span>
                )
              })}
          </p>
        )}
        {slide.headline && (
          <h4 className="carousel-slide-headline">
            {renderTextWithEmphasis(slide.headline, slide.emphasizedWords)}
          </h4>
        )}
        <div className="carousel-slide-actions">
          {slide.number && <div className="carousel-slide-number">{slide.number}</div>}
          <button
            type="button"
            className="carousel-slide-cta"
            onClick={handleCtaClick}
            onKeyDown={handleCtaKeyDown}
            aria-label={isLastSlide ? 'Start over from the beginning' : 'Navigate to next slide'}
          >
            {isLastSlide ? (
              <>
                <span className="carousel-slide-cta-label">Start over</span>
                <span className="carousel-slide-cta-arrow">→</span>
              </>
            ) : (
              <span className="carousel-slide-cta-arrow">→</span>
            )}
          </button>
        </div>
        {slide.footer && (
          <div className="carousel-slide-footer">
            {slide.footer.handle && (
              <span className="carousel-slide-handle">{slide.footer.handle}</span>
            )}
            {slide.footer.attribution && (
              <span className="carousel-slide-attribution">{slide.footer.attribution}</span>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
