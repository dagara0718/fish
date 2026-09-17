import { describe, expect, it, vi } from 'vitest'
import { handleRequest } from '../src/index'

const marineKey = 'marine-proxy-test-only-secret'
const env = { KHOA_MARINE_SERVICE_KEY: marineKey }
const marineQuery = 'SDate=20260917&SHour=12&SMinute=00&EDate=20260917&EHour=13&EMinute=00&lat=36&lon=126.5&ResultType=json'
const row = (overrides = {}) => ({ current_speed: '28.0', current_dir: '240', obs_date: '2026-09-17 12:00:00', type: '', ...overrides })
const marineBody = { result: { data: [row()], meta: { sch_Stime: '2026-09-17 12:00', sch_Etime: '2026-09-17 13:00', lat: '36', lon: '126.5' } } }
const make = (query = marineQuery, origin = 'https://dagara0718.github.io', path = '/api/marine-current') => new Request(`https://marine-proxy.example${path}?${query}`, { headers: { Origin: origin } })
const deps = () => ({ fetch: vi.fn<typeof fetch>().mockResolvedValue(Response.json(marineBody)), now: () => new Date('2026-09-17T00:00:00Z') })

describe('marine-proxy security boundary', () => {
  it('uses the fixed KHOA upstream, rounds coordinates, and never leaks the secret', async () => {
    const d = deps()
    const response = await handleRequest(make(), env, d)
    expect(response.status).toBe(200)
    const url = new URL(String(d.fetch.mock.calls[0]![0]))
    expect(url.origin + url.pathname).toBe('https://khoa.go.kr/oceandata/api/tidalCurrentPoint/search.do')
    expect(url.searchParams.get('ServiceKey')).toBe(marineKey)
    expect(await response.text()).not.toContain(marineKey)
  })
  it('rejects foreign origin with 403', async () => {
    expect((await handleRequest(make(marineQuery, 'https://evil.example'), env, deps())).status).toBe(403)
  })
  it('answers OPTIONS with 204 and CORS headers, and rejects non-GET with 405', async () => {
    const options = await handleRequest(new Request('https://marine-proxy.example/api/marine-current', { method: 'OPTIONS', headers: { Origin: 'https://dagara0718.github.io' } }), env, deps())
    expect(options.status).toBe(204)
    expect(options.headers.get('Access-Control-Allow-Origin')).toBe('https://dagara0718.github.io')
    const post = await handleRequest(new Request(`https://marine-proxy.example/api/marine-current?${marineQuery}`, { method: 'POST', headers: { Origin: 'https://dagara0718.github.io' } }), env, deps())
    expect(post.status).toBe(405)
  })
  it('returns NOT_CONFIGURED (503) when KHOA_MARINE_SERVICE_KEY is unset — never fabricates one', async () => {
    expect((await handleRequest(make(), {}, deps())).status).toBe(503)
  })
  it.each([
    'SDate=bad&SHour=12&SMinute=00&EDate=20260917&EHour=13&EMinute=00&lat=36&lon=126.5',
    'SDate=20260917&SHour=24&SMinute=00&EDate=20260917&EHour=13&EMinute=00&lat=36&lon=126.5',
    'SDate=20260917&SHour=12&SMinute=60&EDate=20260917&EHour=13&EMinute=00&lat=36&lon=126.5',
    'SDate=20260917&SHour=12&SMinute=00&EDate=20260917&EHour=13&EMinute=00&lat=91&lon=126.5',
    'SDate=20260917&SHour=12&SMinute=00&EDate=20260917&EHour=13&EMinute=00&lat=36&lon=181',
    'SDate=20260917&SHour=12&SMinute=00&EDate=20260917&EHour=13&EMinute=00&lat=36&lon=126.5&ResultType=xml',
    'SDate=20260917&SHour=12&SMinute=00&EDate=20260917&EHour=13&EMinute=00&lat=36&lon=126.5&extra=1',
    'SDate=20260917&SHour=12&SMinute=00&EDate=20260917&EHour=13&EMinute=00&lat=36&lon=126.5&lat=37',
  ])('rejects invalid/duplicate/unknown params: %s', async query => {
    const d = deps()
    expect((await handleRequest(make(query), env, d)).status).toBe(400)
    expect(d.fetch).not.toHaveBeenCalled()
  })
  it('normalizes lat/lon to 3 decimal places before the upstream request', async () => {
    const d = deps()
    await handleRequest(make('SDate=20260917&SHour=12&SMinute=00&EDate=20260917&EHour=13&EMinute=00&lat=36.123456&lon=126.654321&ResultType=json'), env, d)
    const url = new URL(String(d.fetch.mock.calls[0]![0]))
    expect(url.searchParams.get('lat')).toBe('36.123'); expect(url.searchParams.get('lon')).toBe('126.654')
  })
  it('accepts a KHOA response with text/html Content-Type when the body is valid JSON matching the schema', async () => {
    const d = deps(); d.fetch.mockResolvedValue(new Response(JSON.stringify(marineBody), { headers: { 'Content-Type': 'text/html;charset=UTF-8' } }))
    const response = await handleRequest(make(), env, d)
    expect(response.status).toBe(200)
    const parsed = await response.json()
    expect(parsed.result.data[0]).toMatchObject({ current_speed: 28, current_dir: 240, obs_date: '2026-09-17 12:00:00', type: '' })
  })
  it('fails closed on an actual HTML error page even at HTTP 200', async () => {
    const d = deps(); d.fetch.mockResolvedValue(new Response('<html>error</html>', { headers: { 'Content-Type': 'text/html;charset=UTF-8' } }))
    expect((await handleRequest(make(), env, d)).status).toBe(502)
  })
  it('fails closed on malformed JSON', async () => {
    const d = deps(); d.fetch.mockResolvedValue(new Response('{not json', { headers: { 'Content-Type': 'application/json' } }))
    expect((await handleRequest(make(), env, d)).status).toBe(502)
  })
  it('fails closed on well-formed JSON that does not match the marine schema', async () => {
    const d = deps(); d.fetch.mockResolvedValue(Response.json({ unrelated: true }))
    expect((await handleRequest(make(), env, d)).status).toBe(502)
  })
  it('rejects a current_dir outside 0-360', async () => {
    const d = deps(); d.fetch.mockResolvedValue(Response.json({ result: { data: [row({ current_dir: '400' })], meta: marineBody.result.meta } }))
    expect((await handleRequest(make(), env, d)).status).toBe(502)
  })
  it('accepts an empty type string as valid (confirmed present in the real KHOA response)', async () => {
    const d = deps()
    const response = await handleRequest(make(), env, d)
    expect((await response.json()).result.data[0].type).toBe('')
  })
  it('classifies an upstream 5xx and redacts the secret from the error body', async () => {
    const d = deps(); d.fetch.mockResolvedValue(new Response(marineKey, { status: 500 }))
    const result = await handleRequest(make(), env, d)
    expect(result.status).toBe(502); expect(await result.text()).not.toContain(marineKey)
  })
  it('does not retry on failure (single upstream attempt — client owns retry)', async () => {
    const d = deps(); d.fetch.mockResolvedValue(new Response(null, { status: 500 }))
    await handleRequest(make(), env, d)
    expect(d.fetch).toHaveBeenCalledTimes(1)
  })
  it('times out without exposing the upstream URL', async () => {
    vi.useFakeTimers()
    try {
      const d = deps(); d.fetch.mockImplementation((_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error(marineKey)))))
      const pending = handleRequest(make(), env, d); await vi.advanceTimersByTimeAsync(10001)
      const result = await pending; expect(result.status).toBe(504); expect(await result.text()).not.toContain(marineKey)
    } finally { vi.useRealTimers() }
  })
  it('/api/health reports marineReady without ever exposing the secret value', async () => {
    const response = await handleRequest(new Request('https://marine-proxy.example/api/health', { headers: { Origin: 'https://dagara0718.github.io' } }), env, deps())
    expect(await response.json()).toEqual({ ready: true, marineReady: true })
  })
  it('does not lose the `this` receiver on the default-dependency fetch path (Illegal invocation regression)', async () => {
    const stub = vi.fn(function (this: unknown) {
      if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation')
      return Response.json(marineBody)
    })
    vi.stubGlobal('fetch', stub)
    try {
      const response = await handleRequest(make(), env)
      expect(response.status).toBe(200)
      expect(stub).toHaveBeenCalled()
    } finally { vi.unstubAllGlobals() }
  })
})
