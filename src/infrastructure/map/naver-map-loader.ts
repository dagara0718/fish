export type MapState = 'SDK_LOADING' | 'READY' | 'KEY_MISSING' | 'AUTH_FAILED' | 'LOAD_FAILED'
export interface NaverSdk {
  Map: new (element: HTMLElement, options: object) => { fitBounds(bounds: unknown): void; panTo(position: unknown): void; setZoom(zoom: number): void; setSize(size: unknown): void; destroy(): void }
  Marker: new (options: object) => { setMap(map: null): void }
  LatLng: new (latitude: number, longitude: number) => unknown
  LatLngBounds: new () => { extend(position: unknown): void }
  Size: new (width: number, height: number) => unknown
  Event: { addListener(target: unknown, event: string, handler: () => void): unknown; removeListener(listener: unknown): void }
}
declare global { interface Window { naver?: { maps: NaverSdk }; navermap_authFailure?: () => void; fishNaverReady?: () => void } }
let loading: Promise<NaverSdk> | undefined
export function loadNaverMap(key: string): Promise<NaverSdk> {
  if (!key.trim()) return Promise.reject(new Error('KEY_MISSING'))
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const previousAuth = window.navermap_authFailure
    let poll: ReturnType<typeof setInterval> | undefined
    const finish = (error?: string) => {
      clearTimeout(timer)
      clearInterval(poll)
      delete window.fishNaverReady
      if (previousAuth) window.navermap_authFailure = previousAuth
      else delete window.navermap_authFailure
      if (error || !window.naver?.maps) { script.remove(); reject(new Error(error ?? 'LOAD_FAILED')) }
      else resolve(window.naver.maps)
    }
    // The SDK invokes `callback` before it assigns window.naver, so wait for the namespace
    // instead of treating the callback itself as readiness.
    const settleWhenReady = () => {
      if (window.naver?.maps?.Map) finish()
      else poll ??= setInterval(() => { if (window.naver?.maps?.Map) finish() }, 50)
    }
    const timer = setTimeout(() => finish('LOAD_FAILED'), 15000)
    window.fishNaverReady = () => settleWhenReady()
    window.navermap_authFailure = () => finish('AUTH_FAILED')
    script.async = true
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?${new URLSearchParams({ ncpKeyId: key, callback: 'fishNaverReady' })}`
    script.onerror = () => finish('LOAD_FAILED')
    document.head.append(script)
  })
  loading.catch(() => { loading = undefined })
  return loading
}
