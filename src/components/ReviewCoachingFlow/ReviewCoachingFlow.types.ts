import type { ReviewCoachingItem } from '../../data/reviewCoaching'

export interface ReviewCoachingFlowProps {
  item: ReviewCoachingItem
  /** A "nodes updated" row was clicked — open that node's panel on the canvas. */
  onOpenNode?: (nodeId: string) => void
  /** The user accepted or undid the fix (or chose to leave the workflow alone → 'rejected'). */
  onResolved?: (status: 'accepted' | 'rejected') => void
}
