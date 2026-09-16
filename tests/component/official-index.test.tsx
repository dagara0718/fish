import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OfficialIndexPanel } from '../../src/features/official-index/OfficialIndexPanel'
import { AccessStatusPanel } from '../../src/features/official-index/AccessStatusPanel'
import { getDemoOfficialIndex } from '../../src/official-index/demo-provider'
import { UnverifiedFishingAccessProvider } from '../../src/official-index/fishing-access'
import { normalizeOfficial } from '../../src/official-index/live-provider'

describe('official index presentation', () => {
  it('shows official grade and trust status as separate labels', () => {
    render(<OfficialIndexPanel result={getDemoOfficialIndex('sample-mixed')} />)
    expect(screen.getByText('좋음')).toBeVisible()
    expect(screen.getAllByText('오래됨').length).toBeGreaterThan(0)
    expect(screen.getByText(/실제 API 스키마 기반 시연 데이터/)).toBeVisible()
  })
  it('states unsupported without generating a species result', () => {
    render(<OfficialIndexPanel result={getDemoOfficialIndex('sample-conflict')} />)
    expect(screen.getByText('공식 바다낚시지수 미지원 위치')).toBeVisible()
    expect(screen.queryByText('우럭')).not.toBeInTheDocument()
  })
  it('renders a plain species summary without probability or recommendation language', () => {
    render(<OfficialIndexPanel result={getDemoOfficialIndex('sample-complete')} />)
    expect(screen.getByText('오늘 확인할 어종')).toBeVisible()
    expect(screen.getByText('우럭 · 공식 지수 보통')).toBeVisible()
    const forbidden = /추천|확률|잡힐/
    document.querySelectorAll('.official-section').forEach(section => expect(section.textContent).not.toMatch(forbidden))
  })
})

describe('environment-based guidance presentation', () => {
  const point = { officialPointId: 'p', linkedPointId: 'p', placeName: '가거도', regionContext: '공식', fishingType: '갯바위' as const, latitude: 34.07308, longitude: 125.08805 }
  const record = { seafsPstnNm: point.placeName, lat: point.latitude, lot: point.longitude, predcYmd: '20260916', predcNoonSeCd: '오전', seafsTgfshNm: '참돔', totalIndex: '좋음', minWtem: 24.3, maxWtem: 24.4 }

  it('renders as a section separate from the official index, never merging suitability into official grade', () => {
    render(<OfficialIndexPanel result={normalizeOfficial([record], point)} />)
    expect(screen.getByRole('heading', { name: '환경 기반 예상어종' })).toBeVisible()
    expect(screen.getByRole('heading', { name: '어종별 공식 바다낚시지수' })).toBeVisible()
    expect(document.querySelector('.guidance-section')).not.toBeNull()
    expect(document.querySelector('.guidance-section')).not.toBe(document.querySelector('.official-section'))
  })

  it('explains factors and states the current-direction limitation, with no probability or AI language anywhere', () => {
    render(<OfficialIndexPanel result={normalizeOfficial([record], point)} />)
    expect(screen.getByText(/해류 방향 데이터는 현재 판단에 포함되지 않았습니다/)).toBeVisible()
    const forbidden = /추천|확률|%|AI|무조건 잡힘|출조 추천|베스트 어종/
    document.querySelectorAll('.guidance-section').forEach(section => expect(section.textContent).not.toMatch(forbidden))
  })

  it('never assigns guidance to 기타어종 or any species without a profile', () => {
    render(<OfficialIndexPanel result={normalizeOfficial([{ ...record, seafsTgfshNm: '기타어종' }], point)} />)
    expect(document.querySelector('.guidance-section')?.textContent).not.toContain('기타어종')
  })
})

describe('access status presentation', () => {
  it('never renders CHECK_REQUIRED as permission and keeps it distinct from TrustStatus wording', async () => {
    const status = await new UnverifiedFishingAccessProvider().getAccessStatus({ officialPointId: 'p', linkedPointId: 'p', placeName: '테스트', regionContext: '테스트', fishingType: '갯바위', latitude: 35, longitude: 129 })
    render(<AccessStatusPanel status={status} />)
    expect(screen.getByText('확인 필요')).toBeVisible()
    expect(screen.getByText(/낚시 금지·통제 여부를 확정할 수 없습니다/)).toBeVisible()
    expect(screen.queryByText(/낚시 가능|문제없음|안전합니다/)).not.toBeInTheDocument()
  })
})
