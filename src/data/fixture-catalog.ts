import type { FishingPoint } from '../domain/contracts'

export const SYNTHETIC_POINTS: FishingPoint[] = [
  { pointId: 'sample-complete', name: '샘플 등대 포인트', regionContext: '테스트 동부 구역', pointType: '합성 방파제', supportStatus: 'SUPPORTED' },
  { pointId: 'sample-mixed', name: '샘플 등대 포인트', regionContext: '테스트 서부 구역', pointType: '합성 연안', supportStatus: 'SUPPORTED' },
  { pointId: 'sample-cache', name: '샘플 캐시 포인트', regionContext: '테스트 북부 구역', pointType: '합성 갯바위', supportStatus: 'SUPPORTED' },
  { pointId: 'sample-conflict', name: '샘플 충돌 포인트', regionContext: '테스트 남부 구역', pointType: '합성 항만', supportStatus: 'SUPPORTED' },
  { pointId: 'sample-failed', name: '샘플 전체실패 포인트', regionContext: '테스트 외곽 구역', pointType: '합성 연안', supportStatus: 'SUPPORTED' },
  { pointId: 'sample-ambiguous-a', name: '모호 샘플 포인트', regionContext: '', supportStatus: 'SUPPORTED' },
  { pointId: 'sample-ambiguous-b', name: '모호 샘플 포인트', regionContext: '', supportStatus: 'SUPPORTED' },
]

