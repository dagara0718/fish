import type { OfficialFishingPointRef } from '../official-index/contracts'
import type { TrustStatus } from '../domain/contracts'

// A rule-based, explainable estimate of environmental fit — never a catch probability, never an
// AI/ML claim. See specs/001-point-decision-brief/v1.4-product-delta.md.
export type SuitabilityLevel = 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_EVIDENCE'

export type FactorType = 'WATER_TEMPERATURE' | 'SEASON' | 'CURRENT_SPEED' | 'TIDE' | 'TIME_OF_DAY'

export type FactorResultStatus = 'MATCH' | 'PARTIAL_MATCH' | 'MISMATCH' | 'UNKNOWN'

export interface FactorResult {
  factor: FactorType
  status: FactorResultStatus
  label: string
  detail: string
}

// Tracked in domain/research even though the UI does not surface it directly (v1.5
// REQ-NFR-EVIDENCE-001). A namu.wiki/news/hobbyist-fishing-site source is SECONDARY at best — never
// the sole basis for a numeric threshold. Only PRIMARY_GOVERNMENT/PEER_REVIEWED/ACADEMIC_INSTITUTION
// evidence may back a SpeciesProfile numeric range or season window.
export type EvidenceQuality = 'PRIMARY_GOVERNMENT' | 'PEER_REVIEWED' | 'ACADEMIC_INSTITUTION' | 'SECONDARY' | 'UNVERIFIED'

export interface SpeciesEvidence {
  sourceTitle: string
  sourceOrganization: string
  sourceUrl: string
  retrievedAt: string
  supportedClaim: string
  quality: EvidenceQuality
}

export interface CelsiusRange { min: number; max: number }

export interface SpeciesProfile {
  speciesId: string
  canonicalName: string
  aliases: string[]
  // Range within which the species is documented as actively feeding/thriving. UNKNOWN (undefined)
  // when no cited source states one — never a guessed number.
  preferredWaterTemperature?: CelsiusRange
  // Broader range within which the species is merely documented as present/tolerant.
  toleratedWaterTemperature?: CelsiusRange
  // Months (1-12) with a documented spawning/active-feeding claim. UNKNOWN when no source states one.
  seasonalActiveMonths?: number[]
  habitatContext?: string
  evidence: SpeciesEvidence[]
  profileVersion: string
  reviewedAt: string
}

export interface EnvironmentBasedSpeciesGuidance {
  assessmentType: 'ENVIRONMENT_BASED_GUIDANCE'
  speciesId: string
  speciesName: string
  suitability: SuitabilityLevel
  factors: FactorResult[]
  evaluatedAt: string
  environmentReference: OfficialFishingPointRef
  profileVersion: string
  trustStatus: TrustStatus
}

export interface SpeciesGuidanceProvider {
  getGuidance(point: OfficialFishingPointRef): EnvironmentBasedSpeciesGuidance[]
}

// v1.6: the KHOA 수치조류도 contract is verified (research/marine-current-source-review.md) — speed
// (cm/s) and a numeric bearing (deg) are both provided, but the bearing's convention ("flowing
// toward" vs "flowing from", true vs magnetic north) is not stated anywhere in the official contract.
// directionConvention therefore stays 'UNKNOWN' unconditionally; no code path may assume one.
export type CurrentType = 'INSTANTANEOUS' | 'PEAK_FLOOD' | 'PEAK_EBB' // 전류 / 최강창조류 / 최강낙조류
export type ObservationType = 'OBSERVED' | 'FORECAST' | 'MODELLED'
export type MarineDataStatus = 'SUCCESS' | 'PARTIAL' | 'STALE' | 'UNAVAILABLE' | 'UNSUPPORTED_AREA' | 'NOT_CONNECTED'

export interface MarineCurrentObservation {
  sourceType: 'TIDAL_CURRENT'
  sourceName: string
  latitude: number
  longitude: number
  currentType: CurrentType
  speed?: number
  speedUnit?: 'cm/s'
  direction?: number
  directionUnit?: 'deg'
  directionConvention: 'UNKNOWN'
  observationType: ObservationType
  // KHOA matches the nearest point within a stated 1km bound but never echoes that matched point's
  // own coordinate — so a real distance cannot be computed. This states the contract's own bound
  // instead of a fabricated "N km away" figure.
  spatialReference: string
  forecastAt: string
  sourceTimestamp: string
  trustStatus: TrustStatus
}

export interface MarineCurrentResult {
  status: MarineDataStatus
  observations: MarineCurrentObservation[]
  reason?: string
}

export interface MarineCurrentQuery { latitude: number; longitude: number; at?: Date }
export interface MarineCurrentProvider {
  getCurrentObservations(query: MarineCurrentQuery, signal?: AbortSignal): Promise<MarineCurrentResult>
}
export class NotConnectedMarineCurrentProvider implements MarineCurrentProvider {
  async getCurrentObservations(): Promise<MarineCurrentResult> { return { status: 'NOT_CONNECTED', observations: [] } }
}
