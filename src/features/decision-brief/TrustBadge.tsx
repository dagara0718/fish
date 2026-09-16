import type { TrustStatus } from '../../domain/contracts'

const labels: Record<TrustStatus, { icon: string; ko: string }> = {
  CONFIRMED: { icon: '✓', ko: '확인됨' },
  STALE: { icon: '◷', ko: '오래됨' },
  UNVERIFIED: { icon: '?', ko: '확인 필요' },
  COLLECTION_FAILED: { icon: '!', ko: '수집 실패' },
  CONFLICT: { icon: '⇄', ko: '정보충돌' },
}

export function TrustBadge({ status }: { status: TrustStatus }) { const item = labels[status]; return <span className="trust-badge" data-status={status}><span aria-hidden="true">{item.icon}</span><span>{item.ko}</span><span className="sr-only"> ({status})</span></span> }

