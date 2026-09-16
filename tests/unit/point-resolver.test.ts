import { describe, expect, it } from 'vitest'
import { SYNTHETIC_POINTS } from '../../src/data/fixture-catalog'
import { createPointCatalog, selectSupportedPoint } from '../../src/domain/point-resolver'

const catalog = createPointCatalog(SYNTHETIC_POINTS)
describe('point resolution — TC-POINT-001~003', () => {
  it('returns a supported candidate but never an implicit selected point', () => {
    const result = catalog.search('캐시')
    expect(result.kind).toBe('MATCHES')
    expect(result).not.toHaveProperty('selected')
  })
  it('keeps distinguishable same-name candidates separate', () => {
    const result = catalog.search('샘플 등대')
    expect(result.kind).toBe('MATCHES')
    if (result.kind === 'MATCHES') expect(new Set(result.candidates.map((p) => p.regionContext)).size).toBe(2)
  })
  it.each([['미지원', 'NO_MATCH'], ['모호', 'AMBIGUOUS'], ['카탈로그오류', 'CATALOG_UNAVAILABLE']] as const)('returns %s safely as %s', (query, expected) => expect(catalog.search(query).kind).toBe(expected))
  it('selects only an explicit supported id', () => {
    expect(selectSupportedPoint(SYNTHETIC_POINTS, 'missing')).toBeUndefined()
    expect(selectSupportedPoint(SYNTHETIC_POINTS, 'sample-cache')?.pointId).toBe('sample-cache')
  })
})

