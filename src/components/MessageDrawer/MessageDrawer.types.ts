export interface MessageDrawerProps {
  open: boolean
  patient: string
  status?: string
  initialChannel?: 'message' | 'email'
  onClose: () => void
}
