import type { OfficialFishingPointRef } from './contracts'

export type FishingAccessStatusKind = 'ALLOWED_CONFIRMED' | 'PROHIBITED_CONFIRMED' | 'RESTRICTED' | 'CHECK_REQUIRED' | 'NO_EVIDENCE' | 'CONFLICT'

export interface FishingAccessEvidence { source: string; note: string }

export interface FishingAccessStatus { status: FishingAccessStatusKind; evidence: FishingAccessEvidence[]; checkedAt: string }

// Distinct from TrustStatus (data collection/freshness) and from official grade/score (fishing
// condition). Never merge these into one enum or one badge — see v1.3-product-delta.md.
export interface FishingAccessProvider {
  getAccessStatus(point: OfficialFishingPointRef, checkedAt?: string): Promise<FishingAccessStatus>
}

// No 낚시금지구역/항만 출입통제/보호구역 API is connected in this release (see "Deferred sources" in
// v1.3-product-delta.md). This provider never infers ALLOWED_CONFIRMED from the absence of a
// prohibition record — it always reports CHECK_REQUIRED with no evidence.
export class UnverifiedFishingAccessProvider implements FishingAccessProvider {
  async getAccessStatus(_point: OfficialFishingPointRef, checkedAt: string = new Date().toISOString()): Promise<FishingAccessStatus> {
    return { status: 'CHECK_REQUIRED', evidence: [], checkedAt }
  }
}
