# photography-to-ui

## What this is

A personal design-in-code platform. Photography inputs inform color, typography, rhythm, and layout decisions — translated into product UI through code, not design tools.

Deployed to GitHub Pages at `/photography-to-ui/`.

### Active goals

- **Portfolio / design showcase** — the homepage and its interactive component explorers.
- **LinkedIn content production** — the post domain model (`src/post/`) for coded posts and carousels.
- **Design system seed** — the token system follows W3C DTCG spec, built with Style Dictionary 4. Source JSON in `tokens/`, generated CSS in `src/styles/tokens.css`.
- **AI-scaffolding pilot** — CLAUDE.md, hooks, skills, and MCP integrations. Being built incrementally.

### Future goals (not yet structurally supported — don't build toward these without discussion)

- **Design system docs** — dedicated consumer for token reference, component catalog, and living documentation. Separate from photography-to-ui (which is the playground, not the docs).
- **Content creation** — dedicated consumer for LinkedIn post production (currently in `src/post/`, will be extracted).
- **Blog / email content** — direction is personal brand, content model undecided.
- **Landing pages / demos** — architecture (same app vs separate?) and AI workflow (how much autonomy?) both open questions.

### Consumer architecture

photography-to-ui is one of several consumers of the design system. Each consumer has a distinct purpose:

```
tokens/                          ← self-contained, extractable design system
  │
  ├── → photography-to-ui       brand exploration, art direction, playground
  ├── → design-system-docs      token reference, component catalog, living docs (future)
  ├── → content-creation        LinkedIn posts, carousel builder (future)
  └── → other consumers         landing pages, blog, etc. (future)
```

photography-to-ui explores *what the design system can express*. The docs consumer explains *what exists and how to use it*. Mixing them dilutes both purposes.

## Stack

- React 19, TypeScript 6 (strict), Vite 8
- react-router-dom v7 (library mode, BrowserRouter)
- Plain CSS with custom properties (no CSS modules, no Tailwind, no CSS-in-JS)
- JetBrains Mono as the sole typeface (monospace everywhere)
- Style Dictionary 4 (DTCG token pipeline)
- ESLint 9 (flat config) + Prettier for formatting
- No test runner. No Storybook.

## Commands

```
npm run tokens       # Regenerate src/styles/tokens.css from tokens/*.json
npm run dev          # Start playground dev server (Vite, port 5173)
npm run dev:docs     # Start docs consumer dev server (Vite, port 5174)
npm run build        # tsc && vite build (playground only)
npm run build:all    # tokens → playground → docs (full pipeline)
npm run check        # tsc (both consumers) + eslint + prettier (run before PRs)
npm run lint         # ESLint only
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier write
npm run format:check # Prettier check only
```

## Directory structure

```
tokens/              # @cucusa/tokens — design system (see tokens/CLAUDE.md)
  color/             # primitives.json, semantic.json, derived.json
  typography.json    # Font family, weights, type scale, line-height, letter-spacing
  spacing.json       # Spacing scale
  shape.json         # Radii, dividers, focus ring
  elevation.json     # Shadows
  motion.json        # Durations, easings
  sizing.json        # LinkedIn post sizing
  sd.config.mjs      # Style Dictionary 4 build config + custom transforms
  fonts.css          # @font-face declarations (JetBrains Mono)
  fonts/             # Self-hosted font files (woff2) — travels with the package
docs/                # @cucusa/docs — token catalog (see docs/CLAUDE.md)
  src/App.tsx        # Visual token reference (reads DTCG JSON directly)
  vite.config.ts     # Builds to dist/docs/
src/                 # Playground app (root workspace)
  styles/
    tokens.css       # AUTO-GENERATED — do not edit. Run `npm run tokens` to rebuild.
    base.css         # Element resets and global styles
    app.css          # All component and layout styles
  components/        # Homepage-level UI: Typography, Colors, Interaction, System,
                     #   ComingSoon, PhotographyContextInsight
    posts/           # PostFilter component (filter rail UI)
  pages/             # Route pages: Home (/), Post (/post)
  post/              # Post domain model (the active system)
    model/           # PostEntity, CarouselSlide, SinglePostContent types
    data/            # mockPosts.ts — post content data
    components/      # PostEntityCard, CarouselPost, PostQuote, PostNarrative, PostTags
    utils/           # ID generation, narrative building, Notion integration
    docs/            # Post ID system docs, Notion integration docs
scripts/             # Notion integration helpers
public/assets/       # Photography, patterns (ALL RIGHTS RESERVED — see below)
```

## Design tokens

See `tokens/CLAUDE.md` for the full token architecture, file reference, extension namespaces, and how to add tokens.

Quick reference: use existing tokens via `var(--token-name)`. Do not introduce raw hex values, magic px for spacing/font-size, or new tokens without approval.

## Component conventions

- Function components with hooks only. No class components.
- BEM-ish class naming: `.component-element-modifier` (e.g., `.post-card-interactive`, `.typography-size-button-active`).
- Most styles live in `app.css`. Post-domain components have co-located CSS files.
- Two routes: `/` (Home) and `/post` (Post gallery). react-router-dom v7.
- Image paths in components use `import.meta.env.BASE_URL`. CSS uses the hardcoded `/photography-to-ui/` base path.

## Post system

The post domain (`src/post/`) models LinkedIn-ready content cards:

- `PostEntity` — single or carousel, with LinkedIn format variants (square/portrait/landscape)
- `SinglePostContent` — cover image, quote (with variant/category/number), belief/reframe, caption
- `CarouselPostContent` — slides with eyebrow/headline/subhead/image/footer
- Post IDs use a Notion-integrated system (see `src/post/docs/POST_ID_SYSTEM.md`)
- Mock data in `src/post/data/mockPosts.ts`

This area is under active development.

## Asset rules

- Photography in `public/assets/` is copyrighted (see `ASSETS_LICENSE.md`). Never generate, replace, or modify image files.
- Font files are in `tokens/fonts/`. Only JetBrains Mono.
- Code is MIT licensed. Visual assets are all rights reserved.

## Working agreements

- Do not add features beyond what was asked. Surface assumptions explicitly.
- Do not add dependencies without approval.
- Do not add test/linting/formatting infrastructure beyond what exists.
- Prefer editing existing files over creating new ones.
- This is a personal creative project — don't sanitize voice or tone in content/copy.
- Accessibility: use semantic HTML, provide accessible names for interactive elements, preserve the focus-ring system (`--focus-ring-*` tokens). The codebase uses `aria-expanded`, `aria-pressed`, `aria-label`, and `:focus-visible` consistently.
- When compacting, preserve the list of modified files and current task status.

## Accessibility baseline

Every interactive element has a discernible accessible name. Every form input has a label. No `tabindex > 0`. Semantic HTML before ARIA. The existing carousel uses WAI-ARIA carousel pattern (role="region", aria-roledescription="carousel", keyboard arrow navigation).

## Tooling decisions

### Evaluated and rejected

- **Storybook**: Overhead exceeds value for a solo design-in-code project with one consumer. photography-to-ui already has interactive component explorers (Typography, Colors, Interaction, System, PhotographyContextInsight) that serve as living documentation. Storybook would duplicate this with additional maintenance burden.
- **Chromatic / Percy**: Visual regression services require Storybook stories or a component isolation layer. Not justified until there are multiple consumers with shared components.
- **Tokens Studio / Figma Tokens**: The project is code-first by design. Figma is not in the workflow. Token authoring happens in JSON; visual verification happens in Claude Preview.

### Active tooling

- **Style Dictionary 4**: DTCG JSON → CSS pipeline. Custom transforms for `color-mix()`, composites, platform overrides. Config in `tokens/sd.config.mjs`.
- **Claude Preview MCP**: Visual verification during development. Used for screenshot-based regression checks after token or style changes. No persistent baseline — verification is per-session.
- **Claude Code + CLAUDE.md**: AI-scaffolding layer. CLAUDE.md encodes project conventions, token architecture, and working agreements. Skills and hooks being built incrementally.

### Deferred — design-system-docs consumer

A dedicated documentation consumer will provide:
- Visual token catalog (color swatches, type specimens, spacing scale, shadow/elevation demos, motion timing)
- Component API reference
- Usage guidelines for each consumer
- Auto-generated from the same `tokens/` source

This is a separate app, not a route in photography-to-ui. Architectural decision: photography-to-ui explores what the system can express; the docs consumer explains what exists and how to use it.

### Visual verification workflow

After any token or style change, verify both routes visually:

1. Run `npm run tokens && npm run format` if token JSON was changed
2. Run `npm run check` to verify tsc + eslint + prettier pass
3. Start dev server and screenshot both routes:
   - `/` (Home) — hero, insights panel, component explorers
   - `/post` (Post gallery) — cards, narratives, tags, carousel slides with image overlays
4. Inspect key computed styles: card backgrounds (`--color-bg-translucent`), borders (`--divider-subtle`), text colors, shadow elevations
5. Run `npm run build` to verify production build succeeds

### How to add a new consumer

The `tokens/` directory is designed to be consumed by multiple apps:

1. The consumer needs `style-dictionary` as a dependency
2. Copy or reference `tokens/sd.config.mjs` — adjust `buildPath` to point to the consumer's styles directory
3. The consumer's build step runs `node tokens/sd.config.mjs` (or a modified copy)
4. Import the generated `tokens.css` in the consumer's entry point
5. All CSS custom properties are available via `var(--token-name)`

For non-CSS consumers (future iOS, Android), add a new platform in `sd.config.mjs` with platform-specific transforms. The `$value` fields already contain valid DTCG fallbacks. Platform extensions (`com.cucusa.platform`) can add sibling keys: `{ "css": "...", "ios": "...", "android": "..." }`.

## ESLint/Prettier notes

- ESLint 9 flat config: `eslint.config.js`. Includes typescript-eslint, react-hooks, react-refresh, jsx-a11y, eslint-config-prettier.
- Prettier: single quotes, no semicolons, trailing commas, 100 char width. Config in `.prettierrc`.
- Notion integration files (`notionPostId.ts`, `scripts/`) use `eslint-disable` for `no-explicit-any` — Notion API shapes require it.
