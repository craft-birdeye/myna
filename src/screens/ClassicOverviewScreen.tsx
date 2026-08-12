import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { Chip, DataTable, DatePickerModal, Icon, InfoTooltip, StackedBarChart, Tooltip, TopNav, TrendLineChart, type Column } from '../components'
import { AiAgentIcon } from '../assets/AiAgentIcon'
import iconGoogle from '../assets/icon-google.svg'
import iconGooglePlay from '../assets/icon-google-play.svg'
import mynaLogo from '../assets/icon-myna.svg'
import jayLogo from '../assets/icon-jay.svg'
import robinLogo from '../assets/icon-robin.svg'
import { getAgentDirectory, PERSONA_GROUPS, type AgentDirectoryEntry, type AgentPersonaId } from '../data/agentDirectoryData'
import {
  OVERVIEW_APPOINTMENTS_STATS,
  OVERVIEW_BIRDEYE_SCORE,
  OVERVIEW_INBOX_ACTIVITY_STATS,
  OVERVIEW_INBOX_ALERT_STATS,
  OVERVIEW_LISTINGS_GOOGLE_REPORT,
  OVERVIEW_LISTINGS_QA,
  OVERVIEW_MEDIAN_RESPONSE_TREND,
  OVERVIEW_REFERRALS_STATS,
  OVERVIEW_REVIEWS_BREAKDOWN,
  OVERVIEW_REVIEWS_RATING,
  OVERVIEW_REVIEWS_STATS,
  OVERVIEW_REVIEW_SOURCES,
  OVERVIEW_SOCIAL_DATA,
  OVERVIEW_SOCIAL_NEW_FOLLOWERS,
  OVERVIEW_SOCIAL_SERIES,
  OVERVIEW_TOP_LOCATIONS,
  OVERVIEW_UNDERSTANDING_SCORES,
  type OverviewLocationScoreRow,
  type OverviewStat,
} from '../data/overviewData'

interface ClassicOverviewScreenProps {
  userName?: string
  /** Shows a "Switch to agentic overview" button in the welcome header; called on click. */
  onSwitchToAgentic?: () => void
}

// Co-worker brand names + logos + accent colors for the three persona groups — same name
// mapping as OverviewScreen's COWORKER_NAME. Accent colors are sampled from each co-worker's
// own icon (icon-myna.svg/icon-jay.svg/icon-robin.svg) so the active tab underline and label
// always match that co-worker's brand color instead of a generic primary blue.
const COWORKER_NAME: Record<AgentPersonaId, string> = {
  operations: 'Myna',
  marketing: 'Jay',
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
const COWORKER_TAB_ORDER: AgentPersonaId[] = ['marketing', 'operations', 'cx']

// Every KPI tile across the page (every widget's StatGroup/OutcomeKpiGroup) floors at 250px, but
// grows wider when its own value/label text needs more room (nowrap, so long text stretches the
// tile instead of wrapping to a second line). There's no fixed per-row count — however many tiles
// actually fit across the card's width stay on that line, and the rest wrap to the next one.
const KPI_TILE_CLASS = 'min-w-[250px] shrink-0'
const KPI_ROW_CLASS = 'flex flex-wrap gap-sm'

function StatGroup({
  stats,
  big = false,
}: {
  stats: OverviewStat[]
  /** Uses the 24px `text-display` token instead of the default 18px `text-h3` — Overview (mixed) only. */
  big?: boolean
}) {
  return (
    <div className={KPI_ROW_CLASS}>
      {stats.map((s) => (
        <div key={s.id} className={KPI_TILE_CLASS}>
          <p className={`m-0 whitespace-nowrap ${big ? 'text-display' : 'text-h3'} ${s.danger ? 'text-chip-danger-text' : 'text-text-primary'}`}>{s.value}</p>
          <p className="m-0 mt-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// 16,230 → "16.2K". Already-compact values ("1.9K", "434") pass through untouched.
function formatK(raw: string): string {
  const numeric = parseFloat(raw.replace(/,/g, ''))
  if (!isNaN(numeric) && numeric >= 1000) return `${parseFloat((numeric / 1000).toFixed(1))}K`
  return raw
}

// "16,230" → 16230, "7.9K" → 7900 — agentDirectoryData.ts mixes both formats.
function parseOutcomeNumber(raw: string): number {
  const trimmed = raw.trim()
  if (trimmed.toUpperCase().endsWith('K')) return parseFloat(trimmed) * 1000
  return parseFloat(trimmed.replace(/,/g, ''))
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${parseFloat((n / 1000).toFixed(1))}K`
  return String(Math.round(n))
}

// "Today"/"Last week" are short enough that hours read naturally; anything longer (Last month,
// Last quarter, a custom range) accumulates enough hours that days is the more readable unit.
function formatTimeSaved(hours: number, dateRange: string): string {
  return dateRange === 'Today' || dateRange === 'Last week' ? `${hours}h` : `${(hours / 24).toFixed(1)} days`
}

// Illustrative share of each outcome's volume driven by the agent's own automated actions
// (vs. human-assisted) — keyed by agentDirectoryData.ts's agent id.
const AGENT_CONTRIBUTION_PCT: Record<string, string> = {
  'front-desk': '82%',
  waitlist: '76%',
  'pre-visit': '90%',
  reminder: '85%',
  'tagging-routing': '95%',
  'review-response': '88%',
  'review-generation': '93%',
  'social-publishing': '97%',
  'social-engagement': '80%',
  'survey-creation': '91%',
  'survey-distribution': '96%',
  'survey-response': '84%',
  'ticketing-surveys': '92%',
  'ticketing-reviews': '89%',
}

interface AgentExtraKpi {
  value: string
  label: string
  tooltip?: string
}

// Extra top-level KPIs shown on each agent's own card, on top of the outcome/time saved/cost
// saved already there — keyed by agentDirectoryData.ts's agent `name`. Where the agent already
// has a real breakdown on its own detail page (e.g. Front desk agent's Conversations responded/
// Resolution rate — see AgentDetailScreen.tsx's METRICS_BY_AGENT), those are reused here; agents
// without an existing detail-page breakdown get an illustrative pair in the same style.
const AGENT_EXTRA_KPIS: Record<string, AgentExtraKpi[]> = {
  'Front desk agent': [
    { value: '18,420', label: 'Conversations responded', tooltip: 'Total inbound conversations handled by the agent across all channels in the selected period.' },
    { value: '88%', label: 'Resolution rate', tooltip: 'Percentage of conversations fully resolved by the agent. Calculated as resolved ÷ responded.' },
  ],
  'Waitlist agent': [
    { value: '5.5K', label: 'Outreach sent', tooltip: 'Total waitlist outreach messages sent by the agent to fill cancelled or open slots.' },
    { value: '23.7%', label: 'Fill rate', tooltip: 'Percentage of waitlisted patients who booked after receiving outreach.' },
  ],
  'Pre-visit agent': [
    { value: '463', label: 'Outreach sent', tooltip: 'Total intake reminder outreach sent by the agent across all channels in the selected period.' },
    { value: '90%', label: 'Completion rate', tooltip: 'Percentage of outreach that resulted in a completed intake.' },
  ],
  'Reminder agent': [
    { value: '450', label: 'Total bookings', tooltip: 'Total appointments booked across all locations in the selected period.' },
    { value: '23.7%', label: 'Confirmation rate', tooltip: 'Percentage of total bookings where the patient confirmed attendance.' },
  ],
  'Tagging & routing agent': [
    { value: '2,850', label: 'Statuses updated', tooltip: 'Total conversations that received an updated contact status.' },
    { value: '2,000', label: 'Conversations assigned', tooltip: 'Total conversations assigned to a team or user by the agent.' },
  ],
  'Review response agent': [
    { value: '92%', label: 'Response rate', tooltip: 'Percentage of eligible reviews that received a reply from the agent.' },
    { value: '20m', label: 'Average response time', tooltip: 'Average time from review receipt to published reply.' },
  ],
  'Review generation agent': [
    { value: '4.2K', label: 'Requests sent', tooltip: 'Total review requests sent to customers in the selected period.' },
    { value: '21%', label: 'Conversion rate', tooltip: 'Percentage of requests that resulted in a published review.' },
  ],
  'Social publishing agent': [
    { value: '812', label: 'Posts scheduled', tooltip: 'Total posts queued for publishing across all connected accounts.' },
    { value: '91%', label: 'Approval rate', tooltip: 'Percentage of scheduled posts published without requiring manual edits.' },
  ],
  'Social engagement agent': [
    { value: '89%', label: 'Response rate', tooltip: 'Percentage of comments and mentions that received a reply.' },
    { value: '15m', label: 'Average response time', tooltip: 'Average time from a comment or mention to a reply.' },
  ],
  'Survey creation agent': [
    { value: '12', label: 'Templates used', tooltip: 'Distinct survey templates used to build new surveys in the selected period.' },
    { value: '3m', label: 'Average build time', tooltip: 'Average time to configure and publish a new survey.' },
  ],
  'Survey distribution agent': [
    { value: '4.1K', label: 'Touchpoints reached', tooltip: 'Distinct customers reached across email, text, and QR touchpoints.' },
    { value: '96%', label: 'Delivery rate', tooltip: 'Percentage of surveys successfully delivered to the customer.' },
  ],
  'Survey response agent': [
    { value: '58%', label: 'Response rate', tooltip: 'Percentage of sent surveys that received a customer response.' },
    { value: '14%', label: 'Detractors flagged', tooltip: 'Percentage of responses flagged as detractors for follow-up.' },
  ],
  'Ticketing agent · Surveys': [
    { value: '92%', label: 'Auto-routed', tooltip: 'Percentage of tickets automatically routed to the right team without manual triage.' },
    { value: '4m', label: 'Average time to open', tooltip: 'Average time from a flagged survey response to a ticket being opened.' },
  ],
  'Ticketing agent · Reviews': [
    { value: '89%', label: 'Auto-routed', tooltip: 'Percentage of tickets automatically routed to the right team by location and topic.' },
    { value: '5m', label: 'Average time to open', tooltip: 'Average time from a low-star review to a ticket being opened.' },
  ],
}

interface OutcomeKpi {
  id: string
  value: string
  label: string
  agentName: string
  agentPct?: string
  danger?: boolean
}

// Same tile shape as StatGroup, with a small violet agent-contribution badge next to the value —
// hovering it explains which agent and how much of the total that share represents.
function OutcomeKpiGroup({ stats, big = true }: { stats: OutcomeKpi[]; big?: boolean }) {
  return (
    <div className={KPI_ROW_CLASS}>
      {stats.map((s) => {
        const pctNum = s.agentPct ? parseFloat(s.agentPct) : null
        const contribution = pctNum != null ? formatNumber((parseOutcomeNumber(s.value) * pctNum) / 100) : null
        return (
          <div key={s.id} className={KPI_TILE_CLASS}>
            <p
              className={`m-0 flex items-baseline gap-xs whitespace-nowrap ${big ? 'text-display' : 'text-h3'} ${
                s.danger ? 'text-chip-danger-text' : 'text-text-primary'
              }`}
            >
              {s.value}
              {s.agentPct && (
                <Tooltip
                  variant="detail"
                  content={`${s.agentName} handled ${contribution} of ${s.value} ${s.label.toLowerCase()}.`}
                >
                  <span className="flex items-center gap-[2px] text-[14px] leading-none text-ai-brand">
                    <AiAgentIcon size={14} />
                    {s.agentPct}
                  </span>
                </Tooltip>
              )}
            </p>
            <p className="m-0 mt-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">{s.label}</p>
          </div>
        )
      })}
    </div>
  )
}

// One KPI within an AgentPerformanceCard — plain by default, with a hover tooltip only for the
// card's primary (outcome) metric, same treatment as the Co-workers directory's own agent cards.
function AgentKpiCell({ value, label, tooltip }: { value: string; label: string; tooltip?: string }) {
  const content = (
    <div className="min-w-[140px] text-center">
      <p className="m-0 text-h3 text-text-primary">{value}</p>
      <p className="m-0 mt-xs text-small text-text-tertiary">{label}</p>
    </div>
  )
  if (!tooltip) return content
  return (
    <Tooltip content={tooltip} variant="detail">
      {content}
    </Tooltip>
  )
}

// Zero-state estimates panel — a single light-blue pill (hugs its own content, doesn't stretch)
// with the "Estimates from similar businesses" caption on the left and the three illustrative
// "~" KPIs after it, all inside the one box instead of separate chips per KPI.
function ZeroStateEstimatesPanel({ agent }: { agent: AgentDirectoryEntry }) {
  const kpis = [
    { value: `~${formatK(agent.outcome.value)}`, label: agent.outcome.label },
    { value: `~${agent.timeSaved}`, label: 'Time saved' },
    { value: `~${agent.costSaved}`, label: 'Cost saved' },
  ]
  return (
    <div className="inline-flex flex-wrap items-center gap-lg rounded-sm bg-chip-info-bg px-lg py-sm">
      <span className="whitespace-nowrap text-body text-text-secondary">Estimates from similar businesses</span>
      <div className="h-8 w-px shrink-0 bg-border" />
      <div className="flex flex-wrap items-center gap-xl">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="text-center">
            <p className="m-0 text-h3 text-text-secondary">{kpi.value}</p>
            <p className="m-0 text-small text-text-tertiary">{kpi.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Full-width version of the agent card shown on the Overview/Co-workers directory — same fields
// (category, running/paused status, name, description, KPIs), just laid out across the full card
// width instead of a grid cell.
function AgentPerformanceCard({ agent, zeroState = false }: { agent: AgentDirectoryEntry; zeroState?: boolean }) {
  const [videoOpen, setVideoOpen] = useState(false)
  const extraKpis = AGENT_EXTRA_KPIS[agent.name] ?? []
  return (
    <div className="rounded-md border border-border bg-surface p-xl">
      <div className="flex flex-wrap items-center justify-between gap-3xl">
        <div className="min-w-[220px] max-w-[320px] shrink-0 pr-3xl">
          <p className="m-0 truncate text-small text-text-tertiary">{agent.category}</p>
          <h4 className="m-0 mt-xs mb-xs text-[16px] leading-6 tracking-[-0.32px] text-text-primary">{agent.name}</h4>
          <p className="m-0 text-small text-text-tertiary">{agent.description}</p>
        </div>
        {zeroState ? (
          <div className="flex shrink-0 items-center gap-sm">
            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              className="flex h-9 shrink-0 items-center gap-xs rounded-md px-md text-body text-text-action hover:bg-surface-hover"
            >
              <Icon name="play_circle" size={18} />
              Show how this works
            </button>
            <button
              type="button"
              className="flex h-9 shrink-0 items-center gap-xs rounded-md bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
            >
              <Icon name="add" size={18} />
              Create agent
            </button>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-xl">
            <AgentKpiCell value={String(agent.running)} label="Agents running" />
            <AgentKpiCell value={formatK(agent.outcome.value)} label={agent.outcome.label} tooltip={agent.description} />
            {extraKpis.map((kpi) => (
              <AgentKpiCell key={kpi.label} value={kpi.value} label={kpi.label} tooltip={kpi.tooltip} />
            ))}
            <AgentKpiCell value={agent.timeSaved} label="Time saved" />
            <AgentKpiCell value={agent.costSaved} label="Cost saved" />
          </div>
        )}
      </div>

      {zeroState && (
        <div className="mt-xl flex justify-center">
          <ZeroStateEstimatesPanel agent={agent} />
        </div>
      )}

      {videoOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60"
          onClick={() => setVideoOpen(false)}
        >
          <div className="relative w-full max-w-[720px] rounded-md bg-surface p-lg" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setVideoOpen(false)}
              className="absolute right-lg top-lg flex size-8 items-center justify-center rounded-full text-text-icon hover:bg-surface-hover"
            >
              <Icon name="close" size={20} />
            </button>
            <p className="m-0 mb-lg text-h3 text-text-primary">{agent.name}</p>
            <div className="flex aspect-video items-center justify-center rounded-sm bg-surface-selected">
              <Icon name="play_circle" size={48} className="text-text-tertiary" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Detail view shown just below every "<Co-worker> performance" section — one full-length
// AgentPerformanceCard per agent.
function AgentPerformanceCardList({ agents, zeroState = false }: { agents: AgentDirectoryEntry[]; zeroState?: boolean }) {
  return (
    <div className="mt-2xl flex flex-col gap-lg">
      {agents.map((agent) => (
        <AgentPerformanceCard key={agent.id} agent={agent} zeroState={zeroState} />
      ))}
    </div>
  )
}

// Zero-state promo strip shown inline inside the AI workforce summary card when there's no real
// data yet — overlapping co-worker avatars + a savings pitch instead of numbers.
function ZeroStateSummaryBanner() {
  return (
    <div className="flex items-center gap-lg rounded-md border border-ai-summary-border bg-ai-summary p-lg">
      <div className="flex shrink-0 items-center">
        <img src={mynaLogo} alt="" className="size-9 rounded-full border-2 border-surface" />
        <img src={jayLogo} alt="" className="-ml-3 size-9 rounded-full border-2 border-surface" />
        <img src={robinLogo} alt="" className="-ml-3 size-9 rounded-full border-2 border-surface" />
      </div>
      <p className="m-0 min-w-0 flex-1 truncate text-body text-text-primary">
        AI co-workers save up to 20 hours a week — set up yours and start saving today.
      </p>
    </div>
  )
}

function AiCoworkerSummaryCard({ dateRange, zeroState = false }: { dateRange: string; zeroState?: boolean }) {
  const mynaAgents = getAgentDirectory('healthcare').filter((a) => a.persona === 'operations')
  const jayAgents = getAgentDirectory('healthcare').filter((a) => a.persona === 'marketing')
  const robinAgents = getAgentDirectory('healthcare').filter((a) => a.persona === 'cx')
  const mynaRunning = mynaAgents.filter((a) => a.running > 0).length
  const jayRunning = jayAgents.filter((a) => a.running > 0).length
  const robinRunning = robinAgents.filter((a) => a.running > 0).length
  const mynaHours = mynaAgents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const jayHours = jayAgents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const robinHours = robinAgents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const mynaCostK = mynaAgents.reduce((sum, a) => sum + parseFloat(a.costSaved.replace(/[$K]/g, '')), 0)
  const jayCostK = jayAgents.reduce((sum, a) => sum + parseFloat(a.costSaved.replace(/[$K]/g, '')), 0)
  const robinCostK = robinAgents.reduce((sum, a) => sum + parseFloat(a.costSaved.replace(/[$K]/g, '')), 0)

  const totalAgents = mynaRunning + jayRunning + robinRunning
  const totalHours = mynaHours + jayHours + robinHours
  const totalCostK = mynaCostK + jayCostK + robinCostK

  const stats: OverviewStat[] = zeroState
    ? [
        { id: 'co-workers', value: '3', label: 'Co-workers' },
        { id: 'agents', value: '0', label: 'Agents' },
        { id: 'time-saved', value: '--', label: 'Time saved' },
        { id: 'cost-saved', value: '--', label: 'Cost saved' },
      ]
    : [
        { id: 'co-workers', value: '3', label: 'Co-workers' },
        { id: 'agents', value: String(totalAgents), label: 'Agents' },
        { id: 'time-saved', value: formatTimeSaved(totalHours, dateRange), label: 'Time saved' },
        { id: 'cost-saved', value: `$${totalCostK.toFixed(1)}K`, label: 'Cost saved' },
      ]

  return (
    <div className="rounded-md border border-border bg-surface p-2xl">
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">AI workforce summary</h3>
      <StatGroup stats={stats} big />
      {zeroState && (
        <div className="mt-xl">
          <ZeroStateSummaryBanner />
        </div>
      )}
    </div>
  )
}

// Custom tab bar (not the shared `Tabs` component) so each tab's active state can use that
// co-worker's own brand color (COWORKER_ACCENT) instead of the shared component's fixed primary
// blue, and so the logo sits beside the label+subtext column instead of inside its first row.
function CoworkerTabBar({
  activeTab,
  onChange,
}: {
  activeTab: AgentPersonaId
  onChange: (id: AgentPersonaId) => void
}) {
  return (
    <div className="relative flex items-center gap-xs">
      {COWORKER_TAB_ORDER.map((id, i) => {
        const active = id === activeTab
        const group = PERSONA_GROUPS.find((g) => g.id === id)!
        const agentCount = getAgentDirectory('healthcare').filter((a) => a.persona === id).length
        return (
          <Fragment key={id}>
            {i > 0 && <span className="h-6 w-px shrink-0 bg-border" />}
            <button type="button" onClick={() => onChange(id)} className="relative flex flex-col items-stretch text-left">
              <span
                className={`flex items-start gap-sm rounded-sm px-lg py-md text-left transition-colors ${active ? '' : 'hover:bg-surface-hover'}`}
              >
                <img src={COWORKER_LOGO[id]} alt="" className="size-7 shrink-0 rounded-full" />
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

interface InboxSectionProps {
  /** Adds the outcome KPI row (agent-badged outcomes + alert stats) instead of the plain stat row. */
  showMynaPerformance?: boolean
}

// Myna = the Operations co-worker (Inbox + Front desk family agents) — see PERSONA_GROUPS
// in agentDirectoryData.ts, same grouping shown on the co-worker tabs above.
function InboxSection({ showMynaPerformance = false }: InboxSectionProps) {
  // Reminder's outcome (Appointments confirmed) is promoted on the Appointments section instead —
  // excluded here so this section's own outcome badges don't double up with Appointments'.
  const mynaAgents = showMynaPerformance
    ? getAgentDirectory('healthcare').filter((a) => a.persona === 'operations' && a.id !== 'reminder')
    : []
  const outcomeStats: OutcomeKpi[] = mynaAgents.map((a) => ({
    id: a.id,
    value: formatK(a.outcome.value),
    label: a.outcome.label,
    agentName: a.name,
    agentPct: AGENT_CONTRIBUTION_PCT[a.id],
  }))
  return (
    <>
      {showMynaPerformance ? (
        <>
          <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Front desk</h3>
          <OutcomeKpiGroup stats={outcomeStats} />
          <h3 className="m-0 mb-lg mt-3xl text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Inbox</h3>
          <StatGroup stats={OVERVIEW_INBOX_ALERT_STATS} big />
        </>
      ) : (
        <>
          <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Inbox</h3>
          <StatGroup stats={OVERVIEW_INBOX_ALERT_STATS} big />
        </>
      )}
    </>
  )
}

const REVIEW_SOURCE_LOGOS: Record<string, string> = {
  google: iconGoogle,
  'google-play': iconGooglePlay,
}

interface ReviewsSectionProps {
  /** Adds the outcome KPI row (agent-badged outcomes) instead of the plain stat column. */
  showJayPerformance?: boolean
}

// Jay = the Marketing co-worker (Reviews AI + Social AI agents) — see PERSONA_GROUPS in
// agentDirectoryData.ts, same grouping shown on the co-worker tabs above.
function ReviewsSection({ showJayPerformance = false }: ReviewsSectionProps) {
  const [brokenLogos, setBrokenLogos] = useState<Set<string>>(new Set())
  const maxCount = Math.max(...OVERVIEW_REVIEWS_BREAKDOWN.map((b) => b.count))
  // Only the Reviews AI agents actually badged in this section's top KPI row (Social publishing/
  // engagement belong to the Social section instead) — keeps the outcomes in sync with what's
  // shown up top.
  const jayAgents = showJayPerformance
    ? getAgentDirectory('healthcare').filter((a) => a.id === 'review-generation' || a.id === 'review-response')
    : []
  const requestsSent = OVERVIEW_REVIEWS_STATS.find((s) => s.id === 'requests-sent')!
  const reviewsReceived = OVERVIEW_REVIEWS_STATS.find((s) => s.id === 'reviews-received')!
  const threeStarOrLess = OVERVIEW_REVIEWS_STATS.find((s) => s.id === '3-star-or-less')!
  const haventReplied = OVERVIEW_REVIEWS_STATS.find((s) => s.id === 'havent-replied')!
  const reviewsAgentOutcomes: OutcomeKpi[] = jayAgents
    .sort((a) => (a.id === 'review-generation' ? -1 : 1))
    .map((a) => ({
      id: a.id,
      value: formatK(a.outcome.value),
      label: a.outcome.label,
      agentName: a.name,
      agentPct: AGENT_CONTRIBUTION_PCT[a.id],
    }))
  const topReviewStats: OutcomeKpi[] = [
    { id: requestsSent.id, value: requestsSent.value, label: requestsSent.label, agentName: '' },
    { id: reviewsReceived.id, value: reviewsReceived.value, label: reviewsReceived.label, agentName: '' },
    ...reviewsAgentOutcomes,
    { id: threeStarOrLess.id, value: threeStarOrLess.value, label: threeStarOrLess.label, agentName: '', danger: true },
    { id: haventReplied.id, value: haventReplied.value, label: haventReplied.label, agentName: '' },
  ]

  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Reviews</h3>

      {showJayPerformance && (
        <div className="mb-2xl">
          <OutcomeKpiGroup stats={topReviewStats} />
        </div>
      )}

      <div className="flex items-center gap-sm">
        <span className="text-display text-text-primary">{OVERVIEW_REVIEWS_RATING}</span>
        <div className="flex items-center gap-[2px] text-[#f5a623]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Icon key={i} name="star" size={18} fill />
          ))}
        </div>
      </div>

      <div className="mt-lg flex flex-wrap items-start gap-3xl">
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
                <span className="w-[64px] shrink-0 text-right text-small text-text-secondary">
                  {b.count.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex min-w-[280px] max-w-[380px] flex-col gap-md">
          {OVERVIEW_REVIEW_SOURCES.map((s) => {
            const logo = !brokenLogos.has(s.id) ? REVIEW_SOURCE_LOGOS[s.id] : undefined
            return (
              <div key={s.id} className="flex items-center gap-md rounded-sm border border-border px-lg py-md">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-body ${logo ? '' : s.iconColorClassName}`}>
                  {logo ? (
                    <img
                      src={logo}
                      alt=""
                      className="size-6"
                      onError={() => setBrokenLogos((prev) => new Set(prev).add(s.id))}
                    />
                  ) : (
                    <Icon name={s.icon} size={18} />
                  )}
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
            )
          })}
        </div>

        {!showJayPerformance && (
          <div className="grid shrink-0 grid-cols-2 gap-x-3xl gap-y-xl pl-xl pr-xl">
            {OVERVIEW_REVIEWS_STATS.map((s) => (
              <div key={s.id}>
                <p className={`m-0 whitespace-nowrap text-display ${s.danger ? 'text-chip-danger-text' : 'text-text-primary'}`}>{s.value}</p>
                <p className="m-0 mt-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function ListingsSection() {
  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Listings</h3>
      <h3 className="m-0 mb-lg text-body text-text-primary">Google report</h3>
      <StatGroup stats={OVERVIEW_LISTINGS_GOOGLE_REPORT} big />

      <h3 className="m-0 mb-lg mt-3xl text-body text-text-primary">Google Q&A · By location</h3>
      <StatGroup stats={OVERVIEW_LISTINGS_QA} big />
    </>
  )
}

function ReferralsSection() {
  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Referrals</h3>
      <StatGroup stats={OVERVIEW_REFERRALS_STATS} big />
    </>
  )
}

function AppointmentsSection() {
  const totalAppointments = OVERVIEW_APPOINTMENTS_STATS.find((s) => s.id === 'total-appointments')!
  const restStats = OVERVIEW_APPOINTMENTS_STATS.filter((s) => s.id !== 'total-appointments')
  const appointmentsKpis: OutcomeKpi[] = [
    { id: totalAppointments.id, value: totalAppointments.value, label: totalAppointments.label, agentName: 'Appointment agent', agentPct: '65%' },
    { id: 'confirmed-appointments', value: '2.4K', label: 'Confirmed appointments', agentName: 'Reminder agent', agentPct: '78%' },
    ...restStats.map((s) => ({ id: s.id, value: s.value, label: s.label, agentName: '', danger: s.danger })),
  ]

  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Appointments</h3>
      <OutcomeKpiGroup stats={appointmentsKpis} big />
    </>
  )
}

function InboxActivitySection() {
  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Inbox</h3>
      <StatGroup stats={OVERVIEW_INBOX_ACTIVITY_STATS} big />
      <div className="mt-2xl">
        <TrendLineChart data={OVERVIEW_MEDIAN_RESPONSE_TREND} height={260} />
      </div>
    </>
  )
}

interface SocialSectionProps {
  /** Adds Posts published / Comments handled (Social AI agents) alongside New followers. */
  showJayOutcomes?: boolean
}

// Social AI half of Jay (Marketing) — Reviews AI half (Reviews responded/New reviews) lives on
// the Reviews section instead. See PERSONA_GROUPS in agentDirectoryData.ts.
function SocialSection({ showJayOutcomes = false }: SocialSectionProps) {
  const socialAgents = showJayOutcomes
    ? getAgentDirectory('healthcare').filter((a) => a.id === 'social-publishing' || a.id === 'social-engagement')
    : []
  const socialAgentOutcomes: OutcomeKpi[] = socialAgents.map((a) => ({
    id: a.id,
    value: formatK(a.outcome.value),
    label: a.outcome.label,
    agentName: a.name,
    agentPct: AGENT_CONTRIBUTION_PCT[a.id],
  }))
  const followersStat: OutcomeKpi = { id: 'new-followers', value: OVERVIEW_SOCIAL_NEW_FOLLOWERS, label: 'New followers', agentName: '' }

  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Social</h3>
      {showJayOutcomes ? (
        <OutcomeKpiGroup stats={[followersStat, ...socialAgentOutcomes]} />
      ) : (
        <div>
          <p className="m-0 text-display text-text-primary">{OVERVIEW_SOCIAL_NEW_FOLLOWERS}</p>
          <p className="m-0 mt-xs text-small uppercase tracking-wide text-text-tertiary">New followers</p>
        </div>
      )}
      <div className="mt-2xl">
        <StackedBarChart data={OVERVIEW_SOCIAL_DATA} series={OVERVIEW_SOCIAL_SERIES} xKey="month" height={280} grouped />
      </div>
    </>
  )
}

// Primary section shown at the top of each co-worker tab — the full aggregate across every agent
// that persona owns (not the partial per-widget subsets the sections below use for their own
// top-row outcome badges).
function CoworkerPerformanceSection({
  persona,
  dateRange,
  zeroState = false,
}: {
  persona: AgentPersonaId
  dateRange: string
  zeroState?: boolean
}) {
  const agents = getAgentDirectory('healthcare').filter((a) => a.persona === persona)
  const runningCount = agents.filter((a) => a.running > 0).length
  const timeSavedHrs = agents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const costSavedK = agents.reduce((sum, a) => sum + parseFloat(a.costSaved.replace(/[$K]/g, '')), 0)
  const kpiStats: OverviewStat[] = zeroState
    ? [
        { id: 'agents-running', value: '0', label: 'Agents running' },
        { id: 'time-saved', value: '--', label: 'Time saved' },
        { id: 'cost-saved', value: '--', label: 'Cost saved' },
      ]
    : [
        { id: 'agents-running', value: String(runningCount), label: 'Agents running' },
        { id: 'time-saved', value: formatTimeSaved(timeSavedHrs, dateRange), label: 'Time saved' },
        { id: 'cost-saved', value: `$${costSavedK.toFixed(1)}K`, label: 'Cost saved' },
      ]
  return (
    <>
      <h3 className="m-0 mb-lg flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
        <img src={COWORKER_LOGO[persona]} alt="" className="size-6 shrink-0 rounded-full" />
        {COWORKER_NAME[persona]} performance
      </h3>
      <StatGroup stats={kpiStats} big />
      <AgentPerformanceCardList agents={agents} zeroState={zeroState} />
    </>
  )
}

// Merges a co-worker's performance section + its individual sections (Inbox, Reviews, Surveys...)
// into a single bordered card. Only one divider is drawn, between the performance section and the
// first content section below it.
function CoworkerSectionsCard({ sections }: { sections: ReactNode[] }) {
  return (
    <div className="rounded-md border border-border bg-surface p-xl pb-[36px]">
      {sections.map((section, i) => (
        <div key={i} className={i !== 0 && i !== 2 ? 'mt-2xl' : undefined}>
          {i === 2 && <div className="my-2xl border-t border-border" />}
          {section}
        </div>
      ))}
    </div>
  )
}

const LOCATION_SCORE_COLUMNS: Column<OverviewLocationScoreRow>[] = [
  { key: 'location', label: 'Locations', width: 260, sortable: true },
  {
    key: 'birdeyeScore',
    label: 'Birdeye Score',
    width: 160,
    sortable: true,
    render: (v) => <Chip label={String(v)} variant="success" />,
  },
  { key: 'sentimentScore', label: 'Sentiment Score', width: 160, sortable: true },
  { key: 'reputationScore', label: 'Reputation Score', width: 160, sortable: true },
  { key: 'listingScore', label: 'Listing Score', width: 160, sortable: true },
]

function InsightsAiSection() {
  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Insights AI</h3>
      <div className={KPI_ROW_CLASS}>
        <div className={KPI_TILE_CLASS}>
          <p className="m-0 whitespace-nowrap text-display text-text-primary">{OVERVIEW_BIRDEYE_SCORE.value}</p>
          <p className="m-0 mt-xs flex items-center gap-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">
            {OVERVIEW_BIRDEYE_SCORE.label}
            {OVERVIEW_BIRDEYE_SCORE.tooltip && <InfoTooltip text={OVERVIEW_BIRDEYE_SCORE.tooltip} variant="detail" />}
          </p>
        </div>
      </div>

      <div className="my-2xl border-t border-border" />

      <p className="m-0 mb-lg flex items-center gap-xs text-body text-text-primary">
        Understanding the Birdeye Score
        <InfoTooltip text="How each underlying signal contributes to the overall Birdeye Score." variant="detail" />
      </p>
      <div className="grid grid-cols-3 gap-3xl">
        {OVERVIEW_UNDERSTANDING_SCORES.map((score) => (
          <div key={score.id}>
            <p className="m-0 text-display text-text-primary">{score.value}</p>
            <p className="m-0 mt-xs text-small uppercase tracking-wide text-text-tertiary">{score.label}</p>
          </div>
        ))}
      </div>

      <div className="my-2xl border-t border-border" />

      <p className="m-0 mb-lg text-body text-text-primary">Top performing locations</p>
      <DataTable columns={LOCATION_SCORE_COLUMNS} data={OVERVIEW_TOP_LOCATIONS} />
    </>
  )
}

const DATE_RANGE_OPTIONS = ['Today', 'Last week', 'Last month', 'Last quarter']

// Keeps a dropdown panel mounted through its fade/scale-out before removing it, so closing eases
// out instead of snapping away.
function useOpenTransition(open: boolean, duration = 150) {
  const [mounted, setMounted] = useState(open)
  const [entered, setEntered] = useState(open)

  useEffect(() => {
    let raf1: number
    let raf2: number
    let timer: ReturnType<typeof setTimeout>
    if (open) {
      setMounted(true)
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

// Same trigger + preset-list + "Custom" calendar row as the date-range dropdown on the Overview
// (Co-workers directory) page, restyled with this repo's rounded-md chrome.
function DateRangeDropdown({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarAnchor, setCalendarAnchor] = useState<{ top: number; left: number } | null>(null)
  const { mounted, entered } = useOpenTransition(open)
  const customRowRef = useRef<HTMLButtonElement>(null)
  const isCustomActive = !DATE_RANGE_OPTIONS.includes(value)

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
        className="flex h-9 items-center gap-xs rounded-md border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
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
            {DATE_RANGE_OPTIONS.map((opt) => {
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

type DataState = 'Current' | 'Zero state' | 'Single co-worker' | 'Filled data'
const DATA_STATE_OPTIONS: DataState[] = ['Current', 'Zero state', 'Single co-worker', 'Filled data']

// Design-review toggle — lets whoever's looking at the page preview it in a different data
// state without needing separate mocked pages. Same trigger + floating panel as the date-range
// dropdown beside it.
function DataStateDropdown({ value, onChange }: { value: DataState; onChange: (value: DataState) => void }) {
  const [open, setOpen] = useState(false)
  const { mounted, entered } = useOpenTransition(open)

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

      {mounted && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div
            className={`absolute right-0 top-full z-[110] mt-xs min-w-[180px] origin-top-right rounded-sm border border-border bg-surface p-md shadow-dropdown ${DROPDOWN_TRANSITION} ${
              entered ? DROPDOWN_SHOWN : DROPDOWN_HIDDEN
            }`}
          >
            {DATA_STATE_OPTIONS.map((opt) => {
              const isSel = opt === value
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt)
                    setOpen(false)
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
          </div>
        </>
      )}
    </div>
  )
}

// "Classic overview" — the business-metrics dashboard (Inbox/Reviews/Listings/Referrals/
// Appointments/Social/Insights AI, plus per-co-worker performance) ported from
// Akhil-myna-repo's OverviewFinalScreen, restyled with this repo's own chrome (rounded-md
// dropdown/CTA buttons). Reached only via the Overview page's "Switch to classic overview"
// toggle — never routed to directly.
export function ClassicOverviewScreen({ userName = 'Rupa', onSwitchToAgentic }: ClassicOverviewScreenProps) {
  const [activeCoworkerTab, setActiveCoworkerTab] = useState<AgentPersonaId>('marketing')
  const [dateRange, setDateRange] = useState('Last month')
  const [dataState, setDataState] = useState<DataState>('Current')
  const zeroState = dataState === 'Zero state'

  return (
    <div className="flex h-full flex-col">
      <TopNav
        title="Overview"
        initials="S"
        afterAvatar={
          <button
            type="button"
            className="flex h-7 items-center gap-xs rounded-full bg-ai-brand px-md text-small text-white hover:opacity-90"
          >
            <Icon name="auto_awesome" size={16} />
            Ask BirdGPT
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto bg-surface-l2 px-2xl py-xl">
        <div className="flex flex-col gap-lg">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="m-0 text-display text-text-primary">Welcome, {userName}</h1>
              <p className="m-0 mt-xs text-body text-text-secondary">Here are the things which need your attention</p>
            </div>
            <div className="flex items-center gap-sm">
              {onSwitchToAgentic && (
                <button
                  type="button"
                  onClick={onSwitchToAgentic}
                  className="flex h-9 items-center gap-sm rounded-md border border-ai-brand bg-surface px-lg text-body text-ai-brand hover:bg-ai-summary"
                >
                  <Icon name="swap_horiz" size={18} className="text-ai-brand" />
                  Switch to agentic overview
                </button>
              )}
              <DataStateDropdown value={dataState} onChange={setDataState} />
              <DateRangeDropdown value={dateRange} onChange={setDateRange} />
            </div>
          </div>

          {dataState !== 'Current' && <AiCoworkerSummaryCard dateRange={dateRange} zeroState={zeroState} />}

          {dataState !== 'Current' && (
            <CoworkerSectionsCard
              sections={
                dataState === 'Single co-worker'
                  ? [<CoworkerPerformanceSection persona="operations" dateRange={dateRange} zeroState={false} />]
                  : [
                      <CoworkerTabBar activeTab={activeCoworkerTab} onChange={setActiveCoworkerTab} />,
                      <CoworkerPerformanceSection persona={activeCoworkerTab} dateRange={dateRange} zeroState={zeroState} />,
                    ]
              }
            />
          )}

          <CoworkerSectionsCard sections={[<InboxSection />]} />
          <CoworkerSectionsCard sections={[<ReviewsSection />]} />
          <CoworkerSectionsCard sections={[<ListingsSection />]} />
          <CoworkerSectionsCard sections={[<ReferralsSection />]} />
          <CoworkerSectionsCard sections={[<AppointmentsSection />]} />
          <CoworkerSectionsCard sections={[<InboxActivitySection />]} />
          <CoworkerSectionsCard sections={[<SocialSection />]} />
          <CoworkerSectionsCard sections={[<InsightsAiSection />]} />
        </div>
      </div>
    </div>
  )
}
