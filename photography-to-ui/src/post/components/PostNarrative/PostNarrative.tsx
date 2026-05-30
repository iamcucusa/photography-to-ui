import { useState, useRef, useEffect, useCallback } from 'react'
import './PostNarrative.css'

export type PostNarrativeProps = {
  narrative: string
  className?: string
}

/**
 * Reusable narrative component with "...more" functionality
 * Optimized for performance and ready for Notion content integration
 */
export function PostNarrative({ narrative, className = '' }: PostNarrativeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMoreButton, setShowMoreButton] = useState(false)
  const narrativeRef = useRef<HTMLParagraphElement>(null)
  const narrativeContainerRef = useRef<HTMLDivElement>(null)

  // Memoize toggle handler to prevent unnecessary re-renders
  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  // Check if narrative needs truncation
  // Only runs when narrative changes, not on every render
  useEffect(() => {
    if (!narrative || !narrativeRef.current) {
      setShowMoreButton(false)
      return
    }

    // Small delay to ensure DOM is ready (important for Notion dynamic content)
    const timeoutId = setTimeout(() => {
      if (narrativeRef.current) {
        const lineHeight = parseFloat(getComputedStyle(narrativeRef.current).lineHeight)
        const maxHeight = lineHeight * 3 // 3 lines
        const actualHeight = narrativeRef.current.scrollHeight
        setShowMoreButton(actualHeight > maxHeight)
      }
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [narrative])

  // Early return for empty narrative (after hooks to comply with React rules)
  if (!narrative) {
    return null
  }

  return (
    <section className={`post-narrative ${className}`} aria-label="Post narrative">
      <div className="post-narrative-container" ref={narrativeContainerRef}>
        <div className="post-narrative-wrapper">
          <p
            ref={narrativeRef}
            className={`post-narrative-text ${!isExpanded ? 'post-narrative-text--truncated' : ''}`}
          >
            {narrative}
          </p>
          {showMoreButton && !isExpanded && (
            <button
              type="button"
              className="post-narrative-toggle"
              onClick={handleToggle}
              aria-expanded={isExpanded}
              aria-label="Show more narrative content"
            >
              ...more
            </button>
          )}
        </div>
        {showMoreButton && isExpanded && (
          <button
            type="button"
            className="post-narrative-toggle"
            onClick={handleToggle}
            aria-expanded={isExpanded}
            aria-label="Show less narrative content"
          >
            See less
          </button>
        )}
      </div>
    </section>
  )
}
