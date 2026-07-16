import { describe, expect, it } from 'vitest'
import type { Finding } from '../types'
import { decodeFixtures } from '../data/decode'
import { applyWeights } from '../data/derive'
import { defaultState } from '../state/url'
import { mergeFindings, runAtlas, validateFinding } from './checks'
import trial from '../data/fixtures/trial.json'
import countries from '../data/fixtures/countries.json'
import observations from '../data/fixtures/observations.json'
import predictions from '../data/fixtures/predictions.json'
import rankingVariables from '../data/fixtures/ranking-variables.json'

const fixtures = decodeFixtures({
  trial,
  countries,
  observations,
  predictions,
  rankingVariables,
})

function finding(partial: Partial<Finding>): Finding {
  return {
    id: 'finding-x',
    claim: 'A claim.',
    derivedFrom: [['POL', 'ranking']],
    suggestedState: defaultState('trial-001'),
    status: 'proposed',
    ...partial,
  }
}

describe('validateFinding (BL5: no claim without evidence and a restorable view)', () => {
  it('accepts a complete finding', () => {
    expect(validateFinding(finding({}))).toBe(true)
  })

  it('rejects findings without derivedFrom, suggestedState, or a claim', () => {
    expect(validateFinding(finding({ derivedFrom: [] }))).toBe(false)
    expect(
      validateFinding(finding({ suggestedState: null as unknown as Finding['suggestedState'] })),
    ).toBe(false)
    expect(validateFinding(finding({ claim: '   ' }))).toBe(false)
  })

  it('rejects malformed evidence pairs', () => {
    expect(
      validateFinding(finding({ derivedFrom: [['POL']] as unknown as Finding['derivedFrom'] })),
    ).toBe(false)
  })
})

describe('mergeFindings (Flow C re-run: statuses are signal, BL6)', () => {
  it('replaces stale proposed findings with the fresh run', () => {
    const previous = [finding({ id: 'a', claim: 'stale' })]
    const fresh = [finding({ id: 'a', claim: 'fresh' }), finding({ id: 'b' })]
    expect(mergeFindings(previous, fresh).map((f) => f.claim)).toEqual(['fresh', 'A claim.'])
  })

  it('keeps accepted/rejected findings and suppresses re-proposing them', () => {
    const previous = [finding({ id: 'a', status: 'rejected', claim: 'answered' })]
    const merged = mergeFindings(previous, [
      finding({ id: 'a', claim: 'again' }),
      finding({ id: 'b' }),
    ])
    expect(merged.map((f) => f.id).sort()).toEqual(['a', 'b'])
    expect(merged.find((f) => f.id === 'a')?.claim).toBe('answered')
    expect(merged.find((f) => f.id === 'a')?.status).toBe('rejected')
  })
})

// The data-spec scenario probes double as the acceptance tests for Atlas's
// checks: the same derivations that validated the fixtures are the ones
// Atlas runs in Flow C.
describe('runAtlas on the real fixtures (S1 and S3 detectable from derived data alone)', () => {
  const findings = runAtlas(fixtures, applyWeights(fixtures.rankingVariables, null), 'trial-001')

  it('emits only valid findings', () => {
    expect(findings.length).toBeGreaterThan(0)
    for (const f of findings) expect(validateFinding(f)).toBe(true)
  })

  it('finds the single-weight carrier (S1: POL carried by startup time)', () => {
    const carrier = findings.find((f) => f.id === 'finding-carrier-POL')
    expect(carrier).toBeDefined()
    expect(carrier?.suggestedState.highlight).toEqual(['POL'])
    expect(carrier?.suggestedState.evidenceFamily).toBe('timelines')
    expect(carrier?.derivedFrom).toContainEqual(['POL', 'medianStartupTime'])
  })

  it('finds the provenance flip (S3: top 5 reorders benchmark-only, ESP moves)', () => {
    const flip = findings.find((f) => f.id === 'finding-provenance-flip')
    expect(flip).toBeDefined()
    expect(flip?.suggestedState.provenance).toBe('benchmark')
    expect(flip?.suggestedState.highlight).toContain('ESP')
  })

  it('fires on the planted countries, not broadly (probe rule: ≤ 2 others)', () => {
    const carriers = findings.filter((f) => f.id.startsWith('finding-carrier-'))
    expect(carriers.length).toBeLessThanOrEqual(3) // POL plus at most two others
  })
})
