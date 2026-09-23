import type { Review } from '../../data/reviewsData'

export interface GhostwriterRunTestModalProps {
  open: boolean
  reviews: Review[]
  selectedIds: string[]
  onToggleReview: (id: string) => void
  onCancel: () => void
  /** `source` says which tab was active when confirmed — 'reviews' (the multi-select list,
   *  the only path when `showUploadTab` is false) or 'upload' (the dummy-file path). */
  onRunTest: (source: 'reviews' | 'upload') => void
  /** 23 Sep only — adds the Reviews/Upload tabs above the picker. Defaults to false so Jay &
   *  Robin's modal is unchanged (reviews-only, no tabs). */
  showUploadTab?: boolean
}
