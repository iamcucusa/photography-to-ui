import { flushSync } from 'react-dom'
import type { NetworkId } from '../viz/model/types'
import { useReducedMotion } from '../viz/useReducedMotion'
import { Lane } from './Lane'
import { LaneStrip } from './LaneStrip'
import { NETWORK_BG, type LanesModeProps } from './laneModeData'

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => unknown
}

export interface LanesBoardProps extends LanesModeProps {
  /** The focused column, lifted to BrainLanes so it survives a tier swap. */
  focused: NetworkId
  onFocus: (network: NetworkId) => void
}

/**
 * Board→focus mode (desktop tier) — the three lanes sit side-by-side as columns
 * (SN central by source order): the focused column expands to the full echo-hero
 * `Lane` (its 3fr track clears the 720px facet threshold) while the others stand
 * as compact `LaneStrip` rails. Clicking a rail moves the focus.
 *
 * The focus change runs through the View Transitions API: the browser snapshots
 * the columns before/after and MORPHS between them (size) while cross-fading their
 * content (rail ↔ full lane) — one smooth step, no live grid-reflow jank. Falls
 * back to an instant swap when the API is absent or reduced-motion is set. Only
 * the focused column mounts a `Lane`.
 */
export function LanesBoard({
  lanes,
  tokens,
  inspectedId,
  onNodeHover,
  onNodeSelect,
  focused,
  onFocus,
}: LanesBoardProps) {
  const reduce = useReducedMotion()

  const focus = (network: NetworkId) => {
    if (network === focused) return
    const doc = document as ViewTransitionDoc
    if (!reduce && typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => flushSync(() => onFocus(network)))
    } else {
      onFocus(network)
    }
  }

  return (
    <div className="lanes-board" data-focused={focused}>
      {lanes.map(({ network, nodes, edges, substrate }) => {
        const isFocused = network === focused
        return (
          <div className="lanes-board__col" data-network={network} key={network}>
            {isFocused ? (
              <Lane
                network={network}
                nodes={nodes}
                substrate={substrate}
                tokens={tokens}
                inspectedId={inspectedId}
                onNodeHover={onNodeHover}
                onNodeSelect={onNodeSelect}
                bgVariant={NETWORK_BG[network]}
                iaLayout="echo-hero"
              />
            ) : (
              <LaneStrip
                network={network}
                nodes={nodes}
                edges={edges}
                tokens={tokens}
                expanded={false}
                onToggle={() => focus(network)}
                variant="rail"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
