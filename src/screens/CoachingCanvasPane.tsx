/**
 * What the workflow canvas's copilot panel shows during a coaching session — picked by the
 * coaching item's kind:
 *
 *   - review coaching (feedback on an agent-written review reply) → `ReviewCoachingFlow`,
 *     the scripted reason → ask → fix → Accept/Undo conversation;
 *   - a front desk recommendation / Inbox coaching item → the existing
 *     `RecommendationDetailScreen` chat, in its `docked` layout — exact same content the
 *     full-page view had, now beside the canvas.
 *
 * Mounted by `App` through `WorkflowEditorScreen`'s `aiBuilderPanelContent`.
 */
import { RecommendationDetailScreen } from './RecommendationDetailScreen'
import { ReviewCoachingFlow } from '../components/ReviewCoachingFlow/ReviewCoachingFlow'
import { useFeedbackRecommendationsStore } from '../data/FeedbackRecommendationsStoreContext'
import { useRecommendationOverridesStore } from '../data/RecommendationOverridesStoreContext'
import { RECOMMENDATIONS } from '../data/recommendationsData'
import { isReviewCoachingRecommendation, REVIEW_COACHING_SEEDS, toReviewCoachingItem } from '../data/reviewCoaching'

export interface CoachingSession {
  recommendationId: string
  instanceName: string
}

export function CoachingCanvasPane({
  session,
  onOpenNode,
  onClose,
}: {
  session: CoachingSession
  onOpenNode?: (nodeId: string) => void
  onClose: () => void
}) {
  const { feedbackRecommendations } = useFeedbackRecommendationsStore()
  const { setRecommendationStatus } = useRecommendationOverridesStore()
  const rec =
    feedbackRecommendations.find((r) => r.id === session.recommendationId) ??
    REVIEW_COACHING_SEEDS.find((r) => r.id === session.recommendationId) ??
    RECOMMENDATIONS.find((r) => r.id === session.recommendationId)

  if (rec && isReviewCoachingRecommendation(rec)) {
    return (
      <ReviewCoachingFlow
        key={rec.id}
        item={toReviewCoachingItem(rec)}
        onOpenNode={onOpenNode}
        onResolved={(status) => setRecommendationStatus(rec.id, status)}
      />
    )
  }
  return <RecommendationDetailScreen key={session.recommendationId} recommendationId={session.recommendationId} onBack={onClose} layout="docked" />
}
