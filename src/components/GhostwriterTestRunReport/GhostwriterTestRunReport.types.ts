import type { Review } from '../../data/reviewsData'
import type { TestRunBatch } from '../GhostwriterTestRunPanel/GhostwriterTestRunPanel.types'

export interface GhostwriterTestRunReportProps {
  batch: TestRunBatch
  onBack: () => void
  /** "Accept" on a Recommendations-tab card calls this with the recommendation text; the
   *  caller switches to the Workflow tab and feeds it into the "Edit with AI" chat — same
   *  handler `TestBatchReviewsPanel`'s own Recommendations tab uses. */
  onAcceptRecommendation?: (text: string) => void
  /** A row in the Details table. The caller leaves this page and shows that review's finished
   *  run on the canvas, with Details and Preview on the right. */
  onSelectReview: (review: Review) => void
}
