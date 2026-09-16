import type { InformationRecord, SourceOutcome } from '../domain/contracts'

export class MemoryProvenanceCache {
  private readonly records = new Map<string, InformationRecord>()
  private readonly attempts = new Map<string, SourceOutcome>()

  save(record: InformationRecord): void { this.records.set(`${record.pointId}:${record.infoType}:${record.evidence[0]?.sourceId ?? 'unknown'}`, structuredClone(record)) }
  read(pointId: string, infoType: string): InformationRecord[] { return [...this.records.values()].filter((record) => record.pointId === pointId && record.infoType === infoType).map((record) => structuredClone(record)) }
  recordAttempt(outcome: SourceOutcome): void { this.attempts.set(outcome.sourceId, structuredClone(outcome)) }
  readAttempt(sourceId: string): SourceOutcome | undefined { const item = this.attempts.get(sourceId); return item ? structuredClone(item) : undefined }
}

