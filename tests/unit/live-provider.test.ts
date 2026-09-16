import { describe, expect, it, vi } from 'vitest'
import { LiveOfficialFishingIndexProvider, normalizeOfficial } from '../../src/official-index/live-provider'
import type { OfficialItem } from '../../shared/fishing-api'
const point = { officialPointId: 'test', linkedPointId: 'test', placeName: '계약 테스트', regionContext: '공식', fishingType: '갯바위' as const, latitude: 35, longitude: 129 }
const item = { seafsPstnNm: point.placeName, lat: 35, lot: 129, predcYmd: '20990101', predcNoonSeCd: '오전', seafsTgfshNm: '테스트어종', totalIndex: '좋음', lastScr: 50, minWtem: 0 }
const envelope = (items: OfficialItem[] = [item]) => ({ version: 1, items, totalCount: items.length, fetchedAt: new Date().toISOString() })
describe('Live official index', () => {
  it('normalizes multiple species without score-driven trust promotion', () => {
    const result = normalizeOfficial([item, { ...item, seafsTgfshNm: '다른어종' }], point)
    if (!('species' in result)) throw Error('expected species')
    expect(result.species).toHaveLength(2); expect(result.species[0]).toMatchObject({ officialScore: 50, trustStatus: 'UNVERIFIED' })
    expect(result.environment.observations[0]?.value).toBe('0 ~ 미제공')
  })
  it('preserves conflict and partial fields, no data is unsupported', () => {
    const conflict = normalizeOfficial([item, { ...item, lastScr: 1 }], point)
    if ('species' in conflict) expect(conflict.species.every(s => s.trustStatus === 'CONFLICT')).toBe(true)
    expect(normalizeOfficial([{ seafsPstnNm: point.placeName, lat: 35, lot: 129 }], point).kind).toBe('PARTIAL')
    expect(normalizeOfficial([], point).kind).toBe('UNSUPPORTED_POINT')
  })
  it('fetches only proxy public parameters and supports stale fallback', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json(envelope())).mockRejectedValueOnce(new Error('offline'))
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', fetcher)
    expect((await provider.getOfficialIndex(point)).demo).toBe(false)
    expect(String(fetcher.mock.calls[0]![0])).not.toMatch(/serviceKey|latitude|longitude/)
    expect((await provider.getOfficialIndex(point)).kind).toBe('STALE_CACHE')
  })
  it.each([Response.json({ invalid: true }), new Response('', { status: 500 }), new Response('', { status: 403 })])('does not replace failures with fixtures', async response => {
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', vi.fn<typeof fetch>().mockResolvedValue(response))
    expect(await provider.getOfficialIndex(point)).toMatchObject({ kind: 'COLLECTION_FAILED', demo: false })
  })
  it('marks past forecasts stale', () => { expect(normalizeOfficial([{ ...item, predcYmd: '20200101' }], point).kind).toBe('STALE_CACHE') })
  it('does not mark SUCCESS as PARTIAL just because lastScr is absent (confirmed absent on the real response)', () => {
    const { lastScr, ...withoutScore } = item; void lastScr
    const result = normalizeOfficial([withoutScore], point)
    expect(result.kind).toBe('SUCCESS')
    if ('species' in result) { expect(result.species[0]).toMatchObject({ officialGrade: '좋음' }); expect(result.species[0]).not.toHaveProperty('officialScore') }
  })
  it('accepts the real dashed predcYmd shape through the full fetch pipeline without becoming COLLECTION_FAILED', async () => {
    const real = { seafsPstnNm: point.placeName, lat: 35, lot: 129, predcYmd: '2099-01-01', predcNoonSeCd: '오전', seafsTgfshNm: '테스트어종', totalIndex: '좋음' }
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', vi.fn<typeof fetch>().mockResolvedValue(Response.json(envelope([real]))))
    const result = await provider.getOfficialIndex(point)
    expect(result.kind).toBe('SUCCESS')
    if ('species' in result) expect(result.species[0]!.evaluatedAt).toContain('2099-01-01')
  })
  it('builds actual catalog and rejects insecure proxy URL', async () => {
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', vi.fn<typeof fetch>().mockResolvedValue(Response.json(envelope())))
    expect(await provider.getCatalog('갯바위')).toHaveLength(1)
    await expect(new LiveOfficialFishingIndexProvider('http://evil.example').getCatalog('갯바위')).rejects.toThrow()
  })
})
