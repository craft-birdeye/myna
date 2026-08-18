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
import { ChartTooltip } from '../components/charts/ChartTooltip'
import { chartColors } from '../components/charts/chartColors'
import {
  OVERVIEW_V2_SECTIONS,
  OVERVIEW_V2_FRONTDESK_SUBAREAS,
  type V2Agent,
  type V2Stat,
  type V2Section,
} from '../data/overviewV2Data'
import {
  OVERVIEW_REVIEWS_BREAKDOWN,
  OVERVIEW_REVIEWS_RATING,
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
const SEARCH_AI_STATS: V2Stat[] = [{ id: 'search-ai-score', value: '33.6%', label: 'Search AI score' }]

// One bar per KPI (value + top-competitor marker on a single-color track), like the app's
// "Understanding the Birdeye Score" widget — not a grouped bar chart. Most are 0-100
// percentages; Average rank uses its own max (top-10 search positions) since it's a position,
// not a percentage — ScoreBar takes an explicit max so both scale correctly.
const SEARCH_AI_SCORE_BAR_COLOR = '#1976d2'
const SEARCH_AI_SCORE_BAR_TRACK_COLOR = '#d9d9d9'
const SEARCH_AI_SCORE_BARS: { id: string; label: string; value: number; topCompetitor: number; max?: number; color: string; note?: string }[] = [
  { id: 'citation-share', label: 'Citation share', value: 17.6, topCompetitor: 25, color: SEARCH_AI_SCORE_BAR_COLOR },
  { id: 'visibility-score', label: 'Visibility score', value: 60.2, topCompetitor: 55, color: SEARCH_AI_SCORE_BAR_COLOR },
  { id: 'sentiment-score', label: 'Sentiment score', value: 78, topCompetitor: 82, color: SEARCH_AI_SCORE_BAR_COLOR },
  {
    id: 'average-rank',
    label: 'Average rank',
    value: 4,
    topCompetitor: 1,
    max: 10,
    color: SEARCH_AI_SCORE_BAR_COLOR,
    note: 'This is your rank across ChatGPT, Claude, Copilot, Gemini, and more.',
  },
]

function ScoreBar({
  label,
  value,
  topCompetitor,
  max = 100,
  color,
  note,
}: {
  label: string
  value: number
  topCompetitor: number
  max?: number
  color: string
  note?: string
}) {
  return (
    <div className="flex flex-col gap-sm">
      <div>
        <p className="m-0 text-display text-text-primary">{value}</p>
        <p className="m-0 mt-xs text-small uppercase tracking-wide text-text-tertiary">{label}</p>
      </div>
      {note ? (
        <p className="m-0 text-small text-text-secondary">{note}</p>
      ) : (
        <>
          <div
            className="relative h-[6px] w-full rounded-full"
            style={{
              background: `linear-gradient(to right, ${color} ${(value / max) * 100}%, ${SEARCH_AI_SCORE_BAR_TRACK_COLOR} ${(value / max) * 100}%)`,
            }}
          >
            <span
              className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text-primary ring-2 ring-surface"
              style={{ left: `${(value / max) * 100}%` }}
            />
            <span
              className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text-tertiary ring-2 ring-surface"
              style={{ left: `${(topCompetitor / max) * 100}%` }}
            />
          </div>
          <p className="m-0 flex items-center gap-xs text-small text-text-secondary">
            <span className="inline-block size-2 shrink-0 rounded-full bg-text-tertiary" />
            Top competitor: {topCompetitor}
          </p>
        </>
      )}
    </div>
  )
}

// Reviews' own KPI set — Average rating leads (left to right), followed by Request sent and
// Reviews received; 3 star or less is dropped. Kept local to v3 rather than editing the shared
// OVERVIEW_V2_SECTIONS file, since v2 shouldn't pick up the reorder/removal.
const REVIEWS_STATS: V2Stat[] = [
  { id: 'average-rating', value: String(OVERVIEW_REVIEWS_RATING), label: 'Average rating' },
  { id: 'requests-sent', value: '1.9K', label: 'Request sent' },
  { id: 'reviews-received', value: '7', label: 'Reviews received' },
]

// Surveys has no top-level business-metric stats in the shared data (only agents/actionNeeded) —
// these two are v3-only.
const SURVEYS_STATS: V2Stat[] = [
  { id: 'active-surveys', value: '24', label: 'Active surveys' },
  { id: 'response-rate', value: '68%', label: 'Response rate' },
]

// Replaces the per-star horizontal breakdown bars with a single "Reviews by rating" bar chart
// (No rating -> 5 star), each bar its own color, matching the reference report widget.
function ratingCount(stars: number): number {
  return OVERVIEW_REVIEWS_BREAKDOWN.find((b) => b.stars === stars)?.count ?? 0
}
const REVIEWS_BY_RATING: { rating: string; count: number; color: string }[] = [
  { rating: 'No rating', count: 1850, color: '#cfe4f7' },
  { rating: '1 star', count: ratingCount(1), color: '#de1b0c' },
  { rating: '2 star', count: ratingCount(2), color: '#f5765a' },
  { rating: '3 star', count: ratingCount(3), color: '#f5a623' },
  { rating: '4 star', count: ratingCount(4), color: '#8bc34a' },
  { rating: '5 star', count: ratingCount(5), color: '#4cae3d' },
]

// Per-agent KPI overrides for sections whose agent stats differ from the shared
// OVERVIEW_V2_SECTIONS data (renamed labels, added/fixed KPIs) — kept local to v3 rather than
// editing the shared file, since v2 shouldn't pick up these changes. Sections not listed here
// (Social, Content hub, Surveys, Ticketing, Front desk) keep using the shared agent data as-is.
const AGENT_OVERRIDES: Record<string, V2Agent[]> = {
  'search-ai': [
    {
      id: 'recommendations-agent',
      name: 'Recommendations agent',
      stats: [
        { id: 'recs-generated', value: '18', label: 'Generated' },
        { id: 'recs-accepted', value: '7', label: 'Accepted' },
        { id: 'recs-completed', value: '2', label: 'Completed' },
        { id: 'time-saved', value: '4h', label: 'Time saved' },
      ],
    },
  ],
  reviews: [
    {
      id: 'review-marketing',
      name: 'Review marketing agent',
      stats: [
        { id: 'reviews-shared', value: '18', label: 'Reviews shared' },
        { id: 'time-saved', value: '7h', label: 'Time saved' },
      ],
    },
    {
      id: 'review-tagging',
      name: 'Review tagging agent',
      stats: [
        { id: 'reviews-tagged', value: '18', label: 'Reviews tagged' },
        { id: 'tagging-rate', value: '7', label: 'Tagging rate' },
        { id: 'time-saved', value: '5h', label: 'Time saved' },
      ],
    },
    {
      id: 'review-generation',
      name: 'Review generation agent',
      stats: [
        { id: 'reviews-received', value: '18', label: 'Reviews received' },
        { id: 'contacts-reached', value: '7', label: 'Contacts reached' },
        { id: 'click-through-rate', value: '7', label: 'Click through rate' },
        { id: 'time-saved', value: '6h', label: 'Time saved' },
      ],
    },
    {
      id: 'review-response',
      name: 'Review response agent',
      stats: [
        { id: 'review-responded', value: '18', label: 'Reviews responded' },
        { id: 'response-rate', value: '7', label: 'Response rate' },
        { id: 'time-saved', value: '7h', label: 'Time saved' },
      ],
    },
  ],
  surveys: [
    {
      id: 'survey-distribution',
      name: 'Survey distribution agent',
      stats: [
        { id: 'unique-contacts-reached', value: '1.2K', label: 'Unique contacts reached' },
        { id: 'responses-received', value: '18', label: 'Responses received' },
        { id: 'conversion-rate', value: '22%', label: 'Conversion rate' },
        { id: 'time-saved', value: '5h', label: 'Time saved' },
      ],
    },
    {
      id: 'survey-response',
      name: 'Survey response agent',
      stats: [
        { id: 'survey-responded', value: '18', label: 'Survey responded' },
        { id: 'response-rate', value: '72%', label: 'Response rate' },
        { id: 'average-response-time', value: '2h', label: 'Average response time' },
        { id: 'time-saved', value: '7h', label: 'Time saved' },
      ],
    },
  ],
  ticketing: [
    {
      id: 'ticketing-surveys',
      name: 'Ticketing agent · Surveys',
      stats: [
        { id: 'tickets-created', value: '212', label: 'Tickets created' },
        { id: 'tickets-opened', value: '45', label: 'Tickets opened' },
        { id: 'tickets-escalated', value: '5', label: 'Tickets escalated' },
        { id: 'time-saved', value: '3h', label: 'Time saved' },
      ],
    },
    {
      id: 'ticketing-reviews',
      name: 'Ticketing agent · Reviews',
      stats: [
        { id: 'tickets-created', value: '158', label: 'Tickets created' },
        { id: 'tickets-opened', value: '32', label: 'Tickets opened' },
        { id: 'tickets-escalated', value: '4', label: 'Tickets escalated' },
        { id: 'time-saved', value: '2h', label: 'Time saved' },
      ],
    },
  ],
}

// KPI numbers on this page are rendered in the brand action-blue (rather than the usual black)
// to visually separate "automated by an agent" metrics from the rest of the app.
// Action-needed stats are merged in here (flagged via `danger`) instead of getting their own
// "Action needed" block, so they sit inline beside the section's other KPIs — same tile, just
// red instead of blue.
function V2StatGroup({
  stats,
  nowrap = false,
  valueClassName,
}: {
  stats: (V2Stat & { danger?: boolean })[]
  nowrap?: boolean
  /** Overrides the default action-blue value color (e.g. dark grey for coworker/agent KPIs). Danger stats stay red regardless. */
  valueClassName?: string
}) {
  return (
    <div className={`flex ${nowrap ? 'flex-nowrap' : 'flex-wrap'} gap-xl`}>
      {stats.map((s) => (
        <div key={s.id} className={KPI_TILE_CLASS}>
          <p className={`m-0 whitespace-nowrap text-display ${s.danger ? 'text-chip-danger-text' : valueClassName ?? 'text-text-action'}`}>{s.value}</p>
          <p className="m-0 mt-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

function withDanger(stats: V2Stat[] | undefined): (V2Stat & { danger: true })[] {
  return (stats ?? []).map((s) => ({ ...s, danger: true }))
}

// Rough $/hour used to turn each section's summed "Time saved" into a "Cost saved" figure for
// the coworker-performance summary — none of these agents carry their own cost-saved stat.
const COST_SAVED_PER_HOUR = 25

function parseDollarValue(value: string): number {
  const n = parseFloat(value.replace(/[$,]/g, ''))
  if (isNaN(n)) return 0
  return value.includes('K') ? n * 1000 : n
}

function formatDollars(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${Math.round(n)}`
}

// Prefers each agent's own cost-saved stat when present (e.g. Front desk's agents already carry
// real $ figures); otherwise derives cost from summed time-saved hours at a flat rate, since most
// of these agents don't have their own cost-saved stat.
function aggregateAgentSavings(agents: V2Agent[]): { timeSaved: string; costSaved: string } {
  const totalHours = agents.reduce((sum, agent) => {
    const stat = agent.stats.find((s) => s.id === 'time-saved')
    return sum + (stat ? parseFloat(stat.value) || 0 : 0)
  }, 0)
  const hasCostStat = agents.some((agent) => agent.stats.some((s) => s.id === 'cost-saved'))
  const totalCost = hasCostStat
    ? agents.reduce((sum, agent) => {
        const stat = agent.stats.find((s) => s.id === 'cost-saved')
        return sum + (stat ? parseDollarValue(stat.value) : 0)
      }, 0)
    : totalHours * COST_SAVED_PER_HOUR
  return { timeSaved: `${totalHours}h`, costSaved: formatDollars(totalCost) }
}

// Sits just above a section's agent rows — the owning coworker's icon, a "{Name} performance"
// title, and that coworker's aggregate time/cost saved across every agent in the section.
function CoworkerPerformanceHeader({
  icon,
  coworkerName,
  timeSaved,
  costSaved,
}: {
  icon: string
  coworkerName: string
  timeSaved: string
  costSaved: string
}) {
  return (
    <div className="flex flex-col gap-md">
      <h4 className="m-0 flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
        <img src={icon} alt="" className="size-9 shrink-0 rounded-full" />
        {coworkerName} performance
      </h4>
      <V2StatGroup
        stats={[
          { id: 'time-saved', value: timeSaved, label: 'Time saved' },
          { id: 'cost-saved', value: costSaved, label: 'Cost saved' },
        ]}
        valueClassName="text-text-secondary"
      />
    </div>
  )
}

// One-line descriptions per agent id, sourced from the PDF requirements doc where it covered
// that agent, and from agentDirectoryData.ts's existing copy for agents shared across both
// (kept local since v2's AgentRow doesn't need them).
const AGENT_DESCRIPTIONS: Record<string, string> = {
  'listing-optimizer': 'Reviews your business listings for accuracy and completeness, then recommends and applies fixes to keep profiles synced.',
  'recommendations-agent': 'Generates and applies recommendations to improve how your business is surfaced across AI answer engines.',
  'review-marketing': 'Shares your best reviews across marketing channels and campaigns to build social proof.',
  'review-tagging': 'Automatically tags incoming reviews by topic and sentiment for easier reporting and routing.',
  'review-generation': 'Sends review requests to customers after transactions complete.',
  'review-response': 'Drafts replies to incoming reviews based on sentiment and brand voice.',
  'social-publishing': 'Schedules and publishes social posts across connected channels.',
  'social-engagement': 'Monitors and responds to comments and mentions in real time.',
  'faq-agent': 'Generates FAQ content for your website based on common customer questions.',
  'blog-agent': 'Generates blog posts to support your content and search visibility strategy.',
  'survey-distribution': 'Sends surveys to customers across email, text, and QR touchpoints after a qualifying interaction.',
  'survey-response': 'Collects and scores incoming survey responses, flagging detractors for follow-up.',
  'ticketing-surveys': 'Opens a support ticket automatically when a survey response flags a detractor or unresolved issue.',
  'ticketing-reviews': 'Sends a ticket to the right team whenever a low-star review comes in, routed by location and topic.',
  'front-desk': 'Handles inbound voice, chat, and text — answering questions, booking visits, and verifying insurance.',
  waitlist: 'Reaches out to waitlisted patients to fill cancelled or newly opened appointment slots.',
  'pre-visit': 'Sends pre-visit outreach and collects completed intake forms ahead of the appointment.',
  reminder: 'Sends automated appointment reminders and collects confirmations via text and email.',
}

// Maps each Front desk sub-area to the real agentDirectoryData.ts id behind it, so its card can
// share that agent's description and running count with the rest of the app.
const FRONTDESK_AGENT_ID: Record<string, string> = {
  conversations: 'front-desk',
  appointments: 'reminder',
  waitlist: 'waitlist',
  intake: 'pre-visit',
}

// Display order for the Front desk sub-areas, and the Waitlist human-action label trimmed of its
// "(5 high priority)" detail — kept local to v3, the shared data/order is untouched for v2.
const FRONTDESK_SUBAREA_ORDER = ['appointments', 'intake', 'conversations', 'waitlist']
function frontDeskSubareasForDisplay() {
  return FRONTDESK_SUBAREA_ORDER.map((id) => {
    const area = OVERVIEW_V2_FRONTDESK_SUBAREAS.find((a) => a.id === id)
    if (!area) return null
    if (area.id !== 'waitlist') return area
    return {
      ...area,
      humanActions: area.humanActions.map((s) => (s.id === 'waitlisted' ? { ...s, label: 'Waitlisted patients' } : s)),
    }
  }).filter((area): area is NonNullable<typeof area> => area !== null)
}

// Fixed (not Math.random — would reshuffle on every render) per-agent instance counts for the
// new "Agent running" KPI, varied enough to not look like a placeholder constant.
const AGENT_RUNNING_COUNT: Record<string, number> = {
  'listing-optimizer': 1,
  'recommendations-agent': 2,
  'review-marketing': 1,
  'review-tagging': 2,
  'review-generation': 1,
  'review-response': 2,
  'social-publishing': 1,
  'social-engagement': 1,
  'faq-agent': 2,
  'blog-agent': 1,
  'survey-distribution': 2,
  'survey-response': 1,
  'ticketing-surveys': 1,
  'ticketing-reviews': 2,
  'front-desk': 2,
  waitlist: 2,
  'pre-visit': 2,
  reminder: 2,
}

// One card per agent (name + description on the left, all its KPIs on the right), stacked
// vertically under the coworker-performance header — replaces the side-by-side AgentRow layout
// for the main product sections.
function AgentCard({ agent }: { agent: V2Agent }) {
  const stats = [{ id: 'agent-running', value: String(AGENT_RUNNING_COUNT[agent.id] ?? 1), label: 'Agent running' }, ...agent.stats]
  return (
    <div className="group flex items-start justify-between gap-3xl rounded-sm border border-border p-lg">
      <div className="flex w-[420px] shrink-0 flex-col gap-xs">
        <h4 className="m-0 text-body text-text-primary transition-colors group-hover:text-text-action">{agent.name}</h4>
        {AGENT_DESCRIPTIONS[agent.id] && <p className="m-0 text-small text-text-secondary">{AGENT_DESCRIPTIONS[agent.id]}</p>}
      </div>
      <V2StatGroup stats={stats} valueClassName="text-text-secondary" />
    </div>
  )
}

// Reviews gets its own richer layout (rating + breakdown bars + source cards) instead of the
// generic top-stats row every other section uses — same content as Classic Overview's Reviews
// section, kept as an independent copy rather than a cross-import.
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

// Front desk isn't one of OVERVIEW_V2_SECTIONS — it's rendered separately and interleaved right
// above Surveys, so the section list is split at that boundary rather than reordered in place.
const FRONTDESK_SPLIT_INDEX = OVERVIEW_V2_SECTIONS.findIndex((s) => s.id === 'surveys')
const SECTIONS_BEFORE_FRONTDESK = OVERVIEW_V2_SECTIONS.slice(0, FRONTDESK_SPLIT_INDEX)
const SECTIONS_FROM_FRONTDESK = OVERVIEW_V2_SECTIONS.slice(FRONTDESK_SPLIT_INDEX)

// One card per OVERVIEW_V2_SECTIONS entry — extracted out of the page's render so Front desk can
// be interleaved between two slices of this list (it isn't itself one of these sections).
function ProductSectionCard({ section, showAgents, dataState }: { section: V2Section; showAgents: boolean; dataState: DataState }) {
  const NavIcon = SECTION_NAV_ICON[section.id]
  const isCx = CX_SECTION_IDS.has(section.id)
  const agents = AGENT_OVERRIDES[section.id] ?? section.agents
  const showAgentRows = showAgents && agents.length > 0
  const showSetupBanner = dataState === 'ftu' && agents.length > 0
  const hasBodyContent = Boolean(section.stats) || section.id === 'reviews' || showAgentRows
  const hasAnyContent = hasBodyContent || Boolean(section.actionNeeded) || showSetupBanner
  if (!hasAnyContent) return null
  return (
    <SectionCard>
      <h3 className="m-0 flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
        {NavIcon ? <NavIcon size={20} className="text-text-icon" /> : <Icon name={section.icon} size={20} className="text-text-icon" />}
        {section.label}
      </h3>

      {section.id === 'listings' ? (
        <>
          <V2StatGroup
            stats={[
              ...(section.stats ?? []).filter((s) => !LISTINGS_SYNC_STATUS_IDS.includes(s.id)),
              ...withDanger(section.actionNeeded),
            ]}
          />
          <div className="grid grid-cols-2 gap-lg">
            <ChartCard title="Sync status" showActions={false}>
              <DonutChart
                data={(section.stats ?? [])
                  .filter((s) => LISTINGS_SYNC_STATUS_IDS.includes(s.id))
                  .map((s) => ({ name: s.label, value: parseFloat(s.value), color: LISTINGS_SYNC_STATUS_COLORS[s.id] }))}
                height={310}
              />
            </ChartCard>
            <ChartCard title="Google report" showActions={false}>
              <DonutChart
                data={OVERVIEW_LISTINGS_GOOGLE_REPORT.map((s, i) => ({
                  name: s.label,
                  value: parseKValue(s.value),
                  color: chartColors.categorical[i],
                }))}
                height={310}
              />
            </ChartCard>
          </div>
        </>
      ) : section.id === 'search-ai' ? (
        <>
          <V2StatGroup stats={[...SEARCH_AI_STATS, ...withDanger(section.actionNeeded)]} />
          <div className="grid grid-cols-4 gap-[56px]">
            {SEARCH_AI_SCORE_BARS.map((bar) => (
              <ScoreBar key={bar.id} {...bar} />
            ))}
          </div>
        </>
      ) : section.id === 'reviews' ? (
        <>
          <V2StatGroup stats={[...REVIEWS_STATS, ...withDanger(section.actionNeeded)]} />
          <ChartCard title="Reviews by rating" showActions={false}>
            <StackedBarChart
              data={REVIEWS_BY_RATING.map((r) => ({ rating: r.rating, count: r.count }))}
              series={[{ key: 'count', label: 'Reviews', color: chartColors.blue }]}
              xKey="rating"
              height={280}
              showBarLabels
              hideLegend
              barColors={REVIEWS_BY_RATING.map((r) => r.color)}
            />
          </ChartCard>
        </>
      ) : section.id === 'surveys' ? (
        <V2StatGroup stats={[...SURVEYS_STATS, ...withDanger(section.actionNeeded)]} />
      ) : (
        <V2StatGroup
          stats={[
            ...(section.stats ?? []).filter((s) => !(section.id === 'social' && s.id === 'new-follower')),
            ...withDanger(section.actionNeeded),
          ]}
        />
      )}

      {showAgentRows && (
        <div className="flex flex-col gap-lg pt-lg">
          <CoworkerPerformanceHeader
            icon={isCx ? robinIcon : jayIcon}
            coworkerName={isCx ? 'Robin' : 'Jay'}
            {...aggregateAgentSavings(agents)}
          />
          <div className="flex flex-col gap-md">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      )}

      {showSetupBanner && <AgentSetupBanner icon={isCx ? robinIcon : jayIcon} {...pickFeaturedStat(agents)} />}
    </SectionCard>
  )
}

// Front desk (owner: Myna) spans 4 sub-areas that share one date filter — each sub-area gets its
// own business-metrics / agent-outcomes / human-actions rows, same visual vocabulary as the other
// sections above. Business metrics and agents lay out in a 2-column grid so rows align into clean
// columns AND use the card's full width, instead of either a jagged wrap or a single narrow column.
// Appointments' own status breakdown (Rescheduled/Cancelled/Unconfirmed) doesn't include a
// "Confirmed" count in the shared data, so it's derived as the remainder of Total bookings —
// keeps the donut a true partition of all bookings instead of an arbitrary 4th number.
const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  confirmed: chartColors.resolved,
  rescheduled: chartColors.blue,
  cancelled: chartColors.unresolved,
  unconfirmed: chartColors.escalated,
}

// A single bar split into proportional colored segments (rather than a per-category pie/donut) —
// used for Appointments' status breakdown, with a legend of name + share below.
function SplitBar({ data }: { data: { name: string; value: number; color: string }[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const total = data.reduce((sum, d) => sum + d.value, 0)
  let cumulative = 0
  const segments = data.map((d) => {
    const pct = (d.value / total) * 100
    const segment = { ...d, pct, start: cumulative }
    cumulative += pct
    return segment
  })
  const hovered = hoveredIndex !== null ? segments[hoveredIndex] : null

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="relative">
        <div className="flex h-6 w-full overflow-hidden rounded-sm">
          {segments.map((s, i) => (
            <div
              key={s.name}
              style={{ width: `${s.pct}%`, backgroundColor: s.color }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex((h) => (h === i ? null : h))}
            />
          ))}
        </div>
        {hovered && (
          <div
            className="pointer-events-none absolute bottom-full z-10 -translate-x-1/2 pb-xs"
            style={{ left: `${hovered.start + hovered.pct / 2}%` }}
          >
            <ChartTooltip items={[{ color: hovered.color, label: hovered.name, value: hovered.value }]} />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-lg">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-xs text-small text-text-secondary">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            {d.name} · {Math.round((d.value / total) * 100)}%
          </div>
        ))}
      </div>
    </div>
  )
}

function FrontDeskSection({ showAgents, showSetupBanner }: { showAgents: boolean; showSetupBanner: boolean }) {
  const subareas = frontDeskSubareasForDisplay()
  const frontDeskAgents: V2Agent[] = subareas.map((area) => ({
    id: FRONTDESK_AGENT_ID[area.id] ?? area.id,
    name: area.agentName,
    stats: area.agentOutcomes,
  }))
  const featuredStat = pickFeaturedStat(frontDeskAgents)

  const appointmentsArea = subareas.find((a) => a.id === 'appointments')!
  const totalBookings = appointmentsArea.businessMetrics.find((s) => s.id === 'total-bookings')!
  const rescheduled = parseKValue(appointmentsArea.businessMetrics.find((s) => s.id === 'rescheduled')!.value)
  const cancelled = parseKValue(appointmentsArea.businessMetrics.find((s) => s.id === 'cancelled')!.value)
  const unconfirmed = parseKValue(appointmentsArea.humanActions.find((s) => s.id === 'unconfirmed')!.value)
  const noShows = appointmentsArea.humanActions.find((s) => s.id === 'no-shows')!
  const confirmed = parseKValue(totalBookings.value) - rescheduled - cancelled - unconfirmed
  const appointmentStatusData = [
    { name: 'Confirmed', value: confirmed, color: APPOINTMENT_STATUS_COLORS.confirmed },
    { name: 'Rescheduled', value: rescheduled, color: APPOINTMENT_STATUS_COLORS.rescheduled },
    { name: 'Cancelled', value: cancelled, color: APPOINTMENT_STATUS_COLORS.cancelled },
    { name: 'Unconfirmed', value: unconfirmed, color: APPOINTMENT_STATUS_COLORS.unconfirmed },
  ]
  const stackedAreas = ['intake', 'waitlist', 'conversations'].map((id) => subareas.find((a) => a.id === id)!)

  return (
    <SectionCard>
      <h3 className="m-0 flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
        <FigmaIconFrontDesk size={20} className="text-text-icon" />
        Front desk
      </h3>

      <div className="grid grid-cols-2 gap-x-3xl gap-y-lg">
        <div className="flex flex-col gap-md">
          <h4 className="m-0 text-body text-text-primary">{appointmentsArea.label}</h4>
          <V2StatGroup stats={[totalBookings, ...withDanger([noShows])]} />
          <ChartCard title="Appointment status" showActions={false} minHeight={220}>
            <div className="flex-1">
              <SplitBar data={appointmentStatusData} />
            </div>
          </ChartCard>
        </div>

        <div className="flex flex-col gap-lg">
          {stackedAreas.map((area) => (
            <div key={area.id} className="flex flex-col gap-md">
              <h4 className="m-0 text-body text-text-primary">{area.label}</h4>
              <V2StatGroup stats={[...area.businessMetrics, ...withDanger(area.humanActions)]} />
            </div>
          ))}
        </div>
      </div>

      {showAgents && (
        <div className="flex flex-col gap-lg pt-lg">
          <CoworkerPerformanceHeader icon={mynaIcon} coworkerName="Myna" {...aggregateAgentSavings(frontDeskAgents)} />
          <div className="flex flex-col gap-md">
            {frontDeskAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      )}

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

          {SECTIONS_BEFORE_FRONTDESK.map((section) => (
            <ProductSectionCard key={section.id} section={section} showAgents={showAgents} dataState={dataState} />
          ))}

          <FrontDeskSection showAgents={showAgents} showSetupBanner={dataState === 'ftu'} />

          {SECTIONS_FROM_FRONTDESK.map((section) => (
            <ProductSectionCard key={section.id} section={section} showAgents={showAgents} dataState={dataState} />
          ))}
        </div>
      </div>

      <DataStateSwitcher value={dataState} onChange={setDataState} />
    </div>
  )
}
