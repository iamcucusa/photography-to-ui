# cucusa

A design token system and the consumers built on it. W3C DTCG JSON is the single source of truth; Style Dictionary 4 compiles it to CSS custom properties; three deployed apps consume the output. Token integrity, color contrast, token coverage, and documentation coverage are enforced by gates that run in CI before the build and block the deploy on failure.

Photography informs the palettes. The engineering is the point.

## Live surfaces

All three build into one `dist/` and deploy as a single GitHub Pages site.

- **[Token catalog and audit dashboard](https://iamcucusa.github.io/photography-to-ui/docs/)** shows every token rendered from the DTCG source, with its `$description`, its resolved value in both modes, and the `color-mix()` recipe for derived colors. Second tab is a design-system health page. **Start here if you are evaluating the design system.**
- **[Playground](https://iamcucusa.github.io/photography-to-ui/)** is the art-direction surface. Interactive explorers for typography, color roles, interaction states, and system structure.
- **[The Switching Brain](https://iamcucusa.github.io/photography-to-ui/switching-brain/)** is an SVG and d3-force visualization built as a design system consumer, to test whether the tokens hold up under a piece that is mostly motion.

## Workspaces

npm workspaces. Node 24.18.0, pinned in `.nvmrc` and read by CI from the same file.

| Directory | Package | What it is |
|---|---|---|
| `tokens/` | `@cucusa/tokens` | DTCG source, Style Dictionary 4 build, self-hosted JetBrains Mono |
| `photography-to-ui/` | `photography-to-ui` | Playground, component explorers, post domain model |
| `docs/` | `@cucusa/docs` | Token catalog and audit dashboard |
| `switching-brain/` | `@cucusa/switching-brain` | Data visualization consumer, carries its own `d3-force` dependency |

All packages are `private`. Nothing is published to a registry. Consumers resolve `@tokens` by path alias in `vite.config.ts` and `tsconfig.json`, which is why there is no versioning or release process to describe.

## Token architecture

### Source

W3C DTCG JSON, hand-authored, single source of truth. **119 tokens across 10 files**, plus **32 light-mode overrides across 4 files** under `tokens/modes/light/`.

```
tokens/color/primitives.json   25    tokens/motion.json      8
tokens/color/semantic.json      9    tokens/shape.json       7
tokens/color/derived.json      38    tokens/elevation.json   5
tokens/typography.json         17    tokens/spacing.json     5
                                     tokens/sizing.json      3
                                     tokens/backdrop.json    2
```

`npm run validate` prints those counts.

**Description coverage is 100 percent, and it is enforced rather than achieved.** `tokens/validate.mjs` raises a hard error on any token missing `$description`, in both the base walk and the mode walk. A token cannot land undescribed. The same validator rejects unknown `$type` values, unknown extension namespaces, malformed derivation recipes, unresolved references, and duplicate token paths.

### Build

Style Dictionary 4, one config: `tokens/sd.config.mjs`. Two builds share one nine-step transform chain:

```
attribute/cti → name/kebab → cucusa/platform-css → cucusa/color-mix
→ cucusa/shadow-css → cucusa/border-css → cucusa/duration-css
→ cucusa/easing-css → cucusa/font-family-css → color/css
```

The ordering is a contract, not an accident, and it is documented in the file at `tokens/sd.config.mjs:8-35`: `cucusa/platform-css` replaces `$value` with a raw CSS string, so it must run before every type-specific transform, and each of those carries a `hasPlatformOverride` guard so it never tries to parse that string as a DTCG composite. Read that comment block if you read nothing else in this repository.

### Two custom extension namespaces

`com.cucusa.colorMix` holds a structured derivation recipe (`space`, `color1`, `amount1`, `color2`, `amount2`) rather than a flattened result. It compiles to CSS `color-mix()` with token references preserved as `var(--…)`.

The consequence is architectural. A derived color whose recipe references a semantic token **re-derives through the CSS cascade in light mode** instead of being re-emitted. That is why the light output stays sparse: 32 variables, not 119. Change `--color-bg-canvas` and every color mixed into it follows, in both modes, with no rebuild of the derived layer.

`com.cucusa.platform` is a per-platform raw-CSS escape hatch for values DTCG cannot express, such as `clamp()`. The token's `$value` must still hold a valid DTCG fallback, so non-CSS consumers are not stranded.

### Output

Two CSS files. There is no JS, JSON, iOS, Android, or Figma output.

| File | Selector | Variables |
|---|---|---|
| `tokens/dist/tokens.css` | `:root` | 119 |
| `tokens/dist/tokens.light.css` | `[data-theme='light']` | 32 |

`$description` is emitted as a trailing comment on every generated variable, so the metadata survives the build and is readable in devtools:

```css
--color-sky-1: #0d1b2a; /** Deepest — canvas background */
--color-bg-translucent: color-mix(in srgb, var(--color-bg-canvas) 85%, transparent); /** Canvas at 85% — card backgrounds */
```

Both files are committed. `npm run check` rebuilds them and fails if the committed output does not match the source.

### Consumers

Each app imports `@tokens/dist/tokens.css` and `@tokens/fonts.css`, either from its TypeScript entrypoint or via CSS `@import`.

The docs consumer does something different: it imports the **raw DTCG JSON** and renders the catalog from it (`docs/src/App.tsx`). The documentation is generated from the source of truth, not transcribed alongside it. A token that changes shape changes the catalog. A token group that is never rendered fails `check:docs-coverage`.

## Theming

Dark is the default and carries no attribute. Light is `[data-theme='light']` on `<html>`.

The DOM attribute is the single source of truth. An inline script in each `index.html` reads `localStorage` and sets it before first paint, so there is no flash. `useTheme` then reads and mutates that attribute through `useSyncExternalStore` over a `MutationObserver`; React holds no parallel copy of the mode.

Parity is enforced. `tokens/validate.mjs` holds a `MUST_FLIP` list, and a mode that fails to override `color.bg.canvas`, `color.text.primary`, `backdrop.photo-opacity`, or any of the other listed paths fails the build. This is the check that stops dark values leaking silently into light mode. Mode overrides are also verified to target paths that exist in the base source, so a typo cannot create a phantom token.

`switching-brain` opts out. Its `index.html` pins `data-theme="dark"` and it does not import `tokens.light.css` at all, because glow-on-dark is the piece. The reason is written in the file next to the decision. A design system that no consumer can decline is a constraint, not a system.

## Quality gates

`npm run check` is the gate. CI runs it before `npm run build:all`, so a non-zero exit stops the deploy. That is 40 lines of `.github/workflows/deploy.yml` and worth reading.

| Gate | Rejects |
|---|---|
| `validate` | Missing `$description`, unknown `$type`, unknown extension namespace, malformed recipe, unresolved reference, duplicate token path, broken mode parity |
| `check:staleness` | A committed `tokens/dist` that does not match a fresh build |
| `check:contrast` | Any token pairing below its WCAG threshold, in either mode |
| `check:coverage` | Hardcoded hex, rgba, or `color-mix` in any consumer's `src` |
| `check:docs-coverage` | A source token group not rendered in the catalog |
| `check:disclosure` | Third-party and client references in tracked files and commit messages |
| `tsc --noEmit` | Type errors. `strict`, plus `noUnusedLocals` and `noUnusedParameters`, in every consumer |
| `eslint .` | ESLint 9 flat config, shared across the workspace |
| `prettier --check` | Formatting drift |

Every gate is a dependency-free Node script. Three are worth describing.

**The contrast contract** (`npm run check:contrast`) is 56 checks across both modes. It loads the DTCG source, applies the mode overrides, resolves references and `colorMix` recipes to concrete RGB, composites alpha over the surface under test, then asserts 4.5:1 for text and 3:1 for non-text interactive signals per WCAG 1.4.11. It tests worst-case composites, not just flat pairs: text on a panel over a photograph, and text on a sheet over the visualization's own bright nodes. A token edit cannot silently break either mode.

**The coverage gate** discovers consumers from the `workspaces` array in `package.json`, so a new consumer is governed with zero setup. It has a documented per-line opt-out, `token-coverage-ignore`, for lines that render token values as documentation content rather than using them as styling. The gate distinguishes the two instead of being switched off.

**The docs coverage guard** means tokens cannot land undocumented. It fails if any source token group is missing from the catalog.

## Accessibility

What is actually enforced:

- **`eslint-plugin-jsx-a11y`**, flat recommended: 34 rules active, 31 at error severity.
- **The contrast contract**, above, blocking the deploy.
- `@typescript-eslint/no-explicit-any` at error.

Present as convention, not gated: `prefers-reduced-motion` handling, semantic HTML, `aria-expanded` / `aria-pressed` / `aria-label`, and a `:focus-visible` ring system.

There is no axe, pa11y, Lighthouse CI, Playwright, visual regression, or screen-reader test matrix. Visual regression is a deferred decision, recorded as one.

## Running it locally

```bash
npm install            # npm workspaces; Node 24.18.0 per .nvmrc

npm run dev            # playground        port 5173
npm run dev:docs       # token catalog     port 5174
npm run dev:brain      # switching-brain   port 5175

npm run tokens         # rebuild tokens/dist from DTCG source
npm run validate       # DTCG integrity, references, descriptions, mode parity
npm run check:contrast # 56 WCAG checks across dark and light

npm run check          # the full gate CI runs before deploying
npm run build:all      # tokens, then every consumer, into dist/
```

One thing to expect: `npm run dev` runs a `predev` step that shells out to `sharp` to generate responsive AVIF and WebP derivatives, so the first run is slow and depends on `sharp` installing cleanly. `npm run check` and `npm run build:all` cover every workspace in the repository.

There is no `npm test` at the root.

## Scope

This is a token system with consumers, not a product and not a component library. The boundaries are deliberate:

- **Not a component library.** No shared component package, no published artifact. The consumers share tokens, not components.
- **Not distributed.** Every workspace is private and resolved by path alias. No registry, no versioning, no release process.
- **Not a multi-platform pipeline.** The build emits CSS. Adding a platform means adding a Style Dictionary target, which the transform chain is structured for, but that target does not exist and is not claimed.
- **Not fully tokenized, on purpose.** Color, typography, spacing, shape, elevation, and motion are tokenized. Breakpoints are not: 5 values across 22 media queries, left alone until the responsive strategy is settled rather than frozen into tokens early. `npm run audit` reports the current count.
- **Not tested, in the three consumers documented here.** Correctness is held by types, lint, and the gates above.

## License

Code is MIT, see [LICENSE](LICENSE).

Visual assets are all rights reserved. Photography, patterns, and derived visual works under `photography-to-ui/public/assets/**` are not licensed for reuse. See [photography-to-ui/ASSETS_LICENSE.md](photography-to-ui/ASSETS_LICENSE.md).
