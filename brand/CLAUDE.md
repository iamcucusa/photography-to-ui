# brand/ — identity v2 playground

Rebrand in progress: a social-first palette, an Archivo + JetBrains Mono type system, and the LinkedIn surfaces built on them. **This folder is a playground to validate ideas**, not a package. Nothing consumes it, nothing in `npm run check` depends on it, and it is free to churn until the maintainer decides it is ready to replace `tokens/`.

This repository is public: the root `CLAUDE.md` → Disclosure rules apply here too. See Disclosure below for the one rule that shapes this folder.

## Where the work lives

Three places, with different jobs. The canvases are private Design artifacts, listed under `/artifacts` in Claude Code or the claude.ai artifact gallery; they are where boards are looked at and edited by hand, and they can drift ahead of this folder.

- **The brand reference canvas** ("Cucusa Brand Identity v2"). Two pages: Brand identity (palette, pairings, contrast matrix, type system) and LinkedIn banner (statement banner, photo-checked variants, export frames, illustration review). It is frozen by intent: it rarely changes and **never receives a post**, so neither the maintainer nor a session pays to load it again.
- **The rolling posts canvas** (currently "Cucusa LinkedIn Posts 01"; `canvas/canvases.json` → `posts` is authoritative). The posts, the phone check, and new concepts. Every new post board goes here. At about 15 boards, start "02" and leave 01 as an archive; the index stays small and the browser renders fewer frames. `canvases.json` says which one is current.
- **This folder** is the source of the *system*: the values, the rules, the generators that built every board, and the assets. It is what a Claude session, local or cloud, reads to know what the rebrand is.

When a canvas and this folder disagree, the canvas shows the latest thinking and this folder shows the last thing that was written down. Reconcile deliberately, in whichever direction the maintainer wants; do not assume either is authoritative.

## Files

| File | What it is |
|---|---|
| `palette.mjs` | The solver. Hue, saturation and a luminance target per step → hex. **Edit the spec here, never `palette.json`.** `node brand/palette.mjs` regenerates the JSON and prints the pairing report; `--check` exits 1 if the JSON is stale. |
| `palette.json` | Generated, DTCG-shaped. Each token carries luminance and its ratio on paper and on navy in a `com.cucusa.brand` extension. |
| `typography.json` | DTCG-shaped. Two families and three px scales (post 1080×1350, web, banner 1584×396) with the reasoning in each `$description`. Hand-authored. |
| `assets/` | The three logo SVGs (fill `currentColor`, named by index) and the profile photo. |
| `canvas/canvases.json` | **Which canvas is which**: title and link of the reference canvas and the current posts canvas, the asset ids each one holds, and the archived posts canvases. The generators read it; a session reads it to know where to publish. |
| `canvas/lib.mjs` | Shared pieces: colours from the solver, fonts, the `.dc.html` page skeleton, logos, `CANVASES` + `asset(canvas, name)` from `canvases.json`. |
| `canvas/build-brand.mjs` | Reference canvas, Brand identity page: palette, contrast matrix, usable pairings, type system. |
| `canvas/build-posts.mjs` | Posts canvas: nine posts (including concepts A and C) and the phone check. Uses the posts canvas's asset ids; concept A cites its report through the `[SOURCE]` placeholder (see Disclosure). |
| `canvas/build-banners.mjs` | Reference canvas, LinkedIn banner page: statement banner, three photo-checked variants, export frames, illustration review. |
| `canvas/build.mjs` | Runs all three into `canvas/dist/` (gitignored). |

## The system in one screen

**Colour.** Two grounds, paper `#FBFAF7` and navy `#10203A`. Four hues, magenta / sky / sand / slate, each with three steps solved to a luminance target so every step has one job: *deep* is text on paper and the ground under paper text (≥ 5.7:1); *mid* is lines, shapes and chart series, ≥ 3:1 on both grounds; *light* is text on navy and the ground under navy text (≥ 6:1). Same-hue stacks never pass. No step above Y 0.40, so nothing reads neon; saturation 64–80 %, so nothing reads pastel; fields are flat.

**Type.** Archivo (variable width and weight) at display sizes, JetBrains Mono at reading sizes, and mono never above the H2 step. Scales are fixed in px per surface because each surface is designed once and only scales down. The post floor is 36px (12px on a phone); the banner floor is 26px (13px on the desktop top card).

**Photography under type.** When the photo is the point it stays the hero: 1:1 where the ratio allows, a flat navy tint of 40 % (never black, never a gradient), and the subject's face is never covered. Type may sit directly on the photo only where the tint leaves it navy-dark (a wall, a shadow), so paper text still clears 4.5:1 there; over anything lighter, or for longer text, it goes on a navy panel placed below the subject. Panels take a sky-deep header when they need one. The author sits on a full-bleed navy band at the foot. Photos are canvas assets, not repo files, unless they are Grace's own.

**Banner geometry**, measured from the live profile: the top card is ~804px wide, the photo is ~168px there, which is a 330px circle at (60, 190) in banner px. Copy runs from x = 460 (560 without the photo) to 1540. The footer rule sits on the 288px grid line.

## Working here

- Change a colour by editing the spec in `palette.mjs`, then run it. The report tells you immediately which pairings still pass.
- Regenerate boards with `node brand/canvas/build.mjs`. Publishing them is done from a Claude session with the Artifact tool: brand and banner boards to the reference canvas, post boards to the current posts canvas, never the other way round.
- Assets (avatar, post photos) live in each canvas's own asset store, so an id is only valid on the canvas it was uploaded to. `canvas/canvases.json` records the ids per canvas and the generators take them from there via `asset(canvas, name)`, which throws when an id is missing, so a board can never ship pointing at the wrong canvas. A re-upload means updating the id there.
- **Rolling over the posts canvas** (at about 15 boards). Works the same from a local or a cloud session, because everything it needs is in `canvases.json`:
  1. Create a new Design canvas titled with the next number ("Cucusa LinkedIn Posts 02").
  2. Copy every asset listed under `posts.assets` from the old canvas into the new one (Artifact publish with `asset: true`, `from_url` = old canvas, `asset_ids` = the ids). Each copy gets a new id.
  3. In `canvases.json`: move the old `posts` entry into `postsArchive`, write the new title, url and the new asset ids as `posts`.
  4. `node brand/canvas/build.mjs`, then publish only the boards you are adding to the new canvas. Old boards stay on the archive; nothing is moved.
  5. Commit `canvases.json` with the generator changes so the next session, wherever it runs, finds the current canvas.
- Archivo loads from Google Fonts on the canvas. It needs self-hosting under `tokens/fonts/` before any of this enters `tokens/`.
- When this is ready to graduate: the values go into `tokens/` as a new mode or new primitive ramps, never by overwriting the photography-derived ramps without a decision; `npm run check:contrast` and `npm run validate` then take over from `palette.mjs --check`.

## Disclosure

The logo files are `logo-01/02/03.svg` and their accessible names are "Logo 1/2/3" on purpose. Do not rename them after the companies, and do not put company names in this folder, in the generators, or in commit messages. The board copy on the canvas is private; this folder is not.

A post that cites a company keeps the name on the canvas only. Its generator carries a `[SOURCE]` placeholder where the name goes (see `Post-AI-Gap` in `canvas/build-posts.mjs`), so regenerating a board never publishes the name and the placeholder shows what to fill before republishing.
