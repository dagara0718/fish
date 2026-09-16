import type { BriefCompleteness } from '../../domain/contracts'

const copy: Record<BriefCompleteness, [string, string]> = {
  COMPLETE: ['현재 합성 데이터가 모두 도착했습니다', '데이터 가용성 요약이며 출조·안전·법적 허용 또는 추천 판정이 아닙니다.'],
  PARTIAL: ['일부 합성 정보만 확인됐습니다', '성공한 항목은 유지하고 오래됨·실패·충돌을 각 항목에 표시합니다.'],
  UNAVAILABLE: ['현재 확인 가능한 합성 데이터가 없습니다', '수집 실패를 종료 상태로 표시했습니다. 데이터 부재를 긍정적 판단으로 해석하지 않습니다.'],
}
export function BriefAvailability({ completeness }: { completeness: BriefCompleteness }) { return <div className="availability" role="status"><strong>{copy[completeness][0]}</strong>{copy[completeness][1]}</div> }

