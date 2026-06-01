interface SelfMapProps {
  /** Explore↔ship axis [-1,1]: −1 = explore-forever, +1 = ship-rigid, 0 = balanced. */
  axis: number
  onAxis: (axis: number) => void
  onSeeBalance: () => void
}

function selfMapTakeaway(axis: number): string {
  if (axis < -0.33)
    return 'You’re exploring forever. Ideas keep coming, shipping keeps slipping. Your brain is dwelling in the Default network.'
  if (axis > 0.33)
    return 'You’re building rigidly. Heads-down execution, little exploration. Your brain is dwelling in Control.'
  return 'You’re near balance. Switching freely between exploring and shipping, the flow your best work comes from.'
}

/**
 * Self-map ("where are you right now?"). The explore↔ship axis IS the entry — no
 * button. The handle is *you*: a glowing switch you drag along a warm→cool track
 * (DMN → FPCN) to tilt the brain toward your current state; the takeaway names it
 * and "see balance" eases you back to the sweet spot.
 */
export function SelfMap({ axis, onAxis, onSeeBalance }: SelfMapProps) {
  const tilted = Math.abs(axis) > 0.33

  return (
    <section className="selfmap" aria-label="Where are you right now?">
      <p className="selfmap__prompt-text">Where are you right now?</p>

      <div className="selfmap__axis">
        <span className="selfmap__end">Explore</span>
        <input
          id="selfmap-axis"
          className="selfmap__slider"
          type="range"
          min={-1}
          max={1}
          step={0.01}
          value={axis}
          aria-label="Place yourself on the explore-to-ship axis"
          aria-valuetext={selfMapTakeaway(axis)}
          onChange={(e) => onAxis(Number(e.target.value))}
        />
        <span className="selfmap__end">Ship</span>
      </div>

      <p className="selfmap__takeaway" aria-live="polite">
        {tilted ? selfMapTakeaway(axis) : 'Drag the switch to place yourself.'}
      </p>

      {tilted && (
        <button type="button" className="selfmap__balance" onClick={onSeeBalance}>
          See what balance feels like
        </button>
      )}
    </section>
  )
}
