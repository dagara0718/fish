import type { SpeciesEvidence, SpeciesProfile } from './contracts'

// Sourced in specs/001-point-decision-brief/research/species-environment-evidence.md — v1.5 audit
// (2026-09-17) and the v1.6.6 evidence pass (2026-09-27). Any field absent here has no cited source at
// PRIMARY_GOVERNMENT/PEER_REVIEWED/ACADEMIC_INSTITUTION quality and stays UNKNOWN — never a guessed
// range. A namu.wiki/news/hobbyist-fishing-site claim is never the basis for a numeric threshold.
// Every number below was confirmed on the source page itself (abstract/full text/official PDF), not
// from a search snippet. Water temperature values are Celsius on the sourcing side; KHOA's own unit is
// unconfirmed but its value range (~0-35) is only sensibly Celsius.
//
// Claim units (read before comparing species): preferred = a documented growth/feeding optimum;
// tolerated = a documented survival/habitat range (not a lethal limit unless stated); season = the
// documented spawning/parturition or normal-feeding months named in each evidence row.
export const PROFILE_VERSION = '2026-09-v3'
const reviewedAt = '2026-09-27T00:00:00.000Z'

// 국립수산과학원 document covering 돔류 as a group, explicitly naming 참돔·감성돔·돌돔. Group-level values,
// labelled as such wherever used.
const NIFS_SEABREAM_URL = 'https://nifs.go.kr/portal/cmmnAtchFile/getAtchFileGroup.do?atchFileGroupId=PBLC00120241126170748261syxhETdt'
const nifsSeabream = (claim: string): SpeciesEvidence => ({ sourceTitle: '돔류 질병 및 대책 (Sea bream diseases and its prevention)', sourceOrganization: '국립수산과학원 병리연구과 (government research institute) — 돔류(참돔·감성돔·돌돔) 공통 수치', quality: 'PRIMARY_GOVERNMENT', sourceUrl: NIFS_SEABREAM_URL, retrievedAt: reviewedAt, supportedClaim: claim })

export const SPECIES_PROFILES: SpeciesProfile[] = [
  {
    // v1.6.6: two peer-reviewed juvenile growth experiments bracket the optimum (20℃ best of
    // 16/20/24℃; 17℃ better than 20℃ for ~5 g fish). Tolerated = documented survival at both ends
    // (100% at 4℃ for 14 days; 60 days at 27℃ survivable), below the 29.4-30.9℃ CTM. Season = Korean
    // parturition months (난태생).
    speciesId: 'rockfish-jopi-bollak', canonicalName: '우럭', aliases: ['조피볼락', 'Sebastes schlegelii'],
    preferredWaterTemperature: { min: 17, max: 20 },
    toleratedWaterTemperature: { min: 4, max: 27 },
    seasonalActiveMonths: [4, 5],
    habitatContext: '연안 얕은 암초지대, 정착성 (근거: 정성적 서술)',
    evidence: [
      { sourceTitle: 'Response of juvenile black rockfish (Sebastes schlegelii) to water temperature: Growth, antioxidant capacity, and metabolism (Mu et al. 2026)', sourceOrganization: 'Aquaculture International (peer-reviewed)', quality: 'PEER_REVIEWED', sourceUrl: 'https://link.springer.com/article/10.1007/s10499-026-02583-2', retrievedAt: reviewedAt, supportedClaim: '16/20/24℃ 28일 사육 — 20℃에서 성장 최고, 24℃ 산화 스트레스 증가 (선호 구간 상단 20℃)' },
      { sourceTitle: 'The effects of feeding rates in juvenile Korean rockfish (Sebastes schlegeli) reared at 17 °C and 20 °C (Mizanur et al. 2014)', sourceOrganization: 'Aquaculture International (peer-reviewed)', quality: 'PEER_REVIEWED', sourceUrl: 'https://link.springer.com/article/10.1007/s10499-013-9732-8', retrievedAt: reviewedAt, supportedClaim: '5 g 치어는 20℃보다 17℃에서 성적 우수 (선호 구간 하단 17℃)' },
      { sourceTitle: '수온과 염분이 조피볼락의 생존, 대사 및 조직학적 변화에 미치는 영향 (양 등 2016)', sourceOrganization: '수산해양교육연구 (peer-reviewed)', quality: 'PEER_REVIEWED', sourceUrl: 'https://scienceon.kisti.re.kr/srch/selectPORSrchArticle.do?cn=JAKO201625654347939', retrievedAt: reviewedAt, supportedClaim: '4·6·8·10℃ 14일 생존 100% (서식 가능 하단 4℃, 치사 한계 아님)' },
      { sourceTitle: 'Critical Thermal Maximum (CTM) of Cultured Black Rockfish, Sebastes schlegeli (김 등 2003)', sourceOrganization: 'Fisheries and Aquatic Sciences (peer-reviewed)', quality: 'PEER_REVIEWED', sourceUrl: 'https://koreascience.kr/article/JAKO200324839350506.page', retrievedAt: reviewedAt, supportedClaim: 'CTM 29.4~30.9℃ (24℃ 순치 후 승온) — 서식 가능 상단 27℃는 이 한계 아래' },
      { sourceTitle: '조피볼락의 생식주기 (백 등 2000)', sourceOrganization: '한국수산학회지 (peer-reviewed)', quality: 'PEER_REVIEWED', sourceUrl: 'https://scienceon.kisti.re.kr/srch/selectPORSrchArticle.do?cn=JAKO200024839399930&dbt=NART', retrievedAt: reviewedAt, supportedClaim: '암컷 산출기 4~5월 (계절 구간)' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
  {
    // Preferred range and the 6.54℃ critical-low threshold: peer-reviewed. v1.6.6: the tolerated
    // upper bound was previously the preferred range's own lower edge (18℃, a placeholder that made
    // any water above 20℃ a MISMATCH); it now uses the NIFS 돔류 habitat upper bound (28℃).
    speciesId: 'red-seabream', canonicalName: '참돔', aliases: ['Pagrus major'],
    preferredWaterTemperature: { min: 18, max: 20 },
    toleratedWaterTemperature: { min: 6.54, max: 28 },
    seasonalActiveMonths: [4, 5, 6],
    habitatContext: '수심 30~150m, 조류가 좋은 자갈/모래/암반 지대',
    evidence: [
      { sourceTitle: '수온 하강에 따른 참돔의 생존율 및 생리 반응', sourceOrganization: '한국어류학회지 (peer-reviewed)', quality: 'PEER_REVIEWED', sourceUrl: 'https://kiss.kstudy.com/Detail/Ar?key=3630036', retrievedAt: reviewedAt, supportedClaim: '최적 수온 18~20℃, 15℃ 이하 먹이활동 저하, 하한 임계 수온 6.54℃, 14℃ 이하 이동·먹이활동 중단' },
      nifsSeabream('돔류 서식수온 13∼28℃ — 서식 가능 상단 28℃에만 사용'),
      { sourceTitle: '참돔', sourceOrganization: '서울대학교 해양저서생태학연구실(Our Benthos) (academic institution)', quality: 'ACADEMIC_INSTITUTION', sourceUrl: 'https://benthos.snu.ac.kr/our-data/our-benthos?md=v&bbsidx=10623', retrievedAt: reviewedAt, supportedClaim: '수심 30~150m 조류가 좋은 자갈/모래/암반 지대 서식, 4~6월 산란' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
  {
    // v1.6.6: species-specific peer-reviewed data give only a lower lethal bound (5℃) and single-point
    // optima, not a range, so the temperature ranges use the NIFS 돔류 group values (labelled). Season
    // = Korean spawning months (peer-reviewed field study, matching MABIK).
    speciesId: 'blackhead-seabream', canonicalName: '감성돔', aliases: ['Acanthopagrus schlegelii'],
    preferredWaterTemperature: { min: 20, max: 28 },
    toleratedWaterTemperature: { min: 13, max: 28 },
    seasonalActiveMonths: [3, 4, 5, 6, 7],
    habitatContext: '수심 5~50m 모래바닥·암초지역·기수역, 연안 갯바위 인근 (근거: 정성적 서술)',
    evidence: [
      nifsSeabream('돔류 서식수온 13∼28℃, 20∼28℃ 수온상승기(7-9월)가 돔류의 적수온기(본격 성장) — 돔류 공통 수치'),
      { sourceTitle: 'Maturation and spawning of black seabream Acanthopagrus schlegeli in the southern sea of Korea (권 등 2009)', sourceOrganization: '한국어류학회지 (peer-reviewed)', quality: 'PEER_REVIEWED', sourceUrl: 'https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001359563', retrievedAt: reviewedAt, supportedClaim: '남해 산란기 3~7월, 성기 5~6월' },
      { sourceTitle: '감성돔', sourceOrganization: '국립해양생물자원관 해양생명자원 정보 (government)', quality: 'PRIMARY_GOVERNMENT', sourceUrl: 'https://www.mbris.kr/pub/marine/tsearch/tsearchDetail.do?spcTxnId=270000000084', retrievedAt: reviewedAt, supportedClaim: '산란시기 3~7월 정도' },
      { sourceTitle: '감성돔', sourceOrganization: '서울대학교 해양저서생태학연구실(Our Benthos) (academic institution)', quality: 'ACADEMIC_INSTITUTION', sourceUrl: 'https://benthos.snu.ac.kr/our-data/our-benthos?md=v&bbsidx=10617', retrievedAt: reviewedAt, supportedClaim: '수심 5~50m 모래바닥·암초지역·기수역 서식 — habitat 서술로만 사용' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
  {
    // v1.6.6: the same NIFS-authored paper behind the v1.5 lower bound also ran 21~33℃ — two-sided now.
    // Preferred = feed efficiency enhanced 21~27℃; tolerated = normal growth 17~30℃. Season = wild 통영
    // fish ripe/spawning December~March (winter spawner).
    speciesId: 'japanese-seaperch', canonicalName: '농어', aliases: ['Lateolabrax japonicus'],
    preferredWaterTemperature: { min: 21, max: 27 },
    toleratedWaterTemperature: { min: 17, max: 30 },
    seasonalActiveMonths: [12, 1, 2, 3],
    habitatContext: '연안·기수역 (근거: 정성적 서술)',
    evidence: [
      { sourceTitle: '농어, Lateolabrax japonicus 유어의 성장에 있어 사육 수온의 영향 (강·한·전 2004)', sourceOrganization: '한국양식학회지 (peer-reviewed, 국립수산과학원 저자)', quality: 'PEER_REVIEWED', sourceUrl: 'https://www.koreascience.kr/article/JAKO200411923040492.page', retrievedAt: reviewedAt, supportedClaim: '사료효율 21~27℃에서만 향상(선호 구간), 성장은 17~30℃에서 정상(서식 가능 구간), 3℃·30~33℃에서 생존율 저하' },
      { sourceTitle: '농어, Lateolabrax japonicus의 생식주기 (강·한·안 2001)', sourceOrganization: '한국어류학회지 (peer-reviewed)', quality: 'PEER_REVIEWED', sourceUrl: 'https://www.koreascience.or.kr/article/JAKO200127236820845.page', retrievedAt: reviewedAt, supportedClaim: '통영 자연산 — 완숙·산란기 12~3월 (계절 구간)' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
  {
    // v1.6.6: temperature ranges and the season window come from the NIFS 돔류 group document (labelled);
    // species-specific peer-reviewed data add only a low-temperature LT50 (6.99℃). Season here is the
    // documented normal-feeding period on the south coast, not spawning (Korean spawning months were
    // not confirmed by any allowed source).
    speciesId: 'rock-bream', canonicalName: '돌돔', aliases: ['Oplegnathus fasciatus'],
    preferredWaterTemperature: { min: 20, max: 28 },
    toleratedWaterTemperature: { min: 13, max: 28 },
    seasonalActiveMonths: [5, 6, 7, 8, 9, 10, 11],
    habitatContext: '암초 지대, 어릴 때 표층 부유 후 성장하며 저층 정착 (근거: 정성적 서술)',
    evidence: [
      nifsSeabream('돔류 서식수온 13∼28℃, 20∼28℃가 적수온기, 남해안 정상 섭이 기간 5~11월(수온 15℃ 이상) — 돔류 공통 수치'),
      { sourceTitle: '돌돔(Oplegnathus fasciatus)의 생존, 산소소비 및 생리학적 반응에 미치는 저수온의 영향 (신 등 2020)', sourceOrganization: '한국수산과학회지 (peer-reviewed)', quality: 'PEER_REVIEWED', sourceUrl: 'https://www.kci.go.kr/kciportal/landing/article.kci?arti_id=ART002640215', retrievedAt: reviewedAt, supportedClaim: '4일 LT50 6.99℃, 10℃ 생존 100% — 하한 참고(범위에는 NIFS 13℃ 사용)' },
      { sourceTitle: '돌돔', sourceOrganization: '서울대학교 해양저서생태학연구실(Our Benthos) (academic institution)', quality: 'ACADEMIC_INSTITUTION', sourceUrl: 'https://benthos.snu.ac.kr/our-data/our-benthos?md=v&bbsidx=10552', retrievedAt: reviewedAt, supportedClaim: '암초 지대 서식, 성장하며 저층으로 이동·정착 — habitat 서술로만 사용' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
  {
    // v1.6.6: season confirmed (peer-reviewed, Japanese Pacific coast). Temperature: only the EGG
    // development range (15~21℃) was confirmed — applying egg-stage thresholds to adult fish would be
    // the same claim-unit error v1.5 removed, so no temperature range → stays INSUFFICIENT_EVIDENCE.
    speciesId: 'largescale-blackfish', canonicalName: '벵에돔', aliases: ['Girella punctata'],
    seasonalActiveMonths: [2, 3, 4, 5, 6],
    habitatContext: '연안 암초 지대 (근거: 정성적 서술)',
    evidence: [
      { sourceTitle: 'Sexual maturation of Girella punctata and G. leonina in the neritic sea off the Pacific coast of Japan (Takai et al. 2017)', sourceOrganization: 'Coastal Marine Science (peer-reviewed)', quality: 'PEER_REVIEWED', sourceUrl: 'https://repository.dl.itc.u-tokyo.ac.jp/record/48904/files/CMS400102.pdf', retrievedAt: reviewedAt, supportedClaim: '산란기 2~6월(선행연구 일치), 다네가시마 3월·이즈 4월 GSI 최고 — 일본 태평양 연안' },
      { sourceTitle: 'Spawning ecology of Girella punctata and G. leonina in the coastal waters of the Izu Peninsula (Nakai et al. 2015)', sourceOrganization: 'Coastal Marine Science (peer-reviewed)', quality: 'PEER_REVIEWED', sourceUrl: 'https://repository.dl.itc.u-tokyo.ac.jp/record/40625/files/CMS380103.pdf', retrievedAt: reviewedAt, supportedClaim: '이즈반도 산란기 4~5월(GSI 최고)' },
      { sourceTitle: '벵에돔과 긴꼬리벵에돔의 난 발생에 미치는 수온의 영향 (오 등 2010)', sourceOrganization: '발생과 생식 (peer-reviewed)', quality: 'PEER_REVIEWED', sourceUrl: 'https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001463323', retrievedAt: reviewedAt, supportedClaim: '난 발생 적정 15~21℃, 24℃ 이상 비정상 — 알 단계 수치라 성어 수온 factor에 사용하지 않음' },
    ],
    profileVersion: PROFILE_VERSION, reviewedAt,
  },
]
