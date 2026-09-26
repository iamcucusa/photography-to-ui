/**
 * Regenerate every board into brand/canvas/dist/. Brand + banner boards belong on the reference
 * canvas, post boards on the rolling posts canvas. See brand/CLAUDE.md → Where the work lives.
 */
await import('./build-brand.mjs')
await import('./build-posts.mjs')
await import('./build-banners.mjs')
