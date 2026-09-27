# Species environment evidence (v1.4 research, v1.5 evidence audit)

v1.4 retrieved 2026-09-16. v1.5 audit re-reviewed 2026-09-17: every existing profile factor was
checked against the source-quality bar (§ v1.5-product-delta.md "Evidence policy") — government
research institute, peer-reviewed journal, or academic institution required to back a numeric
threshold or season window. A namu.wiki/news/hobbyist-fishing-site claim, even when internally
consistent or cross-confirmed by a second non-primary source, is never sufficient on its own. Where
no qualifying source was found, the audit downgrades the field to `UNKNOWN` (removed from the
profile) rather than keep it "verified" on a weak sole source. Two further targeted searches
(국립수산과학원/MABIK 해양수산생명자원 통합정보시스템) were run during the audit and did not surface
a stronger source for 우럭/감성돔/돌돔/벵에돔 — see "Evidence gaps" below.

This is descriptive ecology, not a validated predictive model. It backs an explainable rule
(`scoring-policy.ts`), not a probability.

## 우럭 (조피볼락, *Sebastes schlegelii*)

| Factor | Claim | Source | Quality | Rule | Uncertainty |
|---|---|---|---|---|---|
| 수온 | 찬물 선호, 출산기 수온 15~16℃(4~6월) | 머니투데이 (뉴스) | SECONDARY | **UNKNOWN — v1.5 미사용** | 정부/학술 1차 출처 없음; 정밀 preferred/tolerated 수치 아님 |
| 계절 | 4~6월 출산 | 머니투데이 (뉴스) | SECONDARY | **UNKNOWN — v1.5 미사용** | 출산기≠활동기 가정 자체도 미검증 |
| 서식처 | 연안 얕은 암초지대, 무리 서식 | 수협뉴스 (산업단체 뉴스) | SECONDARY | 표시 텍스트로만 사용(factor 아님) | — |

v1.5 downgrade: v1.4에서 사용하던 `toleratedWaterTemperature: {5,22}`, `seasonalActiveMonths: [4,5,6]`
모두 뉴스 매체 단독 출처였음 — 제거.

## 참돔 (*Pagrus major* / *Chrysophrys major*)

| Factor | Claim | Source | Quality | Rule | Uncertainty |
|---|---|---|---|---|---|
| 수온 | 최적 18~20℃; 15℃ 이하 먹이활동 저하; 하한 임계 6.54℃; 14℃ 이하 이동·중단 | 한국어류학회지 (2016 무렵 게재, 수온 하강 실험 논문) | **PEER_REVIEWED** | `preferredWaterTemperature:{18,20}`, `toleratedWaterTemperature:{6.54,18}` (상한은 preferred 하한 재사용, 새 수치 없음) | 실험 개체군 기준, 야외 전 개체군 대표성 불명 |
| 계절 | 4~6월 산란 | 서울대 해양저서생태학연구실(Our Benthos) | ACADEMIC_INSTITUTION | `seasonalActiveMonths:[4,5,6]` | 산란기=활동기 가정 |
| 서식처 | 수심 30~150m, 조류 좋은 자갈/모래/암반 | Our Benthos | ACADEMIC_INSTITUTION | 표시 텍스트로만 사용 | — |

Sources: [수온 하강에 따른 참돔의 생존율 및 생리 반응](https://kiss.kstudy.com/Detail/Ar?key=3630036),
[참돔 – Our Benthos](https://benthos.snu.ac.kr/our-data/our-benthos?md=v&bbsidx=10623).
Retrieved 2026-09-16, re-confirmed 2026-09-17.

## 감성돔 (*Acantopagrus schlegelii*)

| Factor | Claim | Source | Quality | Rule | Uncertainty |
|---|---|---|---|---|---|
| 수온 | 서식 범위 7~30℃ | 나무위키 | SECONDARY | **UNKNOWN — v1.5 미사용** | 정부/학술 1차 출처 없음; 광범위 내온성 주장이라 threshold 가치도 낮음 |
| 계절 | 근거 없음 | — | — | UNKNOWN (v1.4부터 동일) | — |
| 서식처 | 수심 5~50m 모래바닥·암초·기수역 | Our Benthos | ACADEMIC_INSTITUTION | 표시 텍스트로만 사용 | — |

v1.5 downgrade: v1.4의 `toleratedWaterTemperature:{7,30}` 제거. MABIK(국립해양생물자원관) 검색에서도
동일 수치가 재확인되지 않아(검색 결과가 나무위키 근거를 그대로 반영했을 가능성) 채택하지 않음.

## 농어 (*Lateolabrax japonicus*)

| Factor | Claim | Source | Quality | Rule | Uncertainty |
|---|---|---|---|---|---|
| 수온 | 3/6/9/12/17℃ 사육 실험, 12℃ 이하 성장 급감 | Korean Journal of Environmental Biology | **PEER_REVIEWED** | **UNKNOWN — v1.5 미사용** | 하한만 확인, 상한 근거 없음. `CelsiusRange`는 양끝 필요 — 상한을 임의로 채우지 않고 factor 자체를 미사용 |
| 계절 | 근거 없음 | — | — | UNKNOWN (v1.4부터 동일) | — |

v1.5 downgrade: v1.4의 `toleratedWaterTemperature:{12,30}`에서 상한 30은 이번에 확인해보니 인용 근거가
없던 수치(사육 실험은 17℃까지만 진행)였음 — 제거. 향후 편도 임계값(min-only/max-only) 프로필 필드를
추가하면 하한 12℃만으로도 factor를 살릴 수 있음(v1.6 후보).

## 돌돔 (*Oplegnathus fasciatus*)

| Factor | Claim | Source | Quality | Rule | Uncertainty |
|---|---|---|---|---|---|
| 수온 | 남해안 초여름(6~7월) 수온 20℃ 이상 산란 | 나무위키 | SECONDARY | **UNKNOWN — v1.5 미사용** | 정부/학술 1차 출처 없음; 산란 임계값을 서식 tolerated로 전용한 것도 claim 단위 오류 |
| 계절 | 6~7월 산란 | 나무위키 | SECONDARY | **UNKNOWN — v1.5 미사용** | 상동 |
| 서식처 | 암초 지대, 어릴 때 표층→성장 시 저층 | Our Benthos | ACADEMIC_INSTITUTION | 표시 텍스트로만 사용 | — |

v1.5 downgrade: v1.4의 `toleratedWaterTemperature:{20,28}`, `seasonalActiveMonths:[6,7]` 모두 나무위키
단독 출처였음 — 제거.

## 벵에돔 (*Girella punctata*)

| Factor | Claim | Source | Quality | Rule | Uncertainty |
|---|---|---|---|---|---|
| 수온 | 17~21℃ 활발, 18~25℃ 선호 | 위키백과 + eom.co.kr(낚시 매체) | SECONDARY (2건 상호일치하나 둘 다 비1차) | **UNKNOWN — v1.5 미사용** | 상호 일치가 출처 품질을 올리지 못함 |
| 계절 | 2~6월 산란(5월 최성기) | 위키백과 + eom.co.kr | SECONDARY | **UNKNOWN — v1.5 미사용** | 상동 |
| 서식처 | 제주·추자·거문도·백도 밀도 최고 | 위키백과 | SECONDARY | 표시 텍스트로만 사용 | — |

v1.5 downgrade: v1.4의 `preferredWaterTemperature:{17,21}`, `toleratedWaterTemperature:{14,25}`,
`seasonalActiveMonths:[2,3,4,5,6]` 전부 제거 — 유일한 출처가 위키백과와 낚시 정보 매체뿐이었음.

## 기타어종

KHOA 응답의 "기타어종"은 특정 생물종이 아니라 미분류 카테고리다. SpeciesProfile 대상에서 제외
(§ v1.4-product-delta.md SPECIES-GUIDANCE-003, v1.5에서도 동일 유지).

## v1.5 net effect

이번 audit 이후 실제로 평가 가능한 factor를 가진 종은 **참돔 1종**뿐이다(수온+계절). 나머지 5종
(우럭·감성돔·농어·돌돔·벵에돔)은 v1.5부터 모든 factor가 `UNKNOWN`이라 항상
`INSUFFICIENT_EVIDENCE`로 귀결된다. 이는 회귀가 아니라 v1.4에서 약한 단독 출처로 지탱하던 결과를
제거한 정직한 결과다(§v1.5-product-delta.md).

## Evidence gaps (revisit triggers)

- **우럭**: 국립수산과학원 수산생명자원정보센터(nifs.go.kr/frcenter/) 포털은 존재가 확인됐으나 이번
  세션에서 조피볼락 개별 종 페이지를 직접 열람하지 못했다. 재검토 시 그 포털에서 직접 확인 필요.
- **감성돔/돌돔/벵에돔**: 동일 포털 및 MABIK 해양수산생명자원 통합정보시스템에서 개별 종 페이지를
  직접 열람하지 못했다.
- **농어**: 상한 수온 임계값의 peer-reviewed 근거를 찾지 못함. 편도 임계값 모델링(min-only) 지원 시
  하한만으로 factor 복구 가능.

## 공통 불확실성

- 모든 수온 수치는 원 출처가 섭씨(℃)로 명시한 값이며, KHOA `minWtem`/`maxWtem`의 실제 단위는 KHOA
  Swagger에 명시되지 않았다. 이번 v1.4/v1.5는 KHOA 수온 값의 범위(약 0~35, 2026-09-16 가거도 샘플
  24.3~24.4)가 섭씨로 해석하는 것이 유일하게 합리적이라는 정황적 가정 위에서만 비교하며, 이 가정을
  코드 주석과 UI 안내에 명시한다.
- 유속(`minCrsp`/`maxCrsp`)의 실제 단위/의미(유속만 제공, 방향 없음)는 KHOA Swagger로 확인되지
  않았다. 어종별 "선호 유속" 정량 근거도 이번 조사에서 확보하지 못했으므로, v1.4/v1.5는
  CURRENT_SPEED factor를 종 프로파일 기반 판정에 사용하지 않는다(§ marine-current-source-review.md).
- 물때(`tdlvHrCn`, 예: "중조기")의 공식 taxonomy와 어종 행동의 상관관계는 이번 조사에서 확보하지
  못했다. TIDE factor는 모든 종에서 `UNKNOWN`으로 유지된다.

# v1.6.6 evidence pass (2026-09-27) — profileVersion 2026-09-v3

Same bar as v1.5 (government / peer-reviewed / academic only; wiki, news, fishing media and search
snippets excluded). Five parallel research passes, each required to open the source page; every number
adopted below was then re-checked on the source page (abstract, full text or official PDF) before use.

| 종 | 선호 수온 | 서식 가능 수온 | 계절 | 근거 (품질) |
|---|---|---|---|---|
| 우럭 | 17~20℃ | 4~27℃ | 4~5월 (산출기) | Mu 2026 Aquac. Int. (20℃ 최고 of 16/20/24) · Mizanur 2014 Aquac. Int. (17℃ > 20℃) · 양 2016 수산해양교육연구 (4℃ 14일 생존 100%) · Ma 2026 FSI (27℃ 60일 생존, 초록) · 김 2003 FAS (CTM 29.4~30.9℃) · 백 2000 한국수산학회지 (산출기 4~5월) — 전부 PEER_REVIEWED |
| 참돔 | 18~20℃ (기존) | 6.54~**28**℃ | 4~6월 (기존) | 상한 18℃(v1.5 임시값, 근거 없음) → 국립수산과학원 돔류 서식수온 상한 28℃ (PRIMARY_GOVERNMENT, 돔류 공통) |
| 감성돔 | 20~28℃ | 13~28℃ | 3~7월 (산란기) | 국립수산과학원 「돔류 질병 및 대책」 (PRIMARY_GOVERNMENT, 돔류 공통: 서식 13∼28℃, 20∼28℃ 적수온기) · 권 2009 한국어류학회지 (산란기 3~7월, 성기 5~6월) · MABIK (3~7월) |
| 농어 | 21~27℃ | 17~30℃ | 12~3월 (산란기) | 강·한·전 2004 한국양식학회지 (사료효율 21~27℃, 정상 성장 17~30℃) · 강·한·안 2001 한국어류학회지 (통영 자연산 완숙·산란 12~3월) — PEER_REVIEWED |
| 돌돔 | 20~28℃ | 13~28℃ | 5~11월 (정상 섭이기) | 국립수산과학원 돔류 문서 (공통값; 남해안 정상 섭이 5~11월, 수온 15℃ 이상) · 신 2020 한국수산과학회지 (LT50 6.99℃, 참고) |
| 벵에돔 | **미사용** | **미사용** | 2~6월 (산란기) | Takai 2017 · Nakai 2015 Coastal Marine Science (일본 태평양 연안). 수온은 난 발생(15~21℃, 오 2010)만 확인 — 성어 기준 아님, 미사용 |

Deliberately NOT used: 감성돔 species-specific single-point optima (18℃, 15℃) and 5℃ lower lethal
bound (not ranges); 돌돔 "20~25℃ growth optima / CTmax 29~31℃" (one review sentence, no primary
study); 돌돔 spawning months (only wiki/AI summaries); 벵에돔 FishBase/AquaMaps modelled range; 우럭
"5~28℃ / 18~24℃" (secondary citation only, primary not opened); NIFS 농어 species page ("봄철 산란",
contradicts two peer-reviewed winter-spawning studies and lists the wrong Japanese name).

Caveats kept visible in each profile's evidence row: 돔류 values are group-level; season windows mix
spawning/parturition months (우럭·감성돔·농어·벵에돔·참돔) and a normal-feeding period (돌돔), stated per
species; most temperature data are aquaculture experiments on juveniles/yearlings; 벵에돔 season is from
Japanese waters. CURRENT_SPEED, TIDE and TIME_OF_DAY stay UNKNOWN for every species.

Net effect at 24.3~24.4℃ in September (unit test): 돌돔 HIGH; 감성돔·농어·우럭·참돔 MODERATE; 벵에돔
INSUFFICIENT_EVIDENCE. The rule table (`computeSuitability`) is unchanged.
