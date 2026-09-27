import type { NearbyComparison } from '../../official-index/nearby-comparison'
import { TrustBadge } from '../decision-brief/TrustBadge'

// v1.6.4 (REQ-FUNC-NEARBY-002~003): read-only comparison of nearby official points. Wording never
// claims a value for the clicked location, a probability, a recommendation or a ranking.
export function NearbyComparisonPanel({ comparison }: { comparison: NearbyComparison }) {
  const loaded = comparison.points.filter(point => !point.failed)
  return <section className="nearby-comparison" aria-labelledby="nearby-heading">
    <div className="section-title-row"><div><p className="section-kicker">NEARBY OFFICIAL POINTS</p><h3 id="nearby-heading">주변 공식 기준 포인트 지수 비교</h3><p>선택 위치 자체의 값이 아닙니다. 15 km 이내 가까운 공식 기준 포인트 {comparison.points.length}곳의 공식 바다낚시지수(낚시 여건 등급)를 나란히 보여줍니다. 어종 출현·조과 확률이 아닙니다.</p></div><div className="marine-badges">{comparison.trustStatuses.map(status => <TrustBadge key={status} status={status} />)}</div></div>
    <ul className="nearby-points">{comparison.points.map(point => <li key={point.placeName + point.distanceKm}><strong>{point.placeName}</strong> <span className="mono">{point.distanceKm.toFixed(1)} km</span>{point.failed && <span> · 공식 데이터 확인 실패</span>}</li>)}</ul>
    {!comparison.slot || comparison.species.length === 0
      ? <div className="inline-state"><strong>비교할 공식 지수가 없습니다</strong><p>주변 포인트의 공식 데이터를 확인하지 못했습니다. 후보를 직접 선택해 확인해 주세요.</p></div>
      : <>
        <p className="official-note">비교 기준 예보: <span className="mono">{comparison.slot}</span> · 같은 시각의 공식 등급만 비교합니다. 데이터를 받은 {loaded.length}곳 기준입니다.</p>
        <ul className="nearby-species">{comparison.species.map(row => <li key={row.speciesName}><strong>{row.speciesName}</strong><span>{row.gradeCounts.map(item => `${item.grade} ${item.count}곳`).join(' · ')}{row.cells.some(cell => !cell.grade && !cell.failed) ? ` · 값 없음 ${row.cells.filter(cell => !cell.grade && !cell.failed).length}곳` : ''}</span></li>)}</ul>
        <details className="marine-evidence"><summary>근거 보기 · 포인트별 공식 등급</summary>
          <p>출처: 국립해양조사원 · 바다낚시지수 · 각 공식 기준 포인트의 예보값</p>
          <div className="marine-table-wrap"><table className="marine-table"><caption className="sr-only">어종별 · 포인트별 공식 등급</caption>
            <thead><tr><th scope="col">어종</th>{comparison.points.map(point => <th scope="col" key={point.placeName + point.distanceKm}>{point.placeName} ({point.distanceKm.toFixed(1)} km)</th>)}</tr></thead>
            <tbody>{comparison.species.map(row => <tr key={row.speciesName}><th scope="row">{row.speciesName}</th>{row.cells.map(cell => <td key={cell.placeName + cell.distanceKm}>{cell.grade ? <>{cell.grade} {cell.trustStatus && <TrustBadge status={cell.trustStatus} />}</> : cell.failed ? '확인 실패' : '값 없음'}</td>)}</tr>)}</tbody>
          </table></div>
        </details>
      </>}
    <p className="official-note">정확한 정보는 후보 포인트를 직접 선택해 확인하세요. 공식 등급은 출조·안전·허용 판단을 대신하지 않습니다.</p>
  </section>
}
