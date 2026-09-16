# 01 — /speckit-tasks

현재 Feature의 `spec.md`, `DESIGN_DECISIONS.md`, `plan.md`, constitution, Base `DESIGN.md`를 읽고 `/speckit-tasks`를 실행한다.

## Task 분해 원칙

교재의 Tasks 원칙처럼 모든 Task에 최소한 다음을 포함한다.

- 고유 Task ID
- 관련 SRS Requirement ID / Feature FR
- 관련 `DESIGN_DECISIONS.md` 섹션
- 수정/생성할 파일
- 선행 Task
- 검증 방법

## Phase 구조

### Phase 1 — Repository / Project Setup
- React + Vite + strict TypeScript
- lint / test / build
- GitHub Pages를 고려한 Vite base 구조
- E-drive 작업/캐시/temp 조건 확인
- 테스트 디렉터리 기반

### Phase 2 — Contract / Data / Fixtures
- `FishingPoint`
- `InformationRecord`
- Trust Status union
- Point lookup result/error
- `DecisionBrief` / `BriefAssemblyOutcome`
- provenance/cache interfaces
- synthetic fixture catalog
- fake adapters
- invalid confirmed state 방지
- privacy negative fixtures

### Phase 3 — Core Logic
- point resolver
- explicit selection
- freshness/trust policy boundary
- conflict detector
- partial-first assembler
- stale cache handling
- failed slot retry
- source/brief timing observability

### Phase 4 — Search-first UI / Mock Data
- SearchForm
- CandidateList/Row
- unsupported/ambiguous/catalog failure states
- PointIdentityHeader
- BriefAvailability
- BriefSlot
- TrustBadge
- EvidencePanel
- RetryAction
- responsive/mobile
- keyboard/focus/live region
- reduced motion
- Base DESIGN.md 토큰을 CSS variables로 변환하되 원본 파일은 수정하지 않음

### Phase 5 — Design Review / UI Correction
- 구현 전 디자인 시스템 구조 검사
- Stitch/Design artifact와 실제 UI 비교
- CRITICAL/HIGH 시각·접근성 문제 수정
- 디자인 회귀 검증

### Phase 6 — Tests / Validation / Observability
- contract tests
- unit/state-transition tests
- component tests
- integration tests
- E2E 대표 흐름
- accessibility/mobile checks
- p50/p95 계측 구조 확인(목표 수치 발명 금지)

### Phase 7 — GitHub Pages Delivery
- Vite `/fish/` base
- production build
- GitHub Pages Actions workflow
- deploy validation
- commit/push

### Deferred / Blocked
- 실제 Provider/API
- 실제 POC point set
- production freshness thresholds
- FR-03, FR-05

## Gate

`tasks.md` 생성 후 다음을 확인한다.
- 모든 Must Requirement에 Task가 최소 1개 이상 있는가
- 각 Trust Status에 구현과 테스트 Task가 있는가
- partial/stale/conflict/unsupported에 Task가 있는가
- 디자인 접근성 규칙에 Task가 있는가
- GitHub Pages 배포 Task가 build/test 뒤에 위치하는가
- Should/Blocked가 core 구현 선행조건이 아닌가

통과하면 `02_ANALYZE.md`로 이동한다.
