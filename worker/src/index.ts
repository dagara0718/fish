import { parseOfficialResponse, validDate } from '../../shared/fishing-api'

interface RateLimiter { limit(input: { key: string }): Promise<{ success: boolean }> }
export interface Env { KHOA_FISHING_SERVICE_KEY?: string; REQUEST_LIMITER?: RateLimiter }
export interface Dependencies { fetch: typeof fetch; cache?: Pick<Cache, 'match' | 'put'>; now: () => Date }
const upstream = 'https://apis.data.go.kr/1192136/fcstFishingv2/GetFcstFishingApiServicev2'
const origins = new Set(['https://dagara0718.github.io', 'http://localhost:5173', 'http://127.0.0.1:5173'])
const params = new Set(['gubun', 'reqDate', 'placeName', 'pageNo', 'numOfRows'])

// Bound wrapper: a bare `fetch` reference loses its receiver when called as deps.fetch(...) and
// throws "Illegal invocation" in the Workers runtime (same class of bug fixed in the frontend
// LiveOfficialFishingIndexProvider).
const boundFetch: typeof fetch = (input, init) => globalThis.fetch(input, init)
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
  if (url.pathname === '/health') return reply(env.KHOA_FISHING_SERVICE_KEY && env.REQUEST_LIMITER ? 200 : 503, { ready: Boolean(env.KHOA_FISHING_SERVICE_KEY && env.REQUEST_LIMITER) })
  if (url.pathname !== '/api/fishing-index') return reply(404, { error: 'NOT_FOUND' })
  for (const key of url.searchParams.keys()) if (!params.has(key) || url.searchParams.getAll(key).length !== 1) return reply(400, { error: 'INVALID_PARAMETERS' })
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
  const cacheKey = new Request(url.toString())
  const cached = await deps.cache?.match(cacheKey).catch(() => undefined)
  if (cached) return new Response(await cached.text(), { headers })
  const remote = new URL(upstream)
  remote.searchParams.set('type', 'json')
  for (const [key, value] of url.searchParams) remote.searchParams.set(key, value)
  // The decoded general key is passed once through URLSearchParams. No manual encoding.
  remote.searchParams.set('serviceKey', secret)
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    // Workers' fetch only supports redirect 'follow'|'manual' ('error' throws a TypeError at the
    // edge). 'manual' returns the 3xx as-is, which the response.ok check below already rejects.
    const response = await deps.fetch(remote, { signal: controller.signal, redirect: 'manual', headers: { Accept: 'application/json' } })
    if (!response.ok) {
      // httpClass lets the client distinguish a KHOA rate limit from a general 5xx without guessing
      // from the bare status (v1.5 REQ-NFR-OBSERVABILITY-001). Additive: `error` is unchanged.
      const httpClass = response.status === 429 ? 'UPSTREAM_429' : response.status >= 500 ? 'UPSTREAM_5XX' : 'UPSTREAM_ERROR'
      console.error('khoa_upstream_failure', JSON.stringify({ httpClass, upstreamStatus: response.status }))
      return reply(502, { error: 'UPSTREAM_ERROR', httpClass })
    }
    if (!response.headers.get('Content-Type')?.toLowerCase().includes('application/json')) return reply(502, { error: 'MALFORMED_RESPONSE' })
    const body = await response.text()
    if (body.length > 2_000_000) return reply(502, { error: 'MALFORMED_RESPONSE' })
    const data = parseOfficialResponse(JSON.parse(body), deps.now().toISOString())
    const serialized = JSON.stringify(data)
    if (serialized.includes(secret) || serialized.includes(encodeURIComponent(secret))) return reply(502, { error: 'MALFORMED_RESPONSE' })
    await deps.cache?.put(cacheKey, new Response(serialized, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' } })).catch(() => undefined)
    return reply(200, data)
  } catch (error) {
    return reply(controller.signal.aborted ? 504 : 502, { error: controller.signal.aborted ? 'TIMEOUT' : error instanceof Error && error.message === 'UPSTREAM_ERROR' ? 'UPSTREAM_ERROR' : 'MALFORMED_RESPONSE' })
  } finally { clearTimeout(timer) }
}

export default { fetch(request: Request, env: Env) {
  const storage = caches as CacheStorage & { default: Cache }
  return handleRequest(request, env, { fetch: boundFetch, cache: storage.default, now: () => new Date() })
} }
