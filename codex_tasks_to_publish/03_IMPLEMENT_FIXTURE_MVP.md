# 03 — /speckit-implement: Fixture MVP

`/speckit-implement`를 실행하되 이번 실행에서 **fixture 기반 MVP와 core validation까지만 구현**한다.

## 구현 범위

Tasks의 Phase 1~4를 우선 완료하고, Phase 6의 자동 테스트 기반도 함께 구축한다.

반드시 구현:
- React/Vite/TypeScript 프로젝트
- Base Design 토큰 반영 CSS
- synthetic point fixtures
- fake source adapters
- point search / candidate disambiguation
- explicit point selection
- unsupported / ambiguous / catalog unavailable
- DecisionBrief partial-first assembly
- Trust Status: CONFIRMED / STALE / UNVERIFIED / COLLECTION_FAILED / CONFLICT
- source/time/status 표시
- evidence detail
- stale cache / refresh failure
- conflict detail preserving competing evidence
- failed slot retry
- Search-first responsive UI
- keyboard/focus/non-color status
- reduced-motion support

금지:
- live API
- 실제 기관/Provider 선택
- real POC point 확정
- production freshness threshold 숫자 확정
- DB/backend/login/map SDK/GPS
- recommendation / fishing-permission claim
- FR-03 / FR-05 구현

## Fixture 콘텐츠 규칙

- 실제 장소/기관으로 오해하기 쉬운 데이터는 피하고 `샘플`, `테스트`, `synthetic`임을 명시한다.
- 정보 슬롯 종류는 OD-01을 확정하지 않도록 layout 검증용 generic fixture로 둔다.
- freshness boundary 숫자는 test-only symbolic 값으로만 사용하고 production policy로 노출하지 않는다.

## 구현 완료 후 보고

1. 완료 Task ID
2. 미완료/Blocked Task ID
3. 생성한 주요 source/component 파일
4. Requirement ID별 구현 위치
5. Design과 다르게 구현된 부분
6. Open Decision을 건드리지 않았는지
7. lint/test/build의 현재 상태

구현 후 바로 배포하지 말고 `04_DESIGN_REVIEW.md`로 이동한다.
