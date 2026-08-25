/** Extra context passed alongside the feedback text — currently only populated by the `help` variant. */
export interface ShareFeedbackSubmitMeta {
  /** Whether the user opted in to being contacted for future user research. */
  optedIntoResearch: boolean
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
}
