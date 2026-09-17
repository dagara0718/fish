import { parseEnvelope, type OfficialItem } from '../../shared/fishing-api'
import type { CatalogResult, EnvironmentalObservation, FishingType, OfficialFishingIndexProvider, OfficialFishingPointRef, OfficialIndexResult } from './contracts'
import type { TrustStatus } from '../domain/contracts'
import { computeEnvironmentGuidance } from '../species-guidance/environment-guidance-provider'

export function seoulDate(now = new Date()) { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(now).replaceAll('-', '') }
const source = '국립해양조사원 · 바다낚시지수'
function pointFrom(item: OfficialItem, fishingType: FishingType): OfficialFishingPointRef | undefined {
  if (!item.seafsPstnNm || item.lat === undefined || item.lot === undefined) return undefined
  const id = JSON.stringify([fishingType, item.seafsPstnNm, item.lat, item.lot])
  return { officialPointId: id, linkedPointId: id, placeName: item.seafsPstnNm, regionContext: '공식 기준 포인트', fishingType, latitude: item.lat, longitude: item.lot }
}
export function normalizeOfficial(items: OfficialItem[], point: OfficialFishingPointRef, today = seoulDate()): OfficialIndexResult {
  const records = items.filter(item => item.seafsPstnNm === point.placeName && item.lat === point.latitude && item.lot === point.longitude)
  if (!records.length) return { kind: 'UNSUPPORTED_POINT', reason: '공식 바다낚시지수 데이터가 없습니다.', demo: false }
  // predcYmd is normalized to YYYYMMDD by parseItem; reformat only for display.
  const formatDate = (ymd?: string) => ymd ? `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}` : '기준일 미확인'
  const time = (item: OfficialItem) => `${formatDate(item.predcYmd)} · ${item.predcNoonSeCd ?? '시간구분 미확인'}`
  const trust = (item: OfficialItem): TrustStatus => {
    const siblings = records.filter(other => other.seafsTgfshNm === item.seafsTgfshNm && other.predcYmd === item.predcYmd && other.predcNoonSeCd === item.predcNoonSeCd)
    if (siblings.some(other => JSON.stringify(other) !== JSON.stringify(item))) return 'CONFLICT'
    return item.predcYmd && item.predcYmd < today ? 'STALE' : 'UNVERIFIED'
  }
  const species = records.filter(item => item.seafsTgfshNm).map((item, index) => ({ assessmentType: 'OFFICIAL_FISHING_INDEX' as const, speciesId: `${point.officialPointId}:${index}`, speciesName: item.seafsTgfshNm!, officialGrade: item.totalIndex ?? '제공 없음', ...(item.lastScr === undefined ? {} : { officialScore: item.lastScr }), evaluatedAt: time(item), officialPointId: point.officialPointId, source, trustStatus: trust(item) }))
  const observations: EnvironmentalObservation[] = []
  for (const item of records) {
    const ranges = [['WATER_TEMPERATURE', '수온', item.minWtem, item.maxWtem], ['WAVE_HEIGHT', '파고', item.minWvhgt, item.maxWvhgt], ['CURRENT_SPEED', '유속', item.minCrsp, item.maxCrsp], ['WIND_SPEED', '풍속', item.minWspd, item.maxWspd]] as const
    for (const [metricType, label, min, max] of ranges) if (min !== undefined || max !== undefined) observations.push({ metricType, label, value: `${min ?? '미제공'} ~ ${max ?? '미제공'}`, unit: '단위 미확인', forecastAt: time(item), source, sourceTimestamp: time(item), trustStatus: trust(item) })
    if (item.tdlvHrCn) observations.push({ metricType: 'TIDE', label: '물때', value: item.tdlvHrCn, forecastAt: time(item), source, sourceTimestamp: time(item), trustStatus: trust(item) })
  }
  // lastScr is confirmed absent on real responses (2026-09-16 sample); it is not a SUCCESS requirement.
  const partial = records.some(item => !item.seafsTgfshNm || !item.totalIndex || !item.predcYmd || !item.predcNoonSeCd)
  // Guidance reads only raw environment fields on `records` — never `species`/officialGrade/officialScore.
  const guidance = computeEnvironmentGuidance(records, point, today)
  return { kind: records.every(item => trust(item) === 'STALE') ? 'STALE_CACHE' : partial ? 'PARTIAL' : 'SUCCESS', point, species, environment: { locationReference: point, evaluatedAt: time(records[0]!), observations: observations.filter((item, index, all) => all.findIndex(other => JSON.stringify(other) === JSON.stringify(item)) === index) }, demo: false, guidance }
}

// --- Retry/backoff (v1.5): a transient KHOA failure on one page must not discard the rest of an
// already-collected catalog. See v1.5-product-delta.md "Retry policy".
export type FailureClass = 'ABORT' | 'RETRY' | 'FATAL'
const RETRYABLE_STATUS = new Set([429, 500, 503, 504])
const MAX_ATTEMPTS = 3
const BACKOFF_MS = [250, 750]

export async function classifyFailure(response: Response | undefined, error: unknown, externalSignal: AbortSignal | undefined): Promise<FailureClass> {
  if (externalSignal?.aborted) return 'ABORT'
  if (!response) return 'RETRY' // network exception or internal timeout, not an external abort
  if (response.ok) return 'RETRY' // unreachable in practice; caller only classifies non-ok responses
  if (RETRYABLE_STATUS.has(response.status)) return 'RETRY'
  if (response.status === 502) {
    const body = await response.clone().json().catch(() => null) as { error?: string } | null
    // UPSTREAM_ERROR is KHOA-side transience; MALFORMED_RESPONSE is a parse failure retry can't fix.
    return body?.error === 'UPSTREAM_ERROR' ? 'RETRY' : 'FATAL'
  }
  return 'FATAL' // 400/401/403/404/405 and anything else — a config/request error, not transient
}

type LogEvent = 'catalog_fetch_started' | 'catalog_page_retry' | 'catalog_partial' | 'catalog_stale_fallback' | 'catalog_complete'
// No secret, no raw response body, no GPS — only these named fields (v1.5 REQ-NFR-OBSERVABILITY-001).
function log(event: LogEvent, fields: { fishingType?: FishingType; pageNumber?: number; attempt?: number; httpClass?: string; elapsedMs?: number }) {
  console.debug(`[catalog] ${event}`, JSON.stringify(fields))
}

export class LiveOfficialFishingIndexProvider implements OfficialFishingIndexProvider {
  private cache = new Map<string, OfficialIndexResult>()
  private catalogCache = new Map<FishingType, { points: OfficialFishingPointRef[]; fetchedAt: number }>()
  private catalogInflight = new Map<FishingType, { signal: AbortSignal | undefined; promise: Promise<CatalogResult> }>()
  private static readonly FRESH_WINDOW_MS = 5 * 60 * 1000
  // Bound wrapper: a bare `fetch` stored on the instance loses its Window receiver in browsers.
  constructor(
    private baseUrl: string,
    private request: typeof fetch = (input, init) => globalThis.fetch(input, init),
    private sleep: (ms: number) => Promise<void> = (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  ) {}

  private async fetchPage(fishingType: FishingType, page: number, name: string | undefined, signal: AbortSignal | undefined): Promise<{ ok: true; items: OfficialItem[]; totalCount: number } | { ok: false }> {
    const base = new URL(this.baseUrl)
    if (base.username || base.password || base.search || base.hash || (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))) throw new Error('NOT_CONFIGURED')
    const url = new URL('/api/fishing-index', base)
    url.search = new URLSearchParams({ gubun: fishingType, reqDate: seoulDate(), pageNo: String(page), numOfRows: '300', ...(name ? { placeName: name } : {}) }).toString()
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const started = Date.now()
      let response: Response | undefined
      let thrown: unknown
      try {
        const timeout = AbortSignal.timeout(12000)
        response = await this.request(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout, credentials: 'omit', referrerPolicy: 'no-referrer' })
      } catch (error) { thrown = error }
      if (response?.ok) {
        let data
        try { data = parseEnvelope(await response.json()) } catch { return { ok: false } } // malformed body: fatal, no retry
        return { ok: true, items: data.items, totalCount: data.totalCount }
      }
      const outcome = await classifyFailure(response, thrown, signal)
      if (outcome === 'ABORT') throw thrown ?? new Error('ABORTED')
      log('catalog_page_retry', { fishingType, pageNumber: page, attempt, httpClass: response?.status ? String(response.status) : 'NETWORK_ERROR', elapsedMs: Date.now() - started })
      if (outcome === 'FATAL' || attempt === MAX_ATTEMPTS) return { ok: false }
      await this.sleep(BACKOFF_MS[attempt - 1]! + Math.random() * 100)
    }
    return { ok: false }
  }

  // Collects every expected page for a catalog listing (name === undefined) or the single filtered
  // page for a detail lookup (name given). Successful pages are always preserved even when other
  // pages ultimately fail after retries — never discarded (v1.5 REQ-NFR-LIVE-RESILIENCE-002).
  private async collectPages(fishingType: FishingType, name: string | undefined, signal: AbortSignal | undefined) {
    log('catalog_fetch_started', { fishingType })
    const first = await this.fetchPage(fishingType, 1, name, signal)
    if (!first.ok) return { items: [] as OfficialItem[], complete: false, failedPages: [1], loadedPages: 0, expectedPages: undefined as number | undefined }
    const items = [...first.items]
    const expectedPages = Math.max(1, Math.min(20, Math.ceil(first.totalCount / 300)))
    const failedPages: number[] = []
    for (let page = 2; page <= expectedPages; page++) {
      const result = await this.fetchPage(fishingType, page, name, signal)
      if (result.ok) items.push(...result.items)
      else failedPages.push(page)
    }
    return { items, complete: failedPages.length === 0, failedPages, loadedPages: expectedPages - failedPages.length, expectedPages }
  }

  async getCatalog(type: FishingType, signal?: AbortSignal): Promise<CatalogResult> {
    const cached = this.catalogCache.get(type)
    if (cached && Date.now() - cached.fetchedAt < LiveOfficialFishingIndexProvider.FRESH_WINDOW_MS) {
      return { status: 'SUCCESS', points: cached.points, fetchedAt: new Date(cached.fetchedAt).toISOString(), loadedPages: 0, failedPages: [] }
    }
    // Only reuse an in-flight refresh whose own caller hasn't already abandoned it — otherwise a
    // caller's cancellation would corrupt a *different*, still-active caller's request (a real bug
    // caught by an E2E "fast second search" regression test).
    const inflight = this.catalogInflight.get(type)
    if (inflight && !inflight.signal?.aborted) return inflight.promise
    const promise = this.refreshCatalog(type, signal, cached)
    this.catalogInflight.set(type, { signal, promise })
    try { return await promise } finally { if (this.catalogInflight.get(type)?.promise === promise) this.catalogInflight.delete(type) }
  }

  private async refreshCatalog(type: FishingType, signal: AbortSignal | undefined, cached: { points: OfficialFishingPointRef[]; fetchedAt: number } | undefined): Promise<CatalogResult> {
    const fetchedAt = new Date().toISOString()
    try {
      const collection = await this.collectPages(type, undefined, signal)
      const points = [...new Map(collection.items.map(item => pointFrom(item, type)).filter((point): point is OfficialFishingPointRef => !!point).map(point => [point.officialPointId, point])).values()]
      if (collection.complete) {
        this.catalogCache.set(type, { points, fetchedAt: Date.now() })
        log('catalog_complete', { fishingType: type })
        return { status: 'SUCCESS', points, fetchedAt, loadedPages: collection.loadedPages, ...(collection.expectedPages !== undefined ? { expectedPages: collection.expectedPages } : {}), failedPages: [] }
      }
      // A partial refresh never overwrites a complete cache — prefer the complete-but-stale catalog.
      if (cached) { log('catalog_stale_fallback', { fishingType: type }); return { status: 'STALE_FALLBACK', points: cached.points, fetchedAt: new Date(cached.fetchedAt).toISOString(), loadedPages: 0, failedPages: [] } }
      if (points.length) { log('catalog_partial', { fishingType: type }); return { status: 'PARTIAL', points, fetchedAt, loadedPages: collection.loadedPages, ...(collection.expectedPages !== undefined ? { expectedPages: collection.expectedPages } : {}), failedPages: collection.failedPages } }
      return { status: 'COLLECTION_FAILED', points: [], fetchedAt, loadedPages: 0, failedPages: collection.failedPages }
    } catch (error) {
      // A misconfigured base URL is a code/setup defect, not a transient upstream failure — it must
      // surface as a rejection, not silently read as COLLECTION_FAILED.
      if (signal?.aborted || (error instanceof Error && error.message === 'NOT_CONFIGURED')) throw error
      if (cached) { log('catalog_stale_fallback', { fishingType: type }); return { status: 'STALE_FALLBACK', points: cached.points, fetchedAt: new Date(cached.fetchedAt).toISOString(), loadedPages: 0, failedPages: [] } }
      return { status: 'COLLECTION_FAILED', points: [], fetchedAt, loadedPages: 0, failedPages: [] }
    }
  }

  async getOfficialIndex(point: OfficialFishingPointRef, signal?: AbortSignal): Promise<OfficialIndexResult> {
    try {
      const collection = await this.collectPages(point.fishingType, point.placeName, signal)
      if (!collection.complete && collection.items.length === 0) throw new Error('COLLECTION_FAILED')
      const result = normalizeOfficial(collection.items, point)
      if ('species' in result) this.cache.set(point.officialPointId, result)
      return result
    } catch (error) {
      if (signal?.aborted) throw error
      const cached = this.cache.get(point.officialPointId)
      if (cached && 'species' in cached) return { ...cached, kind: 'STALE_CACHE', species: cached.species.map(item => ({ ...item, trustStatus: item.trustStatus === 'CONFLICT' ? 'CONFLICT' : 'STALE' })), environment: { ...cached.environment, observations: cached.environment.observations.map(item => ({ ...item, trustStatus: item.trustStatus === 'CONFLICT' ? 'CONFLICT' : 'STALE' })) }, guidance: (cached.guidance ?? []).map(item => ({ ...item, trustStatus: 'STALE' as const })) }
      return { kind: 'COLLECTION_FAILED', point, reason: error instanceof Error && error.message === 'MALFORMED_RESPONSE' ? '공식 응답 형식을 확인할 수 없습니다.' : '공식 데이터를 확인하지 못했습니다. 다시 시도해 주세요.', demo: false }
    }
  }
}
