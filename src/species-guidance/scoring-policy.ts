import type { CelsiusRange, FactorResult, SpeciesProfile, SuitabilityLevel } from './contracts'

function overlaps(a: CelsiusRange, b: CelsiusRange) { return a.min <= b.max && b.min <= a.max }
function fmtRange(range: CelsiusRange) { return `${range.min}~${range.max}` }

export function classifyWaterTemperature(profile: SpeciesProfile, observed?: CelsiusRange): FactorResult {
  const factor = 'WATER_TEMPERATURE' as const; const label = '수온'
  if (!observed) return { factor, label, status: 'UNKNOWN', detail: '관측된 수온 데이터가 없습니다.' }
  if (!profile.preferredWaterTemperature && !profile.toleratedWaterTemperature) return { factor, label, status: 'UNKNOWN', detail: '이 어종의 수온 선호 구간에 대한 근거가 없습니다.' }
  if (profile.preferredWaterTemperature && overlaps(observed, profile.preferredWaterTemperature)) return { factor, label, status: 'MATCH', detail: `수온 ${fmtRange(observed)}℃ — 선호 구간(${fmtRange(profile.preferredWaterTemperature)}℃)과 겹칩니다.` }
  if (profile.toleratedWaterTemperature && overlaps(observed, profile.toleratedWaterTemperature)) return { factor, label, status: 'PARTIAL_MATCH', detail: `수온 ${fmtRange(observed)}℃ — 서식 가능 구간(${fmtRange(profile.toleratedWaterTemperature)}℃) 안이지만 선호 구간 근거는 없습니다.` }
  const reference = profile.toleratedWaterTemperature ?? profile.preferredWaterTemperature!
  return { factor, label, status: 'MISMATCH', detail: `수온 ${fmtRange(observed)}℃ — 서식 가능 구간(${fmtRange(reference)}℃)과 겹치지 않습니다.` }
}

function monthDistance(a: number, b: number) { const d = Math.abs(a - b); return Math.min(d, 12 - d) }

export function classifySeason(profile: SpeciesProfile, month?: number): FactorResult {
  const factor = 'SEASON' as const; const label = '계절'
  if (!month) return { factor, label, status: 'UNKNOWN', detail: '날짜 정보가 없습니다.' }
  if (!profile.seasonalActiveMonths?.length) return { factor, label, status: 'UNKNOWN', detail: '이 어종의 계절 활동 근거가 없습니다.' }
  const months = profile.seasonalActiveMonths
  const monthsLabel = `${months.join(',')}월`
  if (months.includes(month)) return { factor, label, status: 'MATCH', detail: `${month}월 — 문서화된 활동기(${monthsLabel})와 부합합니다.` }
  const minDistance = Math.min(...months.map(m => monthDistance(m, month)))
  if (minDistance <= 1) return { factor, label, status: 'PARTIAL_MATCH', detail: `${month}월 — 문서화된 활동기(${monthsLabel})에 인접합니다.` }
  return { factor, label, status: 'MISMATCH', detail: `${month}월 — 문서화된 활동기(${monthsLabel})와 거리가 있습니다.` }
}

// No species profile in this release has a cited current-speed, tide, or time-of-day threshold
// (see research/species-environment-evidence.md). These stay UNKNOWN by construction, not by a
// missing-data accident — emitted so the user sees what was and wasn't used, per §16 of the delta.
export function classifyCurrentSpeed(): FactorResult { return { factor: 'CURRENT_SPEED', label: '유속', status: 'UNKNOWN', detail: '이 어종의 유속 선호에 대한 근거가 아직 없습니다.' } }
export function classifyTide(): FactorResult { return { factor: 'TIDE', label: '물때', status: 'UNKNOWN', detail: '물때와 이 어종의 관계에 대한 근거가 아직 없습니다.' } }
export function classifyTimeOfDay(): FactorResult { return { factor: 'TIME_OF_DAY', label: '시간대', status: 'UNKNOWN', detail: '시간대와 이 어종의 관계에 대한 근거가 아직 없습니다.' } }

// Explainable rule table, not a weighted score or probability — see v1.4-product-delta.md
// "Suitability rule" for the rationale and the evidence-thinness consequence for 농어/감성돔.
export function computeSuitability(factors: FactorResult[]): SuitabilityLevel {
  const temperature = factors.find(item => item.factor === 'WATER_TEMPERATURE')
  const evaluable = factors.filter(item => item.status !== 'UNKNOWN')
  if (!temperature || temperature.status === 'UNKNOWN' || evaluable.length < 2) return 'INSUFFICIENT_EVIDENCE'
  if (temperature.status === 'MISMATCH') return 'LOW'
  const otherMismatch = factors.some(item => item.factor !== 'WATER_TEMPERATURE' && item.status === 'MISMATCH')
  if (temperature.status === 'MATCH' && !otherMismatch) return 'HIGH'
  return 'MODERATE'
}
