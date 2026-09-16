import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from '../../src/app/App'

async function search(query: string) {
  const user = userEvent.setup(); render(<App />)
  await user.click(screen.getByRole('button', { name: 'Demo 모드' }))
  await user.type(screen.getByLabelText('포인트명 또는 지역 검색'), query)
  await user.click(screen.getByRole('button', { name: '검색' }))
  return user
}

describe('Search-first UI — Must requirements', () => {
  it('distinguishes duplicate candidates and waits for explicit selection', async () => {
    await search('샘플 등대')
    expect(screen.getAllByRole('button', { name: /샘플 등대 포인트/ })).toHaveLength(2)
    expect(screen.queryByText('현재 데모 데이터가 모두 도착했습니다')).not.toBeInTheDocument()
  })
  it.each([
    ['미지원', '미지원 포인트'], ['모호', '포인트 식별이 모호합니다'], ['카탈로그오류', '카탈로그를 사용할 수 없습니다'],
  ])('shows %s without a brief', async (query, message) => { await search(query); expect(screen.getByText(message)).toBeVisible(); expect(screen.queryByText(/선택한 포인트 · DEMO/)).not.toBeInTheDocument() })
  it('shows partial siblings, all five text+icon states, evidence and exact focus return', async () => {
    const user = await search('샘플 등대')
    await user.click(screen.getByRole('button', { name: /테스트 서부 구역/ }))
    expect(screen.getByText('일부 데모 정보만 확인됐습니다')).toBeVisible()
    for (const status of ['CONFIRMED', 'STALE', 'UNVERIFIED', 'COLLECTION_FAILED', 'CONFLICT']) expect(document.querySelector(`.trust-badge[data-status="${status}"]`)).toBeVisible()
    const conflict = screen.getByTestId('slot-sample-conflict')
    const trigger = within(conflict).getByRole('button', { name: '근거 보기' })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: '샘플 정보 슬롯 E' })
    expect(within(dialog).getAllByText(/상충/).length).toBeGreaterThanOrEqual(2)
    await user.click(within(dialog).getByRole('button', { name: '근거 패널 닫기' }))
    expect(trigger).toHaveFocus()
  })
  it('retries a failed slot without hiding successful siblings', async () => {
    const user = await search('샘플 등대'); await user.click(screen.getByRole('button', { name: /테스트 서부 구역/ }))
    expect(screen.getByText('확인 가능한 데이터')).toBeVisible()
    await user.click(screen.getByRole('button', { name: '이 항목 재시도' }))
    expect(await screen.findByText('재시도 합성 응답')).toBeVisible()
    expect(screen.getByText('확인 가능한 데이터')).toBeVisible()
  })
  it('never presents absence as permission, safety or recommendation', async () => {
    const user = await search('전체실패'); await user.click(screen.getByRole('button', { name: /샘플 전체실패 포인트/ }))
    expect(screen.getByText('현재 확인 가능한 데모 데이터가 없습니다')).toBeVisible()
    expect(document.body.textContent).not.toMatch(/낚시 가능|문제없음|법적으로 가능|추천 점수/)
  })
})
