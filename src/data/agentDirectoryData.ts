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
  { id: 'marketing', label: 'Marketing', categories: ['Search AI', 'Listings AI', 'Reviews AI', 'Social AI', 'Referral', 'Marketing Automation AI'] },
  { id: 'operations', label: 'Operations', categories: ['Inbox', 'Front desk'] },
  { id: 'cx', label: 'Customer experience', categories: ['Surveys AI', 'Ticketing', 'Insights AI'] },
]

// Product-agnostic Marketing/Inbox agents — same set shown for every product,
// since Reviews AI / Social AI / Inbox are shared Birdeye surfaces, not per-vertical.
const REVIEW_RESPONSE: AgentDirectoryEntry = {
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
}

const REVIEW_GENERATION: AgentDirectoryEntry = {
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
}

const SOCIAL_PUBLISHING: AgentDirectoryEntry = {
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
}

const SOCIAL_ENGAGEMENT: AgentDirectoryEntry = {
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
}

const TAGGING_ROUTING: AgentDirectoryEntry = {
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
  alert: { message: '2 issues identified', actionLabel: 'Fix it' },
}

// Common agents, in display order (index 0 and 1 get interleaved with each
// product's front-desk agents by getAgentDirectory — see below).
const COMMON_AGENTS: AgentDirectoryEntry[] = [
  REVIEW_RESPONSE,
  REVIEW_GENERATION,
  SOCIAL_PUBLISHING,
  SOCIAL_ENGAGEMENT,
  TAGGING_ROUTING,
]

// ── Customer experience (Robin) agents — product-agnostic, same as the Marketing/
// Inbox agents above. See PERSONA_GROUPS's 'cx' categories ('Surveys AI', 'Ticketing').
const SURVEY_CREATION: AgentDirectoryEntry = {
  id: 'survey-creation',
  name: 'Survey creation agent',
  category: 'Surveys AI',
  persona: 'cx',
  description: 'Builds and configures new customer surveys from templates or from scratch.',
  running: 1,
  outcome: { value: '86', label: 'Surveys created' },
  timeSaved: '6h',
  costSaved: '$0.4K',
  tasksOngoing: 4,
}

const SURVEY_DISTRIBUTION: AgentDirectoryEntry = {
  id: 'survey-distribution',
  name: 'Survey distribution agent',
  category: 'Surveys AI',
  persona: 'cx',
  description: 'Sends surveys to customers across email, text, and QR touchpoints after a qualifying interaction.',
  running: 2,
  outcome: { value: '3,240', label: 'Surveys sent' },
  timeSaved: '19h',
  costSaved: '$1.3K',
  tasksOngoing: 9,
}

const SURVEY_RESPONSE: AgentDirectoryEntry = {
  id: 'survey-response',
  name: 'Survey response agent',
  category: 'Surveys AI',
  persona: 'cx',
  description: 'Collects and scores incoming survey responses, flagging detractors for follow-up.',
  running: 2,
  outcome: { value: '1,860', label: 'Surveys responded to' },
  timeSaved: '14h',
  costSaved: '$1.0K',
  tasksOngoing: 7,
}

const TICKETING_SURVEYS: AgentDirectoryEntry = {
  id: 'ticketing-surveys',
  name: 'Ticketing agent · Surveys',
  category: 'Ticketing',
  persona: 'cx',
  description: 'Opens a support ticket automatically when a survey response flags a detractor or unresolved issue.',
  running: 1,
  outcome: { value: '212', label: 'Tickets created' },
  timeSaved: '9h',
  costSaved: '$0.6K',
  tasksOngoing: 5,
}

const TICKETING_REVIEWS: AgentDirectoryEntry = {
  id: 'ticketing-reviews',
  name: 'Ticketing agent · Reviews',
  category: 'Ticketing',
  persona: 'cx',
  description: 'Sends a ticket to the right team whenever a low-star review comes in, routed by location and topic.',
  running: 1,
  outcome: { value: '158', label: 'Tickets sent' },
  timeSaved: '7h',
  costSaved: '$0.5K',
  tasksOngoing: 4,
}

const CX_AGENTS: AgentDirectoryEntry[] = [SURVEY_CREATION, SURVEY_DISTRIBUTION, SURVEY_RESPONSE, TICKETING_SURVEYS, TICKETING_REVIEWS]

// Front desk agent — same for every product (App.tsx AGENT_NAMES `frontdesk-agent`).
const FRONT_DESK: AgentDirectoryEntry = {
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
}

// ── Healthcare / Dental front-desk-family agents ───────────────────────────
const WAITLIST: AgentDirectoryEntry = {
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
}

const PRE_VISIT: AgentDirectoryEntry = {
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
}

const REMINDER: AgentDirectoryEntry = {
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
}

// ── Dental-only agents — real numbers from AgentDetailScreen's
// METRICS_BY_AGENT / REGIONS_BY_AGENT for these exact agent names ─────────
const RECALL: AgentDirectoryEntry = {
  id: 'recall',
  name: 'Recall agent',
  category: 'Recall',
  persona: 'operations',
  description: 'Identifies patients due for recall and reaches out across voice and text to rebook their visit.',
  running: 2,
  outcome: { value: '3,410', label: 'Patients contacted' },
  timeSaved: '274h',
  costSaved: '$19.2K',
  tasksOngoing: 11,
  navId: 'recall-agent',
}

const REVENUE: AgentDirectoryEntry = {
  id: 'revenue',
  name: 'Revenue agent',
  category: 'Revenue',
  persona: 'operations',
  description: 'Contacts patients with outstanding balances and offers a secure pay-by-link or payment plan.',
  running: 2,
  outcome: { value: '1,820', label: 'Balances contacted' },
  timeSaved: '176h',
  costSaved: '$12.3K',
  tasksOngoing: 8,
  navId: 'revenue-agent',
}

const TREATMENT_PLAN: AgentDirectoryEntry = {
  id: 'treatment-plan',
  name: 'Treatment plan agent',
  category: 'Treatment plans',
  persona: 'operations',
  description: 'Follows up on unscheduled treatment plans and guides patients to accept and book care.',
  running: 2,
  outcome: { value: '2,140', label: 'Plans followed up' },
  timeSaved: '262h',
  costSaved: '$18.3K',
  tasksOngoing: 13,
  navId: 'treatment-plan-agent',
}

// ── Automotive-only agent — real numbers from METRICS_BY_AGENT['Outreach agent'] ──
const OUTREACH: AgentDirectoryEntry = {
  id: 'outreach',
  name: 'Outreach agent',
  category: 'Outreach',
  persona: 'operations',
  description: 'Reaches out to leads via call and message, qualifying interest and scheduling test drives.',
  running: 2,
  outcome: { value: '2,103', label: 'Leads contacted' },
  timeSaved: '22h',
  costSaved: '$1.5K',
  tasksOngoing: 7,
  navId: 'outreach-agent',
}

// Each product's front-desk-family lineup, in display order — mirrors that
// product's "Agents" accordion in the L2 SideNav (App.tsx NAV_SECTIONS).
const FRONT_DESK_AGENTS_BY_PRODUCT: Record<string, AgentDirectoryEntry[]> = {
  healthcare: [FRONT_DESK, WAITLIST, PRE_VISIT, REMINDER],
  dental: [FRONT_DESK, WAITLIST, PRE_VISIT, REMINDER, RECALL, REVENUE, TREATMENT_PLAN],
  automotive: [FRONT_DESK, REMINDER, OUTREACH],
}

/**
 * Builds the full agent list for a product: that product's front-desk-family
 * agents interleaved with the common Marketing/Inbox agents — front-desk agent
 * first, then review response, then the rest of the front-desk family, then
 * review generation, then the product's last front-desk agent, then the
 * remaining common agents.
 */
export function getAgentDirectory(product: string): AgentDirectoryEntry[] {
  const frontDeskFamily = FRONT_DESK_AGENTS_BY_PRODUCT[product] ?? FRONT_DESK_AGENTS_BY_PRODUCT.healthcare
  const [first, ...rest] = frontDeskFamily
  const last = rest.pop()
  const [, , ...remainingCommon] = COMMON_AGENTS

  // Front desk agent's North + South region issues (see AgentDetailScreen's
  // REGIONS_BY_AGENT) only apply in Healthcare — Dental/Automotive share the
  // same FRONT_DESK object, so this is a shallow copy, not a mutation, to
  // avoid leaking the alert into their directories too.
  const firstWithAlert =
    product === 'healthcare' && first.id === 'front-desk'
      ? { ...first, alert: { message: '3 issues identified', actionLabel: 'Show details' } }
      : first

  return [firstWithAlert, REVIEW_RESPONSE, ...rest, REVIEW_GENERATION, ...(last ? [last] : []), ...remainingCommon, ...CX_AGENTS]
}
