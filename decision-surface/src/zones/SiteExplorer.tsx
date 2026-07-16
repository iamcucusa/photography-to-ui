// F.1 `SiteExplorer` — capability 2 Explain at site level. The windowed
// evidence grid: every observation in scope, sortable, only visible rows
// mounted (BL10 — tens of mounted rows over thousands of records). Owns
// `sites` (§G.3); scroll positions and cursors are never state.

import { useEffect, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Fixtures } from '../data/decode'
import type { InvestigationState, Observation } from '../types'
import { countSites, useSitePages } from '../data/query'
import { writeState } from '../state/url'

const ROW_HEIGHT = 36

interface SiteColumn {
  field: keyof Observation
  label: string
  unit: string
  format: (row: Observation) => string
}

const COLUMNS: SiteColumn[] = [
  { field: 'siteId', label: 'Site', unit: '', format: (r) => r.siteId },
  { field: 'countryCode', label: 'Country', unit: '', format: (r) => r.countryCode },
  { field: 'sourceTrialId', label: 'Source trial', unit: '', format: (r) => r.sourceTrialId },
  { field: 'benchmark', label: 'Benchmark', unit: '', format: (r) => (r.benchmark ? 'yes' : 'no') },
  {
    field: 'enrollmentRatePSM',
    label: 'Achieved',
    unit: 'pts/site/mo',
    format: (r) => r.enrollmentRatePSM.toFixed(3),
  },
  {
    field: 'targetEnrollmentRatePSM',
    label: 'Target',
    unit: 'pts/site/mo',
    format: (r) => r.targetEnrollmentRatePSM.toFixed(3),
  },
  { field: 'startupDays', label: 'Startup', unit: 'days', format: (r) => String(r.startupDays) },
]

interface SiteExplorerProps {
  state: InvestigationState
  fixtures: Fixtures
}

export function SiteExplorer({ state, fixtures }: SiteExplorerProps) {
  const sites = state.sites! // the zone renders only while `sites` is open
  const panelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const pages = useSitePages(fixtures, state.provenance, sites.sortField, sites.sortOrder)
  const rows = useMemo(() => pages.data?.pages.flatMap((p) => p.rows) ?? [], [pages.data])
  const total = countSites(fixtures.observations, state.provenance)
  const siteNames = useMemo(
    () => new Map(fixtures.sites.map((s) => [s.id, s.name])),
    [fixtures.sites],
  )

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  })
  const items = virtualizer.getVirtualItems()

  // Rows mount on scroll via keyset pages: fetch the next page when the
  // window nears the end of what's loaded (Flow A 4b).
  const lastIndex = items.length > 0 ? items[items.length - 1].index : 0
  useEffect(() => {
    if (
      rows.length > 0 &&
      lastIndex >= rows.length - 30 &&
      pages.hasNextPage &&
      !pages.isFetchingNextPage
    ) {
      void pages.fetchNextPage()
    }
  }, [lastIndex, rows.length, pages])

  // Focus moves into the panel on open and returns to the trigger on close.
  useEffect(() => {
    panelRef.current?.focus()
    return () => document.getElementById('site-evidence-trigger')?.focus()
  }, [])

  // A new sort serves a fresh first page; the windowed list resets to top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [sites.sortField, sites.sortOrder])

  const close = () => writeState({ ...state, sites: null }, 'push')

  // Esc closes the grid (interaction contract); listener lives on window so
  // it works wherever focus sits inside the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const sortBy = (field: keyof Observation) => {
    const nextOrder = field === sites.sortField ? (-sites.sortOrder as 1 | -1) : 1
    writeState({ ...state, sites: { sortField: field, sortOrder: nextOrder } }, 'push')
  }

  const sortIndicator = (field: keyof Observation) =>
    field === sites.sortField ? (sites.sortOrder === 1 ? '↑' : '↓') : ''

  return (
    <div
      ref={panelRef}
      className="site-explorer"
      role="dialog"
      aria-label="Site evidence"
      tabIndex={-1}
    >
      <header className="explorer-header">
        <h2>Site evidence</h2>
        <span className="explorer-count">
          {total.toLocaleString('en-US')} observations in scope ·{' '}
          {rows.length.toLocaleString('en-US')} loaded ·{' '}
          {state.provenance === 'all' ? 'all trial sources' : `${state.provenance} trials`}
        </span>
        <button type="button" className="btn-quiet" onClick={close}>
          Close
        </button>
      </header>
      <div className="site-grid" role="table" aria-label="Site observations" aria-rowcount={total}>
        <div className="site-row site-row-head" role="row">
          {COLUMNS.map((col) => (
            <span
              key={col.field}
              role="columnheader"
              aria-sort={
                sites.sortField === col.field
                  ? sites.sortOrder === 1
                    ? 'ascending'
                    : 'descending'
                  : undefined
              }
            >
              <button type="button" className="sort-btn" onClick={() => sortBy(col.field)}>
                {col.label} {sortIndicator(col.field)}
                {col.unit !== '' && <span className="unit">{col.unit}</span>}
              </button>
            </span>
          ))}
        </div>
        <div ref={scrollRef} className="site-scroll">
          <div role="rowgroup" style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {items.map((item) => {
              const row = rows[item.index]
              return (
                <div
                  key={row.id}
                  className="site-row"
                  role="row"
                  aria-rowindex={item.index + 2}
                  style={{ transform: `translateY(${item.start}px)` }}
                >
                  {COLUMNS.map((col) =>
                    col.field === 'siteId' ? (
                      <span
                        key={col.field}
                        role="cell"
                        className="cell-site"
                        title={`${siteNames.get(row.siteId) ?? row.siteId} · ${row.siteId}`}
                      >
                        {siteNames.get(row.siteId) ?? row.siteId}{' '}
                        <code className="site-id">{row.siteId}</code>
                      </span>
                    ) : (
                      <span key={col.field} role="cell">
                        {col.format(row)}
                      </span>
                    ),
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
