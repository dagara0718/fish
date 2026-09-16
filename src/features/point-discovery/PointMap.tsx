import { useEffect, useRef, useState } from 'react'
import { loadNaverMap, type MapState } from '../../infrastructure/map/naver-map-loader'
import { NaverMapProvider } from '../../infrastructure/map/naver-map-provider'
import type { OfficialFishingPointRef } from '../../official-index/contracts'
import type { TransientCoordinates } from '../../official-index/location-candidates'

export function PointMap({ points, location, selectedId, previewId, arbitrary, onPreview, onMapClick }: {
  points: OfficialFishingPointRef[]
  location: TransientCoordinates | undefined
  selectedId: string | undefined
  previewId: string | undefined
  arbitrary: TransientCoordinates | undefined
  onPreview: (point: OfficialFishingPointRef) => void
  onMapClick: (coords: TransientCoordinates) => void
}) {
  const element = useRef<HTMLDivElement>(null)
  const provider = useRef<NaverMapProvider | null>(null)
  const previewCallback = useRef(onPreview)
  const clickCallback = useRef(onMapClick)
  useEffect(() => { previewCallback.current = onPreview }, [onPreview])
  useEffect(() => { clickCallback.current = onMapClick }, [onMapClick])
  const [state, setState] = useState<MapState>('SDK_LOADING')
  useEffect(() => {
    let disposed = false
    loadNaverMap(import.meta.env.VITE_NAVER_MAP_NCP_KEY_ID ?? '').then(sdk => {
      if (disposed || !element.current) return
      provider.current = new NaverMapProvider(sdk, element.current, coords => clickCallback.current(coords)); setState('READY')
    }).catch((error: Error) => { if (!disposed) setState(error.message === 'KEY_MISSING' ? 'KEY_MISSING' : error.message === 'AUTH_FAILED' ? 'AUTH_FAILED' : 'LOAD_FAILED') })
    return () => { disposed = true; provider.current?.destroy(); provider.current = null }
  }, [])
  useEffect(() => { provider.current?.update(points, location, selectedId, previewId, arbitrary, point => previewCallback.current(point)) }, [points, location, selectedId, previewId, arbitrary, state])
  const messages: Record<MapState, string> = { SDK_LOADING: '지도를 불러오는 중입니다.', READY: '공식 기준 포인트를 클릭하거나, 지도의 다른 위치를 클릭해 주변 공식 기준 포인트를 확인하세요.', KEY_MISSING: 'NAVER 지도 설정이 필요합니다.', AUTH_FAILED: '지도 인증을 확인해 주세요.', LOAD_FAILED: '지도를 불러오지 못했습니다. 후보 목록을 이용해 주세요.' }
  return <section className="map-panel" aria-label="포인트 지도"><div className="map-canvas" ref={element} /><p className="map-status" role="status">{messages[state]}</p></section>
}
