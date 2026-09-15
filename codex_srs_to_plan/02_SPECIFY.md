# 02 — Specify

/speckit-specify

먼저 다음을 읽어.

- `codex_srs_to_plan/SOURCE_SRS_낚시포인트_v1.0_승인대기.md`
- 생성된 project constitution

이번 Feature는 SRS의 Must 요구사항을 사용자 과업 중심 Feature Spec으로 표현하기 위한 것이다.
특정 프레임워크, DB, API 공급자, CSS 구현, 지도 SDK를 아직 확정하지 않는다.

## Feature 목표

지원 포인트를 식별하고, 현재 사용 가능한 판단정보를 신뢰상태와 함께 제공하며, 불확실하거나 충돌하는 정보를 확정된 사실처럼 승격하지 않는 핵심 의사결정 흐름을 정의한다.

## 우선순위

### P1 / Must Core

1. 포인트 조회·식별
   - `REQ-FUNC-POINT-001`
   - `REQ-FUNC-POINT-002`
   - `REQ-FUNC-POINT-003`

2. 판단 브리프
   - `REQ-FUNC-BRIEF-001`
   - `REQ-FUNC-BRIEF-002`
   - `REQ-FUNC-BRIEF-003`

3. 신뢰상태·근거
   - `REQ-FUNC-TRUST-001`
   - `REQ-FUNC-TRUST-002`
   - `REQ-FUNC-TRUST-003`
   - `REQ-FUNC-TRUST-004`
   - `REQ-FUNC-TRUST-005`

### P2 / Should, 현재 Core Feature의 선행조건 아님

- `REQ-FUNC-COMPARE-001`
- `REQ-FUNC-ACCESS-001`

Should는 별도 Future/Deferred 섹션으로 명시하고 P1 구현 없이는 필요하지 않은 의존성을 만들지 않는다.

## 사용자 관점에서 반드시 설명할 흐름

### Story A — 지원 포인트 찾기

사용자는 낯선 포인트를 조회하고 올바른 지원 포인트를 선택할 수 있어야 한다.

반드시 포함:
- 지원 포인트 조회
- 동일·유사 명칭 구분
- 미지원 포인트
- 모호한 포인트
- 임의 매칭 금지

### Story B — 판단 브리프 보기

사용자는 선택한 지원 포인트의 현재 사용 가능한 정보를 하나의 판단 단위에서 확인할 수 있어야 한다.

반드시 포함:
- 정상 데이터
- 부분 데이터
- 소스 실패
- 과거 캐시
- 데이터 없음
- 전체 실패

판단 브리프의 정확한 `info_type` 목록은 결정하지 않는다.
UI/Spec에서는 `정보 항목 슬롯` 또는 동등한 추상 구조를 사용해도 되지만 이를 제품 정책으로 확정하지 않는다.

### Story C — 정보 신뢰상태 이해하기

사용자는 각 정보가 현재 확인된 것인지, 오래되었는지, 확인되지 않았는지, 수집에 실패했는지, 서로 충돌하는지 구분할 수 있어야 한다.

반드시 포함:
- source
- basis_time 또는 checked_at
- trust_status
- 상세 근거/확인 경로
- 정보충돌 시 단일 결론 금지
- 규제/접근 데이터 부재를 낚시 가능으로 오해하지 않게 하는 상태 표현

## 핵심 상태

Spec에 최소한 다음 상태를 명시해.

- 선택 전
- 검색/조회 중
- 지원 포인트 정상 식별
- 동일·유사 명칭 복수 후보
- 미지원 포인트
- 포인트 식별 모호
- 브리프 로딩
- 정상 데이터
- 부분 데이터
- 캐시 + 오래됨
- 미확인
- 수집실패
- 정보충돌
- 데이터 없음
- 재시도 가능/불가

각 상태에서 다음을 작성해.

- 사용자가 보는 것
- 허용되는 행동
- 시스템이 하지 말아야 할 것
- 관련 Requirement ID

## 기능 요구사항 작성 규칙

Spec Kit이 새 FR 번호를 생성하더라도 SRS Requirement ID와 매핑을 반드시 유지해.
가능하면 Spec 요구사항에 `Source Requirement:` 필드를 둔다.

모든 Acceptance Criteria는 SRS의 의미를 보존한다.

특히:

- 지원되지 않는 입력으로 브리프를 만들지 않는다.
- 동일명 후보를 자동 첫 결과로 확정하지 않는다.
- 한 소스 실패가 다른 성공 데이터를 숨기지 않는다.
- stale cache를 CONFIRMED 최신값처럼 보이지 않는다.
- source/time/status가 없는 핵심 데이터는 정상 CONFIRMED로 취급하지 않는다.
- threshold 미정이면 임의 숫자를 넣지 않는다.
- CONFLICT에서 한 출처를 임의 승자로 만들지 않는다.
- 시간 경과·재시작·캐시조회만으로 상태를 CONFIRMED로 바꾸지 않는다.
- 규제 레코드 0건을 `낚시 가능`으로 해석하지 않는다.

## 비기능 요구사항

Spec에 다음 NFR을 추적 가능하게 포함해.

- `REQ-NFR-PERF-001`: 브리프 첫 표시시간 계측 가능
- `REQ-NFR-PERF-002`: 느린 개별 소스가 전체를 무기한 차단하지 않음
- `REQ-NFR-AVAIL-001`: 캐시 신선도 왜곡 금지
- `REQ-NFR-OBS-001`: source별 마지막 성공/최근 결과 관측
- `REQ-NFR-DATA-001`: source/time/status 보존
- `REQ-NFR-DATA-002`: 충돌 원본 보존
- `REQ-NFR-PRIV-001~002`: 개인정보 최소수집/정확 GPS 저장 제한
- `REQ-NFR-COST-001~002`: 호출량·실패율·캐시량 관측/전국 과대설계 금지

수치가 없는 요구사항은 수치를 생성하지 않는다.

## Success Criteria

기술 구현 상세가 아니라 사용자/검증 관점에서 측정 가능한 성공조건을 작성해.

포함:
- 사용자가 지원 포인트를 정확히 구분할 수 있음
- 미지원/모호한 입력이 잘못된 정상 브리프로 연결되지 않음
- 부분 실패가 사용자에게 숨겨지지 않음
- 정보상태 의미를 사용자가 구분할 수 있는 구조
- 브리프 첫 표시시간을 계측할 수 있음

KPI 목표 숫자는 `TBD_AFTER_BASELINE`으로 둔다.

## Edge Cases

최소한 다음을 포함해.

- 동일명 포인트 2개 이상
- region_context 부족
- 카탈로그 장애
- 외부 소스 timeout
- 일부 source 성공 / 일부 실패
- cache 존재 / 없음
- basis_time 누락
- freshness policy 누락
- 신뢰 source 2개 충돌
- 정보 없음
- 규제/접근 근거 없음

## Out of Scope 보호

새로운 기능을 임의로 추가하지 않는다.
특히 다음을 넣지 않는다.

- AI 포인트 자동추천
- 조과예측 AI
- 사진 어종 판별
- 커뮤니티/랭킹
- 채팅/거래
- 장비 쇼핑/DB
- 정확 GPS 공개형 소셜
- 전국 규제정보 완전 보증
- 모든 좌표에 대한 법적 `낚시 가능` 판정

## 마지막에 반드시 작성할 표

| SRS Requirement ID | Spec Story/Requirement | 상태 |
|---|---|---|

상태는 `Covered / Deferred / TBD` 중 하나로 작성해.
Must가 모두 Covered인지 확인해.

완료 후 spec을 SRS와 다시 비교해서 누락·범위확장을 수정해.
그다음 `codex_srs_to_plan/03_CLARIFY.md`를 읽어 이어서 진행해.
