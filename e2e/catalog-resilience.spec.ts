import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('https://oapi.map.naver.com/**', route => route.fulfill({ contentType: 'application/javascript', body: `
    window.naver={maps:{
      Map:class { constructor(el){this.el=el;this.isMap=true;el.dataset.mockMap='true';} fitBounds(){} panTo(){} setZoom(){} setSize(){} destroy(){this.el.replaceChildren()} },
      LatLng:class {constructor(lat,lon){this.lat=lat;this.lon=lon}}, LatLngBounds:class {extend(){}}, Size:class {},
      Marker:class {constructor(o){this.el=document.createElement('button');this.el.textContent=o.title;this.el.className='mock-marker';o.map.el.append(this.el)}setMap(){this.el.remove()}},
      Event:{addListener(target,event,handler){const listener=(e)=>{if(event==='click'&&target.isMap)handler({coord:{lat:()=>35.05,lng:()=>129.05}});else handler(e)};target.el.addEventListener(event,listener);return {target,event,listener}},removeListener(l){l.target.el.removeEventListener(l.event,l.listener)}}
    }}; window.fishNaverReady();` }))
})

function page1(totalCount: number) {
  return { version: 1, fetchedAt: new Date().toISOString(), totalCount, items: [
    { seafsPstnNm: '가거도', lat: 34, lot: 125, predcYmd: '20990101', predcNoonSeCd: '오전', seafsTgfshNm: '참돔', totalIndex: '좋음' },
  ] }
}
function page2() {
  return { version: 1, fetchedAt: new Date().toISOString(), totalCount: 350, items: [
    { seafsPstnNm: '다른섬', lat: 36, lot: 128, predcYmd: '20990101', predcNoonSeCd: '오전', seafsTgfshNm: '우럭', totalIndex: '보통' },
  ] }
}

test('B: a mid-collection page failure still surfaces the successfully-loaded candidates with a partial warning', async ({ page, isMobile }) => {
  await page.setViewportSize(isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 })
  await page.route('https://proxy.example/**', route => {
    const url = new URL(route.request().url())
    if (url.searchParams.get('pageNo') === '1') return route.fulfill({ json: page1(350) })
    return route.fulfill({ status: 502, json: { error: 'UPSTREAM_ERROR' } })
  })
  await page.goto('./')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  await expect(page.getByRole('button', { name: /가거도 공식 기준 포인트/ })).toBeVisible()
  await expect(page.getByText('공식 포인트 일부만 불러왔습니다.')).toBeVisible()
  await expect(page.getByRole('button', { name: /다른섬/ })).toHaveCount(0)
  await page.screenshot({ path: `test-results/screenshots/v1.5-${isMobile ? 'mobile' : 'desktop'}-partial-catalog.png`, fullPage: true })
})

test('D: total collection failure with no prior cache shows an explicit, honest error, not fabricated candidates', async ({ page }) => {
  await page.route('https://proxy.example/**', route => route.fulfill({ status: 502, json: { error: 'UPSTREAM_ERROR' } }))
  await page.goto('./')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  await expect(page.getByText('공식 포인트를 현재 불러오지 못했습니다.')).toBeVisible()
  await expect(page.getByText('DEMO DATA')).toHaveCount(0)
})

test('warm catalog: a second search for the same fishing type does not re-fetch every page', async ({ page }) => {
  let page1Calls = 0
  await page.route('https://proxy.example/**', route => {
    const url = new URL(route.request().url())
    if (url.searchParams.get('pageNo') === '1') { page1Calls++; return route.fulfill({ json: page1(1) }) }
    return route.fulfill({ json: page1(1) })
  })
  await page.goto('./')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  await expect(page.getByRole('button', { name: /가거도 공식 기준 포인트/ })).toBeVisible()
  await page.getByLabel('포인트명 또는 지역 검색').fill('가거도')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  await expect(page.getByRole('button', { name: /가거도 공식 기준 포인트/ })).toBeVisible()
  expect(page1Calls).toBe(1)
})

test('E: a fast second search supersedes the first — the earlier request never overwrites the later selection', async ({ page }) => {
  let resolveFirst: (() => void) | undefined
  let requests = 0
  await page.route('https://proxy.example/**', async route => {
    requests++
    if (requests === 1) { await new Promise<void>(resolve => { resolveFirst = resolve }); return route.fulfill({ json: page1(1) }) }
    return route.fulfill({ json: page2() })
  })
  await page.goto('./')
  await page.getByLabel('포인트명 또는 지역 검색').fill('가거도')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  await page.getByLabel('포인트명 또는 지역 검색').fill('다른섬')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  await expect(page.getByRole('button', { name: /다른섬 공식 기준 포인트/ })).toBeVisible()
  resolveFirst?.()
  await page.waitForTimeout(300)
  await expect(page.getByRole('button', { name: /다른섬 공식 기준 포인트/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /가거도 공식 기준 포인트/ })).toHaveCount(0)
})
