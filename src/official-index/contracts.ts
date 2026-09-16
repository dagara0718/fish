import type { TrustStatus } from '../domain/contracts'

export type AssessmentType = 'OFFICIAL_FISHING_INDEX' | 'ENVIRONMENT_BASED_GUIDANCE'
export type FishingType = '갯바위' | '선상'

export interface OfficialFishingPointRef {
  officialPointId: string
  linkedPointId: string
  placeName: string
  regionContext: string
  fishingType: FishingType
  latitude: number
  longitude: number
}

export interface LocationCandidate {
  point: OfficialFishingPointRef
  mappingMethod: 'DISTANCE_CANDIDATE'
  distanceKm: number
  userConfirmed: false
}

export interface OfficialSpeciesIndex {
  assessmentType: 'OFFICIAL_FISHING_INDEX'
  speciesId: string
  speciesName: string
  officialGrade: string
  officialScore?: number
  evaluatedAt: string
  officialPointId: string
  source: string
  trustStatus: TrustStatus
}

export interface EnvironmentalObservation {
  metricType: 'WATER_TEMPERATURE' | 'WAVE_HEIGHT' | 'CURRENT_SPEED' | 'WIND_SPEED' | 'TIDE'
  label: string
  value: string
  unit?: string
  forecastAt: string
  source: string
  sourceTimestamp: string
  trustStatus: TrustStatus
}

export interface MarineEnvironmentSnapshot {
  locationReference: OfficialFishingPointRef
  evaluatedAt: string
  observations: EnvironmentalObservation[]
}

export type OfficialIndexResult =
  | { kind: 'SUCCESS' | 'PARTIAL' | 'STALE_CACHE'; point: OfficialFishingPointRef; species: OfficialSpeciesIndex[]; environment: MarineEnvironmentSnapshot; demo: boolean }
  | { kind: 'COLLECTION_FAILED'; point: OfficialFishingPointRef; reason: string; demo: boolean }
  | { kind: 'UNSUPPORTED_POINT'; reason: string; demo: boolean }

export interface OfficialFishingIndexProvider {
  getOfficialIndex(point: OfficialFishingPointRef, signal?: AbortSignal): Promise<OfficialIndexResult>
}
