import { Chip, ChartCard, DataTable, Icon, InfoTooltip, StackedBarChart, TopNav, TrendLineChart, type Column } from '../components'
import iconGoogle from '../assets/icon-google.svg'
import iconGooglePlay from '../assets/icon-google-play.svg'
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

function StatGroup({ stats, columns = stats.length }: { stats: OverviewStat[]; columns?: number }) {
  return (
    <div className="grid gap-lg" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {stats.map((s) => (
        <div key={s.id}>
          <p className={`m-0 text-h3 ${s.danger ? 'text-chip-danger-text' : 'text-text-primary'}`}>{s.value}</p>
          <p className="m-0 mt-xs text-small uppercase tracking-wide text-text-tertiary">{s.label}</p>
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

function OutcomeRow({ label, agentName, value }: { label: string; agentName: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-md border-t border-border py-lg first:border-t-0">
      <div className="min-w-0">
        <p className="m-0 text-body text-text-primary">{label}</p>
        <p className="m-0 mt-xs text-small text-text-tertiary">{agentName}</p>
      </div>
      <span className="shrink-0 text-h3 text-text-primary">{value}</span>
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
  const mynaAgents = showMynaPerformance ? getAgentDirectory('healthcare').filter((a) => a.persona === 'operations') : []
  const runningCount = mynaAgents.filter((a) => a.running > 0).length
  const totalTimeSavedHrs = mynaAgents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const totalCostSavedK = mynaAgents.reduce((sum, a) => sum + parseFloat(a.costSaved.replace(/[$K]/g, '')), 0)

  const mynaKpiStats: OverviewStat[] = [
    { id: 'agents-running', value: String(runningCount), label: 'Agents running' },
    { id: 'time-saved', value: `${totalTimeSavedHrs}h`, label: 'Time saved' },
    { id: 'cost-saved', value: `$${totalCostSavedK.toFixed(1)}K`, label: 'Cost saved' },
  ]

  return (
    <div className="rounded-md border border-border bg-surface p-2xl">
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Inbox</h3>
      <StatGroup stats={OVERVIEW_INBOX_ALERT_STATS} columns={4} />

      {showMynaPerformance && (
        <>
          <div className="my-2xl border-t border-border" />
          <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Myna performance</h3>
          <StatGroup stats={mynaKpiStats} columns={3} />
          <div className="mt-2xl">
            {mynaAgents.map((a) => (
              <OutcomeRow key={a.id} label={a.outcome.label} agentName={a.name} value={formatK(a.outcome.value)} />
            ))}
          </div>
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
  const maxCount = Math.max(...OVERVIEW_REVIEWS_BREAKDOWN.map((b) => b.count))
  const jayAgents = showJayPerformance ? getAgentDirectory('healthcare').filter((a) => a.persona === 'marketing') : []
  const jayRunningCount = jayAgents.filter((a) => a.running > 0).length
  const jayTimeSavedHrs = jayAgents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const jayCostSavedK = jayAgents.reduce((sum, a) => sum + parseFloat(a.costSaved.replace(/[$K]/g, '')), 0)
  const jayKpiStats: OverviewStat[] = [
    { id: 'agents-running', value: String(jayRunningCount), label: 'Agents running' },
    { id: 'time-saved', value: `${jayTimeSavedHrs}h`, label: 'Time saved' },
    { id: 'cost-saved', value: `$${jayCostSavedK.toFixed(1)}K`, label: 'Cost saved' },
  ]

  return (
    <ChartCard title="Reviews">
      <div className="flex flex-wrap items-start gap-3xl">
        <div className="flex min-w-[320px] flex-1 flex-col gap-lg">
          <div className="flex items-center gap-sm">
            <span className="text-h2 text-text-primary">{OVERVIEW_REVIEWS_RATING}</span>
            <div className="flex items-center gap-[2px] text-[#f5a623]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon key={i} name="star" size={18} fill />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-sm">
            {OVERVIEW_REVIEWS_BREAKDOWN.map((b) => (
              <div key={b.stars} className="flex items-center gap-md">
                <span className="w-[28px] shrink-0 text-small text-text-secondary">{b.stars} ★</span>
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
            ))}
          </div>
        </div>

        <div className="flex w-[240px] shrink-0 flex-col gap-md">
          {OVERVIEW_REVIEW_SOURCES.map((s) => {
            const logo = REVIEW_SOURCE_LOGOS[s.id]
            return (
              <div key={s.id} className="flex items-center gap-md rounded-sm border border-border px-lg py-md">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-body ${logo ? '' : s.iconColorClassName}`}>
                  {logo ? <img src={logo} alt="" className="size-6" /> : <Icon name={s.icon} size={18} />}
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

        <div className="w-[220px] shrink-0">
          <StatGroup stats={OVERVIEW_REVIEWS_STATS} columns={2} />
        </div>
      </div>

      <div className="mt-2xl flex items-center gap-sm rounded-sm bg-chip-info-bg px-lg py-md text-small text-text-primary">
        <Icon name="info" size={18} className="shrink-0 text-text-action" />
        Monitor more reviews by updating 7126 review sites. <a href="#" className="text-text-action hover:underline">See all</a>
      </div>

      {showJayPerformance && (
        <>
          <div className="my-2xl border-t border-border" />
          <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Jay performance</h3>
          <StatGroup stats={jayKpiStats} columns={3} />
          <div className="mt-2xl">
            {jayAgents.map((a) => (
              <OutcomeRow key={a.id} label={a.outcome.label} agentName={a.name} value={formatK(a.outcome.value)} />
            ))}
          </div>
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

function ListingsCard() {
  return (
    <ChartCard title="Listings">
      <div className="mb-2xl flex items-center gap-sm rounded-sm bg-chip-info-bg px-lg py-md text-small text-text-primary">
        <Icon name="search" size={18} className="shrink-0 text-text-action" />
        See how your business is ranking on <a href="#" className="text-text-action hover:underline">Google search</a>
      </div>

      <p className="m-0 mb-lg text-small text-text-tertiary">Google report</p>
      <StatGroup stats={OVERVIEW_LISTINGS_GOOGLE_REPORT} columns={4} />

      <div className="my-2xl border-t border-border" />

      <p className="m-0 mb-lg text-small text-text-tertiary">Google Q&A · By location</p>
      <StatGroup stats={OVERVIEW_LISTINGS_QA} columns={4} />
    </ChartCard>
  )
}

function ReferralsCard() {
  return (
    <ChartCard title="Referrals" minHeight="0">
      <StatGroup stats={OVERVIEW_REFERRALS_STATS} columns={3} />
    </ChartCard>
  )
}

function AppointmentsCard() {
  return (
    <ChartCard title="Appointments" minHeight="0">
      <StatGroup stats={OVERVIEW_APPOINTMENTS_STATS} columns={5} />
    </ChartCard>
  )
}

function InboxActivityCard() {
  return (
    <ChartCard title="Inbox">
      <StatGroup stats={OVERVIEW_INBOX_ACTIVITY_STATS} columns={3} />
      <div className="mt-2xl">
        <TrendLineChart data={OVERVIEW_MEDIAN_RESPONSE_TREND} height={260} />
        <p className="m-0 text-center text-small text-text-tertiary">Median response time</p>
      </div>
    </ChartCard>
  )
}

function SocialCard() {
  return (
    <ChartCard title="Social">
      <div>
        <p className="m-0 text-h3 text-text-primary">{OVERVIEW_SOCIAL_NEW_FOLLOWERS}</p>
        <p className="m-0 mt-xs text-small uppercase tracking-wide text-text-tertiary">New followers</p>
      </div>
      <div className="mt-2xl">
        <StackedBarChart data={OVERVIEW_SOCIAL_DATA} series={OVERVIEW_SOCIAL_SERIES} xKey="month" height={280} grouped />
      </div>
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

          <InboxAlertCard showMynaPerformance={showCoworkerPerformance} />

          <div className="flex items-center gap-md">
            <p className="m-0 shrink-0 text-small text-text-tertiary">
              Here is the recent performance of your business for <span className="text-text-primary">{locationLabel}</span>
            </p>
            <div className="h-px flex-1 bg-border" />
          </div>

          <ReviewsCard showJayPerformance={showCoworkerPerformance} />
          <PaymentsCard />
          <ListingsCard />
          <ReferralsCard />
          <AppointmentsCard />
          <InboxActivityCard />
          <SocialCard />
          <InsightsAiCard />
        </div>
      </div>
    </div>
  )
}
