import { describe, expect, it, vi } from 'vitest'
import { LiveOfficialFishingIndexProvider, classifyFailure } from '../../src/official-index/live-provider'
import type { OfficialItem } from '../../shared/fishing-api'

const instantSleep = () => Promise.resolve()
const item = (overrides: Partial<OfficialItem> = {}): OfficialItem => ({ seafsPstnNm: '가거도', lat: 34.07, lot: 125.08, predcYmd: '20990101', predcNoonSeCd: '오전', seafsTgfshNm: '참돔', totalIndex: '좋음', ...overrides })
const envelope = (items: OfficialItem[], totalCount = items.length) => Response.json({ version: 1, items, totalCount, fetchedAt: new Date().toISOString() })
const upstreamError = () => new Response(JSON.stringify({ error: 'UPSTREAM_ERROR' }), { status: 502 })
const malformed = () => new Response(JSON.stringify({ error: 'MALFORMED_RESPONSE' }), { status: 502 })

describe('classifyFailure', () => {
  it('retries a network exception (no response object)', async () => { expect(await classifyFailure(undefined, new TypeError('network'), undefined)).toBe('RETRY') })
  it.each([429, 500, 503, 504])('retries upstream %s', async status => { expect(await classifyFailure(new Response(null, { status }), undefined, undefined)).toBe('RETRY') })
  it('retries 502 UPSTREAM_ERROR', async () => { expect(await classifyFailure(upstreamError(), undefined, undefined)).toBe('RETRY') })
  it('does not retry 502 MALFORMED_RESPONSE', async () => { expect(await classifyFailure(malformed(), undefined, undefined)).toBe('FATAL') })
  it.each([400, 401, 403, 404, 405])('does not retry %s', async status => { expect(await classifyFailure(new Response(null, { status }), undefined, undefined)).toBe('FATAL') })
  it('reports ABORT when the external signal is already aborted, regardless of response', async () => {
    const controller = new AbortController(); controller.abort()
    expect(await classifyFailure(upstreamError(), undefined, controller.signal)).toBe('ABORT')
  })
})

describe('page-level retry', () => {
  it('retries a transient 502 and succeeds within the bounded attempt budget', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(upstreamError()).mockResolvedValueOnce(envelope([item()]))
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', fetcher, instantSleep)
    const catalog = await provider.getCatalog('갯바위')
    expect(catalog.status).toBe('SUCCESS'); expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('never retries a 400 (fatal, bounded to a single attempt)', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 400 }))
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', fetcher, instantSleep)
    const catalog = await provider.getCatalog('갯바위')
    expect(catalog.status).toBe('COLLECTION_FAILED'); expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('gives up after 3 total attempts (initial + 2 retries), never unbounded', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(upstreamError())
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', fetcher, instantSleep)
    const catalog = await provider.getCatalog('갯바위')
    expect(catalog.status).toBe('COLLECTION_FAILED'); expect(fetcher).toHaveBeenCalledTimes(3)
  })
  it('stops immediately on external abort, without exhausting retries', async () => {
    const controller = new AbortController()
    const fetcher = vi.fn<typeof fetch>().mockImplementation(() => { controller.abort(); return Promise.resolve(upstreamError()) })
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', fetcher, instantSleep)
    await expect(provider.getCatalog('갯바위', controller.signal)).rejects.toThrow()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})

describe('partial catalog preservation', () => {
  it('preserves points from pages that succeeded when a later page fails after retries', async () => {
    const page1 = envelope([item({ seafsPstnNm: '가거도' })], 600) // totalCount 600 → 2 expected pages
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(page1).mockResolvedValue(upstreamError())
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', fetcher, instantSleep)
    const catalog = await provider.getCatalog('갯바위')
    expect(catalog.status).toBe('PARTIAL')
    expect(catalog.points.map(p => p.placeName)).toEqual(['가거도'])
    expect(catalog.failedPages).toContain(2)
  })
  it('dedupes the same official point across repeated species/time rows', async () => {
    const rows = [item({ seafsTgfshNm: '참돔' }), item({ seafsTgfshNm: '우럭' }), item({ seafsTgfshNm: '농어' })]
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(envelope(rows))
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', fetcher, instantSleep)
    const catalog = await provider.getCatalog('갯바위')
    expect(catalog.points).toHaveLength(1)
  })
  it('COLLECTION_FAILED when page 1 itself fails and there is no cache to fall back on', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(upstreamError())
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', fetcher, instantSleep)
    const catalog = await provider.getCatalog('갯바위')
    expect(catalog.status).toBe('COLLECTION_FAILED'); expect(catalog.points).toHaveLength(0)
  })
})

describe('fresh/stale catalog cache', () => {
  it('uses zero upstream calls when the catalog is fresh (warm catalog)', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(envelope([item()]))
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', fetcher, instantSleep)
    await provider.getCatalog('갯바위')
    fetcher.mockClear()
    const second = await provider.getCatalog('갯바위')
    expect(second.status).toBe('SUCCESS'); expect(fetcher).not.toHaveBeenCalled()
  })
  it('falls back to the complete stale cache instead of surfacing a fresher partial result', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(envelope([item({ seafsPstnNm: '가거도' })]))
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', fetcher, instantSleep)
    const first = await provider.getCatalog('갯바위')
    expect(first.status).toBe('SUCCESS')
    // Force staleness, then make every subsequent call fail — a partial refresh must never win over the complete cache.
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 6 * 60 * 1000)
    fetcher.mockResolvedValue(upstreamError())
    const second = await provider.getCatalog('갯바위')
    expect(second.status).toBe('STALE_FALLBACK')
    expect(second.points.map(p => p.placeName)).toEqual(['가거도'])
    vi.restoreAllMocks()
  })
  it('does not permanently cache a failed collection — the next call retries fresh', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(upstreamError()).mockResolvedValueOnce(upstreamError()).mockResolvedValueOnce(upstreamError()).mockResolvedValueOnce(envelope([item()]))
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', fetcher, instantSleep)
    const first = await provider.getCatalog('갯바위')
    expect(first.status).toBe('COLLECTION_FAILED')
    const second = await provider.getCatalog('갯바위')
    expect(second.status).toBe('SUCCESS')
  })
  it('de-duplicates concurrent in-flight requests for the same fishing type', async () => {
    let calls = 0
    const fetcher = vi.fn<typeof fetch>().mockImplementation(() => { calls++; return Promise.resolve(envelope([item()])) })
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', fetcher, instantSleep)
    const [a, b] = await Promise.all([provider.getCatalog('갯바위'), provider.getCatalog('갯바위')])
    expect(a).toEqual(b); expect(calls).toBe(1)
  })
  it("a caller's own abort does not corrupt a different, still-active caller's in-flight request", async () => {
    // Regression: the in-flight dedupe must key on whether the ORIGINAL caller's signal is still
    // valid, not just on fishingType — otherwise search A's cancellation poisons search B's shared
    // promise even though B never asked to cancel anything (caught by an E2E "fast second search").
    let resolveB: ((r: Response) => void) | undefined
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_url, init?: RequestInit) => new Promise<Response>((resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      resolveB = resolve // the second (post-abort) call is caller B's fresh request
    }))
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', fetcher, instantSleep)
    const controllerA = new AbortController()
    const pendingA = provider.getCatalog('갯바위', controllerA.signal)
    controllerA.abort() // caller A gives up before its fetch resolves — this must reject pendingA only
    const pendingB = provider.getCatalog('갯바위') // caller B has no signal — must not inherit A's abort
    resolveB!(envelope([item()]))
    const [resultA, resultB] = await Promise.allSettled([pendingA, pendingB])
    expect(resultA.status).toBe('rejected')
    expect(resultB.status).toBe('fulfilled')
    if (resultB.status === 'fulfilled') expect(resultB.value.status).toBe('SUCCESS')
  })
  it('never uses a coordinate, GPS, or credential as the cache key (fishingType only)', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(envelope([item()]))
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', fetcher, instantSleep)
    await provider.getCatalog('갯바위')
    const url = String(fetcher.mock.calls[0]![0])
    expect(url).not.toMatch(/serviceKey|latitude|longitude|lat=|lon=/)
  })
})

describe('detail query resilience (separate cache from the catalog)', () => {
  const point = { officialPointId: 'p', linkedPointId: 'p', placeName: '가거도', regionContext: '공식', fishingType: '갯바위' as const, latitude: 34.07, longitude: 125.08 }
  it('retries a transient failure on the detail page just like a catalog page', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(upstreamError()).mockResolvedValueOnce(envelope([item()]))
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', fetcher, instantSleep)
    const result = await provider.getOfficialIndex(point)
    expect(result.kind).toBe('SUCCESS')
  })
  it('keeps the detail cache independent of the catalog cache for a different point', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(envelope([item()]))
    const provider = new LiveOfficialFishingIndexProvider('https://proxy.example', fetcher, instantSleep)
    await provider.getOfficialIndex(point)
    fetcher.mockResolvedValue(upstreamError())
    const otherPoint = { ...point, officialPointId: 'other', placeName: '다른 포인트' }
    const result = await provider.getOfficialIndex(otherPoint)
    expect(result.kind).toBe('COLLECTION_FAILED')
  })
})
