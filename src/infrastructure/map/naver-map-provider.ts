import type { OfficialFishingPointRef } from '../../official-index/contracts'
import type { TransientCoordinates } from '../../official-index/location-candidates'
import type { NaverSdk } from './naver-map-loader'

export class NaverMapProvider {
  private map: InstanceType<NaverSdk['Map']>
  private markers: InstanceType<NaverSdk['Marker']>[] = []
  private listeners: unknown[] = []
  private resize: ResizeObserver
  constructor(private sdk: NaverSdk, element: HTMLElement) {
    this.map = new sdk.Map(element, { center: new sdk.LatLng(36, 127.5), zoom: 7, minZoom: 5, maxZoom: 16 })
    this.resize = new ResizeObserver(() => { if (element.clientWidth) this.map.setSize(new sdk.Size(element.clientWidth, element.clientHeight)) })
    this.resize.observe(element)
  }
  update(points: OfficialFishingPointRef[], location: TransientCoordinates | undefined, selectedId: string | undefined, preview: (point: OfficialFishingPointRef) => void) {
    this.clear()
    const bounds = new this.sdk.LatLngBounds()
    const add = (coords: TransientCoordinates, label: string, click?: () => void) => {
      const position = new this.sdk.LatLng(coords.latitude, coords.longitude)
      bounds.extend(position)
      const content = document.createElement('span')
      content.className = 'map-marker'; content.textContent = label
      const marker = new this.sdk.Marker({ map: this.map, position, title: label, icon: { content } })
      this.markers.push(marker)
      if (click) this.listeners.push(this.sdk.Event.addListener(marker, 'click', click))
    }
    if (location) add(location, '◎ 현재 위치')
    points.forEach(point => add(point, `${point.officialPointId === selectedId ? '◆ 선택' : '● 공식 기준'} · ${point.placeName}`, () => preview(point)))
    if (points.length + Number(Boolean(location)) > 1) this.map.fitBounds(bounds)
    else if (location || points[0]) { const p = location ?? points[0]!; this.map.panTo(new this.sdk.LatLng(p.latitude, p.longitude)); this.map.setZoom(10) }
  }
  private clear() { this.listeners.forEach(listener => this.sdk.Event.removeListener(listener)); this.markers.forEach(marker => marker.setMap(null)); this.listeners = []; this.markers = [] }
  destroy() { this.clear(); this.resize.disconnect(); this.map.destroy() }
}
