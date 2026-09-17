# Implementation Plan: 신뢰상태 기반 낚시 포인트 판단 브리프

**Git Branch**: `main` (unborn; remote empty) | **Feature Key**: `001-point-decision-brief` |
**Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: SRS v1.0 Baseline Candidate, Constitution 1.0.0, clarified Feature Spec,
`DESIGN.md`, `DESIGN_DECISIONS.md`, and Phase 0 research

**Scope**: Planning only. No application code, package installation, live API, database migration, or
task generation is performed.

## Summary

Plan a fixture-driven Search-first browser prototype that requires explicit supported-point selection,
assembles data-driven information records into a partial-first DecisionBrief, and presents source/time/status
without converting uncertainty into fact. Domain functions own resolution, freshness, conflict, cache, and
trust invariants. Fake adapters and in-memory stores reproduce every Must state. The UI applies the read-only
Base `DESIGN.md` through Feature-specific `DESIGN_DECISIONS.md` and exposes evidence accessibly.

The smallest fitting technical shape is one React/Vite/strict TypeScript SPA with plain CSS variables,
Vitest/Testing Library, and representative Playwright E2E tests. Router, global state library, backend,
database, map SDK, live provider proxy, and persistent browser storage are deferred. v1.1 adds an approved
official-schema demo and opt-in transient GPS candidate flow. OD-01~03/05/07 and live OD-04 operations remain
approval boundaries; OD-06 stays Search-first.

## Technical Context

**Language/Version**: TypeScript strict mode; existing Node.js v24.19.0 runtime for tooling. Package versions
will be resolved and lockfile-pinned only after implementation approval.

**Primary Dependencies**: React, Vite, browser platform APIs, CSS variables/plain CSS. No router, state library,
query/cache library, runtime schema library, backend framework, database client, map SDK, or provider SDK in
the fixture phase.

**Storage**: Typed fixture modules and in-memory provenance/cache and metrics repositories. No localStorage,
database, or retention promise. A persistent boundary may be selected after OD-02~04 and retention approval.

**Testing**: Vitest; Testing Library with user-event and jest-dom; Playwright for representative browser,
keyboard, mobile viewport, and accessibility flows; automated accessibility rules plus manual screen-reader/
contrast/reduced-motion checks.

**Target Platform**: Evergreen desktop/mobile web browsers; responsive single-page product UI.

**Project Type**: Single frontend web application with pure domain modules and provider-neutral I/O ports.

**Performance Goals**: Emit paired request-start and first-meaningful-render events for every brief session and
calculate p50/p95. No target values before OD-05 baseline approval. A slow fake source cannot indefinitely block
successful sibling data; the production deadline value remains OD-02/architecture TBD.

**Constraints**: Preserve source/time/status and competing evidence; no automatic match or `CONFIRMED`
promotion; no legal/safety/fishing permission inference; no persisted/logged exact user GPS or unnecessary identifiers; no
nationwide collection prerequisite; no Should dependency; no C-drive project dependency/cache/temp install.

**Scale/Scope**: One Search-first feature, four primary UI regions, synthetic limited fixture catalog, and the
complete Must state matrix. Actual points, source fan-out, provider traffic, and retention scale remain TBD.

## Constitution Check

*GATE before research: PASS. Re-check after Phase 1 design: PASS.*

| Principle | Plan evidence | Gate |
|---|---|---|
| I. Requirement ID traceability | Requirement→Module→Test table; contract/model trace sections | PASS |
| II. Must/Should boundary | Core phases contain Must only; compare/access are Deferred | PASS |
| III. Uncertainty first-class | Closed five-state union plus partial/empty results | PASS |
| IV. Provenance preservation | InformationRecord envelope and EvidencePanel contract | PASS |
| V. Safe inaccuracy | explicit selection, no conflict winner, no permission inference | PASS |
| VI. Partial-failure-first | independent adapter settlement and failed-slot retry | PASS |
| VII. Contract/Data first | `data-model.md` and `contracts/` precede logic phases | PASS |
| VIII. Open decisions stay open | OD impact table blocks only dependent work | PASS |
| IX. Privacy minimization | no auth/persistent GPS storage; transient opt-in GPS negative payload tests | PASS |
| X. Validation/observability | paired timing, source health/calls/results/cache metrics | PASS |
| XI. Limited POC first | fixture Phase before blocked live adapter Phase | PASS |
| XII. Design/Requirement separation | root Base Design unchanged; Feature decisions separate | PASS |
| XIII. Accessible state communication | text+icon status, keyboard/mobile/focus contracts | PASS |
| XIV. Test-gated completion | negative cases mapped across six test levels | PASS |
| XV. Layered decision ownership | product/architecture/design decisions remain in owning artifacts | PASS |

Post-design re-check confirms that `data-model.md`, both contract documents, and `quickstart.md` preserve all
invariants. There are no justified constitution violations and therefore no complexity exceptions.

## Project Structure

### Documentation (current feature)

```text
specs/001-point-decision-brief/
├── spec.md
├── checklists/requirements.md
├── design-brief.md
├── stitch-review.md
├── DESIGN_DECISIONS.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   ├── domain-ports.md
│   └── presentation-contract.md
└── quickstart.md
```

`tasks.md` is intentionally absent because `/speckit-tasks` is outside this workflow.

### Planned source code (repository root)

```text
src/
├── app/
│   ├── App.tsx
│   └── app-state.ts
├── domain/
│   ├── contracts.ts
│   ├── errors.ts
│   ├── point-resolver.ts
│   ├── trust-policy.ts
│   ├── conflict-detector.ts
│   └── brief-assembler.ts
├── data/
│   ├── fixture-catalog.ts
│   ├── fixture-adapters.ts
│   ├── memory-provenance-cache.ts
│   └── fixture-brief-definition.ts
├── features/
│   ├── point-discovery/
│   │   ├── SearchForm.tsx
│   │   ├── CandidateList.tsx
│   │   └── StateMessage.tsx
│   └── decision-brief/
│       ├── BriefAvailability.tsx
│       ├── BriefSlot.tsx
│       ├── TrustBadge.tsx
│       ├── EvidencePanel.tsx
│       └── RetryAction.tsx
├── observability/
│   ├── brief-timing.ts
│   ├── source-metrics.ts
│   └── memory-event-sink.ts
├── styles/
│   ├── tokens.css
│   └── global.css
└── testing/fixtures/
    ├── point-scenarios.ts
    ├── brief-scenarios.ts
    └── privacy-scenarios.ts

tests/
├── contract/
├── unit/
├── component/
└── integration/

e2e/
├── search-to-evidence.spec.ts
├── unsupported-no-brief.spec.ts
├── partial-failure.spec.ts
└── accessibility-mobile.spec.ts
```

**Structure Decision**: One app keeps the three true ownership layers visible: `domain` owns pure invariants,
`data` owns replaceable fixture/I/O boundaries, and `features` owns Search-first presentation. No pages/routes,
server, shared package, provider folder, or future-feature scaffold is created until a requirement needs it.

## Architectural Boundaries

### Point Catalog / Resolver

- Candidate search and explicit resolution are separate typed results.
- Resolver accepts normalized query input, returns distinguishable candidates, and never auto-selects.
- Only an explicitly selected `SUPPORTED` point reaches the assembler.
- Catalog unavailable is not converted to unsupported.

Trace: `REQ-FUNC-POINT-001~003`.

### Data Contracts

- `FishingPoint`, `InformationRecord`, `DataSource`, `DecisionBrief`, `ConflictSet`, `FreshnessPolicy`,
  `AdapterResult`, and logical errors are defined before application orchestration.
- `info_type` is an open validated identifier; fixture slot definitions are test-only.
- Discriminated unions/factories prevent evidence-free confirmed records and invalid conflict sets.

Trace: `REQ-FUNC-BRIEF-001`, `REQ-FUNC-TRUST-001~004`, `REQ-NFR-DATA-001~002`.

### Data Source Adapter

- One provider-neutral async function handles success, timeout, rate-limit, malformed, unavailable, and
  unsupported-location outcomes.
- Each source gets an injected cancellation/deadline boundary with no production number yet.
- Raw live payload parsing remains a required trust-boundary addition when OD-04 is approved.
- Browser code never contains provider secrets.

Trace: IF-DATA-SOURCE-ADAPTER, `REQ-NFR-PERF-002`.

### Provenance / Cache

- In-memory repository keys point+info type+source and preserves complete records.
- Latest attempt and prior evidence are separate; a failed refresh does not overwrite the cache.
- Cache read does not change trust status. Missing/unavailable cache is explicit.
- Conflict originals and links are append/preserve operations.

Trace: `REQ-FUNC-BRIEF-003`, `REQ-NFR-AVAIL-001`, `REQ-NFR-DATA-001~002`.

### Trust Policy / Conflict Detector

- Freshness policy is injected by info type; missing policy/time produces unverified.
- New successful collection or verification is the only route from uncertainty to confirmed.
- Conflict detection accepts an injected semantic comparator and eligible-source set in fixtures; real rules
  wait for OD-01/04.
- Unresolved conflict always wins over a single-value display.

Trace: `REQ-FUNC-TRUST-001~005`.

### Decision Brief Assembly

- `BriefDefinition` is injected and data-driven; no product field list is compiled into UI or assembler.
- Source work settles independently; success renders without waiting indefinitely for all sources.
- `BriefAssemblyOutcome` derives `COMPLETE`, `PARTIAL`, or `UNAVAILABLE` data completeness outside the
  persisted DecisionBrief; it does not settle the optional SRS `overall_data_state`.
- Retry replaces only failed attempt state and preserves successful items.

Trace: `REQ-FUNC-BRIEF-001~003`.

### Presentation / Design System

- SearchForm → CandidateList → explicit selection → BriefSlot list → EvidencePanel is the canonical flow.
- Root `DESIGN.md` owns tokens; Feature `DESIGN_DECISIONS.md` owns Search-first, status, and evidence behavior.
- Each state uses text+icon; source/time/status remains in summary or one disclosure away.
- No map, location permission, brand copy, recommendation, or permission claim exists in the core flow.

Trace: `REQ-FUNC-POINT-*`, `REQ-FUNC-BRIEF-*`, `REQ-FUNC-TRUST-*`, Constitution XIII.

### Analytics / Observability

- Client records request start and exactly one first meaningful render using monotonic timing.
- Low-cardinality source metrics count calls, terminal outcomes, cache lookups/serves, last attempt/result/success.
- Ephemeral request correlation is non-identifying; raw query, coordinate, URL, user/device ID, and error text
  are forbidden metric labels.
- Metrics failure never suppresses a usable brief.

Trace: `REQ-NFR-PERF-001`, `REQ-NFR-OBS-001`, `REQ-NFR-PRIV-001~002`,
`REQ-NFR-COST-001`.

## Prototype Data Strategy

### Phase 1 — Fixtures and fakes

Synthetic fixtures reproduce unique support, distinguishable duplicates, ambiguous context, unsupported,
catalog failure, all confirmed, partial+timeout, stale cache, refresh failure with/without cache, all failed,
missing time/provenance/policy, symbolic freshness boundaries, conflict, restart without evidence, zero
restriction records, all adapter failure categories, privacy sentinels, and deterministic metrics.

Each fixture declares expected resolver, adapter, record, brief, Requirement, and Test Case IDs. Names,
locations, sources, fields, and threshold numbers are visibly test-only and do not settle OD-01~04.

### Phase 5 — Limited POC enablement (blocked)

Only after human approval of OD-01~04 may a limited real catalog, actual brief definition, numeric freshness
policy, provider terms, raw-payload validation, live adapter, and justified persistence/backend be added. The
fixture app remains runnable so Phase 5 does not change baseline tests or become their prerequisite.

## Implementation Phases

These are future phases after explicit implementation approval; this workflow stops at planning.

### Phase 0 — Repository/Foundation

- Confirm E-drive-only cache/temp configuration and gitignore before any package install.
- Initialize one Vite React TypeScript app; enable strict compiler/lint/test/build configuration.
- Translate non-brand Base Design tokens to CSS variables without modifying `DESIGN.md`.
- Establish test directories and CI-ready scripts without adding router/server/database.

Exit: build/test runners execute from E drive and no package/cache/temp installation targets C drive.

### Phase 1 — Contracts and Fixtures

- Implement domain unions, result/error types, evidence-bearing construction guards, and ports.
- Build deterministic fake catalog/adapters/cache/event sink and the complete fixture matrix.
- Add contract/schema and privacy negative tests.

Exit: invalid confirmed states, auto-selection, lossy cache, and malformed conflict sets are unrepresentable or
rejected; fixture expectations are traceable.

### Phase 2 — Core Logic

- Implement resolver, freshness/trust policy, conflict detector, partial-first assembler, and failed-slot retry.
- Add virtual-clock/deadline and state-transition tests.
- Add source attempt/health/cache metrics and first-render event pairing.

Exit: TC-POINT, TC-BRIEF, TC-TRUST, and domain NFR tests pass with fakes.

### Phase 3 — Core UI from Design artifacts

- Build Search-first discovery/disambiguation, identity header, brief slots, TrustBadge, EvidencePanel, states,
  and scoped retry.
- Apply responsive, keyboard, focus, live-region, non-color, and reduced-motion behavior.
- Keep every sample visibly demo-only and omit map/login/recommendation/share features; GPS is opt-in candidate-only.

Exit: component and accessibility contracts pass for every required state.

### Phase 4 — Validation and Observability

- Run representative E2E flows and manual visual/screen-reader checks.
- Calculate baseline-capable p50/p95 reports and source health/call/failure/cache reports without asserting
  unapproved targets.
- Reconcile SRS IDs, Design checklist, and all verification evidence.

Exit: all Must Acceptance Criteria and NFR verification methods have evidence; human can review baseline data.

### Phase 5 — POC Adapter Enablement (blocked until approvals)

- Approve OD-01~04 and provider license/terms/cost.
- Add only the required backend/persistence/raw schema validation for the chosen provider boundary.
- Connect a limited approved catalog and freshness rules behind existing contracts.
- Re-run the entire fixture suite plus provider contract/fault tests.

Exit: limited POC is evidence-backed and does not imply nationwide or legal coverage.

### Deferred

- `REQ-FUNC-COMPARE-001` candidate comparison
- `REQ-FUNC-ACCESS-001` access/control evidence flow

They gain independent feature specs, design, and tests only after OD-07 approval; no core module depends on them.

## Test Strategy

- **Contract/schema**: valid entity combinations, adapter outcomes, point results, conflict cardinality,
  provenance/cache completeness, analytics privacy.
- **Unit/state transition**: resolution, symbolic freshness boundaries, evidence-gated promotion, conflict,
  permission negative rules.
- **Component**: candidates, mixed slots, status text+icon, evidence disclosure, scoped retry, focus/live regions.
- **Integration with fake adapters**: partial settlement, never-resolving source, outage+cache, all failed,
  reload/restart without confirmation, deterministic metrics.
- **E2E**: duplicate→explicit selection→brief→evidence; unsupported→no brief; partial failure keeps success;
  keyboard/mobile accessibility smoke.
- **Manual accessibility/design**: contrast, color-independence, screen-reader phrasing, focus return, reduced
  motion, no horizontal-scroll dependency, Base/Feature Design checklist.

Test-only symbolic threshold values prove boundary logic without becoming production freshness policy. Test-only
deadlines prove cancellation behavior without becoming an operational timeout decision.

## Requirement → Module → Test

| Requirement ID | 담당 모듈/컴포넌트 | Test/Verification | Phase |
|---|---|---|---|
| `REQ-FUNC-POINT-001` | PointCatalog, PointResolver, SearchForm | TC-POINT-001 contract/integration/E2E | 1–4 |
| `REQ-FUNC-POINT-002` | PointResolver, CandidateList/Row | TC-POINT-002 unit/component/keyboard E2E | 2–4 |
| `REQ-FUNC-POINT-003` | typed lookup errors, StateMessage | TC-POINT-003 negative integration/E2E | 1–4 |
| `REQ-FUNC-BRIEF-001` | BriefDefinition, Assembler, BriefSlot | TC-BRIEF-001 contract/integration/E2E | 1–4 |
| `REQ-FUNC-BRIEF-002` | Assembler, BriefAvailability, RetryAction | TC-BRIEF-002 fault integration/partial E2E | 2–4 |
| `REQ-FUNC-BRIEF-003` | ProvenanceCache, TrustPolicy, BriefSlot | TC-BRIEF-003 outage+cache integration/E2E | 1–4 |
| `REQ-FUNC-TRUST-001` | InformationRecord, TrustBadge, EvidencePanel | TC-TRUST-001 schema/component/E2E | 1–4 |
| `REQ-FUNC-TRUST-002` | FreshnessPolicy, TrustPolicy | TC-TRUST-002 symbolic boundary unit | 1–2 |
| `REQ-FUNC-TRUST-003` | ConflictDetector/Set, EvidencePanel | TC-TRUST-003 contract/integration/E2E | 1–4 |
| `REQ-FUNC-TRUST-004` | TrustPolicy transition guard | TC-TRUST-004 table/property unit + restart integration | 1–2 |
| `REQ-FUNC-TRUST-005` | TrustPolicy, empty StateMessage | TC-TRUST-005 safety-negative component/E2E | 2–4 |
| `REQ-NFR-PERF-001` | brief-timing, event sink | TC-NFR-PERF-001 pairing/report calculation | 2–4 |
| `REQ-NFR-PERF-002` | adapter deadline, Assembler | TC-NFR-PERF-002 virtual-clock fault injection | 1–2 |
| `REQ-NFR-AVAIL-001` | ProvenanceCache, TrustPolicy, BriefSlot | TC-BRIEF-003 cache freshness distortion negative | 1–4 |
| `REQ-NFR-OBS-001` | source-metrics, source health | TC-NFR-OBS-001 metrics inspection | 2–4 |
| `REQ-NFR-DATA-001` | InformationRecord, repository, EvidencePanel | TC-TRUST-001 schema and presentation contract | 1–4 |
| `REQ-NFR-DATA-002` | ConflictSet/repository | TC-TRUST-003 persistence/overwrite negative | 1–2 |
| `REQ-NFR-PRIV-001` | all schemas, captured sinks | TC-NFR-PRIV-001 inventory/sentinel inspection | 1–4 |
| `REQ-NFR-PRIV-002` | Search-first UI and analytics | TC-NFR-PRIV-001 no geolocation/storage/log | 1–4 |
| `REQ-NFR-COST-001` | source-metrics | TC-NFR-COST-001 calls/failure/cache report | 2–4 |
| `REQ-NFR-COST-002` | fixture architecture review | TC-NFR-COST-001 no nationwide dependency | 0–5 |
| `REQ-FUNC-COMPARE-001` | separate future feature | Deferred test after OD-07 | Deferred |
| `REQ-FUNC-ACCESS-001` | separate future feature | Deferred evidence test after OD-07 | Deferred |

## Open Decision Impact

| Open Decision | 현재 Plan 처리 | 어떤 Phase를 차단하는가 |
|---|---|---|
| OD-01 brief minimum set | open `info_type` + injected test-only BriefDefinition | Phase 5 actual content/catalog mapping |
| OD-02 freshness/timeout | policy/deadline ports + symbolic tests; no production number | Phase 5 actual freshness and operational deadline |
| OD-03 initial POC points | synthetic fixture point IDs only | Phase 5 real catalog |
| OD-04 provider/API/license | KHOA schema/license approved; demo adapter only | live proxy/account/secret choice |
| OD-05 KPI targets | compute baseline p50/p95 and status interpretation measures | target-based release evaluation after Phase 4 baseline |
| OD-06 UI structure | Search-first fixed in Feature Design | nothing; map/provider remains separate |
| OD-07 Should release | compare/access excluded from core and listed Deferred | only their future feature phases |

## Risks and Controls

| Risk | Control |
|---|---|
| Fixture examples mistaken for product policy | visible sample labels; open `BriefDefinition`; OD table review |
| Cached value hides current source failure | immutable evidence + separate attempt outcome; dual UI explanation |
| React development behavior duplicates telemetry | emit at user/controller boundary with request ID and one-shot guard |
| Browser-only prototype cannot prove persistence/real provider health | scope proof to contracts/behavior; Phase 5 explicitly blocked |
| Provider later requires secrets/CORS | add minimal backend only behind approved adapter boundary |
| Generic conflict comparison creates false disagreement/agreement | comparator and source eligibility injected; real rules await approval |
| Accessibility automation passes while meaning fails | keyboard/mobile E2E plus manual screen-reader/color review |
| Tooling writes to C drive | pre-install E-drive cache/temp verification and post-install path audit |

## Complexity Tracking

No constitution violation is required. The selected single-app architecture is the simplest complete design;
there are no exceptions to justify.

## v1.1 Implementation Plan

### Architecture delta

Keep existing domain/data/observability modules unchanged. Add a separate `official-index` feature boundary:

- `src/official-index/contracts.ts`: additive assessment, official point, environment and provider results.
- `src/official-index/demo-provider.ts`: deterministic, visibly demo official-schema fixture.
- `src/official-index/location-candidates.ts`: pure Haversine candidate ranking with no persistence/logging.
- `src/features/official-index/*`: geolocation action, candidate confirmation, environment/species presentation.
- Existing `TrustStatus` is imported and reused; official score does not enter trust logic.

The production client contains no provider key and no official direct-call adapter. Future live enablement adds
one approved server-side proxy behind the same provider result contract. No serverless vendor is selected in
this release.

### Delivery phases

1. Add v1.1 contracts and privacy/contract tests.
2. Add GPS candidate calculation and denied/unavailable/no-candidate tests.
3. Refactor presentation shell without changing existing domain/data/observability semantics.
4. Add demo official-index section, failure/stale/missing-field fixtures and UI tests.
5. Run existing regression plus typecheck/lint/Vitest/Playwright/build and inspect 1440×900 and 390×844.
6. Deploy Pages. Live provider remains `LIVE_API_MANUAL_CONFIGURATION_REQUIRED` until proxy/key approval.

### v1.1 requirement mapping

| Requirement | Module | Verification |
|---|---|---|
| `REQ-FUNC-OFFICIAL-001~004` | official contracts/demo provider/UI | contract, component, E2E |
| `REQ-FUNC-LOCATION-001~002` | location candidates/GPS UI | unit, denied/unavailable E2E |
| `REQ-NFR-SEC-001` | no-live-client boundary | source/bundle secret scan |
| `REQ-NFR-PRIV-003` | transient GPS controller | privacy payload and storage spy tests |
| `REQ-NFR-DATA-003` | official result parser boundary | malformed/missing-field tests |
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
