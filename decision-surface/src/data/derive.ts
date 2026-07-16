// The derived tier (§G.0): CountryMetrics rows, CountryDistribution, and the
// rank algorithm. Computed on demand from the grain, never stored (BL10, L3/L4).
// Read-only for every actor (I4).

import type {
  CountryCode3,
  CountryDistribution,
  CountryMetrics,
  Observation,
  Prediction,
  Provenance,
  RankingVariable,
  SortOrder,
  TimeUnit,
} from '../types'
import type { Fixtures } from './decode'
import { withBudget } from './budget'

// The nine derivable numeric fields of a country row (data-spec §4).
export type MetricStats = Pick<
  CountryMetrics,
  | 'totalSites'
  | 'totalInvestigators'
  | 'multiTrialInvestigators'
  | 'historicalMedianEnrollmentRate'
  | 'predictedEnrollmentRate'
  | 'performanceRatio'
  | 'medianStartupTime'
  | 'predictedStartupTime'
  | 'siteToSiteVariability'
>

// §G.1 writes: weights land as {id, weight}[] in shared state; the data
// layer applies them onto the fixture defaults before recomputing.
export function applyWeights(
  variables: RankingVariable[],
  writes: { id: string; weight: number }[] | null,
): RankingVariable[] {
  if (!writes) return variables
  const byId = new Map(writes.map((w) => [w.id, w.weight]))
  return variables.map((v) => (byId.has(v.id) ? { ...v, weight: byId.get(v.id)! } : v))
}

export function filterByProvenance(obs: Observation[], provenance: Provenance): Observation[] {
  if (provenance === 'all') return obs
  const wantBenchmark = provenance === 'benchmark'
  return obs.filter((o) => o.benchmark === wantBenchmark)
}

function median(sorted: number[]): number {
  const n = sorted.length
  if (n === 0) return 0
  const mid = Math.floor(n / 2)
  return n % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// Exclusive-method quartiles ((n+1) interpolation) — the same method the
// fixture validator uses, so the data-spec scenario probes and Atlas's
// checks agree on every number.
export function quartiles(sorted: number[]): { q1: number; q3: number } {
  const n = sorted.length
  const q = (p: number): number => {
    const idx = p * (n + 1) - 1
    if (idx < 0) return sorted[0]
    if (idx >= n - 1) return sorted[n - 1]
    const lo = Math.floor(idx)
    return sorted[lo] + (sorted[lo + 1] - sorted[lo]) * (idx - lo)
  }
  return { q1: q(0.25), q3: q(0.75) }
}

function perSiteMeanEnrollment(obs: Observation[]): number[] {
  const bySite = new Map<string, { sum: number; n: number }>()
  for (const o of obs) {
    const acc = bySite.get(o.siteId) ?? { sum: 0, n: 0 }
    acc.sum += o.enrollmentRatePSM
    acc.n += 1
    bySite.set(o.siteId, acc)
  }
  return [...bySite.values()].map((s) => s.sum / s.n).sort((a, b) => a - b)
}

// One truth-source per metric (§G.1): each field has exactly this derivation.
export function computeStats(obs: Observation[], prediction: Prediction): MetricStats {
  if (obs.length === 0) {
    throw new Error(`computeStats: no observations for ${prediction.countryCode}`)
  }
  const sites = new Set<string>()
  const trialsByInvestigator = new Map<string, Set<string>>()
  const rates: number[] = []
  const ratios: number[] = []
  const startups: number[] = []
  for (const o of obs) {
    sites.add(o.siteId)
    rates.push(o.enrollmentRatePSM)
    ratios.push(o.enrollmentRatePSM / o.targetEnrollmentRatePSM)
    startups.push(o.startupDays)
    for (const inv of o.investigatorIds) {
      const trials = trialsByInvestigator.get(inv) ?? new Set<string>()
      trials.add(o.sourceTrialId)
      trialsByInvestigator.set(inv, trials)
    }
  }
  rates.sort((a, b) => a - b)
  ratios.sort((a, b) => a - b)
  startups.sort((a, b) => a - b)
  const siteMeans = perSiteMeanEnrollment(obs)
  const siteMedian = median(siteMeans)
  const { q1, q3 } = quartiles(siteMeans)
  let multiTrial = 0
  for (const trials of trialsByInvestigator.values()) {
    if (trials.size > 1) multiTrial += 1
  }
  return {
    totalSites: sites.size,
    totalInvestigators: trialsByInvestigator.size,
    multiTrialInvestigators: multiTrial,
    historicalMedianEnrollmentRate: median(rates),
    predictedEnrollmentRate: prediction.predictedEnrollmentRatePSM,
    performanceRatio: median(ratios),
    medianStartupTime: median(startups),
    predictedStartupTime: prediction.predictedStartupDays,
    siteToSiteVariability: siteMedian === 0 ? 0 : (q3 - q1) / siteMedian,
  }
}

// The rank algorithm (§G.1, BL1), deterministic:
// 1. per variable, min-max normalize the metric across candidates to [0, 1]
// 2. Inverse contribution uses 1 − normalized
// 3. composite = Σ weight · normalized
// 4. rank = dense rank of the composite, descending; ties alphabetical by code
export function computeComposites(
  statsByCountry: ReadonlyMap<CountryCode3, MetricStats>,
  variables: RankingVariable[],
): Map<CountryCode3, number> {
  const codes = [...statsByCountry.keys()]
  const composites = new Map<CountryCode3, number>(codes.map((c) => [c, 0]))
  for (const variable of variables) {
    // C4 guarantees metricKey names a derivable numeric field
    const key = variable.metricKey as keyof MetricStats
    const values = codes.map((c) => statsByCountry.get(c)![key])
    const lo = Math.min(...values)
    const hi = Math.max(...values)
    codes.forEach((code, i) => {
      let normalized = hi > lo ? (values[i] - lo) / (hi - lo) : 0.5
      if (variable.contribution === 'Inverse') normalized = 1 - normalized
      composites.set(code, composites.get(code)! + variable.weight * normalized)
    })
  }
  return composites
}

export function computeRanking(
  composites: ReadonlyMap<CountryCode3, number>,
): Map<CountryCode3, number> {
  const order = [...composites.keys()].sort(
    (a, b) => composites.get(b)! - composites.get(a)! || a.localeCompare(b),
  )
  const ranking = new Map<CountryCode3, number>()
  let rank = 0
  let previous: number | undefined
  for (const code of order) {
    const value = composites.get(code)!
    if (value !== previous) {
      rank += 1
      previous = value
    }
    ranking.set(code, rank)
  }
  return ranking
}

export interface DeriveInputs {
  fixtures: Fixtures
  provenance: Provenance
  variables: RankingVariable[]
  selected: ReadonlySet<CountryCode3>
}

// The row tier (§G.1): what the list and Atlas both read. Rank is computed
// over provenance 'all' and the full candidate set, so human filters never
// change a country's rank (BL1).
export function deriveCountryRows(inputs: DeriveInputs): CountryMetrics[] {
  return withBudget('deriveCountryRows', 50, () => {
    const { fixtures, provenance, variables, selected } = inputs
    const byCountry = new Map<CountryCode3, Observation[]>()
    for (const o of fixtures.observations) {
      const list = byCountry.get(o.countryCode)
      if (list) list.push(o)
      else byCountry.set(o.countryCode, [o])
    }
    const predictions = new Map(fixtures.predictions.map((p) => [p.countryCode, p]))
    const names = new Map(fixtures.countries.map((c) => [c.code, c.name]))
    const statsAll = new Map<CountryCode3, MetricStats>()
    for (const code of fixtures.trial.candidateCountries) {
      const prediction = predictions.get(code)
      if (!prediction) throw new Error(`deriveCountryRows: no prediction for ${code}`)
      statsAll.set(code, computeStats(byCountry.get(code) ?? [], prediction))
    }
    const ranking = computeRanking(computeComposites(statsAll, variables))
    return fixtures.trial.candidateCountries.map((code) => {
      const stats =
        provenance === 'all'
          ? statsAll.get(code)!
          : computeStats(
              filterByProvenance(byCountry.get(code) ?? [], provenance),
              predictions.get(code)!,
            )
      return {
        id: code,
        countryCode: code,
        countryName: names.get(code) ?? code,
        provenance,
        ranking: ranking.get(code)!,
        selected: selected.has(code),
        ...stats,
      }
    })
  })
}

// §G.2 derived series. Quartiles over per-site mean enrollment; buckets over
// startupDays (bucketSize 100 for days, re-bucketed on unit switch).
const BUCKETS: Record<TimeUnit, { size: number; divisor: number }> = {
  days: { size: 100, divisor: 1 },
  weeks: { size: 14, divisor: 7 },
  months: { size: 3, divisor: 30.44 },
}

export function deriveDistribution(
  observations: Observation[],
  countryCode: CountryCode3,
  provenance: Provenance,
  unit: TimeUnit,
  outliers: boolean,
): CountryDistribution {
  const obs = filterByProvenance(
    observations.filter((o) => o.countryCode === countryCode),
    provenance,
  )
  let siteMeans = perSiteMeanEnrollment(obs)
  if (!outliers && siteMeans.length > 0) {
    const { q1, q3 } = quartiles(siteMeans)
    const fence = 1.5 * (q3 - q1)
    siteMeans = siteMeans.filter((v) => v >= q1 - fence && v <= q3 + fence)
  }
  const { q1, q3 } = quartiles(siteMeans)
  const average =
    siteMeans.length === 0 ? 0 : siteMeans.reduce((sum, v) => sum + v, 0) / siteMeans.length
  const { size, divisor } = BUCKETS[unit]
  const counts = new Map<number, number>()
  for (const o of obs) {
    const bucket = Math.floor(o.startupDays / divisor / size)
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
  }
  const indices = [...counts.keys()].sort((a, b) => a - b)
  const last = indices.length > 0 ? indices[indices.length - 1] : -1
  const x: string[] = []
  const y: number[] = []
  for (let i = 0; i <= last; i += 1) {
    x.push(`${i * size}–${(i + 1) * size - 1}`)
    y.push(counts.get(i) ?? 0)
  }
  return {
    countryCode,
    quartiles: {
      min: siteMeans[0] ?? 0,
      q1,
      median: median(siteMeans),
      q3,
      max: siteMeans[siteMeans.length - 1] ?? 0,
      average,
    },
    buckets: { unit, bucketSize: size, x, y },
  }
}

// View-level helpers: sorting and filtering shape human views only — Atlas
// reads the unfiltered rows (feature matrix).
export function sortRows(
  rows: CountryMetrics[],
  sortField: string,
  sortOrder: SortOrder,
): CountryMetrics[] {
  const field = sortField as keyof CountryMetrics
  // 'ranking' is 1-best, so "descending" means best-first (the F.2 default
  // ranking:desc renders the answer first) — invert the numeric comparison.
  const direction = field === 'ranking' ? -sortOrder : sortOrder
  return [...rows].sort((a, b) => {
    const va = a[field]
    const vb = b[field]
    let cmp: number
    if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb
    else cmp = String(va).localeCompare(String(vb))
    return cmp * direction || a.countryCode.localeCompare(b.countryCode)
  })
}

export function filterRows(
  rows: CountryMetrics[],
  filterText: string,
  countriesScope: 'all' | 'selected',
): CountryMetrics[] {
  const text = filterText.trim().toLowerCase()
  return rows.filter(
    (row) =>
      (countriesScope === 'all' || row.selected) &&
      (text === '' || row.countryName.toLowerCase().includes(text)),
  )
}
