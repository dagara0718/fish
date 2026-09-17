import { parseOfficialResponse, validDate } from '../../shared/fishing-api'

interface RateLimiter { limit(input: { key: string }): Promise<{ success: boolean }> }
export interface Env { KHOA_FISHING_SERVICE_KEY?: string; KHOA_MARINE_SERVICE_KEY?: string; REQUEST_LIMITER?: RateLimiter }
export interface Dependencies { fetch: typeof fetch; cache?: Pick<Cache, 'match' | 'put'>; now: () => Date }
const fishingUpstream = 'https://apis.data.go.kr/1192136/fcstFishingv2/GetFcstFishingApiServicev2'
// Verified 2026-09-17 against KHOA's own 바다누리 portal — see
// specs/001-point-decision-brief/research/marine-current-source-review.md. A separate credential
// system from the public-data-portal general service key used above.
const marineUpstream = 'https://khoa.go.kr/oceandata/api/tidalCurrentPoint/search.do'
const origins = new Set(['https://dagara0718.github.io', 'http://localhost:5173', 'http://127.0.0.1:5173'])
const fishingParams = new Set(['gubun', 'reqDate', 'placeName', 'pageNo', 'numOfRows'])
const marineParams = new Set(['SDate', 'SHour', 'SMinute', 'EDate', 'EHour', 'EMinute', 'lat', 'lon', 'ResultType'])

// Bound wrapper: a bare `fetch` reference loses its receiver when called as deps.fetch(...) and
// throws "Illegal invocation" in the Workers runtime (same class of bug fixed in the frontend
// LiveOfficialFishingIndexProvider).
const boundFetch: typeof fetch = (input, init) => globalThis.fetch(input, init)

function validHour(value: string | null) { return value !== null && /^\d{2}$/.test(value) && +value <= 23 }
function validMinute(value: string | null) { return value !== null && /^\d{2}$/.test(value) && +value <= 59 }
function validCoordinate(value: string | null, max: number) { if (value === null) return false; const n = Number(value); return Number.isFinite(n) && Math.abs(n) <= max }

async function proxyUpstream(remote: URL, deps: Dependencies, reply: (status: number, body: unknown) => Response, cacheKey: Request | undefined, cacheTtlSeconds: number, redact: (text: string) => boolean, malformedCheck: (body: string) => unknown): Promise<Response> {
  const cached = cacheKey ? await deps.cache?.match(cacheKey).catch(() => undefined) : undefined
  if (cached) return new Response(await cached.text(), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } })
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    // Workers' fetch only supports redirect 'follow'|'manual' ('error' throws a TypeError at the
    // edge). 'manual' returns the 3xx as-is, which the response.ok check below already rejects.
    const response = await deps.fetch(remote, { signal: controller.signal, redirect: 'manual', headers: { Accept: 'application/json' } })
    if (!response.ok) {
      const httpClass = response.status === 429 ? 'UPSTREAM_429' : response.status >= 500 ? 'UPSTREAM_5XX' : 'UPSTREAM_ERROR'
      console.error('upstream_failure', JSON.stringify({ host: remote.host, httpClass, upstreamStatus: response.status }))
      return reply(502, { error: 'UPSTREAM_ERROR', httpClass })
    }
    if (!response.headers.get('Content-Type')?.toLowerCase().includes('json')) return reply(502, { error: 'MALFORMED_RESPONSE' })
    const body = await response.text()
    if (body.length > 2_000_000) return reply(502, { error: 'MALFORMED_RESPONSE' })
    let parsed: unknown
    try { parsed = malformedCheck(body) } catch { return reply(502, { error: 'MALFORMED_RESPONSE' }) }
    const serialized = JSON.stringify(parsed)
    if (redact(serialized)) return reply(502, { error: 'MALFORMED_RESPONSE' })
    if (cacheKey) await deps.cache?.put(cacheKey, new Response(serialized, { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${cacheTtlSeconds}` } })).catch(() => undefined)
    return reply(200, parsed)
  } catch (error) {
    return reply(controller.signal.aborted ? 504 : 502, { error: controller.signal.aborted ? 'TIMEOUT' : error instanceof Error && error.message === 'UPSTREAM_ERROR' ? 'UPSTREAM_ERROR' : 'MALFORMED_RESPONSE' })
  } finally { clearTimeout(timer) }
}

async function handleFishingIndex(url: URL, env: Env, deps: Dependencies, reply: (status: number, body: unknown) => Response): Promise<Response> {
  for (const key of url.searchParams.keys()) if (!fishingParams.has(key) || url.searchParams.getAll(key).length !== 1) return reply(400, { error: 'INVALID_PARAMETERS' })
  const gubun = url.searchParams.get('gubun')
  const date = url.searchParams.get('reqDate')
  const name = url.searchParams.get('placeName')
  const page = url.searchParams.get('pageNo') ?? '1'; const count = url.searchParams.get('numOfRows') ?? '300'
  if (!['갯바위', '선상'].includes(gubun ?? '') || (date !== null && !validDate(date)) || (name !== null && (!name.trim() || name.length > 80 || [...name].some(character => character.charCodeAt(0) < 32))) || !/^\d+$/.test(page) || +page < 1 || +page > 20 || !/^\d+$/.test(count) || +count < 1 || +count > 300) return reply(400, { error: 'INVALID_PARAMETERS' })
  const secret = env.KHOA_FISHING_SERVICE_KEY?.trim()
  if (!secret || !env.REQUEST_LIMITER) return reply(503, { error: 'NOT_CONFIGURED' })
  try {
    const quota = await env.REQUEST_LIMITER.limit({ key: 'official-upstream-global' })
    if (!quota.success) return reply(429, { error: 'RATE_LIMITED' })
  } catch { return reply(503, { error: 'QUOTA_UNAVAILABLE' }) }
  // Cache URL is canonical and contains only public parameters, never the upstream credential.
  url.searchParams.set('pageNo', String(+page)); url.searchParams.set('numOfRows', String(+count)); url.searchParams.sort()
  const remote = new URL(fishingUpstream)
  remote.searchParams.set('type', 'json')
  for (const [key, value] of url.searchParams) remote.searchParams.set(key, value)
  // The decoded general key is passed once through URLSearchParams. No manual encoding.
  remote.searchParams.set('serviceKey', secret)
  return proxyUpstream(remote, deps, reply, new Request(url.toString()), 300,
    text => text.includes(secret) || text.includes(encodeURIComponent(secret)),
    body => parseOfficialResponse(JSON.parse(body), deps.now().toISOString()))
}

async function handleMarineCurrent(url: URL, env: Env, reply: (status: number, body: unknown) => Response, deps: Dependencies): Promise<Response> {
  for (const key of url.searchParams.keys()) if (!marineParams.has(key) || url.searchParams.getAll(key).length !== 1) return reply(400, { error: 'INVALID_PARAMETERS' })
  const sdate = url.searchParams.get('SDate'); const edate = url.searchParams.get('EDate')
  const resultType = url.searchParams.get('ResultType') ?? 'json'
  if (!validDate(sdate ?? '') || !validDate(edate ?? '') || !validHour(url.searchParams.get('SHour')) || !validMinute(url.searchParams.get('SMinute')) || !validHour(url.searchParams.get('EHour')) || !validMinute(url.searchParams.get('EMinute')) || !validCoordinate(url.searchParams.get('lat'), 90) || !validCoordinate(url.searchParams.get('lon'), 180) || resultType !== 'json') return reply(400, { error: 'INVALID_PARAMETERS' })
  const secret = env.KHOA_MARINE_SERVICE_KEY?.trim()
  if (!secret) return reply(503, { error: 'NOT_CONFIGURED' })
  // Round to 3dp server-side too (defense in depth) — never the literal exact-GPS value in the
  // cache key, well inside KHOA's own 1km nearest-point tolerance (v1.6 REQ-NFR-MARINE-002).
  const lat = Number(url.searchParams.get('lat')).toFixed(3)
  const lon = Number(url.searchParams.get('lon')).toFixed(3)
  const cacheParams = new URLSearchParams(url.search); cacheParams.set('lat', lat); cacheParams.set('lon', lon); cacheParams.sort()
  const cacheKey = new Request(`https://cache.internal/api/marine-current?${cacheParams.toString()}`)
  const remote = new URL(marineUpstream)
  for (const [key, value] of url.searchParams) remote.searchParams.set(key, value)
  remote.searchParams.set('lat', lat); remote.searchParams.set('lon', lon)
  remote.searchParams.set('ServiceKey', secret)
  // KHOA's own stated resolution is 10-minute — the cache window matches it rather than reusing the
  // fishing-index route's unrelated 5-minute value (v1.6 REQ-NFR-MARINE-003).
  return proxyUpstream(remote, deps, reply, cacheKey, 600,
    text => text.includes(secret) || text.includes(encodeURIComponent(secret)),
    body => JSON.parse(body))
}

export async function handleRequest(request: Request, env: Env, deps: Dependencies = { fetch: boundFetch, now: () => new Date() }): Promise<Response> {
  const origin = request.headers.get('Origin') ?? ''
  const headers: Record<string, string> = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Origin', 'X-Content-Type-Options': 'nosniff' }
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers })
  if (!origins.has(origin)) return reply(403, { error: 'ORIGIN_REJECTED' })
  headers['Access-Control-Allow-Origin'] = origin
  headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (request.method !== 'GET') return reply(405, { error: 'METHOD_NOT_ALLOWED' })
  const url = new URL(request.url)
  if (url.pathname === '/health') return reply(env.KHOA_FISHING_SERVICE_KEY && env.REQUEST_LIMITER ? 200 : 503, { ready: Boolean(env.KHOA_FISHING_SERVICE_KEY && env.REQUEST_LIMITER), marineReady: Boolean(env.KHOA_MARINE_SERVICE_KEY) })
  if (url.pathname === '/api/fishing-index') return handleFishingIndex(url, env, deps, reply)
  if (url.pathname === '/api/marine-current') return handleMarineCurrent(url, env, reply, deps)
  return reply(404, { error: 'NOT_FOUND' })
}

export default { fetch(request: Request, env: Env) {
  const storage = caches as CacheStorage & { default: Cache }
  return handleRequest(request, env, { fetch: boundFetch, cache: storage.default, now: () => new Date() })
} }
