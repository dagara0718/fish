import { useEffect, useRef } from 'react'
import type { InformationRecord } from '../../domain/contracts'
import { displayTime } from '../../domain/contracts'
import { TrustBadge } from './TrustBadge'

export function EvidencePanel({ record, onClose }: { record: InformationRecord; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const focusable = () => [...panel.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')]
    focusable()[0]?.focus()
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const items = focusable(); if (!items.length) return
      const first = items[0]!; const last = items.at(-1)!
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => document.removeEventListener('keydown', keydown)
  }, [onClose])
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div ref={panelRef} className="evidence-panel" role="dialog" aria-modal="true" aria-labelledby="evidence-title">
      <header className="dialog-header"><div><p className="identity-kicker">합성 fixture 근거</p><h2 id="evidence-title">{record.label}</h2></div><button type="button" className="secondary-button" onClick={onClose} aria-label="근거 패널 닫기">닫기</button></header>
      <div className="availability"><TrustBadge status={record.trustStatus} /><div>{record.statusReason ?? '합성 출처와 시각 근거가 연결된 데이터 상태입니다. 이 상태는 출조 허용이나 추천을 뜻하지 않습니다.'}</div><div className="mono">표시 시각: {displayTime(record)}</div></div>
      {record.evidence.map((item, index) => <section className="evidence-card" key={`${item.sourceId}-${index}`}><h3>근거 {index + 1}{record.trustStatus === 'CONFLICT' ? ' · 상충' : ''}</h3><dl><dt>값</dt><dd>{item.value ?? record.value ?? '값 없음'}</dd><dt>출처</dt><dd>{item.sourceName} <span className="mono">({item.sourceId})</span></dd><dt>기준시각</dt><dd className="mono">{item.basisTime ?? '확인 필요'}</dd><dt>최근 확인</dt><dd className="mono">{item.checkedAt ?? '확인 필요'}</dd><dt>확인 경로</dt><dd>{item.sourceReference ? <a href={item.sourceReference}>합성 근거 참조</a> : '확인 경로 없음'}</dd></dl></section>)}
    </div>
  </div>
}

