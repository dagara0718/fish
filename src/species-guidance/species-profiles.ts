import type { SpeciesProfile } from './contracts'

// Sourced in specs/001-point-decision-brief/research/species-environment-evidence.md (retrieved
// 2026-09-16). Any field absent here has no cited source and must stay UNKNOWN — never a guessed
// range. Water temperature values are Celsius on the sourcing side; KHOA's own unit is unconfirmed
// (see research doc "공통 불확실성") but its value range (~0-35) is only sensibly Celsius.
export const PROFILE_VERSION = '2026-09-v1'
const reviewedAt = '2026-09-16T00:00:00.000Z'

export const SPECIES_PROFILES: SpeciesProfile[] = [
  {
    speciesId: 'rockfish-jopi-bollak', canonicalName: '우럭', aliases: ['조피볼락'],
    toleratedWaterTemperature: { min: 5, max: 22 },
    seasonalActiveMonths: [4, 5, 6],
    habitatContext: '연안 얕은 암초지대, 무리 서식, 정착성',
    evidence: [
      { sourceTitle: '우럭은 사실 생선이 아니라 조개입니다!?', sourceOrganization: '머니투데이', sourceUrl: 'https://news.mt.co.kr/mtview.php?no=2021040913034357591', retrievedAt: reviewedAt, supportedClaim: '볼락류는 찬물을 선호하며 수온 15~16℃ 무렵(4~6월) 연안 암초지대에서 출산' },
      { sourceTitle: '내가 먹었던게 우럭이 아니라고? 사실은 표준명 조피볼락', sourceOrganization: '수협뉴스', sourceUrl: 'https://www.suhyupnews.co.kr/news/articleView.html?idxno=29934', retrievedAt: reviewedAt, supportedClaim: '한반도 연안 암초 지대 서식, 난태생' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
  {
    speciesId: 'red-seabream', canonicalName: '참돔', aliases: ['Pagrus major'],
    preferredWaterTemperature: { min: 18, max: 20 },
    toleratedWaterTemperature: { min: 6.54, max: 26 },
    seasonalActiveMonths: [4, 5, 6],
    habitatContext: '수심 30~150m, 조류가 좋은 자갈/모래/암반 지대',
    evidence: [
      { sourceTitle: '수온 하강에 따른 참돔의 생존율 및 생리 반응', sourceOrganization: '한국어류학회지', sourceUrl: 'https://kiss.kstudy.com/Detail/Ar?key=3630036', retrievedAt: reviewedAt, supportedClaim: '최적 수온 18~20℃, 15℃ 이하 먹이활동 저하, 하한 임계 수온 6.54℃, 14℃ 이하 이동·먹이활동 중단' },
      { sourceTitle: '참돔', sourceOrganization: '서울대학교 해양저서생태학연구실(Our Benthos)', sourceUrl: 'https://benthos.snu.ac.kr/our-data/our-benthos?md=v&bbsidx=10623', retrievedAt: reviewedAt, supportedClaim: '수심 30~150m 조류가 좋은 자갈/모래/암반 지대 서식, 4~6월 산란' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
  {
    speciesId: 'blackhead-seabream', canonicalName: '감성돔', aliases: ['Acantopagrus schlegelii'],
    toleratedWaterTemperature: { min: 7, max: 30 },
    habitatContext: '수심 5~50m 모래바닥·암초지역·기수역, 연안 갯바위 인근',
    evidence: [
      { sourceTitle: '감성돔', sourceOrganization: '나무위키(생태 서술, 1차 정부 출처 미확인)', sourceUrl: 'https://namu.wiki/w/%EA%B0%90%EC%84%B1%EB%8F%94', retrievedAt: reviewedAt, supportedClaim: '수온 7~30℃ 범위에서 서식, 회유성, 기수역 적응' },
      { sourceTitle: '감성돔', sourceOrganization: '서울대학교 해양저서생태학연구실(Our Benthos)', sourceUrl: 'https://benthos.snu.ac.kr/our-data/our-benthos?md=v&bbsidx=10617', retrievedAt: reviewedAt, supportedClaim: '수심 5~50m 모래바닥·암초지역·기수역 서식' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
  {
    speciesId: 'japanese-seaperch', canonicalName: '농어', aliases: ['Lateolabrax japonicus'],
    toleratedWaterTemperature: { min: 12, max: 30 },
    habitatContext: '근거 부족 — v1.4 미사용',
    evidence: [
      { sourceTitle: '수온별 농어 성장 실험', sourceOrganization: 'Korean Journal of Environmental Biology', sourceUrl: 'http://www.ebr.or.kr/journal/article.php?code=85637', retrievedAt: reviewedAt, supportedClaim: '3/6/9/12/17℃ 사육 실험에서 12℃ 이하 성장 크게 저하; 하한 임계로만 방어적 사용' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
  {
    speciesId: 'rock-bream', canonicalName: '돌돔', aliases: ['Oplegnathus fasciatus'],
    toleratedWaterTemperature: { min: 20, max: 28 },
    seasonalActiveMonths: [6, 7],
    habitatContext: '암초 지대, 어릴 때 표층 부유 후 성장하며 저층 정착',
    evidence: [
      { sourceTitle: '돌돔', sourceOrganization: '나무위키(교차검증: 산란기 수온 서술)', sourceUrl: 'https://namu.wiki/w/%EB%8F%8C%EB%8F%94', retrievedAt: reviewedAt, supportedClaim: '남해안 기준 초여름(6~7월) 수온 20℃ 이상에서 산란' },
      { sourceTitle: '돌돔', sourceOrganization: '서울대학교 해양저서생태학연구실(Our Benthos)', sourceUrl: 'https://benthos.snu.ac.kr/our-data/our-benthos?md=v&bbsidx=10552', retrievedAt: reviewedAt, supportedClaim: '암초 지대 서식, 성장하며 저층으로 이동·정착' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
  {
    speciesId: 'largescale-blackfish', canonicalName: '벵에돔', aliases: ['Girella punctata'],
    preferredWaterTemperature: { min: 17, max: 21 },
    toleratedWaterTemperature: { min: 14, max: 25 },
    seasonalActiveMonths: [2, 3, 4, 5, 6],
    habitatContext: '제주·추자·거문도·백도 밀도 최고, 남해안·동해안 시기 한정 출현',
    evidence: [
      { sourceTitle: '벵에돔', sourceOrganization: '위키백과', sourceUrl: 'https://ko.wikipedia.org/wiki/%EB%B2%B5%EC%97%90%EB%8F%94', retrievedAt: reviewedAt, supportedClaim: '수온 17~21℃에서 가장 활발히 먹이활동, 18~25℃ 선호(난류), 산란기 2~6월(5월 최성기)' },
      { sourceTitle: '벵에돔낚시 - 벵에돔의 종류와 생태', sourceOrganization: 'eom.co.kr(위키백과와 수온 구간 상호 일치, 보조 확인용)', sourceUrl: 'https://www.eom.co.kr/9.useful%20area/fishing/sea/byong.ae.dom/00.htm', retrievedAt: reviewedAt, supportedClaim: '난류 선호, 수온 17~21℃ 활발, 산란기 2~6월' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
]
