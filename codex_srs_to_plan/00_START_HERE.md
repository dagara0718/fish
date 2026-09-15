# 00 — START HERE: SRS → Constitution → Specify → Clarify → Stitch → DESIGN_DECISIONS → Plan

## 1. 작업 위치

프로젝트 루트:

`E:\Users\keun0\Desktop\fish`

워크플로우 폴더:

`E:\Users\keun0\Desktop\fish\codex_srs_to_plan`

모든 산출물은 프로젝트 루트 또는 Spec Kit이 사용하는 표준 경로에 작성한다.
워크플로우 폴더의 원본 지시 파일과 `SOURCE_SRS_...md`는 수정하지 않는다.

프로젝트 루트에는 사용자가 직접 배치한 Coinbase 기반 `DESIGN.md`가 있어야 한다.
이 파일은 **읽기 전용 Base Design System**이며 자동화 과정에서 수정·재작성·덮어쓰기하지 않는다.

`DESIGN.md`가 없으면 다른 디자인 파일을 임의 생성하거나 대체하지 말고 `BLOCKED_MISSING_BASE_DESIGN`을 보고한 뒤 Stitch/Plan 진행을 중단한다.

---

## 2. 목표

다음 순서로 진행하고 **Plan 검토 후 멈춘다.**

1. `01_CONSTITUTION.md`
2. `02_SPECIFY.md`
3. `03_CLARIFY.md`
4. `04_STITCH_DESIGN.md`
5. `05_DESIGN_DOCUMENT.md`
6. `06_PLAN.md`
7. `07_PLAN_GATE.md`

실제 구현은 하지 않는다.

금지:

- `/speckit-tasks`
- `/speckit-analyze`
- `/speckit-implement`
- 실제 기능 코드 작성
- 외부 API 실연동 구현
- DB 마이그레이션 실행

---

## 3. Working Source of Truth

소프트웨어 동작·예외·NFR·데이터/인터페이스 계약의 최우선 근거는 다음 파일이다.

`codex_srs_to_plan/SOURCE_SRS_낚시포인트_v1.0_승인대기.md`

상태는 **Baseline Candidate / 사람 승인 전**이다.
따라서 이 문서를 Working SSOT로 사용하되 미결정 항목을 완결된 사실처럼 바꾸면 안 된다.

### SRS Must 기능 요구사항

- `REQ-FUNC-POINT-001~003`
- `REQ-FUNC-BRIEF-001~003`
- `REQ-FUNC-TRUST-001~005`

### SRS Should 요구사항

- `REQ-FUNC-COMPARE-001`
- `REQ-FUNC-ACCESS-001`

Should는 핵심 MVP의 선행조건으로 만들지 않는다.

### SRS NFR

- `REQ-NFR-PERF-001~002`
- `REQ-NFR-AVAIL-001`
- `REQ-NFR-OBS-001`
- `REQ-NFR-DATA-001~002`
- `REQ-NFR-PRIV-001~002`
- `REQ-NFR-COST-001~002`

---

## 4. 절대 유지해야 하는 시스템 규칙

1. 지원 포인트가 아니거나 식별할 수 없으면 임의 매칭하지 않는다.
2. 일부 데이터 실패가 성공한 다른 데이터를 숨기게 하지 않는다.
3. 과거 캐시를 최신 실시간 정보처럼 표시하지 않는다.
4. 핵심 정보는 가능한 범위에서 `source / time / trust_status`와 연결된다.
5. `CONFIRMED / STALE / UNVERIFIED / COLLECTION_FAILED / CONFLICT` 상태 의미를 보존한다.
6. 불확실 상태는 검증 근거 없이 `CONFIRMED`로 자동 승격하지 않는다.
7. 신뢰 소스가 충돌하면 임의의 단일 사실로 합치지 않는다.
8. 규제·접근 데이터가 없다는 이유만으로 `낚시 가능`, `문제없음`, `법적으로 가능`을 결론내리지 않는다.
9. 불필요한 개인정보를 필수로 만들지 않는다.
10. 별도 목적·동의 없이 정확 GPS 저장을 MVP 기본조건으로 두지 않는다.
11. 전국 실시간 수집을 MVP 필수 선행조건으로 만들지 않는다.

---

## 5. 현재 Open Decisions

다음은 자동으로 확정하면 안 된다.

- `OD-01` 판단 브리프 최소 정보세트
- `OD-02` 데이터 유형별 freshness threshold
- `OD-03` 초기 POC 지원 포인트셋
- `OD-04` 외부 데이터 공급자/API/라이선스
- `OD-05` KPI 정량 목표
- `OD-07` FR-03/FR-05 활성 릴리스

다음은 **Design 단계에서 결정 가능**하다.

- `OD-06` 지도/검색/목록 UI 구조

단, OD-06을 결정할 때 외부 지도 API 사용을 자동으로 확정하는 것은 별도 Architecture/API 결정이므로 금지한다.

---

## 6. 미결정 처리 규칙

모호성이 생기면 아래 우선순위를 따른다.

1. SRS에 명시된 Requirement / Processing Rule / Acceptance Criteria 확인
2. SRS의 상태·안전·실패 처리 원칙으로 답할 수 있으면 적용
3. 화면 구조 문제라면 Design Decision으로 분류
4. 기술 구현 선택 문제라면 Architecture Decision으로 분류
5. 제품 범위나 정책이 필요한 문제라면 `PRODUCT_DECISION_REQUIRED`
6. 데이터/수치 근거가 없는 경우 `TBD` 또는 `DEFERRED_VALIDATION`

절대 하지 말 것:

- 사용자에게 물어보지 못한다는 이유로 임의 숫자 생성
- 아직 정해지지 않은 API 업체 확정
- 샘플 UI 내용을 실제 SRS 필드로 승격
- Should를 Must로 승격
- Out of Scope 기능 재도입

---

## 7. 기존 저장소 보호

작업 시작 시 다음을 먼저 확인한다.

- `git status`
- `.specify/`
- `specs/`
- 기존 `DESIGN.md`
- 기존 package/config 파일

규칙:

- 사용자 파일을 삭제하거나 `git reset --hard`, `git clean -fd` 같은 파괴적 명령을 사용하지 않는다.
- 과거 PRD 기반 Spec Kit 산출물이 존재하면 바로 이어 쓰지 말고, 현재 SRS와 Requirement ID가 추적되는지 확인한다.
- SRS 추적성이 없는 기존 Feature는 `legacy`로 간주하고 보존한다.
- 새 SRS 기반 Feature를 생성하거나, 기존 Feature가 명백히 같은 범위이며 안전하게 갱신 가능할 때만 수정한다.

---

## 8. Spec Kit 명령

해당 환경에서 slash command를 사용할 수 있으면 각 단계의 명령을 그대로 사용한다.

사용할 수 없으면 명령 불가를 이유로 멈추지 말고, 같은 목적의 산출물을 Spec Kit 표준 구조에 맞춰 직접 작성한다.

---

## 9. Stitch MCP 규칙

Stitch MCP가 연결되어 있는지 확인한다.

Stitch 단계 전에 프로젝트 루트 `DESIGN.md`를 반드시 읽고 공통 시각 기준으로 사용한다. `DESIGN.md`는 절대 수정하지 않는다.

연결되어 있으면:

- SRS와 현재 Feature spec을 읽고 시안을 생성한다.
- 코드베이스를 먼저 구현하지 않는다.
- 3개 구조안을 비교한다.
- 선택 이유를 문서에 남긴다.

연결되어 있지 않으면:

- `STITCH_UNAVAILABLE`을 기록한다.
- 동일한 요구사항으로 텍스트 와이어프레임 3안을 작성한다.
- 평가표로 한 방향을 선택한다.
- Plan까지 계속 진행한다.

---

## 10. 단계별 공통 검증

각 단계 종료 전에 확인한다.

- SRS Requirement ID 추적성이 있는가
- Must/Should가 유지되는가
- Open Decision을 임의 확정하지 않았는가
- source/time/status가 손실되지 않았는가
- partial/stale/unverified/failure/conflict가 예외가 아닌 first-class 상태로 남아 있는가
- `데이터 없음 = 낚시 가능` 오해가 생길 표현이 없는가
- 정확 GPS/개인정보를 불필요하게 요구하지 않는가
- 전국 단위 과대설계를 만들지 않았는가
- 샘플 콘텐츠를 실제 요구사항으로 오해하지 않았는가

문제가 있으면 해당 단계 산출물을 먼저 수정하고 다음 단계로 이동한다.

---

## 11. 종료 조건

`07_PLAN_GATE.md`까지 완료한 뒤 멈춘다.

최종 보고에는 다음만 포함한다.

1. 생성/수정 파일 목록
2. Constitution 핵심 원칙
3. Feature/spec의 Must/Should 범위
4. Clarify에서 남긴 TBD/Open Decision
5. Stitch 사용 여부와 선택한 UI 구조
6. Base `DESIGN.md` 위치와 Feature `DESIGN_DECISIONS.md` 위치
7. Plan의 기술 구조와 Phase
8. Plan 이후 구현 전에 사용자가 승인해야 할 항목

이제 `01_CONSTITUTION.md`를 읽고 진행한다.
