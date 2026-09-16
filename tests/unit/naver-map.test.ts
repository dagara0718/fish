import { afterEach, describe, expect, it, vi } from 'vitest'
afterEach(() => { vi.restoreAllMocks(); vi.resetModules(); document.head.querySelectorAll('script').forEach(script => script.remove()); delete window.naver })
describe('NAVER SDK loader', () => {
  it('handles missing key', async () => { const { loadNaverMap } = await import('../../src/infrastructure/map/naver-map-loader'); await expect(loadNaverMap('')).rejects.toThrow('KEY_MISSING') })
  it('loads once for concurrent consumers using ncpKeyId', async () => {
    const { loadNaverMap } = await import('../../src/infrastructure/map/naver-map-loader')
    const first = loadNaverMap('public-test-id'); const second = loadNaverMap('public-test-id')
    expect(first).toBe(second); expect(document.head.querySelectorAll('script')).toHaveLength(1)
    expect(document.head.querySelector('script')?.src).toContain('ncpKeyId=public-test-id')
    window.naver = { maps: { Map: class {} } as unknown as NonNullable<typeof window.naver>['maps'] }; window.fishNaverReady?.()
    await expect(first).resolves.toBe(window.naver.maps)
  })
  it('resolves when the SDK assigns window.naver after invoking the callback', async () => {
    vi.useFakeTimers()
    try {
      const { loadNaverMap } = await import('../../src/infrastructure/map/naver-map-loader')
      const promise = loadNaverMap('public-test-id')
      // The real SDK calls the callback before the namespace exists; readiness must not be assumed.
      window.fishNaverReady?.()
      await vi.advanceTimersByTimeAsync(200)
      window.naver = { maps: { Map: class {} } as unknown as NonNullable<typeof window.naver>['maps'] }
      await vi.advanceTimersByTimeAsync(100)
      await expect(promise).resolves.toBe(window.naver.maps)
    } finally { vi.useRealTimers() }
  })

  it.each(['error', 'auth'])('reports SDK %s', async reason => {
    const { loadNaverMap } = await import('../../src/infrastructure/map/naver-map-loader')
    const promise = loadNaverMap('public-test-id')
    if (reason === 'auth') window.navermap_authFailure?.(); else document.head.querySelector('script')?.dispatchEvent(new Event('error'))
    await expect(promise).rejects.toThrow(reason === 'auth' ? 'AUTH_FAILED' : 'LOAD_FAILED')
  })
})
