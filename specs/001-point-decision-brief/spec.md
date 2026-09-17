# Feature Specification: 신뢰상태 기반 낚시 포인트 판단 브리프

**Feature Branch**: `main`

**Created**: 2026-09-16

**Status**: Draft — SRS Baseline Candidate 기반, 사람 승인 전

**Input**: 지원 포인트를 식별하고 현재 사용 가능한 판단정보를 신뢰상태와 함께 제공하며,
불확실하거나 충돌하는 정보를 확정된 사실처럼 승격하지 않는 핵심 의사결정 흐름

## Clarifications

### Session 2026-09-16

사용자 응답이 필요한 질문은 없었다. SRS로 답할 수 있는 항목은 아래와 같이 고정하고,
근거가 없는 제품·수치·공급자·릴리스 결정은 명시적으로 열어 두었다.

| ID | 질문/모호성 | 분류 | 현재 처리 | 다음 결정 시점 | 근거 |
|---|---|---|---|---|---|
| OD-01 | 판단 브리프의 최소 정보세트는 무엇인가 | `PRODUCT_DECISION_REQUIRED` | 정확한 `info_type` 목록을 만들지 않고 가변 정보 슬롯으로 표현 | 제품 담당의 프로토타입 가설 승인 후, 구현 전 | SRS BRIEF-001, Open Decisions |
| OD-02 | 데이터 유형별 freshness threshold는 얼마인가 | `PRODUCT_DECISION_REQUIRED` | 수치는 `TBD`; 정책 경계만 계획 가능 | 데이터 특성·POC 근거 승인 후, 경계 테스트 전 | SRS TRUST-002, NFR-PERF-002 |
| OD-03 | 초기 POC 지원 포인트셋은 어디인가 | `PRODUCT_DECISION_REQUIRED` | 실제 지역·포인트를 확정하지 않고 fixture 기반 샘플만 허용 | POC 운영 범위 승인 후 | SRS Assumptions, Open Decisions |
| OD-04 | 어떤 외부 공급자/API/라이선스를 쓰는가 | `PARTIALLY_RESOLVED_V1.1` | 국립해양조사원 바다낚시지수 계약·라이선스는 사용자 승인; live proxy 공급자/계정/secret 운영은 TBD | live 운영 승인 및 Architecture/ADR 시 | v1.1 user approval, official catalog 15142486 |
| OD-05 | KPI 정량 목표는 얼마인가 | `DEFERRED_VALIDATION` | 계측 가능성만 요구하고 목표는 `TBD_AFTER_BASELINE` | baseline 측정 후 PRD 승인 시 | SRS NFR-PERF-001, Review |
| OD-06 | 지도/검색/목록 중 어떤 UI 구조를 쓰는가 | `DESIGN_DECISION` | Search-first, Map-first, Hybrid를 다음 단계에서 비교 | Stitch/텍스트 와이어프레임 평가 시 | SRS Constraints, Open Decisions |
| OD-07 | FR-03/FR-05는 어느 릴리스에서 활성화하는가 | `PRODUCT_DECISION_REQUIRED` | Should/Deferred로 유지하고 P1 의존성에서 제외 | 가치·운영 검증 후 PRD 승인 시 | SRS MVP Baseline |
| CL-01 | 로그인/회원계정이 Must 전제인가 | `RESOLVED_FROM_SRS` | 필수 인증을 가정하지 않는다 | SRS 변경 시에만 재검토 | SRS IF-POINT-LOOKUP |
| CL-02 | 탐색 UI가 지도 기술과 결합되는가 | `DESIGN_DECISION` | UI 구조와 외부 지도 채택을 분리하고 특정 SDK를 전제하지 않는다 | OD-06 결정 및 별도 Architecture 검토 시 | SRS Constraints, Constitution XII |
| CL-03 | DecisionBrief가 추천점수나 “갈만함” 결론을 내는가 | `RESOLVED_FROM_SRS` | 생성하지 않는다 | 제품 범위 변경 시 PRD부터 재검토 | SRS BRIEF-001 |
| CL-04 | `overall_data_state`가 출조·법적 가능 판정인가 | `RESOLVED_FROM_SRS` | 의미 승인 전 사용하지 않으며 비판정형 데이터 가용성 요약만 계획 가능 | OD-01 승인 또는 SRS 변경 시 | SRS DecisionBrief entity, TRUST-005 |
| CL-05 | 부분 데이터가 전체 오류로 차단되는가 | `RESOLVED_FROM_SRS` | 성공 항목을 유지하고 실패 항목만 별도 상태로 표시 | 변경 없음 | SRS BRIEF-002 |
| CL-06 | `STALE`과 `COLLECTION_FAILED`는 같은 상태인가 | `RESOLVED_FROM_SRS` | 오래됨과 수집 시도 실패를 분리하며 캐시 레코드에는 관련 메타데이터를 함께 보존 | 변경 없음 | SRS trust state rules, BRIEF-003 |
| CL-07 | source/time/status가 상세 UI에서 사라져도 되는가 | `RESOLVED_FROM_SRS` | 핵심 값과 추적 가능하게 유지하고 Progressive Disclosure로 접근 가능하게 한다 | 변경 없음 | SRS TRUST-001, Constitution XIII |
| CL-08 | 정확 GPS를 기본 저장하는가 | `RESOLVED_FROM_SRS` | 저장하지 않는다 | 별도 목적·명시적 동의 승인 시에만 재검토 | SRS NFR-PRIV-002 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 올바른 지원 포인트 찾기 (Priority: P1)

낯선 육상 바다낚시 포인트를 알아보는 사용자는 포인트명, 지역 또는 지원 식별정보로
후보를 찾고, 같은 이름이나 비슷한 이름이 있을 때 지역과 유형 맥락을 보고 올바른 지원
포인트를 직접 선택한다. 시스템은 미지원 또는 식별 불가능한 입력을 임의의 포인트에
연결하지 않는다.

**Why this priority**: 판단 대상이 정확히 식별되지 않으면 뒤의 모든 정보가 다른 장소의
사실처럼 오인될 수 있으므로 핵심 의사결정 흐름의 진입 조건이다.

**Independent Test**: 지원, 동일명, 미지원, 모호한 포인트 fixture로 조회하여 후보와
구분정보가 표시되고 미지원·모호 입력에서 정상 브리프가 생성되지 않음을 검증한다.

**Source Requirements**: `REQ-FUNC-POINT-001`, `REQ-FUNC-POINT-002`,
`REQ-FUNC-POINT-003`

**Acceptance Scenarios**:

1. **Given** 지원 카탈로그에 식별 가능한 포인트가 있을 때, **When** 사용자가 포인트명,
   지역 또는 지원 식별정보로 조회하면, **Then** 지원 포인트 후보를 확인하고 선택할 수 있다.
2. **Given** 동일·유사 명칭 후보가 둘 이상일 때, **When** 결과가 표시되면, **Then** 각 후보에
   지역·유형 등 구분 맥락이 보이며 첫 후보로 자동 확정되지 않는다.
3. **Given** 입력이 지원 범위 밖일 때, **When** 사용자가 조회하거나 상세 판단을 요청하면,
   **Then** 미지원 상태가 명시되고 임의 포인트나 판단정보가 생성되지 않는다.
4. **Given** 후보를 구분할 맥락이 부족할 때, **When** 사용자가 조회하면, **Then** 식별 모호
   상태가 표시되고 사용자의 명시적 선택 전에는 브리프가 열리지 않는다.
5. **Given** 포인트 카탈로그를 사용할 수 없을 때, **When** 조회를 시도하면, **Then** 조회 실패가
   명시되고 과거 또는 추정 후보가 정상 결과로 제시되지 않는다.

---

### User Story 2 - 현재 가능한 판단정보 보기 (Priority: P1)

사용자는 선택한 지원 포인트에서 현재 제공 가능한 정보 항목들을 하나의 판단 브리프에서
본다. 일부 항목이 실패하거나 오래된 캐시만 있어도 성공한 항목은 유지되고, 실패·오래됨·
데이터 없음은 각각 숨김 없이 표시된다. 정보 항목의 최종 종류와 최소 세트는 아직 확정하지
않으며 브리프는 데이터 기반 정보 항목 슬롯의 집합으로 정의한다.

**Why this priority**: 흩어진 정보를 한 판단 단위로 확인하는 것이 Must 가치이며, 부분 실패를
정직하게 유지해야 실제 이용 상황에서 브리프가 유용하다.

**Independent Test**: 정상, 부분 성공, 소스 실패, 캐시 있음/없음, 전체 실패 fixture로 브리프를
요청하여 성공 데이터와 각 실패 상태가 동시에 보존되는지 검증한다.

**Source Requirements**: `REQ-FUNC-BRIEF-001`, `REQ-FUNC-BRIEF-002`,
`REQ-FUNC-BRIEF-003`, `REQ-NFR-PERF-002`, `REQ-NFR-AVAIL-001`

**Acceptance Scenarios**:

1. **Given** 지원 포인트와 사용 가능한 정보가 있을 때, **When** 사용자가 포인트를 선택하면,
   **Then** 현재 제공 가능한 정보 항목과 각 항목의 신뢰상태가 한 브리프로 표시된다.
2. **Given** 하나 이상의 소스는 성공하고 다른 소스는 실패했을 때, **When** 브리프가 표시되면,
   **Then** 성공한 항목은 유지되고 실패한 항목은 별도 상태로 식별된다.
3. **Given** 최신 수집은 실패했지만 과거 캐시가 있을 때, **When** 브리프가 표시되면, **Then**
   캐시 값은 기준시각 또는 최근 확인일과 오래됨/수집실패 의미를 함께 보여준다.
4. **Given** 수집이 실패하고 캐시도 없을 때, **When** 브리프가 표시되면, **Then** 데이터가 없는
   항목은 미확인 또는 수집실패로 나타나며 임의 값으로 채워지지 않는다.
5. **Given** 모든 정보 소스가 실패했을 때, **When** 요청이 종료되면, **Then** 전체 데이터 이용
   불가 상태와 가능한 재시도 행동이 표시되고 빈 화면이나 무기한 로딩으로 남지 않는다.
6. **Given** 한 소스가 응답하지 않을 때, **When** 다른 소스의 결과가 준비되면, **Then** 성공한
   정보가 먼저 제공되고 느린 소스는 정해질 종료 정책에 따라 실패/미확인으로 귀결된다.

---

### User Story 3 - 정보의 신뢰상태와 근거 이해하기 (Priority: P1)

사용자는 각 정보 항목이 확인됨, 오래됨, 미확인, 수집실패, 정보충돌 중 어떤 상태인지
구분하고, 출처와 기준시각 또는 최근 확인일, 가능한 원문·확인 경로를 열어 판단 근거를
살핀다. 시스템은 충돌을 하나의 사실로 합치거나 규제·접근 데이터의 부재를 낚시 가능의
근거로 해석하지 않는다.

**Why this priority**: 정보의 양보다 불확실성을 오해하지 않는 것이 이 기능의 안전성과
사용자 신뢰를 결정한다.

**Independent Test**: 다섯 신뢰상태와 근거 누락, 상충 소스, 규제 데이터 0건 fixture를 통해
상태·출처·시점·확인 경로가 올바르게 표현되고 금지된 추론이 발생하지 않음을 검증한다.

**Source Requirements**: `REQ-FUNC-TRUST-001` through `REQ-FUNC-TRUST-005`,
`REQ-NFR-DATA-001`, `REQ-NFR-DATA-002`

**Acceptance Scenarios**:

1. **Given** 핵심 정보 항목이 표시될 때, **When** 사용자가 상태 또는 상세 근거를 확인하면,
   **Then** 출처, 기준시각 또는 최근 확인일, 신뢰상태와 가능한 확인 경로를 연결해 볼 수 있다.
2. **Given** 데이터가 최신성 임계값을 넘었을 때, **When** 상태가 계산되면, **Then** 항목은
   `STALE`이며 `CONFIRMED` 최신정보처럼 표시되지 않는다.
3. **Given** 최신성 정책 또는 시간 근거가 없을 때, **When** 상태가 계산되면, **Then** 임의의
   임계값을 적용하지 않고 `UNVERIFIED` 또는 확인 필요 의미를 유지한다.
4. **Given** 신뢰 가능한 두 소스가 같은 항목에 상충하는 값을 제공할 때, **When** 검증 가능한
   단일 결론이 없으면, **Then** `CONFLICT`와 각 근거가 보이며 임의 승자가 선택되지 않는다.
5. **Given** 불확실 상태인 항목에 새 검증 근거가 없을 때, **When** 시간이 지나거나 시스템이
   재시작되거나 캐시가 조회되면, **Then** 상태는 `CONFIRMED`로 승격되지 않는다.
6. **Given** 규제 또는 접근 근거 레코드가 없을 때, **When** 사용자가 상태를 확인하면, **Then**
   확인 필요 의미가 표시되고 “낚시 가능”, “문제없음”, “법적으로 가능”으로 결론나지 않는다.

### Deferred User Stories *(Should, not a P1 prerequisite)*

- **후보 포인트 비교**: 활성 릴리스가 승인된 경우 2~3개 지원 포인트를 같은 기준으로 비교하되,
  데이터 부족을 낮은 점수로 오해시키지 않는다. `REQ-FUNC-COMPARE-001`, OD-07.
- **접근·통제 근거 확인**: 활성 릴리스가 승인된 경우 확인 가능한 근거가 있는 상태만 표시하며,
  근거 부족은 확인 필요로 표현한다. `REQ-FUNC-ACCESS-001`, OD-07.

### Interaction State Model

| 상태 | 사용자가 보는 것 | 허용되는 행동 | 시스템이 하지 말아야 할 것 | Source Requirement |
|---|---|---|---|---|
| 선택 전 | 검색 입력과 지원 범위 안내 | 검색어 입력, 지원 후보 탐색 | 임의 위치나 포인트 선결정 | `REQ-FUNC-POINT-001` |
| 검색/조회 중 | 진행 중 표시와 입력 맥락 | 취소 또는 결과 대기 | 과거 결과를 새 결과처럼 표시 | `REQ-FUNC-POINT-001` |
| 지원 포인트 정상 식별 | 이름, 지역, 유형 등 구분정보 | 명시적으로 선택 | 선택 전 브리프 자동 생성 | `REQ-FUNC-POINT-001` |
| 동일·유사 명칭 복수 후보 | 후보별 구분 맥락 | 후보 비교 후 하나 선택 | 첫 후보 자동 확정 | `REQ-FUNC-POINT-002` |
| 미지원 포인트 | 지원되지 않음과 가능한 재검색 | 입력 수정, 재검색 | 추정 포인트·브리프 생성 | `REQ-FUNC-POINT-003` |
| 포인트 식별 모호 | 구분정보 부족과 선택 보류 | 입력 보완, 재검색 | 불충분한 맥락으로 확정 | `REQ-FUNC-POINT-002`, `003` |
| 브리프 로딩 | 선택 포인트와 진행 상태 | 취소 또는 대기 | 느린 소스로 무기한 차단 | `REQ-NFR-PERF-002` |
| 정상 데이터 | 정보 항목과 `CONFIRMED` 근거 | 상세 근거 열기 | 근거 없는 항목을 확인됨 처리 | `REQ-FUNC-TRUST-001` |
| 부분 데이터 | 성공 항목과 누락/실패 항목 | 성공 정보 확인, 실패 상세·재시도 | 전체 브리프 숨김 | `REQ-FUNC-BRIEF-002` |
| 캐시 + 오래됨 | 과거 값, 시점, 오래됨/실패 표시 | 근거 확인, 허용 시 재시도 | 실시간 최신값처럼 표현 | `REQ-FUNC-BRIEF-003` |
| 미확인 | 확인 근거 부족 설명 | 상세·확인 경로 열기 | 자동 `CONFIRMED` 승격 | `REQ-FUNC-TRUST-002`, `004` |
| 수집실패 | 실패 항목과 최근 성공/시도 정보 | 가능한 경우 재시도 | 다른 성공 항목 제거 | `REQ-FUNC-BRIEF-002` |
| 정보충돌 | 상충 값과 양쪽 근거 | 각각의 확인 경로 열기 | 임의 단일 사실 선택 | `REQ-FUNC-TRUST-003` |
| 데이터 없음 | 값 없음과 확인 필요 의미 | 다른 근거 확인, 가능한 재시도 | “낚시 가능”으로 해석 | `REQ-FUNC-TRUST-005` |
| 재시도 가능 | 재시도 행동과 영향 범위 | 실패 항목 재시도 | 성공 항목 초기화 | `REQ-FUNC-BRIEF-002` |
| 재시도 불가 | 현재 이용 불가 이유와 후속 안내 | 검색 또는 나가기 | 무한 재시도·확정값 생성 | `REQ-NFR-PERF-002` |

### Edge Cases

- 동일명 포인트가 2개 이상이면 `region_context`와 가능한 유형으로 구분하고 자동 선택하지 않는다.
- 후보의 `region_context`가 부족하면 `POINT_AMBIGUOUS`에 해당하는 상태를 유지한다.
- 카탈로그 장애 시 지원 여부를 추정하지 않고 조회 실패를 명시한다.
- 외부 소스 timeout 시 다른 성공 데이터를 표시하고 지연 항목만 실패/미확인으로 종료한다.
- 일부 source 성공/일부 실패 시 성공 레코드와 실패 레코드를 함께 보존한다.
- 캐시가 있으면 시각과 상태를 표시하고, 없으면 값을 만들지 않고 수집실패를 표시한다.
- `basis_time`과 `checked_at`을 모두 알 수 없으면 정상 `CONFIRMED`로 노출하지 않는다.
- freshness policy가 없으면 임의 숫자로 최신성을 판정하지 않는다.
- 신뢰 source 두 개가 충돌하면 두 원본과 확인 경로를 보존한다.
- 정보 항목이 하나도 없으면 데이터 이용 불가 상태를 표시하고 법적·안전 결론을 생성하지 않는다.
- 규제/접근 근거가 없으면 가능 판정이 아니라 확인 필요로 표현한다.
- 상태 표현은 색상 외 텍스트·아이콘 또는 패턴을 함께 사용하고 키보드로 상세 근거에 접근 가능해야 한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 사용자는 포인트명, 지역 또는 지원 식별정보로 지원 포인트 후보를 조회할 수
  있어야 한다. **Source Requirement:** `REQ-FUNC-POINT-001`.
- **FR-002**: 동일·유사 명칭 후보가 둘 이상이면 시스템은 지역·유형 등 구분 가능한 맥락을
  제공하고 사용자의 명시적 선택 전 단일 포인트로 확정하지 않아야 한다.
  **Source Requirement:** `REQ-FUNC-POINT-002`.
- **FR-003**: 미지원 또는 식별 불가능한 입력은 명시적 상태로 끝나야 하며 시스템은 임의
  포인트, 값 또는 브리프를 생성하지 않아야 한다. **Source Requirement:** `REQ-FUNC-POINT-003`.
- **FR-004**: 선택된 지원 포인트에 대해 현재 이용 가능한 정보 항목과 각 항목의 상태를 하나의
  판단 브리프로 제공해야 한다. 정보 항목 최소 세트는 OD-01 승인 전까지 `TBD`인 데이터 기반
  슬롯으로 유지한다. **Source Requirement:** `REQ-FUNC-BRIEF-001`.
- **FR-005**: 일부 항목만 이용 가능해도 성공 항목을 유지하고 누락·미확인·실패 항목을 구분해
  같은 브리프에 제공해야 한다. **Source Requirement:** `REQ-FUNC-BRIEF-002`.
- **FR-006**: 최신 수집 실패 후 캐시를 사용하면 값과 함께 기준시각 또는 최근 확인일 및
  오래됨/수집실패 의미를 제공해야 하며 최신 `CONFIRMED`로 표현하지 않아야 한다.
  **Source Requirement:** `REQ-FUNC-BRIEF-003`.
- **FR-007**: 표시되는 각 핵심 정보 항목은 출처, 기준시각 또는 최근 확인일, 신뢰상태와 추적
  가능해야 하며, 가능한 원문 또는 확인 경로를 제공해야 한다.
  **Source Requirement:** `REQ-FUNC-TRUST-001`.
- **FR-008**: 승인된 데이터 유형별 freshness policy가 있으면 임계 초과를 `STALE`로 처리하고,
  정책 또는 시간 근거가 없으면 `UNVERIFIED`/확인 필요로 처리해야 한다. 실제 임계값은 OD-02
  승인 전까지 `TBD`다. **Source Requirement:** `REQ-FUNC-TRUST-002`.
- **FR-009**: 검증 가능한 단일 결론 없이 신뢰 소스가 충돌하면 `CONFLICT`와 상충 원본·확인
  경로를 보존하고 임의 우선순위로 하나를 확정하지 않아야 한다.
  **Source Requirement:** `REQ-FUNC-TRUST-003`.
- **FR-010**: `STALE`, `UNVERIFIED`, `COLLECTION_FAILED`, `CONFLICT`는 새 성공 수집 또는 검증
  근거 없이는 시간 경과, 재시작, 캐시 조회만으로 `CONFIRMED`가 되지 않아야 한다.
  **Source Requirement:** `REQ-FUNC-TRUST-004`.
- **FR-011**: 규제·접근 정보가 없거나 불완전하다는 이유만으로 “낚시 가능”, “문제없음” 또는
  “법적으로 가능”을 결론내리지 않아야 한다. **Source Requirement:** `REQ-FUNC-TRUST-005`.

### Non-Functional Requirements

- **NFR-001**: 각 브리프 요청의 시작과 첫 표시 완료를 기록하여 p50/p95 산출이 가능해야 한다.
  목표값은 `TBD_AFTER_BASELINE`이다. **Source Requirement:** `REQ-NFR-PERF-001`.
- **NFR-002**: 느리거나 응답하지 않는 개별 소스가 전체 브리프를 무기한 차단하지 않아야 하며,
  종료 수치는 승인 전 `TBD`로 유지한다. **Source Requirement:** `REQ-NFR-PERF-002`.
- **NFR-003**: 장애 시 캐시의 시간과 상태를 보존하여 최신 실시간값으로 오인되는 표현을 만들지
  않아야 한다. **Source Requirement:** `REQ-NFR-AVAIL-001`.
- **NFR-004**: 데이터 소스별 마지막 성공시각과 최근 수집 성공/실패 결과를 운영 검증에서 확인할
  수 있어야 한다. **Source Requirement:** `REQ-NFR-OBS-001`.
- **NFR-005**: 핵심 레코드는 source/provenance, 기준시각 또는 최근 확인일, `trust_status`의
  연결을 보존해야 한다. **Source Requirement:** `REQ-NFR-DATA-001`.
- **NFR-006**: 충돌 발생 시 상충 원본을 삭제·덮어쓰기보다 추적 가능하게 보존해야 한다.
  **Source Requirement:** `REQ-NFR-DATA-002`.
- **NFR-007**: 핵심 흐름에 필요하지 않은 개인정보를 필수 입력 또는 저장 대상으로 만들지
  않아야 한다. **Source Requirement:** `REQ-NFR-PRIV-001`.
- **NFR-008**: 별도 목적과 명시적 동의가 정의되지 않은 MVP에서는 사용자의 정확 GPS를 저장하지
  않아야 한다. **Source Requirement:** `REQ-NFR-PRIV-002`.
- **NFR-009**: POC에서 외부 소스별 호출량, 실패율, 캐시 활용량을 산출할 수 있어야 한다.
  **Source Requirement:** `REQ-NFR-COST-001`.
- **NFR-010**: MVP/POC는 전국 모든 포인트의 실시간 수집을 선행조건으로 두지 않아야 한다.
  **Source Requirement:** `REQ-NFR-COST-002`.
- **NFR-011**: 핵심 흐름은 모바일과 키보드로 완료 가능하고, 신뢰상태는 색상만으로 전달되지
  않으며, 상세 근거는 점진적으로 열어 볼 수 있어야 한다. **Source:** Constitution XIII.

### Key Entities

- **FishingPoint**: 안정적인 `point_id`, 표시명, 동일명 구분용 `region_context`, 선택적 유형,
  지원상태, 선택적 위치 참조를 가진 판단 대상. 초기 포인트셋은 OD-03 승인 전 `TBD`다.
- **InformationRecord**: 포인트의 한 정보 항목과 해당 출처, 시간, 신뢰상태, 가능한 원문 경로를
  결합한 레코드. 값은 미확인·수집실패 상태에서 없을 수 있다.
- **DecisionBrief**: 선택한 포인트와 생성시각, 정보 레코드들의 집합. 자동 추천점수나 법적 가능
  결론이 아니며 정확한 정보 항목 세트는 OD-01 승인 전 `TBD`다.
- **DataSource**: 출처 식별, 이용조건 메모, 마지막 성공·시도 시각과 최근 수집상태를 가진 원천.
  실제 공급자와 라이선스는 OD-04 승인 전 `TBD`다.
- **ConflictSet**: 동일 포인트·정보 유형에 대한 상충 레코드들과 탐지시각, 해소상태, 확인 경로를
  보존하는 집합.
- **FreshnessPolicy**: 정보 유형별 최신성 판정 기준. 정책과 수치는 OD-02 승인 전 확정하지 않는다.
- **AccessControlEvidence**: Should 기능이 활성화될 때만 사용되는 접근·통제 근거와 상태의 집합.

### Out of Scope

- AI 포인트 자동추천, 조과예측 AI, 사진 어종 판별
- 커뮤니티, 랭킹, 채팅, 거래, 장비 쇼핑 또는 장비 데이터베이스
- 정확 GPS를 공개하는 소셜 기능
- 전국 규제정보의 완전 보증 또는 모든 좌표의 법적 “낚시 가능” 판정
- 승인된 국립해양조사원 계약을 제외한 외부 공급자/지도 SDK 선택과, server-side secret 경계 없는 실연동
- 데이터베이스·프레임워크·CSS 구현 결정

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 지원, 동일명, 미지원, 모호 입력 검증 사례의 100%에서 잘못된 포인트의 정상
  브리프로 연결되지 않으며, 사용자는 지원 후보의 구분 맥락을 확인할 수 있다.
- **SC-002**: 부분 성공 검증 사례의 100%에서 성공 정보가 유지되고 실패·누락 항목의 상태가
  함께 표시된다.
- **SC-003**: stale cache, 시간 근거 없음, 충돌, 규제 근거 없음 검증 사례의 100%에서 해당 정보가
  `CONFIRMED` 또는 법적 가능으로 잘못 표현되지 않는다.
- **SC-004**: 모든 표시 핵심 정보 레코드는 값과 source/time/status의 연결을 갖거나, 부족한 근거
  때문에 확정할 수 없다는 상태를 명시한다.
- **SC-005**: 대표 사용성 검증에서 다섯 신뢰상태의 의미별 정답률을 측정할 수 있고, 목표값은
  `TBD_AFTER_BASELINE`으로 기록된다.
- **SC-006**: 모든 브리프 검증 세션에서 요청 시작과 첫 표시 완료가 기록되어 p50/p95를 계산할
  수 있고, 목표값은 `TBD_AFTER_BASELINE`으로 기록된다.
- **SC-007**: 모바일 너비 및 키보드 전용 검증에서 포인트 조회, 선택, 브리프 확인, 근거 열기까지
  핵심 흐름의 100%를 완료할 수 있으며 상태 의미는 색상 없이도 구분 가능하다.
- **SC-008**: POC 운영 검증에서 모든 사용 source_id에 대해 마지막 성공, 최근 결과, 호출량,
  실패율, 캐시 활용량을 산출할 수 있다.

## Assumptions

- 대상 사용자는 낯선 육상 바다낚시 포인트를 검토하며 최종 출조 판단은 직접 내린다.
- SRS v1.0은 Baseline Candidate이므로 승인 전 미결정 사항을 확정 사실로 취급하지 않는다.
- 초기 검증은 fixture/mock과 제한 포인트셋으로 수행하고 전국 실시간 수집을 요구하지 않는다.
- 외부 정보원은 누락, 지연, 실패, 오래됨, 충돌을 일으킬 수 있으며 이는 정상 모델 상태다.
- 사용자 계정 또는 인증은 Must 흐름의 전제조건이 아니다.
- 정확 GPS는 검색 Must 흐름에 필요하지 않으며 v1.1에서 사용자 행동으로만 일시 사용하고 저장하지 않는다.
- 화면 구조는 Design 단계에서 결정하고, 공급자·저장·통신 방식은 Plan/Architecture 단계에서
  SRS 경계를 지키는 범위로 정한다.

## Open Decisions and Dependencies

| ID | 결정/의존성 | 현재 처리 | 구현 전 승인 조건 |
|---|---|---|---|
| OD-01 | 판단 브리프 최소 정보세트 | `PRODUCT_DECISION_REQUIRED` | 제품 담당 + 프로토타입 가설 승인 |
| OD-02 | 데이터 유형별 freshness threshold | `PRODUCT_DECISION_REQUIRED` | 데이터 특성 및 POC 근거 승인 |
| OD-03 | 초기 POC 지원 포인트셋 | `PRODUCT_DECISION_REQUIRED` | POC 운영 범위 승인 |
| OD-04 | 공식 데이터 계약 / live proxy 운영 | KHOA 계약·라이선스 승인, live proxy `TBD` | 계정·secret·운영비 승인 및 ADR |
| OD-05 | KPI 정량 목표 | `TBD_AFTER_BASELINE` | baseline 측정 후 PRD 승인 |
| OD-06 | 지도/검색/목록 UI 구조 | Design 단계에서 결정 가능 | 사용자 흐름 비교 기록 |
| OD-07 | FR-03/FR-05 활성 릴리스 | `DEFERRED_VALIDATION` | PRD Should 유지, 검증 결과 승인 |

## SRS Traceability

| SRS Requirement ID | Spec Story/Requirement | 상태 |
|---|---|---|
| `REQ-FUNC-POINT-001` | Story 1, FR-001 | Covered |
| `REQ-FUNC-POINT-002` | Story 1, FR-002 | Covered |
| `REQ-FUNC-POINT-003` | Story 1, FR-003 | Covered |
| `REQ-FUNC-BRIEF-001` | Story 2, FR-004 | Covered |
| `REQ-FUNC-BRIEF-002` | Story 2, FR-005 | Covered |
| `REQ-FUNC-BRIEF-003` | Story 2, FR-006 | Covered |
| `REQ-FUNC-TRUST-001` | Story 3, FR-007 | Covered |
| `REQ-FUNC-TRUST-002` | Story 3, FR-008 | Covered |
| `REQ-FUNC-TRUST-003` | Story 3, FR-009 | Covered |
| `REQ-FUNC-TRUST-004` | Story 3, FR-010 | Covered |
| `REQ-FUNC-TRUST-005` | Story 3, FR-011 | Covered |
| `REQ-FUNC-COMPARE-001` | Deferred User Stories | Deferred |
| `REQ-FUNC-ACCESS-001` | Deferred User Stories | Deferred |
| `REQ-NFR-PERF-001` | NFR-001, SC-006 | Covered |
| `REQ-NFR-PERF-002` | Story 2, NFR-002 | Covered |
| `REQ-NFR-AVAIL-001` | Story 2, NFR-003 | Covered |
| `REQ-NFR-OBS-001` | NFR-004, SC-008 | Covered |
| `REQ-NFR-DATA-001` | Story 3, NFR-005, SC-004 | Covered |
| `REQ-NFR-DATA-002` | Story 3, NFR-006 | Covered |
| `REQ-NFR-PRIV-001` | NFR-007 | Covered |
| `REQ-NFR-PRIV-002` | NFR-008 | Covered |
| `REQ-NFR-COST-001` | NFR-009, SC-008 | Covered |
| `REQ-NFR-COST-002` | NFR-010 | Covered |

## v1.1 Addendum — 공식 바다낚시지수와 현재 위치 후보

**Status**: Approved product delta; live provider configuration remains operationally blocked.

### User Story 4 - 공식 어종별 낚시여건 확인 (Priority: P1)

사용자는 자신이 명시적으로 선택한 공식 지원 포인트에 대해 국립해양조사원이 제공한 어종별
바다낚시지수·점수(제공 시)·예측시각과 환경 관측 범위를 공식 결과로 확인한다. 공식 등급과
시스템의 TrustStatus는 서로 독립적으로 표시된다.

1. 공식 지원 포인트를 선택하면 `OFFICIAL_FISHING_INDEX` 결과만 표시한다.
2. 공식 미지원 포인트에는 “공식 바다낚시지수 미지원 위치”를 표시하고 값을 만들지 않는다.
3. 일부 필드 누락/timeout/error/과거 cache는 각각 부분, `COLLECTION_FAILED`, `STALE`로 정직하게
   표현하며 기존 성공 항목을 숨기지 않는다.

### User Story 5 - 현재 위치에서 공식 후보 찾기 (Priority: P1)

사용자는 버튼을 누른 뒤 브라우저 위치권한을 허용해 주변 공식 포인트 후보를 거리와 함께 보고,
공식 기준 포인트를 직접 선택한다. 권한 거부·기능 불가·후보 없음에도 검색 흐름은 유지된다.

### New Functional Requirements

- **FR-012**: 시스템은 공식 지원 포인트의 실제 provider 필드만 `OfficialSpeciesIndex`와
  `MarineEnvironmentSnapshot.observations[]`로 변환해야 한다. **Source:** `REQ-FUNC-OFFICIAL-001`.
- **FR-013**: 공식 등급/점수와 다섯 TrustStatus를 별도 의미로 표시해야 한다.
  **Source:** `REQ-FUNC-OFFICIAL-002`.
- **FR-014**: 현재 위치는 사용자 행동 후 요청하고 주변 후보를 자동 선택하지 않으며 GPS,
  공식 기준 포인트, 방식, 거리, 확인 여부를 구분해야 한다. **Source:** `REQ-FUNC-LOCATION-001`.
- **FR-015**: 위치 거부·불가·후보 없음은 검색을 방해하지 않는 명시적 상태여야 한다.
  **Source:** `REQ-FUNC-LOCATION-002`.
- **FR-016**: official 미지원, timeout/error, 일부 누락, stale cache를 fixture 실제값으로 숨기지
  않아야 한다. **Source:** `REQ-FUNC-OFFICIAL-003`.
- **FR-017**: `ENVIRONMENT_BASED_GUIDANCE`는 타입 예약만 허용하며 사용자 결과를 생성하지 않는다.
  **Source:** `REQ-FUNC-OFFICIAL-004`.

### New Non-Functional Requirements

- **NFR-012**: provider secret은 source, `VITE_*`, bundle, URL, repository에 없어야 하며 live 호출은
  server-side secret boundary로 제한한다. **Source:** `REQ-NFR-SEC-001`.
- **NFR-013**: 정확 GPS는 메모리 내 후보 계산 외 저장·URL·로그·analytics에 남기지 않는다.
  **Source:** `REQ-NFR-PRIV-003`.
- **NFR-014**: provider 응답은 공식 스키마 경계에서 검증하고 알 수 없는/누락 필드를 확정값으로
  만들지 않는다. **Source:** `REQ-NFR-DATA-003`.

### v1.1 Success Criteria

- **SC-009**: 공식/미지원/부분/실패/stale fixture의 100%에서 공식 결과와 TrustStatus가 혼동되지 않는다.
- **SC-010**: GPS 허용/거부/불가/후보 없음의 100%에서 자동선택과 raw-coordinate 저장·계측이 없다.
- **SC-011**: production bundle 및 repository secret scan에서 provider key가 0건이다.
- **SC-012**: 1440×900과 390×844에서 검색→후보→브리프→근거가 제품 UI로 완결된다.
# v1.2 governing delta

The current user-approved scope is documented in [v1.2-product-delta.md](v1.2-product-delta.md) and [live-map contract](contracts/live-map.md). Those additive requirements supersede earlier map/provider deferrals for this release only. Baseline and v1.1 behavior remains available in explicit DEMO mode. Live is default, uses validated official catalog/provider data, and never falls back to fixtures. Root DESIGN.md remains read-only. Cloudflare Worker ownership, transient GPS privacy, conservative trust policy, rollback and verification are specified in the delta.

# v1.3 governing delta

The current user-approved scope is documented in [v1.3-product-delta.md](v1.3-product-delta.md). It extends v1.2's
map/Live flow with map location selection (official marker, arbitrary click, GPS candidate) resolving
through explicit confirmation into a decision detail panel: fishing access status (uncertainty-first,
never inferring "allowed" from absent data), current environment, and official species index. Access
status, TrustStatus, and official grade/score remain three distinct models, never merged. The Demo
fixture app, Worker, and root DESIGN.md are unchanged by this delta.

# v1.4 governing delta

The current user-approved scope is documented in [v1.4-product-delta.md](v1.4-product-delta.md). It adds a
separate, rule-based "environment-based species guidance" (ENVIRONMENT_BASED_GUIDANCE) alongside the
existing official KHOA species index (OFFICIAL_FISHING_INDEX) — never merged into one score, never an
AI/probability claim, never computed from official grade/score. Species without a cited-evidence
SpeciesProfile (including KHOA's "기타어종") get no guidance entry. No directional current data is
connected; MarineCurrentProvider ships NOT_CONNECTED only. NAVER map, Worker, KHOA connectivity, and
the Demo fixture app are unchanged by this delta.

# v1.5 governing delta

The current user-approved scope is documented in [v1.5-product-delta.md](v1.5-product-delta.md). It hardens
two things without adding features: (A) client-side bounded retry, partial-catalog preservation, and
fresh/stale cache for the KHOA multi-page catalog fetch, so one transient upstream 502 no longer
discards already-collected official points; (B) a stricter SpeciesProfile evidence audit — a
namu.wiki/news/hobbyist source is never the sole basis for a numeric threshold, so five of six
supported species lose their v1.4 threshold and now honestly resolve to INSUFFICIENT_EVIDENCE. NAVER
map, the Worker's CORS/redirect/secret boundary, and KHOA parsing are unchanged in shape.

# v1.6 governing delta

The current user-approved scope is documented in [v1.6-product-delta.md](v1.6-product-delta.md). The KHOA
tidal-current contract is now fully verified (not TBD) via research/marine-current-source-review.md.
KhoaTidalCurrentProvider and a new Worker /api/marine-current route are built and tested against that
verified contract, gated behind a separate credential (KHOA_MARINE_SERVICE_KEY) the user has not yet
supplied. No SpeciesProfile has cited current-speed/direction evidence, so guidance factors stay
UNKNOWN regardless of data connectivity. No live UI wiring this release (see delta doc rationale).
