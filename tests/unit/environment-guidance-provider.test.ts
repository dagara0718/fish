import { describe, expect, it } from 'vitest'
import { computeEnvironmentGuidance } from '../../src/species-guidance/environment-guidance-provider'
import { PROFILE_VERSION, SPECIES_PROFILES } from '../../src/species-guidance/species-profiles'
import type { OfficialItem } from '../../shared/fishing-api'
import type { OfficialFishingPointRef } from '../../src/official-index/contracts'

const point: OfficialFishingPointRef = { officialPointId: 'p', linkedPointId: 'p', placeName: '가거도', regionContext: '공식', fishingType: '갯바위', latitude: 34.07308, longitude: 125.08805 }

// Sanitized shape of the real KHOA response confirmed 2026-09-16 (no real key/PII).
const realShapedRecord: OfficialItem = { seafsPstnNm: '가거도', lat: 34.07308, lot: 125.08805, predcYmd: '20260916', predcNoonSeCd: '오전', seafsTgfshNm: '참돔', totalIndex: '좋음', minWtem: 24.3, maxWtem: 24.4, minWvhgt: 0.2, maxWvhgt: 0.2, minCrsp: 0.2, maxCrsp: 0.4, minWspd: 5.1, maxWspd: 5.5 }

describe('computeEnvironmentGuidance', () => {
  it('excludes 기타어종 and any species without a profile', () => {
    const guidance = computeEnvironmentGuidance([realShapedRecord], point, '20260916')
    expect(guidance.some(item => item.speciesName === '기타어종')).toBe(false)
    expect(guidance.map(item => item.speciesName).sort()).toEqual([...SPECIES_PROFILES.map(profile => profile.canonicalName)].sort())
  })
  it('never reads officialGrade/officialScore — identical output regardless of totalIndex', () => {
    const a = computeEnvironmentGuidance([realShapedRecord], point, '20260916')
    const b = computeEnvironmentGuidance([{ ...realShapedRecord, totalIndex: '매우나쁨' }], point, '20260916')
    expect(a).toEqual(b)
  })
  it('returns UNKNOWN current speed and tide for every species (no cited evidence in v1.4)', () => {
    const guidance = computeEnvironmentGuidance([realShapedRecord], point, '20260916')
    for (const item of guidance) {
      expect(item.factors.find(f => f.factor === 'CURRENT_SPEED')?.status).toBe('UNKNOWN')
      expect(item.factors.find(f => f.factor === 'TIDE')?.status).toBe('UNKNOWN')
    }
  })
  it('preserves partial environment data — missing temperature yields UNKNOWN, not a synthetic value', () => {
    const { minWtem, maxWtem, ...noTemp } = realShapedRecord; void minWtem; void maxWtem
    const guidance = computeEnvironmentGuidance([noTemp], point, '20260916')
    for (const item of guidance) expect(item.factors.find(f => f.factor === 'WATER_TEMPERATURE')?.status).toBe('UNKNOWN')
  })
  it('produces INSUFFICIENT_EVIDENCE for species with only water temperature evidence (감성돔, 농어)', () => {
    const guidance = computeEnvironmentGuidance([realShapedRecord], point, '20260916')
    expect(guidance.find(item => item.speciesName === '감성돔')?.suitability).toBe('INSUFFICIENT_EVIDENCE')
    expect(guidance.find(item => item.speciesName === '농어')?.suitability).toBe('INSUFFICIENT_EVIDENCE')
  })
  it('propagates STALE trust when the reference forecast date is in the past, independent of species-index conflict', () => {
    const past = { ...realShapedRecord, predcYmd: '20200101' }
    const guidance = computeEnvironmentGuidance([past], point, '20260916')
    expect(guidance.every(item => item.trustStatus === 'STALE')).toBe(true)
  })
  it('never resolves to CONFIRMED trust — only STALE or UNVERIFIED', () => {
    const guidance = computeEnvironmentGuidance([realShapedRecord], point, '20260916')
    expect(guidance.every(item => item.trustStatus === 'UNVERIFIED' || item.trustStatus === 'STALE')).toBe(true)
  })
  it('is deterministic for identical inputs', () => {
    const a = computeEnvironmentGuidance([realShapedRecord], point, '20260916')
    const b = computeEnvironmentGuidance([realShapedRecord], point, '20260916')
    expect(a).toEqual(b)
  })
  it('retains the profile version used', () => {
    const guidance = computeEnvironmentGuidance([realShapedRecord], point, '20260916')
    expect(guidance.every(item => item.profileVersion === PROFILE_VERSION)).toBe(true)
  })
  it('returns an empty array with no records, never a synthetic species', () => {
    expect(computeEnvironmentGuidance([], point, '20260916')).toEqual([])
  })
})
