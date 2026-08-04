import { ChartCard, Icon, StackedBarChart, TopNav, TrendLineChart } from '../components'
import {
  OVERVIEW_APPOINTMENTS_STATS,
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
  type OverviewStat,
} from '../data/overviewData'

interface OverviewScreenProps {
  userName?: string
  locationLabel?: string
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

function InboxAlertCard() {
  return (
    <div className="rounded-md border border-border bg-surface p-2xl">
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Inbox</h3>
      <StatGroup stats={OVERVIEW_INBOX_ALERT_STATS} columns={4} />
    </div>
  )
}

function ReviewsCard() {
  const maxCount = Math.max(...OVERVIEW_REVIEWS_BREAKDOWN.map((b) => b.count))
  return (
    <ChartCard title="Reviews">
      <div className="flex flex-wrap items-start gap-3xl">
        <div className="flex min-w-[260px] flex-1 flex-col gap-lg">
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
          <div className="flex flex-wrap gap-md">
            {OVERVIEW_REVIEW_SOURCES.map((s) => (
              <div key={s.id} className="flex w-[130px] flex-col items-center gap-xs rounded-sm border border-border px-md py-lg text-center">
                <span className={`flex size-8 items-center justify-center rounded-full text-body ${s.iconColorClassName}`}>
                  {s.icon.length === 1 ? s.icon : <Icon name={s.icon} size={18} />}
                </span>
                <p className="m-0 text-small text-text-tertiary">{s.name}</p>
                <p className="m-0 flex items-center gap-xs text-body text-text-primary">
                  {s.rating}
                  <Icon name="star" size={14} fill className="text-[#f5a623]" />
                </p>
                <p className="m-0 text-small text-text-tertiary">{s.reviewCount}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-[220px]">
          <StatGroup stats={OVERVIEW_REVIEWS_STATS} columns={2} />
        </div>
      </div>

      <div className="mt-2xl flex items-center gap-sm rounded-sm bg-chip-info-bg px-lg py-md text-small text-text-primary">
        <Icon name="info" size={18} className="shrink-0 text-text-action" />
        Monitor more reviews by updating 7126 review sites. <a href="#" className="text-text-action hover:underline">See all</a>
      </div>
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
    <ChartCard title="Referrals">
      <StatGroup stats={OVERVIEW_REFERRALS_STATS} columns={3} />
    </ChartCard>
  )
}

function AppointmentsCard() {
  return (
    <ChartCard title="Appointments">
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

function InsightsAiCard() {
  return (
    <ChartCard title="Insights AI">
      <div className="flex min-h-[160px] flex-col items-center justify-center gap-sm text-text-tertiary">
        <Icon name="progress_activity" size={28} className="animate-spin text-text-action" />
        <p className="m-0 text-body text-text-tertiary">Loading</p>
      </div>
    </ChartCard>
  )
}

export function OverviewScreen({ userName = 'Akhil', locationLabel = 'All locations' }: OverviewScreenProps) {
  return (
    <div className="flex h-full flex-col">
      <TopNav title="Overview" initials="S" />
      <div className="flex-1 overflow-y-auto bg-surface-l2 px-2xl py-xl">
        <div className="flex flex-col gap-lg">
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

          <InboxAlertCard />

          <div className="flex items-center gap-md">
            <p className="m-0 shrink-0 text-small text-text-tertiary">
              Here is the recent performance of your business for <span className="text-text-primary">{locationLabel}</span>
            </p>
            <div className="h-px flex-1 bg-border" />
          </div>

          <ReviewsCard />
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
