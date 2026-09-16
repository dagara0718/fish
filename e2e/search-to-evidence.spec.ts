import { expect, test } from '@playwright/test'

test('duplicate search requires explicit selection and evidence close restores focus', async ({ page }) => {
  await page.goto('./')
  const search = page.getByLabel('포인트명 또는 테스트 지역')
  await expect(search).toBeFocused()
  await search.fill('샘플 등대')
  await page.getByRole('button', { name: '검색' }).click()
  await expect(page.getByRole('button', { name: /샘플 등대 포인트/ })).toHaveCount(2)
  await expect(page.getByText('일부 합성 정보만 확인됐습니다')).toHaveCount(0)
  await page.getByRole('button', { name: /테스트 서부 구역/ }).click()
  await expect(page.getByText('일부 합성 정보만 확인됐습니다')).toBeVisible()
  const conflict = page.getByTestId('slot-sample-conflict')
  const evidenceTrigger = conflict.getByRole('button', { name: '근거 보기' })
  await evidenceTrigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: '샘플 정보 슬롯 E' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(evidenceTrigger).toBeFocused()
})

test('keyboard-only search and candidate activation works', async ({ page }) => {
  await page.goto('./')
  await page.keyboard.type('캐시')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  const candidate = page.getByRole('button', { name: /샘플 캐시 포인트/ })
  await candidate.focus()
  await page.keyboard.press('Space')
  await expect(page.getByText('선택한 합성 포인트')).toBeVisible()
})

