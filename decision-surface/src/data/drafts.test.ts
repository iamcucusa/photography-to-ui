import { beforeEach, describe, expect, it } from 'vitest'
import { draftsService } from './drafts'

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

beforeEach(() => {
  ;(globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage()
})

describe('draftsService (local drafts, §G.0 / I3)', () => {
  it('starts empty', () => {
    expect(draftsService.load(TRIAL)).toEqual({ pendingSelection: null, weightEdits: null })
  })

  it('persists a pending selection across reload (BL9) without touching weight edits', () => {
    draftsService.setPendingSelection(TRIAL, ['ESP'])
    expect(draftsService.load(TRIAL)).toEqual({ pendingSelection: ['ESP'], weightEdits: null })
  })

  it('persists weight edits independently of the pending selection', () => {
    draftsService.setPendingSelection(TRIAL, ['ESP'])
    draftsService.setWeightEdits(TRIAL, [{ id: 'rv-01', weight: 0.5 }])
    expect(draftsService.load(TRIAL)).toEqual({
      pendingSelection: ['ESP'],
      weightEdits: [{ id: 'rv-01', weight: 0.5 }],
    })
  })

  it('drafts live under a separate key from shared state (I3: never shared)', () => {
    draftsService.setPendingSelection(TRIAL, ['ESP'])
    expect(localStorage.getItem(`ds:drafts:${TRIAL}`)).not.toBeNull()
    expect(localStorage.getItem(`ds:shared:${TRIAL}`)).toBeNull()
  })

  it('clearing a draft removes it', () => {
    draftsService.setPendingSelection(TRIAL, ['ESP'])
    draftsService.setPendingSelection(TRIAL, null)
    expect(draftsService.load(TRIAL).pendingSelection).toBeNull()
  })
})
