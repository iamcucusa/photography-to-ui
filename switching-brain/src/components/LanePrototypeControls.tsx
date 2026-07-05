import type { IaLayout, PairMode } from './laneLayout'

interface Props {
  layout: IaLayout
  setLayout: (v: IaLayout) => void
  pairs: PairMode
  setPairs: (v: PairMode) => void
}

/**
 * TEMPORARY prototype control panel for the lane reading-experience bakeoff —
 * flip IA layout × bilateral pairs live to compare. (Background is concluded:
 * per-network metaphor, hard-coded in BrainLanes.) Deleted in the converge
 * commit once layout + pairs are chosen. Deliberately utilitarian.
 */
export function LanePrototypeControls({ layout, setLayout, pairs, setPairs }: Props) {
  return (
    <div className="lane-proto" role="group" aria-label="Lane prototype controls">
      <span className="lane-proto__tag">prototype</span>
      <Segment label="layout" value={layout} onChange={setLayout} options={LAYOUT_OPTS} />
      <Segment label="pairs" value={pairs} onChange={setPairs} options={PAIR_OPTS} />
    </div>
  )
}

const LAYOUT_OPTS: readonly IaLayout[] = ['echo-hero', 'labeled', 'rank']
const PAIR_OPTS: readonly PairMode[] = ['keep', 'merge']

function Segment<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: readonly T[]
}) {
  return (
    <div className="lane-proto__seg">
      <span className="lane-proto__seg-label">{label}</span>
      <div className="lane-proto__opts">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            className="lane-proto__opt"
            aria-pressed={o === value}
            onClick={() => onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}
