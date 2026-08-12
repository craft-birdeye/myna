import { Fragment, useEffect, useRef, useState, type DragEvent } from 'react'
import { Icon, TopNav, MetricTiles, Tooltip, DatePickerModal, DataTable, type Metric, type Column } from '../components'
import {
  getAgentDirectory,
  PERSONA_GROUPS,
  type AgentDirectoryEntry,
  type AgentPersonaId,
} from '../data/agentDirectoryData'
import mynaLogo from '../assets/myna-logo.png'
import jayLogo from '../assets/jay-logo.png'
import robinLogo from '../assets/robin-logo.png'

type SortMode = 'runs' | 'persona' | 'custom'

const DATE_OPTIONS = ['Today', 'Last week', 'Last month', 'Last quarter']

// Co-worker brand names for the three persona groups — Jay (marketing), Myna
// (operations/front desk), Robin (customer experience) — shown as tabs.
// Healthcare only, for now.
const COWORKER_NAME: Record<AgentPersonaId, string> = {
  marketing: 'Jay',
  operations: 'Myna',
  cx: 'Robin',
}
const COWORKER_LOGO: Record<AgentPersonaId, string> = {
  operations: mynaLogo,
  marketing: jayLogo,
  cx: robinLogo,
}
const COWORKER_ACCENT: Record<AgentPersonaId, string> = {
  operations: '#2E6B36',
  marketing: '#335EB2',
  cx: '#B8482C',
}
const COWORKER_TAB_ORDER: AgentPersonaId[] = ['operations', 'marketing', 'cx']

// 16,230 → { display: '16.2K', exact: '16,230' }. Already-compact values ("1.9K", "434") pass through untouched.
function formatK(raw: string): { display: string; exact?: string } {
  const numeric = parseFloat(raw.replace(/,/g, ''))
  if (!isNaN(numeric) && numeric >= 1000) {
    const k = parseFloat((numeric / 1000).toFixed(1))
    return { display: `${k}K`, exact: numeric.toLocaleString() }
  }
  return { display: raw }
}

// Real copy for each agent's primary metric — lifted verbatim from that same
// metric's info tooltip on the agent's own detail page (AgentDetailScreen's
// METRICS_BY_AGENT), so the directory card and the detail page agree. Agents
// without a matching detail-page metric (the shared Reviews/Social agents,
// and Tagging & routing whose directory metric has no 1:1 detail column)
// fall back to their own description instead of inventing new copy.
const AGENT_PRIMARY_METRIC_TOOLTIP: Record<string, string> = {
  'Front desk agent': 'Conversations closed without requiring human escalation.',
  'Reminder agent': 'Number of upcoming appointments confirmed by the patient via automated reminder outreach, reducing the likelihood of a no-show.',
  'Waitlist agent': 'Number of open or cancelled slots successfully filled via waitlist outreach.',
  'Pre-visit agent': 'Number of patient intake forms fully completed following agent outreach.',
  'Recall agent': 'Distinct patients who received at least one successfully delivered agent touch in the period. Base population = patients flagged recall-due (hygiene, dormant, or unscheduled treatment).',
  'Revenue agent': 'Distinct A/R accounts that received ≥1 delivered agent touch about a balance. Base = balance ≥ threshold and aging ≥ threshold days, excluded (active plan / in collections / disputed).',
  'Treatment plan agent': 'Distinct treatment plans that received ≥1 delivered agent touch. Base = presented, unscheduled plans aged ≥ T+3 days, not opted out / suppressed.',
  'Outreach agent': 'Total leads the agent reached out to via call or message in the selected period.',
}

// Keeps a dropdown panel mounted through its fade/scale-out before removing it, so
// closing eases out instead of snapping away. `entered` drives the ease-in/ease-out classes.
function useOpenTransition(open: boolean, duration = 150) {
  const [mounted, setMounted] = useState(open)
  const [entered, setEntered] = useState(open)

  useEffect(() => {
    let raf1: number
    let raf2: number
    let timer: ReturnType<typeof setTimeout>
    if (open) {
      setMounted(true)
      // Double rAF guarantees a paint of the "hidden" state before flipping to
      // "entered" — a single rAF can land in the same frame and skip the transition.
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setEntered(true))
      })
    } else {
      setEntered(false)
      timer = setTimeout(() => setMounted(false), duration)
    }
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      clearTimeout(timer)
    }
  }, [open, duration])

  return { mounted, entered }
}

const DROPDOWN_TRANSITION = 'transition-all duration-150 ease-out'
const DROPDOWN_HIDDEN = 'opacity-0 scale-95 -translate-y-1'
const DROPDOWN_SHOWN = 'opacity-100 scale-100 translate-y-0'

// ── Sort dropdown — runs / persona (with flyout) / custom order ───────────
function SortDropdown({
  sortMode,
  personaFilter,
  onSortModeChange,
  onPersonaFilterChange,
}: {
  sortMode: SortMode
  personaFilter: AgentPersonaId | null
  onSortModeChange: (mode: SortMode) => void
  onPersonaFilterChange: (persona: AgentPersonaId | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [personaOpen, setPersonaOpen] = useState(false)
  const { mounted, entered } = useOpenTransition(open)
  const { mounted: personaMounted, entered: personaEntered } = useOpenTransition(personaOpen)
  const closeTimer = useRef<number | null>(null)

  function cancelClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  function scheduleClose() {
    closeTimer.current = window.setTimeout(() => setPersonaOpen(false), 150)
  }

  function closeAll() {
    setOpen(false)
    setPersonaOpen(false)
  }

  const label =
    sortMode === 'custom'
      ? 'Sort by custom order'
      : sortMode === 'persona'
        ? personaFilter
          ? `Sort by ${PERSONA_GROUPS.find((g) => g.id === personaFilter)?.label.toLowerCase()} persona`
          : 'Sort by persona'
        : 'Sort by runs'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o)
          setPersonaOpen(false)
        }}
        className="flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
      >
        {label}
        <Icon name="expand_more" size={18} className="text-text-icon" />
      </button>

      {mounted && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={closeAll} />
          <div
            className={`absolute right-0 top-full z-[110] mt-xs min-w-[220px] origin-top-right rounded-sm border border-border bg-surface p-md shadow-dropdown ${DROPDOWN_TRANSITION} ${
              entered ? DROPDOWN_SHOWN : DROPDOWN_HIDDEN
            }`}
          >
            <button
              type="button"
              onMouseEnter={() => setPersonaOpen(false)}
              onClick={() => {
                onSortModeChange('runs')
                closeAll()
              }}
              className={`flex w-full items-center gap-sm rounded-sm px-md py-sm text-left ${
                sortMode === 'runs' ? 'bg-surface-selected' : 'hover:bg-surface-hover'
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-body text-text-primary">Sort by runs</span>
              {sortMode === 'runs' && <Icon name="check" size={18} className="shrink-0 text-text-icon" />}
            </button>

            <div className="relative" onMouseEnter={() => { cancelClose(); setPersonaOpen(true) }} onMouseLeave={scheduleClose}>
              <button
                type="button"
                onClick={() => {
                  onSortModeChange('persona')
                  closeAll()
                }}
                className={`flex w-full items-center gap-sm rounded-sm px-md py-sm text-left ${
                  sortMode === 'persona' ? 'bg-surface-selected' : 'hover:bg-surface-hover'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body text-text-primary">Sort by persona</span>
                  {sortMode === 'persona' && personaFilter && (
                    <span className="block truncate text-small text-text-tertiary">
                      {PERSONA_GROUPS.find((g) => g.id === personaFilter)?.label}
                    </span>
                  )}
                </span>
                <Icon name="chevron_right" size={18} className="shrink-0 text-text-icon" />
              </button>

              {personaMounted && (
                <div
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                  className={`absolute right-full top-0 z-[120] mr-xs w-[260px] origin-top-right rounded-sm border border-border bg-surface p-md shadow-dropdown ${DROPDOWN_TRANSITION} ${
                    personaEntered ? DROPDOWN_SHOWN : DROPDOWN_HIDDEN
                  }`}
                >
                  {PERSONA_GROUPS.map((group) => {
                    const isSel = sortMode === 'persona' && personaFilter === group.id
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => {
                          onSortModeChange('persona')
                          onPersonaFilterChange(group.id)
                          closeAll()
                        }}
                        className={`flex w-full flex-col items-start gap-xs rounded-sm px-md py-sm text-left ${
                          isSel ? 'bg-surface-selected' : 'hover:bg-surface-hover'
                        }`}
                      >
                        <span className="text-body text-text-primary">{group.label}</span>
                        <span className="text-small text-text-tertiary">{group.categories.join(', ')}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onMouseEnter={() => setPersonaOpen(false)}
              onClick={() => {
                onSortModeChange('custom')
                closeAll()
              }}
              className={`flex w-full items-center gap-sm rounded-sm px-md py-sm text-left ${
                sortMode === 'custom' ? 'bg-surface-selected' : 'hover:bg-surface-hover'
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-body text-text-primary">Sort by custom order</span>
              {sortMode === 'custom' && <Icon name="check" size={18} className="shrink-0 text-text-icon" />}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Date range dropdown — presets + a "Custom" row that opens the shared calendar picker ──
function DateRangeDropdown({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarAnchor, setCalendarAnchor] = useState<{ top: number; left: number } | null>(null)
  const { mounted, entered } = useOpenTransition(open)
  const customRowRef = useRef<HTMLButtonElement>(null)
  const isCustomActive = !DATE_OPTIONS.includes(value)

  function openCalendar() {
    if (!customRowRef.current) return
    const rect = customRowRef.current.getBoundingClientRect()
    setCalendarAnchor({ top: rect.bottom + 4, left: rect.left })
    setCalendarOpen(true)
  }

  function closeAll() {
    setOpen(false)
    setCalendarOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
      >
        {value}
        <Icon name="expand_more" size={18} className="text-text-icon" />
      </button>

      {mounted && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={closeAll} />
          <div
            className={`absolute right-0 top-full z-[110] mt-xs min-w-[200px] origin-top-right rounded-sm border border-border bg-surface p-md shadow-dropdown ${DROPDOWN_TRANSITION} ${
              entered ? DROPDOWN_SHOWN : DROPDOWN_HIDDEN
            }`}
          >
            {DATE_OPTIONS.map((opt) => {
              const isSel = opt === value
              return (
                <button
                  key={opt}
                  type="button"
                  onMouseEnter={() => setCalendarOpen(false)}
                  onClick={() => {
                    onChange(opt)
                    closeAll()
                  }}
                  className={`flex w-full items-center gap-sm rounded-sm px-md py-sm text-left ${
                    isSel ? 'bg-surface-selected' : 'hover:bg-surface-hover'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-body text-text-primary">{opt}</span>
                  {isSel && <Icon name="check" size={18} className="shrink-0 text-text-icon" />}
                </button>
              )
            })}

            <button
              ref={customRowRef}
              type="button"
              onClick={openCalendar}
              className={`flex w-full items-center gap-sm rounded-sm px-md py-sm text-left ${
                isCustomActive ? 'bg-surface-selected' : 'hover:bg-surface-hover'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body text-text-primary">Custom</span>
                {isCustomActive && <span className="block truncate text-small text-text-tertiary">{value}</span>}
              </span>
              <Icon name="chevron_right" size={18} className="shrink-0 text-text-icon" />
            </button>
          </div>
        </>
      )}

      <DatePickerModal
        open={calendarOpen}
        anchor={calendarAnchor}
        onClose={() => setCalendarOpen(false)}
        onApply={(label) => {
          onChange(label)
          closeAll()
        }}
      />
    </div>
  )
}

// ── Co-worker tab bar — same styling as OverviewFinalScreen's CoworkerTabBar (avatar + brand-
// color underline per tab) instead of the plain text `Tabs` component, and no "All" tab. ──
function CoworkerTabBar({
  activeTab,
  onChange,
  agents,
}: {
  activeTab: AgentPersonaId
  onChange: (id: AgentPersonaId) => void
  agents: AgentDirectoryEntry[]
}) {
  return (
    <div className="relative flex items-center gap-xs">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border" />
      {COWORKER_TAB_ORDER.map((id, i) => {
        const active = id === activeTab
        const group = PERSONA_GROUPS.find((g) => g.id === id)!
        const agentCount = agents.filter((a) => a.persona === id).length
        return (
          <Fragment key={id}>
            {i > 0 && <span className="self-stretch w-px shrink-0 bg-border" />}
            <button type="button" onClick={() => onChange(id)} className="relative flex flex-col items-stretch text-left">
              <span
                className={`flex items-center gap-sm rounded-sm px-lg py-md text-left transition-colors ${active ? '' : 'hover:bg-surface-hover'}`}
                style={active ? { backgroundColor: `${COWORKER_ACCENT[id]}1A` } : undefined}
              >
                <img src={COWORKER_LOGO[id]} alt="" className="size-10 shrink-0 rounded-full" />
                <span className="flex flex-col gap-[2px]">
                  <span
                    className={`text-body ${active ? '' : 'text-text-secondary'}`}
                    style={active ? { color: COWORKER_ACCENT[id] } : undefined}
                  >
                    {COWORKER_NAME[id]}
                  </span>
                  <span className="text-left text-small text-text-tertiary">
                    {group.label} • {agentCount} agents
                  </span>
                </span>
              </span>
              <span
                className="absolute inset-x-0 bottom-0 z-10 h-px"
                style={{ backgroundColor: active ? COWORKER_ACCENT[id] : 'transparent' }}
              />
            </button>
          </Fragment>
        )
      })}
    </div>
  )
}

// ── One metric cell — plain by default; pass `tooltip` only for the card's
// primary metric (the rest — Time saved, Cost saved — don't need a hover tooltip) ──
function MetricCell({ value, label, tooltip }: { value: string; label: string; tooltip?: string }) {
  const content = (
    <div className="min-w-0 w-full">
      <div className="truncate text-h3 text-text-primary">{value}</div>
      <div className="truncate text-small text-text-tertiary">{label}</div>
    </div>
  )
  if (!tooltip) return content
  return (
    <Tooltip content={tooltip} variant="detail" className="w-full min-w-0">
      {content}
    </Tooltip>
  )
}

// ── Grid card ───────────────────────────────────────────────────────────
function AgentCard({
  agent,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onOpen,
}: {
  agent: AgentDirectoryEntry
  draggable: boolean
  onDragStart: () => void
  onDragOver: (e: DragEvent<HTMLDivElement>) => void
  onDrop: (e: DragEvent<HTMLDivElement>) => void
  onOpen?: () => void
}) {
  const clickable = !draggable && !!onOpen
  const outcome = formatK(agent.outcome.value)

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={clickable ? onOpen : undefined}
      className={`group relative flex flex-col rounded-md border border-border bg-surface p-xl transition-colors ${
        draggable ? 'cursor-grab active:cursor-grabbing' : clickable ? 'cursor-pointer hover:border-border-selected hover:bg-surface-hover' : ''
      }`}
    >
      {draggable && (
        <div className="absolute inset-x-0 top-sm flex justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <Tooltip content="Drag and drop to rearrange this agent" variant="detail">
            <Icon name="drag_indicator" size={20} className="rotate-90 text-text-tertiary" />
          </Tooltip>
        </div>
      )}

      <div className="mb-xs flex items-center justify-between gap-sm">
        <span className="truncate text-small text-text-tertiary">{agent.category}</span>
        <div className="flex shrink-0 items-center gap-xs">
          {agent.alert && (
            <span className="flex items-center gap-xs text-small text-text-secondary">
              <Icon name="error" size={14} className="text-chip-danger-text" />
              {parseInt(agent.alert.message, 10)} {parseInt(agent.alert.message, 10) === 1 ? 'issue' : 'issues'}
            </span>
          )}
          {agent.running > 0 ? (
            <span className="rounded-sm bg-chip-success-bg px-sm py-xs text-small text-chip-success-text">
              {agent.running} running
            </span>
          ) : (
            <span className="rounded-sm bg-chip-neutral-bg px-sm py-xs text-small text-chip-neutral-text">
              Paused
            </span>
          )}
        </div>
      </div>

      <h3 className="mb-xs text-[16px] leading-6 tracking-[-0.32px] text-text-primary">{agent.name}</h3>
      <p className="mb-lg line-clamp-2 text-small text-text-tertiary">{agent.description}</p>

      <div className="grid grid-cols-3 gap-md">
        <MetricCell
          value={outcome.display}
          label={agent.outcome.label}
          tooltip={AGENT_PRIMARY_METRIC_TOOLTIP[agent.name] ?? agent.description}
        />
        <MetricCell value={agent.timeSaved} label="Time saved" />
        <MetricCell value={agent.costSaved} label="Cost saved" />
      </div>
    </div>
  )
}

// ── Outcomes table (AI overview page only) ───────────────────────────────
interface OutcomeRow {
  id: string
  outcomeLabel: string
  agentName: string
  tooltip: string
  count: string
  timeSaved: string
  costSaved: string
  [key: string]: string
}

const OUTCOME_COLUMNS: Column<OutcomeRow>[] = [
  {
    key: 'outcomeLabel',
    label: 'Outcomes',
    width: 280,
    sortable: true,
    render: (_, row) => (
      <Tooltip content={row.tooltip} variant="detail" className="min-w-0">
        <div className="min-w-0">
          <p className="m-0 truncate text-body text-text-primary">{row.outcomeLabel}</p>
          <p className="m-0 truncate text-small text-text-tertiary">{row.agentName}</p>
        </div>
      </Tooltip>
    ),
  },
  { key: 'count', label: 'Count', width: 160, sortable: true },
  { key: 'timeSaved', label: 'Time saved', width: 160, sortable: true },
  { key: 'costSaved', label: 'Cost saved', width: 160, sortable: true },
]

// ── Screen ──────────────────────────────────────────────────────────────
export function CoworkersOverviewScreen({
  product = 'healthcare',
  onOpenAgent,
  coworkerTabsWithSubtext = false,
  hideTopNav = false,
  userName = 'Akhil',
  onSwitchToClassic,
}: {
  product?: string
  onOpenAgent?: (navId: string) => void
  /** Use the two-line title+subtext tab variant (agent count + suite) instead of the plain
   *  single-line tabs. Scoped to the "AI overview" duplicate nav entry only. */
  coworkerTabsWithSubtext?: boolean
  /** Hides the screen's own TopNav — set when embedding this screen's body inside a host that
   *  already renders its own TopNav (e.g. the "AI Co-worker" tab on the AI overview page). */
  hideTopNav?: boolean
  userName?: string
  /** "Switch to classic overview" button — takes the status-filter dropdown's old spot. */
  onSwitchToClassic?: () => void
} = {}) {
  const AGENT_DIRECTORY = getAgentDirectory(product)
  // No status-filter UI on this page (removed in favor of "Switch to classic overview"), so this
  // always shows every agent rather than defaulting to just the running ones.
  const [statusFilter] = useState('All agents')
  const [dateRange, setDateRange] = useState('Last week')
  const [sortMode, setSortMode] = useState<SortMode>('runs')
  const [personaFilter, setPersonaFilter] = useState<AgentPersonaId | null>(null)
  const [customOrder, setCustomOrder] = useState<string[]>(() => AGENT_DIRECTORY.map((a) => a.id))
  const [activeCoworkerTab, setActiveCoworkerTab] = useState<AgentPersonaId>('operations')
  const dragIdRef = useRef<string | null>(null)

  // "Co-workers" rebrand (tabs, renamed header, coworkers tile) — Healthcare
  // only, for now. Dental/Automotive keep the original "Agents" experience.
  const showCoworkers = product === 'healthcare'

  const statusFiltered = AGENT_DIRECTORY.filter((a) => {
    if (statusFilter === 'Running') return a.running > 0
    if (statusFilter === 'Paused') return a.running === 0
    if (statusFilter === 'Needs attention') return !!a.alert
    return true
  })

  // "Sort by runs" and "Sort by custom order" share the same base sequence
  // (customOrder, seeded from AGENT_DIRECTORY's order) until the user actually
  // drags cards around in custom mode — so the default view is identical either way.
  // "Sort by persona" is a SORT, not a filter — picking e.g. Marketing brings
  // marketing agents to the top; every other persona still shows up below it.
  const visibleAgents = [...statusFiltered].sort((a, b) => {
    if (sortMode === 'persona') {
      if (personaFilter) {
        const aMatch = a.persona === personaFilter ? 0 : 1
        const bMatch = b.persona === personaFilter ? 0 : 1
        if (aMatch !== bMatch) return aMatch - bMatch
      }
      const pa = PERSONA_GROUPS.findIndex((p) => p.id === a.persona)
      const pb = PERSONA_GROUPS.findIndex((p) => p.id === b.persona)
      return pa - pb || a.name.localeCompare(b.name)
    }
    return customOrder.indexOf(a.id) - customOrder.indexOf(b.id)
  })

  // "All" tab plus one tab per coworker, sitting alongside the same sort
  // dropdown used elsewhere — the tab narrows which agents show, the
  // dropdown still controls their order within that set.
  const coworkerFilteredAgents = [...statusFiltered.filter((a) => a.persona === activeCoworkerTab)].sort((a, b) => {
    if (sortMode === 'persona') {
      const pa = PERSONA_GROUPS.findIndex((p) => p.id === a.persona)
      const pb = PERSONA_GROUPS.findIndex((p) => p.id === b.persona)
      return pa - pb || a.name.localeCompare(b.name)
    }
    return customOrder.indexOf(a.id) - customOrder.indexOf(b.id)
  })

  const outcomeRows: OutcomeRow[] = coworkerFilteredAgents.map((agent) => ({
    id: agent.id,
    outcomeLabel: agent.outcome.label,
    agentName: agent.name,
    tooltip: AGENT_PRIMARY_METRIC_TOOLTIP[agent.name] ?? agent.description,
    count: formatK(agent.outcome.value).display,
    timeSaved: agent.timeSaved,
    costSaved: agent.costSaved,
  }))

  const runningCount = AGENT_DIRECTORY.filter((a) => a.running > 0).length
  const attentionCount = AGENT_DIRECTORY.filter((a) => a.alert).length
  const totalTimeSavedHrs = AGENT_DIRECTORY.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const totalCostSavedK = AGENT_DIRECTORY.reduce(
    (sum, a) => sum + parseFloat(a.costSaved.replace(/[$K]/g, '')),
    0,
  )

  const SUMMARY_METRICS: Metric[] = [
    { id: 'coworkers', value: String(PERSONA_GROUPS.length), label: 'Co-workers' },
    { id: 'running', value: String(runningCount), label: 'Running agents' },
    { id: 'time-saved', value: `${totalTimeSavedHrs}h`, label: 'Time saved', delta: '16%', trend: 'up' },
    { id: 'cost-saved', value: `$${totalCostSavedK.toFixed(1)}K`, label: 'Cost saved', delta: '14%', trend: 'up' },
    {
      id: 'attention',
      value: String(attentionCount),
      label: 'Needs attention',
      valueColorClassName: 'text-chip-danger-text',
    },
  ]

  function handleReorder(targetId: string) {
    const draggedId = dragIdRef.current
    if (!draggedId || draggedId === targetId) return
    setCustomOrder((prev) => {
      const next = [...prev]
      const from = next.indexOf(draggedId)
      const to = next.indexOf(targetId)
      if (from === -1 || to === -1) return prev
      next.splice(from, 1)
      next.splice(to, 0, draggedId)
      return next
    })
  }

  return (
    <div className="flex h-full flex-col">
      {!hideTopNav && <TopNav title={showCoworkers ? 'Co-workers' : 'Agents'} initials="S" />}

      <div className="flex-1 overflow-auto bg-surface">
        <div className="flex items-start justify-between px-2xl py-xl">
          <div>
            <h1 className="m-0 text-display text-text-primary">Welcome, {userName}</h1>
            <p className="m-0 mt-xs text-body text-text-secondary">Here are the things which need your attention</p>
          </div>
          <div className="flex shrink-0 items-center gap-sm">
            <button
              type="button"
              onClick={onSwitchToClassic}
              className="flex h-9 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
            >
              Switch to classic overview
            </button>
            <DateRangeDropdown value={dateRange} onChange={setDateRange} />
            <button
              type="button"
              className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
            >
              Create agent
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3xl px-2xl pb-2xl pt-sm">
          <MetricTiles metrics={showCoworkers ? SUMMARY_METRICS : SUMMARY_METRICS.filter((m) => m.id !== 'coworkers')} />

          <div className="flex flex-col gap-lg">
            {!showCoworkers ? (
              <div className="flex items-center justify-between gap-lg">
                <h2 className="text-h3 text-text-primary">Agent directory</h2>

                <SortDropdown
                  sortMode={sortMode}
                  personaFilter={personaFilter}
                  onSortModeChange={(m) => {
                    setSortMode(m)
                    if (m !== 'persona') setPersonaFilter(null)
                  }}
                  onPersonaFilterChange={setPersonaFilter}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between gap-lg">
                <CoworkerTabBar activeTab={activeCoworkerTab} onChange={setActiveCoworkerTab} agents={AGENT_DIRECTORY} />

                <SortDropdown
                  sortMode={sortMode}
                  personaFilter={personaFilter}
                  onSortModeChange={(m) => {
                    setSortMode(m)
                    if (m !== 'persona') setPersonaFilter(null)
                  }}
                  onPersonaFilterChange={setPersonaFilter}
                />
              </div>
            )}

            {coworkerTabsWithSubtext ? (
              <DataTable columns={OUTCOME_COLUMNS} data={outcomeRows} />
            ) : (showCoworkers ? coworkerFilteredAgents : visibleAgents).length === 0 ? (
              <div className="flex h-48 items-center justify-center text-body text-text-tertiary">
                No agents match this persona yet.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-lg">
                {(showCoworkers ? coworkerFilteredAgents : visibleAgents).map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    draggable={sortMode === 'custom'}
                    onDragStart={() => {
                      dragIdRef.current = agent.id
                    }}
                    onDragOver={(e) => {
                      if (sortMode === 'custom') e.preventDefault()
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleReorder(agent.id)
                    }}
                    onOpen={agent.navId ? () => onOpenAgent?.(agent.navId!) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
