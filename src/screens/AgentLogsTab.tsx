import { Chip, DataTable, Tooltip, type ChipVariant, type Column } from '../components'
import {
  HEALTHCARE_LOGS_ROWS,
  PREVISIT_LOGS_ROWS,
  REMINDER_LOGS_ROWS,
  REVIEW_GENERATION_LOGS_ROWS,
  REVIEW_RESPONSE_LOGS_ROWS,
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
  Resolved: 'success',
  'Not resolved': 'danger',
}

/** Front desk exploration Logs tab — display labels only (underlying data stays Complete/Failed). */
const EXPLORATION_FRONTDESK_STATUS_LABEL: Record<string, string> = {
  Complete: 'Resolved',
  Failed: 'Not resolved',
  'In progress': 'In progress',
}

const EXPLORATION_NOT_RESOLVED_INTENTS = ['Aborted', 'Transferred to human'] as const

function mapExplorationFrontDeskStatus(status: string): string {
  return EXPLORATION_FRONTDESK_STATUS_LABEL[status] ?? status
}

/** Maps statuses + Not resolved intents; adds a second Not resolved row when needed. */
function withExplorationFrontDeskLogs(rows: HealthcareLogRow[]): HealthcareLogRow[] {
  let notResolvedIdx = 0
  const mapped = rows.map((row) => {
    const status = mapExplorationFrontDeskStatus(row.status)
    if (status !== 'Not resolved') return { ...row, status }
    const topic = EXPLORATION_NOT_RESOLVED_INTENTS[notResolvedIdx % EXPLORATION_NOT_RESOLVED_INTENTS.length]
    notResolvedIdx += 1
    return { ...row, status, topic }
  })

  if (notResolvedIdx === 1) {
    mapped.push({
      timestamp: 'Jan 22, 2024, 3:12 pm',
      status: 'Not resolved',
      contact: '+1 (415) 555-0142',
      channel: 'Voice call',
      duration: '2:18',
      topic: EXPLORATION_NOT_RESOLVED_INTENTS[1],
      implementedSteps: ['trigger'],
    })
  }

  return mapped
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

/** Front desk exploration — short AI-summary blurbs for Intent hover tooltips. */
const EXPLORATION_INTENT_SUMMARIES: Record<string, string> = {
  'Tooth pain screening':
    'Caller reported toothache and asked about same-day care. Agent screened for red flags and offered an urgent evaluation with next steps.',
  'New patient scheduling':
    'Caller booked a first visit. Agent collected preferred times and contact details, then held a slot and offered the intake packet.',
  'Appointment reschedule':
    'Caller moved an upcoming visit. Agent confirmed a new slot, cancelled the original appointment, and sent an updated confirmation.',
  'Insurance inquiry':
    'Caller asked about checkup coverage. Agent reviewed eligibility, explained likely copay, and noted remaining questions for billing follow-up.',
  Aborted:
    'Caller disconnected before the request was resolved. Partial intent was captured; no appointment or handoff was completed.',
  'Transferred to human':
    'Agent could not fully resolve the request and warm-transferred the caller with context packaged for a live representative.',
  'Emergency dental concern':
    'Caller described urgent dental pain. Agent screened for emergency signs and escalated when automated resolution was not appropriate.',
}

function explorationIntentSummary(intent: string): string {
  return (
    EXPLORATION_INTENT_SUMMARIES[intent] ??
    `Conversation focused on ${intent.toLowerCase()}. Agent gathered key details and guided the caller to next steps.`
  )
}

function ExplorationIntentCell({ intent }: { intent: string }) {
  const summary = explorationIntentSummary(intent)
  return (
    <Tooltip
      variant="detail"
      side="top"
      content={
        <div className="flex flex-col gap-xs text-left">
          <span>AI summary</span>
          <span>{summary}</span>
        </div>
      }
    >
      <span className="block truncate">{intent}</span>
    </Tooltip>
  )
}

const EXPLORATION_FRONTDESK_LOG_COLUMNS: Column<HealthcareLogRow>[] = [
  { key: 'timestamp', label: 'Timestamp', width: 220, sortable: true, render: TIMESTAMP_CELL },
  { key: 'contact', label: 'Contact', width: 180, sortable: true },
  { key: 'channel', label: 'Channel', width: 140, sortable: true },
  { key: 'duration', label: 'Duration', width: 120, sortable: true },
  {
    key: 'status',
    label: 'Status',
    width: 140,
    sortable: true,
    render: (v) => <Chip label={String(v)} variant={STATUS_VARIANT[String(v)] ?? 'neutral'} />,
  },
  {
    key: 'topic',
    label: 'Intent',
    width: 220,
    sortable: true,
    truncate: false,
    render: (v) => <ExplorationIntentCell intent={String(v ?? '')} />,
  },
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
  return HEALTHCARE_LOGS_ROWS
}

/**
 * Filter fields for the Logs tab, with options derived from the agent's own rows so the panel
 * can never offer a value that filters to nothing. Ids match the row keys they filter on.
 */
export function getLogFilterFields(agentName?: string, opts?: { explorationFrontDeskStatus?: boolean }) {
  const rows = logRowsForAgent(agentName)
  const distinct = (pick: (r: Record<string, unknown>) => unknown) =>
    Array.from(
      new Set(rows.map(pick).filter((v): v is string => typeof v === 'string' && v.length > 0)),
    ).sort()
  const asOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }))

  const statusValues = distinct((r) => r.status)
  const statusOptions = opts?.explorationFrontDeskStatus
    ? asOptions(statusValues.map(mapExplorationFrontDeskStatus))
    : asOptions(statusValues)

  return [
    { id: 'status', label: 'Status', options: statusOptions },
    // The two log shapes name this column `source` (reviews) or `channel` (conversations).
    {
      id: 'source',
      label: opts?.explorationFrontDeskStatus ? 'Channel' : 'Source',
      options: asOptions(distinct((r) => r.source ?? r.channel)),
    },
  ]
}

/**
 * Applies the header search + filter selections to a log table's rows.
 *
 * Search matches any string field on the row (contact, source, timestamp, …). Filters match by
 * key; a row missing the filtered key is left in rather than silently dropped. `source` also
 * checks `channel`, because the two log shapes name that column differently.
 */
export function applyLogFilters<T extends Record<string, unknown>>(
  rows: T[],
  query: string,
  filters: Record<string, string[]>,
  opts?: { explorationFrontDeskStatus?: boolean },
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
      const cellStr = String(cell)
      if (key === 'status' && opts?.explorationFrontDeskStatus) {
        return values.includes(mapExplorationFrontDeskStatus(cellStr))
      }
      return values.includes(cellStr)
    })
  })
}

/**
 * Healthcare log rows the run detail view can page through for this agent
 * (same set as the Logs table, after search/filters).
 */
export function getNavigableLogRows(
  agentName?: string,
  searchQuery = '',
  filters: Record<string, string[]> = {},
  opts?: { explorationFrontDeskStatus?: boolean },
): HealthcareLogRow[] {
  let rows: HealthcareLogRow[]
  if (agentName === 'Reminder agent') {
    rows = REMINDER_LOGS_ROWS
  } else if (agentName?.startsWith('Review response agent')) {
    rows = REVIEW_RESPONSE_LOGS_ROWS.map((r) => toHealthcareLogRow(r))
  } else if (agentName && /review generation agent/i.test(agentName)) {
    rows = REVIEW_GENERATION_LOGS_ROWS.map((r) => toReviewGenerationLogRow(r))
  } else if (
    agentName === 'Pre-visit agent'
    || agentName === 'Waitlist agent'
    || agentName === 'Tagging & routing agent'
  ) {
    // These tables don't open RunDetailView yet.
    return []
  } else {
    rows = HEALTHCARE_LOGS_ROWS
  }
  const filtered = applyLogFilters(rows, searchQuery, filters, opts)
  return opts?.explorationFrontDeskStatus
    ? withExplorationFrontDeskLogs(filtered)
    : filtered
}

interface AgentLogsTabProps {
  agentName?: string
  onNavigateToInbox?: (conversationId?: string) => void
  onViewRun?: (row: HealthcareLogRow) => void
  /** Header search query — matches any string field on a row. */
  searchQuery?: string
  /** Header filter selections, keyed by `LOG_FILTER_FIELDS` id. */
  filters?: Record<string, string[]>
  /** Front desk exploration only: Complete→Resolved, Failed→Not resolved. */
  explorationFrontDeskStatus?: boolean
}

export function AgentLogsTab({
  agentName,
  onViewRun,
  searchQuery = '',
  filters = {},
  explorationFrontDeskStatus = false,
}: AgentLogsTabProps) {
  /** Narrows a row set by the header search + filters. */
  const f = <T extends Record<string, unknown>>(rows: T[]) =>
    applyLogFilters(rows, searchQuery, filters, { explorationFrontDeskStatus })

  const mapStatus = (rows: HealthcareLogRow[]) =>
    explorationFrontDeskStatus ? withExplorationFrontDeskLogs(rows) : rows


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

  return (
    <>
      <div className="px-lg py-lg">
        <DataTable
          columns={explorationFrontDeskStatus ? EXPLORATION_FRONTDESK_LOG_COLUMNS : LOG_COLUMNS}
          data={mapStatus(f(agentName === 'Reminder agent' ? REMINDER_LOGS_ROWS : HEALTHCARE_LOGS_ROWS) as HealthcareLogRow[])}
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
