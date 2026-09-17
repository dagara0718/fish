import type { SpeciesProfile } from './contracts'

// Sourced in specs/001-point-decision-brief/research/species-environment-evidence.md, v1.5 audit
// (retrieved 2026-09-16, re-reviewed 2026-09-17). Any field absent here has no cited source at
// PRIMARY_GOVERNMENT/PEER_REVIEWED/ACADEMIC_INSTITUTION quality and must stay UNKNOWN — never a
// guessed range. A namu.wiki/news/hobbyist-fishing-site claim is never the sole basis for a numeric
// threshold (v1.5 evidence policy) — see the research doc for the per-species audit trail of what
// was downgraded and why. Water temperature values are Celsius on the sourcing side; KHOA's own
// unit is unconfirmed but its value range (~0-35) is only sensibly Celsius.
export const PROFILE_VERSION = '2026-09-v2'
const reviewedAt = '2026-09-17T00:00:00.000Z'

export const SPECIES_PROFILES: SpeciesProfile[] = [
  {
    // v1.5 audit: the only numeric claims found (5~22℃, 4~6월) traced solely to a news article and
    // an industry-association news site — neither is government/academic/peer-reviewed. No stronger
    // source was found in this pass (see research doc). Downgraded to UNKNOWN rather than kept as
    // "verified" on a weak sole source.
    speciesId: 'rockfish-jopi-bollak', canonicalName: '우럭', aliases: ['조피볼락'],
    habitatContext: '연안 얕은 암초지대, 무리 서식, 정착성 (근거: 정성적 서술만 확인)',
    evidence: [
      { sourceTitle: '우럭은 사실 생선이 아니라 조개입니다!?', sourceOrganization: '머니투데이 (뉴스, 비정부/비학술)', quality: 'SECONDARY', sourceUrl: 'https://news.mt.co.kr/mtview.php?no=2021040913034357591', retrievedAt: reviewedAt, supportedClaim: '볼락류는 찬물 선호, 수온 15~16℃ 무렵(4~6월) 출산 — v1.5: 정부/학술 출처 없어 수온·계절 factor 미사용' },
      { sourceTitle: '내가 먹었던게 우럭이 아니라고? 사실은 표준명 조피볼락', sourceOrganization: '수협뉴스 (산업단체 뉴스, 비정부/비학술)', quality: 'SECONDARY', sourceUrl: 'https://www.suhyupnews.co.kr/news/articleView.html?idxno=29934', retrievedAt: reviewedAt, supportedClaim: '한반도 연안 암초 지대 서식, 난태생 — habitat 서술로만 사용, threshold 근거 아님' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
  {
    // v1.5 audit: preferred range and the 6.54℃ critical-low threshold are from a peer-reviewed
    // fisheries journal (PRIMARY tier for this project). No cited upper tolerance limit exists, so
    // the tolerated range's max reuses the preferred range's own lower boundary point rather than
    // inventing a new ceiling — it marks "not yet in the preferred zone" only up to where the cited
    // preferred zone begins, adding no new unsupported number. Season is from a university research
    // lab (academic institution tier), acceptable per the priority list.
    speciesId: 'red-seabream', canonicalName: '참돔', aliases: ['Pagrus major'],
    preferredWaterTemperature: { min: 18, max: 20 },
    toleratedWaterTemperature: { min: 6.54, max: 18 },
    seasonalActiveMonths: [4, 5, 6],
    habitatContext: '수심 30~150m, 조류가 좋은 자갈/모래/암반 지대',
    evidence: [
      { sourceTitle: '수온 하강에 따른 참돔의 생존율 및 생리 반응', sourceOrganization: '한국어류학회지 (peer-reviewed)', quality: 'PEER_REVIEWED', sourceUrl: 'https://kiss.kstudy.com/Detail/Ar?key=3630036', retrievedAt: reviewedAt, supportedClaim: '최적 수온 18~20℃, 15℃ 이하 먹이활동 저하, 하한 임계 수온 6.54℃, 14℃ 이하 이동·먹이활동 중단' },
      { sourceTitle: '참돔', sourceOrganization: '서울대학교 해양저서생태학연구실(Our Benthos) (academic institution)', quality: 'ACADEMIC_INSTITUTION', sourceUrl: 'https://benthos.snu.ac.kr/our-data/our-benthos?md=v&bbsidx=10623', retrievedAt: reviewedAt, supportedClaim: '수심 30~150m 조류가 좋은 자갈/모래/암반 지대 서식, 4~6월 산란' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
  {
    // v1.5 audit: the 7~30℃ range traces solely to namu.wiki — no government/academic source found
    // in two additional targeted searches this pass. Downgraded to UNKNOWN.
    speciesId: 'blackhead-seabream', canonicalName: '감성돔', aliases: ['Acantopagrus schlegelii'],
    habitatContext: '수심 5~50m 모래바닥·암초지역·기수역, 연안 갯바위 인근 (근거: 정성적 서술만 확인)',
    evidence: [
      { sourceTitle: '감성돔', sourceOrganization: '나무위키 (위키, 비정부/비학술 — 1차 정부 출처 미확인)', quality: 'SECONDARY', sourceUrl: 'https://namu.wiki/w/%EA%B0%90%EC%84%B1%EB%8F%94', retrievedAt: reviewedAt, supportedClaim: '수온 7~30℃ 범위에서 서식 — v1.5: 정부/학술 출처 없어 수온 factor 미사용' },
      { sourceTitle: '감성돔', sourceOrganization: '서울대학교 해양저서생태학연구실(Our Benthos) (academic institution)', quality: 'ACADEMIC_INSTITUTION', sourceUrl: 'https://benthos.snu.ac.kr/our-data/our-benthos?md=v&bbsidx=10617', retrievedAt: reviewedAt, supportedClaim: '수심 5~50m 모래바닥·암초지역·기수역 서식 — habitat 서술로만 사용' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
  {
    // v1.5 audit: peer-reviewed growth-experiment data confirms only a LOWER bound (12℃, below which
    // growth is sharply reduced). No cited upper limit exists. A CelsiusRange requires both ends, and
    // v1.5 will not invent an upper number to complete it — downgraded to UNKNOWN rather than
    // fabricate a ceiling. Revisit if a two-sided source (or a one-sided-bound profile field) is
    // added later.
    speciesId: 'japanese-seaperch', canonicalName: '농어', aliases: ['Lateolabrax japonicus'],
    habitatContext: '근거 부족 — v1.5 미사용',
    evidence: [
      { sourceTitle: '수온별 농어 성장 실험', sourceOrganization: 'Korean Journal of Environmental Biology (peer-reviewed)', quality: 'PEER_REVIEWED', sourceUrl: 'http://www.ebr.or.kr/journal/article.php?code=85637', retrievedAt: reviewedAt, supportedClaim: '3/6/9/12/17℃ 사육 실험에서 12℃ 이하 성장 크게 저하 — 하한만 확인, 상한 근거 없어 range factor 미사용' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
  {
    // v1.5 audit: both the temperature threshold and the season window trace solely to namu.wiki.
    // No government/academic source found. Downgraded to UNKNOWN.
    speciesId: 'rock-bream', canonicalName: '돌돔', aliases: ['Oplegnathus fasciatus'],
    habitatContext: '암초 지대, 어릴 때 표층 부유 후 성장하며 저층 정착 (근거: 정성적 서술만 확인)',
    evidence: [
      { sourceTitle: '돌돔', sourceOrganization: '나무위키 (위키, 비정부/비학술)', quality: 'SECONDARY', sourceUrl: 'https://namu.wiki/w/%EB%8F%8C%EB%8F%94', retrievedAt: reviewedAt, supportedClaim: '남해안 기준 초여름(6~7월) 수온 20℃ 이상에서 산란 — v1.5: 정부/학술 출처 없어 수온·계절 factor 미사용' },
      { sourceTitle: '돌돔', sourceOrganization: '서울대학교 해양저서생태학연구실(Our Benthos) (academic institution)', quality: 'ACADEMIC_INSTITUTION', sourceUrl: 'https://benthos.snu.ac.kr/our-data/our-benthos?md=v&bbsidx=10552', retrievedAt: reviewedAt, supportedClaim: '암초 지대 서식, 성장하며 저층으로 이동·정착 — habitat 서술로만 사용' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
  {
    // v1.5 audit: temperature and season claims trace to 위키백과 (tertiary/wiki) and a hobbyist
    // fishing-info site — the two sources agree with each other, but mutual agreement between two
    // non-primary sources does not elevate them to government/academic/peer-reviewed tier. Downgraded
    // to UNKNOWN.
    speciesId: 'largescale-blackfish', canonicalName: '벵에돔', aliases: ['Girella punctata'],
    habitatContext: '제주·추자·거문도·백도 밀도 최고, 남해안·동해안 시기 한정 출현 (근거: 정성적 서술만 확인)',
    evidence: [
      { sourceTitle: '벵에돔', sourceOrganization: '위키백과 (위키, 비정부/비학술)', quality: 'SECONDARY', sourceUrl: 'https://ko.wikipedia.org/wiki/%EB%B2%B5%EC%97%90%EB%8F%94', retrievedAt: reviewedAt, supportedClaim: '수온 17~21℃에서 가장 활발, 18~25℃ 선호, 산란기 2~6월 — v1.5: 정부/학술 출처 없어 수온·계절 factor 미사용' },
      { sourceTitle: '벵에돔낚시 - 벵에돔의 종류와 생태', sourceOrganization: 'eom.co.kr (낚시 정보 매체, 비정부/비학술)', quality: 'SECONDARY', sourceUrl: 'https://www.eom.co.kr/9.useful%20area/fishing/sea/byong.ae.dom/00.htm', retrievedAt: reviewedAt, supportedClaim: '위키백과와 수온 구간 상호 일치하나 두 출처 모두 비1차 출처 — threshold 근거로 채택하지 않음' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
]
