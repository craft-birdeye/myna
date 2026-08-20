import { useState } from 'react'
import { ListFilter } from 'lucide-react'
import { Icon, Tooltip, TopNav } from '../components'
import {
  FigmaIconFrontDesk,
  FigmaIconInbox,
  FigmaIconReferrals,
  FigmaIconSurveys,
  FigmaIconTicketing,
  FigmaIconContentHub,
  FigmaIconRecommendations,
} from '../components/l1Icons'
import jayIcon from '../assets/icon-jay.svg'
import mynaIcon from '../assets/icon-myna.svg'
import robinIcon from '../assets/icon-robin.svg'
import googleIcon from '../assets/icon-google.svg'
import googlePlayIcon from '../assets/icon-google-play.svg'
import { getAgentDirectory, type AgentDirectoryEntry } from '../data/agentDirectoryData'
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
  OVERVIEW_REVIEW_SOURCES,
  OVERVIEW_LISTINGS_GOOGLE_REPORT,
} from '../data/overviewData'

interface OverviewV2_1ScreenProps {
  userName?: string
}

const KPI_ROW_CLASS = 'flex flex-wrap gap-xl'
const KPI_TILE_CLASS = 'min-w-[140px] shrink-0'

// Deterministic (not Math.random — would reshuffle on every render) period-over-period delta per
// KPI, keyed off the stat's own id so the same tile always shows the same figure. Framed as
// "vs. the selected date range" — this is a prototype without real historical data to diff against.
// Explicit deltas for KPIs where a specific figure was given, rather than the deterministic
// generic one — e.g. Social's Messages sent/received.
const DELTA_OVERRIDES: Record<string, { delta: string; trend: 'up' | 'down' }> = {
  'messages-sent': { delta: '153.9%', trend: 'up' },
  'messages-received': { delta: '1250%', trend: 'up' },
}

function deltaForStat(id: string): { delta: string; trend: 'up' | 'down' } {
  if (DELTA_OVERRIDES[id]) return DELTA_OVERRIDES[id]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  const pct = 1 + (hash % 24)
  return { delta: `${pct}%`, trend: hash % 3 === 0 ? 'down' : 'up' }
}

function DeltaBadge({ id }: { id: string }) {
  const { delta, trend } = deltaForStat(id)
  const isBad = NEGATIVE_METRIC_IDS.has(id) ? trend === 'up' : trend === 'down'
  return (
    <span className={`mb-[2px] whitespace-nowrap text-small ${isBad ? 'text-chip-danger-text' : 'text-chip-success-text'}`}>
      {trend === 'down' ? '-' : '+'}
      {delta}
    </span>
  )
}

// KPI numbers on this page are rendered in the brand action-blue (rather than the usual black)
// to visually separate "automated by an agent" metrics from the rest of the app. Action-needed
// stats are merged in here (flagged via `danger`) instead of getting their own bordered block, so
// they sit inline beside the section's other KPIs — same tile, just red.
function V2StatGroup({ stats, nowrap = false }: { stats: (V2Stat & { danger?: boolean })[]; nowrap?: boolean }) {
  return (
    <div className={`flex ${nowrap ? 'flex-nowrap' : 'flex-wrap'} gap-xl`}>
      {stats.map((s) => (
        <div key={s.id} className={KPI_TILE_CLASS}>
          <div className="flex items-end gap-xs">
            <p className={`m-0 whitespace-nowrap text-display ${s.danger ? 'text-chip-danger-text' : 'text-text-action'}`}>{s.value}</p>
            {!NO_DELTA_IDS.has(s.id) && <DeltaBadge id={s.id} />}
          </div>
          <p className="m-0 mt-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

function withDanger(stats: V2Stat[] | undefined): (V2Stat & { danger: true })[] {
  return (stats ?? []).map((s) => ({ ...s, danger: true }))
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

// Real brand marks for Google/Google Play (ShopperApproved keeps the shared data's icon+color)
// — kept local rather than editing OVERVIEW_REVIEW_SOURCES since v2 shouldn't pick up the swap.
const REVIEW_SOURCE_LOGO: Record<string, string> = {
  google: googleIcon,
  'google-play': googlePlayIcon,
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

      <div className="flex flex-wrap items-stretch gap-3xl">
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

        <div className="flex min-w-[280px] flex-1 flex-wrap items-stretch gap-md">
          {OVERVIEW_REVIEW_SOURCES.map((s) => {
            const logoSrc = REVIEW_SOURCE_LOGO[s.id]
            return (
              <div key={s.id} className="flex min-w-[220px] flex-1 items-center gap-md rounded-sm border border-border py-md pl-2xl pr-lg">
                {logoSrc ? (
                  <img src={logoSrc} alt="" className="size-9 shrink-0" />
                ) : (
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-body ${s.iconColorClassName}`}>
                    <Icon name={s.icon} size={18} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-small text-text-tertiary">{s.name}</p>
                  <div className="flex items-center gap-xs">
                    <span className="flex items-center gap-xs text-body text-text-primary">
                      {s.rating}
                      <Icon name="star" size={14} fill className="text-[#f5a623]" />
                    </span>
                    <DeltaBadge id={`${s.id}-rating`} />
                  </div>
                  <div className="flex items-center gap-xs">
                    <span className="text-small text-text-tertiary">{s.reviewCount}</span>
                    <DeltaBadge id={`${s.id}-reviews`} />
                  </div>
                </div>
              </div>
            )
          })}
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

// v2.1-only section order — Search AI leads ahead of Listings; everything else keeps the shared
// data's order. Kept local rather than reordering OVERVIEW_V2_SECTIONS itself, since v2/v3
// shouldn't pick up the reorder.
const ORDERED_SECTIONS = OVERVIEW_V2_SECTIONS.map((s) => s.id)
  .filter((id) => id !== 'search-ai')
  .flatMap((id) => (id === 'listings' ? ['search-ai', id] : [id]))
  .map((id) => OVERVIEW_V2_SECTIONS.find((s) => s.id === id)!)

// Empty state only — matches the main nav's product order (Inbox, Listings AI, Reviews AI,
// Search AI, Referrals, Payments, Appointments, Social AI, Surveys AI, Ticketing, ...), skipping
// entries this page has no widget for (Payments, Contacts, Marketing Automation AI, Reports,
// Insights AI). Inbox/Referrals/Appointments are bespoke cards, not OVERVIEW_V2_SECTIONS entries.
const EMPTY_STATE_SECTION_ORDER = ['listings', 'reviews', 'search-ai']
const EMPTY_STATE_SECTION_ORDER_AFTER_APPOINTMENTS = ['social', 'surveys', 'ticketing']

// KPI ids that show a value but no period-over-period delta — the "Listings" headline count,
// Average rank (already its own rank number, a delta doesn't read meaningfully), and every
// action-needed stat (they're already flagged red; a delta on top reads as noise).
const NO_DELTA_IDS = new Set([
  'listings',
  'average-rank',
  'awaiting-review',
  'pending-review',
  'replies-awaiting-approval',
  'post-awaiting-approval',
  'survey-approval-pending',
  'open-recommendations',
  'co-workers',
  'agents',
])

// KPI ids where an increase is actually bad news (more escalations/no-shows/cancellations etc.) —
// their delta badge flips to red on "up" and green on "down" instead of the usual polarity.
const NEGATIVE_METRIC_IDS = new Set([
  '3-star-or-less',
  'failed-posts',
  'rejected-posts',
  'tickets-escalated',
  'no-shows',
  'conversations-no-shows',
  'conversations-transferred',
  'conversations-disconnected',
  'appointment-cancelled',
])

// Social's own top-level KPI set — replaces the shared data's lone "New follower" stat with the
// fuller business-metric set. Kept local to v2.1 rather than editing the shared
// OVERVIEW_V2_SECTIONS file, since v2/v3 shouldn't pick up the change.
const SOCIAL_STATS: V2Stat[] = [
  { id: 'posts', value: '36', label: 'Posts' },
  { id: 'impressions', value: '128.4K', label: 'Impressions' },
  { id: 'engagement-rate', value: '4.8%', label: 'Engagement rate' },
  { id: 'messages-sent', value: '1.5K', label: 'Messages sent' },
  { id: 'messages-received', value: '675', label: 'Messages received' },
  { id: 'audience-growth', value: '5.2%', label: 'Audience growth' },
]

// Reviews' own top-level KPI set — adds Response rate alongside the shared data's Request
// sent/Reviews received/3 star or less. Kept local rather than editing the shared
// OVERVIEW_V2_SECTIONS file, since v2/v3 shouldn't pick it up.
// Values form a consistent waterfall (sent -> received -> negative -> awaiting approval) instead
// of the shared data's placeholder numbers, which read as arbitrary next to each other (e.g.
// "1.9K requests sent" next to "7 reviews received").
const REVIEWS_STATS: V2Stat[] = [
  { id: 'requests-sent', value: '1.9K', label: 'Request sent' },
  { id: 'reviews-received', value: '342', label: 'Reviews received' },
  { id: 'reviews-response-rate', value: '72%', label: 'Response rate' },
  { id: '3-star-or-less', value: '34', label: '3 star or less' },
]

// Search AI's own top-level KPI set — adds Sentiment score between Visibility score and Average
// rank, and renames the headline stat to match the "AI Search" section rename below. Kept local
// rather than editing the shared OVERVIEW_V2_SECTIONS file, since v2/v3 shouldn't pick it up.
const SEARCH_AI_STATS: V2Stat[] = [
  { id: 'search-ai-score', value: '33.6%', label: 'AI Search score' },
  { id: 'citation-share', value: '17.6%', label: 'Citation share' },
  { id: 'visibility-score', value: '60.2%', label: 'Visibility score' },
  { id: 'sentiment-score', value: '78', label: 'Sentiment score' },
  { id: 'average-rank', value: '4', label: 'Average rank' },
]

// Surveys has no top-level business-metric stats in the shared data (only agents/actionNeeded) —
// these two are v2.1-only.
const SURVEYS_STATS: V2Stat[] = [
  { id: 'active-surveys', value: '24', label: 'Active surveys' },
  { id: 'surveys-response-rate', value: '68%', label: 'Response rate' },
]

// Ticketing's own top-level KPI set — promotes Tickets created/opened/escalated up from the
// (now-hidden) agent rows, drops New and In progress, keeps Assigned and Average resolution time
// from the shared data. Kept local rather than editing OVERVIEW_V2_SECTIONS.
const TICKETING_STATS: V2Stat[] = [
  { id: 'tickets-created', value: '370', label: 'Tickets created' },
  { id: 'tickets-opened', value: '77', label: 'Tickets open' },
  { id: 'tickets-escalated', value: '9', label: 'Tickets escalated' },
  { id: 'assigned-tickets', value: '14', label: 'Assigned' },
  { id: 'avg-resolution-time', value: '6h', label: 'Average resolution time' },
]

// Front desk's "Conversations" sub-area, Filled state only — replaces the shared data's
// AI-handled share/Insurance verification rate/Resolution rate with the full channel + outcome
// breakdown (matches the call/chat classification taxonomy: a Conversations total aggregating
// Call+Text+Chat, then Resolved sub-outcomes Scheduled/Rescheduled/Cancelled/FAQs and
// Not-resolved sub-outcomes Transferred/Disconnected, plus No-shows). Cancelled/No-shows/
// Transferred/Disconnected stay red as the "didn't go well" outcomes; FTU keeps the original KPIs.
// All non-danger (blue) KPIs first, then every red/danger one — rather than interleaved by
// Resolved/Not-resolved sub-outcome grouping.
const CONVERSATIONS_FILLED_STATS: (V2Stat & { danger?: boolean })[] = [
  { id: 'conversations-total', value: '16.3K', label: 'Conversations' },
  { id: 'channel-call', value: '8.2K', label: 'Call' },
  { id: 'channel-text', value: '5.1K', label: 'Text' },
  { id: 'channel-chat', value: '3.0K', label: 'Chat' },
  { id: 'appointment-scheduled', value: '6.5K', label: 'Appointment scheduled' },
  { id: 'appointment-rescheduled', value: '1.2K', label: 'Rescheduled' },
  { id: 'conversations-faqs', value: '4.8K', label: 'FAQs answered' },
  { id: 'resolution-rate', value: '88%', label: 'Resolution rate' },
  { id: 'appointment-cancelled', value: '450', label: 'Cancelled', danger: true },
  { id: 'conversations-no-shows', value: '320', label: 'No shows', danger: true },
  { id: 'conversations-transferred', value: '380', label: 'Transferred', danger: true },
  { id: 'conversations-disconnected', value: '210', label: 'Disconnected', danger: true },
]

// Per-section top-level KPI overrides — sections not listed here just use the shared data's own
// section.stats unchanged.
const SECTION_STATS_OVERRIDES: Partial<Record<string, V2Stat[]>> = {
  social: SOCIAL_STATS,
  'search-ai': SEARCH_AI_STATS,
  reviews: REVIEWS_STATS,
  surveys: SURVEYS_STATS,
  ticketing: TICKETING_STATS,
}

// v2.1-only section label override — the shared data calls this section "Search AI"; kept local
// rather than editing OVERVIEW_V2_SECTIONS since v2/v3 shouldn't pick up the rename.
const SECTION_LABEL_OVERRIDES: Record<string, string> = {
  'search-ai': 'AI Search',
}

// v2.1-only action-needed label overrides, and a per-state override of which stats even show.
// - Search AI: "Recommendations pending review" -> "Recommendations pending".
// - Listings: "Recommendations awaiting review" is dropped in Empty state, renamed to
//   "Recommendation sizing" in FTU, and "Recommendation pending" in Filled.
// - Reviews: "Replies awaiting approval" is dropped in Empty state only.
// - Surveys: "Survey approval pending" -> "Approval pending".
function getSectionActionNeeded(section: { id: string; actionNeeded?: V2Stat[] }, dataState: DataState): V2Stat[] {
  const stats = section.actionNeeded ?? []
  if (section.id === 'search-ai') {
    return stats.map((s) => (s.id === 'pending-review' ? { ...s, label: 'Recommendations pending' } : s))
  }
  if (section.id === 'listings') {
    if (dataState === 'empty') return stats.filter((s) => s.id !== 'awaiting-review')
    const label = dataState === 'filled' ? 'Recommendation pending' : 'Recommendation sizing'
    return stats.map((s) => (s.id === 'awaiting-review' ? { ...s, label } : s))
  }
  if (section.id === 'reviews') {
    if (dataState === 'empty') return stats.filter((s) => s.id !== 'replies-awaiting-approval')
    // Normalized to fit under the new Reviews received/3 star or less waterfall (was "4").
    return stats.map((s) => (s.id === 'replies-awaiting-approval' ? { ...s, value: '9' } : s))
  }
  if (section.id === 'surveys') {
    return stats.map((s) => (s.id === 'survey-approval-pending' ? { ...s, label: 'Approval pending' } : s))
  }
  return stats
}

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

function formatAgentOutcome(raw: string): string {
  const numeric = parseFloat(raw.replace(/,/g, ''))
  if (!isNaN(numeric) && numeric >= 1000) return `${parseFloat((numeric / 1000).toFixed(1))}K`
  return raw
}

// Extra "N issues" badges for agents that don't already carry a real alert in the shared
// directory data — kept local to this grid rather than editing agentDirectoryData.ts, since that
// data also feeds the real Agent directory screen.
const AGENT_ISSUE_OVERRIDES: Record<string, number> = {
  'review-response': 1,
  waitlist: 2,
  'social-engagement': 1,
  'survey-response': 1,
}

function AgentPerformanceMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-h3 text-text-primary">{value}</div>
      <div className="truncate text-small text-text-tertiary">{label}</div>
    </div>
  )
}

// Same card layout as the Agent directory's "All" tab (AgentDirectoryScreen's AgentCard) — kept as
// an independent copy rather than a cross-import, per this file's fork-don't-import convention.
function AgentPerformanceCard({ agent }: { agent: AgentDirectoryEntry }) {
  const issueCount = agent.alert ? parseInt(agent.alert.message, 10) : AGENT_ISSUE_OVERRIDES[agent.id]
  return (
    <div className="flex flex-col rounded-md border border-border bg-surface p-xl">
      <div className="mb-xs flex items-center justify-between gap-sm">
        <h4 className="m-0 min-w-0 truncate text-[16px] leading-6 tracking-[-0.32px] text-text-primary">{agent.name}</h4>
        <div className="flex shrink-0 items-center gap-xs">
          {issueCount && (
            <span className="flex items-center gap-xs text-small text-text-secondary">
              <Icon name="error" size={14} className="text-chip-danger-text" />
              {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
            </span>
          )}
          {agent.running > 0 ? (
            <span className="rounded-sm bg-chip-success-bg px-sm py-xs text-small text-chip-success-text">
              {agent.running} running
            </span>
          ) : (
            <span className="rounded-sm bg-chip-neutral-bg px-sm py-xs text-small text-chip-neutral-text">Paused</span>
          )}
        </div>
      </div>
      {/* min-h reserves space for 2 lines (text-small line-height 18px) even when the
          description is shorter, so the KPI row below always starts at the same height. */}
      <p className="m-0 mb-lg line-clamp-2 min-h-[36px] text-small text-text-tertiary">{agent.description}</p>
      <div className="mt-auto grid grid-cols-3 gap-md">
        <AgentPerformanceMetric value={formatAgentOutcome(agent.outcome.value)} label={agent.outcome.label} />
        <AgentPerformanceMetric value={agent.timeSaved} label="Time saved" />
        <AgentPerformanceMetric value={agent.costSaved} label="Cost saved" />
      </div>
    </div>
  )
}

// Shown in all three states — Empty/FTU keep the estimate framing ("~" values, muted, tooltip)
// since nothing's running yet; Filled assumes the co-workers are live, so the same card shows the
// real totals in full-strength black instead of grey. Empty/FTU also lead with a promo banner
// bled to the card's top edge; Empty additionally gets a "Schedule demo" CTA that FTU omits.
function AiWorkforceSummaryCard({ dataState, dateRange }: { dataState: DataState; dateRange: string }) {
  const filled = dataState === 'filled'
  // Empty state shows only the promo banner — no "AI workforce summary" KPI row below it.
  const bannerOnly = dataState === 'empty'
  const [showAgentPerformance, setShowAgentPerformance] = useState(false)
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
        <div
          className={`-mx-xl -mt-xl flex items-center gap-lg rounded-t-md bg-ai-summary p-lg ${
            bannerOnly ? '-mb-xl rounded-b-md' : ''
          }`}
        >
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
      {!bannerOnly && (
        <>
          <h3 className="m-0 text-[16px] leading-6 tracking-[-0.32px] text-text-primary">AI Co-worker Summary</h3>
          <div className={KPI_ROW_CLASS}>
            {stats.map((s) => (
              <div key={s.id} className={`${KPI_TILE_CLASS} ${s.id === 'time-saved' ? 'mr-lg' : ''}`}>
                <div className="flex items-end gap-xs">
                  <p className={`m-0 whitespace-nowrap text-display ${s.muted ? 'text-text-tertiary' : 'text-text-primary'}`}>{s.value}</p>
                  {!s.muted && !NO_DELTA_IDS.has(s.id) && <DeltaBadge id={s.id} />}
                </div>
                <p className="m-0 mt-xs flex items-center gap-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">
                  {s.label}
                  {s.tooltip && <EstimateTooltip />}
                </p>
              </div>
            ))}
          </div>

          {filled && (
            <button
              type="button"
              onClick={() => setShowAgentPerformance((v) => !v)}
              className="flex w-fit items-center gap-xs text-body text-text-action"
            >
              View agent performance
              <Icon name={showAgentPerformance ? 'expand_less' : 'expand_more'} size={18} />
            </button>
          )}

          {filled && showAgentPerformance && (
            <div className="grid grid-cols-3 gap-lg">
              {agents.map((agent) => (
                <AgentPerformanceCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </>
      )}
    </SectionCard>
  )
}

// Front desk (owner: Myna) spans 4 sub-areas that share one date filter — each sub-area gets its
// own business-metrics / agent-outcomes / human-actions rows, same visual vocabulary as the other
// sections above. Business metrics and agents lay out in a 2-column grid so rows align into clean
// columns AND use the card's full width, instead of either a jagged wrap or a single narrow column.
function FrontDeskSection({
  showAgents,
  showSetupBanner,
  dataState,
}: {
  showAgents: boolean
  showSetupBanner: boolean
  dataState: DataState
}) {
  // Appointments/Intake/Waitlist sub-areas were dropped entirely — Conversations is the only
  // sub-area left, so it no longer needs its own "Conversations" title (redundant next to the
  // "Front desk" section heading right above it).
  const conversations = OVERVIEW_V2_FRONTDESK_SUBAREAS.find((area) => area.id === 'conversations')!
  const featuredStat = pickFeaturedStat([
    { id: conversations.id, name: conversations.agentName, stats: conversations.agentOutcomes },
  ])

  return (
    <SectionCard>
      <h3 className="m-0 flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
        <FigmaIconFrontDesk size={20} className="text-text-icon" />
        Front desk
      </h3>

      <V2StatGroup
        stats={
          dataState === 'filled'
            ? CONVERSATIONS_FILLED_STATS
            : [...conversations.businessMetrics, ...withDanger(conversations.humanActions)]
        }
      />

      {showAgents && (
        <div className="border-t border-border pt-lg">
          <AgentRow
            icon={mynaIcon}
            agent={{ id: `${conversations.id}-agent-outcomes`, name: conversations.agentName, stats: conversations.agentOutcomes }}
          />
        </div>
      )}

      {showSetupBanner && <AgentSetupBanner icon={mynaIcon} {...featuredStat} />}
    </SectionCard>
  )
}

const EMPTY_STATE_APPOINTMENTS_STATS = [
  { id: 'total-appointments', value: '149', label: 'Total appointments' },
  { id: 'booked-via-birdeye', value: '122', label: 'Booked via Birdeye' },
  { id: 'confirmation-rate-birdeye', value: '14.1%', label: 'Confirmation rate via Birdeye' },
  { id: 'confirmation-rate-office', value: '2%', label: 'Confirmation rate via office' },
]

// No-show rate reads in black rather than the usual action-blue — kept as a plain flag rather
// than a whole extra danger/highlight system just for this one stat.
const EMPTY_STATE_NO_SHOW_RATE = { id: 'no-show-rate', value: '0%', label: 'No-show rate' }

const EMPTY_STATE_INBOX_STATS = [
  { id: 'unread-messages', value: '526', label: 'Unread messages' },
  { id: 'open-leads', value: '682', label: 'Open leads' },
]

// Empty state only: replaces Front desk with a simpler card a brand-new business would actually
// see before any co-worker is set up — plain KPIs pulled straight from Birdeye's existing
// Appointments surface, no deltas (there's no history yet to compare against).
function EmptyStateAppointmentsCard() {
  return (
    <SectionCard>
      <div className="flex items-center justify-between">
        <h3 className="m-0 flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
          <FigmaIconFrontDesk size={20} className="text-text-icon" />
          Appointments
        </h3>
        <button
          type="button"
          aria-label="Filter"
          className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
        >
          <ListFilter className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
        </button>
      </div>
      <div className={KPI_ROW_CLASS}>
        {EMPTY_STATE_APPOINTMENTS_STATS.map((s) => (
          <div key={s.id} className={KPI_TILE_CLASS}>
            <p className="m-0 whitespace-nowrap text-display text-text-action">{s.value}</p>
            <p className="m-0 mt-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">{s.label}</p>
          </div>
        ))}
        <div className={KPI_TILE_CLASS}>
          <p className="m-0 whitespace-nowrap text-display text-text-primary">{EMPTY_STATE_NO_SHOW_RATE.value}</p>
          <p className="m-0 mt-xs whitespace-nowrap text-small uppercase tracking-wide text-text-primary">{EMPTY_STATE_NO_SHOW_RATE.label}</p>
        </div>
      </div>
    </SectionCard>
  )
}

// Empty state only — same plain-KPI treatment as Appointments, pulled from Birdeye's Inbox
// surface. Rendered first in Empty state, matching the main nav's product order.
function EmptyStateInboxCard() {
  return (
    <SectionCard>
      <h3 className="m-0 flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
        <FigmaIconInbox size={20} className="text-text-icon" />
        Inbox
      </h3>
      <div className={KPI_ROW_CLASS}>
        {EMPTY_STATE_INBOX_STATS.map((s) => (
          <div key={s.id} className={KPI_TILE_CLASS}>
            <p className="m-0 whitespace-nowrap text-display text-text-action">{s.value}</p>
            <p className="m-0 mt-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">{s.label}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

const EMPTY_STATE_REFERRALS_STATS = [
  { id: 'referral-requests-sent', value: '125K', label: 'Requests sent' },
  { id: 'referral-shared', value: '563', label: 'Shared' },
  { id: 'referral-leads', value: '504', label: 'Leads' },
]

// Empty state only — Birdeye's Referrals product doesn't have its own OVERVIEW_V2_SECTIONS
// entry, so this is a bespoke card (same plain-KPI, no-delta treatment as Appointments/Inbox),
// slotted into the main nav's product order between Search AI and Appointments.
function EmptyStateReferralsCard() {
  return (
    <SectionCard>
      <div className="flex items-center justify-between">
        <h3 className="m-0 flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
          <FigmaIconReferrals size={20} className="text-text-icon" />
          Referrals
        </h3>
        <button
          type="button"
          aria-label="Filter"
          className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
        >
          <ListFilter className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
        </button>
      </div>
      <div className={KPI_ROW_CLASS}>
        {EMPTY_STATE_REFERRALS_STATS.map((s) => (
          <div key={s.id} className={KPI_TILE_CLASS}>
            <p className="m-0 whitespace-nowrap text-display text-text-action">{s.value}</p>
            <p className="m-0 mt-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">{s.label}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

// One card per OVERVIEW_V2_SECTIONS entry — extracted out of the page's render so Empty state can
// interleave Inbox/Referrals/Appointments between specific sections instead of appending them
// all at the end.
function ProductSectionCard({
  section,
  showAgents,
  dataState,
}: {
  section: V2Section
  showAgents: boolean
  dataState: DataState
}) {
  const NavIcon = SECTION_NAV_ICON[section.id]
  const isCx = CX_SECTION_IDS.has(section.id)
  const showAgentRows = showAgents && section.agents.length > 0
  const showSetupBanner = dataState === 'ftu' && section.agents.length > 0
  const hasBodyContent = Boolean(section.stats) || Boolean(section.actionNeeded) || section.id === 'reviews' || showAgentRows
  const hasAnyContent = hasBodyContent || showSetupBanner
  if (!hasAnyContent) return null
  return (
    <SectionCard>
      <h3 className="m-0 flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
        {NavIcon ? <NavIcon size={20} className="text-text-icon" /> : <Icon name={section.icon} size={20} className="text-text-icon" />}
        {SECTION_LABEL_OVERRIDES[section.id] ?? section.label}
      </h3>

      {(section.stats || section.actionNeeded) && (
        <V2StatGroup
          stats={[
            ...(SECTION_STATS_OVERRIDES[section.id] ?? section.stats ?? []),
            ...withDanger(getSectionActionNeeded(section, dataState)),
          ]}
        />
      )}

      {section.id === 'listings' && (
        <div className="flex flex-col gap-md">
          <h4 className="m-0 text-body text-text-primary">Google report</h4>
          <V2StatGroup stats={OVERVIEW_LISTINGS_GOOGLE_REPORT} />
        </div>
      )}

      {section.id === 'reviews' && <ReviewsOverview />}

      {showAgentRows && (
        <div className="flex flex-wrap gap-xl border-t border-border pt-lg">
          {section.agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} icon={isCx ? robinIcon : jayIcon} />
          ))}
        </div>
      )}

      {showSetupBanner && <AgentSetupBanner icon={isCx ? robinIcon : jayIcon} {...pickFeaturedStat(section.agents)} />}
    </SectionCard>
  )
}

type DataState = 'filled' | 'empty' | 'ftu'

// Floating switcher (fixed to the viewport, always visible) between the fully-populated demo
// data and an "empty state" preview that drops every co-worker/agent row from each product area.
// FTU (first-time user) is a duplicate of Empty state — same "no agents yet" view, kept as its
// own option so it can diverge later without touching Empty state's behavior.
function DataStateSwitcher({ value, onChange }: { value: DataState; onChange: (value: DataState) => void }) {
  // FTU is hidden from the switcher — dataState can still be 'ftu' internally, it's just not
  // reachable from this toggle anymore.
  const OPTIONS: { id: DataState; label: string }[] = [
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

export function OverviewV2_1Screen({ userName = 'Rupa' }: OverviewV2_1ScreenProps = {}) {
  const [dateRange, setDateRange] = useState('Last month')
  const [dataState, setDataState] = useState<DataState>('empty')
  // Agent-level rows (per-section coworker cards) are hidden in every state now — Filled used to
  // be the one state that showed them; the AI workforce summary card is the only agent-related
  // content left on the page.
  const showAgents = false

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
            <div className="flex shrink-0 items-center gap-sm">
              <DateRangeDropdown value={dateRange} onChange={setDateRange} />
              <button
                type="button"
                aria-label="Download"
                className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
              >
                <Icon name="download" size={20} />
              </button>
              <button
                type="button"
                aria-label="Filter"
                className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
              >
                <ListFilter className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </div>
          </div>

          <AiWorkforceSummaryCard dataState={dataState} dateRange={dateRange} />

          {dataState === 'empty' ? (
            <>
              <EmptyStateInboxCard />
              {EMPTY_STATE_SECTION_ORDER.map((id) => {
                const section = ORDERED_SECTIONS.find((s) => s.id === id)
                return section && <ProductSectionCard key={id} section={section} showAgents={showAgents} dataState={dataState} />
              })}
              <EmptyStateReferralsCard />
              <EmptyStateAppointmentsCard />
              {EMPTY_STATE_SECTION_ORDER_AFTER_APPOINTMENTS.map((id) => {
                const section = ORDERED_SECTIONS.find((s) => s.id === id)
                return section && <ProductSectionCard key={id} section={section} showAgents={showAgents} dataState={dataState} />
              })}
            </>
          ) : (
            <>
              {ORDERED_SECTIONS.map((section) => (
                <ProductSectionCard key={section.id} section={section} showAgents={showAgents} dataState={dataState} />
              ))}
              <FrontDeskSection showAgents={showAgents} showSetupBanner={dataState === 'ftu'} dataState={dataState} />
            </>
          )}
        </div>
      </div>

      <DataStateSwitcher value={dataState} onChange={setDataState} />
    </div>
  )
}
