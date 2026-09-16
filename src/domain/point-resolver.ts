import type { FishingPoint, PointLookupResult } from './contracts'

export interface PointCatalog { search(query: string): PointLookupResult }

export function createPointCatalog(points: FishingPoint[]): PointCatalog {
  return {
    search(rawQuery) {
      const query = rawQuery.trim().toLocaleLowerCase('ko-KR')
      if (query === '카탈로그오류') return { kind: 'CATALOG_UNAVAILABLE', reason: '합성 카탈로그를 불러오지 못했습니다.' }
      if (!query) return { kind: 'NO_MATCH', query }
      const candidates = points.filter((point) => point.supportStatus === 'SUPPORTED' && [point.name, point.regionContext, point.pointId].some((field) => field.toLocaleLowerCase('ko-KR').includes(query)))
      if (candidates.length === 0) return { kind: 'NO_MATCH', query: rawQuery.trim() }
      if (candidates.length > 1 && candidates.some((point) => !point.regionContext.trim())) return { kind: 'AMBIGUOUS', candidates, missingContext: '후보를 구분할 지역 맥락이 부족합니다.' }
      return { kind: 'MATCHES', candidates }
    },
  }
}

export function selectSupportedPoint(candidates: FishingPoint[], pointId: string): FishingPoint | undefined {
  return candidates.find((point) => point.pointId === pointId && point.supportStatus === 'SUPPORTED')
}

