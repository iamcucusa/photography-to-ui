// F.1 `ScopeBar` — capability 3 Re-scope. The three scope controls plus
// country search, always visible. Owns provenance, countriesScope,
// evidenceFamily, list.filterText (§G.3). Labels per the F.3 taxonomy.
// The controls' shapes encode their weight: evidence family switches the
// view (tabs), trial source changes what the evidence means (bordered
// toggles), countries scope narrows it (text toggle), search is utility.

import { useRef, useState } from 'react'
import type { CountriesScope, EvidenceFamily, InvestigationState, Provenance } from '../types'
import { writeState } from '../state/url'

interface OptionGroupProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  className: string
}

function OptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: OptionGroupProps<T>) {
  return (
    <div className={className} role="group" aria-label={label}>
      <span className="control-label">{label}</span>
      <div className="options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

interface ScopeBarProps {
  state: InvestigationState
  onOpenRanking: () => void
  siteExplorerOpen: boolean
}

export function ScopeBar({ state, onOpenRanking, siteExplorerOpen }: ScopeBarProps) {
  const [searchText, setSearchText] = useState(state.list.filterText)
  const [lastExternal, setLastExternal] = useState(state.list.filterText)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // External view-state changes (back button, "show me", shared links) win
  // over the local input buffer — state derived during render, no effect.
  if (state.list.filterText !== lastExternal) {
    setLastExternal(state.list.filterText)
    setSearchText(state.list.filterText)
  }

  const search = (text: string) => {
    setSearchText(text)
    clearTimeout(debounceRef.current)
    // Continuous input replaces the history entry (debounced 250 ms) —
    // back walks investigation moves, not keystrokes.
    debounceRef.current = setTimeout(() => {
      writeState({ ...state, list: { ...state.list, filterText: text, page: 1 } }, 'replace')
    }, 250)
  }

  const toggleSites = () => {
    // Discrete navigation pushes; opening lands on the grid's default sort.
    writeState(
      { ...state, sites: siteExplorerOpen ? null : { sortField: 'startupDays', sortOrder: 1 } },
      'push',
    )
  }

  return (
    <div className="scope-bar">
      <div className="family-tabs" role="group" aria-label="Evidence">
        {(
          [
            { value: 'footprint', label: 'Footprint' },
            { value: 'enrollment-performance', label: 'Enrollment' },
            { value: 'timelines', label: 'Timelines' },
          ] as { value: EvidenceFamily; label: string }[]
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={state.evidenceFamily === option.value}
            onClick={() => writeState({ ...state, evidenceFamily: option.value }, 'push')}
          >
            {option.label}
          </button>
        ))}
      </div>
      <OptionGroup<Provenance>
        className="provenance-control"
        label="Trial source"
        value={state.provenance}
        options={[
          { value: 'all', label: 'All' },
          { value: 'benchmark', label: 'Benchmark' },
          { value: 'non-benchmark', label: 'Non-benchmark' },
        ]}
        onChange={(provenance) => writeState({ ...state, provenance }, 'push')}
      />
      <OptionGroup<CountriesScope>
        className="scope-toggle"
        label="Countries"
        value={state.countriesScope}
        options={[
          { value: 'all', label: 'All' },
          { value: 'selected', label: 'Selected' },
        ]}
        onChange={(countriesScope) =>
          writeState({ ...state, countriesScope, list: { ...state.list, page: 1 } }, 'push')
        }
      />
      <div className="scope-search">
        <input
          type="search"
          value={searchText}
          placeholder="Search countries"
          aria-label="Search countries by name"
          onChange={(e) => search(e.target.value)}
        />
        {searchText !== '' && (
          <button type="button" className="btn-quiet" onClick={() => search('')}>
            Clear
          </button>
        )}
      </div>
      <div className="scope-actions">
        <button
          type="button"
          className="btn"
          id="site-evidence-trigger"
          aria-expanded={siteExplorerOpen}
          onClick={toggleSites}
        >
          Site evidence
        </button>
        <button type="button" className="btn" id="ranking-criteria-trigger" onClick={onOpenRanking}>
          Ranking criteria
        </button>
      </div>
    </div>
  )
}
