# photography-to-ui

Brand exploration, art direction, and design playground. This is the primary consumer of the Cucusa design system — where ideas are tested before they land in other consumers.

## What this app is

An interactive portfolio site that translates photography into product UI decisions. The homepage has insight panels (Typography, Colors, Photography, Interaction, System, Coming Soon) that reveal interactive component explorers. The Post page is a LinkedIn content gallery with cards, carousels, and filters.

This is NOT the design system docs (that's `docs/`). This app explores what the system can express; the docs explain what exists.

## Commands

```
npm run dev          # Start dev server (Vite, port 5173)
npm run build        # tsc && vite build → ../dist/
npm run check        # tsc --noEmit
```

From the workspace root:
```
npm run dev          # Same — starts this consumer
npm run build        # Same — builds this consumer
```

## Routes

- `/` (Home) — hero headline, narrative with insight links, insight rail, component explorers
- `/post` (Post gallery) — filterable post cards, single images, carousels

## Directory structure

```
src/
  main.tsx           # Entry — imports tokens via @tokens alias
  App.tsx            # Router (Home, Post)
  styles/
    base.css         # Element resets
    app.css          # All component and layout styles (~1600 lines)
  components/        # Insight explorers
    Typography.tsx   # Type scale selector with image pairing
    Colors.tsx       # Palette carousel with hex/RGB/HSL
    Interaction.tsx  # Interaction pattern demos
    System.tsx       # Design intent notes (code-style)
    PhotographyContextInsight.tsx  # Photography variant explorer
    ComingSoon.tsx   # Roadmap items
    posts/PostFilter.tsx  # Filter rail UI
  pages/
    Home.tsx         # Insight panels + narrative links
    Post.tsx         # Post gallery with filters
  post/              # LinkedIn content domain (future extraction target)
    model/post.ts    # PostEntity, CarouselSlide, SinglePostContent types
    data/mockPosts.ts  # Post content data
    components/      # PostEntityCard, CarouselPost, PostNarrative, PostQuote, PostTags
    utils/           # ID gen, narrative builder, Notion integration
    docs/            # Post ID system + Notion docs
public/assets/       # Photography, patterns, post images (ALL RIGHTS RESERVED)
scripts/             # Notion integration helpers
```

## Conventions

- Function components with hooks only. No class components.
- BEM-ish class naming: `.component-element-modifier`.
- Most styles in `app.css`. Post-domain components have co-located CSS files.
- Image paths use `import.meta.env.BASE_URL`. CSS uses hardcoded `/photography-to-ui/` base path.
- Import tokens via `@tokens/dist/tokens.css` and fonts via `@tokens/fonts.css` — never hardcode hex, rgba, px for spacing/font-size, or durations.

## Post system

The post domain (`src/post/`) models LinkedIn-ready content cards:

- `PostEntity` — single or carousel, with LinkedIn format variants (square/portrait/landscape)
- `SinglePostContent` — cover image, quote, belief/reframe, caption
- `CarouselPostContent` — slides with eyebrow/headline/subhead/image/footer
- Post IDs use a Notion-integrated system (see `src/post/docs/POST_ID_SYSTEM.md`)
- Mock data in `src/post/data/mockPosts.ts`

This domain is a future extraction target — it will become its own consumer (`content-creation`).

## Accessibility

- All interactive insight explorers have `aria-pressed`, `aria-label`, `role="group"`
- Palette and type scale selectors announce changes via `aria-live="polite"`
- Carousel uses WAI-ARIA carousel pattern
- Focus ring system: `--focus-ring-width/offset/color` tokens + `:focus-visible`
- Every interactive element has a discernible accessible name

## Asset rules

- Photography in `public/assets/` is copyrighted (see `ASSETS_LICENSE.md`). Never generate, replace, or modify image files.
- Code is MIT licensed. Visual assets are all rights reserved.
