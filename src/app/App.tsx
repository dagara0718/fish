import { useCallback, useReducer, useRef } from 'react'
import { appReducer, initialState } from './app-state'
import { createPointCatalog } from '../domain/point-resolver'
import { assembleBrief, retryFailedSlot } from '../domain/brief-assembler'
import { SYNTHETIC_POINTS } from '../data/fixture-catalog'
import { FIXTURE_NOTICE } from '../data/fixture-brief-definition'
import { retryFixtureSlot } from '../data/fixture-adapters'
import { makeBrief } from '../testing/fixtures/brief-scenarios'
import { timingPair } from '../observability/brief-timing'
import { MemoryEventSink } from '../observability/memory-event-sink'
import { SearchForm } from '../features/point-discovery/SearchForm'
import { CandidateList } from '../features/point-discovery/CandidateList'
import { StateMessage } from '../features/point-discovery/StateMessage'
import { PointIdentityHeader } from '../features/decision-brief/PointIdentityHeader'
import { BriefAvailability } from '../features/decision-brief/BriefAvailability'
import { BriefSlot } from '../features/decision-brief/BriefSlot'
import { EvidencePanel } from '../features/decision-brief/EvidencePanel'

const catalog = createPointCatalog(SYNTHETIC_POINTS)
const eventSink = new MemoryEventSink()

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const evidenceTrigger = useRef<HTMLButtonElement | null>(null)
  const selectedEvidence = state.brief?.brief.items.find((item) => item.recordId === state.evidenceRecordId)
  const search = () => dispatch({ type: 'LOOKUP_COMPLETED', result: catalog.search(state.query) })
  const select = (point: typeof SYNTHETIC_POINTS[number]) => {
    const start = performance.now(); const brief = assembleBrief(point, makeBrief(point.pointId))
    eventSink.timings.push(...timingPair(crypto.randomUUID(), start, performance.now()))
    for (const outcome of brief.brief.sourceOutcomes) eventSink.recordSource({ sourceId: outcome.sourceId, outcome: outcome.outcome, cacheUsed: outcome.cacheUsed, occurredAt: outcome.attemptedAt })
    dispatch({ type: 'POINT_SELECTED', point, brief })
  }
  const retry = async (recordId: string) => {
    if (!state.brief) return
    const brief = await retryFailedSlot(state.brief, recordId, retryFixtureSlot)
    dispatch({ type: 'BRIEF_UPDATED', brief, announcement: '실패한 합성 항목만 재시도했습니다. 기존 성공 항목은 유지됩니다.' })
  }
  const closeEvidence = useCallback(() => { dispatch({ type: 'EVIDENCE_CLOSED' }); queueMicrotask(() => evidenceTrigger.current?.focus()) }, [])
  const content = (() => {
    if (state.selected && state.brief) return <section className="panel" aria-labelledby="brief-heading"><PointIdentityHeader point={state.selected} onBack={() => dispatch({ type: 'BACK_TO_RESULTS' })} /><BriefAvailability completeness={state.brief.completeness} /><div className="slot-list">{state.brief.brief.items.map((record) => <BriefSlot key={record.recordId} record={record} onEvidence={(trigger) => { evidenceTrigger.current = trigger; dispatch({ type: 'EVIDENCE_OPENED', recordId: record.recordId }) }} onRetry={() => void retry(record.recordId)} />)}</div></section>
    return <section className="panel" aria-labelledby="search-heading"><h2 id="search-heading">지원 포인트 찾기</h2><p className="section-help">포인트명이나 합성 지역으로 검색한 뒤 후보를 직접 선택하세요.</p><SearchForm query={state.query} onQueryChange={(query) => dispatch({ type: 'QUERY_CHANGED', query })} onSearch={search} />{state.lookup?.kind === 'MATCHES' ? <CandidateList candidates={state.lookup.candidates} onSelect={select} /> : state.lookup ? <StateMessage result={state.lookup} /> : <div className="state-message"><strong>검색 예시</strong>“샘플 등대”, “캐시”, “충돌”, “전체실패”, “모호”, “카탈로그오류”를 입력해 상태를 확인하세요.</div>}</section>
  })()
  return <><a className="skip-link" href="#main">본문으로 건너뛰기</a><div className="app-shell"><header className="masthead"><span className="product-mark">POINT EVIDENCE LAB</span><span className="fixture-flag"><span aria-hidden="true">◇</span> 합성 fixture 데모</span></header><main id="main"><section className="hero"><span className="eyebrow">Search-first prototype</span><h1>포인트 정보의 근거와 불확실성을 함께 봅니다.</h1><p className="lead">지원 포인트를 명시적으로 선택하고, 각 합성 정보의 출처·시각·신뢰상태를 확인하세요. 이 도구는 출조 가능, 안전, 법적 허용 또는 추천을 판정하지 않습니다.</p></section><p className="notice"><strong>테스트 전용:</strong> {FIXTURE_NOTICE}</p><div className="workspace"><aside className="panel"><h2>이 데모가 지키는 것</h2><p className="section-help">성공 정보는 실패한 항목과 함께 남고, 오래됨·미확인·수집 실패·충돌은 확인됨으로 자동 승격되지 않습니다.</p><ul><li>동일·유사 이름 자동 선택 없음</li><li>다섯 상태를 텍스트와 아이콘으로 표시</li><li>근거 패널에서 출처·시각·상충 원본 확인</li><li>실패 항목만 범위 제한 재시도</li></ul></aside>{content}</div><p className="footer-note">OD-01~05와 OD-07은 미결정 상태입니다. 샘플 슬롯·시각·포인트·출처는 제품 정책이나 실제 공급자를 뜻하지 않습니다.</p></main><div className="sr-only" aria-live="polite" aria-atomic="true">{state.announcement}</div></div>{selectedEvidence && <EvidencePanel record={selectedEvidence} onClose={closeEvidence} />}</>
}
