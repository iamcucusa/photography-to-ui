import { useState } from 'react'
import type { NetworkId } from '../viz/model/types'
import { Lane } from './Lane'
import { LaneStrip } from './LaneStrip'
import { NETWORK_BG, type LanesModeProps } from './laneModeData'

/**
 * Accordion mode — the three lanes stacked full-width (coherent with the wide
 * hero's top-down bands, SN the middle lane). Each lane's `LaneStrip` is a
 * persistent toggle (swatch + tagline); expanding reveals the full `Lane` — its
 * own persona/key header intact, only the tagline opener suppressed (the strip
 * carries it) — in a `grid-template-rows: 0fr↔1fr` region below it. All open by
 * default. Collapsed lanes unmount their `Lane` (no substrate / ResizeObserver).
 */
export function LanesAccordion({
  lanes,
  tokens,
  inspectedId,
  onNodeHover,
  onNodeSelect,
}: LanesModeProps) {
  const [open, setOpen] = useState<Record<NetworkId, boolean>>({ DMN: true, SN: true, FPCN: true })
  const toggle = (n: NetworkId) => setOpen((o) => ({ ...o, [n]: !o[n] }))

  return (
    <div className="lanes-accordion">
      {lanes.map(({ network, nodes, edges, substrate }) => {
        const isOpen = open[network]
        const regionId = `acc-${network}`
        return (
          <div
            className="lanes-accordion__item"
            data-network={network}
            data-open={isOpen}
            key={network}
          >
            <LaneStrip
              network={network}
              nodes={nodes}
              edges={edges}
              tokens={tokens}
              expanded={isOpen}
              onToggle={() => toggle(network)}
              variant="row"
              controlsId={regionId}
            />
            <div className="lanes-accordion__region" id={regionId} role="region">
              <div className="lanes-accordion__region-inner">
                {isOpen && (
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
                    showIntro={false}
                  />
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
