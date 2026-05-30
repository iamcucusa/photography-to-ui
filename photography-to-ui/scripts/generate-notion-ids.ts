/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Helper to generate Post IDs from Notion page data
 */

import { generatePostIdFromNotion } from '../src/post/utils/postId'

export function generateIdFromNotionPage(page: any): string {
  const props = page.properties || {}
  
  // Extract title - prefer Base (quote), otherwise Name
  const base = props.Base?.rich_text?.[0]?.plain_text || props.Base || ''
  const name = props.Name?.title?.[0]?.plain_text || props.Name || ''
  
  // Clean up markdown from name (remove **POST 10** formatting)
  const cleanName = name.replace(/\*\*/g, '').replace(/POST\s+/i, '').trim()
  
  // Use Base if available (usually the quote/title), otherwise use Name
  const title = base || cleanName || 'untitled'
  
  // Extract number from Name (POST 3, POST 7, etc.)
  const numberMatch = name.match(/POST\s+(\d+)/i) || cleanName.match(/^(\d+)/)
  const number = numberMatch ? numberMatch[1].padStart(2, '0') : '01'
  
  // Extract type
  const type = props.Type?.select?.name || props.Type || 'text'
  
  // Extract series
  const series = props.Series?.select?.name || props.Series
  
  // Generate ID
  return generatePostIdFromNotion({
    type,
    series,
    number,
    title: title.replace(/[""]/g, ''), // Remove quotes
    category: undefined, // Will be auto-determined
  })
}
