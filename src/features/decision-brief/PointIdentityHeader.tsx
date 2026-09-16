import type { FishingPoint } from '../../domain/contracts'
export function PointIdentityHeader({ point, onBack }: { point: FishingPoint; onBack: () => void }) { return <header className="brief-header"><div><p className="identity-kicker">선택한 합성 포인트</p><h2 className="identity-title">{point.name}</h2><p className="section-help">{point.regionContext} · {point.pointType ?? '합성 유형 미정'}</p></div><button className="secondary-button" type="button" onClick={onBack}>검색 결과로 돌아가기</button></header> }

