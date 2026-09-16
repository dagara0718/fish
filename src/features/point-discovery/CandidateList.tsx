import type { FishingPoint } from '../../domain/contracts'

export function CandidateList({ candidates, onSelect }: { candidates: FishingPoint[]; onSelect: (point: FishingPoint) => void }) {
  return <div><p className="section-help" aria-live="polite">지원 후보 {candidates.length}개입니다. 자동 선택하지 않습니다.</p><ul className="candidate-list" aria-label="합성 지원 포인트 후보">{candidates.map((point) => <li key={point.pointId}><button className="candidate-button" type="button" onClick={() => onSelect(point)}><span className="candidate-name">{point.name}</span><span className="candidate-context">{point.regionContext || '구분 맥락 없음'}{point.pointType ? ` · ${point.pointType}` : ''}</span><span className="candidate-context">지원 fixture · 명시적으로 선택</span></button></li>)}</ul></div>
}

