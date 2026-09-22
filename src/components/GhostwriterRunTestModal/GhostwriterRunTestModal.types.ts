import type { Review } from '../../data/reviewsData'

export interface GhostwriterRunTestModalProps {
  open: boolean
  reviews: Review[]
  selectedIds: string[]
  onToggleReview: (id: string) => void
  onCancel: () => void
  onRunTest: () => void
}
