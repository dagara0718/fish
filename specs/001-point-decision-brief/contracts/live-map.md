# v1.2 transport and map contract
Worker GET /api/fishing-index accepts only gubun, reqDate (real YYYYMMDD), placeName (1..80 characters), pageNo (1..20), numOfRows (1..300). Duplicate/unknown parameters rejected. serviceKey is never accepted from browser. Fixed HTTPS KHOA path, type=json.
Response v1: {version:1, items: validated official DTO[], totalCount, fetchedAt}. Raw provider messages, unknown fields and secrets never returned. Empty official result normalized to items:[]; malformed format 502; timeout 504; no secret 503; quota 429.
GET /health returns only readiness boolean; no upstream call. CORS only https://dagara0718.github.io and http://localhost:5173 (optional 127.0.0.1 for local browser tests). No-origin requests rejected. Cloudflare rate binding required (fail closed); cached public validated responses exclude key in cache key/body.
OfficialFishingIndexProvider.getOfficialIndex(point, signal?) preserves existing OfficialIndexResult shape with demo boolean. Live catalog uses same validated response and local IDs constructed from official name+coordinates+gubun, not provider-issued IDs.
MapProvider owns map lifecycle/markers/bounds/resize; React owns only plain point objects and transient coordinates. Marker preview never commits selection. UI displays same keyboard-confirmable detail outside map.

