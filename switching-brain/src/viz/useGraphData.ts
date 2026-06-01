import { useEffect, useState } from 'react'
import type { BrainGraph } from './model/types'
import { NETWORK_IDS } from './model/types'

export type GraphLoadState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; graph: BrainGraph }

/** Basic shape validation so a malformed file becomes the data-error flow, not a crash. */
function validate(data: unknown): BrainGraph {
  if (!data || typeof data !== 'object') throw new Error('nodes.json is not an object')
  const g = data as Partial<BrainGraph>
  if (!Array.isArray(g.nodes) || g.nodes.length === 0) throw new Error('nodes.json has no nodes')
  if (!Array.isArray(g.edges)) throw new Error('nodes.json has no edges array')
  const ids = new Set(g.nodes.map((n) => n.id))
  for (const n of g.nodes) {
    if (!n.id || !NETWORK_IDS.includes(n.network)) {
      throw new Error(`node "${n.id ?? '?'}" has an invalid id or network`)
    }
  }
  for (const e of g.edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) {
      throw new Error(`edge ${e.source}→${e.target} references an unknown node`)
    }
  }
  return g as BrainGraph
}

/**
 * Load the brain graph from public/data/nodes.json at runtime. Fetching (not
 * importing) keeps the data swappable with no rebuild and gives us a real
 * error path — the brief forbids a silent blank canvas.
 */
export function useGraphData(): GraphLoadState {
  const [state, setState] = useState<GraphLoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    const url = `${import.meta.env.BASE_URL}data/nodes.json`
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`)
        return res.json()
      })
      .then((json) => {
        if (cancelled) return
        setState({ status: 'ready', graph: validate(json) })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setState({ status: 'error', error: err instanceof Error ? err.message : String(err) })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
