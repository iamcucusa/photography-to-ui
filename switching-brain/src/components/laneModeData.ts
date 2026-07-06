import type { BrainNode, BrainEdge, NetworkId } from '../viz/model/types'
import type { VizTokens } from '../viz/runtimeTokens'
import type { Substrate, BgVariant } from './LaneSubstrate'

/**
 * Shared plumbing for the lane-arrangement bakeoff (temporary — see BrainLanes).
 * The three interaction modes (Accordion · Board · Carousel) all consume the same
 * `LaneDatum[]`, built once in BrainLanes, so the comparison is fair.
 */

/** One network's data for a lane (built once; shared by every mode). */
export interface LaneDatum {
  network: NetworkId
  nodes: BrainNode[]
  /** Intra-network edges — feeds the collapsed strip's connectome spark. */
  edges: BrainEdge[]
  substrate: Substrate
}

/** The activation/inspection bus + tokens each mode threads to Lane / LaneStrip. */
export interface SharedLaneProps {
  tokens: VizTokens
  inspectedId: string | null
  onNodeHover: (id: string | null) => void
  onNodeSelect: (id: string) => void
}

export interface LanesModeProps extends SharedLaneProps {
  lanes: LaneDatum[]
}

/** Each network's concluded background metaphor: DMN drift · SN pulse · FPCN lattice. */
export const NETWORK_BG: Record<NetworkId, BgVariant> = {
  DMN: 'drift',
  SN: 'pulse',
  FPCN: 'lattice',
}
