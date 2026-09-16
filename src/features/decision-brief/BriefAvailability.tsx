import type { BriefCompleteness } from '../../domain/contracts'

const copy: Record<BriefCompleteness, [string, string]> = {
  COMPLETE: ['현재 데모 데이터가 모두 도착했습니다', '각 정보의 기준시각과 근거를 함께 확인할 수 있습니다.'],
  PARTIAL: ['일부 데모 정보만 확인됐습니다', '확인된 정보는 유지하고 오래됨·실패·충돌은 항목별로 표시합니다.'],
  UNAVAILABLE: ['현재 확인 가능한 데모 데이터가 없습니다', '수집 실패를 명시했으며 임의 값으로 대체하지 않았습니다.'],
}
export function BriefAvailability({ completeness }: { completeness: BriefCompleteness }) { return <div className="availability" role="status"><strong>{copy[completeness][0]}</strong>{copy[completeness][1]}</div> }
