import { Chip, DataTable, type ChipVariant, type Column } from '../components'
import { type OutboundLogRow } from '../data/dentalOutboundLogs'

const STATUS_VARIANT: Record<string, ChipVariant> = {
  Complete:    'success',
  Failed:      'danger',
  'In progress': 'warning',
}

const LOG_COLUMNS: Column<OutboundLogRow>[] = [
  {
    key: 'timestamp',
    label: 'Timestamp',
    width: 240,
    sortable: true,
    render: (v) => <span className="group-hover/row:text-text-action">{String(v)}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    width: 140,
    sortable: true,
    render: (v) => <Chip label={String(v)} variant={STATUS_VARIANT[String(v)] ?? 'neutral'} />,
  },
  { key: 'contact', label: 'Contact', width: 220, sortable: true },
  { key: 'channel', label: 'Channel', width: 120, sortable: true },
]

export function OutboundAgentLogsTab({ rows }: { rows: OutboundLogRow[] }) {
  return (
    <div className="px-lg py-lg">
      <DataTable
        columns={LOG_COLUMNS}
        data={rows}
        scrollOnHover
        rowAction={{
          icon: 'visibility',
          label: 'View log',
          onClick: () => {},
        }}
      />
    </div>
  )
}
