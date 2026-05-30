import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

// Dev-only plugin: adds /__audit endpoint that re-runs the scanner.
// The JSON file updates on disk, Vite HMR picks up the change.
function auditApiPlugin() {
  return {
    name: 'audit-api',
    configureServer(server: { middlewares: { use: (fn: unknown) => void } }) {
      server.middlewares.use(
        (
          req: { url?: string },
          res: {
            writeHead: (s: number, h: Record<string, string>) => void
            end: (b: string) => void
          },
          next: () => void,
        ) => {
          if (req.url === '/__audit') {
            try {
              execSync('node docs/scripts/audit.mjs', {
                cwd: resolve(__dirname, '..'),
                stdio: 'pipe',
              })
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              })
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ ok: false, error: String(e) }))
            }
          } else {
            next()
          }
        },
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), auditApiPlugin()],
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
