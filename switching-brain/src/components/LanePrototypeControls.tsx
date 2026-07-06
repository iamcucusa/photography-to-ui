import type { IaLayout } from './laneLayout'

interface Props {
  layout: IaLayout
  setLayout: (v: IaLayout) => void
}

/**
 * TEMPORARY prototype control panel for the lane reading-experience bakeoff —
 * flip the IA layout live to compare. (Background, connectivity-value treatment,
 * and pairs are all concluded.) Deleted in the converge commit once layout is chosen.
 */
export function LanePrototypeControls({ layout, setLayout }: Props) {
  return (
    <div className="lane-proto" role="group" aria-label="Lane prototype controls">
      <span className="lane-proto__tag">prototype</span>
      <Segment label="layout" value={layout} onChange={setLayout} options={LAYOUT_OPTS} />
    </div>
  )
}

const LAYOUT_OPTS: readonly IaLayout[] = ['echo-hero', 'labeled', 'rank']

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
