import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OfficialIndexPanel } from '../../src/features/official-index/OfficialIndexPanel'
import { AccessStatusPanel } from '../../src/features/official-index/AccessStatusPanel'
import { getDemoOfficialIndex } from '../../src/official-index/demo-provider'
import { UnverifiedFishingAccessProvider } from '../../src/official-index/fishing-access'

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

describe('access status presentation', () => {
  it('never renders CHECK_REQUIRED as permission and keeps it distinct from TrustStatus wording', async () => {
    const status = await new UnverifiedFishingAccessProvider().getAccessStatus({ officialPointId: 'p', linkedPointId: 'p', placeName: '테스트', regionContext: '테스트', fishingType: '갯바위', latitude: 35, longitude: 129 })
    render(<AccessStatusPanel status={status} />)
    expect(screen.getByText('확인 필요')).toBeVisible()
    expect(screen.getByText(/낚시 금지·통제 여부를 확정할 수 없습니다/)).toBeVisible()
    expect(screen.queryByText(/낚시 가능|문제없음|안전합니다/)).not.toBeInTheDocument()
  })
})
