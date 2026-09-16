import { parseEnvelope, type OfficialItem } from '../../shared/fishing-api'
import type { EnvironmentalObservation, FishingType, OfficialFishingIndexProvider, OfficialFishingPointRef, OfficialIndexResult } from './contracts'
import type { TrustStatus } from '../domain/contracts'

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
  const time = (item: OfficialItem) => `${item.predcYmd ?? '기준일 미확인'} · ${item.predcNoonSeCd ?? '시간구분 미확인'}`
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
  const partial = records.some(item => !item.seafsTgfshNm || !item.totalIndex || item.lastScr === undefined || !item.predcYmd || !item.predcNoonSeCd)
  return { kind: records.every(item => trust(item) === 'STALE') ? 'STALE_CACHE' : partial ? 'PARTIAL' : 'SUCCESS', point, species, environment: { locationReference: point, evaluatedAt: time(records[0]!), observations: observations.filter((item, index, all) => all.findIndex(other => JSON.stringify(other) === JSON.stringify(item)) === index) }, demo: false }
}
export class LiveOfficialFishingIndexProvider implements OfficialFishingIndexProvider {
  private cache = new Map<string, OfficialIndexResult>()
  // Bound wrapper: a bare `fetch` stored on the instance loses its Window receiver in browsers.
  constructor(private baseUrl: string, private request: typeof fetch = (input, init) => globalThis.fetch(input, init)) {}
  private async load(fishingType: FishingType, name?: string, signal?: AbortSignal) {
    const base = new URL(this.baseUrl)
    if (base.username || base.password || base.search || base.hash || (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))) throw new Error('NOT_CONFIGURED')
    const items: OfficialItem[] = []
    for (let page = 1; page <= 20; page++) {
      const url = new URL('/api/fishing-index', base)
      url.search = new URLSearchParams({ gubun: fishingType, reqDate: seoulDate(), pageNo: String(page), numOfRows: '300', ...(name ? { placeName: name } : {}) }).toString()
      const response = await this.request(url, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000), credentials: 'omit', referrerPolicy: 'no-referrer' })
      if (!response.ok) throw new Error('COLLECTION_FAILED')
      let data
      try { data = parseEnvelope(await response.json()) } catch { throw new Error('MALFORMED_RESPONSE') }
      items.push(...data.items)
      if (items.length >= data.totalCount) return items
      if (!data.items.length) break
    }
    throw new Error('INCOMPLETE_CATALOG')
  }
  async getCatalog(type: FishingType, signal?: AbortSignal) {
    const items = await this.load(type, undefined, signal)
    const points = items.map(item => pointFrom(item, type)).filter((point): point is OfficialFishingPointRef => !!point)
    return [...new Map(points.map(point => [point.officialPointId, point])).values()]
  }
  async getOfficialIndex(point: OfficialFishingPointRef, signal?: AbortSignal): Promise<OfficialIndexResult> {
    try {
      const result = normalizeOfficial(await this.load(point.fishingType, point.placeName, signal), point)
      if ('species' in result) this.cache.set(point.officialPointId, result)
      return result
    } catch (error) {
      if (signal?.aborted) throw error
      const cached = this.cache.get(point.officialPointId)
      if (cached && 'species' in cached) return { ...cached, kind: 'STALE_CACHE', species: cached.species.map(item => ({ ...item, trustStatus: item.trustStatus === 'CONFLICT' ? 'CONFLICT' : 'STALE' })), environment: { ...cached.environment, observations: cached.environment.observations.map(item => ({ ...item, trustStatus: item.trustStatus === 'CONFLICT' ? 'CONFLICT' : 'STALE' })) } }
      return { kind: 'COLLECTION_FAILED', point, reason: error instanceof Error && error.message === 'MALFORMED_RESPONSE' ? '공식 응답 형식을 확인할 수 없습니다.' : '공식 데이터를 확인하지 못했습니다. 다시 시도해 주세요.', demo: false }
    }
  }
}
