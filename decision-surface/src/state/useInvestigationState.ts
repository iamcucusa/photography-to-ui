import { useSyncExternalStore } from 'react'
import type { InvestigationState } from '../types'
import { readStateCached, subscribeToUrl } from './url'

// The URL is read as the source of view state (§G.0); no store mirrors it.
export function useInvestigationState(): InvestigationState | null {
  return useSyncExternalStore(subscribeToUrl, readStateCached)
}
