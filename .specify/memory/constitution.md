<!--
Sync Impact Report
- Version change: template placeholders -> 1.0.0
- Added principles: Requirement ID Traceability; Must/Should Boundary; Uncertainty as Data;
  Provenance Preservation; Safe Inaccuracy Handling; Partial-Failure-First; Contract/Data First;
  Open Decisions Stay Open; Privacy Minimization; Validation and Observability; Limited POC First;
  Design/Requirement Separation; Accessible State Communication; Test-Gated Completion;
  Layered Decision Ownership.
- Added sections: Product and Data Constraints; Delivery Workflow and Quality Gates.
- Removed sections: none (template placeholders were resolved).
- Follow-up TODOs: none. Product and architecture decisions remain explicitly open in the SRS,
  not as constitution placeholders.
-->
# Fishing Point Decision Service Constitution

## Core Principles

### I. Requirement ID Traceability
Every feature, design decision, plan item, and later task or test MUST cite the SRS Requirement IDs
it satisfies. IDs MUST retain their baseline meaning, and behavior absent from the SRS MUST NOT be
introduced for implementation convenience. This keeps the Baseline Candidate auditable from product
intent through verification. Reviews MUST reject an artifact whose behavior cannot be traced or whose
citation changes a requirement's meaning; the artifact returns to its owning stage for correction.
Applies to all SRS requirements and the Traceability Matrix.

### II. Must/Should Boundary Preservation
`REQ-FUNC-POINT-001` through `003`, `REQ-FUNC-BRIEF-001` through `003`, and
`REQ-FUNC-TRUST-001` through `005` are Must scope. `REQ-FUNC-COMPARE-001` and
`REQ-FUNC-ACCESS-001` are Should scope and MUST NOT become prerequisites for Must delivery.
Reviews MUST identify priority for every feature and phase. Any unintended promotion or dependency
MUST be removed or approved through the PRD/SRS change process before planning continues.

### III. Uncertainty Is First-Class Data
`CONFIRMED`, `STALE`, `UNVERIFIED`, `COLLECTION_FAILED`, and `CONFLICT` MUST remain distinct,
user-visible semantic states. An uncertain state MUST NOT become `CONFIRMED` without new successful
collection or explicit verification evidence. This prevents uncertainty from being disguised as fact.
Contract, state-transition, and UI reviews MUST cover every state; any lossy mapping blocks completion.
Applies to `REQ-FUNC-TRUST-001` through `004`, `REQ-NFR-DATA-001`, and SRS state rules.

### IV. Provenance Preservation
Every displayed core information item MUST remain traceable, where available, to its source or
provenance, `basis_time` or `checked_at`, `trust_status`, and source reference or verification path.
Values MUST NOT be detached from their evidence metadata across collection, cache, assembly, API, or
UI layers. Schema and contract review MUST prove that the relationship survives end to end; missing
evidence requires an uncertain status rather than a normal confirmed presentation. Applies to
`REQ-FUNC-TRUST-001`, `REQ-FUNC-TRUST-003`, and `REQ-NFR-DATA-001` through `002`.

### V. Safe Inaccuracy Handling
The system MUST NOT fabricate unsupported points, automatically select the first ambiguous match,
collapse unresolved source conflicts to one fact, or infer “fishing permitted,” “safe,” or “legally
allowed” from missing restriction or access data. These are safety boundaries, not recoverable UX
shortcuts. Negative scenarios MUST be present in specifications and validation; a violation blocks the
affected artifact and requires correction at the layer that introduced the inference. Applies to
`REQ-FUNC-POINT-002` through `003`, `REQ-FUNC-TRUST-003`, and `REQ-FUNC-TRUST-005`.

### VI. Partial-Failure-First
A failed or slow source MUST NOT erase successful data from other sources or indefinitely block the
brief. Cached values MAY be used only with their time and stale, unverified, or collection-failure
meaning visible. Reviews MUST exercise partial success, timeout, no-cache, and cached fallback flows.
If one failure collapses the whole brief or makes old data appear live, the design fails the gate.
Applies to `REQ-FUNC-BRIEF-002` through `003`, `REQ-NFR-PERF-002`, and `REQ-NFR-AVAIL-001`.

### VII. Contract and Data First
Before feature logic is decomposed, the plan MUST define the contracts for `FishingPoint`,
`InformationRecord`, `DecisionBrief`, `DataSource`, `ConflictSet`, point lookup, data-source adapters,
and provenance/cache behavior. The undecided brief field set MUST use a data-driven item structure and
MUST NOT be frozen by sample content. Planning review MUST confirm entity validation, relationships,
failure results, and state transitions before implementation tasks can be produced. Applies to SRS
Data, Interface, and Sequence sections and `REQ-NFR-DATA-001` through `002`.

### VIII. Open Decisions Stay Open
OD-01, OD-02, OD-03, OD-04, OD-05, and OD-07 MUST remain `TBD`, `DEFERRED_VALIDATION`, or
`PRODUCT_DECISION_REQUIRED` until their named evidence and approver exist. OD-06 MAY be decided in
design, but that decision MUST NOT silently select an external map provider or change product scope.
No fixed brief set, freshness number, provider, POC catalog, KPI target, or Should release MAY be
hardcoded early. Reviews MUST compare artifacts to the Open Decision register; premature choices are
reverted and recorded for approval.

### IX. Privacy Minimization
Must flows MUST NOT require or retain personal data they do not need. Exact user GPS MUST NOT be
stored in the MVP without a separately documented purpose and explicit consent, and logs or analytics
MUST exclude unnecessary identifiers. Data inventory and interface review MUST demonstrate necessity,
purpose, and retention for each personal field. Unjustified collection blocks approval. Applies to
`REQ-NFR-PRIV-001` through `002`.

### X. Validation and Observability
The system design MUST make brief first-render latency measurable at p50 and p95, and MUST make each
source's last success, recent result, call volume, failure rate, and cache use inspectable. Numeric
targets MUST remain undecided where the SRS has no evidence. Plans MUST identify events, ownership,
and verification methods without inventing targets; unmeasurable SRS outcomes fail review. Applies to
`REQ-NFR-PERF-001`, `REQ-NFR-OBS-001`, and `REQ-NFR-COST-001`.

### XI. Limited POC First
Delivery MUST support progression from fixtures or mocks, to a limited-point POC, and only then to
approved live adapters. Nationwide real-time collection MUST NOT be a prerequisite for MVP value
validation, and enterprise infrastructure requires evidence of present need. Architecture review MUST
reject scope or infrastructure that exceeds the approved POC boundary. Applies to
`REQ-NFR-COST-002`, SRS assumptions, and OD-03 through OD-04.

### XII. Design and Requirement Separation
Layout, navigation, and component choices belong in design artifacts; behavior, exceptions, and NFRs
belong in the SRS/spec; technical choices belong in plan or ADRs. Design MUST preserve SRS behavior,
and sample UI content MUST NOT become a required data field. Cross-artifact review MUST identify the
owner of each decision and move misplaced decisions without changing their meaning. Applies to the SRS
Source of Truth rules and OD-06.

### XIII. Accessible State Communication
The core point-to-brief flow MUST be completable on mobile and by keyboard. Trust and failure meaning
MUST NOT rely on color alone, and source, time, status, and verification detail MUST remain reachable
through progressive disclosure. Design and acceptance review MUST cover focus order, labels, non-color
cues, and narrow viewports. Accessibility failures block design approval. Applies to
`REQ-FUNC-TRUST-001` through `005` and the SRS presentation constraints.

### XIV. Test-Gated Completion
No requirement with Acceptance Criteria or a Verification Method is complete until a traceable test or
review proves it. Coverage MUST include unsupported and ambiguous points, partial data, stale cache,
collection failure, conflicts, and missing restriction evidence—not only success flows. Each plan and
later task/test review MUST reconcile IDs against the traceability matrix; missing negative coverage
returns the work to planning. Applies to all functional requirements and NFR verification methods.

### XV. Layered Decision Ownership
Product-scope changes require PRD approval followed by SRS update; software behavior changes belong in
the SRS; technical selections belong in plan or ADRs; design selections belong in design documents.
One layer MUST NOT silently substitute for another. Reviews MUST record conflicts and resolve them from
the higher-authority source downward. Unapproved cross-layer changes block progression. Applies to SRS
Source of Truth and Requirement Baseline rules.

## Product and Data Constraints

- The Working SSOT is the SRS v1.0 Baseline Candidate until human approval. Its undecided items remain
  provisional and MUST NOT be written as established facts.
- The exact DecisionBrief information set, freshness thresholds, initial supported points, external
  provider/API/license, KPI targets, and Should-feature release remain open.
- External failures, stale cache, missing data, and conflicts are normal modeled inputs. Contracts MUST
  represent them explicitly and retain successful sibling records.
- The system provides evidence and uncertainty for user decisions; it does not produce legal fishing
  permission, automated recommendations, catch predictions, or nationwide completeness claims.
- Provider and persistence choices MUST preserve source/time/status and conflict evidence. Provider
  selection requires terms, cost, and operational review before live integration.
- Exact user location and other personal data are opt-in only when an approved purpose exists. The MVP
  core flow remains usable without them.

## Delivery Workflow and Quality Gates

1. Trace SRS IDs and priorities into the feature specification; preserve every open decision.
2. Clarify only matters supported by the SRS. Product, numeric, provider, and release choices without
   evidence remain explicitly deferred.
3. Compare design structures against the read-only base `DESIGN.md`; record OD-06 in the feature's
   `DESIGN_DECISIONS.md` without changing the SRS or selecting a provider.
4. Plan contracts, data states, boundaries, partial-failure behavior, privacy, observability, and
   fixture-first phases. Re-run this constitution check after design artifacts are written.
5. Before implementation approval, reconcile SRS, spec, design decisions, data model, contracts, and
   plan. Any Must/Should drift, lost provenance, hidden uncertainty, or invented decision fails the gate.
6. Implementation, task generation, migrations, and live API integration require a later explicit user
   approval and are outside this planning workflow.

## Governance

This constitution governs all feature, design, planning, task, implementation, and review artifacts in
this repository. The SRS remains authoritative for software behavior, while the PRD remains
authoritative for product scope and priority. Where artifacts conflict, work stops at the affected gate
and is corrected from the authoritative layer downward.

Amendments require a documented rationale, affected Requirement IDs or SRS sections, compatibility
impact, and human approval. Versioning follows semantic versioning: MAJOR for incompatible governance
changes or removed principles, MINOR for new principles or materially expanded obligations, and PATCH
for non-semantic clarification. Every plan and later pull-request review MUST record constitution
compliance; any exception requires an explicit, time-bounded waiver with owner and remediation path.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
