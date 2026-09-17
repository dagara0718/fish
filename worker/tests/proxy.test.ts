import { describe, expect, it, vi } from 'vitest'
import { handleRequest } from '../src/index'
const key = 'test-only-private+/=' 
const env = { KHOA_FISHING_SERVICE_KEY: key, REQUEST_LIMITER: { limit: async () => ({ success: true }) } }
const make = (query = 'gubun=갯바위', origin = 'https://dagara0718.github.io') => new Request(`https://worker.example/api/fishing-index?${query}`, { headers: { Origin: origin } })
const body = { header: { resultCode: '00' }, body: { totalCount: 1, items: { item: [{ seafsPstnNm: '계약 테스트', lat: 35, lot: 129, lastScr: 42 }] } } }
const deps = () => ({ fetch: vi.fn<typeof fetch>().mockResolvedValue(Response.json(body)), now: () => new Date('2026-09-16T00:00:00Z') })
describe('Worker security boundary', () => {
  it('uses fixed upstream, encodes key once and returns whitelisted DTO', async () => {
    const d = deps(); const response = await handleRequest(make(), env, d)
    expect(response.status).toBe(200)
    const url = new URL(String(d.fetch.mock.calls[0]![0]))
    expect(url.origin).toBe('https://apis.data.go.kr'); expect(url.searchParams.get('serviceKey')).toBe(key)
    expect(await response.text()).not.toContain(key)
  })
  it("uses redirect 'manual', not 'error' (the Workers runtime rejects 'error' with a TypeError)", async () => {
    const d = deps(); await handleRequest(make(), env, d)
    expect(d.fetch.mock.calls[0]![1]?.redirect).toBe('manual')
  })
  it('fails closed on an upstream redirect instead of following it', async () => {
    const d = deps(); d.fetch.mockResolvedValue(new Response(null, { status: 302, headers: { Location: 'https://evil.example' } }))
    expect((await handleRequest(make(), env, d)).status).toBe(502)
  })
  it.each([[429, 'UPSTREAM_429'], [500, 'UPSTREAM_5XX'], [503, 'UPSTREAM_5XX'], [404, 'UPSTREAM_ERROR']])('classifies upstream %s as httpClass %s for client retry decisions', async (status, httpClass) => {
    const d = deps(); d.fetch.mockResolvedValue(new Response(null, { status: status as number }))
    const result = await handleRequest(make(), env, d)
    expect(result.status).toBe(502)
    const parsed = await result.json()
    expect(parsed).toMatchObject({ error: 'UPSTREAM_ERROR', httpClass })
  })
  it.each(['gubun=other', 'gubun=선상&reqDate=20260230', 'gubun=선상&reqDate=2026-09-16', 'gubun=선상&numOfRows=301', 'gubun=선상&serviceKey=bad', 'gubun=선상&url=https://evil.example', 'gubun=선상&gubun=갯바위'])('rejects %s', async query => {
    const d = deps(); expect((await handleRequest(make(query), env, d)).status).toBe(400); expect(d.fetch).not.toHaveBeenCalled()
  })
  it('accepts the real upstream response shape (dashed predcYmd, no lastScr) and normalizes the date', async () => {
    const real = { header: { resultCode: '00' }, body: { totalCount: 1750, items: { item: [{ seafsPstnNm: '가거도', lat: 34.07308, lot: 125.08805, predcYmd: '2026-09-16', predcNoonSeCd: '오전', seafsTgfshNm: '감성돔', totalIndex: '좋음' }] } } }
    const d = deps(); d.fetch.mockResolvedValue(Response.json(real))
    const response = await handleRequest(make(), env, d)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.totalCount).toBe(1750)
    expect(data.items[0].predcYmd).toBe('20260916')
    expect(data.items[0].lastScr).toBeUndefined()
  })
  it('rejects foreign origin and missing secret', async () => {
    expect((await handleRequest(make(undefined, 'https://evil.example'), env, deps())).status).toBe(403)
    expect((await handleRequest(make(), {}, deps())).status).toBe(503)
    expect((await handleRequest(make(undefined, 'http://localhost:5173'), env, deps())).status).toBe(200)
  })
  it('fails closed for quota', async () => {
    expect((await handleRequest(make(), { ...env, REQUEST_LIMITER: { limit: async () => ({ success: false }) } }, deps())).status).toBe(429)
  })
  it.each([Response.json({ header: { resultCode: '99', resultMsg: key } }), new Response(key, { status: 500 }), new Response(key, { headers: { 'Content-Type': 'text/html' } }), Response.json({ bad: key })])('redacts upstream errors', async response => {
    const d = deps(); d.fetch.mockResolvedValue(response)
    const result = await handleRequest(make(), env, d); expect(result.status).toBe(502); expect(await result.text()).not.toContain(key)
  })
  it('does not lose the `this` receiver on the default-dependency fetch path (Illegal invocation regression)', async () => {
    // The Workers runtime throws "Illegal invocation" when a bare `fetch` reference is called as
    // deps.fetch(...) (receiver becomes `deps`, not the global). Vitest/Node's fetch tolerates
    // this silently, so the regression must be caught by asserting the call-site receiver itself.
    const stub = vi.fn(function (this: unknown) {
      if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation')
      return Response.json(body)
    })
    vi.stubGlobal('fetch', stub)
    try {
      const response = await handleRequest(make(), env)
      expect(response.status).toBe(200)
      expect(stub).toHaveBeenCalled()
    } finally { vi.unstubAllGlobals() }
  })
  it('times out without exposing upstream URL', async () => {
    vi.useFakeTimers()
    try {
      const d = deps(); d.fetch.mockImplementation((_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error(key)))))
      const pending = handleRequest(make(), env, d); await vi.advanceTimersByTimeAsync(10001)
      const result = await pending; expect(result.status).toBe(504); expect(await result.text()).not.toContain(key)
    } finally { vi.useRealTimers() }
  })
})

describe('Worker marine current route', () => {
  const marineKey = 'marine-test-only-secret'
  const marineEnv = { ...env, KHOA_MARINE_SERVICE_KEY: marineKey }
  const marineBody = { result: { data: [{ current_speed: '12.3', current_dir: '215', obs_date: '2026-09-16 12:00:00', type: '전류' }], meta: { sch_Stime: '2026-09-16 11:30', sch_Etime: '2026-09-16 12:30', lat: '35.123', lon: '129.456' } } }
  const marineQuery = 'SDate=20260916&SHour=11&SMinute=30&EDate=20260916&EHour=12&EMinute=30&lat=35.123&lon=129.456&ResultType=json'
  const makeMarine = (query = marineQuery, origin = 'https://dagara0718.github.io') => new Request(`https://worker.example/api/marine-current?${query}`, { headers: { Origin: origin } })
  const marineDeps = () => ({ fetch: vi.fn<typeof fetch>().mockResolvedValue(Response.json(marineBody)), now: () => new Date('2026-09-16T00:00:00Z') })

  it('uses fixed KHOA marine upstream, rounds coordinates, encodes separate key once', async () => {
    const d = marineDeps(); const response = await handleRequest(makeMarine(), marineEnv, d)
    expect(response.status).toBe(200)
    const url = new URL(String(d.fetch.mock.calls[0]![0]))
    expect(url.origin + url.pathname).toBe('https://khoa.go.kr/oceandata/api/tidalCurrentPoint/search.do')
    expect(url.searchParams.get('ServiceKey')).toBe(marineKey)
    expect(url.searchParams.get('lat')).toBe('35.123'); expect(url.searchParams.get('lon')).toBe('129.456')
    expect(await response.text()).not.toContain(marineKey)
  })
  it('returns NOT_CONFIGURED when KHOA_MARINE_SERVICE_KEY is unset (no fabricated key)', async () => {
    expect((await handleRequest(makeMarine(), env, marineDeps())).status).toBe(503)
  })
  it.each([
    'SDate=bad&SHour=11&SMinute=30&EDate=20260916&EHour=12&EMinute=30&lat=35&lon=129',
    'SDate=20260916&SHour=24&SMinute=30&EDate=20260916&EHour=12&EMinute=30&lat=35&lon=129',
    'SDate=20260916&SHour=11&SMinute=60&EDate=20260916&EHour=12&EMinute=30&lat=35&lon=129',
    'SDate=20260916&SHour=11&SMinute=30&EDate=20260916&EHour=12&EMinute=30&lat=91&lon=129',
    'SDate=20260916&SHour=11&SMinute=30&EDate=20260916&EHour=12&EMinute=30&lat=35&lon=181',
    'SDate=20260916&SHour=11&SMinute=30&EDate=20260916&EHour=12&EMinute=30&lat=35&lon=129&ResultType=xml',
    'SDate=20260916&SHour=11&SMinute=30&EDate=20260916&EHour=12&EMinute=30&lat=35&lon=129&extra=1',
  ])('rejects invalid marine params: %s', async query => {
    const d = marineDeps(); expect((await handleRequest(makeMarine(query), marineEnv, d)).status).toBe(400); expect(d.fetch).not.toHaveBeenCalled()
  })
  it('cache key never contains the exact GPS coordinate beyond 3dp or the secret', async () => {
    const put = vi.fn().mockResolvedValue(undefined)
    const d = { ...marineDeps(), cache: { match: vi.fn().mockResolvedValue(undefined), put } }
    await handleRequest(makeMarine('SDate=20260916&SHour=11&SMinute=30&EDate=20260916&EHour=12&EMinute=30&lat=35.123456&lon=129.654321&ResultType=json'), marineEnv, d)
    const cacheKeyUrl = String(put.mock.calls[0]![0].url)
    expect(cacheKeyUrl).toContain('lat=35.123'); expect(cacheKeyUrl).not.toContain('35.123456')
    expect(cacheKeyUrl).not.toContain(marineKey)
  })
  it('does not retry inside the Worker (single upstream attempt, client owns retry)', async () => {
    const d = marineDeps(); d.fetch.mockResolvedValue(new Response(null, { status: 500 }))
    await handleRequest(makeMarine(), marineEnv, d)
    expect(d.fetch).toHaveBeenCalledTimes(1)
  })
  it('classifies marine upstream failure and redacts the marine secret from error bodies', async () => {
    const d = marineDeps(); d.fetch.mockResolvedValue(new Response(marineKey, { status: 500 }))
    const result = await handleRequest(makeMarine(), marineEnv, d)
    expect(result.status).toBe(502); expect(await result.text()).not.toContain(marineKey)
  })
  it('accepts a real KHOA response even though Content-Type is text/html;charset=UTF-8 (confirmed live upstream behavior)', async () => {
    const d = marineDeps(); d.fetch.mockResolvedValue(new Response(JSON.stringify(marineBody), { headers: { 'Content-Type': 'text/html;charset=UTF-8' } }))
    const response = await handleRequest(makeMarine(), marineEnv, d)
    expect(response.status).toBe(200)
    const parsed = await response.json()
    expect(parsed.result.data[0]).toMatchObject({ current_speed: 12.3, current_dir: 215, obs_date: '2026-09-16 12:00:00', type: '전류' })
  })
  it('fails closed on an actual HTML error page even with a 200 status (text/html, not JSON)', async () => {
    const d = marineDeps(); d.fetch.mockResolvedValue(new Response('<html><body>error</body></html>', { headers: { 'Content-Type': 'text/html;charset=UTF-8' } }))
    expect((await handleRequest(makeMarine(), marineEnv, d)).status).toBe(502)
  })
  it('fails closed on malformed (non-parseable) JSON', async () => {
    const d = marineDeps(); d.fetch.mockResolvedValue(new Response('{not json', { headers: { 'Content-Type': 'application/json' } }))
    expect((await handleRequest(makeMarine(), marineEnv, d)).status).toBe(502)
  })
  it('fails closed on well-formed JSON that does not match the marine schema', async () => {
    const d = marineDeps(); d.fetch.mockResolvedValue(Response.json({ unrelated: true }))
    expect((await handleRequest(makeMarine(), marineEnv, d)).status).toBe(502)
  })
  it('normalizes numeric-string current_speed/current_dir to canonical numbers', async () => {
    const d = marineDeps()
    const response = await handleRequest(makeMarine(), marineEnv, d)
    const parsed = await response.json()
    expect(parsed.result.data[0].current_speed).toBe(12.3)
    expect(typeof parsed.result.data[0].current_speed).toBe('number')
    expect(parsed.result.data[0].current_dir).toBe(215)
    expect(typeof parsed.result.data[0].current_dir).toBe('number')
  })
  it('accepts an empty type string (confirmed present in the real KHOA response) rather than treating it as malformed', async () => {
    const d = marineDeps(); d.fetch.mockResolvedValue(Response.json({ result: { data: [{ current_speed: '28.0', current_dir: '240', obs_date: '2026-09-17 12:00:00', type: '' }], meta: { sch_Stime: '2026-09-17 12:00', sch_Etime: '2026-09-17 13:00', lat: '36', lon: '126.5' } } }))
    const response = await handleRequest(makeMarine(), marineEnv, d)
    expect(response.status).toBe(200)
    expect((await response.json()).result.data[0].type).toBe('')
  })
  it('rejects a current_dir outside 0-360 as malformed', async () => {
    const d = marineDeps(); d.fetch.mockResolvedValue(Response.json({ result: { data: [{ current_speed: '10', current_dir: '400', obs_date: '2026-09-16 12:00:00', type: '' }], meta: { sch_Stime: '2026-09-16 12:00', sch_Etime: '2026-09-16 13:00', lat: '35', lon: '129' } } }))
    expect((await handleRequest(makeMarine(), marineEnv, d)).status).toBe(502)
  })
  it('the fishing-index route keeps its strict JSON Content-Type gate unchanged', async () => {
    const d = deps(); d.fetch.mockResolvedValue(Response.json(body, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } }))
    expect((await handleRequest(make(), env, d)).status).toBe(502)
  })
  it('rejects foreign origin for the marine route too', async () => {
    expect((await handleRequest(makeMarine(marineQuery, 'https://evil.example'), marineEnv, marineDeps())).status).toBe(403)
  })
  it('/health reports marineReady additively without changing the existing ready field', async () => {
    const withoutMarine = await handleRequest(new Request('https://worker.example/health', { headers: { Origin: 'https://dagara0718.github.io' } }), env, marineDeps())
    expect(await withoutMarine.json()).toMatchObject({ ready: true, marineReady: false })
    const withMarine = await handleRequest(new Request('https://worker.example/health', { headers: { Origin: 'https://dagara0718.github.io' } }), marineEnv, marineDeps())
    expect(await withMarine.json()).toMatchObject({ ready: true, marineReady: true })
  })
})
