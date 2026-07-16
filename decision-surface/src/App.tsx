// The workspace orchestrator: one screen, the F.1 zones, one-way data flow
// through the §G.0 tiers. The URL is read as view state (I2/BL7); Zustand
// holds shared and draft state; the derived tier is computed on read.

import { useEffect, useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useInvestigationState } from './state/useInvestigationState'
import { DEFAULT_TRIAL_ID, defaultState, writeState } from './state/url'
import { useSharedStore } from './state/store'
import { useFixtures } from './data/query'
import { applyWeights, deriveCountryRows, filterRows, sortRows } from './data/derive'
import { mergeFindings, runAtlas } from './atlas/checks'
import { ContextBar } from './zones/ContextBar'
import { ScopeBar } from './zones/ScopeBar'
import { CountryList } from './zones/CountryList'
import { FindingsRail } from './zones/FindingsRail'
import { RankingCriteria } from './zones/RankingCriteria'
import { SiteExplorer } from './zones/SiteExplorer'

const queryClient = new QueryClient()

export function App() {
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

  const [rankingOpen, setRankingOpen] = useState(false)

  const variables = useMemo(
    () => (fixtures ? applyWeights(fixtures.rankingVariables, weights) : []),
    [fixtures, weights],
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

  // Flow A 1b-E: the error names what failed and offers retry; no partial UI.
  if (fixturesQuery.isError) {
    return (
      <div className="app-status" role="alert">
        <p>Couldn’t load the trial’s evidence fixtures.</p>
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
          pendingCount={0}
          savedCount={committedSelection.length}
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
        />
        <FindingsRail findings={findings} />
      </div>
      {state.sites !== null && <SiteExplorer state={state} fixtures={fixtures} />}
      <RankingCriteria
        open={rankingOpen}
        onClose={() => setRankingOpen(false)}
        defaults={fixtures.rankingVariables}
      />
    </div>
  )
}
