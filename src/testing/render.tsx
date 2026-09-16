import type { ReactElement } from 'react'
import { render } from '@testing-library/react'

export function renderFixture(ui: ReactElement) { return render(ui) }

