import type { InformationRecord } from '../../domain/contracts'
import { displayTime } from '../../domain/contracts'
import { TrustBadge } from './TrustBadge'

const productLabels: Record<string, string> = {
  'sample-a': '해양 상태 요약',
  'sample-b': '최근 환경 기록',
  'sample-c': '데이터 수집 상태',
  'sample-d': '추가 확인 정보',
  'sample-conflict': '출처별 관측 정보',
}
const productValues: Record<string, string> = {
  'sample-a': '확인 가능한 데이터',
  'sample-b': '과거 기록 보유',
  'sample-d': '검증 대기',
}

export function BriefSlot({ record, onEvidence, onRetry }: { record: InformationRecord; onEvidence: (trigger: HTMLButtonElement) => void; onRetry: () => void }) {
  return <article className="brief-slot" data-testid={`slot-${record.infoType}`}>
    <div><p className="slot-label">{productLabels[record.infoType] ?? record.label}</p><p className="slot-value">{productValues[record.infoType] ?? record.value ?? '값 없음'}</p></div>
    <div className="slot-meta"><TrustBadge status={record.trustStatus} /><div>출처: {record.evidence.map((item) => item.sourceName).join(', ') || '출처 확인 필요'}</div><div className="mono">기준/확인: {displayTime(record)}</div>{record.statusReason && <div>{record.statusReason}</div>}</div>
    <div className="slot-actions"><button type="button" className="text-button" onClick={(event) => onEvidence(event.currentTarget)}>근거 보기</button>{record.trustStatus === 'COLLECTION_FAILED' && <button type="button" className="secondary-button" onClick={onRetry}>이 항목 재시도</button>}</div>
  </article>
}
