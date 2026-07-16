import { beforeEach, describe, expect, it } from 'vitest'
import type { Finding, InvestigationState } from '../types'
import { sharedService } from './shared'

// Minimal in-memory localStorage so the service can be exercised in node env.
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

const TRIAL = 'trial-001'

const investigation: InvestigationState = {
  trialId: TRIAL,
  provenance: 'benchmark',
  countriesScope: 'all',
  evidenceFamily: 'footprint',
  list: { sortField: 'ranking', sortOrder: -1, filterText: '' },
  distribution: null,
  sites: null,
  highlight: [],
}

const finding = (id: string, status: Finding['status']): Finding => ({
  id,
  claim: 'a claim',
  derivedFrom: [['POL', 'ranking']],
  suggestedState: investigation,
  status,
})

beforeEach(() => {
  ;(globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage()
})

describe('sharedService (the runtime shared tier, §G.0)', () => {
  it('starts empty and survives a reload (BL9: nothing lost silently)', () => {
    expect(sharedService.load(TRIAL)).toEqual({
      selection: [],
      weights: null,
      findings: [],
      investigation: null,
    })
    sharedService.saveWeights(TRIAL, [{ id: 'rv-01', weight: 1 }])
    // a fresh read (simulating reload) sees the persisted value
    expect(sharedService.load(TRIAL).weights).toEqual([{ id: 'rv-01', weight: 1 }])
  })

  it('commit persists the three BL4 things: selection, weights in force, investigation', () => {
    sharedService.saveWeights(TRIAL, [{ id: 'rv-01', weight: 1 }])
    const next = sharedService.commit(
      TRIAL,
      ['ESP', 'POL'],
      [{ id: 'rv-01', weight: 1 }],
      investigation,
    )
    expect(next.selection).toEqual(['ESP', 'POL'])
    expect(next.weights).toEqual([{ id: 'rv-01', weight: 1 }])
    expect(next.investigation).toEqual(investigation)
    // durable across reload
    expect(sharedService.load(TRIAL)).toEqual(next)
  })

  it('setFindingStatus updates only the targeted finding (BL6)', () => {
    sharedService.saveFindings(TRIAL, [finding('a', 'proposed'), finding('b', 'proposed')])
    const next = sharedService.setFindingStatus(TRIAL, 'a', 'accepted')
    expect(next.findings.find((f) => f.id === 'a')?.status).toBe('accepted')
    expect(next.findings.find((f) => f.id === 'b')?.status).toBe('proposed')
    expect(sharedService.load(TRIAL).findings.find((f) => f.id === 'a')?.status).toBe('accepted')
  })

  it('tolerates corrupt storage without throwing', () => {
    localStorage.setItem(`ds:shared:${TRIAL}`, '{not json')
    expect(sharedService.load(TRIAL)).toEqual({
      selection: [],
      weights: null,
      findings: [],
      investigation: null,
    })
  })
})
