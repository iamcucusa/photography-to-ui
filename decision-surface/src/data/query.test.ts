import { describe, expect, it } from 'vitest'
import type { Observation } from '../types'
import { querySites } from './query'

function obs(id: string, startupDays: number, benchmark: boolean): Observation {
  return {
    id,
    siteId: `site-AAA-${id}`,
    countryCode: 'AAA',
    sourceTrialId: 'src-01',
    benchmark,
    enrollmentRatePSM: 1,
    targetEnrollmentRatePSM: 1,
    startupDays,
    investigatorIds: [],
  }
}

// Deliberately unsorted, with a duplicate sort value to exercise the tiebreak.
const rows: Observation[] = [
  obs('obs-3', 200, true),
  obs('obs-1', 300, true),
  obs('obs-4', 200, false),
  obs('obs-2', 100, true),
  obs('obs-5', 50, false),
]

describe('querySites (the keyset contract, §G.2 — never offsets)', () => {
  it('sorts by (sortField, id) with id as the tiebreak', () => {
    const page = querySites(rows, { scope: 'all', sortField: 'startupDays', sortOrder: 1 })
    expect(page.rows.map((r) => r.id)).toEqual(['obs-5', 'obs-2', 'obs-3', 'obs-4', 'obs-1'])
    expect(page.nextCursor).toBeNull()
  })

  it('pages through an opaque cursor without skipping or repeating rows', () => {
    const first = querySites(rows, {
      scope: 'all',
      sortField: 'startupDays',
      sortOrder: 1,
      limit: 2,
    })
    expect(first.rows.map((r) => r.id)).toEqual(['obs-5', 'obs-2'])
    expect(first.nextCursor).not.toBeNull()
    const second = querySites(rows, {
      scope: 'all',
      sortField: 'startupDays',
      sortOrder: 1,
      after: first.nextCursor!,
      limit: 2,
    })
    expect(second.rows.map((r) => r.id)).toEqual(['obs-3', 'obs-4'])
    const third = querySites(rows, {
      scope: 'all',
      sortField: 'startupDays',
      sortOrder: 1,
      after: second.nextCursor!,
      limit: 2,
    })
    expect(third.rows.map((r) => r.id)).toEqual(['obs-1'])
    expect(third.nextCursor).toBeNull()
  })

  it('seeks correctly through duplicate sort values (the tiebreak matters)', () => {
    const first = querySites(rows, {
      scope: 'all',
      sortField: 'startupDays',
      sortOrder: 1,
      limit: 3,
    })
    expect(first.rows.map((r) => r.id)).toEqual(['obs-5', 'obs-2', 'obs-3'])
    const rest = querySites(rows, {
      scope: 'all',
      sortField: 'startupDays',
      sortOrder: 1,
      after: first.nextCursor!,
      limit: 3,
    })
    expect(rest.rows.map((r) => r.id)).toEqual(['obs-4', 'obs-1'])
  })

  it('sorts descending with the same stable tiebreak', () => {
    const page = querySites(rows, { scope: 'all', sortField: 'startupDays', sortOrder: -1 })
    expect(page.rows.map((r) => r.id)).toEqual(['obs-1', 'obs-3', 'obs-4', 'obs-2', 'obs-5'])
  })

  it('scopes by provenance before paging', () => {
    const page = querySites(rows, { scope: 'benchmark', sortField: 'startupDays', sortOrder: 1 })
    expect(page.rows.map((r) => r.id)).toEqual(['obs-2', 'obs-3', 'obs-1'])
  })

  it('treats a corrupt cursor as end-of-data, never as an offset', () => {
    const page = querySites(rows, {
      scope: 'all',
      sortField: 'startupDays',
      sortOrder: 1,
      after: 'not-a-cursor',
    })
    expect(page.rows).toEqual([])
    expect(page.nextCursor).toBeNull()
  })
})
