import type { BriefAssemblyOutcome, FishingPoint, PointLookupResult } from '../domain/contracts'

export interface AppState { query: string; lookup?: PointLookupResult | undefined; selected?: FishingPoint | undefined; brief?: BriefAssemblyOutcome | undefined; evidenceRecordId?: string | undefined; announcement: string }
export type AppAction =
  | { type: 'QUERY_CHANGED'; query: string }
  | { type: 'LOOKUP_COMPLETED'; result: PointLookupResult }
  | { type: 'POINT_SELECTED'; point: FishingPoint; brief: BriefAssemblyOutcome }
  | { type: 'BACK_TO_RESULTS' }
  | { type: 'BRIEF_UPDATED'; brief: BriefAssemblyOutcome; announcement: string }
  | { type: 'EVIDENCE_OPENED'; recordId: string }
  | { type: 'EVIDENCE_CLOSED' }

export const initialState: AppState = { query: '', announcement: '포인트 검색을 시작할 수 있습니다.' }
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'QUERY_CHANGED': return { ...state, query: action.query }
    case 'LOOKUP_COMPLETED': return { query: state.query, lookup: action.result, announcement: action.result.kind === 'MATCHES' ? `지원 후보 ${action.result.candidates.length}개를 찾았습니다.` : '검색 결과 상태가 변경됐습니다.' }
    case 'POINT_SELECTED': return { ...state, selected: action.point, brief: action.brief, evidenceRecordId: undefined, announcement: `${action.point.name} 판단 브리프를 표시했습니다.` }
    case 'BACK_TO_RESULTS': return { ...state, selected: undefined, brief: undefined, evidenceRecordId: undefined, announcement: '검색 결과로 돌아왔습니다.' }
    case 'BRIEF_UPDATED': return { ...state, brief: action.brief, announcement: action.announcement }
    case 'EVIDENCE_OPENED': return { ...state, evidenceRecordId: action.recordId }
    case 'EVIDENCE_CLOSED': return { ...state, evidenceRecordId: undefined }
  }
}
