import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('https://oapi.map.naver.com/**', route => route.fulfill({ contentType: 'application/javascript', body: `
    window.naver={maps:{
      Map:class { constructor(el){this.el=el;this.isMap=true;el.dataset.mockMap='true';} fitBounds(){} panTo(){} setZoom(){} setSize(){} destroy(){this.el.replaceChildren()} },
      LatLng:class {constructor(lat,lon){this.lat=lat;this.lon=lon}}, LatLngBounds:class {extend(){}}, Size:class {},
      Marker:class {constructor(o){this.el=document.createElement('button');this.el.textContent=o.title;this.el.className='mock-marker';o.map.el.append(this.el)}setMap(){this.el.remove()}},
      Event:{
        addListener(target,event,handler){
          const listener=(domEvent)=>{ if(event==='click'&&target.isMap) handler({coord:{lat:()=>35.05,lng:()=>129.05}}); else handler(domEvent) }
          target.el.addEventListener(event,listener); return {target,event,listener}
        },
        removeListener(l){l.target.el.removeEventListener(l.event,l.listener)}
      }
    }}; window.fishNaverReady();` }))
  // Sanitized real-shaped KHOA items (confirmed 2026-09-16). 기타어종 must reach OFFICIAL INDEX but
  // never ENVIRONMENT GUIDANCE. Water temp 12~15 is deliberately picked so 돌돔 lands on LOW and
  // 감성돔/농어 land on INSUFFICIENT_EVIDENCE (no season evidence), exercising every visible state.
  await page.route('https://proxy.example/**', route => route.fulfill({ json: { version: 1, fetchedAt: new Date().toISOString(), totalCount: 3, items: [
    { seafsPstnNm: '계약 시연 기준점', lat: 35, lot: 129, predcYmd: '20990101', predcNoonSeCd: '오전', seafsTgfshNm: '우럭', totalIndex: '좋음', lastScr: 70, minWtem: 12, maxWtem: 15 },
    { seafsPstnNm: '계약 시연 기준점', lat: 35, lot: 129, predcYmd: '20990101', predcNoonSeCd: '오전', seafsTgfshNm: '참돔', totalIndex: '보통', lastScr: 40 },
    { seafsPstnNm: '계약 시연 기준점', lat: 35, lot: 129, predcYmd: '20990101', predcNoonSeCd: '오전', seafsTgfshNm: '기타어종', totalIndex: '나쁨' },
  ] } }))
})

async function selectPoint(page: import('@playwright/test').Page, isMobile?: boolean) {
  await page.goto('./')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  if (isMobile) await page.getByRole('button', { name: '지도', exact: true }).click()
  await page.getByRole('button', { name: '● 공식 기준 · 계약 시연 기준점' }).click()
  await page.getByRole('button', { name: '이 포인트 선택' }).click()
}

test('A: selecting an official point shows the official index and a separate environment-guidance section', async ({ page, isMobile }) => {
  await selectPoint(page, isMobile)
  await expect(page.getByRole('heading', { name: '어종별 공식 바다낚시지수' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '환경 기반 예상어종' })).toBeVisible()
  const officialBox = await page.locator('.official-section').boundingBox()
  const guidanceBox = await page.locator('.guidance-section').boundingBox()
  expect(officialBox).not.toBeNull(); expect(guidanceBox).not.toBeNull()
})

test('B: "왜 이렇게 판단했나요?" reveals factor-level reasoning', async ({ page, isMobile }) => {
  await selectPoint(page, isMobile)
  await page.locator('.guidance-card', { hasText: '돌돔' }).getByText('왜 이렇게 판단했나요?').click()
  await expect(page.locator('.guidance-card', { hasText: '돌돔' }).getByText(/수온 —/)).toBeVisible()
  await expect(page.locator('.guidance-card', { hasText: '돌돔' }).getByText(/계절 —/)).toBeVisible()
})

test('C: 기타어종 appears in the official index but never in environment guidance', async ({ page, isMobile }) => {
  await selectPoint(page, isMobile)
  await expect(page.locator('.official-section').getByRole('heading', { name: '기타어종' })).toBeVisible()
  await expect(page.locator('.guidance-section').getByText('기타어종')).toHaveCount(0)
})

test('D: factors without evidence render as UNKNOWN text, never a synthetic value', async ({ page, isMobile }) => {
  await selectPoint(page, isMobile)
  await page.locator('.guidance-card', { hasText: '우럭' }).getByText('왜 이렇게 판단했나요?').click()
  const card = page.locator('.guidance-card', { hasText: '우럭' })
  await expect(card.getByText(/유속 — 근거 없음/)).toBeVisible()
  await expect(card.getByText(/물때 — 근거 없음/)).toBeVisible()
  await expect(card.getByText(/시간대 — 근거 없음/)).toBeVisible()
})

test('E: insufficient evidence renders as 판단 근거 부족, not a fabricated result', async ({ page, isMobile }) => {
  await selectPoint(page, isMobile)
  await expect(page.locator('.guidance-card', { hasText: '감성돔' }).getByText('환경 적합도 판단 근거 부족')).toBeVisible()
})

test('F: no probability, AI, or recommendation language appears anywhere on the page', async ({ page, isMobile }) => {
  await selectPoint(page, isMobile)
  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toMatch(/잡힐 확률|조과 확률|AI\s*추천|%\s*확률|무조건 잡힘|출조 추천|베스트 어종/)
})
