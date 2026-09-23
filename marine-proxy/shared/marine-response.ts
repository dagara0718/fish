// Canonical KHOA marine validator, shared by worker/src/index.ts (via a relative import reaching
// into this directory) and marine-proxy's own runtime, so the two independent server-side execution
// paths validate the KHOA marine contract identically instead of drifting (v1.6.2 §15).
//
// This file lives inside marine-proxy/ (not repo-root shared/) because Vercel's Node.js Functions
// only bundle files reachable from the project's own Root Directory (marine-proxy/) — a relative
// import reaching outside it is not included in the deployed function bundle and fails at runtime
// with ERR_MODULE_NOT_FOUND (v1.6.2 VERCEL_ESM_MODULE_RESOLUTION incident). Pure, no runtime-specific
// imports, so the Cloudflare Worker can still import it via a longer relative path with no changes
// to its own behavior.

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

// A local copy of shared/fishing-api.ts's calendar-date check — deliberately duplicated (7 lines)
// rather than imported, since importing across the Vercel Root Directory boundary is exactly the bug
// this file's relocation fixes. This is a generic YYYYMMDD-calendar validator, not KHOA marine
// contract logic, so duplicating it does not create the "two marine validators" drift this file
// exists to prevent.
function isRealCalendarDate(iso: string): boolean {
  const parsed = new Date(`${iso}T00:00:00Z`)
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === iso
}
export function validDate(date: string): boolean {
  if (!/^\d{8}$/.test(date)) return false
  return isRealCalendarDate(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`)
}

// v1.6.3: KHOA answers `{"result":{"error":"No search data"}}` (HTTP 200) when it has no prediction
// point for the request — observed 2026-09-24 for an inland coordinate (37.566/126.978) and for an
// open-ocean coordinate outside its model (32.000/130.500), while past (2000) and future (2099)
// windows at a sea point both return data. The same text also comes back for an end-before-start
// window, so callers must reject that with validRange() first; only then does this signal mean
// "no prediction at this location". Exact match only — any other error text stays a failure.
export function isNoSearchData(body: string): boolean {
  try {
    const raw = JSON.parse(body) as { result?: Record<string, unknown> }
    const result = raw?.result
    return !!result && typeof result === 'object' && result.error === 'No search data' && !('data' in result)
  } catch { return false }
}
// YYYYMMDD+HH+mm strings compare lexically in time order; end must not precede start.
export function validRange(sdate: string, shour: string, sminute: string, edate: string, ehour: string, eminute: string): boolean {
  return `${sdate}${shour}${sminute}` <= `${edate}${ehour}${eminute}`
}
