import { useCallback, useReducer, useRef, useState } from 'react'
import { appReducer, initialState } from './app-state'
import { createPointCatalog } from '../domain/point-resolver'
import { assembleBrief, retryFailedSlot } from '../domain/brief-assembler'
import { SYNTHETIC_POINTS } from '../data/fixture-catalog'
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
import { OfficialIndexPanel } from '../features/official-index/OfficialIndexPanel'
import { UseCurrentLocation } from '../features/official-index/UseCurrentLocation'
import { getDemoOfficialIndex } from '../official-index/demo-provider'
import type { LocationCandidate } from '../official-index/contracts'

const catalog = createPointCatalog(SYNTHETIC_POINTS)
const eventSink = new MemoryEventSink()
const examples = [{ label: '샘플 등대', query: '샘플 등대' }, { label: '부분 데이터', query: '샘플 등대' }, { label: '정보충돌', query: '충돌' }]

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const [helpOpen, setHelpOpen] = useState(false)
  const evidenceTrigger = useRef<HTMLButtonElement | null>(null)
  const selectedEvidence = state.brief?.brief.items.find((item) => item.recordId === state.evidenceRecordId)
  const runSearch = (query = state.query) => { if (query !== state.query) dispatch({ type: 'QUERY_CHANGED', query }); dispatch({ type: 'LOOKUP_COMPLETED', result: catalog.search(query) }) }
  const select = (point: typeof SYNTHETIC_POINTS[number]) => {
    const start = performance.now(); const brief = assembleBrief(point, makeBrief(point.pointId))
    eventSink.timings.push(...timingPair(crypto.randomUUID(), start, performance.now()))
    for (const outcome of brief.brief.sourceOutcomes) eventSink.recordSource({ sourceId: outcome.sourceId, outcome: outcome.outcome, cacheUsed: outcome.cacheUsed, occurredAt: outcome.attemptedAt })
    dispatch({ type: 'POINT_SELECTED', point, brief })
  }
  const selectLocationCandidate = (candidate: LocationCandidate) => {
    const point = SYNTHETIC_POINTS.find((item) => item.pointId === candidate.point.linkedPointId)
    if (point) select(point)
  }
  const retry = async (recordId: string) => {
    if (!state.brief) return
    const brief = await retryFailedSlot(state.brief, recordId, retryFixtureSlot)
    dispatch({ type: 'BRIEF_UPDATED', brief, announcement: '실패한 데모 항목만 재시도했습니다. 기존 성공 항목은 유지됩니다.' })
  }
  const closeEvidence = useCallback(() => { dispatch({ type: 'EVIDENCE_CLOSED' }); queueMicrotask(() => evidenceTrigger.current?.focus()) }, [])
  const candidates = state.lookup?.kind === 'MATCHES' ? state.lookup.candidates : []

  return <>
    <a className="skip-link" href="#main">본문으로 건너뛰기</a>
    <div className="app-shell">
      <header className="product-header">
        <div className="brand"><span className="brand-symbol" aria-hidden="true">◎</span><span>포인트 판단</span></div>
        <div className="header-tools"><span className="demo-badge">DEMO DATA</span><button type="button" className="header-help" onClick={() => setHelpOpen((value) => !value)} aria-expanded={helpOpen}>데이터 안내</button></div>
      </header>
      {helpOpen && <div className="demo-disclosure" role="status"><strong>기능 시연용 데이터</strong><span>화면의 포인트와 값은 합성 예시입니다. 공식 API 계약을 따르는 UI이지만 live 데이터가 아닙니다.</span></div>}
      <main id="main">
        <section className="search-surface" aria-labelledby="search-heading">
          <div className="search-copy"><p className="section-kicker">POINT SEARCH</p><h1 id="search-heading">어디로 출조할 예정인가요?</h1><p>포인트명이나 지역을 검색하고, 확인 가능한 정보와 근거를 살펴보세요.</p></div>
          <div className="search-actions"><SearchForm query={state.query} onQueryChange={(query) => dispatch({ type: 'QUERY_CHANGED', query })} onSearch={() => runSearch()} /><UseCurrentLocation onCandidates={() => undefined} onSelect={selectLocationCandidate} /></div>
          <div className="example-row"><span>DEMO 예시</span>{examples.map((example) => <button type="button" key={example.label} onClick={() => runSearch(example.query)}>{example.label}</button>)}</div>
        </section>

        <div className="product-workspace">
          <aside className="discovery-panel" aria-labelledby="candidate-heading">
            <div className="panel-heading"><div><p className="section-kicker">DISCOVERY</p><h2 id="candidate-heading">후보 포인트</h2></div>{candidates.length > 0 && <span className="count-badge">{candidates.length}</span>}</div>
            {state.lookup?.kind === 'MATCHES' ? <CandidateList candidates={state.lookup.candidates} selectedPointId={state.selected?.pointId} onSelect={select} /> : state.lookup ? <StateMessage result={state.lookup} /> : <div className="empty-discovery"><span aria-hidden="true">⌕</span><strong>포인트를 검색하세요</strong><p>검색 결과에서 지역과 유형을 비교한 뒤 직접 선택할 수 있습니다.</p></div>}
            <details className="qa-disclosure"><summary>테스트 시나리오</summary><p>품질 검증용: 캐시, 전체실패, 모호, 카탈로그오류</p></details>
          </aside>

          <section className="brief-panel" aria-label="선택한 포인트 판단 브리프">
            {state.selected && state.brief ? <>
              <PointIdentityHeader point={state.selected} onBack={() => dispatch({ type: 'BACK_TO_RESULTS' })} generatedAt={state.brief.brief.generatedAt} />
              <BriefAvailability completeness={state.brief.completeness} />
              <section className="brief-section" aria-labelledby="available-info-heading"><div className="section-title-row"><div><p className="section-kicker">AVAILABLE DATA</p><h3 id="available-info-heading">현재 확인 가능한 정보</h3></div></div><div className="slot-list">{state.brief.brief.items.map((record) => <BriefSlot key={record.recordId} record={record} onEvidence={(trigger) => { evidenceTrigger.current = trigger; dispatch({ type: 'EVIDENCE_OPENED', recordId: record.recordId }) }} onRetry={() => void retry(record.recordId)} />)}</div></section>
              <OfficialIndexPanel result={getDemoOfficialIndex(state.selected.pointId)} />
            </> : <div className="brief-empty"><div className="brief-empty-visual" aria-hidden="true"><span>01</span><i></i><span>02</span><i></i><span>03</span></div><p className="section-kicker">DECISION BRIEF</p><h2>포인트를 선택하면 판단 정보가 여기에 표시됩니다.</h2><p>데이터 상태, 기준시각, 출처와 어종별 공식 바다낚시지수 구조를 한 화면에서 확인할 수 있습니다.</p><div className="empty-features"><span>상태와 기준시각</span><span>출처와 근거</span><span>공식 지수 구조</span></div></div>}
          </section>
        </div>
        <footer className="product-footer"><span>본 서비스는 데이터 근거를 제공하며 출조 여부나 안전·법적 허용을 판정하지 않습니다.</span><span>국립해양조사원 API 스키마 기반 데모</span></footer>
      </main>
      <div className="sr-only" aria-live="polite" aria-atomic="true">{state.announcement}</div>
    </div>
    {selectedEvidence && <EvidencePanel record={selectedEvidence} onClose={closeEvidence} />}
  </>
}
