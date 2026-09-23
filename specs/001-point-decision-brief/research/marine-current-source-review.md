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

### 국립해양조사원 수치조류도 지점별 최강창낙조 (Numerical tidal-current chart, peak flood/ebb by point) — CONTRACT VERIFIED 2026-09-17

The data.go.kr catalog listing (`https://www.data.go.kr/data/15039013/openapi.do`) is a **LINK-type**
entry — 공간범위/시간범위 both blank, no Swagger/parameter table rendered there (confirmed by loading
the page in a real browser and reading the rendered DOM, not just a static fetch). Its "바로가기"
button redirects to KHOA's own portal, which is where the real, complete contract lives:

- **Portal**: 바다누리 해양정보 서비스 (khoa.go.kr), 오픈API 목록, "수치조류도 지점별 최강창낙조"
  (`https://www.khoa.go.kr/oceandata/openapi/openApiDetail.do?id=18`)
- **Endpoint**: `https://khoa.go.kr/oceandata/api/tidalCurrentPoint/search.do` (REST, GET, JSON/XML)
- **Description (official, verbatim)**: "수치조류도 예측 유향,유속을 검색한날짜 및 영역에 해당되는
  데이터를 10분단위로 조회한다. 입력 지점에서 가장 가까운 지점(최대 1km)의 10분단위 최강창낙조
  데이터를 기반으로 계산된 데이터를 제공합니다." — this settles three open questions at once:
  **PREDICTED** (예측), nearest-point matching **within 1km max**, 10-minute resolution.
- **Request parameters**: `ServiceKey`, `SDate`/`SHour`(00-23)/`SMinute`(00-59), `EDate`/`EHour`/
  `EMinute`, `lon`, `lat` (decimal degree, sample `126.5`/`36`), `ResultType`(`json`|`xml`).
- **Response fields**: `sch_Stime`/`sch_Etime` (echoed range), `lon`/`lat` (echoed), `obs_last_req_cnt`
  ("남은요청수/할당요청수" — e.g. `"800/20000"`, i.e. the response itself reports remaining daily
  quota), `obs_date` (예측일시, `YYYY-MM-DD HH:mm:ss`), `type` (조류종류: `전류`=general/instantaneous
  current, `최강창조류`=peak flood current, `최강낙조류`=peak ebb current), `current_speed`
  (**cm/s**, confirmed unit), `current_dir` (**deg**, confirmed unit; sample values `128.06`/`40`/
  `321` — 0-360 range consistent with compass bearing, but the page does **not** state whether this
  is "flowing toward" or "flowing from" — direction convention stays UNKNOWN pending a stronger
  citation, per §11 of the v1.6 prompt).
- **Auth is a SEPARATE key system from `KHOA_FISHING_SERVICE_KEY`**: 바다누리's own "인증키발급/관리"
  flow requires a khoa.go.kr account, a written 사용목적/서비스/사용기관/사용URL application, and terms
  agreement — it is not a 공공데이터포털 general service key. Quota shown on the key-request page:
  1년 사용기간, 하루 최대 10,000건 (differs from the `20000` seen in the sample response — quota tier
  may vary by application). **Do not assume `KHOA_FISHING_SERVICE_KEY` works here** — a distinct
  secret (`KHOA_MARINE_SERVICE_KEY` or equivalent) requires the user's own registration.
- License: 공공저작물 출처표시 제1유형, 무료, 자동승인(개발/운영 단계 모두).
- CORS: not stated on either page; must be assumed unverified until an authenticated browser/Worker
  call is actually made — same standard already applied twice to KHOA fishing-index in this project.

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

## Decision for v1.4 (superseded by v1.6, see below)

No directional current/water-mass source was connected in v1.4. `MarineCurrentProvider` shipped as a
typed boundary with a single implementation, `NotConnectedMarineCurrentProvider`, always resolving
`{ status: 'NOT_CONNECTED' }`.

## v1.6 decision: contract verified, blocked on the user's own key (not on the contract)

Unlike the v1.4 pass, the 수치조류도 지점별 최강창낙조 contract is now **fully verified** against
KHOA's own portal (not a search-engine summary) — endpoint, every request parameter, every response
field, units, and the observation/forecast distinction are all confirmed above. This clears the v1.4
blocker ("unconfirmed spatial resolution, update cadence"): resolution is 10-minute, nearest-point
matching is bounded to 1km, and values are explicitly predicted (예측), not observed.

What remains genuinely unconfirmed and is **not guessed**:
- **Direction convention** ("flowing toward" vs "flowing from", true-north vs magnetic) — the KHOA
  page states the unit (deg) but not the convention. `MarineCurrentObservation.directionConvention`
  stays `'UNKNOWN'` until a stronger citation is found; the UI must never label a bearing as if the
  convention were confirmed.
- **CORS** for a direct browser call — untested; the Worker route added in v1.6 proxies it the same
  way `/api/fishing-index` already does, so this is moot for the shipped implementation regardless.
- **SpeciesProfile evidence**: a second targeted search this pass (참돔 조류 유속) found only the same
  qualitative "조류가 좋은 곳" habitat description already in `species-profiles.ts` — no numeric
  current-speed/direction threshold for any of the 6 supported species. `CURRENT_SPEED` and
  `CURRENT_DIRECTION` factors therefore stay `UNKNOWN` for every species even once real data flows —
  this is unchanged from v1.5 and is not a defect (§33/34 of the v1.6 prompt).

**What blocks going live is exclusively the credential**: 바다누리's key-issuance system is separate
from `KHOA_FISHING_SERVICE_KEY` and requires the user's own khoa.go.kr account and a written
application (사용목적/서비스/사용기관/사용URL) — see the contract section above. No account or key was
created or guessed. `KhoaTidalCurrentProvider` and the Worker's `/api/marine-current` route are
implemented and tested end-to-end against the verified contract (sanitized fixtures matching KHOA's
own published sample data), gated behind `KHOA_MARINE_SERVICE_KEY`; without that secret set, the route
returns the same `NOT_CONFIGURED` response the fishing-index route already used before its own key was
registered — a precedent, not a new pattern.

## Revisit trigger

Reopen only to: (1) find a citable direction-convention source, or (2) find species-level current
evidence strong enough to activate a guidance factor. The contract itself does not need re-verification
unless KHOA changes it.

## v1.6.3 addendum (2026-09-24)

- **Time basis — still TBD.** Re-checked KHOA's API page (rendered in a real browser) and the
  data.go.kr listing `15039013`: neither states whether `SDate/SHour/SMinute` or `obs_date` are KST or
  UTC. A live call cannot settle it (windows at UTC-now and KST-now both return rows). Not guessed; see
  `v1.6.3-product-delta.md` REQ-FUNC-MARINE-UI-005 for how the client copes. Settling it needs an
  authoritative KHOA statement, or a cross-check of this API's labeled peak/turn times against a
  KHOA-published KST 조류표 for the same location.
- **`전류` correction.** The contract section above glosses `전류` as "general/instantaneous current".
  Live rows show `전류` at ~2 cm/s between a 최강낙조류 and a 최강창조류, consistent with 전류(轉流),
  the turn of the tidal current. Enum renamed `SLACK`; UI shows KHOA's label verbatim.
- **`type` mostly empty**: 58/61 rows in a 10 h window had `type: ""`; only event rows are labeled.
- **Numeric fields**: via the proxy, `current_speed`/`current_dir` arrive as numbers.
- **Out-of-coverage**: an inland coordinate yields proxy `502 MALFORMED_RESPONSE` (not an empty list).
