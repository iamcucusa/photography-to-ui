// The F.2 canonical serializer — the ONLY writer of the URL (I2). The URL is
// the navigation system: route /trial/:trialId plus one query parameter per
// §G.3 field, in the table's fixed order, defaults omitted. Equal states
// produce byte-equal links; link equality is state equality (BL7).

import type {
  CountriesScope,
  EvidenceFamily,
  InvestigationState,
  Provenance,
  SortOrder,
  TimeUnit,
} from '../types'

export const DEFAULT_TRIAL_ID = 'trial-001'

export const LIST_SORT_FIELDS = [
  'ranking',
  'countryName',
  'totalSites',
  'totalInvestigators',
  'multiTrialInvestigators',
  'historicalMedianEnrollmentRate',
  'predictedEnrollmentRate',
  'performanceRatio',
  'medianStartupTime',
  'predictedStartupTime',
  'siteToSiteVariability',
] as const

export const SITE_SORT_FIELDS = [
  'id',
  'siteId',
  'countryCode',
  'sourceTrialId',
  'benchmark',
  'enrollmentRatePSM',
  'targetEnrollmentRatePSM',
  'startupDays',
] as const

const PROVENANCES: readonly Provenance[] = ['all', 'benchmark', 'non-benchmark']
const SCOPES: readonly CountriesScope[] = ['all', 'selected']
const FAMILIES: readonly EvidenceFamily[] = ['footprint', 'enrollment-performance', 'timelines']
const UNITS: readonly TimeUnit[] = ['days', 'weeks', 'months']

export function defaultState(trialId: string): InvestigationState {
  return {
    trialId,
    provenance: 'all',
    countriesScope: 'all',
    evidenceFamily: 'footprint',
    list: { sortField: 'ranking', sortOrder: -1, page: 1, filterText: '' },
    distribution: null,
    sites: null,
    highlight: [],
  }
}

function sortToken(sortField: string, sortOrder: SortOrder): string {
  return `${sortField}:${sortOrder === 1 ? 'asc' : 'desc'}`
}

// Keep ':' and ',' literal in query values — canonical AND legible. Parsers
// accept both the literal and the percent-encoded forms.
function encode(value: string): string {
  return encodeURIComponent(value).replace(/%3A/gi, ':').replace(/%2C/gi, ',')
}

// Serialize to "trial/<id>[?…]" relative to the app base. Two rules make
// links stable (F.2): omit defaults; parameters in the table's order.
export function serializeState(state: InvestigationState): string {
  const params: [string, string][] = []
  if (state.provenance !== 'all') params.push(['prov', state.provenance])
  if (state.countriesScope !== 'all') params.push(['scope', state.countriesScope])
  if (state.evidenceFamily !== 'footprint') params.push(['family', state.evidenceFamily])
  const sort = sortToken(state.list.sortField, state.list.sortOrder)
  if (sort !== 'ranking:desc') params.push(['sort', sort])
  if (state.list.page !== 1) params.push(['page', String(state.list.page)])
  if (state.list.filterText !== '') params.push(['q', state.list.filterText])
  if (state.distribution !== null) {
    const { countryCode, outliers, unit } = state.distribution
    // 'all' = every point shown; 'outliers' = outliers filtered out
    params.push(['dist', `${countryCode}:${outliers ? 'all' : 'outliers'}:${unit}`])
  }
  if (state.sites !== null) {
    params.push(['sites', sortToken(state.sites.sortField, state.sites.sortOrder)])
  }
  if (state.highlight.length > 0) params.push(['hl', state.highlight.join(',')])
  const query = params.map(([k, v]) => `${k}=${encode(v)}`).join('&')
  return `trial/${state.trialId}${query ? `?${query}` : ''}`
}

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

function parseSortToken(
  token: string | null,
  allowed: readonly string[],
): { sortField: string; sortOrder: SortOrder } | null {
  if (token === null) return null
  const idx = token.lastIndexOf(':')
  if (idx === -1) return null
  const field = token.slice(0, idx)
  const dir = token.slice(idx + 1)
  if (!allowed.includes(field) || (dir !== 'asc' && dir !== 'desc')) return null
  return { sortField: field, sortOrder: dir === 'asc' ? 1 : -1 }
}

// Parse a "trial/<id>" path (already stripped of the app base) plus a query
// string into InvestigationState. Unknown or malformed parameters fall back
// to their defaults — a shared link never dead-ends.
export function parseState(path: string, search: string): InvestigationState | null {
  const match = /^trial\/([A-Za-z0-9-]+)\/?$/.exec(path.replace(/^\/+/, ''))
  if (!match) return null
  const state = defaultState(match[1])
  const params = new URLSearchParams(search)
  state.provenance = pick(params.get('prov'), PROVENANCES, 'all')
  state.countriesScope = pick(params.get('scope'), SCOPES, 'all')
  state.evidenceFamily = pick(params.get('family'), FAMILIES, 'footprint')
  const listSort = parseSortToken(params.get('sort'), LIST_SORT_FIELDS)
  if (listSort) state.list = { ...state.list, ...listSort }
  const page = Number(params.get('page'))
  if (Number.isInteger(page) && page >= 1) state.list.page = page
  state.list.filterText = params.get('q') ?? ''
  const dist = params.get('dist')
  if (dist !== null) {
    const [code, mode, unit] = dist.split(':')
    if (/^[A-Z]{3}$/.test(code) && (mode === 'all' || mode === 'outliers')) {
      state.distribution = {
        countryCode: code,
        outliers: mode === 'all',
        unit: pick(unit ?? null, UNITS, 'days'),
      }
    }
  }
  const sites = parseSortToken(params.get('sites'), SITE_SORT_FIELDS)
  if (sites) state.sites = sites
  const hl = params.get('hl')
  if (hl !== null) {
    state.highlight = hl.split(',').filter((c) => /^[A-Z]{3}$/.test(c))
  }
  return state
}

// ---------------------------------------------------------------------------
// Browser bindings (History API, no router library — §H.1). Everything below
// touches window and is exercised in the browser, not in unit tests.

const URL_CHANGE_EVENT = 'ds:urlchange'

function base(): string {
  return import.meta.env.BASE_URL
}

export function readState(): InvestigationState | null {
  const pathname = window.location.pathname
  const path = pathname.startsWith(base()) ? pathname.slice(base().length) : pathname
  return parseState(path, window.location.search)
}

// Stable snapshot for useSyncExternalStore: the same URL returns the same
// object reference, so React re-renders only on real view-state changes.
let cachedHref: string | null = null
let cachedState: InvestigationState | null = null

export function readStateCached(): InvestigationState | null {
  const href = window.location.pathname + window.location.search
  if (href !== cachedHref) {
    cachedHref = href
    cachedState = readState()
  }
  return cachedState
}

export function stateToHref(state: InvestigationState): string {
  return base() + serializeState(state)
}

// History semantics (interaction contract): discrete navigation pushes,
// continuous input replaces. Callers pass the mode their table row states.
export function writeState(state: InvestigationState, mode: 'push' | 'replace'): void {
  const href = stateToHref(state)
  const current = window.location.pathname + window.location.search
  if (href === current) return
  if (mode === 'push') window.history.pushState(null, '', href)
  else window.history.replaceState(null, '', href)
  window.dispatchEvent(new Event(URL_CHANGE_EVENT))
}

export function subscribeToUrl(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange)
  window.addEventListener(URL_CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(URL_CHANGE_EVENT, onChange)
  }
}
