/**
 * Utility functions for post processing
 * Designed to work with Notion database content
 */

export { buildNarrativeText } from './narrative'

/**
 * Type guard to check if content is SinglePostContent
 * Useful for Notion integration where content structure may vary
 */
export function isSinglePostContent(
  content: unknown
): content is import('../model').SinglePostContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    !('slides' in content) &&
    !('aspect' in content)
  )
}

/**
 * Type guard to check if content is CarouselPostContent
 */
export function isCarouselPostContent(
  content: unknown
): content is import('../model').CarouselPostContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    'slides' in content &&
    Array.isArray((content as any).slides)
  )
}

