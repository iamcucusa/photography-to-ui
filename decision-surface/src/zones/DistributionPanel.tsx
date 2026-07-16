// F.1 `DistributionPanel` — capability 2 Explain. One country's quartiles
// and startup buckets, outliers toggle, unit switch. Owns `distribution`
// (§G.3). Spread sits next to every median (§C item 4): medians without
// spread mislead. Drawn with d3 primitives to SVG, styled by tokens.

import { useEffect, useMemo, useRef } from 'react'
import { scaleBand, scaleLinear } from 'd3-scale'
import type { Fixtures } from '../data/decode'
import type { InvestigationState, TimeUnit } from '../types'
import { deriveDistribution } from '../data/derive'
import { writeState } from '../state/url'

const QUARTILE_W = 360
const QUARTILE_H = 84
const HIST_W = 360
const HIST_H = 140
const PAD = 24

interface DistributionPanelProps {
  state: InvestigationState
  fixtures: Fixtures
}

export function DistributionPanel({ state, fixtures }: DistributionPanelProps) {
  const dist = state.distribution! // the zone renders only while open
  const panelRef = useRef<HTMLDivElement>(null)

  const distribution = useMemo(
    () =>
      deriveDistribution(
        fixtures.observations,
        dist.countryCode,
        state.provenance,
        dist.unit,
        dist.outliers,
      ),
    [fixtures.observations, dist.countryCode, state.provenance, dist.unit, dist.outliers],
  )
  const countryName =
    fixtures.countries.find((c) => c.code === dist.countryCode)?.name ?? dist.countryCode

  // Focus moves into the panel on open; close returns it to the row (F).
  useEffect(() => {
    panelRef.current?.focus()
    return () => document.getElementById(`dist-trigger-${dist.countryCode}`)?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focus once per mount
  }, [])

  const close = () => writeState({ ...state, distribution: null }, 'push')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Outliers toggle and unit switch are continuous input: replace (F).
  const setOutliers = (outliers: boolean) =>
    writeState({ ...state, distribution: { ...dist, outliers } }, 'replace')
  const setUnit = (unit: TimeUnit) =>
    writeState({ ...state, distribution: { ...dist, unit } }, 'replace')

  const { quartiles, buckets } = distribution
  const fmt = (v: number) => v.toFixed(2)

  const qx = scaleLinear()
    .domain([Math.min(quartiles.min, 0), Math.max(quartiles.max, 0.01)])
    .range([PAD, QUARTILE_W - PAD])
    .nice()

  const bandX = scaleBand<string>()
    .domain(buckets.x)
    .range([PAD, HIST_W - PAD])
    .padding(0.15)
  const histY = scaleLinear()
    .domain([0, Math.max(1, ...buckets.y)])
    .range([HIST_H - PAD, 8])

  const mid = QUARTILE_H / 2

  return (
    <div
      ref={panelRef}
      className="distribution-panel"
      role="dialog"
      aria-label={`Distribution for ${countryName}`}
      tabIndex={-1}
    >
      <header className="panel-header">
        <h2>
          {countryName} <code className="country-code">{dist.countryCode}</code>
        </h2>
        <button type="button" className="btn-quiet" onClick={close}>
          Close
        </button>
      </header>
      <p className="panel-caption">
        Per-site mean enrollment · patients / site / month ·{' '}
        {state.provenance === 'all' ? 'all trial sources' : `${state.provenance} trials`}
      </p>

      <svg
        className="quartile-plot"
        viewBox={`0 0 ${QUARTILE_W} ${QUARTILE_H}`}
        role="img"
        aria-label={`Quartiles: min ${fmt(quartiles.min)}, q1 ${fmt(quartiles.q1)}, median ${fmt(
          quartiles.median,
        )}, q3 ${fmt(quartiles.q3)}, max ${fmt(quartiles.max)}`}
      >
        <line
          className="q-whisker"
          x1={qx(quartiles.min)}
          x2={qx(quartiles.max)}
          y1={mid}
          y2={mid}
        />
        <line
          className="q-cap"
          x1={qx(quartiles.min)}
          x2={qx(quartiles.min)}
          y1={mid - 8}
          y2={mid + 8}
        />
        <line
          className="q-cap"
          x1={qx(quartiles.max)}
          x2={qx(quartiles.max)}
          y1={mid - 8}
          y2={mid + 8}
        />
        <rect
          className="q-box"
          x={qx(quartiles.q1)}
          y={mid - 14}
          width={Math.max(1, qx(quartiles.q3) - qx(quartiles.q1))}
          height={28}
          rx={2}
        >
          <title>{`q1 ${fmt(quartiles.q1)} · q3 ${fmt(quartiles.q3)}`}</title>
        </rect>
        <line
          className="q-median"
          x1={qx(quartiles.median)}
          x2={qx(quartiles.median)}
          y1={mid - 16}
          y2={mid + 16}
        >
          <title>{`median ${fmt(quartiles.median)}`}</title>
        </line>
        <circle className="q-average" cx={qx(quartiles.average)} cy={mid} r={3.5}>
          <title>{`average ${fmt(quartiles.average)}`}</title>
        </circle>
        {qx.ticks(5).map((t) => (
          <text key={t} className="axis-label" x={qx(t)} y={QUARTILE_H - 4} textAnchor="middle">
            {t}
          </text>
        ))}
      </svg>

      <div className="panel-legend">
        <span>min {fmt(quartiles.min)}</span>
        <span>q1 {fmt(quartiles.q1)}</span>
        <span className="legend-median">median {fmt(quartiles.median)}</span>
        <span>q3 {fmt(quartiles.q3)}</span>
        <span>max {fmt(quartiles.max)}</span>
      </div>

      <div className="panel-controls">
        <button
          type="button"
          className="btn"
          aria-pressed={dist.outliers}
          onClick={() => setOutliers(!dist.outliers)}
        >
          Outliers {dist.outliers ? 'shown' : 'hidden'}
        </button>
        <div className="unit-control" role="group" aria-label="Startup time unit">
          <div className="options">
            {(['days', 'weeks', 'months'] as TimeUnit[]).map((unit) => (
              <button
                key={unit}
                type="button"
                aria-pressed={dist.unit === unit}
                onClick={() => setUnit(unit)}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="panel-caption">
        Startup time, activation to first patient · buckets of {buckets.bucketSize} {buckets.unit}
      </p>
      <svg
        className="startup-hist"
        viewBox={`0 0 ${HIST_W} ${HIST_H}`}
        role="img"
        aria-label={`Startup histogram, ${buckets.x.length} buckets of ${buckets.bucketSize} ${buckets.unit}`}
      >
        {buckets.x.map((label, i) => (
          <rect
            key={label}
            className="hist-bar"
            x={bandX(label)}
            y={histY(buckets.y[i])}
            width={bandX.bandwidth()}
            height={HIST_H - PAD - histY(buckets.y[i])}
          >
            <title>{`${label} ${buckets.unit}: ${buckets.y[i]} observations`}</title>
          </rect>
        ))}
        {buckets.x.map((label, i) =>
          buckets.x.length <= 8 || i % 2 === 0 ? (
            <text
              key={label}
              className="axis-label"
              x={(bandX(label) ?? 0) + bandX.bandwidth() / 2}
              y={HIST_H - 8}
              textAnchor="middle"
            >
              {label}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  )
}
