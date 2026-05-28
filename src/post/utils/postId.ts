/**
 * Post ID System
 * 
 * Format: post-{number}-{slug}
 * 
 * Examples:
 * - post-01-design-systems-dont-fail-figma
 * - post-07-career-systems-not-speed
 * - post-10-ux-explanation-system-failure
 * - post-001-frontend-best-practices
 * 
 * Rules:
 * - All lowercase
 * - Hyphens as separators
 * - Generic "post" prefix (type-independent)
 * - Sequential number (zero-padded to 2-3 digits)
 * - Descriptive slug (kebab-case, max 3-4 words)
 * - URL-safe and code-friendly
 * - Type can change without affecting ID
 */

export type PostIdParts = {
  number: string
  slug: string
}

/**
 * Generates a post ID from parts
 */
export function generatePostId(parts: PostIdParts): string {
  const { number, slug } = parts
  return `post-${number}-${slug}`
}

/**
 * Parses a post ID into its parts
 */
export function parsePostId(postId: string): PostIdParts | null {
  // Format: post-{number}-{slug}
  if (!postId.startsWith('post-')) return null
  
  const parts = postId.substring(5).split('-') // Remove "post-" prefix
  
  if (parts.length < 2) return null
  
  // First part should be the number
  const number = parts[0]
  if (!/^\d{2,3}$/.test(number)) return null
  
  // Everything after number is the slug
  const slug = parts.slice(1).join('-')
  
  return {
    number,
    slug,
  }
}

/**
 * Creates a slug from a title or text
 * - Converts to lowercase
 * - Removes special characters
 * - Replaces spaces with hyphens
 * - Limits to 3-4 key words
 */
export function createSlug(text: string, maxWords: number = 4): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Spaces to hyphens
    .split('-')
    .filter(word => word.length > 0)
    .slice(0, maxWords) // Limit words
    .join('-')
}

/**
 * Generates post ID from Notion data
 * Useful when syncing from Notion database
 * 
 * Note: Type is NOT included in the ID to allow type changes without breaking the ID
 */
export function generatePostIdFromNotion(data: {
  type?: string
  series?: string
  number?: string | number
  title: string
  category?: string
}): string {
  const { number, title } = data
  
  // Get number (from Notion or generate from title)
  // Extract number from title if it contains "POST X" or similar
  let postNumber: string
  if (number) {
    postNumber = String(number).padStart(2, '0')
  } else {
    // Try to extract from title (e.g., "POST 10" -> "10")
    const numberMatch = title.match(/POST\s+(\d+)/i) || title.match(/^(\d+)/)
    postNumber = numberMatch ? numberMatch[1].padStart(2, '0') : '01'
  }
  
  // Create slug from title (remove quotes, POST X, etc.)
  const cleanTitle = title
    .replace(/^[""]|[""]$/g, '') // Remove surrounding quotes
    .replace(/POST\s+\d+/i, '') // Remove "POST X"
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
  
  const slug = createSlug(cleanTitle || title, 4)
  
  return generatePostId({
    number: postNumber,
    slug,
  })
}

/**
 * Validates a post ID format
 */
export function isValidPostId(postId: string): boolean {
  return parsePostId(postId) !== null
}
