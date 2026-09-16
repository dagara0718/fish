export type BriefTimingEvent = { requestId: string; kind: 'BRIEF_REQUEST_STARTED' | 'BRIEF_FIRST_MEANINGFUL_RENDERED'; monotonicMs: number }
export type SourceMetricEvent = { sourceId: string; outcome: 'SUCCESS' | 'TIMEOUT' | 'RATE_LIMITED' | 'MALFORMED' | 'UNAVAILABLE' | 'UNSUPPORTED_LOCATION'; cacheUsed: boolean; occurredAt: string }

