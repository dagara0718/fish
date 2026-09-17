import { describe, expect, it, vi } from 'vitest'
import { NaverMapProvider } from '../../src/infrastructure/map/naver-map-provider'
import type { NaverSdk } from '../../src/infrastructure/map/naver-map-loader'
import type { OfficialFishingPointRef } from '../../src/official-index/contracts'

// jsdom has no ResizeObserver; the provider only uses it to keep the map sized to its container.
globalThis.ResizeObserver ??= class { observe() {} disconnect() {} unobserve() {} } as unknown as typeof ResizeObserver

class MockMap { clickHandlers: ((event?: unknown) => void)[] = []; boundsFit = false; panned: unknown; zoom: number | undefined; destroyed = false
  fitBounds() { this.boundsFit = true }
  panTo(position: unknown) { this.panned = position }
  setZoom(zoom: number) { this.zoom = zoom }
  setSize() {}
  destroy() { this.destroyed = true }
}
class MockMarker { clickHandlers: ((event?: unknown) => void)[] = []; removed = false
  constructor(public opts: { title: string; icon: { content: HTMLElement } }) {}
  setMap(map: unknown) { if (map === null) this.removed = true }
}
class MockBounds { extend() {} }

function makeSdk() {
  return {
    Map: MockMap, Marker: MockMarker, LatLngBounds: MockBounds, Size: class {},
    LatLng: class { constructor(public latitude: number, public longitude: number) {} },
    Event: {
      addListener(target: unknown, _event: string, handler: (event?: unknown) => void) {
        (target as { clickHandlers: typeof handler[] }).clickHandlers.push(handler)
        return { target, handler }
      },
      removeListener(id: unknown) {
        const { target, handler } = id as { target: { clickHandlers: unknown[] }; handler: unknown }
        target.clickHandlers = target.clickHandlers.filter(item => item !== handler)
      },
    },
  } as unknown as NaverSdk
}

const point: OfficialFishingPointRef = { officialPointId: 'p1', linkedPointId: 'p1', placeName: '테스트 포인트', regionContext: '테스트', fishingType: '갯바위', latitude: 35, longitude: 129 }

describe('NaverMapProvider map click handling', () => {
  it('reports background click coordinates from a coord-shaped event', () => {
    const onBackgroundClick = vi.fn()
    const provider = new NaverMapProvider(makeSdk(), document.createElement('div'), onBackgroundClick)
    const map = (provider as unknown as { map: MockMap }).map
    map.clickHandlers[0]?.({ coord: { lat: () => 35.5, lng: () => 129.5 } })
    expect(onBackgroundClick).toHaveBeenCalledWith({ latitude: 35.5, longitude: 129.5 })
  })
  it('ignores a background click with no coord payload', () => {
    const onBackgroundClick = vi.fn()
    const provider = new NaverMapProvider(makeSdk(), document.createElement('div'), onBackgroundClick)
    const map = (provider as unknown as { map: MockMap }).map
    map.clickHandlers[0]?.(undefined)
    map.clickHandlers[0]?.({})
    expect(onBackgroundClick).not.toHaveBeenCalled()
  })
  it('ignores a background click that immediately follows a marker click', () => {
    const onBackgroundClick = vi.fn()
    const onPreview = vi.fn()
    const provider = new NaverMapProvider(makeSdk(), document.createElement('div'), onBackgroundClick)
    provider.syncMarkers([point], undefined, undefined, undefined, undefined, onPreview)
    const marker = (provider as unknown as { markers: MockMarker[] }).markers[0]!
    marker.clickHandlers[0]?.({ stopPropagation: vi.fn() })
    const map = (provider as unknown as { map: MockMap }).map
    map.clickHandlers[0]?.({ coord: { lat: () => 1, lng: () => 1 } })
    expect(onPreview).toHaveBeenCalledWith(point)
    expect(onBackgroundClick).not.toHaveBeenCalled()
  })
  it('does not fail when the click event lacks stopPropagation', () => {
    const onPreview = vi.fn()
    const provider = new NaverMapProvider(makeSdk(), document.createElement('div'), vi.fn())
    provider.syncMarkers([point], undefined, undefined, undefined, undefined, onPreview)
    const marker = (provider as unknown as { markers: MockMarker[] }).markers[0]!
    expect(() => marker.clickHandlers[0]?.(undefined)).not.toThrow()
    expect(onPreview).toHaveBeenCalledWith(point)
  })
})

describe('NaverMapProvider marker rendering (syncMarkers never touches the camera)', () => {
  it('renders the arbitrary location marker distinctly without moving the camera', () => {
    const provider = new NaverMapProvider(makeSdk(), document.createElement('div'), vi.fn())
    provider.syncMarkers([point], undefined, undefined, undefined, { latitude: 1, longitude: 2 }, vi.fn())
    const markers = (provider as unknown as { markers: MockMarker[] }).markers
    expect(markers.some(marker => marker.opts.title === '× 선택 위치')).toBe(true)
    const map = (provider as unknown as { map: MockMap }).map
    expect(map.boundsFit).toBe(false); expect(map.zoom).toBeUndefined(); expect(map.panned).toBeUndefined()
  })
  it('marks the previewed official marker with the preview style, distinct from selected, without moving the camera', () => {
    const other: OfficialFishingPointRef = { ...point, officialPointId: 'p2', placeName: '다른 포인트' }
    const provider = new NaverMapProvider(makeSdk(), document.createElement('div'), vi.fn())
    provider.syncMarkers([point, other], undefined, other.officialPointId, point.officialPointId, undefined, vi.fn())
    const markers = (provider as unknown as { markers: MockMarker[] }).markers
    expect(markers[0]!.opts.icon.content.className).toContain('map-marker--preview')
    expect(markers[0]!.opts.title).toContain('● 공식 기준')
    expect(markers[1]!.opts.title).toContain('◆ 선택')
    expect(markers[1]!.opts.icon.content.className).not.toContain('map-marker--preview')
    expect((provider as unknown as { map: MockMap }).map.boundsFit).toBe(false)
  })
  it('an arbitrary-only marker never pans/zooms the camera (viewport-preserving background click)', () => {
    const provider = new NaverMapProvider(makeSdk(), document.createElement('div'), vi.fn())
    provider.syncMarkers([], undefined, undefined, undefined, { latitude: 3, longitude: 4 }, vi.fn())
    const map = (provider as unknown as { map: MockMap }).map
    expect(map.boundsFit).toBe(false); expect(map.zoom).toBeUndefined(); expect(map.panned).toBeUndefined()
  })
  it('replaces markers on each sync instead of accumulating them', () => {
    const provider = new NaverMapProvider(makeSdk(), document.createElement('div'), vi.fn())
    provider.syncMarkers([point], undefined, undefined, undefined, undefined, vi.fn())
    const first = (provider as unknown as { markers: MockMarker[] }).markers[0]!
    provider.syncMarkers([], undefined, undefined, undefined, { latitude: 5, longitude: 6 }, vi.fn())
    expect(first.removed).toBe(true)
    expect((provider as unknown as { markers: MockMarker[] }).markers).toHaveLength(1)
  })
})

describe('NaverMapProvider frame (camera-only, called only for a new search result set or explicit locate)', () => {
  it('fits bounds over points + location when more than one coordinate is present', () => {
    const provider = new NaverMapProvider(makeSdk(), document.createElement('div'), vi.fn())
    provider.frame([point], { latitude: 1, longitude: 2 })
    expect((provider as unknown as { map: MockMap }).map.boundsFit).toBe(true)
  })
  it('pans and zooms to a single point when only one coordinate is present', () => {
    const provider = new NaverMapProvider(makeSdk(), document.createElement('div'), vi.fn())
    provider.frame([point], undefined)
    const map = (provider as unknown as { map: MockMap }).map
    expect(map.boundsFit).toBe(false); expect(map.zoom).toBe(10)
  })
  it('pans and zooms to a single location when there are no points', () => {
    const provider = new NaverMapProvider(makeSdk(), document.createElement('div'), vi.fn())
    provider.frame([], { latitude: 3, longitude: 4 })
    const map = (provider as unknown as { map: MockMap }).map
    expect(map.boundsFit).toBe(false); expect(map.zoom).toBe(10)
  })
  it('does nothing when there are no points and no location', () => {
    const provider = new NaverMapProvider(makeSdk(), document.createElement('div'), vi.fn())
    provider.frame([], undefined)
    const map = (provider as unknown as { map: MockMap }).map
    expect(map.boundsFit).toBe(false); expect(map.zoom).toBeUndefined(); expect(map.panned).toBeUndefined()
  })
})

describe('NaverMapProvider destroy', () => {
  it('removes the background listener and destroys the map', () => {
    const provider = new NaverMapProvider(makeSdk(), document.createElement('div'), vi.fn())
    const map = (provider as unknown as { map: MockMap }).map
    provider.destroy()
    expect(map.destroyed).toBe(true)
    expect(map.clickHandlers).toHaveLength(0)
  })
})
