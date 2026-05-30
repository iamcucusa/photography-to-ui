# How to Update Post IDs in Notion

There are several ways to update Post IDs in your Notion database. Choose the method that works best for your workflow.

## Method 1: Manual Entry (Quick & Simple)

### Step 1: Add "Post ID" Property to Notion

1. Open your **Posts** database in Notion
2. Click **+** to add a new property
3. Name it: `Post ID` (or `postId`)
4. Type: **Text**
5. Click **Done**

### Step 2: Generate IDs Using This Tool

You can use me (the AI assistant) to generate IDs for your posts:

**Just ask me:**
> "Generate post IDs for my Notion posts"

I'll:
1. Fetch your posts from Notion
2. Generate IDs following the format: `{type}-{category?}-{number}-{slug}`
3. Show you the list
4. Update them in Notion for you

### Step 3: Copy-Paste IDs

Once generated, you can:
- Copy the ID I provide
- Paste it into the "Post ID" field in Notion
- Or let me update it directly via the Notion API

---

## Method 2: Automated Update via AI Assistant (Recommended)

I can update your Notion posts directly! Just ask:

> "Update all post IDs in my Notion database"

I will:
1. ✅ Fetch all posts from your Notion database
2. ✅ Generate proper IDs for each post
3. ✅ Update the "Post ID" property in Notion
4. ✅ Show you a summary of changes

**Example workflow:**
```
You: "Update post IDs for POST 10, POST 11, and POST 12"
Me: [Fetches posts, generates IDs, updates Notion]
Me: "✅ Updated 3 posts:
     - POST 10 → single-quote-10-ux-explanation-system-failure
     - POST 11 → series-invariant-02-consistency-discipline-decay
     - POST 12 → series-invariant-03-scaling-coordination-abstraction"
```

---

## Method 3: Notion Formula (Auto-Generate)

If you want Notion to auto-generate IDs, you can use a formula:

### Step 1: Add Formula Property

1. Add a new property: `Post ID (Auto)`
2. Type: **Formula**
3. Formula:
```notion
concat(
  if(prop("Type") == "single-quote", "single-quote", 
  if(prop("Type") == "single-image", "single-image",
  if(prop("Type") == "carrousel", "carousel",
  "single"))),
  "-",
  if(prop("Series") != empty(), 
    lower(replaceAll(prop("Series"), " ", "-")), 
    ""),
  if(prop("Series") != empty(), "-", ""),
  if(prop("Base") != empty(), 
    format(prop("Base")), 
    "01"),
  "-",
  lower(replaceAll(
    replaceAll(
      replaceAll(prop("Name"), "[^a-zA-Z0-9 ]", ""),
      " +", " "
    ),
    " ", "-"
  ))
)
```

**Note:** Notion formulas are limited. For best results, use Method 2 (AI assistant).

---

## Method 4: Bulk Update Script (Advanced)

For developers who want to automate this:

### Using the Utility Functions

```typescript
import { generatePostIdFromNotionPage } from '../post/utils/notionPostId'
import { mcp_Notion_notion_fetch, mcp_Notion_notion_update_page } from '@mcp/notion'

async function updatePostId(pageId: string) {
  // 1. Fetch the page
  const page = await mcp_Notion_notion_fetch({ id: pageId })
  
  // 2. Generate ID
  const newPostId = generatePostIdFromNotionPage(page)
  
  // 3. Update the page
  await mcp_Notion_notion_update_page({
    page_id: pageId,
    command: 'update_properties',
    properties: {
      'Post ID': newPostId
    }
  })
  
  return newPostId
}
```

---

## Quick Reference: ID Format

```
{type}-{category?}-{number}-{slug}
```

**Examples:**
- `single-07-career-systems-not-speed`
- `single-quote-10-ux-explanation-system-failure`
- `carousel-fe-scale-001-frontend-best-practices`
- `series-invariant-01-ux-depends-explanation`

---

## Best Practice: One-Time Setup

1. **Add "Post ID" property** to your Notion database
2. **Ask me to update all existing posts** (I'll do it automatically)
3. **For new posts**: Either:
   - Let me generate the ID when you create the post
   - Use the formula method (Method 3)
   - Manually enter following the format

---

## Need Help?

Just ask me:
- "Update post IDs for [specific posts]"
- "Generate post ID for POST 15"
- "Show me what post IDs would look like for my posts"
- "Add Post ID property to my Notion database"

I can handle all of this for you! 🚀
