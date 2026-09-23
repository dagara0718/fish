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
// v1.6.3: '전류' is 전류(轉流) — the turn of the tidal current — not an "instantaneous current" as v1.6
// read it. Live rows (2026-09-24, 가거도 public point) show '전류' at ~2 cm/s midway between a
// '최강낙조류' (70 cm/s) and a '최강창조류' (67 cm/s). The UI shows KHOA's own label verbatim.
export type CurrentType = 'SLACK' | 'PEAK_FLOOD' | 'PEAK_EBB' // 전류 / 최강창조류 / 최강낙조류
export type ObservationType = 'OBSERVED' | 'FORECAST' | 'MODELLED'
export type MarineDataStatus = 'SUCCESS' | 'PARTIAL' | 'STALE' | 'UNAVAILABLE' | 'UNSUPPORTED_AREA' | 'NOT_CONNECTED'

export interface MarineCurrentObservation {
  sourceType: 'TIDAL_CURRENT'
  sourceName: string
  latitude: number
  longitude: number
  // v1.6.3: KHOA's real response ships `type: ""` on most rows — only the few event rows (전류,
  // 최강창조류, 최강낙조류) are labeled; the 10-minute rows between them are unlabeled (live, 2026-09-24).
  // Undocumented by the official contract. Absent (undefined) means "KHOA did not label this row,"
  // never a guess. speed/direction/forecastAt remain valid and are never discarded for this reason.
  currentType?: CurrentType
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
  // v1.6.3: whether SDate/SHour/SMinute (the request) and obs_date (the response) are KST or UTC is
  // not stated by KHOA's API page or the data.go.kr listing (re-checked 2026-09-24), and a live 200
  // response proves nothing either way — a forecast service answers whatever window is asked.
  // 'UNCONFIRMED' until an authoritative source settles it. No code path assumes KST or UTC: the
  // provider requests a window containing the real present under both readings (requestWindow) and
  // the UI never marks any row as "now"/"현재".
  timeBasis: 'UNCONFIRMED'
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
