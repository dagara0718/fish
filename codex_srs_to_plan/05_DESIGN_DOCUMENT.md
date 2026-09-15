# 05 — Coinbase DESIGN.md 적용 결정 문서

## 목표

프로젝트 루트의 `DESIGN.md`를 시각 디자인의 최우선 기준으로 사용하고,
Stitch 비교 결과와 낚시 포인트 서비스에 필요한 프로젝트별 UI 결정을 별도 문서로 고정한다.

이 단계에서는 `DESIGN.md`를 생성하거나 수정하지 않는다.
기능 코드나 CSS도 작성하지 않는다.

## 먼저 읽을 문서

- `codex_srs_to_plan/SOURCE_SRS_낚시포인트_v1.0_승인대기.md`
- constitution
- 현재 Feature의 spec.md
- Clarification 결과
- `design-brief.md`
- `stitch-review.md`
- 프로젝트 루트의 `DESIGN.md`

## DESIGN.md 처리 규칙

프로젝트 루트의 `DESIGN.md`는 사용자가 직접 배치한 Coinbase 기반 디자인 시스템이다.

다음 규칙을 반드시 지켜.

1. `DESIGN.md`를 읽기 전용 시각 기준으로 사용한다.
2. `DESIGN.md`를 수정, 재작성, 덮어쓰기, 자동 보정하지 않는다.
3. Coinbase의 브랜드 고유 요소를 그대로 복제하는 것이 아니라, 색상 역할·타이포그래피·간격·컴포넌트 밀도·표면 계층 등 일반적인 디자인 원칙만 이 프로젝트에 적용한다.
4. Coinbase 로고, 브랜드명, 암호화폐 관련 문구, 전용 마케팅 패턴은 사용하지 않는다.
5. SRS와 충돌하는 디자인 규칙이 있으면 SRS가 우선한다.
6. SRS의 정보 신뢰상태를 기존 Coinbase의 success/error 의미에 억지로 매핑하지 않는다.

## 출력 문서

현재 Feature 디렉터리에 `DESIGN_DECISIONS.md`를 작성해.

이 문서는 `DESIGN.md`를 대체하지 않는다.
역할은 다음과 같다.

- `DESIGN.md`: 전역 시각 언어와 디자인 토큰의 기준
- `DESIGN_DECISIONS.md`: 현재 낚시 포인트 Feature에 적용한 구조·상태·정보계층 결정

## DESIGN_DECISIONS.md 필수 내용

1. 문서 상태와 입력 근거
2. Base Design System
   - `DESIGN.md` 사용 선언
   - Coinbase 기반 디자인에서 채택한 원칙
   - 채택하지 않는 Coinbase 브랜드 고유 요소
3. Design 목표
4. 선택한 OD-06 탐색 구조
   - Search-first / Map-first / Hybrid 중 선택
5. 선택 이유와 대안 비교 요약
6. 정보 구조
7. 핵심 사용자 흐름
8. 핵심 화면/영역 구조
9. Decision Brief의 data-driven 슬롯 구조
10. Trust Status 표현 규칙
11. source/time/status Progressive Disclosure
12. 상태별 화면 규칙
    - loading
    - partial
    - stale
    - unverified
    - collection failed
    - conflict
    - unsupported point
    - ambiguous point
    - empty/no data
13. 컴포넌트 책임
14. Coinbase 기반 시각 원칙의 적용 방식
    - 밝은 canvas
    - soft gray surface
    - 단일 blue 계열 primary action
    - hairline 중심 구분
    - 장식적 shadow 최소화
    - 숫자/상태 정보의 높은 스캔성
15. 타이포그래피 계층 원칙
16. 간격/밀도 원칙
17. 모바일 반응형 원칙
18. 키보드/포커스/스크린리더 기준
19. 상태를 색상만으로 전달하지 않는 규칙
20. motion 및 reduced-motion 규칙
21. 샘플 데이터와 실제 Requirement의 경계
22. 금지 UI 패턴
23. SRS Requirement → 디자인 대응표
24. 구현 후 디자인 검증 체크리스트

## Trust Status 시각 규칙

상태 의미는 SRS를 그대로 따른다.

특히 다음을 지켜.

- CONFIRMED를 `낚시 가능`, `안전`, `추천` 의미로 표현하지 않는다.
- STALE은 최신 정상값과 시각적으로 구분한다.
- UNVERIFIED는 단순 중립 정보가 아니라 `확인 필요`라는 텍스트 의미를 함께 제공한다.
- COLLECTION_FAILED는 데이터 수집 실패임을 명확히 표시한다.
- CONFLICT는 어느 한쪽 정보를 임의로 정답 처리하지 않는다.
- 색상 + 아이콘 + 텍스트를 함께 사용한다.
- 초록색은 `낚시 가능`으로 오해될 수 있으므로 전역 성공 의미로 남용하지 않는다.

## Design에서 확정하면 안 되는 것

다음은 `TBD`, `DEFERRED_VALIDATION`, 또는 `Not a Design Decision`으로 남겨.

- 실제 판단 브리프 info_type 목록
- freshness threshold 숫자
- 실제 POC 포인트명/지역
- 실제 외부 데이터 공급자
- API endpoint
- KPI 목표 수치
- FR-03 / FR-05 활성 릴리스

## SRS Traceability 표

최소한 다음 형식으로 작성해.

| SRS Requirement | Design 대응 위치/상태 | 관련 DESIGN.md 원칙 | 비고 |
|---|---|---|---|

Must 요구사항이 디자인에서 누락되지 않았는지 확인해.

## 완료 조건

완료 전 다음을 검증해.

- 프로젝트 루트 `DESIGN.md`가 변경되지 않았는가
- `DESIGN_DECISIONS.md`가 생성되었는가
- Stitch에서 선택한 구조가 기록되었는가
- SRS Must 요구사항이 디자인과 추적 가능한가
- Coinbase 브랜드 요소를 그대로 복제하지 않았는가
- 상태 의미가 SRS와 충돌하지 않는가
- 미결정 항목을 Design이 임의 확정하지 않았는가

완료 후 `codex_srs_to_plan/06_PLAN.md`를 읽고 이어서 진행해.
