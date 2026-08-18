/**
 * Disclosure checker — public-repo governance enforcement
 *
 * This repository is public. Every tracked file and every commit message is
 * world-readable, and git history is not reliably erasable: redacting a line in
 * a later commit leaves the earlier blob intact and fetchable. This gate exists
 * so that class of content cannot land in the first place.
 *
 * Scans tracked text files (and, from a commit-msg hook, the pending message)
 * for two pattern sets:
 *
 *   1. GENERIC — committed, below. Job-process language that leaks the frame
 *      even when no company is named ("built for the X interview").
 *   2. LOCAL — optional, from `.disclosure-terms.local` (gitignored). Real
 *      company / recruiter names. This list is NEVER committed: a tracked file
 *      naming them is a public index of exactly what the gate exists to hide.
 *      Absent local file = generic patterns only, so CI never depends on it.
 *
 * Failure output names file and line but NEVER echoes the matched text. A CI
 * log is as public as the repo; a gate that prints "matched 'Acme'" leaks the
 * thing it is guarding. Run locally to see what tripped.
 *
 * WHAT THIS CANNOT CATCH: possessive and relational framing with no keyword in
 * it — "their stack", "their killer primitive", "the tool we built for them".
 * The sweep that motivated this gate found three such lines that every term
 * search missed. Treat a green run as "no known pattern", never as "clean".
 *
 * Run: npm run check:disclosure          (incremental, changed files only)
 *      npm run check:disclosure -- --full (all tracked files)
 *      node scripts/check-disclosure.mjs --commit-msg .git/COMMIT_EDITMSG
 *
 * Opt-out: a same-line `disclosure-ignore` comment, following the
 * `token-coverage-ignore` precedent in tokens/check-coverage.mjs. For content
 * that legitimately discusses hiring as a subject, or for a rule file that must
 * quote the terms it forbids.
 *
 * Zero dependencies. Exits non-zero on any match.
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const LOCAL_TERMS_FILE = resolve(ROOT, '.disclosure-terms.local')

// ── Generic patterns ───────────────────────────────────────────────
//
// Tuned against the real repository so legitimate prose passes. Specifically,
// all of these MUST NOT fire:
//   - the `case-study/` directory, `CaseStudy.tsx`, `case-study.css`
//   - "a frontend product engineering case study" (the deployed footer)
//   - "Case-Study Design Spec" (the spec title)
//   - "the client data layer" / "the client data" (client-side, a compound noun)
// which is why the list carries "case study for" and not "case study", and why
// the client pattern requires an agent reading rather than a bare match.

const GENERIC_PATTERNS = [
  { id: 'interview', re: /\binterviews?\b/gi },
  { id: 'recruiter', re: /\brecruiters?\b/gi },
  { id: 'take-home', re: /\btake-?home\b/gi },
  { id: 'hiring-manager', re: /\bhiring manager\b/gi },
  { id: 'job-description', re: /\bjob description\b/gi },
  { id: 'job-spec', re: /\bjob spec\b/gi },
  { id: 'built-for', re: /\bbuilt for\b/gi },
  { id: 'case-study-for', re: /\bcase study for\b/gi },
  { id: 'portfolio-case-for', re: /\bportfolio case for\b/gi },
  { id: 'client-work', re: /\bclient work\b/gi },
  // "the client" only as a party, never as "the client data layer". Matches a
  // possessive, or the noun followed by something a person does.
  {
    id: 'client-as-party',
    re: /\bthe client's\b|\bthe client\s+(?:asked|asks|wants?|wanted|requests?|requested|requires?|required|needs?|needed|said|says?|approved|specified|expects?|expected|agreed|signed)\b/gi,
  },
  // Case-sensitive: the acronym, never the "nda" inside "standard".
  { id: 'nda', re: /\bNDA\b/g },
]

// ── Exclusions ─────────────────────────────────────────────────────
//
// Documented noise sources. package-lock.json and contrast-data.json are
// generated; CSS carries --color-text-secondary and friends, which collided
// with an earlier, looser pattern set and have no prose in them.

const EXCLUDED_PATHS = new Set(['package-lock.json', 'docs/src/contrast-data.json'])

const EXCLUDED_EXT =
  /\.(css|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|eot|mp4|webm|pdf|zip)$/i

// The two files that define the patterns necessarily contain them. Excluding
// them is not a loophole, it is the same reason a dictionary may print the word
// it defines. Note the cost: prose in these two files is unscanned, so a real
// leak hidden in a comment here would pass. They are short and reviewed; every
// other file, including the CLAUDE.md that states the rules, stays scanned and
// uses same-line `disclosure-ignore` markers instead.
const SELF_EXCLUDED = new Set([
  '.disclosure-terms.example',
  'scripts/check-disclosure.mjs',
])

function isExcluded(relPath) {
  if (EXCLUDED_PATHS.has(relPath)) return true
  if (EXCLUDED_EXT.test(relPath)) return true
  if (SELF_EXCLUDED.has(relPath)) return true
  return false
}

// A NUL byte in the head of the file means binary. Cheaper and more reliable
// than an extension allowlist, and it catches anything the list misses.
function isBinary(buf) {
  const head = buf.subarray(0, 8000)
  return head.includes(0)
}

// ── Local term list ────────────────────────────────────────────────
//
// One term per line. Blank lines and `#` comments ignored. Terms are escaped
// and word-bound, so they match as words and never as substrings.

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function loadLocalTerms() {
  if (!existsSync(LOCAL_TERMS_FILE)) return []
  const lines = readFileSync(LOCAL_TERMS_FILE, 'utf-8').split('\n')
  const terms = []
  for (const raw of lines) {
    const line = raw.split('#')[0].trim()
    if (!line) continue
    terms.push(new RegExp(`\\b${escapeRegExp(line)}\\b`, 'gi'))
  }
  return terms
}

// ── Scanning ───────────────────────────────────────────────────────

function scanText(text, relPath, localTerms) {
  const violations = []
  const lines = text.split('\n')

  lines.forEach((line, i) => {
    // Same-line opt-out, per the token-coverage-ignore precedent.
    if (line.includes('disclosure-ignore')) return
    if (!line.trim()) return

    for (const { id, re } of GENERIC_PATTERNS) {
      re.lastIndex = 0
      if (re.test(line)) {
        violations.push({ file: relPath, line: i + 1, list: 'generic', id })
      }
    }

    for (const re of localTerms) {
      re.lastIndex = 0
      if (re.test(line)) {
        // No id, no term, no excerpt. The local list must not reach a CI log.
        violations.push({ file: relPath, line: i + 1, list: 'local', id: null })
      }
    }
  })

  return violations
}

function scanFile(absPath, relPath, localTerms) {
  let buf
  try {
    buf = readFileSync(absPath)
  } catch {
    return [] // deleted between git ls-files and now
  }
  if (isBinary(buf)) return []
  return scanText(buf.toString('utf-8'), relPath, localTerms)
}

// ── File discovery ─────────────────────────────────────────────────

function getTrackedFiles() {
  const out = execSync('git ls-files', { cwd: ROOT, encoding: 'utf-8', maxBuffer: 32 * 1024 * 1024 })
  return out.trim().split('\n').filter(Boolean)
}

function getChangedFiles() {
  try {
    const out = execSync('git diff --name-only HEAD', { cwd: ROOT, encoding: 'utf-8' })
    return new Set(out.trim().split('\n').filter(Boolean))
  } catch {
    return null // git unavailable — fall back to full scan
  }
}

// ── Run ────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const fullMode = argv.includes('--full')
const commitMsgIndex = argv.indexOf('--commit-msg')
const commitMsgPath = commitMsgIndex !== -1 ? argv[commitMsgIndex + 1] : null
// --raw: the input is a real commit message, not an editor template, so there
// is no git comment block to strip. Without this, a body line starting with `#`
// (a markdown heading) would be skipped — a silent false negative.
const rawMode = argv.includes('--raw')

const localTerms = loadLocalTerms()
const localLabel = localTerms.length
  ? `${localTerms.length} local term(s)`
  : 'no local term file (generic patterns only)'

const violations = []

if (commitMsgPath) {
  // Hook mode: the pending commit message is the only input. A message is as
  // public and as permanent as the diff it describes.
  const abs = resolve(ROOT, commitMsgPath)
  if (existsSync(abs)) {
    const source = readFileSync(abs, 'utf-8')
    // Strip the comment block git appends to the editor template, unless the
    // caller says this is already a real message (--raw).
    const text = rawMode
      ? source
      : source
          .split('\n')
          .filter((l) => !l.startsWith('#'))
          .join('\n')
    violations.push(...scanText(text, '(commit message)', localTerms))
  }
  console.log(`Checking disclosure (commit message) — ${localLabel}`)
} else {
  const changed = fullMode ? null : getChangedFiles()

  if (changed !== null && changed.size === 0) {
    console.log('No files changed — skipping disclosure check')
    process.exit(0)
  }

  const tracked = getTrackedFiles()
  const candidates = tracked
    .filter((f) => !isExcluded(f))
    .filter((f) => (changed === null ? true : changed.has(f)))

  const mode = changed === null ? 'full' : 'incremental'
  console.log(`Checking disclosure (${mode}) — ${candidates.length} file(s), ${localLabel}`)

  for (const relPath of candidates) {
    violations.push(...scanFile(resolve(ROOT, relPath), relPath, localTerms))
  }
}

// ── Report ─────────────────────────────────────────────────────────
//
// File and line only. Never the matched text: this output lands in a public
// CI log, and echoing the term would defeat the gate.

if (violations.length > 0) {
  console.log(`\n✗ ${violations.length} disclosure violation(s):`)
  for (const v of violations) {
    const what = v.list === 'generic' ? `generic pattern "${v.id}"` : 'local term list'
    console.log(`    ${v.file}:${v.line} — ${what}`)
  }
  console.log(`
Open each line and rewrite it. See CLAUDE.md → Disclosure rules.
Name the domain, not the employer. Real context belongs in .local/, never
in a tracked file or a commit message.

If a line legitimately discusses hiring as a subject, add a same-line
\`disclosure-ignore\` comment rather than weakening the pattern list.`)
  process.exit(1)
} else {
  console.log('\n✔ No disclosure violations')
  console.log('  Note: term matching cannot see possessive framing ("their stack",')
  console.log('  "the tool we built for them"). Green means no known pattern, not clean.')
}
