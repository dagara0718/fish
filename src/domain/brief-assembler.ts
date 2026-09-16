import type { BriefAssemblyOutcome, FishingPoint, InformationRecord } from './contracts'

export function assembleBrief(point: FishingPoint, draft: BriefAssemblyOutcome): BriefAssemblyOutcome {
  if (point.supportStatus !== 'SUPPORTED') throw new Error('INVALID_POINT')
  if (draft.brief.pointId !== point.pointId) throw new Error('POINT_BRIEF_MISMATCH')
  const hasUsableValue = draft.brief.items.some((record) => record.value !== undefined)
  const hasFailure = draft.brief.items.some((record) => record.trustStatus === 'COLLECTION_FAILED' || record.trustStatus === 'STALE' || record.trustStatus === 'UNVERIFIED' || record.trustStatus === 'CONFLICT')
  const completeness = !hasUsableValue ? 'UNAVAILABLE' : hasFailure ? 'PARTIAL' : 'COMPLETE'
  return { brief: draft.brief, completeness }
}

export async function retryFailedSlot(outcome: BriefAssemblyOutcome, recordId: string, collect: (record: InformationRecord) => Promise<InformationRecord>): Promise<BriefAssemblyOutcome> {
  const items = await Promise.all(outcome.brief.items.map(async (record): Promise<InformationRecord> => record.recordId === recordId && record.trustStatus === 'COLLECTION_FAILED' ? collect(record) : record))
  const hasFailures = items.some((record) => record.trustStatus === 'COLLECTION_FAILED')
  return { brief: { ...outcome.brief, items }, completeness: hasFailures ? 'PARTIAL' : 'COMPLETE' }
}
