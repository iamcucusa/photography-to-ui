# @cucusa/tokens

The Cucusa design system. W3C DTCG-compliant token source with Style Dictionary 4 build pipeline.

## What this package is

The single source of truth for all design decisions: color, typography, spacing, shape, elevation, and motion. Photography inputs (urban, architectural, natural) inform the color palettes. Every consumer of this design system imports from here.

This package is self-contained and extractable. It contains everything needed to generate platform-specific output: DTCG JSON source, SD4 build config, custom transforms, font files, and @font-face declarations.

## Commands

```
npm run build        # Generate CSS from DTCG JSON (runs sd.config.mjs)
npm run validate     # Check DTCG integrity — structure, descriptions, refs, extensions
```

From the workspace root:
```
npm run tokens       # Same as build, via workspace
npm run validate     # Same as validate, via workspace
```

## Files

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
| `fonts.css` | @font-face declarations for JetBrains Mono | CSS (not DTCG) |
| `fonts/` | Self-hosted woff2 files | Binary assets |
| `sd.config.mjs` | Style Dictionary 4 build config + 7 custom transforms | Build tooling |
| `dist/tokens.css` | AUTO-GENERATED CSS custom properties — consumed by all apps | Build output |

## Extension namespaces

Two custom extensions handle values DTCG can't express natively:

**`com.cucusa.colorMix`** — structured color derivation recipe. Generates `color-mix()` CSS while keeping a pre-resolved hex `$value` as DTCG fallback.

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

**`com.cucusa.platform`** — per-platform value overrides for CSS functions (`clamp()`, `calc()`, `min()`, `max()`).

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

Rules:
- `$value` must always be valid DTCG — it's what non-CSS consumers get
- `com.cucusa.platform.css` is a CSS-only override for runtime functions
- The platform transform runs first — takes precedence over type-specific transforms
- Future platforms add sibling keys: `{ "css": "...", "ios": "..." }`

## How to add a token

1. Choose the right file based on the token category (see table above)
2. Add the token with `$value`, `$type` (or inherit from group), and `$description`
3. If the value needs a CSS function, add `$extensions.com.cucusa.platform.css`
4. If the value is a color derivation, add `$extensions.com.cucusa.colorMix`
5. Run `npm run tokens && npm run format` from the workspace root
6. Verify visually in consuming apps

Every token MUST have a `$description`. This is consumed by the docs app to generate the token catalog.

**After any token change, run `npm run validate` before committing.** This is mandatory — CI will reject the push if validation fails.

## How to add a new consumer

1. Create a directory at the workspace root with its own `package.json`
2. Add it to root `package.json` `workspaces` array
3. Add `@tokens` alias to `vite.config.ts` and `tsconfig.json` paths (see existing consumers)
4. Import `@tokens/dist/tokens.css` for CSS custom properties
5. Import `@tokens/fonts.css` for @font-face declarations
6. All CSS custom properties are available via `var(--token-name)`

For non-CSS platforms, add a new platform block in `sd.config.mjs`. The `$value` fields contain valid DTCG fallbacks. Platform extensions can add sibling keys per platform.

## Build pipeline

Read the ordering and guard documentation in `sd.config.mjs` before adding transforms. Key constraints:
- `cucusa/platform-css` must run before all type-specific transforms
- Every type-specific transform must guard against platform overrides via `hasPlatformOverride()`
- `color/css` (SD4 built-in) must be last

## Token values at a glance

- **Colors**: Five palettes × 5 stops. Semantic roles map intent to primitives. Derived tokens use `color-mix()`. Dark mode only.
- **Typography**: JetBrains Mono. Weights: 400/500/600. Perfect Fifth scale (1.5 ratio): `--text-xs` through `--text-xxl`, plus `--display-xl`.
- **Spacing**: `--space-xs` (0.25rem) through `--space-xl` (4rem), doubling progression.
- **Shape**: `--radius-sm/md`, `--divider-subtle/strong`, `--focus-ring-*`.
- **Elevation**: `--shadow-1/2/soft/hover/glow-accent`.
- **Motion**: `--duration-micro/fast/normal/slow/crossfade/blink`, `--easing-default/emphasized`.

Do not introduce raw hex values, magic px for spacing/font-size, or new tokens without approval.
