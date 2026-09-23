import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MarineCurrentPanel, MARINE_STALE_AFTER_MS } from '../../src/features/official-index/MarineCurrentPanel'
import { normalizeTidalCurrent } from '../../src/species-guidance/khoa-tidal-current-provider'
import type { MarineCurrentResult } from '../../src/species-guidance/contracts'

const fresh = () => new Date().toISOString()
const result = (rows: object[], retrievedAt = fresh()) => normalizeTidalCurrent({ result: { data: rows } }, retrievedAt)
const rows = [
  { current_speed: 70, current_dir: 176, obs_date: '2026-09-23 20:00:00', type: '최강낙조류' },
  { current_speed: 30, current_dir: 200, obs_date: '2026-09-23 21:00:00', type: '' },
  { current_speed: 2, current_dir: 273, obs_date: '2026-09-23 22:50:00', type: '전류' },
]
const renderPanel = (value: MarineCurrentResult | undefined, busy = false) => { const onRetry = vi.fn(); render(<MarineCurrentPanel result={value} busy={busy} onRetry={onRetry} />); return onRetry }

afterEach(() => vi.useRealTimers())

describe('MarineCurrentPanel — v1.6.3 REQ-FUNC-MARINE-UI', () => {
  it('shows a finite loading state', () => {
    renderPanel(undefined, true)
    expect(screen.getByRole('status')).toHaveTextContent('조류 예측 데이터를 확인하는 중입니다')
  })
  it('shows "not configured" instead of disappearing (NOT_CONNECTED)', () => {
    renderPanel({ status: 'NOT_CONNECTED', observations: [] })
    expect(screen.getByText('조류 예측 데이터 연결이 설정되지 않았습니다')).toBeVisible()
    expect(screen.queryByRole('button', { name: /다시 조회/ })).not.toBeInTheDocument()
  })
  it('distinguishes an unsupported area from a failure', () => {
    renderPanel({ status: 'UNSUPPORTED_AREA', observations: [] })
    expect(screen.getByText('이 위치는 조류 예측 제공 범위가 아닙니다')).toBeVisible()
    expect(screen.queryByText('조류 예측 데이터를 확인하지 못했습니다')).not.toBeInTheDocument()
  })
  it('shows a failure with a marine-only retry and no raw error text', async () => {
    const onRetry = renderPanel({ status: 'UNAVAILABLE', observations: [], reason: '조류 예측 데이터를 확인하지 못했습니다. 제공 범위 밖이거나 일시적인 오류일 수 있습니다.' })
    expect(document.querySelector('.trust-badge[data-status="COLLECTION_FAILED"]')).toBeVisible()
    expect(document.body.textContent).not.toMatch(/Error|stack|ServiceKey|https?:\/\//)
    await userEvent.click(screen.getByRole('button', { name: '조류 데이터만 다시 조회' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
  it('summarizes success with trust status, units, forecast window, official event labels and retrieval time', () => {
    renderPanel(result(rows))
    expect(document.querySelector('.marine-section .trust-badge[data-status="UNVERIFIED"]')).toBeVisible()
    expect(screen.getByText('예측 구간 (시간대 미확인)')).toBeVisible()
    expect(screen.getByText('2026-09-23 20:00 ~ 2026-09-23 22:50')).toBeVisible()
    expect(screen.getByText('2–70 cm/s')).toBeVisible()
    const events = within(document.querySelector('.marine-events') as HTMLElement)
    expect(events.getByText('최강낙조류')).toBeVisible(); expect(events.getByText('전류')).toBeVisible()
    expect(screen.getByText(/KST$/)).toBeVisible() // retrieval time: this device's own, known clock
    expect(screen.getByText(/예측값이며 실측·현재 관측값이 아닙니다/)).toBeVisible()
  })
  it('never labels a row as the present one, and never implies a species/safety judgment', () => {
    renderPanel(result(rows))
    const text = document.querySelector('.marine-section')!.textContent!
    expect(text).not.toMatch(/실시간|지금 조류|현재 조류|현재 유속|낚시 가능|안전합니다|추천/)
    expect(text).toMatch(/어종별 판단 근거로 사용하지 않습니다/)
  })
  it('keeps an empty type as 미표기 and exposes every row, its trust status and provenance behind 근거 보기', async () => {
    const user = userEvent.setup()
    renderPanel(result(rows))
    const summary = screen.getByText('근거 보기 · 조류 예측 3개 행')
    await user.click(summary) // real-keyboard toggling is covered in e2e/marine-current.spec.ts (jsdom lacks it)
    const details = summary.closest('details')!
    expect(details.open).toBe(true)
    const table = within(details).getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(4)
    expect(within(table).getByText('미표기')).toBeVisible()
    expect(within(table).getAllByText('확인 필요')).toHaveLength(3)
    expect(within(table).getByRole('columnheader', { name: '유향 (기준 미확인)' })).toBeVisible()
    expect(within(details).getByText(/국립해양조사원 · 수치조류도\(예측\)/)).toBeVisible()
    expect(within(details).getByText(/가장 가까운 지점\(최대 1km\)/)).toBeVisible()
    expect(within(details).getByText(/예측일시 시간대: 제공기관 미명시/)).toBeVisible()
  })
  it('marks PARTIAL results without hiding the valid rows', () => {
    renderPanel(result([...rows, { current_speed: 1, current_dir: 1, obs_date: '2026-09-23 23:00:00', type: 'unrecognized' }]))
    expect(screen.getByText('일부 행은 형식을 확인할 수 없어 제외했습니다.')).toBeVisible()
    expect(screen.getByText('근거 보기 · 조류 예측 3개 행')).toBeVisible()
  })
  it('marks data older than the 10-minute resolution as STALE, keeps the per-row UNVERIFIED status, and offers a refresh', async () => {
    const old = new Date(Date.now() - MARINE_STALE_AFTER_MS - 1000).toISOString()
    const onRetry = renderPanel(result(rows, old))
    expect(document.querySelector('.marine-badges .trust-badge[data-status="STALE"]')).toBeVisible()
    expect(document.querySelector('.marine-badges .trust-badge[data-status="UNVERIFIED"]')).toBeVisible()
    expect(screen.getByText('조회 후 10분 이상 지났습니다')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: '조류 데이터만 다시 조회' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
  it('becomes STALE while left open, without a refetch', () => {
    vi.useFakeTimers({ now: new Date('2026-09-24T00:00:00Z') })
    renderPanel(result(rows, new Date('2026-09-24T00:00:00Z').toISOString()))
    expect(document.querySelector('.marine-badges .trust-badge[data-status="STALE"]')).toBeNull()
    act(() => { vi.advanceTimersByTime(MARINE_STALE_AFTER_MS + 30_000) })
    expect(document.querySelector('.marine-badges .trust-badge[data-status="STALE"]')).not.toBeNull()
  })
})
