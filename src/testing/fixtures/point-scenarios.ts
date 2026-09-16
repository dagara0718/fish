export const POINT_SCENARIOS = {
  supported: { query: '캐시', expected: 'MATCHES', requirements: ['REQ-FUNC-POINT-001'], testCase: 'TC-POINT-001' },
  duplicate: { query: '샘플 등대', expected: 'MATCHES', requirements: ['REQ-FUNC-POINT-002'], testCase: 'TC-POINT-002' },
  ambiguous: { query: '모호', expected: 'AMBIGUOUS', requirements: ['REQ-FUNC-POINT-002', 'REQ-FUNC-POINT-003'], testCase: 'TC-POINT-002' },
  unsupported: { query: '미지원 실제 아님', expected: 'NO_MATCH', requirements: ['REQ-FUNC-POINT-003'], testCase: 'TC-POINT-003' },
  catalogUnavailable: { query: '카탈로그오류', expected: 'CATALOG_UNAVAILABLE', requirements: ['REQ-FUNC-POINT-003'], testCase: 'TC-POINT-003' },
} as const

