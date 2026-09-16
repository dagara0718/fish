import { useEffect, useRef, useState } from 'react'
import { loadNaverMap, type MapState } from '../../infrastructure/map/naver-map-loader'
import { NaverMapProvider } from '../../infrastructure/map/naver-map-provider'
import type { OfficialFishingPointRef } from '../../official-index/contracts'
import type { TransientCoordinates } from '../../official-index/location-candidates'

export function PointMap({ points, location, selectedId, onPreview }: { points: OfficialFishingPointRef[]; location: TransientCoordinates | undefined; selectedId: string | undefined; onPreview: (point: OfficialFishingPointRef) => void }) {
  const element = useRef<HTMLDivElement>(null)
  const provider = useRef<NaverMapProvider | null>(null)
  const callback = useRef(onPreview)
  useEffect(() => { callback.current = onPreview }, [onPreview])
  const [state, setState] = useState<MapState>('SDK_LOADING')
  useEffect(() => {
    let disposed = false
    loadNaverMap(import.meta.env.VITE_NAVER_MAP_NCP_KEY_ID ?? '').then(sdk => {
      if (disposed || !element.current) return
      provider.current = new NaverMapProvider(sdk, element.current); setState('READY')
    }).catch((error: Error) => { if (!disposed) setState(error.message === 'KEY_MISSING' ? 'KEY_MISSING' : error.message === 'AUTH_FAILED' ? 'AUTH_FAILED' : 'LOAD_FAILED') })
    return () => { disposed = true; provider.current?.destroy(); provider.current = null }
  }, [])
  useEffect(() => { provider.current?.update(points, location, selectedId, point => callback.current(point)) }, [points, location, selectedId, state])
  const messages: Record<MapState, string> = { SDK_LOADING: '지도를 불러오는 중입니다.', READY: '공식 기준 포인트 · 선택은 직접 확인해 주세요.', KEY_MISSING: 'NAVER 지도 설정이 필요합니다.', AUTH_FAILED: '지도 인증을 확인해 주세요.', LOAD_FAILED: '지도를 불러오지 못했습니다. 후보 목록을 이용해 주세요.' }
  return <section className="map-panel" aria-label="포인트 지도"><div className="map-canvas" ref={element} /><p className="map-status" role="status">{messages[state]}</p></section>
}
