import { describe, expect, it } from 'vitest'
import {
  DecodeError,
  decodeObservation,
  decodeRankingVariable,
  decodeSite,
  decodeTrial,
} from './decode'

const validObservation = {
  id: 'obs-00001',
  siteId: 'site-ARG-01',
  countryCode: 'ARG',
  sourceTrialId: 'src-01',
  benchmark: true,
  enrollmentRatePSM: 0.42,
  targetEnrollmentRatePSM: 0.55,
  startupDays: 148,
  investigatorIds: ['inv-ARG-014'],
}

describe('decode (runtime validation at the boundary)', () => {
  it('decodes a valid observation', () => {
    expect(decodeObservation(validObservation, 'obs')).toEqual(validObservation)
  })

  it('rejects a wrongly typed field', () => {
    expect(() => decodeObservation({ ...validObservation, startupDays: '148' }, 'obs')).toThrow(
      DecodeError,
    )
  })

  it('rejects extra keys (fixtures carry no runtime or derived fields, C7/C8)', () => {
    expect(() => decodeObservation({ ...validObservation, ranking: 1 }, 'obs')).toThrow(
      /no extra keys/,
    )
  })

  it('rejects a metricKey that is not a derivable field (C4)', () => {
    const variable = {
      id: 'rv-01',
      name: 'x',
      title: 'X',
      metricKey: 'selected',
      weight: 1,
      isDefault: true,
      varType: 'Numeric',
      contribution: 'Direct',
    }
    expect(() => decodeRankingVariable(variable, 'rv')).toThrow(DecodeError)
  })

  it('decodes the trial shape', () => {
    const trial = { id: 'trial-001', name: 'T', candidateCountries: ['ARG'] }
    expect(decodeTrial(trial, 'trial')).toEqual(trial)
  })

  it('decodes site reference records and rejects extra keys', () => {
    const site = { id: 'site-ARG-01', name: 'Córdoba Oncology Institute' }
    expect(decodeSite(site, 'sites[0]')).toEqual(site)
    expect(() => decodeSite({ ...site, ranking: 1 }, 'sites[0]')).toThrow(/no extra keys/)
  })
})
