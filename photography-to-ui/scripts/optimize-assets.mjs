/**
 * Image asset optimizer — generates responsive AVIF + WebP derivatives next to
 * the original rasters in public/assets, and writes a manifest the <Picture>
 * helper reads. Originals are NEVER modified.
 *
 * Why a build script (not vite-imagetools): assets live in public/ and are
 * referenced by runtime URL strings (import.meta.env.BASE_URL) + CSS url(),
 * incl. post data in src/post/data/mockPosts.ts. vite-imagetools only processes
 * assets imported in src/. A sibling-derivative script keeps the public/ +
 * BASE_URL flow and the runtime data layer untouched.
 *
 * Output:
 *   <name>.<ext>  ->  <name>-<width>w.avif / <name>-<width>w.webp  (per width <= source)
 *   src/assets-manifest.json — { "assets/rel/path.jpg": { widths:[...], w, h } }
 *
 * The derivatives are gitignored + regenerated (mtime-skip = fast re-runs).
 * The manifest IS committed (small metadata, not an image): it lets <Picture>
 * build an exact srcset that only references widths that were actually
 * generated, so no <source> ever 404s.
 *
 * Run: npm run optimize:assets   (auto-runs via predev/prebuild)
 * Tunable knobs: WIDTHS, AVIF_QUALITY, WEBP_QUALITY below.
 */

import { readdirSync, statSync, existsSync, writeFileSync } from 'node:fs'
import { resolve, dirname, join, extname, basename, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = resolve(__dirname, '../public')
const ASSETS_DIR = resolve(PUBLIC_DIR, 'assets')
const MANIFEST_PATH = resolve(__dirname, '../src/assets-manifest.json')

// ── Tunable knobs ──────────────────────────────────────────────────
// Responsive ladder (px). A source is emitted only at widths <= its own width
// (never upscaled). Quality is tuned for photography; raise for crisper output.
const WIDTHS = [400, 800, 1280, 1920]
const AVIF_QUALITY = 50
const WEBP_QUALITY = 75
const SOURCE_EXT = /\.(jpe?g|png)$/i
// Skip the legacy hand-made responsive variants (…_120px.jpg … _400px.jpg) —
// the generated ladder from the master replaces them (one mechanism, not two).
const LEGACY_VARIANT = /_\d+px\.(jpe?g|png)$/i

function findSources(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...findSources(full))
    else if (entry.isFile() && SOURCE_EXT.test(entry.name) && !LEGACY_VARIANT.test(entry.name))
      out.push(full)
  }
  return out
}

const isDerivative = (file) => /-\d+w\.(avif|webp)$/i.test(file)
const isFresh = (src, out) => existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs

const sources = findSources(ASSETS_DIR).filter((f) => !isDerivative(f))
let generated = 0
let skipped = 0
const manifest = {}

for (const src of sources) {
  const dir = dirname(src)
  const ext = extname(src)
  const name = basename(src, ext)
  const meta = await sharp(src).metadata()
  const srcW = meta.width || Math.max(...WIDTHS)

  // widths <= source (no upscale); always at least the source's own width
  let targets = WIDTHS.filter((w) => w < srcW)
  targets.push(srcW)
  targets = [...new Set(targets)].sort((a, b) => a - b)

  for (const w of targets) {
    for (const [fmt, opts] of [
      ['avif', { quality: AVIF_QUALITY }],
      ['webp', { quality: WEBP_QUALITY }],
    ]) {
      const out = join(dir, `${name}-${w}w.${fmt}`)
      if (isFresh(src, out)) {
        skipped++
        continue
      }
      await sharp(src).resize({ width: w, withoutEnlargement: true })[fmt](opts).toFile(out)
      generated++
    }
  }

  const relPath = relative(PUBLIC_DIR, src).split('\\').join('/')
  manifest[relPath] = { widths: targets, w: srcW, h: meta.height || 0 }
}

// Stable key order so the committed manifest has a deterministic diff
const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(MANIFEST_PATH, JSON.stringify(sorted, null, 2) + '\n')

console.log(
  `optimize-assets: ${generated} generated, ${skipped} fresh — ${sources.length} sources, ` +
    `AVIF q${AVIF_QUALITY} / WebP q${WEBP_QUALITY} — manifest: src/assets-manifest.json`,
)
