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

// KHOA's minCrsp/maxCrsp is speed-only (no direction) per the verified contract. No code path may
// infer a direction from it. This boundary exists so a future directional source can be added
// without changing the detail panel's rendering contract — see
// specs/001-point-decision-brief/research/marine-current-source-review.md.
export interface MarineCurrentStatus { status: 'NOT_CONNECTED' }
export interface MarineCurrentProvider {
  getCurrentDirection(point: OfficialFishingPointRef, signal?: AbortSignal): Promise<MarineCurrentStatus>
}
export class NotConnectedMarineCurrentProvider implements MarineCurrentProvider {
  async getCurrentDirection(): Promise<MarineCurrentStatus> { return { status: 'NOT_CONNECTED' } }
}
