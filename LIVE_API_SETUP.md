# Live 지도·공식 지수 설정

사용자가 준비할 값

1. NAVER Maps Client ID / ncpKeyId (웹에서 보이는 공개 식별자)
2. 공공데이터포털 일반 인증키 (서버 전용 비밀값)

키를 소스 코드·채팅·커밋에 붙여 넣지 마세요. Cloudflare 계정 로그인과 Worker 배포, 배포 URL 등록도 최초 한 번 필요합니다. 두 키 입력만으로 계정 설정까지 자동 완료되는 것은 아닙니다.

## NAVER

1. NAVER Cloud Platform 로그인 → Maps Application 생성.
2. Web Dynamic Map 활성화 → Client ID 확인. Client Secret은 사용하지 않습니다.
3. Web 서비스 URL에 배포 도메인 dagara0718.github.io와 개발 도메인 localhost를 등록합니다. `/fish/`는 Application URL이 아닙니다.
4. 콘솔이 http 형식을 요구하는 경우 `http://dagara0718.github.io`, `http://localhost` 형식을 사용합니다. 서비스 실제 origin은 `https://dagara0718.github.io`입니다. 콘솔 가이드 접근이 403이어서 현재 protocol/port 정규화 규칙은 콘솔 안내로 최종 확인해야 합니다.
5. GitHub 저장소 Settings → Secrets and variables → Actions → Repository secret `NAVER_MAP_NCP_KEY_ID` 등록.

공식 SDK: https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html
SDK는 ncpKeyId를 사용합니다. Client Secret이나 공공데이터 키를 VITE 변수에 넣지 않습니다.

## Cloudflare Worker

Windows에서는 모든 설치·캐시를 E 드라이브로 지정합니다.

```powershell
cd E:\Users\keun0\Desktop\fish
$env:npm_config_cache='E:\Users\keun0\Desktop\fish\.cache\npm'
$env:TEMP='E:\Users\keun0\Desktop\fish\.tmp'
$env:TMP=$env:TEMP
$env:XDG_CONFIG_HOME='E:\Users\keun0\Desktop\fish\.cache\config'
cd worker
npm ci
npx wrangler login
npm run deploy
npx wrangler secret put KHOA_FISHING_SERVICE_KEY
```

마지막 명령의 프롬프트에 공공데이터 일반 인증키의 **디코딩된 값**을 붙여 넣습니다. URLSearchParams가 한 번 인코딩하므로 이미 URL 인코딩된 문자열을 다시 넣지 마세요. 키 승인 및 해당 API 활용신청은 공공데이터포털에서 완료되어 있어야 합니다.

Worker의 공개 URL(예: https://fish-official-index.계정.workers.dev)을 GitHub Actions Repository **Variable** `FISHING_API_BASE_URL`에 입력합니다. 이는 키가 아닌 배포 주소입니다.
Actions → Deploy GitHub Pages → Run workflow를 실행합니다.

Worker는 고정 upstream, 파라미터 allowlist, 10초 timeout, 응답 schema, origin allowlist, rate-limit binding을 사용합니다. 바인딩/키가 없으면 fail-closed입니다. 30회/분 제한은 Cloudflare location 단위 보호이며 전 세계 일일 쿼터 보장이 아닙니다. Cloudflare 대시보드에서 사용량·비용 알림/제한을 추가로 관리하세요. CORS는 인증 수단이 아니며 공개 proxy입니다. 앱은 GPS 좌표를 proxy에 전달하지 않습니다.

공식 문서: https://www.data.go.kr/data/15142486/openapi.do
공식 단위/갱신 주기 미확인 항목은 TBD입니다. 날짜가 지난 예보는 STALE, 나머지는 검증정책 확정 전 UNVERIFIED이며 공식 점수로 CONFIRMED 승격하지 않습니다.

## 로컬

`.env.example`을 `.env.local`로 복사 후 다음 공개 설정만 입력합니다.

```dotenv
VITE_NAVER_MAP_NCP_KEY_ID=공개_Client_ID
VITE_FISHING_API_BASE_URL=https://배포한-worker.workers.dev
```

KHOA 키는 frontend env에 넣지 않습니다. 로컬 Worker 테스트만 필요하면 worker/.dev.vars에 서버 키를 저장할 수 있습니다(추적 제외). 실제 값은 출력하거나 커밋하지 마세요.

```powershell
npm run build
npm run live:check
```

검사는 키 값을 출력하지 않습니다. health 성공은 설정 존재 확인이며 NAVER 인증이나 실제 KHOA 조회 성공의 대체 증거가 아닙니다. 브라우저에서 지도, 검색→후보→명시적 선택→공식 지수를 확인하세요. Live 실패 시 Demo로 자동 대체하지 않습니다. Demo는 사용자가 직접 선택해야 합니다.

배포 주소: https://dagara0718.github.io/fish/

## 조류 예측 (v1.6.3)

조류 예측은 바다낚시지수 Worker와 **별도 backend**(Vercel marine proxy)를 사용합니다.

- GitHub Actions Repository **Variable** `MARINE_API_BASE_URL` = `https://marine-proxy-nu.vercel.app` (키가 아닌 공개 주소). 빌드 시 `VITE_MARINE_API_BASE_URL`로 주입됩니다. 로컬은 `.env.local`의 `VITE_MARINE_API_BASE_URL`.
- `KHOA_MARINE_SERVICE_KEY`는 Vercel 서버 환경변수에만 둡니다. 바다누리(khoa.go.kr) 별도 발급 키이며 공공데이터포털 바다낚시지수 키와 같다고 가정하지 않습니다. frontend env에 넣지 않습니다.
- 미설정이면 패널은 "조류 예측 데이터 연결이 설정되지 않았습니다"를 표시합니다(Demo 대체 없음).
- 제공기관은 예측일시의 시간대(KST/UTC)를 명시하지 않습니다(TBD). 앱은 두 해석 모두 현재 시각을 포함하는 구간을 조회하고, 특정 행을 "현재"로 표시하지 않습니다.
- `/api/health`의 `marineReady: true`는 키 설정 여부일 뿐 실제 KHOA 조회 성공의 증거가 아닙니다.
