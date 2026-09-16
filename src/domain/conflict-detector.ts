import type { InformationRecord } from './contracts'
import { validateRecord } from './contracts'

export function preserveConflict(records: InformationRecord[], label: string): InformationRecord {
  if (records.length < 2) throw new Error('At least two records are required')
  const first = records[0]!
  return validateRecord({
    recordId: `conflict-${first.pointId}-${first.infoType}`,
    pointId: first.pointId,
    infoType: first.infoType,
    label,
    trustStatus: 'CONFLICT',
    evidence: records.flatMap((record) => record.evidence.map((evidence) => ({ ...evidence, value: record.value }))),
    statusReason: '합성 소스의 값이 상충하며 검증된 단일 결론이 없습니다.',
  })
}
