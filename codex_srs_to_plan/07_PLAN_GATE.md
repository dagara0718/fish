# 07 — Plan Gate / 종료 검토

## 목적

Plan을 실제 구현으로 넘기기 전에 SRS, Spec, Clarification, Design, Plan 사이의 누락·충돌·범위확장을 검토한다.
이 단계에서는 코드를 구현하지 않는다.

## 입력

- SRS Working SSOT
- constitution
- spec.md
- clarifications
- design-brief.md
- stitch-review.md
- 프로젝트 루트 `DESIGN.md`
- Feature의 `DESIGN_DECISIONS.md`
- plan.md

## 검토표

다음 표를 작성해.

| 심각도 | 위치 | 문제 | 관련 SRS Requirement/Open Decision | 수정 대상 | 처리 결과 |
|---|---|---|---|---|---|

심각도:
- CRITICAL
- HIGH
- MEDIUM
- LOW

## 반드시 검사할 22개 항목

1. Must Requirement가 spec과 plan에서 모두 추적되는가
2. Should가 Must처럼 구현 선행조건이 되지 않았는가
3. 미지원 포인트가 임의 매칭되는 설계가 없는가
4. 동일명/유사명 구분이 빠지지 않았는가
5. partial data를 전체 실패로 처리하지 않는가
6. stale cache를 최신 CONFIRMED처럼 취급하지 않는가
7. source/time/status가 데이터 계약에 남아 있는가
8. freshness threshold 숫자를 근거 없이 만들지 않았는가
9. information field 목록을 샘플 UI에서 실제 계약으로 확정하지 않았는가
10. CONFLICT를 임의 단일 사실로 합치지 않는가
11. 불확실 상태 자동 CONFIRMED 전이가 없는가
12. 규제/접근 데이터 부재를 낚시 가능으로 해석하지 않는가
13. 정확 GPS 저장이 기본 요구사항이 되지 않았는가
14. 외부 provider/API를 승인 없이 확정하지 않았는가
15. 전국 실시간 수집을 선행하지 않는가
16. Stitch/Design 선택이 SRS 범위를 변경하지 않았는가
17. 프로젝트 루트 `DESIGN.md`가 수정되지 않았는가
18. `DESIGN_DECISIONS.md`가 `DESIGN.md`와 SRS의 역할을 분리해 기록했는가
19. UI 상태가 색상만으로 전달되지 않는가
20. 모바일/키보드 접근성이 Plan에 반영되는가
21. SRS Test Case/Verification과 Plan 테스트 전략이 연결되는가
22. OD-01~05, OD-07이 여전히 올바른 단계에서 TBD/Blocked로 관리되는가

## 수정 규칙

CRITICAL/HIGH 문제가 있으면 원인이 있는 하위 문서를 수정해.

- Design 문제 → `DESIGN_DECISIONS.md`/stitch-review 수정 (`DESIGN.md`는 수정 금지)
- Feature 표현 문제 → spec/clarification 수정
- 기술 구조 문제 → plan 수정
- SRS 자체 정책 변경이 필요해 보이면 SRS를 임의 수정하지 말고 `SRS_CHANGE_REQUIRED`로 보고

수정 후 검토를 한 번 더 수행해.

## 통과 기준

다음을 모두 만족하면 `PLAN_READY_WITH_OPEN_DECISIONS`로 판정해.

- CRITICAL 0
- HIGH 0
- Must 누락 0
- SRS 범위확장 0
- 안전 규칙 위반 0
- Open Decision이 명시적으로 추적됨
- 실제 구현은 시작하지 않음

Open Decision이 존재하므로 `IMPLEMENTATION_FULLY_UNBLOCKED`로 표현하지 않는다.
Phase 1 fixture 기반 구현과 실제 외부데이터 POC가 서로 다른 Gate임을 구분한다.

## 최종 보고 후 STOP

사용자에게 다음을 보고하고 반드시 멈춘다.

1. 생성/수정 파일 목록
2. Spec Feature 위치
3. Clarification/Open Decision 목록
4. Stitch 사용 여부
5. 선택된 UI 구조와 이유
6. Base `DESIGN.md` 위치와 Feature `DESIGN_DECISIONS.md` 위치
7. Plan 위치
8. Plan Phase 요약
9. 구현 가능한 범위와 Open Decision 때문에 차단된 범위
10. 다음 권장 단계

다음 명령은 실행하지 않는다.

- `/speckit-tasks`
- `/speckit-analyze`
- `/speckit-implement`
