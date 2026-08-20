import { useMemo, useState } from 'react'
import { ListFilter, MoreVertical } from 'lucide-react'
import {
  Chip,
  ChipOverflowCell,
  ConfirmDeleteModal,
  DataTable,
  EmailReportDrawer,
  FanoutQueryDetailPanel,
  FilterPanel,
  HeaderSearchField,
  ScheduleReportDrawer,
  type ChipVariant,
  type Column,
  type FilterField,
} from '../components'
import { RunPromptDrawer } from './RunPromptDrawer'
import { FANOUT_QUERIES, type FanoutQueryRow, type FanoutQueryStatus } from '../data/fanoutQueriesData'

const STATUS_VARIANT: Record<FanoutQueryStatus, ChipVariant> = {
  Completed: 'success',
  Running: 'info',
  Failed: 'danger',
}

const FILTER_FIELDS: FilterField[] = [
  {
    id: 'updated-by',
    label: 'Updated by',
    options: Array.from(new Set(FANOUT_QUERIES.map((r) => r.updatedBy))).map((v) => ({ value: v, label: v })),
  },
  {
    id: 'status',
    label: 'Status',
    options: (['Completed', 'Running', 'Failed'] as FanoutQueryStatus[]).map((v) => ({ value: v, label: v })),
  },
]

/** Targets an Email/Schedule/Delete action applies to — either one row or every filtered row
 *  (header "More actions"). */
type ActionTarget = { kind: 'row'; row: FanoutQueryRow } | { kind: 'all'; rows: FanoutQueryRow[] }

/** Search AI → Actions → Fanout queries — every past Query fanout agent run, searchable and
 *  re-runnable. Shell copied from `ServiceRequestsScreen`'s header pattern (CLAUDE.md §6.7). */
export function FanoutQueriesScreen() {
  const [rows, setRows] = useState<FanoutQueryRow[]>(FANOUT_QUERIES)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [moreActionsOpen, setMoreActionsOpen] = useState(false)
  const [runPromptOpen, setRunPromptOpen] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<ActionTarget | null>(null)
  const [emailTarget, setEmailTarget] = useState<ActionTarget | null>(null)
  const [scheduleTarget, setScheduleTarget] = useState<ActionTarget | null>(null)

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.prompt.toLowerCase().includes(q) ||
        r.fanoutQueries.some((fq) => fq.toLowerCase().includes(q)),
    )
  }, [rows, searchQuery])

  function targetSubject(target: ActionTarget) {
    return target.kind === 'row' ? `Fanout query report - ${target.row.prompt}` : 'Fanout queries report'
  }

  function targetRows(target: ActionTarget) {
    return target.kind === 'row' ? [target.row] : target.rows
  }

  function deleteTargetRows(target: ActionTarget) {
    const ids = new Set(targetRows(target).map((r) => r.id))
    setRows((prev) => prev.filter((r) => !ids.has(r.id)))
    if (selectedRowId && ids.has(selectedRowId)) setSelectedRowId(null)
  }

  const columns: Column<FanoutQueryRow>[] = [
    { key: 'prompt', label: 'User prompt', width: 320, sortable: true },
    {
      key: 'fanoutQueries',
      label: 'Fanout queries',
      width: 320,
      render: (value) => <ChipOverflowCell labels={value as string[]} />,
    },
    {
      key: 'status',
      label: 'Status',
      width: 120,
      sortable: true,
      render: (value) => <Chip label={value as string} variant={STATUS_VARIANT[value as FanoutQueryStatus]} />,
    },
    { key: 'updatedBy', label: 'Updated by', width: 160, sortable: true },
    { key: 'updatedOn', label: 'Updated on', width: 160, sortable: true },
  ]

  const selectedRow = selectedRowId ? rows.find((r) => r.id === selectedRowId) ?? null : null

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
        <h1 className="text-h3 text-text-primary">Fanout queries</h1>
        <div className="flex items-center gap-sm">
          <HeaderSearchField open={searchOpen} value={searchQuery} onOpenChange={setSearchOpen} onChange={setSearchQuery} />
          <button
            type="button"
            onClick={() => setRunPromptOpen(true)}
            className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
          >
            Run new prompt
          </button>
          <div className="relative">
            <button
              type="button"
              aria-label="More actions"
              aria-expanded={moreActionsOpen}
              onClick={() => setMoreActionsOpen((o) => !o)}
              className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
            >
              <MoreVertical className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
            </button>
            {moreActionsOpen && (
              <>
                <div className="fixed inset-0 z-[105]" onClick={() => setMoreActionsOpen(false)} aria-hidden />
                <div className="absolute right-0 top-full z-[110] mt-xs min-w-[168px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
                  <button type="button" className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover" onClick={() => setMoreActionsOpen(false)}>
                    Download
                  </button>
                  <button
                    type="button"
                    className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                    onClick={() => { setMoreActionsOpen(false); setEmailTarget({ kind: 'all', rows: filteredRows }) }}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                    onClick={() => { setMoreActionsOpen(false); setScheduleTarget({ kind: 'all', rows: filteredRows }) }}
                  >
                    Schedule
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            aria-label="Filters"
            onClick={() => setFilterOpen((o) => !o)}
            className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
          >
            <ListFilter className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto px-lg py-lg">
          <DataTable<FanoutQueryRow>
            columns={columns}
            data={filteredRows}
            onRowClick={(row) => setSelectedRowId(row.id)}
            rowMenuItems={[
              { label: 'Download', onClick: () => {} },
              { label: 'Email', onClick: (row) => setEmailTarget({ kind: 'row', row }) },
              { label: 'Schedule', onClick: (row) => setScheduleTarget({ kind: 'row', row }) },
              { label: 'Delete', variant: 'danger', onClick: (row) => setDeleteTarget({ kind: 'row', row }) },
            ]}
          />
        </div>

        <FilterPanel open={filterOpen} fields={FILTER_FIELDS} onClose={() => setFilterOpen(false)} />
      </div>

      <RunPromptDrawer
        open={runPromptOpen}
        history={rows.map((r) => r.prompt)}
        onClose={() => setRunPromptOpen(false)}
        onRun={(prompt) => {
          setRows((prev) => [
            {
              id: `fq-${prev.length + 1}-${prev.length}`,
              prompt,
              fanoutQueries: [],
              status: 'Running',
              updatedBy: 'You',
              updatedOn: 'Just now',
            },
            ...prev,
          ])
          setRunPromptOpen(false)
        }}
      />

      {selectedRow && (
        <FanoutQueryDetailPanel
          open={Boolean(selectedRow)}
          prompt={selectedRow.prompt}
          fanoutQueries={selectedRow.fanoutQueries}
          status={selectedRow.status}
          updatedBy={selectedRow.updatedBy}
          updatedOn={selectedRow.updatedOn}
          onClose={() => setSelectedRowId(null)}
          onEmail={() => setEmailTarget({ kind: 'row', row: selectedRow })}
          onSchedule={() => setScheduleTarget({ kind: 'row', row: selectedRow })}
          onDelete={() => setDeleteTarget({ kind: 'row', row: selectedRow })}
        />
      )}

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        title={deleteTarget?.kind === 'all' ? `Delete ${targetRows(deleteTarget).length} fanout query runs?` : 'Delete this fanout query run?'}
        description="This action cannot be undone."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteTargetRows(deleteTarget)
          setDeleteTarget(null)
        }}
      />

      {emailTarget && (
        <EmailReportDrawer
          open={emailTarget !== null}
          initialSubject={targetSubject(emailTarget)}
          initialBody={`Your fanout query report (${targetRows(emailTarget).length} run${targetRows(emailTarget).length === 1 ? '' : 's'}) is ready for your review.`}
          onClose={() => setEmailTarget(null)}
          onSend={() => setEmailTarget(null)}
        />
      )}

      {scheduleTarget && (
        <ScheduleReportDrawer
          open={scheduleTarget !== null}
          initialSubject={targetSubject(scheduleTarget)}
          initialBody={`Your fanout query report (${targetRows(scheduleTarget).length} run${targetRows(scheduleTarget).length === 1 ? '' : 's'}) is now ready for your review.`}
          onClose={() => setScheduleTarget(null)}
          onCreateSchedule={() => setScheduleTarget(null)}
        />
      )}
    </div>
  )
}
