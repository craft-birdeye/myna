import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import {
  ChartStatRow,
  ChecklistDropdownPanel,
  DataTable,
  DonutChart,
  Icon,
  ChartCard,
  DateRangeSelector,
  EstimateSavingsModal,
  FilterPanel,
  InfoTooltip,
  type EstimateSavingsValues,
  type FilterField,
  RatingBarChart,
  ReportHeader,
  SessionsFunnelSankey,
  StackedBarChart,
  SummaryStats,
  TopNav,
  TrendLineChart,
  WorkingHoursBreakdownChart,
  type BarSeries,
  type Column,
} from '../components'
import {
  FRONT_DESK_INDUSTRY_OPTIONS,
  applyAudienceCopy,
  buildIndustryFunnel,
  buildOutcomeWorkingHoursTrend,
  getLocationBreakdownForIndustry,
  getOutcomeTrendData,
  getOutcomeTrendOptions,
  getOutcomeTrendSeries,
  getOutcomeWorkingHoursBreakdown,
  getSubOutcomeBreakdownColumns,
  getSubOutcomeBreakdownData,
  SUB_OUTCOME_EMPTY_CELL,
  type FrontDeskIndustryId,
  type LocationBreakdownRow,
} from '../data/frontDeskIndustryConfig'
import { ArrowLeft, ChevronDown, DollarSign, Flame, LayoutList, ListFilter, MoreVertical, Paperclip, Smile, Users } from 'lucide-react'

// ─── Conversation data per funnel node ───────────────────────────────────────

interface FunnelConversation {
  id: string
  name: string
  verified?: boolean
  message: string
  location: string
  assignee?: string
  date: string
  unread?: boolean
}

const CONVERSATIONS_BY_NODE: Record<string, FunnelConversation[]> = {
  Call: [
    { id: 'v1', name: 'Linda Hargrove', verified: true, message: 'Called in — asking about insurance coverage for a new patient visit.', location: 'North Austin', assignee: 'Front desk AI', date: '10:03 AM', unread: true },
    { id: 'v2', name: 'Ray Castellano', message: 'Voicemail: needs a callback re: treatment plan questions.', location: 'South Austin', assignee: 'USA - Sales', date: '09:41 AM', unread: true },
    { id: 'v3', name: 'Tasha Winters', message: 'Spoke with agent — appointment scheduled for Thu.', location: 'San Francisco', assignee: 'Kelsy Hiltz', date: 'Jun 10, 2025' },
    { id: 'v4', name: 'Omar Farouk', message: 'Robin: Was your question answered?', location: 'North Austin', assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  Text: [
    { id: 't1', name: 'Brianna Cole', message: 'Hey, can I reschedule my 2pm to Friday instead?', location: 'South Austin', assignee: 'Front desk AI', date: '11:22 AM', unread: true },
    { id: 't2', name: 'Nathan Cruz', message: 'Texted back — confirmed appointment for Mon at 10am.', location: 'North Austin', assignee: 'Kelsy Hiltz', date: '10:58 AM' },
    { id: 't3', name: 'Alicia Park', verified: true, message: 'Do you accept my insurance plan? Need to confirm before booking.', location: 'San Francisco', assignee: 'USA - Sales', date: 'Jun 10, 2025' },
    { id: 't4', name: 'Kevin Marsh', message: 'Robin: Was your question answered?', location: 'South Austin', assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  Webchat: [
    { id: 'w1', name: 'Marcus Thompson', verified: true, message: 'Interested in scheduling a new patient exam.', location: 'North Austin', assignee: 'Front desk AI', date: '09:14 AM', unread: true },
    { id: 'w2', name: 'Priya Nair', message: 'Can I book an appointment for this Saturday?', location: 'South Austin', assignee: 'Front desk AI', date: '08:52 AM', unread: true },
    { id: 'w3', name: 'Derek Okafor', message: 'What are your hours for walk-in consultations?', location: 'San Francisco', assignee: 'USA - Sales', date: 'Jun 10, 2025' },
    { id: 'w4', name: 'Sofia Mendez', message: 'I filled out the online form — waiting for a callback.', location: 'North Austin', assignee: 'Front desk AI', date: 'Jun 10, 2025' },
  ],
  Resolved: [
    { id: 'an1', name: 'Marcus Thompson', verified: true, message: 'New patient exam confirmed for Jun 14 at 11am.', location: 'North Austin', assignee: 'Front desk AI', date: '09:14 AM' },
    { id: 'an2', name: 'Priya Nair', message: 'Appointment confirmed — Sat 9am.', location: 'South Austin', assignee: 'Front desk AI', date: '08:52 AM' },
    { id: 'an3', name: 'Linda Hargrove', verified: true, message: 'Insurance question answered — visit scheduled.', location: 'North Austin', assignee: 'Front desk AI', date: '10:03 AM' },
    { id: 'an4', name: 'Nathan Cruz', message: 'Appointment Mon 10am acknowledged by patient.', location: 'North Austin', assignee: 'Kelsy Hiltz', date: 'Jun 10, 2025' },
  ],
  'Not resolved': [
    { id: 'nr1', name: 'Ray Castellano', message: 'Awaiting callback confirmation from billing team.', location: 'South Austin', assignee: 'USA - Sales', date: '09:41 AM', unread: true },
    { id: 'nr2', name: 'Grace Liu', message: 'Escalated — complex referral needs human review.', location: 'San Francisco', assignee: 'Kelsy Hiltz', date: 'Jun 10, 2025', unread: true },
    { id: 'nr3', name: 'James Whitfield', message: 'Follow-up required — patient did not complete intake.', location: 'San Francisco', assignee: 'USA - Sales', date: 'Jun 9, 2025' },
  ],
  Scheduled: [
    { id: 'b1', name: 'Alicia Park', verified: true, message: 'New booking: exam — Jun 13 at 1pm.', location: 'San Francisco', assignee: 'USA - Sales', date: 'Jun 10, 2025', unread: true },
    { id: 'b2', name: 'Priya Nair', message: 'Booked: cleaning — Sat 9am.', location: 'South Austin', assignee: 'Front desk AI', date: '08:52 AM' },
    { id: 'b3', name: 'Marcus Thompson', message: 'New patient visit confirmed for Jun 14 at 11am.', location: 'North Austin', assignee: 'Front desk AI', date: '09:14 AM' },
  ],
  Rescheduled: [
    { id: 'r1', name: 'Brianna Cole', message: 'Rescheduled from Tue 2pm → Fri 2pm at patient request.', location: 'South Austin', assignee: 'Front desk AI', date: '11:22 AM', unread: true },
    { id: 'r2', name: 'Todd Bergman', message: 'Visit moved from Jun 8 to Jun 15 — provider availability.', location: 'North Austin', assignee: 'Kelsy Hiltz', date: 'Jun 9, 2025' },
  ],
  Cancelled: [
    { id: 'c1', name: 'James Whitfield', message: 'Cancelled appointment — no longer needed.', location: 'San Francisco', assignee: 'USA - Sales', date: 'Jun 9, 2025', unread: true },
    { id: 'c2', name: 'Omar Farouk', message: 'Appointment cancelled — patient relocated.', location: 'North Austin', assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  'Information provided': [
    { id: 'ip1', name: 'Derek Okafor', message: 'Provided office hours and parking directions.', location: 'San Francisco', assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'ip2', name: 'Yvonne Santos', message: 'Explained referral process and next steps.', location: 'South Austin', assignee: 'Kelsy Hiltz', date: 'Jun 8, 2025' },
    { id: 'ip3', name: 'Sofia Mendez', message: 'Shared treatment prep instructions via text.', location: 'North Austin', assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  'Human transfer': [
    { id: 'h1', name: 'Ray Castellano', message: 'Transferred — billing question requires human.', location: 'South Austin', assignee: 'USA - Sales', date: '09:41 AM', unread: true },
    { id: 'h2', name: 'Grace Liu', message: 'Escalated — insurance verification needs staff review.', location: 'San Francisco', assignee: 'Kelsy Hiltz', date: 'Jun 10, 2025', unread: true },
  ],
  'Action pending': [
    { id: 'p1', name: 'Ray Castellano', message: 'Awaiting callback confirmation from billing team.', location: 'South Austin', assignee: 'USA - Sales', date: '09:41 AM', unread: true },
    { id: 'p2', name: 'Grace Liu', message: 'Pending manager review — referral documentation incomplete.', location: 'San Francisco', assignee: 'Kelsy Hiltz', date: 'Jun 10, 2025', unread: true },
    { id: 'p3', name: 'Derek Okafor', message: 'Follow-up call scheduled — awaiting patient response.', location: 'San Francisco', assignee: 'USA - Sales', date: 'Jun 10, 2025' },
  ],
  'Payment and billing': [
    { id: 'pb1', name: 'Grace Liu', message: 'Asked about outstanding invoice and payment options.', location: 'San Francisco', assignee: 'Kelsy Hiltz', date: 'Jun 10, 2025', unread: true },
    { id: 'pb2', name: 'Todd Bergman', message: 'Question about copay amount for upcoming visit.', location: 'North Austin', assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  'Insurance coverage': [
    { id: 'ic1', name: 'Alicia Park', verified: true, message: 'Asked if provider is in-network for her plan.', location: 'San Francisco', assignee: 'USA - Sales', date: 'Jun 10, 2025' },
    { id: 'ic2', name: 'Linda Hargrove', verified: true, message: 'Verified coverage for specialist referral.', location: 'North Austin', assignee: 'Front desk AI', date: '10:03 AM' },
  ],
  'Treatment related': [
    { id: 'tr1', name: 'Priya Nair', message: 'Asked about pre-visit instructions for procedure.', location: 'South Austin', assignee: 'Front desk AI', date: '08:52 AM' },
    { id: 'tr2', name: 'Marcus Thompson', verified: true, message: 'Questions about recovery timeline after treatment.', location: 'North Austin', assignee: 'Front desk AI', date: '09:14 AM' },
  ],
  Referrals: [
    { id: 'rf1', name: 'Yvonne Santos', message: 'Requested referral to specialist — process explained.', location: 'South Austin', assignee: 'Kelsy Hiltz', date: 'Jun 8, 2025' },
    { id: 'rf2', name: 'Derek Okafor', message: 'Asked how to submit external referral paperwork.', location: 'San Francisco', assignee: 'USA - Sales', date: 'Jun 10, 2025' },
  ],
  'General enquiry': [
    { id: 'ge1', name: 'Sofia Mendez', message: 'Asked about office location and parking.', location: 'North Austin', assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'ge2', name: 'Kevin Marsh', message: 'General question about clinic hours answered.', location: 'South Austin', assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  'Call attended': [
    { id: 'ca1', name: 'Tasha Winters', message: 'Human agent answered transferred call — issue resolved.', location: 'San Francisco', assignee: 'Kelsy Hiltz', date: 'Jun 10, 2025' },
    { id: 'ca2', name: 'Nathan Cruz', message: 'Staff picked up escalated billing call.', location: 'North Austin', assignee: 'Kelsy Hiltz', date: '10:58 AM' },
  ],
  'Call not attended': [
    { id: 'cna1', name: 'James Whitfield', message: 'Transferred call — no staff available to answer.', location: 'San Francisco', assignee: 'Front desk AI', date: 'Jun 9, 2025', unread: true },
    { id: 'cna2', name: 'Omar Farouk', message: 'Transfer attempted — call went to voicemail.', location: 'North Austin', assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  'Follow up': [
    { id: 'fu1', name: 'Ray Castellano', message: 'Follow-up scheduled — awaiting patient callback.', location: 'South Austin', assignee: 'USA - Sales', date: '09:41 AM', unread: true },
    { id: 'fu2', name: 'Grace Liu', message: 'Pending follow-up on incomplete intake form.', location: 'San Francisco', assignee: 'Kelsy Hiltz', date: 'Jun 10, 2025', unread: true },
    { id: 'fu3', name: 'Derek Okafor', message: 'Reminder sent — patient has not confirmed appointment.', location: 'San Francisco', assignee: 'USA - Sales', date: 'Jun 10, 2025' },
  ],
  'Incomplete interaction': [
    { id: 'ii1', name: 'Kevin Marsh', message: 'Call disconnected before the agent could finish assisting.', location: 'South Austin', assignee: 'Front desk AI', date: 'Jun 9, 2025', unread: true },
    { id: 'ii2', name: 'James Whitfield', message: 'Webchat session abandoned mid-conversation.', location: 'San Francisco', assignee: 'USA - Sales', date: 'Jun 9, 2025' },
  ],
  Other: [
    { id: 'ot1', name: 'Unknown caller', message: 'Wrong number — caller reached the practice by mistake.', location: 'North Austin', assignee: 'Front desk AI', date: 'Jun 8, 2025' },
    { id: 'ot2', name: 'Vendor line', message: 'Inbound sales call not related to patient care.', location: 'South Austin', assignee: 'Front desk AI', date: 'Jun 7, 2025' },
  ],
  'Call disconnected': [
    { id: 'cd1', name: 'Kevin Marsh', message: 'Patient hung up while on hold.', location: 'South Austin', assignee: 'Front desk AI', date: 'Jun 9, 2025', unread: true },
    { id: 'cd2', name: 'Todd Bergman', message: 'Call dropped during insurance verification.', location: 'North Austin', assignee: 'Kelsy Hiltz', date: 'Jun 8, 2025' },
  ],
  Abandoned: [
    { id: 'ab1', name: 'James Whitfield', message: 'Patient closed the webchat before sending a message.', location: 'San Francisco', assignee: 'USA - Sales', date: 'Jun 9, 2025' },
    { id: 'ab2', name: 'Alicia Park', message: 'Text thread abandoned after the first automated reply.', location: 'San Francisco', assignee: 'USA - Sales', date: 'Jun 8, 2025', unread: true },
  ],
  'Wrong numbers': [
    { id: 'wn1', name: 'Unknown caller', message: 'Caller dialed the wrong clinic number.', location: 'North Austin', assignee: 'Front desk AI', date: 'Jun 8, 2025' },
  ],
  'Sales calls': [
    { id: 'sc1', name: 'Vendor line', message: 'Outbound vendor pitch routed to front desk.', location: 'South Austin', assignee: 'Front desk AI', date: 'Jun 7, 2025' },
  ],
  'Human resources': [
    { id: 'hr1', name: 'Job applicant', message: 'Caller asked about open positions at the practice.', location: 'San Francisco', assignee: 'USA - Sales', date: 'Jun 6, 2025' },
  ],
  'Consultation related': [
    { id: 'cr1', name: 'Marcus Thompson', message: 'Asked about booking a financial consultation.', location: 'North Austin', assignee: 'Front desk AI', date: 'Jun 10, 2025', unread: true },
  ],
  'Account / balance inquiry': [
    { id: 'abi1', name: 'Priya Nair', message: 'Requested current account balance and recent transactions.', location: 'South Austin', assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  'Product / rate info': [
    { id: 'pri1', name: 'Derek Okafor', message: 'Asked about loan rates and product eligibility.', location: 'San Francisco', assignee: 'USA - Sales', date: 'Jun 10, 2025' },
  ],
  'Application status': [
    { id: 'as1', name: 'Sofia Mendez', message: 'Checking status of a submitted application.', location: 'North Austin', assignee: 'Front desk AI', date: 'Jun 9, 2025', unread: true },
  ],
  'Listing / property info': [
    { id: 'lpi1', name: 'Brianna Cole', message: 'Asked for details on a listed property.', location: 'South Austin', assignee: 'Front desk AI', date: 'Jun 10, 2025' },
  ],
  'Pricing and offer inquiry': [
    { id: 'poi1', name: 'Nathan Cruz', message: 'Requested pricing guidance for a pending offer.', location: 'North Austin', assignee: 'Kelsy Hiltz', date: 'Jun 9, 2025' },
  ],
  'Application / leasing process': [
    { id: 'alp1', name: 'Yvonne Santos', message: 'Asked about steps in the leasing application process.', location: 'South Austin', assignee: 'Kelsy Hiltz', date: 'Jun 8, 2025' },
  ],
  'Unit availability and pricing': [
    { id: 'uap1', name: 'Grace Liu', message: 'Checked availability and monthly rate for a 10x10 unit.', location: 'San Francisco', assignee: 'Kelsy Hiltz', date: 'Jun 10, 2025', unread: true },
  ],
  'Access / gate code': [
    { id: 'agc1', name: 'Ray Castellano', message: 'Needed help with gate access after hours.', location: 'South Austin', assignee: 'USA - Sales', date: 'Jun 9, 2025' },
  ],
  'Sales enquiry': [
    { id: 'se1', name: 'Tasha Winters', message: 'Inquired about catering packages for a group event.', location: 'San Francisco', assignee: 'Kelsy Hiltz', date: 'Jun 10, 2025' },
  ],
  'Service quote / estimate': [
    { id: 'sqe1', name: 'Omar Farouk', message: 'Requested a service estimate before booking.', location: 'North Austin', assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  'Warranty inquiry': [
    { id: 'wi1', name: 'Linda Hargrove', message: 'Asked whether a repair is covered under warranty.', location: 'North Austin', assignee: 'Front desk AI', date: 'Jun 8, 2025' },
  ],
  'Vehicle status update': [
    { id: 'vsu1', name: 'Todd Bergman', message: 'Called for an update on vehicle service progress.', location: 'North Austin', assignee: 'Kelsy Hiltz', date: 'Jun 8, 2025', unread: true },
  ],
  'Parts availability': [
    { id: 'pa1', name: 'Alicia Park', message: 'Asked if a replacement part is in stock.', location: 'San Francisco', assignee: 'USA - Sales', date: 'Jun 7, 2025' },
  ],
  'Quote / estimate request': [
    { id: 'qer1', name: 'Marcus Thompson', message: 'Requested a home service quote for HVAC repair.', location: 'North Austin', assignee: 'Front desk AI', date: 'Jun 10, 2025', unread: true },
  ],
  'Service area / availability': [
    { id: 'saa1', name: 'Priya Nair', message: 'Asked whether service is available in their zip code.', location: 'South Austin', assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
}

function getFunnelNodeConversations(nodeName: string, industry: FrontDeskIndustryId): FunnelConversation[] {
  const direct = CONVERSATIONS_BY_NODE[nodeName]
  const raw = direct?.length
    ? direct
    : [
        {
          id: `fb-${nodeName.replace(/\s+/g, '-').toLowerCase()}-1`,
          name: 'Sample contact',
          message: `Conversation classified under ${nodeName}.`,
          location: 'North Austin',
          assignee: 'Front desk AI',
          date: 'Jun 10, 2025',
          unread: true,
        },
        {
          id: `fb-${nodeName.replace(/\s+/g, '-').toLowerCase()}-2`,
          name: 'Sample contact',
          message: `Another session routed to ${nodeName}.`,
          location: 'South Austin',
          assignee: 'USA - Sales',
          date: 'Jun 9, 2025',
        },
      ]

  return raw.map((convo) => ({
    ...convo,
    message: applyAudienceCopy(convo.message, industry),
  }))
}

function getChatMessages(convoId: string, industry: FrontDeskIndustryId): ChatMsg[] {
  const messages = CHAT_BY_CONVO[convoId] ?? DEFAULT_CHAT
  return messages.map((msg) => ({
    ...msg,
    text: applyAudienceCopy(msg.text, industry),
  }))
}

// ─── Healthcare chart card ────────────────────────────────────────────────────

function HCCard(props: React.ComponentProps<typeof ChartCard>) {
  return <ChartCard {...props} />
}

const DATE_RANGE_OPTIONS = ['Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'Last 12 months', 'Custom']

const SUMMARY_STATS = [
  { id: 'sessions-involved', value: '1,350', label: 'Sessions involved', delta: '70%', trend: 'up' as const },
  { id: 'sessions-resolved', value: '905', label: 'Sessions resolved' },
  { id: 'resolution-rate', value: '67%', label: 'Resolution rate' },
  { id: 'time-saved', value: '113 hrs', label: 'Time saved' },
]

const CHANNEL_TREND_SERIES: BarSeries[] = [
  { key: 'call', label: 'Call', color: '#1976d2' },
  { key: 'text', label: 'Text', color: '#7e57c2' },
  { key: 'webchat', label: 'Webchat', color: '#ce93d8' },
]

const UNIQUE_PATIENTS_TREND = [
  { month: 'Feb', call: 48, text: 24, webchat: 8 },
  { month: 'Mar', call: 52, text: 26, webchat: 8 },
  { month: 'Apr', call: 49, text: 25, webchat: 8 },
  { month: 'May', call: 54, text: 27, webchat: 9 },
  { month: 'Jun', call: 51, text: 26, webchat: 8 },
  { month: 'Jul', call: 58, text: 29, webchat: 10 },
]

const SESSIONS_TREND = [
  { month: 'Feb', call: 67, text: 33, webchat: 11 },
  { month: 'Mar', call: 72, text: 36, webchat: 12 },
  { month: 'Apr', call: 69, text: 35, webchat: 11 },
  { month: 'May', call: 76, text: 38, webchat: 12 },
  { month: 'Jun', call: 71, text: 36, webchat: 12 },
  { month: 'Jul', call: 81, text: 40, webchat: 14 },
]

const RATING_TREND = [
  { label: 'Feb', value: 3.9 },
  { label: 'Mar', value: 4.0 },
  { label: 'Apr', value: 4.1 },
  { label: 'May', value: 4.2 },
  { label: 'Jun', value: 4.4 },
  { label: 'Jul', value: 4.5 },
]

const WORKING_HOURS_SERIES: BarSeries[] = [
  { key: 'officeHours', label: 'Office hours', color: '#7e57c2' },
  { key: 'afterHours', label: 'After hours', color: '#c4b5fd' },
]

const SESSIONS_TIMING_TREND = [
  { month: 'Feb', officeHours: 330, afterHours: 55 },
  { month: 'Mar', officeHours: 480, afterHours: 80 },
  { month: 'Apr', officeHours: 468, afterHours: 78 },
  { month: 'May', officeHours: 630, afterHours: 105 },
  { month: 'Jun', officeHours: 618, afterHours: 103 },
  { month: 'Jul', officeHours: 810, afterHours: 135 },
]

const CHANNEL_SESSIONS_DONUT = [
  { name: 'Call', value: 600, color: '#1976d2' },
  { name: 'Text', value: 300, color: '#7e57c2' },
  { name: 'Webchat', value: 100, color: '#ce93d8' },
]

function ChartInlineDropdown({
  value,
  options,
  onChange,
  prefix = '- ',
  accentValue = false,
  align = 'left',
  buttonClassName,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
  prefix?: string
  accentValue?: boolean
  align?: 'left' | 'right'
  buttonClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={buttonClassName ?? 'flex items-center gap-xs text-[16px] leading-6 tracking-[-0.32px] hover:opacity-90'}
      >
        {prefix ? <span className="text-text-primary">{prefix}</span> : null}
        <span className={accentValue ? 'text-primary' : 'text-text-primary'}>{value}</span>
        <ChevronDown
          className={`size-4 ${accentValue ? 'text-primary' : 'text-text-icon'}`}
          strokeWidth={1.6}
          absoluteStrokeWidth
        />
      </button>
      {open && (
        <ChecklistDropdownPanel
          options={options}
          value={value}
          onSelect={(option) => {
            onChange(option)
            setOpen(false)
          }}
          align={align}
        />
      )}
    </div>
  )
}

function OutcomeTitleDropdown({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return <ChartInlineDropdown value={value} options={options} onChange={onChange} accentValue />
}

const LOCATION_DIMENSION_OPTIONS = ['Channel', 'Status', 'Outcomes', 'Sub-outcomes']
const LOCATION_GROUPING_OPTIONS = ['By cities', 'By regions']

const CLINIC_REGION: Record<string, string> = {
  'North Clinic': 'Northeast',
  'South Clinic': 'Southeast',
  'Downtown Clinic': 'Midwest',
  'East Clinic': 'Southwest',
  'West Clinic': 'West Coast',
  'Uptown Clinic': 'Pacific Northwest',
}

function aggregateLocationRows(
  data: LocationBreakdownRow[],
  getGroupKey: (location: string) => string,
): LocationBreakdownRow[] {
  const buckets = new Map<string, LocationBreakdownRow>()

  data.forEach((row) => {
    const group = getGroupKey(String(row.location))
    const existing = buckets.get(group)
    if (!existing) {
      const next: LocationBreakdownRow = { location: group, total: 0 }
      Object.entries(row).forEach(([key, value]) => {
        if (key !== 'location' && typeof value === 'number') next[key] = 0
      })
      buckets.set(group, next)
    }

    const bucket = buckets.get(group)!
    Object.entries(row).forEach(([key, value]) => {
      if (key !== 'location' && typeof value === 'number') {
        bucket[key] = Number(bucket[key] ?? 0) + value
      }
    })
  })

  return Array.from(buckets.values())
}

function withLocationLabel<T extends LocationBreakdownRow>(
  columns: Column<T>[],
  label: string,
): Column<T>[] {
  return columns.map((column, index) => (index === 0 ? { ...column, label } : column))
}

function getLocationBreakdownTable(
  industry: FrontDeskIndustryId,
  dimension: string,
  grouping: string,
) {
  const table = getLocationBreakdownForIndustry(industry, dimension)
  let { columns, data } = table

  if (grouping === 'By regions') {
    data = aggregateLocationRows(data, (location) => CLINIC_REGION[location] ?? 'Other')
    columns = withLocationLabel(columns, 'Region')
  } else {
    columns = withLocationLabel(columns, 'City')
  }

  return { columns, data }
}

function IndustrySwitcher({
  value,
  onChange,
}: {
  value: FrontDeskIndustryId
  onChange: (value: FrontDeskIndustryId) => void
}) {
  return (
    <div className="fixed bottom-xl right-2xl z-50 flex max-w-[min(100vw-2rem,920px)] items-center gap-xs overflow-x-auto rounded-sm border border-border-selected bg-surface p-xs shadow-dropdown">
      {FRONT_DESK_INDUSTRY_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`flex h-7 shrink-0 items-center rounded-sm px-md text-body ${
            value === option.id ? 'bg-surface-selected text-text-primary' : 'text-text-icon hover:bg-surface-hover'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

const INSURANCES_VERIFIED_TREND = [
  { label: 'Dec', value: 464, color: '#1976d2' },
  { label: 'Jan', value: 194, color: '#1976d2' },
  { label: 'Feb', value: 288, color: '#1976d2' },
  { label: 'Mar', value: 178, color: '#1976d2' },
  { label: 'Apr', value: 461, color: '#1976d2' },
  { label: 'May', value: 297, color: '#1976d2' },
]

// ─── Chat messages per conversation id ───────────────────────────────────────

interface ChatMsg { id: string; sender: 'customer' | 'agent'; text: string; time: string }

const CHAT_BY_CONVO: Record<string, ChatMsg[]> = {
  v1: [
    { id: '1', sender: 'customer', text: "Hi, I'm calling to check if you accept my insurance plan.", time: '10:01 AM' },
    { id: '2', sender: 'agent', text: "I can help with that. Which insurance provider do you have?", time: '10:02 AM' },
    { id: '3', sender: 'customer', text: "Blue Cross PPO — I need to book a new patient visit.", time: '10:02 AM' },
    { id: '4', sender: 'agent', text: "Yes, we're in-network. I can schedule you for next week.", time: '10:03 AM' },
  ],
  t1: [
    { id: '1', sender: 'customer', text: 'Hey, can I reschedule my 2pm to Friday instead?', time: '11:20 AM' },
    { id: '2', sender: 'agent', text: 'Of course! Friday at 2pm is available. Shall I confirm?', time: '11:21 AM' },
    { id: '3', sender: 'customer', text: 'Yes please!', time: '11:21 AM' },
    { id: '4', sender: 'agent', text: 'Done — rescheduled to Fri 2pm.', time: '11:22 AM' },
  ],
  h1: [
    { id: '1', sender: 'customer', text: "I have a billing question that I couldn't resolve online.", time: '09:38 AM' },
    { id: '2', sender: 'agent', text: "I'll connect you with our billing team right away.", time: '09:39 AM' },
    { id: '3', sender: 'customer', text: 'Thank you, I have been waiting for a callback.', time: '09:40 AM' },
    { id: '4', sender: 'agent', text: 'Transferring now — a billing specialist will assist you.', time: '09:41 AM' },
  ],
  p1: [
    { id: '1', sender: 'customer', text: 'I submitted my referral paperwork last week. Any update?', time: '09:38 AM' },
    { id: '2', sender: 'agent', text: 'Checking with the team — this requires staff review.', time: '09:39 AM' },
    { id: '3', sender: 'customer', text: "Okay, I'll wait.", time: '09:40 AM' },
    { id: '4', sender: 'agent', text: "We'll follow up within 24 hours.", time: '09:41 AM' },
  ],
}

const DEFAULT_CHAT: ChatMsg[] = [
  { id: '1', sender: 'customer', text: 'Hi, I had a question about my appointment.', time: '09:00 AM' },
  { id: '2', sender: 'agent', text: 'Of course! How can I help you today?', time: '09:01 AM' },
  { id: '3', sender: 'customer', text: 'I wanted to confirm the details.', time: '09:02 AM' },
  { id: '4', sender: 'agent', text: "Everything looks good on our end. You're all set!", time: '09:03 AM' },
]

const opts = (...labels: string[]) => labels.map((l) => ({ value: l.toLowerCase().replace(/\s+/g, '-'), label: l }))

const FILTER_FIELDS: FilterField[] = [
  { id: 'region', label: 'Region', options: opts('Northeast', 'Southeast', 'Midwest', 'Southwest', 'West Coast', 'Pacific Northwest') },
  { id: 'division', label: 'Division', options: opts('Division A', 'Division B', 'Division C', 'Division D', 'Division E') },
  { id: 'city', label: 'City', options: opts('Austin', 'San Francisco', 'Phoenix', 'Denver', 'Seattle', 'Dallas', 'Houston', 'Chicago') },
  { id: 'zip', label: 'Zip', options: opts('78701', '78702', '94102', '85001', '80201', '98101', '75201', '60601') },
  { id: 'outcome', label: 'Outcome', options: opts('Scheduled', 'Rescheduled', 'Cancelled', 'Information provided', 'Human transfer', 'Action pending') },
  { id: 'content-manager', label: 'Content manager', options: opts('Kelsy Hiltz', 'Marcus Webb', 'Priya Nair', 'Sofia Mendez', 'Derek Okafor') },
  { id: 'social-manager', label: 'Social manager', options: opts('Tasha Winters', 'Omar Farouk', 'Brianna Cole', 'Nathan Cruz', 'Linda Hargrove') },
  { id: 'area-code', label: 'Area code', options: opts('512', '415', '602', '303', '206', '214', '713', '312') },
  { id: 'region-manager', label: 'Region manager', options: opts('James Whitfield', 'Ray Castellano', 'Ana Reyes', 'David Park', 'Michelle Torres') },
  { id: 'room-custom', label: 'Room custom', options: opts('Exam Room 1', 'Exam Room 2', 'Consultation A', 'Consultation B', 'Waiting Bay') },
  { id: 'new-alpha-beta', label: 'New alpha beta test', options: opts('Alpha Group', 'Beta Group', 'Control Group', 'Pilot A', 'Pilot B') },
  { id: 'custom-test', label: 'Custom test', options: opts('Test Group A', 'Test Group B', 'Cohort 1', 'Cohort 2', 'Cohort 3') },
  { id: 'location', label: 'Location', options: opts('North Austin', 'South Austin', 'San Francisco', 'Phoenix, AZ', 'Denver, CO', 'Seattle, WA') },
  { id: 'conversation-status', label: 'Conversation status', options: opts('Open', 'Closed', 'Pending', 'Escalated', 'Unread') },
  { id: 'assigned-to', label: 'Assigned to', options: opts('Front desk AI', 'Kelsy Hiltz', 'USA - Sales', 'Marcus Webb', 'Ana Reyes', 'Unassigned') },
  { id: 'time-period', label: 'Time period', options: opts('Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'Last 12 months') },
  { id: 'last-incoming-channel', label: 'Last incoming message (Channel)', options: opts('Voice', 'Text', 'Webchat', 'Chat') },
]

interface HCFrontdeskOverviewScreenProps { isDental?: boolean }

export function HCFrontdeskOverviewScreen({ isDental: _isDental }: HCFrontdeskOverviewScreenProps) {
  const [dateRange, setDateRange] = useState('Last 6 months')
  const [filterOpen, setFilterOpen] = useState(false)
  const [savingsModalOpen, setSavingsModalOpen] = useState(false)
  const [savingsSettings, setSavingsSettings] = useState<EstimateSavingsValues>({
    mode: 'time',
    minutesPerResolution: 5,
    wageCurrency: 'USD',
    hourlyWage: 40,
  })
  const [nodeDrawer, setNodeDrawer] = useState<string | null>(null)
  const [selectedConvo, setSelectedConvo] = useState<FunnelConversation | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState<FrontDeskIndustryId>('healthcare')
  const [selectedOutcome, setSelectedOutcome] = useState('')
  const [locationDimension, setLocationDimension] = useState('Outcomes')
  const [locationGrouping, setLocationGrouping] = useState('By cities')
  const industryFunnel = useMemo(() => buildIndustryFunnel(selectedIndustry), [selectedIndustry])
  const outcomeTrendSeries = useMemo(() => getOutcomeTrendSeries(selectedIndustry), [selectedIndustry])
  const outcomeTrendData = useMemo(() => getOutcomeTrendData(selectedIndustry), [selectedIndustry])
  const outcomeWorkingHoursBreakdown = useMemo(
    () => getOutcomeWorkingHoursBreakdown(selectedIndustry),
    [selectedIndustry],
  )
  const outcomeTrendOptions = useMemo(() => getOutcomeTrendOptions(selectedIndustry), [selectedIndustry])
  const outcomeWorkingHoursTrendData = useMemo(
    () => buildOutcomeWorkingHoursTrend(selectedIndustry, selectedOutcome || outcomeTrendOptions[0] || ''),
    [selectedIndustry, selectedOutcome, outcomeTrendOptions],
  )
  const subOutcomeBreakdownColumns = useMemo(
    () =>
      getSubOutcomeBreakdownColumns(selectedIndustry).map((column) => {
        if (column.key === 'outcome' || column.key === 'total') return column
        return {
          ...column,
          render: (value: string | number) =>
            value === SUB_OUTCOME_EMPTY_CELL ? (
              <span className="text-text-secondary">{SUB_OUTCOME_EMPTY_CELL}</span>
            ) : (
              String(value ?? SUB_OUTCOME_EMPTY_CELL)
            ),
        }
      }),
    [selectedIndustry],
  )
  const subOutcomeBreakdownData = useMemo(
    () => getSubOutcomeBreakdownData(selectedIndustry),
    [selectedIndustry],
  )
  const locationTable = getLocationBreakdownTable(selectedIndustry, locationDimension, locationGrouping)
  const localize = useCallback((text: string) => applyAudienceCopy(text, selectedIndustry), [selectedIndustry])

  useEffect(() => {
    const options = getOutcomeTrendOptions(selectedIndustry)
    setSelectedOutcome(options[0] ?? '')
  }, [selectedIndustry])

  useEffect(() => {
    if (selectedConvo) {
      requestAnimationFrame(() => setDetailVisible(true))
    }
  }, [selectedConvo])

  function openDetail(convo: FunnelConversation) {
    setSelectedConvo(convo)
  }

  function closeDetail() {
    setDetailVisible(false)
    setTimeout(() => setSelectedConvo(null), 300)
  }

  const summaryStats = SUMMARY_STATS.map((stat) =>
    stat.id === 'time-saved'
      ? {
          ...stat,
          labelSuffix: (
            <button
              type="button"
              aria-label="Estimate savings"
              onClick={() => setSavingsModalOpen(true)}
              className="flex size-6 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <Icon name="tune" size={16} />
            </button>
          ),
        }
      : stat,
  )

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto bg-surface">
          <ReportHeader
            title="Front desk overview"
            subtitle={localize('Sessions across patient inquiries, appointments, and cost savings')}
            rightSlot={
              <div className="flex items-center gap-sm">
                <DateRangeSelector
                  value={dateRange}
                  options={DATE_RANGE_OPTIONS}
                  onChange={setDateRange}
                />
                <button
                  type="button"
                  aria-label="Filters"
                  onClick={() => setFilterOpen((o) => !o)}
                  className={`flex size-[34px] items-center justify-center rounded-md text-text-icon ${filterOpen ? 'bg-surface-selected' : 'border border-border-selected bg-surface hover:bg-surface-l2'}`}
                >
                  <ListFilter className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
                </button>
              </div>
            }
          />

          <div className="flex flex-col gap-lg p-2xl">
            <SummaryStats stats={summaryStats} />

            <HCCard
              title="Sessions funnel"
              tooltip="Traces sessions from the channel they started on, through resolution status and outcome, to the final sub-outcome."
              className="!min-h-0"
            >
              <SessionsFunnelSankey
                nodes={industryFunnel.nodes}
                links={industryFunnel.links}
                height={400}
                nodeColors={industryFunnel.nodeColors}
                columnHeaders={['Sessions by channel', 'Status', 'Outcome', 'Sub-outcome']}
                onNodeClick={(name) => setNodeDrawer(name)}
              />
            </HCCard>

            <HCCard
              title={localize('Unique patients trend by channel')}
              tooltip={localize('Monthly unique patients broken down by the channel where the session started.')}
              className="!min-h-0"
            >
              <StackedBarChart
                data={UNIQUE_PATIENTS_TREND}
                series={CHANNEL_TREND_SERIES}
                xKey="month"
                height={280}
                showBarLabels
                showStackTotalLabels
              />
            </HCCard>

            <HCCard
              title="Sessions trend by channel"
              tooltip="Monthly session volume broken down by the channel where the session started."
              className="!min-h-0"
            >
              <StackedBarChart
                data={SESSIONS_TREND}
                series={CHANNEL_TREND_SERIES}
                xKey="month"
                height={280}
                showBarLabels
                showStackTotalLabels
              />
            </HCCard>

            <div className="grid grid-cols-2 gap-lg">
              <HCCard
                title="Outcome trend"
                tooltip="Monthly session outcomes broken down by resolution type."
                className="!min-h-0"
              >
                <StackedBarChart
                  data={outcomeTrendData}
                  series={outcomeTrendSeries}
                  xKey="month"
                  height={280}
                  showBarLabels
                  showStackTotalLabels
                />
              </HCCard>

              <HCCard
                title="Rating trend"
                tooltip={localize('Average patient satisfaction rating from post-session surveys.')}
                className="!min-h-0"
              >
                <div className="mb-lg">
                  <div className="flex items-end gap-xs">
                    <span className="text-h3 font-normal text-text-primary">4.5</span>
                    <span className="text-h3 leading-none" style={{ color: '#f59e0b' }}>★</span>
                  </div>
                  <p className="text-small text-text-secondary">Average rating</p>
                </div>
                <TrendLineChart
                  data={RATING_TREND}
                  height={240}
                  color="#7e57c2"
                  yDomain={[0, 5]}
                  yTicks={[0, 2, 5]}
                  tooltipLabel="Average rating"
                />
              </HCCard>
            </div>

            <div className="grid grid-cols-2 gap-lg">
              <HCCard
                title="Sessions timing trend"
                tooltip="Monthly session volume during office hours compared to after hours."
                className="!min-h-0"
              >
                <StackedBarChart
                  data={SESSIONS_TIMING_TREND}
                  series={WORKING_HOURS_SERIES}
                  xKey="month"
                  height={280}
                  showBarLabels
                />
              </HCCard>

              <HCCard
                title="Sessions outcome breakdown by working hours"
                tooltip="Session outcomes from the funnel, split by office hours and after hours."
                className="!min-h-0"
              >
                <WorkingHoursBreakdownChart
                  data={outcomeWorkingHoursBreakdown}
                  officeColor="#7e57c2"
                  afterColor="#c4b5fd"
                  height={280}
                />
              </HCCard>
            </div>

            <HCCard
              title="Sessions outcome trend analysis"
              titleSuffix={
                <div className="flex items-center gap-xs">
                  <OutcomeTitleDropdown
                    value={selectedOutcome}
                    options={outcomeTrendOptions}
                    onChange={setSelectedOutcome}
                  />
                  <InfoTooltip text="Monthly session trend for the selected outcome, split by office hours and after hours." />
                </div>
              }
              className="!min-h-0"
            >
              <StackedBarChart
                data={outcomeWorkingHoursTrendData}
                series={WORKING_HOURS_SERIES}
                xKey="month"
                height={280}
                showBarLabels
                showStackTotalLabels
              />
            </HCCard>

            <HCCard
              title="Sessions sub-outcome breakdown by outcome"
              tooltip="Session counts by outcome and sub-outcome from the funnel for the selected period."
              className="!min-h-0"
            >
              <DataTable
                columns={subOutcomeBreakdownColumns}
                data={subOutcomeBreakdownData}
                scrollOnHover
                stickyFirstColumn
              />
            </HCCard>

            <HCCard
              title="Sessions by channel"
              tooltip="Share of sessions by the channel where the conversation started."
              className="!min-h-0"
            >
              <ChartStatRow
                stats={[
                  { value: '600', label: 'Call' },
                  { value: '300', label: 'Text' },
                  { value: '100', label: 'Webchat' },
                ]}
              />
              <DonutChart
                data={CHANNEL_SESSIONS_DONUT}
                centerValue="1K"
                centerLabel="Total sessions"
                height={280}
              />
            </HCCard>

            <HCCard
              title="Sessions by location"
              titleSuffix={
                <div className="flex items-center gap-xs">
                  <ChartInlineDropdown
                    value={locationDimension}
                    options={LOCATION_DIMENSION_OPTIONS}
                    onChange={setLocationDimension}
                    accentValue
                  />
                  <InfoTooltip text="Session counts by location, broken down by the selected funnel dimension." />
                </div>
              }
              toolbar={
                <ChartInlineDropdown
                  value={locationGrouping}
                  options={LOCATION_GROUPING_OPTIONS}
                  onChange={setLocationGrouping}
                  prefix=""
                  align="right"
                  buttonClassName="flex h-[34px] items-center gap-sm rounded-md border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
                />
              }
              className="!min-h-0"
            >
              <DataTable
                columns={locationTable.columns}
                data={locationTable.data}
                scrollOnHover
              />
            </HCCard>

            <HCCard
              title="Insurances verified"
              tooltip="Insurance verifications completed each month and overall verification rate."
              className="!min-h-0"
            >
              <ChartStatRow
                stats={[
                  { value: '1.2K', label: 'Total verified' },
                  { value: '94.2%', label: 'Verification rate' },
                ]}
              />
              <RatingBarChart data={INSURANCES_VERIFIED_TREND} height={280} />
            </HCCard>
          </div>
        </div>

        <FilterPanel
          open={filterOpen}
          fields={FILTER_FIELDS}
          onClose={() => setFilterOpen(false)}
          onAdvancedFilters={() => {}}
        />
      </div>

      <IndustrySwitcher value={selectedIndustry} onChange={setSelectedIndustry} />

      <EstimateSavingsModal
        open={savingsModalOpen}
        onClose={() => setSavingsModalOpen(false)}
        initialValues={savingsSettings}
        onSave={(values) => {
          setSavingsSettings(values)
          setSavingsModalOpen(false)
        }}
      />

      {/* List drawer */}
      {nodeDrawer !== null && (
        <>
          <div className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm" onClick={() => { closeDetail(); setTimeout(() => setNodeDrawer(null), 300) }} />
          <div className="fixed right-2 top-2 z-[80] flex h-[calc(100%-16px)] w-[650px] flex-col overflow-hidden rounded-2xl bg-surface shadow-modal">
            <div className="flex items-center justify-between px-2xl py-lg">
              <div className="flex items-center gap-sm">
                <button type="button" onClick={() => setNodeDrawer(null)} className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover">
                  <ArrowLeft className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
                </button>
                <span className="text-h3 text-text-primary">{nodeDrawer}</span>
              </div>
              <span className="text-small text-text-tertiary">
                {getFunnelNodeConversations(nodeDrawer, selectedIndustry).length} conversations
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-sm py-sm">
              {getFunnelNodeConversations(nodeDrawer, selectedIndustry).map((convo) => (
                <button
                  key={convo.id}
                  type="button"
                  onClick={() => openDetail(convo)}
                  className={`flex w-full flex-col gap-xs rounded-md px-md py-md text-left transition-colors ${selectedConvo?.id === convo.id ? 'bg-[#dbeafe]' : 'hover:bg-surface-hover'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-xs">
                      {convo.unread && <span className="size-[6px] shrink-0 rounded-full bg-primary" />}
                      <span className="text-body text-text-primary">{convo.name}</span>
                      {convo.verified && <Flame className="size-4 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />}
                    </div>
                    <span className="shrink-0 text-small text-text-secondary">{convo.date}</span>
                  </div>
                  {(() => {
                    const msgs = getChatMessages(convo.id, selectedIndustry)
                    const last = msgs[msgs.length - 1]
                    const preview = last.sender === 'agent' ? `Agent: ${last.text}` : last.text
                    return <span className="truncate text-small text-text-secondary">{preview}</span>
                  })()}
                  <div className="flex items-center gap-xs text-small text-text-tertiary">
                    <span>{convo.location}</span>
                    {convo.assignee && (
                      <>
                        <span>•</span>
                        <Users className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
                        <span>{convo.assignee}</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Detail drawer */}
      {selectedConvo !== null && (
        <div className={`fixed right-2 top-2 z-[90] flex h-[calc(100%-16px)] w-[650px] flex-col overflow-hidden rounded-2xl bg-surface shadow-modal transition-transform duration-300 ease-in-out ${detailVisible ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'}`}>
          <div className="flex items-center justify-between px-2xl py-lg">
            <div className="flex items-center gap-sm">
              <button type="button" onClick={closeDetail} className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover">
                <ArrowLeft className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
              <span className="text-h3 text-text-primary">{selectedConvo.name}</span>
              {selectedConvo.verified && <Flame className="size-4 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />}
            </div>
            <div className="flex items-center gap-md">
              <button type="button" className="flex items-center gap-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ai-summary">
                  <Icon name="auto_awesome" size={16} className="text-ai-brand" />
                </span>
                <span className="text-body text-text-primary">{selectedConvo.assignee ?? 'Front desk agent - North region'}</span>
                <ChevronDown className="size-4 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
              <button type="button" className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover">
                <MoreVertical className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-md overflow-y-auto px-2xl py-lg">
            <div className="flex items-center justify-center">
              <span className="text-small text-text-secondary">Thu • Jun 10</span>
            </div>
            {getChatMessages(selectedConvo.id, selectedIndustry).map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'agent' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[70%] rounded-lg px-md py-sm ${
                  msg.sender === 'agent'
                    ? 'bg-[#dbeafe] text-body text-text-primary'
                    : 'bg-[#f0f0f0] text-body text-text-primary'
                }`}>
                  <span>{msg.text}</span>
                </div>
                <span className="mt-xs text-small text-text-secondary">{msg.time}</span>
              </div>
            ))}
          </div>

          <div className="p-2xl">
            <div className="rounded-md border border-border p-md">
              <button type="button" className="mb-sm flex items-center gap-xs text-body text-text-action">
                Text
                <ChevronDown className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
              <div className="mb-md min-h-[48px]">
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message or use a template"
                  className="w-full resize-none bg-transparent text-body text-text-primary outline-none placeholder:text-text-secondary"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md text-text-icon">
                  <button type="button" className="flex size-5 items-center justify-center hover:text-text-primary"><LayoutList className="size-5" strokeWidth={1.6} absoluteStrokeWidth /></button>
                  <button type="button" className="flex size-5 items-center justify-center hover:text-text-primary"><DollarSign className="size-5" strokeWidth={1.6} absoluteStrokeWidth /></button>
                  <button type="button" className="flex size-5 items-center justify-center hover:text-text-primary"><Paperclip className="size-5" strokeWidth={1.6} absoluteStrokeWidth /></button>
                  <button type="button" className="flex size-5 items-center justify-center hover:text-text-primary"><Smile className="size-5" strokeWidth={1.6} absoluteStrokeWidth /></button>
                </div>
                <div className="flex items-center">
                  <button type="button" className="flex h-9 items-center rounded-l-sm bg-primary px-lg text-body text-white hover:bg-primary-hover">Send</button>
                  <button type="button" className="flex h-9 items-center justify-center rounded-r-sm border-l border-white/30 bg-primary px-sm text-white hover:bg-primary-hover">
                    <ChevronDown className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
