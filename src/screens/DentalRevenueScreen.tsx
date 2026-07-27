import React, { useState } from 'react'
import {
  ChartCard,
  DataTable,
  DateRangeSelector,
  DonutChart,
  FilterPanel,
  Icon,
  ReportHeader,
  SankeyChart,
  StackedBarChart,
  SummaryStats,
  TopNav,
  type Column,
  type SankeyLink,
  type SankeyNode,
  type FilterField,
} from '../components'

function HCCard(props: React.ComponentProps<typeof ChartCard>) {
  return <ChartCard {...props} leftActionIcon="tune" />
}

const DATE_RANGE_OPTIONS = ['Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'Last 12 months', 'Custom']

const DENTAL_FILTER_FIELDS: FilterField[] = [
  { id: 'location', label: 'Location', options: ['Atlanta, GA','Chicago, IL','Dallas, TX','Denver, CO','Los Angeles, CA','Miami, FL','Phoenix, AZ','Seattle, WA','Austin, TX'].map(v=>({value:v,label:v})) },
  { id: 'provider', label: 'Provider', options: ['Dr. Adams','Dr. Chen','Dr. Patel','Dr. Rivera','Dr. Thompson'].map(v=>({value:v,label:v})) },
  { id: 'agent',    label: 'Agent',    options: ['Front desk agent','Waitlist agent','Pre-visit agent','Reminder agent','Recall agent','Revenue agent','Treatment plan agent'].map(v=>({value:v,label:v})) },
  { id: 'channel',  label: 'Channel',  options: ['SMS','Email','Voice'].map(v=>({value:v,label:v})) },
  { id: 'outcome',  label: 'Outcome',  options: ['Confirmed','Pending','No response','Declined','Paid','Escalated'].map(v=>({value:v,label:v})) },
]

const SUMMARY_STATS = [
  { id: 'balancesContacted',     value: '1,820', label: 'Balances contacted',     delta: '3.1%', trend: 'up'   as const },
  { id: 'amountCollected',       value: '$142K', label: 'Amount collected',       delta: '5.4%', trend: 'up'   as const },
  { id: 'arDaysReduced',         value: '-28%',  label: 'A/R days reduced',       delta: '2.3%', trend: 'up'   as const },
  { id: 'clickToPayRate',        value: '74%',   label: 'Click-to-pay rate',      delta: '1.9%', trend: 'up'   as const },
  { id: 'disputeEscalationRate', value: '8%',    label: 'Dispute/escalation rate',delta: '0.6%', trend: 'down' as const },
]

// Nodes: 0=Revenue agent, 1=SMS, 2=Email, 3=Voice,
// 4=<1hr, 5=1-4hrs, 6=4-24hrs, 7=>24hrs,
// 8=Paid, 9=Partial, 10=No response, 11=Escalated
const FUNNEL_NODES: SankeyNode[] = [
  {
    name: 'Balances contacted',
    breakdown: [
      { label: 'Revenue agent – North region', pct: '42%', value: 764 },
      { label: 'Revenue agent – South region', pct: '35%', value: 637 },
      { label: 'Revenue agent – West region',  pct: '23%', value: 419 },
    ],
  },
  { name: 'SMS (48%)' }, { name: 'Email (34%)' }, { name: 'Voice (18%)' },
  { name: '<1hr (35%)' }, { name: '1–4hrs (30%)' }, { name: '4–24hrs (22%)' }, { name: '>24hrs (13%)' },
  { name: 'Paid (74%)' }, { name: 'Partial (12%)' }, { name: 'No response (10%)' }, { name: 'Escalated (4%)' },
]
const FUNNEL_LINKS: SankeyLink[] = [
  { source: 0, target: 1, value: 48 }, { source: 0, target: 2, value: 34 }, { source: 0, target: 3, value: 18 },
  { source: 1, target: 4, value: 17 }, { source: 1, target: 5, value: 14 }, { source: 1, target: 6, value: 11 }, { source: 1, target: 7, value: 6  },
  { source: 2, target: 4, value: 12 }, { source: 2, target: 5, value: 10 }, { source: 2, target: 6, value: 8  }, { source: 2, target: 7, value: 4  },
  { source: 3, target: 4, value: 6  }, { source: 3, target: 5, value: 6  }, { source: 3, target: 6, value: 3  }, { source: 3, target: 7, value: 3  },
  { source: 4, target: 8, value: 26 }, { source: 4, target: 9, value: 5  }, { source: 4, target: 10, value: 3 }, { source: 4, target: 11, value: 1 },
  { source: 5, target: 8, value: 22 }, { source: 5, target: 9, value: 4  }, { source: 5, target: 10, value: 3 }, { source: 5, target: 11, value: 1 },
  { source: 6, target: 8, value: 13 }, { source: 6, target: 9, value: 2  }, { source: 6, target: 10, value: 3 }, { source: 6, target: 11, value: 4 },
  { source: 7, target: 8, value: 4  }, { source: 7, target: 9, value: 3  }, { source: 7, target: 10, value: 4 }, { source: 7, target: 11, value: 2 },
]
const FUNNEL_NODE_COLORS: Record<number, string> = {
  0: '#7c4dff',
  1: '#1976d2', 2: '#00bcd4', 3: '#fbbf24',
  4: '#4cae3d', 5: '#8bc34a', 6: '#f59e0b', 7: '#bdbdbd',
  8: '#4cae3d', 9: '#f59e0b', 10: '#9e9e9e', 11: '#ef4444',
}

const CHANNEL_DONUT = [
  { name: 'Voice', value: 45, color: '#3f51b5' },
  { name: 'Email', value: 34, color: '#e91e63' },
  { name: 'SMS',   value: 21, color: '#f59e0b' },
]

const MONTHLY_DATA = [
  { month: 'Dec 2025', contacted: 320, collected: 230 },
  { month: 'Jan 2026', contacted: 290, collected: 210 },
  { month: 'Feb',      contacted: 340, collected: 256 },
  { month: 'Mar',      contacted: 310, collected: 228 },
  { month: 'Apr',      contacted: 360, collected: 272 },
  { month: 'May',      contacted: 200, collected: 148 },
]
const MONTHLY_SERIES = [
  { key: 'contacted', label: 'Contacted', color: '#1976d2' },
  { key: 'collected', label: 'Collected', color: '#4cae3d' },
]

function deltaSpan(delta: string) {
  const isPos = !delta.startsWith('-')
  return <span className={`text-xs ml-1 ${isPos ? 'text-success' : 'text-danger'}`}>{delta}</span>
}

interface LocationRow {
  location: string
  balancesContacted: string
  amountCollected: string
  arDaysReduced: string
  arDelta: string
  clickToPayRate: string
  staffHoursSaved: string
  [key: string]: string
}

const LOCATION_DATA: LocationRow[] = [
  { location: 'Atlanta, GA',  balancesContacted: '540', amountCollected: '$38,200', arDaysReduced: '-32%', arDelta: '+3.2%', clickToPayRate: '78%', staffHoursSaved: '312' },
  { location: 'Dallas, TX',   balancesContacted: '480', amountCollected: '$34,100', arDaysReduced: '-29%', arDelta: '+2.9%', clickToPayRate: '76%', staffHoursSaved: '278' },
  { location: 'Chicago, IL',  balancesContacted: '380', amountCollected: '$26,400', arDaysReduced: '-27%', arDelta: '+2.7%', clickToPayRate: '72%', staffHoursSaved: '218' },
  { location: 'Miami, FL',    balancesContacted: '310', amountCollected: '$21,800', arDaysReduced: '-24%', arDelta: '+2.4%', clickToPayRate: '70%', staffHoursSaved: '178' },
  { location: 'Phoenix, AZ',  balancesContacted: '260', amountCollected: '$18,200', arDaysReduced: '-22%', arDelta: '+2.2%', clickToPayRate: '68%', staffHoursSaved: '148' },
  { location: 'Austin, TX',   balancesContacted: '210', amountCollected: '$14,600', arDaysReduced: '-20%', arDelta: '+2.0%', clickToPayRate: '65%', staffHoursSaved: '120' },
  { location: 'Denver, CO',   balancesContacted: '170', amountCollected: '$11,900', arDaysReduced: '-19%', arDelta: '+1.9%', clickToPayRate: '63%', staffHoursSaved: '96'  },
  { location: 'Seattle, WA',  balancesContacted: '120', amountCollected: '$8,400',  arDaysReduced: '-18%', arDelta: '+1.8%', clickToPayRate: '61%', staffHoursSaved: '72'  },
]

const LOCATION_COLUMNS: Column<LocationRow>[] = [
  { key: 'location',          label: 'Location',            width: 180, sortable: true },
  { key: 'balancesContacted', label: 'Balances contacted',  width: 180, sortable: true },
  { key: 'amountCollected',   label: 'Amount collected',    width: 170, sortable: true },
  {
    key: 'arDaysReduced', label: 'A/R days reduced', width: 180, sortable: true,
    render: (_v, row) => <span>{row.arDaysReduced}{deltaSpan(row.arDelta)}</span>,
  },
  { key: 'clickToPayRate',    label: 'Click-to-pay rate',   width: 160, sortable: true },
  { key: 'staffHoursSaved',   label: 'Staff hours saved',   width: 160, sortable: true },
]

export function DentalRevenueScreen() {
  const [dateRange, setDateRange] = useState('Last 6 months')
  const [filterOpen, setFilterOpen] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto bg-surface">
          <ReportHeader
            title="Revenue collected"
            subtitle="A/R reduction and payment collection performance driven by the revenue agent."
            rightSlot={
              <div className="flex items-center gap-sm">
                <DateRangeSelector
                  value={dateRange}
                  options={DATE_RANGE_OPTIONS}
                  onChange={setDateRange}
                />
                <button type="button" aria-label="Filters" onClick={() => setFilterOpen(o => !o)}
                  className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
                  <Icon name="filter_list" size={20} />
                </button>
              </div>
            }
          />

          <div className="flex flex-col gap-lg p-2xl">

            <SummaryStats stats={SUMMARY_STATS} />

            <HCCard title="Payment collection funnel" tooltip="Traces contacted balances from the outreach channel, through response time, to the final payment outcome.">
              <SankeyChart
                nodes={FUNNEL_NODES}
                links={FUNNEL_LINKS}
                height={400}
                nodeColors={FUNNEL_NODE_COLORS}
                columnHeaders={['Balances contacted', 'Channel', 'Response time', 'Outcome']}
              />
            </HCCard>

            <div className="grid grid-cols-2 gap-lg">
              <HCCard title="Amount collected by channel" tooltip="Breaks down the total amount collected by the outreach channel used, counting each balance once.">
                <DonutChart
                  data={CHANNEL_DONUT}
                  centerValue="$142K"
                  centerLabel="Total collected"
                />
              </HCCard>

              <HCCard title="Balances contacted vs amount collected" tooltip="Compares the total balance amount contacted each month to the amount actually collected.">
                <StackedBarChart
                  data={MONTHLY_DATA}
                  series={MONTHLY_SERIES}
                  xKey="month"
                  height={320}
                  showBarLabels
                />
              </HCCard>
            </div>

            <HCCard title="A/R performance by location" tooltip="Breaks down accounts-receivable collection performance by location, aggregated over the selected date range.">
              <DataTable columns={LOCATION_COLUMNS} data={LOCATION_DATA} scrollOnHover />
            </HCCard>

          </div>
        </div>
        <FilterPanel open={filterOpen} fields={DENTAL_FILTER_FIELDS} onClose={() => setFilterOpen(false)} />
      </div>
    </div>
  )
}
