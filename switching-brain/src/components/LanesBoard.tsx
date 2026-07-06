import { useState } from 'react'
import type { NetworkId } from '../viz/model/types'
import { useMediaQuery } from '../viz/useMediaQuery'
import { Lane } from './Lane'
import { LaneStrip } from './LaneStrip'
import { LanesAccordion } from './LanesAccordion'
import { NETWORK_BG, type LanesModeProps } from './laneModeData'

/**
 * Board→focus mode — on a wide screen the three lanes sit side-by-side as
 * columns (SN central by source order): the focused column expands to the full
 * echo-hero `Lane` (its 3fr track clears the 720px facet threshold) while the
 * others stand as compact `LaneStrip` rails. Clicking a rail moves the focus.
 * On narrow/portrait viewports a 3-up board is meaningless, so it falls back to
 * the accordion (same shape query the page layout uses, so a 1024px portrait
 * iPad also stacks). Only the focused column mounts a `Lane`.
 */
export function LanesBoard(props: LanesModeProps) {
  const { lanes, tokens, inspectedId, onNodeHover, onNodeSelect } = props
  const [focused, setFocused] = useState<NetworkId>('SN')
  const narrow = useMediaQuery('(max-width: 1023px), (orientation: portrait)')

  if (narrow) return <LanesAccordion {...props} />

  return (
    <div className="lanes-board" data-focused={focused}>
      {lanes.map(({ network, nodes, substrate }) => {
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
                tokens={tokens}
                expanded={false}
                onToggle={() => setFocused(network)}
                variant="rail"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
