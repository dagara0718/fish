import type { BriefTimingEvent } from './contracts'

export function timingPair(requestId: string, startedAt: number, renderedAt: number): BriefTimingEvent[] {
  return [{ requestId, kind: 'BRIEF_REQUEST_STARTED', monotonicMs: startedAt }, { requestId, kind: 'BRIEF_FIRST_MEANINGFUL_RENDERED', monotonicMs: renderedAt }]
}

export function percentiles(events: BriefTimingEvent[]): { count: number; p50: number | undefined; p95: number | undefined } {
  const started = new Map(events.filter((e) => e.kind === 'BRIEF_REQUEST_STARTED').map((e) => [e.requestId, e.monotonicMs]))
  const values = events.filter((e) => e.kind === 'BRIEF_FIRST_MEANINGFUL_RENDERED').map((e) => e.monotonicMs - (started.get(e.requestId) ?? e.monotonicMs)).sort((a, b) => a - b)
  const at = (p: number) => values.length ? values[Math.min(values.length - 1, Math.ceil(values.length * p) - 1)] : undefined
  return { count: values.length, p50: at(0.5), p95: at(0.95) }
}

