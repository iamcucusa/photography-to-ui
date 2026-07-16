// F.1 `CountryList` — capabilities 1 Rank and 5 Decide. The ranked rows are
// the spine of the surface: rank, the active family's metrics, selection,
// counts. Owns list.sortField, list.sortOrder, list.page (§G.3).

import { useEffect, useMemo, useRef } from 'react'
import type { CountryMetrics, EvidenceFamily, InvestigationState } from '../types'
import { writeState } from '../state/url'
import { useRowTransitions } from '../hooks/useRowTransitions'

export const LIST_PAGE_SIZE = 20

interface Column {
  field: keyof CountryMetrics
  label: string
  unit: string // rendered under the label; full wording in the cell tooltip
  format: (row: CountryMetrics) => string
  title: (row: CountryMetrics) => string
}

const rate = (v: number) => v.toFixed(2)

// One evidence family visible at a time (F.4); §C item 2 names the families.
// Units live in the header so the numbers stay clean; tooltips carry the
// full-precision value with the unit spelled out.
const FAMILY_COLUMNS: Record<EvidenceFamily, Column[]> = {
  footprint: [
    {
      field: 'totalSites',
      label: 'Sites',
      unit: 'distinct',
      format: (r) => String(r.totalSites),
      title: (r) => `${r.totalSites} distinct sites`,
    },
    {
      field: 'totalInvestigators',
      label: 'Investigators',
      unit: 'distinct',
      format: (r) => String(r.totalInvestigators),
      title: (r) => `${r.totalInvestigators} distinct investigators`,
    },
    {
      field: 'multiTrialInvestigators',
      label: 'Multi-trial',
      unit: '≥2 source trials',
      format: (r) => String(r.multiTrialInvestigators),
      title: (r) => `${r.multiTrialInvestigators} investigators in more than one source trial`,
    },
  ],
  'enrollment-performance': [
    {
      field: 'historicalMedianEnrollmentRate',
      label: 'Historical',
      unit: 'pts/site/mo',
      format: (r) => rate(r.historicalMedianEnrollmentRate),
      title: (r) => `median ${r.historicalMedianEnrollmentRate} patients per site per month`,
    },
    {
      field: 'predictedEnrollmentRate',
      label: 'Predicted',
      unit: 'pts/site/mo',
      format: (r) => rate(r.predictedEnrollmentRate),
      title: (r) => `predicted ${r.predictedEnrollmentRate} patients per site per month`,
    },
    {
      field: 'performanceRatio',
      label: 'Performance',
      unit: 'achieved ÷ target',
      format: (r) => rate(r.performanceRatio),
      title: (r) => `median achieved-over-target ratio ${r.performanceRatio} (1.00 = on target)`,
    },
  ],
  timelines: [
    {
      field: 'medianStartupTime',
      label: 'Startup',
      unit: 'days',
      format: (r) => String(Math.round(r.medianStartupTime)),
      title: (r) => `median ${r.medianStartupTime} days, site activation to first patient`,
    },
    {
      field: 'predictedStartupTime',
      label: 'Predicted',
      unit: 'days',
      format: (r) => String(Math.round(r.predictedStartupTime)),
      title: (r) => `predicted ${r.predictedStartupTime} days, site activation to first patient`,
    },
    {
      field: 'siteToSiteVariability',
      label: 'Variability',
      unit: 'IQR ÷ median',
      format: (r) => rate(r.siteToSiteVariability),
      title: (r) =>
        `IQR over median of per-site mean enrollment: ${r.siteToSiteVariability} (dimensionless)`,
    },
  ],
}

function defaultOrderFor(field: keyof CountryMetrics): 1 | -1 {
  return field === 'countryName' ? 1 : -1
}

interface CountryListProps {
  state: InvestigationState
  rows: CountryMetrics[] // already scoped + sorted by the caller
  totalCandidates: number
  settleToken: unknown // changes when the weights in force change
  // BL9: the draft selection while one exists; row.selected stays committed
  pendingSelection: ReadonlySet<string> | null
  onToggleSelect: (countryCode: string) => void
  onOpenDistribution: (countryCode: string) => void
}

export function CountryList({
  state,
  rows,
  totalCandidates,
  settleToken,
  pendingSelection,
  onToggleSelect,
  onOpenDistribution,
}: CountryListProps) {
  const { sortField, sortOrder, page } = state.list
  const columns = FAMILY_COLUMNS[state.evidenceFamily]
  const pageCount = Math.max(1, Math.ceil(rows.length / LIST_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageRows = useMemo(
    () => rows.slice((currentPage - 1) * LIST_PAGE_SIZE, currentPage * LIST_PAGE_SIZE),
    [rows, currentPage],
  )
  const highlighted = useMemo(() => new Set(state.highlight), [state.highlight])

  const bodyRef = useRef<HTMLDivElement>(null)
  useRowTransitions(bodyRef, pageRows.map((r) => r.countryCode).join(','), settleToken)

  const sortBy = (field: keyof CountryMetrics) => {
    const nextOrder = field === sortField ? (-sortOrder as 1 | -1) : defaultOrderFor(field)
    writeState(
      { ...state, list: { ...state.list, sortField: field, sortOrder: nextOrder, page: 1 } },
      'push',
    )
  }

  const goToPage = (next: number) => {
    const clamped = Math.min(Math.max(1, next), pageCount)
    if (clamped === currentPage) return
    writeState({ ...state, list: { ...state.list, page: clamped } }, 'push')
    window.scrollTo({ top: 0 }) // instant swap; scroll resets to list top
  }

  // Keyboard path for the paginator: PageUp/PageDown page the list unless
  // focus is in an input, a dialog, or the site evidence grid.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'PageUp' && e.key !== 'PageDown') return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, dialog, .site-explorer')) return
      e.preventDefault()
      goToPage(currentPage + (e.key === 'PageDown' ? 1 : -1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const clearFilters = () => {
    writeState(
      {
        ...state,
        provenance: 'all',
        countriesScope: 'all',
        list: { ...state.list, filterText: '', page: 1 },
      },
      'push',
    )
  }

  if (rows.length === 0) {
    // Flow A 3a-E: the empty state names the active filters; one action clears them.
    const active: string[] = []
    if (state.provenance !== 'all') active.push(`Trial source: ${state.provenance}`)
    if (state.countriesScope !== 'all') active.push('Countries: selected')
    if (state.list.filterText !== '') active.push(`Search: “${state.list.filterText}”`)
    return (
      <section className="country-list" aria-label="Ranked countries">
        <div className="empty-state">
          <p>
            No countries match the active filters
            {active.length > 0 ? ` — ${active.join(' · ')}` : ''}.
          </p>
          <button type="button" className="btn" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      </section>
    )
  }

  const sortIndicator = (field: keyof CountryMetrics) =>
    field === sortField ? (sortOrder === 1 ? '↑' : '↓') : ''

  const isChecked = (row: CountryMetrics) =>
    pendingSelection ? pendingSelection.has(row.countryCode) : row.selected

  return (
    <section className="country-list" aria-label="Ranked countries">
      <div
        className="country-grid has-select"
        role="table"
        aria-label="Countries ranked by composite score"
      >
        <div className="country-row country-row-head" role="row">
          <span role="columnheader" className="cell-select" />
          <span
            role="columnheader"
            aria-sort={
              sortField === 'ranking' ? (sortOrder === -1 ? 'ascending' : 'descending') : undefined
            }
          >
            <button type="button" className="sort-btn" onClick={() => sortBy('ranking')}>
              Rank {sortIndicator('ranking')}
            </button>
          </span>
          <span
            role="columnheader"
            aria-sort={
              sortField === 'countryName'
                ? sortOrder === 1
                  ? 'ascending'
                  : 'descending'
                : undefined
            }
          >
            <button type="button" className="sort-btn" onClick={() => sortBy('countryName')}>
              Country {sortIndicator('countryName')}
            </button>
          </span>
          {columns.map((col) => (
            <span
              key={col.field}
              role="columnheader"
              className="cell-num"
              aria-sort={
                sortField === col.field ? (sortOrder === 1 ? 'ascending' : 'descending') : undefined
              }
            >
              <button type="button" className="sort-btn" onClick={() => sortBy(col.field)}>
                {col.label} {sortIndicator(col.field)}
                <span className="unit">{col.unit}</span>
              </button>
            </span>
          ))}
          <span role="columnheader" className="cell-drill" />
        </div>
        <div ref={bodyRef} role="rowgroup">
          {pageRows.map((row) => (
            <div
              key={row.countryCode}
              data-flip-key={row.countryCode}
              className={`country-row${highlighted.has(row.countryCode) ? ' is-highlighted' : ''}${
                isChecked(row) !== row.selected ? ' is-pending' : ''
              }`}
              role="row"
            >
              <span role="cell" className="cell-select">
                <input
                  type="checkbox"
                  checked={isChecked(row)}
                  onChange={() => onToggleSelect(row.countryCode)}
                  aria-label={`Select ${row.countryName}`}
                />
              </span>
              <span role="cell" className="cell-rank">
                #{row.ranking}
              </span>
              <span role="cell" className="cell-country">
                {row.countryName} <code className="country-code">{row.countryCode}</code>
              </span>
              {columns.map((col) => (
                <span key={col.field} role="cell" className="cell-num" title={col.title(row)}>
                  {col.format(row)}
                </span>
              ))}
              <span role="cell" className="cell-drill">
                <button
                  type="button"
                  className="btn btn-quiet drill-btn"
                  id={`dist-trigger-${row.countryCode}`}
                  aria-label={`Open distribution for ${row.countryName}`}
                  onClick={() => onOpenDistribution(row.countryCode)}
                >
                  ▤
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
      <footer className="list-footer">
        <span className="list-counts">
          {rows.length} of {totalCandidates} countries ·{' '}
          {state.provenance === 'all' ? 'all trial sources' : `${state.provenance} trials`}
        </span>
        {pageCount > 1 && (
          <nav className="paginator" aria-label="List pages">
            <button
              type="button"
              className="btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ‹ Prev
            </button>
            <span>
              page {currentPage} of {pageCount}
            </span>
            <button
              type="button"
              className="btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === pageCount}
            >
              Next ›
            </button>
          </nav>
        )}
      </footer>
    </section>
  )
}
