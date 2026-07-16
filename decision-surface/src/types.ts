// The §G contract shapes, named exactly as the design spec names them.
// No parallel or renamed shapes anywhere else in the app.

export type CountryCode3 = string

export type Provenance = 'all' | 'benchmark' | 'non-benchmark'
export type CountriesScope = 'all' | 'selected'
export type EvidenceFamily = 'footprint' | 'enrollment-performance' | 'timelines'
export type TimeUnit = 'days' | 'weeks' | 'months'
export type SortOrder = 1 | -1

// §G.0 — the source grain: how one site performed in one source historical trial.
export interface Observation {
  id: string
  siteId: string
  countryCode: CountryCode3
  sourceTrialId: string
  benchmark: boolean
  enrollmentRatePSM: number
  targetEnrollmentRatePSM: number
  startupDays: number
  investigatorIds: string[]
}

// §G.0 — generated independently of the observations (data-spec L2).
export interface Prediction {
  countryCode: CountryCode3
  predictedEnrollmentRatePSM: number
  predictedStartupDays: number
}

// §G.1 — one typed record per country and provenance scope; never stored.
export interface CountryMetrics {
  id: string
  countryName: string
  countryCode: CountryCode3
  provenance: Provenance
  ranking: number
  totalSites: number
  totalInvestigators: number
  multiTrialInvestigators: number
  historicalMedianEnrollmentRate: number
  predictedEnrollmentRate: number
  performanceRatio: number
  medianStartupTime: number
  predictedStartupTime: number
  siteToSiteVariability: number
  selected: boolean
}

// §G.1 — the weight vector; all weights are fractions summing to 1 (BL3 at 100%).
export interface RankingVariable {
  id: string
  name: string
  title: string
  metricKey: keyof CountryMetrics
  weight: number
  isDefault: boolean
  varType: 'Binary' | 'Numeric'
  contribution: 'Direct' | 'Inverse'
}

// §G.2 — derived series the distribution views render.
export interface CountryDistribution {
  countryCode: CountryCode3
  quartiles: { q1: number; median: number; q3: number; average: number; min: number; max: number }
  buckets: { unit: TimeUnit; bucketSize: number; x: string[]; y: number[] }
}

// §G.2 — the windowed evidence contract (keyset, never offset).
export interface SitePage {
  rows: Observation[]
  nextCursor: string | null
}

// §G.3 — the shareable unit of work, always serialized in the URL (BL7).
// The list scrolls continuously; scroll position is never state (F.2), so
// the list's shareable intent is its sort and filter only.
export interface InvestigationState {
  trialId: string
  provenance: Provenance
  countriesScope: CountriesScope
  evidenceFamily: EvidenceFamily
  list: { sortField: string; sortOrder: SortOrder; filterText: string }
  distribution: { countryCode: CountryCode3; outliers: boolean; unit: TimeUnit } | null
  sites: { sortField: string; sortOrder: SortOrder } | null
  highlight: CountryCode3[]
}

// §G.4 — how Atlas speaks. A finding without derivedFrom and suggestedState
// is invalid and never renders (BL5).
export interface Finding {
  id: string
  claim: string
  derivedFrom: [entityId: string, field: string][]
  suggestedState: InvestigationState
  status: 'proposed' | 'accepted' | 'rejected'
}

// Fixture reference shapes (data-spec §3.1–3.2).
export interface Trial {
  id: string
  name: string
  candidateCountries: CountryCode3[]
}

export interface Country {
  code: CountryCode3
  name: string
}

// Site reference data (data-spec §3.6): the display name for a siteId.
export interface Site {
  id: string
  name: string
}
