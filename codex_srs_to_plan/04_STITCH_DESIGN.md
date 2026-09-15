# 04 — Design Brief + Stitch MCP

## 목표

SRS가 Design 단계로 위임한 `OD-06 지도/검색/목록 UI 구조`를 실제 사용자 흐름 관점에서 비교하고, 핵심 Must 요구사항을 가장 적게 오해하면서 빠르게 수행할 수 있는 화면 구조를 선택한다.

프로젝트 루트의 `DESIGN.md`를 **읽기 전용 Base Design System**으로 사용한다.
이 파일은 사용자가 직접 배치한 Coinbase 기반 DESIGN.md이며, 이 단계에서 수정·재작성·덮어쓰기하지 않는다.

**아직 로컬 기능 코드를 구현하지 않는다.**

## 먼저 읽을 문서

- `codex_srs_to_plan/SOURCE_SRS_낚시포인트_v1.0_승인대기.md`
- constitution
- 현재 Feature의 spec.md
- Clarification 결과
- 프로젝트 루트의 `DESIGN.md`

## 0. DESIGN.md 사전 확인

작업 시작 전에 프로젝트 루트의 `DESIGN.md` 존재 여부를 확인해.

- 있으면: 내용을 읽고 아래 Stitch 시안의 공통 시각 기준으로 사용한다.
- 없으면: 다른 DESIGN.md를 임의 생성하거나 인터넷에서 대체본을 가져오지 않는다. `stitch-review.md`에 `BLOCKED_MISSING_BASE_DESIGN`을 기록하고 Design/Plan 진행을 중단한다.

`DESIGN.md` 사용 규칙:

1. 시각적 토큰, 타이포그래피, spacing, surface, card, button, input, hairline 등 전역 디자인 언어의 기준으로 사용한다.
2. Coinbase 로고, 브랜드명, 암호화폐 관련 콘텐츠, 마케팅 문구 등 브랜드 고유 요소는 복제하지 않는다.
3. SRS와 충돌하면 SRS가 우선한다.
4. Coinbase의 success/error 의미를 낚시 서비스의 Trust Status에 그대로 매핑하지 않는다.
5. `DESIGN.md` 자체는 절대 수정하지 않는다.

## 1. design-brief.md 작성

현재 Feature 디렉터리에 `design-brief.md`를 작성해.

다음을 포함해.

1. 제품/사용자 과업 요약
2. Design 목표
   - 빠른 포인트 식별
   - 정보상태 오해 방지
   - 부분 실패에서도 판단 가능한 정보 유지
   - 근거는 접근 가능하되 1차 화면을 과밀하게 만들지 않음
3. Base Design System
   - 프로젝트 루트 `DESIGN.md` 사용
   - 밝은 canvas / soft gray surface / blue primary action / hairline 중심 구분 등 실제 파일에서 확인한 핵심 원칙 요약
   - 브랜드 고유 요소는 제외
4. 관련 Requirement ID
5. 핵심 사용자 흐름
6. 필수 상태
7. 정보 계층
8. Progressive Disclosure 원칙
9. 접근성 원칙
10. 모바일 기준
11. 샘플 데이터 사용 규칙

샘플 화면에 등장하는 정보 항목명은 **UI 검증용 샘플**로만 취급한다.
SRS의 `OD-01 판단 브리프 최소 정보세트`를 확정한 것으로 기록하지 않는다.

## 2. Stitch MCP 사용 여부 확인

Stitch MCP가 사용 가능하면 반드시 사용한다.

Stitch에 시안을 요청할 때 반드시:

- `DESIGN.md`의 시각 원칙을 공통 Base로 사용한다.
- 아래 A/B/C는 **정보 구조 차이**를 비교하는 것이며 서로 다른 브랜드 스타일을 만들지 않는다.
- SRS Requirement와 상태 의미를 유지한다.
- 기능 코드를 작성하지 않는다.

Stitch MCP가 사용 불가능하면:

- `stitch-review.md` 상단에 `STITCH_UNAVAILABLE` 기록
- 아래 3개 안을 텍스트 와이어프레임으로 대신 작성
- 평가와 선택은 그대로 진행
- `DESIGN.md` 시각 원칙을 텍스트 와이어프레임의 공통 전제로 기록
- Plan까지 중단 없이 계속 진행

## 3. 반드시 비교할 3개 구조안

### A. Search-first

- 첫 화면에서 포인트명/지역 기반 탐색을 가장 빠르게 시작
- 후보 리스트로 동일명/유사명 구분
- 선택 후 Decision Brief 진입
- 지도는 핵심 의존성이 아님

### B. Map-first

- 공간 맥락을 먼저 보여주는 탐색 구조
- 검색/목록 보조 제공
- 디자인 프로토타입에서 지도를 표현하더라도 실제 지도 SDK/API 채택을 결정한 것으로 간주하지 않음

### C. Hybrid

- 검색/목록을 주 탐색으로 두고 공간 맥락을 보조적으로 제공하거나
- 리스트와 간단한 위치맥락을 한 화면에서 연결
- 지도 서비스가 없어도 핵심 흐름은 유지 가능해야 함

## 4. 공통 화면/상태

각 안은 최소한 아래를 표현해.

### 핵심 화면

1. 포인트 탐색/조회
2. 복수 후보 구분
3. 포인트 판단 브리프
4. 정보 근거 상세(패널/드로어/확장 영역 등)

### 상태 Variant

- 정상 CONFIRMED
- PARTIAL_DATA
- STALE
- UNVERIFIED
- COLLECTION_FAILED
- CONFLICT
- POINT_UNSUPPORTED
- POINT_AMBIGUOUS
- loading

## 5. 판단 브리프 시각 구조

브리프는 특정 낚시 정보필드를 확정하지 말고 data-driven 슬롯으로 설계해.

각 슬롯은 구조적으로 다음을 표현할 수 있어야 한다.

- 정보 라벨
- 값 또는 값 없음
- 간단 trust status
- 기준시각/최근 확인일 요약
- 상세 근거 열기

상세 근거에는 필요 시:

- source
- basis_time/checked_at
- source_reference
- 상태 이유
- conflict 근거

를 표시할 수 있어야 한다.

## 6. Trust Status 시각 의미

`DESIGN.md`의 palette를 활용하더라도 상태 의미는 SRS를 우선한다.

- CONFIRMED를 `낚시 가능`, `안전`, `추천`으로 표현하지 않는다.
- STALE은 최신 정상값과 명확히 구분한다.
- UNVERIFIED는 `확인 필요` 텍스트를 함께 제공한다.
- COLLECTION_FAILED는 수집 실패임을 명확히 표시한다.
- CONFLICT는 어느 한쪽 정보를 정답으로 보이게 하지 않는다.
- 상태는 색상만으로 구분하지 않고 아이콘/텍스트/라벨을 병행한다.
- 초록색 success를 `출조 가능` 의미로 오해할 수 있게 사용하지 않는다.

## 7. 절대 금지할 UI 의미

- 데이터가 없을 때 녹색 `가능` 표시
- CONFLICT를 성공/실패 한쪽으로 임의 변환
- STALE을 정상 최신값과 동일한 표식으로 표시
- `갈만함 점수`, `추천점수`, AI 추천 배지 등 SRS에 없는 결론
- 사용자에게 법적 가능성을 보증하는 문구
- 상태를 색상만으로 구분
- Coinbase 로고/암호화폐/브랜드 문구를 그대로 사용하는 디자인

## 8. 평가 기준

Stitch 시안 A/B/C를 다음 표로 비교해.

| 기준 | A | B | C | 판단 근거 |
|---|---:|---:|---:|---|

평가 기준:

1. `REQ-FUNC-POINT-001~003` 수행 속도
2. 동일명/모호함 구분 명확성
3. `REQ-FUNC-BRIEF-001~003` 정보 스캔 용이성
4. `REQ-FUNC-TRUST-001~005` 오해 방지
5. source/time/status 접근성
6. partial/failure/conflict 상태의 자연스러운 표현
7. 모바일에서 핵심 과업 완료 가능성
8. 키보드/접근성 대응
9. 지도/API 의존성 없이도 핵심 흐름이 유지되는가
10. 제한 POC에서 구현 복잡도가 과도하지 않은가
11. 향후 FR-03/FR-05 확장 여지를 해치지 않는가
12. `DESIGN.md`의 시각 언어를 일관되게 유지하는가
13. 정보 밀도가 지나치게 마케팅 사이트처럼 희박하지 않은가

각 기준을 1~5점으로 평가할 수 있지만, 점수를 제품 KPI처럼 해석하지 않는다.

## 9. 선택

가장 적절한 한 방향을 선택하고 이유를 명시해.

선택은 Design Decision이며 SRS를 수정하지 않는다.

현재 Feature 디렉터리에 `stitch-review.md`를 작성하고 다음을 기록해.

- Stitch 사용 여부
- 사용한 Base Design System: 프로젝트 루트 `DESIGN.md`
- `DESIGN.md` 변경 여부: 반드시 `UNCHANGED`
- 시안 식별정보/링크/ID(도구가 제공하는 경우)
- A/B/C 비교표
- 선택한 방향
- 버린 방향과 이유
- 여전히 남아 있는 Design TODO
- SRS Open Decision과의 경계

완료 후 `codex_srs_to_plan/05_DESIGN_DOCUMENT.md`를 읽고 이어서 진행해.
