import type { InformationRecord, SourceOutcome } from '../domain/contracts'

export interface FixtureAdapterResult { record: InformationRecord; outcome: SourceOutcome }

export async function settleWithInjectedDeadline<T>(tasks: Array<Promise<T>>, testDeadlineMs: number): Promise<Array<T | 'TIMEOUT'>> {
  return Promise.all(tasks.map((task) => Promise.race<T | 'TIMEOUT'>([task, new Promise<'TIMEOUT'>((resolve) => setTimeout(() => resolve('TIMEOUT'), testDeadlineMs))])))
}

export function fixtureSourceOutcome(sourceId: string, outcome: SourceOutcome['outcome'], cacheUsed = false): SourceOutcome {
  return { sourceId, outcome, attemptedAt: '2026-09-16T09:30:00.000Z', cacheUsed }
}

export async function retryFixtureSlot(record: InformationRecord): Promise<InformationRecord> {
  await Promise.resolve()
  return {
    ...record,
    recordId: `${record.recordId}-retry`,
    value: '재시도 합성 응답',
    trustStatus: 'CONFIRMED',
    statusReason: undefined,
    evidence: [{ sourceId: 'fixture-retry-source', sourceName: '합성 재시도 소스', basisTime: '2026-09-16T09:31:00.000Z', checkedAt: '2026-09-16T09:31:00.000Z', sourceReference: '#fixture-evidence' }],
  }
}
