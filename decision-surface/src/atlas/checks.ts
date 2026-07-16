// Agent Atlas (P3): reads the same typed tier the UI reads — never rendered
// views, never human-filtered data (feature matrix) — and emits Findings
// (§G.4). Triggered only by shared-state change (I5). The two MVP checks
// (§H.2): a rank carried by a single weight, and the top 5 reordering under
// benchmark-only provenance. The data-spec scenario probes (S1, S3) are the
// acceptance tests for these checks.

import type { CountryCode3, EvidenceFamily, Finding, RankingVariable } from '../types'
import type { Fixtures } from '../data/decode'
import {
  computeComposites,
  computeRanking,
  computeStats,
  filterByProvenance,
  type MetricStats,
} from '../data/derive'
import { defaultState } from '../state/url'

// A top-5 country that falls at least this many places when one variable is
// removed is carried by that weight (tuned against the data-spec S1 probe).
const CARRIER_DROP = 6
const TOP_N = 5

const FAMILY_OF_METRIC: Record<string, EvidenceFamily> = {
  totalSites: 'footprint',
  totalInvestigators: 'footprint',
  multiTrialInvestigators: 'footprint',
  historicalMedianEnrollmentRate: 'enrollment-performance',
  predictedEnrollmentRate: 'enrollment-performance',
  performanceRatio: 'enrollment-performance',
  medianStartupTime: 'timelines',
  predictedStartupTime: 'timelines',
  siteToSiteVariability: 'timelines',
}

// BL5: a finding without derivedFrom and suggestedState is invalid and never
// renders. Validation is the contract, not a formality (Flow C step 3).
export function validateFinding(finding: Finding): boolean {
  return (
    typeof finding.id === 'string' &&
    finding.id.length > 0 &&
    typeof finding.claim === 'string' &&
    finding.claim.trim().length > 0 &&
    Array.isArray(finding.derivedFrom) &&
    finding.derivedFrom.length > 0 &&
    finding.derivedFrom.every(
      (pair) =>
        Array.isArray(pair) &&
        pair.length === 2 &&
        typeof pair[0] === 'string' &&
        typeof pair[1] === 'string',
    ) &&
    finding.suggestedState !== null &&
    typeof finding.suggestedState === 'object' &&
    typeof finding.suggestedState.trialId === 'string'
  )
}

// Flow C re-run semantics: stale 'proposed' findings are replaced; 'accepted'
// and 'rejected' persist and suppress re-proposing the same finding (BL6 —
// the next run learns from the answers).
export function mergeFindings(previous: Finding[], fresh: Finding[]): Finding[] {
  const answered = previous.filter((f) => f.status !== 'proposed')
  const answeredIds = new Set(answered.map((f) => f.id))
  return [...answered, ...fresh.filter((f) => !answeredIds.has(f.id))]
}

function statsByCountry(
  fixtures: Fixtures,
  provenance: 'all' | 'benchmark',
): Map<CountryCode3, MetricStats> {
  const byCountry = new Map<CountryCode3, ReturnType<typeof filterByProvenance>>()
  for (const o of fixtures.observations) {
    const list = byCountry.get(o.countryCode)
    if (list) list.push(o)
    else byCountry.set(o.countryCode, [o])
  }
  const predictions = new Map(fixtures.predictions.map((p) => [p.countryCode, p]))
  const stats = new Map<CountryCode3, MetricStats>()
  for (const code of fixtures.trial.candidateCountries) {
    stats.set(
      code,
      computeStats(
        filterByProvenance(byCountry.get(code) ?? [], provenance),
        predictions.get(code)!,
      ),
    )
  }
  return stats
}

function countryName(fixtures: Fixtures, code: CountryCode3): string {
  return fixtures.countries.find((c) => c.code === code)?.name ?? code
}

// §C check 1: "is the rank carried by a single weight?" For every top-5
// country, remove each variable in turn (weights renormalized) and measure
// the fall. Analysis over typed fields only.
function checkSingleWeightCarrier(
  fixtures: Fixtures,
  variables: RankingVariable[],
  trialId: string,
): Finding[] {
  const stats = statsByCountry(fixtures, 'all')
  const baseRanking = computeRanking(computeComposites(stats, variables))
  const findings: Finding[] = []
  const topCountries = [...baseRanking.entries()].filter(([, rank]) => rank <= TOP_N)
  for (const [code, baseRank] of topCountries) {
    for (const variable of variables) {
      if (variable.weight === 0) continue
      const remaining = variables.filter((v) => v.id !== variable.id)
      const total = remaining.reduce((sum, v) => sum + v.weight, 0)
      if (total === 0) continue
      const renormalized = remaining.map((v) => ({ ...v, weight: v.weight / total }))
      const without = computeRanking(computeComposites(stats, renormalized))
      const drop = without.get(code)! - baseRank
      if (drop >= CARRIER_DROP) {
        const name = countryName(fixtures, code)
        const suggestedState = defaultState(trialId)
        suggestedState.evidenceFamily = FAMILY_OF_METRIC[variable.metricKey] ?? 'footprint'
        suggestedState.highlight = [code]
        findings.push({
          id: `finding-carrier-${code}`,
          claim:
            `${name} ranks #${baseRank} on the strength of one variable — ` +
            `${variable.title.toLowerCase()}. Without that weight it falls to ` +
            `#${without.get(code)!}.`,
          derivedFrom: [
            [code, variable.metricKey],
            [code, 'ranking'],
          ],
          suggestedState,
          status: 'proposed',
        })
      }
    }
  }
  return findings
}

// §C check 3: "does the top 5 flip under benchmark-only?" Rank the same
// candidate set from benchmark-only stats and compare the top 5.
function checkProvenanceFlip(
  fixtures: Fixtures,
  variables: RankingVariable[],
  trialId: string,
): Finding[] {
  const baseRanking = computeRanking(computeComposites(statsByCountry(fixtures, 'all'), variables))
  const benchRanking = computeRanking(
    computeComposites(statsByCountry(fixtures, 'benchmark'), variables),
  )
  const codes = [...baseRanking.keys()]
  const baseTop = new Set(codes.filter((c) => baseRanking.get(c)! <= TOP_N))
  const benchTop = new Set(codes.filter((c) => benchRanking.get(c)! <= TOP_N))
  const movers = codes
    .filter((c) => baseTop.has(c) !== benchTop.has(c))
    .sort((a, b) => a.localeCompare(b))
  if (movers.length === 0) return []
  const biggest = movers.reduce((best, c) =>
    Math.abs(benchRanking.get(c)! - baseRanking.get(c)!) >
    Math.abs(benchRanking.get(best)! - baseRanking.get(best)!)
      ? c
      : best,
  )
  const suggestedState = defaultState(trialId)
  suggestedState.provenance = 'benchmark'
  suggestedState.highlight = movers
  return [
    {
      id: 'finding-provenance-flip',
      claim:
        `The top ${TOP_N} changes under benchmark-only trials: ` +
        `${countryName(fixtures, biggest)} moves from #${baseRanking.get(biggest)!} ` +
        `to #${benchRanking.get(biggest)!}.`,
      derivedFrom: movers.map((c) => [c, 'ranking'] as [string, string]),
      suggestedState,
      status: 'proposed',
    },
  ]
}

// Flow C: run the checks over the full, unfiltered typed tier and emit only
// findings a human can verify in one click. Invalid findings are discarded
// here and never render (BL5) — no partial cards.
export function runAtlas(
  fixtures: Fixtures,
  variables: RankingVariable[],
  trialId: string,
): Finding[] {
  const candidates = [
    ...checkSingleWeightCarrier(fixtures, variables, trialId),
    ...checkProvenanceFlip(fixtures, variables, trialId),
  ]
  return candidates.filter(validateFinding)
}
