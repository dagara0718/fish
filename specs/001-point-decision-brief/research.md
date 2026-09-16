# Phase 0 Research: 신뢰상태 기반 낚시 포인트 판단 브리프

**Date**: 2026-09-16
**Repository evidence**: application source/package/config absent; remote repository has no refs; Node
v24.19.0 and npm 11.17.0 are already installed. No dependency installation was performed.
**Open decisions preserved**: OD-01 through OD-05 and OD-07; OD-06 = Search-first.

## Decision 1 — Single browser SPA

**Decision**: Plan a single React + Vite + strict TypeScript browser application with CSS variables and
plain reusable CSS. Use Vitest, Testing Library/user-event/jest-dom, and Playwright for implementation-time
proof. Resolve and lock actual package versions only when implementation is approved.

**Rationale**: The repository is empty, the requested product is an interactive Search-first browser flow,
and the recommended stack provides typed domain unions plus accessible component and E2E testing with minimal
structure. The runtime already exists, so no installation is needed in this planning phase.

**Alternatives considered**: Next.js/full stack, monorepo, native mobile, and multi-package architecture add
server/deployment boundaries not required by the fixture POC. Vanilla DOM would reduce dependencies but make
stateful accessibility/component proof less direct than the workflow's established default.

## Decision 2 — No router or state library

**Decision**: Keep one page with local component state and a page-level reducer/controller. Add a router only
when independent routes, deep links, or navigation requirements exist; add a state/cache library only when
remote data behavior demonstrates the need.

**Rationale**: Search → candidates → explicit selection → brief → evidence is one cohesive state machine.
Typed reducer events make ambiguous, unsupported, loading, partial, and evidence states explicit without a
global dependency.

**Alternatives considered**: React Router, Redux/Zustand, and remote-query libraries create unused lifecycle
and cache semantics while Phase 1 uses deterministic fakes.

## Decision 3 — No backend, database, persistent browser storage, map, or live provider

**Decision**: Phase 1 runs a typed fixture catalog, fake adapters, in-memory provenance/cache repository, and
in-memory metrics sink in the browser. Search-first uses `region_context`, not a map. A backend is considered
only in blocked Phase 5 if an approved provider requires secrets, CORS mediation, aggregation, or server-side
terms enforcement. Provider secrets must never enter the browser.

**Rationale**: These choices prove Must behavior without inventing retention, provider, map, or point policy.
Memory reset is acceptable for repeatable prototypes and avoids accidental personal/location persistence.

**Alternatives considered**: localStorage risks persistence semantics and privacy leakage; a DB/server and live
map/API prematurely decide OD-02 through OD-04 and add operations cost. MSW is unnecessary while adapters are
direct fakes; raw-payload schema validation becomes necessary only at a live trust boundary.

## Decision 4 — E-drive-only installation boundary

**Decision**: This planning workflow installs nothing. A later approved implementation must place the project,
dependency tree, npm cache, and task-specific temporary directory under
`E:\Users\keun0\Desktop\fish`; generated cache/temp paths are gitignored. It must not install project
dependencies or caches on C drive.

**Rationale**: This is an explicit repository instruction. Node/npm are already available, so system-level
installation is neither needed nor allowed by this plan.

**Alternatives considered**: Default global npm cache or tool installation can write to C drive and is therefore
not acceptable.

## Decision 5 — Domain owns identification and trust

**Decision**: Use six core responsibilities: `PointCatalog/PointResolver`, provider-neutral
`DataSourceAdapter`, evidence-bearing `InformationRecord`, `FreshnessPolicy/TrustPolicy`, `ConflictDetector`,
and `DecisionBriefAssembler`. UI consumes results and does not perform matching, freshness calculation, or
conflict winner selection.

**Rationale**: Safety invariants belong in deterministic domain functions shared by every presentation state.
This prevents UI shortcuts from creating a point or confirmed fact.

**Alternatives considered**: UI-local fuzzy matching or status derivation duplicates rules and can violate
`REQ-FUNC-POINT-002~003` and `REQ-FUNC-TRUST-002~005`.

## Decision 6 — Open, evidence-bearing data model

**Decision**: Keep `info_type` and `point_type` as validated open identifiers until OD-01. Model
`InformationRecord` as a value plus provenance/time/trust evidence envelope, preferably via discriminated
unions/factories that prevent invalid combinations. A `CONFIRMED` record requires a value, known source,
applicable time evidence, successful validation, and an approved applicable freshness policy.

**Rationale**: A fixed brief object or closed enum would decide the product field set. Optional fields without
construction guards make evidence-free confirmation too easy.

**Alternatives considered**: Fixed weather/tide/access fields, sample-derived enums, and value-only cache maps
violate OD-01 and provenance requirements.

## Decision 7 — Search and explicit selection are separate

**Decision**: Search returns candidate/no-match/catalog-failure results. Selection resolves only an explicitly
chosen `SUPPORTED` point. Similarity can find candidates but never selects the highest score or first row.
`REVIEW_REQUIRED` is not supported selection.

**Rationale**: Search result presence is not authority to create a brief. This keeps identical names and missing
context safe.

**Alternatives considered**: Auto-selecting a single or top fuzzy result is rejected because it can attach
credible-looking data to the wrong place.

## Decision 8 — Adapter outcomes are data

**Decision**: One provider-neutral asynchronous function returns a discriminated outcome: success, timeout,
rate-limited, malformed, unavailable, or unsupported-location. Raw payload validation occurs at the adapter
boundary before normalization. Individual deadlines/cancellation are injectable; their production numbers
remain TBD.

**Rationale**: Expected source failures must be composable with sibling successes and testable without
exception-only control flow. Unsupported location applies to one source slot, not automatically the point.

**Alternatives considered**: Provider classes exposed to core/UI couple OD-04 early. Uncaught rejection and
all-or-nothing aggregation hide partial data.

## Decision 9 — Immutable evidence plus separate collection attempts

**Decision**: Preserve prior successful/cached `InformationRecord` and record the latest collection attempt as
a separate outcome. A failed refresh never overwrites old evidence. Cache keys use point, info type, and source;
cached values keep full source/time/status/reference. Retention remains TBD.

**Rationale**: “Old evidence exists” and “current refresh failed” are two simultaneous facts. A single mutable
status loses one and can present old data as live.

**Alternatives considered**: Overwriting the record with failure loses the value; keeping only the old status
hides the failure. Persistent storage is unnecessary for Phase 1.

## Decision 10 — Evidence-gated freshness and transitions

**Decision**: Freshness policy returns fresh, stale, policy missing, or time missing. Policy/time missing yields
unverified; freshness alone does not confirm without provenance. Time may move confirmed to stale but never the
reverse. Stale, unverified, collection-failed, and conflict require new collection or verification evidence to
become confirmed.

**Rationale**: This is the root invariant behind `REQ-FUNC-TRUST-002~004` and prevents restart/cache/time-based
promotion.

**Alternatives considered**: A default freshness number or automatic status normalization would decide OD-02
and violate SRS safety.

## Decision 11 — Conflict is preserved, not ranked

**Decision**: `ConflictSet` references at least two immutable records and renders all evidence equally. Actual
source trust qualification and value comparators are injected by test fixtures until OD-01/04. Resolution needs
new verification evidence.

**Rationale**: Generic string comparison or provider ranking can manufacture a winner where semantics and
provider authority are not approved.

**Alternatives considered**: Last-write-wins, source priority, averages, and a “most likely” value violate
`REQ-FUNC-TRUST-003` and `REQ-NFR-DATA-002`.

## Decision 12 — Partial-first assembly

**Decision**: Fan out source calls independently and settle them in an all-settled manner with per-source
termination. Return successful items as soon as a first meaningful brief can render; late/failing slots remain
explicit. Retry only failed slots and preserve successful state. All-failed returns a terminal unavailable brief,
not infinite loading.

**Rationale**: This directly implements `REQ-FUNC-BRIEF-002~003` and `REQ-NFR-PERF-002`.

**Alternatives considered**: `Promise.all`-style fail-fast and waiting for every source contradict partial data
and make a slow source a global blocker.

## Decision 13 — Layered, traceable test proof

**Decision**: Put exhaustive state combinations in contract/unit tests; orchestration and faults in fake-adapter
integration tests; semantics/focus in component tests; and only representative vertical flows in Playwright.
Add manual visual/screen-reader checks where automation cannot prove meaning.

**Rationale**: This is the smallest sufficient proof without snapshot-only blind spots or duplicating all
fixtures in slow E2E runs.

**Alternatives considered**: Snapshot-only tests cannot prove invariants; all-E2E is slow and brittle; axe-only
cannot prove focus restoration or non-color understanding.

## Decision 14 — Deterministic fixture matrix

**Decision**: Provide synthetic, visibly sample fixtures for unique support, same-name distinguishable,
ambiguous context, unsupported, catalog unavailable, all-confirmed, partial+timeout, failure+cache, failure without
cache, all failed, missing time, missing provenance, missing policy, symbolic threshold boundaries, conflict,
no-evidence restart, zero restriction records, all adapter failure kinds, privacy sentinels, and deterministic
metrics. Each fixture links Requirement and TC IDs.

**Rationale**: Fixtures reproduce all first-class states without selecting real points, providers, fields, or
thresholds.

**Alternatives considered**: Realistic named production data can be mistaken for OD-03/04 decisions; random
fixtures reduce failure reproducibility.

## Decision 15 — Client first-meaningful-render timing

**Decision**: Emit `brief_request_started` when an explicitly selected supported point dispatches a request.
Emit `brief_first_meaningful_rendered` exactly once when a usable item or terminal unavailable state is painted;
skeleton and later slots do not re-emit. Correlate with an ephemeral request ID and calculate count/p50/p95.

**Rationale**: Server timing misses user-visible render, while waiting for every source violates partial-first.
The test asserts event pairing and computability, not an unapproved latency target.

**Alternatives considered**: Server response duration and all-sources-complete timing are not the SRS measure.

## Decision 16 — Low-cardinality source observability

**Decision**: Count calls and terminal results by `source_id`/outcome, count cache lookup hit/miss and cache
served reasons, and expose source health containing last attempt, last result, and last success. Never label
metrics with raw query, point, coordinates, URL, error text, user/device/session identity.

**Rationale**: Failure rate and cache utilization remain calculable without high-cardinality privacy leakage.

**Alternatives considered**: Unstructured logs alone make rates unreliable; provider dashboards/DB are
premature in fixture phase.

## Decision 17 — Privacy as a negative contract

**Decision**: Core UI/domain/analytics schemas contain no required personal fields or exact user coordinates.
Search-first does not request geolocation. Captured sinks and storage/log inspection use sentinel values to prove
raw query, email/device ID, and exact coordinates are absent. Correlation IDs are ephemeral and non-identifying.

**Rationale**: Preventing collection is safer and simpler than collecting then attempting redaction.

**Alternatives considered**: Exact/coarse location is unnecessary for Must flow; collect-and-redact retains
leakage risk.

## Decision 18 — Accessibility proof beyond automated rules

**Decision**: Component tests verify semantic labels, text+icon statuses, live messages, disclosure names, and
focus. Keyboard E2E covers search → candidate → explicit select → brief → evidence → close/focus return.
Narrow viewport E2E proves no horizontal-scroll dependency. Automated accessibility checks are paired with a
manual contrast, color-independence, reduced-motion, and screen-reader checklist.

**Rationale**: Automated rules cannot establish that conflict evidence is equally understandable or that
state meaning survives color removal.

**Alternatives considered**: Color/screenshot checks alone and axe-only validation are insufficient.

## Unresolved by design

## v1.1 Research — 국립해양조사원 바다낚시지수

### Decision 19 — Official operation and schema

The official public-data catalog `15142486` documents
`GET https://apis.data.go.kr/1192136/fcstFishingv2/GetFcstFishingApiServicev2`. Required parameters are
`serviceKey`, `type`, and `gubun`; optional parameters are `reqDate`, pagination, include/exclude and
`placeName`. The response schema exposes location name/coordinates, prediction date/time, target species,
official index/score, tide score/content and min/max wave height, water/air temperature, current speed and
wind speed. It describes a seven-day forecast. No stable provider point ID or update cadence is documented,
so both remain service-catalog mapping/TBD rather than invented fields.

### Decision 20 — Provider security boundary

The public gateway returned origin-specific CORS headers for the Pages origin, but the authentication key is
a required query parameter. Browser CORS compatibility does not protect the secret. GitHub Pages therefore
uses a demo provider only. Live enablement requires an approved server-side proxy with secret storage,
request allowlisting, schema validation, timeout/quota control and attribution. Cloudflare Workers, Vercel
Functions and Netlify Functions are viable small boundaries, but selecting one requires the user's account,
deployment and secret-management approval; no vendor is chosen now.

### Decision 21 — GPS candidate mapping is local and confirmatory

Browser Geolocation is requested only from a button. Raw coordinates remain in transient memory and are
used only for Haversine distance to known official-point references. The result is a ranked candidate list,
not a resolved point. The user must select a candidate. No coordinate enters storage, URLs, telemetry or
errors. Permission denied/unavailable/no-nearby-point returns a recoverable UI state.

### Decision 22 — Official assessment and trust are orthogonal

`totalIndex`/`lastScr` are provider assessment fields; TrustStatus describes evidence freshness and collection
quality. A “좋음” official grade may be `STALE`. Environment metrics are per-observation records because their
time/source/status can differ. `ENVIRONMENT_BASED_GUIDANCE` is a reserved discriminator only and cannot be
emitted by the v1.1 application.

### Official operational facts

- License: 공공저작물 출처표시 제1유형; free.
- Development traffic: 10,000; production increase requires review/use-case registration.
- Documented result codes: success; `03` no data; `10` invalid parameter; `11` missing parameter; `99` other,
  plus portal gateway application/HTTP/timeout/auth/quota errors.
- Catalog created 2025-03-19 and modified 2026-07-10.
- Update frequency: `TBD_PROVIDER_CONFIRMATION`.


| Decision | Research boundary |
|---|---|
| OD-01 brief fields | Open identifier and injected fixture definition only |
| OD-02 freshness/timeout values | Injectable interface and symbolic boundary tests only |
| OD-03 POC points | Synthetic fixture IDs only |
| OD-04 providers/licenses | KHOA schema/license approved for v1.1; live proxy/account/secret remains TBD |
| OD-05 KPI targets | Events and p50/p95 calculation only; `TBD_AFTER_BASELINE` |
| OD-06 UI structure | Search-first decided; map/API not selected |
| OD-07 Should release | Comparison/access remain deferred and create no core dependency |
# v1.2 governing delta

The current user-approved scope is documented in [v1.2-product-delta.md](v1.2-product-delta.md) and [live-map contract](contracts/live-map.md). Those additive requirements supersede earlier map/provider deferrals for this release only. Baseline and v1.1 behavior remains available in explicit DEMO mode. Live is default, uses validated official catalog/provider data, and never falls back to fixtures. Root DESIGN.md remains read-only. Cloudflare Worker ownership, transient GPS privacy, conservative trust policy, rollback and verification are specified in the delta.
