import manifest from './assets-manifest.json'

/**
 * Asset resolution against the generated manifest (scripts/optimize-assets.mjs).
 * Keep this separate from the <Picture> component so the component file stays
 * component-only (react-refresh) — both <Picture> and CSS image-set() callers
 * resolve through here.
 */

type ManifestEntry = { widths: number[]; w: number; h: number }
const assets = manifest as Record<string, ManifestEntry>
const BASE = import.meta.env.BASE_URL

/** Reduce any incoming src (BASE-prefixed or CSS-style absolute) to its manifest key. */
function toKey(src: string): string {
  let s = src
  if (BASE && s.startsWith(BASE)) s = s.slice(BASE.length)
  const i = s.indexOf('assets/')
  return i >= 0 ? s.slice(i) : s.replace(/^\//, '')
}

function buildSrcSet(key: string, ext: string, widths: number[]): string {
  const stem = key.slice(0, key.lastIndexOf('.'))
  return widths.map((w) => `${BASE}${stem}-${w}w.${ext} ${w}w`).join(', ')
}

export interface ResolvedImage {
  avif: string
  webp: string
  w: number
  h: number
}

/** srcset strings + intrinsic size for <Picture>, or null if not optimized. */
export function resolveImage(src: string): ResolvedImage | null {
  const key = toKey(src)
  const entry = assets[key]
  if (!entry) return null
  return {
    avif: buildSrcSet(key, 'avif', entry.widths),
    webp: buildSrcSet(key, 'webp', entry.widths),
    w: entry.w,
    h: entry.h,
  }
}

/**
 * image-set() string for a CSS background, AVIF/WebP + original fallback.
 * Picks the smallest generated width >= targetWidth (else the largest).
 * Returns undefined if not in the manifest (caller keeps the plain url()).
 */
export function imageSetCss(src: string, targetWidth = 800): string | undefined {
  const key = toKey(src)
  const entry = assets[key]
  if (!entry) return undefined
  const stem = key.slice(0, key.lastIndexOf('.'))
  const w = entry.widths.find((x) => x >= targetWidth) ?? entry.widths[entry.widths.length - 1]
  const u = (ext: string) => `url('${BASE}${stem}-${w}w.${ext}')`
  return `image-set(${u('avif')} type('image/avif'), ${u('webp')} type('image/webp'), url('${src}'))`
}
