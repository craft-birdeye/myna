export interface ShareFeedbackModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (details: string) => void
  /** Pre-fills the feedback textarea when the modal opens. */
  initialDetails?: string
  /**
   * `coaching` — inbox / run-details thumbs-down (existing).
   * `help` — Help center Share feedback (Figma `16119:14085`).
   */
  variant?: 'coaching' | 'help'
}
