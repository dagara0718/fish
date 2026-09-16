import { describe, expect, it } from 'vitest'
import { createConfirmedRecord, validateRecord } from '../../src/domain/contracts'
import { preserveConflict } from '../../src/domain/conflict-detector'
import { confirmed } from '../../src/testing/fixtures/brief-scenarios'

describe('domain contracts — REQ-FUNC-TRUST-001~004 / REQ-NFR-DATA-001~002', () => {
  it('rejects evidence-free CONFIRMED records', () => {
    expect(() => createConfirmedRecord({ recordId: 'r', pointId: 'p', infoType: 'sample', label: 'sample', value: 'x', evidence: [] })).toThrow(/source.*time/i)
  })
  it('requires a reason for uncertain states', () => {
    expect(() => validateRecord({ recordId: 'r', pointId: 'p', infoType: 'sample', label: 'sample', trustStatus: 'UNVERIFIED', evidence: [] })).toThrow(/statusReason/)
  })
  it('preserves two competing originals without choosing a winner', () => {
    const conflict = preserveConflict([confirmed('p', 'x', '샘플', 'A'), confirmed('p', 'x', '샘플', 'B')], '샘플')
    expect(conflict.trustStatus).toBe('CONFLICT')
    expect(conflict.value).toBeUndefined()
    expect(conflict.evidence).toHaveLength(2)
  })
})

