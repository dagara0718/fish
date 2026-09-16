import type { OfficialFishingPointRef, OfficialIndexResult } from './contracts'

export const DEMO_OFFICIAL_POINTS: OfficialFishingPointRef[] = [
  { officialPointId: 'demo-official-east', linkedPointId: 'sample-complete', placeName: '샘플 등대 기준점', regionContext: '데모 동부 해역', fishingType: '갯바위', latitude: 35.11, longitude: 129.12 },
  { officialPointId: 'demo-official-west', linkedPointId: 'sample-mixed', placeName: '샘플 연안 기준점', regionContext: '데모 서부 해역', fishingType: '갯바위', latitude: 35.07, longitude: 129.02 },
  { officialPointId: 'demo-official-north', linkedPointId: 'sample-cache', placeName: '샘플 캐시 기준점', regionContext: '데모 북부 해역', fishingType: '선상', latitude: 35.19, longitude: 129.08 },
]

const evaluatedAt = '2026-09-16T09:00:00.000Z'

export function getDemoOfficialIndex(pointId: string): OfficialIndexResult {
  const point = DEMO_OFFICIAL_POINTS.find((item) => item.linkedPointId === pointId)
  if (!point) return { kind: 'UNSUPPORTED_POINT', reason: '공식 바다낚시지수 미지원 위치', demo: true }
  if (pointId === 'sample-cache') return { kind: 'COLLECTION_FAILED', point, reason: '공식 데이터 수집을 완료하지 못했습니다. 실제 값으로 대체하지 않았습니다.', demo: true }

  const stale = pointId === 'sample-mixed'
  const trustStatus = stale ? 'STALE' as const : 'CONFIRMED' as const
  return {
    kind: stale ? 'STALE_CACHE' : 'SUCCESS', point, demo: true,
    species: [
      { assessmentType: 'OFFICIAL_FISHING_INDEX', speciesId: 'demo-rockfish', speciesName: '우럭', officialGrade: stale ? '좋음' : '보통', officialScore: stale ? 78 : 64, evaluatedAt, officialPointId: point.officialPointId, source: '국립해양조사원 API 스키마 기반 데모', trustStatus },
      { assessmentType: 'OFFICIAL_FISHING_INDEX', speciesId: 'demo-seabream', speciesName: '감성돔', officialGrade: '보통', officialScore: 61, evaluatedAt, officialPointId: point.officialPointId, source: '국립해양조사원 API 스키마 기반 데모', trustStatus },
    ],
    environment: {
      locationReference: point, evaluatedAt,
      observations: [
        { metricType: 'WATER_TEMPERATURE', label: '수온', value: '18.4–19.1', unit: '°C', forecastAt: evaluatedAt, source: '국립해양조사원 API 스키마 기반 데모', sourceTimestamp: evaluatedAt, trustStatus },
        { metricType: 'WAVE_HEIGHT', label: '파고', value: '0.4–0.8', unit: 'm', forecastAt: evaluatedAt, source: '국립해양조사원 API 스키마 기반 데모', sourceTimestamp: evaluatedAt, trustStatus },
        { metricType: 'CURRENT_SPEED', label: '유속', value: '0.2–0.5', unit: 'm/s', forecastAt: evaluatedAt, source: '국립해양조사원 API 스키마 기반 데모', sourceTimestamp: evaluatedAt, trustStatus },
        { metricType: 'TIDE', label: '물때', value: '데모 물때', forecastAt: evaluatedAt, source: '국립해양조사원 API 스키마 기반 데모', sourceTimestamp: evaluatedAt, trustStatus },
      ],
    },
  }
}

