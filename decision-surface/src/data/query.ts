// TanStack Query wiring plus the windowed evidence contract (§G.2): the data
// layer serves the site grid in keyset pages — stable sort by (field, id),
// opaque cursor, never offsets — so deep scroll stays flat-latency (BL10).

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { Observation, Provenance, SitePage, SortOrder } from '../types'
import { loadFixtures, type Fixtures } from './decode'
import { filterByProvenance } from './derive'
import { withBudget } from './budget'

export const SITE_PAGE_LIMIT = 100

export interface SiteQuery {
  scope: Provenance
  sortField: string
  sortOrder: SortOrder
  after?: string
  limit?: number
}

type SortValue = string | number | boolean

function sortValue(row: Observation, field: string): SortValue {
  return row[field as keyof Observation] as SortValue
}

function compareValues(a: SortValue, b: SortValue): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)
  return a < b ? -1 : a > b ? 1 : 0
}

// Cursors are opaque, derived from data — the last row's (sortValue, id) —
// and never appear in the URL (§G.2).
function encodeCursor(row: Observation, field: string): string {
  return btoa(JSON.stringify([sortValue(row, field), row.id]))
}

function decodeCursor(cursor: string): [SortValue, string] | null {
  try {
    const parsed: unknown = JSON.parse(atob(cursor))
    if (!Array.isArray(parsed) || parsed.length !== 2) return null
    const [value, id] = parsed as [unknown, unknown]
    const valueOk =
      typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    return valueOk && typeof id === 'string' ? [value as SortValue, id] : null
  } catch {
    return null
  }
}

// Memoized per-(scope, sort) arrays keep every page serve under the 30 ms
// budget: sort once, then each page is a binary-search seek plus a slice.
const sortedCache = new WeakMap<Observation[], Map<string, Observation[]>>()

function sortedRows(
  observations: Observation[],
  scope: Provenance,
  sortField: string,
  sortOrder: SortOrder,
): Observation[] {
  let perSource = sortedCache.get(observations)
  if (!perSource) {
    perSource = new Map()
    sortedCache.set(observations, perSource)
  }
  const key = `${scope}|${sortField}|${sortOrder}`
  const cached = perSource.get(key)
  if (cached) return cached
  const rows = [...filterByProvenance(observations, scope)].sort((a, b) => {
    const cmp = compareValues(sortValue(a, sortField), sortValue(b, sortField)) * sortOrder
    return cmp || a.id.localeCompare(b.id) // id is the tiebreak (§G.2)
  })
  perSource.set(key, rows)
  return rows
}

// First index strictly after the cursor position in the sorted order.
function seekIndex(
  rows: Observation[],
  cursor: [SortValue, string],
  sortField: string,
  sortOrder: SortOrder,
): number {
  const [cursorValue, cursorId] = cursor
  const afterCursor = (row: Observation): boolean => {
    const cmp = compareValues(sortValue(row, sortField), cursorValue) * sortOrder
    return cmp > 0 || (cmp === 0 && row.id.localeCompare(cursorId) > 0)
  }
  let lo = 0
  let hi = rows.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (afterCursor(rows[mid])) hi = mid
    else lo = mid + 1
  }
  return lo
}

export function querySites(observations: Observation[], query: SiteQuery): SitePage {
  return withBudget('querySites', 30, () => {
    const { scope, sortField, sortOrder, after, limit = SITE_PAGE_LIMIT } = query
    const rows = sortedRows(observations, scope, sortField, sortOrder)
    let start = 0
    if (after !== undefined) {
      const cursor = decodeCursor(after)
      start = cursor ? seekIndex(rows, cursor, sortField, sortOrder) : rows.length
    }
    const page = rows.slice(start, start + limit)
    const nextCursor =
      start + limit < rows.length ? encodeCursor(page[page.length - 1], sortField) : null
    return { rows: page, nextCursor }
  })
}

export function countSites(observations: Observation[], scope: Provenance): number {
  return filterByProvenance(observations, scope).length
}

// ---------------------------------------------------------------------------
// Hooks. Fixtures load once (static, immutable at runtime); the evidence grid
// pages through useInfiniteQuery over the keyset contract above.

export function useFixtures() {
  return useQuery({
    queryKey: ['fixtures'],
    queryFn: loadFixtures,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })
}

export function useSitePages(
  fixtures: Fixtures | undefined,
  scope: Provenance,
  sortField: string,
  sortOrder: SortOrder,
) {
  return useInfiniteQuery({
    queryKey: ['sites', scope, sortField, sortOrder],
    enabled: fixtures !== undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      querySites(fixtures?.observations ?? [], { scope, sortField, sortOrder, after: pageParam }),
    getNextPageParam: (last: SitePage) => last.nextCursor ?? undefined,
    staleTime: Infinity,
  })
}
