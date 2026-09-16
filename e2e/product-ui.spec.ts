import { expect, test } from '@playwright/test'

test('desktop product shell and official index render at 1440x900', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop capture only')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('./')
  await page.getByRole('button', { name: 'Demo 모드' }).click()
  await expect(page.getByRole('heading', { name: '어디로 출조할 예정인가요?' })).toBeVisible()
  await page.getByLabel('포인트명 또는 지역 검색').fill('샘플 등대')
  await page.getByRole('button', { name: '검색' }).click()
  await page.getByRole('button', { name: /테스트 동부 구역/ }).click()
  await expect(page.getByRole('heading', { name: '어종별 공식 바다낚시지수' })).toBeVisible()
  await expect(page.getByText('OFFICIAL_FISHING_INDEX')).toHaveCount(0)
  await page.screenshot({ path: 'test-results/screenshots/desktop-1440x900.png', fullPage: true })
})

test('mobile product flow renders at 390x844 without horizontal overflow', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile capture only')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  await page.getByRole('button', { name: 'Demo 모드' }).click()
  await page.getByLabel('포인트명 또는 지역 검색').fill('샘플 등대')
  await page.getByRole('button', { name: '검색' }).click()
  await page.getByRole('button', { name: /테스트 동부 구역/ }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/screenshots/mobile-390x844.png', fullPage: true })
})

test('current location presents candidates and never auto-selects', async ({ page, isMobile }) => {
  test.skip(isMobile, 'single browser proof')
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: (success: PositionCallback) => success({ coords: { latitude: 35.1, longitude: 129.1, accuracy: 100, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() } as GeolocationPosition) } })
  })
  await page.goto('./')
  await page.getByRole('button', { name: 'Demo 모드' }).click()
  await page.getByRole('button', { name: /현재 위치 사용/ }).click()
  await expect(page.getByLabel('현재 위치 주변 공식 후보')).toBeVisible()
  await expect(page.getByText('선택한 포인트 · DEMO')).toHaveCount(0)
  await page.getByRole('button', { name: /샘플 등대 기준점/ }).click()
  await expect(page.getByText('선택한 포인트 · DEMO')).toBeVisible()
})

test('location denial preserves manual search', async ({ page, isMobile }) => {
  test.skip(isMobile, 'single browser proof')
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => error({ code: 1, message: 'denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError) } })
  })
  await page.goto('./')
  await page.getByRole('button', { name: 'Demo 모드' }).click()
  await page.getByRole('button', { name: /현재 위치 사용/ }).click()
  await expect(page.getByText(/위치 권한이 거부/)).toBeVisible()
  await expect(page.getByLabel('포인트명 또는 지역 검색')).toBeEnabled()
})
