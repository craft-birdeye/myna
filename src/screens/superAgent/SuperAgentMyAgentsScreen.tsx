import { useEffect, useMemo, useRef, useState } from 'react'
import { LayoutGrid, LayoutList, ChevronDown } from 'lucide-react'
import { Icon, Chip, LibraryCardIcon, HeaderSearchField, DataTable } from '../../components'
import type { Column } from '../../components/DataTable/DataTable.types'
import { SUPER_AGENT_ACTIVE_AGENTS, SUPER_AGENT_PAUSED_AGENTS, type SuperAgentMyAgent } from './superAgentSeedData'

// Native "My agents" screen for the Super agent L1 module — reuses the exact header
// chrome from AgentDetailScreen (sticky `bg-surface px-2xl py-xl` header, CLAUDE.md
// §6.7 primary/secondary button classes). Full width, `px-2xl` on both sides. Only
// this module's L2 pages are native — "Create agent" still opens the prototype
// iframe. No Activity/Reports tabs — a single list is the whole screen.
export interface SuperAgentMyAgentsScreenProps {
  /** Opens the agent's full AgentScreen (Chat/Workflow/Approvals/...) inside the
   *  prototype iframe — `id` must be one of the prototype's own `app.agents` ids. */
  onOpenAgent: (id: string) => void
}

type ViewMode = 'grid' | 'list'
type StatusFilter = 'all' | 'running' | 'paused' | 'attention'
type SortOption = 'last-updated' | 'name' | 'status'

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All agents' },
  { value: 'running', label: 'Running' },
  { value: 'paused', label: 'Paused' },
  { value: 'attention', label: 'Needs attention' },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'last-updated', label: 'Last updated' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'status', label: 'Status' },
]

function statusChip(agent: SuperAgentMyAgent) {
  if (agent.alert) return <Chip label="Needs attention" variant="warning" showDot />
  if (agent.status === 'running') return <Chip label="Running" variant="success" showDot />
  return <Chip label="Paused" variant="neutral" showDot />
}

// Generic anchored dropdown trigger reused for Status + Sort — matches the shared
// menu chrome from CLAUDE.md §6.7 (min-w rounded-sm border bg-surface shadow-dropdown).
function HeaderDropdown<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const activeLabel = options.find((o) => o.value === value)?.label ?? label

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-sm rounded-sm border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
      >
        {activeLabel}
        <ChevronDown className="size-4 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-[168px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              className={`block w-full px-md py-sm text-left text-body hover:bg-surface-hover ${
                o.value === value ? 'text-text-primary' : 'text-text-secondary'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Compact card — mirrors AgentDetailScreen's "default" instance card exactly:
// icon + title + status chip top row, a small meta line, a 2-line description,
// then a footer that shows last-activity text and reveals actions on hover.
function AgentCard({ agent, onOpenAgent }: { agent: SuperAgentMyAgent; onOpenAgent: (id: string) => void }) {
  return (
    <div
      role="presentation"
      onClick={() => onOpenAgent(agent.id)}
      className="group relative flex h-full min-w-0 cursor-pointer flex-col gap-md overflow-hidden rounded-md border border-border bg-surface p-lg transition-colors hover:bg-surface-hover"
    >
      <div className="flex min-w-0 items-start gap-sm">
        <LibraryCardIcon glyph={agent.glyph} size="sm" />
        <div className="flex min-w-0 flex-1 items-start justify-between gap-sm">
          <h3 title={agent.name} className="line-clamp-2 min-w-0 flex-1 text-body leading-[22px] tracking-[-0.28px] text-text-primary">
            {agent.name}
          </h3>
          {statusChip(agent)}
        </div>
      </div>

      <p title={agent.description} className="line-clamp-2 text-[13px] leading-[20px] text-text-secondary">
        {agent.description}
      </p>

      {agent.alert && (
        <div className="flex items-center gap-xs text-small text-chip-warning-text">
          <Icon name="warning" size={16} />
          <span className="min-w-0 truncate">{agent.alert}</span>
        </div>
      )}

      {/* Compact 2x2 metric grid — MetricTiles' boxed row is sized for a full-width
          dashboard, not a 3-up card; a light unboxed panel reads better here. */}
      <div className="grid grid-cols-2 gap-x-lg gap-y-md rounded-sm bg-surface-muted p-md">
        {agent.metrics.map((metric) => (
          <div key={metric.id} className="min-w-0">
            <div className="text-lg text-text-primary">{metric.value}</div>
            <div className="truncate text-small text-text-secondary">{metric.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-auto flex min-w-0 items-center gap-sm">
        <div className="flex min-w-0 flex-1 overflow-hidden">
          <span className="min-w-0 truncate text-small text-text-tertiary">Last run {agent.lastRun}</span>
        </div>
        <div
          className="pointer-events-none flex shrink-0 items-center gap-sm opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="flex h-9 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
          >
            {agent.status === 'running' ? 'Pause' : 'Resume'}
          </button>
          <button
            type="button"
            onClick={() => onOpenAgent(agent.id)}
            className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
          >
            Open agent
          </button>
        </div>
      </div>
    </div>
  )
}

function agentSection(agent: SuperAgentMyAgent): StatusFilter {
  if (agent.alert) return 'attention'
  return agent.status
}

export function SuperAgentMyAgentsScreen({ onOpenAgent }: SuperAgentMyAgentsScreenProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<ViewMode>('grid')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('last-updated')

  const allAgents = useMemo(
    () => [...SUPER_AGENT_ACTIVE_AGENTS, ...SUPER_AGENT_PAUSED_AGENTS],
    [],
  )

  const filteredAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = allAgents.filter((agent) => {
      if (statusFilter !== 'all' && agentSection(agent) !== statusFilter) return false
      if (!q) return true
      return agent.name.toLowerCase().includes(q) || agent.description.toLowerCase().includes(q)
    })

    list = list.slice()
    if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'status') {
      const order: Record<StatusFilter, number> = { attention: 0, running: 1, paused: 2, all: 3 }
      list.sort((a, b) => order[agentSection(a)] - order[agentSection(b)])
    }
    // 'last-updated' keeps the seed data's own recency-ordered sequence.

    return list
  }, [allAgents, searchQuery, statusFilter, sortBy])

  const columns: Column<SuperAgentMyAgent>[] = [
    {
      key: 'name',
      label: 'Agent',
      minWidth: 240,
      render: (_v, agent) => (
        <div className="flex items-center gap-sm">
          <LibraryCardIcon glyph={agent.glyph} size="sm" />
          <span className="text-text-primary">{agent.name}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 160,
      truncate: false,
      render: (_v, agent) => statusChip(agent),
    },
    {
      key: 'description',
      label: 'Description',
      minWidth: 320,
    },
    {
      key: 'lastActivity',
      label: 'Last activity',
      width: 160,
    },
  ]

  return (
    <div className="flex h-full flex-col overflow-auto bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
        <div>
          <h1 className="text-h3 text-text-primary">My agents</h1>
          <p className="mt-xs text-body text-text-secondary">
            See what your AI team is handling and where your attention is needed.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <HeaderSearchField
            open={searchOpen}
            value={searchQuery}
            onOpenChange={setSearchOpen}
            onChange={setSearchQuery}
            placeholder="Search agents..."
          />

          <HeaderDropdown
            label="Status"
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />

          <HeaderDropdown label="Sort by" options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />

          <div className="flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface px-sm">
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => setView('grid')}
              className={`flex size-6 items-center justify-center rounded-sm transition-colors ${
                view === 'grid' ? 'bg-surface-selected text-text-primary' : 'text-text-icon'
              }`}
            >
              <LayoutGrid className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
            </button>
            <button
              type="button"
              aria-label="List view"
              onClick={() => setView('list')}
              className={`flex size-6 items-center justify-center rounded-sm transition-colors ${
                view === 'list' ? 'bg-surface-selected text-text-primary' : 'text-text-icon'
              }`}
            >
              <LayoutList className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </div>

          <button
            type="button"
            className="flex h-9 items-center gap-xs rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
          >
            <Icon name="add" size={18} />
            Add an agent
          </button>
        </div>
      </div>

      {filteredAgents.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-body text-text-tertiary">
          No agents match your search.
        </div>
      ) : view === 'grid' ? (
        <div className="px-2xl py-lg">
          <div className="grid grid-cols-1 items-stretch gap-lg sm:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} onOpenAgent={onOpenAgent} />
            ))}
          </div>
        </div>
      ) : (
        <div className="px-2xl py-lg">
          <DataTable
            columns={columns}
            data={filteredAgents}
            onRowClick={(agent) => onOpenAgent(agent.id)}
            rowAction={{ label: 'Open agent', onClick: (agent) => onOpenAgent(agent.id) }}
          />
        </div>
      )}
    </div>
  )
}
