import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Contract-only SDK substitute, not evidence of authenticated NAVER rendering. The map's own
  // 'click' listener is distinguished from a marker's 'click' listener by an `isMap` flag, and
  // synthesizes NAVER's real `{coord: {lat(), lng()}}` payload — marker clicks stay raw DOM events
  // so the provider's own stopPropagation/time-guard disambiguation is exercised faithfully.
  await page.route('https://oapi.map.naver.com/**', route => route.fulfill({ contentType: 'application/javascript', body: `
    window.naver={maps:{
      Map:class { constructor(el){this.el=el;this.isMap=true;el.dataset.mockMap='true';} fitBounds(){this.el.dataset.bounds='fit'} panTo(){} setZoom(){} setSize(){} destroy(){this.el.replaceChildren()} },
      LatLng:class {constructor(lat,lon){this.lat=lat;this.lon=lon}}, LatLngBounds:class {extend(){}}, Size:class {},
      Marker:class {constructor(o){this.el=document.createElement('button');this.el.textContent=o.title;this.el.className='mock-marker';o.map.el.append(this.el)}setMap(){this.el.remove()}},
      Event:{
        addListener(target,event,handler){
          const listener = (domEvent) => { if (event==='click' && target.isMap) handler({coord:{lat:()=>35.05,lng:()=>129.05}}); else handler(domEvent) }
          target.el.addEventListener(event,listener); return {target,event,listener}
        },
        removeListener(l){l.target.el.removeEventListener(l.event,l.listener)}
      }
    }}; window.fishNaverReady();` }))
  await page.route('https://proxy.example/**', route => route.fulfill({ json: { version: 1, fetchedAt: new Date().toISOString(), totalCount: 2, items: [
    { seafsPstnNm: '계약 시연 기준점', lat: 35, lot: 129, predcYmd: '20990101', predcNoonSeCd: '오전', seafsTgfshNm: '계약 시연 어종', totalIndex: '좋음', lastScr: 70, minWtem: 12, maxWtem: 15 },
    { seafsPstnNm: '계약 시연 기준점', lat: 35, lot: 129, predcYmd: '20990101', predcNoonSeCd: '오전', seafsTgfshNm: '다른 시연 어종', totalIndex: '보통', lastScr: 40 }
  ] } }))
})

test('live map preview requires confirmation, GPS stays transient, responsive layout', async ({ page, isMobile }) => {
  await page.setViewportSize(isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 })
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: (success: PositionCallback) => success({ coords: { latitude: 35.01, longitude: 129.01 } } as GeolocationPosition) } }))
  await page.goto('./')
  await page.getByLabel('포인트명 또는 지역 검색').fill('계약')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  await expect(page.getByRole('button', { name: /계약 시연 기준점 공식 기준 포인트/ })).toBeVisible()
  await page.getByRole('button', { name: /현재 위치 사용/ }).click()
  if (isMobile) await page.getByRole('button', { name: '지도', exact: true }).click()
  await expect(page.getByRole('button', { name: '◎ 현재 위치' })).toBeVisible()
  await expect(page.locator('[data-mock-map]')).toHaveAttribute('data-bounds', 'fit')
  await page.getByRole('button', { name: '● 공식 기준 · 계약 시연 기준점' }).click()
  await expect(page.getByRole('heading', { name: '어종별 공식 바다낚시지수' })).toHaveCount(0)
  await page.screenshot({ path: `test-results/screenshots/v1.2-${isMobile ? 'mobile' : 'desktop'}-mock-discovery.png`, fullPage: true })
  await page.getByRole('button', { name: '이 포인트 선택' }).click()
  await expect(page.getByRole('heading', { name: '어종별 공식 바다낚시지수' })).toBeVisible()
  await expect(page.getByRole('button', { name: '◆ 선택 · 계약 시연 기준점' })).toBeVisible()
  await expect(page.getByText('계약 시연 어종', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
  expect(page.url()).not.toContain('35.01')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `test-results/screenshots/v1.2-${isMobile ? 'mobile' : 'desktop'}-mock-brief.png`, fullPage: true })
})

test('Live proxy failure never displays demo fallback', async ({ page }) => {
  await page.route('https://proxy.example/**', route => route.fulfill({ status: 503, json: { error: 'NOT_CONFIGURED' } }))
  await page.goto('./'); await page.getByRole('button', { name: '검색', exact: true }).click()
  await expect(page.getByText(/공식 후보 목록을 불러오지 못했습니다/)).toBeVisible()
  await expect(page.getByText('DEMO DATA')).toHaveCount(0)
})

test('arbitrary map click surfaces nearest official candidates without auto-selecting or calling the index API', async ({ page, isMobile }) => {
  const indexCalls: string[] = []
  await page.route('https://proxy.example/**', route => { indexCalls.push(route.request().url()); route.fallback() })
  await page.setViewportSize(isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 })
  await page.goto('./')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  if (isMobile) await page.getByRole('button', { name: '지도', exact: true }).click()
  await expect(page.getByRole('button', { name: '● 공식 기준 · 계약 시연 기준점' })).toBeVisible()
  // Position is relative to the map element's own box; the single marker sits near its top-left
  // corner, so a bottom-right offset lands on empty map background instead.
  await page.locator('[data-mock-map]').click({ position: { x: 250, y: 300 } })
  await expect(page.getByRole('heading', { name: '선택 위치' })).toBeVisible()
  await expect(page.getByText('공식 바다낚시지수 기준 포인트가 아닙니다.')).toBeVisible()
  await expect(page.getByRole('heading', { name: '가장 가까운 공식 기준 포인트' })).toBeVisible()
  await expect(page.getByRole('button', { name: '× 선택 위치' })).toBeVisible()
  await expect(page.getByRole('button', { name: '이 기준 포인트로 확인' })).toBeVisible()
  await expect(page.getByText(/km/)).toBeVisible()
  await page.screenshot({ path: `test-results/screenshots/v1.3-${isMobile ? 'mobile' : 'desktop'}-arbitrary-click.png`, fullPage: true })
  // The catalog listing (search) has no placeName; only a confirmed per-point selection adds one.
  const perPointCalls = () => indexCalls.filter(url => url.includes('placeName=')).length
  expect(perPointCalls()).toBe(0)
  await expect(page.getByRole('heading', { name: '어종별 공식 바다낚시지수' })).toHaveCount(0)
  await page.getByRole('button', { name: '이 기준 포인트로 확인' }).click()
  await expect(page.getByRole('button', { name: '이 포인트 선택' })).toBeVisible()
  expect(perPointCalls()).toBe(0)
  await page.getByRole('button', { name: '이 포인트 선택' }).click()
  await expect(page.getByRole('heading', { name: '어종별 공식 바다낚시지수' })).toBeVisible()
  expect(perPointCalls()).toBeGreaterThan(0)
})

test('marker click does not also register as a background arbitrary-location click', async ({ page, isMobile }) => {
  await page.goto('./')
  await page.getByLabel('포인트명 또는 지역 검색').fill('계약')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  if (isMobile) await page.getByRole('button', { name: '지도', exact: true }).click()
  await page.getByRole('button', { name: '● 공식 기준 · 계약 시연 기준점' }).click()
  await expect(page.getByRole('heading', { name: '계약 시연 기준점' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '선택 위치' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '× 선택 위치' })).toHaveCount(0)
})

test('a selected point never shows fishing access as allowed without a connected evidence source', async ({ page, isMobile }) => {
  await page.goto('./')
  await page.getByLabel('포인트명 또는 지역 검색').fill('계약')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  if (isMobile) await page.getByRole('button', { name: '지도', exact: true }).click()
  await page.getByRole('button', { name: '● 공식 기준 · 계약 시연 기준점' }).click()
  await page.getByRole('button', { name: '이 포인트 선택' }).click()
  const accessSection = page.locator('.access-status-section')
  await expect(accessSection.getByRole('heading', { name: '낚시 이용 상태' })).toBeVisible()
  await expect(accessSection.getByText('확인 필요')).toBeVisible()
  await expect(accessSection.getByText(/낚시 금지·통제 여부를 확정할 수 없습니다/)).toBeVisible()
  await expect(page.getByText(/낚시 가능|문제없음/)).toHaveCount(0)
})
