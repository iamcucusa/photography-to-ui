// Runtime validation at the data boundary. Fixtures are decoded exactly as a
// real API response would be: every record checked against the data-spec §3
// shapes, extra keys rejected, typed shapes only past this point.

import type { Country, Observation, Prediction, RankingVariable, Site, Trial } from '../types'

export interface Fixtures {
  trial: Trial
  countries: Country[]
  sites: Site[]
  observations: Observation[]
  predictions: Prediction[]
  rankingVariables: RankingVariable[]
}

export class DecodeError extends Error {}

function fail(path: string, expected: string): never {
  throw new DecodeError(`${path}: expected ${expected}`)
}

function obj(u: unknown, path: string, keys: readonly string[]): Record<string, unknown> {
  if (typeof u !== 'object' || u === null || Array.isArray(u)) fail(path, 'object')
  const rec = u as Record<string, unknown>
  const extra = Object.keys(rec).filter((k) => !keys.includes(k))
  if (extra.length > 0) fail(path, `no extra keys (found ${extra.join(', ')})`)
  return rec
}

function arr(u: unknown, path: string): unknown[] {
  if (!Array.isArray(u)) fail(path, 'array')
  return u
}

function str(u: unknown, path: string): string {
  if (typeof u !== 'string' || u.length === 0) fail(path, 'non-empty string')
  return u
}

function num(u: unknown, path: string): number {
  if (typeof u !== 'number' || !Number.isFinite(u)) fail(path, 'finite number')
  return u
}

function bool(u: unknown, path: string): boolean {
  if (typeof u !== 'boolean') fail(path, 'boolean')
  return u
}

function oneOf<T extends string>(u: unknown, path: string, values: readonly T[]): T {
  const s = str(u, path)
  if (!(values as readonly string[]).includes(s)) fail(path, values.join(' | '))
  return s as T
}

const OBSERVATION_KEYS = [
  'id',
  'siteId',
  'countryCode',
  'sourceTrialId',
  'benchmark',
  'enrollmentRatePSM',
  'targetEnrollmentRatePSM',
  'startupDays',
  'investigatorIds',
] as const

export function decodeObservation(u: unknown, path: string): Observation {
  const r = obj(u, path, OBSERVATION_KEYS)
  return {
    id: str(r.id, `${path}.id`),
    siteId: str(r.siteId, `${path}.siteId`),
    countryCode: str(r.countryCode, `${path}.countryCode`),
    sourceTrialId: str(r.sourceTrialId, `${path}.sourceTrialId`),
    benchmark: bool(r.benchmark, `${path}.benchmark`),
    enrollmentRatePSM: num(r.enrollmentRatePSM, `${path}.enrollmentRatePSM`),
    targetEnrollmentRatePSM: num(r.targetEnrollmentRatePSM, `${path}.targetEnrollmentRatePSM`),
    startupDays: num(r.startupDays, `${path}.startupDays`),
    investigatorIds: arr(r.investigatorIds, `${path}.investigatorIds`).map((v, i) =>
      str(v, `${path}.investigatorIds[${i}]`),
    ),
  }
}

export function decodePrediction(u: unknown, path: string): Prediction {
  const r = obj(u, path, ['countryCode', 'predictedEnrollmentRatePSM', 'predictedStartupDays'])
  return {
    countryCode: str(r.countryCode, `${path}.countryCode`),
    predictedEnrollmentRatePSM: num(
      r.predictedEnrollmentRatePSM,
      `${path}.predictedEnrollmentRatePSM`,
    ),
    predictedStartupDays: num(r.predictedStartupDays, `${path}.predictedStartupDays`),
  }
}

const RANKING_VARIABLE_KEYS = [
  'id',
  'name',
  'title',
  'metricKey',
  'weight',
  'isDefault',
  'varType',
  'contribution',
] as const

// C4: every metricKey maps to a derivable CountryMetrics field.
const DERIVABLE_KEYS = [
  'totalSites',
  'totalInvestigators',
  'multiTrialInvestigators',
  'historicalMedianEnrollmentRate',
  'predictedEnrollmentRate',
  'performanceRatio',
  'medianStartupTime',
  'predictedStartupTime',
  'siteToSiteVariability',
] as const

export function decodeRankingVariable(u: unknown, path: string): RankingVariable {
  const r = obj(u, path, RANKING_VARIABLE_KEYS)
  return {
    id: str(r.id, `${path}.id`),
    name: str(r.name, `${path}.name`),
    title: str(r.title, `${path}.title`),
    metricKey: oneOf(r.metricKey, `${path}.metricKey`, DERIVABLE_KEYS),
    weight: num(r.weight, `${path}.weight`),
    isDefault: bool(r.isDefault, `${path}.isDefault`),
    varType: oneOf(r.varType, `${path}.varType`, ['Binary', 'Numeric'] as const),
    contribution: oneOf(r.contribution, `${path}.contribution`, ['Direct', 'Inverse'] as const),
  }
}

export function decodeTrial(u: unknown, path: string): Trial {
  const r = obj(u, path, ['id', 'name', 'candidateCountries'])
  return {
    id: str(r.id, `${path}.id`),
    name: str(r.name, `${path}.name`),
    candidateCountries: arr(r.candidateCountries, `${path}.candidateCountries`).map((v, i) =>
      str(v, `${path}.candidateCountries[${i}]`),
    ),
  }
}

export function decodeCountry(u: unknown, path: string): Country {
  const r = obj(u, path, ['code', 'name'])
  return { code: str(r.code, `${path}.code`), name: str(r.name, `${path}.name`) }
}

export function decodeSite(u: unknown, path: string): Site {
  const r = obj(u, path, ['id', 'name'])
  return { id: str(r.id, `${path}.id`), name: str(r.name, `${path}.name`) }
}

export function decodeFixtures(raw: {
  trial: unknown
  countries: unknown
  sites: unknown
  observations: unknown
  predictions: unknown
  rankingVariables: unknown
}): Fixtures {
  return {
    trial: decodeTrial(raw.trial, 'trial'),
    countries: arr(raw.countries, 'countries').map((v, i) => decodeCountry(v, `countries[${i}]`)),
    sites: arr(raw.sites, 'sites').map((v, i) => decodeSite(v, `sites[${i}]`)),
    observations: arr(raw.observations, 'observations').map((v, i) =>
      decodeObservation(v, `observations[${i}]`),
    ),
    predictions: arr(raw.predictions, 'predictions').map((v, i) =>
      decodePrediction(v, `predictions[${i}]`),
    ),
    rankingVariables: arr(raw.rankingVariables, 'rankingVariables').map((v, i) =>
      decodeRankingVariable(v, `rankingVariables[${i}]`),
    ),
  }
}

// Dynamic imports keep the fixtures out of the initial JS chunk: they load
// as a separate async chunk after first paint (§H.3 fixture budget).
export async function loadFixtures(): Promise<Fixtures> {
  const [trial, countries, sites, observations, predictions, rankingVariables] = await Promise.all([
    import('./fixtures/trial.json'),
    import('./fixtures/countries.json'),
    import('./fixtures/sites.json'),
    import('./fixtures/observations.json'),
    import('./fixtures/predictions.json'),
    import('./fixtures/ranking-variables.json'),
  ])
  return decodeFixtures({
    trial: trial.default,
    countries: countries.default,
    sites: sites.default,
    observations: observations.default,
    predictions: predictions.default,
    rankingVariables: rankingVariables.default,
  })
}
