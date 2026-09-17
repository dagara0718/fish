# Data Model: 신뢰상태 기반 낚시 포인트 판단 브리프

**Status**: Phase 1 design; no persistence migration or implementation
**Source**: SRS Data/Interface/Sequence, Feature Spec, Constitution
**Open boundaries**: OD-01 info types, OD-02 thresholds, OD-03 points, OD-04 providers

## Invariants

1. A DecisionBrief exists only for an explicitly selected `SUPPORTED` FishingPoint.
2. A displayed InformationRecord keeps value and provenance metadata in one traceable object.
3. Missing source/time evidence cannot produce `CONFIRMED`.
4. `STALE`, `UNVERIFIED`, `COLLECTION_FAILED`, and `CONFLICT` do not transition to `CONFIRMED`
   without new collection or verification evidence.
5. One adapter failure does not remove successful sibling records.
6. Cached values retain original basis time and attempted-refresh outcome; cache presence alone is not
   confirmation.
7. Conflicting records remain intact in a ConflictSet until evidence-based resolution.
8. Missing restriction/access evidence never yields fishing, safety, or legal permission.
9. Exact user GPS and unrelated personal identifiers are absent from the core model.

## FishingPoint

Represents a catalogued candidate, not an arbitrary coordinate.

| Field | Logical type | Required | Validation and meaning |
|---|---|---:|---|
| `point_id` | opaque string | yes | Stable and unique inside the supported catalog |
| `name` | non-empty string | yes | User-visible name; not globally unique |
| `region_context` | non-empty string or structured label | yes for selectable result | Separates same/similar names |
| `point_type` | open string | no | Display-only classification; vocabulary remains TBD |
| `support_status` | enum | yes | `SUPPORTED`, `UNSUPPORTED`, `REVIEW_REQUIRED` |
| `location_ref` | opaque spatial reference | no | Provider-neutral; not user exact GPS |

Rules:

- Only `SUPPORTED` can be selected for brief assembly.
- Missing distinguishing context for multiple matches produces `AMBIGUOUS`, not a selected point.
- OD-03 controls which concrete points enter a POC; fixtures use fictional identifiers.

## InformationRecord

Represents one data-driven information slot and its evidence.

| Field | Logical type | Required | Validation and meaning |
|---|---|---:|---|
| `record_id` | opaque string | yes | Unique record identity |
| `point_id` | FishingPoint reference | yes | Must refer to the selected supported point |
| `info_type` | open string | yes | Extensible key; closed list forbidden before OD-01 |
| `value` | typed payload | conditional | May be absent for failure/unverified states |
| `source_id` | DataSource reference | conditional | Required for `CONFIRMED`; otherwise absence reason retained |
| `basis_time` | date/time | conditional | When the value is true of the world |
| `checked_at` | date/time | conditional | When the source/evidence was last checked |
| `fetched_at` | date/time | conditional | When collection occurred |
| `trust_status` | TrustStatus | yes | Canonical five-state vocabulary |
| `source_reference` | opaque URL/reference | no | Safe route to original evidence |
| `status_reason` | structured reason | yes for non-confirmed | Explains stale, unverified, failed, or conflict |
| `cache_state` | CacheState | no | Present when a stored value participates |

Time validation:

- `fetched_at` and `checked_at` cannot silently replace `basis_time`; their meanings stay distinct.
- Time absence is modeled, not synthesized.
- No numeric freshness decision is made when FreshnessPolicy is unavailable.

## TrustStatus

Closed enum: `CONFIRMED`, `STALE`, `UNVERIFIED`, `COLLECTION_FAILED`, `CONFLICT`.

### Evidence-gated transitions

| From | To | Required evidence |
|---|---|---|
| initial | `UNVERIFIED` | no sufficient verification evidence |
| `UNVERIFIED` | `CONFIRMED` | valid source and applicable time verification |
| `CONFIRMED` | `STALE` | approved policy exists and threshold is exceeded |
| `STALE` | `CONFIRMED` | new successful collection/verification |
| any non-conflict | `COLLECTION_FAILED` | explicit attempted collection failure |
| `COLLECTION_FAILED` | `CONFIRMED` | new successful collection, not cached read |
| `CONFIRMED`/`STALE`/`UNVERIFIED` | `CONFLICT` | trustworthy sources have unresolved disagreement |
| `CONFLICT` | `CONFIRMED` | explicit verification resolves conflict and records resolution evidence |

Forbidden transitions include time passage, restart, deserialization, or cache read directly to
`CONFIRMED`.

## DataSource

| Field | Logical type | Required | Meaning |
|---|---|---:|---|
| `source_id` | opaque string | yes | Stable provider/source identity |
| `source_name` | string | yes | Displayable provenance label |
| `source_type` | open string | no | Taxonomy remains TBD |
| `license_or_terms` | reference/note | conditional for live adapter | Reviewed usage boundary |
| `last_success_at` | date/time | no | Most recent successful collection |
| `last_attempt_at` | date/time | no | Most recent attempt, successful or not |
| `collection_status` | enum | yes after an attempt | `SUCCESS`, `FAILURE`, `DEGRADED` |

Concrete sources remain fixture identities until OD-04 review.

## AdapterResult

A discriminated result, never an exception-only contract:

- `SUCCESS`: record candidate plus source and collection timestamps.
- `TIMEOUT`: source, attempt time, retriable metadata without a fixed timeout value.
- `RATE_LIMITED`: source, attempt time, provider-safe retry metadata if known.
- `MALFORMED`: source, attempt time, validation issues; raw unsafe value is not confirmed.
- `UNAVAILABLE`: source and attempt time.
- `UNSUPPORTED_LOCATION`: source and requested provider-neutral location reference.

Every non-success can coexist with successes from other adapters.

## CacheState

| Field | Logical type | Required | Meaning |
|---|---|---:|---|
| `stored_at` | date/time | yes | Cache write time, not basis time |
| `record_basis_time` | date/time or absent | yes | Original basis time or explicit absence |
| `last_refresh_attempt_at` | date/time | no | Most recent refresh attempt |
| `last_refresh_result` | adapter failure category | no | Why cached data is being used |

The fixture prototype uses an in-memory repository implementing this boundary. Persistent cache
technology and retention are deferred until a limited POC establishes need.

## ConflictSet

| Field | Logical type | Required | Meaning |
|---|---|---:|---|
| `conflict_id` | opaque string | yes | Conflict identity |
| `point_id` | FishingPoint reference | yes | Affected point |
| `info_type` | open string | yes | Affected information slot |
| `record_ids` | list of 2+ record references | yes | All competing evidence, no silent winner |
| `detected_at` | date/time | yes | Detection time |
| `resolution_status` | enum | yes | `UNRESOLVED`, `VERIFIED` |
| `verification_path` | reference/note | conditional | Evidence used or route for user review |
| `resolved_record_id` | record reference | conditional | Allowed only when status is `VERIFIED` |

Deletion or overwrite of competing records is forbidden during unresolved conflict.

## DecisionBrief

| Field | Logical type | Required | Meaning |
|---|---|---:|---|
| `brief_id` | opaque string | yes | Assembly identity |
| `point_id` | supported FishingPoint reference | yes | Explicitly selected target |
| `generated_at` | date/time | yes | Assembly time, not data basis time |
| `items` | ordered list of InformationRecord references | yes | May contain mixed trust states |
| `source_outcomes` | list of source attempt summaries | yes | Supports partial failure and observability |

Item ordering remains policy-driven after OD-01; fixtures use arbitrary sample order. The SRS's optional
`overall_data_state` is not added or persisted before its meaning is approved.

## BriefAssemblyOutcome

A response envelope around, not a field persisted inside, DecisionBrief:

- `AVAILABLE`: a brief plus `COMPLETE` or `PARTIAL` data-completeness result.
- `UNAVAILABLE`: an optional brief containing failure items plus terminal errors.

Completeness is derived for orchestration/UI and summarizes data presence only. It MUST NOT be named or
rendered as safety, legal, fishing suitability, recommendation, or an approved `overall_data_state`.

## PointLookupResult

- `MATCHES`: one or more supported candidates with distinguishing context; still requires explicit selection.
- `NO_MATCH`: no supported candidate.
- `AMBIGUOUS`: candidates cannot be safely distinguished.
- `CATALOG_UNAVAILABLE`: lookup could not be completed.

There is no “best guess” or implicit selected result.

## FreshnessPolicy

Provider-neutral policy lookup by `info_type` returning either an approved threshold rule or
`POLICY_UNAVAILABLE`. OD-02 owns actual rules and numbers. When policy/time is absent, the trust result is
`UNVERIFIED`, never a guessed `CONFIRMED`.

## AnalyticsEvent

Allowed event shapes contain a generated session/test correlation token, event name, point fixture ID where
needed, source ID where needed, monotonic timing or timestamp, outcome category, and cache-use flag.
Core events include consideration start, point selected, brief request, first brief render, source attempt/
success/failure, cache used, and trust detail opened. No name, email, exact user GPS, or advertising identifier
is required.

## Relationships

```text
FishingPoint 1 ── * InformationRecord
FishingPoint 1 ── * DecisionBrief
DecisionBrief 1 ── * InformationRecord
DataSource 1 ── * InformationRecord
ConflictSet 1 ── 2..* InformationRecord
FreshnessPolicy 1 ── * info_type (only after approval)
DecisionBrief 1 ── * source outcome summaries
```

## Requirement Trace

## v1.1 Additive Entities

### AssessmentType

Closed union: `OFFICIAL_FISHING_INDEX | ENVIRONMENT_BASED_GUIDANCE`. Only the first is constructible as a
user result in v1.1.

### OfficialFishingPointRef

Service-owned `officialPointId`, provider `placeName`, `latitude`, `longitude`, `fishingType`, display region
and source identity. The provider schema exposes no stable ID, so the service ID must never be presented as a
provider-issued identifier.

### LocationCandidate

Contains `point`, `mappingMethod: DISTANCE_CANDIDATE`, `distanceKm`, and `userConfirmed: false`. It stores no
raw user coordinate and cannot be converted into a selected point without a separate user action.

### OfficialSpeciesIndex

Contains `assessmentType: OFFICIAL_FISHING_INDEX`, provider species identity/name, official grade,
optional official score, evaluated/prediction time, official point reference, source evidence and one of the
existing five TrustStatus values. Official score and TrustStatus are not convertible to each other.

### MarineEnvironmentSnapshot / EnvironmentalObservation

Snapshot contains official point reference and `observations[]`. Each observation owns metric type, value,
unit, observed/forecast time, source timestamp/evidence and TrustStatus. Wave, temperature, tide, current,
air temperature and wind are separate observations; missing provider fields create no fabricated value.

### OfficialIndexResult

Discriminated outcomes: `SUCCESS`, `PARTIAL`, `STALE_CACHE`, `COLLECTION_FAILED`, `UNSUPPORTED_POINT`,
`MALFORMED`. Demo/live provenance is explicit and never merged invisibly.

### v1.1 Invariants

- No automatic nearest-point selection and no `userConfirmed: true` without a user event.
- Raw GPS is absent from persisted/domain/observability payloads.
- Only official response fields become official species/environment records.
- Provider failure cannot substitute fixture data in live mode.
- Official grade/score never promotes TrustStatus to `CONFIRMED`.


| Model boundary | Requirements |
|---|---|
| FishingPoint / PointLookupResult | `REQ-FUNC-POINT-001~003` |
| DecisionBrief / BriefAssemblyOutcome | `REQ-FUNC-BRIEF-001~003`, `REQ-NFR-PERF-002` |
| InformationRecord / TrustStatus / FreshnessPolicy | `REQ-FUNC-TRUST-001~005`, `REQ-NFR-DATA-001` |
| CacheState | `REQ-FUNC-BRIEF-003`, `REQ-NFR-AVAIL-001` |
| ConflictSet | `REQ-FUNC-TRUST-003`, `REQ-NFR-DATA-002` |
| DataSource / AdapterResult / AnalyticsEvent | `REQ-NFR-OBS-001`, `REQ-NFR-COST-001` |
| Excluded user GPS | `REQ-NFR-PRIV-001~002` |
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
