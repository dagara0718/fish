import type { PointLookupResult } from '../../domain/contracts'

export function StateMessage({ result }: { result: Exclude<PointLookupResult, { kind: 'MATCHES' }> }) {
  const content = result.kind === 'NO_MATCH'
    ? ['미지원 포인트', '지원되는 데모 포인트를 찾지 못했습니다. 임의 포인트나 판단 브리프를 만들지 않습니다.']
    : result.kind === 'AMBIGUOUS'
      ? ['포인트 식별이 모호합니다', `${result.missingContext} 명시적 선택 전에는 브리프를 만들지 않습니다.`]
      : ['카탈로그를 사용할 수 없습니다', '지원 여부를 추정하지 않습니다. 잠시 후 합성 카탈로그 검색을 다시 시도하세요.']
  return <div className="state-message" role="status"><strong>{content[0]}</strong>{content[1]}</div>
}
