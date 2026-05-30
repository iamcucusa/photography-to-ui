#!/bin/bash
# Full audit: scanner + AI insights + commit
# Called by the Rescan button in docs or via: npm run audit:full

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

echo "→ Running audit scanner..."
node docs/scripts/audit.mjs

echo "→ Updating strategic insights via Claude..."
claude -p "Read docs/src/audit-data.json (the fresh scan results) and docs/src/audit-insights.json (the current insights). Update audit-insights.json to reflect the current state of the design system. Keep the same JSON structure (lastReviewed, reviewer, summary, priorities, strengths, risks). Set lastReviewed to today's date. Be accurate — base your assessment on the actual scan data, not assumptions. Write the file directly." --allowedTools 'Read,Write'

echo "→ Formatting..."
npx prettier --write docs/src/audit-insights.json 2>/dev/null || true

echo "→ Committing..."
git add docs/src/audit-data.json docs/src/audit-insights.json
git commit -m "chore: update design system audit (scanner + insights)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>" || echo "Nothing to commit"

echo "✔ Audit complete"
