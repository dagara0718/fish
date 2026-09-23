# Domain Port Contracts

These are logical TypeScript-oriented contracts for planning and verification. They do not select a network
protocol, database, provider, endpoint, or generated source file.

## PointCatalog

```text
findCandidates(query) ->
  MATCHES(candidates: FishingPoint[1..n])
  | NO_MATCH
  | AMBIGUOUS(candidates, missing_context)
  | CATALOG_UNAVAILABLE(reason)

selectPoint(point_id) ->
  SELECTED(point: FishingPoint where support_status = SUPPORTED)
  | POINT_UNSUPPORTED
  | POINT_AMBIGUOUS
  | CATALOG_UNAVAILABLE
```

Invariants:

- Query text is treated as lookup input, not an arbitrary coordinate.
- A candidate result never implies selection.
- The first candidate is never selected automatically.
- Brief assembly accepts only a successful explicit selection.

Trace: `REQ-FUNC-POINT-001~003`.

## DataSourceAdapter

```text
collect(request: {
  point_ref,
  requested_info_type,
  time_context
}) -> Promise<
  SUCCESS(candidate_record, source_id, basis_time?, checked_at?, fetched_at)
  | TIMEOUT(source_id, attempted_at)
  | RATE_LIMITED(source_id, attempted_at, retry_hint?)
  | MALFORMED(source_id, attempted_at, issues)
  | UNAVAILABLE(source_id, attempted_at)
  | UNSUPPORTED_LOCATION(source_id, attempted_at)
>
```

Invariants:

- Provider payloads are normalized only behind this port.
- A `SUCCESS` is not automatically `CONFIRMED`; trust policy validates source and time evidence.
- Each adapter terminates independently under a configurable policy whose numeric value is OD-02/architecture TBD.
- Multiple adapters settle independently so one failure cannot discard sibling success.
- Live implementations require OD-04 terms/license approval; Phase 1 uses fakes.

Trace: IF-DATA-SOURCE-ADAPTER, `REQ-NFR-PERF-002`, `REQ-NFR-COST-001`.

## ProvenanceRepository

```text
readLatest(point_id, info_type) -> InformationRecord | NOT_FOUND | CACHE_UNAVAILABLE
saveRecord(record_with_provenance) -> SAVED | CACHE_UNAVAILABLE
saveConflict(conflict_set_and_records) -> SAVED | CACHE_UNAVAILABLE
readSourceHealth(source_id) -> SourceHealth | NOT_FOUND
recordSourceAttempt(outcome) -> RECORDED | OBSERVABILITY_DEGRADED
```

Invariants:

- Value, source, time, and trust status are saved as one traceable aggregate.
- Cached reads do not change trust status.
- Conflicting originals are append/preserve operations, not overwrite operations.
- Cache failure is explicit and cannot make old data appear current.
- The fixture implementation is in memory; retention and persistent technology remain TBD.

Trace: `REQ-FUNC-BRIEF-003`, `REQ-NFR-AVAIL-001`, `REQ-NFR-DATA-001~002`,
`REQ-NFR-OBS-001`.

## FreshnessPolicy

```text
lookup(info_type) -> APPROVED_POLICY(rule) | POLICY_UNAVAILABLE
evaluate(rule, basis_time?, checked_at?, now) -> FRESH | STALE | TIME_UNVERIFIABLE
```

Invariants:

- No default numeric threshold is invented.
- Missing policy/time yields `TIME_UNVERIFIABLE`, mapped to `UNVERIFIED` unless another stronger state applies.
- Policy configuration is data-type-specific and requires OD-02 approval.

Trace: `REQ-FUNC-TRUST-002`, OD-02.

## TrustPolicy

```text
assess(record_candidate, freshness_result, collection_outcome, conflicts) ->
  CONFIRMED | STALE | UNVERIFIED | COLLECTION_FAILED | CONFLICT

transition(previous_status, evidence_event) -> allowed(new_status) | rejected(reason)
```

Precedence for simultaneous conditions:

1. unresolved trustworthy conflict → `CONFLICT`
2. explicit current collection failure without usable value → `COLLECTION_FAILED`
3. missing validation evidence/policy/time → `UNVERIFIED`
4. approved policy says expired → `STALE`
5. valid source and time evidence with successful verification → `CONFIRMED`

For a failed refresh with usable cached value, the record retains the value's time and stale/unverified meaning,
while source outcome separately retains `COLLECTION_FAILED`; the UI can communicate both without collapsing
them into one false state.

Trace: `REQ-FUNC-TRUST-001~005`.

## DecisionBriefAssembler

```text
assemble(selected_supported_point, requested_slots, adapter_results, cached_records) ->
  AVAILABLE(DecisionBrief, completeness: COMPLETE | PARTIAL)
  | UNAVAILABLE(DecisionBrief_with_failure_items?, errors)
  | INVALID_POINT
```

Invariants:

- `requested_slots` is externally supplied data/config and stays open until OD-01.
- Successful items are returned without waiting indefinitely for all sources.
- Each missing/failed item remains represented when its slot is requested.
- `completeness` is response-envelope/UI-derived data completeness only, is not persisted as the SRS's
  optional `overall_data_state`, and cannot encode fishing permission.
- Unsupported or ambiguous points produce `INVALID_POINT`, never a brief.

Trace: `REQ-FUNC-BRIEF-001~003`, `REQ-NFR-PERF-002`.

## MetricsSink

```text
recordBriefTiming(request_id, started_at, first_rendered_at)
recordSourceOutcome(source_id, outcome, cache_used)
recordTrustDetailOpened(anonymous_session_id, info_type)
```

Invariants:

- Events support latency p50/p95, per-source attempts/success/failure, and cache utilization.
- Target numbers remain `TBD_AFTER_BASELINE`.
- Exact GPS and unnecessary personal identifiers are rejected from event payloads.
- A metrics failure does not suppress a usable brief.

Trace: `REQ-NFR-PERF-001`, `REQ-NFR-OBS-001`, `REQ-NFR-PRIV-001~002`,
`REQ-NFR-COST-001`.

## MarineCurrentProvider (v1.6.3)

`getCurrentObservations({ latitude, longitude, at? }, signal)` — called only for an explicitly
selected official point's own coordinate. Resolves `NOT_CONNECTED` for an unset/invalid base URL or a
proxy 503, `UNAVAILABLE` after bounded retry/fatal failure, `SUCCESS`/`PARTIAL` otherwise; rejects only
on abort. Request window = `requestWindow(at)`: UTC-wall(at − 30 min) → KST-wall(at + 30 min), because
the KHOA time basis is undocumented. Every observation: `observationType: 'FORECAST'`,
`directionConvention: 'UNKNOWN'`, `timeBasis: 'UNCONFIRMED'`, `trustStatus: 'UNVERIFIED'`.

Trace: `REQ-FUNC-MARINE-001~006`, `REQ-FUNC-MARINE-UI-001~007`, `REQ-NFR-MARINE-001~004`.
