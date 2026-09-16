import { expect, it } from 'vitest'
import { MemoryEventSink } from '../../src/observability/memory-event-sink'
import { PRIVACY_SENTINELS } from '../../src/testing/fixtures/privacy-scenarios'

it('analytics contracts exclude personal/GPS/raw payload sentinels — REQ-NFR-PRIV-001~002', () => {
  const sink = new MemoryEventSink()
  sink.recordSource({ sourceId: 'fixture-source', outcome: 'SUCCESS', cacheUsed: false, occurredAt: '2026-09-16T00:00:00Z' })
  const stored = JSON.stringify(sink)
  for (const sentinel of PRIVACY_SENTINELS) expect(stored).not.toContain(sentinel)
})

