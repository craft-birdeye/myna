export interface ScheduleDemoPanelProps {
  open: boolean
  onClose: () => void
  onScheduled?: (date: Date, time: string) => void
}
