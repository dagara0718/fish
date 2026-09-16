/** Whitelisted official DTO; shared by server validation and client normalization. */
export const textFields = ['seafsPstnNm', 'predcYmd', 'predcNoonSeCd', 'seafsTgfshNm', 'totalIndex', 'tdlvHrCn'] as const
export const numberFields = ['lat', 'lot', 'lastScr', 'tdlvHrScr', 'minWvhgt', 'maxWvhgt', 'minWtem', 'maxWtem', 'minArtmp', 'maxArtmp', 'minCrsp', 'maxCrsp', 'minWspd', 'maxWspd'] as const
export type OfficialItem = Partial<Record<typeof textFields[number], string> & Record<typeof numberFields[number], number>>
export interface FishingEnvelope { version: 1; items: OfficialItem[]; totalCount: number; fetchedAt: string }
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('MALFORMED_RESPONSE')
  return value as Record<string, unknown>
}
export function validDate(date: string): boolean {
  if (!/^\d{8}$/.test(date)) return false
  const iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
  const parsed = new Date(`${iso}T00:00:00Z`)
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === iso
}
export function parseItem(value: unknown): OfficialItem {
  const input = object(value); const item: OfficialItem = {}
  for (const field of textFields) {
    const raw = input[field]
    if (raw === undefined || raw === null || raw === '') continue
    if (typeof raw !== 'string' || raw.length > 200) throw new Error('MALFORMED_RESPONSE')
    if (raw.trim()) item[field] = raw.trim()
  }
  for (const field of numberFields) {
    const raw = input[field]
    if (raw === undefined || raw === null || (typeof raw === 'string' && !raw.trim())) continue
    if (typeof raw !== 'number' && (typeof raw !== 'string' || !/^-?\d+(\.\d+)?$/.test(raw))) throw new Error('MALFORMED_RESPONSE')
    const n = Number(raw)
    if (!Number.isFinite(n)) throw new Error('MALFORMED_RESPONSE')
    item[field] = n
  }
  if ((item.lat !== undefined && Math.abs(item.lat) > 90) || (item.lot !== undefined && Math.abs(item.lot) > 180)) throw new Error('MALFORMED_RESPONSE')
  if (item.predcYmd && !validDate(item.predcYmd)) throw new Error('MALFORMED_RESPONSE')
  return item
}
export function parseOfficialResponse(value: unknown, fetchedAt: string): FishingEnvelope {
  const root = object(value); const response = root.response === undefined ? root : object(root.response)
  const header = object(response.header)
  const code = String(header.resultCode)
  if (code === '03' || code === '3') return { version: 1, items: [], totalCount: 0, fetchedAt }
  if (code !== '00' && code !== '0') throw new Error('UPSTREAM_ERROR')
  const body = object(response.body)
  const totalCount = Number(body.totalCount)
  if (!Number.isSafeInteger(totalCount) || totalCount < 0 || body.totalCount === null || body.totalCount === '') throw new Error('MALFORMED_RESPONSE')
  if (totalCount === 0) return { version: 1, items: [], totalCount, fetchedAt }
  const items = object(body.items).item
  if (!Array.isArray(items) || items.length === 0 || items.length > 300) throw new Error('MALFORMED_RESPONSE')
  return { version: 1, items: items.map(parseItem), totalCount, fetchedAt }
}
export function parseEnvelope(value: unknown): FishingEnvelope {
  const obj = object(value)
  if (obj.version !== 1 || !Array.isArray(obj.items) || obj.items.length > 300 || typeof obj.totalCount !== 'number' || !Number.isSafeInteger(obj.totalCount) || obj.totalCount < obj.items.length || typeof obj.fetchedAt !== 'string' || !Number.isFinite(Date.parse(obj.fetchedAt))) throw new Error('MALFORMED_RESPONSE')
  return { version: 1, items: obj.items.map(parseItem), totalCount: obj.totalCount, fetchedAt: obj.fetchedAt }
}
