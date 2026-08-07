import { useState } from 'react'
import { Chip, ChartCard, DataTable, Icon, InfoTooltip, StackedBarChart, Tooltip, TopNav, TrendLineChart, type Column } from '../components'
import { AiAgentIcon } from '../assets/AiAgentIcon'
import iconGoogle from '../assets/icon-google.svg'
import iconGooglePlay from '../assets/icon-google-play.svg'
import mynaLogo from '../assets/myna-logo.png'
import jayLogo from '../assets/jay-logo.png'
import { getAgentDirectory } from '../data/agentDirectoryData'
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
  type OverviewScore,
  type OverviewStat,
} from '../data/overviewData'

interface OverviewScreenProps {
  userName?: string
  locationLabel?: string
  /** Hides the screen's own TopNav — set when embedding this screen's body inside a host that
   *  already renders its own TopNav (e.g. the "Business metrics" tab on the AI overview page). */
  hideTopNav?: boolean
  /** Hides the "Welcome, {userName}" greeting header + download button row. */
  hideWelcomeHeader?: boolean
  /** Uses a plain white content background instead of the default `surface-l2` grey. */
  whiteBackground?: boolean
  /** Shows the "Myna performance" section (below Inbox) and "Jay performance" section (below
   *  Reviews) — each co-worker's KPIs + outcomes, sourced from agentDirectoryData.ts. */
  showCoworkerPerformance?: boolean
}

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

interface AgentOutcomeRow {
  id: string
  outcomeLabel: string
  agentName: string
  count: string
  timeSaved: string
  costSaved: string
  [key: string]: string
}

// Mirrors the Outcomes table on the AI overview page (AgentDirectoryScreen's
// coworkerTabsWithSubtext OUTCOME_COLUMNS) — outcome label with the agent name as subtext,
// then count/time saved/cost saved.
const AGENT_OUTCOME_COLUMNS: Column<AgentOutcomeRow>[] = [
  {
    key: 'outcomeLabel',
    label: 'Outcomes',
    width: 280,
    render: (_, row) => (
      <div className="min-w-0">
        <p className="m-0 truncate text-body text-text-primary">{row.outcomeLabel}</p>
        <p className="m-0 truncate text-small text-text-tertiary">{row.agentName}</p>
      </div>
    ),
  },
  { key: 'count', label: 'Count', width: 160 },
  { key: 'timeSaved', label: 'Time saved', width: 160 },
  { key: 'costSaved', label: 'Cost saved', width: 160 },
]

// Hidden-by-default detail table shown just below every "<Co-worker> performance" section.
function PerformanceByAgentAccordion({ rows }: { rows: AgentOutcomeRow[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-xs text-body text-text-secondary transition-colors hover:text-text-action"
      >
        <Icon name={open ? 'expand_less' : 'expand_more'} size={18} />
        Performance by agent outcomes
      </button>
      {open && (
        <div className="mt-lg">
          <DataTable columns={AGENT_OUTCOME_COLUMNS} data={rows} />
        </div>
      )}
    </div>
  )
}

// Rolls up all 3 AI co-workers (Myna/operations, Jay/marketing, Robin/customer experience) into
// one headline row, shown above Inbox on the Overview (mixed) page only. Robin has no agents
// wired into agentDirectoryData yet (no 'cx' persona entries), so its contribution is a nominal
// placeholder — kept in sync with the "AI co-workers" project memory note.
function AiCoworkerSummaryCard() {
  const mynaAgents = getAgentDirectory('healthcare').filter((a) => a.persona === 'operations')
  const jayAgents = getAgentDirectory('healthcare').filter((a) => a.persona === 'marketing')
  const mynaRunning = mynaAgents.filter((a) => a.running > 0).length
  const jayRunning = jayAgents.filter((a) => a.running > 0).length
  const mynaHours = mynaAgents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const jayHours = jayAgents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const robinRunning = 2
  const robinHours = 12.5

  const totalAgents = mynaRunning + jayRunning + robinRunning
  const totalHours = mynaHours + jayHours + robinHours

  const stats: OverviewStat[] = [
    { id: 'co-workers', value: '3', label: 'Co-workers' },
    { id: 'agents', value: String(totalAgents), label: 'Agents' },
    { id: 'time-saved', value: `${(totalHours / 24).toFixed(1)} days`, label: 'Time saved' },
    { id: 'hours-saved', value: `${totalHours}h`, label: 'Hours saved' },
    { id: 'agentification-rate', value: '91%', label: 'Agentification rate' },
  ]

  return (
    <div className="rounded-md border border-border bg-surface p-2xl">
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">AI workforce summary</h3>
      <StatGroup stats={stats} big />
    </div>
  )
}

interface InboxAlertCardProps {
  /** Adds the "Myna performance" KPIs + outcomes list below Inbox, in the same box. */
  showMynaPerformance?: boolean
}

// Myna = the Operations co-worker (Inbox + Front desk family agents) — see PERSONA_GROUPS
// in agentDirectoryData.ts, same grouping shown on the AI overview page's "Myna" tab.
function InboxAlertCard({ showMynaPerformance = false }: InboxAlertCardProps) {
  // Reminder's outcome (Appointments confirmed) is promoted on the Appointments widget instead —
  // excluded here so "Agents running" and the outcomes accordion below match exactly the agents
  // actually badged in this card's top KPI row (not the full operations persona).
  const mynaAgents = showMynaPerformance
    ? getAgentDirectory('healthcare').filter((a) => a.persona === 'operations' && a.id !== 'reminder')
    : []
  const runningCount = mynaAgents.filter((a) => a.running > 0).length
  const totalTimeSavedHrs = mynaAgents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const totalCostSavedK = mynaAgents.reduce((sum, a) => sum + parseFloat(a.costSaved.replace(/[$K]/g, '')), 0)

  const outcomeStats: OutcomeKpi[] = mynaAgents.map((a) => ({
    id: a.id,
    value: formatK(a.outcome.value),
    label: a.outcome.label,
    agentName: a.name,
    agentPct: AGENT_CONTRIBUTION_PCT[a.id],
  }))
  const mynaKpiStats: OverviewStat[] = [
    { id: 'agents-running', value: String(runningCount), label: 'Agents running' },
    { id: 'time-saved', value: `${totalTimeSavedHrs}h`, label: 'Time saved' },
    { id: 'cost-saved', value: `$${totalCostSavedK.toFixed(1)}K`, label: 'Cost saved' },
  ]
  const mynaOutcomeRows: AgentOutcomeRow[] = mynaAgents.map((a) => ({
    id: a.id,
    outcomeLabel: a.outcome.label,
    agentName: a.name,
    count: formatK(a.outcome.value),
    timeSaved: a.timeSaved,
    costSaved: a.costSaved,
  }))
  // Unread messages / Open leads fold into the same top row as the outcome KPIs when the Myna
  // section is shown — same treatment as Reviews' top row.
  const inboxTopStats: OutcomeKpi[] = [
    ...outcomeStats,
    ...OVERVIEW_INBOX_ALERT_STATS.map((s) => ({ id: s.id, value: s.value, label: s.label, agentName: '', danger: s.danger })),
  ]
  return (
    <div className="rounded-md border border-border bg-surface p-2xl">
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Inbox</h3>

      {showMynaPerformance ? (
        <div className="mb-2xl">
          <OutcomeKpiGroup stats={inboxTopStats} />
        </div>
      ) : (
        <StatGroup stats={OVERVIEW_INBOX_ALERT_STATS} />
      )}

      {showMynaPerformance && (
        <>
          <div className="my-2xl border-t border-border" />
          <h3 className="m-0 mb-lg flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
            <img src={mynaLogo} alt="" className="size-6 shrink-0 rounded-full" />
            Myna performance
          </h3>
          <StatGroup stats={mynaKpiStats} big />
          <PerformanceByAgentAccordion rows={mynaOutcomeRows} />
        </>
      )}
    </div>
  )
}

const REVIEW_SOURCE_LOGOS: Record<string, string> = {
  google: iconGoogle,
  'google-play': iconGooglePlay,
}

interface ReviewsCardProps {
  /** Adds the "Jay performance" KPIs + outcomes list below Reviews, in the same box. */
  showJayPerformance?: boolean
}

// Jay = the Marketing co-worker (Reviews AI + Social AI agents) — see PERSONA_GROUPS in
// agentDirectoryData.ts, same grouping shown on the AI overview page's "Jay" tab.
function ReviewsCard({ showJayPerformance = false }: ReviewsCardProps) {
  const [brokenLogos, setBrokenLogos] = useState<Set<string>>(new Set())
  const maxCount = Math.max(...OVERVIEW_REVIEWS_BREAKDOWN.map((b) => b.count))
  // Only the Reviews AI agents actually badged in this card's top KPI row (Social publishing/
  // engagement belong to the Social card's own "Jay performance" instead) — keeps "Agents
  // running" and the outcomes accordion below in sync with what's shown up top.
  const jayAgents = showJayPerformance
    ? getAgentDirectory('healthcare').filter((a) => a.id === 'review-generation' || a.id === 'review-response')
    : []
  const jayRunningCount = jayAgents.filter((a) => a.running > 0).length
  const jayTimeSavedHrs = jayAgents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const jayCostSavedK = jayAgents.reduce((sum, a) => sum + parseFloat(a.costSaved.replace(/[$K]/g, '')), 0)
  const jayKpiStats: OverviewStat[] = [
    { id: 'agents-running', value: String(jayRunningCount), label: 'Agents running' },
    { id: 'time-saved', value: `${jayTimeSavedHrs}h`, label: 'Time saved' },
    { id: 'cost-saved', value: `$${jayCostSavedK.toFixed(1)}K`, label: 'Cost saved' },
  ]
  const jayOutcomeRows: AgentOutcomeRow[] = jayAgents.map((a) => ({
    id: a.id,
    outcomeLabel: a.outcome.label,
    agentName: a.name,
    count: formatK(a.outcome.value),
    timeSaved: a.timeSaved,
    costSaved: a.costSaved,
  }))

  // Reviews responded / New reviews (Reviews AI category only — Posts published/Comments
  // handled belong to the Social card) promoted upfront, alongside Requests sent/Reviews
  // received — same treatment as Myna's outcomes on the Inbox card. Left to right: Requests
  // sent, Reviews received, New reviews, Reviews responded.
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
    <ChartCard title="Reviews">
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

        <div className="flex min-w-[320px] flex-1 flex-wrap gap-md">
          {OVERVIEW_REVIEW_SOURCES.map((s) => {
            const logo = !brokenLogos.has(s.id) ? REVIEW_SOURCE_LOGOS[s.id] : undefined
            return (
              <div key={s.id} className="flex min-w-[220px] flex-1 items-center gap-md rounded-sm border border-border px-lg py-md">
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
          <div className="w-[220px] shrink-0">
            <StatGroup stats={OVERVIEW_REVIEWS_STATS} />
          </div>
        )}
      </div>

      {showJayPerformance && (
        <>
          <div className="my-2xl border-t border-border" />
          <h3 className="m-0 mb-lg flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
            <img src={jayLogo} alt="" className="size-6 shrink-0 rounded-full" />
            Jay performance
          </h3>
          <StatGroup stats={jayKpiStats} big />
          <PerformanceByAgentAccordion rows={jayOutcomeRows} />
        </>
      )}
    </ChartCard>
  )
}

function PaymentsCard() {
  return (
    <div className="rounded-md border border-border bg-surface p-2xl">
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Payments</h3>
      <p className="m-0 text-body text-text-secondary">
        Get paid faster. <a href="#" className="text-text-action hover:underline">Set up Payments</a> to get started.
      </p>
    </div>
  )
}

function ListingsCard({ big = false }: { big?: boolean }) {
  return (
    <ChartCard title="Listings">
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Google report</h3>
      <StatGroup stats={OVERVIEW_LISTINGS_GOOGLE_REPORT} big={big} />

      <h3 className="m-0 mb-lg mt-3xl text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Google Q&A · By location</h3>
      <StatGroup stats={OVERVIEW_LISTINGS_QA} big={big} />

      {big && (
        <>
          <div className="my-2xl border-t border-border" />
          <h3 className="m-0 mb-lg flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
            <img src={jayLogo} alt="" className="size-6 shrink-0 rounded-full" />
            Jay performance
          </h3>
          <StatGroup
            stats={[
              { id: 'agents-running', value: '1', label: 'Agents running' },
              { id: 'time-saved', value: '8h', label: 'Time saved' },
              { id: 'cost-saved', value: '$0.6K', label: 'Cost saved' },
            ]}
            big
          />
          <PerformanceByAgentAccordion
            rows={[
              { id: 'listings-agent', outcomeLabel: 'Profile updates automated', agentName: 'Listings agent', count: '24', timeSaved: '8h', costSaved: '$0.6K' },
            ]}
          />
        </>
      )}
    </ChartCard>
  )
}

function ReferralsCard({ big = false }: { big?: boolean }) {
  return (
    <ChartCard title="Referrals" minHeight="0">
      <StatGroup stats={OVERVIEW_REFERRALS_STATS} big={big} />
    </ChartCard>
  )
}

function AppointmentsCard({ big = false }: { big?: boolean }) {
  if (!big) {
    return (
      <ChartCard title="Appointments" minHeight="0">
        <StatGroup stats={OVERVIEW_APPOINTMENTS_STATS} big={big} />
      </ChartCard>
    )
  }

  const totalAppointments = OVERVIEW_APPOINTMENTS_STATS.find((s) => s.id === 'total-appointments')!
  const restStats = OVERVIEW_APPOINTMENTS_STATS.filter((s) => s.id !== 'total-appointments')
  const appointmentsKpis: OutcomeKpi[] = [
    { id: totalAppointments.id, value: totalAppointments.value, label: totalAppointments.label, agentName: 'Appointment agent', agentPct: '65%' },
    { id: 'confirmed-appointments', value: '2.4K', label: 'Confirmed appointments', agentName: 'Reminder agent', agentPct: '78%' },
    ...restStats.map((s) => ({ id: s.id, value: s.value, label: s.label, agentName: '', danger: s.danger })),
  ]
  const appointmentsMynaStats: OverviewStat[] = [
    { id: 'agents-running', value: '2', label: 'Agents running' },
    { id: 'time-saved', value: '15h', label: 'Time saved' },
    { id: 'cost-saved', value: '$1.1K', label: 'Cost saved' },
  ]
  const appointmentsOutcomeRows: AgentOutcomeRow[] = [
    { id: 'total-appointments', outcomeLabel: totalAppointments.label, agentName: 'Appointment agent', count: totalAppointments.value, timeSaved: '9h', costSaved: '$0.7K' },
    { id: 'confirmed-appointments', outcomeLabel: 'Confirmed appointments', agentName: 'Reminder agent', count: '2.4K', timeSaved: '6h', costSaved: '$0.4K' },
  ]

  return (
    <ChartCard title="Appointments" minHeight="0">
      <OutcomeKpiGroup stats={appointmentsKpis} big />
      <div className="my-2xl border-t border-border" />
      <h3 className="m-0 mb-lg flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
        <img src={mynaLogo} alt="" className="size-6 shrink-0 rounded-full" />
        Myna performance
      </h3>
      <StatGroup stats={appointmentsMynaStats} big />
      <PerformanceByAgentAccordion rows={appointmentsOutcomeRows} />
    </ChartCard>
  )
}

function InboxActivityCard({ big = false }: { big?: boolean }) {
  return (
    <ChartCard title="Inbox">
      <StatGroup stats={OVERVIEW_INBOX_ACTIVITY_STATS} big={big} />
      <div className="mt-2xl">
        <TrendLineChart data={OVERVIEW_MEDIAN_RESPONSE_TREND} height={260} />
        <p className="m-0 text-center text-small text-text-tertiary">Median response time</p>
      </div>
    </ChartCard>
  )
}

interface SocialCardProps {
  big?: boolean
  /** Adds Posts published / Comments handled (Social AI agents) alongside New followers. */
  showJayOutcomes?: boolean
}

// Social AI half of Jay (Marketing) — Reviews AI half (Reviews responded/New reviews) lives on
// the Reviews card instead. See PERSONA_GROUPS in agentDirectoryData.ts.
function SocialCard({ big = false, showJayOutcomes = false }: SocialCardProps) {
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
  const socialTimeSavedHrs = socialAgents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const socialCostSavedK = socialAgents.reduce((sum, a) => sum + parseFloat(a.costSaved.replace(/[$K]/g, '')), 0)
  const socialOutcomeRows: AgentOutcomeRow[] = socialAgents.map((a) => ({
    id: a.id,
    outcomeLabel: a.outcome.label,
    agentName: a.name,
    count: formatK(a.outcome.value),
    timeSaved: a.timeSaved,
    costSaved: a.costSaved,
  }))
  const followersStat: OutcomeKpi = { id: 'new-followers', value: OVERVIEW_SOCIAL_NEW_FOLLOWERS, label: 'New followers', agentName: '' }

  return (
    <ChartCard title="Social">
      {showJayOutcomes ? (
        <OutcomeKpiGroup stats={[followersStat, ...socialAgentOutcomes]} />
      ) : (
        <div>
          <p className={`m-0 ${big ? 'text-display' : 'text-h3'} text-text-primary`}>{OVERVIEW_SOCIAL_NEW_FOLLOWERS}</p>
          <p className="m-0 mt-xs text-small uppercase tracking-wide text-text-tertiary">New followers</p>
        </div>
      )}
      <div className="mt-2xl">
        <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">New followers over time</h3>
        <StackedBarChart data={OVERVIEW_SOCIAL_DATA} series={OVERVIEW_SOCIAL_SERIES} xKey="month" height={280} grouped />
      </div>

      {showJayOutcomes && (
        <>
          <div className="my-2xl border-t border-border" />
          <h3 className="m-0 mb-lg flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
            <img src={jayLogo} alt="" className="size-6 shrink-0 rounded-full" />
            Jay performance
          </h3>
          <StatGroup
            stats={[
              { id: 'agents-running', value: '2', label: 'Agents running' },
              { id: 'time-saved', value: `${socialTimeSavedHrs}h`, label: 'Time saved' },
              { id: 'cost-saved', value: `$${socialCostSavedK.toFixed(1)}K`, label: 'Cost saved' },
            ]}
            big
          />
          <PerformanceByAgentAccordion rows={socialOutcomeRows} />
        </>
      )}
    </ChartCard>
  )
}

/** Spectrum meter used by the Insights AI score cards — a gradient bar with a "You" marker at the
 *  current value's position and a tick + label at the industry-average position. */
function ScoreBar({ value, industryAverage, max }: { value: number; industryAverage: number; max: number }) {
  const pct = (v: number) => `${Math.min(100, Math.max(0, (v / max) * 100))}%`
  return (
    <div className="mt-lg">
      <div className="relative h-2 rounded-full" style={{ background: 'linear-gradient(90deg, #ef4444, #f97316, #eab308, #86efac, #16a34a)' }}>
        <span
          className="absolute bottom-[10px] -translate-x-1/2 whitespace-nowrap rounded-sm bg-[#1f1f1f] px-xs py-[1px] text-[11px] leading-4 text-white"
          style={{ left: pct(value) }}
        >
          You
        </span>
        <span
          className="absolute inset-y-0 -translate-x-1/2 w-[2px] bg-[#1f1f1f]"
          style={{ left: pct(industryAverage) }}
        />
      </div>
      <p className="m-0 mt-sm text-small text-text-tertiary">Industry average: {industryAverage}</p>
    </div>
  )
}

function ScoreCard({ score, size = 'lg' }: { score: OverviewScore; size?: 'lg' | 'sm' }) {
  return (
    <div>
      <div className="flex items-center gap-xs">
        <span className={size === 'lg' ? 'text-h2 text-accent-positive' : 'text-h3 text-text-primary'}>{score.value}</span>
      </div>
      <p className="m-0 mt-xs flex items-center gap-xs text-small text-text-tertiary">
        {score.label}
        {score.tooltip && <InfoTooltip text={score.tooltip} variant="detail" />}
      </p>
      <ScoreBar value={score.value} industryAverage={score.industryAverage} max={score.max} />
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

function InsightsAiCard() {
  return (
    <ChartCard title="Insights AI">
      <ScoreCard score={OVERVIEW_BIRDEYE_SCORE} />

      <div className="my-2xl border-t border-border" />

      <p className="m-0 mb-lg flex items-center gap-xs text-body text-text-primary">
        Understanding the Birdeye Score
        <InfoTooltip text="How each underlying signal contributes to the overall Birdeye Score." variant="detail" />
      </p>
      <div className="grid grid-cols-3 gap-3xl">
        {OVERVIEW_UNDERSTANDING_SCORES.map((score) => (
          <ScoreCard key={score.id} score={score} size="sm" />
        ))}
      </div>

      <div className="my-2xl border-t border-border" />

      <p className="m-0 mb-lg text-body text-text-primary">Top performing locations</p>
      <DataTable columns={LOCATION_SCORE_COLUMNS} data={OVERVIEW_TOP_LOCATIONS} />
    </ChartCard>
  )
}

export function OverviewScreen({
  userName = 'Akhil',
  locationLabel = 'All locations',
  hideTopNav = false,
  hideWelcomeHeader = false,
  whiteBackground = false,
  showCoworkerPerformance = false,
}: OverviewScreenProps) {
  return (
    <div className="flex h-full flex-col">
      {!hideTopNav && (
        <TopNav
          title="Overview"
          initials="S"
          beforeAvatar={
            <button
              type="button"
              aria-label="Settings"
              className="flex size-7 items-center justify-center rounded-sm transition-colors hover:bg-surface-hover"
            >
              <Icon name="settings" size={20} className="text-text-icon" />
            </button>
          }
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
      )}
      <div className={`flex-1 overflow-y-auto px-2xl py-xl ${whiteBackground ? 'bg-surface' : 'bg-surface-l2'}`}>
        <div className="flex flex-col gap-lg">
          {!hideWelcomeHeader && (
            <div className="flex items-start justify-between">
              <div>
                <h1 className="m-0 text-h2 text-text-primary">Welcome, {userName}</h1>
                <p className="m-0 mt-xs text-body text-text-secondary">Here are the things which need your attention</p>
              </div>
              <button
                type="button"
                aria-label="Download"
                className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
              >
                <Icon name="download" size={20} />
              </button>
            </div>
          )}

          {showCoworkerPerformance && <AiCoworkerSummaryCard />}

          <InboxAlertCard showMynaPerformance={showCoworkerPerformance} />

          <div className="flex items-center gap-md">
            <p className="m-0 shrink-0 text-small text-text-tertiary">
              Here is the recent performance of your business for <span className="text-text-primary">{locationLabel}</span>
            </p>
            <div className="h-px flex-1 bg-border" />
          </div>

          <ReviewsCard showJayPerformance={showCoworkerPerformance} />
          <PaymentsCard />
          <ListingsCard big={showCoworkerPerformance} />
          <ReferralsCard big={showCoworkerPerformance} />
          <AppointmentsCard big={showCoworkerPerformance} />
          <InboxActivityCard big={showCoworkerPerformance} />
          <SocialCard big={showCoworkerPerformance} showJayOutcomes={showCoworkerPerformance} />
          <InsightsAiCard />
        </div>
      </div>
    </div>
  )
}
