import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { copyFileSync, mkdirSync } from 'node:fs'

// Static-hosting fallbacks. GitHub Pages only honors the SITE-ROOT 404.html
// (photography-to-ui/public/404.html forwards deep links here as ?p=,
// restored pre-paint in index.html); the subdir 404 copy is for hosts with
// per-directory fallbacks. The case-study route additionally gets a REAL
// index.html so the shareable portfolio URL serves HTTP 200 with no redirect.
const spaFallback = () => ({
  name: 'spa-404-fallback',
  closeBundle() {
    const out = resolve(__dirname, '../dist/decision-surface')
    copyFileSync(resolve(out, 'index.html'), resolve(out, '404.html'))
    mkdirSync(resolve(out, 'case-study'), { recursive: true })
    copyFileSync(resolve(out, 'index.html'), resolve(out, 'case-study/index.html'))
  },
})

export default defineConfig({
  plugins: [react(), spaFallback()],
  base: '/photography-to-ui/decision-surface/',
  build: {
    outDir: resolve(__dirname, '../dist/decision-surface'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@tokens': resolve(__dirname, '../tokens'),
    },
  },
  test: {
    // Pure layers run in node; the App smoke test opts into jsdom per-file
    // via a `@vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
