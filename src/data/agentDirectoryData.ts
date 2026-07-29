export type AgentPersonaId = 'marketing' | 'operations' | 'cx'

export interface AgentDirectoryEntry {
  id: string
  name: string
  category: string
  persona: AgentPersonaId
  description: string
  /** Number of currently running instances. 0 = paused. */
  running: number
  /** The single outcome metric this agent is measured on. */
  outcome: { value: string; label: string }
  timeSaved: string
  costSaved: string
  tasksOngoing: number
  alert?: { message: string; actionLabel: string }
  /** When set, the card is clickable and opens this agent's detail screen (App.tsx `navActive` id). */
  navId?: string
}

export interface PersonaGroup {
  id: AgentPersonaId
  label: string
  categories: string[]
}

// Mirrors the real product groupings in the L1 icon rail (App.tsx RAIL_GROUPS).
export const PERSONA_GROUPS: PersonaGroup[] = [
  { id: 'marketing', label: 'Marketing persona', categories: ['Search AI', 'Listings AI', 'Reviews AI', 'Social AI', 'Referral', 'Marketing Automation AI'] },
  { id: 'operations', label: 'Operations persona', categories: ['Inbox', 'Front desk'] },
  { id: 'cx', label: 'Customer experience', categories: ['Surveys AI', 'Ticketing', 'Insights AI'] },
]

export const AGENT_DIRECTORY: AgentDirectoryEntry[] = [
  // Front desk agents — same 4 agents shown under the "Agents" accordion in the
  // Front desk L2 nav (App.tsx AGENT_NAMES). Metrics mirror AgentDetailScreen's
  // METRICS_BY_AGENT / REGIONS_BY_AGENT totals for that agent.
  {
    id: 'front-desk',
    name: 'Front desk agent',
    category: 'Front desk',
    persona: 'operations',
    description: 'Handles inbound voice, chat, and text — answering questions, booking visits, and verifying insurance.',
    running: 2,
    outcome: { value: '16,230', label: 'Conversations resolved' },
    timeSaved: '40h',
    costSaved: '$2.8K',
    tasksOngoing: 14,
    navId: 'frontdesk-agent',
  },
  {
    id: 'review-response',
    name: 'Review response agent',
    category: 'Reviews AI',
    persona: 'marketing',
    description: 'Drafts replies to incoming reviews based on sentiment and brand voice.',
    running: 2,
    outcome: { value: '609', label: 'Reviews responded' },
    timeSaved: '51h',
    costSaved: '$3.6K',
    tasksOngoing: 6,
    alert: { message: '3 issues identified', actionLabel: 'Show details' },
  },
  {
    id: 'waitlist',
    name: 'Waitlist agent',
    category: 'Front desk',
    persona: 'operations',
    description: 'Reaches out to waitlisted patients to fill cancelled or newly opened appointment slots.',
    running: 2,
    outcome: { value: '7.9K', label: 'Slots filled' },
    timeSaved: '2.5h',
    costSaved: '$0.2K',
    tasksOngoing: 9,
    navId: 'waitlist-agent',
  },
  {
    id: 'pre-visit',
    name: 'Pre-visit agent',
    category: 'Front desk',
    persona: 'operations',
    description: 'Sends pre-visit outreach and collects completed intake forms ahead of the appointment.',
    running: 2,
    outcome: { value: '2,700', label: 'Intakes completed' },
    timeSaved: '1h',
    costSaved: '$0.1K',
    tasksOngoing: 8,
    navId: 'pre-visit-agent',
  },
  {
    id: 'review-generation',
    name: 'Review generation agent',
    category: 'Reviews AI',
    persona: 'marketing',
    description: 'Sends review requests to customers after transactions complete.',
    running: 1,
    outcome: { value: '868', label: 'New reviews' },
    timeSaved: '41h',
    costSaved: '$2.9K',
    tasksOngoing: 9,
  },
  {
    id: 'reminder',
    name: 'Reminder agent',
    category: 'Front desk',
    persona: 'operations',
    description: 'Sends automated appointment reminders and collects confirmations via text and email.',
    running: 2,
    outcome: { value: '100', label: 'Appointments confirmed' },
    timeSaved: '13h',
    costSaved: '$0.9K',
    tasksOngoing: 6,
    navId: 'reminder-agent',
  },
  {
    id: 'social-publishing',
    name: 'Social publishing agent',
    category: 'Social AI',
    persona: 'marketing',
    description: 'Schedules and publishes social posts across connected channels.',
    running: 1,
    outcome: { value: '742', label: 'Posts published' },
    timeSaved: '33h',
    costSaved: '$2.1K',
    tasksOngoing: 7,
  },
  {
    id: 'social-engagement',
    name: 'Social engagement agent',
    category: 'Social AI',
    persona: 'marketing',
    description: 'Monitors and responds to comments and mentions in real time.',
    running: 0,
    outcome: { value: '1.1K', label: 'Comments handled' },
    timeSaved: '29h',
    costSaved: '$1.8K',
    tasksOngoing: 10,
  },
  {
    id: 'tagging-routing',
    name: 'Tagging & routing agent',
    category: 'Inbox',
    persona: 'operations',
    description: 'Classifies incoming messages and routes them to the right queue.',
    running: 2,
    outcome: { value: '1.9K', label: 'Messages routed' },
    timeSaved: '97h',
    costSaved: '$6.8K',
    tasksOngoing: 12,
    alert: { message: 'No queue matched for 5 messages', actionLabel: 'Fix it' },
  },
]
