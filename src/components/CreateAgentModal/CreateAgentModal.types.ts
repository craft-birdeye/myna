export interface CreateAgentModalProps {
  open: boolean
  onClose: () => void
  /** Fired when the user picks a product and clicks Proceed. */
  onProceed: (productId: string, productLabel: string) => void
}
