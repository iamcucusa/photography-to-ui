import { useMemo, type CSSProperties, type KeyboardEvent } from 'react'
import type { VizTokens } from '../viz/runtimeTokens'
import { withAlpha } from '../viz/runtimeTokens'
import type { BrainNode, NetworkId } from '../viz/model/types'
import { NETWORK_LABELS, HEMI_LABEL, networkVoice } from '../viz/model/types'
import { LaneSubstrate, type Substrate, type BgVariant } from './LaneSubstrate'
import { NodeReadout } from './NodeReadout'
import { buildLaneItems, groupLaneItems, type IaLayout, type LaneItem } from './laneLayout'

const pct = (d: number) => Math.round(d * 100)

/** Concise full readout as the accessible name for an entry (its rich content is
 *  presentational under role="button"). Mirrors the graph node's aria-label. */
function entryLabel(node: BrainNode, mirror?: string): string {
  // Switcher/initiates is no longer a tag — its meaning lives in the role prose
  // ("calls/flips the switch"), which is already part of this label via `role`.
  const tags = node.richClub ? 'load-bearing' : ''
  const role = node.role ? ` ${node.role}` : ''
  const bilateral = mirror ? '. Bilateral pair' : ''
  return `${node.label}, ${HEMI_LABEL[node.hemi]}.${role} ${pct(node.degree)}% connectivity${bilateral}${tags ? `. ${tags}` : ''}`
}

export interface LaneProps {
  network: NetworkId
  nodes: BrainNode[]
  substrate: Substrate
  tokens: VizTokens
  inspectedId: string | null
  onNodeHover: (id: string | null) => void
  onNodeSelect: (id: string) => void
  // Background is concluded (per-network); iaLayout is the one axis still in the
  // bakeoff (echo-hero / labeled / rank).
  bgVariant: BgVariant
  iaLayout: IaLayout
}

/**
 * One network band: seam of light + faint connectome background + the network's
 * readouts, organised by taxonomy (iaLayout — the remaining bakeoff axis).
 */
export function Lane({
  network,
  nodes,
  substrate,
  tokens,
  inspectedId,
  onNodeHover,
  onNodeSelect,
  bgVariant,
  iaLayout,
}: LaneProps) {
  const net = tokens.network[network]
  const { persona, tagline } = networkVoice(network)
  // Elevation-as-light, mirroring InspectCard: a network-tinted rim + soft glow
  // (rim 0.4 / mid 0.22 / halo 0.18), composed at runtime. --lane-base tints the
  // in-lane bars/tags.
  const style = {
    '--lane-base': net.base,
    // Bright tone for facet labels + hemisphere marks — the lane's own color,
    // AA-legible on the dark canvas where the mid tone (esp. SN) falls short.
    '--lane-accent': net.bright,
    '--lane-glow-rim': withAlpha(net.base, 0.4),
    '--lane-glow-mid': withAlpha(net.bright, 0.22),
    '--lane-glow-halo': withAlpha(net.dim, 0.18),
  } as CSSProperties

  const groups = useMemo(
    () => groupLaneItems(buildLaneItems(nodes), iaLayout),
    [nodes, iaLayout],
  )

  const onEntryKey = (e: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onNodeSelect(id)
    }
  }

  const renderItem = (item: LaneItem) => {
    const id = item.primary.id
    return (
      <div
        key={item.key}
        className="lane__entry"
        data-node-id={id}
        data-active={inspectedId === id || undefined}
        role="button"
        tabIndex={0}
        aria-label={entryLabel(item.primary, item.mirror)}
        onMouseEnter={() => onNodeHover(id)}
        onMouseLeave={() => onNodeHover(null)}
        onFocus={() => onNodeHover(id)}
        onBlur={() => onNodeHover(null)}
        onClick={() => onNodeSelect(id)}
        onKeyDown={(e) => onEntryKey(e, id)}
      >
        <NodeReadout node={item.primary} block="lane-readout" mirror={item.mirror} />
      </div>
    )
  }

  const body =
    iaLayout === 'rank' ? (
      <div className="lane__entries">{groups[0].items.map(renderItem)}</div>
    ) : (
      <div className={`lane__facets lane__facets--${iaLayout}`}>
        {groups.map((g) => (
          <section className="lane__facet" key={g.key} aria-label={g.label}>
            <p className="lane__facet-label">
              <HemiMark hemi={g.key as 'L' | 'M' | 'R'} />
              {g.label}
            </p>
            <div className="lane__entries">{g.items.map(renderItem)}</div>
          </section>
        ))}
      </div>
    )

  return (
    // The tagline leads OUT of the lane box as a bold, network-hued section opener
    // — its color + glow rhyme with the lane's rim below, introducing it. The
    // network custom props live on the group so both the intro and the lane use them.
    <div className="lane-group" style={style}>
      {/* No terminal period — it reads as a bold opener, not a sentence. */}
      <p className="lane-intro">{tagline.replace(/\.$/, '')}</p>
      <article className="lane" data-network={network} data-bg={bgVariant}>
        <LaneSubstrate substrate={substrate} tokens={tokens} variant={bgVariant} />
        <header className="lane__header">
          <h2 className="lane__persona">{persona}</h2>
          <p className="lane__key">
            <span className="lane__dot" style={{ background: net.base }} aria-hidden="true" />
            <span className="lane__net-name">{NETWORK_LABELS[network]}</span>
            <span className="lane__abbr">{network}</span>
          </p>
        </header>
        {body}
      </article>
    </div>
  )
}

/** A simple hemisphere cue for a facet label: a brain-circle with the label's
 *  own side lit (left / right filled), or a central midline. Inherits the lane
 *  color via currentColor; decorative (the section already labels the group). */
function HemiMark({ hemi }: { hemi: 'L' | 'M' | 'R' }) {
  return (
    <svg className="lane__hemi-mark" viewBox="0 0 16 16" aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="1.3"
      />
      {hemi === 'L' && <path d="M8 1.5A6.5 6.5 0 0 0 8 14.5Z" fill="currentColor" />}
      {hemi === 'R' && <path d="M8 1.5A6.5 6.5 0 0 1 8 14.5Z" fill="currentColor" />}
      {hemi === 'M' && (
        <line x1="8" y1="1.5" x2="8" y2="14.5" stroke="currentColor" strokeWidth="1.3" />
      )}
    </svg>
  )
}
