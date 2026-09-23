import { fetchWithRetry } from '../official-index/live-provider'
import type { MarineCurrentObservation, MarineCurrentProvider, MarineCurrentQuery, MarineCurrentResult, CurrentType } from './contracts'

// Sourced from the verified KHOA contract (research/marine-current-source-review.md, 2026-09-17):
// GET https://khoa.go.kr/oceandata/api/tidalCurrentPoint/search.do
// Response shape: { result: { data: [{ current_speed, obs_date, type, current_dir }], meta: {...} } }
const CURRENT_TYPE: Record<string, CurrentType> = { '전류': 'SLACK', '최강창조류': 'PEAK_FLOOD', '최강낙조류': 'PEAK_EBB' }
const SPATIAL_REFERENCE = '선택 위치에서 가장 가까운 지점(최대 1km) 기준'
const SOURCE_NAME = '국립해양조사원 · 수치조류도(예측)'

// The proxy's validator re-emits speed/direction as numbers (live rows, 2026-09-24); KHOA's own sample
// shows strings. Both are accepted.
interface RawTidalCurrentRow { current_speed?: string | number; current_dir?: string | number; obs_date?: string; type?: string }
interface RawTidalCurrentResponse { result?: { data?: RawTidalCurrentRow[] } }

export function normalizeTidalCurrent(raw: unknown, retrievedAt: string): MarineCurrentResult {
  const body = raw as RawTidalCurrentResponse
  const rows = body?.result?.data
  if (!Array.isArray(rows)) return { status: 'UNAVAILABLE', observations: [], reason: '공식 응답 형식을 확인할 수 없습니다.' }
  if (rows.length === 0) return { status: 'UNAVAILABLE', observations: [], reason: '이 위치의 조류 데이터를 확인하지 못했습니다.' }
  const observations: MarineCurrentObservation[] = []
  let malformedCount = 0
  for (const row of rows) {
    // A non-empty type outside the three documented labels is schema drift, not a valid
    // "unlabeled" row — still discarded as malformed. An empty string (confirmed present on real
    // production rows, 2026-09-18 live verification) or a missing field means KHOA did not label
    // this observation's tidal phase; currentType stays undefined, never a guess.
    if (row.type && row.type !== '' && !CURRENT_TYPE[row.type]) { malformedCount++; continue }
    if (!row.obs_date) { malformedCount++; continue }
    const currentType = row.type ? CURRENT_TYPE[row.type] : undefined
    const speed = row.current_speed !== undefined && row.current_speed !== '' ? Number(row.current_speed) : undefined
    const direction = row.current_dir !== undefined && row.current_dir !== '' ? Number(row.current_dir) : undefined
    observations.push({
      sourceType: 'TIDAL_CURRENT', sourceName: SOURCE_NAME,
      // Filled in by the caller (getCurrentObservations) from the request, since KHOA only echoes
      // the requested coordinate, never the matched station's own — see contracts.ts spatialReference.
      latitude: 0, longitude: 0,
      ...(currentType ? { currentType } : {}),
      ...(speed !== undefined && Number.isFinite(speed) ? { speed, speedUnit: 'cm/s' as const } : {}),
      ...(direction !== undefined && Number.isFinite(direction) ? { direction, directionUnit: 'deg' as const } : {}),
      directionConvention: 'UNKNOWN',
      observationType: 'FORECAST', // KHOA's own description: "예측 유향,유속"
      spatialReference: SPATIAL_REFERENCE,
      forecastAt: row.obs_date,
      timeBasis: 'UNCONFIRMED',
      sourceTimestamp: retrievedAt,
      trustStatus: 'UNVERIFIED',
    })
  }
  if (observations.length === 0) return { status: 'UNAVAILABLE', observations: [], reason: '공식 응답 형식을 확인할 수 없습니다.' }
  return { status: malformedCount > 0 ? 'PARTIAL' : 'SUCCESS', observations }
}

const pad = (n: number) => String(n).padStart(2, '0')
// Wall-clock fields of `d` read in UTC. Paired with a +9h shift this yields the Asia/Seoul wall clock
// (Korea has had no DST since 1988, so the offset is fixed).
const wall = (d: Date) => ({ date: `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`, hour: pad(d.getUTCHours()), minute: pad(d.getUTCMinutes()) })
const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const MARGIN_MS = 30 * 60 * 1000

// v1.6.3 time-basis TBD: neither KHOA's own API page (openApiDetail.do?id=18, re-checked 2026-09-24)
// nor the data.go.kr listing (15039013) states whether SDate/SHour/SMinute and obs_date are KST or
// UTC, and a 200 response cannot settle it (a forecast service answers any window). So no single
// basis is assumed: the window starts 30min before "now" read as a UTC wall clock and ends 30min
// after "now" read as a KST wall clock. Under either reading the real present lies inside it, but no
// returned row is identified as "now" — every row stays timeBasis: 'UNCONFIRMED'.
export function requestWindow(at: Date) {
  const start = wall(new Date(at.getTime() - MARGIN_MS))
  const end = wall(new Date(at.getTime() + KST_OFFSET_MS + MARGIN_MS))
  return { SDate: start.date, SHour: start.hour, SMinute: start.minute, EDate: end.date, EHour: end.hour, EMinute: end.minute }
}

export class KhoaTidalCurrentProvider implements MarineCurrentProvider {
  constructor(
    private baseUrl: string,
    private request: typeof fetch = (input, init) => globalThis.fetch(input, init),
    private sleep: (ms: number) => Promise<void> = (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  ) {}

  async getCurrentObservations(query: MarineCurrentQuery, signal?: AbortSignal): Promise<MarineCurrentResult> {
    // An unset/invalid base URL is a configuration state, not an exception: the UI shows
    // "not configured" instead of silently hiding the panel (v1.6.3 REQ-FUNC-MARINE-UI-002).
    let base: URL
    try { base = new URL(this.baseUrl) } catch { return { status: 'NOT_CONNECTED', observations: [] } }
    if (base.username || base.password || base.search || base.hash || (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))) return { status: 'NOT_CONNECTED', observations: [] }
    const window = requestWindow(query.at ?? new Date())
    // Coordinates rounded to 3dp (~110m) — well inside KHOA's own 1km nearest-point tolerance, and
    // never the literal exact-GPS value in the request or (server-side) cache key (REQ-NFR-MARINE-002).
    const lat = query.latitude.toFixed(3)
    const lon = query.longitude.toFixed(3)
    const url = new URL('/api/marine-current', base)
    url.search = new URLSearchParams({ ...window, lat, lon, ResultType: 'json' }).toString()
    // The shared retry helper treats 503 as retryable (matches fishing-index's transient-upstream
    // semantics), but on this route a 503 means the Worker's own KHOA_MARINE_SERVICE_KEY is unset —
    // permanent from the client's view, not worth retrying. lastHttpClass lets us tell the two apart
    // after exhaustion without diverging the shared retry loop itself (v1.6 REQ-FUNC-MARINE-006).
    let lastHttpClass: string | undefined
    const response = await fetchWithRetry(
      this.request, url,
      () => { const timeout = AbortSignal.timeout(12000); return { signal: signal ? AbortSignal.any([signal, timeout]) : timeout, credentials: 'omit', referrerPolicy: 'no-referrer' } },
      signal, this.sleep,
      (_attempt, httpClass) => { lastHttpClass = httpClass },
    )
    // 422 = the proxy saw KHOA's own "No search data" for a valid window: no prediction point near this
    // location (marine-proxy/shared/marine-response.ts isNoSearchData). Fatal, so never retried.
    if (!response && lastHttpClass === '422') return { status: 'UNSUPPORTED_AREA', observations: [], reason: '제공기관이 이 위치(가장 가까운 예측 지점 최대 1km)의 조류 예측을 제공하지 않습니다.' }
    if (!response) return lastHttpClass === '503' ? { status: 'NOT_CONNECTED', observations: [] } : { status: 'UNAVAILABLE', observations: [], reason: '조류 예측 데이터를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.' }
    let body: unknown
    try { body = await response.json() } catch { return { status: 'UNAVAILABLE', observations: [], reason: '공식 응답 형식을 확인할 수 없습니다.' } }
    const result = normalizeTidalCurrent(body, new Date().toISOString())
    return { ...result, observations: result.observations.map(item => ({ ...item, latitude: query.latitude, longitude: query.longitude })) }
  }
}
