export interface EmailReportPayload {
  recipients: string[]
  subject: string
  body: string
}

export interface EmailReportDrawerProps {
  open: boolean
  title?: string
  initialRecipients?: string[]
  initialSubject?: string
  initialBody?: string
  onClose: () => void
  onSend: (payload: EmailReportPayload) => void
}
