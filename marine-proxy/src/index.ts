// Explicit .js specifiers: Vercel's Node.js ESM runtime does not rewrite extensionless relative
// imports the way a bundler would, so `./foo` (no extension) fails at runtime with
// ERR_MODULE_NOT_FOUND even though it resolves fine under `moduleResolution: bundler` at typecheck
// time (v1.6.2 VERCEL_ESM_MODULE_RESOLUTION). TypeScript with `bundler` resolution accepts a `.js`
// specifier pointing at a `.ts` source file, so this is typecheck-safe.
import { MARINE_PARAMS, isNoSearchData, validCoordinate, validDate, validHour, validMinute, validRange, validateMarineResponse } from '../shared/marine-response.js'

// v1.6.2 PoC: an alternate server-side path for /api/marine-current, deployed outside Cloudflare
// Workers' global edge (see specs/001-point-decision-brief/v1.6.2-result.md for why). Deliberately
// scoped to marine-current only — fishing-index stays on the existing Cloudflare Worker.
export interface Env { KHOA_MARINE_SERVICE_KEY?: string }
export interface Dependencies { fetch: typeof fetch; now: () => Date }

// Fixed upstream — never derived from request input (SSRF guard, v1.6.2 §36).
const marineUpstream = 'https://khoa.go.kr/oceandata/api/tidalCurrentPoint/search.do'
const origins = new Set(['https://dagara0718.github.io', 'http://localhost:5173', 'http://127.0.0.1:5173'])
const boundFetch: typeof fetch = (input, init) => globalThis.fetch(input, init)

async function handleMarineCurrent(url: URL, env: Env, reply: (status: number, body: unknown) => Response, deps: Dependencies): Promise<Response> {
  for (const key of url.searchParams.keys()) if (!MARINE_PARAMS.has(key) || url.searchParams.getAll(key).length !== 1) return reply(400, { error: 'INVALID_PARAMETERS' })
  const sdate = url.searchParams.get('SDate'); const edate = url.searchParams.get('EDate')
  const resultType = url.searchParams.get('ResultType') ?? 'json'
  if (!validDate(sdate ?? '') || !validDate(edate ?? '') || !validHour(url.searchParams.get('SHour')) || !validMinute(url.searchParams.get('SMinute')) || !validHour(url.searchParams.get('EHour')) || !validMinute(url.searchParams.get('EMinute')) || !validCoordinate(url.searchParams.get('lat'), 90) || !validCoordinate(url.searchParams.get('lon'), 180) || resultType !== 'json') return reply(400, { error: 'INVALID_PARAMETERS' })
  // An end-before-start window makes KHOA answer 'No search data' too, which would then be misread as
  // "no data at this location" below — so it is rejected here, before any upstream call.
  if (!validRange(sdate!, url.searchParams.get('SHour')!, url.searchParams.get('SMinute')!, edate!, url.searchParams.get('EHour')!, url.searchParams.get('EMinute')!)) return reply(400, { error: 'INVALID_PARAMETERS' })
  const secret = env.KHOA_MARINE_SERVICE_KEY?.trim()
  if (!secret) return reply(503, { error: 'NOT_CONFIGURED' })
  // Round to 3dp server-side too — never the literal exact-GPS value in the upstream request or any
  // log (v1.6/v1.6.2 GPS-minimization rule). No server-side cache this PoC (POC_NO_SERVER_CACHE,
  // see v1.6.2-result.md) — the point here is proving the network path, not caching behavior.
  const lat = Number(url.searchParams.get('lat')).toFixed(3)
  const lon = Number(url.searchParams.get('lon')).toFixed(3)
  const remote = new URL(marineUpstream)
  for (const [key, value] of url.searchParams) remote.searchParams.set(key, value)
  remote.searchParams.set('lat', lat); remote.searchParams.set('lon', lon)
  remote.searchParams.set('ResultType', 'json')
  remote.searchParams.set('ServiceKey', secret)
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const started = deps.now().getTime()
    // No retry here (v1.6.2 §19) — the frontend's own fetchWithRetry already owns retry; a second
    // retrying layer would multiply attempts against KHOA.
    const response = await deps.fetch(remote, { signal: controller.signal, redirect: 'manual', headers: { Accept: 'application/json' } })
    const elapsedMs = deps.now().getTime() - started
    if (!response.ok) {
      const httpClass = response.status === 429 ? 'UPSTREAM_429' : response.status >= 500 ? 'UPSTREAM_5XX' : 'UPSTREAM_ERROR'
      // Safe diagnostics only — no secret, no raw GPS, no upstream body.
      console.error('upstream_failure', JSON.stringify({
        host: remote.host, httpClass, upstreamStatus: response.status, elapsedMs,
        server: response.headers.get('Server'), contentType: response.headers.get('Content-Type'), date: response.headers.get('Date'),
      }))
      return reply(502, { error: 'UPSTREAM_ERROR', httpClass })
    }
    const body = await response.text()
    if (body.length > 2_000_000) return reply(502, { error: 'MALFORMED_RESPONSE' })
    // Valid window (checked above) + KHOA's exact 'No search data' = no prediction point at this
    // location. A distinct 422 so the client can show "unsupported area" instead of a generic failure.
    if (isNoSearchData(body)) return reply(422, { error: 'NO_DATA_FOR_LOCATION' })
    let parsed: unknown
    try { parsed = validateMarineResponse(body) } catch { return reply(502, { error: 'MALFORMED_RESPONSE' }) }
    const serialized = JSON.stringify(parsed)
    if (serialized.includes(secret) || serialized.includes(encodeURIComponent(secret))) return reply(502, { error: 'MALFORMED_RESPONSE' })
    return reply(200, parsed)
  } catch {
    return reply(controller.signal.aborted ? 504 : 502, { error: controller.signal.aborted ? 'TIMEOUT' : 'MALFORMED_RESPONSE' })
  } finally { clearTimeout(timer) }
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
  if (url.pathname === '/api/health') return reply(200, { ready: true, marineReady: Boolean(env.KHOA_MARINE_SERVICE_KEY) })
  if (url.pathname === '/api/marine-current') return handleMarineCurrent(url, env, reply, deps)
  return reply(404, { error: 'NOT_FOUND' })
}
