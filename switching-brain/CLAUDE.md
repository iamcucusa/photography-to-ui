# switching-brain

**The Switching Brain** — a data-driven visualization of the design-engineer / UX-engineer brain, built as a consumer of the Cucusa design system. A bilateral brain network of three large-scale systems (DMN, FPCN, Salience) that oscillate; the signature interaction is a switching-rate slider showing creative output peaking at a *balanced* rate (an inverted-U).

Thesis: _the design-engineer brain is not split between hemispheres — it is a normal brain caught in the act of switching._ Motion is the data, not the polish.

This is the experimentation / content-creation consumer. Unlike the other consumers it carries its own viz dependency (`d3-force`); keep app-specific deps here, not in the workspace root.

## Commands

```
npm run dev:brain    # from workspace root — dev server, port 5175
npm run dev          # from this dir — same
npm run build        # tsc && vite build → ../dist/switching-brain/
npm run check        # tsc --noEmit
```

Deployed under `/photography-to-ui/switching-brain/`.

## Architecture

Framework-agnostic core (plain TS, portable/testable) feeding a thin React + SVG draw layer:

```
src/
  App.tsx              # State model + chrome (DS-styled controls). Owns rate, bias,
                       # inspect, self-map, play/pause, idle-return.
  viz/
    model/types.ts     # BrainGraph / BrainNode / BrainEdge — mirrors data/nodes.json
    noise.ts           # Looping value noise (seamless export loop, no dep)
    activation.ts      # phase → per-network activation + motion *quality* (the inverted-U)
    layout.ts          # d3-force sim: bilateral interleaved, live per-network cohesion
    geometry.ts        # radius/edge-path/quad-bezier helpers, deterministic jitter
    runtimeTokens.ts   # reads DS color from CSS vars at RUNTIME (+ alpha/mix compose)
    BrainStage.tsx     # SVG skeleton + requestAnimationFrame loop (imperative draw)
    useGraphData.ts    # fetch + validate data/nodes.json (loading / error / ready)
    useReducedMotion.ts, useIdleReturn.ts, useMediaQuery.ts
  components/          # RateControl, SelfMap, InspectCard, Legend (all DS-token styled)
  styles/
    base.css           # element reset + focus ring (token-driven)
    viz-tokens.css     # ← the 3-way categorical scale (see below)
    app.css            # chrome + overlay styles
public/data/nodes.json # the seed data — fetched at runtime, swappable with no rebuild
```

## Design-system consumption (rules)

- **No hardcoded color anywhere in `src`.** The token-coverage checker (`npm run check:coverage`
  from root) rejects hex / rgba / `color-mix` in `src`. The draw layer reads color at runtime
  from CSS custom properties via `runtimeTokens.ts` and composes any alpha as a runtime-built
  rgba string (never a literal). `color-mix` belongs in `@cucusa/tokens`, not here.
- **The 3-way categorical scale (DMN / FPCN / SN)** is derived in `styles/viz-tokens.css` from
  three existing brand ramps — **DMN → sand (warm)**, **FPCN → sky (cool)**, **SN → magenta
  (bright accent)** — using only `var(--color-*)` references. No new raw colors.
- **Network is never encoded by color alone** — also by vertical band position (DMN top, SN
  middle, FPCN bottom) + band labels + the legend, so it survives grayscale / color-blindness.
- **Light, not lines.** The workspace's dividers-not-boxes art direction propagates here
  *half-way by design*: no bordered/rounded/filled panel containers, **and no hairline
  dividers either** — on a glow-on-dark piece, rules are the wrong structural instrument.
  Structure comes from typography, whitespace, and the network hue system.
- **Elevation is emitted light.** The inspect sheet's elevation is a glow tinted by the
  inspected node's network: `--inspect-glow-*` custom properties set inline in
  `InspectCard.tsx`, composed at runtime with `withAlpha` over the `--viz-*` ramps. Do
  not use the DS `--shadow-1/soft/hover/2` here — their cool sky rim and lit edge are
  panel language and fight the sand/magenta networks.
- **Radius is rationed to circles.** The only radii in this consumer are `50%` on true
  inputs and swatches (close button, slider thumb, legend dots, tag dots).
  `--viz-radius-tight` was retired when the inspect card went sharp.
- **Only `text-primary`/`text-secondary` on the inspect sheet.** Muted fails 4.5:1 in the
  worst case (a bright sky-4 node bleeding through the 90% sheet surface: 4.20:1).
  Enforced by the dark-only brain-sheet rows in `tokens/check-contrast.mjs`.
- **Dark-only, pinned.** Glow-on-dark is the hero of this piece. The DS now ships a light mode
  (`@tokens/dist/tokens.light.css` under `[data-theme='light']`), but this consumer deliberately
  does NOT import it, and `index.html` pins `data-theme="dark"` so a shared theme preference on
  the deployed origin can never flip it. A light variant ("paper mode" — shadows instead of
  glows) is a tracked exploration, not a toggle: it needs re-art-direction. If ever unpinned,
  note `runtimeTokens.ts` caches resolved colors — call `readTokens()` again on theme change.

## Motion & interaction

- Oscillation is **noise-driven** (not a sine) and loops seamlessly (`CROSSOVER_U` is the both-lit
  still). Salience **leads** the switch (driven by the near-future phase). Activation drives
  brightness + scale + force cohesion + callosal particle surges — nothing decorative.
- The rate slider changes motion **quality** (rigid → flow → noise), not just speed; the output
  meter peaks at balance (inverted-U).
- v1 flows: **be-the-brain slider** (primary), **inspect a node**, **self-map**. State model:
  rate persists across interactions; self-map tilt and the rate slider are mutually exclusive
  (grabbing the slider dismisses the annotation); inspect coexists with everything; ~20 s idle
  eases back to ambient watch. Reduced motion rests on the both-lit crossover still + a Play control.

## Responsive (orientation-aware)

The layout follows viewport **shape**, not width alone:

- **Graph orientation** is picked in `App.tsx` via `useMediaQuery('(max-width: 560px)')` and passed
  to `BrainStage`/`createBrainSimulation`. **≤560px (phone portrait) → vertical lanes** (portrait
  viewBox; networks are columns, hemisphere leans vertically; a portrait-only `forceX` in `layout.ts`
  holds each network in its lane so rich-club hubs don't drift to center). **Everything wider →
  horizontal bands** (the landscape viewBox), which fill the width instead of letterboxing. Keep the
  JS breakpoint and the CSS `@media (max-width: 560px)` block (portrait aspect + full-bleed) in sync.
- **Page layout** in `app.css`: the two-column showcase requires **wide AND landscape**
  (`@media (max-width: 1023px), (orientation: portrait)` drives the compact stacked layout), so tall
  portrait tablets (e.g. iPad Pro 12.9″ at 1024px) stack instead of stranding the graph in a
  vertically-stretched grid. Compact dissolves the desktop wrappers with `display:contents` + `order`.
- **The brain hero does NOT use `position: sticky`.** Sticky was tried and removed — it slid the
  controls behind the graph on scroll. It's a normal scrolling block; co-visibility comes from source
  order (graph sits directly above the self-map). Don't reintroduce sticky.
- The inspect sheet **docks full-width** on phones, **capped + centered** (28rem) on wider compact
  screens — a reading card, not an edge-to-edge banner. iOS: `100dvh`/`svh`, `env(safe-area-inset-*)`,
  `-webkit-tap-highlight-color`, `overscroll-behavior` (see `base.css` + `index.html` viewport-fit).

## Data model

Swap `public/data/nodes.json` to change the viz with no code edits. Each node: `id`, `label`,
`network` (DMN|FPCN|SN), `hemi` (L|R|M), `degree` [0,1], optional `richClub` / `switcher` / `role`.
Edges: `source`, `target`, `weight` [0,1], `type` (functional|callosal). See `viz/model/types.ts`.

## Conventions

- Function components + hooks only. Match workspace ESLint/Prettier (single quotes, no semi,
  trailing commas, 100 cols). No test runner, no new tooling.
- The rAF loop mutates SVG attributes imperatively via refs (33 nodes / 51 edges) — do **not**
  re-render React per frame. Per-frame state goes through refs, not `setState`.
