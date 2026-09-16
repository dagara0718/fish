import { expect, test } from '@playwright/test'

test('mobile Search-first flow has no core horizontal overflow and keeps non-color status text', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile project only')
  await page.goto('./')
  await page.getByRole('button', { name: 'Demo 모드' }).click()
  await page.getByLabel('포인트명 또는 지역 검색').fill('충돌')
  await page.getByRole('button', { name: '검색' }).click()
  await page.getByRole('button', { name: /샘플 충돌 포인트/ }).click()
  await expect(page.getByTestId('slot-sample-conflict').getByText('정보충돌')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
  await page.getByTestId('slot-sample-conflict').getByRole('button', { name: '근거 보기' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: '근거 패널 닫기' }).click()
})

test('desktop trust badges include icon and text semantics', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop project only')
  await page.goto('./')
  await page.getByRole('button', { name: 'Demo 모드' }).click()
  await page.getByLabel('포인트명 또는 지역 검색').fill('샘플 등대')
  await page.getByRole('button', { name: '검색' }).click()
  await page.getByRole('button', { name: /테스트 서부 구역/ }).click()
  for (const status of ['CONFIRMED', 'STALE', 'UNVERIFIED', 'COLLECTION_FAILED', 'CONFLICT']) {
    await expect(page.locator(`.trust-badge[data-status="${status}"]`).first()).toBeVisible()
  }
})
