import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { TopNav, Icon, HeaderSearchField } from '../components'

// Uploaded procedure.svg icon
function ProcedureBookIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19.7996 6.30078H14.3996C13.9339 6.30078 13.4745 6.40922 13.058 6.6175C12.6414 6.82578 12.279 7.12819 11.9996 7.50078C11.7202 7.12819 11.3578 6.82578 10.9412 6.6175C10.5247 6.40922 10.0653 6.30078 9.59961 6.30078H4.19961C4.04048 6.30078 3.88787 6.364 3.77535 6.47652C3.66282 6.58904 3.59961 6.74165 3.59961 6.90078V17.7008C3.59961 17.8599 3.66282 18.0125 3.77535 18.125C3.88787 18.2376 4.04048 18.3008 4.19961 18.3008H9.59961C10.077 18.3008 10.5348 18.4904 10.8724 18.828C11.21 19.1656 11.3996 19.6234 11.3996 20.1008C11.3996 20.2599 11.4628 20.4125 11.5753 20.525C11.6879 20.6376 11.8405 20.7008 11.9996 20.7008C12.1587 20.7008 12.3114 20.6376 12.4239 20.525C12.5364 20.4125 12.5996 20.2599 12.5996 20.1008C12.5996 19.6234 12.7893 19.1656 13.1268 18.828C13.4644 18.4904 13.9222 18.3008 14.3996 18.3008H19.7996C19.9587 18.3008 20.1114 18.2376 20.2239 18.125C20.3364 18.0125 20.3996 17.8599 20.3996 17.7008V6.90078C20.3996 6.74165 20.3364 6.58904 20.2239 6.47652C20.1114 6.364 19.9587 6.30078 19.7996 6.30078ZM9.59961 17.1008H4.79961V7.50078H9.59961C10.077 7.50078 10.5348 7.69042 10.8724 8.02799C11.21 8.36555 11.3996 8.82339 11.3996 9.30078V17.7008C10.8808 17.3104 10.2489 17.0997 9.59961 17.1008ZM19.1996 17.1008H14.3996C13.7503 17.0997 13.1184 17.3104 12.5996 17.7008V9.30078C12.5996 8.82339 12.7893 8.36555 13.1268 8.02799C13.4644 7.69042 13.9222 7.50078 14.3996 7.50078H19.1996V17.1008Z" fill="currentColor"/>
    </svg>
  )
}
function ThreeDotMenu({ onDuplicate, onDelete }: { onDuplicate: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (!btnRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation()
    const rect = btnRef.current!.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setOpen((v) => !v)
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="flex size-6 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-selected"
      >
        <Icon name="more_vert" size={16} />
      </button>
      {open && createPortal(
        <div
          style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 99999 }}
          className="min-w-[140px] rounded-sm border border-border bg-surface py-xs shadow-dropdown"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button type="button" className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover" onClick={() => { setOpen(false); onDuplicate() }}>Duplicate</button>
          <button type="button" className="block w-full px-md py-sm text-left text-body text-chip-danger-text hover:bg-surface-hover" onClick={() => { setOpen(false); onDelete() }}>Delete</button>
        </div>,
        document.body
      )}
    </div>
  )
}

import { useProcedureStore } from '../data/ProcedureStoreContext'
import { type Procedure } from '../data/procedureData'
import { ProcedureDetailScreen } from './ProcedureDetailScreen'
import { DataTable, FilterPanel, Toast } from '../components'
import type { Column } from '../components/DataTable/DataTable.types'

type ViewMode = 'grid' | 'list'

const HC_PROCEDURE_IDS = new Set([
  'hc-fd-02', 'hc-fd-05', 'hc-fd-06', 'hc-fd-11', 'hc-fd-12', 'hc-wl-01', 'hc-pv-01',
])

export function ProceduresScreen({ product = 'automotive' }: { product?: string }) {
  const { procedures, addProcedure, deleteProcedure } = useProcedureStore()
  const allProcedures = procedures.filter((p) => {
    if (product === 'dental') return HC_PROCEDURE_IDS.has(p.id) || p.category === 'Dental'
    if (product === 'healthcare') return HC_PROCEDURE_IDS.has(p.id)
    return !p.category.startsWith('Healthcare') && p.category !== 'Dental'
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<ViewMode>('grid')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterSelections, setFilterSelections] = useState<Record<string, string[]>>({})
  // null = list view; a Procedure = editing existing; 'new' = create flow.
  const [editing, setEditing] = useState<Procedure | 'new' | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  if (editing) {
    return (
      <ProcedureDetailScreen
        procedure={editing === 'new' ? null : editing}
        onBack={() => setEditing(null)}
        onSaved={(isNew) => {
          setToastMessage(isNew ? 'Procedure created' : 'Procedure updated')
          setToastVisible(true)
        }}
        product={product}
      />
    )
  }

  const q = searchQuery.trim().toLowerCase()

  // Parse "Mon YYYY" strings like "Jun 2025" → Date for time-period filtering
  function parseLastEdited(s: string): Date {
    const d = new Date(s)
    return isNaN(d.getTime()) ? new Date(0) : d
  }

  const now = new Date()
  const TIME_CUTOFFS: Record<string, Date> = {
    'Last 7 days':  new Date(now.getTime() - 7  * 86400000),
    'Last 30 days': new Date(now.getTime() - 30 * 86400000),
    'Last 90 days': new Date(now.getTime() - 90 * 86400000),
    'Last year':    new Date(now.getTime() - 365 * 86400000),
  }

  const selectedTypes   = filterSelections['type']   ?? []
  const selectedPeriods = filterSelections['period'] ?? []

  const visibleProcedures = (!q
    ? allProcedures
    : allProcedures.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      )
  ).filter((p) => {
    if (selectedTypes.length > 0 && !selectedTypes.includes(p.queue)) return false
    if (selectedPeriods.length > 0) {
      const edited = parseLastEdited(p.lastEdited)
      const matches = selectedPeriods.some((label) => {
        const cutoff = TIME_CUTOFFS[label]
        return cutoff ? edited >= cutoff : true
      })
      if (!matches) return false
    }
    return true
  }).slice().sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex min-h-0 flex-1">
      <div className="flex flex-1 flex-col overflow-auto bg-surface">
        {/* Header — matches the Human actions header bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
          <h1 className="text-h3 text-text-primary">Procedures</h1>

          <div className="flex items-center gap-sm">
            <HeaderSearchField open={searchOpen} value={searchQuery} onOpenChange={setSearchOpen} onChange={setSearchQuery} placeholder="Search procedures..." />

            {/* View toggle — same chrome as PageHeader's ViewToggle */}
            <div className="flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface px-sm">
              <button
                type="button"
                aria-label="Grid view"
                onClick={() => setView('grid')}
                className={`flex size-6 items-center justify-center rounded-sm transition-colors ${
                  view === 'grid' ? 'bg-surface-selected text-text-primary' : 'text-text-icon'
                }`}
              >
                <Icon name="grid_view" size={18} />
              </button>
              <button
                type="button"
                aria-label="List view"
                onClick={() => setView('list')}
                className={`flex size-6 items-center justify-center rounded-sm transition-colors ${
                  view === 'list' ? 'bg-surface-selected text-text-primary' : 'text-text-icon'
                }`}
              >
                <Icon name="table_rows" size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setEditing('new')}
              className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
            >
              Create new
            </button>

            <button
              type="button"
              aria-label="Filter"
              onClick={() => setFilterOpen((o) => !o)}
              className={`flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2 ${filterOpen ? 'bg-surface-selected' : ''}`}
            >
              <Icon name="filter_list" size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-2xl pb-2xl">
          {visibleProcedures.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-body text-text-tertiary">
              No procedures match your search.
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-3 gap-lg">
              {visibleProcedures.map((p) => (
                <ProcedureCard
                  key={p.id}
                  procedure={p}
                  onOpen={() => setEditing(p)}
                  onDuplicate={() => addProcedure({ ...p, id: `${p.id}-copy-${Date.now()}`, name: `${p.name} (copy)` })}
                  onDelete={() => deleteProcedure(p.id)}
                />
              ))}
            </div>
          ) : (
            <ProcedureTable
              procedures={visibleProcedures}
              onOpen={(p) => setEditing(p)}
              onDuplicate={(p) => addProcedure({ ...p, id: `${p.id}-copy-${Date.now()}`, name: `${p.name} (copy)` })}
              onDelete={(p) => deleteProcedure(p.id)}
            />
          )}
        </div>
      </div>

      <FilterPanel
        open={filterOpen}
        fields={[
          { id: 'type', label: 'Type', options: [{ value: 'Inbound', label: 'Inbound' }, { value: 'Outbound', label: 'Outbound' }], multi: false },
          { id: 'period', label: 'Time period', options: ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Last year'].map((t) => ({ value: t, label: t })), multi: false },
        ]}
        selections={filterSelections}
        onSelectionsChange={setFilterSelections}
        onClose={() => setFilterOpen(false)}
      />
      </div>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  )
}

// ── Grid card ───────────────────────────────────────────────────
interface CardProps {
  procedure: Procedure
  onOpen: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function ProcedureCard({ procedure, onOpen, onDuplicate, onDelete }: CardProps) {
  return (
    <div
      onClick={onOpen}
      className="group relative flex min-h-[192px] cursor-pointer flex-col rounded-md border border-border-selected bg-surface p-xl transition-colors hover:bg-surface-selected"
    >
      <div className="mb-md">
        <ProcedureBookIcon size={22} className="text-text-secondary" />
      </div>

      <h3 className="mb-xs text-body text-text-primary">{procedure.name}</h3>
      <p className="line-clamp-2 text-small text-text-secondary">{procedure.description}</p>

      {/* Footer: queue (hidden on hover, replaced by CTA row) */}
      <div className="mt-auto pt-lg">
        <div className="flex items-center group-hover:hidden">
          <span className="text-small text-text-tertiary">{procedure.queue}</span>
        </div>

        {/* Hover CTA row */}
        <div className="hidden items-center gap-sm group-hover:flex" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onOpen}
            className="flex h-8 items-center rounded-sm bg-primary px-md text-small text-white transition-colors hover:bg-primary-hover"
          >
            Edit
          </button>
          <ThreeDotMenu onDuplicate={onDuplicate} onDelete={onDelete} />
        </div>
      </div>
    </div>
  )
}

// ── List table (uses shared DataTable) ──────────────────────────
interface TableProps {
  procedures: Procedure[]
  onOpen: (p: Procedure) => void
  onDuplicate: (p: Procedure) => void
  onDelete: (p: Procedure) => void
}

type ProcRow = { _proc: Procedure; name: string; description: string; queue: string; channels: string; lastEdited: string }

const PROC_COLUMNS: Column<ProcRow>[] = [
  {
    key: 'name',
    label: 'Name',
    width: 480,
    sortable: true,
    render: (_v, row) => (
      <div>
        <div className="truncate text-body text-text-primary">{row.name}</div>
        <div className="truncate text-small text-text-secondary">{row.description}</div>
      </div>
    ),
  },
  { key: 'queue',      label: 'Type',        width: 160, sortable: true },
  { key: 'channels',   label: 'Channels',    width: 160, sortable: true },
  { key: 'lastEdited', label: 'Last updated', width: 160, sortable: true },
]

function ProcedureTable({ procedures, onOpen, onDuplicate, onDelete }: TableProps) {
  const rows: ProcRow[] = procedures.map((p) => ({
    _proc: p,
    name: p.name,
    description: p.description,
    queue: p.queue,
    channels: p.channels.join(', '),
    lastEdited: p.lastEdited,
  }))

  return (
    <DataTable
      columns={PROC_COLUMNS}
      data={rows}
      rowHeight={56}
      onRowClick={(row) => onOpen(row._proc)}
      rowAction={{ icon: 'edit', label: 'Edit', onClick: (row) => onOpen(row._proc) }}
      rowMenuItems={[
        { label: 'Duplicate', onClick: (row) => onDuplicate(row._proc) },
        { label: 'Delete',    onClick: (row) => onDelete(row._proc), variant: 'danger' },
      ]}
    />
  )
}
