import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Contract-only SDK substitute, not evidence of authenticated NAVER rendering.
  await page.route('https://oapi.map.naver.com/**', route => route.fulfill({ contentType: 'application/javascript', body: `
    window.naver={maps:{
      Map:class { constructor(el){this.el=el;el.dataset.mockMap='true';} fitBounds(){this.el.dataset.bounds='fit'} panTo(){} setZoom(){} setSize(){} destroy(){this.el.replaceChildren()} },
      LatLng:class {constructor(lat,lon){this.lat=lat;this.lon=lon}}, LatLngBounds:class {extend(){}}, Size:class {},
      Marker:class {constructor(o){this.el=document.createElement('button');this.el.textContent=o.title;this.el.className='mock-marker';o.map.el.append(this.el)}setMap(){this.el.remove()}},
      Event:{addListener(target,event,handler){target.el.addEventListener(event,handler);return {target,event,handler}},removeListener(l){l.target.el.removeEventListener(l.event,l.handler)}}
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
