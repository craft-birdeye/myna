import React, { useState, useEffect } from 'react'
import {
  Icon,
  ChartCard,
  ChartStatRow,
  DataTable,
  DateRangeSelector,
  FilterPanel,
  type FilterField,
  DonutChart,
  ReportHeader,
  SankeyChart,
  StackedBarChart,
  SummaryStats,
  TopNav,
  type Column,
  type SankeyLink,
  type SankeyNode,
} from '../components'

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
  'Webchat': [
    { id: 'w1', name: 'Marcus Thompson',  verified: true,  message: 'Interested in scheduling a test drive for the 2024 F-150', location: 'North Austin',  assignee: 'Front desk AI', date: '09:14 AM', unread: true },
    { id: 'w2', name: 'Priya Nair',                        message: 'Can I book a service appointment for this Saturday?',       location: 'South Austin',  assignee: 'Front desk AI', date: '08:52 AM', unread: true },
    { id: 'w3', name: 'Derek Okafor',                      message: 'What are your current lease offers on the Tacoma?',         location: 'San Francisco', assignee: 'USA - Sales',  date: 'Jun 10, 2025' },
    { id: 'w4', name: 'Sofia Mendez',                      message: 'I filled out the online form — waiting for a callback.',    location: 'North Austin',  assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'w5', name: 'James Whitfield',                   message: 'Looking for a used SUV under $35k.',                        location: 'San Francisco', assignee: 'USA - Sales',  date: 'Jun 9, 2025' },
  ],
  'Voice': [
    { id: 'v1', name: 'Linda Hargrove',   verified: true,  message: 'Called in — asking about oil change availability today.',   location: 'North Austin',  assignee: 'Front desk AI', date: '10:03 AM', unread: true },
    { id: 'v2', name: 'Ray Castellano',                    message: 'Voicemail: needs a callback re: financing pre-approval.',   location: 'South Austin',  assignee: 'USA - Sales',  date: '09:41 AM', unread: true },
    { id: 'v3', name: 'Tasha Winters',                     message: 'Spoke with agent — scheduled for tire rotation Thu.',       location: 'San Francisco', assignee: 'Kelsy Hiltz',  date: 'Jun 10, 2025' },
    { id: 'v4', name: 'Omar Farouk',                       message: 'Robin: Was your question answered?',                        location: 'North Austin',  assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  'Text': [
    { id: 't1', name: 'Brianna Cole',                      message: 'Hey, can I reschedule my 2pm to Friday instead?',           location: 'South Austin',  assignee: 'Front desk AI', date: '11:22 AM', unread: true },
    { id: 't2', name: 'Nathan Cruz',                       message: 'Texted back — confirmed appointment for Mon at 10am.',      location: 'North Austin',  assignee: 'Kelsy Hiltz',  date: '10:58 AM' },
    { id: 't3', name: 'Alicia Park',    verified: true,    message: 'Is the 2023 Civic still available? Saw it on your site.',   location: 'San Francisco', assignee: 'USA - Sales',  date: 'Jun 10, 2025' },
    { id: 't4', name: 'Kevin Marsh',                       message: 'Robin: Was your question answered?',                        location: 'South Austin',  assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  'Email': [
    { id: 'e1', name: 'Grace Liu',                         message: 'Re: Service quote — attached invoice looks different.',     location: 'San Francisco', assignee: 'USA - Sales',  date: 'Jun 10, 2025', unread: true },
    { id: 'e2', name: 'Todd Bergman',                      message: 'Inquiry about extended warranty options for my Silverado.', location: 'North Austin',  assignee: 'Front desk AI', date: 'Jun 9, 2025' },
    { id: 'e3', name: 'Yvonne Santos',                     message: 'Can you email me the full service history for my vehicle?', location: 'South Austin',  assignee: 'Kelsy Hiltz',  date: 'Jun 8, 2025' },
  ],
  'AI agents': [
    { id: 'ai1', name: 'Marcus Thompson', verified: true,  message: 'AI scheduled test drive for Jun 14 at 11am.',              location: 'North Austin',  assignee: 'Front desk AI', date: '09:14 AM', unread: true },
    { id: 'ai2', name: 'Priya Nair',                       message: 'Service appointment booked for Sat 9am — confirmed.',      location: 'South Austin',  assignee: 'Front desk AI', date: '08:52 AM', unread: true },
    { id: 'ai3', name: 'Brianna Cole',                     message: 'AI handled rescheduling — new slot: Fri 2pm.',             location: 'South Austin',  assignee: 'Front desk AI', date: '11:22 AM' },
    { id: 'ai4', name: 'Linda Hargrove',  verified: true,  message: 'Oil change walk-in slot confirmed via AI.',                location: 'North Austin',  assignee: 'Front desk AI', date: '10:03 AM' },
    { id: 'ai5', name: 'Nathan Cruz',                      message: 'Appointment reminder sent and acknowledged by customer.',  location: 'North Austin',  assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'ai6', name: 'Omar Farouk',                      message: 'AI resolved inquiry — FAQ response delivered.',            location: 'North Austin',  assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  'Human agents': [
    { id: 'h1', name: 'Ray Castellano',                    message: 'Transferred — financing pre-approval requires human.',     location: 'South Austin',  assignee: 'USA - Sales',  date: '09:41 AM', unread: true },
    { id: 'h2', name: 'Grace Liu',                         message: 'Escalated — invoice discrepancy needs manager review.',    location: 'San Francisco', assignee: 'Kelsy Hiltz',  date: 'Jun 10, 2025', unread: true },
    { id: 'h3', name: 'Derek Okafor',                      message: 'Lease negotiation in progress with sales advisor.',        location: 'San Francisco', assignee: 'USA - Sales',  date: 'Jun 10, 2025' },
    { id: 'h4', name: 'Yvonne Santos',                     message: 'Complex service history request — rep pulling records.',   location: 'South Austin',  assignee: 'Kelsy Hiltz',  date: 'Jun 8, 2025' },
  ],
  'Answered': [
    { id: 'an1', name: 'Marcus Thompson', verified: true,  message: 'Test drive confirmed for Jun 14 at 11am.',                 location: 'North Austin',  assignee: 'Front desk AI', date: '09:14 AM' },
    { id: 'an2', name: 'Priya Nair',                       message: 'Service appointment confirmed — Sat 9am.',                 location: 'South Austin',  assignee: 'Front desk AI', date: '08:52 AM' },
    { id: 'an3', name: 'Linda Hargrove',  verified: true,  message: 'Oil change walk-in confirmed — 10:30 AM today.',           location: 'North Austin',  assignee: 'Front desk AI', date: '10:03 AM' },
    { id: 'an4', name: 'Nathan Cruz',                      message: 'Appointment Mon 10am acknowledged by customer.',           location: 'North Austin',  assignee: 'Kelsy Hiltz',  date: 'Jun 10, 2025' },
    { id: 'an5', name: 'Tasha Winters',                    message: 'Tire rotation Thu at 2pm — customer confirmed.',           location: 'San Francisco', assignee: 'Front desk AI', date: 'Jun 10, 2025' },
  ],
  'Bookings': [
    { id: 'b1', name: 'Alicia Park',     verified: true,   message: 'New booking: test drive 2023 Civic — Jun 13 at 1pm.',     location: 'San Francisco', assignee: 'USA - Sales',  date: 'Jun 10, 2025', unread: true },
    { id: 'b2', name: 'Priya Nair',                        message: 'Booked: oil change + tire rotation — Sat 9am.',           location: 'South Austin',  assignee: 'Front desk AI', date: '08:52 AM' },
    { id: 'b3', name: 'Marcus Thompson',                   message: 'Test drive booking confirmed for Jun 14 at 11am.',        location: 'North Austin',  assignee: 'Front desk AI', date: '09:14 AM' },
    { id: 'b4', name: 'Kevin Marsh',                       message: 'Multi-point inspection booked for Jun 12.',               location: 'South Austin',  assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  'Rescheduled': [
    { id: 'r1', name: 'Brianna Cole',                      message: 'Rescheduled from Tue 2pm → Fri 2pm at customer request.', location: 'South Austin',  assignee: 'Front desk AI', date: '11:22 AM', unread: true },
    { id: 'r2', name: 'Todd Bergman',                      message: 'Service moved from Jun 8 to Jun 15 — parts delay.',       location: 'North Austin',  assignee: 'Kelsy Hiltz',  date: 'Jun 9, 2025' },
    { id: 'r3', name: 'Sofia Mendez',                      message: 'Appointment rescheduled — customer requested later time.',location: 'North Austin',  assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  'Cancellations': [
    { id: 'c1', name: 'James Whitfield',                   message: 'Cancelled test drive — no longer interested in SUV.',     location: 'San Francisco', assignee: 'USA - Sales',  date: 'Jun 9, 2025', unread: true },
    { id: 'c2', name: 'Omar Farouk',                       message: 'Service appointment cancelled — vehicle sold.',           location: 'North Austin',  assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  'Pending': [
    { id: 'p1', name: 'Ray Castellano',                    message: 'Awaiting callback confirmation from financing team.',     location: 'South Austin',  assignee: 'USA - Sales',  date: '09:41 AM', unread: true },
    { id: 'p2', name: 'Grace Liu',                         message: 'Pending manager review — invoice discrepancy open.',      location: 'San Francisco', assignee: 'Kelsy Hiltz',  date: 'Jun 10, 2025', unread: true },
    { id: 'p3', name: 'Derek Okafor',                      message: 'Lease quote pending — awaiting credit check result.',     location: 'San Francisco', assignee: 'USA - Sales',  date: 'Jun 10, 2025' },
    { id: 'p4', name: 'Yvonne Santos',                     message: 'Service history pull in progress — no response yet.',     location: 'South Austin',  assignee: 'Kelsy Hiltz',  date: 'Jun 8, 2025' },
  ],
}

// ─── Healthcare chart card ────────────────────────────────────────────────────

// Healthcare chart card — uses the tune icon for the left action button
function HCCard(props: React.ComponentProps<typeof ChartCard>) {
  return <ChartCard {...props} leftActionIcon="tune" />
}

const DATE_RANGE_OPTIONS = ['Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'Last 12 months', 'Custom']

const SUMMARY_STATS = [
  { id: 'responses',  value: '7.9K', label: 'Responses',           delta: '2%',    trend: 'down' as const },
  { id: 'bookings',   value: '1.5K', label: 'Total bookings',      delta: '16.6%', trend: 'up'   as const },
  { id: 'reschedule', value: '450',  label: 'Rescheduled',         delta: '30%',   trend: 'down' as const },
  { id: 'cancelled',  value: '25',   label: 'Cancelled',           delta: '20%',   trend: 'up'   as const },
  { id: 'verified',   value: '1.5K', label: 'Insurances verified', delta: '10%',   trend: 'down' as const },
]

// Funnel: Webchat/Voice/Text → AI agents/Human agents → Answered/Bookings/Rescheduled/Cancellations/Pending
// 0-2: channels, 3-4: handled by, 5-9: outcomes
const FUNNEL_NODES: SankeyNode[] = [
  { name: 'Webchat 44%' }, { name: 'Voice 28%' }, { name: 'Text 28%' },
  { name: 'AI agents 72%' }, { name: 'Human agents 28%' },
  { name: 'Answered 48%' }, { name: 'Bookings 18%' }, { name: 'Rescheduled 10%' }, { name: 'Cancellations 4%' }, { name: 'Pending 20%' },
]
const FUNNEL_LINKS: SankeyLink[] = [
  { source: 0, target: 3, value: 32 }, { source: 0, target: 4, value: 12 },
  { source: 1, target: 3, value: 22 }, { source: 1, target: 4, value: 8  },
  { source: 2, target: 3, value: 18 }, { source: 2, target: 4, value: 8  },
  { source: 3, target: 5, value: 38 }, { source: 3, target: 6, value: 13 },
  { source: 3, target: 7, value: 7  }, { source: 3, target: 8, value: 1  }, { source: 3, target: 9, value: 13 },
  { source: 4, target: 5, value: 10 }, { source: 4, target: 6, value: 5  },
  { source: 4, target: 7, value: 3  }, { source: 4, target: 8, value: 3  }, { source: 4, target: 9, value: 7  },
]

const OVERTIME_DATA = [
  { month: 'Dec 2023', resolved: 82, unresolved: 10 },
  { month: 'Jan 2024', resolved: 93, unresolved: 5  },
  { month: 'Feb',      resolved: 60, unresolved: 5  },
  { month: 'Mar',      resolved: 60, unresolved: 5  },
  { month: 'Apr',      resolved: 63, unresolved: 5  },
  { month: 'May',      resolved: 62, unresolved: 5  },
]
const OVERTIME_SERIES = [
  { key: 'unresolved', label: 'Unresolved', color: '#ef4444' },
  { key: 'resolved',   label: 'Resolved',   color: '#4cae3d' },
]

const SOURCE_DONUT = [
  { name: 'Link', value: 41.2, color: '#9c27b0' },
  { name: 'FAQ',  value: 32.5, color: '#f59e0b' },
  { name: 'File', value: 26.3, color: '#4cae3d' },
]

const CONV_OVERTIME_DATA = [
  { month: 'Dec 2023', agentResolved: 40, humanResolved: 20, unresolved: 10 },
  { month: 'Jan 2024', agentResolved: 30, humanResolved: 20, unresolved: 10 },
  { month: 'Feb',      agentResolved: 44, humanResolved: 20, unresolved: 10 },
  { month: 'Mar',      agentResolved: 36, humanResolved: 20, unresolved: 10 },
  { month: 'Apr',      agentResolved: 40, humanResolved: 10, unresolved: 10 },
  { month: 'May',      agentResolved: 35, humanResolved: 20, unresolved: 10 },
]
const CONV_OVERTIME_SERIES = [
  { key: 'agentResolved', label: 'Resolved by agents', color: '#4cae3d' },
  { key: 'humanResolved', label: 'Resolved by humans', color: '#1976d2' },
  { key: 'unresolved',    label: 'Unresolved',         color: '#ef4444' },
]

// Added Email as 4th segment
const CHANNEL_DONUT = [
  { name: 'Webchat', value: 36.0, color: '#9c27b0' },
  { name: 'Voice',   value: 48.0, color: '#3f51b5' },
  { name: 'Text',    value: 16.0, color: '#f59e0b' },
]

const INSURANCE_DATA = [
  { month: 'Dec', verified: 464 },
  { month: 'Jan', verified: 194 },
  { month: 'Feb', verified: 288 },
  { month: 'Mar', verified: 178 },
  { month: 'Apr', verified: 461 },
  { month: 'May', verified: 297 },
]
const INSURANCE_SERIES = [{ key: 'verified', label: 'Verified', color: '#1976d2' }]

interface LocationRow {
  location: string
  responses: number
  totalBookings: number
  rescheduled: number
  cancelled: number
  insurancesVerified: number
  [key: string]: string | number
}
const LOCATION_DATA: LocationRow[] = [
  { location: 'Atlanta, GA',  responses: 520, totalBookings: 100, rescheduled: 60, cancelled: 40, insurancesVerified: 40 },
  { location: 'Dallas, TX',   responses: 480, totalBookings: 90,  rescheduled: 23, cancelled: 4,  insurancesVerified: 4  },
  { location: 'Chicago, IL',  responses: 410, totalBookings: 80,  rescheduled: 18, cancelled: 22, insurancesVerified: 22 },
  { location: 'Miami, FL',    responses: 370, totalBookings: 70,  rescheduled: 2,  cancelled: 4,  insurancesVerified: 4  },
  { location: 'Phoenix, AZ',  responses: 320, totalBookings: 60,  rescheduled: 9,  cancelled: 10, insurancesVerified: 10 },
  { location: 'Austin, TX',   responses: 280, totalBookings: 50,  rescheduled: 11, cancelled: 12, insurancesVerified: 12 },
  { location: 'Denver, CO',   responses: 230, totalBookings: 40,  rescheduled: 13, cancelled: 14, insurancesVerified: 14 },
  { location: 'Seattle, WA',  responses: 180, totalBookings: 30,  rescheduled: 15, cancelled: 16, insurancesVerified: 16 },
]
const LOCATION_COLUMNS: Column<LocationRow>[] = [
  { key: 'location',           label: 'Location',            width: 200, sortable: true },
  { key: 'responses',          label: 'Responses',           width: 140, sortable: true },
  { key: 'totalBookings',      label: 'Total bookings',      width: 160, sortable: true },
  { key: 'rescheduled',        label: 'Rescheduled',         width: 160, sortable: true },
  { key: 'cancelled',          label: 'Cancelled',           width: 140, sortable: true },
  { key: 'insurancesVerified', label: 'Insurances verified', width: 180, sortable: true },
]

// ─── Chat messages per conversation id ───────────────────────────────────────

interface ChatMsg { id: string; sender: 'customer' | 'agent'; text: string; time: string }

const CHAT_BY_CONVO: Record<string, ChatMsg[]> = {
  ai1: [
    { id: '1', sender: 'customer', text: "Hi, I'd like to schedule a test drive for the 2024 F-150 if possible.", time: '09:10 AM' },
    { id: '2', sender: 'agent',    text: "Great choice! I can get that set up for you. What date works best?",    time: '09:11 AM' },
    { id: '3', sender: 'customer', text: "June 14th around 11am would be perfect.",                               time: '09:12 AM' },
    { id: '4', sender: 'agent',    text: "Done! Test drive confirmed for Jun 14 at 11am at North Austin.",        time: '09:14 AM' },
    { id: '5', sender: 'customer', text: "Perfect, thank you! Do I need to bring anything?",                      time: '09:15 AM' },
  ],
  ai2: [
    { id: '1', sender: 'customer', text: "Can I book a service appointment for this Saturday morning?",           time: '08:48 AM' },
    { id: '2', sender: 'agent',    text: "Of course! We have availability at 9am Saturday. Shall I confirm?",     time: '08:50 AM' },
    { id: '3', sender: 'customer', text: "Yes please!",                                                           time: '08:51 AM' },
    { id: '4', sender: 'agent',    text: "Service appointment confirmed — Sat 9am at South Austin. See you then.",time: '08:52 AM' },
  ],
  h1: [
    { id: '1', sender: 'customer', text: "I'm interested in financing pre-approval for a new Silverado.",         time: '09:38 AM' },
    { id: '2', sender: 'agent',    text: "I'll connect you with our financing team right away.",                   time: '09:39 AM' },
    { id: '3', sender: 'customer', text: "Great, I've been waiting for a callback.",                              time: '09:40 AM' },
    { id: '4', sender: 'agent',    text: "Transferring now — a financing advisor will call you shortly.",         time: '09:41 AM' },
    { id: '5', sender: 'customer', text: "Got it, I'll keep my phone nearby.",                                    time: '09:42 AM' },
  ],
  p1: [
    { id: '1', sender: 'customer', text: "I submitted my financing application last week. Any update?",           time: '09:38 AM' },
    { id: '2', sender: 'agent',    text: "Checking with the team now — this requires a human advisor.",           time: '09:39 AM' },
    { id: '3', sender: 'customer', text: "Okay, I'll wait.",                                                      time: '09:40 AM' },
    { id: '4', sender: 'agent',    text: "Your case is pending review. We'll call you back within the hour.",    time: '09:41 AM' },
  ],
  p2: [
    { id: '1', sender: 'customer', text: "The invoice I received doesn't match what was quoted.",                 time: '10:12 AM' },
    { id: '2', sender: 'agent',    text: "I apologize for the confusion. Let me pull up your account.",           time: '10:14 AM' },
    { id: '3', sender: 'customer', text: "I have the original quote here showing $420 less.",                     time: '10:16 AM' },
    { id: '4', sender: 'agent',    text: "Escalating to our manager for review — pending resolution.",            time: '10:18 AM' },
    { id: '5', sender: 'customer', text: "How long does that usually take?",                                      time: '10:19 AM' },
  ],
}

const DEFAULT_CHAT: ChatMsg[] = [
  { id: '1', sender: 'customer', text: "Hi, I had a question about my appointment.",           time: '09:00 AM' },
  { id: '2', sender: 'agent',    text: "Of course! How can I help you today?",                 time: '09:01 AM' },
  { id: '3', sender: 'customer', text: "I wanted to confirm the details.",                     time: '09:02 AM' },
  { id: '4', sender: 'agent',    text: "Everything looks good on our end. You're all set!",   time: '09:03 AM' },
  { id: '5', sender: 'customer', text: "Great, thanks for confirming!",                        time: '09:04 AM' },
]

const opts = (...labels: string[]) => labels.map((l) => ({ value: l.toLowerCase().replace(/\s+/g, '-'), label: l }))

const FILTER_FIELDS: FilterField[] = [
  { id: 'region',          label: 'Region',              options: opts('Northeast', 'Southeast', 'Midwest', 'Southwest', 'West Coast', 'Pacific Northwest') },
  { id: 'division',        label: 'Division',            options: opts('Division A', 'Division B', 'Division C', 'Division D', 'Division E') },
  { id: 'city',            label: 'City',                options: opts('Austin', 'San Francisco', 'Phoenix', 'Denver', 'Seattle', 'Dallas', 'Houston', 'Chicago') },
  { id: 'zip',             label: 'Zip',                 options: opts('78701', '78702', '94102', '85001', '80201', '98101', '75201', '60601') },
  { id: 'outcome',         label: 'Outcome',             options: opts('Answered', 'Bookings', 'Rescheduling', 'Cancellation') },
  { id: 'content-manager', label: 'Content manager',     options: opts('Kelsy Hiltz', 'Marcus Webb', 'Priya Nair', 'Sofia Mendez', 'Derek Okafor') },
  { id: 'social-manager',  label: 'Social manager',      options: opts('Tasha Winters', 'Omar Farouk', 'Brianna Cole', 'Nathan Cruz', 'Linda Hargrove') },
  { id: 'area-code',       label: 'Area code',           options: opts('512', '415', '602', '303', '206', '214', '713', '312') },
  { id: 'region-manager',  label: 'Region manager',      options: opts('James Whitfield', 'Ray Castellano', 'Ana Reyes', 'David Park', 'Michelle Torres') },
  { id: 'room-custom',     label: 'Room custom',         options: opts('Exam Room 1', 'Exam Room 2', 'Consultation A', 'Consultation B', 'Waiting Bay') },
  { id: 'new-alpha-beta',  label: 'New alpha beta test', options: opts('Alpha Group', 'Beta Group', 'Control Group', 'Pilot A', 'Pilot B') },
  { id: 'custom-test',     label: 'Custom test',         options: opts('Test Group A', 'Test Group B', 'Cohort 1', 'Cohort 2', 'Cohort 3') },
  { id: 'location',              label: 'Location',                        options: opts('North Austin', 'South Austin', 'San Francisco', 'Phoenix, AZ', 'Denver, CO', 'Seattle, WA') },
  { id: 'conversation-status',   label: 'Conversation status',             options: opts('Open', 'Closed', 'Pending', 'Escalated', 'Unread') },
  { id: 'assigned-to',           label: 'Assigned to',                     options: opts('Front desk AI', 'Kelsy Hiltz', 'USA - Sales', 'Marcus Webb', 'Ana Reyes', 'Unassigned') },
  { id: 'time-period',           label: 'Time period',                     options: opts('Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'Last 12 months') },
  { id: 'last-incoming-channel', label: 'Last incoming message (Channel)', options: opts('Voice', 'Text', 'Webchat', 'Chat') },
]

interface HCFrontdeskOverviewScreenProps { isDental?: boolean }

export function HCFrontdeskOverviewScreen({ isDental }: HCFrontdeskOverviewScreenProps) {
  const [dateRange, setDateRange] = useState(isDental ? 'Last 6 months' : 'Last 3 months')
  const [filterOpen, setFilterOpen] = useState(false)
  const [nodeDrawer, setNodeDrawer] = useState<string | null>(null)
  const [selectedConvo, setSelectedConvo] = useState<FunnelConversation | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [message, setMessage] = useState('')

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

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-auto bg-surface">
        <ReportHeader
          title="Front desk overview"
          subtitle="Appointment outcomes across all channels and locations"
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
                className={`flex size-9 items-center justify-center rounded-sm text-text-icon ${filterOpen ? 'bg-surface-selected' : 'border border-border-selected bg-surface hover:bg-surface-l2'}`}
              >
                <Icon name="filter_list" size={20} />
              </button>
            </div>
          }
        />

        <div className="flex flex-col gap-lg p-2xl">

          <SummaryStats stats={SUMMARY_STATS} />

          <HCCard title="Appointments funnel" tooltip="Traces conversations from the channel they came in on, through whether an AI or human agent handled them, to the final booking outcome.">
            <SankeyChart
              nodes={FUNNEL_NODES}
              links={FUNNEL_LINKS}
              height={400}
              columnHeaders={['Total interactions by channels', 'Handled by', 'Outcome']}
              onNodeClick={(name) => setNodeDrawer(name)}
            />
          </HCCard>

          <HCCard title="Response rate over time" tooltip="Monthly view of unique conversations that received a response from the front desk agent.">
            <StackedBarChart
              data={OVERTIME_DATA}
              series={OVERTIME_SERIES}
              xKey="month"
              height={280}
              showBarLabels
            />
          </HCCard>

          <div className="grid grid-cols-2 gap-lg">
            <HCCard title="Answers from source" tooltip="Shows the last source used to respond in each unique conversation, broken down by source type.">
              <ChartStatRow stats={[
                { value: '4.4K', label: 'Link' },
                { value: '2.4K', label: 'FAQ'  },
                { value: '1.6K', label: 'File' },
              ]} />
              <DonutChart data={SOURCE_DONUT} centerValue="6.8k" centerLabel="Total responses" />
            </HCCard>

            <HCCard title="Involvement over time" tooltip="Monthly breakdown of unique conversations handled by the AI agent, a human, or left unresolved.">
              <StackedBarChart
                data={CONV_OVERTIME_DATA}
                series={CONV_OVERTIME_SERIES}
                xKey="month"
                height={280}
                showBarLabels
              />
            </HCCard>
          </div>

          <div className="grid grid-cols-2 gap-lg">
            <HCCard title="Conversations by channel" tooltip="Shows the last channel used in each unique conversation, broken down by channel type.">
              <ChartStatRow stats={[
                { value: '4.4K', label: 'Webchat' },
                { value: '2.4K', label: 'Voice'   },
                { value: '1.4K', label: 'Text'    },
              ]} />
              <DonutChart data={CHANNEL_DONUT} centerValue="6.8k" centerLabel="Total responses" />
            </HCCard>

            <HCCard title="Insurances verified" tooltip="Monthly view of unique conversations where the patient's insurance was successfully verified by the agent.">
              <ChartStatRow stats={[
                { value: '1.2K',  label: 'Total verified'    },
                { value: '94.2%', label: 'Verification rate' },
              ]} />
              <StackedBarChart
                data={INSURANCE_DATA}
                series={INSURANCE_SERIES}
                xKey="month"
                height={220}
                showBarLabels
                hideLegend
              />
            </HCCard>
          </div>

          <HCCard title="Appointments by location" tooltip="Breaks down appointment outcomes by location, aggregated over the selected date range.">
            <DataTable columns={LOCATION_COLUMNS} data={LOCATION_DATA} scrollOnHover={isDental} />
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

      {/* List drawer */}
      {nodeDrawer !== null && (
        <>
          <div className="fixed inset-0 z-[70] bg-black/20" onClick={() => { closeDetail(); setTimeout(() => setNodeDrawer(null), 300) }} />
          <div className="fixed right-0 top-0 z-[80] flex h-full w-[650px] flex-col bg-surface shadow-modal">
            <div className="flex items-center justify-between px-2xl py-lg">
              <div className="flex items-center gap-sm">
                <button type="button" onClick={() => setNodeDrawer(null)} className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover">
                  <Icon name="arrow_back" size={18} />
                </button>
                <span className="text-h3 text-text-primary">{nodeDrawer}</span>
              </div>
              <span className="text-small text-text-tertiary">
                {CONVERSATIONS_BY_NODE[nodeDrawer]?.length ?? 0} conversations
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-sm py-sm">
              {(CONVERSATIONS_BY_NODE[nodeDrawer] ?? []).map((convo) => (
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
                      {convo.verified && <Icon name="mode_heat" size={14} className="text-text-icon" />}
                    </div>
                    <span className="shrink-0 text-small text-text-secondary">{convo.date}</span>
                  </div>
                  {(() => {
                    const msgs = CHAT_BY_CONVO[convo.id] ?? DEFAULT_CHAT
                    const last = msgs[msgs.length - 1]
                    const preview = last.sender === 'agent' ? `Agent: ${last.text}` : last.text
                    return <span className="truncate text-small text-text-secondary">{preview}</span>
                  })()}
                  <div className="flex items-center gap-xs text-small text-text-tertiary">
                    <span>{convo.location}</span>
                    {convo.assignee && (
                      <>
                        <span>•</span>
                        <Icon name="group" size={12} />
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

      {/* Detail drawer — slides on top of list drawer */}
      {selectedConvo !== null && (
        <div className={`fixed right-0 top-0 z-[90] flex h-full w-[650px] flex-col overflow-hidden bg-surface shadow-modal transition-transform duration-300 ease-in-out ${detailVisible ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Chat header — matches list drawer header */}
          <div className="flex items-center justify-between px-2xl py-lg">
            <div className="flex items-center gap-sm">
              <button type="button" onClick={closeDetail} className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover">
                <Icon name="arrow_back" size={18} />
              </button>
              <span className="text-h3 text-text-primary">{selectedConvo.name}</span>
              {selectedConvo.verified && <Icon name="mode_heat" size={16} className="text-text-icon" />}
            </div>
            <div className="flex items-center gap-md">
              <button type="button" className="flex items-center gap-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ai-summary">
                  <Icon name="auto_awesome" size={16} className="text-ai-brand" />
                </span>
                <span className="text-body text-text-primary">{selectedConvo.assignee ?? 'Front desk agent - North region'}</span>
                <Icon name="expand_more" size={14} className="text-text-icon" />
              </button>
              <button type="button" className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover">
                <Icon name="more_vert" size={18} />
              </button>
            </div>
          </div>

          {/* Chat messages — exact copy */}
          <div className="flex flex-1 flex-col gap-md overflow-y-auto px-2xl py-lg">
            <div className="flex items-center justify-center">
              <span className="text-small text-text-secondary">Thu • Jun 10</span>
            </div>
            {(CHAT_BY_CONVO[selectedConvo.id] ?? DEFAULT_CHAT).map((msg) => (
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

          {/* Compose box — exact copy */}
          <div className="p-2xl">
            <div className="rounded-md border border-border p-md">
              <button type="button" className="mb-sm flex items-center gap-xs text-body text-text-action">
                Text
                <Icon name="expand_more" size={16} />
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
                  <button type="button" className="flex size-5 items-center justify-center hover:text-text-primary"><Icon name="table_rows" size={20} /></button>
                  <button type="button" className="flex size-5 items-center justify-center hover:text-text-primary"><Icon name="attach_money" size={20} /></button>
                  <button type="button" className="flex size-5 items-center justify-center hover:text-text-primary"><Icon name="attach_file" size={20} /></button>
                  <button type="button" className="flex size-5 items-center justify-center hover:text-text-primary"><Icon name="sentiment_satisfied" size={20} /></button>
                  <button type="button" className="flex size-5 items-center justify-center hover:opacity-80">
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.51931 10.0887H4.57118L4.24883 11.0207H3.2187L4.97763 6.12236H6.11988L7.8788 11.0207H6.84167L6.51931 10.0887ZM6.25302 9.30384L5.54525 7.25761L4.83747 9.30384H6.25302Z" fill="#6834B7"/>
                      <path d="M9.51733 6.12937V11.0207H8.53626V6.12937H9.51733Z" fill="#6834B7"/>
                      <path d="M9.32388 3.12083H1.8628C0.834006 3.12083 0 3.95484 0 4.98364V12.4349C0 13.4637 0.834007 14.2977 1.86281 14.2977H11.1768C12.2056 14.2977 13.0396 13.4637 13.0396 12.4349V6.85539C12.8579 6.94499 12.673 6.97287 12.523 6.97287C12.3815 6.97287 12.241 6.94766 12.1082 6.89686V12.4349C12.1082 12.9493 11.6912 13.3663 11.1768 13.3663H1.86281C1.34841 13.3663 0.931402 12.9493 0.931402 12.4349V4.98364C0.931402 4.46924 1.3484 4.05224 1.8628 4.05224H9.26645C9.21567 3.91308 9.1962 3.77401 9.1962 3.64919C9.1962 3.47286 9.23581 3.28997 9.32388 3.12083Z" fill="#6834B7"/>
                      <path d="M14.3135 1.88781C14.2909 1.87008 14.2773 1.84761 14.2727 1.8204C14.2684 1.79607 14.2737 1.77277 14.2886 1.75049C14.3932 1.57115 14.4698 1.42736 14.5185 1.31913C14.5688 1.21216 14.5876 1.11705 14.5749 1.0338C14.5651 0.950203 14.5229 0.858108 14.4483 0.757518C14.3736 0.656928 14.2655 0.526047 14.1238 0.364876C14.0815 0.315913 14.0782 0.268806 14.1138 0.223556C14.1316 0.200931 14.1535 0.188046 14.1794 0.184901C14.2054 0.181756 14.2301 0.186801 14.2535 0.200035C14.4371 0.307876 14.5853 0.38785 14.6981 0.439957C14.8122 0.490449 14.911 0.510628 14.9946 0.500495C15.081 0.490012 15.1717 0.447579 15.2668 0.373195C15.363 0.297195 15.4865 0.185008 15.6371 0.0366344C15.683 -0.00839756 15.7301 -0.0119137 15.7784 0.026086C15.8267 0.0640857 15.8329 0.110843 15.797 0.166358C15.6908 0.344433 15.6125 0.486954 15.5622 0.593921C15.5136 0.702155 15.4956 0.797897 15.5083 0.881147C15.5226 0.965664 15.567 1.05822 15.6417 1.15881C15.7176 1.25778 15.8255 1.38722 15.9656 1.54712C16.0079 1.59609 16.0112 1.64319 15.9756 1.68844C15.94 1.7337 15.8902 1.739 15.8262 1.70437C15.6417 1.60102 15.4932 1.52474 15.3807 1.47552C15.2683 1.42629 15.1695 1.40611 15.0843 1.41498C15.0007 1.42511 14.9115 1.46737 14.8164 1.54175C14.723 1.6174 14.6023 1.7278 14.4542 1.87294C14.4087 1.92086 14.3617 1.92581 14.3135 1.88781Z" fill="#6834B7"/>
                      <path d="M12.5714 6.04144C12.5135 6.04144 12.4639 6.02275 12.4225 5.98537C12.3853 5.95214 12.3646 5.90854 12.3604 5.85454C12.3025 5.43922 12.2446 5.11526 12.1867 4.88268C12.1329 4.6501 12.0439 4.47566 11.9198 4.35937C11.7998 4.23892 11.6178 4.14548 11.3737 4.07902C11.1296 4.01257 10.7945 3.93989 10.3684 3.86098C10.2401 3.83606 10.176 3.76545 10.176 3.64916C10.176 3.59102 10.1946 3.54325 10.2318 3.50587C10.2691 3.4685 10.3146 3.44565 10.3684 3.43735C10.7945 3.3792 11.1296 3.32105 11.3737 3.26291C11.6178 3.20061 11.7998 3.10924 11.9198 2.98879C12.0439 2.8642 12.135 2.68353 12.1929 2.44679C12.2508 2.20591 12.3066 1.87364 12.3604 1.45001C12.377 1.32126 12.4473 1.25689 12.5714 1.25689C12.6955 1.25689 12.7638 1.32334 12.7762 1.45624C12.83 1.87157 12.8838 2.19552 12.9376 2.4281C12.9955 2.66069 13.0865 2.83512 13.2106 2.95142C13.3389 3.06771 13.525 3.15908 13.7691 3.22553C14.0132 3.28783 14.3463 3.35843 14.7683 3.43735C14.8965 3.46227 14.9607 3.53287 14.9607 3.64916C14.9607 3.76545 14.8883 3.83606 14.7434 3.86098C14.3215 3.92743 13.9905 3.99181 13.7505 4.0541C13.5106 4.1164 13.3285 4.20778 13.2044 4.32822C13.0844 4.44866 12.9955 4.62725 12.9376 4.86399C12.8838 5.10073 12.83 5.42676 12.7762 5.84208C12.7638 5.97499 12.6955 6.04144 12.5714 6.04144Z" fill="#6834B7"/>
                    </svg>
                  </button>
                </div>
                <div className="flex items-center">
                  <button type="button" className="flex h-9 items-center rounded-l-sm bg-primary px-lg text-body text-white hover:bg-primary-hover">Send</button>
                  <button type="button" className="flex h-9 items-center justify-center rounded-r-sm border-l border-white/30 bg-primary px-sm text-white hover:bg-primary-hover">
                    <Icon name="expand_more" size={16} />
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
