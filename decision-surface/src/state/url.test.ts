import { describe, expect, it } from 'vitest'
import type { InvestigationState } from '../types'
import { defaultState, parseState, serializeState } from './url'

function fullState(): InvestigationState {
  return {
    trialId: 'trial-001',
    provenance: 'benchmark',
    countriesScope: 'selected',
    evidenceFamily: 'timelines',
    list: { sortField: 'medianStartupTime', sortOrder: 1, filterText: 'pol' },
    distribution: { countryCode: 'POL', outliers: false, unit: 'weeks' },
    sites: { sortField: 'startupDays', sortOrder: -1 },
    highlight: ['POL', 'ESP'],
  }
}

describe('serializeState (the F.2 canonical serializer)', () => {
  it('omits every default: the plain entry URL is trial/trial-001', () => {
    expect(serializeState(defaultState('trial-001'))).toBe('trial/trial-001')
  })

  it('serializes parameters in the F.2 table order', () => {
    expect(serializeState(fullState())).toBe(
      'trial/trial-001?prov=benchmark&scope=selected&family=timelines' +
        '&sort=medianStartupTime:asc&q=pol&dist=POL:outliers:weeks' +
        '&sites=startupDays:desc&hl=POL,ESP',
    )
  })

  it('omits individual parameters at their defaults', () => {
    const state = defaultState('trial-001')
    state.evidenceFamily = 'enrollment-performance'
    expect(serializeState(state)).toBe('trial/trial-001?family=enrollment-performance')
  })

  it('produces byte-equal links for equal states (link equality is state equality, BL7)', () => {
    expect(serializeState(fullState())).toBe(serializeState(structuredClone(fullState())))
  })
})

describe('parseState', () => {
  it('round-trips the full state exactly', () => {
    const url = serializeState(fullState())
    const [path, search] = url.split('?')
    expect(parseState(path, search)).toEqual(fullState())
  })

  it('round-trips the default state', () => {
    expect(parseState('trial/trial-001', '')).toEqual(defaultState('trial-001'))
  })

  it('reads percent-encoded values too', () => {
    const state = parseState('trial/trial-001', 'dist=POL%3Aall%3Adays&hl=POL%2CESP')
    expect(state?.distribution).toEqual({ countryCode: 'POL', outliers: true, unit: 'days' })
    expect(state?.highlight).toEqual(['POL', 'ESP'])
  })

  it('falls back to defaults on malformed parameters — a link never dead-ends', () => {
    const state = parseState(
      'trial/trial-001',
      'prov=nope&sort=hacked:up&dist=X&sites=nope:asc&hl=lowercase',
    )
    expect(state).toEqual(defaultState('trial-001'))
  })

  it('ignores the retired page param from older links', () => {
    expect(parseState('trial/trial-001', 'page=2')).toEqual(defaultState('trial-001'))
  })

  it('rejects non-trial paths so the app can redirect to the entry URL', () => {
    expect(parseState('somewhere/else', '')).toBeNull()
    expect(parseState('', '')).toBeNull()
  })

  it('accepts a leading slash and a trailing slash', () => {
    expect(parseState('/trial/trial-001/', '')).toEqual(defaultState('trial-001'))
  })
})

describe('push vs replace guidance (history semantics)', () => {
  // The write mode is the caller's, per the interaction-contract tables:
  // discrete navigation pushes, continuous input (search typing, outliers,
  // unit switch) replaces. This suite pins the serializer side: continuous
  // edits produce distinct canonical URLs so replace never loses state.
  it('search text lands in q and re-serializes canonically', () => {
    const state = defaultState('trial-001')
    state.list.filterText = 'sp ain'
    const url = serializeState(state)
    expect(url).toBe('trial/trial-001?q=sp%20ain')
    const [path, search] = url.split('?')
    expect(parseState(path, search)?.list.filterText).toBe('sp ain')
  })

  it('outliers and unit edits change only the dist token', () => {
    const state = fullState()
    state.distribution = { countryCode: 'POL', outliers: true, unit: 'months' }
    expect(serializeState(state)).toContain('dist=POL:all:months')
  })
})
