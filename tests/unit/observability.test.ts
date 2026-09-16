import { describe, expect, it } from 'vitest'
import { percentiles, timingPair } from '../../src/observability/brief-timing'
import { sourceReport } from '../../src/observability/source-metrics'

describe('baseline-capable observability — REQ-NFR-PERF-001/OBS-001/COST-001', () => {
  it('pairs starts and first meaningful renders and computes p50/p95 without targets', () => {
    const report = percentiles([...timingPair('a', 0, 10), ...timingPair('b', 0, 30)])
    expect(report).toEqual({ count: 2, p50: 10, p95: 30 })
  })
  it('reports source calls, failures, cache and latest success', () => {
    const report = sourceReport([
      { sourceId: 'fixture', outcome: 'SUCCESS', cacheUsed: false, occurredAt: 'a' },
      { sourceId: 'fixture', outcome: 'TIMEOUT', cacheUsed: true, occurredAt: 'b' },
    ])[0]!
    expect(report).toMatchObject({ calls: 2, failures: 1, failureRate: 0.5, cacheUses: 1, lastSuccessAt: 'a' })
  })
})

