# 07 — Final Converge / Report

환경에 `/speckit-converge`가 있으면 실행한다. 없으면 동일 목적의 수동 검증을 수행한다.

비교 문서:
- constitution.md
- SRS baseline candidate
- spec.md
- DESIGN_DECISIONS.md
- plan.md
- tasks.md
- implementation-design-review.md

검증:
1. Must Requirement 구현 coverage
2. Should/Deferred 비구현 유지
3. unsupported/ambiguous no-auto-match
4. partial-first behavior
5. stale/cache semantics
6. five Trust Status semantics
7. source/time/status traceability
8. conflict no-winner
9. no fishing permission/safety inference
10. no exact GPS/user identity collection
11. Search-first design fidelity
12. keyboard/mobile/non-color/reduced-motion
13. lint/test/build PASS
14. GitHub Pages deploy status
15. Open Decision OD-01~05/07 미확정 유지

## 최종 보고 형식

### Status
아래 중 정확히 하나:
- `IMPLEMENTED_AND_PUBLISHED`
- `IMPLEMENTED_BUILD_PASS_PAGES_MANUAL_ACTION_REQUIRED`
- `BLOCKED_BY_TEST_OR_BUILD`
- `BLOCKED_BY_REPOSITORY_OR_DEPLOYMENT_CONFIG`

### Report
1. 생성/수정 파일
2. 완료 Task / 남은 Task
3. Must Requirement coverage
4. 테스트 결과
5. build 결과
6. 디자인 검수 결과
7. Git commit SHA
8. push 결과
9. GitHub Actions/Pages 결과
10. 실제 사이트 URL
11. 남은 Open Decisions
12. live POC가 여전히 blocked인지 여부

완료 후 추가 기능을 구현하지 말고 멈춘다.
