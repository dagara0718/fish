import type { OfficialFishingPointRef } from '../../official-index/contracts'
import type { TransientCoordinates } from '../../official-index/location-candidates'
import type { NaverSdk } from './naver-map-loader'

// NAVER's real `click` event on the map carries `{ coord: { lat(), lng() } }` (Coord instance).
// Defensive to property-style coordinates too, so a stricter test substitute stays valid.
function extractCoord(event: unknown): TransientCoordinates | undefined {
  const coord = (event as { coord?: { lat?: unknown; lng?: unknown } } | undefined)?.coord
  if (!coord) return undefined
  const lat = typeof coord.lat === 'function' ? (coord.lat as () => number)() : coord.lat
  const lng = typeof coord.lng === 'function' ? (coord.lng as () => number)() : coord.lng
  return typeof lat === 'number' && typeof lng === 'number' ? { latitude: lat, longitude: lng } : undefined
}

export class NaverMapProvider {
  private map: InstanceType<NaverSdk['Map']>
  private markers: InstanceType<NaverSdk['Marker']>[] = []
  private markerListeners: unknown[] = []
  private backgroundListener: unknown
  private resize: ResizeObserver
  private lastMarkerClickAt = 0
  constructor(private sdk: NaverSdk, element: HTMLElement, onBackgroundClick: (coords: TransientCoordinates) => void) {
    this.map = new sdk.Map(element, { center: new sdk.LatLng(36, 127.5), zoom: 7, minZoom: 5, maxZoom: 16 })
    this.resize = new ResizeObserver(() => { if (element.clientWidth) this.map.setSize(new sdk.Size(element.clientWidth, element.clientHeight)) })
    this.resize.observe(element)
    // A marker click can still reach this listener (bubbling, or an SDK build that fires both);
    // a short time guard disambiguates it from a genuine background click without relying on
    // stopPropagation support in the SDK's event object.
    this.backgroundListener = sdk.Event.addListener(this.map, 'click', (event?: unknown) => {
      if (performance.now() - this.lastMarkerClickAt < 50) return
      const coord = extractCoord(event)
      if (coord) onBackgroundClick(coord)
    })
  }
  // Marker sync only — never touches the camera. Called on every preview/selection/arbitrary-click
  // state change so that a user's own zoom/pan is never overwritten by an unrelated state update.
  syncMarkers(points: OfficialFishingPointRef[], location: TransientCoordinates | undefined, selectedId: string | undefined, previewId: string | undefined, arbitrary: TransientCoordinates | undefined, onPreview: (point: OfficialFishingPointRef) => void) {
    this.clearMarkers()
    const add = (coords: TransientCoordinates, label: string, isPreview: boolean, click?: () => void) => {
      const position = new this.sdk.LatLng(coords.latitude, coords.longitude)
      const content = document.createElement('span')
      content.className = isPreview ? 'map-marker map-marker--preview' : 'map-marker'
      content.textContent = label
      const marker = new this.sdk.Marker({ map: this.map, position, title: label, icon: { content } })
      this.markers.push(marker)
      if (click) this.markerListeners.push(this.sdk.Event.addListener(marker, 'click', (event?: unknown) => {
        this.lastMarkerClickAt = performance.now()
        ;(event as { stopPropagation?: () => void } | undefined)?.stopPropagation?.()
        click()
      }))
    }
    if (location) add(location, '◎ 현재 위치', false)
    points.forEach(point => add(point, `${point.officialPointId === selectedId ? '◆ 선택' : '● 공식 기준'} · ${point.placeName}`, point.officialPointId === previewId, () => onPreview(point)))
    if (arbitrary) add(arbitrary, '× 선택 위치', false)
  }
  // Camera-only — called only when the candidate set itself changes (a new search) or the user
  // takes an explicit "현재 위치" action, never on preview/selection/arbitrary-click state changes.
  frame(points: OfficialFishingPointRef[], location: TransientCoordinates | undefined) {
    const bounds = new this.sdk.LatLngBounds()
    let extent = 0
    const consider = (coords: TransientCoordinates) => { bounds.extend(new this.sdk.LatLng(coords.latitude, coords.longitude)); extent += 1 }
    if (location) consider(location)
    points.forEach(consider)
    if (extent > 1) this.map.fitBounds(bounds)
    else if (extent === 1) { const p = location ?? points[0]!; this.map.panTo(new this.sdk.LatLng(p.latitude, p.longitude)); this.map.setZoom(10) }
  }
  private clearMarkers() { this.markerListeners.forEach(listener => this.sdk.Event.removeListener(listener)); this.markers.forEach(marker => marker.setMap(null)); this.markerListeners = []; this.markers = [] }
  destroy() { this.clearMarkers(); this.sdk.Event.removeListener(this.backgroundListener); this.resize.disconnect(); this.map.destroy() }
}
