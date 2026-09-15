# 06 — Plan

/speckit-plan

## 먼저 읽을 문서

- `codex_srs_to_plan/SOURCE_SRS_낚시포인트_v1.0_승인대기.md`
- constitution
- 현재 Feature의 spec.md
- Clarification 결과
- `design-brief.md`
- `stitch-review.md`
- 프로젝트 루트의 읽기 전용 `DESIGN.md`
- 현재 Feature의 `DESIGN_DECISIONS.md`

그리고 프로젝트 루트의 기존 코드/설정 구조를 읽어.

## Plan 목표

SRS Must 요구사항을 제한된 fixture/mock 기반 프로토타입에서 검증 가능하게 만들고, 이후 제한지역 POC에서 실제 외부 데이터 소스로 교체할 수 있는 최소 기술 구조를 계획한다.

**실제 코드는 구현하지 않는다.**

## 기술 선택 원칙

### 기존 저장소에 유효한 스택이 있는 경우

현재 요구사항과 충돌하지 않으면 기존 스택을 우선한다.
불필요한 재작성이나 프레임워크 교체를 하지 않는다.

### 프로젝트가 비어 있거나 기술 선택이 필요한 경우 기본 검토안

다음 최소 구성을 우선 검토해.

- React
- Vite
- TypeScript
- CSS variables + 단순한 재사용 컴포넌트 구조
- Vitest
- Testing Library
- Playwright 또는 동등한 핵심 흐름 E2E 도구

라우터는 실제로 여러 route가 필요한 경우에만 도입한다.
상태관리 라이브러리도 단순 React 상태로 충분하면 추가하지 않는다.

기술 선택 이유를 SRS/NFR과 연결해 기록해.

## 아키텍처 핵심 경계

Plan에 최소한 다음 책임을 분리해.

### 1. Point Catalog / Point Resolver

관련 요구사항:
- REQ-FUNC-POINT-001~003

책임:
- query 입력
- 후보 식별
- region_context 제공
- support_status
- ambiguous/unsupported 처리

탐색 UI 구조와 point resolver를 결합하지 않는다.

### 2. Data Contracts

SRS의 논리 모델을 기반으로 최소 계약을 계획해.

- FishingPoint
- InformationRecord
- DataSource
- DecisionBrief
- ConflictSet
- logical error/result types

정확한 info_type 목록은 열어둔다.

### 3. Data Source Adapter Boundary

관련:
- IF-DATA-SOURCE-ADAPTER

특정 API 제공자를 고정하지 않는다.

계약이 처리해야 할 결과:
- success
- timeout
- rate limit
- malformed
- unavailable
- unsupported location

Provider-specific 코드는 adapter 뒤에 위치하도록 계획한다.

### 4. Provenance / Cache Boundary

관련:
- REQ-FUNC-BRIEF-003
- REQ-NFR-AVAIL-001
- REQ-NFR-DATA-001~002

보존:
- source
- basis_time
- checked_at/fetched_at
- trust_status
- last successful fetch
- conflict records

프로토타입에서 영속 캐시 인프라를 과대설계하지 않는다.

### 5. Trust Policy

관련:
- REQ-FUNC-TRUST-001~005

계획해야 할 것:
- trust status enum/domain type
- 상태전이 규칙
- freshness policy interface/config boundary
- conflict detection boundary
- 자동 CONFIRMED 승격 금지

freshness 숫자는 TBD.

### 6. Decision Brief Assembly

관련:
- REQ-FUNC-BRIEF-001~003

data-driven 구조를 사용해 info_type이 추가/삭제되어도 UI/조립 구조 전체를 바꾸지 않게 한다.

부분 성공을 first-class 결과로 다룬다.

### 7. Presentation / Design System

역할을 분리해 계획한다.

- 프로젝트 루트 `DESIGN.md`: 전역 시각 언어와 디자인 토큰의 기준, 읽기 전용
- Feature의 `DESIGN_DECISIONS.md`: 탐색 구조, 상태 표현, 정보 계층 등 현재 Feature 전용 결정

두 문서에 정의된:
- 탐색 구조
- 브리프 정보 계층
- trust status 표현
- evidence detail
- responsive/accessibility

를 구현 가능한 컴포넌트 책임으로 연결한다.

샘플 화면 콘텐츠를 실제 SRS 필드 결정으로 고정하지 않는다.

### 8. Analytics / Observability

관련:
- REQ-NFR-PERF-001
- REQ-NFR-OBS-001
- REQ-NFR-COST-001

최소 계측 계획:
- 브리프 요청/첫 표시 timing
- source별 attempt/success/failure
- cache 사용 여부
- source별 호출량

개인정보 최소화.

## 프로토타입 데이터 전략

### Phase 1 — Fixture/Mock

Must 상태를 모두 재현 가능한 fixture를 만든다는 계획을 포함해.

- supported point
- duplicate/ambiguous point
- unsupported point
- all confirmed
- partial data
- stale cache
- source failure with cache
- source failure without cache
- unverified
- conflict
- missing provenance/time

실제 포인트명이나 실제 데이터 제공자를 확정할 필요가 없다.

### Phase 2 — 제한 POC 준비

OD-01~04가 승인된 이후에만:
- 실제 지원 포인트셋
- 실제 source adapter
- freshness policy 실제 값
- provider license/terms

를 연결한다.

Phase 1이 Phase 2에 종속되지 않게 계획한다.

## NFR 구현 계획

### 성능

- 브리프 첫 표시시간 계측 가능
- 느린 source 개별 종료 가능
- timeout 값 자체는 config/TBD

### 안정성

- cache를 최신값처럼 위장하지 않음
- 실패가 전체 성공 데이터를 제거하지 않음

### 데이터

- provenance/time/status 보존
- conflict 원본 보존

### 개인정보

- 회원가입/로그인을 SRS 근거 없이 필수화하지 않음
- 정확 GPS 저장 금지 기본값
- 분석 이벤트에 불필요 식별자 금지

### 비용

- provider별 호출량/실패율/cache utilization 측정 가능
- 전국 실시간 파이프라인 금지

## 테스트 전략

SRS Traceability Matrix의 Test Case ID를 Plan에 연결해.

최소:

- TC-POINT-001~003
- TC-BRIEF-001~003
- TC-TRUST-001~005
- TC-NFR-PERF-001~002
- TC-NFR-OBS-001
- TC-NFR-PRIV-001
- TC-NFR-COST-001

테스트 레벨을 구분해.

- contract/schema
- unit/state transition
- component
- integration with fake adapter
- E2E 핵심 흐름
- accessibility

Should 기능 테스트는 별도 Deferred Phase에 둔다.

## Plan Phase 권장 구조

### Phase 0. Repository/Foundation
- 기존 구조 확인
- tooling 결정
- 테스트/빌드 최소 설정 계획

### Phase 1. Contracts & Fixtures
- domain types
- logical errors
- fixtures
- adapter contracts

### Phase 2. Core Logic
- point resolver
- trust policy
- brief assembly
- partial/failure/conflict 처리

### Phase 3. Core UI from DESIGN.md + DESIGN_DECISIONS.md
- point discovery
- disambiguation
- brief
- evidence detail
- 상태 variants
- desktop/mobile/accessibility

### Phase 4. Validation & Observability
- timing events
- source health metrics
- E2E/AC 검증

### Phase 5. POC Adapter Enablement — Blocked until OD approval
- 실제 provider
- 실제 POC points
- actual freshness thresholds

### Deferred
- FR-03 comparison
- FR-05 access/control evidence

## Plan에 반드시 포함할 표

### Requirement → Module → Test

| Requirement ID | 담당 모듈/컴포넌트 | Test/Verification | Phase |
|---|---|---|---|

### Open Decision 영향

| Open Decision | 현재 Plan 처리 | 어떤 Phase를 차단하는가 |
|---|---|---|

## DESIGN 관련 추가 규칙

- 프로젝트 루트 `DESIGN.md`를 Plan 중 수정하거나 재생성하지 않는다.
- Coinbase 브랜드 고유 요소를 제품 UI에 복제하지 않는다.
- 시각 토큰과 컴포넌트 원칙은 `DESIGN.md`를 따르되 SRS 의미와 충돌하면 SRS가 우선한다.
- Trust Status의 의미는 `DESIGN_DECISIONS.md`와 SRS를 기준으로 하고 일반적인 success/error 색 의미에 억지로 매핑하지 않는다.
- 초록색을 `낚시 가능/안전/추천`의 암시로 사용하지 않는다.

## 금지

- 실제 API provider 임의 선정
- 실제 freshness 시간값 임의 생성
- 전국 수집 아키텍처 선행
- AI 추천/점수 추가
- 로그인 기능을 이유 없이 추가
- DB를 무조건 도입
- map SDK를 디자인 선택과 동일시
- FR-03/05를 core Phase 의존성으로 만들기

Plan 생성 후 아직 구현하지 말고 `codex_srs_to_plan/07_PLAN_GATE.md`를 읽어 검토해.
