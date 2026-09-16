import type { FishingAccessStatus, FishingAccessStatusKind } from '../../official-index/fishing-access'

const labels: Record<FishingAccessStatusKind, { icon: string; ko: string }> = {
  ALLOWED_CONFIRMED: { icon: '✓', ko: '이용 가능 (근거 확인됨)' },
  PROHIBITED_CONFIRMED: { icon: '⛔', ko: '금지·통제 (근거 확인됨)' },
  RESTRICTED: { icon: '▲', ko: '제한 있음' },
  CHECK_REQUIRED: { icon: '⚠', ko: '확인 필요' },
  NO_EVIDENCE: { icon: '⚠', ko: '근거 없음 · 확인 필요' },
  CONFLICT: { icon: '⇄', ko: '정보 충돌' },
}

const guidance: Record<FishingAccessStatusKind, string> = {
  ALLOWED_CONFIRMED: '공식 근거에 따라 이 위치의 낚시 이용이 확인되었습니다.',
  PROHIBITED_CONFIRMED: '공식 근거에 따라 이 위치는 낚시가 금지되었거나 통제됩니다.',
  RESTRICTED: '공식 근거에 조건부 제한이 있습니다. 세부 근거를 확인해 주세요.',
  CHECK_REQUIRED: '현재 연결된 정보만으로는 이 위치의 낚시 금지·통제 여부를 확정할 수 없습니다.',
  NO_EVIDENCE: '이 위치에 대한 낚시 금지·통제 근거 자료가 아직 연결되지 않았습니다.',
  CONFLICT: '낚시 금지·통제 여부에 대해 서로 다른 근거가 확인되었습니다.',
}

export function AccessStatusPanel({ status }: { status: FishingAccessStatus }) {
  const item = labels[status.status]
  return <section className="access-status-section" aria-labelledby="access-status-heading">
    <div className="section-title-row"><div><p className="section-kicker">FISHING ACCESS</p><h3 id="access-status-heading">낚시 이용 상태</h3></div><span className="access-status-badge" data-status={status.status}><span aria-hidden="true">{item.icon}</span><span>{item.ko}</span></span></div>
    <p className="access-status-guidance">{guidance[status.status]}</p>
    {status.evidence.length > 0 && <ul className="access-status-evidence">{status.evidence.map((item, index) => <li key={index}>{item.source} · {item.note}</li>)}</ul>}
    <p className="access-status-note">이 상태는 공식 바다낚시지수 및 신뢰상태와 별개의 판정이며, 사용자의 출입·안전 책임을 대신하지 않습니다.</p>
  </section>
}
