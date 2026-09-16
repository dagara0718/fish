# 06 — GitHub Pages Publish

> 교재의 build/deploy 단계에 프로젝트별 GitHub Pages 배포 절차를 추가한다.

## 1. Vite Project Pages 설정

Repository가 `dagara0718/fish`이므로 production base path는 `/fish/`를 사용한다.

Vite 설정에서 Pages build가 `/fish/` 아래 asset 경로를 생성하는지 확인한다.

로컬 개발 경험을 불필요하게 깨지 않게 구현한다.

## 2. GitHub Actions Pages workflow

기존 Pages workflow가 없다면 `.github/workflows/deploy-pages.yml`을 최소 구성으로 생성한다.

요구사항:
- `main` push에 배포
- checkout
- Node setup
- dependency install (`npm ci`, lockfile 존재 전제)
- `npm run build`
- Pages artifact upload
- Pages deploy
- GitHub Pages 권장 permissions/환경 사용

불필요한 별도 hosting provider를 추가하지 않는다.

## 3. 재검증

workflow 추가 후 다시:

```bash
npm run lint
npm run test
npm run build
```

모두 통과해야 한다.

## 4. Git commit / push

변경 목록을 검토하고 사용자 파일을 포함한 의도치 않은 변경이 없는지 확인한다.

정상 시 commit 예시:

`feat: implement fixture fishing decision brief and pages deploy`

그 후 `main`에 일반 push한다. force push 금지.

## 5. 배포 확인

목표 URL:

`https://dagara0718.github.io/fish/`

가능한 범위에서 GitHub Actions run과 Pages publish 결과를 확인한다.

사이트에서 최소한 다음을 확인한다.
- 페이지가 404가 아닌가
- JS/CSS asset이 `/fish/` 경로에서 정상 로드되는가
- 검색 fixture UI가 보이는가
- candidate 선택 후 brief가 보이는가
- 새로고침/직접접속에서 정적 SPA 구조가 깨지지 않는가
- 모바일 viewport에서 핵심 UI가 깨지지 않는가

GitHub Pages가 repository Settings에서 수동 활성화/Source 선택을 요구하면 자동 성공으로 보고하지 말고:

`PAGES_MANUAL_ACTION_REQUIRED`

로 종료하며 필요한 최소 UI 단계만 적는다.

배포가 확인되면 `07_FINAL_CONVERGE.md`로 이동한다.
