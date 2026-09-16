import { describe, expect, it } from 'vitest'
import { assessTrust, canPromote } from '../../src/domain/trust-policy'
import { confirmed } from '../../src/testing/fixtures/brief-scenarios'

describe('trust policy — TC-TRUST-001/002/004/005', () => {
  const record = confirmed('p', 'a', '샘플', 'value')
  it('uses only injected symbolic freshness results', () => {
    expect(assessTrust(record, 'STALE').trustStatus).toBe('STALE')
    expect(assessTrust(record, 'POLICY_UNAVAILABLE').trustStatus).toBe('UNVERIFIED')
    expect(assessTrust(record, 'TIME_UNVERIFIABLE').trustStatus).toBe('UNVERIFIED')
  })
  it.each(['STALE', 'UNVERIFIED', 'COLLECTION_FAILED', 'CONFLICT'] as const)('does not auto-promote %s', (status) => {
    expect(canPromote(status, 'TIME_PASSED')).toBe(false)
    expect(canPromote(status, 'CACHE_READ')).toBe(false)
    expect(canPromote(status, 'NEW_VERIFIED_COLLECTION')).toBe(true)
  })
})

