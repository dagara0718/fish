# 02 — /speckit-analyze

`/speckit-analyze`를 실행한다.

## 중점 검사

1. `REQ-FUNC-POINT-001~003` 모두 Task coverage가 있는가
2. `REQ-FUNC-BRIEF-001~003` 모두 Task coverage가 있는가
3. `REQ-FUNC-TRUST-001~005` 모두 Task coverage가 있는가
4. 모든 Must NFR에 구현/검증 Task가 있는가
5. Search-first 디자인과 UI Task가 일치하는가
6. Base `DESIGN.md`가 수정 대상이 되지 않았는가
7. five-state Trust Status가 색상만으로 표현되지 않는가
8. source/time/status와 evidence access가 Task에 있는가
9. partial failure가 전체 실패로 바뀌지 않는가
10. stale cache가 최신 CONFIRMED로 표시되지 않는가
11. conflict가 임의 winner로 합쳐지지 않는가
12. unsupported/ambiguous point가 임의 자동 매칭되지 않는가
13. `금지 데이터 없음 = 낚시 가능` 추론이 생기지 않는가
14. OD-01~05/07 값이 새로 발명되지 않았는가
15. 실제 API/DB/지도/GPS가 범위에 들어오지 않았는가
16. GitHub Pages Task가 lint/test/build 성공 이후인가
17. Vite `/fish/` base와 Project Pages 배포 고려가 있는가

## 수정 규칙

- CRITICAL/HIGH가 있으면 구현 전에 원인이 있는 spec/design/plan/tasks 중 올바른 소유 문서만 수정한다.
- SRS/제품 결정을 변경해야 하는 문제는 자동 해결하지 말고 Open Decision으로 남긴다.
- 수정 후 `/speckit-analyze`를 다시 실행한다.
- CRITICAL 0, HIGH 0일 때만 구현으로 넘어간다.

분석 결과를 `specs/001-point-decision-brief/pre-implementation-analysis.md`에 요약 기록한다.

통과하면 `03_IMPLEMENT_FIXTURE_MVP.md`로 이동한다.
