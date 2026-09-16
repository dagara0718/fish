import { describe, expect, it } from 'vitest'
import { DEMO_OFFICIAL_POINTS } from '../../src/official-index/demo-provider'
import { rankLocationCandidates } from '../../src/official-index/location-candidates'

describe('transient GPS candidate mapping', () => {
  it('returns distance candidates without raw user coordinates or automatic confirmation', () => {
    const candidates = rankLocationCandidates({ latitude: 35.1, longitude: 129.1 }, DEMO_OFFICIAL_POINTS)
    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates[0]?.mappingMethod).toBe('DISTANCE_CANDIDATE')
    expect(candidates.every((item) => item.userConfirmed === false)).toBe(true)
    expect(Object.keys(candidates[0] ?? {})).toEqual(['point', 'mappingMethod', 'distanceKm', 'userConfirmed'])
  })
  it('returns no candidate outside the supported radius', () => {
    expect(rankLocationCandidates({ latitude: 37.56, longitude: 126.97 }, DEMO_OFFICIAL_POINTS)).toEqual([])
  })
})
