import type { TestRunBatch } from '../GhostwriterTestRunPanel/GhostwriterTestRunPanel.types'

export interface GhostwriterTestRunReportProps {
  batch: TestRunBatch
  onBack: () => void
  /** "Accept" on a Recommendations-tab card calls this with the recommendation text; the
   *  caller switches to the Workflow tab and feeds it into the "Edit with AI" chat — same
   *  handler `TestBatchReviewsPanel`'s own Recommendations tab uses. */
  onAcceptRecommendation?: (text: string) => void
}
