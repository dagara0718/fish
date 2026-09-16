import { expect, test } from '@playwright/test'

async function search(page: import('@playwright/test').Page, query: string) {
  await page.goto('./')
  await page.getByLabel('포인트명 또는 테스트 지역').fill(query)
  await page.getByRole('button', { name: '검색' }).click()
}

for (const [query, message] of [['미지원', '미지원 포인트'], ['모호', '포인트 식별이 모호합니다'], ['카탈로그오류', '카탈로그를 사용할 수 없습니다']] as const) {
  test(`${query} remains terminal without a guessed brief`, async ({ page }) => {
    await search(page, query)
    await expect(page.getByText(message)).toBeVisible()
    await expect(page.getByText('선택한 합성 포인트')).toHaveCount(0)
  })
}

test('partial, stale, failed, unverified and conflict remain distinct', async ({ page }) => {
  await search(page, '샘플 등대')
  await page.getByRole('button', { name: /테스트 서부 구역/ }).click()
  for (const status of ['CONFIRMED', 'STALE', 'UNVERIFIED', 'COLLECTION_FAILED', 'CONFLICT']) await expect(page.locator(`.trust-badge[data-status="${status}"]`)).toBeVisible()
  await expect(page.getByText('합성 확인 값')).toBeVisible()
  await page.getByRole('button', { name: '이 항목 재시도' }).click()
  await expect(page.getByText('재시도 합성 응답')).toBeVisible()
  await expect(page.getByText('합성 확인 값')).toBeVisible()
})

test('all failed is finite and does not claim permission', async ({ page }) => {
  await search(page, '전체실패')
  await page.getByRole('button', { name: /샘플 전체실패 포인트/ }).click()
  await expect(page.getByText('현재 확인 가능한 합성 데이터가 없습니다')).toBeVisible()
  const text = await page.locator('body').innerText()
  expect(text).not.toMatch(/낚시 가능|문제없음|법적으로 가능|추천 점수/)
})
