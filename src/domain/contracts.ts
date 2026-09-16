export type SupportStatus = 'SUPPORTED' | 'UNSUPPORTED' | 'REVIEW_REQUIRED'
export type TrustStatus = 'CONFIRMED' | 'STALE' | 'UNVERIFIED' | 'COLLECTION_FAILED' | 'CONFLICT'
export type AdapterFailure = 'TIMEOUT' | 'RATE_LIMITED' | 'MALFORMED' | 'UNAVAILABLE' | 'UNSUPPORTED_LOCATION'

export interface FishingPoint {
  pointId: string
  name: string
  regionContext: string
  pointType?: string | undefined
  supportStatus: SupportStatus
}

export type PointLookupResult =
  | { kind: 'MATCHES'; candidates: FishingPoint[] }
  | { kind: 'NO_MATCH'; query: string }
  | { kind: 'AMBIGUOUS'; candidates: FishingPoint[]; missingContext: string }
  | { kind: 'CATALOG_UNAVAILABLE'; reason: string }

export interface Evidence {
  sourceId: string
  sourceName: string
  basisTime?: string | undefined
  checkedAt?: string | undefined
  sourceReference?: string | undefined
  value?: string | undefined
}

export interface CacheState {
  storedAt: string
  recordBasisTime?: string | undefined
  lastRefreshAttemptAt?: string | undefined
  lastRefreshResult?: AdapterFailure | undefined
}

export interface InformationRecord {
  recordId: string
  pointId: string
  infoType: string
  label: string
  value?: string | undefined
  trustStatus: TrustStatus
  evidence: Evidence[]
  statusReason?: string | undefined
  cacheState?: CacheState | undefined
}

export interface SourceOutcome {
  sourceId: string
  outcome: 'SUCCESS' | AdapterFailure
  attemptedAt: string
  cacheUsed: boolean
}

export interface DecisionBrief {
  briefId: string
  pointId: string
  generatedAt: string
  items: InformationRecord[]
  sourceOutcomes: SourceOutcome[]
}

export type BriefCompleteness = 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE'
export interface BriefAssemblyOutcome { brief: DecisionBrief; completeness: BriefCompleteness }

export function createConfirmedRecord(input: Omit<InformationRecord, 'trustStatus' | 'statusReason'>): InformationRecord {
  const hasTraceableEvidence = input.value !== undefined && input.evidence.some((item) => item.sourceId && (item.basisTime || item.checkedAt))
  if (!hasTraceableEvidence) throw new Error('CONFIRMED requires a value, source, and applicable time evidence')
  return { ...input, trustStatus: 'CONFIRMED' }
}

export function validateRecord(record: InformationRecord): InformationRecord {
  if (record.trustStatus === 'CONFIRMED') return createConfirmedRecord(record)
  if (!record.statusReason) throw new Error(`${record.trustStatus} requires statusReason`)
  if (record.trustStatus === 'CONFLICT' && record.evidence.length < 2) throw new Error('CONFLICT requires at least two evidence records')
  return record
}

export function displayTime(record: InformationRecord): string {
  const evidence = record.evidence[0]
  return evidence?.basisTime ?? evidence?.checkedAt ?? '시각 확인 필요'
}
