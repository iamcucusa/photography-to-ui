import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  base: '/photography-to-ui/switching-brain/',
  build: {
    outDir: resolve(__dirname, '../dist/switching-brain'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@tokens': resolve(__dirname, '../tokens'),
    },
  },
})
