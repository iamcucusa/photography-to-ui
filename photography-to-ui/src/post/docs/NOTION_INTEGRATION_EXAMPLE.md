# Notion Integration Example

## Setting Up Post ID in Notion

### Step 1: Add Post ID Property

In your Notion Posts database, add a new property:

- **Property Name**: `Post ID` (or `postId`)
- **Type**: `Text`
- **Description**: Auto-generated post identifier

### Step 2: Manual Entry or Formula

You can either:

**Option A: Manual Entry**

- Manually enter IDs following the format: `{type}-{category?}-{number}-{slug}`

**Option B: Formula (if Notion supports)**

- Use a formula to auto-generate from other fields

**Option C: Code Generation**

- Use the utility functions to generate IDs when syncing

## Example: Syncing a Post from Notion

```typescript
import { generatePostIdFromNotion } from '../post/utils/postId'
import type { PostEntity } from '../post/model'

async function syncPostFromNotion(notionPage: NotionPage): Promise<PostEntity> {
  // Extract data from Notion page properties
  const type = notionPage.properties.Type?.select?.name || 'text'
  const series = notionPage.properties.Series?.select?.name
  const title = notionPage.properties.Name?.title?.[0]?.plain_text || ''
  const narrative = notionPage.properties.Narrative?.rich_text?.[0]?.plain_text || ''
  const tags = notionPage.properties['My Keywords']?.relation?.map((r) => r.name) || []
  const status = notionPage.properties.status?.status?.name || 'draft'

  // Generate or use existing Post ID
  const postId =
    notionPage.properties['Post ID']?.rich_text?.[0]?.plain_text ||
    generatePostIdFromNotion({
      type,
      series,
      number: notionPage.properties.Number?.number || '01',
      title,
      category: type.includes('quote') ? 'quote' : undefined,
    })

  // Map Notion type to our type
  const postType: 'single' | 'carousel' =
    type.includes('carousel') || type.includes('carrousel') ? 'carousel' : 'single'

  // Build post entity
  const post: PostEntity = {
    id: postId,
    type: postType,
    title,
    topic: series?.toLowerCase().replace(/\s+/g, '-') || 'general',
    tags: tags.map((tag) => tag.replace(/^#/, '')), // Remove # if present
    createdAt: notionPage.created_time || new Date().toISOString(),
    linkedinFormat: notionPage.properties['LinkedIn Format']?.select?.name || 'landscape',
    narrative,
    content: buildContentFromNotion(notionPage),
  }

  return post
}
```

## Notion Database Schema Recommendation

| Property          | Type     | Purpose           | Example                                         |
| ----------------- | -------- | ----------------- | ----------------------------------------------- |
| `Name`            | Title    | Post title        | "If your UX depends..."                         |
| `Post ID`         | Text     | Unique identifier | `single-quote-10-ux-explanation-system-failure` |
| `Type`            | Select   | Post type         | `single-quote`, `carousel`, etc.                |
| `Series`          | Select   | Series name       | `System Invariant`                              |
| `Number`          | Number   | Sequence number   | `01`, `02`, `03`                                |
| `Narrative`       | Text     | Post narrative    | Full narrative text                             |
| `My Keywords`     | Relation | Tags/hashtags     | Links to Keywords database                      |
| `status`          | Status   | Post status       | `draft`, `published`                            |
| `LinkedIn Format` | Select   | Export format     | `landscape`, `portrait`, `square`               |

## Benefits of This System

1. **Single Source of Truth**: Post ID stored in Notion, synced to code
2. **Human-Readable**: Easy to identify posts at a glance
3. **Sortable**: Numbers enable chronological ordering
4. **Type-Safe**: Type prefix allows filtering by post type
5. **Maintainable**: Consistent pattern across all posts
6. **URL-Safe**: Works in URLs without encoding
7. **Code-Friendly**: Valid identifier in all programming contexts
