// Zustand stores mapped 1:1 to the §G.0 tiers: runtime shared state and
// local drafts, each backed by its service-shaped localStorage layer. The
// URL stays the canonical view state (never mirrored here as truth), and
// ephemeral UI state (hover, open panels, focus) is component-local and
// never persisted anywhere.

import { create } from 'zustand'
import type { CountryCode3, Finding, InvestigationState } from '../types'
import { sharedService, type SharedState, type WeightWrite } from '../data/shared'
import { draftsService, type Drafts } from '../data/drafts'
import { DEFAULT_TRIAL_ID } from './url'

// The MVP ships one trial; the services are keyed by trialId so a second
// trial is a parameter change, not a redesign.
const TRIAL_ID = DEFAULT_TRIAL_ID

// I1: exactly three interactions write shared state — commit, save weights,
// set finding status. Atlas's propose/re-run writes only Finding records (I5).
interface SharedSlice extends SharedState {
  commit: (selection: CountryCode3[], investigation: InvestigationState) => void
  saveWeights: (weights: WeightWrite[]) => void
  setFindingStatus: (findingId: string, status: Finding['status']) => void
  setFindings: (findings: Finding[]) => void
}

export const useSharedStore = create<SharedSlice>((set, get) => ({
  ...sharedService.load(TRIAL_ID),

  commit: (selection, investigation) => {
    set(sharedService.commit(TRIAL_ID, selection, get().weights, investigation))
    useDraftsStore.getState().setPendingSelection(null)
  },

  saveWeights: (weights) => {
    set(sharedService.saveWeights(TRIAL_ID, weights))
  },

  setFindingStatus: (findingId, status) => {
    set(sharedService.setFindingStatus(TRIAL_ID, findingId, status))
  },

  setFindings: (findings) => {
    set(sharedService.saveFindings(TRIAL_ID, findings))
  },
}))

interface DraftsSlice extends Drafts {
  setPendingSelection: (pendingSelection: CountryCode3[] | null) => void
  setWeightEdits: (weightEdits: WeightWrite[] | null) => void
}

export const useDraftsStore = create<DraftsSlice>((set) => ({
  ...draftsService.load(TRIAL_ID),

  setPendingSelection: (pendingSelection) => {
    set(draftsService.setPendingSelection(TRIAL_ID, pendingSelection))
  },

  setWeightEdits: (weightEdits) => {
    set(draftsService.setWeightEdits(TRIAL_ID, weightEdits))
  },
}))
