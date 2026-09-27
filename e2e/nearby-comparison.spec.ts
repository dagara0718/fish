import { expect, test } from '@playwright/test'

// v1.6.4 — nearby official-point comparison after an arbitrary map click (MOCK backends).
const POINTS = [
  { name: '가까운 시연 기준점', lat: 35.06, grades: { 감성돔: '좋음', 참돔: '보통' } },
  { name: '중간 시연 기준점', lat: 35.08, grades: { 감성돔: '좋음' } },
  { name: '실패 시연 기준점', lat: 35.1, grades: { 감성돔: '나쁨' } },
  { name: '먼 시연 기준점', lat: 35.4, grades: { 감성돔: '매우나쁨' } },
]

test.beforeEach(async ({ page }) => {
  // Same contract-only NAVER substitute as live-map.spec.ts: a map background click yields 35.05/129.05.
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
})

test('compares the nearest 3 official points only on request, never as a value or probability for the clicked location', async ({ page, isMobile }) => {
  await page.setViewportSize(isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 })
  const perPoint: string[] = []
  await page.route('https://proxy.example/**', route => {
    const name = new URL(route.request().url()).searchParams.get('placeName')
    if (name) perPoint.push(name)
    if (name === '실패 시연 기준점') return route.fulfill({ status: 500, json: { error: 'UPSTREAM_ERROR' } })
    return route.fulfill({ json: { version: 1, fetchedAt: new Date().toISOString(), totalCount: 8, items: POINTS.flatMap(p => Object.entries(p.grades).map(([species, grade]) => ({ seafsPstnNm: p.name, lat: p.lat, lot: 129.05, predcYmd: '20990101', predcNoonSeCd: '오전', seafsTgfshNm: species, totalIndex: grade }))) } })
  })
  await page.goto('./')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  if (isMobile) await page.getByRole('button', { name: '지도', exact: true }).click()
  await expect(page.locator('[data-mock-map]')).toBeVisible()
  await page.locator('[data-mock-map]').click({ position: { x: 250, y: 300 } })
  await expect(page.getByRole('heading', { name: '가장 가까운 공식 기준 포인트' })).toBeVisible()
  expect(perPoint).toHaveLength(0) // the click alone fetches nothing per point
  await page.getByRole('button', { name: '주변 3곳 공식 지수 비교' }).click()
  const panel = page.locator('.nearby-comparison')
  await expect(panel.getByRole('heading', { name: '주변 공식 기준 포인트 지수 비교' })).toBeVisible()
  expect([...new Set(perPoint)].sort()).toEqual(['가까운 시연 기준점', '실패 시연 기준점', '중간 시연 기준점'].sort())
  await expect(panel.getByText(/선택 위치 자체의 값이 아닙니다/)).toBeVisible()
  await expect(panel.getByText(/어종 출현·조과 확률이 아닙니다/)).toBeVisible()
  await expect(panel.getByText('비교 기준 예보:', { exact: false })).toContainText('2099-01-01 · 오전')
  const gamseong = panel.locator('.nearby-species li', { hasText: '감성돔' })
  await expect(gamseong).toContainText('좋음 2곳')
  await expect(gamseong).not.toContainText('값 없음') // the failed point is not counted as "no value"
  await expect(gamseong).not.toContainText('매우나쁨') // the 4th, far point is not compared
  await expect(panel.locator('.nearby-species li', { hasText: '참돔' })).toContainText('값 없음 1곳') // the failed point is excluded, not counted as no value
  await expect(panel.locator('.nearby-points')).toContainText('실패 시연 기준점')
  await expect(panel.locator('.nearby-points')).toContainText('공식 데이터 확인 실패')
  await expect(panel.locator('.trust-badge[data-status="UNVERIFIED"]').first()).toBeVisible()
  await expect(panel).not.toContainText(/확률이 높|추천|가능성|최적/)
  await panel.locator('summary').focus(); await page.keyboard.press('Enter')
  await expect(panel.getByRole('table')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await panel.scrollIntoViewIfNeeded()
  await page.screenshot({ path: `test-results/screenshots/v1.6.4-${isMobile ? 'mobile' : 'desktop'}-mock-nearby.png`, fullPage: true })
  // Choosing a candidate still goes through the explicit preview → select flow.
  await page.getByRole('button', { name: '이 기준 포인트로 확인' }).first().click()
  await expect(page.getByRole('button', { name: '이 포인트 선택' })).toBeVisible()
})

test('a new map click cancels and clears a comparison', async ({ page, isMobile }) => {
  await page.route('https://proxy.example/**', async route => {
    const name = new URL(route.request().url()).searchParams.get('placeName')
    if (name) await new Promise(resolve => setTimeout(resolve, 1500))
    return route.fulfill({ json: { version: 1, fetchedAt: new Date().toISOString(), totalCount: 1, items: [{ seafsPstnNm: POINTS[0]!.name, lat: POINTS[0]!.lat, lot: 129.05, predcYmd: '20990101', predcNoonSeCd: '오전', seafsTgfshNm: '감성돔', totalIndex: '좋음' }] } }).catch(() => {})
  })
  await page.goto('./')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  if (isMobile) await page.getByRole('button', { name: '지도', exact: true }).click()
  await page.locator('[data-mock-map]').click({ position: { x: 250, y: 300 } })
  await page.getByRole('button', { name: /공식 지수 비교/ }).click()
  await expect(page.getByText('주변 공식 기준 포인트 지수를 확인하는 중입니다.')).toBeVisible()
  await page.locator('[data-mock-map]').click({ position: { x: 260, y: 310 } })
  await page.waitForTimeout(2000)
  await expect(page.locator('.nearby-comparison')).toHaveCount(0)
  await expect(page.getByText('주변 공식 기준 포인트 지수를 확인하는 중입니다.')).toHaveCount(0)
})
