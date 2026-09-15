# Search-first Presentation Contract

This contract connects `DESIGN.md` and `DESIGN_DECISIONS.md` to observable UI behavior without defining
CSS or a framework implementation.

## Search and selection

- Initial focus reaches a labelled search field accepting point name or region.
- Loading and catalog failure are announced in text.
- Candidate rows expose name, region context, optional type, and support status.
- Same-name candidates remain unselected until explicit keyboard/pointer action.
- Unsupported or ambiguous results expose correction/research actions and never render a normal brief.

## Brief

- The selected point identity stays visible with an action to return to results.
- Every requested slot renders one of: value with trust summary, explicit missing value, loading, or failure.
- Partial response does not replace successful slots with a page-level error.
- Brief availability uses only `COMPLETE`, `PARTIAL`, or `UNAVAILABLE` data language.
- Sample labels and values are visibly prototype-only until OD-01/03 approval.

## Trust and evidence

| Canonical state | Required visible text | Required evidence behavior |
|---|---|---|
| `CONFIRMED` | 확인됨; data verified, not fishing permission | source and applicable time available |
| `STALE` | 오래됨 | old basis/check time and reason available |
| `UNVERIFIED` | 확인 필요 | missing evidence reason available |
| `COLLECTION_FAILED` | 수집 실패 | attempt/source and cache outcome available |
| `CONFLICT` | 정보충돌 | all competing evidence shown symmetrically |

- Each state uses text and an icon/shape. Color is supplementary.
- No state label is “가능”, “안전”, “추천”, “갈만함”, or a score.
- Missing restriction/access records render “확인 필요,” not permission.
- Opening evidence preserves the originating slot and returns focus there when closed.

## Responsive and accessible behavior

- At narrow width, search/results and brief become sequential single-column states.
- No core action requires a map, horizontal scrolling, hover, drag, or exact GPS permission.
- Interactive targets are at least 44px, focus is visible, and DOM/focus order matches visual order.
- Dynamic result count, loading completion, and partial failure have non-disruptive live announcements.
- Evidence overlay has a labelled title, keyboard trap, Escape/close control, and trigger focus return.
- Reduced-motion preference removes movement/shimmer while preserving status text.

## State fixtures required for component verification

`supported`, `duplicate`, `ambiguous`, `unsupported`, `catalog-unavailable`, `all-confirmed`,
`partial`, `stale-cache`, `failure-with-cache`, `failure-without-cache`, `unverified`, `conflict`,
`missing-provenance`, `loading`, and `empty-all`.

Trace: `REQ-FUNC-POINT-001~003`, `REQ-FUNC-BRIEF-001~003`, `REQ-FUNC-TRUST-001~005`,
`REQ-NFR-PERF-002`, `REQ-NFR-AVAIL-001`, `REQ-NFR-PRIV-001~002`, Constitution XIII.
