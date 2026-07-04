import { createContext, useContext, type RefObject } from 'react'
import type { Activation } from './activation'

/**
 * A shared, ref-backed activation bus.
 *
 * Activation is produced imperatively at 60fps inside BrainStage's rAF loop (see
 * `onFrame`); App writes the latest value to `latest.current` every frame. This
 * is deliberately NOT React state — a per-frame setState would re-render the tree
 * 60×/s and defeat the imperative SVG strategy (the CLAUDE.md rule: per-frame
 * state goes through refs, not setState). Consumers (the network lanes) read
 * `latest.current` inside their OWN rAF and mutate their own DOM — no re-renders.
 */
export interface ActivationBus {
  /** The most recent activation, or null before the first frame. */
  latest: RefObject<Activation | null>
}

export const ActivationContext = createContext<ActivationBus | null>(null)

/** Read the activation bus. Throws if used outside an ActivationContext.Provider. */
export function useActivation(): ActivationBus {
  const ctx = useContext(ActivationContext)
  if (!ctx) throw new Error('useActivation must be used within an ActivationContext.Provider')
  return ctx
}
