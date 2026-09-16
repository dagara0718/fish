# 04 — 구현 UI Design Review

교재의 `/design-sync` 단계 의도를 현재 Codex + Stitch 환경에 맞게 적용한다.

## 1. 코드 구조 검사

먼저 수정 없이 다음을 검사한다.

- `src/styles`
- 공통 UI 컴포넌트
- layout 컴포넌트
- point discovery 컴포넌트
- decision brief 컴포넌트
- status/evidence 컴포넌트

표 형식:

| 분류 | 파일 | 재사용 가능 여부 | 문제 | 심각도 |

검사:
- 하드코딩 색상/간격
- Base Design token 우회
- 중복 컴포넌트
- focus/aria 누락
- 색상만으로 상태 전달
- mobile overflow
- Search-first 정보 위계 훼손

CRITICAL/HIGH 구조 문제는 먼저 수정하고 lint/test/build를 다시 실행한다.

## 2. `/design-sync` 지원 여부 확인

환경에 `/design-sync`가 실제로 있으면 실행한다.

포함:
- `src/styles`
- 공통 UI/레이아웃 컴포넌트
- point discovery
- decision brief 대표 구현
- `DESIGN_DECISIONS.md`

제외:
- node_modules
- dist
- 테스트 fixture의 구체적 값
- future live provider code

`/design-sync`가 없으면 `DESIGN_SYNC_UNAVAILABLE`을 기록하고 멈추지 않는다.

## 3. Stitch 또는 동등한 디자인 비교

Stitch MCP가 사용 가능하면 기존 Stitch 프로젝트/시안과 구현 구조를 비교한다.

비교 대상:
- desktop search/candidate state
- desktop decision brief/evidence
- mobile search→candidate→brief
- partial/stale/conflict/failure 상태

평가:
1. Coinbase 기반 Base Design 계층 유지
2. Search-first 선택 유지
3. 주요 CTA/검색 입력 발견성
4. 후보 구분 맥락 가독성
5. 브리프 정보 밀도
6. Trust Status text+icon
7. source/time/status 접근성
8. mobile flow
9. keyboard/focus
10. SRS 밖 기능 유입 여부

CRITICAL/HIGH 문제만 우선 수정한다. 기능/데이터 흐름은 디자인 수정을 이유로 변경하지 않는다.

결과를 `specs/001-point-decision-brief/implementation-design-review.md`에 기록한다.

그다음 `05_TEST_BUILD.md`로 이동한다.
