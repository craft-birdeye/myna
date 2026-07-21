import { useEffect, useRef, useState } from 'react'
import { ChartCard, ChatBubble, ChatSystemLabel, DataTable, Icon, SankeyChart, ShareFeedbackModal, StackedBarChart, SummaryStats, Toast, TopNav, VoicemailMessage, type Column, type MessageFeedbackValue, type NavSection } from '../components'
import voicemailSample from '../assets/voicemail_sample.mp3'
import {
  FRONT_DESK_CALL_SUMMARY,
  FRONT_DESK_INBOX_CONVERSATION_ID,
  FRONT_DESK_VOICE_MESSAGES,
} from '../data/frontDeskCallConversation'
import {
  ANNETTE_BLACK_CHAT_EVENTS,
  ANNETTE_BLACK_CONVERSATION_ID,
} from '../data/annetteBlackChatConversation'
import { AgentDetailScreen } from './AgentDetailScreen'
import { WorkflowEditorScreen } from './WorkflowEditorScreen'
import { useFeedbackRecommendationsStore } from '../data/FeedbackRecommendationsStoreContext'

interface Conversation {
  id: string
  name: string
  verified?: boolean
  message: string
  location: string
  sublocation?: string
  assignee?: string
  date: string
  unread?: boolean
}

const CONVERSATIONS: Conversation[] = [
  {
    id: FRONT_DESK_INBOX_CONVERSATION_ID,
    name: 'Dana Whitfield',
    verified: true,
    message: 'I am having a very bad headache. I think it is migraine.',
    location: 'Rock Dental Brands',
    assignee: 'Front desk agent - North region',
    date: '5:30 PM',
    unread: true,
  },
  { id: '1', name: 'Cameron Williamson', verified: true, message: 'You can find more details here: https://birdeye.com', location: 'Austin', sublocation: 'Savannah', assignee: 'Front desk agent - South region', date: '03:25 PM' },
  {
    id: ANNETTE_BLACK_CONVERSATION_ID,
    name: 'Annette Black',
    verified: true,
    message: "Seriously? You're a booking assistant and you don't know your own hours?",
    location: 'Rock Dental Brands',
    assignee: 'Front desk agent - North region',
    date: '02:09 PM',
    unread: true,
  },
  { id: '3', name: 'Wade Warren',                        message: 'Robin: Was your question answered?',                  location: 'San Francisco', assignee: 'Reminder agent - West region', date: 'Dec 11, 2022', unread: true },
  { id: '4', name: 'Floyd Miles',                        message: 'Robin: Was your question answered?',                  location: 'San Francisco', assignee: 'Reminder agent - West region', date: 'Dec 11, 2022', unread: true },
  { id: '5', name: 'Brooklyn Simmons',                   message: 'Robin: Was your question answered?',                  location: 'San Francisco', assignee: 'Reminder agent - West region', date: 'Dec 11, 2022' },
  { id: '6', name: 'Brooklyn Simmons',                   message: 'Robin: Was your question answered?',                  location: 'San Francisco', assignee: 'Reminder agent - West region', date: 'Dec 11, 2022' },
  { id: '7', name: 'Brooklyn Simmons',                   message: 'Robin: Was your question answered?',                  location: 'San Francisco', assignee: 'Reminder agent - West region', date: 'Dec 11, 2022' },
]

type ChatEvent =
  | { kind: 'date';      id: string; label: string }
  | { kind: 'status';    id: string; text: string; time?: string }
  | {
      kind: 'bubble'
      id: string
      sender: 'customer' | 'agent'
      text?: string
      fields?: { label: string; value: string }[]
      attribution?: string
      time: string
      showLink?: boolean
      isBot?: boolean
    }
  | { kind: 'recording'; id: string; time: string }

const CHAT_EVENTS: ChatEvent[] = [
  { kind: 'date',      id: 'd1', label: 'Today • Jun 15' },
  { kind: 'status',    id: 's1', text: 'Call started',                              time: '01:35 PM' },
  { kind: 'status',    id: 's2', text: 'Text conversation started',                 time: '01:36 PM' },
  { kind: 'bubble',    id: 'm1', sender: 'agent', text: 'hi', attribution: 'Kuldeep Rathee', time: '01:36 PM' },
  { kind: 'status',    id: 's3', text: 'Auto assigned to Kuldeep Rathee',           time: '01:36 PM' },
  { kind: 'status',    id: 's4', text: 'Call ended - Call Duration: 57s',           time: '01:36 PM' },
  { kind: 'recording', id: 'r1', time: '01:37 PM' },
]

const INBOX_NAV_SECTIONS: NavSection[] = [
  {
    id: 'human-actions',
    label: 'Human actions',
    defaultExpanded: true,
    items: [
      { id: 'view-all-interactions', label: 'View all interactions' },
      { id: 'view-by-status',        label: 'View by status' },
      { id: 'view-by-channel',       label: 'View by channel' },
      { id: 'view-by-assignee',      label: 'View by assignee' },
      { id: 'view-saved-filters',    label: 'View saved filters' },
      { id: 'chat-internal-team',    label: 'Chat with internal team' },
    ],
  },
  {
    id: 'agents',
    label: 'Agents',
    defaultExpanded: true,
    items: [
      { id: 'tagging-routing-agent', label: 'Tagging & routing agent' },
    ],
  },
  // 'Outcomes' section (Conversation managed / All reports) hidden for now — keep for future re-enablement.
  // {
  //   id: 'outcomes',
  //   label: 'Outcomes',
  //   defaultExpanded: true,
  //   items: [
  //     { id: 'conversation-managed',   label: 'Conversation managed' },
  //     { id: 'all-reports',            label: 'All reports', external: true },
  //   ],
  // },
]

interface TabSet {
  visible: { id: string; label: string }[]
  more: { id: string; label: string }[]
}

const TABS_BY_NAV: Record<string, TabSet> = {
  'view-all-interactions': {
    visible: [
      { id: 'all',       label: 'All' },
      { id: 'messages',  label: 'Messages' },
      { id: 'reviews',   label: 'Reviews' },
      { id: 'surveys',   label: 'Surveys' },
    ],
    more: [
      { id: 'payments',    label: 'Payments' },
      { id: 'appointment', label: 'Appointment' },
      { id: 'spam',        label: 'Spam' },
    ],
  },
  'view-by-status': {
    visible: [
      { id: 'missed-call', label: 'Missed call' },
      { id: 'voicemails',  label: 'Voicemails' },
      { id: 'scheduling',  label: 'Scheduling' },
    ],
    more: [
      { id: 'callback-requested', label: 'Callback requested' },
      { id: 'rescheduling',       label: 'Rescheduling' },
      { id: 'cancellations',      label: 'Cancellations' },
      { id: 'intake',             label: 'Intake' },
      { id: 'reminder',           label: 'Reminder' },
      { id: 'follow-up',          label: 'Follow up' },
      { id: 'faqs',               label: 'FAQs' },
      { id: 'referrals',          label: 'Referrals' },
      { id: 'others',             label: 'Others' },
    ],
  },
  'view-by-channel': {
    visible: [
      { id: 'voice', label: 'Voice' },
      { id: 'chat',  label: 'Chat' },
      { id: 'text',  label: 'Text' },
      { id: 'email', label: 'Email' },
    ],
    more: [],
  },
  'view-by-assignee': {
    visible: [
      { id: 'assign-to-me',        label: 'Assign to me' },
      { id: 'assign-to-ai-agents', label: 'Assign to AI agents' },
      { id: 'unassigned',          label: 'Unassigned' },
    ],
    more: [],
  },
  'view-saved-filters': {
    visible: [
      { id: 'needs-attention',   label: 'Needs attention' },
      { id: 'pending-responses', label: 'Pending responses' },
    ],
    more: [
      { id: 'high-priority',      label: 'High priority conversations' },
      { id: 'resolved-closed',    label: 'Resolved & closed' },
      { id: 'open-conversations', label: 'Open conversations' },
      { id: 'awaiting-action',    label: 'Awaiting action' },
      { id: 'escalated-cases',    label: 'Escalated cases' },
      { id: 'recently-updated',   label: 'Recently updated' },
      { id: 'unassigned-threads', label: 'Unassigned threads' },
      { id: 'sla-risk',           label: 'SLA risk' },
    ],
  },
}

const DEFAULT_TAB_SET = TABS_BY_NAV['view-all-interactions']

function InboxTabs({ tabSet, activeTab, onSelect }: { tabSet: TabSet; activeTab: string; onSelect: (id: string) => void }) {
  const allTabs = [...tabSet.visible, ...tabSet.more]
  const defaultVisibleCount = tabSet.visible.length
  const [visibleIds, setVisibleIds] = useState(() => tabSet.visible.map((t) => t.id))
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVisibleIds(tabSet.visible.map((t) => t.id))
  }, [tabSet])

  useEffect(() => {
    if (!moreOpen) return
    function handler(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [moreOpen])

  const visibleTabs = visibleIds.map((id) => allTabs.find((t) => t.id === id)!).filter(Boolean)
  const moreTabs = allTabs.filter((t) => !visibleIds.includes(t.id))

  function handleMoreSelect(id: string) {
    setVisibleIds((prev) => {
      const next = [...prev]
      next[defaultVisibleCount - 1] = id
      return next
    })
    onSelect(id)
    setMoreOpen(false)
  }

  return (
    <div className="flex items-end gap-sm pt-lg">
      {visibleTabs.map((tab) => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className="flex shrink-0 flex-col items-stretch"
          >
            <span
              className={`flex h-9 items-center gap-xs whitespace-nowrap rounded-sm px-sm text-body transition-colors ${
                active ? 'text-text-primary' : 'text-text-secondary hover:bg-surface-selected'
              }`}
            >
              {tab.label}
            </span>
            <span className={`h-[2px] w-full ${active ? 'bg-primary' : 'bg-transparent'}`} />
          </button>
        )
      })}

      {moreTabs.length > 0 && (
        <div className="relative shrink-0" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            className="flex flex-col items-stretch"
          >
            <span className="flex h-9 items-center gap-xs whitespace-nowrap rounded-sm px-sm text-body text-text-secondary transition-colors hover:bg-surface-selected">
              More
              <Icon name="expand_more" size={14} />
            </span>
            <span className="h-[2px] w-full bg-transparent" />
          </button>
          {moreOpen && (
            <div className="absolute left-0 top-full z-50 mt-xs min-w-[168px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
              {moreTabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleMoreSelect(item.id)}
                  className="block w-full whitespace-nowrap px-md py-md text-left text-body text-text-primary hover:bg-surface-hover"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Responses dashboard (commented out) ─────────────────────────────────────
// const SUMMARY_STATS = [
//   { id: 'total',      value: '7.9K', label: 'Total Conversations', delta: '+36.6%', trend: 'up' as const },
//   { id: 'involve',    value: '39.2%', label: 'Involvement Rate',   delta: '-40%',   trend: 'down' as const },
//   { id: 'resolution', value: '61.2%', label: 'Resolution Rate',    delta: '+20%',   trend: 'up' as const },
//   { id: 'unresolved', value: '9.8%',  label: 'Unresolved',         delta: '-10%',   trend: 'down' as const },
// ]
// const SANKEY_NODES = [
//   { name: 'Voice' }, { name: 'Text' }, { name: 'Chat' }, { name: 'Email' },
//   { name: 'Agent involved' }, { name: 'Human involved' },
//   { name: 'Resolved' }, { name: 'Routed' }, { name: 'Unresolved' },
// ]
// const SANKEY_LINKS = [
//   { source: 'Voice',          target: 'Agent involved', value: 3200 },
//   { source: 'Voice',          target: 'Human involved', value: 1800 },
//   { source: 'Text',           target: 'Agent involved', value: 2400 },
//   { source: 'Text',           target: 'Human involved', value: 1400 },
//   { source: 'Chat',           target: 'Agent involved', value: 1800 },
//   { source: 'Chat',           target: 'Human involved', value: 1200 },
//   { source: 'Email',          target: 'Agent involved', value: 1100 },
//   { source: 'Email',          target: 'Human involved', value:  700 },
//   { source: 'Agent involved', target: 'Resolved',       value: 5100 },
//   { source: 'Agent involved', target: 'Routed',         value: 2200 },
//   { source: 'Agent involved', target: 'Unresolved',     value: 1200 },
//   { source: 'Human involved', target: 'Resolved',       value: 3100 },
//   { source: 'Human involved', target: 'Routed',         value: 1100 },
//   { source: 'Human involved', target: 'Unresolved',     value: 1000 },
// ]
// const OVERTIME_DATA = [
//   { month: 'Dec\n2023', Resolved: 180, Routed: 120, Unresolved: 134 },
//   { month: 'Jan\n2024', Resolved: 100, Routed: 60,  Unresolved: 74  },
//   { month: 'Feb',       Resolved: 180, Routed: 120, Unresolved: 112 },
//   { month: 'Mar',       Resolved: 170, Routed: 130, Unresolved: 98  },
//   { month: 'Apr',       Resolved: 80,  Routed: 50,  Unresolved: 68  },
//   { month: 'May',       Resolved: 160, Routed: 100, Unresolved: 118 },
// ]
// const OVERTIME_SERIES = [
//   { key: 'Resolved',   label: 'Resolved',   color: '#4cae3d' },
//   { key: 'Routed',     label: 'Routed',     color: '#f5a623' },
//   { key: 'Unresolved', label: 'Unresolved', color: '#de1b0c' },
// ]
// const DONUT_DATA = [
//   { name: 'Voice', value: 35.0, color: '#1976d2' },
//   { name: 'Text',  value: 26.5, color: '#4cae3d' },
//   { name: 'Chat',  value: 22.0, color: '#9c27b0' },
//   { name: 'Email', value: 16.5, color: '#f5a623' },
// ]
// const CHANNEL_STATS = [
//   { id: 'total', value: '10.3k', label: 'Total conversations', delta: '+1.3%',  trend: 'up'   as const },
//   { id: 'voice', value: '3.6k',  label: 'Voice',               delta: '+4.2%',  trend: 'up'   as const },
//   { id: 'text',  value: '2.7k',  label: 'Text',                delta: '-1.1%',  trend: 'down' as const },
//   { id: 'chat',  value: '2.3k',  label: 'Chat',                delta: '+0.8%',  trend: 'up'   as const },
//   { id: 'email', value: '1.7k',  label: 'Email',               delta: '-2.4%',  trend: 'down' as const },
// ]
// interface LocationRow {
//   location: string
//   totalConversation: string
//   resolved: string
//   routed: string
//   unresolved: string
//   [key: string]: string
// }
// const LOCATION_DATA: LocationRow[] = [
//   { location: 'Atlanta, GA',  totalConversation: '643', resolved: '15', routed: '12', unresolved: '2'  },
//   { location: 'Dallas, TX',   totalConversation: '324', resolved: '22', routed: '23', unresolved: '4'  },
//   { location: 'Chicago, IL',  totalConversation: '85',  resolved: '4',  routed: '18', unresolved: '22' },
//   { location: 'Miami, FL',    totalConversation: '523', resolved: '27', routed: '2',  unresolved: '4'  },
//   { location: 'Phoenix, AZ',  totalConversation: '323', resolved: '19', routed: '9',  unresolved: '10' },
//   { location: 'Austin, TX',   totalConversation: '143', resolved: '25', routed: '11', unresolved: '12' },
//   { location: 'Denver, CO',   totalConversation: '256', resolved: '30', routed: '13', unresolved: '14' },
//   { location: 'Seattle, WA',  totalConversation: '235', resolved: '21', routed: '15', unresolved: '16' },
// ]
// const LOCATION_COLUMNS: Column<LocationRow>[] = [
//   { key: 'location',          label: 'Location',           sortable: true },
//   { key: 'totalConversation', label: 'Total conversation', sortable: true },
//   { key: 'resolved',          label: 'Resolved',           sortable: true },
//   { key: 'routed',            label: 'Routed',             sortable: true },
//   { key: 'unresolved',        label: 'Unresolved',         sortable: true },
// ]
// function ResponsesPanel() {
//   return (
//     <div className="flex flex-1 flex-col overflow-y-auto">
//       <div className="flex items-center justify-between px-2xl py-xl">
//         <div>
//           <h1 className="text-h3 text-text-primary">Responses</h1>
//           <p className="mt-xs text-body text-text-secondary">Customer response handling and resolution outcomes across channels and locations</p>
//         </div>
//         <div className="flex items-center gap-sm">
//           <button type="button" className="flex h-9 items-center gap-sm rounded-sm border border-border-selected bg-surface pl-md pr-sm text-body text-text-primary hover:bg-surface-l2">
//             <Icon name="calendar_today" size={16} className="text-text-icon" />
//             Last 3 months
//           </button>
//           <button type="button" className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
//             <Icon name="filter_list" size={20} />
//           </button>
//         </div>
//       </div>
//       <div className="flex flex-col gap-lg px-2xl pb-2xl">
//         <SummaryStats title="Summary" stats={SUMMARY_STATS} />
//         <ChartCard title="Performance funnel" showActions={false} toolbar={<button type="button" aria-label="More" className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"><Icon name="more_vert" size={20} /></button>}>
//           <div className="relative mb-sm h-5 text-small text-text-secondary">
//             <span className="absolute left-0">Channel</span>
//             <span className="absolute" style={{ left: '50%', transform: 'translateX(-50%)' }}>Handler</span>
//             <span className="absolute right-0">Status</span>
//           </div>
//           <SankeyChart nodes={SANKEY_NODES} links={SANKEY_LINKS} height={520} />
//         </ChartCard>
//         <ChartCard title="Conversations over time" className="h-[556px]">
//           <StackedBarChart data={OVERTIME_DATA} series={OVERTIME_SERIES} xKey="month" height={430} showBarLabels />
//         </ChartCard>
//         <ChartCard title="Conversation by channel" className="h-[556px]" showActions={false} toolbar={<div className="flex items-center gap-xs text-text-icon"><button type="button" className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"><Icon name="tune" size={20} /></button><button type="button" aria-label="More" className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"><Icon name="more_vert" size={20} /></button></div>}>
//           <div className="mb-lg flex items-center gap-2xl">{CHANNEL_STATS.map((s) => (<div key={s.id} className="flex flex-col"><div className="flex items-center gap-xs"><span className="text-h3 text-text-primary">{s.value}</span>{s.delta && (<span className={`text-small ${s.trend === 'up' ? 'text-success' : 'text-chip-danger-text'}`}>{s.delta}</span>)}</div><span className="text-small text-text-secondary">{s.label}</span></div>))}</div>
//           <DonutChart data={DONUT_DATA} centerValue="10.3k" centerLabel="Total conversations" height={380} />
//         </ChartCard>
//         <ChartCard title="Conversation across locations" showActions={false} toolbar={<button type="button" aria-label="More" className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"><Icon name="more_vert" size={20} /></button>}>
//           <DataTable columns={LOCATION_COLUMNS} data={LOCATION_DATA} />
//         </ChartCard>
//       </div>
//     </div>
//   )
// }
// ─── Responses dashboard end ──────────────────────────────────────────────────

// ─── Conversation Managed dashboard ───────────────────────────────────────────

const CM_SUMMARY = [
  { id: 'total',   value: '7.9K',  label: 'Total Conversations', delta: '+36.6%', trend: 'up' as const },
  { id: 'tagged',  value: '4.2k',  label: 'Conversations tagged', delta: '-40%',  trend: 'down' as const },
  { id: 'routed',  value: '3.6k',  label: 'Conversations routed', delta: '+20%',  trend: 'up' as const },
]

const CM_SANKEY_NODES = [
  { name: 'Voice' },       // 0
  { name: 'Text' },        // 1
  { name: 'Chat' },        // 2
  { name: 'Email' },       // 3
  { name: 'Tagged' },      // 4
  { name: 'Untagged' },    // 5
  { name: 'Routed' },      // 6
  { name: 'Pending' },     // 7
  { name: 'Missed' },      // 8
  { name: 'Resolved' },    // 9
  { name: 'Unresolved' },  // 10
]
const CM_SANKEY_LINKS = [
  // Channel → Tagging status
  { source: 0, target: 4, value: 2800 }, { source: 0, target: 5, value: 800 },
  { source: 1, target: 4, value: 2200 }, { source: 1, target: 5, value: 1000 },
  { source: 2, target: 4, value: 1600 }, { source: 2, target: 5, value: 700 },
  { source: 3, target: 4, value: 1200 }, { source: 3, target: 5, value: 800 },
  // Tagging status → Routing status
  { source: 4, target: 6, value: 4800 }, { source: 4, target: 7, value: 2000 }, { source: 4, target: 8, value: 1000 },
  { source: 5, target: 6, value: 1400 }, { source: 5, target: 7, value: 800 },  { source: 5, target: 8, value: 1100 },
  // Routing status → Outcome
  { source: 6, target: 9, value: 5200 }, { source: 6, target: 10, value: 1000 },
  { source: 7, target: 9, value: 1800 }, { source: 7, target: 10, value: 1000 },
  { source: 8, target: 9, value: 300 },  { source: 8, target: 10, value: 1800 },
]

const CM_STATUS_DATA = [
  { week: 'Mar\n3',  'Missed Call': 60,  'Scheduling': 100, 'Follow-up': 80, 'Resolved': 130, 'Routed': 64 },
  { week: '2',       'Missed Call': 40,  'Scheduling': 50,  'Follow-up': 40, 'Resolved': 60,  'Routed': 44 },
  { week: '3',       'Missed Call': 60,  'Scheduling': 90,  'Follow-up': 80, 'Resolved': 120, 'Routed': 62 },
  { week: '4',       'Missed Call': 50,  'Scheduling': 80,  'Follow-up': 70, 'Resolved': 110, 'Routed': 88 },
  { week: '5',       'Missed Call': 30,  'Scheduling': 40,  'Follow-up': 30, 'Resolved': 60,  'Routed': 38 },
  { week: '6',       'Missed Call': 50,  'Scheduling': 70,  'Follow-up': 60, 'Resolved': 110, 'Routed': 88 },
  { week: '7',       'Missed Call': 60,  'Scheduling': 90,  'Follow-up': 70, 'Resolved': 120, 'Routed': 72 },
  { week: '8',       'Missed Call': 40,  'Scheduling': 50,  'Follow-up': 40, 'Resolved': 80,  'Routed': 68 },
  { week: '9',       'Missed Call': 40,  'Scheduling': 50,  'Follow-up': 50, 'Resolved': 80,  'Routed': 78 },
  { week: '10',      'Missed Call': 40,  'Scheduling': 60,  'Follow-up': 50, 'Resolved': 90,  'Routed': 62 },
  { week: '11',      'Missed Call': 40,  'Scheduling': 60,  'Follow-up': 50, 'Resolved': 90,  'Routed': 62 },
  { week: '12',      'Missed Call': 40,  'Scheduling': 50,  'Follow-up': 40, 'Resolved': 80,  'Routed': 68 },
]

const CM_STATUS_SERIES = [
  { key: 'Missed Call', label: 'Missed Call', color: '#42A5F5' },
  { key: 'Scheduling',  label: 'Scheduling',  color: '#7E57C2' },
  { key: 'Follow-up',   label: 'Follow-up',   color: '#4cae3d' },
  { key: 'Resolved',    label: 'Resolved',     color: '#F5A623' },
  { key: 'Routed',      label: 'Routed',       color: '#FF7043' },
]

const CM_ROUTING_DATA = [
  { week: 'Mar\n3', Agents: 130, Humans: 64,  Pending: 60  },
  { week: '2',      Agents: 60,  Humans: 44,  Pending: 40  },
  { week: '3',      Agents: 120, Humans: 62,  Pending: 60  },
  { week: '4',      Agents: 110, Humans: 88,  Pending: 50  },
  { week: '5',      Agents: 60,  Humans: 38,  Pending: 30  },
  { week: '6',      Agents: 110, Humans: 88,  Pending: 50  },
  { week: '7',      Agents: 120, Humans: 72,  Pending: 60  },
  { week: '8',      Agents: 80,  Humans: 68,  Pending: 40  },
  { week: '9',      Agents: 80,  Humans: 78,  Pending: 40  },
  { week: '10',     Agents: 90,  Humans: 62,  Pending: 40  },
  { week: '11',     Agents: 90,  Humans: 62,  Pending: 40  },
  { week: '12',     Agents: 80,  Humans: 68,  Pending: 40  },
]

const CM_ROUTING_SERIES = [
  { key: 'Agents',  label: 'Agents',  color: '#42A5F5' },
  { key: 'Humans',  label: 'Humans',  color: '#FF7043' },
  { key: 'Pending', label: 'Pending', color: '#F5A623' },
]

interface CmLocationRow {
  location: string
  totalConversation: string
  conversationTagged: string
  conversationRouted: string
  [key: string]: string
}

const CM_LOCATION_DATA: CmLocationRow[] = [
  { location: 'Atlanta, GA', totalConversation: '234', conversationTagged: '15', conversationRouted: '2'  },
  { location: 'Dallas, TX',  totalConversation: '352', conversationTagged: '22', conversationRouted: '4'  },
  { location: 'Chicago, IL', totalConversation: '244', conversationTagged: '4',  conversationRouted: '22' },
  { location: 'Miami, FL',   totalConversation: '53',  conversationTagged: '27', conversationRouted: '4'  },
  { location: 'Phoenix, AZ', totalConversation: '324', conversationTagged: '19', conversationRouted: '10' },
  { location: 'Austin, TX',  totalConversation: '665', conversationTagged: '25', conversationRouted: '12' },
  { location: 'Denver, CO',  totalConversation: '44',  conversationTagged: '30', conversationRouted: '14' },
  { location: 'Seattle, WA', totalConversation: '656', conversationTagged: '21', conversationRouted: '16' },
]

const CM_LOCATION_COLUMNS: Column<CmLocationRow>[] = [
  { key: 'location',           label: 'Location',             sortable: true },
  { key: 'totalConversation',  label: 'Total conversation',   sortable: true },
  { key: 'conversationTagged', label: 'Conversation tagged',  sortable: true },
  { key: 'conversationRouted', label: 'Conversation routed',  sortable: true },
]

function ConversationManagedPanel() {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-2xl py-xl">
        <div>
          <h1 className="text-h3 text-text-primary">Conversation managed</h1>
          <p className="mt-xs text-body text-text-secondary">Insights into conversation management outcomes across different channels and locations</p>
        </div>
        <div className="flex items-center gap-sm">
          <button type="button" className="flex h-9 items-center gap-sm rounded-sm border border-border-selected bg-surface pl-md pr-sm text-body text-text-primary hover:bg-surface-l2">
            <Icon name="calendar_today" size={16} className="text-text-icon" />
            Last 3 months
          </button>
          <button type="button" className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
            <Icon name="filter_list" size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-lg px-2xl pb-2xl">
        {/* Summary */}
        <SummaryStats title="Summary" stats={CM_SUMMARY} />

        {/* Performance funnel */}
        <ChartCard
          title="Performance funnel"
          showActions={false}
          toolbar={
            <button type="button" aria-label="More" className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
              <Icon name="more_vert" size={20} />
            </button>
          }
        >
          <div className="relative mb-sm h-5 text-small text-text-secondary">
            <span className="absolute left-0">Channel</span>
            <span className="absolute" style={{ left: '33%' }}>Tagging status</span>
            <span className="absolute" style={{ left: '66%' }}>Routing status</span>
            <span className="absolute right-0">Outcome</span>
          </div>
          <SankeyChart
            nodes={CM_SANKEY_NODES}
            links={CM_SANKEY_LINKS}
            height={340}
            nodeColors={{
              0:  '#1976d2', // Voice — blue
              1:  '#4cae3d', // Text — green
              2:  '#9c27b0', // Chat — purple
              3:  '#f5a623', // Email — orange
              4:  '#4cae3d', // Tagged — green
              5:  '#BDBDBD', // Untagged — gray
              6:  '#5C6BC0', // Routed — indigo
              7:  '#F5A623', // Pending — amber
              8:  '#C62828', // Missed — dark red
              9:  '#8BC34A', // Resolved — light green
              10: '#BDBDBD', // Unresolved — gray
            }}
          />
        </ChartCard>

        {/* Conversations by status */}
        <ChartCard title="Conversations by status" className="h-[556px]">
          <StackedBarChart data={CM_STATUS_DATA} series={CM_STATUS_SERIES} xKey="week" height={430} showBarLabels wrapXLabels />
        </ChartCard>

        {/* Routing distribution */}
        <ChartCard title="Routing distribution" className="h-[556px]">
          <StackedBarChart data={CM_ROUTING_DATA} series={CM_ROUTING_SERIES} xKey="week" height={430} showBarLabels wrapXLabels />
        </ChartCard>

        {/* Conversation across locations */}
        <ChartCard
          title="Conversation across locations"
          showActions={false}
          toolbar={
            <button type="button" aria-label="More" className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
              <Icon name="more_vert" size={20} />
            </button>
          }
        >
          <DataTable columns={CM_LOCATION_COLUMNS} data={CM_LOCATION_DATA} />
        </ChartCard>
      </div>
    </div>
  )
}

function InboxSideNav({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const defaultOpen = INBOX_NAV_SECTIONS.find((s) => s.defaultExpanded)?.id ?? INBOX_NAV_SECTIONS[0]?.id ?? null
  const [expandedId, setExpandedId] = useState<string | null>(defaultOpen)

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <aside className="flex h-full w-[222px] shrink-0 flex-col border-r border-border bg-surface-l2">
      <div className="flex h-[52px] shrink-0 flex-col justify-center px-2xl">
        <h1 className="text-h3 text-text-primary">Inbox</h1>
      </div>

      {/* New message row */}
      <div className="flex items-center justify-between px-2xl py-sm">
        <span className="text-body text-text-primary">New message</span>
        <button type="button" className="flex size-6 items-center justify-center rounded-full bg-primary text-white">
          <Icon name="add" size={16} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-xs overflow-y-auto px-lg py-sm">
        {INBOX_NAV_SECTIONS.map((section) => {
          const expanded = expandedId === section.id
          return (
            <div key={section.id} className="flex flex-col gap-xs">
              <button
                type="button"
                onClick={() => toggle(section.id)}
                className="flex h-7 w-full items-center justify-between gap-sm rounded-sm px-sm py-[6px] hover:bg-surface-selected"
              >
                <span className="text-body text-text-primary">{section.label}</span>
                <Icon name={expanded ? 'expand_less' : 'expand_more'} size={20} className="text-text-icon" />
              </button>
              {expanded && section.items?.map((leaf) => (
                <button
                  key={leaf.id}
                  type="button"
                  onClick={() => onSelect(leaf.id)}
                  className={`flex h-7 w-full items-center gap-sm rounded-sm px-sm py-[6px] text-left transition-colors ${
                    activeId === leaf.id ? 'bg-surface-selected' : 'hover:bg-surface-selected'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-body font-light text-text-primary">
                    {leaf.label}
                  </span>
                  {leaf.external && <Icon name="open_in_new" size={16} className="shrink-0 text-text-icon" />}
                </button>
              ))}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

export function InboxScreen({
  initialConversationId,
  onInitialConversationConsumed,
}: {
  initialConversationId?: string | null
  onInitialConversationConsumed?: () => void
} = {}) {
  const [activeNav, setActiveNav] = useState('view-all-interactions')
  const [selectedConvo, setSelectedConvo] = useState(() => {
    if (initialConversationId) {
      return CONVERSATIONS.find((c) => c.id === initialConversationId) ?? CONVERSATIONS[0]
    }
    return CONVERSATIONS[0]
  })
  const [activeTab, setActiveTab] = useState('all')
  const [message, setMessage] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingAgentName, setEditingAgentName] = useState<string | null>(null)
  const [messageFeedback, setMessageFeedback] = useState<Record<string, MessageFeedbackValue>>({})
  const [shareFeedbackMessageId, setShareFeedbackMessageId] = useState<string | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const { submitFeedback } = useFeedbackRecommendationsStore()

  const showFeedbackToast = (message: string) => {
    setToastMessage(message)
    setToastVisible(true)
  }

  const handleFeedbackChange = (messageId: string, value: MessageFeedbackValue) => {
    if (value === 'down') {
      setShareFeedbackMessageId(messageId)
      return
    }
    setMessageFeedback((prev) => ({ ...prev, [messageId]: value }))
    if (value === 'up') showFeedbackToast('Thanks for the feedback!')
  }

  const handleShareFeedbackClose = () => {
    setShareFeedbackMessageId(null)
  }

  const handleShareFeedbackSubmit = (details: string) => {
    if (!shareFeedbackMessageId) return
    const feedbackMessageId = shareFeedbackMessageId
    setMessageFeedback((prev) => ({ ...prev, [feedbackMessageId]: 'down' }))
    setShareFeedbackMessageId(null)
    showFeedbackToast('Feedback submitted! The agent will be trained on your input.')

    submitFeedback({
      text: details,
      agentName: selectedConvo.assignee ?? 'Front desk agent - North region',
      conversation: {
        name: selectedConvo.name,
        message: details,
        channel: selectedConvo.id === FRONT_DESK_INBOX_CONVERSATION_ID ? 'Voice' : 'Chat',
        date: selectedConvo.date,
        location: selectedConvo.location,
      },
      conversationId: selectedConvo.id,
      messageId: feedbackMessageId,
    })
  }

  const feedbackForMessage = (messageId: string): MessageFeedbackValue => {
    if (shareFeedbackMessageId === messageId) return 'down'
    return messageFeedback[messageId] ?? null
  }

  useEffect(() => {
    if (!initialConversationId) return
    const match = CONVERSATIONS.find((c) => c.id === initialConversationId)
    if (match) {
      setSelectedConvo(match)
      setActiveNav('view-all-interactions')
    }
    onInitialConversationConsumed?.()
    // Only react to deep-link id changes; consume callback is intentionally unstable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId])

  const isInternalChat = activeNav === 'chat-internal-team'
  const currentTabSet = TABS_BY_NAV[activeNav] ?? DEFAULT_TAB_SET
  const isFrontDeskCall = selectedConvo.id === FRONT_DESK_INBOX_CONVERSATION_ID
  const isAnnetteChat = selectedConvo.id === ANNETTE_BLACK_CONVERSATION_ID
  const threadEvents: ChatEvent[] = isAnnetteChat
    ? ANNETTE_BLACK_CHAT_EVENTS
    : isFrontDeskCall
      ? []
      : CHAT_EVENTS

  const searchQ = searchQuery.trim().toLowerCase()
  const visibleConversations = searchQ
    ? CONVERSATIONS.filter(
        (c) => c.name.toLowerCase().includes(searchQ) || c.message.toLowerCase().includes(searchQ),
      )
    : CONVERSATIONS

  function handleNavSelect(id: string) {
    setActiveNav(id)
    const tabSet = TABS_BY_NAV[id] ?? DEFAULT_TAB_SET
    setActiveTab(tabSet.visible[0]?.id ?? 'all')
  }

  return (
    <>
    <div className="flex h-full">
      {/* L2 Nav — full height; collapsed while the agent workflow editor is open */}
      {!editingAgentName && <InboxSideNav activeId={activeNav} onSelect={handleNavSelect} />}

      {/* Right side: TopNav on top, then conversation list + chat below */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {editingAgentName ? (
          <WorkflowEditorScreen
            agentName={editingAgentName}
            product="healthcare"
            onClose={() => setEditingAgentName(null)}
          />
        ) : activeNav === 'tagging-routing-agent' ? (
          <AgentDetailScreen agentName="Tagging & routing agent" product="healthcare" onEditAgent={setEditingAgentName} />
        ) : (
        <>
        <TopNav initials="S" />

        {activeNav === 'conversation-managed' ? (
          <ConversationManagedPanel />
        ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Middle panel — conversation list */}
          <div className="flex w-[370px] shrink-0 flex-col border-r border-border">
            <div className="shrink-0 border-b border-border bg-surface px-lg pt-lg pb-md transition-colors focus-within:border-primary">
              {searchOpen ? (
                <div className="flex h-9 items-center gap-xs">
                  <Icon name="search" size={20} className="shrink-0 text-text-icon" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-body text-text-primary caret-primary outline-none placeholder:text-text-tertiary"
                  />
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearchOpen(false)
                      setSearchQuery('')
                    }}
                    className="shrink-0 text-text-icon hover:text-text-primary"
                  >
                    <Icon name="close" size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex w-full items-start justify-between gap-sm">
                  <div className="flex min-w-0 flex-col gap-xs">
                    <div className="flex items-center gap-xs">
                      <span className="text-body text-text-primary">OPEN</span>
                      <Icon name="expand_more" size={16} className="text-text-icon" />
                    </div>
                    <span className="text-small text-text-secondary">192 total messages • 2 unread</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-md">
                    <button type="button" aria-label="Search" onClick={() => setSearchOpen(true)} className="text-text-icon hover:text-text-primary">
                      <Icon name="search" size={20} />
                    </button>
                    <button type="button" className="text-text-icon hover:text-text-primary"><Icon name="filter_list" size={20} /></button>
                    <button type="button" className="text-text-icon hover:text-text-primary"><Icon name="swap_vert" size={20} /></button>
                    <button type="button" className="text-text-icon hover:text-text-primary"><Icon name="more_vert" size={20} /></button>
                  </div>
                </div>
              )}
            </div>

            {!isInternalChat && (
              <div className="px-lg">
                <InboxTabs tabSet={currentTabSet} activeTab={activeTab} onSelect={setActiveTab} />
              </div>
            )}

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-lg pt-md pb-sm">
              {visibleConversations.map((convo) => (
                <button
                  key={convo.id}
                  type="button"
                  onClick={() => setSelectedConvo(convo)}
                  className={`flex w-full flex-col gap-xs rounded-md px-md py-md text-left transition-colors ${
                    selectedConvo.id === convo.id ? 'bg-[#dbeafe]' : 'hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-xs">
                      {convo.unread && <span className="size-[6px] rounded-full bg-primary" />}
                      <span className="text-body text-text-primary">{convo.name}</span>
                      {convo.verified && <Icon name="mode_heat" size={14} className="text-text-icon" />}
                    </div>
                    <span className="text-small text-text-secondary">{convo.date}</span>
                  </div>
                  <span className="truncate text-small text-text-secondary">{convo.message}</span>
                  <div className="flex items-center gap-xs text-small text-text-tertiary">
                    <span>{convo.location}</span>
                    {convo.sublocation && (
                      <>
                        <span>•</span>
                        <span>{convo.sublocation}</span>
                      </>
                    )}
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

          {/* Right panel — chat thread */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center justify-between px-2xl py-md">
              <div className="flex items-center gap-sm">
                <span className="text-h3 text-text-primary">{selectedConvo.name}</span>
                {selectedConvo.verified && <Icon name="mode_heat" size={16} className="text-text-icon" />}
              </div>
              <div className="flex items-center gap-md">
                <button type="button" className="flex items-center gap-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ai-summary">
                    <Icon name="smart_toy" size={16} className="text-ai-brand" />
                  </span>
                  <span className="text-body text-text-primary">{selectedConvo.assignee ?? 'Front desk agent - North region'}</span>
                  <Icon name="expand_more" size={14} className="text-text-icon" />
                </button>
                <button type="button" className="flex size-7 items-center justify-center text-text-icon hover:text-text-primary">
                  <Icon name="more_vert" size={20} />
                </button>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex flex-1 flex-col gap-md overflow-y-auto px-2xl py-lg">

              {isFrontDeskCall ? (
                <>
                  <div className="flex items-center justify-center">
                    <span className="text-small text-text-tertiary">Tue • Feb 25</span>
                  </div>
                  <VoicemailMessage
                    variant="voice-chat"
                    transcript=""
                    summary={FRONT_DESK_CALL_SUMMARY}
                    duration="00:53"
                    durationSecs={53}
                    time="5:30 PM"
                    audioUrl={voicemailSample}
                    messages={FRONT_DESK_VOICE_MESSAGES}
                    contactName={selectedConvo.name}
                  />
                </>
              ) : !isAnnetteChat ? (
                <>
                  <div className="flex items-center justify-center">
                    <span className="text-small text-text-tertiary">Fri • Jun 12</span>
                  </div>
                  <VoicemailMessage
                    variant="voice-chat"
                    transcript="Hello. I was trying to get a hold of Joanne about her rental. She can call me back at 5807437121. Thank you."
                    summary="Patient reported tooth-origin pain with mild swelling (no fever or breathing issues). Myna screened symptoms and offered an urgent appointment, but the patient ended the call."
                    duration="00:11"
                    durationSecs={11}
                    time="10:42 PM"
                    audioUrl={voicemailSample}
                    contactName={selectedConvo.name}
                  />
                </>
              ) : null}

              {!isFrontDeskCall &&
                threadEvents.map((event) => {
                  if (event.kind === 'date') {
                    return <ChatSystemLabel key={event.id} text={event.label} />
                  }

                  if (event.kind === 'status') {
                    const label =
                      event.time != null && event.time !== ''
                        ? `${event.text} • ${event.time}`
                        : event.text
                    return <ChatSystemLabel key={event.id} text={label} />
                  }

                  if (event.kind === 'bubble') {
                    const isAgent = event.sender === 'agent'
                    const bubbleText =
                      event.fields && event.fields.length > 0 ? (
                        <div className="flex flex-col gap-md">
                          {event.fields.map((field) => (
                            <div key={field.label}>
                              <p className="m-0 text-small text-text-secondary">{field.label}</p>
                              <p className="m-0 text-body text-text-primary">{field.value}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        event.text ?? ''
                      )

                    return (
                      <ChatBubble
                        key={event.id}
                        sender={isAgent ? 'business' : 'user'}
                        text={bubbleText}
                        showFeedback={isAgent}
                        feedback={isAgent ? feedbackForMessage(event.id) : undefined}
                        onFeedbackChange={
                          isAgent
                            ? (value) => handleFeedbackChange(event.id, value)
                            : undefined
                        }
                      >
                        <span className="flex items-center gap-xs text-small text-text-tertiary">
                          {!event.isBot && event.attribution ? `${event.attribution} • ` : ''}
                          {event.time}
                          {!isAgent && event.showLink && (
                            <Icon name="link" size={14} className="text-text-tertiary" />
                          )}
                        </span>
                      </ChatBubble>
                    )
                  }

                  if (event.kind === 'recording') {
                    return (
                      <div key={event.id} className="flex flex-col items-end">
                        <div className="flex w-[220px] flex-col gap-sm rounded-lg border border-border bg-[#dbeafe] px-md py-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-body text-text-primary">Call recording</span>
                            <span className="text-small text-text-secondary">{event.time}</span>
                          </div>
                          <button type="button" className="flex items-center gap-sm">
                            <div className="flex size-9 items-center justify-center rounded-full bg-[#1f1f1f]">
                              <Icon name="play_arrow" size={20} fill className="text-white" />
                            </div>
                            <span className="text-body text-text-primary">Play recording</span>
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return null
                })}
            </div>

            {/* Compose box */}
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
                  {isInternalChat ? (
                    <button type="button" className="flex h-9 items-center rounded-sm bg-[#4CAE3D] px-lg text-body text-white hover:opacity-90">
                      Send
                    </button>
                  ) : (
                    <div className="flex items-center">
                      <button type="button" className="flex h-9 items-center rounded-l-sm bg-primary px-lg text-body text-white hover:bg-primary-hover">
                        Send
                      </button>
                      <button type="button" className="flex h-9 items-center justify-center rounded-r-sm border-l border-white/30 bg-primary px-sm text-white hover:bg-primary-hover">
                        <Icon name="expand_more" size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
        </>
        )}
      </div>
    </div>

    <ShareFeedbackModal
      open={shareFeedbackMessageId !== null}
      onClose={handleShareFeedbackClose}
      onSubmit={handleShareFeedbackSubmit}
    />
    <Toast
      message={toastMessage}
      visible={toastVisible}
      onClose={() => setToastVisible(false)}
    />
    </>
  )
}
