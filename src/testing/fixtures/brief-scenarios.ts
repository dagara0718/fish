import type { BriefAssemblyOutcome, InformationRecord, SourceOutcome } from '../../domain/contracts'
import { createConfirmedRecord } from '../../domain/contracts'
import { preserveConflict } from '../../domain/conflict-detector'
import { fixtureSourceOutcome } from '../../data/fixture-adapters'

const time = '2026-09-16T09:00:00.000Z'
const evidence = (sourceId: string, value?: string) => ({ sourceId, sourceName: `합성 출처 ${sourceId}`, basisTime: time, checkedAt: time, sourceReference: '#fixture-evidence', value })
const base = (pointId: string, suffix: string, label: string): Omit<InformationRecord, 'trustStatus'> => ({ recordId: `${pointId}-${suffix}`, pointId, infoType: `sample-${suffix}`, label, evidence: [] })

export function confirmed(pointId: string, suffix: string, label: string, value: string): InformationRecord {
  return createConfirmedRecord({ ...base(pointId, suffix, label), value, evidence: [evidence(`source-${suffix}`)] })
}

export function makeBrief(pointId: string): BriefAssemblyOutcome {
  const success = confirmed(pointId, 'a', '샘플 정보 슬롯 A', '합성 확인 값')
  const stale: InformationRecord = { ...base(pointId, 'b', '샘플 정보 슬롯 B'), value: '과거 합성 캐시 값', trustStatus: 'STALE', evidence: [evidence('source-cache')], statusReason: '테스트용 과거 근거이며 최신 수집은 실패했습니다.', cacheState: { storedAt: time, recordBasisTime: time, lastRefreshAttemptAt: '2026-09-16T09:30:00.000Z', lastRefreshResult: 'UNAVAILABLE' } }
  const failed: InformationRecord = { ...base(pointId, 'c', '샘플 정보 슬롯 C'), trustStatus: 'COLLECTION_FAILED', evidence: [{ sourceId: 'source-failed', sourceName: '합성 실패 소스', checkedAt: '2026-09-16T09:30:00.000Z' }], statusReason: '합성 수집 시도가 실패했으며 값이 없습니다.' }
  const unverified: InformationRecord = { ...base(pointId, 'd', '샘플 정보 슬롯 D'), value: '검증 전 합성 값', trustStatus: 'UNVERIFIED', evidence: [{ sourceId: 'source-unverified', sourceName: '합성 미확인 소스' }], statusReason: '시간 근거 또는 승인된 정책이 없습니다.' }
  const left = confirmed(pointId, 'conflict', '샘플 정보 슬롯 E', '합성 값 A')
  const right = { ...confirmed(pointId, 'conflict', '샘플 정보 슬롯 E', '합성 값 B'), recordId: `${pointId}-conflict-right`, evidence: [evidence('source-conflict-b')] }
  const conflict = preserveConflict([left, right], '샘플 정보 슬롯 E')

  let items: InformationRecord[] = [success]
  let outcomes: SourceOutcome[] = [fixtureSourceOutcome('source-a', 'SUCCESS')]
  let completeness: BriefAssemblyOutcome['completeness'] = 'COMPLETE'
  if (pointId === 'sample-mixed') { items = [success, stale, failed, unverified, conflict]; outcomes = [fixtureSourceOutcome('source-a', 'SUCCESS'), fixtureSourceOutcome('source-cache', 'UNAVAILABLE', true), fixtureSourceOutcome('source-failed', 'TIMEOUT')]; completeness = 'PARTIAL' }
  if (pointId === 'sample-cache') { items = [stale, unverified]; outcomes = [fixtureSourceOutcome('source-cache', 'UNAVAILABLE', true)]; completeness = 'PARTIAL' }
  if (pointId === 'sample-conflict') { items = [conflict, unverified]; outcomes = [fixtureSourceOutcome('source-conflict-a', 'SUCCESS'), fixtureSourceOutcome('source-conflict-b', 'SUCCESS')]; completeness = 'PARTIAL' }
  if (pointId === 'sample-failed') { items = [failed]; outcomes = [fixtureSourceOutcome('source-failed', 'UNAVAILABLE')]; completeness = 'UNAVAILABLE' }
  return { brief: { briefId: `brief-${pointId}`, pointId, generatedAt: '2026-09-16T09:31:00.000Z', items, sourceOutcomes: outcomes }, completeness }
}

export const BRIEF_SCENARIO_IDS = ['all-confirmed', 'partial', 'stale-cache', 'failure-with-cache', 'failure-without-cache', 'unverified', 'conflict', 'missing-provenance', 'empty-all'] as const

