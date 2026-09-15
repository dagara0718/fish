# Quickstart Validation Guide

**Current state**: planning artifacts only. The commands below are the implementation-phase acceptance path;
they are not runnable until the user approves implementation and the planned application exists.

## Preconditions

- Work only in `E:\Users\keun0\Desktop\fish`.
- Do not install project tools, dependencies, caches, or task temporary files on C drive.
- Use the existing Node/npm runtime; do not perform a system-wide installation.
- Human approval is required before implementation. OD-01~04 are additionally required only for Phase 5 live
  POC enablement, not for the fixture prototype.
- Root `DESIGN.md` stays read-only; use `DESIGN_DECISIONS.md` for Feature UI behavior.

## E-drive-only setup boundary

Before a future dependency installation, create task-specific cache/temp directories inside the workspace and
verify their resolved paths. These values must be set in the same shell that runs npm/tests.

```powershell
$fishRoot = (Resolve-Path -LiteralPath 'E:\Users\keun0\Desktop\fish').Path
$fishNpmCache = Join-Path $fishRoot '.cache\npm'
$fishTemp = Join-Path $fishRoot '.tmp'
New-Item -ItemType Directory -Force -Path $fishNpmCache, $fishTemp | Out-Null
$env:npm_config_cache = $fishNpmCache
$env:TEMP = $fishTemp
$env:TMP = $fishTemp
npm config get cache
```

Expected: the reported cache path starts with `E:\Users\keun0\Desktop\fish`. `.cache/`, `.tmp/`, and
`node_modules/` must be ignored by Git before installation. If any project write target resolves to C drive,
stop before installation and correct the task-local configuration.

## Future build and test commands

After Phase 0 implementation creates and locks the package manifest:

```powershell
npm ci
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Expected: each command exits successfully; the fixture app builds without a backend, DB, live provider, map,
login, or exact GPS permission.

## Core validation scenarios

### 1. Supported point and explicit selection

Run the `TC-POINT-001` fixture. Search by synthetic point name/region, verify candidate identity and select it.

Expected:

- the candidate shows distinguishing context;
- no brief starts before explicit selection;
- selection opens a data-driven brief;
- request start and exactly one first-meaningful-render event are paired.

### 2. Same-name and ambiguous candidates

Run `TC-POINT-002` and the missing-context fixture using keyboard only.

Expected:

- no candidate is preselected;
- region/type distinguishes candidates when available;
- missing context yields `POINT_AMBIGUOUS`;
- Enter/Space selection works only on an explicit supported row.

### 3. Unsupported point

Run `TC-POINT-003`.

Expected: `POINT_UNSUPPORTED` is visible and no point, invented data, or DecisionBrief payload exists.

### 4. Partial source failure

Run `TC-BRIEF-002` with one successful and one timeout fake adapter.

Expected:

- successful sibling information renders;
- failed slot says `COLLECTION_FAILED` or the applicable evidence state;
- retry targets only the failed slot and preserves successful data;
- a never-resolving fake terminates by injected test policy without becoming a production timeout decision.

### 5. Failed refresh with cache

Run `TC-BRIEF-003`.

Expected:

- cached value retains source and original basis/check time;
- latest collection failure is also visible;
- value is stale/unverified as applicable, never current `CONFIRMED` merely because cache exists;
- no-cache variant returns explicit failure with no fabricated value.

### 6. Trust evidence and freshness

Run `TC-TRUST-001`, `TC-TRUST-002`, and `TC-TRUST-004`.

Expected:

- a core value has traceable source/time/status or an explicit uncertain state;
- symbolic T−ε/T/T+ε fixtures prove threshold boundary behavior without defining an actual policy number;
- missing policy/time is `UNVERIFIED`;
- time, restart, or cache read never promotes uncertainty to `CONFIRMED`.

### 7. Conflict

Run `TC-TRUST-003`.

Expected: `CONFLICT` preserves two or more original records and evidence paths, renders them at equal visual
weight, and produces no confirmed winner.

### 8. Missing restriction/access evidence

Run `TC-TRUST-005` with zero restriction records.

Expected: the result says confirmation is needed and contains none of “낚시 가능”, “문제없음”, “법적으로
가능”, a recommendation badge, or a suitability score.

## Observability proof

Run the deterministic captured event sink tests.

Expected:

- every brief request has one start and one first meaningful render, allowing count/p50/p95 calculation;
- source metrics can calculate calls, outcomes/failure rate, cache hit/miss/served use, last attempt/result/success;
- skeleton is not treated as first meaningful render;
- metrics failure does not suppress a usable brief;
- there is no numeric performance/KPI pass target before OD-05.

## Privacy proof

Run the privacy sentinel fixture and inspect domain/UI event types, captured analytics, logs, local/session
storage, and browser permissions.

Expected:

- no email, device/user ID, raw query, source URL/error body, or exact coordinates leak to metrics;
- no geolocation permission is requested;
- exact user GPS is absent from storage and logs;
- only ephemeral non-identifying request correlation is used.

## Accessibility and responsive proof

At desktop and a viewport below 640px, complete search → candidate → select → brief → evidence → close using
keyboard only. Repeat with reduced motion, automated accessibility rules, and manual screen-reader review.

Expected:

- visible focus and predictable order;
- dynamic results/loading/failure announcements;
- every trust state has Korean text plus icon/shape, not color alone;
- evidence panel has a title, trap, Escape/close, and trigger focus return;
- no core action requires hover, drag, map, exact location, or horizontal scrolling;
- conflict sources remain equally named and understandable.

## Trace reconciliation

Before accepting Phase 4, compare results with:

- [spec.md](./spec.md)
- [data-model.md](./data-model.md)
- [domain-ports.md](./contracts/domain-ports.md)
- [presentation-contract.md](./contracts/presentation-contract.md)
- [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md)
- the Requirement → Module → Test table in [plan.md](./plan.md)

All Must rows require evidence. `REQ-FUNC-COMPARE-001` and `REQ-FUNC-ACCESS-001` remain Deferred and must not
fail the core gate.
