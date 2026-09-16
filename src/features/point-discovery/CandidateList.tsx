import type { FishingPoint } from '../../domain/contracts'

export function CandidateList({ candidates, selectedPointId, onSelect }: { candidates: FishingPoint[]; selectedPointId: string | undefined; onSelect: (point: FishingPoint) => void }) {
  return <div><p className="candidate-summary" aria-live="polite">지역과 유형을 확인하고 포인트를 선택하세요.</p><ul className="candidate-list" aria-label="지원 포인트 후보">{candidates.map((point) => <li key={point.pointId}><button className="candidate-button" data-selected={selectedPointId === point.pointId} type="button" onClick={() => onSelect(point)}><span className="candidate-main"><span className="candidate-name">{point.name}</span><span className="candidate-context">{point.regionContext || '구분 맥락 없음'}{point.pointType ? ` · ${point.pointType.replace('합성 ', '')}` : ''}</span><span className="support-label"><span aria-hidden="true">●</span> 지원 포인트</span></span><span className="candidate-arrow" aria-hidden="true">→</span></button></li>)}</ul></div>
}
