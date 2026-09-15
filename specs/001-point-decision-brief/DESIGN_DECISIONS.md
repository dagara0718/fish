# Design Decisions: 신뢰상태 기반 낚시 포인트 판단 브리프

**Status**: Draft for human approval
**Date**: 2026-09-16
**Feature**: `001-point-decision-brief`
**Decision**: OD-06 = Search-first
**Base Design**: 프로젝트 루트 `DESIGN.md` (`UNCHANGED`)

## 1. 입력 근거와 문서 역할

이 문서는 SRS v1.0 Baseline Candidate, project constitution, Feature Spec, Clarifications,
`design-brief.md`, Stitch A/B/C 비교 결과를 바탕으로 현재 Feature의 구조·상태·정보계층을 정한다.
전역 시각 토큰을 정의하는 `DESIGN.md`를 대체하지 않으며 제품 범위, 기술 아키텍처, 외부 공급자,
실제 데이터 정책을 결정하지 않는다.

## 2. Base Design System

프로젝트 루트 `DESIGN.md`를 읽기 전용 시각 기준으로 사용한다.

채택하는 일반 원칙:

- 흰색 canvas와 soft gray surface의 차분한 계층
- 희소한 단일 blue primary action과 명시적 focus ring
- ink/body/muted 텍스트 위계와 weight 400 중심의 큰 제목
- 4px spacing 체계, hairline 구분, 24px 카드, pill action, 최소 shadow
- 숫자와 시각의 고정폭·tabular 표현 및 데이터 행의 높은 스캔성
- Inter 및 JetBrains Mono/Geist Mono 같은 합법적 대체 서체

채택하지 않는 고유 요소:

- Coinbase 로고, 브랜드명, 전용 서체의 무허가 사용
- 암호화폐·거래·가격 상승/하락 문구와 그래픽
- 마케팅 hero, 자산 카드, 거래 semantic을 기능 UI에 그대로 복제하는 패턴
- green/red trading 의미를 Trust Status 또는 출조 가능성에 매핑하는 규칙

SRS와 Base Design이 충돌하면 SRS의 신뢰상태·안전·접근성 요구가 우선한다.

## 3. Design 목표

1. 사용자가 검색을 즉시 시작하고 동일·유사 포인트를 구분한다.
2. 미지원·모호 포인트가 정상 브리프로 연결되지 않게 한다.
3. 성공 정보는 부분 실패 중에도 유지하고 실패 범위를 항목 단위로 알린다.
4. 다섯 Trust Status와 데이터 가용성 상태를 색상 없이도 이해하게 한다.
5. source/time/status는 언제나 접근 가능하게 하되 1차 브리프는 빠르게 스캔하게 한다.
6. 지도/API 없이 모바일·키보드 환경에서 핵심 흐름을 완결한다.

## 4. OD-06 선택: Search-first

첫 화면의 주 행동은 포인트명·지역 검색이다. 결과는 구분 맥락이 있는 후보 목록으로 나타나며,
사용자가 명시적으로 선택한 뒤 판단 브리프로 이동한다. 공간 맥락은 선택적 소형 보조정보일 수
있지만 핵심 화면, 외부 지도 서비스, 위치권한에 의존하지 않는다.

### 선택 이유와 대안 비교

- Search-first는 `REQ-FUNC-POINT-001~003`을 가장 짧고 예측 가능한 흐름으로 표현한다.
- 후보 목록 폭을 확보해 같은 이름, 지역, 유형, 지원상태를 비교하기 쉽다.
- Map-first보다 핀·색상·지도 커버리지를 확정 사실로 오해할 가능성이 낮다.
- Hybrid와 거의 같은 확장성을 유지하면서 접이식 공간 패널과 추가 반응형 상태를 POC에서
  제거한다.
- Map-first는 지도 서비스가 미정이고 위치 탐색이 Must가 아니므로 기각한다.
- Hybrid는 공간 맥락의 사용자 가치가 확인된 뒤 확장 후보로 남긴다.

자세한 상대평가와 Stitch ID는 `stitch-review.md`에 있다.

## 5. 정보 구조

1. **Search context**: 검색 입력, 조회 상태, 지원 범위 안내
2. **Candidate identity**: 포인트명, `region_context`, 선택적 point type, support status
3. **Selection confirmation**: 사용자가 선택한 포인트의 이름과 지역 재확인
4. **Brief availability**: 성공/부분/전체 이용 불가의 비판정형 요약
5. **Information slots**: 라벨, 값 또는 없음, trust label, 시간 요약, 근거 열기
6. **Evidence detail**: source, basis/checked time, source reference, 상태 이유, 충돌 근거
7. **Recovery actions**: 입력 수정, 재검색, 실패 항목 재시도, 브리프 복귀

브리프 가용성 요약은 “얼마나 수집됐는가”만 설명하고 출조·안전·법적 가능을 판정하지 않는다.

## 6. 핵심 사용자 흐름

1. 검색 입력에 포인트명 또는 지역을 입력한다.
2. loading 결과를 기다리거나 취소/수정한다.
3. 결과가 하나여도 구분 맥락을 확인하고 명시적으로 선택한다.
4. 복수 후보면 이름·지역·유형을 비교하며 자동선택은 없다.
5. 미지원·모호·카탈로그 실패면 정상 브리프로 이동하지 않고 재검색한다.
6. 선택한 포인트를 재확인한 뒤 성공한 정보부터 브리프를 본다.
7. 각 슬롯의 값·상태·시각을 스캔하고 필요한 근거 상세를 연다.
8. 실패 항목을 재시도해도 성공 항목과 사용자의 현재 문맥은 유지한다.

## 7. 핵심 화면과 영역

### A. 포인트 탐색

- 페이지 제목과 짧은 비보증 안내
- label이 있는 검색 입력, clear, 제출 행동
- loading/카탈로그 실패/미지원 메시지 영역
- 검색이 비어 있을 때 실제 포인트를 추천하지 않는 중립 안내

### B. 후보 구분

- 후보별 이름, 지역, 선택적 유형, 지원 여부
- 전체 행을 키보드와 터치로 선택할 수 있는 단일 행동
- 동일명 안내와 “자동 선택하지 않음” 설명
- `region_context` 부족 시 선택 대신 입력 보완 유도

### C. 판단 브리프

- 선택 포인트 identity와 검색으로 돌아가기
- 비판정형 데이터 가용성 요약
- data-driven slot list/grid
- 성공·오래됨·미확인·수집실패·충돌 항목의 동시 존재
- 실패 항목 범위의 재시도 행동

### D. 근거 상세

- 데스크톱 side panel 또는 행 확장, 모바일 full-height sheet
- 현재 슬롯 label/value/status의 반복 제공
- source, basis_time/checked_at, source_reference, 상태 이유
- conflict 시 두 개 이상의 근거를 같은 위계로 나열
- 닫기 후 원래 슬롯으로 focus 복귀

## 8. Decision Brief data-driven 슬롯

각 슬롯은 구조적으로 다음을 가진다.

| 요소 | 규칙 |
|---|---|
| 정보 라벨 | `info_type`의 사용자용 이름; 실제 목록은 OD-01 승인 전 TBD |
| 값 | typed value 또는 명시적 “값 없음”; 결측을 0으로 표시하지 않음 |
| trust label | 아이콘 + 한국어 텍스트 + canonical status |
| 시간 요약 | `basis_time` 우선, 없으면 `checked_at`; 둘 다 없으면 “시각 확인 필요” |
| 근거 행동 | “근거 보기”처럼 결과를 예측할 수 있는 label |
| 항목 상태 | loading/success/stale/unverified/failed/conflict를 독립적으로 표현 |

슬롯 순서, 그룹, 필수 여부는 OD-01이 승인되기 전 확정하지 않는다. 샘플 슬롯은 레이아웃과
상태 variant 검증에만 사용한다.

## 9. Trust Status 표현

| 상태 | 기본 label | 아이콘/형태 의미 | 금지 표현 |
|---|---|---|---|
| `CONFIRMED` | 확인됨 | 체크가 있는 중립 outline badge | 낚시 가능, 안전, 추천 |
| `STALE` | 오래됨 | 시계 아이콘 + 기준시각 강조 | 최신, 실시간, 정상과 동일 표식 |
| `UNVERIFIED` | 확인 필요 | 물음표/점선 outline + 이유 | 문제없음, 단순 공란 |
| `COLLECTION_FAILED` | 수집 실패 | 끊김/경고 아이콘 + 최근 시도 | 값 자체가 틀렸다고 단정 |
| `CONFLICT` | 정보충돌 | 양방향/분기 아이콘 + 근거 수 | 한쪽을 성공·정답으로 강조 |

색상은 보조 cue일 뿐 label과 아이콘을 대체하지 않는다. 초록색을 전역 성공색 또는 출조 가능
의미로 사용하지 않는다. `CONFIRMED`는 오직 출처·시점·검증 근거에 대한 상태다.

## 10. source/time/status Progressive Disclosure

- 1차 슬롯에 trust label과 시간 요약을 항상 남긴다.
- source는 짧은 출처명으로 1차 표시하거나 근거 행동 바로 옆에 접근 가능하게 한다.
- 상세에 source 식별, 기준/확인/수집 시각의 역할, 원문 경로, 상태 이유를 보여준다.
- source/time 중 하나라도 없으면 그 결손을 숨기지 않고 `UNVERIFIED` 의미를 설명한다.
- 충돌 상세은 출처별 카드/행을 대칭으로 보여주고 정렬 순서가 우선순위를 암시하지 않게 한다.
- drawer/sheet는 제목, 닫기, focus trap, 원래 위치 복귀를 제공한다.

## 11. 상태별 화면 규칙

- **loading**: 검색과 슬롯 skeleton에 텍스트 “조회 중/수집 중”을 제공한다. 전체 페이지를 한 소스
  때문에 무기한 block하지 않는다.
- **partial**: 성공 슬롯은 정상 위치에 유지하고 실패 슬롯에 국소 상태와 재시도를 둔다. 상단에는
  “일부 정보만 확인됨”이라고 비판정형으로 요약한다.
- **stale**: 과거 값, basis/checked time, “오래됨” label, 최신 확인 실패 여부를 함께 표시한다.
- **unverified**: 값이 있어도 “확인 필요”와 부족한 근거를 표시한다.
- **collection failed**: 해당 source/항목 수집 실패와 최근 시도를 설명하고 다른 슬롯은 유지한다.
- **conflict**: 슬롯 요약에서 충돌과 근거 수를 알리고 상세에 양쪽 값을 같은 위계로 보인다.
- **unsupported point**: 입력과 미지원 상태를 명시하고 브리프·추정값을 만들지 않는다.
- **ambiguous point**: 후보 구분 맥락을 요구하고 사용자 선택 전 브리프를 만들지 않는다.
- **empty/no data**: “현재 확인 가능한 데이터 없음”과 가능한 후속 행동을 제공하되 가능·안전
  결론이나 0값을 표시하지 않는다.
- **catalog unavailable**: 지원여부를 추정하지 않고 검색 실패 범위와 재시도만 제공한다.
- **retry unavailable**: 무한 재시도 대신 현재 불가 이유, 돌아가기 또는 나중에 재시도 안내를 둔다.

## 12. 컴포넌트 책임

| 컴포넌트 | 단일 책임 | 보존할 계약 |
|---|---|---|
| SearchForm | 명시적 조회 입력과 진행 상태 | query, loading, catalog error |
| CandidateList | 후보 identity와 구분 맥락 | point_id, name, region_context, support_status |
| CandidateRow | 한 후보의 명시적 선택 | 자동선택 금지, 44px target |
| PointIdentityHeader | 선택 포인트 재확인 | name, region context, change action |
| BriefAvailability | 비판정형 데이터 가용성 요약 | partial/empty/failure; 허용 여부 금지 |
| BriefSlot | 한 정보 값과 신뢰 요약 | value, source link, time, trust_status |
| TrustBadge | canonical 상태의 text+icon 표시 | 다섯 상태 의미 보존 |
| EvidenceDisclosure | 슬롯과 상세 근거 연결 | expanded state, accessible name |
| EvidencePanel | provenance와 상태 이유 | source/time/reference/conflict records |
| RetryAction | 실패한 범위만 재시도 | 성공 데이터·focus·문맥 보존 |
| StateMessage | unsupported/ambiguous/empty/error 안내 | 금지 추론 없음, 후속 행동 |

## 13. 시각 원칙 적용

- **Canvas**: 흰색을 주 바탕으로 하고 검색 결과/브리프 그룹에 soft gray band를 제한 사용한다.
- **Primary blue**: 검색 제출, 후보 확정처럼 한 화면의 주요 행동 한두 개에만 사용한다.
- **Hairline**: 후보 행, 슬롯, 근거 행을 1px divider로 구조화한다.
- **Cards**: 큰 그룹에만 24px radius를 사용하고 모든 행을 카드로 둘러 밀도를 낮추지 않는다.
- **Shadow**: overlay 또는 hover 구분이 꼭 필요할 때 한 단계만 사용한다.
- **Data scan**: label/status/time 열을 일관되게 정렬하고 수치·시각은 tabular mono를 사용한다.
- **Dark surface**: 마케팅 hero를 복제하지 않으며 제품 근거 패널에 장식적으로 쓰지 않는다.

## 14. 타이포그래피

- 제품 제목 32px/400 이하, 섹션 제목 18px/600, 행 label 16px/600, 본문 16px/400을 기준으로
  한다. 80px 마케팅 display는 이 제품 화면에서 사용하지 않는다.
- 상태와 근거 설명은 최소 13~14px로 유지하고 축소된 badge 안에 장문을 넣지 않는다.
- 숫자, 단위, 기준시각은 JetBrains Mono 또는 Geist Mono 500과 tabular figures를 사용한다.
- 중요도는 과도한 bold보다 위치, 여백, 대비, heading hierarchy로 만든다.

## 15. 간격과 밀도

- 4px 배수만 사용하고 일반 행 16px, 그룹 24px, 카드 24~32px, 화면 section 48~64px를
  기준으로 한다.
- Base Design의 96px 마케팅 section 간격은 제품 UI의 정보 밀도에 맞게 축소한다.
- 후보와 슬롯은 한 화면에서 충분히 비교할 수 있는 행 밀도를 유지하되 44px 최소 행동 영역을
  침해하지 않는다.
- 상태 label, 시간, 근거 행동은 값과 시각적으로 연결되며 별도 화면에 숨겨 관계를 잃지 않는다.

## 16. 모바일 반응형

- 640px 미만에서 검색 → 후보 → 브리프를 단일 열과 단계 전환으로 구성한다.
- 후보 선택 후 브리프 상단에 “검색 결과로 돌아가기”를 제공하고 입력·scroll 문맥을 보존한다.
- 슬롯 grid는 한 열의 label/value/status/time/근거 순으로 재배치한다.
- 근거 side panel은 full-height bottom sheet가 되며 swipe만이 아닌 닫기 button을 제공한다.
- 공간 맥락은 P1에서 생략 가능하고 위치권한을 요구하지 않는다.

## 17. 키보드·포커스·스크린리더

- Tab 순서는 검색 입력, 제출, 후보 행, 브리프 슬롯의 근거 행동, 재시도 순으로 DOM과 일치한다.
- 선택 가능한 후보는 button/radio/listbox 중 동작에 맞는 native semantic을 사용하며 Enter/Space를
  지원한다.
- focus ring은 2px blue와 충분한 offset으로 표시하고 색 대비를 검증한다.
- 검색 결과 수, loading 종료, partial/failed 변경은 과도하지 않은 live region으로 알린다.
- drawer/sheet는 접근 가능한 제목, focus trap, Esc 닫기, trigger focus 복귀를 제공한다.
- badge의 canonical code는 보조 텍스트로 노출 가능하되 한국어 의미를 대체하지 않는다.

## 18. Motion과 reduced motion

- 로딩, drawer, 행 확장은 상태 이해를 돕는 짧은 전환만 사용하고 장식적 반복 motion은 금지한다.
- `prefers-reduced-motion`에서는 이동·확대 애니메이션을 제거하고 opacity 또는 즉시 전환한다.
- skeleton shimmer가 필요하면 reduced-motion에서 정적 placeholder로 바꾼다.
- motion이 데이터가 새로 검증됐거나 확정됐다는 의미를 단독으로 전달하지 않는다.
- 구체적인 duration/easing은 Base Design의 known gap이며 구현 전 접근성 검증으로 정한다.

## 19. 샘플 데이터와 Requirement 경계

- Stitch의 포인트명, 지역, 좌표, 기관, 관측값, 시각, latency, schema, checksum은 모두 시각 검증용
  filler이며 실제 POC 계약이 아니다.
- 샘플 슬롯명은 OD-01, 샘플 시간 차는 OD-02, 샘플 위치는 OD-03, 샘플 기관명은 OD-04를
  확정하지 않는다.
- 프로토타입에는 “샘플 슬롯/예시 데이터” 표기를 유지한다.
- 실제 콘텐츠가 승인되기 전에는 문서·테스트가 샘플을 필수 필드나 정책으로 인용하지 않는다.

## 20. 금지 UI 패턴

- 녹색 “가능/안전/추천” badge와 데이터 없음의 긍정적 판정
- 추천점수, 갈만함 점수, AI 추천, 조과예측
- `CONFLICT`에서 한 출처만 강조하거나 나머지를 숨기는 카드
- `STALE`과 최신 `CONFIRMED`가 같은 label/icon인 표현
- 실패한 한 슬롯 때문에 성공 브리프 전체를 error page로 대체
- 출처·시각·상태가 모두 사라진 핵심 값
- 동일명 검색의 첫 결과 자동선택
- Coinbase/암호화폐 브랜드 문구·로고·거래 그래픽
- 기본 정확 GPS 권한 요청, 저장 또는 공개
- 전국 지도 커버리지나 법적 가능을 암시하는 표현

## 21. Design에서 확정하지 않는 사항

| 항목 | 상태 |
|---|---|
| OD-01 실제 판단 브리프 `info_type` 목록 | `PRODUCT_DECISION_REQUIRED` |
| OD-02 freshness threshold 숫자 | `PRODUCT_DECISION_REQUIRED` |
| OD-03 실제 POC 포인트명/지역 | `PRODUCT_DECISION_REQUIRED` |
| OD-04 외부 공급자·API endpoint·라이선스 | `ARCHITECTURE_TBD` / Not a Design Decision |
| OD-05 KPI 목표 수치 | `TBD_AFTER_BASELINE` |
| OD-07 FR-03/FR-05 활성 릴리스 | `DEFERRED_VALIDATION` / Not a Design Decision |

## 22. SRS Requirement → 디자인 대응

| SRS Requirement | Design 대응 위치/상태 | 관련 `DESIGN.md` 원칙 | 비고 |
|---|---|---|---|
| `REQ-FUNC-POINT-001` | SearchForm, 탐색 화면 | search input, primary action | Search-first |
| `REQ-FUNC-POINT-002` | CandidateList/Row, ambiguous 상태 | dense rows, hairline | 자동선택 금지 |
| `REQ-FUNC-POINT-003` | unsupported/ambiguous StateMessage | text hierarchy, soft surface | 브리프 생성 금지 |
| `REQ-FUNC-BRIEF-001` | PointIdentityHeader, BriefSlot | product card, data rows | 슬롯 목록 TBD |
| `REQ-FUNC-BRIEF-002` | BriefAvailability, 슬롯별 독립 상태 | card/row hierarchy | 성공 정보 유지 |
| `REQ-FUNC-BRIEF-003` | stale 슬롯, time summary | mono numeric/time | 최신처럼 표현 금지 |
| `REQ-FUNC-TRUST-001` | TrustBadge, EvidenceDisclosure | badge, typography | source/time/status 접근 |
| `REQ-FUNC-TRUST-002` | stale/unverified 규칙 | non-color status hierarchy | threshold TBD |
| `REQ-FUNC-TRUST-003` | EvidencePanel conflict 대칭 행 | hairline data rows | 단일 승자 금지 |
| `REQ-FUNC-TRUST-004` | TrustBadge 상태 지속 표현 | stable text+icon | motion/시간으로 승격 금지 |
| `REQ-FUNC-TRUST-005` | empty/unverified 경고 문구 | neutral surface, body text | 가능 판정 금지 |
| `REQ-NFR-PERF-002` | 슬롯 loading과 progressive return | skeleton/row pattern | 전체 무기한 block 금지 |
| `REQ-NFR-AVAIL-001` | stale cache label/time | mono time, badge | 캐시 신선도 왜곡 금지 |
| `REQ-NFR-DATA-001` | BriefSlot→EvidencePanel 연결 | progressive disclosure | 메타데이터 유실 금지 |
| `REQ-NFR-DATA-002` | conflict evidence list | equal-weight data rows | 원본 보존 |
| `REQ-NFR-PRIV-001~002` | 위치권한 없는 Search-first | input and navigation | 정확 GPS 기본 저장 없음 |
| `REQ-NFR-COST-002` | 지도 비의존 구조 | simple responsive grid | 제한 POC 우선 |

## 23. 구현 후 디자인 검증 체크리스트

- [ ] 검색이 첫 focus이며 label, error, loading 상태가 스크린리더에 전달된다.
- [ ] 동일·유사 후보가 구분 맥락 없이 자동 선택되지 않는다.
- [ ] 미지원·모호 입력에서 정상 브리프가 생성되지 않는다.
- [ ] 부분 실패 중 성공 슬롯이 유지되고 실패 범위만 재시도된다.
- [ ] 모든 핵심 슬롯에 trust label과 시간 요약 또는 명시적 결손 상태가 있다.
- [ ] 다섯 Trust Status가 text+icon으로 구분되며 색상 단독 의미가 없다.
- [ ] `CONFIRMED`가 가능·안전·추천으로 표현되지 않는다.
- [ ] stale cache가 최신 데이터와 구분되고 수집 실패 의미도 확인 가능하다.
- [ ] conflict 상세에 양쪽 이상 근거가 같은 위계로 표시된다.
- [ ] 규제/접근 데이터 없음이 낚시 가능으로 표현되지 않는다.
- [ ] 모바일에서 검색→후보→브리프→근거 상세이 가로 스크롤 없이 완료된다.
- [ ] 키보드로 모든 행동을 수행하고 overlay 닫기 후 trigger로 focus가 복귀한다.
- [ ] 44px target, focus ring, 텍스트/배경 대비, reduced motion이 검증된다.
- [ ] 정확 GPS와 불필요 개인정보가 기본 입력·저장·계측에 없다.
- [ ] 실제 구현이 Base `DESIGN.md`의 canvas/surface/blue/hairline/type/spacing 역할을 지킨다.
- [ ] Coinbase 고유 브랜드·암호화폐·마케팅 요소를 복제하지 않는다.
- [ ] Stitch의 샘플 데이터가 실제 Requirement/정책/공급자로 승격되지 않는다.

## 24. 결정 요약

OD-06은 Search-first로 결정한다. 검색과 후보 식별을 P1의 진입점으로 두고, 명시적 선택 뒤
data-driven 브리프와 근거 상세을 제공한다. 공간 맥락은 핵심 의존성이 아니며 실제 지도/API
결정은 하지 않았다. Base `DESIGN.md`는 변경하지 않았고 이 문서가 Feature별 적용 규칙을 소유한다.
