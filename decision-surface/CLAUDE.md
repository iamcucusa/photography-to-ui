# decision-surface

**Country Data Overview** — an agent-era decision surface, built as a consumer
of the Cucusa design system. One screen where a trial planner (Ana) turns
historical site-performance evidence into a ranked country shortlist: steerable
ranking weights, per-country distributions, and the whole investigation
serialized in the URL so one link restores the exact view. An in-app agent
(Atlas) reads the same typed data tier and proposes evidence-carrying findings.

Thesis: *charts are for humans; agents read the structured data underneath.
One shared, serializable state serves both.* Built as the portfolio case study
for the Dash0 interview; the docs are part of the deliverable.

## Source of truth

- `docs/design-spec.md` — the build spec: feature, personas, business rules
  (BL1–BL10), user flows, IA (zones, URL taxonomy), the interaction contract
  (invariants I1–I7), the tiered data model (§G), and the MVP scope (§H).
  **It wins over everything, including this file.**
- `docs/data-spec.md` — the mock-data contract: fixtures, constraints
  (C1–C10), anti-leakage rules (L1–L6), seeded generator, verification
  protocol. It implements §G and never overrides it.

If an interaction, write path, or field is not in those docs, it does not
exist. Do not invent behavior.

## Commands (once scaffolded)

```
npm run dev          # from this dir — vite dev server, port 5176
npm run build        # tsc && vite build → ../dist/decision-surface/ + §H.3 bundle budget check
npm run check        # tsc --noEmit && vitest run (the pure-layer tests gate CI)
```

Register in root `package.json` workspaces and add `dev:decision` when
scaffolding. App-specific deps stay in this package, never in the root.

## Architecture (mirrors the spec's tiers, §G.0)

```
src/
  data/            # THE DATA LAYER — owns all tiers below the view
    fixtures/      # seeded JSON per data-spec (observations, predictions, ...)
    decode.ts      # runtime validation at the boundary, typed shapes only
    query.ts       # TanStack Query wiring; useInfiniteQuery over keyset
                   #   pages (querySites: sort by (field, id), opaque cursor,
                   #   never offsets — §G.2)
    derive.ts      # CountryMetrics rows, CountryDistribution, the rank
                   #   algorithm (§G.1: min-max normalize, Inverse flip,
                   #   dense rank desc, alphabetical ties, provenance 'all')
    shared.ts      # runtime shared state: selection, weights, finding
                   #   statuses (localStorage behind a service-shaped API)
    drafts.ts      # local drafts: pending selection, weight edits
                   #   (localStorage, never in URL, never shared — I3)
  state/
    url.ts         # the F.2 canonical serializer — the ONLY writer of the
                   #   URL (I2): omit defaults, fixed param order, push vs
                   #   replace per the interaction contract
    store.ts       # Zustand stores, mapped 1:1 to §G.0 tiers (shared,
                   #   drafts, ephemeral). The URL stays the canonical view
                   #   state — never mirrored into the store as truth
  atlas/           # the agent: runs §C checks over derive.ts output,
                   #   emits Finding {claim, derivedFrom, suggestedState,
                   #   status} — invalid findings never render (BL5)
  zones/           # one component tree per F.1 zone, canonical names:
                   #   ContextBar, ScopeBar, CountryList, DistributionPanel,
                   #   SiteExplorer (windowed evidence grid, TanStack
                   #   Virtual), RankingCriteria, FindingsRail
  styles/          # token-driven CSS; motion tokens from the interaction
                   #   contract (fast 120 / standard 200 / settle 320 /
                   #   pulse 600 ms, one ease-out, reduced-motion → 0)
```

## Design-system consumption (workspace rules apply)

- **No hardcoded color anywhere in `src`.** The root coverage checker rejects
  hex / rgba / `color-mix`. All color through `var(--color-*)` tokens.
- **Soft dark ground, this consumer only.** Pure `--color-bg-canvas` (sky-1)
  is too harsh under a dense table; `--ds-ground-lift` (base.css) layers the
  DS's own `overlay-mid` + `overlay-heavy` tokens over canvas/elevated for a
  one-step navy lift — no new color values, light mode untouched. Every text
  pair on the lifted ground was re-measured ≥ 4.5:1; keep it that way.
- **`--color-status-error` is a 15% accent WASH**, not a text color (~1:1 as
  a line). Use it as an indicator field with primary text on top, never as
  text or a thin border.
- **Row hover is `--color-accent-wash`, not a canvas overlay.** The
  `--color-overlay-*` tokens tint toward canvas, so they vanish wherever the
  ground already is canvas (light mode) or elevated (the panels). Accent-wash
  is the only single token that contrasts against every neutral ground in
  both modes (Δ 14-23) while keeping text ≥ 13.6:1 — accent is this surface's
  interaction color. A highlighted row keeps its accent-tint on hover (guard
  in app.css) so the meaningful highlight never softens to the hover wash.
- Distributions drawn with **d3** (scale, shape, array) to SVG, styled by
  tokens. No high-level chart wrapper.
- App deps live here, not in the root: `d3-scale`, `d3-shape`, `d3-array`,
  `@tanstack/react-query`, `@tanstack/react-virtual`, `zustand`.
- Follows the workspace theme; no pinning needed (data UI, not glow art).

## Hard rules (from the spec, enforce in review)

- Exactly three interactions write shared state: commit, save weights, set
  finding status (I1). Everything else writes drafts, view state, or
  ephemeral state.
- Rank changes only through weights (BL1); selection only through explicit
  commit (BL2); weights must total 100% to save (BL3).
- Every view-state change lands in the URL through `state/url.ts`; link
  equality is state equality (BL7). Cursors and scroll positions are never
  state: links share intent (sort, filters), not offsets.
- Atlas triggers only on shared-state change, writes only findings (I5);
  filters shape human views, never its input.
- Motion is CSS transitions on the contract's tokens. No rAF loops, no
  animation libraries. Virtualized scrolling re-renders windowed rows and
  nothing else; that is TanStack Virtual working as designed, not a leak.

## Performance budgets (fail the build, not the demo)

| Budget | Limit |
|---|---|
| Initial JS | 180 KB gzip (React, d3 modules, TanStack Query and Virtual, Zustand, app) |
| Fixtures | 2 MB raw, ~250 KB gzip transfer, fetched after first paint |
| Evidence grid | 60 fps scroll, max 40 mounted rows, keyset page under 30 ms |
| Rank recompute → reordered paint | 50 ms at 60 countries |
| Interaction → visual response | 100 ms; no long task over 50 ms |
| Deployed Lighthouse performance | 90+ |

## MVP order (interview scope, spec §H.2)

1. Ranked `CountryList` from fixtures (derived tier live).
2. `ScopeBar` + URL round-trip: copy link, new tab, exact view restores.
3. `RankingCriteria`: weights → recompute → visible re-rank (the causality
   moment, 320 ms settle).
4. Atlas minimal: two checks, finding cards, "show me" with highlights.
5. `SiteExplorer`: virtualized grid over thousands of observations,
   keyset-paginated, sort in the URL.
6. Stretch: `DistributionPanel` (d3); pending selection + commit.

Vera's role, accept/reject learning, and the full edge-state matrix are
presented as spec, not built.

## Conventions (this consumer's own; it is a data product, not a viz piece)

Workspace-wide rules still apply: function components + hooks, ESLint/Prettier
(single quotes, no semi, trailing commas, 100 cols), token-only color. The
rest is deliberately different from `switching-brain`, whose rAF/imperative
conventions do not fit a state-driven product UI.

- **Render model.** Declarative React throughout. Motion is CSS transitions on
  the contract's tokens; no rAF loops, no imperative DOM mutation, no
  animation libraries. Virtualized scroll re-renders windowed rows only.
- **State conventions.** One-way flow through the §G.0 tiers. The URL is read
  as the source of view state; Zustand holds shared, draft, and ephemeral
  state behind selectors; components never sync state between tiers with
  effects. Derive on read, never store what can be computed.
- **Types.** All §G contract shapes live in `src/types.ts`, named exactly as
  the spec names them (`CountryMetrics`, `InvestigationState`, `Finding`,
  `SitePage`). No parallel or renamed shapes.
- **Testing (yes, this consumer tests).** Vitest, colocated. Most tests run in
  node env on the pure and service layers: `derive.ts` (rank algorithm,
  quartiles), `url.ts` (serialize/parse round-trip, canonical order,
  push/replace), the keyset pager, Atlas's finding validation (BL5), and the
  `shared`/`drafts`/`store` write semantics (the identity-stability the Atlas
  effect depends on — the loop bug's regression guard). One jsdom smoke test,
  `App.smoke.test.tsx` (opts into jsdom via a `@vitest-environment` docblock;
  stubs ResizeObserver / scroll / `<dialog>`), walks the §H.2 demo path end to
  end — it guards the orchestration layer where both real regressions lived.
  No exhaustive component/interaction tests; the spec flows remain the manual
  script.
- **Fixtures.** Regenerated only by the seeded generator; the data-spec
  validator runs before commit. Never hand-edit a fixture.
- **Accessibility.** Every pointer path has its keyboard path from the
  interaction contract; focus returns to the trigger on close;
  `prefers-reduced-motion` collapses durations, keeps end states.
- **Naming.** Zones, params, and terms verbatim from the spec's F.1/F.2/F.3
  tables. Business rules and invariants cited by ID (BL1, I3) in comments and
  commit messages. Personas by name: Ana decides, Vera verifies, Atlas
  proposes.
