// Shared between worker/src/index.ts and marine-proxy/api/marine-current.ts so the two independent
// server-side execution paths validate the KHOA marine contract identically (v1.6.2 §15 — do not let
// two validators drift apart). Pure, no runtime-specific imports.

// KHOA's real marine endpoint sends HTTP 200 with a genuine JSON body but
// Content-Type: text/html;charset=UTF-8 (confirmed against the live upstream, v1.6.1). Callers must
// not gate on Content-Type for this endpoint — this schema check is the actual gate instead.
const OBS_DATE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') { const n = Number(value); if (Number.isFinite(n)) return n }
  return undefined
}

// Minimal schema guard for the verified KHOA marine response shape — narrower than JSON.parse
// succeeding, so an unrelated well-formed JSON body (e.g. an HTML error page's wrapper, or a future
// upstream field change) still fails closed instead of silently passing through.
export function validateMarineResponse(body: string): unknown {
  const raw = JSON.parse(body) as { result?: { data?: unknown; meta?: unknown } }
  const result = raw?.result
  if (!result || typeof result !== 'object') throw new Error('MALFORMED_RESPONSE')
  const { data, meta } = result
  if (!Array.isArray(data) || !meta || typeof meta !== 'object') throw new Error('MALFORMED_RESPONSE')
  const metaRecord = meta as Record<string, unknown>
  for (const key of ['sch_Stime', 'sch_Etime', 'lat', 'lon']) if (typeof metaRecord[key] !== 'string') throw new Error('MALFORMED_RESPONSE')
  const items = (data as Record<string, unknown>[]).map(row => {
    const speed = toFiniteNumber(row.current_speed)
    const direction = toFiniteNumber(row.current_dir)
    if (speed === undefined || direction === undefined) throw new Error('MALFORMED_RESPONSE')
    if (direction < 0 || direction > 360) throw new Error('MALFORMED_RESPONSE')
    if (typeof row.obs_date !== 'string' || !OBS_DATE.test(row.obs_date)) throw new Error('MALFORMED_RESPONSE')
    // KHOA's real response confirms type: "" (empty string) — treated as a valid, if uninformative,
    // value, never as malformed.
    if (typeof row.type !== 'string') throw new Error('MALFORMED_RESPONSE')
    // current_speed is cm/s and current_dir is a 0-360 bearing, but its convention (toward/from,
    // true/magnetic north) is unstated by KHOA — never inferred here or downstream.
    return { current_speed: speed, current_dir: direction, obs_date: row.obs_date, type: row.type }
  })
  return { result: { data: items, meta: { sch_Stime: metaRecord.sch_Stime, sch_Etime: metaRecord.sch_Etime, lat: metaRecord.lat, lon: metaRecord.lon } } }
}

// Query-param allowlist/validation shared by both server-side paths (v1.6.2 §12).
export const MARINE_PARAMS = new Set(['SDate', 'SHour', 'SMinute', 'EDate', 'EHour', 'EMinute', 'lat', 'lon', 'ResultType'])
export function validHour(value: string | null): boolean { return value !== null && /^\d{2}$/.test(value) && +value <= 23 }
export function validMinute(value: string | null): boolean { return value !== null && /^\d{2}$/.test(value) && +value <= 59 }
export function validCoordinate(value: string | null, max: number): boolean { if (value === null) return false; const n = Number(value); return Number.isFinite(n) && Math.abs(n) <= max }
