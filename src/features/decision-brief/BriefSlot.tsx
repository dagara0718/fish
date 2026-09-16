import type { InformationRecord } from '../../domain/contracts'
import { displayTime } from '../../domain/contracts'
import { TrustBadge } from './TrustBadge'

export function BriefSlot({ record, onEvidence, onRetry }: { record: InformationRecord; onEvidence: (trigger: HTMLButtonElement) => void; onRetry: () => void }) {
  return <article className="brief-slot" data-testid={`slot-${record.infoType}`}>
    <div><p className="slot-label">{record.label}</p><p className="slot-value">{record.value ?? '값 없음'}</p></div>
    <div className="slot-meta"><TrustBadge status={record.trustStatus} /><div>출처: {record.evidence.map((item) => item.sourceName).join(', ') || '출처 확인 필요'}</div><div className="mono">기준/확인: {displayTime(record)}</div>{record.statusReason && <div>{record.statusReason}</div>}</div>
    <div className="slot-actions"><button type="button" className="text-button" onClick={(event) => onEvidence(event.currentTarget)}>근거 보기</button>{record.trustStatus === 'COLLECTION_FAILED' && <button type="button" className="secondary-button" onClick={onRetry}>이 항목 재시도</button>}</div>
  </article>
}
