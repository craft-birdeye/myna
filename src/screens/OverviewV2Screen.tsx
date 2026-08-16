import { useState } from 'react'
import { Icon, InfoTooltip, TopNav } from '../components'
import {
  FigmaIconFrontDesk,
  FigmaIconSurveys,
  FigmaIconTicketing,
  FigmaIconContentHub,
  FigmaIconRecommendations,
} from '../components/l1Icons'
import jayIcon from '../assets/icon-jay.svg'
import actionNeededIcon from '../assets/icon-action-needed.svg'
import mynaIcon from '../assets/icon-myna.svg'
import robinIcon from '../assets/icon-robin.svg'
import {
  OVERVIEW_V2_SECTIONS,
  OVERVIEW_V2_FRONTDESK_SUBAREAS,
  type V2Agent,
  type V2Stat,
} from '../data/overviewV2Data'
import {
  OVERVIEW_REVIEWS_BREAKDOWN,
  OVERVIEW_REVIEWS_RATING,
  OVERVIEW_REVIEW_SOURCES,
} from '../data/overviewData'

interface OverviewV2ScreenProps {
  userName?: string
}

const KPI_ROW_CLASS = 'flex flex-wrap gap-xl'
const KPI_TILE_CLASS = 'min-w-[140px] shrink-0'

// KPI numbers on this page are rendered in the brand action-blue (rather than the usual black)
// to visually separate "automated by an agent" metrics from the rest of the app.
function V2StatGroup({ stats, nowrap = false }: { stats: V2Stat[]; nowrap?: boolean }) {
  return (
    <div className={`flex ${nowrap ? 'flex-nowrap' : 'flex-wrap'} gap-xl`}>
      {stats.map((s) => (
        <div key={s.id} className={KPI_TILE_CLASS}>
          <p className="m-0 whitespace-nowrap text-display text-text-action">{s.value}</p>
          <p className="m-0 mt-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// flex-none (rather than flex-1/min-w) sizes each agent to its own content width — all of its
// KPIs stay on one line, and the whole block wraps to the next row as a unit when it doesn't fit.
function AgentRow({ agent, icon = jayIcon }: { agent: V2Agent; icon?: string }) {
  return (
    <div className="flex flex-none flex-col gap-md">
      <h4 className="m-0 flex items-center gap-sm text-body text-text-primary">
        <img src={icon} alt="" className="size-5 shrink-0 rounded-full" />
        {agent.name}
      </h4>
      <V2StatGroup stats={agent.stats} nowrap />
    </div>
  )
}

function ActionNeeded({ stats }: { stats: V2Stat[] }) {
  return (
    <div className="flex flex-col gap-md border-t border-border pt-lg">
      <h4 className="m-0 flex items-center gap-sm text-body text-text-primary">
        <img src={actionNeededIcon} alt="" className="size-5 shrink-0" />
        Action needed
      </h4>
      <div className={KPI_ROW_CLASS}>
        {stats.map((s) => (
          <div key={s.id} className={KPI_TILE_CLASS}>
            <p className="m-0 whitespace-nowrap text-display text-chip-danger-text">{s.value}</p>
            <p className="m-0 mt-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Reviews gets its own richer layout (rating + breakdown bars + source cards) instead of the
// generic top-stats row every other section uses — same content as Classic Overview's Reviews
// section, kept as an independent copy rather than a cross-import.
function ReviewsOverview() {
  const maxCount = Math.max(...OVERVIEW_REVIEWS_BREAKDOWN.map((b) => b.count))
  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-center gap-sm">
        <span className="text-display text-text-primary">{OVERVIEW_REVIEWS_RATING}</span>
        <div className="flex items-center gap-[2px] text-[#f5a623]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Icon key={i} name="star" size={18} fill />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-3xl">
        <div className="flex min-w-[320px] max-w-[50%] flex-1 flex-col gap-sm">
          {OVERVIEW_REVIEWS_BREAKDOWN.map((b) => (
            <div key={b.stars} className="flex items-center gap-md">
              <span className="w-[28px] shrink-0 text-small text-text-secondary">{b.stars} ★</span>
              <div className="flex flex-1 items-center gap-sm">
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-selected">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[#f5a623]"
                    style={{ width: `${(b.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-[64px] shrink-0 text-right text-small text-text-secondary">{b.count.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex min-w-[280px] flex-1 flex-wrap items-start gap-md">
          {OVERVIEW_REVIEW_SOURCES.map((s) => (
            <div key={s.id} className="flex min-w-[220px] flex-1 items-center gap-md rounded-sm border border-border px-lg py-md">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-body ${s.iconColorClassName}`}>
                {s.icon === 'G' ? 'G' : <Icon name={s.icon} size={18} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-small text-text-tertiary">{s.name}</p>
                <p className="m-0 flex items-center gap-xs text-body text-text-primary">
                  {s.rating}
                  <Icon name="star" size={14} fill className="text-[#f5a623]" />
                  <span className="text-small text-text-tertiary">{s.reviewCount}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Surveys and Ticketing are owned by Robin (Customer experience), not Jay (Marketing) — their
// section heading uses the same icon as the L1 nav item, and their agent rows use Robin's icon.
const SECTION_NAV_ICON: Record<string, (props: { size?: number; className?: string }) => React.ReactNode> = {
  surveys: FigmaIconSurveys,
  ticketing: FigmaIconTicketing,
  'content-hub': FigmaIconContentHub,
  'search-ai': FigmaIconRecommendations,
}
const CX_SECTION_IDS = new Set(['surveys', 'ticketing'])

const DATE_RANGE_OPTIONS = ['Today', 'Last week', 'Last month', 'Last quarter']

function DateRangeDropdown({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-xs rounded-md border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
      >
        {value}
        <Icon name="expand_more" size={18} className="text-text-icon" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-[110] mt-xs min-w-[160px] rounded-sm border border-border bg-surface p-md shadow-dropdown">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-sm rounded-sm px-md py-sm text-left ${
                  opt === value ? 'bg-surface-selected' : 'hover:bg-surface-hover'
                }`}
              >
                <span className="min-w-0 flex-1 truncate text-body text-text-primary">{opt}</span>
                {opt === value && <Icon name="check" size={18} className="shrink-0 text-text-icon" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-xl rounded-md border border-border bg-surface p-xl">{children}</div>
}

// Shown only in empty state, in place of the co-worker/agent rows this toggle otherwise hides —
// same "AI workforce summary" card + promo banner as Classic Overview's zero state, so switching
// to Empty state still promotes setting the co-workers up instead of leaving a content void.
function AiWorkforceSummaryCard() {
  const stats: { id: string; value: string; label: string; muted?: boolean }[] = [
    { id: 'co-workers', value: '3', label: 'Co-workers' },
    { id: 'agents', value: '0', label: 'Agents' },
    { id: 'time-saved', value: '~13.8 days', label: 'Time saved', muted: true },
    { id: 'cost-saved', value: '~$25.0K', label: 'Cost saved', muted: true },
  ]
  return (
    <SectionCard>
      <h3 className="m-0 text-[16px] leading-6 tracking-[-0.32px] text-text-primary">AI workforce summary</h3>
      <div className={KPI_ROW_CLASS}>
        {stats.map((s) => (
          <div key={s.id} className={KPI_TILE_CLASS}>
            <p className={`m-0 whitespace-nowrap text-display ${s.muted ? 'text-text-tertiary' : 'text-text-primary'}`}>{s.value}</p>
            <p className="m-0 mt-xs flex items-center gap-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">
              {s.label}
              {s.muted && <InfoTooltip text="Estimates from similar businesses" variant="detail" />}
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-lg rounded-md border border-ai-summary-border bg-ai-summary p-lg">
        <div className="flex shrink-0 items-center">
          <img src={mynaIcon} alt="" className="size-9 rounded-full border-2 border-surface" />
          <img src={jayIcon} alt="" className="-ml-3 size-9 rounded-full border-2 border-surface" />
          <img src={robinIcon} alt="" className="-ml-3 size-9 rounded-full border-2 border-surface" />
        </div>
        <p className="m-0 min-w-0 flex-1 truncate text-body text-text-primary">
          AI co-workers save up to 20 hours a week — set up yours and start saving today.
        </p>
      </div>
    </SectionCard>
  )
}

// Front desk (owner: Myna) spans 4 sub-areas that share one date filter — each sub-area gets its
// own business-metrics / agent-outcomes / human-actions rows, same visual vocabulary as the other
// sections above. Business metrics and agents lay out in a 2-column grid so rows align into clean
// columns AND use the card's full width, instead of either a jagged wrap or a single narrow column.
function FrontDeskSection({ showAgents }: { showAgents: boolean }) {
  const allHumanActions = OVERVIEW_V2_FRONTDESK_SUBAREAS.flatMap((area) => area.humanActions)

  return (
    <SectionCard>
      <h3 className="m-0 flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
        <FigmaIconFrontDesk size={20} className="text-text-icon" />
        Front desk
      </h3>

      <div className="grid grid-cols-2 gap-x-3xl gap-y-lg border-t border-border pt-lg">
        {OVERVIEW_V2_FRONTDESK_SUBAREAS.map((area) => (
          <div key={area.id} className="flex flex-col gap-md">
            <h4 className="m-0 text-body text-text-primary">{area.label}</h4>
            <V2StatGroup stats={area.businessMetrics} />
          </div>
        ))}
      </div>

      {showAgents && (
        <div className="grid grid-cols-2 gap-x-3xl gap-y-lg border-t border-border pt-lg">
          {OVERVIEW_V2_FRONTDESK_SUBAREAS.map((area) => (
            <AgentRow
              key={area.id}
              icon={mynaIcon}
              agent={{ id: `${area.id}-agent-outcomes`, name: area.agentName, stats: area.agentOutcomes }}
            />
          ))}
        </div>
      )}

      <ActionNeeded stats={allHumanActions} />
    </SectionCard>
  )
}

// Floating switcher (fixed to the viewport, always visible) between the fully-populated demo
// data and an "empty state" preview that drops every co-worker/agent row from each product area.
function DataStateSwitcher({ value, onChange }: { value: 'filled' | 'empty'; onChange: (value: 'filled' | 'empty') => void }) {
  const OPTIONS: { id: 'empty' | 'filled'; label: string }[] = [
    { id: 'empty', label: 'Empty state' },
    { id: 'filled', label: 'Filled state' },
  ]
  return (
    <div className="fixed bottom-xl right-2xl z-50 flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface p-xs shadow-dropdown">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`flex h-7 items-center rounded-sm px-md text-body ${
            value === opt.id ? 'bg-surface-selected text-text-primary' : 'text-text-icon hover:bg-surface-hover'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function OverviewV2Screen({ userName = 'Rupa' }: OverviewV2ScreenProps = {}) {
  const [dateRange, setDateRange] = useState('Last month')
  const [dataState, setDataState] = useState<'filled' | 'empty'>('filled')
  const showAgents = dataState === 'filled'

  return (
    <div className="flex h-full flex-col">
      <TopNav title="Overview" initials="S" />
      <div className="flex-1 overflow-y-auto bg-surface-l2 px-2xl py-xl">
        <div className="flex flex-col gap-lg">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="m-0 text-display text-text-primary">Welcome, {userName}!</h1>
              <p className="m-0 mt-xs text-body text-text-secondary">Here are the things which need your attention.</p>
            </div>
            <DateRangeDropdown value={dateRange} onChange={setDateRange} />
          </div>

          {!showAgents && <AiWorkforceSummaryCard />}

          {OVERVIEW_V2_SECTIONS.map((section) => {
            const NavIcon = SECTION_NAV_ICON[section.id]
            const isCx = CX_SECTION_IDS.has(section.id)
            return (
              <SectionCard key={section.id}>
                <h3 className="m-0 flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
                  {NavIcon ? <NavIcon size={20} className="text-text-icon" /> : <Icon name={section.icon} size={20} className="text-text-icon" />}
                  {section.label}
                </h3>

                {section.stats && <V2StatGroup stats={section.stats} />}

                {section.id === 'reviews' && <ReviewsOverview />}

                {showAgents && section.agents.length > 0 && (
                  <div className="flex flex-wrap gap-xl border-t border-border pt-lg">
                    {section.agents.map((agent) => (
                      <AgentRow key={agent.id} agent={agent} icon={isCx ? robinIcon : jayIcon} />
                    ))}
                  </div>
                )}

                {section.actionNeeded && <ActionNeeded stats={section.actionNeeded} />}
              </SectionCard>
            )
          })}

          <FrontDeskSection showAgents={showAgents} />
        </div>
      </div>

      <DataStateSwitcher value={dataState} onChange={setDataState} />
    </div>
  )
}
