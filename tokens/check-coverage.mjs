/**
 * Token coverage checker — design system enforcement
 *
 * Discovers all workspace consumers from root package.json,
 * scans each for hardcoded values that should use tokens.
 * New consumers are automatically included — zero setup.
 *
 * Run: npm run check:coverage (from workspace root)
 * Exits non-zero if any consumer has violations.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Discover consumers ─────────────────────────────────────────────

function getConsumers() {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
  return (pkg.workspaces || []).filter((ws) => {
    // Skip the token package itself — it's the source, not a consumer
    if (ws === 'tokens') return false
    // Skip workspaces that don't exist
    return existsSync(resolve(ROOT, ws))
  })
}

// ── File discovery ─────────────────────────────────────────────────

function findFiles(dir, pattern) {
  if (!existsSync(dir)) return []
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name)
    if (entry.isDirectory() && !['node_modules', 'dist', '.git'].includes(entry.name)) {
      results.push(...findFiles(full, pattern))
    } else if (entry.isFile() && pattern.test(entry.name)) {
      results.push(full)
    }
  }
  return results
}

// ── Scan a single file ─────────────────────────────────────────────

function scanFile(filePath, relPath) {
  const content = readFileSync(filePath, 'utf-8')
  const violations = []

  // Skip generated files
  if (content.includes('Do not edit directly')) return violations

  // Strip comments, HTML entities, and import paths before scanning
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, '')  // block comments
    .replace(/\/\/.*$/gm, '')          // line comments
    .replace(/&#\w+;/g, '')           // HTML entities (&#10003; etc.)
    .replace(/from\s+['"][^'"]+['"]/g, '') // import paths

  const lines = stripped.split('\n')
  lines.forEach((line, i) => {
    const lineNum = i + 1
    const trimmed = line.trim()
    if (!trimmed) return

    // Hex colors
    const hexMatches = trimmed.match(/#[0-9a-fA-F]{3,8}\b/g)
    if (hexMatches) {
      for (const hex of hexMatches) {
        violations.push({ file: relPath, line: lineNum, type: 'hex', value: hex })
      }
    }

    // rgba/rgb — only match numeric values, not JSX template expressions
    const rgbaMatches = trimmed.match(/rgba?\(\s*\d[\d\s,.%/]*\)/g)
    if (rgbaMatches) {
      for (const rgba of rgbaMatches) {
        violations.push({ file: relPath, line: lineNum, type: 'rgba', value: rgba })
      }
    }

    // Inline color-mix (should be in tokens)
    const mixMatches = trimmed.match(/color-mix\([^)]+\)/g)
    if (mixMatches) {
      for (const mix of mixMatches) {
        violations.push({ file: relPath, line: lineNum, type: 'color-mix', value: mix.substring(0, 60) })
      }
    }
  })

  return violations
}

// ── Incremental mode ───────────────────────────────────────────────
// Only scan files changed since HEAD. Falls back to full scan if git
// fails or --full flag is passed. Scales O(changed files) not O(total).

function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only HEAD', { cwd: ROOT, encoding: 'utf-8' })
    return new Set(output.trim().split('\n').filter(Boolean))
  } catch {
    return null // git not available — full scan
  }
}

const fullMode = process.argv.includes('--full')

// ── Run ────────────────────────────────────────────────────────────

const consumers = getConsumers()
const changedFiles = fullMode ? null : getChangedFiles()

if (changedFiles !== null && changedFiles.size === 0) {
  console.log(`No files changed — skipping coverage check`)
  process.exit(0)
}

const mode = changedFiles === null ? 'full' : 'incremental'
console.log(`Checking token coverage (${mode}) for ${consumers.length} consumer(s): ${consumers.join(', ')}`)

let totalViolations = 0
let totalFiles = 0

for (const consumer of consumers) {
  const srcDir = resolve(ROOT, consumer, 'src')
  const allFiles = [
    ...findFiles(srcDir, /\.css$/),
    ...findFiles(srcDir, /\.tsx?$/),
  ]

  // In incremental mode, only scan changed files
  const filesToScan = changedFiles === null
    ? allFiles
    : allFiles.filter((f) => changedFiles.has(relative(ROOT, f)))

  const violations = []
  for (const file of filesToScan) {
    violations.push(...scanFile(file, relative(ROOT, file)))
  }

  totalFiles += filesToScan.length
  totalViolations += violations.length

  if (filesToScan.length === 0) {
    console.log(`  ✔ ${consumer}: no changed files`)
  } else if (violations.length === 0) {
    console.log(`  ✔ ${consumer}: ${filesToScan.length} files — no violations`)
  } else {
    console.log(`  ✗ ${consumer}: ${violations.length} violation(s)`)
    for (const v of violations) {
      console.log(`    ${v.file}:${v.line} — ${v.type}: ${v.value}`)
    }
  }
}

if (totalViolations > 0) {
  console.log(`\n✗ ${totalViolations} total violation(s) — use design tokens instead of hardcoded values`)
  process.exit(1)
} else {
  console.log(`\n✔ All ${consumers.length} consumer(s) pass — ${totalFiles} files scanned (${mode})`)
}
