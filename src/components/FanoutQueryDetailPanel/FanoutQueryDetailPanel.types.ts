import type { FanoutQueryStatus } from '../../data/fanoutQueriesData'

export interface FanoutQueryDetailPanelProps {
  open: boolean
  prompt: string
  fanoutQueries: string[]
  status: FanoutQueryStatus
  updatedBy: string
  updatedOn: string
  onClose: () => void
  onDownload?: () => void
  onEmail?: () => void
  onSchedule?: () => void
  onDelete?: () => void
}
