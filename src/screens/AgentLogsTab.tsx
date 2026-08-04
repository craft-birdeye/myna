import { Chip, DataTable, type ChipVariant, type Column } from '../components'
import {
  HEALTHCARE_LOGS_ROWS,
  PREVISIT_LOGS_ROWS,
  REMINDER_LOGS_ROWS,
  REVIEW_RESPONSE_LOGS_ROWS,
  toHealthcareLogRow,
  type HealthcareLogRow,
  type PrevisitLogRow,
  type ReviewResponseLogRow,
} from '../data/healthcareAgentLogs'

const STATUS_VARIANT: Record<string, ChipVariant> = {
  Complete: 'success',
  Failed: 'danger',
  'In progress': 'warning',
}

const LOG_COLUMNS: Column<HealthcareLogRow>[] = [
  { key: 'timestamp', label: 'Timestamp', width: 220, sortable: true },
  {
    key: 'status',
    label: 'Status',
    width: 130,
    sortable: true,
    render: (v) => <Chip label={String(v)} variant={STATUS_VARIANT[String(v)] ?? 'neutral'} />,
  },
  { key: 'contact', label: 'Contact', width: 200, sortable: true },
  { key: 'channel', label: 'Channel', width: 120, sortable: true },
  { key: 'duration', label: 'Duration', width: 110, sortable: true },
  { key: 'topic', label: 'Topic', width: 220, sortable: true },
]

const REMINDER_LOG_COLUMNS: Column<HealthcareLogRow>[] = [
  { key: 'timestamp', label: 'Timestamp', width: 220, sortable: true },
  {
    key: 'status',
    label: 'Status',
    width: 140,
    sortable: true,
    render: (v) => <Chip label={String(v)} variant={STATUS_VARIANT[String(v)] ?? 'neutral'} />,
  },
  { key: 'contact', label: 'Contact', width: 220, sortable: true },
  { key: 'channel', label: 'Channel', width: 180, sortable: true },
]

const REVIEW_RESPONSE_LOG_COLUMNS: Column<ReviewResponseLogRow>[] = [
  { key: 'timestamp', label: 'Timestamp', width: 220, sortable: true },
  {
    key: 'status',
    label: 'Status',
    width: 140,
    sortable: true,
    render: (v) => <Chip label={String(v)} variant={STATUS_VARIANT[String(v)] ?? 'neutral'} />,
  },
  { key: 'contact', label: 'Contact', width: 220, sortable: true },
  { key: 'source', label: 'Source', width: 180, sortable: true },
]

const PREVISIT_STATUS_VARIANT: Record<string, ChipVariant> = {
  Complete: 'success',
  Failed: 'danger',
  'In progress': 'warning',
}

const PREVISIT_COLUMNS: Column<PrevisitLogRow>[] = [
  { key: 'timestamp', label: 'Timestamp', width: 220, sortable: true },
  {
    key: 'status',
    label: 'Status',
    width: 140,
    sortable: true,
    render: (v) => (
      <Chip label={String(v)} variant={PREVISIT_STATUS_VARIANT[String(v)] ?? 'neutral'} />
    ),
  },
  { key: 'contact', label: 'Contact', width: 200, sortable: true },
  { key: 'channel', label: 'Channel', width: 120, sortable: true },
  { key: 'duration', label: 'Duration', width: 110, sortable: true },
]

const TAGGING_ROUTING_LOG_COLUMNS: Column<PrevisitLogRow>[] = [
  { key: 'timestamp', label: 'Timestamp', width: 240, sortable: true },
  {
    key: 'status',
    label: 'Status',
    width: 140,
    sortable: true,
    render: (v) => <Chip label={String(v)} variant={PREVISIT_STATUS_VARIANT[String(v)] ?? 'neutral'} />,
  },
  { key: 'contact', label: 'Contact', width: 220, sortable: true },
]

interface AgentLogsTabProps {
  agentName?: string
  onNavigateToInbox?: (conversationId?: string) => void
  onViewRun?: (row: HealthcareLogRow) => void
}

export function AgentLogsTab({ agentName, onViewRun }: AgentLogsTabProps) {
  if (agentName === 'Reminder agent') {
    return (
      <div className="px-lg py-lg">
        <DataTable
          columns={REMINDER_LOG_COLUMNS}
          data={REMINDER_LOGS_ROWS}
          rowAction={{
            icon: 'visibility',
            label: 'View run',
            onClick: (row) => onViewRun?.(row as HealthcareLogRow),
          }}
        />
      </div>
    )
  }

  if (agentName?.startsWith('Review response agent')) {
    return (
      <div className="px-lg py-lg">
        <DataTable
          columns={REVIEW_RESPONSE_LOG_COLUMNS}
          data={REVIEW_RESPONSE_LOGS_ROWS}
          rowAction={{
            icon: 'visibility',
            label: 'View log',
            onClick: (row) => onViewRun?.(toHealthcareLogRow(row as ReviewResponseLogRow)),
          }}
        />
      </div>
    )
  }

  if (agentName === 'Pre-visit agent' || agentName === 'Waitlist agent') {
    return (
      <div className="px-lg py-lg">
        <DataTable
          columns={PREVISIT_COLUMNS}
          data={PREVISIT_LOGS_ROWS}
          rowAction={{ icon: 'visibility', label: 'View run', onClick: () => {} }}
        />
      </div>
    )
  }

  if (agentName === 'Tagging & routing agent') {
    return (
      <div className="px-lg py-lg">
        <DataTable
          columns={TAGGING_ROUTING_LOG_COLUMNS}
          data={PREVISIT_LOGS_ROWS}
          rowAction={{ icon: 'visibility', label: 'View details', onClick: () => {} }}
        />
      </div>
    )
  }

  return (
    <>
      <div className="px-lg py-lg">
        <DataTable
          columns={LOG_COLUMNS}
          data={HEALTHCARE_LOGS_ROWS}
          rowAction={{
            icon: 'visibility',
            label: 'View run',
            onClick: (row) => onViewRun?.(row as HealthcareLogRow),
          }}
        />
      </div>
    </>
  )
}
