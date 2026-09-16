import { expect, it } from 'vitest'
import { makeBrief } from '../../src/testing/fixtures/brief-scenarios'

it('zero restriction-like evidence remains unverified and never implies permission — TC-TRUST-005', () => {
  const outcome = makeBrief('sample-cache')
  const missingEvidence = outcome.brief.items.find((item) => item.trustStatus === 'UNVERIFIED')!
  expect(missingEvidence.statusReason).toMatch(/없습니다/)
  expect(JSON.stringify(missingEvidence)).not.toMatch(/낚시 가능|문제없음|법적으로 가능|추천/)
})
