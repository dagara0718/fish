import type { BriefTimingEvent, SourceMetricEvent } from './contracts'

export class MemoryEventSink {
  readonly timings: BriefTimingEvent[] = []
  readonly sources: SourceMetricEvent[] = []
  recordTiming(event: BriefTimingEvent): void { this.timings.push(structuredClone(event)) }
  recordSource(event: SourceMetricEvent): void { this.sources.push(structuredClone(event)) }
}

