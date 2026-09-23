import { useEffect, useState, type ReactNode } from 'react'
import type { CurrentType, MarineCurrentObservation, MarineCurrentResult } from '../../species-guidance/contracts'
import { TrustBadge } from '../decision-brief/TrustBadge'

// KHOA's own labels, shown verbatim (see contracts.ts CurrentType for what '전류' means).
const CURRENT_TYPE_LABEL: Record<CurrentType, string> = { SLACK: '전류', PEAK_FLOOD: '최강창조류', PEAK_EBB: '최강낙조류' }
// Same as the data's own 10-minute resolution (REQ-NFR-MARINE-003): older than this, the retrieved
// window is shown as STALE and the user is offered a marine-only refresh.
export const MARINE_STALE_AFTER_MS = 10 * 60 * 1000
// Retrieval time is this device's own clock, so its zone IS known — unlike forecastAt.
const retrievedLabel = (iso: string) => `${new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))} KST`
const forecastLabel = (value: string) => value.slice(0, 16)

function Heading({ children }: { children?: ReactNode }) {
  return <div className="section-title-row"><div><p className="section-kicker">TIDAL CURRENT · FORECAST</p><h3 id="marine-heading">조류 예측 데이터</h3><p>국립해양조사원 수치조류도 · 예측값이며 실측·현재 관측값이 아닙니다.</p></div>{children}</div>
}

// v1.6.3 (REQ-FUNC-MARINE-UI-001~006): the selected official point's KHOA tidal-current forecast,
// independent of the official fishing index. Never labeled "지금"/"현재"/"실시간": forecastAt's time
// basis is UNCONFIRMED (contracts.ts), so no row is picked out as the present one. Display-only —
// CURRENT_SPEED/CURRENT_DIRECTION stay UNKNOWN for every species (REQ-FUNC-GUIDANCE-007).
export function MarineCurrentPanel({ result, busy, onRetry }: { result: MarineCurrentResult | undefined; busy: boolean; onRetry: () => void }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(id) }, [])
  const retry = <button className="secondary-button" type="button" onClick={onRetry}>조류 데이터만 다시 조회</button>
  if (busy) return <section className="marine-section" aria-labelledby="marine-heading"><Heading /><p role="status">조류 예측 데이터를 확인하는 중입니다.</p></section>
  if (!result) return null
  if (result.status === 'NOT_CONNECTED') return <section className="marine-section" aria-labelledby="marine-heading"><Heading /><div className="inline-state"><strong>조류 예측 데이터 연결이 설정되지 않았습니다</strong><p>공식 바다낚시지수와 별도 연결입니다. 설정 전에는 조류 정보를 표시하지 않습니다.</p></div></section>
  if (result.status === 'UNSUPPORTED_AREA') return <section className="marine-section" aria-labelledby="marine-heading"><Heading /><div className="inline-state"><strong>이 위치는 조류 예측 제공 범위가 아닙니다</strong><p>{result.reason ?? '제공기관 기준 가장 가까운 예측 지점(최대 1km)이 없습니다.'}</p></div></section>
  const rows = result.observations
  if (result.status === 'UNAVAILABLE' || rows.length === 0) return <section className="marine-section" aria-labelledby="marine-heading"><Heading><TrustBadge status="COLLECTION_FAILED" /></Heading><div className="inline-state"><strong>조류 예측 데이터를 확인하지 못했습니다</strong><p>{result.reason ?? '잠시 후 다시 시도해 주세요.'}</p><p>공식 바다낚시지수 결과에는 영향을 주지 않습니다.</p>{retry}</div></section>
  const stale = result.status === 'STALE' || now - Date.parse(rows[0]!.sourceTimestamp) > MARINE_STALE_AFTER_MS
  const times = rows.map(row => row.forecastAt).sort()
  const speeds = rows.flatMap(row => row.speed === undefined ? [] : [row.speed])
  const events = rows.filter((row): row is MarineCurrentObservation & { currentType: CurrentType } => row.currentType !== undefined)
  return <section className="marine-section" aria-labelledby="marine-heading">
    <Heading><div className="marine-badges">{stale && <TrustBadge status="STALE" />}<TrustBadge status={rows[0]!.trustStatus} /></div></Heading>
    {result.status === 'PARTIAL' && <p className="official-note">일부 행은 형식을 확인할 수 없어 제외했습니다.</p>}
    {stale && <div className="inline-state"><strong>조회 후 10분 이상 지났습니다</strong><p>표시된 예측 구간은 마지막 조회 기준입니다.</p>{retry}</div>}
    <dl className="marine-facts">
      <div><dt>예측 구간 (시간대 미확인)</dt><dd className="mono">{forecastLabel(times[0]!)} ~ {forecastLabel(times.at(-1)!)}</dd></div>
      <div><dt>구간 내 유속 범위</dt><dd>{speeds.length ? `${Math.min(...speeds)}–${Math.max(...speeds)} cm/s` : '유속 미제공'}</dd></div>
      <div><dt>공식 표기 시점</dt><dd>{events.length ? <ul className="marine-events">{events.map(row => <li key={`${row.forecastAt}:${row.currentType}`}><span>{CURRENT_TYPE_LABEL[row.currentType]}</span> <span className="mono">{forecastLabel(row.forecastAt)}</span>{row.speed !== undefined && <span> · {row.speed} cm/s</span>}</li>)}</ul> : '구간 내 표기 없음'}</dd></div>
      <div><dt>조회시각 (이 기기)</dt><dd className="mono">{retrievedLabel(rows[0]!.sourceTimestamp)}</dd></div>
    </dl>
    <p className="official-note">제공기관이 예측일시의 시간대(KST/UTC)를 밝히지 않아 현재 시각에 해당하는 값을 특정하지 않습니다. 어느 해석이든 현재 시각이 포함되도록 넓은 구간을 조회했습니다.</p>
    <details className="marine-evidence"><summary>근거 보기 · 조류 예측 {rows.length}개 행</summary>
      <p>출처: {rows[0]!.sourceName}</p>
      <p>공간 기준: {rows[0]!.spatialReference}</p>
      <p>유형: 예측값(실측 아님) · 예측일시 시간대: 제공기관 미명시(미확인)</p>
      <p>유향: 도(deg) 수치만 제공 · 향하는/오는 방향과 진북/자북 기준은 미확인</p>
      <p>구분 미표기: 제공기관이 해당 행의 조류 구분을 비워 보냈습니다(추정하지 않음).</p>
      <div className="marine-table-wrap"><table className="marine-table"><caption className="sr-only">조류 예측 전체 행</caption><thead><tr><th scope="col">예측일시</th><th scope="col">유속</th><th scope="col">유향 (기준 미확인)</th><th scope="col">구분</th><th scope="col">신뢰상태</th></tr></thead>
        <tbody>{rows.map((row, index) => <tr key={`${row.forecastAt}:${index}`}><td className="mono">{forecastLabel(row.forecastAt)}</td><td>{row.speed !== undefined ? `${row.speed} ${row.speedUnit}` : '미제공'}</td><td>{row.direction !== undefined ? `${row.direction}°` : '미제공'}</td><td>{row.currentType ? CURRENT_TYPE_LABEL[row.currentType] : '미표기'}</td><td><TrustBadge status={row.trustStatus} /></td></tr>)}</tbody></table></div>
    </details>
    <p className="official-note">조류 예측 데이터는 수온·파고와 별개이며, 어종별 판단 근거로 사용하지 않습니다. 출조·안전 판단을 대신하지 않습니다.</p>
  </section>
}
