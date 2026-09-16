# Marine current/direction source review (v1.4 research artifact)

Retrieved 2026-09-16. Goal: determine whether a directional current/water-mass API exists that could
back a future "해류 방향" or "수괴" factor. Per v1.4 principle (§37), finding a candidate does not mean
implementing it — this documents candidates and a NOT_CONNECTED decision for this release.

## Candidates found

### 국립해양조사원 조류예보 (Tidal current forecast)
- Catalog listing: [해양수산부 국립해양조사원_조류예보](https://www.data.go.kr/data/15039001/openapi.do) (data.go.kr)
- Provider: 해양수산부 국립해양조사원 (해양예보과)
- Confirmed: exists on data.go.kr, public-data portal service-key model (같은 KHOA 계열 인증 체계).
- Not confirmed in this pass: exact operation path/parameters (detail page did not resolve via
  automated fetch in this session — `TBD_PROVIDER_CONFIRMATION`, same convention as the v1.1 KHOA
  research note).

### 국립해양조사원 수치조류도 지점별 최강창낙조 (Numerical tidal-current chart, peak flood/ebb by point)
- Catalog listing: [해양수산부 국립해양조사원_수치조류도 지점별 최강창낙조](https://www.data.go.kr/data/15039013/openapi.do)
- Provider: 해양수산부 국립해양조사원 (해양예보과)
- Request parameters (from catalog page): 검색 시작/종료 날짜·시간·분, 대상 지점 위도·경도.
- Response fields: 시간별 조류 종류, 예측 유속, **유향(방향) 포함** — this is the one candidate that
  explicitly claims directional current data, not just speed.
- Auth: 공공데이터포털 서비스키 신청 필요(개인/프로젝트 구분), 자동승인.
- License: 공공저작물 출처표시 제1유형. Format: JSON+XML.
- Not confirmed: 좌표 단위(위경도 십진수 여부), spatial resolution(관측점 기반인지 격자 기반인지),
  update frequency(예보 주기), CORS policy for browser calls, whether values are forecast vs
  observation. `TBD_PROVIDER_CONFIRMATION` for all of these.

### 국립해양조사원 격자별 해양정보
- Catalog listing: [해양수산부 국립해양조사원_격자별 해양정보](https://www.data.go.kr/data/15002010/openapi.do)
- Confirmed: parameterized by lat/lon, grid-based.
- Not confirmed: whether the grid carries current direction/speed or only other ocean parameters
  (temperature, salinity, etc. — unclear from catalog listing alone).

### 국립수산과학원 실시간 해양수산환경 관측시스템 (RISA) / 수온정보서비스
- Site: [실시간 해양수산환경 관측시스템](https://www.nifs.go.kr/risa/), [수온정보서비스](https://www.nifs.go.kr/nts/service_outline.do), Open API list: [nifs.go.kr openApi](https://www.nifs.go.kr/openApi/actionOpenapiInfoList.do)
- Confirmed: real-time water temperature (`wtr_tmp`) from monitoring buoys/stations, updated every
  30min–1h, explicitly labeled unquality-controlled ("품질처리가 되지 않은 데이터").
- Not confirmed: whether this system also exposes current speed/direction (search results centered on
  temperature); station coverage vs the KHOA fishing-index point catalog is a different, unrelated set
  of locations, so joining the two would need a separate nearest-station mapping — out of scope for
  v1.4 either way.

## Decision for v1.4

No directional current/water-mass source is connected in this release. Rationale:
- The one candidate that explicitly claims direction (수치조류도 API) has unconfirmed spatial
  resolution, update cadence, and CORS/browser-suitability — connecting it without that contract would
  repeat the same category of mistake this session already found and fixed twice in the KHOA
  integration (unverified response shape, unverified runtime behavior).
- No SpeciesProfile evidence in `species-environment-evidence.md` documents a direction-dependent
  threshold for any of the 6 supported species; even with a working current-direction feed, there is
  nothing yet to compare it against.
- `minCrsp`/`maxCrsp` in the existing KHOA fishing-index response is speed-only (see
  `contracts/official-fishing-index.md`); this v1.4 delta does not reinterpret it as direction, and
  does not use it as a species-suitability input either (§ species-environment-evidence.md "공통
  불확실성").

`MarineCurrentProvider` is declared as a typed boundary (`src/species-guidance/contracts.ts`) with a
single implementation, `NotConnectedMarineCurrentProvider`, that always resolves
`{ status: 'NOT_CONNECTED' }`. The UI states this explicitly ("해류 방향 데이터는 현재 판단에
포함되지 않았습니다") rather than omitting the row silently, so a future direction feed can be added
without a contract change to the detail panel.

## Revisit trigger

Reopen this review only after: (1) the 수치조류도 API's parameter/response contract is verified
against a real authenticated call (same standard applied to KHOA in this session), and (2) at least
one SpeciesProfile in `species-profiles.ts` has a direction-dependent claim backed by a cited source.
Until both hold, do not wire a real `MarineCurrentProvider` implementation.
