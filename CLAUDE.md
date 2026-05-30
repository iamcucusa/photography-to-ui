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

- **Blog / email content** — direction is personal brand, content model undecided.
- **Landing pages / demos** — architecture (same app vs separate?) and AI workflow (how much autonomy?) both open questions.

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
npm run dev          # Start dev server (Vite)
npm run build        # tsc && vite build
npm run check        # tsc --noEmit && eslint && prettier --check (run before PRs)
npm run lint         # ESLint only
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier write
npm run format:check # Prettier check only
```

## Directory structure

```
tokens/              # DTCG JSON source files (the single source of truth)
  color/             # primitives.json, semantic.json, derived.json
  typography.json    # Font family, weights, type scale, line-height, letter-spacing
  spacing.json       # Spacing scale
  shape.json         # Radii, dividers, focus ring
  elevation.json     # Shadows
  motion.json        # Durations, easings
  sizing.json        # LinkedIn post sizing
  sd.config.mjs      # Style Dictionary 4 build config + custom transforms
src/
  styles/
    tokens.css       # AUTO-GENERATED — do not edit. Run `npm run tokens` to rebuild.
    base.css         # Element resets and global styles
    fonts.css        # @font-face declarations (JetBrains Mono)
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
scripts/             # Notion integration helpers
docs/                # Post ID system docs, Notion integration docs
public/assets/       # Photography, fonts, patterns (ALL RIGHTS RESERVED — see below)
```

## Design tokens

### Architecture

Tokens follow the W3C DTCG specification. The source of truth is `tokens/*.json`. Style Dictionary 4 generates `src/styles/tokens.css` — never edit that file directly.

```
tokens/                          ← self-contained, extractable design system
  *.json + sd.config.mjs              │
                                      ▼
                              npm run tokens
                                      │
                                      ▼
                            src/styles/tokens.css  ← photography-to-ui (playground / docs)
                                      │
                              (future consumers)   ← content-creation, landing pages, etc.
```

The `tokens/` directory is structured to be extractable as a standalone package when additional consumers justify it. It contains all source JSON, the SD4 build config, and custom transforms — everything needed to generate platform-specific output for any consumer.

To add or change a token: edit the JSON source, run `npm run tokens`, then `npm run format`. To add a new custom transform, read the ordering and guard documentation in `tokens/sd.config.mjs` first.

### Token files

| File | Contents | DTCG types |
|---|---|---|
| `color/primitives.json` | 25 hex values (Magenta, Sky, Frost, Sand, Ink × 5 stops) | `color` |
| `color/semantic.json` | Design intent aliases (bg.canvas, text.primary, accent) | `color` (aliases) |
| `color/derived.json` | 38 computed colors via `color-mix()` (overlays, tints, glows) | `color` + `colorMix` extension |
| `typography.json` | Font family, weights, type scale, line-height, letter-spacing | `fontFamily`, `fontWeight`, `dimension`, `number` |
| `spacing.json` | 5 spacing stops (xs through xl) | `dimension` |
| `shape.json` | Radii, dividers (border composite), focus ring | `dimension`, `border`, `color` |
| `elevation.json` | 5 shadows including glow-accent | `shadow` |
| `motion.json` | 6 durations + 2 easings | `duration`, `cubicBezier` |
| `sizing.json` | LinkedIn post layout (card width, grid gap, safe zone) | `dimension` |

### Extension namespaces

Two custom extension namespaces handle values that DTCG can't express natively:

**`com.cucusa.colorMix`** — structured color derivation recipe. Generates `color-mix()` CSS for the web platform while keeping a pre-resolved hex `$value` as DTCG-compliant fallback.

```json
{
  "$type": "color",
  "$value": "#0d1b2ad9",
  "$extensions": {
    "com.cucusa.colorMix": {
      "space": "srgb",
      "color1": "{color.bg.canvas}",
      "amount1": "85%",
      "color2": "transparent"
    }
  }
}
```

**`com.cucusa.platform`** — per-platform value overrides for CSS functions (`clamp()`, `calc()`, `min()`, `max()`) or any value that can't be represented in DTCG. The `$value` must always be a valid DTCG fallback for non-CSS consumers.

```json
{
  "$type": "dimension",
  "$value": "440px",
  "$extensions": {
    "com.cucusa.platform": {
      "css": "clamp(340px, 32vw, 440px)"
    }
  }
}
```

Rules for platform extensions:
- `$value` must always be valid DTCG — it's what non-CSS consumers get
- `com.cucusa.platform.css` is a CSS-only override, used for runtime functions
- The platform transform runs first, so it takes precedence over type-specific transforms
- Future platforms (e.g., iOS, Android) would add sibling keys: `{ "css": "...", "ios": "..." }`

### Token values

- **Colors**: Five palettes × 5 stops. Semantic roles map intent to primitives. Derived tokens use `color-mix()` for overlays, tints, borders, glows, and gradients. Dark mode only.
- **Typography**: JetBrains Mono. Weights: 400/500/600. Perfect Fifth scale (1.5 ratio): `--text-xs` through `--text-xxl`, plus `--display-xl`.
- **Spacing**: `--space-xs` (0.25rem) through `--space-xl` (4rem), doubling progression.
- **Other**: `--radius-sm/md`, `--divider-subtle/strong`, `--shadow-1/2/soft/hover/glow-accent`, `--focus-ring-*`, `--duration-*`, `--easing-*`, LinkedIn sizing.

Use existing tokens. Do not introduce raw hex values, magic px for spacing/font-size, or new tokens without approval.

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
- Post IDs use a Notion-integrated system (see `docs/POST_ID_SYSTEM.md`)
- Mock data in `src/post/data/mockPosts.ts`

This area is under active development.

## Asset rules

- Photography in `public/assets/` is copyrighted (see `ASSETS_LICENSE.md`). Never generate, replace, or modify image files.
- Font files are self-hosted in `public/assets/fonts/`. Only JetBrains Mono.
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

## ESLint/Prettier notes

- ESLint 9 flat config: `eslint.config.js`. Includes typescript-eslint, react-hooks, react-refresh, jsx-a11y, eslint-config-prettier.
- Prettier: single quotes, no semicolons, trailing commas, 100 char width. Config in `.prettierrc`.
- Notion integration files (`notionPostId.ts`, `scripts/`) use `eslint-disable` for `no-explicit-any` — Notion API shapes require it.
