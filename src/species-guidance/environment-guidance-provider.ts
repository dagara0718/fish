import type { OfficialItem } from '../../shared/fishing-api'
import type { TrustStatus } from '../domain/contracts'
import type { OfficialFishingPointRef } from '../official-index/contracts'
import type { CelsiusRange, EnvironmentBasedSpeciesGuidance } from './contracts'
import { classifyCurrentSpeed, classifySeason, classifyTide, classifyTimeOfDay, classifyWaterTemperature, computeSuitability } from './scoring-policy'
import { SPECIES_PROFILES } from './species-profiles'

function formatDate(ymd?: string) { return ymd ? `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}` : '기준일 미확인' }

// Computes guidance from the same raw per-point KHOA records `normalizeOfficial` already parses —
// never from officialGrade/officialScore (v1.4 REQ-FUNC-GUIDANCE-003). "기타어종" and any species
// without a cited SpeciesProfile never appear here (REQ-FUNC-GUIDANCE-004).
export function computeEnvironmentGuidance(records: OfficialItem[], point: OfficialFishingPointRef, today: string, profiles = SPECIES_PROFILES): EnvironmentBasedSpeciesGuidance[] {
  if (!records.length) return []
  const reference = records[0]!
  const observedTemp: CelsiusRange | undefined = reference.minWtem !== undefined || reference.maxWtem !== undefined
    ? { min: reference.minWtem ?? reference.maxWtem!, max: reference.maxWtem ?? reference.minWtem! }
    : undefined
  const month = reference.predcYmd ? Number(reference.predcYmd.slice(4, 6)) : undefined
  const evaluatedAt = `${formatDate(reference.predcYmd)} · ${reference.predcNoonSeCd ?? '시간구분 미확인'}`
  const trustStatus: TrustStatus = reference.predcYmd && reference.predcYmd < today ? 'STALE' : 'UNVERIFIED'
  return profiles.map(profile => {
    const factors = [
      classifyWaterTemperature(profile, observedTemp),
      classifySeason(profile, month),
      classifyCurrentSpeed(),
      classifyTide(),
      classifyTimeOfDay(),
    ]
    return {
      assessmentType: 'ENVIRONMENT_BASED_GUIDANCE' as const,
      speciesId: profile.speciesId,
      speciesName: profile.canonicalName,
      suitability: computeSuitability(factors),
      factors,
      evaluatedAt,
      environmentReference: point,
      profileVersion: profile.profileVersion,
      trustStatus,
    }
  })
}
