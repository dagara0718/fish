import { expect, test, type Page, type Route } from '@playwright/test'

// v1.6.3 — tidal-current forecast panel against mocked backends (sanitized, real-shaped rows).
// These are MOCK screenshots/assertions; they are not evidence of the live KHOA upstream.
const POINTS = [
  { name: '계약 시연 기준점', lat: 35, lot: 129 },
  { name: '두번째 시연 기준점', lat: 35.2, lot: 129.2 },
]
const marineRows = (speed: number) => ({ result: { data: [
  { current_speed: speed, current_dir: 176, obs_date: '2099-01-01 20:00:00', type: '최강낙조류' },
  { current_speed: speed, current_dir: 200, obs_date: '2099-01-01 20:10:00', type: '' },
  { current_speed: speed, current_dir: 273, obs_date: '2099-01-01 22:50:00', type: '전류' },
], meta: { sch_Stime: '2099-01-01 20:00', sch_Etime: '2099-01-01 23:00', lat: '35.000', lon: '129.000' } } })

async function setup(page: Page, marine: (route: Route, url: URL) => Promise<void> | void) {
  await page.route('https://oapi.map.naver.com/**', route => route.fulfill({ contentType: 'application/javascript', body: `
    window.naver={maps:{
      Map:class { constructor(el){this.el=el;this.isMap=true;el.dataset.mockMap='true'} fitBounds(){} panTo(){} setZoom(){} setSize(){} destroy(){this.el.replaceChildren()} },
      LatLng:class {constructor(lat,lon){this.lat=lat;this.lon=lon}}, LatLngBounds:class {extend(){}}, Size:class {},
      Marker:class {constructor(o){this.el=document.createElement('button');this.el.textContent=o.title;this.el.className='mock-marker';o.map.el.append(this.el)}setMap(){this.el.remove()}},
      Event:{ addListener(target,event,handler){ const listener=(e)=>handler(e); target.el.addEventListener(event,listener); return {target,event,listener} }, removeListener(l){l.target.el.removeEventListener(l.event,l.listener)} }
    }}; window.fishNaverReady();` }))
  const indexCalls: string[] = []
  await page.route('https://proxy.example/**', route => {
    indexCalls.push(route.request().url())
    return route.fulfill({ json: { version: 1, fetchedAt: new Date().toISOString(), totalCount: POINTS.length, items: POINTS.map(p => ({ seafsPstnNm: p.name, lat: p.lat, lot: p.lot, predcYmd: '20990101', predcNoonSeCd: '오전', seafsTgfshNm: '계약 시연 어종', totalIndex: '좋음', lastScr: 70, minWtem: 12, maxWtem: 15 })) } })
  })
  const marineCalls: URL[] = []
  await page.route('https://marine.example/**', route => { const url = new URL(route.request().url()); marineCalls.push(url); return marine(route, url) })
  return { indexCalls, marineCalls }
}

async function searchAndSelect(page: Page, name: string) {
  await page.getByRole('button', { name: new RegExp(`${name} 공식 기준 포인트`) }).click()
  await page.getByRole('button', { name: '이 포인트 선택' }).click()
}

test('fetches only after explicit selection, with the official point coordinate (never GPS), and renders a scannable forecast summary', async ({ page, isMobile }) => {
  await page.setViewportSize(isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 })
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: (success: PositionCallback) => success({ coords: { latitude: 35.01234, longitude: 129.01234 } } as GeolocationPosition) } }))
  const { marineCalls } = await setup(page, route => route.fulfill({ json: marineRows(42) }))
  await page.goto('./')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  await expect(page.getByRole('button', { name: /계약 시연 기준점 공식 기준 포인트/ })).toBeVisible()
  await page.getByRole('button', { name: /현재 위치 사용/ }).click()
  await page.getByRole('button', { name: /계약 시연 기준점 공식 기준 포인트/ }).click() // preview only
  await expect(page.getByRole('button', { name: '이 포인트 선택' })).toBeVisible()
  expect(marineCalls).toHaveLength(0)
  await page.getByRole('button', { name: '이 포인트 선택' }).click()
  const panel = page.locator('.marine-section')
  await expect(panel.getByRole('heading', { name: '조류 예측 데이터' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '어종별 공식 바다낚시지수' })).toBeVisible()
  expect(marineCalls).toHaveLength(1)
  expect(marineCalls[0]!.searchParams.get('lat')).toBe('35.000')
  expect(marineCalls[0]!.searchParams.get('lon')).toBe('129.000')
  expect(marineCalls[0]!.href).not.toMatch(/35\.01|129\.01/)
  await expect(panel.getByText('42–42 cm/s')).toBeVisible()
  await expect(panel.getByText('예측 구간 (시간대 미확인)')).toBeVisible()
  await expect(panel.locator('.trust-badge[data-status="UNVERIFIED"]').first()).toBeVisible()
  // Keyboard access to 근거 보기 in a real browser.
  await panel.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(panel.getByRole('table')).toBeVisible()
  await expect(panel.getByRole('cell', { name: '미표기' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await panel.scrollIntoViewIfNeeded()
  await page.screenshot({ path: `test-results/screenshots/v1.6.3-${isMobile ? 'mobile' : 'desktop'}-mock-marine.png`, fullPage: true })
})

test('marine failure keeps the official index visible and retries only the marine request', async ({ page }) => {
  let fail = true
  const { indexCalls, marineCalls } = await setup(page, route => fail ? route.fulfill({ status: 500, json: { error: 'UPSTREAM_ERROR' } }) : route.fulfill({ json: marineRows(7) }))
  await page.goto('./'); await page.getByRole('button', { name: '검색', exact: true }).click()
  await searchAndSelect(page, '계약 시연 기준점')
  await expect(page.getByText('조류 예측 데이터를 확인하지 못했습니다', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '어종별 공식 바다낚시지수' })).toBeVisible()
  await expect(page.getByText('계약 시연 어종', { exact: true }).first()).toBeVisible()
  await expect(page.locator('.marine-section')).not.toContainText(/UPSTREAM_ERROR|500|https?:/)
  const indexBefore = indexCalls.length; const marineBefore = marineCalls.length
  fail = false
  await page.getByRole('button', { name: '조류 데이터만 다시 조회' }).click()
  await expect(page.locator('.marine-section').getByText('7–7 cm/s')).toBeVisible()
  expect(indexCalls.length).toBe(indexBefore)
  expect(marineCalls.length).toBe(marineBefore + 1)
})

test('not configured (proxy 503) is shown as a finite state, not a hidden panel', async ({ page }) => {
  await setup(page, route => route.fulfill({ status: 503, json: { error: 'NOT_CONFIGURED' } }))
  await page.goto('./'); await page.getByRole('button', { name: '검색', exact: true }).click()
  await searchAndSelect(page, '계약 시연 기준점')
  await expect(page.getByText('조류 예측 데이터 연결이 설정되지 않았습니다')).toBeVisible()
  await expect(page.getByRole('heading', { name: '어종별 공식 바다낚시지수' })).toBeVisible()
})

test('loading is independent, and a late response for a previous point never overwrites the new point', async ({ page }) => {
  const { marineCalls } = await setup(page, async (route, url) => {
    if (url.searchParams.get('lat') === '35.000') { await new Promise(resolve => setTimeout(resolve, 2500)); return route.fulfill({ json: marineRows(11) }).catch(() => {}) }
    return route.fulfill({ json: marineRows(99) })
  })
  await page.goto('./'); await page.getByRole('button', { name: '검색', exact: true }).click()
  await searchAndSelect(page, '계약 시연 기준점')
  // Official index resolved while the marine request is still pending.
  await expect(page.getByRole('heading', { name: '어종별 공식 바다낚시지수' })).toBeVisible()
  await expect(page.locator('.marine-section [role="status"]')).toHaveText('조류 예측 데이터를 확인하는 중입니다.')
  await searchAndSelect(page, '두번째 시연 기준점')
  await expect(page.locator('.marine-section').getByText('99–99 cm/s')).toBeVisible()
  await page.waitForTimeout(3000) // let the superseded 35.000 response land
  await expect(page.locator('.marine-section').getByText('99–99 cm/s')).toBeVisible()
  await expect(page.locator('.marine-section').getByText('11–11 cm/s')).toHaveCount(0)
  await expect(page.locator('.marine-section [role="status"]')).toHaveCount(0)
  expect(marineCalls.map(url => url.searchParams.get('lat'))).toEqual(['35.000', '35.200'])
})

test('a new search cancels a pending marine request without leaving a loading state', async ({ page }) => {
  await setup(page, async route => { await new Promise(resolve => setTimeout(resolve, 2000)); return route.fulfill({ json: marineRows(5) }).catch(() => {}) })
  await page.goto('./'); await page.getByRole('button', { name: '검색', exact: true }).click()
  await searchAndSelect(page, '계약 시연 기준점')
  await expect(page.locator('.marine-section [role="status"]')).toBeVisible()
  await page.getByRole('button', { name: '검색', exact: true }).click()
  await page.waitForTimeout(2500)
  await expect(page.locator('.marine-section')).toHaveCount(0)
  await searchAndSelect(page, '두번째 시연 기준점')
  await expect(page.locator('.marine-section [role="status"]')).toBeVisible()
  await expect(page.locator('.marine-section').getByText('5–5 cm/s')).toBeVisible()
})

test('proxy 422 NO_DATA_FOR_LOCATION is shown as an unsupported area, not a failure, without retry', async ({ page }) => {
  const { marineCalls } = await setup(page, route => route.fulfill({ status: 422, json: { error: 'NO_DATA_FOR_LOCATION' } }))
  await page.goto('./'); await page.getByRole('button', { name: '검색', exact: true }).click()
  await searchAndSelect(page, '계약 시연 기준점')
  await expect(page.getByText('이 위치는 조류 예측 제공 범위가 아닙니다')).toBeVisible()
  await expect(page.getByText('조류 예측 데이터를 확인하지 못했습니다', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '조류 데이터만 다시 조회' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '어종별 공식 바다낚시지수' })).toBeVisible()
  expect(marineCalls).toHaveLength(1)
})
