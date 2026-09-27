import type { TrustStatus } from '../domain/contracts'
import type { OfficialFishingPointRef, OfficialIndexResult } from './contracts'

// v1.6.4 (REQ-FUNC-NEARBY-001~004): side-by-side summary of the official fishing index at the few
// official points nearest an arbitrary map location. It is NOT a value for that location and NOT a
// probability of any species appearing — the official index is a per-point "낚시 여건" grade, and
// nothing here interpolates, averages, weights or ranks it. It only counts official grades per
// species at one shared forecast slot so the points are compared like-for-like.

export interface NearbyEntry { point: OfficialFishingPointRef; distanceKm: number; result: OfficialIndexResult }
// failed: the point's own lookup failed, so the grade is unknown — distinct from "no value published".
export interface NearbyCell { placeName: string; distanceKm: number; failed: boolean; grade?: string; trustStatus?: TrustStatus; evaluatedAt?: string }
export interface NearbySpeciesRow { speciesName: string; cells: NearbyCell[]; gradeCounts: { grade: string; count: number }[] }
export interface NearbyComparison {
  // The earliest forecast slot any compared point has ("YYYY-MM-DD · 오전" as normalizeOfficial
  // formats it). Only records at this exact slot are compared; other days are left out.
  slot?: string
  points: { placeName: string; distanceKm: number; failed: boolean }[]
  species: NearbySpeciesRow[]
  trustStatuses: TrustStatus[]
}

// KHOA's own grade vocabulary, best to worst — used only to order the counts, never to score.
const GRADE_ORDER = ['매우좋음', '좋음', '보통', '나쁨', '매우나쁨']
const gradeRank = (grade: string) => { const index = GRADE_ORDER.indexOf(grade); return index === -1 ? GRADE_ORDER.length : index }

export function summarizeNearby(entries: NearbyEntry[]): NearbyComparison {
  const sorted = [...entries].sort((a, b) => a.distanceKm - b.distanceKm)
  const usable = sorted.flatMap(entry => 'species' in entry.result ? [{ entry, species: entry.result.species }] : [])
  // "YYYY-MM-DD · 오전" < "… · 오후" < next day lexically (전 U+C804 < 후 U+D6C4), so min = earliest.
  const slot = usable.flatMap(item => item.species.map(record => record.evaluatedAt)).sort()[0]
  const names = [...new Set(usable.flatMap(item => item.species.filter(record => record.evaluatedAt === slot).map(record => record.speciesName)))].sort((a, b) => a.localeCompare(b, 'ko'))
  const trust = new Set<TrustStatus>()
  const species = names.map(speciesName => {
    const cells: NearbyCell[] = sorted.map(entry => {
      const record = 'species' in entry.result ? entry.result.species.find(item => item.speciesName === speciesName && item.evaluatedAt === slot) : undefined
      if (record) trust.add(record.trustStatus)
      return { placeName: entry.point.placeName, distanceKm: entry.distanceKm, failed: !('species' in entry.result), ...(record ? { grade: record.officialGrade, trustStatus: record.trustStatus, evaluatedAt: record.evaluatedAt } : {}) }
    })
    const counts = new Map<string, number>()
    for (const cell of cells) if (cell.grade) counts.set(cell.grade, (counts.get(cell.grade) ?? 0) + 1)
    const gradeCounts = [...counts].map(([grade, count]) => ({ grade, count })).sort((a, b) => gradeRank(a.grade) - gradeRank(b.grade))
    return { speciesName, cells, gradeCounts }
  })
  return {
    ...(slot ? { slot } : {}),
    points: sorted.map(entry => ({ placeName: entry.point.placeName, distanceKm: entry.distanceKm, failed: !('species' in entry.result) })),
    species,
    trustStatuses: [...trust],
  }
}
