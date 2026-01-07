import type { LinkedInFormat } from '../../model'
import './PostQuote.css'

export type PostQuoteProps = {
  quote: string
  author: string
  highlightedPhrase?: string | string[]
  className?: string
  linkedinFormat?: LinkedInFormat
  category?: string
  number?: string
}

/**
 * Quote component for posts
 * Follows design system: neutral background, negative space, code-like typography
 * Engineering-adjacent aesthetic with subtle grid and system rhythm
 * Optimized for LinkedIn image export (landscape: 1.91:1, portrait: 4:5, square: 1:1)
 */
export function PostQuote({ quote, author, highlightedPhrase, className = '', linkedinFormat = 'landscape', category, number }: PostQuoteProps) {
  // Get aspect ratio for LinkedIn export
  const getAspectRatio = (format: LinkedInFormat): string => {
    const aspectMap: Record<LinkedInFormat, string> = {
      square: '1 / 1',
      portrait: '4 / 5',
      landscape: '191 / 100',
    }
    return aspectMap[format]
  }

  const aspectRatio = getAspectRatio(linkedinFormat)
  // Split quote to highlight phrase(s) if provided
  const renderQuote = () => {
    if (!highlightedPhrase) {
      return quote
    }

    // Support both single string and array of phrases
    const phrases = Array.isArray(highlightedPhrase) ? highlightedPhrase : [highlightedPhrase]
    
    // Create regex pattern for all phrases
    const escapedPhrases = phrases.map(phrase => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const pattern = `(${escapedPhrases.join('|')})`
    const regex = new RegExp(pattern, 'gi')
    
    const parts = quote.split(regex)
    return parts.map((part, index) => {
      const isHighlighted = phrases.some(phrase => 
        part.toLowerCase() === phrase.toLowerCase()
      )
      return isHighlighted ? (
        <span key={index} className="post-quote-highlighted">{part}</span>
      ) : (
        <span key={index}>{part}</span>
      )
    })
  }

  return (
    <blockquote 
      className={`post-quote ${className}`}
      style={{ aspectRatio }}
    >
      <div className="post-quote-grid" aria-hidden="true" />
      <div className="post-quote-content">
        <p className="post-quote-text">
          {renderQuote()}
        </p>
        <footer className="post-quote-author">
          {category && number && (
            <span className="post-quote-meta">
              {category} · {number}
            </span>
          )}
          <cite>{author}</cite>
        </footer>
      </div>
    </blockquote>
  )
}

