import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OfficialIndexPanel } from '../../src/features/official-index/OfficialIndexPanel'
import { getDemoOfficialIndex } from '../../src/official-index/demo-provider'

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
})
