# 05 — Test / Build Gate

배포 전 반드시 실행한다.

```bash
npm run lint
npm run test
npm run build
```

프로젝트에 E2E 스크립트가 정의되어 있으면 대표 E2E도 실행한다.

## 필수 검증 시나리오

- unique supported point → explicit select → brief
- duplicate/similar name → distinguishable candidates → no auto select
- unsupported → no brief
- ambiguous → no brief until explicit selection
- catalog unavailable → no guessed support status
- partial source success/failure → successes remain visible
- stale cache → old state/time visible, not current CONFIRMED
- refresh failure with cache → failure context preserved
- all failed → finite unavailable state, no infinite loading
- missing provenance/time/policy → UNVERIFIED
- conflict → both evidences accessible, no winner
- zero restriction-like evidence → no fishing permission claim
- retry failed slot → successful siblings preserved
- keyboard-only core flow
- mobile viewport core flow
- Trust Status not color-only
- reduced-motion respected

## Gate

- lint 실패 → `BLOCKED_BY_TEST_OR_BUILD`
- test 실패 → `BLOCKED_BY_TEST_OR_BUILD`
- build 실패 → `BLOCKED_BY_TEST_OR_BUILD`
- CRITICAL/HIGH design issue 잔존 → 배포 금지

모두 통과할 때만 `06_GITHUB_PAGES.md`로 이동한다.
