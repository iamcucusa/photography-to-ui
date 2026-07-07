import { useMemo } from 'react'
import type { VizTokens } from '../../viz/runtimeTokens'
import { withAlpha } from '../../viz/runtimeTokens'
import { polylinePath } from './silhouette'
import { buildField, type FieldNet, type RawNode } from './buildField'

/**
 * The brain field — drawn from the EXTRACTED mockup geometry (see buildField):
 * traced nodes at exact positions, per-hemisphere Delaunay web, the actual
 * boundary swept into a luminous rim, salience spider, callosal butterfly.
 * Colors resolve through DS tokens only. Pure draw layer.
 */
export function BrainField({ tokens, raw }: { tokens: VizTokens; raw: RawNode[] }) {
  const field = useMemo(() => buildField(raw), [raw])
  const { nodes, edges, fibers, snEdges, outline, midX, center, vw, vh } = field
  const dmn = tokens.network.DMN
  const sn = tokens.network.SN
  const neutral = tokens.nodeLabel

  const color = (net: FieldNet) => (net === 'neutral' ? neutral : tokens.network[net].bright)

  const regular = nodes.filter((n) => !n.hub && !n.sup)
  const hubs = nodes.filter((n) => n.hub)
  const sup = nodes.find((n) => n.sup)

  return (
    <svg
      className="brain-field"
      viewBox={`0 0 ${vw} ${vh}`}
      role="img"
      aria-label="Brain field prototype"
    >
      <defs>
        {/* Tight glow — nodes stay crisp dots (the mockup), not blooms. Calibrate
            this against a REAL browser; the MCP screenshot crushes screen-blend. */}
        <filter id="brain-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
      </defs>

      {/* Encircling arc */}
      <circle
        cx={midX}
        cy={center.y}
        r={400}
        fill="none"
        stroke={withAlpha(neutral, 0.1)}
        strokeWidth={1}
        strokeDasharray="2 9"
      />
      {/* Dashed midline + magenta end dots */}
      <line
        x1={midX}
        y1={40}
        x2={midX}
        y2={vh - 100}
        stroke={withAlpha(sn.base, 0.32)}
        strokeWidth={1}
        strokeDasharray="2 8"
      />
      <circle cx={midX} cy={40} r={4} fill={withAlpha(sn.bright, 0.9)} />
      <circle cx={midX} cy={vh - 100} r={4} fill={withAlpha(sn.bright, 0.9)} />

      {/* Luminous rim — the actual traced border, swept + smoothed */}
      <g fill="none" strokeLinecap="round" style={{ mixBlendMode: 'screen' }}>
        <g filter="url(#brain-glow)" stroke={withAlpha(dmn.bright, 0.38)} strokeWidth={2.4}>
          <path d={polylinePath(outline)} />
        </g>
        <g stroke={withAlpha(dmn.base, 0.42)} strokeWidth={1.1}>
          <path d={polylinePath(outline)} />
        </g>
      </g>

      {/* Connectome mesh — Delaunay web, faded by edge length */}
      <g fill="none" strokeWidth={1}>
        {edges.map((e, i) => (
          <line
            key={`e${i}`}
            x1={e.a.x.toFixed(1)}
            y1={e.a.y.toFixed(1)}
            x2={e.b.x.toFixed(1)}
            y2={e.b.y.toFixed(1)}
            stroke={withAlpha(dmn.base, 0.3 * (1 - e.t) + 0.07)}
          />
        ))}
      </g>

      {/* Salience spokes — the hub's magenta sub-network */}
      <g fill="none" strokeLinecap="round">
        {snEdges.map((e, i) => (
          <line
            key={`s${i}`}
            x1={e.x1.toFixed(1)}
            y1={e.y1.toFixed(1)}
            x2={e.x2.toFixed(1)}
            y2={e.y2.toFixed(1)}
            stroke={withAlpha(sn.bright, 0.28 + 0.34 * e.w)}
            strokeWidth={1.5}
          />
        ))}
      </g>

      {/* Hub + super-hub glow — gaussian-blurred, screen-blended */}
      <g filter="url(#brain-glow)" style={{ mixBlendMode: 'screen' }}>
        {hubs.map((n, i) => (
          <circle
            key={`h${i}`}
            cx={n.x}
            cy={n.y}
            r={n.r * 1.3}
            fill={withAlpha(color(n.net), 0.42)}
          />
        ))}
        {sup && (
          <>
            <circle cx={sup.x} cy={sup.y} r={sup.r * 2.6} fill={withAlpha(sn.bright, 0.34)} />
            <circle cx={sup.x} cy={sup.y} r={sup.r * 1.35} fill={withAlpha(sn.bright, 0.6)} />
          </>
        )}
      </g>

      {/* Regular nodes at their traced positions (radii damped — the trace
          inflates dots with their glow halos; the crisp core is smaller) */}
      <g>
        {regular.map((n, i) => (
          <circle
            key={`n${i}`}
            cx={n.x.toFixed(1)}
            cy={n.y.toFixed(1)}
            r={(n.r * 0.75).toFixed(2)}
            fill={withAlpha(color(n.net), n.net === 'neutral' ? 0.6 : 0.82)}
          />
        ))}
      </g>

      {/* Callosal light bands — over the node field */}
      <g fill="none" strokeLinecap="round" style={{ mixBlendMode: 'screen' }}>
        {fibers.map((f, i) => (
          <path
            key={`f${i}`}
            d={f.d}
            stroke={withAlpha(neutral, 0.1 + 0.26 * f.w)}
            strokeWidth={(0.9 + f.w * 1.1).toFixed(2)}
          />
        ))}
      </g>

      {/* Hub cores */}
      <g>
        {hubs.map((n, i) => (
          <circle
            key={`hc${i}`}
            cx={n.x.toFixed(1)}
            cy={n.y.toFixed(1)}
            r={n.r.toFixed(2)}
            fill={withAlpha(color(n.net), 0.98)}
          />
        ))}
      </g>

      {/* Super-hub core + hot centre + concentric target ring */}
      {sup && (
        <g>
          <circle
            cx={sup.x}
            cy={sup.y}
            r={sup.r * 2.4}
            fill="none"
            stroke={withAlpha(sn.bright, 0.45)}
            strokeWidth={1.2}
          />
          <circle cx={sup.x} cy={sup.y} r={sup.r * 1.1} fill={withAlpha(sn.bright, 1)} />
          <circle cx={sup.x} cy={sup.y} r={sup.r * 0.5} fill={withAlpha(neutral, 0.9)} />
        </g>
      )}
    </svg>
  )
}
