# 00 — START HERE: Tasks → Analyze → Implement → Design Review → Build → GitHub Pages

## 1. 기준 저장소

- Local root: `E:\Users\keun0\Desktop\fish`
- Remote: `https://github.com/dagara0718/fish.git`
- Branch: `main`
- Feature: `specs/001-point-decision-brief`
- Publish target: `https://dagara0718.github.io/fish/`

작업 시작 전 `git status`, branch, remote를 확인한다. 기존 변경사항과 커밋을 삭제하지 않는다.

## 2. Working SSOT

우선순위는 다음과 같다.

1. `.specify/memory/constitution.md`
2. `codex_srs_to_plan/SOURCE_SRS_낚시포인트_v1.0_승인대기.md`
3. `specs/001-point-decision-brief/spec.md`
4. `specs/001-point-decision-brief/DESIGN_DECISIONS.md`
5. `specs/001-point-decision-brief/plan.md`
6. 프로젝트 루트 `DESIGN.md` — 시각 시스템 전용, READ ONLY
7. `specs/001-point-decision-brief/plan-gate-review.md`

충돌 시 상위 문서를 우선하고, Open Decision을 임의 확정하지 않는다.

## 3. 이번 구현 범위

구현:
- 지원 포인트 검색과 명시적 선택
- 동일·유사명 후보 구분
- 미지원/모호/카탈로그 실패 처리
- synthetic fixture 기반 판단 브리프
- 부분 성공/실패 유지
- 다섯 Trust Status 표현
- source/time/status와 근거 상세
- stale cache / refresh failure 시나리오
- conflict 보존
- failed slot scoped retry
- 모바일/키보드/상태 비색상 접근성
- 관측성의 테스트 가능한 최소 구조

구현하지 않음:
- 실제 외부 Provider/API
- 실제 POC 지역/포인트
- 운영용 freshness 숫자
- 로그인/회원 시스템
- 데이터베이스
- 지도 SDK
- 정확 GPS 수집/저장
- 낚시 가능/안전/추천 판정
- 후보 비교 FR-03
- 접근·통제 FR-05

## 4. 진행 순서

1. `01_TASKS.md`
2. `02_ANALYZE.md`
3. `03_IMPLEMENT_FIXTURE_MVP.md`
4. `04_DESIGN_REVIEW.md`
5. `05_TEST_BUILD.md`
6. `06_GITHUB_PAGES.md`
7. `07_FINAL_CONVERGE.md`

단계 간 Gate를 건너뛰지 않는다.

## 5. 절대 규칙

- `DESIGN.md` 수정 금지.
- SRS Requirement ID 추적성을 잃지 않는다.
- Must/Should 경계 유지.
- Open Decision 값 발명 금지.
- synthetic fixture가 실제 데이터처럼 보이지 않게 표시.
- 데이터 부족을 좋은/나쁜 점수로 바꾸지 않는다.
- `CONFIRMED`는 데이터 근거 상태일 뿐 출조 허용/안전 의미가 아니다.
- `CONFLICT`는 단일 승자 값으로 합치지 않는다.
- slow/failing source가 성공한 sibling 데이터를 무기한 막지 않는다.
- build/test 실패 상태에서 배포 금지.

## 6. 종료 상태

정상 완료 시 최종 상태는 다음 중 하나여야 한다.

- `IMPLEMENTED_AND_PUBLISHED`
- `IMPLEMENTED_BUILD_PASS_PAGES_MANUAL_ACTION_REQUIRED`
- `BLOCKED_BY_TEST_OR_BUILD`
- `BLOCKED_BY_REPOSITORY_OR_DEPLOYMENT_CONFIG`

모호한 성공 보고는 하지 않는다.
