# cucusa

## What this is

A personal design-in-code platform with a multi-consumer architecture. Photography inputs inform color, typography, rhythm, and layout decisions — translated into product UI through code, not design tools.

Deployed to GitHub Pages at `/photography-to-ui/`.

### Consumer architecture

```
cucusa (workspace root — orchestration only)
│
├── tokens/                @cucusa/tokens — the design system
│     DTCG JSON source, SD4 build pipeline, fonts
│     See tokens/CLAUDE.md
│
├── photography-to-ui/     photography-to-ui — brand exploration, art direction
│     The playground. Interactive component explorers, LinkedIn posts.
│     See photography-to-ui/CLAUDE.md
│
├── docs/                  @cucusa/docs — token catalog + audit dashboard
│     Visual token reference, design system health page.
│     See docs/CLAUDE.md
│
├── switching-brain/       @cucusa/switching-brain — "The Switching Brain" data viz
│     Experimentation + content-creation consumer. SVG/d3-force brain network.
│     Carries its own viz deps (d3-force). See switching-brain/CLAUDE.md
│
└── (future consumers)     landing pages, blog
```

### Active goals

- **Portfolio / design showcase** — photography-to-ui homepage and interactive component explorers.
- **LinkedIn content production** — the post domain model (`photography-to-ui/src/post/`).
- **Design system seed** — W3C DTCG token source in `tokens/`, consumed by all apps.
- **Design system docs** — visual token catalog and audit dashboard in `docs/`.
- **AI-scaffolding pilot** — CLAUDE.md per consumer, hooks, skills, MCP integrations.

### Future goals (not yet structurally supported — don't build toward these without discussion)

- **Content creation** — dedicated consumer for LinkedIn post production (currently in `photography-to-ui/src/post/`, will be extracted).
- **Blog / email content** — direction is personal brand, content model undecided.
- **Landing pages / demos** — architecture and AI workflow both open questions.

### Deferred decisions

- **Breakpoint tokens**: 3 values (768px, 1024px, 767px) in 8 media queries — not tokenized. Revisit when responsive strategy is defined.
- **Layout constraint tokens**: 5 hardcoded layout values (280–1600px) are playground-specific art direction. Don't tokenize unless a second consumer needs them.
- **Visual regression testing**: Playwright screenshot comparison deferred. Current verification is per-session via Claude Preview MCP.
- **Token staleness check**: Implemented — `npm run check` regenerates tokens and diffs against committed file. CI rejects stale output.
- **Token coverage threshold**: Implemented — `npm run check:coverage` scans all consumers automatically via workspace discovery. CI rejects hardcoded hex/rgba/color-mix.

## Stack

- React 19, TypeScript 6 (strict), Vite 8
- npm workspaces (3 packages: tokens, photography-to-ui, docs)
- Plain CSS with custom properties (no CSS modules, no Tailwind, no CSS-in-JS)
- JetBrains Mono as the sole typeface (monospace everywhere)
- Style Dictionary 4 (DTCG token pipeline)
- ESLint 9 (flat config) + Prettier for formatting
- No test runner. No Storybook.

## Commands

```
npm run tokens       # Regenerate tokens/dist/tokens.css from tokens/*.json
npm run validate     # Check DTCG integrity — structure, descriptions, refs, extensions
npm run audit        # Re-scan codebase, update docs/src/audit-data.json
npm run dev          # Start photography-to-ui dev server (port 5173)
npm run dev:docs     # Start docs consumer dev server (port 5174)
npm run dev:brain    # Start switching-brain dev server (port 5175)
npm run build        # Build photography-to-ui only
npm run build:all    # tokens → photography-to-ui → docs → switching-brain (full pipeline)
npm run check        # tsc (all consumers) + eslint + prettier
npm run lint         # ESLint only
npm run format       # Prettier write
```

## Directory structure

```
tokens/              # @cucusa/tokens — design system (see tokens/CLAUDE.md)
  color/             # primitives.json, semantic.json, derived.json
  typography.json, spacing.json, shape.json, elevation.json, motion.json, sizing.json
  sd.config.mjs      # Style Dictionary 4 build config + custom transforms
  fonts.css          # @font-face declarations (JetBrains Mono)
  fonts/             # Self-hosted woff2 files — travels with the package
  dist/tokens.css    # AUTO-GENERATED — consumed by all apps
photography-to-ui/   # Art direction consumer (see photography-to-ui/CLAUDE.md)
  src/
    styles/          # base.css, app.css (tokens.css removed — imported from tokens/dist/)
    components/      # Typography, Colors, Interaction, System, ComingSoon explorers
    pages/           # Home (/), Post (/post)
    post/            # LinkedIn content domain (future extraction target)
  public/assets/     # Photography, patterns, post images (ALL RIGHTS RESERVED)
  vite.config.ts     # Builds to dist/
docs/                # @cucusa/docs — token catalog (see docs/CLAUDE.md)
  src/App.tsx        # Token reference + audit page
  scripts/audit.mjs  # Automated scanner
  vite.config.ts     # Builds to dist/docs/
switching-brain/     # @cucusa/switching-brain — "The Switching Brain" viz (see switching-brain/CLAUDE.md)
  src/viz/           # Framework-agnostic core: noise, activation, d3-force layout, SVG draw layer
  src/components/    # DS-styled chrome: RateControl, SelfMap, InspectCard, Legend
  public/data/nodes.json  # Seed data — fetched at runtime, swappable with no rebuild
  vite.config.ts     # Builds to dist/switching-brain/
```

## How to add a new consumer

1. Create a directory at the workspace root with its own `package.json`
2. Add it to root `package.json` `workspaces` array
3. Import `@tokens/dist/tokens.css` for CSS custom properties
4. Import `@tokens/fonts.css` for @font-face declarations
5. Add `@tokens` alias to `vite.config.ts` and `tsconfig.json` paths (see existing consumers for example)
5. Add `dev`, `build`, and `check` scripts to the consumer's `package.json`
6. Add the consumer to root `build:all` and `check` scripts
7. Create a `CLAUDE.md` in the consumer directory with its domain-specific instructions

## Working agreements

- Do not add features beyond what was asked. Surface assumptions explicitly.
- Do not add dependencies without approval.
- Do not add test/linting/formatting infrastructure beyond what exists.
- Prefer editing existing files over creating new ones.
- This is a personal creative project — don't sanitize voice or tone in content/copy.
- Accessibility: use semantic HTML, provide accessible names, preserve the focus-ring system. Use `aria-expanded`, `aria-pressed`, `aria-label`, and `:focus-visible` consistently.
- When compacting, preserve the list of modified files and current task status.
- Each consumer has its own CLAUDE.md — check the consumer-level docs before editing consumer code.
- If you change directory structure, commands, conventions, or architecture, update the relevant CLAUDE.md in the same commit.

## Tooling decisions

### Under evaluation

- **Storybook**: Being assessed as part of the design system evaluation — weighing value for human + agentic engineering workflows against overhead and alternatives.

### Evaluated and rejected

- **Chromatic / Percy**: Not justified until multiple consumers share components.
- **Tokens Studio / Figma Tokens**: Code-first by design. Figma is not in the workflow.

### Active tooling

- **Style Dictionary 4**: DTCG JSON → CSS. Config in `tokens/sd.config.mjs`.
- **Claude Preview MCP**: Visual verification during development.
- **Claude Code + CLAUDE.md**: AI-scaffolding layer. Per-consumer CLAUDE.md files encode domain-specific conventions.
- **Audit scanner**: `npm run audit` scans CSS for token coverage, hardcoded values, accessibility. `/design-system audit` skill writes strategic insights.

## ESLint/Prettier notes

- ESLint 9 flat config: `eslint.config.js` at workspace root. Shared across all consumers.
- Prettier: single quotes, no semicolons, trailing commas, 100 char width. Config in `.prettierrc`.
- Notion integration files use `eslint-disable` for `no-explicit-any`.
