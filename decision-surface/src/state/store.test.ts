import { beforeEach, describe, expect, it } from 'vitest'
import type { Finding, InvestigationState } from '../types'
import { useDraftsStore, useSharedStore } from './store'

// Guards the regression that broke the app once: a shared-state action that
// re-set the whole re-read state gave untouched fields (e.g. `findings`,
// `weights`) fresh identities on every write, which retriggered the Atlas
// effect (it selects `weights`) and looped React into unmounting. Each action
// must set ONLY the field it changes, so unrelated fields keep identity.

class MemoryStorage {
  private store = new Map<string, string>()
  getItem(k: string) {
    return this.store.has(k) ? this.store.get(k)! : null
  }
  setItem(k: string, v: string) {
    this.store.set(k, String(v))
  }
  removeItem(k: string) {
    this.store.delete(k)
  }
  clear() {
    this.store.clear()
  }
}

const investigation: InvestigationState = {
  trialId: 'trial-001',
  provenance: 'all',
  countriesScope: 'all',
  evidenceFamily: 'footprint',
  list: { sortField: 'ranking', sortOrder: -1, filterText: '' },
  distribution: null,
  sites: null,
  highlight: [],
}

const findings: Finding[] = [
  {
    id: 'f1',
    claim: 'a claim',
    derivedFrom: [['POL', 'ranking']],
    suggestedState: investigation,
    status: 'proposed',
  },
]

beforeEach(() => {
  ;(globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage()
  useSharedStore.setState({ selection: [], weights: null, findings: [], investigation: null })
  useDraftsStore.setState({ pendingSelection: null, weightEdits: null })
  // Seed findings through the action so localStorage and the in-memory store
  // agree — setFindingStatus/commit re-read findings from the service.
  useSharedStore.getState().setFindings(findings)
})

describe('useSharedStore write actions (I1) preserve untouched-field identity', () => {
  it('saveWeights changes weights and keeps findings identity', () => {
    const before = useSharedStore.getState().findings
    useSharedStore.getState().saveWeights([{ id: 'rv-01', weight: 1 }])
    const after = useSharedStore.getState()
    expect(after.weights).toEqual([{ id: 'rv-01', weight: 1 }])
    expect(after.findings).toBe(before) // same reference — no spurious re-run
  })

  it('setFindingStatus changes findings and keeps weights identity', () => {
    useSharedStore.setState({ weights: [{ id: 'rv-01', weight: 1 }] })
    const beforeWeights = useSharedStore.getState().weights
    useSharedStore.getState().setFindingStatus('f1', 'accepted')
    const after = useSharedStore.getState()
    expect(after.findings[0].status).toBe('accepted')
    expect(after.weights).toBe(beforeWeights)
  })

  it('setFindings replaces findings and keeps weights identity', () => {
    useSharedStore.setState({ weights: [{ id: 'rv-01', weight: 1 }] })
    const beforeWeights = useSharedStore.getState().weights
    useSharedStore.getState().setFindings([])
    const after = useSharedStore.getState()
    expect(after.findings).toEqual([])
    expect(after.weights).toBe(beforeWeights)
  })
})

describe('commit (BL4) wires selection + investigation and clears the pending draft', () => {
  it('persists selection and investigation, keeps weights/findings identity, clears draft', () => {
    useSharedStore.setState({ weights: [{ id: 'rv-01', weight: 1 }] })
    useDraftsStore.getState().setPendingSelection(['ESP', 'POL'])
    const beforeWeights = useSharedStore.getState().weights
    const beforeFindings = useSharedStore.getState().findings

    useSharedStore.getState().commit(['ESP', 'POL'], investigation)

    const shared = useSharedStore.getState()
    expect(shared.selection).toEqual(['ESP', 'POL'])
    expect(shared.investigation).toEqual(investigation)
    expect(shared.weights).toBe(beforeWeights)
    expect(shared.findings).toBe(beforeFindings)
    expect(useDraftsStore.getState().pendingSelection).toBeNull() // draft cleared (BL9)
  })
})
