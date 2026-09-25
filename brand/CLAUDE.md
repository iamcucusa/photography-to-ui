# brand/ — identity v2 playground

Rebrand in progress: a social-first palette, an Archivo + JetBrains Mono type system, and the LinkedIn surfaces built on them. **This folder is a playground to validate ideas**, not a package. Nothing consumes it, nothing in `npm run check` depends on it, and it is free to churn until the maintainer decides it is ready to replace `tokens/`.

This repository is public: the root `CLAUDE.md` → Disclosure rules apply here too. See Disclosure below for the one rule that shapes this folder.

## Where the work lives

Two places, with different jobs:

- **The Design canvas** (private, listed under `/artifacts` in Claude Code, or the claude.ai artifact gallery) is where the boards are looked at and edited by hand. Three pages: Brand identity, LinkedIn posts, LinkedIn banner. It is the design workspace and can drift ahead of this folder.
- **This folder** is the source of the *system*: the values, the rules, the generators that built every board, and the assets. It is what a Claude session, local or cloud, reads to know what the rebrand is.

When the two disagree, the canvas shows the latest thinking and this folder shows the last thing that was written down. Reconcile deliberately, in whichever direction the maintainer wants; do not assume either is authoritative.

## Files

| File | What it is |
|---|---|
| `palette.mjs` | The solver. Hue, saturation and a luminance target per step → hex. **Edit the spec here, never `palette.json`.** `node brand/palette.mjs` regenerates the JSON and prints the pairing report; `--check` exits 1 if the JSON is stale. |
| `palette.json` | Generated, DTCG-shaped. Each token carries luminance and its ratio on paper and on navy in a `com.cucusa.brand` extension. |
| `typography.json` | DTCG-shaped. Two families and three px scales (post 1080×1350, web, banner 1584×396) with the reasoning in each `$description`. Hand-authored. |
| `assets/` | The three logo SVGs (fill `currentColor`, named by index) and the profile photo. |
| `canvas/lib.mjs` | Shared pieces: colours from the solver, fonts, the `.dc.html` page skeleton, logos, avatar. |
| `canvas/build-brand.mjs` | Brand identity page: palette, contrast matrix, usable pairings, type system. |
| `canvas/build-posts.mjs` | LinkedIn posts page: four posts and the phone check. |
| `canvas/build-banners.mjs` | LinkedIn banner page: statement banner, three photo-checked variants, export frames, illustration review. |
| `canvas/build.mjs` | Runs all three into `canvas/dist/` (gitignored). |

## The system in one screen

**Colour.** Two grounds, paper `#FBFAF7` and navy `#10203A`. Four hues, magenta / sky / sand / slate, each with three steps solved to a luminance target so every step has one job: *deep* is text on paper and the ground under paper text (≥ 5.7:1); *mid* is lines, shapes and chart series, ≥ 3:1 on both grounds; *light* is text on navy and the ground under navy text (≥ 6:1). Same-hue stacks never pass. No step above Y 0.40, so nothing reads neon; saturation 64–80 %, so nothing reads pastel; fields are flat.

**Type.** Archivo (variable width and weight) at display sizes, JetBrains Mono at reading sizes, and mono never above the H2 step. Scales are fixed in px per surface because each surface is designed once and only scales down. The post floor is 36px (12px on a phone); the banner floor is 26px (13px on the desktop top card).

**Photography under type.** When the photo is the point, it stays the hero: 1:1 where the ratio allows, a flat navy tint of 20–30 % (never a gradient), and the subject's face is never covered. Type still never sits raw on the image: the headline runs as per-line navy highlight blocks, the punchline is a small magenta-deep block, longer text is a navy panel placed below the subject, and the author sits on a full-bleed navy band at the foot. Least coverage that keeps every pairing one from the matrix. Photos are canvas assets, not repo files, unless they are Grace's own.

**Banner geometry**, measured from the live profile: the top card is ~804px wide, the photo is ~168px there, which is a 330px circle at (60, 190) in banner px. Copy runs from x = 460 (560 without the photo) to 1540. The footer rule sits on the 288px grid line.

## Working here

- Change a colour by editing the spec in `palette.mjs`, then run it. The report tells you immediately which pairings still pass.
- Regenerate boards with `node brand/canvas/build.mjs`. Publishing them to the canvas is done from a Claude session with the Artifact tool; the avatar id in `canvas/lib.mjs` is the canvas's own asset id and must be updated if the photo is re-uploaded.
- Archivo loads from Google Fonts on the canvas. It needs self-hosting under `tokens/fonts/` before any of this enters `tokens/`.
- When this is ready to graduate: the values go into `tokens/` as a new mode or new primitive ramps, never by overwriting the photography-derived ramps without a decision; `npm run check:contrast` and `npm run validate` then take over from `palette.mjs --check`.

## Disclosure

The logo files are `logo-01/02/03.svg` and their accessible names are "Logo 1/2/3" on purpose. Do not rename them after the companies, and do not put company names in this folder, in the generators, or in commit messages. The board copy on the canvas is private; this folder is not.
