import { describe, expect, it } from 'vitest'
import { classifyCurrentSpeed, classifySeason, classifyTide, classifyTimeOfDay, classifyWaterTemperature, computeSuitability } from '../../src/species-guidance/scoring-policy'
import type { SpeciesProfile } from '../../src/species-guidance/contracts'

const profile: SpeciesProfile = {
  speciesId: 'test-species', canonicalName: '테스트어종', aliases: [],
  preferredWaterTemperature: { min: 18, max: 20 },
  toleratedWaterTemperature: { min: 10, max: 26 },
  seasonalActiveMonths: [4, 5, 6],
  evidence: [{ sourceTitle: 't', sourceOrganization: 'o', sourceUrl: 'https://example.com', retrievedAt: '2026-09-16T00:00:00.000Z', supportedClaim: 'c', quality: 'PEER_REVIEWED' }],
  profileVersion: 'test-v1', reviewedAt: '2026-09-16T00:00:00.000Z',
}

describe('classifyWaterTemperature', () => {
  it('MATCH when observed overlaps the preferred range', () => { expect(classifyWaterTemperature(profile, { min: 18.5, max: 19.5 }).status).toBe('MATCH') })
  it('PARTIAL_MATCH when observed overlaps only the tolerated range', () => { expect(classifyWaterTemperature(profile, { min: 11, max: 12 }).status).toBe('PARTIAL_MATCH') })
  it('MISMATCH when observed overlaps neither range', () => { expect(classifyWaterTemperature(profile, { min: 30, max: 32 }).status).toBe('MISMATCH') })
  it('UNKNOWN when there is no observed temperature', () => { expect(classifyWaterTemperature(profile, undefined).status).toBe('UNKNOWN') })
  it('UNKNOWN when the profile has no temperature evidence at all', () => {
    const { preferredWaterTemperature, toleratedWaterTemperature, ...rest } = profile
    void preferredWaterTemperature; void toleratedWaterTemperature
    expect(classifyWaterTemperature(rest, { min: 18, max: 19 }).status).toBe('UNKNOWN')
  })
})

describe('classifySeason', () => {
  it('MATCH inside the documented active months', () => { expect(classifySeason(profile, 5).status).toBe('MATCH') })
  it('PARTIAL_MATCH adjacent to the documented window', () => { expect(classifySeason(profile, 7).status).toBe('PARTIAL_MATCH') })
  it('MISMATCH far from the documented window', () => { expect(classifySeason(profile, 12).status).toBe('MISMATCH') })
  it('UNKNOWN with no month input', () => { expect(classifySeason(profile, undefined).status).toBe('UNKNOWN') })
  it('UNKNOWN when the profile has no seasonal evidence', () => {
    const { seasonalActiveMonths, ...rest } = profile; void seasonalActiveMonths
    expect(classifySeason(rest, 5).status).toBe('UNKNOWN')
  })
})

describe('current speed / tide / time of day (no cited evidence for any species in v1.4)', () => {
  it('current speed is always UNKNOWN, never a fabricated match', () => { expect(classifyCurrentSpeed().status).toBe('UNKNOWN') })
  it('tide is always UNKNOWN, never a fabricated match', () => { expect(classifyTide().status).toBe('UNKNOWN') })
  it('time of day is always UNKNOWN, never a fabricated match', () => { expect(classifyTimeOfDay().status).toBe('UNKNOWN') })
})

describe('computeSuitability', () => {
  const factor = (over: object) => ({ factor: 'WATER_TEMPERATURE' as const, label: '수온', status: 'MATCH' as const, detail: '', ...over })
  it('INSUFFICIENT_EVIDENCE when temperature itself is UNKNOWN', () => {
    expect(computeSuitability([factor({ status: 'UNKNOWN' }), { factor: 'SEASON', label: '계절', status: 'MATCH', detail: '' }])).toBe('INSUFFICIENT_EVIDENCE')
  })
  it('INSUFFICIENT_EVIDENCE when fewer than two factors are evaluable', () => {
    expect(computeSuitability([factor({ status: 'MATCH' }), { factor: 'SEASON', label: '계절', status: 'UNKNOWN', detail: '' }])).toBe('INSUFFICIENT_EVIDENCE')
  })
  it('LOW when temperature is a MISMATCH', () => {
    expect(computeSuitability([factor({ status: 'MISMATCH' }), { factor: 'SEASON', label: '계절', status: 'MATCH', detail: '' }])).toBe('LOW')
  })
  it('HIGH when temperature MATCHes and nothing else mismatches', () => {
    expect(computeSuitability([factor({ status: 'MATCH' }), { factor: 'SEASON', label: '계절', status: 'MATCH', detail: '' }])).toBe('HIGH')
  })
  it('MODERATE when temperature MATCHes but another evaluable factor MISMATCHes', () => {
    expect(computeSuitability([factor({ status: 'MATCH' }), { factor: 'SEASON', label: '계절', status: 'MISMATCH', detail: '' }])).toBe('MODERATE')
  })
  it('MODERATE when temperature is only a PARTIAL_MATCH', () => {
    expect(computeSuitability([factor({ status: 'PARTIAL_MATCH' }), { factor: 'SEASON', label: '계절', status: 'MATCH', detail: '' }])).toBe('MODERATE')
  })
  it('never returns a probability-shaped value', () => {
    const result = computeSuitability([factor({ status: 'MATCH' }), { factor: 'SEASON', label: '계절', status: 'MATCH', detail: '' }])
    expect(['HIGH', 'MODERATE', 'LOW', 'INSUFFICIENT_EVIDENCE']).toContain(result)
  })
})
