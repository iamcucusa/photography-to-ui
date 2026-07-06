import { useMemo, type CSSProperties } from 'react'
import type { VizTokens } from '../viz/runtimeTokens'
import { withAlpha } from '../viz/runtimeTokens'
import type { BrainNode, NetworkId } from '../viz/model/types'
import { networkVoice } from '../viz/model/types'

export interface LaneStripProps {
  network: NetworkId
  nodes: BrainNode[]
  tokens: VizTokens
  /** aria-expanded (accordion) / active column (board). */
  expanded: boolean
  /** Click / Enter / Space → expand this lane. */
  onToggle: () => void
  /** 'row' = full-width horizontal strip; 'rail' = compact vertical column. */
  variant: 'row' | 'rail'
  /** id of the region this strip toggles (a11y). */
  controlsId?: string
}

/**
 * The collapsed representation of a lane — a boxless seam of light (glow, not a
 * card): swatch · persona · gloss · a degree sparkline · abbr. The whole strip IS
 * the toggle button, so keyboard + focus ring + aria-expanded come for free. It
 * renders NO node entries and NO LaneSubstrate, so a collapsed lane mounts no
 * ResizeObserver — the harness perf win. Shared by the accordion (collapsed
 * lanes) and the board (unfocused rails).
 */
export function LaneStrip({
  network,
  nodes,
  tokens,
  expanded,
  onToggle,
  variant,
  controlsId,
}: LaneStripProps) {
  const net = tokens.network[network]
  const { persona, tagline } = networkVoice(network)
  // Same network glow props Lane sets inline, so the strip glows identically.
  const style = {
    '--lane-base': net.base,
    '--lane-accent': net.bright,
    '--lane-glow-rim': withAlpha(net.base, 0.4),
    '--lane-glow-mid': withAlpha(net.bright, 0.22),
    '--lane-glow-halo': withAlpha(net.dim, 0.18),
  } as CSSProperties

  // The most-connected regions become the sparkline bars (a compact "shape of the
  // network" summary; the exact numbers live in the expanded readouts).
  const bars = useMemo(() => [...nodes].sort((a, b) => b.degree - a.degree).slice(0, 10), [nodes])

  return (
    <button
      type="button"
      className={`lane-strip lane-strip--${variant}`}
      data-network={network}
      style={style}
      aria-expanded={expanded}
      aria-controls={controlsId}
      onClick={onToggle}
    >
      <span className="lane-strip__swatch" style={{ background: net.base }} aria-hidden="true" />
      {/* Rail (board) leads with the persona; the accordion's row leads with the
          tagline alone — the persona moves into the expanded lane's header. */}
      {variant === 'rail' && <span className="lane-strip__persona">{persona}</span>}
      <span className="lane-strip__gloss">{tagline.replace(/\.$/, '')}</span>
      <span className="lane-strip__spark" aria-hidden="true">
        {bars.map((n) => (
          <span
            key={n.id}
            className="lane-strip__bar"
            style={{
              height: `${Math.round(20 + n.degree * 80)}%`,
              background: withAlpha(n.richClub ? net.bright : net.base, 0.35 + n.degree * 0.45),
            }}
          />
        ))}
      </span>
      <span className="lane-strip__abbr">{network}</span>
    </button>
  )
}
