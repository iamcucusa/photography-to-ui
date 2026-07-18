import { describe, expect, it } from 'vitest'
import type { Observation, Prediction, RankingVariable } from '../types'
import type { Fixtures } from './decode'
import {
  computeRanking,
  computeStats,
  deriveCountryRows,
  deriveDistribution,
  filterRows,
  quartiles,
  sortRows,
} from './derive'

function obs(partial: Partial<Observation> & { id: string }): Observation {
  return {
    siteId: 'site-AAA-01',
    countryCode: 'AAA',
    sourceTrialId: 'src-01',
    benchmark: true,
    enrollmentRatePSM: 1,
    targetEnrollmentRatePSM: 1,
    startupDays: 100,
    investigatorIds: [],
    ...partial,
  }
}

function variable(partial: Partial<RankingVariable>): RankingVariable {
  return {
    id: 'rv-01',
    name: 'historical-enrollment',
    title: 'Historical enrollment rate',
    metricKey: 'historicalMedianEnrollmentRate',
    weight: 1,
    isDefault: true,
    varType: 'Numeric',
    contribution: 'Direct',
    ...partial,
  }
}

const prediction: Prediction = {
  countryCode: 'AAA',
  predictedEnrollmentRatePSM: 0.5,
  predictedStartupDays: 120,
}

describe('quartiles (exclusive method, matches the fixture validator)', () => {
  it('interpolates with (n+1) positions', () => {
    expect(quartiles([1, 2, 3, 4])).toEqual({ q1: 1.25, q3: 3.75 })
  })

  it('clamps at the extremes for tiny series', () => {
    expect(quartiles([5])).toEqual({ q1: 5, q3: 5 })
  })
})

describe('computeStats (data-spec §4 derivations, one truth-source each)', () => {
  const observations: Observation[] = [
    obs({
      id: 'o1',
      siteId: 's1',
      enrollmentRatePSM: 1,
      targetEnrollmentRatePSM: 2,
      startupDays: 100,
      sourceTrialId: 't1',
      investigatorIds: ['i1'],
    }),
    obs({
      id: 'o2',
      siteId: 's2',
      enrollmentRatePSM: 2,
      targetEnrollmentRatePSM: 2,
      startupDays: 200,
      sourceTrialId: 't2',
      investigatorIds: ['i1'],
    }),
    obs({
      id: 'o3',
      siteId: 's3',
      enrollmentRatePSM: 3,
      targetEnrollmentRatePSM: 2,
      startupDays: 300,
      sourceTrialId: 't1',
      investigatorIds: ['i2'],
    }),
    obs({
      id: 'o4',
      siteId: 's4',
      enrollmentRatePSM: 4,
      targetEnrollmentRatePSM: 2,
      startupDays: 400,
      sourceTrialId: 't1',
      investigatorIds: ['i3'],
    }),
  ]
  const stats = computeStats(observations, prediction)

  it('counts sites, investigators, and multi-trial investigators', () => {
    expect(stats.totalSites).toBe(4)
    expect(stats.totalInvestigators).toBe(3)
    expect(stats.multiTrialInvestigators).toBe(1) // i1 appears in t1 and t2
  })

  it('takes medians over observations', () => {
    expect(stats.historicalMedianEnrollmentRate).toBe(2.5)
    expect(stats.medianStartupTime).toBe(250)
    expect(stats.performanceRatio).toBe(1.25) // median of 0.5, 1, 1.5, 2
  })

  it('reads predictions, never derives them (L2)', () => {
    expect(stats.predictedEnrollmentRate).toBe(0.5)
    expect(stats.predictedStartupTime).toBe(120)
  })

  it('computes variability as IQR over median of per-site means', () => {
    // site means [1,2,3,4]: (3.75 − 1.25) / 2.5
    expect(stats.siteToSiteVariability).toBe(1)
  })
})

describe('computeRanking (dense rank descending, alphabetical ties)', () => {
  it('assigns dense ranks with ties sharing a rank', () => {
    const ranking = computeRanking(
      new Map([
        ['CCC', 0.5],
        ['AAA', 0.5],
        ['BBB', 0.8],
        ['DDD', 0.3],
      ]),
    )
    expect(ranking.get('BBB')).toBe(1)
    expect(ranking.get('AAA')).toBe(2)
    expect(ranking.get('CCC')).toBe(2)
    expect(ranking.get('DDD')).toBe(3)
  })
})

function twoCountryFixtures(): Fixtures {
  return {
    trial: { id: 'trial-001', name: 'T', candidateCountries: ['AAA', 'BBB'] },
    countries: [
      { code: 'AAA', name: 'Alpha' },
      { code: 'BBB', name: 'Beta' },
    ],
    sites: [],
    observations: [
      obs({
        id: 'o1',
        siteId: 'site-AAA-01',
        countryCode: 'AAA',
        enrollmentRatePSM: 2,
        benchmark: true,
      }),
      obs({
        id: 'o2',
        siteId: 'site-AAA-02',
        countryCode: 'AAA',
        enrollmentRatePSM: 2,
        benchmark: false,
      }),
      obs({
        id: 'o3',
        siteId: 'site-BBB-01',
        countryCode: 'BBB',
        enrollmentRatePSM: 1,
        benchmark: true,
      }),
      obs({
        id: 'o4',
        siteId: 'site-BBB-02',
        countryCode: 'BBB',
        enrollmentRatePSM: 1,
        benchmark: false,
      }),
    ],
    predictions: [
      { countryCode: 'AAA', predictedEnrollmentRatePSM: 0.5, predictedStartupDays: 100 },
      { countryCode: 'BBB', predictedEnrollmentRatePSM: 0.5, predictedStartupDays: 100 },
    ],
    rankingVariables: [variable({})],
  }
}

describe('deriveCountryRows (§G.1 rank algorithm, BL1)', () => {
  it('ranks by weighted normalized composite, best = 1', () => {
    const rows = deriveCountryRows({
      fixtures: twoCountryFixtures(),
      provenance: 'all',
      variables: [variable({})],
      selected: new Set(),
    })
    const byCode = new Map(rows.map((r) => [r.countryCode, r]))
    expect(byCode.get('AAA')?.ranking).toBe(1)
    expect(byCode.get('BBB')?.ranking).toBe(2)
  })

  it('flips the normalized value for Inverse contributions', () => {
    const rows = deriveCountryRows({
      fixtures: twoCountryFixtures(),
      provenance: 'all',
      variables: [variable({ contribution: 'Inverse' })],
      selected: new Set(),
    })
    const byCode = new Map(rows.map((r) => [r.countryCode, r]))
    expect(byCode.get('BBB')?.ranking).toBe(1)
    expect(byCode.get('AAA')?.ranking).toBe(2)
  })

  it('keeps rank scope-independent: provenance filters metrics, never rank (BL1)', () => {
    const fixtures = twoCountryFixtures()
    const all = deriveCountryRows({
      fixtures,
      provenance: 'all',
      variables: [variable({})],
      selected: new Set(),
    })
    const bench = deriveCountryRows({
      fixtures,
      provenance: 'benchmark',
      variables: [variable({})],
      selected: new Set(),
    })
    for (const row of bench) {
      expect(row.ranking).toBe(all.find((r) => r.countryCode === row.countryCode)?.ranking)
      expect(row.provenance).toBe('benchmark')
    }
  })

  it('carries the runtime selection bit', () => {
    const rows = deriveCountryRows({
      fixtures: twoCountryFixtures(),
      provenance: 'all',
      variables: [variable({})],
      selected: new Set(['BBB']),
    })
    expect(rows.find((r) => r.countryCode === 'BBB')?.selected).toBe(true)
    expect(rows.find((r) => r.countryCode === 'AAA')?.selected).toBe(false)
  })
})

describe('sortRows / filterRows (view-level, never Atlas input)', () => {
  const rows = deriveCountryRows({
    fixtures: twoCountryFixtures(),
    provenance: 'all',
    variables: [variable({})],
    selected: new Set(['BBB']),
  })

  it('ranking:desc renders the answer first (rank 1 on top)', () => {
    expect(sortRows(rows, 'ranking', -1).map((r) => r.ranking)).toEqual([1, 2])
    expect(sortRows(rows, 'ranking', 1).map((r) => r.ranking)).toEqual([2, 1])
  })

  it('sorts numeric metric fields with countryCode as tiebreak', () => {
    const sorted = sortRows(rows, 'historicalMedianEnrollmentRate', 1)
    expect(sorted.map((r) => r.countryCode)).toEqual(['BBB', 'AAA'])
  })

  it('filters by country name text and selected scope', () => {
    expect(filterRows(rows, 'alp', 'all').map((r) => r.countryCode)).toEqual(['AAA'])
    expect(filterRows(rows, '', 'selected').map((r) => r.countryCode)).toEqual(['BBB'])
  })

  it('selected scope follows the in-view selection when a pending draft exists (BL9)', () => {
    // committed = BBB, but the user has checked AAA (pending): the scope
    // filter must follow the checkboxes on screen, not the committed set.
    expect(filterRows(rows, '', 'selected', new Set(['AAA'])).map((r) => r.countryCode)).toEqual([
      'AAA',
    ])
    // an empty pending draft under selected scope shows nothing, visibly
    expect(filterRows(rows, '', 'selected', new Set())).toEqual([])
  })
})

describe('deriveDistribution (§G.2)', () => {
  const observations: Observation[] = [
    obs({ id: 'o1', siteId: 's1', startupDays: 50, enrollmentRatePSM: 1 }),
    obs({ id: 'o2', siteId: 's2', startupDays: 150, enrollmentRatePSM: 2 }),
    obs({ id: 'o3', siteId: 's3', startupDays: 160, enrollmentRatePSM: 3 }),
    obs({ id: 'o4', siteId: 's4', startupDays: 350, enrollmentRatePSM: 4 }),
  ]

  it('buckets startupDays at size 100 for days', () => {
    const d = deriveDistribution(observations, 'AAA', 'all', 'days', true)
    expect(d.buckets).toEqual({
      unit: 'days',
      bucketSize: 100,
      x: ['0–99', '100–199', '200–299', '300–399'],
      y: [1, 2, 0, 1],
    })
  })

  it('re-buckets on unit switch', () => {
    const d = deriveDistribution(observations, 'AAA', 'all', 'weeks', true)
    expect(d.buckets.unit).toBe('weeks')
    expect(d.buckets.bucketSize).toBe(14)
    expect(d.buckets.y.reduce((a, b) => a + b, 0)).toBe(4)
  })

  it('orders quartiles min ≤ q1 ≤ median ≤ q3 ≤ max (C5)', () => {
    const { min, q1, median, q3, max } = deriveDistribution(
      observations,
      'AAA',
      'all',
      'days',
      true,
    ).quartiles
    expect(min).toBeLessThanOrEqual(q1)
    expect(q1).toBeLessThanOrEqual(median)
    expect(median).toBeLessThanOrEqual(q3)
    expect(q3).toBeLessThanOrEqual(max)
  })
})
