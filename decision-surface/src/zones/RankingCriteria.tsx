// F.1 `RankingCriteria` — capability 4 Steer. The weight vector behind an
// explicit control. Open state is ephemeral by design (§G.3 has no field for
// it). Edits are drafts (I3); the save action is one of the three shared-
// state writes (I1). Weights must total 100% or save stays disabled and the
// remainder is shown (BL3).

import { useEffect, useMemo, useRef, useState } from 'react'
import type { RankingVariable } from '../types'
import type { WeightWrite } from '../data/shared'
import { useDraftsStore, useSharedStore } from '../state/store'

interface RankingCriteriaProps {
  open: boolean
  onClose: () => void
  defaults: RankingVariable[] // the fixture defaults; shared weights overlay them
}

// Each variable's unit, shown with its direction so the weight is judged
// against a concrete quantity.
const METRIC_UNITS: Partial<Record<RankingVariable['metricKey'], string>> = {
  historicalMedianEnrollmentRate: 'pts/site/mo',
  predictedEnrollmentRate: 'pts/site/mo',
  performanceRatio: 'achieved ÷ target',
  medianStartupTime: 'days',
  siteToSiteVariability: 'IQR ÷ median',
}

function toPercents(
  defaults: RankingVariable[],
  writes: WeightWrite[] | null,
): Record<string, number> {
  const byId = new Map(writes?.map((w) => [w.id, w.weight]))
  return Object.fromEntries(
    defaults.map((v) => [v.id, Math.round((byId.get(v.id) ?? v.weight) * 100)]),
  )
}

export function RankingCriteria({ open, onClose, defaults }: RankingCriteriaProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const sharedWeights = useSharedStore((s) => s.weights)
  const saveWeights = useSharedStore((s) => s.saveWeights)
  const weightEdits = useDraftsStore((s) => s.weightEdits)
  const setWeightEdits = useDraftsStore((s) => s.setWeightEdits)

  const [percents, setPercents] = useState<Record<string, number>>({})

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      // Resume the surviving draft if one exists (BL9), else the weights in force.
      setPercents(toPercents(defaults, weightEdits ?? sharedWeights))
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, defaults, weightEdits, sharedWeights])

  const total = useMemo(() => Object.values(percents).reduce((sum, v) => sum + v, 0), [percents])
  const remaining = 100 - total

  const edit = (id: string, value: number) => {
    const next = { ...percents, [id]: Number.isFinite(value) ? value : 0 }
    setPercents(next)
    // Drafts persist locally while editing — never in the URL, never shared (I3).
    setWeightEdits(defaults.map((v) => ({ id: v.id, weight: (next[v.id] ?? 0) / 100 })))
  }

  const save = () => {
    if (total !== 100) return
    saveWeights(defaults.map((v) => ({ id: v.id, weight: (percents[v.id] ?? 0) / 100 })))
    setWeightEdits(null)
    onClose()
  }

  const cancel = () => {
    setWeightEdits(null) // Cancel discards draft weights; committed weights untouched
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="ranking-dialog"
      aria-label="Ranking criteria"
      onCancel={(e) => {
        e.preventDefault()
        cancel()
      }}
    >
      <h2>Ranking criteria</h2>
      <p className="dialog-hint">
        Rank changes only through these weights. Scores recompute when you save.
      </p>
      <div className="weight-rows">
        {defaults.map((v) => (
          <label key={v.id} className="weight-row">
            <span className="weight-title">
              {v.title}
              <span className="weight-direction">
                {METRIC_UNITS[v.metricKey] ?? ''} ·{' '}
                {v.contribution === 'Inverse' ? 'lower is better' : 'higher is better'}
              </span>
            </span>
            <span className="weight-input">
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                value={percents[v.id] ?? 0}
                onChange={(e) => edit(v.id, e.target.valueAsNumber)}
              />
              %
            </span>
          </label>
        ))}
      </div>
      <div className={`weight-total${total !== 100 ? ' is-invalid' : ''}`} aria-live="polite">
        Total {total}%{total !== 100 && <span> · Remaining {remaining}%</span>}
      </div>
      <div className="dialog-actions">
        <button type="button" className="btn-quiet" onClick={cancel}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={save} disabled={total !== 100}>
          Save weights
        </button>
      </div>
    </dialog>
  )
}
