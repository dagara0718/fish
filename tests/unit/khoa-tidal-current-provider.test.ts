import { describe, expect, it, vi } from 'vitest'
import { KhoaTidalCurrentProvider, normalizeTidalCurrent } from '../../src/species-guidance/khoa-tidal-current-provider'

const query = { latitude: 35.123456, longitude: 129.654321 }
const row = (overrides = {}) => ({ current_speed: '12.3', current_dir: '215', obs_date: '2026-09-16 12:00', type: '전류', ...overrides })
const noSleep = () => Promise.resolve()

describe('normalizeTidalCurrent', () => {
  it('normalizes a well-formed row, preserving units and UNKNOWN direction convention', () => {
    const result = normalizeTidalCurrent({ result: { data: [row()] } }, '2026-09-16T00:00:00Z')
    expect(result.status).toBe('SUCCESS')
    expect(result.observations[0]).toMatchObject({ speed: 12.3, speedUnit: 'cm/s', direction: 215, directionUnit: 'deg', directionConvention: 'UNKNOWN', currentType: 'INSTANTANEOUS', observationType: 'FORECAST' })
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
})
