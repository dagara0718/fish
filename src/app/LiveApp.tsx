import { useEffect, useRef, useState } from 'react'
import { LiveOfficialFishingIndexProvider } from '../official-index/live-provider'
import type { FishingType, OfficialFishingPointRef, OfficialIndexResult } from '../official-index/contracts'
import { distanceKm, rankLocationCandidates, type TransientCoordinates } from '../official-index/location-candidates'
import { PointMap } from '../features/point-discovery/PointMap'
import { OfficialIndexPanel } from '../features/official-index/OfficialIndexPanel'
import { SearchForm } from '../features/point-discovery/SearchForm'

export function LiveApp() {
  const [provider] = useState(() => new LiveOfficialFishingIndexProvider(import.meta.env.VITE_FISHING_API_BASE_URL ?? ''))
  const [query, setQuery] = useState('')
  const [type, setType] = useState<FishingType>('갯바위')
  const [points, setPoints] = useState<OfficialFishingPointRef[]>([])
  const [location, setLocation] = useState<TransientCoordinates>()
  const [preview, setPreview] = useState<OfficialFishingPointRef>()
  const [selected, setSelected] = useState<OfficialFishingPointRef>()
  const [result, setResult] = useState<OfficialIndexResult>()
  const [message, setMessage] = useState('포인트명으로 공식 기준 포인트를 검색해 주세요.')
  const [busy, setBusy] = useState(false)
  const [view, setView] = useState<'list' | 'map'>('list')
  const request = useRef<AbortController | null>(null)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false; request.current?.abort() } }, [])
  const start = () => { request.current?.abort(); const controller = new AbortController(); request.current = controller; setBusy(true); return controller }
  const search = async () => {
    const controller = start(); setPreview(undefined); setSelected(undefined); setResult(undefined)
    try {
      const catalog = await provider.getCatalog(type, controller.signal)
      if (controller.signal.aborted) return
      const matches = catalog.filter(point => point.placeName.includes(query.trim()))
      setPoints(matches); setMessage(matches.length ? `${matches.length}개 공식 기준 포인트입니다. 직접 선택해 주세요.` : '공식 바다낚시지수 미지원 위치 또는 현재 제공 데이터가 없습니다.')
    } catch { if (!controller.signal.aborted) { setPoints([]); setMessage('공식 후보 목록을 불러오지 못했습니다. 연결 설정을 확인한 뒤 다시 검색해 주세요.') } }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  const select = async (point: OfficialFishingPointRef) => {
    const controller = start(); setSelected(point); setResult(undefined)
    try { const value = await provider.getOfficialIndex(point, controller.signal); if (!controller.signal.aborted) setResult(value) }
    catch { /* Ignore cancellation of an older selection. */ }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  const locate = () => {
    if (!navigator.geolocation) { setMessage('현재 위치를 사용할 수 없습니다. 검색을 이용해 주세요.'); return }
    navigator.geolocation.getCurrentPosition(position => {
      if (!alive.current) return
      const value = { latitude: position.coords.latitude, longitude: position.coords.longitude }
      setLocation(value)
      const nearby = rankLocationCandidates(value, points)
      setMessage(nearby.length ? '거리 기준 후보입니다. 공식 기준 포인트를 직접 선택해 주세요.' : '현재 위치 주변에 지원되는 공식 바다낚시지수 포인트를 찾지 못했습니다. 먼저 공식 후보를 검색해 주세요.')
    }, () => { if (alive.current) setMessage('위치 권한이 거부되었거나 위치를 사용할 수 없습니다. 검색은 계속 이용할 수 있습니다.') }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 })
  }
  return <div className="app-shell"><header className="product-header"><div className="brand"><span className="brand-symbol">◎</span>포인트 판단</div><span className="demo-badge">LIVE · 공식 데이터</span></header><main id="main">
    <section className="search-surface"><div className="search-copy"><p className="section-kicker">POINT SEARCH</p><h1>어디로 출조할 예정인가요?</h1><p>공식 기준 포인트를 찾고, 어종별 지수와 데이터 근거를 확인하세요.</p></div><div className="search-actions"><SearchForm query={query} onQueryChange={setQuery} onSearch={() => void search()} /><button className="secondary-button" onClick={locate}>⌖ 현재 위치 사용</button></div><div className="example-row"><label>포인트 유형 <select value={type} onChange={event => setType(event.target.value as FishingType)}><option>갯바위</option><option>선상</option></select></label><details><summary>데이터·위치 안내</summary><p>위치는 이 화면 메모리에만 유지됩니다. 지도 이용 시 NAVER에 지도 영역 요청이 전달됩니다. 공식 예보는 실제 관측값이나 출조 판단이 아닙니다.</p></details></div></section>
    {!import.meta.env.VITE_FISHING_API_BASE_URL && <p className="inline-state" role="status">실시간 공식 데이터 연결이 설정되지 않았습니다. 예시를 보려면 Demo 모드를 선택하세요.</p>}
    <div className="mobile-view-switch"><button aria-pressed={view === 'list'} onClick={() => setView('list')}>목록</button><button aria-pressed={view === 'map'} onClick={() => setView('map')}>지도</button></div>
    <div className={`live-discovery view-${view}`}><aside className="discovery-panel"><h2>공식 후보 포인트</h2><p role="status">{busy ? '공식 데이터를 확인 중입니다.' : message}</p><ul className="live-candidates">{points.map(point => <li key={point.officialPointId}><button aria-pressed={preview?.officialPointId === point.officialPointId} onClick={() => setPreview(point)}><strong>{point.placeName}</strong><span>{point.regionContext} · {point.fishingType}</span><span>{location ? `${distanceKm(location, point).toFixed(1)} km · ` : ''}공식 지수 지원 →</span></button></li>)}</ul></aside><PointMap points={points} location={location} selectedId={selected?.officialPointId} onPreview={setPreview} /></div>
    {preview && <section className="point-preview"><div><h2>{preview.placeName}</h2><p>공식 바다낚시지수 기준 포인트 · {preview.fishingType}</p><p>{location ? `현재 위치와 ${distanceKm(location, preview).toFixed(1)} km · 거리 기반 후보 · ${selected?.officialPointId === preview.officialPointId ? '사용자 확인됨' : '아직 선택하지 않음'}` : '현재 위치와 공식 기준 포인트는 서로 다릅니다.'}</p></div><button className="primary-button" disabled={busy} onClick={() => void select(preview)}>이 포인트 선택</button></section>}
    <section className="brief-panel live-brief" aria-label="선택한 포인트 판단 브리프">{selected ? <><h2>{selected.placeName}</h2><p>공식 기준 포인트 · {selected.fishingType}</p>{result && <OfficialIndexPanel result={result} />}<button className="secondary-button" disabled={busy} onClick={() => void select(selected)}>공식 데이터 다시 조회</button></> : <><p className="section-kicker">DECISION BRIEF</p><h2>포인트를 선택하면 판단 정보가 표시됩니다.</h2><p>현재 환경 예보 · 어종별 공식 지수 · 기준시각과 근거</p></>}</section>
  </main></div>
}
