# 03 — Clarify

/speckit-clarify

먼저 다음을 읽어.

- `codex_srs_to_plan/SOURCE_SRS_낚시포인트_v1.0_승인대기.md`
- constitution
- 현재 SRS 기반 Feature의 spec.md

이번 Clarify는 사용자에게 질문하고 기다리는 단계가 아니다.
SRS의 근거로 해소 가능한 모호성만 해소하고, 해소 근거가 없는 항목은 명확한 상태로 분류해 다음 단계가 안전하게 진행되게 한다.

## 분류 체계

각 Clarification을 다음 중 하나로 분류해.

- `RESOLVED_FROM_SRS`
- `DESIGN_DECISION`
- `ARCHITECTURE_TBD`
- `PRODUCT_DECISION_REQUIRED`
- `DEFERRED_VALIDATION`

## 반드시 분류할 Open Decisions

### OD-01 판단 브리프 최소 정보세트

- `PRODUCT_DECISION_REQUIRED` 또는 `DEFERRED_VALIDATION`
- 정확한 info_type 목록을 임의로 만들지 않는다.
- Design에서는 가변 슬롯 구조로 대응한다.

### OD-02 freshness threshold

- `PRODUCT_DECISION_REQUIRED` 또는 `DEFERRED_VALIDATION`
- 시간 수치를 임의 지정하지 않는다.
- Architecture/Plan에서는 정책 인터페이스나 config boundary만 설계 가능하다.

### OD-03 초기 지원 포인트셋

- `PRODUCT_DECISION_REQUIRED`
- 실제 지역/포인트명을 임의 확정하지 않는다.
- 프로토타입은 fixture 기반의 가상/샘플 포인트로 설계 가능하다.

### OD-04 외부 데이터 공급자/API/라이선스

- `ARCHITECTURE_TBD`
- 특정 제공자를 임의 선택하지 않는다.
- adapter contract만 정의한다.

### OD-05 KPI 정량 목표

- `DEFERRED_VALIDATION`
- baseline 전 숫자 금지.

### OD-06 지도/검색/목록 UI 구조

- `DESIGN_DECISION`
- 다음 Stitch 단계에서 복수안을 비교해 결정한다.
- 외부 지도 API 채택까지 자동 확정하지 않는다.

### OD-07 FR-03/FR-05 활성 릴리스

- `PRODUCT_DECISION_REQUIRED`
- 현재 Should/Deferred 유지.

## 추가 Clarify 체크

다음을 spec에서 검사하고 필요하면 Clarification으로 보완해.

1. 로그인/회원계정이 Must 요구사항의 전제인지
   - SRS 근거가 없으므로 필수 인증을 가정하지 않는다.
2. 포인트 탐색 UI가 특정 지도 기술에 결합되어 있는지
   - 결합 금지, Design Decision으로 이관.
3. DecisionBrief가 단일 추천점수나 `갈만함` 결론을 생성하는지
   - SRS 근거 없음, 제거.
4. overall_data_state가 법적/출조 가능 판단처럼 해석되는지
   - 의미 확정 전 사용 금지 또는 비판정형 요약으로만 설계.
5. 부분 데이터에서 전체 오류 페이지로 막히는지
   - SRS 위반이므로 수정.
6. stale와 collection_failed의 의미가 섞였는지
   - 분리.
7. source/time/status가 UI 상세에서 완전히 사라지는지
   - 최소한 접근 가능한 구조 유지.
8. 정확 GPS가 기본 저장되는지
   - 제거.

## 산출물

Clarify 명령이 spec 내 Clarifications 섹션을 만들면 그곳에 반영해.
그렇지 않으면 현재 Feature 디렉터리에 `clarifications.md`를 작성해.

문서에 최소한 다음 표를 포함해.

| ID | 질문/모호성 | 분류 | 현재 처리 | 다음 결정 시점 | 근거 |
|---|---|---|---|---|---|

## 자동 진행 Gate

Clarify 종료 전에 확인해.

- 사용자 응답 대기 질문이 남아 있지 않은가
- Open Decision을 임의 숫자/업체/필드로 채우지 않았는가
- OD-06만 Design 단계로 넘겼는가
- Must/Should가 유지되는가
- Plan을 작성할 수 있을 만큼 계약 경계가 명확한가

완료되면 `codex_srs_to_plan/04_STITCH_DESIGN.md`를 읽고 이어서 진행해.
