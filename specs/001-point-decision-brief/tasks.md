# Tasks: 신뢰상태 기반 낚시 포인트 판단 브리프

**Input**: `spec.md`, `plan.md`, `data-model.md`, `contracts/`, `research.md`, `quickstart.md`, `DESIGN_DECISIONS.md`, constitution, read-only root `DESIGN.md`

**Scope**: Synthetic fixture + fake adapter browser MVP only. `REQ-FUNC-COMPARE-001`, `REQ-FUNC-ACCESS-001`, live providers, real points, production freshness values, backend, database, map, GPS, login, recommendation, and permission decisions remain deferred or blocked.

**Task metadata convention**: Every task names its Requirement IDs, owning design section where applicable, exact files, dependencies/blocks, and verification evidence.

## Phase 1: Repository / Project Setup

**Goal**: Establish an E-drive-only React/Vite/strict TypeScript project and test/build boundary without changing `DESIGN.md`.

- [X] T001 Verify and document workspace-local npm cache/temp paths and add `node_modules/`, `dist/`, `coverage/`, `playwright-report/`, `.cache/`, `.tmp/`, `.env*`, logs, editor and OS artifacts to `.gitignore`; Req: repository instruction, `REQ-NFR-PRIV-001~002`; Design: §19/§20; Files: `.gitignore`; Depends on: none; Blocks: T002; Verify: resolved npm cache/TEMP/TMP all begin with `E:\Users\keun0\Desktop\fish` and `git status` excludes generated paths.
- [X] T002 Initialize the React + Vite + strict TypeScript application and lock dependencies with lint, typecheck, Vitest, Testing Library and Playwright scripts; Req: all Must delivery, `REQ-NFR-COST-002`; Design: §2/§13; Files: `package.json`, `package-lock.json`, `index.html`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `eslint.config.js`, `playwright.config.ts`, `src/main.tsx`, `src/vite-env.d.ts`; Depends on: T001; Blocks: T003-T043; Verify: `npm ci`, `npm run typecheck`, and empty smoke test runner execute from E drive.
- [X] T003 [P] Translate allowed Base Design tokens into project-owned CSS variables and global reset without modifying root `DESIGN.md`; Req: `REQ-NFR-PRIV-001~002`, Constitution XII/XIII; Design: `DESIGN_DECISIONS.md` §2, §13-18; Files: `src/styles/tokens.css`, `src/styles/global.css`; Depends on: T002; Blocks: T025-T032; Verify: token audit finds no Coinbase font/brand assets, trading semantics, or hard-coded component colors outside tokens.
- [X] T004 [P] Create shared test setup and render helpers with jest-dom cleanup and deterministic clock support; Req: Constitution XIV; Design: §23; Files: `src/testing/setup.ts`, `src/testing/render.tsx`; Depends on: T002; Blocks: T008-T040; Verify: `npm run test -- --run` discovers the setup and exits successfully.

## Phase 2: Contract / Data / Fixtures (Foundational)

**Goal**: Make point identity, provenance, trust, conflict, cache, adapter, brief, and observability states explicit before feature logic.

- [X] T005 Define `FishingPoint`, `PointLookupResult`, logical errors, selection results and provider-neutral catalog port; Req: `REQ-FUNC-POINT-001`, `REQ-FUNC-POINT-002`, `REQ-FUNC-POINT-003`; Design: §5-7/§12; Files: `src/domain/contracts.ts`, `src/domain/errors.ts`; Depends on: T002; Blocks: T006-T016; Verify: TypeScript exhaustive checks cover MATCHES/NO_MATCH/AMBIGUOUS/CATALOG_UNAVAILABLE and no implicit selected result.
- [X] T006 Define evidence-bearing `InformationRecord`, closed five-state `TrustStatus`, `DataSource`, `AdapterResult`, `CacheState`, `ConflictSet`, `DecisionBrief`, `BriefAssemblyOutcome`, ports and construction guards; Req: `REQ-FUNC-BRIEF-001`, `REQ-FUNC-BRIEF-002`, `REQ-FUNC-BRIEF-003`, `REQ-FUNC-TRUST-001`, `REQ-FUNC-TRUST-002`, `REQ-FUNC-TRUST-003`, `REQ-FUNC-TRUST-004`, `REQ-FUNC-TRUST-005`, `REQ-NFR-AVAIL-001`, `REQ-NFR-DATA-001`, `REQ-NFR-DATA-002`; Design: §8-12; Files: `src/domain/contracts.ts`; Depends on: T005; Blocks: T007-T024; Verify: impossible or runtime-rejected evidence-free CONFIRMED and fewer-than-two-record CONFLICT states.
- [X] T007 [P] Define privacy-safe timing/source metric events and in-memory sink interfaces with no raw query, GPS, user/device ID, URL or error body fields; Req: `REQ-NFR-PERF-001`, `REQ-NFR-OBS-001`, `REQ-NFR-PRIV-001~002`, `REQ-NFR-COST-001`; Design: §19/§20; Files: `src/observability/contracts.ts`; Depends on: T002; Blocks: T014/T022/T023; Verify: event type inventory and compile-time fixture reject forbidden fields.
- [X] T008 [P] Add contract tests for entity guards, all adapter outcomes, conflict cardinality and source/time/status preservation; Req: `REQ-FUNC-BRIEF-001`, `REQ-FUNC-TRUST-001~004`, `REQ-NFR-DATA-001~002`; Design: §8-10; Files: `tests/contract/domain-contracts.test.ts`; Depends on: T004-T006; Blocks: T017-T021; Verify: tests initially fail before factories and then pass.
- [X] T009 [P] Add privacy negative contract tests using sentinel email, device ID, exact coordinates, raw query and source URL/error text; Req: `REQ-NFR-PRIV-001~002`; Design: §19/§20; Files: `tests/contract/privacy-contract.test.ts`, `src/testing/fixtures/privacy-scenarios.ts`; Depends on: T004/T007; Blocks: T014/T023; Verify: forbidden sentinels cannot enter stored events or core payloads.
- [X] T010 Create a visibly synthetic point catalog covering unique support, distinguishable same-name candidates, missing-context ambiguity, unsupported input and catalog unavailable; Req: `REQ-FUNC-POINT-001~003`; Design: §6/§11/§19; Files: `src/data/fixture-catalog.ts`, `src/testing/fixtures/point-scenarios.ts`; Depends on: T005; Blocks: T015/T025-T027; Verify: every scenario includes Requirement/Test Case IDs and every label says sample/test/synthetic.
- [X] T011 Create injected, test-only generic brief definitions and fake adapters for success, timeout, rate limit, malformed, unavailable and unsupported-location outcomes without fixing OD-01/02/04; Req: `REQ-FUNC-BRIEF-001~003`, `REQ-NFR-PERF-002`; Design: §8/§19/§21; Files: `src/data/fixture-brief-definition.ts`, `src/data/fixture-adapters.ts`; Depends on: T006; Blocks: T012/T018-T021; Verify: no real provider, production timeout, freshness number or actual field-set claim exists.
- [X] T012 Create the complete brief fixture matrix for all-confirmed, partial, stale cache, refresh failure with/without cache, all-failed, missing time/provenance/policy, conflict, no-evidence restart and zero restriction-like evidence; Req: `REQ-FUNC-BRIEF-001~003`, `REQ-FUNC-TRUST-001~005`, `REQ-NFR-AVAIL-001`; Design: §9-11/§19; Files: `src/testing/fixtures/brief-scenarios.ts`; Depends on: T011; Blocks: T018-T040; Verify: fixture inventory matches `presentation-contract.md` and each fixture has Requirement/Test Case IDs.
- [X] T013 Implement the in-memory provenance/cache repository that separates immutable evidence from latest attempts and preserves conflict originals; Req: `REQ-FUNC-BRIEF-003`, `REQ-FUNC-TRUST-003~004`, `REQ-NFR-AVAIL-001`, `REQ-NFR-DATA-001~002`; Design: §10-11; Files: `src/data/memory-provenance-cache.ts`; Depends on: T006; Blocks: T020/T021; Verify: cache read never mutates status and failed refresh never overwrites prior evidence.
- [X] T014 Implement privacy-safe in-memory event/source metrics sinks; Req: `REQ-NFR-PERF-001`, `REQ-NFR-OBS-001`, `REQ-NFR-PRIV-001~002`, `REQ-NFR-COST-001`; Design: §19/§20; Files: `src/observability/memory-event-sink.ts`, `src/observability/source-metrics.ts`; Depends on: T007/T009; Blocks: T022/T023; Verify: source calls/outcomes/cache and last attempt/success are computable without high-cardinality labels.

**Checkpoint**: Contracts and synthetic fixtures are independently testable; OD-01~05/07 remain open.

## Phase 3: User Story 1 — 올바른 지원 포인트 찾기 (Priority: P1)

**Goal**: Search synthetic supported points, distinguish similar names, and require explicit selection without guessing.

**Independent test**: Supported, duplicate, ambiguous, unsupported and catalog-unavailable fixtures never open a brief until a supported candidate is explicitly selected.

- [X] T015 [P] [US1] Write resolver tests for normalized search, supported candidates, duplicate context, ambiguity, unsupported and catalog failure with no auto-selection; Req: `REQ-FUNC-POINT-001`, `REQ-FUNC-POINT-002`, `REQ-FUNC-POINT-003`; Design: §4-7/§11; Files: `tests/unit/point-resolver.test.ts`; Depends on: T004/T005/T010; Blocks: T016; Verify: TC-POINT-001~003 fail before implementation and assert no selected point in lookup results.
- [X] T016 [US1] Implement pure point search and explicit supported-point selection; Req: `REQ-FUNC-POINT-001~003`; Design: §4-7; Files: `src/domain/point-resolver.ts`; Depends on: T015; Blocks: T025-T027/T033; Verify: T015 passes and `REVIEW_REQUIRED`, ambiguous, unsupported and catalog failure cannot reach selection.

## Phase 4: User Story 2 — 현재 가능한 판단정보 보기 (Priority: P1)

**Goal**: Assemble data-driven slots partial-first, preserve cache failure context, terminate all-failed states, and retry only failed slots.

**Independent test**: Fake adapters prove success remains visible alongside timeout/failure, cache never appears current, and retry preserves siblings.

- [X] T017 [P] [US2] Write symbolic freshness and cache-state tests without production threshold values; Req: `REQ-FUNC-BRIEF-003`, `REQ-FUNC-TRUST-002`, `REQ-FUNC-TRUST-004`, `REQ-NFR-AVAIL-001`; Design: §8-11/§19/§21; Files: `tests/unit/trust-policy.test.ts`; Depends on: T004/T006/T008/T012/T013; Blocks: T018; Verify: T−ε/T/T+ε test-only boundaries plus missing policy/time and cache/restart negative cases.
- [X] T018 [US2] Implement evidence-gated freshness/trust assessment and transition guards; Req: `REQ-FUNC-BRIEF-003`, `REQ-FUNC-TRUST-001~005`, `REQ-NFR-AVAIL-001`; Design: §8-11; Files: `src/domain/trust-policy.ts`; Depends on: T017; Blocks: T019-T021; Verify: non-confirmed states never become CONFIRMED without a new evidence event.
- [X] T019 [P] [US2] Write partial-first assembler and failed-slot retry tests including never-resolving, all-failed, failure-with-cache/no-cache and sibling preservation; Req: `REQ-FUNC-BRIEF-001~003`, `REQ-NFR-PERF-002`, `REQ-NFR-AVAIL-001`; Design: §6/§11/§12; Files: `tests/unit/brief-assembler.test.ts`; Depends on: T004/T006/T011-T013/T018; Blocks: T020/T021; Verify: TC-BRIEF-001~003 fail before implementation and contain finite terminal assertions.
- [X] T020 [US2] Implement partial-first DecisionBrief assembly with injected test termination policy, data-completeness envelope and no persisted/permission-like overall state; Req: `REQ-FUNC-BRIEF-001~003`, `REQ-NFR-PERF-002`; Design: §5/§8/§11; Files: `src/domain/brief-assembler.ts`; Depends on: T019; Blocks: T021/T028-T032/T034; Verify: successful items settle independently and all-failed ends UNAVAILABLE.
- [X] T021 [US2] Implement scoped failed-slot retry preserving successful records, point context, cache evidence and conflict originals; Req: `REQ-FUNC-BRIEF-002~003`, `REQ-NFR-DATA-001~002`; Design: §6/§11/§12; Files: `src/domain/brief-assembler.ts`; Depends on: T020; Blocks: T032/T034; Verify: retry tests compare sibling object/evidence stability before and after retry.

## Phase 5: User Story 3 — 신뢰상태와 근거 이해하기 (Priority: P1)

**Goal**: Preserve five trust states, symmetric conflicts, provenance and safe negative meaning through logic and observability.

**Independent test**: Every displayed state retains source/time/status or explicit missing evidence; conflict has no winner and zero restriction-like evidence never becomes permission.

- [X] T022 [P] [US3] Write conflict, provenance, forbidden-promotion and no-permission-inference unit tests; Req: `REQ-FUNC-TRUST-001`, `REQ-FUNC-TRUST-002`, `REQ-FUNC-TRUST-003`, `REQ-FUNC-TRUST-004`, `REQ-FUNC-TRUST-005`, `REQ-NFR-DATA-001`, `REQ-NFR-DATA-002`; Design: §9-11/§20; Files: `tests/unit/conflict-detector.test.ts`, `tests/unit/safety-invariants.test.ts`; Depends on: T004/T006/T008/T012/T018; Blocks: T024; Verify: TC-TRUST-001~005 fail before implementation and scan result copy/data for forbidden conclusions.
- [X] T023 [P] [US3] Write timing and source-observability tests for exact start/first-meaningful-render pairing, p50/p95 computability, source health and cache utilization; Req: `REQ-NFR-PERF-001`, `REQ-NFR-OBS-001`, `REQ-NFR-COST-001`; Design: §11/§19; Files: `tests/unit/observability.test.ts`; Depends on: T004/T007/T014; Blocks: T024/T033; Verify: no target threshold is asserted and metrics failure cannot suppress data.
- [X] T024 [US3] Implement symmetric conflict detection plus request timing/source observability helpers; Req: `REQ-FUNC-TRUST-003~005`, `REQ-NFR-PERF-001`, `REQ-NFR-OBS-001`, `REQ-NFR-DATA-002`, `REQ-NFR-COST-001`; Design: §9-11; Files: `src/domain/conflict-detector.ts`, `src/observability/brief-timing.ts`, `src/observability/source-metrics.ts`; Depends on: T022/T023; Blocks: T028-T034; Verify: T022/T023 pass, conflict output preserves every original without ranking.

## Phase 6: Search-first UI / Mock Data

**Goal**: Deliver the browser flow with accessible responsive interaction and visibly synthetic content.

- [X] T025 [P] [US1] Write component tests for labelled search, live loading/result messages, duplicate context and no preselection; Req: `REQ-FUNC-POINT-001~002`, `REQ-NFR-PRIV-002`; Design: §7/§12/§16-17; Files: `tests/component/point-discovery.test.tsx`; Depends on: T003/T004/T010/T016; Blocks: T026; Verify: keyboard queries and candidate buttons expose names, regions and optional types.
- [X] T026 [US1] Implement SearchForm and CandidateList/Row with 44px native controls and explicit selection; Req: `REQ-FUNC-POINT-001~002`; Design: §4-7/§12-17; Files: `src/features/point-discovery/SearchForm.tsx`, `src/features/point-discovery/CandidateList.tsx`; Depends on: T025; Blocks: T027/T033; Verify: T025 passes with no first-result or single-result auto-selection.
- [X] T027 [US1] Implement unsupported, ambiguous and catalog-unavailable StateMessage outcomes with no guessed support or brief; Req: `REQ-FUNC-POINT-002~003`; Design: §7/§11-12/§20; Files: `src/features/point-discovery/StateMessage.tsx`; Depends on: T026; Blocks: T033/T036; Verify: component assertions confirm correction/retry actions and absence of brief content.
- [X] T028 [P] [US3] Write component tests for all five TrustBadge labels/icons, source/time/status linkage and symmetric conflict evidence; Req: `REQ-FUNC-TRUST-001~005`, `REQ-NFR-DATA-001~002`; Design: §8-10/§12/§17; Files: `tests/component/trust-evidence.test.tsx`; Depends on: T003/T004/T012/T018/T024; Blocks: T029/T030; Verify: states remain distinguishable when CSS color is ignored.
- [X] T029 [US3] Implement TrustBadge and BriefSlot summaries with explicit missing values, source and time semantics; Req: `REQ-FUNC-TRUST-001~005`, `REQ-NFR-DATA-001`; Design: §8-10/§12-15; Files: `src/features/decision-brief/TrustBadge.tsx`, `src/features/decision-brief/BriefSlot.tsx`; Depends on: T028; Blocks: T030/T031/T033; Verify: T028 status/source/time assertions pass and CONFIRMED never uses safety/permission/recommendation copy.
- [X] T030 [US3] Implement accessible modal EvidencePanel with labelled title, focus trap, Escape/button close, trigger focus restoration and equal-weight competing evidence; Req: `REQ-FUNC-TRUST-001/003/005`, `REQ-NFR-DATA-001~002`; Design: §7/§10/§16-18; Files: `src/features/decision-brief/EvidencePanel.tsx`; Depends on: T029; Blocks: T035/T036; Verify: component keyboard test opens, cycles, closes and restores focus to the exact trigger.
- [X] T031 [P] [US2] Write component tests for COMPLETE/PARTIAL/UNAVAILABLE availability, stale+refresh-failure dual context, all-failed terminal state and successful-sibling preservation; Req: `REQ-FUNC-BRIEF-001~003`, `REQ-NFR-PERF-002`, `REQ-NFR-AVAIL-001`; Design: §5/§8/§11-12; Files: `tests/component/decision-brief.test.tsx`; Depends on: T003/T004/T012/T020/T029; Blocks: T032; Verify: partial fixture keeps success visible and all-failed has no indefinite loading.
- [X] T032 [US2] Implement PointIdentityHeader, BriefAvailability and RetryAction around data-driven slots; Req: `REQ-FUNC-BRIEF-001~003`; Design: §5-8/§11-12/§16; Files: `src/features/decision-brief/PointIdentityHeader.tsx`, `src/features/decision-brief/BriefAvailability.tsx`, `src/features/decision-brief/RetryAction.tsx`; Depends on: T021/T029/T031; Blocks: T033/T034; Verify: T031 passes and retry affects only failed slots.
- [X] T033 [US1] Wire the Search-first reducer/controller and visible synthetic-data disclaimer from search through explicit selection to brief/evidence; Req: `REQ-FUNC-POINT-001~003`, `REQ-FUNC-BRIEF-001`, `REQ-NFR-PERF-001`, `REQ-NFR-PRIV-001~002`; Design: §4-7/§19-20; Files: `src/app/app-state.ts`, `src/app/App.tsx`; Depends on: T024/T026/T027/T029/T032; Blocks: T034-T040; Verify: initial focus is search, no geolocation/storage API is used, and every fixture is labelled synthetic.
- [X] T034 [US2] Add integration tests for explicit selection, partial settlement, stale cache, refresh failure, all failed and scoped retry; Req: `REQ-FUNC-BRIEF-001~003`, `REQ-NFR-PERF-001~002`, `REQ-NFR-AVAIL-001`; Design: §6/§11/§23; Files: `tests/integration/brief-flow.test.tsx`; Depends on: T033; Blocks: T038-T043; Verify: TC-BRIEF-001~003 plus timing pairing pass.
- [X] T035 [US3] Add integration tests for missing provenance/time/policy, conflict, restart/no-promotion, source/time/status access, no-permission inference and evidence focus return; Req: `REQ-FUNC-TRUST-001~005`, `REQ-NFR-DATA-001~002`; Design: §9-11/§17/§20/§23; Files: `tests/integration/trust-flow.test.tsx`; Depends on: T030/T033; Blocks: T038-T043; Verify: TC-TRUST-001~005 pass with forbidden-copy and focus assertions.

## Phase 7: Design Review / UI Correction

**Goal**: Reconcile implementation with Base/Feature design without changing behavior or `DESIGN.md`.

- [X] T036 Review styles/components for token bypass, duplication, focus/ARIA, non-color status, mobile overflow and Search-first hierarchy; fix any CRITICAL/HIGH issue and record results; Req: all Must UI, Constitution XII/XIII; Design: §13-23; Files: `src/styles/*`, `src/features/**/*`, `src/app/App.tsx`, `specs/001-point-decision-brief/implementation-design-review.md`; Depends on: T027/T030/T033; Blocks: T037-T043; Verify: review table has severity/resolution and root `DESIGN.md` hash remains unchanged.
- [X] T037 Record `DESIGN_SYNC_UNAVAILABLE` if no design-sync capability exists, compare the implementation to Stitch Search-first artifacts and verify no raw Stitch filler became product data; Req: all Must UI, OD-01~07 boundaries; Design: §4/§19/§21/§23; Files: `specs/001-point-decision-brief/implementation-design-review.md`; Depends on: T036; Blocks: T038-T043; Verify: CRITICAL/HIGH design findings = 0.

## Phase 8: Tests / Validation / Observability

**Goal**: Prove required browser, keyboard, mobile, safety, privacy and observability behavior before delivery.

- [X] T038 [P] Add Playwright flow for supported/duplicate search → explicit selection → brief → evidence → close/focus return; Req: `REQ-FUNC-POINT-001~002`, `REQ-FUNC-BRIEF-001`, `REQ-FUNC-TRUST-001`; Design: §6-7/§17/§23; Files: `e2e/search-to-evidence.spec.ts`; Depends on: T034-T037; Blocks: T041; Verify: desktop keyboard-only flow passes.
- [X] T039 [P] Add Playwright negative/fault flows for unsupported, ambiguous, catalog unavailable, partial failure, stale cache, all-failed, conflict and no-permission inference; Req: `REQ-FUNC-POINT-002~003`, `REQ-FUNC-BRIEF-002~003`, `REQ-FUNC-TRUST-002~005`; Design: §9-11/§20/§23; Files: `e2e/failure-and-trust-states.spec.ts`; Depends on: T034-T037; Blocks: T041; Verify: no forbidden auto-match/promotion/winner/permission occurs.
- [X] T040 [P] Add Playwright mobile/reduced-motion/accessibility smoke proving no core horizontal overflow and text+icon statuses; Req: `REQ-NFR-PRIV-002`, Constitution XIII, SC-007; Design: §16-18/§23; Files: `e2e/accessibility-mobile.spec.ts`; Depends on: T034-T037; Blocks: T041; Verify: sub-640px and reduced-motion projects pass with keyboard-visible focus.
- [X] T041 Run and record typecheck, lint, unit/component/integration tests, Playwright representative E2E and production build; Req: all Must, Constitution XIV; Design: §23; Files: `specs/001-point-decision-brief/validation-report.md`; Depends on: T038-T040; Blocks: T042-T045; Verify: all commands exit 0 and no CRITICAL/HIGH design issue remains.

## Phase 9: GitHub Pages Delivery

**Goal**: Publish the verified SPA at the repository Project Pages path using the minimal official Actions flow.

- [X] T042 Set Vite production base to `/fish/` while preserving local development behavior; Req: delivery constraint; Design: no new product decision; Files: `vite.config.ts`; Depends on: T041; Blocks: T043; Verify: production `dist/index.html` asset URLs begin with `/fish/`.
- [X] T043 Add the minimal GitHub Pages Actions workflow for `main` push using checkout, Node, `npm ci`, lint/test/build, Pages configure/upload/deploy and recommended permissions/environment; Req: delivery constraint, Constitution XIV; Design: none; Files: `.github/workflows/deploy-pages.yml`; Depends on: T042; Blocks: T044; Verify: workflow syntax and a fresh local `npm ci && npm run lint && npm run test && npm run build` pass.
- [X] T044 Review the final diff, confirm only intended files are staged, commit normally on `main`, and push without history rewrite or force; Req: repository safety; Design: root `DESIGN.md` immutable; Files: Git index/history; Depends on: T043; Blocks: T045; Verify: clean intended diff, commit SHA exists on `origin/main`.
- [X] T045 Confirm the GitHub Pages workflow conclusion and validate `https://dagara0718.github.io/fish/` for non-404 HTML/assets, visible fixture UI, selection→brief interaction and mobile layout; Req: delivery acceptance; Design: §4/§16/§23; Files: external deployment evidence plus `specs/001-point-decision-brief/validation-report.md`; Depends on: T044; Blocks: final report; Verify: deployed commit SHA matches, or report `PAGES_MANUAL_ACTION_REQUIRED` with the minimum GitHub UI action.

## Deferred / Blocked Work

- [ ] TBD-01 [BLOCKED: OD-01~04] Implement any real point catalog, real brief field set, numeric production freshness/timeout policy, live provider/API, license terms, backend/persistence or raw provider validation; Req: future limited POC only; Files: none in this run; Depends on: explicit human approvals; Verify: absent from fixture MVP.
- [ ] TBD-02 [BLOCKED: OD-07] Implement `REQ-FUNC-COMPARE-001` or `REQ-FUNC-ACCESS-001`; Files: separate future feature specs/tasks; Depends on: PRD approval; Verify: no Must task depends on these features.
- [ ] TBD-03 [BLOCKED: OD-05] Set quantitative KPI/performance pass targets; Files: future PRD/SRS update; Depends on: baseline and product approval; Verify: current code only computes baseline-capable metrics.

## Dependencies & Execution Order

`T001 → T002 → T005/T006 → fixture and contract tasks → story logic → Search-first UI → design review → E2E/gates → Pages → commit/push/deploy`. Contract/data work blocks logic; logic blocks UI; automated/browser validation blocks Pages; lint/test/build success blocks commit and push. Tasks marked `[P]` touch separate files after their listed dependencies.

User Story 1 and its tests establish safe target identity. User Story 2 consumes only an explicitly selected supported point. User Story 3 supplies trust/evidence invariants consumed by the brief UI; it never supplies permission or recommendation meaning.

## Parallel Examples

- After T002: T003 and T004 can run in parallel.
- After T006/T007: T008, T009, T010 and T011 can run in parallel by file ownership.
- After domain logic: T025, T028 and T031 can be authored in parallel before their components.
- After T037: T038, T039 and T040 can run in parallel as separate E2E specifications.

## Implementation Strategy

1. Complete Phase 1 and prove every package/cache/temp write stays on E drive.
2. Complete Phase 2 before UI so invalid trust and selection states are rejected at the responsible layer.
3. Implement and independently test US1, then US2/US3 domain behavior.
4. Compose the single Search-first page, preserving synthetic labels and accessible state semantics.
5. Resolve only CRITICAL/HIGH review findings; do not use design review to change product/data policy.
6. Publish only after typecheck, lint, tests, E2E and build pass.

## Task Format Validation

All executable tasks use `- [ ] T### [P?] [US?] Description` with exact files, Requirement IDs, design references where applicable, dependencies/blocks and verification. Deferred decisions use explicit `TBD`/`BLOCKED` identifiers and are not prerequisites for Must delivery.
