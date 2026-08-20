export interface ScheduleReportPayload {
  frequency: string
  day: string
  time: string
  recipients: string[]
  subject: string
  body: string
}

export interface ScheduleReportDrawerProps {
  open: boolean
  title?: string
  initialFrequency?: string
  initialDay?: string
  initialTime?: string
  initialRecipients?: string[]
  initialSubject?: string
  initialBody?: string
  onClose: () => void
  onCreateSchedule: (payload: ScheduleReportPayload) => void
}
