# Official Fishing Index Contract v1.1

## Verified provider contract

Official catalog: `https://www.data.go.kr/data/15142486/openapi.do`  
Operation: `GET https://apis.data.go.kr/1192136/fcstFishingv2/GetFcstFishingApiServicev2`

Request query:

- `serviceKey` required, public-data portal authentication key
- `type` required, `json` or `xml`
- `gubun` required, `갯바위` or `선상`
- `reqDate` optional request date/time (official example uses `yyyyMMdd`)
- `pageNo` optional, default 1
- `numOfRows` optional, default 10, maximum 300
- `include`, `exclude`, `placeName` optional

Response item fields verified in the official Swagger:

`totalIndex`, `lastScr`, `seafsPstnNm`, `lat`, `lot`, `predcYmd`, `predcNoonSeCd`,
`seafsTgfshNm`, `tdlvHrScr`, `minWvhgt`, `maxWvhgt`, `minWtem`, `maxWtem`,
`minArtmp`, `maxArtmp`, `minCrsp`, `maxCrsp`, `minWspd`, `maxWspd`, `tdlvHrCn`.

The description states a seven-day forecast. The schema exposes no stable official point ID; v1.1 therefore
uses a service-owned catalog ID mapped to the official `seafsPstnNm` and coordinates, and always presents both.
Update frequency is not stated in the catalog and remains `TBD_PROVIDER_CONFIRMATION`.

## Errors and operation

Provider result codes include success plus data absent `03`, invalid parameter `10`, missing required
parameter `11`, other `99`; portal gateway errors also include application `01`, HTTP `04`, timeout `05`,
authentication and quota errors. Development traffic is 10,000 calls; operating traffic requires review.
License is 공공저작물 출처표시 제1유형 and the service is free.

## Security and browser boundary

An OPTIONS/invalid-key probe on 2026-09-16 returned CORS permission for
`https://dagara0718.github.io`, but authentication remains a required query key. CORS permission does not make
the key public-safe. The Pages client MUST NOT call this operation with a real key. Live mode requires:

`GitHub Pages -> approved same-purpose server-side proxy -> official operation`

The proxy owns the secret, request allowlist, response schema validation, timeout, quota protection and
license attribution. Provider selection is TBD pending account/operations approval.

## Application port

```ts
type AssessmentType = 'OFFICIAL_FISHING_INDEX' | 'ENVIRONMENT_BASED_GUIDANCE'

interface OfficialFishingIndexProvider {
  getOfficialIndex(point: OfficialFishingPointRef): Promise<OfficialIndexResult>
}
```

Only `OFFICIAL_FISHING_INDEX` may be emitted in v1.1. Results are success, partial, stale-cache,
collection-failed, unsupported-point, or malformed. Official grade/score never determines TrustStatus.

## GPS mapping contract

Geolocation starts only after a user presses “현재 위치 사용”. Raw coordinates are held in component memory
only long enough to compute Haversine distance against the demo/approved catalog; they are not persisted,
placed in URLs, events, analytics or error text. Candidate output contains official point identity, mapping
method `DISTANCE_CANDIDATE`, distance and `userConfirmed: false`. No candidate is auto-selected.


## Real-response correction (confirmed 2026-09-16)

Verified against a live authenticated call, not documentation guesswork:

- `predcYmd` in the real response is `YYYY-MM-DD` (e.g. `2026-09-16`), not the `YYYYMMDD` the request's
  `reqDate` uses. `shared/fishing-api.ts` accepts both on the response side and normalizes to
  `YYYYMMDD` internally so every date comparison stays a same-format string compare; the request-side
  `reqDate` validator stays strict `YYYYMMDD` only. Display reformats the canonical value back to
  `YYYY-MM-DD` for readability.
- `lastScr` is absent on real items (confirmed across a full 300-row page, 6+ species per point, 2
  time periods). It is not part of the SUCCESS/PARTIAL determination; `officialScore` in the UI is
  omitted whenever the field is absent, never shown as `0`.
- Real species observed for 가거도 on 2026-09-16: 감성돔, 기타어종, 농어, 돌돔, 우럭, 참돔.
- The Worker's outbound `fetch` must use `redirect: 'manual'`. The Workers runtime throws a
  `TypeError` on `redirect: 'error'` (a valid `fetch()` value in browsers/Node, unsupported at the
  edge); `'manual'` returns any 3xx as a non-`ok` response, which the existing `!response.ok` guard
  already rejects, preserving the original "never silently follow a redirect" intent.
- The Worker's default `deps.fetch` must be a bound wrapper (`(input, init) => globalThis.fetch(input,
  init)`), not a bare `fetch` reference — the same "Illegal invocation" class of bug fixed earlier in
  `LiveOfficialFishingIndexProvider`, here on the server side. A bare reference throws when invoked as
  `deps.fetch(...)` because the receiver becomes `deps`, not the global.
