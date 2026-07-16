// Local drafts (§G.0, I3): pending selection and weight edits in progress.
// They persist locally so nothing is lost silently (BL9) but never appear
// in the URL or the shared tier before an explicit commit.

import type { CountryCode3 } from '../types'
import type { WeightWrite } from './shared'

export interface Drafts {
  pendingSelection: CountryCode3[] | null
  weightEdits: WeightWrite[] | null
}

const EMPTY: Drafts = { pendingSelection: null, weightEdits: null }

function key(trialId: string): string {
  return `ds:drafts:${trialId}`
}

function read(trialId: string): Drafts {
  try {
    const raw = localStorage.getItem(key(trialId))
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<Drafts>
    return {
      pendingSelection: Array.isArray(parsed.pendingSelection) ? parsed.pendingSelection : null,
      weightEdits: Array.isArray(parsed.weightEdits) ? parsed.weightEdits : null,
    }
  } catch {
    return EMPTY
  }
}

function write(trialId: string, drafts: Drafts): void {
  try {
    localStorage.setItem(key(trialId), JSON.stringify(drafts))
  } catch {
    // storage unavailable — drafts live for the session only
  }
}

export const draftsService = {
  load(trialId: string): Drafts {
    return read(trialId)
  },

  setPendingSelection(trialId: string, pendingSelection: CountryCode3[] | null): Drafts {
    const next = { ...read(trialId), pendingSelection }
    write(trialId, next)
    return next
  },

  setWeightEdits(trialId: string, weightEdits: WeightWrite[] | null): Drafts {
    const next = { ...read(trialId), weightEdits }
    write(trialId, next)
    return next
  },
}
