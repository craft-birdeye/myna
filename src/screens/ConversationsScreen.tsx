import {
  ChartCard,
  DonutChart,
  Heatmap,
  Icon,
  SankeyChart,
  StackedBarChart,
  SummaryStats,
  TopNav,
  chartColors as c,
  type BarSeries,
  type SummaryStat,
} from '../components'

const SUMMARY: SummaryStat[] = [
  { id: 'total', value: '7.9K', label: 'Total Conversations', delta: '8.4%', trend: 'up' },
  { id: 'resolution', value: '72%', label: 'Resolution Rate', delta: '4%', trend: 'down' },
  { id: 'escalation', value: '3.6%', label: 'Escalation Rate', delta: '3%', trend: 'up' },
  { id: 'routed', value: '13.2%', label: 'Routed', delta: '2%', trend: 'up' },
  { id: 'unresponded', value: '1.2%', label: 'Unresponded', delta: '0.6%', trend: 'down' },
  { id: 'avg', value: '2m 34s', label: 'Avg call time', delta: '4%', trend: 'down' },
]

// Conversations over time (stacked by outcome)
const OUTCOME_SERIES: BarSeries[] = [
  { key: 'resolved', label: 'Resolved', color: c.resolved },
  { key: 'escalated', label: 'Escalated', color: c.escalated },
  { key: 'unresolved', label: 'Unresolved', color: c.unresolved },
  { key: 'routed', label: 'Routed', color: c.routed },
]
const overTime = [
  { month: 'Dec 2025', resolved: 240, escalated: 70, unresolved: 64, routed: 60 },
  { month: 'Jan', resolved: 120, escalated: 50, unresolved: 40, routed: 24 },
  { month: 'Feb', resolved: 230, escalated: 80, unresolved: 62, routed: 40 },
  { month: 'Mar', resolved: 210, escalated: 80, unresolved: 68, routed: 40 },
  { month: 'Apr', resolved: 110, escalated: 40, unresolved: 28, routed: 20 },
  { month: 'May', resolved: 200, escalated: 90, unresolved: 50, routed: 30 },
]

// Questions by channel (donut)
const channelDonut = [
  { name: 'SMS', value: 116, color: c.channel.sms },
  { name: 'Email', value: 60, color: c.channel.email },
  { name: 'Call', value: 40, color: c.channel.call },
]
const resolutionDonut = [
  { name: 'Resolved', value: 88, color: c.resolved },
  { name: 'Unresponded', value: 12, color: c.unresponded },
]

// Conversations by channel (stacked by channel)
const CHANNEL_SERIES: BarSeries[] = [
  { key: 'sms', label: 'SMS', color: c.channel.sms },
  { key: 'email', label: 'Email', color: c.channel.email },
  { key: 'call', label: 'Call', color: c.channel.call },
]
const byChannel = overTime.map((m) => ({
  month: m.month,
  sms: Math.round((m.resolved + m.escalated) * 0.5),
  email: Math.round(m.unresolved * 1.4),
  call: Math.round(m.routed * 1.2),
}))

// Questions category over time (stacked by category, by day)
const CATEGORY_SERIES: BarSeries[] = [
  { key: 'insurance', label: 'Insurance', color: c.categorical[0] },
  { key: 'hours', label: 'Hours', color: c.categorical[1] },
  { key: 'locations', label: 'Locations', color: c.categorical[2] },
  { key: 'refunds', label: 'Refunds', color: c.categorical[3] },
  { key: 'booking', label: 'Booking', color: c.categorical[4] },
  { key: 'others', label: 'Others', color: c.categorical[5] },
]
const categoryData = Array.from({ length: 12 }, (_, i) => {
  const base = 20 + Math.round(30 * (0.5 + 0.5 * Math.sin(i / 2)))
  return {
    day: String(i + 1),
    insurance: base,
    hours: Math.round(base * 0.7),
    locations: Math.round(base * 0.5),
    refunds: Math.round(base * 0.4),
    booking: Math.round(base * 0.8),
    others: Math.round(base * 0.3),
  }
})

// Conversation flow (Sankey)
const sankeyNodes = [
  { name: 'Calls' }, { name: 'SMS' }, { name: 'Email' },
  { name: 'Agent Sarah' }, { name: 'Agent Mike' }, { name: 'Agent Lisa' }, { name: 'Agent Adam' },
  { name: 'Resolved' }, { name: 'Routed' }, { name: 'Unresolved' },
]
const sankeyLinks = [
  { source: 0, target: 3, value: 30 }, { source: 0, target: 4, value: 20 }, { source: 0, target: 5, value: 15 },
  { source: 1, target: 4, value: 40 }, { source: 1, target: 5, value: 30 }, { source: 1, target: 6, value: 20 },
  { source: 2, target: 5, value: 25 }, { source: 2, target: 6, value: 25 },
  { source: 3, target: 7, value: 40 }, { source: 3, target: 8, value: 25 },
  { source: 4, target: 7, value: 40 }, { source: 4, target: 9, value: 20 },
  { source: 5, target: 7, value: 45 }, { source: 5, target: 8, value: 25 },
  { source: 6, target: 7, value: 25 }, { source: 6, target: 9, value: 20 },
]

// Peak booking times & days (heatmap)
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, h) => {
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}:00 ${h < 12 ? 'AM' : 'PM'}`
})
const heatValues = DAYS.map((_, d) =>
  HOURS.map((_, h) => {
    const peak = h >= 8 && h <= 20 ? 1 : 0.25
    const weekend = d === 0 || d === 6 ? 0.7 : 1
    return Math.round(15 + 85 * peak * weekend * (0.55 + 0.45 * Math.sin(h / 3 + d)))
  }),
)

interface MiniKpi {
  value: string
  label: string
  delta?: string
  trend?: 'up' | 'down'
}

function MiniKpis({ items }: { items: MiniKpi[] }) {
  return (
    <div className="mb-md flex flex-wrap gap-x-2xl gap-y-md">
      {items.map((k) => (
        <div key={k.label}>
          <div className="flex items-center gap-xs">
            <span className="text-[16px] leading-5 font-medium text-text-primary">{k.value}</span>
            {k.delta && (
              <span
                className={`inline-flex items-center text-small font-medium ${
                  k.trend === 'down' ? 'text-chip-danger-text' : 'text-chip-success-text'
                }`}
              >
                <Icon name={k.trend === 'down' ? 'arrow_downward' : 'arrow_upward'} size={12} />
                {k.delta}
              </span>
            )}
          </div>
          <span className="text-small text-text-secondary">{k.label}</span>
        </div>
      ))}
    </div>
  )
}

export function ConversationsScreen() {
  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      {/* page header */}
      <div className="flex h-16 shrink-0 items-center justify-between bg-surface px-2xl">
        <h1 className="text-h3 text-text-primary">Conversations</h1>
        <button
          type="button"
          className="flex h-9 items-center gap-sm rounded-sm border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
        >
          <Icon name="calendar_today" size={18} className="text-text-icon" />
          Mar 28, 2026 - Apr 24, 2026
          <Icon name="expand_more" size={20} className="text-text-icon" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-lg overflow-auto bg-surface px-2xl pb-2xl pt-md">
        <SummaryStats stats={SUMMARY} />

        <ChartCard title="Involvement over time">
          <StackedBarChart data={overTime} series={OUTCOME_SERIES} xKey="month" height={300} />
        </ChartCard>

        <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
          <ChartCard title="Questions by channel">
            <MiniKpis
              items={[
                { value: '216', label: 'Total ask', delta: '1.3%', trend: 'up' },
                { value: '116', label: 'SMS', delta: '1.3%', trend: 'up' },
                { value: '60', label: 'Email', delta: '1.3%', trend: 'up' },
                { value: '40', label: 'Call' },
              ]}
            />
            <DonutChart data={channelDonut} centerValue="216" centerLabel="Total ask" />
          </ChartCard>

          <ChartCard title="Resolution rate">
            <MiniKpis
              items={[
                { value: '88%', label: 'Resolved', delta: '1.3%', trend: 'up' },
                { value: '12%', label: 'Unresponded', delta: '1.3%', trend: 'up' },
              ]}
            />
            <DonutChart data={resolutionDonut} centerValue="88%" centerLabel="Resolution rate" />
          </ChartCard>
        </div>

        <ChartCard title="Conversations by channel">
          <StackedBarChart data={byChannel} series={CHANNEL_SERIES} xKey="month" height={300} />
        </ChartCard>

        <ChartCard title="Questions category over time">
          <StackedBarChart data={categoryData} series={CATEGORY_SERIES} xKey="day" height={320} />
        </ChartCard>

        <ChartCard title="Conversation flow across channel" showActions={false}>
          <SankeyChart nodes={sankeyNodes} links={sankeyLinks} height={360} />
        </ChartCard>

        <ChartCard title="Peak booking times and days">
          <Heatmap rowLabels={DAYS} colLabels={HOURS} values={heatValues} />
        </ChartCard>
      </div>
    </div>
  )
}
