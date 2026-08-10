// Forked from OverviewScreen.tsx — this is the "Overview" nav item with the "Post feedback"
// chip (App.tsx `overview-3`). Kept as an independent copy so iteration here never touches the
// original "Overview / New" page (`overview-2`, still OverviewScreen.tsx) or the "Business
// metrics" tab on AIOverviewScreen (which also renders the original OverviewScreen).
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { DataTable, DatePickerModal, Icon, InfoTooltip, Tooltip, TopNav, type Column } from '../components'
import { AiAgentIcon } from '../assets/AiAgentIcon'
import iconGoogle from '../assets/icon-google.svg'
import iconGooglePlay from '../assets/icon-google-play.svg'
import mynaLogo from '../assets/myna-logo.png'
import jayLogo from '../assets/jay-logo.png'
import robinLogo from '../assets/robin-logo.png'
import { getAgentDirectory, PERSONA_GROUPS, type AgentPersonaId } from '../data/agentDirectoryData'
import {
  OVERVIEW_APPOINTMENTS_STATS,
  OVERVIEW_BIRDEYE_SCORE,
  OVERVIEW_INBOX_ACTIVITY_STATS,
  OVERVIEW_INBOX_ALERT_STATS,
  OVERVIEW_LISTINGS_GOOGLE_REPORT,
  OVERVIEW_LISTINGS_QA,
  OVERVIEW_REFERRALS_STATS,
  OVERVIEW_REVIEWS_BREAKDOWN,
  OVERVIEW_REVIEWS_RATING,
  OVERVIEW_REVIEWS_STATS,
  OVERVIEW_REVIEW_SOURCES,
  OVERVIEW_SOCIAL_NEW_FOLLOWERS,
  type OverviewStat,
} from '../data/overviewData'

interface OverviewFeedbackScreenProps {
  userName?: string
  locationLabel?: string
  /** Hides the screen's own TopNav — set when embedding this screen's body inside a host that
   *  already renders its own TopNav (e.g. the "Business metrics" tab on the AI overview page). */
  hideTopNav?: boolean
  /** Hides the "Welcome, {userName}" greeting header + download button row. */
  hideWelcomeHeader?: boolean
  /** Uses a plain white content background instead of the default `surface-l2` grey. */
  whiteBackground?: boolean
  /** Shows the co-worker tabs (Myna/Jay/Robin) with each one's aggregate performance + sections. */
  showCoworkerPerformance?: boolean
}

// Co-worker brand names + logos + accent colors for the three persona groups — same name
// mapping as AgentDirectoryScreen's COWORKER_NAME. Accent colors are sampled from each
// co-worker's own logo (myna-logo.png/jay-logo.png/robin-logo.png) so the active tab underline
// and label always match that co-worker's brand color instead of a generic primary blue.
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
const COWORKER_TAB_ORDER: AgentPersonaId[] = ['operations', 'marketing', 'cx']

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
  'survey-creation': '91%',
  'survey-distribution': '96%',
  'survey-response': '84%',
  'ticketing-surveys': '92%',
  'ticketing-reviews': '89%',
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
// `compact` swaps the usual 250px-min tile for a narrower one whose label can wrap onto a second
// line — used when the group has to lay its stats out horizontally inside a column that's sharing
// a line with sibling sections (Surveys/Ticketing next to Insights AI), rather than the ~250px
// tiles that assume a full-width row.
function OutcomeKpiGroup({ stats, big = true, compact = false }: { stats: OutcomeKpi[]; big?: boolean; compact?: boolean }) {
  return (
    <div className={compact ? 'flex flex-wrap gap-md' : KPI_ROW_CLASS}>
      {stats.map((s) => {
        const pctNum = s.agentPct ? parseFloat(s.agentPct) : null
        const contribution = pctNum != null ? formatNumber((parseOutcomeNumber(s.value) * pctNum) / 100) : null
        return (
          <div key={s.id} className={compact ? 'min-w-[92px]' : KPI_TILE_CLASS}>
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
            <p className={`m-0 mt-xs text-small uppercase tracking-wide text-text-tertiary ${compact ? '' : 'whitespace-nowrap'}`}>{s.label}</p>
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
  const [open, setOpen] = useState(true)
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
// one headline row, shown above the co-worker tabs on the Overview (mixed) page only.
function AiCoworkerSummaryCard() {
  const mynaAgents = getAgentDirectory('healthcare').filter((a) => a.persona === 'operations')
  const jayAgents = getAgentDirectory('healthcare').filter((a) => a.persona === 'marketing')
  const robinAgents = getAgentDirectory('healthcare').filter((a) => a.persona === 'cx')
  const mynaRunning = mynaAgents.filter((a) => a.running > 0).length
  const jayRunning = jayAgents.filter((a) => a.running > 0).length
  const robinRunning = robinAgents.filter((a) => a.running > 0).length
  const mynaHours = mynaAgents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const jayHours = jayAgents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const robinHours = robinAgents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)

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

// Custom tab bar (not the shared `Tabs` component) so each tab's active state can use that
// co-worker's own brand color (COWORKER_ACCENT) instead of the shared component's fixed primary
// blue, and so the logo sits beside the label+subtext column instead of inside its first row —
// the shared `Tabs`' title-subtext variant puts icon+label on one row and subtext on the row
// below within the same flex-col, which left-indents subtext under the icon instead of the label.
function CoworkerTabBar({
  activeTab,
  onChange,
}: {
  activeTab: AgentPersonaId
  onChange: (id: AgentPersonaId) => void
}) {
  return (
    <div className="flex items-center gap-xs">
      {COWORKER_TAB_ORDER.map((id, i) => {
        const active = id === activeTab
        const group = PERSONA_GROUPS.find((g) => g.id === id)!
        const agentCount = getAgentDirectory('healthcare').filter((a) => a.persona === id).length
        return (
          <Fragment key={id}>
            {i > 0 && <span className="self-stretch w-px shrink-0 bg-border" />}
            <button type="button" onClick={() => onChange(id)} className="flex flex-col items-stretch text-left">
              <span
                className={`flex items-center gap-sm rounded-sm px-lg py-md text-left transition-colors ${active ? '' : 'hover:bg-surface-hover'}`}
                style={active ? { backgroundColor: `${COWORKER_ACCENT[id]}1A` } : undefined}
              >
                {/* Sized to match the label + subtext text block's combined height (20px + 2px gap + 18px = 40px). */}
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
              <span className="h-[2px] w-full" style={{ backgroundColor: active ? COWORKER_ACCENT[id] : 'transparent' }} />
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
// in agentDirectoryData.ts, same grouping shown on the AI overview page's "Myna" tab.
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
  // Unread messages / Open leads fold into the same top row as the outcome KPIs when the Myna
  // section is shown — same treatment as Reviews' top row.
  const inboxTopStats: OutcomeKpi[] = [
    ...outcomeStats,
    ...OVERVIEW_INBOX_ALERT_STATS.map((s) => ({ id: s.id, value: s.value, label: s.label, agentName: '', danger: s.danger })),
  ]
  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Inbox</h3>
      {showMynaPerformance ? (
        <OutcomeKpiGroup stats={inboxTopStats} />
      ) : (
        <StatGroup stats={OVERVIEW_INBOX_ALERT_STATS} />
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
// agentDirectoryData.ts, same grouping shown on the AI overview page's "Jay" tab.
function ReviewsSection({ showJayPerformance = false }: ReviewsSectionProps) {
  const [brokenLogos, setBrokenLogos] = useState<Set<string>>(new Set())
  const maxCount = Math.max(...OVERVIEW_REVIEWS_BREAKDOWN.map((b) => b.count))
  // Only the Reviews AI agents actually badged in this section's top KPI row (Social publishing/
  // engagement belong to the Social section instead) — keeps the outcomes in sync with what's
  // shown up top.
  const jayAgents = showJayPerformance
    ? getAgentDirectory('healthcare').filter((a) => a.id === 'review-generation' || a.id === 'review-response')
    : []
  // Reviews responded / New reviews (Reviews AI category only — Posts published/Comments
  // handled belong to the Social section) promoted upfront, alongside Requests sent/Reviews
  // received — same treatment as Myna's outcomes on the Inbox section. Left to right: Requests
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
    </>
  )
}

function ListingsSection({ big = false }: { big?: boolean }) {
  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Listings</h3>
      <h3 className="m-0 mb-lg text-body text-text-primary">Google report</h3>
      <StatGroup stats={OVERVIEW_LISTINGS_GOOGLE_REPORT} big={big} />

      <h3 className="m-0 mb-lg mt-3xl text-body text-text-primary">Google Q&A · By location</h3>
      <StatGroup stats={OVERVIEW_LISTINGS_QA} big={big} />
    </>
  )
}

function ReferralsSection({ big = false }: { big?: boolean }) {
  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Referrals</h3>
      <StatGroup stats={OVERVIEW_REFERRALS_STATS} big={big} />
    </>
  )
}

function AppointmentsSection({ big = false }: { big?: boolean }) {
  if (!big) {
    return (
      <>
        <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Appointments</h3>
        <StatGroup stats={OVERVIEW_APPOINTMENTS_STATS} big={big} />
      </>
    )
  }

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

function InboxActivitySection({ big = false }: { big?: boolean }) {
  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Inbox</h3>
      <StatGroup stats={OVERVIEW_INBOX_ACTIVITY_STATS} big={big} />
    </>
  )
}

interface SocialSectionProps {
  big?: boolean
  /** Adds Posts published / Comments handled (Social AI agents) alongside New followers. */
  showJayOutcomes?: boolean
}

// Social AI half of Jay (Marketing) — Reviews AI half (Reviews responded/New reviews) lives on
// the Reviews section instead. See PERSONA_GROUPS in agentDirectoryData.ts.
function SocialSection({ big = false, showJayOutcomes = false }: SocialSectionProps) {
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
          <p className={`m-0 ${big ? 'text-display' : 'text-h3'} text-text-primary`}>{OVERVIEW_SOCIAL_NEW_FOLLOWERS}</p>
          <p className="m-0 mt-xs text-small uppercase tracking-wide text-text-tertiary">New followers</p>
        </div>
      )}
    </>
  )
}

function SurveysSection() {
  const surveyAgents = getAgentDirectory('healthcare').filter((a) => a.category === 'Surveys AI')
  const outcomeStats: OutcomeKpi[] = surveyAgents.map((a) => ({
    id: a.id,
    value: formatK(a.outcome.value),
    label: a.outcome.label,
    agentName: a.name,
    agentPct: AGENT_CONTRIBUTION_PCT[a.id],
  }))

  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Surveys</h3>
      <OutcomeKpiGroup stats={outcomeStats} big compact />
    </>
  )
}

function TicketingSection() {
  const ticketingAgents = getAgentDirectory('healthcare').filter((a) => a.category === 'Ticketing')
  const outcomeStats: OutcomeKpi[] = ticketingAgents.map((a) => ({
    id: a.id,
    value: formatK(a.outcome.value),
    label: a.outcome.label,
    agentName: a.name,
    agentPct: AGENT_CONTRIBUTION_PCT[a.id],
  }))

  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Ticketing</h3>
      <OutcomeKpiGroup stats={outcomeStats} big compact />
    </>
  )
}

// Primary section shown at the top of each co-worker tab — the full aggregate across every agent
// that persona owns (not the partial per-widget subsets the sections below use for their own
// top-row outcome badges).
function CoworkerPerformanceSection({ persona }: { persona: AgentPersonaId }) {
  const agents = getAgentDirectory('healthcare').filter((a) => a.persona === persona)
  const runningCount = agents.filter((a) => a.running > 0).length
  const timeSavedHrs = agents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const costSavedK = agents.reduce((sum, a) => sum + parseFloat(a.costSaved.replace(/[$K]/g, '')), 0)
  const kpiStats: OverviewStat[] = [
    { id: 'agents-running', value: String(runningCount), label: 'Agents running' },
    { id: 'time-saved', value: `${timeSavedHrs}h`, label: 'Time saved' },
    { id: 'cost-saved', value: `$${costSavedK.toFixed(1)}K`, label: 'Cost saved' },
  ]
  const outcomeRows: AgentOutcomeRow[] = agents.map((a) => ({
    id: a.id,
    outcomeLabel: a.outcome.label,
    agentName: a.name,
    count: formatK(a.outcome.value),
    timeSaved: a.timeSaved,
    costSaved: a.costSaved,
  }))
  return (
    <>
      <h3 className="m-0 mb-lg flex items-center gap-sm text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
        <img src={COWORKER_LOGO[persona]} alt="" className="size-6 shrink-0 rounded-full" />
        {COWORKER_NAME[persona]} performance
      </h3>
      <StatGroup stats={kpiStats} big />
      <PerformanceByAgentAccordion rows={outcomeRows} />
    </>
  )
}

// Merges a co-worker's performance section + its individual sections (Inbox, Reviews, Surveys...)
// into a single bordered card. Only the two dividers touching the performance section (tab bar →
// performance, performance → first section) are drawn — the sections after that flow together
// with no line between them.
function CoworkerSectionsCard({ sections }: { sections: ReactNode[] }) {
  return (
    <div className="rounded-md border border-border bg-surface p-xl pb-[36px]">
      {sections.map((section, i) => (
        <div key={i} className={i > 2 ? 'mt-2xl' : undefined}>
          {i > 0 && i <= 2 && <div className="my-2xl border-t border-border" />}
          {section}
        </div>
      ))}
    </div>
  )
}

// Renders the Birdeye Score as a plain KPI tile — same value/label treatment as StatGroup —
// instead of the old bespoke ScoreCard layout (accent-colored number + "Industry average: X"
// caption), which looked out of place next to the rest of the page's KPI-tile styling.
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
    </>
  )
}

const DATE_RANGE_OPTIONS = ['Today', 'Last week', 'Last month', 'Last quarter']

// Keeps a dropdown panel mounted through its fade/scale-out before removing it, so closing eases
// out instead of snapping away — same easing helper as AgentDirectoryScreen's date/status filters.
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

// Same trigger + preset-list + "Custom" calendar row as the date-range dropdown beside
// "Create agent" on the Co-workers (Agent directory) page.
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

export function OverviewFeedbackScreen({
  userName = 'Akhil',
  locationLabel = 'All locations',
  hideTopNav = false,
  hideWelcomeHeader = false,
  whiteBackground = false,
  showCoworkerPerformance = false,
}: OverviewFeedbackScreenProps) {
  const [activeCoworkerTab, setActiveCoworkerTab] = useState<AgentPersonaId>('operations')
  const [dateRange, setDateRange] = useState('Last week')

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
                <h1 className="m-0 text-display text-text-primary">Welcome, {userName}</h1>
                <p className="m-0 mt-xs text-body text-text-secondary">Here are the things which need your attention</p>
              </div>
              <div className="flex items-center gap-sm">
                <DateRangeDropdown value={dateRange} onChange={setDateRange} />
                <button
                  type="button"
                  aria-label="Download"
                  className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
                >
                  <Icon name="download" size={20} />
                </button>
              </div>
            </div>
          )}

          {showCoworkerPerformance ? (
            <>
              <AiCoworkerSummaryCard />

              <CoworkerSectionsCard
                sections={[
                  <CoworkerTabBar activeTab={activeCoworkerTab} onChange={setActiveCoworkerTab} />,
                  ...(activeCoworkerTab === 'operations'
                    ? [
                        <CoworkerPerformanceSection persona="operations" />,
                        <InboxSection showMynaPerformance />,
                        <AppointmentsSection big />,
                      ]
                    : activeCoworkerTab === 'marketing'
                      ? [
                          <CoworkerPerformanceSection persona="marketing" />,
                          <ReviewsSection showJayPerformance />,
                          <ListingsSection big />,
                          <div className="flex flex-wrap gap-3xl">
                            <div className="min-w-[320px] flex-1">
                              <ReferralsSection big />
                            </div>
                            <div className="min-w-[320px] flex-1">
                              <SocialSection big showJayOutcomes />
                            </div>
                          </div>,
                        ]
                      : [
                          <CoworkerPerformanceSection persona="cx" />,
                          <div className="flex flex-wrap gap-3xl">
                            <div className="min-w-[320px] flex-1">
                              <SurveysSection />
                            </div>
                            <div className="min-w-[320px] flex-1">
                              <TicketingSection />
                            </div>
                            <div className="min-w-[320px] flex-1">
                              <InsightsAiSection />
                            </div>
                          </div>,
                        ]),
                ]}
              />
            </>
          ) : (
            <>
              <CoworkerSectionsCard sections={[<InboxSection />]} />

              <div className="flex items-center gap-md">
                <p className="m-0 shrink-0 text-small text-text-tertiary">
                  Here is the recent performance of your business for <span className="text-text-primary">{locationLabel}</span>
                </p>
                <div className="h-px flex-1 bg-border" />
              </div>

              <CoworkerSectionsCard sections={[<ReviewsSection />]} />
              <CoworkerSectionsCard sections={[<ListingsSection />]} />
              <CoworkerSectionsCard sections={[<ReferralsSection />]} />
              <CoworkerSectionsCard sections={[<AppointmentsSection />]} />
              <CoworkerSectionsCard sections={[<InboxActivitySection />]} />
              <CoworkerSectionsCard sections={[<SocialSection />]} />
              <CoworkerSectionsCard sections={[<InsightsAiSection />]} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
