import { describe, expect, it } from 'vitest'
import { getDemoOfficialIndex } from '../../src/official-index/demo-provider'

describe('official fishing index v1.1 contracts', () => {
  it('keeps official grade separate from trust status', () => {
    const result = getDemoOfficialIndex('sample-mixed')
    expect(result.kind).toBe('STALE_CACHE')
    if (result.kind !== 'STALE_CACHE') throw new Error('expected stale demo')
    expect(result.species[0]).toMatchObject({ assessmentType: 'OFFICIAL_FISHING_INDEX', officialGrade: '좋음', trustStatus: 'STALE' })
    expect(JSON.stringify(result)).not.toContain('ENVIRONMENT_BASED_GUIDANCE')
  })
  it('does not fabricate official results for unsupported points', () => {
    expect(getDemoOfficialIndex('sample-conflict')).toEqual({ kind: 'UNSUPPORTED_POINT', reason: '공식 바다낚시지수 미지원 위치', demo: true })
  })
  it('keeps each environment observation provenance and trust', () => {
    const result = getDemoOfficialIndex('sample-complete')
    if (result.kind !== 'SUCCESS') throw new Error('expected demo success')
    expect(result.environment.observations.every((item) => item.source && item.sourceTimestamp && item.trustStatus)).toBe(true)
  })
})
