# Codex에 처음 붙여넣을 프롬프트 — Tasks → Analyze → Implement → GitHub Pages

작업 디렉터리는 반드시 다음 경로를 기준으로 사용해.

`E:\Users\keun0\Desktop\fish`

GitHub 원격 저장소는 다음 주소를 기준으로 사용해.

`https://github.com/dagara0718/fish.git`

최종 정적 사이트 배포 목표 주소는 다음이다.

`https://dagara0718.github.io/fish/`

먼저 아래를 확인해.

1. 현재 작업 디렉터리가 `E:\Users\keun0\Desktop\fish`인지 확인한다.
2. `git status`, 현재 branch, `git remote -v`를 확인한다.
3. `origin`이 `https://github.com/dagara0718/fish.git`인지 확인한다.
   - origin이 없으면 위 주소를 추가한다.
   - 다른 주소면 임의 변경하지 말고 보고 후 중단한다.
4. 기존 커밋과 사용자 파일을 보존한다. `git reset --hard`, `git clean -fd`, 강제 push를 사용하지 않는다.
5. 현재 저장소의 아래 문서를 반드시 읽는다.
   - `.specify/memory/constitution.md`
   - `specs/001-point-decision-brief/spec.md`
   - `specs/001-point-decision-brief/plan.md`
   - `specs/001-point-decision-brief/DESIGN_DECISIONS.md`
   - `specs/001-point-decision-brief/design-brief.md`
   - `specs/001-point-decision-brief/stitch-review.md`
   - 프로젝트 루트 `DESIGN.md`
   - `specs/001-point-decision-brief/plan-gate-review.md`
6. 프로젝트 루트 `DESIGN.md`는 Coinbase 기반 Base Design System이다. 읽기 전용으로 사용하고 수정하지 않는다.
7. 현재 Plan Gate 상태는 `PLAN_READY_WITH_OPEN_DECISIONS`이며 실제 구현은 아직 시작하지 않은 상태다.

그 다음 아래 워크플로우 파일을 읽고 순서대로 자동 진행해.

`E:\Users\keun0\Desktop\fish\codex_tasks_to_publish\00_START_HERE.md`

이번 실행의 목표는 다음이다.

1. `/speckit-tasks`
2. `/speckit-analyze`
3. CRITICAL/HIGH 문제 수정 후 Analyze 재실행
4. Fixture 기반 MVP 구현
5. 구현된 UI와 Design 문서 재검수
6. lint / test / build 통과
7. GitHub Pages 배포 설정
8. commit + push
9. GitHub Pages 배포 확인
10. 최종 검수 후 중단

중요 범위:

- Must 구현 대상은 `REQ-FUNC-POINT-001~003`, `REQ-FUNC-BRIEF-001~003`, `REQ-FUNC-TRUST-001~005`와 관련 NFR이다.
- `REQ-FUNC-COMPARE-001`, `REQ-FUNC-ACCESS-001`은 Should/Deferred로 구현하지 않는다.
- OD-01~05와 OD-07을 임의로 확정하지 않는다.
- 실제 해양/날씨/규제 Provider, 실데이터 API, 실제 POC 포인트, 운영용 freshness 숫자를 선택하거나 연결하지 않는다.
- 이번 구현은 synthetic fixture/fake adapter 기반 브라우저 프로토타입이다.
- `CONFIRMED`를 낚시 가능·안전·법적 허용으로 표현하지 않는다.
- `금지 데이터 없음 = 낚시 가능` 추론을 절대 하지 않는다.
- 일부 실패가 성공 데이터를 숨기지 않게 한다.
- `STALE / UNVERIFIED / COLLECTION_FAILED / CONFLICT`를 `CONFIRMED`로 임의 승격하지 않는다.
- source/time/status와 근거 상세 접근성을 유지한다.
- Search-first 구조를 유지한다. 지도 중심 구조를 새로 도입하지 않는다.
- `DESIGN.md`를 수정하지 않고, Feature 디자인은 `DESIGN_DECISIONS.md`를 따른다.
- 샘플 포인트명/정보값/출처는 명확히 fixture/synthetic로 표시한다.
- 실제 사용자 GPS, 로그인, 백엔드, DB, 외부 API, 추천 기능을 추가하지 않는다.

GitHub Pages 규칙:

- Vite Project Pages 배포에 맞게 base path는 `/fish/`로 설정한다.
- 테스트와 프로덕션 빌드가 성공하기 전에는 push/deploy하지 않는다.
- GitHub Actions 기반 Pages 배포가 현재 저장소에 없으면 최소한의 배포 workflow를 추가한다.
- 배포용 workflow 외에 불필요한 CI/CD 시스템을 추가하지 않는다.
- 배포 후 `https://dagara0718.github.io/fish/`가 실제로 접근 가능한지 확인 가능한 범위에서 검증한다.
- Pages가 저장소 설정상 수동 승인/활성화가 필요해 자동으로 완료할 수 없으면 `PAGES_MANUAL_ACTION_REQUIRED`로 정확히 보고하고, 필요한 최소 UI 조작만 알려준다.

사용자가 이번 작업에서 commit/push를 허용했다. 따라서 최종 검증이 통과한 경우에만 정상 commit 후 `main`으로 push해도 된다. 강제 push는 금지한다.

각 단계가 끝나면 다음 번호의 MD 파일을 읽고 이어서 진행해. 사용자 답변을 기다리며 중간에 멈추지 말되, 안전하게 자동 결정할 수 없는 제품/데이터 정책은 기존 Open Decision으로 남겨라.

이제 `codex_tasks_to_publish/00_START_HERE.md`부터 읽고 시작해.
