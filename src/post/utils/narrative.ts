/**
 * Builds narrative text with smart title handling
 * If narrative already starts with title, use as-is; otherwise prepend title
 * 
 * This utility is designed to work with Notion content where:
 * - Title might be in a separate field
 * - Narrative might already include the title
 * - Both patterns should be supported
 */
export function buildNarrativeText(title?: string, narrative?: string): string {
  if (!narrative && !title) return ''
  if (!narrative) return title || ''
  if (!title) return narrative
  
  // Normalize both title and narrative for comparison
  // Remove extra whitespace, normalize line breaks, and compare
  const normalize = (text: string): string => {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace all whitespace with single space
      .toLowerCase()
  }
  
  const titleNormalized = normalize(title)
  const narrativeNormalized = normalize(narrative)
  
  // Check if narrative already starts with title (normalized comparison)
  const narrativeStartsWithTitle = narrativeNormalized.startsWith(titleNormalized)
  
  if (narrativeStartsWithTitle) {
    // Narrative already includes title, use as-is
    return narrative
  } else {
    // Prepend title to narrative
    return `${title}\n\n${narrative}`
  }
}

