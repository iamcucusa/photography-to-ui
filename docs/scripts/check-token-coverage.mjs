/**
 * Docs token-coverage guard.
 *
 * Asserts the docs catalog (docs/src/App.tsx) renders EVERY token group defined
 * in the design-system source (tokens/*.json). New tokens can't land undocumented
 * — if a group isn't rendered, this fails.
 *
 * Coverage is checked at GROUP granularity because the catalog renders whole
 * groups via flattenTokens(...): color files are rendered wholesale; every other
 * file's top-level groups must each be rendered.
 *
 * Run: npm run check:docs-coverage (from workspace root; also in npm run check)
 * Zero dependencies. Exits non-zero on any uncovered group.
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TOKENS = resolve(__dirname, '../../tokens')
const APP = resolve(__dirname, '../src/App.tsx')

const load = (p) => JSON.parse(readFileSync(resolve(TOKENS, p), 'utf-8'))
const app = readFileSync(APP, 'utf-8')

const countLeaves = (obj) => {
  let n = 0
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue
    if (v && typeof v === 'object') n += v.$value !== undefined ? 1 : countLeaves(v)
  }
  return n
}

const topGroups = (obj) => Object.keys(obj).filter((k) => !k.startsWith('$'))

// A group is "rendered" if App.tsx references its data path (dot or bracket form).
const renders = (ident, group) =>
  app.includes(`${ident}.${group}`) ||
  app.includes(`${ident}['${group}']`) ||
  app.includes(`${ident}["${group}"]`)

const results = []

// Color files render wholesale — one reference covers the whole file.
const colorFiles = [
  ['color/primitives.json', 'colorPrimitives'], // primitives.color via the palette map
  ['color/semantic.json', 'semantic.color'],
  ['color/derived.json', 'derived.color'],
]
for (const [file, ref] of colorFiles) {
  const data = load(file)
  results.push({ group: file, tokens: countLeaves(data), covered: app.includes(ref) })
}

// Non-color files: each top-level group must be rendered individually.
const groupedFiles = {
  typography: 'typography.json',
  spacing: 'spacing.json',
  shape: 'shape.json',
  elevation: 'elevation.json',
  motion: 'motion.json',
  sizing: 'sizing.json',
  backdrop: 'backdrop.json',
}
for (const [ident, file] of Object.entries(groupedFiles)) {
  const data = load(file)
  for (const group of topGroups(data)) {
    results.push({
      group: `${file} → ${group}`,
      tokens: countLeaves(data[group]),
      covered: renders(ident, group),
    })
  }
}

const total = results.reduce((s, r) => s + r.tokens, 0)
const uncovered = results.filter((r) => !r.covered)

console.log(`Docs token coverage — ${results.length} groups, ${total} tokens`)
for (const r of results) {
  console.log(`  ${r.covered ? '✔' : '✗'} ${r.group} (${r.tokens})`)
}

if (uncovered.length) {
  const missing = uncovered.reduce((s, r) => s + r.tokens, 0)
  console.log(`\n✗ ${uncovered.length} group(s) / ${missing} tokens not rendered in docs/src/App.tsx`)
  process.exit(1)
} else {
  console.log(`\n✔ Full coverage — every source token group is documented`)
}
