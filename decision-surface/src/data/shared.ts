// Runtime shared state (§G.0): selection, weights in force, findings and
// their statuses, plus the investigation record captured at commit (BL4).
// localStorage behind a service-shaped API — the tier boundary a real
// backend would plug into (§H.1). Ana is the only writer (BL2, BL6); Atlas
// writes only Finding records (I5).

import type { CountryCode3, Finding, InvestigationState } from '../types'

export interface WeightWrite {
  id: string
  weight: number
}

export interface SharedState {
  selection: CountryCode3[]
  weights: WeightWrite[] | null // null: the fixture defaults are in force
  findings: Finding[]
  investigation: InvestigationState | null // the record of the committing view
}

const EMPTY: SharedState = { selection: [], weights: null, findings: [], investigation: null }

function key(trialId: string): string {
  return `ds:shared:${trialId}`
}

function read(trialId: string): SharedState {
  try {
    const raw = localStorage.getItem(key(trialId))
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<SharedState>
    return {
      selection: Array.isArray(parsed.selection) ? parsed.selection : [],
      weights: Array.isArray(parsed.weights) ? parsed.weights : null,
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      investigation: parsed.investigation ?? null,
    }
  } catch {
    return EMPTY
  }
}

function write(trialId: string, state: SharedState): void {
  try {
    localStorage.setItem(key(trialId), JSON.stringify(state))
  } catch {
    // storage unavailable — shared state lives for the session only
  }
}

export const sharedService = {
  load(trialId: string): SharedState {
    return read(trialId)
  },

  // BL4: one commit persists the selection vector, the weights in force,
  // and the investigation record.
  commit(
    trialId: string,
    selection: CountryCode3[],
    weightsInForce: WeightWrite[] | null,
    investigation: InvestigationState,
  ): SharedState {
    const next = { ...read(trialId), selection, weights: weightsInForce, investigation }
    write(trialId, next)
    return next
  },

  saveWeights(trialId: string, weights: WeightWrite[]): SharedState {
    const next = { ...read(trialId), weights }
    write(trialId, next)
    return next
  },

  saveFindings(trialId: string, findings: Finding[]): SharedState {
    const next = { ...read(trialId), findings }
    write(trialId, next)
    return next
  },

  setFindingStatus(trialId: string, findingId: string, status: Finding['status']): SharedState {
    const current = read(trialId)
    const next = {
      ...current,
      findings: current.findings.map((f) => (f.id === findingId ? { ...f, status } : f)),
    }
    write(trialId, next)
    return next
  },
}
