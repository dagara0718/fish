import { expect, test, type Page } from '@playwright/test'

// v1.6.5 — spot brief after a map click or GPS fix (MOCK backends; not evidence of live KHOA data).
const POINTS = [
  { name: '가까운 시연 기준점', lat: 35.06, grades: { 감성돔: '좋음', 참돔: '보통' }, wtem: 22 },
  { name: '중간 시연 기준점', lat: 35.08, grades: { 감성돔: '좋음' }, wtem: 21 },
  { name: '실패 시연 기준점', lat: 35.1, grades: { 감성돔: '나쁨' }, wtem: 20 },
  { name: '먼 시연 기준점', lat: 35.4, grades: { 감성돔: '매우나쁨' }, wtem: 19 },
]
const items = (points = POINTS, slots: [string, string][] = [['20990101', '오전']]) => points.flatMap(p => slots.flatMap(([ymd, noon], index) => Object.entries(p.grades).map(([species, grade]) => ({ seafsPstnNm: p.name, lat: p.lat, lot: 129.05, predcYmd: ymd, predcNoonSeCd: noon, seafsTgfshNm: species, totalIndex: index === 0 ? grade : '보통', minWtem: p.wtem, maxWtem: p.wtem + 0.5 }))))
const marineBody = { result: { data: [{ current_speed: 33, current_dir: 176, obs_date: '2099-01-01 20:00:00', type: '최강낙조류' }], meta: { sch_Stime: 'a', sch_Etime: 'b', lat: '0', lon: '0' } } }

async function setup(page: Page, options: { points?: typeof POINTS; slots?: [string, string][]; delayMs?: number } = {}) {
  // Contract-only NAVER substitute (as in live-map.spec.ts): a map background click yields 35.05/129.05.
  await page.route('https://oapi.map.naver.com/**', route => route.fulfill({ contentType: 'application/javascript', body: `
    window.naver={maps:{
      Map:class { constructor(el){this.el=el;this.isMap=true;el.dataset.mockMap='true'} fitBounds(){} panTo(){} setZoom(){} setSize(){} destroy(){this.el.replaceChildren()} },
      LatLng:class {constructor(lat,lon){this.lat=lat;this.lon=lon}}, LatLngBounds:class {extend(){}}, Size:class {},
      Marker:class {constructor(o){this.el=document.createElement('button');this.el.textContent=o.title;this.el.className='mock-marker';o.map.el.append(this.el)}setMap(){this.el.remove()}},
      Event:{
        addListener(target,event,handler){ const listener=(e)=>{ if(event==='click'&&target.isMap) handler({coord:{lat:()=>35.05,lng:()=>129.05}}); else handler(e) }; target.el.addEventListener(event,listener); return {target,event,listener} },
        removeListener(l){l.target.el.removeEventListener(l.event,l.listener)}
      }
    }}; window.fishNaverReady();` }))
  const perPoint: string[] = []
  const all = items(options.points, options.slots)
  await page.route('https://proxy.example/**', async route => {
    const name = new URL(route.request().url()).searchParams.get('placeName')
    if (name) { perPoint.push(name); if (options.delayMs) await new Promise(resolve => setTimeout(resolve, options.delayMs)) }
    if (name === '실패 시연 기준점') return route.fulfill({ status: 500, json: { error: 'UPSTREAM_ERROR' } }).catch(() => {})
    return route.fulfill({ json: { version: 1, fetchedAt: new Date().toISOString(), totalCount: all.length, items: all } }).catch(() => {})
  })
  const marine: URL[] = []
  await page.route('https://marine.example/**', route => { marine.push(new URL(route.request().url())); return route.fulfill({ json: marineBody }) })
  return { perPoint, marine }
}

async function clickMap(page: Page, isMobile: boolean, position = { x: 250, y: 300 }) {
  await page.goto('./')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  if (isMobile) await page.getByRole('button', { name: '지도', exact: true }).click()
  await expect(page.locator('[data-mock-map]')).toBeVisible()
  await page.locator('[data-mock-map]').click({ position })
}

test('a map click shows the spot brief directly: expected species, nearby official grades and tidal current, without picking a point', async ({ page, isMobile }) => {
  await page.setViewportSize(isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 })
  const { perPoint, marine } = await setup(page)
  await clickMap(page, isMobile)
  const brief = page.locator('.live-brief')
  await expect(brief.getByRole('heading', { name: '이 위치 어종 브리프' })).toBeVisible()
  await expect(brief.getByRole('heading', { name: '환경 기반 예상어종' })).toBeVisible()
  await expect(brief.getByText(/예상 어종의 수온·계절 기준: 가까운 시연 기준점\(1\.1 km\) 공식 예보/)).toBeVisible()
  await expect(brief.getByText(/실측값이나 조과 확률이 아닙니다/)).toBeVisible()
  // Nearby official grades: the 3 points within 15 km, the 38.9 km point excluded, the failed one shown as such.
  expect([...new Set(perPoint)].sort()).toEqual(['가까운 시연 기준점', '실패 시연 기준점', '중간 시연 기준점'].sort())
  const gamseong = brief.locator('.nearby-species li', { hasText: '감성돔' })
  await expect(gamseong).toContainText('좋음 2곳')
  await expect(gamseong).not.toContainText('매우나쁨')
  await expect(brief.locator('.nearby-points')).toContainText('공식 데이터 확인 실패')
  // Tidal current at the clicked location (a map click, not GPS).
  await expect(brief.locator('.marine-section').getByText('33–33 cm/s')).toBeVisible()
  expect(marine[0]!.searchParams.get('lat')).toBe('35.050')
  await expect(brief.getByText(/조류 예측 기준: 지도에서 선택한 위치/)).toBeVisible()
  // No automatic selection and no probability/recommendation wording.
  await expect(page.getByRole('heading', { name: '어종별 공식 바다낚시지수' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '이 포인트 선택' })).toHaveCount(0)
  await expect(brief).not.toContainText(/확률이 높|추천|가능성|최적|잡힙니다/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await brief.scrollIntoViewIfNeeded()
  await page.screenshot({ path: `test-results/screenshots/v1.6.5-${isMobile ? 'mobile' : 'desktop'}-mock-spot-brief.png`, fullPage: true })
  // Picking a point is still possible, via 주변 공식 포인트 직접 보기.
  await brief.getByText(/주변 공식 포인트 직접 보기/).click()
  await brief.getByRole('button', { name: '이 기준 포인트로 확인' }).first().click()
  await expect(page.getByRole('button', { name: '이 포인트 선택' })).toBeVisible()
})

test('the date selector switches every official part of the brief to the chosen forecast slot', async ({ page, isMobile }) => {
  await setup(page, { slots: [['20990101', '오전'], ['20990102', '오후']] })
  await clickMap(page, isMobile)
  const brief = page.locator('.live-brief')
  await expect(brief.locator('.nearby-species li', { hasText: '감성돔' })).toContainText('좋음 2곳')
  await brief.getByLabel('날짜').selectOption('2099-01-02 · 오후')
  await expect(brief.locator('.nearby-species li', { hasText: '감성돔' })).toContainText('보통 2곳')
  await expect(brief.getByText(/공식 예보 · 2099-01-02 · 오후/)).toBeVisible()
})

test('with no official point within 15 km there is no species brief, but the tidal current is still shown', async ({ page, isMobile }) => {
  const { perPoint, marine } = await setup(page, { points: [POINTS[3]!] })
  await clickMap(page, isMobile)
  const brief = page.locator('.live-brief')
  await expect(brief.getByText('지도에서 선택한 위치 15 km 이내에 공식 바다낚시지수 기준 포인트가 없습니다')).toBeVisible()
  await expect(brief.getByRole('heading', { name: '환경 기반 예상어종' })).toHaveCount(0)
  expect(perPoint).toHaveLength(0)
  await expect(brief.locator('.marine-section').getByText('33–33 cm/s')).toBeVisible()
  expect(marine).toHaveLength(1)
})

test('a new map click cancels a pending brief without leaving a loading state', async ({ page, isMobile }) => {
  await setup(page, { delayMs: 1500 })
  await clickMap(page, isMobile)
  await expect(page.getByText('주변 공식 예보를 확인하는 중입니다.')).toBeVisible()
  await page.locator('[data-mock-map]').click({ position: { x: 260, y: 310 } })
  await expect(page.getByText('주변 공식 예보를 확인하는 중입니다.')).toBeVisible()
  await expect(page.locator('.live-brief .nearby-species')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('주변 공식 예보를 확인하는 중입니다.')).toHaveCount(0)
})

test('GPS shows the brief too, and never sends the GPS fix: tidal current uses the nearest official point', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: (success: PositionCallback) => success({ coords: { latitude: 35.05123, longitude: 129.05123 } } as GeolocationPosition) } }))
  const { perPoint, marine } = await setup(page)
  await page.goto('./')
  await page.getByRole('button', { name: /현재 위치 사용/ }).click()
  const brief = page.locator('.live-brief')
  await expect(brief.getByRole('heading', { name: '이 위치 어종 브리프' })).toBeVisible()
  await expect(brief.getByText(/현재 위치 기준/)).toBeVisible()
  await expect(brief.getByRole('heading', { name: '환경 기반 예상어종' })).toBeVisible()
  expect(perPoint.length).toBeGreaterThan(0)
  await expect.poll(() => marine.length).toBe(1)
  expect(marine[0]!.searchParams.get('lat')).toBe('35.060') // nearest official point, not 35.051
  expect(marine[0]!.href).not.toMatch(/35\.051|129\.051/)
  await expect(brief.getByText(/현재 위치 좌표는 전송하지 않습니다/)).toBeVisible()
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0)
})
