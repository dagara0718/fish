import type { InformationRecord, TrustStatus } from './contracts'
import { validateRecord } from './contracts'

export type FreshnessResult = 'FRESH' | 'STALE' | 'POLICY_UNAVAILABLE' | 'TIME_UNVERIFIABLE'

export function assessTrust(record: InformationRecord, freshness: FreshnessResult): InformationRecord {
  if (record.trustStatus === 'CONFLICT' || record.trustStatus === 'COLLECTION_FAILED') return validateRecord(record)
  if (freshness === 'POLICY_UNAVAILABLE' || freshness === 'TIME_UNVERIFIABLE') return { ...record, trustStatus: 'UNVERIFIED', statusReason: '승인된 최신성 정책 또는 시간 근거가 없습니다.' }
  if (freshness === 'STALE') return { ...record, trustStatus: 'STALE', statusReason: '테스트용 상징 경계에서 오래된 근거입니다.' }
  return validateRecord({ ...record, trustStatus: 'CONFIRMED', statusReason: undefined })
}

export function canPromote(previous: TrustStatus, evidenceEvent: 'NONE' | 'CACHE_READ' | 'TIME_PASSED' | 'NEW_VERIFIED_COLLECTION'): boolean {
  return previous === 'CONFIRMED' || evidenceEvent === 'NEW_VERIFIED_COLLECTION'
}

