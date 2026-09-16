import { describe, expect, it } from 'vitest'
import { normalizeResponseDate, parseItem, parseOfficialResponse, validDate } from '../../shared/fishing-api'

describe('validDate (strict request reqDate=YYYYMMDD)', () => {
  it('accepts a real YYYYMMDD calendar date', () => { expect(validDate('20260916')).toBe(true) })
  it('rejects the dashed response format', () => { expect(validDate('2026-09-16')).toBe(false) })
  it('rejects an impossible calendar date', () => { expect(validDate('20260230')).toBe(false) })
})

describe('normalizeResponseDate (accepts either response shape, canonical output YYYYMMDD)', () => {
  it('passes through an already-canonical YYYYMMDD date', () => { expect(normalizeResponseDate('20260916')).toBe('20260916') })
  it('normalizes the real upstream YYYY-MM-DD shape to YYYYMMDD', () => { expect(normalizeResponseDate('2026-09-16')).toBe('20260916') })
  it('rejects an impossible date in either shape', () => {
    expect(normalizeResponseDate('2026-02-30')).toBeUndefined()
    expect(normalizeResponseDate('20260230')).toBeUndefined()
  })
  it('rejects non-date garbage', () => { expect(normalizeResponseDate('not-a-date')).toBeUndefined() })
})

describe('parseItem against the confirmed real response shape', () => {
  const real = { seafsPstnNm: '가거도', lat: 34.07308, lot: 125.08805, predcYmd: '2026-09-16', predcNoonSeCd: '오전', seafsTgfshNm: '감성돔', tdlvHrCn: '중조기', minWvhgt: 0.2, maxWvhgt: 0.2, minWtem: 24.3, maxWtem: 24.4, minArtmp: 22.7, maxArtmp: 23.2, minCrsp: 0.2, maxCrsp: 0.4, minWspd: 5.1, maxWspd: 5.5, totalIndex: '좋음' }
  it('accepts the real dashed predcYmd instead of throwing MALFORMED_RESPONSE', () => { expect(() => parseItem(real)).not.toThrow() })
  it('normalizes predcYmd to canonical YYYYMMDD for internal comparison', () => { expect(parseItem(real).predcYmd).toBe('20260916') })
  it('parses successfully with no lastScr field at all, matching the real sample', () => {
    const item = parseItem(real)
    expect(item.lastScr).toBeUndefined()
    expect(item.totalIndex).toBe('좋음')
  })
  it('still rejects a genuinely malformed predcYmd', () => { expect(() => parseItem({ ...real, predcYmd: 'not-a-date' })).toThrow('MALFORMED_RESPONSE') })
})

describe('parseOfficialResponse with the real header/body wrapper shape', () => {
  const item = { seafsPstnNm: '가거도', lat: 34.07308, lot: 125.08805, predcYmd: '2026-09-16', predcNoonSeCd: '오전', seafsTgfshNm: '감성돔', totalIndex: '좋음' }
  it('accepts a large totalCount alongside a single page of items (multi-page catalog)', () => {
    const data = parseOfficialResponse({ header: { resultCode: '00' }, body: { totalCount: 1750, items: { item: [item] } } }, '2026-09-16T00:00:00.000Z')
    expect(data.totalCount).toBe(1750)
    expect(data.items).toHaveLength(1)
    expect(data.items[0]!.predcYmd).toBe('20260916')
  })
})
