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
  // v1.6.6: 감성돔/농어 gained cited season windows, so the "no temperature range → INSUFFICIENT" rule
  // is now exercised by 벵에돔 (season cited, adult temperature range not — egg-stage data excluded).
  it('produces INSUFFICIENT_EVIDENCE for a species without a cited water temperature range (벵에돔)', () => {
    const guidance = computeEnvironmentGuidance([realShapedRecord], point, '20260916')
    const blackfish = guidance.find(item => item.speciesName === '벵에돔')!
    expect(blackfish.suitability).toBe('INSUFFICIENT_EVIDENCE')
    expect(blackfish.factors.find(f => f.factor === 'WATER_TEMPERATURE')?.status).toBe('UNKNOWN')
    expect(blackfish.factors.find(f => f.factor === 'SEASON')?.status).not.toBe('UNKNOWN')
  })
  it('evaluates the v1.6.6 cited profiles against 24.3~24.4℃ in September (rule table unchanged)', () => {
    const guidance = computeEnvironmentGuidance([realShapedRecord], point, '20260916')
    const level = (name: string) => guidance.find(item => item.speciesName === name)?.suitability
    expect(level('돌돔')).toBe('HIGH') // 20~28℃ preferred, 5~11월 normal feeding (NIFS 돔류)
    expect(level('감성돔')).toBe('MODERATE') // temperature MATCH, but September is outside 3~7월 spawning
    expect(level('농어')).toBe('MODERATE') // 21~27℃ MATCH, September outside 12~3월
    expect(level('우럭')).toBe('MODERATE') // above the 17~20℃ optimum but within 4~27℃ survival
    expect(level('참돔')).toBe('MODERATE') // was LOW only because of the 18℃ placeholder ceiling

  })
  it('evaluates the v1.6.7 species that KHOA does not grade (광어, 쥐노래미, 볼락)', () => {
    const guidance = computeEnvironmentGuidance([realShapedRecord], point, '20260916')
    const level = (name: string) => guidance.find(item => item.speciesName === name)?.suitability
    expect(level('광어')).toBe('MODERATE') // 18~25℃ MATCH, September outside 2~6월
    expect(level('쥐노래미')).toBe('LOW') // 24.3℃ is above both 15~20 and 14~23
    expect(level('볼락')).toBe('INSUFFICIENT_EVIDENCE') // season cited, no temperature range
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
