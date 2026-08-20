export interface ConfirmDeleteModalProps {
  open: boolean
  title?: string
  description?: string
  onCancel: () => void
  onConfirm: () => void
}
