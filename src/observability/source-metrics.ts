import type { SourceMetricEvent } from './contracts'

export function sourceReport(events: SourceMetricEvent[]) {
  return [...new Set(events.map((event) => event.sourceId))].map((sourceId) => {
    const sourceEvents = events.filter((event) => event.sourceId === sourceId)
    const failures = sourceEvents.filter((event) => event.outcome !== 'SUCCESS').length
    return { sourceId, calls: sourceEvents.length, failures, failureRate: sourceEvents.length ? failures / sourceEvents.length : 0, cacheUses: sourceEvents.filter((event) => event.cacheUsed).length, lastResult: sourceEvents.at(-1)?.outcome, lastSuccessAt: sourceEvents.filter((event) => event.outcome === 'SUCCESS').at(-1)?.occurredAt }
  })
}
