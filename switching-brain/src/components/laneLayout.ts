import type { BrainNode } from '../viz/model/types'

/** Prototype axes (bakeoff — see BrainLanes control panel). */
export type IaLayout = 'echo-hero' | 'labeled' | 'rank'
export type PairMode = 'keep' | 'merge'

/** One readable unit: a single region, or a merged bilateral (L+R) pair. */
export interface LaneItem {
  key: string
  primary: BrainNode
  /** The other hemisphere, when a bilateral pair is merged. */
  pair?: BrainNode
  /** L / M / R, or B when a merged bilateral pair. */
  hemi: 'L' | 'M' | 'R' | 'B'
  /** Sort key — the (max) connectivity. */
  degree: number
}

export interface LaneGroup {
  key: string
  /** 'Left' | 'Midline' | 'Right' — undefined for the single 'rank' flow. */
  label?: string
  items: LaneItem[]
}

/** Build the readable items for a lane's nodes, honoring the pair mode. */
export function buildLaneItems(nodes: BrainNode[], pairMode: PairMode): LaneItem[] {
  if (pairMode === 'keep') {
    return nodes.map((n) => ({ key: n.id, primary: n, hemi: n.hemi, degree: n.degree }))
  }
  // merge: group by region label; an L+R group becomes one bilateral item.
  const byLabel = new Map<string, BrainNode[]>()
  for (const n of nodes) {
    const g = byLabel.get(n.label)
    if (g) g.push(n)
    else byLabel.set(n.label, [n])
  }
  const items: LaneItem[] = []
  for (const group of byLabel.values()) {
    if (group.length >= 2) {
      const left = group.find((n) => n.hemi === 'L') ?? group[0]
      const right = group.find((n) => n.hemi === 'R') ?? group[1]
      items.push({
        key: `${left.label}`,
        primary: left,
        pair: right,
        hemi: 'B',
        degree: Math.max(left.degree, right.degree),
      })
    } else {
      const n = group[0]
      items.push({ key: n.id, primary: n, hemi: n.hemi, degree: n.degree })
    }
  }
  return items
}

const byDegreeDesc = (a: LaneItem, b: LaneItem) => b.degree - a.degree

/** Group + order the items for the chosen layout. */
export function groupLaneItems(items: LaneItem[], layout: IaLayout): LaneGroup[] {
  if (layout === 'rank') {
    return [{ key: 'all', items: [...items].sort(byDegreeDesc) }]
  }
  // Hemisphere facets. Bilateral (merged) items sit in the central Midline group.
  const buckets: Record<'L' | 'M' | 'R', LaneItem[]> = { L: [], M: [], R: [] }
  for (const it of items) {
    if (it.hemi === 'L') buckets.L.push(it)
    else if (it.hemi === 'R') buckets.R.push(it)
    else buckets.M.push(it) // M or B (bilateral)
  }
  const order: { key: 'L' | 'M' | 'R'; label: string }[] = [
    { key: 'L', label: 'Left' },
    { key: 'M', label: 'Midline' },
    { key: 'R', label: 'Right' },
  ]
  return order
    .filter(({ key }) => buckets[key].length > 0)
    .map(({ key, label }) => ({ key, label, items: buckets[key].sort(byDegreeDesc) }))
}
