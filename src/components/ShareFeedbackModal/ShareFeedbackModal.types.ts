export interface ShareFeedbackModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (details: string) => void
}
