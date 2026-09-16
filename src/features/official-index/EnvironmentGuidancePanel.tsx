import type { EnvironmentBasedSpeciesGuidance, FactorResultStatus, SuitabilityLevel } from '../../species-guidance/contracts'
import { TrustBadge } from '../decision-brief/TrustBadge'

const suitabilityLabel: Record<SuitabilityLevel, string> = { HIGH: '높음', MODERATE: '보통', LOW: '낮음', INSUFFICIENT_EVIDENCE: '판단 근거 부족' }
const suitabilityRank: Record<SuitabilityLevel, number> = { HIGH: 0, MODERATE: 1, LOW: 2, INSUFFICIENT_EVIDENCE: 3 }
const factorIcon: Record<FactorResultStatus, string> = { MATCH: '✓', PARTIAL_MATCH: '△', MISMATCH: '✕', UNKNOWN: '?' }
const factorStatusLabel: Record<FactorResultStatus, string> = { MATCH: '부합', PARTIAL_MATCH: '일부 부합', MISMATCH: '불일치', UNKNOWN: '근거 없음' }

export function EnvironmentGuidancePanel({ guidance }: { guidance: EnvironmentBasedSpeciesGuidance[] }) {
  if (guidance.length === 0) return null
  const sorted = [...guidance].sort((a, b) => suitabilityRank[a.suitability] - suitabilityRank[b.suitability])
  return <section className="guidance-section" aria-labelledby="guidance-heading">
    <div className="section-title-row"><div><p className="section-kicker">ENVIRONMENT GUIDANCE</p><h3 id="guidance-heading">환경 기반 예상어종</h3><p>현재 환경 관측값과 어종별로 문서화된 생태 특성을 비교한 결과입니다. 국립해양조사원 공식 바다낚시지수와는 별도의 판단입니다.</p></div></div>
    <ul className="guidance-summary" aria-label="환경 적합도 상위 어종">{sorted.slice(0, 3).map(item => <li key={item.speciesId}>{item.speciesName} · 환경 적합도 {suitabilityLabel[item.suitability]}</li>)}</ul>
    <div className="guidance-grid">{guidance.map(item => <article className="guidance-card" key={item.speciesId}>
      <div className="guidance-top"><h4>{item.speciesName}</h4><span className="suitability-badge" data-level={item.suitability}>환경 적합도 {suitabilityLabel[item.suitability]}</span></div>
      <TrustBadge status={item.trustStatus} />
      <details><summary>왜 이렇게 판단했나요?</summary><ul className="factor-list">{item.factors.map(factor => <li key={factor.factor} data-status={factor.status}><span aria-hidden="true">{factorIcon[factor.status]}</span><span>{factor.label} — {factorStatusLabel[factor.status]}. {factor.detail}</span></li>)}</ul></details>
    </article>)}</div>
    <p className="guidance-note">해류 방향 데이터는 현재 판단에 포함되지 않았습니다. 이 판단은 어종별로 문서화된 생태 특성과 현재 환경 관측값을 비교한 결과이며, 출조 결정이나 조과를 보장하지 않습니다.</p>
  </section>
}
