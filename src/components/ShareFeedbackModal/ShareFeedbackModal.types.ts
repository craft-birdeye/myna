/** Extra context passed alongside the feedback text — currently only populated by the `help` variant. */
export interface ShareFeedbackSubmitMeta {
  /** Whether the user is OK with Birdeye replying/following up on this feedback. */
  canReplyToFeedback: boolean
  /** Whether the user wants to be considered for product research. */
  wantsProductResearch: boolean
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
   * `help` variant only — opens Settings > Account > Product research (the
   * "I'd like to participate in product research" checkbox's "Learn more" link).
   */
  onOpenProductResearchSettings?: () => void
}
