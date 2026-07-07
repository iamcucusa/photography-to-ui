export type DeskMode = 'board' | 'accordion'

/**
 * Desktop-only layout toggle (rendered by BrainLanes on the board tier): read the
 * three networks side-by-side as Columns (Board — the default) or stacked as a
 * vertical Stacked list (Accordion). Two toggle buttons, the active one lit; the
 * icons carry the horizontal/vertical meaning. Neutral chrome — no network hue.
 */
export function LanesViewToggle({
  mode,
  onChange,
}: {
  mode: DeskMode
  onChange: (m: DeskMode) => void
}) {
  return (
    <div className="lanes-view" role="group" aria-label="Reading layout">
      <button
        type="button"
        className="lanes-view__btn"
        data-active={mode === 'board'}
        aria-pressed={mode === 'board'}
        onClick={() => onChange('board')}
      >
        <svg className="lanes-view__icon" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="1.5" y="3" width="3.4" height="10" />
          <rect x="6.3" y="3" width="3.4" height="10" />
          <rect x="11.1" y="3" width="3.4" height="10" />
        </svg>
        Columns
      </button>
      <button
        type="button"
        className="lanes-view__btn"
        data-active={mode === 'accordion'}
        aria-pressed={mode === 'accordion'}
        onClick={() => onChange('accordion')}
      >
        <svg className="lanes-view__icon" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="3" y="1.5" width="10" height="3.4" />
          <rect x="3" y="6.3" width="10" height="3.4" />
          <rect x="3" y="11.1" width="10" height="3.4" />
        </svg>
        Stacked
      </button>
    </div>
  )
}
