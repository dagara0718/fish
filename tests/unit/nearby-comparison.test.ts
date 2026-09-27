import { describe, expect, it } from 'vitest'
import { normalizeOfficial } from '../../src/official-index/live-provider'
import { summarizeNearby, type NearbyEntry } from '../../src/official-index/nearby-comparison'
import type { OfficialFishingPointRef } from '../../src/official-index/contracts'

const point = (name: string, lat: number): OfficialFishingPointRef => ({ officialPointId: name, linkedPointId: name, placeName: name, regionContext: '공식 기준 포인트', fishingType: '갯바위', latitude: lat, longitude: 129 })
const item = (name: string, lat: number, species: string, grade: string, ymd = '20990101', noon = '오전') => ({ seafsPstnNm: name, lat, lot: 129, predcYmd: ymd, predcNoonSeCd: noon, seafsTgfshNm: species, totalIndex: grade })
const entry = (name: string, lat: number, km: number, items: ReturnType<typeof item>[]): NearbyEntry => ({ point: point(name, lat), distanceKm: km, result: normalizeOfficial(items, point(name, lat), '20990101') })

describe('summarizeNearby — REQ-FUNC-NEARBY-002~004', () => {
  it('counts official grades per species at one shared (earliest) forecast slot, sorted by distance', () => {
    const summary = summarizeNearby([
      entry('B', 35.1, 3.4, [item('B', 35.1, '감성돔', '보통'), item('B', 35.1, '감성돔', '매우좋음', '20990102', '일')]),
      entry('A', 35, 1.2, [item('A', 35, '감성돔', '좋음'), item('A', 35, '참돔', '나쁨'), item('A', 35, '감성돔', '매우나쁨', '20990101', '오후')]),
      entry('C', 35.2, 5.1, [item('C', 35.2, '감성돔', '좋음')]),
    ])
    expect(summary.slot).toBe('2099-01-01 · 오전')
    expect(summary.points.map(p => p.placeName)).toEqual(['A', 'B', 'C'])
    const gamseong = summary.species.find(row => row.speciesName === '감성돔')!
    expect(gamseong.gradeCounts).toEqual([{ grade: '좋음', count: 2 }, { grade: '보통', count: 1 }]) // later slots excluded
    const chamdom = summary.species.find(row => row.speciesName === '참돔')!
    expect(chamdom.cells.map(cell => cell.grade)).toEqual(['나쁨', undefined, undefined]) // missing ≠ bad
    expect(summary.trustStatuses).toEqual(['UNVERIFIED'])
  })
  it('keeps successful points when one point failed (partial-failure-first)', () => {
    const failed: NearbyEntry = { point: point('X', 36), distanceKm: 0.5, result: { kind: 'COLLECTION_FAILED', point: point('X', 36), reason: 'x', demo: false } }
    const summary = summarizeNearby([failed, entry('A', 35, 1.2, [item('A', 35, '감성돔', '좋음')])])
    expect(summary.points).toEqual([{ placeName: 'X', distanceKm: 0.5, failed: true }, { placeName: 'A', distanceKm: 1.2, failed: false }])
    expect(summary.species[0]!.gradeCounts).toEqual([{ grade: '좋음', count: 1 }])
    expect(summary.species[0]!.cells[0]).toMatchObject({ placeName: 'X', failed: true }) // failed ≠ "no value"
  })
  it('has no slot and no species when every point failed', () => {
    const failed: NearbyEntry = { point: point('X', 36), distanceKm: 0.5, result: { kind: 'UNSUPPORTED_POINT', reason: 'x', demo: false } }
    expect(summarizeNearby([failed])).toMatchObject({ species: [], trustStatuses: [] })
    expect(summarizeNearby([failed]).slot).toBeUndefined()
  })
  it('never produces a score, probability or single "best" species — only counts of official grades', () => {
    const summary = summarizeNearby([entry('A', 35, 1, [item('A', 35, '감성돔', '좋음')])])
    expect(JSON.stringify(summary)).not.toMatch(/probab|score|rank|best|확률|추천/i)
  })
})
