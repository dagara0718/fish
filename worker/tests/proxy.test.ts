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
