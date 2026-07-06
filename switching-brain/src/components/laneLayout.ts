import type { BrainNode } from '../viz/model/types'

/** Prototype axis still under review (bakeoff — see BrainLanes control panel). */
export type IaLayout = 'echo-hero' | 'labeled' | 'rank'

/** One readable unit: a single region. Bilateral L/R twins each stand on their
 *  own (the concluded "keep" pairing), linked by the mirror mark. */
export interface LaneItem {
  key: string
  primary: BrainNode
  hemi: 'L' | 'M' | 'R'
  /** Sort key — the connectivity. */
  degree: number
  /** The contralateral twin's id, if this region is bilateral — the entry marks
   *  it so the shared role prose reads as symmetry, not a duplicate. */
  mirror?: string
}

export interface LaneGroup {
  key: string
  /** 'Left' | 'Midline' | 'Right' — undefined for the single 'rank' flow. */
  label?: string
  items: LaneItem[]
}

/** Build the readable items for a lane's nodes. Every region stands on its own;
 *  bilateral twins are flagged with the contralateral id for the mirror mark. */
export function buildLaneItems(nodes: BrainNode[]): LaneItem[] {
  const byLabel = new Map<string, BrainNode[]>()
  for (const n of nodes) {
    const g = byLabel.get(n.label)
    if (g) g.push(n)
    else byLabel.set(n.label, [n])
  }
  return nodes.map((n) => {
    const twin = byLabel.get(n.label)!.find((o) => o.id !== n.id && o.hemi !== n.hemi)
    return { key: n.id, primary: n, hemi: n.hemi, degree: n.degree, mirror: twin?.id }
  })
}

const byDegreeDesc = (a: LaneItem, b: LaneItem) => b.degree - a.degree

/** Group + order the items for the chosen layout. */
export function groupLaneItems(items: LaneItem[], layout: IaLayout): LaneGroup[] {
  if (layout === 'rank') {
    return [{ key: 'all', items: [...items].sort(byDegreeDesc) }]
  }
  // Hemisphere facets: Left / Midline / Right.
  const buckets: Record<'L' | 'M' | 'R', LaneItem[]> = { L: [], M: [], R: [] }
  for (const it of items) {
    if (it.hemi === 'L') buckets.L.push(it)
    else if (it.hemi === 'R') buckets.R.push(it)
    else buckets.M.push(it)
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
