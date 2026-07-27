import { useState } from 'react'
import { Chip, Icon, TopNav } from '../components'

// ── Types ─────────────────────────────────────────────────────────────────────

type GapType = 'procedure' | 'knowledge' | 'action'
type Priority = 'High' | 'Medium' | 'Low'

interface ToolChip {
  label: string
  icon: string
}

interface ProcedureStep {
  title: string
  bullets: string[]
}

interface OriginalChange {
  label: string
  before: string
  after: string
}

interface Recommendation {
  id: string
  gapType: GapType
  title: string
  description: string
  priority: Priority
  timeAgo: string
  conversationCount: number
  isNew?: boolean           // "Add new procedure" vs "Modifies existing procedure"
  whenToUse: string
  steps: ProcedureStep[]
  tools: ToolChip[]
  whyCameUp: string
  changesSummary: string
  originalChanges?: OriginalChange[]
}

// ── Static data ───────────────────────────────────────────────────────────────

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'r1',
    gapType: 'procedure',
    title: 'Add payment processing procedure',
    description: 'Multiple customers are asking how to make payments online or over the phone, but no procedure exists to guide the agent.',
    priority: 'High',
    timeAgo: '2 hours ago',
    conversationCount: 12,
    isNew: true,
    whenToUse: 'When a customer asks about making a payment for services, parts, or outstanding balances. This includes phone payments, online payments, and in-person payment inquiries.',
    steps: [
      {
        title: 'Identify payment type',
        bullets: [
          'Ask the customer what the payment is for (service invoice, parts order, outstanding balance)',
          'Look up the customer account using their name or phone number',
          'Confirm the amount due',
        ],
      },
      {
        title: 'Process payment',
        bullets: [
          'For phone payments, collect card details securely and process through the DMS',
          'For online payments, direct the customer to the payment portal link',
          'For in-person payments, confirm location and business hours',
        ],
      },
      {
        title: 'Confirm and follow up',
        bullets: [
          'Send payment confirmation via email or text',
          'Update the customer record in the DMS',
          'If payment fails, offer alternative methods or escalate to billing',
        ],
      },
    ],
    tools: [
      { label: 'DMS Integration', icon: 'storage' },
      { label: 'Send Confirmation', icon: 'send' },
    ],
    whyCameUp: '12 conversations in the past 7 days ended without resolution because the agent had no guidance on handling payment requests.',
    changesSummary: 'A new procedure will be added to the procedure library so the agent knows how to handle payment inquiries end-to-end.',
  },
  {
    id: 'r2',
    gapType: 'procedure',
    title: 'Update appointment rescheduling procedure',
    description: 'Customers report confusion when trying to reschedule. The current procedure doesn\'t handle same-day reschedules or waitlisting.',
    priority: 'High',
    timeAgo: '5 hours ago',
    conversationCount: 8,
    isNew: false,
    whenToUse: 'When a customer requests to reschedule an existing appointment, including same-day changes and waitlist additions.',
    steps: [
      {
        title: 'Look up existing appointment',
        bullets: [
          'Retrieve the current appointment using the customer\'s name, phone, or confirmation number',
          'Confirm the appointment details with the customer',
        ],
      },
      {
        title: 'Check availability for new time',
        bullets: [
          'Search for available slots on the requested date',
          'For same-day reschedules, check technician availability in real time',
          'If no slots are available, offer to add the customer to the waitlist',
        ],
      },
      {
        title: 'Confirm reschedule',
        bullets: [
          'Book the new slot and cancel the old one',
          'Send updated confirmation to the customer',
          'Update the service advisor if the technician assignment changes',
        ],
      },
    ],
    tools: [
      { label: 'Schedule Appointment', icon: 'calendar_today' },
      { label: 'Send Confirmation', icon: 'send' },
    ],
    whyCameUp: "8 conversations flagged because customers were told \"that's not possible\" for same-day reschedule requests, causing escalations.",
    changesSummary: 'The existing rescheduling procedure will be updated to include a same-day path and a waitlist fallback.',
    originalChanges: [
      {
        label: 'Step 2 — Check availability',
        before: 'Search for available slots on the requested date.',
        after: 'Search for available slots on the requested date. For same-day reschedules, check technician availability in real time. If no slots are available, offer to add the customer to the waitlist.',
      },
    ],
  },
  {
    id: 'r3',
    gapType: 'procedure',
    title: 'Improve emergency escalation procedure',
    description: 'Admin feedback indicates the escalation procedure is too slow. Customers with safety concerns need faster routing to a live agent.',
    priority: 'High',
    timeAgo: '3 hours ago',
    conversationCount: 5,
    isNew: false,
    whenToUse: 'When a customer reports a safety-critical issue, vehicle breakdown, or urgent concern that requires immediate human attention.',
    steps: [
      {
        title: 'Detect urgency signals',
        bullets: [
          'Listen for keywords: "not safe", "smoke", "brakes failed", "accident", "urgent"',
          'If detected, skip standard intake questions',
        ],
      },
      {
        title: 'Immediate escalation',
        bullets: [
          'Transfer directly to the on-call service advisor within 30 seconds',
          'If no advisor is available, connect to the service manager',
          "Provide the customer's name, callback number, and concern summary before transferring",
        ],
      },
    ],
    tools: [
      { label: 'Voice Call', icon: 'call' },
      { label: 'Trigger Escalation', icon: 'priority_high' },
    ],
    whyCameUp: '5 conversations where customers described safety concerns were handled with the standard intake flow, causing 3+ minute delays before a human responded.',
    changesSummary: 'The escalation procedure will add an urgency-detection step at the start and reduce the transfer time target from 2 minutes to 30 seconds.',
    originalChanges: [
      {
        label: 'Transfer time target',
        before: 'Escalate to a live agent within 2 minutes.',
        after: 'Detect urgency signals immediately. Transfer to an on-call advisor within 30 seconds. Skip standard intake if urgency keywords are present.',
      },
    ],
  },
  {
    id: 'r4',
    gapType: 'knowledge',
    title: 'Update business hours in business details',
    description: 'Customers frequently ask about business hours, weekend availability, and holiday closures. The agent has no context for this.',
    priority: 'High',
    timeAgo: '1 hour ago',
    conversationCount: 19,
    isNew: false,
    whenToUse: 'When a customer asks about operating hours, weekend availability, or holiday schedules.',
    steps: [
      {
        title: 'Provide accurate hours',
        bullets: [
          'Retrieve current business hours from the knowledge base',
          'Include weekend hours and any upcoming holiday closures',
          'Offer to schedule an appointment if the customer wants to come in',
        ],
      },
    ],
    tools: [
      { label: 'Check Business Hours', icon: 'schedule' },
    ],
    whyCameUp: '19 conversations ended with the agent saying "I don\'t have that information" when customers asked about hours — the knowledge record is missing or outdated.',
    changesSummary: 'Business hours, weekend availability, and holiday closures will be added to the knowledge base so the agent can answer accurately.',
  },
  {
    id: 'r5',
    gapType: 'action',
    title: 'Add VIN lookup to intake flow',
    description: 'Service advisors manually search VINs after calls because the agent doesn\'t capture or decode VIN during intake.',
    priority: 'Medium',
    timeAgo: '6 hours ago',
    conversationCount: 7,
    isNew: false,
    whenToUse: 'During any service intake where vehicle identification is needed.',
    steps: [
      {
        title: 'Collect VIN',
        bullets: [
          'Ask the customer to provide the VIN from the dashboard or registration',
          'Decode the VIN using the VIN lookup tool to confirm year, make, and model',
          'Pre-populate the service record with decoded vehicle details',
        ],
      },
    ],
    tools: [
      { label: 'VIN Decode', icon: 'qr_code' },
      { label: 'DMS Integration', icon: 'storage' },
    ],
    whyCameUp: 'Service advisors flagged 7 conversations where they had to manually re-enter vehicle data because the agent did not capture the VIN during the call.',
    changesSummary: 'A VIN capture step will be added to the service intake procedure, with automatic decode and DMS pre-fill.',
  },
]


const GAP_COLORS: Record<GapType, string> = {
  procedure: 'bg-[#4F46E5]',
  knowledge:  'bg-[#F59E0B]',
  action:     'bg-[#10B981]',
}

const GAP_LABEL: Record<GapType, string> = {
  procedure: 'Procedure gap',
  knowledge:  'Knowledge gap',
  action:     'Action gap',
}

const GAP_TEXT: Record<GapType, string> = {
  procedure: 'text-[#4F46E5]',
  knowledge:  'text-[#F59E0B]',
  action:     'text-[#10B981]',
}

const GAP_ICON: Record<GapType, string> = {
  procedure: 'description',
  knowledge:  'menu_book',
  action:     'build',
}

const PRIORITY_VARIANT: Record<Priority, 'danger' | 'warning' | 'neutral'> = {
  High:   'danger',
  Medium: 'warning',
  Low:    'neutral',
}

type SortOption = 'impact' | 'newest'

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'impact', label: 'Impact' },
  { id: 'newest', label: 'Newest' },
]

const FILTER_OPTIONS: { id: GapType; label: string }[] = [
  { id: 'procedure', label: 'Procedure gap' },
  { id: 'knowledge', label: 'Knowledge gap' },
  { id: 'action', label: 'Action gap' },
]

const ALL_GAP_TYPES: GapType[] = ['procedure', 'knowledge', 'action']

const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 }

function parseHoursAgo(timeAgo: string): number {
  const match = timeAgo.match(/(\d+)h/)
  return match ? parseInt(match[1], 10) : 999
}

function sortRecommendations(recs: Recommendation[], sort: SortOption): Recommendation[] {
  const copy = [...recs]
  if (sort === 'newest') {
    return copy.sort((a, b) => parseHoursAgo(a.timeAgo) - parseHoursAgo(b.timeAgo))
  }
  return copy.sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return b.conversationCount - a.conversationCount
  })
}

function FilterCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex size-[18px] shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-control-border bg-surface'
      }`}
    >
      {checked && <Icon name="check" size={14} weight={500} className="text-white" />}
    </span>
  )
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption
  onChange: (value: SortOption) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedLabel = SORT_OPTIONS.find((option) => option.id === value)!.label

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-xs rounded-sm border border-border-selected bg-surface px-sm py-xs text-small text-text-secondary hover:bg-surface-l2"
      >
        {selectedLabel}
        <Icon name="expand_more" size={14} className="text-text-icon" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full z-[110] mt-xs min-w-[168px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id)
                  setOpen(false)
                }}
                className={`block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover ${
                  value === option.id ? 'bg-surface-hover' : ''
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function FilterDropdown({
  value,
  onChange,
}: {
  value: GapType[]
  onChange: (value: GapType[]) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = new Set(value)
  const filterCount = value.length < ALL_GAP_TYPES.length ? 1 : 0

  function toggle(id: GapType) {
    if (selected.has(id)) {
      onChange(value.filter((gapType) => gapType !== id))
      return
    }
    onChange([...value, id])
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-xs rounded-sm border border-border-selected bg-surface px-sm py-xs text-small text-text-secondary hover:bg-surface-l2"
      >
        <Icon name="filter_list" size={14} className="text-text-icon" />
        Filters {filterCount}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full z-[110] mt-xs min-w-[200px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
            {FILTER_OPTIONS.map((option) => {
              const checked = selected.has(option.id)
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggle(option.id)}
                  className="flex w-full items-center gap-sm px-md py-sm text-left hover:bg-surface-hover"
                >
                  <FilterCheckbox checked={checked} />
                  <span className="text-body text-text-primary">{option.label}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function GapTypeLegend() {
  const types: GapType[] = ['procedure', 'knowledge', 'action']
  const counts = {
    procedure: RECOMMENDATIONS.filter((r) => r.gapType === 'procedure').length,
    knowledge:  RECOMMENDATIONS.filter((r) => r.gapType === 'knowledge').length,
    action:     RECOMMENDATIONS.filter((r) => r.gapType === 'action').length,
  }
  const total = RECOMMENDATIONS.length

  return (
    <div className="flex flex-col gap-sm">
      {/* stacked progress bar */}
      <div className="flex h-1.5 w-full overflow-hidden rounded-full">
        {types.map((t) => (
          <div
            key={t}
            className={`${GAP_COLORS[t]} transition-all`}
            style={{ width: `${(counts[t] / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex items-center gap-lg">
        {types.map((t) => (
          <div key={t} className="flex items-center gap-xs">
            <span className={`size-2 rounded-full ${GAP_COLORS[t]}`} />
            <span className="text-small text-text-secondary">{GAP_LABEL[t]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecommendationCard({
  rec,
  selected,
  onClick,
}: {
  rec: Recommendation
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-sm border text-left transition-colors ${
        selected
          ? 'border-primary bg-surface-selected'
          : 'border-border bg-surface hover:bg-surface-hover'
      }`}
    >
      <div className="flex flex-col gap-xs p-md">
        <div className="flex items-center gap-xs">
          <Icon name={GAP_ICON[rec.gapType]} size={14} className={GAP_TEXT[rec.gapType]} />
          <span className={`text-small uppercase tracking-wide ${GAP_TEXT[rec.gapType]}`}>
            {GAP_LABEL[rec.gapType]}
          </span>
        </div>
        <span className="text-body text-text-primary">{rec.title}</span>
        <p className="line-clamp-2 text-small text-text-secondary">{rec.description}</p>
        <div className="flex items-center justify-between pt-xs">
          <Chip label={rec.priority} variant={PRIORITY_VARIANT[rec.priority]} />
          <span className="text-small text-text-tertiary">{rec.timeAgo}</span>
        </div>
      </div>
    </button>
  )
}

function OriginalVsModified({ changes }: { changes: OriginalChange[] }) {
  return (
    <div className="flex flex-col gap-sm">
      {changes.map((c, i) => (
        <div key={i} className="flex flex-col gap-xs rounded-sm border border-border bg-surface-subtle p-md">
          <span className="text-small text-text-secondary">{c.label}</span>
          <div className="flex flex-col gap-xs">
            <div className="rounded-sm bg-chip-danger-bg px-sm py-xs">
              <span className="text-small text-chip-danger-text line-through">{c.before}</span>
            </div>
            <div className="rounded-sm bg-chip-success-bg px-sm py-xs">
              <span className="text-small text-chip-success-text">{c.after}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailPanel({ rec }: { rec: Recommendation }) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Recommendation callout */}
      <div className="border-b border-border px-2xl py-lg">
        <div className="flex items-start gap-md rounded-sm border border-border bg-surface p-md shadow-card">
          <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
            <Icon name="auto_awesome" size={18} className="text-primary" />
          </div>
          <div className="flex flex-1 flex-col gap-xs">
            <div className="flex items-center justify-between gap-md">
              <span className="text-small text-text-secondary">Recommendation</span>
              <span className="text-small text-text-tertiary">{rec.timeAgo}</span>
            </div>
            <p className="text-body text-text-primary">{rec.description}</p>
            <button className="flex items-center gap-xs text-small text-text-action hover:underline">
              <Icon name="sms" size={14} />
              View {rec.conversationCount} conversations
            </button>
          </div>
        </div>
        {/* Action row */}
        <div className="mt-md flex items-center justify-end gap-sm">
          <button className="flex h-9 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2">
            Reject
          </button>
          <button className="flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2">
            <Icon name="play_arrow" size={16} className="text-text-icon" />
            Test
          </button>
          <button className="flex h-9 items-center gap-xs rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover">
            Add
            <Icon name="expand_more" size={16} />
          </button>
        </div>
      </div>

      {/* Procedure content */}
      <div className="flex flex-col gap-lg px-2xl py-xl">
        {/* Title + tag */}
        <div className="flex flex-col gap-xs">
          <h2 className="text-h2 text-text-primary">{rec.title}</h2>
          <div className="flex items-center gap-xs text-small text-text-secondary">
            <Icon name={rec.isNew ? 'add_circle' : 'edit'} size={14} className="text-text-icon" />
            <span>{rec.isNew ? 'Adds new procedure' : 'Modifies existing procedure'}</span>
          </div>
        </div>

        {/* When to use */}
        <div className="flex flex-col gap-xs">
          <span className="text-small text-text-tertiary">When to use</span>
          <p className="text-body text-text-primary">{rec.whenToUse}</p>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-md">
          {rec.steps.map((step, i) => (
            <div key={i} className="flex flex-col gap-xs">
              <span className="text-body text-text-primary">
                {i + 1}. {step.title}
              </span>
              <ul className="flex flex-col gap-xs pl-lg">
                {step.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-text-tertiary" />
                    <span className="text-body text-text-secondary">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Tools */}
        {rec.tools.length > 0 && (
          <div className="flex flex-col gap-xs">
            <span className="text-small text-text-tertiary">Tools</span>
            <div className="flex flex-wrap gap-sm">
              {rec.tools.map((t) => (
                <div
                  key={t.label}
                  className="flex items-center gap-xs rounded-sm border border-border bg-surface px-sm py-xs text-small text-text-secondary"
                >
                  <Icon name={t.icon} size={14} className="text-text-icon" />
                  {t.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Why / what changed */}
        <div className="flex flex-col gap-md rounded-sm border border-border bg-surface-subtle p-md">
          <div className="flex flex-col gap-xs">
            <span className="text-small text-text-secondary">Why this came up</span>
            <p className="text-body text-text-primary">{rec.whyCameUp}</p>
          </div>
          <div className="flex flex-col gap-xs">
            <span className="text-small text-text-secondary">What changes</span>
            <p className="text-body text-text-primary">{rec.changesSummary}</p>
          </div>
          {rec.originalChanges && rec.originalChanges.length > 0 && (
            <div className="flex flex-col gap-xs">
              <span className="text-small text-text-secondary">Before / after</span>
              <OriginalVsModified changes={rec.originalChanges} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────────

export function RecommendationsScreen() {
  const [selected, setSelected] = useState<string>(RECOMMENDATIONS[0].id)
  const [sortBy, setSortBy] = useState<SortOption>('impact')
  const [gapFilter, setGapFilter] = useState<GapType[]>(ALL_GAP_TYPES)

  const visibleRecommendations = sortRecommendations(
    RECOMMENDATIONS.filter((rec) => gapFilter.includes(rec.gapType)),
    sortBy,
  )
  const selectedRec = visibleRecommendations.find((r) => r.id === selected) ?? visibleRecommendations[0]

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopNav initials="S" />

      {/* Flagged banner */}
      <div className="flex shrink-0 items-center gap-sm border-b border-border bg-chip-warning-bg px-2xl py-sm">
        <Icon name="flag" size={16} className="text-chip-warning-text" />
        <span className="text-body text-chip-warning-text">
          Improve agent&apos;s response
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — list */}
        <div className="flex w-[380px] shrink-0 flex-col overflow-hidden border-r border-border">
          {/* Header */}
          <div className="flex flex-col gap-md border-b border-border px-lg py-lg">
            <div className="flex items-center justify-between">
              <span className="text-h3 text-text-primary">Recommendations</span>
              <div className="flex items-center gap-xs">
                <span className="text-small text-text-tertiary">{visibleRecommendations.length} items</span>
                <SortDropdown value={sortBy} onChange={setSortBy} />
                <FilterDropdown value={gapFilter} onChange={setGapFilter} />
              </div>
            </div>
            <GapTypeLegend />
            <p className="text-small text-text-secondary">
              Sorted by impact on unresolved conversations.
            </p>
          </div>

          {/* Scrollable list */}
          <div className="flex flex-1 flex-col gap-xs overflow-y-auto p-md">
            {visibleRecommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                selected={rec.id === selected}
                onClick={() => setSelected(rec.id)}
              />
            ))}
          </div>
        </div>

        {/* Right panel — detail */}
        {selectedRec ? (
          <DetailPanel rec={selectedRec} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-small text-text-tertiary">
            No recommendations match these filters.
          </div>
        )}
      </div>
    </div>
  )
}
