import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { copyFileSync } from 'node:fs'

// GitHub Pages serves 404.html for unknown paths; copying index.html into it
// lets the History-API route /trial/:trialId deep-link on static hosting.
const spaFallback = () => ({
  name: 'spa-404-fallback',
  closeBundle() {
    const out = resolve(__dirname, '../dist/decision-surface')
    copyFileSync(resolve(out, 'index.html'), resolve(out, '404.html'))
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
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
