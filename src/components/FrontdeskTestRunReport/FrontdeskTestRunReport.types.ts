import type { FrontdeskTestBatch } from '../../data/frontdeskTestSessions'

export interface FrontdeskTestRunReportProps {
  batch: FrontdeskTestBatch
  onBack: () => void
  /** "Accept" on a Recommendations-tab card calls this with the recommendation text — same
   *  convention as `GhostwriterTestRunReport`'s matching prop, left as a no-op if the caller
   *  has nowhere to feed it yet. */
  onAcceptRecommendation?: (text: string) => void
}
