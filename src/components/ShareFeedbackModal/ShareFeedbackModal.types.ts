export interface ShareFeedbackModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (details: string) => void
  /** Pre-fills the Add details textarea when the modal opens. */
  initialDetails?: string
}
