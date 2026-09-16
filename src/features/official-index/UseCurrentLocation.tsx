import { useState } from 'react'
import { DEMO_OFFICIAL_POINTS } from '../../official-index/demo-provider'
import { rankLocationCandidates } from '../../official-index/location-candidates'
import type { LocationCandidate } from '../../official-index/contracts'

export function UseCurrentLocation({ onCandidates, onSelect }: { onCandidates: (items: LocationCandidate[]) => void; onSelect: (candidate: LocationCandidate) => void }) {
  const [state, setState] = useState<'IDLE' | 'LOADING' | 'DENIED' | 'UNAVAILABLE' | 'EMPTY' | 'READY'>('IDLE')
  const [items, setItems] = useState<LocationCandidate[]>([])
  const locate = () => {
    if (!navigator.geolocation) { setState('UNAVAILABLE'); return }
    setState('LOADING')
    navigator.geolocation.getCurrentPosition((position) => {
      const candidates = rankLocationCandidates({ latitude: position.coords.latitude, longitude: position.coords.longitude }, DEMO_OFFICIAL_POINTS)
      setItems(candidates); onCandidates(candidates); setState(candidates.length ? 'READY' : 'EMPTY')
    }, (error) => setState(error.code === error.PERMISSION_DENIED ? 'DENIED' : 'UNAVAILABLE'), { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 })
  }
  return <div className="location-tool">
    <button className="secondary-button location-button" type="button" onClick={locate} disabled={state === 'LOADING'}><span aria-hidden="true">⌖</span>{state === 'LOADING' ? '위치 확인 중' : '현재 위치 사용'}</button>
    {state === 'DENIED' && <p role="status">위치 권한이 거부되었습니다. 포인트 검색은 계속 사용할 수 있습니다.</p>}
    {state === 'UNAVAILABLE' && <p role="status">현재 위치를 사용할 수 없습니다. 포인트명으로 검색해 주세요.</p>}
    {state === 'EMPTY' && <p role="status">현재 위치 주변에 지원되는 공식 바다낚시지수 포인트를 찾지 못했습니다.</p>}
    {state === 'READY' && <div className="location-results" aria-label="현재 위치 주변 공식 후보"><p>주변 공식 기준 포인트 후보입니다. 직접 선택해 주세요.</p>{items.map((candidate) => <button type="button" key={candidate.point.officialPointId} onClick={() => onSelect(candidate)}><span><strong>{candidate.point.placeName}</strong><small>{candidate.point.regionContext} · {candidate.point.fishingType}</small></span><span className="distance">{candidate.distanceKm.toFixed(1)} km <span aria-hidden="true">→</span></span></button>)}</div>}
  </div>
}

