# Official index proxy

설정은 루트 LIVE_API_SETUP.md를 따릅니다. 고정 KHOA upstream만 요청합니다.
`npm ci`, `npm test`, `npm run typecheck`, `npm run deploy`.
키는 `npx wrangler secret put KHOA_FISHING_SERVICE_KEY`로만 등록합니다.
`GET /health`는 허용 Origin 헤더가 있어야 합니다. readiness는 실제 upstream 인증 성공을 보장하지 않습니다.
