import { useEffect, useMemo, useState } from 'react'
import { readTokens } from '../viz/runtimeTokens'
import { BrainField } from './brain/BrainField'
import type { RawNode } from './brain/buildField'
import './proto.css'

const OVERLAY_STEPS = [0, 0.35, 0.7]

/**
 * TEMPORARY hero prototype (reached at #proto — see main.tsx). A 16:9 stage for
 * building the new high-fidelity brain SVG in isolation, from geometry extracted
 * out of the vectorized mockup (public/proto-nodes.json, untracked dev data).
 * Press "r" to cycle the vectorized-mockup overlay (public/proto-ref.svg) for
 * A/B fidelity checks. The shipped App is untouched.
 */
export function HeroProto() {
  const tokens = useMemo(() => readTokens(), [])
  const [raw, setRaw] = useState<RawNode[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [overlay, setOverlay] = useState(0)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}proto-nodes.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: RawNode[]) => setRaw(data))
      .catch(() => setFailed(true))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') setOverlay((o) => (o + 1) % OVERLAY_STEPS.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <main className="hero-proto">
      <div className="hero-proto__stage">
        {raw && <BrainField tokens={tokens} raw={raw} />}
        {OVERLAY_STEPS[overlay] > 0 && (
          <img
            className="hero-proto__ref"
            src={`${import.meta.env.BASE_URL}proto-ref.svg`}
            style={{ opacity: OVERLAY_STEPS[overlay] }}
            alt=""
            aria-hidden="true"
          />
        )}
      </div>
      <p className="hero-proto__tag">
        {failed
          ? 'missing public/proto-nodes.json — run the extractor (dev-only data)'
          : `brain field · prototype · #proto · [r] ref overlay ${Math.round(OVERLAY_STEPS[overlay] * 100)}%`}
      </p>
    </main>
  )
}
