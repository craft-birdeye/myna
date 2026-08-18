import { useState } from 'react'
import { Icon, Tooltip, TopNav } from '../components'
import {
  FigmaIconFrontDesk,
  FigmaIconSurveys,
  FigmaIconTicketing,
  FigmaIconContentHub,
  FigmaIconRecommendations,
} from '../components/l1Icons'
import jayIcon from '../assets/icon-jay.svg'
import mynaIcon from '../assets/icon-myna.svg'
import robinIcon from '../assets/icon-robin.svg'
import { getAgentDirectory } from '../data/agentDirectoryData'
import { DonutChart } from '../components/charts/DonutChart'
import { StackedBarChart } from '../components/charts/StackedBarChart'
import { ChartCard } from '../components/charts/ChartCard'
import { chartColors } from '../components/charts/chartColors'
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
  OVERVIEW_LISTINGS_GOOGLE_REPORT,
} from '../data/overviewData'

interface OverviewV3ScreenProps {
  userName?: string
}

const KPI_ROW_CLASS = 'flex flex-wrap gap-xl'
const KPI_TILE_CLASS = 'min-w-[140px] shrink-0'

// "18.3K" -> 18300, "151" -> 151 — lets the donut charts below size slices off the same
// display strings already shown elsewhere, instead of maintaining a second set of raw numbers.
function parseKValue(value: string): number {
  return value.endsWith('K') ? parseFloat(value) * 1000 : parseFloat(value)
}

// Listings sync-status breakdown, reusing the app's semantic chart colors (resolved/escalated/
// unresolved/unresponded) so "healthy vs. needs attention" reads the same way it does elsewhere.
const LISTINGS_SYNC_STATUS_IDS = ['synced', 'not-synced', 'submitted', 'not-connected', 'opted-out']
const LISTINGS_SYNC_STATUS_COLORS: Record<string, string> = {
  synced: chartColors.resolved,
  'not-synced': chartColors.escalated,
  submitted: chartColors.blue,
  'not-connected': chartColors.unresolved,
  'opted-out': chartColors.unresponded,
}

// Search AI's own KPI set — adds Sentiment score alongside the shared OVERVIEW_V2_SECTIONS data
// (kept local to v3 rather than editing the shared file, since v2 shouldn't pick up the new KPI).
// Average rank is excluded from the percent-of-100 bar chart below since it isn't a percentage.
const SEARCH_AI_STATS: V2Stat[] = [
  { id: 'search-ai-score', value: '33.6%', label: 'Search AI score' },
  { id: 'citation-share', value: '17.6%', label: 'Citation share' },
  { id: 'visibility-score', value: '60.2%', label: 'Visibility score' },
  { id: 'sentiment-score', value: '78%', label: 'Sentiment score' },
  { id: 'average-rank', value: '4', label: 'Average rank' },
]
const SEARCH_AI_PERCENT_IDS = ['search-ai-score', 'citation-share', 'visibility-score', 'sentiment-score']

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

function ActionNeeded({ stats, bordered = true }: { stats: V2Stat[]; bordered?: boolean }) {
  return (
    <div className={`flex flex-col gap-md ${bordered ? 'border-t border-border pt-lg' : ''}`}>
      <h4 className="m-0 flex items-center gap-sm text-body text-text-primary">
        <Icon name="warning" size={20} className="text-text-icon" />
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

// "Today"/"Last week" are short enough that hours read naturally; anything longer accumulates
// enough hours that days is the more readable unit. Mirrors Classic Overview's own helper.
function formatTimeSaved(hours: number, dateRange: string): string {
  return dateRange === 'Today' || dateRange === 'Last week' ? `${hours}h` : `${(hours / 24).toFixed(1)} days`
}

// Same info-hover affordance as the shared InfoTooltip, but built on the Material Symbol `Icon`
// (already used everywhere else on this page) instead of InfoTooltip's own bundled SVG image —
// avoids a broken-icon glyph some browsers render for that standalone <img>.
function EstimateTooltip() {
  return (
    <Tooltip content="Estimates from similar businesses" variant="detail">
      <button
        type="button"
        className="flex items-center justify-center text-text-tertiary hover:text-text-secondary"
        aria-label="More info"
      >
        <Icon name="info" size={14} />
      </button>
    </Tooltip>
  )
}

// Picks the one agent+stat a section's FTU setup banner should lead with: the first time-saved
// or cost-saved figure found across the section's agents (a real "why bother" number), falling
// back to that agent's first stat if none of them save time or cost.
function pickFeaturedStat(agents: V2Agent[]): { agentName: string; value: string; metricLabel: string } {
  for (const agent of agents) {
    const savedStat = agent.stats.find((s) => s.id === 'time-saved' || s.id === 'cost-saved')
    if (savedStat) return { agentName: agent.name, value: savedStat.value, metricLabel: savedStat.label.toLowerCase() }
  }
  const [first] = agents
  const [firstStat] = first.stats
  return { agentName: first.name, value: firstStat.value, metricLabel: firstStat.label.toLowerCase() }
}

// FTU-only footer banner for a product section — assumes no agent is enabled yet, so it promotes
// setting one up instead of showing the (hidden) agent rows. Bleeds edge-to-edge like the AI
// workforce summary's own promo banner. Empty/Filled states never show this.
function AgentSetupBanner({ icon, agentName, value, metricLabel }: { icon: string; agentName: string; value: string; metricLabel: string }) {
  return (
    <div className="-mx-xl -mb-xl flex items-center gap-lg rounded-b-md bg-ai-summary p-lg">
      <img src={icon} alt="" className="size-9 shrink-0 rounded-full border-2 border-surface" />
      <p className="m-0 min-w-0 flex-1 truncate text-body text-text-primary">
        Set up your {agentName} to save up to {value} in {metricLabel}.
      </p>
      <button
        type="button"
        className="flex h-9 shrink-0 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
      >
        Create agent
      </button>
    </div>
  )
}

// Shown in all three states — Empty/FTU keep the estimate framing ("~" values, muted, tooltip)
// since nothing's running yet; Filled assumes the co-workers are live, so the same card shows the
// real totals in full-strength black instead of grey. Empty/FTU also lead with a promo banner
// bled to the card's top edge; Empty additionally gets a "Schedule demo" CTA that FTU omits.
function AiWorkforceSummaryCard({ dataState, dateRange }: { dataState: DataState; dateRange: string }) {
  const filled = dataState === 'filled'
  const agents = getAgentDirectory('healthcare')
  const totalAgents = agents.length
  const totalHours = agents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const totalCostK = agents.reduce((sum, a) => sum + parseFloat(a.costSaved.replace(/[$K]/g, '')), 0)

  const stats: { id: string; value: string; label: string; muted?: boolean; tooltip?: boolean }[] = filled
    ? [
        { id: 'co-workers', value: '3', label: 'Co-workers' },
        { id: 'agents', value: String(totalAgents), label: 'Agents' },
        { id: 'time-saved', value: formatTimeSaved(totalHours, dateRange), label: 'Time saved' },
        { id: 'cost-saved', value: `$${totalCostK.toFixed(1)}K`, label: 'Cost saved' },
      ]
    : [
        { id: 'co-workers', value: '3', label: 'Co-workers', muted: dataState === 'empty' },
        { id: 'agents', value: String(totalAgents), label: 'Agents', muted: true },
        { id: 'time-saved', value: `~${formatTimeSaved(totalHours, dateRange)}`, label: 'Time saved', muted: true, tooltip: true },
        { id: 'cost-saved', value: `~$${totalCostK.toFixed(1)}K`, label: 'Cost saved', muted: true, tooltip: true },
      ]
  return (
    <SectionCard>
      {!filled && (
        <div className="-mx-xl -mt-xl flex items-center gap-lg rounded-t-md bg-ai-summary p-lg">
          <div className="flex shrink-0 items-center">
            <img src={jayIcon} alt="" className="size-9 rounded-full border-2 border-surface" />
            <img src={mynaIcon} alt="" className="-ml-3 size-9 rounded-full border-2 border-surface" />
            <img src={robinIcon} alt="" className="-ml-3 size-9 rounded-full border-2 border-surface" />
          </div>
          <p className="m-0 min-w-0 flex-1 truncate text-body text-text-primary">
            Introducing AI co-workers - Jay, Myna and Robin. Together they can save up to {formatTimeSaved(totalHours, dateRange)} and ${totalCostK.toFixed(1)}K. Set up your agents and start saving today.
          </p>
          {dataState === 'empty' && (
            <button
              type="button"
              className="flex h-9 shrink-0 items-center rounded-sm bg-ai-brand px-lg text-body text-white transition-colors hover:opacity-90"
            >
              Schedule demo
            </button>
          )}
        </div>
      )}
      <h3 className="m-0 text-[16px] leading-6 tracking-[-0.32px] text-text-primary">AI workforce summary</h3>
      <div className={KPI_ROW_CLASS}>
        {stats.map((s) => (
          <div key={s.id} className={KPI_TILE_CLASS}>
            <p className={`m-0 whitespace-nowrap text-display ${s.muted ? 'text-text-tertiary' : 'text-text-primary'}`}>{s.value}</p>
            <p className="m-0 mt-xs flex items-center gap-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">
              {s.label}
              {s.tooltip && <EstimateTooltip />}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

// Front desk (owner: Myna) spans 4 sub-areas that share one date filter — each sub-area gets its
// own business-metrics / agent-outcomes / human-actions rows, same visual vocabulary as the other
// sections above. Business metrics and agents lay out in a 2-column grid so rows align into clean
// columns AND use the card's full width, instead of either a jagged wrap or a single narrow column.
function FrontDeskSection({ showAgents, showSetupBanner }: { showAgents: boolean; showSetupBanner: boolean }) {
  const allHumanActions = OVERVIEW_V2_FRONTDESK_SUBAREAS.flatMap((area) => area.humanActions)
  const featuredStat = pickFeaturedStat(
    OVERVIEW_V2_FRONTDESK_SUBAREAS.map((area) => ({ id: area.id, name: area.agentName, stats: area.agentOutcomes }))
  )

  return (
    <SectionCard>
      <h3 className="m-0 flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
        <FigmaIconFrontDesk size={20} className="text-text-icon" />
        Front desk
      </h3>

      <div className="grid grid-cols-2 gap-x-3xl gap-y-lg">
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

      {showSetupBanner && <AgentSetupBanner icon={mynaIcon} {...featuredStat} />}
    </SectionCard>
  )
}

type DataState = 'filled' | 'empty' | 'ftu'

// Floating switcher (fixed to the viewport, always visible) between the fully-populated demo
// data and an "empty state" preview that drops every co-worker/agent row from each product area.
// FTU (first-time user) is a duplicate of Empty state — same "no agents yet" view, kept as its
// own option so it can diverge later without touching Empty state's behavior.
function DataStateSwitcher({ value, onChange }: { value: DataState; onChange: (value: DataState) => void }) {
  const OPTIONS: { id: DataState; label: string }[] = [
    { id: 'empty', label: 'Empty state' },
    { id: 'ftu', label: 'FTU' },
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

export function OverviewV3Screen({ userName = 'Rupa' }: OverviewV3ScreenProps = {}) {
  const [dateRange, setDateRange] = useState('Last month')
  const [dataState, setDataState] = useState<DataState>('empty')
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

          <AiWorkforceSummaryCard dataState={dataState} dateRange={dateRange} />

          {OVERVIEW_V2_SECTIONS.map((section) => {
            const NavIcon = SECTION_NAV_ICON[section.id]
            const isCx = CX_SECTION_IDS.has(section.id)
            const showAgentRows = showAgents && section.agents.length > 0
            const showSetupBanner = dataState === 'ftu' && section.agents.length > 0
            const hasBodyContent = Boolean(section.stats) || section.id === 'reviews' || showAgentRows
            const hasAnyContent = hasBodyContent || Boolean(section.actionNeeded) || showSetupBanner
            if (!hasAnyContent) return null
            return (
              <SectionCard key={section.id}>
                <h3 className="m-0 flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
                  {NavIcon ? <NavIcon size={20} className="text-text-icon" /> : <Icon name={section.icon} size={20} className="text-text-icon" />}
                  {section.label}
                </h3>

                {section.id === 'listings' ? (
                  <>
                    <V2StatGroup stats={(section.stats ?? []).filter((s) => !LISTINGS_SYNC_STATUS_IDS.includes(s.id))} />
                    <div className="grid grid-cols-2 gap-lg">
                      <ChartCard title="Sync status">
                        <DonutChart
                          data={(section.stats ?? [])
                            .filter((s) => LISTINGS_SYNC_STATUS_IDS.includes(s.id))
                            .map((s) => ({ name: s.label, value: parseFloat(s.value), color: LISTINGS_SYNC_STATUS_COLORS[s.id] }))}
                        />
                      </ChartCard>
                      <ChartCard title="Google report">
                        <DonutChart
                          data={OVERVIEW_LISTINGS_GOOGLE_REPORT.map((s, i) => ({
                            name: s.label,
                            value: parseKValue(s.value),
                            color: chartColors.categorical[i],
                          }))}
                        />
                      </ChartCard>
                    </div>
                  </>
                ) : section.id === 'search-ai' ? (
                  <>
                    <V2StatGroup stats={SEARCH_AI_STATS} />
                    <ChartCard title="Search AI KPIs" tooltip="Each KPI shown as a percentage of 100.">
                      <StackedBarChart
                        data={SEARCH_AI_STATS.filter((s) => SEARCH_AI_PERCENT_IDS.includes(s.id)).map((s) => ({
                          metric: s.label,
                          value: parseFloat(s.value),
                        }))}
                        series={[{ key: 'value', label: 'Score', color: chartColors.blue }]}
                        xKey="metric"
                        height={280}
                        yDomain={[0, 100]}
                        hideLegend
                      />
                    </ChartCard>
                  </>
                ) : (
                  section.stats && <V2StatGroup stats={section.stats} />
                )}

                {section.id === 'reviews' && <ReviewsOverview />}

                {showAgentRows && (
                  <div className="flex flex-wrap gap-xl border-t border-border pt-lg">
                    {section.agents.map((agent) => (
                      <AgentRow key={agent.id} agent={agent} icon={isCx ? robinIcon : jayIcon} />
                    ))}
                  </div>
                )}

                {section.actionNeeded && <ActionNeeded stats={section.actionNeeded} bordered={hasBodyContent} />}

                {showSetupBanner && <AgentSetupBanner icon={isCx ? robinIcon : jayIcon} {...pickFeaturedStat(section.agents)} />}
              </SectionCard>
            )
          })}

          <FrontDeskSection showAgents={showAgents} showSetupBanner={dataState === 'ftu'} />
        </div>
      </div>

      <DataStateSwitcher value={dataState} onChange={setDataState} />
    </div>
  )
}
