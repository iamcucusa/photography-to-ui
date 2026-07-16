// The workspace orchestrator: one screen, the F.1 zones, one-way data flow
// through the §G.0 tiers. The URL is read as view state (I2/BL7); Zustand
// holds shared and draft state; the derived tier is computed on read.

import { useEffect, useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useInvestigationState } from './state/useInvestigationState'
import { DEFAULT_TRIAL_ID, defaultState, isCaseStudyRoute, writeState } from './state/url'
import { useDraftsStore, useSharedStore } from './state/store'
import { useFixtures } from './data/query'
import { applyWeights, deriveCountryRows, filterRows, sortRows } from './data/derive'
import { mergeFindings, runAtlas } from './atlas/checks'
import { ContextBar } from './zones/ContextBar'
import { ScopeBar } from './zones/ScopeBar'
import { CountryList } from './zones/CountryList'
import { FindingsRail } from './zones/FindingsRail'
import { RankingCriteria } from './zones/RankingCriteria'
import { SiteExplorer } from './zones/SiteExplorer'
import { DistributionPanel } from './zones/DistributionPanel'
import { CaseStudy } from './case-study/CaseStudy'

const queryClient = new QueryClient()

export function App() {
  // Additive landing route: /case-study renders the portfolio narrative; every
  // other path is the live app exactly as before. Navigation between them is a
  // full page load (the case study's launch link is a plain anchor), so this
  // route decision is read once at mount — no reactive routing, no coupling.
  if (isCaseStudyRoute()) return <CaseStudy />
  return (
    <QueryClientProvider client={queryClient}>
      <Workspace />
    </QueryClientProvider>
  )
}

function Workspace() {
  const state = useInvestigationState()
  const fixturesQuery = useFixtures()
  const fixtures = fixturesQuery.data

  // Entry: a plain URL (or any non-trial path) opens the trial's default view.
  useEffect(() => {
    if (state === null) writeState(defaultState(DEFAULT_TRIAL_ID), 'replace')
  }, [state])

  const weights = useSharedStore((s) => s.weights)
  const findings = useSharedStore((s) => s.findings)
  const setFindings = useSharedStore((s) => s.setFindings)
  const committedSelection = useSharedStore((s) => s.selection)
  const commit = useSharedStore((s) => s.commit)
  const pendingSelection = useDraftsStore((s) => s.pendingSelection)
  const setPendingSelection = useDraftsStore((s) => s.setPendingSelection)

  const [rankingOpen, setRankingOpen] = useState(false)

  const variables = useMemo(
    () => (fixtures ? applyWeights(fixtures.rankingVariables, weights) : []),
    [fixtures, weights],
  )

  const countryNames = useMemo(
    () => new Map((fixtures?.countries ?? []).map((c) => [c.code, c.name])),
    [fixtures],
  )

  const provenance = state?.provenance ?? 'all'
  const allRows = useMemo(
    () =>
      fixtures
        ? deriveCountryRows({
            fixtures,
            provenance,
            variables,
            selected: new Set(committedSelection),
          })
        : [],
    [fixtures, provenance, variables, committedSelection],
  )

  const viewRows = useMemo(() => {
    if (state === null) return []
    return sortRows(
      filterRows(allRows, state.list.filterText, state.countriesScope),
      state.list.sortField,
      state.list.sortOrder,
    )
  }, [allRows, state])

  // I5: Atlas is triggered only by shared-state change — the initial
  // hydration counts as the first — and writes only Finding records.
  const committedKey = committedSelection.join(',')
  useEffect(() => {
    if (!fixtures) return
    const fresh = runAtlas(
      fixtures,
      applyWeights(fixtures.rankingVariables, useSharedStore.getState().weights),
      fixtures.trial.id,
    )
    setFindings(mergeFindings(useSharedStore.getState().findings, fresh))
  }, [fixtures, weights, committedKey, setFindings])

  // BL2/BL9: checkbox toggles write only the pending draft; the draft clears
  // itself when it matches the committed selection again.
  const toggleSelect = (countryCode: string) => {
    const current = new Set(pendingSelection ?? committedSelection)
    if (current.has(countryCode)) current.delete(countryCode)
    else current.add(countryCode)
    const next = [...current].sort()
    const committed = [...committedSelection].sort()
    const isCommitted =
      next.length === committed.length && next.every((code, i) => code === committed[i])
    setPendingSelection(isCommitted ? null : next)
  }

  const pendingCount = pendingSelection
    ? pendingSelection
        .filter((code) => !committedSelection.includes(code))
        .concat(committedSelection.filter((code) => !pendingSelection.includes(code))).length
    : 0

  // Flow A 1b-E: the error names what failed and offers retry; no partial UI.
  if (fixturesQuery.isError) {
    return (
      <div className="app-status" role="alert">
        <p>Couldn’t load this trial’s evidence.</p>
        <button
          type="button"
          className="btn btn-accent"
          onClick={() => void fixturesQuery.refetch()}
        >
          Retry
        </button>
      </div>
    )
  }
  if (!fixtures || state === null) {
    return <div className="app-status">Loading trial evidence…</div>
  }

  return (
    <div className="workspace">
      <div className="top-bars">
        <ContextBar
          trialName={fixtures.trial.name}
          pendingCount={pendingCount}
          savedCount={committedSelection.length}
          onCommit={() => {
            // BL4: the commit persists the selection vector, the weights in
            // force, and the investigation record (this exact view state).
            if (pendingSelection) commit(pendingSelection, state)
          }}
          onDiscard={() => setPendingSelection(null)}
        />
        <ScopeBar
          state={state}
          onOpenRanking={() => setRankingOpen(true)}
          siteExplorerOpen={state.sites !== null}
        />
      </div>
      <div className="workspace-body">
        <CountryList
          state={state}
          rows={viewRows}
          totalCandidates={fixtures.trial.candidateCountries.length}
          settleToken={variables}
          pendingSelection={pendingSelection ? new Set(pendingSelection) : null}
          onToggleSelect={toggleSelect}
          onOpenDistribution={(countryCode) =>
            writeState(
              { ...state, distribution: { countryCode, outliers: true, unit: 'days' } },
              'push',
            )
          }
        />
        <FindingsRail findings={findings} countryNames={countryNames} />
      </div>
      {state.sites !== null && <SiteExplorer state={state} fixtures={fixtures} />}
      {state.distribution !== null && <DistributionPanel state={state} fixtures={fixtures} />}
      <RankingCriteria
        open={rankingOpen}
        onClose={() => setRankingOpen(false)}
        defaults={fixtures.rankingVariables}
      />
    </div>
  )
}
