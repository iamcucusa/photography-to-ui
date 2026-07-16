// §H.3 initial-JS budget: 180 KB gzip for the entry graph (React, d3 modules,
// TanStack Query and Virtual, Zustand, app). The fixtures load as dynamic
// chunks after first paint and are excluded by construction: only scripts
// referenced from index.html (entry + modulepreload) count. Fails the build.

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(here, '../../dist/decision-surface')
const html = readFileSync(join(outDir, 'index.html'), 'utf8')

const files = [
  ...new Set(
    [...html.matchAll(/(?:src|href)="[^"]*\/(assets\/[^"]+\.js)"/g)].map((m) => m[1]),
  ),
]

if (files.length === 0) {
  console.error('check-bundle: no entry scripts found in index.html')
  process.exit(1)
}

const LIMIT = 180 * 1024
let total = 0
for (const file of files) {
  const gz = gzipSync(readFileSync(join(outDir, file))).length
  total += gz
  console.log(`  ${(gz / 1024).toFixed(1).padStart(7)} KB gz  ${file}`)
}
console.log(
  `check-bundle: initial JS ${(total / 1024).toFixed(1)} KB gzip (budget ${LIMIT / 1024} KB)`,
)
if (total > LIMIT) {
  console.error('check-bundle: FAIL — initial JS exceeds the §H.3 budget')
  process.exit(1)
}
