/**
 * Design System Audit Scanner
 *
 * Scans the codebase for token usage, hardcoded values, and accessibility
 * patterns. Writes structured JSON consumed by the docs audit page.
 *
 * Run: npm run audit (from workspace root)
 * Output: docs/src/audit-data.json
 *
 * This produces METRICS only — counts, lists, coverage percentages.
 * Strategic interpretation lives in audit-insights.json (agent-written).
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../..')

// ── File discovery ─────────────────────────────────────────────────

function findFiles(dir, pattern) {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
      results.push(...findFiles(full, pattern))
    } else if (entry.isFile() && pattern.test(entry.name)) {
      results.push(full)
    }
  }
  return results
}

function readFile(path) {
  return readFileSync(path, 'utf-8')
}

function rel(path) {
  return relative(ROOT, path)
}

// Consumers discovered from the workspace, like check-coverage.mjs — new
// consumers are audited automatically, zero setup.
function getConsumers() {
  const pkg = JSON.parse(readFile(resolve(ROOT, 'package.json')))
  return (pkg.workspaces || []).filter((ws) => ws !== 'tokens')
}

function consumerSrcFiles(pattern) {
  const files = []
  for (const consumer of getConsumers()) {
    try {
      files.push(...findFiles(resolve(ROOT, consumer, 'src'), pattern))
    } catch {
      // consumer without a src dir — skip
    }
  }
  return files
}

// ── Token source analysis ──────────────────────────────────────────

// Walk the DTCG tree properly: a token is a leaf with $value, and it counts
// as described only when that same leaf carries a $description. (The old
// regex count inflated coverage with group-level descriptions and conflated
// base tokens with mode overrides.)
function walkTokenTree(obj) {
  let tokens = 0
  let described = 0
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue
    if (value && typeof value === 'object') {
      if ('$value' in value) {
        tokens += 1
        if ('$description' in value) described += 1
      } else {
        const nested = walkTokenTree(value)
        tokens += nested.tokens
        described += nested.described
      }
    }
  }
  return { tokens, described }
}

function analyzeTokenSource() {
  const tokenDir = resolve(ROOT, 'tokens')
  const jsonFiles = findFiles(tokenDir, /\.json$/).filter(f => !f.includes('package.json'))

  let totalTokens = 0
  let totalDescribed = 0
  let modeOverrideTokens = 0
  const fileStats = []

  for (const file of jsonFiles) {
    const { tokens, described } = walkTokenTree(JSON.parse(readFile(file)))
    const isModeOverride = relative(tokenDir, file).startsWith('modes/')
    if (isModeOverride) {
      modeOverrideTokens += tokens
    } else {
      totalTokens += tokens
      totalDescribed += described
    }
    fileStats.push({
      file: relative(tokenDir, file),
      tokens,
      described,
      coverage: tokens > 0 ? Math.round((described / tokens) * 100) : 100,
    })
  }

  return {
    totalTokens,
    totalDescribed,
    modeOverrideTokens,
    descriptionCoverage: Math.round((totalDescribed / totalTokens) * 100),
    files: fileStats,
  }
}

// ── CSS analysis ───────────────────────────────────────────────────

function analyzeCssFiles() {
  const cssFiles = consumerSrcFiles(/\.css$/).filter(f => !f.includes('tokens.css'))

  const results = {
    tokenUsage: { colors: 0, spacing: 0, typography: 0, font: 0, motion: 0, shape: 0, shadow: 0 },
    hardcoded: { hex: [], rgba: [], colorMix: [], durations: [], fontSizes: [] },
    breakpoints: [],
    layoutConstraints: [],
    totalTokenReferences: 0,
    filesScanned: [],
  }

  for (const file of cssFiles) {
    const content = readFile(file)
    const filePath = rel(file)
    results.filesScanned.push(filePath)

    // Token usage counts
    results.tokenUsage.colors += (content.match(/var\(--color-/g) || []).length
    results.tokenUsage.spacing += (content.match(/var\(--space-/g) || []).length
    results.tokenUsage.typography += (content.match(/var\(--text-/g) || []).length
    results.tokenUsage.font += (content.match(/var\(--font-/g) || []).length
    results.tokenUsage.motion += (content.match(/var\(--duration-|var\(--easing-/g) || []).length
    results.tokenUsage.shape += (content.match(/var\(--radius-|var\(--divider-|var\(--focus-ring/g) || []).length
    results.tokenUsage.shadow += (content.match(/var\(--shadow-/g) || []).length

    // Hardcoded hex colors (not in comments)
    const hexMatches = content.match(/(?<!\/\*.*?)#[0-9a-fA-F]{3,8}(?!.*?\*\/)/g) || []
    for (const hex of hexMatches) {
      results.hardcoded.hex.push({ file: filePath, value: hex })
    }

    // Hardcoded rgba
    const rgbaMatches = content.match(/rgba?\([^)]+\)/g) || []
    for (const rgba of rgbaMatches) {
      results.hardcoded.rgba.push({ file: filePath, value: rgba })
    }

    // Inline color-mix
    const mixMatches = content.match(/color-mix\([^)]+\)/g) || []
    for (const mix of mixMatches) {
      results.hardcoded.colorMix.push({ file: filePath, value: mix })
    }

    // Breakpoints in media queries
    const mediaMatches = [...content.matchAll(/@media\s*\([^)]*?(\d+px)[^)]*\)/g)]
    for (const m of mediaMatches) {
      results.breakpoints.push({ file: filePath, value: m[1], query: m[0].trim() })
    }
  }

  results.totalTokenReferences = Object.values(results.tokenUsage).reduce((a, b) => a + b, 0)
  return results
}

// ── Accessibility scan ─────────────────────────────────────────────

function analyzeAccessibility() {
  const tsxFiles = consumerSrcFiles(/\.tsx$/)

  const results = {
    components: [],
    totalAriaAttributes: 0,
    totalInteractiveElements: 0,
  }

  for (const file of tsxFiles) {
    const content = readFile(file)
    const filePath = rel(file)

    const ariaCount = (content.match(/aria-\w+/g) || []).length
    const roleCount = (content.match(/role="/g) || []).length
    const buttonCount = (content.match(/<button/g) || []).length
    const inputCount = (content.match(/<input/g) || []).length
    const aCount = (content.match(/<a\s/g) || []).length
    const interactiveCount = buttonCount + inputCount + aCount
    const ariaLabelCount = (content.match(/aria-label/g) || []).length
    const ariaPressedCount = (content.match(/aria-pressed/g) || []).length
    const ariaExpandedCount = (content.match(/aria-expanded/g) || []).length

    if (interactiveCount > 0 || ariaCount > 0) {
      results.components.push({
        file: filePath,
        interactive: interactiveCount,
        buttons: buttonCount,
        inputs: inputCount,
        links: aCount,
        ariaTotal: ariaCount,
        ariaLabels: ariaLabelCount,
        ariaPressed: ariaPressedCount,
        ariaExpanded: ariaExpandedCount,
        roles: roleCount,
      })
    }

    results.totalAriaAttributes += ariaCount
    results.totalInteractiveElements += interactiveCount
  }

  return results
}

// ── CSS state coverage ─────────────────────────────────────────────

function analyzeStateCoverage() {
  const cssFiles = consumerSrcFiles(/\.css$/).filter(f => !f.includes('tokens.css'))

  const results = []

  for (const file of cssFiles) {
    const content = readFile(file)
    const filePath = rel(file)

    const hover = (content.match(/:hover/g) || []).length
    const focus = (content.match(/:focus/g) || []).length
    const active = (content.match(/:active/g) || []).length
    const disabled = (content.match(/:disabled|--disabled/g) || []).length

    if (hover + focus + active + disabled > 0) {
      results.push({ file: filePath, hover, focus, active, disabled })
    }
  }

  return results
}

// ── Run audit ──────────────────────────────────────────────────────

const audit = {
  timestamp: new Date().toISOString(),
  tokenSource: analyzeTokenSource(),
  cssAnalysis: analyzeCssFiles(),
  accessibility: analyzeAccessibility(),
  stateCoverage: analyzeStateCoverage(),
}

// Compute score
const scores = {
  tokenCoverage: audit.tokenSource.descriptionCoverage,
  zeroHardcodedColors: audit.cssAnalysis.hardcoded.hex.length === 0 && audit.cssAnalysis.hardcoded.rgba.length === 0 ? 100 : Math.max(0, 100 - audit.cssAnalysis.hardcoded.hex.length * 5 - audit.cssAnalysis.hardcoded.rgba.length * 5),
  zeroInlineColorMix: audit.cssAnalysis.hardcoded.colorMix.length === 0 ? 100 : 0,
  ariaPresence: audit.accessibility.totalAriaAttributes > 0 ? Math.min(100, Math.round((audit.accessibility.totalAriaAttributes / Math.max(1, audit.accessibility.totalInteractiveElements)) * 100)) : 0,
}
audit.score = Math.min(100, Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length))
audit.scores = scores

const outPath = resolve(__dirname, '../src/audit-data.json')
writeFileSync(outPath, JSON.stringify(audit, null, 2))
console.log(`Audit complete → ${relative(ROOT, outPath)}`)
console.log(`Score: ${audit.score}/100 | Tokens: ${audit.tokenSource.totalTokens} | Token refs: ${audit.cssAnalysis.totalTokenReferences}`)
