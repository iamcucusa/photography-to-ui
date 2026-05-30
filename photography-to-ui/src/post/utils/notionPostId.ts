/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Utilities for updating Post IDs in Notion
 *
 * This module provides functions to:
 * - Generate post IDs from Notion page data
 * - Update Notion pages with generated post IDs
 * - Sync post IDs between Notion and code
 */

import { generatePostIdFromNotion } from './postId'

/**
 * Extracts post data from a Notion page for ID generation
 */
export function extractPostDataFromNotion(notionPage: { properties?: Record<string, any> }): {
  type: string
  series?: string
  number?: string | number
  title: string
  category?: string
} {
  const props = notionPage.properties || {}

  // Extract title from Name property
  const nameProp = props.Name || props.name || {}
  const title = nameProp.title?.[0]?.plain_text || nameProp.rich_text?.[0]?.plain_text || ''

  // Extract type
  const typeProp = props.Type || props.type || {}
  const type = typeProp.select?.name || typeProp.rich_text?.[0]?.plain_text || 'text'

  // Extract series
  const seriesProp = props.Series || props.series || {}
  const series = seriesProp.select?.name || seriesProp.rich_text?.[0]?.plain_text

  // Extract number (could be in Base, Number, or custom field)
  const numberProp = props.Number || props.number || props.Base || props.base || {}
  const number =
    numberProp.number || numberProp.rich_text?.[0]?.plain_text || numberProp.title?.[0]?.plain_text

  // Determine category from type
  let category: string | undefined = undefined
  if (type.includes('quote')) category = 'quote'
  else if (type.includes('image')) category = 'image'
  else if (type.includes('text')) category = 'text'

  return {
    type,
    series,
    number,
    title,
    category,
  }
}

/**
 * Generates a post ID from a Notion page
 */
export function generatePostIdFromNotionPage(notionPage: {
  properties?: Record<string, any>
}): string {
  const data = extractPostDataFromNotion(notionPage)
  return generatePostIdFromNotion(data)
}

/**
 * Creates a mapping of old IDs to new IDs for migration
 */
export function createIdMigrationMap(
  posts: Array<{ id: string; title: string; type?: string; topic?: string }>,
): Map<string, string> {
  const migrationMap = new Map<string, string>()

  posts.forEach((post, index) => {
    const newId = generatePostIdFromNotion({
      number: String(index + 1).padStart(2, '0'),
      title: post.title,
    })
    migrationMap.set(post.id, newId)
  })

  return migrationMap
}
