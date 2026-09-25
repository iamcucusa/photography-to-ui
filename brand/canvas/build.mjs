/** Regenerate every board into brand/canvas/dist/. See brand/CLAUDE.md for how they reach the canvas. */
await import('./build-brand.mjs')
await import('./build-posts.mjs')
await import('./build-banners.mjs')
