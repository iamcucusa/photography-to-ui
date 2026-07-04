/**
 * Data model for the brain network. Mirrors data/nodes.json (the seed source of
 * truth). The viz renders entirely from this shape — swapping the JSON changes the
 * picture with no code edits (Definition of Done).
 */

export type NetworkId = 'DMN' | 'FPCN' | 'SN'
export type Hemisphere = 'L' | 'R' | 'M'
export type EdgeType = 'functional' | 'callosal'

export interface BrainNode {
  id: string
  /** Human-readable region name, shown in the inspect card. */
  label: string
  network: NetworkId
  /** L = left, R = right, M = midline. Drives x-position (interleaved, never split). */
  hemi: Hemisphere
  /** Connectivity strength [0,1] → node radius. */
  degree: number
  /** Rich-club hub → largest, brightest, inner glow. */
  richClub?: boolean
  /** Salience switcher → pulses ~before each switch (causal). */
  switcher?: boolean
  /** Optional one-line plain-language role for the inspect card. */
  role?: string
}

export interface BrainEdge {
  source: string
  target: string
  /** [0,1] → line opacity/thickness. */
  weight: number
  type: EdgeType
}

export interface GraphMeta {
  highCreativeEdgeCount?: number
  callosalAxonsMillions?: number
  modularityQ?: number
  smallWorldnessSigma?: number
}

export interface BrainGraph {
  nodes: BrainNode[]
  edges: BrainEdge[]
  meta?: GraphMeta
}

export const NETWORK_IDS: NetworkId[] = ['DMN', 'FPCN', 'SN']

export const NETWORK_LABELS: Record<NetworkId, string> = {
  DMN: 'Default Mode',
  FPCN: 'Frontoparietal Control',
  SN: 'Salience',
}

/** Hemisphere → human label, shown in every node readout (card + lanes). */
export const HEMI_LABEL: Record<Hemisphere, string> = {
  L: 'Left hemisphere',
  R: 'Right hemisphere',
  M: 'Midline',
}

/** The design-engineer translation for each network. Captions do the bridge. */
export const NETWORK_GLOSS: Record<NetworkId, string> = {
  DMN: 'The dreamer. What could be.',
  FPCN: 'The builder. Make it real.',
  SN: 'The switch. When to flip.',
}

/** Vertical band each network occupies in the map (top to bottom). */
export const NETWORK_POSITION: Record<NetworkId, string> = {
  DMN: 'top band',
  SN: 'middle',
  FPCN: 'bottom band',
}

/** Legend / reading order, top to bottom of the map (DMN · SN · FPCN). */
export const NETWORK_ORDER: NetworkId[] = ['DMN', 'SN', 'FPCN']
