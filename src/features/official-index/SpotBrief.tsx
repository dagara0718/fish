import type { OfficialFishingPointRef } from '../../official-index/contracts'
import { summarizeNearby, type NearbyEntry } from '../../official-index/nearby-comparison'
import type { MarineCurrentResult } from '../../species-guidance/contracts'
import { EnvironmentGuidancePanel } from './EnvironmentGuidancePanel'
import { MarineCurrentPanel } from './MarineCurrentPanel'
import { NearbyComparisonPanel } from './NearbyComparisonPanel'

// v1.6.5 (REQ-FUNC-SPOT-001~005): a species brief for the user's own spot — a map click or the GPS
// fix — shown directly, without asking the user to pick an official point first. It combines:
// environment-based species guidance from the nearest official point's own forecast (water
// temperature + season), the official grades of up to 3 official points within the brief's radius (NEARBY_MAX_KM), and the tidal
// current forecast. None of these is a measured value at the spot or a catch probability, and the
// panel says which source each part comes from.
export function SpotBrief({ source, maxKm, candidates, entries, slot, onSlotChange, marine, marineBusy, marineBasis, onMarineRetry, onPickPoint }: {
  source: 'MAP' | 'GPS'
  maxKm: number
  candidates: { point: OfficialFishingPointRef; distanceKm: number }[]
  entries: NearbyEntry[] | 'LOADING' | undefined
  slot: string | undefined
  onSlotChange: (slot: string) => void
  marine: MarineCurrentResult | undefined
  marineBusy: boolean
  marineBasis: string | undefined
  onMarineRetry: () => void
  onPickPoint: (point: OfficialFishingPointRef) => void
}) {
  const where = source === 'GPS' ? '현재 위치' : '지도에서 선택한 위치'
  const summary = entries && entries !== 'LOADING' ? summarizeNearby(entries, slot) : undefined
  const nearestUsable = entries && entries !== 'LOADING' ? [...entries].sort((a, b) => a.distanceKm - b.distanceKm).find(entry => 'species' in entry.result) : undefined
  const guidance = nearestUsable && summary?.slot && 'guidanceBySlot' in nearestUsable.result ? nearestUsable.result.guidanceBySlot?.[summary.slot] ?? [] : []
  return <>
    <p className="section-kicker">SPOT BRIEF</p>
    <h2>이 위치 어종 브리프</h2>
    <p>{where} 기준 · 주변 {maxKm} km 이내 공식 예보와 조류 예측으로 확인할 어종을 보여줍니다. 이 위치의 실측값이나 조과 확률이 아닙니다.</p>
    {candidates.length === 0
      ? <div className="inline-state"><strong>{where} {maxKm} km 이내에 공식 바다낚시지수 기준 포인트가 없습니다</strong><p>어종별 공식 지수와 수온 예보를 가져올 기준이 없어 예상 어종을 표시하지 않습니다.</p></div>
      : entries === 'LOADING'
        ? <p role="status">주변 공식 예보를 확인하는 중입니다.</p>
        : summary && <>
          {summary.slots.length > 1 && <label className="spot-slot">날짜 <select value={summary.slot} onChange={event => onSlotChange(event.target.value)}>{summary.slots.map(item => <option key={item} value={item}>{item}</option>)}</select></label>}
          {nearestUsable
            ? <>
              <EnvironmentGuidancePanel guidance={guidance} />
              <p className="official-note">예상 어종의 수온·계절 기준: {nearestUsable.point.placeName}({nearestUsable.distanceKm.toFixed(1)} km) 공식 예보 · {summary.slot}. {where}의 실측 수온이 아닙니다.</p>
            </>
            : <div className="inline-state"><strong>주변 공식 예보를 확인하지 못했습니다</strong><p>잠시 후 다시 시도하거나 아래에서 공식 포인트를 직접 확인해 주세요.</p></div>}
          <NearbyComparisonPanel comparison={summary} />
        </>}
    <MarineCurrentPanel result={marine} busy={marineBusy} onRetry={onMarineRetry} />
    {marineBasis && (marine || marineBusy) && <p className="official-note">조류 예측 기준: {marineBasis}</p>}
    {candidates.length > 0 && <details className="marine-evidence spot-points"><summary>주변 공식 포인트 직접 보기 ({candidates.length}곳)</summary>
      <ul>{candidates.map(candidate => <li key={candidate.point.officialPointId}><span><strong>{candidate.point.placeName}</strong> <span className="mono">{candidate.distanceKm.toFixed(1)} km</span></span><button className="secondary-button" type="button" onClick={() => onPickPoint(candidate.point)}>이 기준 포인트로 확인</button></li>)}</ul>
    </details>}
  </>
}
