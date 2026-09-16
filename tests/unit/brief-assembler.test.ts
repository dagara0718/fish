import { describe, expect, it } from 'vitest'
import { assembleBrief, retryFailedSlot } from '../../src/domain/brief-assembler'
import { retryFixtureSlot, settleWithInjectedDeadline } from '../../src/data/fixture-adapters'
import { SYNTHETIC_POINTS } from '../../src/data/fixture-catalog'
import { makeBrief } from '../../src/testing/fixtures/brief-scenarios'

const point = (id: string) => SYNTHETIC_POINTS.find((item) => item.pointId === id)!
describe('partial-first assembly — TC-BRIEF-001~003', () => {
  it('keeps successful siblings beside failures', () => {
    const result = assembleBrief(point('sample-mixed'), makeBrief('sample-mixed'))
    expect(result.completeness).toBe('PARTIAL')
    expect(result.brief.items.some((item) => item.trustStatus === 'CONFIRMED')).toBe(true)
    expect(result.brief.items.some((item) => item.trustStatus === 'COLLECTION_FAILED')).toBe(true)
  })
  it('uses a finite unavailable state when all collection fails', () => {
    expect(assembleBrief(point('sample-failed'), makeBrief('sample-failed')).completeness).toBe('UNAVAILABLE')
  })
  it('lets a successful sibling settle when another fake never resolves', async () => {
    const never = new Promise<string>(() => undefined)
    const results = await settleWithInjectedDeadline([Promise.resolve('success'), never], 1)
    expect(results).toEqual(['success', 'TIMEOUT'])
  })
  it('retries only the failed slot and preserves sibling records', async () => {
    const before = makeBrief('sample-mixed'); const success = before.brief.items[0]
    const failed = before.brief.items.find((item) => item.trustStatus === 'COLLECTION_FAILED')!
    const after = await retryFailedSlot(before, failed.recordId, retryFixtureSlot)
    expect(after.brief.items[0]).toBe(success)
    expect(after.brief.items.find((item) => item.recordId === `${failed.recordId}-retry`)?.trustStatus).toBe('CONFIRMED')
  })
  it('rejects point/brief identity mismatch', () => expect(() => assembleBrief(point('sample-cache'), makeBrief('sample-mixed'))).toThrow('POINT_BRIEF_MISMATCH'))
})
