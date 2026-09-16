import { describe, expect, it } from 'vitest'
import { UnverifiedFishingAccessProvider } from '../../src/official-index/fishing-access'
import type { OfficialFishingPointRef } from '../../src/official-index/contracts'

const point: OfficialFishingPointRef = { officialPointId: 'p1', linkedPointId: 'p1', placeName: '테스트 포인트', regionContext: '테스트', fishingType: '갯바위', latitude: 35, longitude: 129 }

describe('UnverifiedFishingAccessProvider', () => {
  it('never reports ALLOWED_CONFIRMED without a connected evidence source', async () => {
    const provider = new UnverifiedFishingAccessProvider()
    const status = await provider.getAccessStatus(point)
    expect(status.status).toBe('CHECK_REQUIRED')
    expect(status.evidence).toHaveLength(0)
  })
  it('stamps a checkedAt time distinct from any TrustStatus or official grade field', async () => {
    const provider = new UnverifiedFishingAccessProvider()
    const status = await provider.getAccessStatus(point, '2026-09-16T00:00:00.000Z')
    expect(status.checkedAt).toBe('2026-09-16T00:00:00.000Z')
    expect(status).not.toHaveProperty('trustStatus')
    expect(status).not.toHaveProperty('officialGrade')
  })
  it('defaults checkedAt when not provided', async () => {
    const provider = new UnverifiedFishingAccessProvider()
    const status = await provider.getAccessStatus(point)
    expect(Number.isFinite(Date.parse(status.checkedAt))).toBe(true)
  })
})
