# Post ID System

## Overview

A consistent, maintainable post ID system that works seamlessly with both Notion and code.

## Format

```
post-{number}-{slug}
```

### Components

1. **Prefix** (required): `post` - generic prefix, type-independent
2. **Number** (required): Zero-padded 2-3 digit number (`01`, `001`, etc.)
3. **Slug** (required): Kebab-case descriptive slug (3-4 key words)

**Why no type?** The type can change in Notion without breaking the ID. The ID is a stable identifier that doesn't depend on post metadata.

## Examples

```
post-01-design-systems-dont-fail-figma
post-02-consistency-is-not-design-goal
post-07-career-systems-not-speed
post-10-ux-explanation-system-failure
post-001-frontend-best-practices
```

## Rules

### ✅ DO
- Use all lowercase
- Use hyphens as separators
- Include descriptive slug (3-4 words max)
- Zero-pad numbers (2-3 digits)
- Keep it URL-safe and code-friendly

### ❌ DON'T
- Use spaces or underscores
- Use special characters
- Make slugs too long (> 4 words)
- Skip the number
- Use inconsistent formatting

## Notion Integration

### Storing in Notion

Add a **"Post ID"** text property to your Posts database:

1. Property name: `Post ID` or `postId`
2. Type: `Text`
3. Format: Auto-generated or manually set

### Generating from Notion

When syncing from Notion, use the `generatePostIdFromNotion()` utility:

```typescript
import { generatePostIdFromNotion } from '../post/utils/postId'

const postId = generatePostIdFromNotion({
  type: 'single-quote',        // From Notion "Type" field
  series: 'System Invariant',   // From Notion "Series" field
  number: '01',                 // From Notion or auto-increment
  title: 'If your UX depends...', // From Notion "Name" field
  category: 'quote'            // Optional override
})
```

### Mapping Notion Fields

| Notion Field | Maps To | Example |
|-------------|---------|---------|
| `Name` | `slug` | `"If your UX depends..."` → `ux-depends-explanation` |
| Custom `Number` or `POST X` | `number` | `01`, `02`, etc. |
| `Type` | **Not used in ID** | Type can change without affecting ID |
| `Series` | **Not used in ID** | Series can change without affecting ID |

## Migration Guide

### Current IDs → New Format

```typescript
// Old
'post-07-career-systems-not-speed'
'FE-SCALE-001'

// New
'single-07-career-systems-not-speed'
'carousel-fe-scale-001-frontend-best-practices'
```

### Migration Utility

```typescript
import { generatePostId, createSlug } from '../post/utils/postId'

// Migrate existing post
const oldId = 'post-07-career-systems-not-speed'
const newId = generatePostId({
  type: 'single',
  number: '07',
  slug: 'career-systems-not-speed' // Already in correct format
})
```

## Benefits

1. **Stable**: ID doesn't change when post type changes
2. **Human-readable**: Easy to understand at a glance
3. **Sortable**: Numbers allow chronological ordering
4. **Notion-friendly**: Works as text property
5. **URL-safe**: No encoding needed
6. **Code-friendly**: Valid identifier in all contexts
7. **Maintainable**: Consistent pattern across all posts
8. **Type-independent**: Post type can evolve without breaking references

## Usage in Code

```typescript
import { generatePostId, parsePostId, isValidPostId } from '../post/utils/postId'

// Generate
const id = generatePostId({
  number: '10',
  slug: 'ux-explanation-system-failure'
})
// → 'post-10-ux-explanation-system-failure'

// Parse
const parts = parsePostId('post-10-ux-explanation-system-failure')
// → { number: '10', slug: 'ux-explanation-system-failure' }

// Validate
isValidPostId('post-07-career-systems') // → true
isValidPostId('invalid-id') // → false
```
