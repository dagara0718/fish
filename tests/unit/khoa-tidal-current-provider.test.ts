import { describe, expect, it, vi } from 'vitest'
import { KhoaTidalCurrentProvider, normalizeTidalCurrent, requestWindow } from '../../src/species-guidance/khoa-tidal-current-provider'

const query = { latitude: 35.123456, longitude: 129.654321 }
const row = (overrides = {}) => ({ current_speed: '12.3', current_dir: '215', obs_date: '2026-09-16 12:00', type: '전류', ...overrides })
const noSleep = () => Promise.resolve()

describe('normalizeTidalCurrent', () => {
  it('normalizes a well-formed row, preserving units and UNKNOWN direction convention', () => {
    const result = normalizeTidalCurrent({ result: { data: [row()] } }, '2026-09-16T00:00:00Z')
    expect(result.status).toBe('SUCCESS')
    expect(result.observations[0]).toMatchObject({ speed: 12.3, speedUnit: 'cm/s', direction: 215, directionUnit: 'deg', directionConvention: 'UNKNOWN', currentType: 'SLACK', observationType: 'FORECAST' })
  })
  it('maps 최강창조류/최강낙조류 to PEAK_FLOOD/PEAK_EBB', () => {
    expect(normalizeTidalCurrent({ result: { data: [row({ type: '최강창조류' })] } }, 't').observations[0]?.currentType).toBe('PEAK_FLOOD')
    expect(normalizeTidalCurrent({ result: { data: [row({ type: '최강낙조류' })] } }, 't').observations[0]?.currentType).toBe('PEAK_EBB')
  })
  it('treats an unrecognized shape as UNAVAILABLE, not a crash', () => {
    expect(normalizeTidalCurrent({ nope: true }, 't').status).toBe('UNAVAILABLE')
    expect(normalizeTidalCurrent({ result: { data: [] } }, 't').status).toBe('UNAVAILABLE')
  })
  it('is PARTIAL when some rows are malformed but others parse, and never blanks one field for a failure in the other', () => {
    const result = normalizeTidalCurrent({ result: { data: [row(), { type: 'unknown-type' }, row({ current_dir: '' })] } }, 't')
    expect(result.status).toBe('PARTIAL')
    expect(result.observations).toHaveLength(2)
    const speedOnly = result.observations.find(o => o.direction === undefined)
    expect(speedOnly).toMatchObject({ speed: 12.3, speedUnit: 'cm/s' })
    expect(speedOnly).not.toHaveProperty('directionUnit')
  })
  it('is UNAVAILABLE (not PARTIAL) when every row is malformed', () => {
    expect(normalizeTidalCurrent({ result: { data: [{ type: 'unknown' }] } }, 't').status).toBe('UNAVAILABLE')
  })
  it('keeps a type="" row (confirmed present on real production KHOA rows, 2026-09-18) as SUCCESS, never malformed or discarded', () => {
    const result = normalizeTidalCurrent({ result: { data: [row({ type: '' })] } }, 't')
    expect(result.status).toBe('SUCCESS')
    expect(result.observations).toHaveLength(1)
    expect(result.observations[0]).not.toHaveProperty('currentType')
    expect(result.observations[0]).toMatchObject({ speed: 12.3, direction: 215 })
  })
  it('every observation carries timeBasis: UNCONFIRMED (KHOA never states its request/response timezone)', () => {
    expect(normalizeTidalCurrent({ result: { data: [row()] } }, 't').observations[0]?.timeBasis).toBe('UNCONFIRMED')
    expect(normalizeTidalCurrent({ result: { data: [row({ type: '' })] } }, 't').observations[0]?.timeBasis).toBe('UNCONFIRMED')
  })
  it('still treats a non-empty, unrecognized type label as malformed (schema drift, not an unlabeled row)', () => {
    const result = normalizeTidalCurrent({ result: { data: [row(), row({ type: 'unrecognized-label' })] } }, 't')
    expect(result.status).toBe('PARTIAL')
    expect(result.observations).toHaveLength(1)
  })
})

describe('KhoaTidalCurrentProvider', () => {
  it('rounds coordinates to 3dp in the request and never sends the exact GPS value', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ result: { data: [row()] } }))
    const provider = new KhoaTidalCurrentProvider('https://proxy.example', fetcher, noSleep)
    await provider.getCurrentObservations(query)
    const url = String(fetcher.mock.calls[0]![0])
    expect(url).toContain('lat=35.123'); expect(url).toContain('lon=129.654')
    expect(url).not.toContain('35.123456'); expect(url).not.toContain('129.654321')
  })
  it('fills the observation coordinate from the request, not a fabricated matched-station coordinate', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ result: { data: [row()] } }))
    const provider = new KhoaTidalCurrentProvider('https://proxy.example', fetcher, noSleep)
    const result = await provider.getCurrentObservations(query)
    expect(result.observations[0]).toMatchObject({ latitude: query.latitude, longitude: query.longitude })
  })
  it('reuses the shared retry helper: retries a 500 then succeeds', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(null, { status: 500 })).mockResolvedValueOnce(Response.json({ result: { data: [row()] } }))
    const provider = new KhoaTidalCurrentProvider('https://proxy.example', fetcher, noSleep)
    const result = await provider.getCurrentObservations(query)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(result.status).toBe('SUCCESS')
  })
  it('returns NOT_CONNECTED on a 503 (key not configured) instead of a generic failure', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 503 }))
    const provider = new KhoaTidalCurrentProvider('https://proxy.example', fetcher, noSleep)
    expect((await provider.getCurrentObservations(query)).status).toBe('NOT_CONNECTED')
  })
  it('returns UNSUPPORTED_AREA without retrying on the proxy 422 NO_DATA_FOR_LOCATION', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ error: 'NO_DATA_FOR_LOCATION' }, { status: 422 }))
    const result = await new KhoaTidalCurrentProvider('https://proxy.example', fetcher, noSleep).getCurrentObservations(query)
    expect(result.status).toBe('UNSUPPORTED_AREA')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('returns UNAVAILABLE, not a throw, when retries exhaust', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 500 }))
    const provider = new KhoaTidalCurrentProvider('https://proxy.example', fetcher, noSleep)
    const result = await provider.getCurrentObservations(query)
    expect(result.status).toBe('UNAVAILABLE'); expect(result.observations).toHaveLength(0)
  })
  it('returns UNAVAILABLE on a malformed (non-JSON) body instead of throwing', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('not json', { headers: { 'Content-Type': 'application/json' } }))
    const provider = new KhoaTidalCurrentProvider('https://proxy.example', fetcher, noSleep)
    expect((await provider.getCurrentObservations(query)).status).toBe('UNAVAILABLE')
  })
  it('returns NOT_CONNECTED without any request when the base URL is unset or not https', async () => {
    const fetcher = vi.fn<typeof fetch>()
    for (const base of ['', 'not a url', 'http://proxy.example', 'https://proxy.example/?k=1']) {
      expect((await new KhoaTidalCurrentProvider(base, fetcher, noSleep).getCurrentObservations(query)).status).toBe('NOT_CONNECTED')
    }
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('accepts the proxy numeric speed/direction (live rows) as well as KHOA sample strings', () => {
    const result = normalizeTidalCurrent({ result: { data: [row({ current_speed: 66, current_dir: 356, type: '' })] } }, 't')
    expect(result.observations[0]).toMatchObject({ speed: 66, direction: 356 })
  })
  it('propagates an abort instead of resolving a stale result', async () => {
    const controller = new AbortController(); controller.abort()
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new DOMException('aborted', 'AbortError'))
    await expect(new KhoaTidalCurrentProvider('https://proxy.example', fetcher, noSleep).getCurrentObservations(query, controller.signal)).rejects.toBeDefined()
  })
  it('sends the window built by requestWindow, never a single assumed time basis', async () => {
    const at = new Date('2026-09-23T17:20:00Z')
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ result: { data: [row()] } }))
    await new KhoaTidalCurrentProvider('https://proxy.example', fetcher, noSleep).getCurrentObservations({ ...query, at })
    const params = new URL(String(fetcher.mock.calls[0]![0])).searchParams
    expect(Object.fromEntries(['SDate', 'SHour', 'SMinute', 'EDate', 'EHour', 'EMinute'].map(key => [key, params.get(key)]))).toEqual(requestWindow(at))
  })
})

describe('requestWindow (time basis UNCONFIRMED)', () => {
  it('contains the real present under both the UTC and the KST reading of SDate/SHour/SMinute', () => {
    const at = new Date('2026-09-23T17:20:00Z') // = 2026-09-24 02:20 KST
    expect(requestWindow(at)).toEqual({ SDate: '20260923', SHour: '16', SMinute: '50', EDate: '20260924', EHour: '02', EMinute: '50' })
    const stamp = (w: ReturnType<typeof requestWindow>, side: 'S' | 'E') => `${w[`${side}Date`]}${w[`${side}Hour`]}${w[`${side}Minute`]}`
    const w = requestWindow(at)
    for (const nowWall of ['202609231720', '202609240220']) { // UTC wall, KST wall
      expect(stamp(w, 'S') <= nowWall && nowWall <= stamp(w, 'E')).toBe(true)
    }
  })
  it('rolls dates over correctly at month/year boundaries', () => {
    expect(requestWindow(new Date('2026-12-31T20:00:00Z'))).toEqual({ SDate: '20261231', SHour: '19', SMinute: '30', EDate: '20270101', EHour: '05', EMinute: '30' })
  })
})
