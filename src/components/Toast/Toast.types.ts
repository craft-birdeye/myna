export interface ToastProps {
  message: string
  visible: boolean
  onClose: () => void
  /** Optional inline action (e.g. "Undo") shown between the message and the close button. */
  actionLabel?: string
  onAction?: () => void
  /** Appended to the root — use to override the default `top-6` on surfaces with their own top chrome. */
  className?: string
}
