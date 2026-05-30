import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  base: '/photography-to-ui/docs/',
  build: {
    outDir: resolve(__dirname, '../dist/docs'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@tokens': resolve(__dirname, '../tokens'),
    },
  },
})
