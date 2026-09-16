import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '../../src/app/App'

describe('product presentation shell', () => {
  it('presents a compact product search without internal planning language', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Demo 모드' }))
    expect(screen.getByRole('heading', { name: '어디로 출조할 예정인가요?' })).toBeVisible()
    expect(screen.getByText('DEMO DATA')).toBeVisible()
    expect(screen.queryByText(/POINT EVIDENCE LAB|SEARCH-FIRST PROTOTYPE|OD-0/)).not.toBeInTheDocument()
  })
})
