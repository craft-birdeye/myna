import { Chip, DataTable, type ChipVariant, type Column } from '../components'
import {
  DOMAIN_HEALTH_LOGS_ROWS,
  FANOUT_LOGS_ROWS,
  HEALTHCARE_LOGS_ROWS,
  PREVISIT_LOGS_ROWS,
  REMINDER_LOGS_ROWS,
  REVIEW_GENERATION_LOGS_ROWS,
  REVIEW_RESPONSE_LOGS_ROWS,
  toDomainHealthLogRow,
  toFanoutLogRow,
  toHealthcareLogRow,
  toReviewGenerationLogRow,
  type HealthcareLogRow,
  type PrevisitLogRow,
  type ReviewResponseLogRow,
} from '../data/healthcareAgentLogs'

const STATUS_VARIANT: Record<string, ChipVariant> = {
  Complete: 'success',
  Failed: 'danger',
  'In progress': 'warning',
}

const TIMESTAMP_CELL = (v: unknown) => <span className="group-hover/row:text-text-action">{String(v)}</span>

const LOG_COLUMNS: Column<HealthcareLogRow>[] = [
  { key: 'timestamp', label: 'Timestamp', width: 220, sortable: true, render: TIMESTAMP_CELL },
  {
    key: 'status',
    label: 'Status',
    width: 130,
    sortable: true,
    render: (v) => <Chip label={String(v)} variant={STATUS_VARIANT[String(v)] ?? 'neutral'} />,
  },
  { key: 'contact', label: 'Contact', width: 200, sortable: true },
  { key: 'channel', label: 'Source', width: 120, sortable: true },
]

const REMINDER_LOG_COLUMNS: Column<HealthcareLogRow>[] = [
  { key: 'timestamp', label: 'Timestamp', width: 220, sortable: true, render: TIMESTAMP_CELL },
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
  { key: 'timestamp', label: 'Timestamp', width: 220, sortable: true, render: TIMESTAMP_CELL },
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
  { key: 'timestamp', label: 'Timestamp', width: 240, sortable: true, render: TIMESTAMP_CELL },
  {
    key: 'status',
    label: 'Status',
    width: 140,
    sortable: true,
    render: (v) => <Chip label={String(v)} variant={PREVISIT_STATUS_VARIANT[String(v)] ?? 'neutral'} />,
  },
  { key: 'contact', label: 'Contact', width: 220, sortable: true },
]

// Query fanout / Domain health are on-demand or scheduled task runs, not conversations — there's
// no contact or channel/source to show, just when the run happened and how it went.
const SEARCH_AI_LOG_COLUMNS: Column<HealthcareLogRow>[] = [
  { key: 'timestamp', label: 'Timestamp', width: 240, sortable: true, render: TIMESTAMP_CELL },
  {
    key: 'status',
    label: 'Status',
    width: 140,
    sortable: true,
    render: (v) => <Chip label={String(v)} variant={STATUS_VARIANT[String(v)] ?? 'neutral'} />,
  },
]

/**
 * Rows this agent's Logs tab shows. Mirrors the branch order in `AgentLogsTab` below — keep the
 * two in step if a new agent branch is added.
 */
function logRowsForAgent(agentName?: string): Record<string, unknown>[] {
  if (agentName === 'Reminder agent') return REMINDER_LOGS_ROWS
  if (agentName?.startsWith('Review response agent')) return REVIEW_RESPONSE_LOGS_ROWS
  if (agentName && /review generation agent/i.test(agentName)) return REVIEW_GENERATION_LOGS_ROWS
  if (agentName === 'Pre-visit agent' || agentName === 'Waitlist agent') return PREVISIT_LOGS_ROWS
  if (agentName === 'Tagging & routing agent') return PREVISIT_LOGS_ROWS
  if (agentName === 'Query fanout agent') return FANOUT_LOGS_ROWS
  if (agentName === 'Domain health agent') return DOMAIN_HEALTH_LOGS_ROWS
  return HEALTHCARE_LOGS_ROWS
}

/**
 * Filter fields for the Logs tab, with options derived from the agent's own rows so the panel
 * can never offer a value that filters to nothing. Ids match the row keys they filter on.
 */
export function getLogFilterFields(agentName?: string) {
  const rows = logRowsForAgent(agentName)
  const distinct = (pick: (r: Record<string, unknown>) => unknown) =>
    Array.from(
      new Set(rows.map(pick).filter((v): v is string => typeof v === 'string' && v.length > 0)),
    ).sort()
  const asOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }))

  return [
    { id: 'status', label: 'Status', options: asOptions(distinct((r) => r.status)) },
    // The two log shapes name this column `source` (reviews) or `channel` (conversations).
    { id: 'source', label: 'Source', options: asOptions(distinct((r) => r.source ?? r.channel)) },
  ]
}

/**
 * Applies the header search + filter selections to a log table's rows.
 *
 * Search matches any string field on the row (contact, source, timestamp, …). Filters match by
 * key; a row missing the filtered key is left in rather than silently dropped. `source` also
 * checks `channel`, because the two log shapes name that column differently.
 */
function applyLogFilters<T extends Record<string, unknown>>(
  rows: T[],
  query: string,
  filters: Record<string, string[]>,
): T[] {
  const q = query.trim().toLowerCase()
  return rows.filter((row) => {
    if (q && !Object.values(row).some((v) => typeof v === 'string' && v.toLowerCase().includes(q))) {
      return false
    }
    return Object.entries(filters).every(([key, values]) => {
      if (!values?.length) return true
      const cell = key === 'source' ? (row.source ?? row.channel) : row[key]
      if (cell == null) return true
      return values.includes(String(cell))
    })
  })
}

interface AgentLogsTabProps {
  agentName?: string
  onNavigateToInbox?: (conversationId?: string) => void
  onViewRun?: (row: HealthcareLogRow) => void
  /** Header search query — matches any string field on a row. */
  searchQuery?: string
  /** Header filter selections, keyed by `LOG_FILTER_FIELDS` id. */
  filters?: Record<string, string[]>
}

export function AgentLogsTab({ agentName, onViewRun, searchQuery = '', filters = {} }: AgentLogsTabProps) {
  /** Narrows a row set by the header search + filters. */
  const f = <T extends Record<string, unknown>>(rows: T[]) => applyLogFilters(rows, searchQuery, filters)


  if (agentName === 'Reminder agent') {
    return (
      <div className="px-lg py-lg">
        <DataTable
          columns={REMINDER_LOG_COLUMNS}
          data={f(REMINDER_LOGS_ROWS)}
          onRowClick={(row) => onViewRun?.(row as HealthcareLogRow)}
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
          data={f(REVIEW_RESPONSE_LOGS_ROWS)}
          rowAction={{
            icon: 'visibility',
            label: 'View log',
            onClick: (row) => onViewRun?.(toHealthcareLogRow(row as ReviewResponseLogRow)),
          }}
        />
      </div>
    )
  }

  if (agentName && /review generation agent/i.test(agentName)) {
    return (
      <div className="px-lg py-lg">
        <DataTable
          columns={REVIEW_RESPONSE_LOG_COLUMNS}
          data={f(REVIEW_GENERATION_LOGS_ROWS)}
          rowAction={{
            icon: 'visibility',
            label: 'View log',
            onClick: (row) => onViewRun?.(toReviewGenerationLogRow(row as ReviewResponseLogRow)),
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
          data={f(PREVISIT_LOGS_ROWS)}
          rowAction={{ icon: 'visibility', label: 'View log', onClick: () => {} }}
        />
      </div>
    )
  }

  if (agentName === 'Tagging & routing agent') {
    return (
      <div className="px-lg py-lg">
        <DataTable
          columns={TAGGING_ROUTING_LOG_COLUMNS}
          data={f(PREVISIT_LOGS_ROWS)}
          rowAction={{ icon: 'visibility', label: 'View details', onClick: () => {} }}
        />
      </div>
    )
  }

  if (agentName === 'Query fanout agent') {
    return (
      <div className="px-lg py-lg">
        <DataTable
          columns={SEARCH_AI_LOG_COLUMNS}
          data={f(FANOUT_LOGS_ROWS.map(toFanoutLogRow))}
          onRowClick={(row) => onViewRun?.(row as HealthcareLogRow)}
          rowAction={{
            icon: 'visibility',
            label: 'View run',
            onClick: (row) => onViewRun?.(row as HealthcareLogRow),
          }}
        />
      </div>
    )
  }

  if (agentName === 'Domain health agent') {
    return (
      <div className="px-lg py-lg">
        <DataTable
          columns={SEARCH_AI_LOG_COLUMNS}
          data={f(DOMAIN_HEALTH_LOGS_ROWS.map(toDomainHealthLogRow))}
          onRowClick={(row) => onViewRun?.(row as HealthcareLogRow)}
          rowAction={{
            icon: 'visibility',
            label: 'View run',
            onClick: (row) => onViewRun?.(row as HealthcareLogRow),
          }}
        />
      </div>
    )
  }

  return (
    <>
      <div className="px-lg py-lg">
        <DataTable
          columns={LOG_COLUMNS}
          data={f(agentName === 'Reminder agent' ? REMINDER_LOGS_ROWS : HEALTHCARE_LOGS_ROWS)}
          onRowClick={(row) => onViewRun?.(row as HealthcareLogRow)}
          rowAction={{
            icon: 'visibility',
            label: 'View log',
            onClick: (row) => onViewRun?.(row as HealthcareLogRow),
          }}
        />
      </div>
    </>
  )
}
