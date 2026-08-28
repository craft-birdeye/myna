import { useEffect, useState, type DragEvent, type ReactNode } from 'react'
import { ListFilter } from 'lucide-react'
import { Icon, InfoTooltip, ScheduleDemoPanel, Tooltip, TopNav } from '../components'
import {
  FigmaIconFrontDesk,
  FigmaIconInbox,
  FigmaIconReferrals,
  FigmaIconSurveys,
  FigmaIconTicketing,
  FigmaIconContentHub,
  FigmaIconRecommendations,
  FigmaIconInsights,
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
  onOpenAgent?: (target: { railId: string; navId?: string }) => void
}

type AgentOpenTarget = { railId: string; navId?: string }

const REVIEWS_AGENT_NAV_IDS = new Set([
  'response-agents',
  'response-agents-sep-1',
  'generation-agents',
  'review-response-agents',
])

function getAgentOpenTarget(agent: AgentDirectoryEntry): AgentOpenTarget {
  if (agent.navId) {
    return {
      railId: REVIEWS_AGENT_NAV_IDS.has(agent.navId) ? 'reviews' : 'frontdesk',
      navId: agent.navId,
    }
  }
  const railByCategory: Record<string, string> = {
    'Social AI': 'social',
    Inbox: 'inbox',
    'Surveys AI': 'surveys',
    Ticketing: 'ticketing',
  }
  return { railId: railByCategory[agent.category] ?? 'frontdesk' }
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
// they sit inline beside the section's other KPIs — same tile, just red. `muted` stats use black
// text to signal they are not clickable drill-downs (e.g. Social's impressions/engagement KPIs).
function V2StatGroup({ stats, nowrap = false }: { stats: (V2Stat & { danger?: boolean; muted?: boolean })[]; nowrap?: boolean }) {
  return (
    <div className={`flex ${nowrap ? 'flex-nowrap' : 'flex-wrap'} gap-xl`}>
      {stats.map((s) => (
        <div key={s.id} className={KPI_TILE_CLASS}>
          <div className="flex items-end gap-xs">
            <p
              className={`m-0 whitespace-nowrap text-display ${
                s.danger ? 'text-chip-danger-text' : s.muted ? 'text-text-primary' : 'text-text-action'
              }`}
            >
              {s.value}
            </p>
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
              <div key={s.id} className="flex min-w-[220px] flex-1 items-center gap-md rounded-md border border-border py-md pl-2xl pr-lg">
                {logoSrc ? (
                  <img src={logoSrc} alt="" className="size-9 shrink-0" />
                ) : (
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-body ${s.iconColorClassName}`}>
                    <Icon name={s.icon} size={18} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-small text-text-primary">{s.name}</p>
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
const DEFAULT_EMPTY_LAYOUT_ORDER = [
  'inbox',
  ...EMPTY_STATE_SECTION_ORDER,
  'referrals',
  'appointments',
  ...EMPTY_STATE_SECTION_ORDER_AFTER_APPOINTMENTS,
]
const FRONTDESK_SPLIT_INDEX = ORDERED_SECTIONS.findIndex((section) => section.id === 'surveys')
const DEFAULT_FILLED_LAYOUT_ORDER = [
  ...ORDERED_SECTIONS.slice(0, FRONTDESK_SPLIT_INDEX).map((section) => section.id),
  'front-desk',
  ...ORDERED_SECTIONS.slice(FRONTDESK_SPLIT_INDEX).map((section) => section.id),
]

// Purchased co-worker always keeps Front desk directly above Surveys — even if an older saved
// layout (or a prior default that appended it at the end) had it elsewhere.
function normalizeFilledLayoutOrder(order: string[]): string[] {
  const withoutFrontDesk = order.filter((id) => id !== 'front-desk')
  const surveysIndex = withoutFrontDesk.indexOf('surveys')
  if (surveysIndex < 0) return [...withoutFrontDesk, 'front-desk']
  return [
    ...withoutFrontDesk.slice(0, surveysIndex),
    'front-desk',
    ...withoutFrontDesk.slice(surveysIndex),
  ]
}

const EMPTY_LAYOUT_STORAGE_KEY = 'myna-overview-empty-layout-order'
const FILLED_LAYOUT_STORAGE_KEY = 'myna-overview-filled-layout-order-v3'
const AGENT_LAYOUT_STORAGE_KEY = 'myna-overview-agent-layout-order'

function getSavedEmptyLayoutOrder(): string[] {
  try {
    const savedOrder = JSON.parse(window.localStorage.getItem(EMPTY_LAYOUT_STORAGE_KEY) ?? 'null')
    if (
      Array.isArray(savedOrder) &&
      savedOrder.length === DEFAULT_EMPTY_LAYOUT_ORDER.length &&
      savedOrder.every((id) => typeof id === 'string' && DEFAULT_EMPTY_LAYOUT_ORDER.includes(id))
    ) {
      return savedOrder
    }
  } catch {
    // Ignore unavailable or malformed browser storage and use the default layout.
  }
  return DEFAULT_EMPTY_LAYOUT_ORDER
}

function getSavedFilledLayoutOrder(): string[] {
  try {
    const savedOrder = JSON.parse(window.localStorage.getItem(FILLED_LAYOUT_STORAGE_KEY) ?? 'null')
    if (
      Array.isArray(savedOrder) &&
      savedOrder.length === DEFAULT_FILLED_LAYOUT_ORDER.length &&
      savedOrder.every((id) => typeof id === 'string' && DEFAULT_FILLED_LAYOUT_ORDER.includes(id))
    ) {
      return normalizeFilledLayoutOrder(savedOrder)
    }
  } catch {
    // Ignore unavailable or malformed browser storage and use the default layout.
  }
  return DEFAULT_FILLED_LAYOUT_ORDER
}

function getSavedAgentLayoutOrder(agentIds: string[]): string[] {
  try {
    const savedOrder = JSON.parse(window.localStorage.getItem(AGENT_LAYOUT_STORAGE_KEY) ?? 'null')
    if (
      Array.isArray(savedOrder) &&
      savedOrder.length === agentIds.length &&
      savedOrder.every((id) => typeof id === 'string' && agentIds.includes(id))
    ) {
      return savedOrder
    }
  } catch {
    // Ignore unavailable or malformed browser storage and use the default order.
  }
  return agentIds
}

// KPI ids that show a value but no period-over-period delta — the "Listings" headline count,
// Rank (already its own rank number, a delta doesn't read meaningfully), and every
// action-needed stat (they're already flagged red; a delta on top reads as noise).
const NO_DELTA_IDS = new Set([
  'listings',
  'rank',
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
const SOCIAL_STATS: (V2Stat & { muted?: boolean })[] = [
  { id: 'posts', value: '36', label: 'Posts', muted: true },
  { id: 'impressions', value: '128.4K', label: 'Impressions', muted: true },
  { id: 'engagement-rate', value: '4.8%', label: 'Engagement rate', muted: true },
  { id: 'messages-sent', value: '1.5K', label: 'Messages sent', muted: true },
  { id: 'messages-received', value: '675', label: 'Messages received', muted: true },
  { id: 'audience-growth', value: '5.2%', label: 'Audience growth', muted: true },
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

// Search AI KPI order — Search AI score, then Visibility, Citation share, Rank, Sentiment score.
const SEARCH_AI_STATS: V2Stat[] = [
  { id: 'search-ai-score', value: '33.6%', label: 'AI Search score' },
  { id: 'visibility-score', value: '60.2%', label: 'Visibility score' },
  { id: 'citation-share', value: '17.6%', label: 'Citation share' },
  { id: 'rank', value: '4', label: 'Rank' },
  { id: 'sentiment-score', value: '78', label: 'Sentiment score' },
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

interface BirdeyeScoreKpiData {
  id: string
  label: string
  value: string
  delta?: string | null
  valueClassName?: string
  tooltip?: string
}

const BIRDEYE_OVERVIEW_SCORE: BirdeyeScoreKpiData = {
  id: 'birdeye-score',
  label: 'Birdeye Score',
  value: '91.8',
  delta: '-0.9',
  valueClassName: 'text-text-primary',
  tooltip: 'A composite score of your online reputation and visibility relative to competitors.',
}

const BIRDEYE_SUB_SCORES: BirdeyeScoreKpiData[] = [
  { id: 'sentiment-score', label: 'Sentiment Score', value: '75.4', delta: '-0.6', valueClassName: 'text-text-action' },
  { id: 'reputation-score', label: 'Reputation Score', value: '74.3', delta: '-1.2', valueClassName: 'text-text-action' },
  { id: 'listing-score', label: 'Listing Score', value: '51.5', delta: '-', valueClassName: 'text-text-action' },
]

function BirdeyeScoreDelta({ delta }: { delta: string }) {
  if (delta === '-') {
    return <span className="mb-[2px] whitespace-nowrap text-small text-text-tertiary">-</span>
  }
  const isNegative = delta.startsWith('-')
  return (
    <span className={`mb-[2px] whitespace-nowrap text-small ${isNegative ? 'text-chip-danger-text' : 'text-chip-success-text'}`}>
      {delta}
    </span>
  )
}

function BirdeyeScoreKpi({ kpi }: { kpi: BirdeyeScoreKpiData }) {
  return (
    <div className={KPI_TILE_CLASS}>
      <div className="flex items-end gap-xs">
        <p className={`m-0 whitespace-nowrap text-display ${kpi.valueClassName ?? 'text-text-primary'}`}>{kpi.value}</p>
        {kpi.delta != null && <BirdeyeScoreDelta delta={kpi.delta} />}
      </div>
      <p className="m-0 mt-xs flex items-center gap-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">
        {kpi.label}
        {kpi.tooltip && <InfoTooltip text={kpi.tooltip} variant="detail" />}
      </p>
    </div>
  )
}

function BirdeyeScoreOverview() {
  return (
    <SectionCard>
      <h3 className="m-0 flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
        <FigmaIconInsights size={20} className="text-text-icon" />
        Insights
      </h3>
      <div className="flex flex-wrap items-end gap-xl">
        <BirdeyeScoreKpi kpi={BIRDEYE_OVERVIEW_SCORE} />
        {BIRDEYE_SUB_SCORES.map((kpi) => (
          <BirdeyeScoreKpi key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </SectionCard>
  )
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
function AgentPerformanceCard({
  agent,
  editing = false,
  onOpenAgent,
}: {
  agent: AgentDirectoryEntry
  editing?: boolean
  onOpenAgent?: () => void
}) {
  const issueCount = agent.alert ? parseInt(agent.alert.message, 10) : AGENT_ISSUE_OVERRIDES[agent.id]
  const clickable = Boolean(onOpenAgent) && !editing
  const nameClassName = `m-0 min-w-0 truncate text-[16px] leading-6 tracking-[-0.32px] text-text-primary transition-colors${
    onOpenAgent ? ' group-hover:text-text-action' : ''
  }`

  return (
    // While editing, LayoutWidget overlays a 32px drag handle top-1 (4px) from this card's top
    // edge — bump the top padding so the header row clears it with a 4px gap (4 + 32 + 4 = 40px).
    <div
      className={`${onOpenAgent ? 'group ' : ''}flex flex-col rounded-md border border-[#E9E9E9] bg-white p-xl transition-colors ${
        editing ? 'pt-[40px]' : ''
      } ${clickable ? 'cursor-pointer hover:border-border-selected hover:bg-surface-hover' : ''}`}
      onClick={clickable ? onOpenAgent : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpenAgent?.()
              }
            }
          : undefined
      }
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <div className="mb-xs flex items-center justify-between gap-sm">
        {onOpenAgent && editing ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onOpenAgent()
            }}
            className={`text-left ${nameClassName}`}
          >
            {agent.name}
          </button>
        ) : (
          <h4 className={nameClassName}>{agent.name}</h4>
        )}
        <div className="flex shrink-0 items-center gap-xs">
          {issueCount && (
            <span className="flex items-center gap-xs text-small text-text-secondary">
              <Icon name="error" size={14} className="text-chip-danger-text" />
              {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
            </span>
          )}
          {agent.running > 0 ? (
            <span className="rounded-sm bg-chip-success-bg px-sm py-xs text-small text-chip-success-text">
              {agent.running} active
            </span>
          ) : (
            <span className="rounded-sm bg-chip-neutral-bg px-sm py-xs text-small text-chip-neutral-text">Inactive</span>
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

// Empty state's promo banner background only — a diagonal green -> blue -> violet -> dusty-rose
// gradient (matching a Birdeye event-page reference), instead of the flat bg-ai-summary tint FTU
// keeps.
const EMPTY_BANNER_GRADIENT = 'linear-gradient(135deg, #3fae6a 0%, #4a72d0 35%, #7c5cc9 65%, #c98a7e 100%)'
const EMPTY_BANNER_TEXT_CLASS = 'text-body font-[400]'

// Thin magenta -> indigo -> magenta accent strip bled across the top edge of the AI Co-worker
// summary card, in every data state.
const SUMMARY_TOP_BAR_GRADIENT = 'linear-gradient(90deg, #c026d3 0%, #ec4899 18%, #8b5cf6 50%, #6366f1 78%, #c026d3 100%)'

type AgentPerformanceSort = 'runs' | 'custom'

const AGENT_PERFORMANCE_SORT_OPTIONS: { id: AgentPerformanceSort; label: string }[] = [
  { id: 'runs', label: 'Number of agent runs' },
  { id: 'custom', label: 'Custom order' },
]

function AgentPerformanceSortDropdown({ value, onChange }: { value: AgentPerformanceSort; onChange: (value: AgentPerformanceSort) => void }) {
  const [open, setOpen] = useState(false)
  const selectedLabel = AGENT_PERFORMANCE_SORT_OPTIONS.find((option) => option.id === value)!.label
  return (
    <div className="flex items-center gap-sm">
      <span className="text-body text-text-secondary">Sort by</span>
      <div className="relative w-fit">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex h-9 items-center gap-xs rounded-md border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
        >
          {selectedLabel}
          <Icon name="expand_more" size={18} className="text-text-icon" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full z-[110] mt-xs min-w-[240px] rounded-sm border border-border bg-surface p-md shadow-dropdown">
              {AGENT_PERFORMANCE_SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-sm rounded-sm px-md py-sm text-left ${
                    option.id === value ? 'bg-surface-selected' : 'hover:bg-surface-hover'
                  }`}
                >
                  <span className="min-w-0 flex-1 text-body text-text-primary">{option.label}</span>
                  {option.id === value && <Icon name="check" size={18} className="shrink-0 text-text-icon" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function BirdsFlatInlineIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-[20px] w-auto shrink-0 ${className ?? ''}`}
      aria-hidden
    >
      <mask id="birds-flat-inline-mask-0" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <path d="M0 0H24V24H0V0Z" fill="white" />
      </mask>
      <g mask="url(#birds-flat-inline-mask-0)">
        <path d="M16.2578 4.479C15.5678 4.479 15.0078 5.038 15.0078 5.729C15.0078 6.419 15.5678 6.979 16.2578 6.979C16.9478 6.978 17.5078 6.419 17.5078 5.729C17.5078 5.038 16.9478 4.479 16.2578 4.479Z" fill="currentColor" />
        <path fillRule="evenodd" clipRule="evenodd" d="M9.5029 1.01807C8.1019 1.01807 7.4659 2.77007 8.5409 3.66907L10.2029 5.05907C10.4529 5.26707 10.5969 5.57705 10.5969 5.90205V10.0451H2.98589C1.19389 10.0451 0.398898 12.2991 1.7929 13.4241L10.6559 20.5751C11.7829 21.4841 13.1879 21.9811 14.6359 21.9811H15.0049C18.2979 21.9811 20.9689 19.3131 20.9729 16.0201C20.9729 16.0081 20.9719 15.9951 20.9719 15.9831H20.9789V7.10406L23.1949 6.29106C23.7189 6.09906 23.7189 5.35705 23.1949 5.16505L20.6849 4.24306C19.9999 2.36206 18.1959 1.01807 16.0779 1.01807H9.5029ZM15.0049 11.8461C17.3079 11.8461 19.1759 13.7141 19.1729 16.0181C19.1699 18.3171 17.3049 20.1801 15.0049 20.1811H14.6359C13.5989 20.1811 12.5929 19.8261 11.7859 19.1751L2.9229 12.0231C2.8929 11.9991 2.8879 11.9821 2.8859 11.9751C2.8829 11.9621 2.8819 11.9391 2.8919 11.9121C2.9009 11.8851 2.9159 11.8671 2.9269 11.8591C2.9329 11.8551 2.94689 11.8461 2.98589 11.8461H15.0049ZM16.0779 2.81805C17.7899 2.81905 19.1779 4.20606 19.1779 5.91806V11.7481C18.1019 10.6951 16.6299 10.0451 15.0049 10.0451H12.3969V5.90205C12.3969 5.04405 12.0159 4.23006 11.3579 3.67906L10.3289 2.81805H16.0779Z" fill="currentColor" />
      </g>
      <mask id="birds-flat-inline-mask-1" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="24" y="0" width="24" height="24">
        <path d="M24 0H48V24H24V0Z" fill="white" />
      </mask>
      <g mask="url(#birds-flat-inline-mask-1)">
        <path d="M39.7026 4.15625C39.0126 4.15625 38.4526 4.71625 38.4526 5.40625C38.4526 6.09625 39.0126 6.65625 39.7026 6.65625C40.3926 6.65625 40.9526 6.09725 40.9526 5.40625C40.9526 4.71625 40.3926 4.15625 39.7026 4.15625Z" fill="currentColor" />
        <path fillRule="evenodd" clipRule="evenodd" d="M38.988 0.453125C35.678 0.453125 32.994 3.13713 32.994 6.44713V11.4801L25.246 18.6961C23.983 19.8721 24.816 21.9871 26.541 21.9871H38.508C42.083 21.9871 44.983 19.0911 44.989 15.5161C44.989 15.4171 44.986 15.3201 44.982 15.2231V6.98712H47.135C47.682 6.98712 47.832 6.23512 47.327 6.02512L44.849 4.99812L47.328 3.97212C47.833 3.76212 47.684 3.01012 47.137 3.01012H43.897C42.813 1.46412 41.019 0.453125 38.988 0.453125ZM38.508 10.8241C41.005 10.8241 43.046 12.7811 43.181 15.2441V15.4801H43.188C43.188 15.4911 43.189 15.5021 43.189 15.5131C43.185 18.0951 41.09 20.1871 38.508 20.1871H26.541C26.505 20.1861 26.49 20.1781 26.483 20.1731C26.472 20.1651 26.458 20.1481 26.448 20.1231C26.438 20.0981 26.438 20.0771 26.44 20.0631C26.442 20.0551 26.446 20.0381 26.472 20.0141L34.925 12.1431C35.834 11.2961 37.031 10.8241 38.274 10.8241H38.508ZM38.988 2.25412C41.304 2.25412 43.181 4.13113 43.181 6.44713V11.0181C42.002 9.79013 40.345 9.02412 38.508 9.02412H38.274C37.038 9.02512 35.837 9.36612 34.795 9.99812V6.44713C34.795 4.13113 36.672 2.25412 38.988 2.25412Z" fill="currentColor" />
      </g>
      <mask id="birds-flat-inline-mask-2" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="48" y="0" width="24" height="24">
        <path d="M48 0H72V24H48V0Z" fill="white" />
      </mask>
      <g mask="url(#birds-flat-inline-mask-2)">
        <path d="M63.9175 4.76074C63.2275 4.76074 62.6675 5.31974 62.6675 6.01074C62.6675 6.70074 63.2275 7.26074 63.9175 7.26074C64.6075 7.25974 65.1675 6.70074 65.1675 6.01074C65.1675 5.32074 64.6075 4.76074 63.9175 4.76074Z" fill="currentColor" />
        <path fillRule="evenodd" clipRule="evenodd" d="M63.8844 1.02686C62.1554 1.02686 60.5425 1.90187 59.5995 3.35187L57.2135 7.01886H50.9015C49.2935 7.01886 48.4125 8.89087 49.4375 10.1299L52.6565 14.0209L49.3824 19.0539C48.5604 20.3179 49.4675 21.9899 50.9755 21.9899H59.0975C64.5645 21.9899 68.9975 17.5569 68.9975 12.0899V6.13986C68.9975 6.03386 68.9935 5.92987 68.9875 5.82587L71.4474 4.08386C71.9244 3.74586 71.6855 2.99586 71.1015 2.99486L67.9105 2.98987C66.9745 1.79587 65.5194 1.02686 63.8844 1.02686ZM63.8844 2.82686C65.7134 2.82686 67.1964 4.30986 67.1974 6.13986V12.0899C67.1974 16.5629 63.5705 20.1889 59.0975 20.1889H50.9755C50.9485 20.1889 50.9335 20.1829 50.9235 20.1779C50.9115 20.1699 50.8974 20.1569 50.8874 20.1379C50.8774 20.1189 50.8735 20.0999 50.8735 20.0859C50.8745 20.0749 50.8765 20.0579 50.8915 20.0349L53.8595 15.4749L54.3025 16.0119C55.3445 17.2709 56.8935 17.9999 58.5285 17.9999C61.5575 17.9999 64.0135 15.5409 64.0135 12.5129C64.0135 9.75286 61.9764 7.46586 59.3224 7.07686L61.1084 4.33286C61.7194 3.39386 62.7644 2.82686 63.8844 2.82686ZM58.5225 8.81886C60.5595 8.81986 62.2125 10.4739 62.2125 12.5129C62.2125 14.5479 60.5625 16.1999 58.5285 16.1999C57.4305 16.1999 56.3894 15.7099 55.6894 14.8639L50.8235 8.98186C50.8045 8.95786 50.8005 8.94286 50.7995 8.93286C50.7985 8.91886 50.8005 8.89787 50.8105 8.87587C50.8205 8.85387 50.8345 8.83986 50.8465 8.83186C50.8545 8.82586 50.8705 8.81886 50.9015 8.81886H58.5225Z" fill="currentColor" />
      </g>
    </svg>
  )
}

// Shown in all three states — Empty/FTU keep the estimate framing ("~" values, muted, tooltip)
// since nothing's running yet; Filled assumes the co-workers are live, so the same card shows the
// real totals in full-strength black instead of grey. Empty/FTU also lead with a promo banner
// bled to the card's top edge; Empty additionally gets a "Schedule demo" CTA that FTU omits.
function AiWorkforceSummaryCard({
  dataState,
  dateRange,
  onScheduleDemo,
  onOpenAgent,
}: {
  dataState: DataState
  dateRange: string
  onScheduleDemo: () => void
  onOpenAgent?: (target: AgentOpenTarget) => void
}) {
  const filled = dataState === 'filled'
  // Empty state shows only the promo banner — no "AI workforce summary" KPI row below it.
  const bannerOnly = dataState === 'empty'
  const [showAgentPerformance, setShowAgentPerformance] = useState(false)
  const [agentPerformanceSort, setAgentPerformanceSort] = useState<AgentPerformanceSort>('runs')
  const agents = getAgentDirectory('healthcare')
  const agentIds = agents.map((agent) => agent.id)
  const [savedAgentOrder, setSavedAgentOrder] = useState(() => getSavedAgentLayoutOrder(agentIds))
  const [draftAgentOrder, setDraftAgentOrder] = useState(() => getSavedAgentLayoutOrder(agentIds))
  const [draggedAgentId, setDraggedAgentId] = useState<string | null>(null)
  const totalAgents = agents.length
  const totalHours = agents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const totalCostK = agents.reduce((sum, a) => sum + parseFloat(a.costSaved.replace(/[$K]/g, '')), 0)
  const sortedByRuns = [...agents].sort((a, b) => b.running - a.running)
  const displayedAgents = agentPerformanceSort === 'custom'
    ? draftAgentOrder.map((id) => agents.find((agent) => agent.id === id)!).filter(Boolean)
    : sortedByRuns
  const customOrderActive = agentPerformanceSort === 'custom'

  useEffect(() => {
    if (customOrderActive) setDraftAgentOrder(savedAgentOrder)
  }, [customOrderActive, savedAgentOrder])

  const handleAgentSortChange = (value: AgentPerformanceSort) => {
    setAgentPerformanceSort(value)
    if (value === 'custom') setShowAgentPerformance(true)
  }

  const handleDropAgent = (targetId: string) => {
    if (!customOrderActive || !draggedAgentId || draggedAgentId === targetId) return
    setDraftAgentOrder((order) => {
      const sourceIndex = order.indexOf(draggedAgentId)
      const targetIndex = order.indexOf(targetId)
      if (sourceIndex < 0 || targetIndex < 0) return order
      const next = [...order]
      next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, draggedAgentId)
      setSavedAgentOrder(next)
      window.localStorage.setItem(AGENT_LAYOUT_STORAGE_KEY, JSON.stringify(next))
      return next
    })
    setDraggedAgentId(null)
  }

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
      {filled && <div className="-mx-xl -mt-xl h-1 rounded-t-md" style={{ background: SUMMARY_TOP_BAR_GRADIENT }} />}
      {!filled && (
        <div
          className={`-mx-xl -mt-xl flex items-center gap-lg rounded-t-md p-lg ${bannerOnly ? '-mb-xl rounded-b-md' : ''} ${
            bannerOnly ? '' : 'bg-ai-summary'
          }`}
          style={bannerOnly ? { background: EMPTY_BANNER_GRADIENT } : undefined}
        >
          <BirdsFlatInlineIcon className={bannerOnly ? 'text-white' : 'text-text-icon'} />
          <p
            className={`m-0 min-w-0 flex-1 ${
              bannerOnly ? `${EMPTY_BANNER_TEXT_CLASS} text-white` : 'text-[16px] leading-6 tracking-[-0.32px] text-text-primary'
            }`}
          >
            Meet your new AI coworkers. Jay, Myna, and Robin cover reviews, conversations, and appointments so you can focus on your business.
          </p>
          {dataState === 'empty' && (
            <button
              type="button"
              onClick={onScheduleDemo}
              className={`flex h-9 shrink-0 items-center rounded-md bg-white px-lg ${EMPTY_BANNER_TEXT_CLASS} text-ai-brand transition-colors hover:opacity-90`}
            >
              Schedule demo
            </button>
          )}
        </div>
      )}
      {!bannerOnly && (
        <>
          <h3 className="m-0 text-[16px] leading-6 tracking-[-0.32px] text-text-primary">AI Co-worker summary</h3>
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
            <>
              <AgentPerformanceSortDropdown value={agentPerformanceSort} onChange={handleAgentSortChange} />
              <div className="grid grid-cols-3 gap-lg">
                {displayedAgents.map((agent) => (
                  <LayoutWidget
                    key={agent.id}
                    id={agent.id}
                    editing={customOrderActive}
                    dragging={draggedAgentId === agent.id}
                    onDragStart={setDraggedAgentId}
                    onDrop={handleDropAgent}
                  >
                    <AgentPerformanceCard
                      agent={agent}
                      editing={customOrderActive}
                      onOpenAgent={onOpenAgent ? () => onOpenAgent(getAgentOpenTarget(agent)) : undefined}
                    />
                  </LayoutWidget>
                ))}
              </div>
            </>
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
      <h3 className="m-0 flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
        <FigmaIconFrontDesk size={20} className="text-text-icon" />
        Appointments
      </h3>
      <div className={KPI_ROW_CLASS}>
        {EMPTY_STATE_APPOINTMENTS_STATS.map((s) => (
          <div key={s.id} className={KPI_TILE_CLASS}>
            <p className="m-0 whitespace-nowrap text-display text-text-action">{s.value}</p>
            <p className="m-0 mt-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">{s.label}</p>
          </div>
        ))}
        <div className={KPI_TILE_CLASS}>
          <p className="m-0 whitespace-nowrap text-display text-text-primary">{EMPTY_STATE_NO_SHOW_RATE.value}</p>
          <p className="m-0 mt-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">{EMPTY_STATE_NO_SHOW_RATE.label}</p>
        </div>
      </div>
    </SectionCard>
  )
}

// Section headers that ignore the page date filter — shown via info tooltip in both overview states.
const SECTION_ALL_TIME_INFO =
  'Data shown here is for all time. The time filter does not apply.'
const SECTION_RECENT_DATA_INFO =
  'Data shown here is always for the most recent period available.'

const SECTION_INFO_TOOLTIPS: Partial<Record<string, string>> = {
  inbox: SECTION_ALL_TIME_INFO,
  listings: SECTION_ALL_TIME_INFO,
  'search-ai': SECTION_RECENT_DATA_INFO,
}

function SectionHeaderInfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip content={text} variant="detail">
      <button
        type="button"
        className="flex items-center justify-center text-text-secondary"
        aria-label="More info"
      >
        <Icon name="info" size={14} />
      </button>
    </Tooltip>
  )
}

function SectionCardTitle({
  icon,
  label,
  infoTooltip,
}: {
  icon: ReactNode
  label: string
  infoTooltip?: string
}) {
  return (
    <h3 className="m-0 flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
      {icon}
      <span className="flex items-center gap-xs">
        {label}
        {infoTooltip && <SectionHeaderInfoTooltip text={infoTooltip} />}
      </span>
    </h3>
  )
}

// Empty state only — same plain-KPI treatment as Appointments, pulled from Birdeye's Inbox
// surface. Rendered first in Empty state, matching the main nav's product order.
function EmptyStateInboxCard() {
  return (
    <SectionCard>
      <SectionCardTitle
        icon={<FigmaIconInbox size={20} className="text-text-icon" />}
        label="Inbox"
        infoTooltip={SECTION_INFO_TOOLTIPS.inbox}
      />
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
      <h3 className="m-0 flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
        <FigmaIconReferrals size={20} className="text-text-icon" />
        Referrals
      </h3>
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

function sectionHasVisibleContent(section: V2Section, showAgents: boolean, dataState: DataState): boolean {
  const showAgentRows = showAgents && section.agents.length > 0
  const showSetupBanner = dataState === 'ftu' && section.agents.length > 0
  const hasStatsOverride = Boolean(SECTION_STATS_OVERRIDES[section.id]?.length)
  const hasBodyContent =
    Boolean(section.stats) ||
    hasStatsOverride ||
    Boolean(section.actionNeeded) ||
    section.id === 'reviews' ||
    showAgentRows
  return hasBodyContent || showSetupBanner
}

function isFilledLayoutWidgetVisible(id: string, showAgents: boolean, dataState: DataState): boolean {
  if (id === 'front-desk') return true
  const section = ORDERED_SECTIONS.find((item) => item.id === id)
  if (!section) return false
  return sectionHasVisibleContent(section, showAgents, dataState)
}

function isEmptyLayoutWidgetVisible(id: string, showAgents: boolean, dataState: DataState): boolean {
  if (id === 'inbox' || id === 'referrals' || id === 'appointments') return true
  const section = ORDERED_SECTIONS.find((item) => item.id === id)
  if (!section) return false
  return sectionHasVisibleContent(section, showAgents, dataState)
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
  if (!sectionHasVisibleContent(section, showAgents, dataState)) return null
  const sectionLabel = SECTION_LABEL_OVERRIDES[section.id] ?? section.label
  const sectionInfoTooltip = SECTION_INFO_TOOLTIPS[section.id]
  return (
    <SectionCard>
      <SectionCardTitle
        icon={
          NavIcon ? (
            <NavIcon size={20} className="text-text-icon" />
          ) : (
            <Icon name={section.icon} size={20} className="text-text-icon" />
          )
        }
        label={sectionLabel}
        infoTooltip={sectionInfoTooltip}
      />

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

function EmptyLayoutCard({ id, showAgents, dataState }: { id: string; showAgents: boolean; dataState: DataState }) {
  if (id === 'inbox') return <EmptyStateInboxCard />
  if (id === 'referrals') return <EmptyStateReferralsCard />
  if (id === 'appointments') return <EmptyStateAppointmentsCard />

  const section = ORDERED_SECTIONS.find((item) => item.id === id)
  return section ? <ProductSectionCard section={section} showAgents={showAgents} dataState={dataState} /> : null
}

function FilledLayoutCard({ id, showAgents, dataState }: { id: string; showAgents: boolean; dataState: DataState }) {
  if (id === 'front-desk') return <FrontDeskSection showAgents={showAgents} showSetupBanner={dataState === 'ftu'} dataState={dataState} />

  const section = ORDERED_SECTIONS.find((item) => item.id === id)
  return section ? <ProductSectionCard section={section} showAgents={showAgents} dataState={dataState} /> : null
}

function LayoutWidget({
  id,
  editing,
  dragging,
  onDragStart,
  onDrop,
  children,
}: {
  id: string
  editing: boolean
  dragging: boolean
  onDragStart: (id: string) => void
  onDrop: (id: string) => void
  children: ReactNode
}) {
  return (
    <div
      className={`relative transition-opacity ${dragging ? 'opacity-40' : ''}`}
      onDragOver={editing ? (event) => event.preventDefault() : undefined}
      onDrop={
        editing
          ? (event: DragEvent<HTMLDivElement>) => {
              event.preventDefault()
              onDrop(id)
            }
          : undefined
      }
    >
      {children}
      {editing && (
        <button
          type="button"
          draggable
          aria-label="Drag to reorder card"
          title="Drag to reorder"
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move'
            onDragStart(id)
          }}
          className="absolute left-1/2 top-1 z-10 flex size-8 -translate-x-1/2 cursor-grab items-center justify-center text-[#A3A3A3] active:cursor-grabbing"
        >
          <Icon name="drag_indicator" size={20} className="rotate-90" />
        </button>
      )}
    </div>
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
    { id: 'empty', label: 'Current overview' },
    { id: 'filled', label: 'Purchased co-worker' },
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

export function OverviewV2_1Screen({ userName = 'Rupa', onOpenAgent }: OverviewV2_1ScreenProps = {}) {
  const [dateRange, setDateRange] = useState('Last month')
  const [dataState, setDataState] = useState<DataState>('empty')
  const [editingLayout, setEditingLayout] = useState(false)
  const [savedEmptyLayoutOrder, setSavedEmptyLayoutOrder] = useState(getSavedEmptyLayoutOrder)
  const [draftEmptyLayoutOrder, setDraftEmptyLayoutOrder] = useState(getSavedEmptyLayoutOrder)
  const [savedFilledLayoutOrder, setSavedFilledLayoutOrder] = useState(getSavedFilledLayoutOrder)
  const [draftFilledLayoutOrder, setDraftFilledLayoutOrder] = useState(getSavedFilledLayoutOrder)
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null)
  const [scheduleDemoOpen, setScheduleDemoOpen] = useState(false)
  // Agent-level rows (per-section coworker cards) are hidden in every state now — Filled used to
  // be the one state that showed them; the AI workforce summary card is the only agent-related
  // content left on the page.
  const showAgents = false
  const rawLayoutOrder = dataState === 'empty'
    ? (editingLayout ? draftEmptyLayoutOrder : savedEmptyLayoutOrder)
    : (editingLayout ? draftFilledLayoutOrder : savedFilledLayoutOrder)
  const layoutOrder = dataState === 'empty' ? rawLayoutOrder : normalizeFilledLayoutOrder(rawLayoutOrder)
  const visibleLayoutOrder = layoutOrder.filter((id) =>
    dataState === 'empty'
      ? isEmptyLayoutWidgetVisible(id, showAgents, dataState)
      : isFilledLayoutWidgetVisible(id, showAgents, dataState),
  )

  const handleEditLayout = () => {
    if (dataState === 'empty') setDraftEmptyLayoutOrder(savedEmptyLayoutOrder)
    else setDraftFilledLayoutOrder(normalizeFilledLayoutOrder(savedFilledLayoutOrder))
    setEditingLayout(true)
  }

  const handleDropWidget = (targetId: string) => {
    if (!draggedWidgetId || draggedWidgetId === targetId) return
    const reorder = (order: string[]) => {
      const sourceIndex = order.indexOf(draggedWidgetId)
      const targetIndex = order.indexOf(targetId)
      if (sourceIndex < 0 || targetIndex < 0) return order
      const next = [...order]
      next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, draggedWidgetId)
      return next
    }
    if (dataState === 'empty') setDraftEmptyLayoutOrder(reorder)
    else setDraftFilledLayoutOrder((order) => normalizeFilledLayoutOrder(reorder(order)))
    setDraggedWidgetId(null)
  }

  const handleSaveLayout = () => {
    if (dataState === 'empty') {
      setSavedEmptyLayoutOrder(draftEmptyLayoutOrder)
      window.localStorage.setItem(EMPTY_LAYOUT_STORAGE_KEY, JSON.stringify(draftEmptyLayoutOrder))
    } else {
      const normalized = normalizeFilledLayoutOrder(draftFilledLayoutOrder)
      setSavedFilledLayoutOrder(normalized)
      window.localStorage.setItem(FILLED_LAYOUT_STORAGE_KEY, JSON.stringify(normalized))
    }
    setEditingLayout(false)
    setDraggedWidgetId(null)
  }

  return (
    <div className="flex h-full flex-col">
      <TopNav title="Overview" initials="S" />
      <div className="flex-1 overflow-y-auto bg-white px-2xl py-xl">
        <div className="flex flex-col gap-lg">
          <div className="flex items-start justify-between">
            <div>
              <h1 className={`m-0 text-text-primary ${editingLayout ? 'text-[16px] leading-6 tracking-[-0.32px]' : 'text-display'}`}>
                {editingLayout ? 'Change layout' : `Welcome, ${userName}!`}
              </h1>
              <p className="m-0 mt-xs text-body text-text-secondary">
                {editingLayout ? 'Drag and drop product cards to personalize your overview.' : 'Here are the things which need your attention.'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-sm">
              {editingLayout ? (
                <button type="button" onClick={handleSaveLayout} className="flex h-9 items-center rounded-md bg-primary px-lg text-body text-white hover:bg-primary-hover">
                  Save
                </button>
              ) : (
                <>
                  <DateRangeDropdown value={dateRange} onChange={setDateRange} />
                  <button
                    type="button"
                    aria-label="Edit layout"
                    onClick={handleEditLayout}
                    className="flex size-9 items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
                  >
                    <Icon name="edit" size={20} />
                  </button>
                  <button
                    type="button"
                    aria-label="Download"
                    className="flex size-9 items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
                  >
                    <Icon name="download" size={20} />
                  </button>
                  <button
                    type="button"
                    aria-label="Filter"
                    className="flex size-9 items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
                  >
                    <ListFilter className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
                  </button>
                </>
              )}
            </div>
          </div>

          {!editingLayout && (
            <AiWorkforceSummaryCard
              dataState={dataState}
              dateRange={dateRange}
              onScheduleDemo={() => setScheduleDemoOpen(true)}
              onOpenAgent={onOpenAgent}
            />
          )}

          {dataState === 'empty' ? (
            visibleLayoutOrder.map((id) => (
              <LayoutWidget
                key={id}
                id={id}
                editing={editingLayout}
                dragging={draggedWidgetId === id}
                onDragStart={setDraggedWidgetId}
                onDrop={handleDropWidget}
              >
                <EmptyLayoutCard id={id} showAgents={showAgents} dataState={dataState} />
              </LayoutWidget>
            ))
          ) : (
            visibleLayoutOrder.map((id) => (
              <LayoutWidget
                key={id}
                id={id}
                editing={editingLayout}
                dragging={draggedWidgetId === id}
                onDragStart={setDraggedWidgetId}
                onDrop={handleDropWidget}
              >
                <FilledLayoutCard id={id} showAgents={showAgents} dataState={dataState} />
              </LayoutWidget>
            ))
          )}

          {!editingLayout && (dataState === 'empty' || dataState === 'filled') && <BirdeyeScoreOverview />}
        </div>
      </div>

      <DataStateSwitcher
        value={dataState}
        onChange={(nextState) => {
          setDataState(nextState)
          setEditingLayout(false)
          setDraggedWidgetId(null)
        }}
      />
      <ScheduleDemoPanel open={scheduleDemoOpen} onClose={() => setScheduleDemoOpen(false)} />
    </div>
  )
}
