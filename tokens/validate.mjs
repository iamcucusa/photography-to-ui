/**
 * Token source integrity validator
 *
 * Checks: DTCG structure, $description coverage, duplicate names,
 * reference resolution, extension schema correctness.
 *
 * Run: npm run validate (from workspace root)
 * Zero dependencies. Exits non-zero on failure.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const VALID_TYPES = new Set([
  'color', 'dimension', 'fontFamily', 'fontWeight', 'duration',
  'cubicBezier', 'number', 'shadow', 'border', 'transition',
  'gradient', 'typography', 'strokeStyle',
])
const VALID_EXTENSIONS = new Set(['com.cucusa.colorMix', 'com.cucusa.platform'])

const errors = []
const warnings = []
const allTokenPaths = new Map() // path → file (for duplicate + ref checking)

function err(file, path, msg) { errors.push(`${file} → ${path}: ${msg}`) }
function warn(file, path, msg) { warnings.push(`${file} → ${path}: ${msg}`) }

// ── Find JSON files ────────────────────────────────────────────────

function findJsonFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'package.json' || entry.name.startsWith('.')) continue
    const full = resolve(dir, entry.name)
    if (
      entry.isDirectory() &&
      entry.name !== 'node_modules' &&
      entry.name !== 'dist' &&
      entry.name !== 'modes'
    ) {
      // modes/ holds sparse per-mode overrides of base paths — validated
      // separately (parity check), never in the base walk where their
      // duplicate paths would be flagged.
      results.push(...findJsonFiles(full))
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(full)
    }
  }
  return results
}

// ── Walk token tree ────────────────────────────────────────────────

function walkTokens(obj, path, file, inheritedType) {
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue
    if (typeof val !== 'object' || val === null) {
      err(file, `${path}.${key}`, `unexpected primitive value: ${JSON.stringify(val)}`)
      continue
    }

    const tokenPath = path ? `${path}.${key}` : key
    const type = val.$type || inheritedType

    if (val.$value !== undefined) {
      // It's a token
      validateToken(val, tokenPath, file, type)

      // Register for duplicate + ref checking
      const cssName = `--${tokenPath.replace(/\./g, '-')}`
      if (allTokenPaths.has(tokenPath)) {
        err(file, tokenPath, `duplicate token path (also in ${allTokenPaths.get(tokenPath)})`)
      }
      allTokenPaths.set(tokenPath, file)
    } else {
      // It's a group — recurse
      walkTokens(val, tokenPath, file, type)
    }
  }
}

// ── Validate individual token ──────────────────────────────────────

function validateToken(token, path, file, type) {
  // $type must be valid DTCG
  if (type && !VALID_TYPES.has(type)) {
    err(file, path, `unknown $type: "${type}"`)
  }

  // $description is required
  if (!token.$description) {
    err(file, path, 'missing $description')
  }

  // $value must exist (already guaranteed by caller, but be safe)
  if (token.$value === undefined) {
    err(file, path, 'missing $value')
  }

  // Validate extensions
  if (token.$extensions) {
    for (const ns of Object.keys(token.$extensions)) {
      if (!VALID_EXTENSIONS.has(ns)) {
        err(file, path, `unknown extension namespace: "${ns}"`)
      }
    }

    // colorMix schema check
    const mix = token.$extensions['com.cucusa.colorMix']
    if (mix) {
      if (!mix.space) err(file, path, 'colorMix missing "space"')
      if (!mix.color1) err(file, path, 'colorMix missing "color1"')
      if (!mix.amount1) err(file, path, 'colorMix missing "amount1"')
      if (!mix.color2 && mix.color2 !== 'transparent') err(file, path, 'colorMix missing "color2"')
    }

    // platform schema check
    const platform = token.$extensions['com.cucusa.platform']
    if (platform) {
      if (!platform.css) err(file, path, 'platform extension missing "css" key')
    }
  }

  // Collect refs from $value for resolution check (only string values)
  if (typeof token.$value === 'string') {
    collectRefs(token.$value, path, file)
  }
}

// ── Collect references for later resolution ────────────────────────

const allRefs = [] // { ref, path, file }

function collectRefs(value, path, file) {
  const matches = value.matchAll(/\{([^}]+)\}/g)
  for (const m of matches) {
    allRefs.push({ ref: m[1], path, file })
  }
}

// ── Run ────────────────────────────────────────────────────────────

const jsonFiles = findJsonFiles(__dirname)
let tokenCount = 0

for (const file of jsonFiles) {
  const relPath = relative(__dirname, file)
  let data
  try {
    data = JSON.parse(readFileSync(file, 'utf-8'))
  } catch (e) {
    err(relPath, '(root)', `invalid JSON: ${e.message}`)
    continue
  }
  walkTokens(data, '', relPath, undefined)
}

tokenCount = allTokenPaths.size

// Resolve all references
for (const { ref, path, file } of allRefs) {
  if (!allTokenPaths.has(ref)) {
    err(file, path, `unresolved reference: {${ref}}`)
  }
}

// Also collect refs from colorMix extensions
for (const file of jsonFiles) {
  const relPath = relative(__dirname, file)
  let data
  try { data = JSON.parse(readFileSync(file, 'utf-8')) } catch { continue }
  checkExtensionRefs(data, '', relPath)
}

function checkExtensionRefs(obj, path, file) {
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue
    if (typeof val !== 'object' || val === null) continue
    const tokenPath = path ? `${path}.${key}` : key
    if (val.$extensions?.['com.cucusa.colorMix']) {
      const mix = val.$extensions['com.cucusa.colorMix']
      for (const field of ['color1', 'color2']) {
        const v = mix[field]
        if (v && v.startsWith('{') && v.endsWith('}')) {
          const ref = v.slice(1, -1)
          if (!allTokenPaths.has(ref)) {
            err(file, tokenPath, `colorMix.${field} unresolved reference: ${v}`)
          }
        }
      }
    }
    if (val.$value === undefined) {
      checkExtensionRefs(val, tokenPath, file)
    }
  }
}

// ── Mode parity ────────────────────────────────────────────────────
// Sparse overrides in modes/<mode>/ must (1) override only paths that exist
// in the base source, (2) cover every must-flip path — a missing override
// means dark values silently leaking into that mode.

const MUST_FLIP = {
  light: [
    'color.bg.canvas',
    'color.bg.surface',
    'color.text.primary',
    'color.text.secondary',
    'color.text.muted',
    'color.text.accent',
    'color.text.cool',
    // color.accent and color.text.on-accent are constant across modes by design
  ],
}

const modesDir = resolve(__dirname, 'modes')
let modeFileCount = 0
let modeTokenCount = 0

function walkModeTokens(obj, path, file, modePaths) {
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue
    if (typeof val !== 'object' || val === null) continue
    const tokenPath = path ? `${path}.${key}` : key
    if (val.$value !== undefined) {
      modePaths.add(tokenPath)
      if (!allTokenPaths.has(tokenPath)) {
        err(file, tokenPath, 'mode override has no matching base token')
      }
      if (!val.$description) {
        err(file, tokenPath, 'missing $description')
      }
      if (typeof val.$value === 'string') {
        const refs = val.$value.matchAll(/\{([^}]+)\}/g)
        for (const m of refs) {
          if (!allTokenPaths.has(m[1])) {
            err(file, tokenPath, `unresolved reference: {${m[1]}}`)
          }
        }
      }
    } else {
      walkModeTokens(val, tokenPath, file, modePaths)
    }
  }
}

try {
  for (const modeEntry of readdirSync(modesDir, { withFileTypes: true })) {
    if (!modeEntry.isDirectory()) continue
    const mode = modeEntry.name
    const modePaths = new Set()
    for (const file of findJsonFiles(resolve(modesDir, mode))) {
      const relPath = relative(__dirname, file)
      modeFileCount++
      let data
      try {
        data = JSON.parse(readFileSync(file, 'utf-8'))
      } catch (e) {
        err(relPath, '(root)', `invalid JSON: ${e.message}`)
        continue
      }
      walkModeTokens(data, '', relPath, modePaths)
    }
    modeTokenCount += modePaths.size
    for (const required of MUST_FLIP[mode] || []) {
      if (!modePaths.has(required)) {
        err(`modes/${mode}`, required, `must-flip token not overridden in ${mode} mode`)
      }
    }
  }
} catch {
  // no modes/ directory — single-mode system, nothing to check
}

// ── Report ─────────────────────────────────────────────────────────

console.log(`Validated ${tokenCount} tokens across ${jsonFiles.length} files`)
if (modeFileCount > 0) {
  console.log(`Validated ${modeTokenCount} mode overrides across ${modeFileCount} mode files`)
}

if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} warning(s):`)
  warnings.forEach(w => console.log(`  ${w}`))
}

if (errors.length) {
  console.log(`\n✗ ${errors.length} error(s):`)
  errors.forEach(e => console.log(`  ${e}`))
  process.exit(1)
} else {
  console.log('✔ All checks passed')
}
