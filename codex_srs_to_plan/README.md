# Codex SRS → Plan 자동 진행 패키지 — Coinbase DESIGN.md 적용 버전

이 패키지는 `낚시 포인트 의사결정 서비스 SRS v1.0 승인대기본`을 Working SSOT로 사용해 Codex가 다음 흐름을 자동 진행하도록 만든 지시서입니다.

`SRS → Constitution → Specify → Clarify → Stitch → DESIGN_DECISIONS → Plan → Plan Gate`

실제 구현은 하지 않습니다.

## 설치 위치

사용자 프로젝트 루트:

`E:\Users\keun0\Desktop\fish`

ZIP을 이 폴더에 풀어 다음 경로가 되게 합니다.

`E:\Users\keun0\Desktop\fish\codex_srs_to_plan`

## 반드시 사용자가 직접 넣을 파일

프로젝트 루트에 아래 파일을 직접 배치해야 합니다.

`E:\Users\keun0\Desktop\fish\DESIGN.md`

이 파일은 사용자가 선택한 **Coinbase 기반 DESIGN.md**입니다.
자동화 과정에서는 읽기 전용 Base Design System으로만 사용하며 수정하지 않습니다.

`DESIGN.md`가 없으면 Codex가 임의의 다른 디자인을 만들거나 가져오지 않도록 했습니다. 이 경우 `BLOCKED_MISSING_BASE_DESIGN`으로 중단합니다.

## 파일

- `FIRST_PROMPT_TO_CODEX.md` — Codex에 최초 1회 붙여넣을 프롬프트
- `00_START_HERE.md` — 전체 자동진행 규칙
- `SOURCE_SRS_낚시포인트_v1.0_승인대기.md` — Working SSOT
- `01_CONSTITUTION.md`
- `02_SPECIFY.md`
- `03_CLARIFY.md`
- `04_STITCH_DESIGN.md` — 프로젝트 루트 DESIGN.md를 공통 시각 기준으로 A/B/C 구조 비교
- `05_DESIGN_DOCUMENT.md` — DESIGN.md를 수정하지 않고 Feature의 `DESIGN_DECISIONS.md` 생성
- `06_PLAN.md` — `DESIGN.md + DESIGN_DECISIONS.md`를 함께 읽어 Plan 작성
- `07_PLAN_GATE.md` — SRS/Design/Plan 최종 정합성 검토

## 사용 방법

1. ZIP을 `E:\Users\keun0\Desktop\fish`에 풉니다.
2. Coinbase 기반 DESIGN.md를 `E:\Users\keun0\Desktop\fish\DESIGN.md`에 직접 넣습니다.
3. Codex를 해당 프로젝트 폴더에서 실행합니다.
4. `FIRST_PROMPT_TO_CODEX.md` 내용을 그대로 붙여넣습니다.
5. Codex가 번호 순서대로 MD를 읽으며 작업하게 둡니다.
6. Plan Gate가 끝나면 자동으로 멈추도록 지시되어 있습니다.

## 디자인 문서 역할 분리

### `DESIGN.md`

- 전역 시각 언어
- 색상 역할
- 타이포그래피
- spacing
- surface/card/button/input 등 컴포넌트 스타일
- 사용자가 제공
- 읽기 전용

### `DESIGN_DECISIONS.md`

- 현재 낚시 포인트 Feature 전용 디자인 결정
- Search-first / Map-first / Hybrid 선택
- 판단 브리프 정보 계층
- Trust Status 표현
- source/time/status Progressive Disclosure
- 모바일/접근성/상태별 UI
- Stitch 결과를 바탕으로 Codex가 생성

## 중요한 점

현재 SRS는 **Baseline Candidate / 승인대기본**입니다.
따라서 Codex가 다음을 임의 확정하지 못하도록 했습니다.

- 판단 브리프 최소 정보세트
- freshness threshold
- 초기 POC 포인트셋
- 외부 데이터 공급자/API/라이선스
- KPI 정량 목표
- FR-03/FR-05 활성 릴리스

`OD-06 지도/검색/목록 UI 구조`만 Design 단계에서 Stitch를 사용해 비교·결정하도록 했습니다.

## Coinbase 디자인 적용 원칙

Coinbase DESIGN.md의 일반적인 시각 시스템을 Base로 사용하되 Coinbase 자체 브랜드를 복제하지 않습니다.

- 밝은 canvas
- soft gray surface
- blue primary action
- hairline 중심 구분
- 숫자/상태 정보 스캔성
- 장식적 shadow 최소화

다음은 사용하지 않습니다.

- Coinbase 로고/브랜드명
- 암호화폐 관련 문구/그래픽
- 브랜드 마케팅 패턴의 직접 복제
- 초록색을 `낚시 가능/안전/추천`으로 해석하는 표현

SRS와 DESIGN.md가 충돌하면 **SRS가 우선**합니다.

## Stitch MCP

Stitch MCP가 연결되어 있으면 실제 시안 비교에 사용합니다.
모든 시안은 동일한 `DESIGN.md`를 시각 기준으로 두고 Search-first / Map-first / Hybrid의 정보 구조를 비교합니다.

Stitch가 연결되어 있지 않아도 동일한 기준의 텍스트 와이어프레임 fallback으로 Plan까지 진행합니다.

## 기존 파일 보호

Codex는 기존 Git 변경사항이나 과거 Spec Kit 산출물을 임의 삭제하지 않게 되어 있습니다.
과거 PRD 기반 Feature가 있으면 SRS 추적성을 검사한 뒤 새 SRS Feature와 구분하도록 했습니다.
