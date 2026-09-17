import { fetchWithRetry } from '../official-index/live-provider'
import type { MarineCurrentObservation, MarineCurrentProvider, MarineCurrentQuery, MarineCurrentResult, CurrentType } from './contracts'

// Sourced from the verified KHOA contract (research/marine-current-source-review.md, 2026-09-17):
// GET https://khoa.go.kr/oceandata/api/tidalCurrentPoint/search.do
// Response shape: { result: { data: [{ current_speed, obs_date, type, current_dir }], meta: {...} } }
const CURRENT_TYPE: Record<string, CurrentType> = { '전류': 'INSTANTANEOUS', '최강창조류': 'PEAK_FLOOD', '최강낙조류': 'PEAK_EBB' }
const SPATIAL_REFERENCE = '선택 위치에서 가장 가까운 지점(최대 1km) 기준'
const SOURCE_NAME = '국립해양조사원 · 수치조류도(예측)'

interface RawTidalCurrentRow { current_speed?: string; current_dir?: string; obs_date?: string; type?: string }
interface RawTidalCurrentResponse { result?: { data?: RawTidalCurrentRow[] } }

export function normalizeTidalCurrent(raw: unknown, retrievedAt: string): MarineCurrentResult {
  const body = raw as RawTidalCurrentResponse
  const rows = body?.result?.data
  if (!Array.isArray(rows)) return { status: 'UNAVAILABLE', observations: [], reason: '공식 응답 형식을 확인할 수 없습니다.' }
  if (rows.length === 0) return { status: 'UNAVAILABLE', observations: [], reason: '이 위치의 조류 데이터를 확인하지 못했습니다.' }
  const observations: MarineCurrentObservation[] = []
  let malformedCount = 0
  for (const row of rows) {
    const currentType = row.type ? CURRENT_TYPE[row.type] : undefined
    if (!currentType || !row.obs_date) { malformedCount++; continue }
    const speed = row.current_speed !== undefined && row.current_speed !== '' ? Number(row.current_speed) : undefined
    const direction = row.current_dir !== undefined && row.current_dir !== '' ? Number(row.current_dir) : undefined
    observations.push({
      sourceType: 'TIDAL_CURRENT', sourceName: SOURCE_NAME,
      // Filled in by the caller (getCurrentObservations) from the request, since KHOA only echoes
      // the requested coordinate, never the matched station's own — see contracts.ts spatialReference.
      latitude: 0, longitude: 0,
      currentType,
      ...(speed !== undefined && Number.isFinite(speed) ? { speed, speedUnit: 'cm/s' as const } : {}),
      ...(direction !== undefined && Number.isFinite(direction) ? { direction, directionUnit: 'deg' as const } : {}),
      directionConvention: 'UNKNOWN',
      observationType: 'FORECAST', // KHOA's own description: "예측 유향,유속"
      spatialReference: SPATIAL_REFERENCE,
      forecastAt: row.obs_date,
      sourceTimestamp: retrievedAt,
      trustStatus: 'UNVERIFIED',
    })
  }
  if (observations.length === 0) return { status: 'UNAVAILABLE', observations: [], reason: '공식 응답 형식을 확인할 수 없습니다.' }
  return { status: malformedCount > 0 ? 'PARTIAL' : 'SUCCESS', observations }
}

export class KhoaTidalCurrentProvider implements MarineCurrentProvider {
  constructor(
    private baseUrl: string,
    private request: typeof fetch = (input, init) => globalThis.fetch(input, init),
    private sleep: (ms: number) => Promise<void> = (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  ) {}

  async getCurrentObservations(query: MarineCurrentQuery, signal?: AbortSignal): Promise<MarineCurrentResult> {
    const base = new URL(this.baseUrl)
    if (base.username || base.password || base.search || base.hash || (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))) throw new Error('NOT_CONFIGURED')
    const at = query.at ?? new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const ymd = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`
    // A narrow ±30min window around `at` — this feature displays "current conditions", not a range.
    const start = new Date(at.getTime() - 30 * 60 * 1000)
    const end = new Date(at.getTime() + 30 * 60 * 1000)
    // Coordinates rounded to 3dp (~110m) — well inside KHOA's own 1km nearest-point tolerance, and
    // never the literal exact-GPS value in the request or (server-side) cache key (REQ-NFR-MARINE-002).
    const lat = query.latitude.toFixed(3)
    const lon = query.longitude.toFixed(3)
    const url = new URL('/api/marine-current', base)
    url.search = new URLSearchParams({
      SDate: ymd(start), SHour: pad(start.getUTCHours()), SMinute: pad(start.getUTCMinutes()),
      EDate: ymd(end), EHour: pad(end.getUTCHours()), EMinute: pad(end.getUTCMinutes()),
      lat, lon, ResultType: 'json',
    }).toString()
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
    if (!response) return lastHttpClass === '503' ? { status: 'NOT_CONNECTED', observations: [] } : { status: 'UNAVAILABLE', observations: [], reason: '조류 데이터를 확인하지 못했습니다. 다시 시도해 주세요.' }
    let body: unknown
    try { body = await response.json() } catch { return { status: 'UNAVAILABLE', observations: [], reason: '공식 응답 형식을 확인할 수 없습니다.' } }
    const result = normalizeTidalCurrent(body, new Date().toISOString())
    return { ...result, observations: result.observations.map(item => ({ ...item, latitude: query.latitude, longitude: query.longitude })) }
  }
}
