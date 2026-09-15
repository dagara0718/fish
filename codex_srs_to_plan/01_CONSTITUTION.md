# 01 — Constitution

/speckit-constitution

먼저 아래 문서를 읽어.

- `codex_srs_to_plan/SOURCE_SRS_낚시포인트_v1.0_승인대기.md`
- `codex_srs_to_plan/00_START_HERE.md`

현재 SRS를 기준으로 프로젝트 전체가 지켜야 할 개발 원칙을 작성해.
이 Constitution은 기능을 추가하는 문서가 아니라 SRS의 요구사항·안전규칙·검증가능성을 구현 전 과정에서 보존하는 상위 규칙이다.

다음 원칙을 반드시 포함해.

## 1. Requirement ID 추적성

- 모든 Feature, Design Decision, Plan 항목, 이후 Task/Test는 관련 SRS Requirement ID를 추적할 수 있어야 한다.
- Requirement ID의 의미를 임의로 바꾸지 않는다.
- SRS에 없는 제품 기능을 구현 편의상 추가하지 않는다.

## 2. Must/Should 경계 보존

Must:
- `REQ-FUNC-POINT-001~003`
- `REQ-FUNC-BRIEF-001~003`
- `REQ-FUNC-TRUST-001~005`

Should:
- `REQ-FUNC-COMPARE-001`
- `REQ-FUNC-ACCESS-001`

Should는 Must 구현의 선행조건으로 만들지 않는다.

## 3. 불확실성은 숨겨야 할 오류가 아니라 사용자에게 전달해야 할 상태

최소 상태 의미를 보존한다.

- CONFIRMED
- STALE
- UNVERIFIED
- COLLECTION_FAILED
- CONFLICT

검증 근거 없이 불확실 상태를 CONFIRMED로 자동 승격하지 않는다.

## 4. Provenance 보존

핵심 정보는 가능한 범위에서 다음과 추적 가능해야 한다.

- source/provenance
- basis_time 또는 checked_at
- trust_status
- source_reference 또는 확인 경로(있는 경우)

값만 남기고 근거 메타데이터를 분리·유실하지 않는다.

## 5. 안전한 부정확성 처리

- 미지원 포인트를 임의로 생성하지 않는다.
- 모호한 포인트를 자동으로 첫 결과에 연결하지 않는다.
- 정보충돌 시 임의 우선순위로 한 값을 사실로 확정하지 않는다.
- 금지/접근 데이터 부재를 `낚시 가능`의 긍정 근거로 해석하지 않는다.

## 6. Partial Failure 우선 설계

- 일부 소스 실패가 다른 성공 데이터를 제거하지 않게 한다.
- 느린 소스 하나가 전체 브리프를 무기한 차단하지 않게 한다.
- 캐시를 사용하면 오래됨/실패 상태와 시점을 숨기지 않는다.

## 7. Contract/Data First

기능 로직보다 먼저 다음 계약을 명확히 한다.

- FishingPoint
- InformationRecord
- DecisionBrief
- DataSource
- ConflictSet
- Point Lookup 계약
- Data Source Adapter 계약
- provenance/cache 계약

정확한 판단 브리프 필드 목록이 미정이므로 확장 가능한 data-driven 구조를 사용한다.

## 8. Open Decision을 코드로 굳히지 않기

다음 항목은 승인 전 하드코딩하지 않는다.

- 판단 브리프 최소 정보세트
- freshness threshold
- POC 지원 포인트셋
- 외부 API/공급자/라이선스
- KPI 목표값
- Should 활성 릴리스

UI 구조는 Design 단계에서 결정 가능하지만 제품 요구사항을 바꾸면 안 된다.

## 9. 개인정보 최소화

- 핵심 요구사항에 불필요한 개인정보를 필수 입력으로 요구하지 않는다.
- 정확 GPS는 별도 목적과 명시적 동의가 없는 MVP에서 저장하지 않는다.
- 로그/분석 이벤트에도 불필요한 개인식별정보를 넣지 않는다.

## 10. Validation/Observability

다음이 측정 가능해야 한다.

- 판단 브리프 첫 표시 시간 p50/p95 산출 가능성
- source별 최근 성공/실패 상태
- 외부 소스 호출량·실패율·캐시 활용량

목표 수치는 SRS 근거 없이 임의 생성하지 않는다.

## 11. 제한 범위 POC 우선

- 전국 실시간 수집을 선행조건으로 만들지 않는다.
- fixture/mock → 제한 포인트 POC → 실제 source adapter 순서로 확장 가능해야 한다.
- 엔터프라이즈 수준 인프라를 MVP 가치 검증 전에 과대설계하지 않는다.

## 12. Design과 Requirement 분리

- 화면 배치·탐색구조·컴포넌트는 Design 문서가 담당한다.
- Design이 SRS 요구사항을 삭제·변경하지 않는다.
- 샘플 UI 데이터는 Requirement나 실제 데이터 필드 결정으로 간주하지 않는다.

## 13. 접근성 및 상태 전달

- 핵심 흐름은 키보드와 모바일에서도 완료 가능해야 한다.
- 상태는 색상만으로 표현하지 않는다.
- 출처·시각·상태 상세는 Progressive Disclosure로 접근 가능하게 한다.

## 14. 테스트 없이 완료 금지

- Acceptance Criteria와 Verification Method가 있는 요구사항은 이후 Test/Task에서 추적되어야 한다.
- 정상 흐름만 테스트하지 않는다.
- 미지원, 모호함, 부분 데이터, 오래됨, 수집실패, 정보충돌, 규제 데이터 부재를 반드시 검증한다.

## 15. 문서 충돌 처리

- 제품 범위 변경이 필요하면 SRS만 임의 수정하지 않는다.
- 소프트웨어 동작 보완은 SRS 변경 필요 여부를 기록한다.
- 기술 선택은 Architecture/Plan에 남긴다.
- Design 선택은 DESIGN 문서에 남긴다.
- 서로 다른 계층의 결정을 한 문서가 대신하지 않는다.

각 원칙에 다음을 포함해.

- 원칙 이름
- 강제 규칙
- 이유
- 검토 기준
- 위반 시 처리
- 관련 Requirement ID 또는 SRS 섹션

작성 후 SRS와 대조해서 모순을 스스로 수정해.

완료되면 `codex_srs_to_plan/02_SPECIFY.md`를 읽고 이어서 진행해.
