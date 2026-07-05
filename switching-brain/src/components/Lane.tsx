import { useMemo, type CSSProperties, type KeyboardEvent } from 'react'
import type { VizTokens } from '../viz/runtimeTokens'
import { withAlpha } from '../viz/runtimeTokens'
import type { BrainNode, NetworkId } from '../viz/model/types'
import { NETWORK_LABELS, HEMI_LABEL, networkVoice } from '../viz/model/types'
import { LaneSubstrate, type Substrate, type BgVariant } from './LaneSubstrate'
import { NodeReadout } from './NodeReadout'
import {
  buildLaneItems,
  groupLaneItems,
  type IaLayout,
  type PairMode,
  type LaneItem,
} from './laneLayout'

const pct = (d: number) => Math.round(d * 100)

/** Concise full readout as the accessible name for an entry (its rich content is
 *  presentational under role="button"). Mirrors the graph node's aria-label. */
function entryLabel(node: BrainNode): string {
  const tags = [node.richClub && 'rich-club hub', node.switcher && 'initiates switching']
    .filter(Boolean)
    .join(', ')
  const role = node.role ? ` ${node.role}` : ''
  return `${node.label}, ${HEMI_LABEL[node.hemi]}.${role} ${pct(node.degree)}% connectivity${tags ? `. ${tags}` : ''}`
}

function pairAriaLabel(a: BrainNode, b: BrainNode): string {
  const role = a.role ? ` ${a.role}` : ''
  return `${a.label}, bilateral.${role} Left ${pct(a.degree)}%, right ${pct(b.degree)}% connectivity`
}

export interface LaneProps {
  network: NetworkId
  nodes: BrainNode[]
  substrate: Substrate
  tokens: VizTokens
  inspectedId: string | null
  onNodeHover: (id: string | null) => void
  onNodeSelect: (id: string) => void
  // Prototype axes (bakeoff)
  bgVariant: BgVariant
  iaLayout: IaLayout
  pairMode: PairMode
}

/**
 * One network band: seam of light + faint connectome background + the network's
 * readouts, organised by taxonomy. Prototype axes (bgVariant / iaLayout /
 * pairMode) are threaded from the BrainLanes control panel for the bakeoff.
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
  pairMode,
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
    () => groupLaneItems(buildLaneItems(nodes, pairMode), iaLayout),
    [nodes, pairMode, iaLayout],
  )

  const onEntryKey = (e: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onNodeSelect(id)
    }
  }

  const renderItem = (item: LaneItem) => {
    const id = item.primary.id
    const isPair = Boolean(item.pair)
    return (
      <div
        key={item.key}
        className="lane__entry"
        data-node-id={id}
        data-active={inspectedId === id || undefined}
        role="button"
        tabIndex={0}
        aria-label={isPair ? pairAriaLabel(item.primary, item.pair!) : entryLabel(item.primary)}
        onMouseEnter={() => onNodeHover(id)}
        onMouseLeave={() => onNodeHover(null)}
        onFocus={() => onNodeHover(id)}
        onBlur={() => onNodeHover(null)}
        onClick={() => onNodeSelect(id)}
        onKeyDown={(e) => onEntryKey(e, id)}
      >
        {isPair ? (
          <PairReadout left={item.primary} right={item.pair!} />
        ) : (
          <NodeReadout node={item.primary} block="lane-readout" />
        )}
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
    <article className="lane" data-network={network} data-bg={bgVariant} style={style}>
      <LaneSubstrate substrate={substrate} tokens={tokens} variant={bgVariant} />
      <header className="lane__header">
        <div className="lane__title-block">
          <h2 className="lane__persona">{persona}</h2>
          <p className="lane__tagline">{tagline}</p>
        </div>
        <p className="lane__key">
          <span className="lane__dot" style={{ background: net.base }} aria-hidden="true" />
          <span className="lane__net-name">{NETWORK_LABELS[network]}</span>
          <span className="lane__abbr">{network}</span>
        </p>
      </header>
      {body}
    </article>
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

/** Merged bilateral readout: the region once, both hemispheres' connectivity. */
function PairReadout({ left, right }: { left: BrainNode; right: BrainNode }) {
  const richClub = left.richClub || right.richClub
  const switcher = left.switcher || right.switcher
  return (
    <div className="lane-readout__body">
      {/* Bilateral: both ids lead, then the shared region name. The L/R stat
          rows below carry the "both hemispheres" reading — no "Bilateral ·". */}
      <h3 className="lane-readout__title">
        <span className="lane-readout__id">
          {left.id} · {right.id}
        </span>
        <span className="lane-readout__name">{left.label}</span>
      </h3>
      {left.role && <p className="lane-readout__role">{left.role}</p>}
      <div className="lane-readout__stats">
        <div className="lane-readout__stat">
          <span className="lane-readout__stat-label">Left</span>
          <span className="lane-readout__bar" aria-hidden="true">
            <span className="lane-readout__bar-fill" style={{ width: `${pct(left.degree)}%` }} />
          </span>
          <span className="lane-readout__stat-value">{pct(left.degree)}%</span>
        </div>
        <div className="lane-readout__stat">
          <span className="lane-readout__stat-label">Right</span>
          <span className="lane-readout__bar" aria-hidden="true">
            <span className="lane-readout__bar-fill" style={{ width: `${pct(right.degree)}%` }} />
          </span>
          <span className="lane-readout__stat-value">{pct(right.degree)}%</span>
        </div>
        {(richClub || switcher) && (
          <ul className="lane-readout__tags">
            {richClub && <li className="lane-readout__tag">Rich-club hub</li>}
            {switcher && <li className="lane-readout__tag">Initiates switching</li>}
          </ul>
        )}
      </div>
    </div>
  )
}
