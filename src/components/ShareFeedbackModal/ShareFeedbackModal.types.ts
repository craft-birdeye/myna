/** Extra context passed alongside the feedback text — currently only populated by the `help` variant. */
export interface ShareFeedbackSubmitMeta {
  /** Whether the user joined the user experience improvement program (usage-data analytics opt-in). */
  optedIntoUxImprovement: boolean
  attachments: File[]
}

export interface ShareFeedbackModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (details: string, meta?: ShareFeedbackSubmitMeta) => void
  /** Pre-fills the feedback textarea when the modal opens. */
  initialDetails?: string
  /**
   * `coaching` — inbox / run-details thumbs-down (existing).
   * `help` — Help center Share feedback (Figma `16119:14085`).
   */
  variant?: 'coaching' | 'help'
  /**
   * `help` variant only — opens Settings > Account > User experience improvement
   * program (the opt-in checkbox's "Learn more" link).
   */
  onOpenUxImprovementSettings?: () => void
}
