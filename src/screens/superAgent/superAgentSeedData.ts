// Seed data for the Super agent L1 module's native "My agents" / "Library" /
// "Connections" screens — ported 1:1 from the standalone Super Agent prototype's own
// data (DEMO_AGENTS / LIB_AGENTS in public/super-agent-prototype.html) so ids, names,
// descriptions, metrics, and categories all match exactly, now rendered with myna's
// real header/Tabs/MetricTiles/InfoCard/button chrome instead of the iframe.
// "Create agent" is unaffected — it still uses the prototype iframe. `id` (My agents)
// and `key` (Library) are the exact strings the prototype's own `app.openAgent(id)` /
// `app.useLibAgent(key)` expect, so the "Open agent"/"Use agent" buttons can hand off
// to the iframe via postMessage (see SuperAgentApp's `openAgentCmd`/`useLibraryCmd`).

import type { AgentDirectoryEntry, AgentPersonaId } from '../../data/agentDirectoryData'

export interface SuperAgentMetric {
  id: string
  value: string
  label: string
}

export interface SuperAgentKnowledgeItem {
  title: string
  kind: 'file' | 'image' | 'link' | 'note'
  detail: string
}

// The three product pillars established in App.tsx's RAIL_GROUPS: Jay = Marketing,
// Myna = Operations, Robin = Customer experience.
export type SuperAgentPillar = 'jay' | 'myna' | 'robin'

// Maps a pillar to agentDirectoryData.ts's own persona id, so role definitions here
// (which only speak in pillars) can also gate `AgentDirectoryEntry`-shaped data (My
// agents / drill-in) without agentDirectoryData.ts having to know about pillars.
export const PILLAR_TO_PERSONA: Record<SuperAgentPillar, AgentPersonaId> = {
  jay: 'marketing',
  myna: 'operations',
  robin: 'cx',
}

export const PERSONA_TO_PILLAR: Record<AgentPersonaId, SuperAgentPillar> = {
  marketing: 'jay',
  operations: 'myna',
  cx: 'robin',
}

/**
 * Role-based access model, modeled on a sample org (Aspen Dental) with three tiers:
 * IC (scoped to one function within one pillar), Manager (full pillar), Executive
 * (all three pillars). Drives visibility across My agents (+ drill-in), Library,
 * Knowledge, and Connections in the Agents module.
 */
export interface SuperAgentRole {
  id: string
  title: string
  org: string
  tier: 'ic' | 'manager' | 'executive'
  /** Role id of who this role reports to — omitted for the top-of-org role. */
  reportsTo?: string
  /** Dummy person filling this role, shown alongside the title in the org chart. */
  personName: string
  pillars: SuperAgentPillar[]
  /** IC-only: narrows Library/Knowledge/Connections (this file's own category enum). */
  libraryCategories?: SuperAgentLibraryCategory[]
  /** IC-only: narrows My agents/drill-in (agentDirectoryData.ts's free-text `category` field). */
  directoryCategories?: string[]
}

export const SUPER_AGENT_ROLES: SuperAgentRole[] = [
  {
    id: 'ic-reviews',
    title: 'Reviews Coordinator',
    org: 'Aspen Dental',
    tier: 'ic',
    reportsTo: 'mgr-jay',
    personName: 'Jordan Kim',
    pillars: ['jay'],
    libraryCategories: ['build-trust'],
    directoryCategories: ['Reviews AI'],
  },
  {
    id: 'ic-frontdesk',
    title: 'Front Desk Associate',
    org: 'Aspen Dental',
    tier: 'ic',
    reportsTo: 'mgr-myna',
    personName: 'Sam Patel',
    pillars: ['myna'],
    libraryCategories: ['convert-leads'],
    directoryCategories: ['Front desk'],
  },
  {
    id: 'mgr-jay',
    title: 'Marketing Manager',
    org: 'Aspen Dental',
    tier: 'manager',
    reportsTo: 'exec-owner',
    personName: 'Renee Alvarez',
    pillars: ['jay'],
  },
  {
    id: 'mgr-myna',
    title: 'Operations Manager',
    org: 'Aspen Dental',
    tier: 'manager',
    reportsTo: 'exec-owner',
    personName: 'Tom Okafor',
    pillars: ['myna'],
  },
  {
    id: 'mgr-robin',
    title: 'Patient Experience Manager',
    org: 'Aspen Dental',
    tier: 'manager',
    reportsTo: 'exec-owner',
    personName: 'Priya Nair',
    pillars: ['robin'],
  },
  {
    id: 'exec-owner',
    title: 'Practice Owner (CEO)',
    org: 'Aspen Dental',
    tier: 'executive',
    personName: 'Dr. Maria Chen',
    pillars: ['jay', 'myna', 'robin'],
  },
]

// For Library/Knowledge/Connections (this file's own SuperAgentMyAgent/SuperAgentLibraryAgent model)
export function isLibraryAgentVisibleForRole(
  agent: SuperAgentMyAgent | SuperAgentLibraryAgent,
  role: SuperAgentRole,
): boolean {
  if (!role.pillars.includes(agent.pillar)) return false
  if ('category' in agent && role.libraryCategories && !role.libraryCategories.includes(agent.category)) {
    return false
  }
  return true
}

// For My agents / drill-in (agentDirectoryData.ts's AgentDirectoryEntry model)
export function isDirectoryAgentVisibleForRole(agent: AgentDirectoryEntry, role: SuperAgentRole): boolean {
  if (!role.pillars.includes(PERSONA_TO_PILLAR[agent.persona])) return false
  if (role.directoryCategories && !role.directoryCategories.includes(agent.category)) return false
  return true
}

export interface SuperAgentMyAgent {
  id: string
  glyph: SuperAgentLibraryGlyph
  name: string
  pillar: SuperAgentPillar
  fromLibrary?: boolean
  waitingOnYou?: string
  description: string
  status: 'running' | 'paused'
  lastActivity: string
  alert?: string
  metrics: SuperAgentMetric[]
  lastRun: string
  knowledge: SuperAgentKnowledgeItem[]
}

export const SUPER_AGENT_ACTIVE_AGENTS: SuperAgentMyAgent[] = [
  {
    id: 'review-response',
    glyph: 'review-agents-3',
    name: 'Review Response Agent',
    pillar: 'jay',
    fromLibrary: true,
    waitingOnYou: '1 waiting on you',
    description:
      "Drafts a reply to every new review in your brand voice, publishes the safe ones, and holds anything sensitive for you. Adapts its tone whether you're a clinic, a restaurant, or a home services company.",
    status: 'running',
    lastActivity: '12 minutes ago',
    metrics: [
      { id: 'reviews-handled', value: '148', label: 'Reviews handled' },
      { id: 'avg-response', value: '9 min', label: 'Avg response' },
      { id: 'approved-as-is', value: '92%', label: 'Approved as-is' },
      { id: 'hours-saved', value: '11.4', label: 'Hours saved' },
    ],
    lastRun: '12 minutes ago',
    knowledge: [
      { title: 'Brand voice guide', kind: 'file', detail: 'Updated last week' },
      { title: 'Review response templates', kind: 'file', detail: 'Updated 3 weeks ago' },
      { title: 'Escalation & refund policy', kind: 'file', detail: 'Updated 2 months ago' },
      { title: 'Competitor comparison sheet', kind: 'link', detail: 'Google Doc · shared' },
    ],
  },
  {
    id: 'review-generation',
    glyph: 'review-agents-2',
    name: 'Review Generation Agent',
    pillar: 'jay',
    fromLibrary: true,
    description:
      "Asks a real customer for a review right after a good visit, so your rating reflects the work you're actually doing. Works for patient visits, service calls, in-store purchases, or a completed job.",
    status: 'running',
    lastActivity: 'an hour ago',
    metrics: [
      { id: 'requests-sent', value: '312', label: 'Requests sent' },
      { id: 'new-reviews', value: '64', label: 'New reviews' },
      { id: 'response-rate', value: '21%', label: 'Response rate' },
      { id: 'rating-change', value: '+0.2', label: 'Rating change' },
    ],
    lastRun: 'an hour ago',
    knowledge: [
      { title: 'Review request script', kind: 'file', detail: 'Updated 2 weeks ago' },
      { title: 'Opt-out & compliance policy', kind: 'file', detail: 'Updated last month' },
      { title: 'Visit types eligible for a request', kind: 'file', detail: 'Updated 3 months ago' },
    ],
  },
  {
    id: 'listings-health',
    glyph: 'ticketing-agents',
    name: 'Listings Health Agent',
    pillar: 'jay',
    fromLibrary: true,
    description:
      "Finds wrong hours, addresses, and duplicate listings before a customer shows up to a closed door. Runs the same checks whether you're a single storefront or a chain of fifty locations.",
    status: 'running',
    lastActivity: 'yesterday',
    alert: '3 listings still show old holiday hours',
    metrics: [
      { id: 'listings-watched', value: '36', label: 'Listings watched' },
      { id: 'fixes-applied', value: '18', label: 'Fixes applied' },
      { id: 'issues-open', value: '3', label: 'Issues open' },
      { id: 'accuracy', value: '94%', label: 'Accuracy' },
    ],
    lastRun: 'yesterday',
    knowledge: [
      { title: 'Directory list & priorities', kind: 'file', detail: 'Updated last month' },
      { title: 'Business hours by location', kind: 'file', detail: 'Updated 2 weeks ago' },
      { title: 'Brand name, address & phone guidelines', kind: 'link', detail: 'Google Doc · shared' },
    ],
  },
  {
    id: 'appointment-booking',
    glyph: 'frontdesk-agents',
    name: 'Appointment Booking Agent',
    pillar: 'myna',
    fromLibrary: true,
    description:
      'Checks real availability and books straight into your calendar, then handles reminders and reschedules on its own. Built for any appointment-based business — medical, dental, salons, home services.',
    status: 'running',
    lastActivity: '26 minutes ago',
    metrics: [
      { id: 'booked', value: '87', label: 'Booked' },
      { id: 'rescheduled', value: '22', label: 'Rescheduled' },
      { id: 'no-shows-avoided', value: '14', label: 'No-shows avoided' },
      { id: 'hours-saved', value: '9.1', label: 'Hours saved' },
    ],
    lastRun: '26 minutes ago',
    knowledge: [
      { title: 'Appointment types & durations', kind: 'file', detail: 'Updated 3 weeks ago' },
      { title: 'Provider availability rules', kind: 'file', detail: 'Updated last month' },
      { title: 'Cancellation & no-show policy', kind: 'file', detail: 'Updated 2 months ago' },
    ],
  },
  {
    id: 'contact-health',
    glyph: 'ticketing-agents-3',
    name: 'Patient/Contact Health Agent',
    pillar: 'robin',
    fromLibrary: true,
    waitingOnYou: '2 waiting on you',
    description:
      'Watches sentiment, response rates, and engagement trends per contact and flags who is drifting before they churn or leave a bad review. Works for patient panels, member rosters, or any recurring customer base.',
    status: 'running',
    lastActivity: '38 minutes ago',
    alert: '2 accounts flagged as at-risk this week',
    metrics: [
      { id: 'contacts-monitored', value: '1,204', label: 'Contacts monitored' },
      { id: 'at-risk-flagged', value: '9', label: 'At-risk flagged' },
      { id: 'saved-this-month', value: '5', label: 'Saved this month' },
      { id: 'hours-saved', value: '6.8', label: 'Hours saved' },
    ],
    lastRun: '38 minutes ago',
    knowledge: [
      { title: 'At-risk scoring rules', kind: 'file', detail: 'Updated 2 weeks ago' },
      { title: 'Outreach playbook', kind: 'file', detail: 'Updated last month' },
      { title: 'Sentiment sources & weighting', kind: 'link', detail: 'Google Doc · shared' },
    ],
  },
]

export const SUPER_AGENT_PAUSED_AGENTS: SuperAgentMyAgent[] = [
  {
    id: 'social-publishing',
    glyph: 'social-agents',
    name: 'Social Publishing Agent',
    pillar: 'jay',
    fromLibrary: true,
    description:
      'Plans, drafts, and publishes social content on a schedule, and queues anything unusual for your review first. Works across any industry that needs a steady social presence.',
    status: 'paused',
    lastActivity: '3 days ago',
    metrics: [
      { id: 'posts-published', value: '41', label: 'Posts published' },
      { id: 'engagement', value: '+18%', label: 'Engagement' },
      { id: 'drafts-waiting', value: '6', label: 'Drafts waiting' },
      { id: 'hours-saved', value: '5.2', label: 'Hours saved' },
    ],
    lastRun: '3 days ago',
    knowledge: [
      { title: 'Brand kit & templates', kind: 'image', detail: 'Canva · synced' },
      { title: 'Content calendar guidelines', kind: 'file', detail: 'Updated last month' },
      { title: 'Approved photo library', kind: 'image', detail: '24 images · updated last week' },
    ],
  },
]

// `glyph` maps to the shared LibraryCardIcon asset set (components/LibraryCardIcon) —
// the same icons used by the real create-agent library cards elsewhere in the app,
// so this grid reads as one consistent icon language instead of the prototype's own.
export type SuperAgentLibraryGlyph =
  | 'frontdesk-agents'
  | 'frontdesk-agents-2'
  | 'review-agents'
  | 'review-agents-2'
  | 'review-agents-3'
  | 'social-agents'
  | 'social-agents-2'
  | 'social-agents-3'
  | 'survey-agents'
  | 'survey-agents-2'
  | 'survey-agents-3'
  | 'ticketing-agents'
  | 'ticketing-agents-2'
  | 'ticketing-agents-3'

export type SuperAgentLibraryCategory =
  | 'get-found'
  | 'build-trust'
  | 'convert-leads'
  | 'grow-audience'
  | 'understand-performance'
  | 'create-content'

export interface SuperAgentLibraryAgent {
  key: string
  glyph: SuperAgentLibraryGlyph
  name: string
  pillar: SuperAgentPillar
  description: string
  category: SuperAgentLibraryCategory
  /** Shows under the "Recommended for you" tab in addition to its own category tab —
   *  matches the prototype's own `recommended: true` flag exactly. */
  recommended?: boolean
}

// Matches the prototype's own LIB_CATEGORIES exactly (key + label).
export const SUPER_AGENT_LIBRARY_CATEGORIES: { key: 'recommended' | SuperAgentLibraryCategory; label: string }[] = [
  { key: 'recommended', label: 'Recommended for you' },
  { key: 'get-found', label: 'Get found' },
  { key: 'build-trust', label: 'Build trust' },
  { key: 'convert-leads', label: 'Convert leads' },
  { key: 'grow-audience', label: 'Grow your audience' },
  { key: 'understand-performance', label: 'Understand performance' },
  { key: 'create-content', label: 'Create content' },
]

// Ported 1:1 from the prototype's own LIB_AGENTS (all 19 library agents, not a
// truncated subset) — key, name, description, and category all match exactly, so
// "Use agent" hands off the exact same key to `app.useLibAgent(key)` in the iframe.
export const SUPER_AGENT_LIBRARY_AGENTS: SuperAgentLibraryAgent[] = [
  {
    key: 'front-desk',
    glyph: 'frontdesk-agents',
    name: 'AI Front Desk Agent',
    pillar: 'myna',
    description:
      'Never miss a lead — answers calls and chats, answers common questions, qualifies the visitor, and books the appointment. Works the same way for dental patients, auto service requests, salon bookings, or home service calls.',
    category: 'convert-leads',
    recommended: true,
  },
  {
    key: 'negative-review-recovery',
    glyph: 'review-agents',
    name: 'Negative Review Recovery Agent',
    pillar: 'jay',
    description:
      'Catches an urgent complaint the moment it posts, drafts a response, and loops in your team before it turns into a bigger problem. Built for any business that gets reviewed — healthcare, home services, restaurants, auto, retail.',
    category: 'build-trust',
    recommended: true,
  },
  {
    key: 'review-generation',
    glyph: 'review-agents-2',
    name: 'Review Generation Agent',
    pillar: 'jay',
    description:
      "Asks a real customer for a review right after a good visit, so your rating reflects the work you're actually doing. Works for patient visits, service calls, in-store purchases, or a completed job — whatever closing the loop looks like for you.",
    category: 'build-trust',
    recommended: true,
  },
  {
    key: 'listings-health',
    glyph: 'ticketing-agents',
    name: 'Listings Health Agent',
    pillar: 'jay',
    description:
      "Finds wrong hours, addresses, and duplicate listings before a customer shows up to a closed door. Runs the same checks whether you're a single storefront or a chain of fifty locations.",
    category: 'get-found',
    recommended: true,
  },
  {
    key: 'location-performance',
    glyph: 'survey-agents',
    name: 'Location Performance Agent',
    pillar: 'myna',
    description:
      'Compares reviews, calls, and traffic across every location so you know which one needs attention and why. Useful for any multi-location business, from clinics and salons to restaurants and retail chains.',
    category: 'understand-performance',
    recommended: true,
  },
  {
    key: 'local-content',
    glyph: 'ticketing-agents-3',
    name: 'Local Content Agent',
    pillar: 'jay',
    description:
      'Writes location-specific pages and posts that reflect each neighborhood and service mix, instead of one generic template repeated everywhere. Scales from a handful of locations to hundreds, in any industry.',
    category: 'create-content',
    recommended: true,
  },
  {
    key: 'business-info',
    glyph: 'ticketing-agents-2',
    name: 'Business Information Update Agent',
    pillar: 'jay',
    description:
      'Keeps hours, services, and contact details correct across every directory, and pushes seasonal or holiday changes out in bulk. Works for any business with more than one location to keep in sync.',
    category: 'get-found',
  },
  {
    key: 'review-response',
    glyph: 'review-agents-3',
    name: 'Review Response Agent',
    pillar: 'jay',
    description:
      "Drafts a reply to every new review in your brand voice, publishes the safe ones, and holds anything sensitive for you. Adapts its tone whether you're a clinic, a restaurant, or a home services company.",
    category: 'build-trust',
  },
  {
    key: 'missed-call-recovery',
    glyph: 'frontdesk-agents-2',
    name: 'Missed Call Recovery Agent',
    pillar: 'myna',
    description:
      "Texts back within seconds of a missed call so the lead doesn't go to a competitor, and offers to book or answer a quick question. Works for any business that loses money to a ringing phone.",
    category: 'convert-leads',
  },
  {
    key: 'appointment-booking',
    glyph: 'frontdesk-agents',
    name: 'Appointment Booking Agent',
    pillar: 'myna',
    description:
      'Checks real availability and books straight into your calendar, then handles reminders and reschedules on its own. Built for any appointment-based business — medical, dental, salons, home services.',
    category: 'convert-leads',
  },
  {
    key: 'lead-qualification',
    glyph: 'frontdesk-agents-2',
    name: 'Lead Qualification Agent',
    pillar: 'myna',
    description:
      'Scores every inbound enquiry by intent and value, so your team spends time on the leads worth chasing. Flags whatever counts as high-value for your business, from implants to premium repairs to enterprise deals.',
    category: 'convert-leads',
  },
  {
    key: 'social-publishing',
    glyph: 'social-agents',
    name: 'Social Publishing Agent',
    pillar: 'jay',
    description:
      'Plans, drafts, and publishes social content on a schedule, and queues anything unusual for your review first. Works across any industry that needs a steady social presence.',
    category: 'grow-audience',
  },
  {
    key: 'social-engagement',
    glyph: 'social-agents-2',
    name: 'Social Engagement Agent',
    pillar: 'jay',
    description:
      'Reads and replies to comments, messages, and mentions automatically, and flags anything sensitive for a person. Adapts its playbook whether the questions are about appointments, pricing, or product availability.',
    category: 'grow-audience',
  },
  {
    key: 'local-social-content',
    glyph: 'social-agents-3',
    name: 'Local Social Content Agent',
    pillar: 'jay',
    description:
      "Writes a distinct social post for every location instead of the same copy pasted everywhere, and varies the imagery so locations don't look duplicated. Built for any multi-location brand.",
    category: 'grow-audience',
  },
  {
    key: 'executive-summary',
    glyph: 'survey-agents-2',
    name: 'Executive Summary Agent',
    pillar: 'myna',
    description:
      'Rolls up reviews, calls, and bookings into one plain-language summary delivered on your schedule. Useful for any owner tracking performance across locations or business types.',
    category: 'understand-performance',
  },
  {
    key: 'performance-alert',
    glyph: 'survey-agents-3',
    name: 'Performance Alert Agent',
    pillar: 'myna',
    description:
      'Watches for a sudden rating drop, review pattern, or traffic dip and flags it before it becomes a real problem. Works the same way whether the risk shows up in reviews, calls, or foot traffic.',
    category: 'understand-performance',
  },
  {
    key: 'marketing-content',
    glyph: 'ticketing-agents',
    name: 'Marketing Content Agent',
    pillar: 'jay',
    description:
      "Drafts on-brand campaign copy for email, social, and print from a single idea, so you're not starting from a blank page every time. Adapts to any brand voice and industry.",
    category: 'create-content',
  },
  {
    key: 'blog-seo',
    glyph: 'ticketing-agents-2',
    name: 'Blog and SEO Agent',
    pillar: 'jay',
    description:
      'Researches what your customers are actually searching for, then writes and optimizes a full article around it. Works for any business trying to show up in local search.',
    category: 'create-content',
  },
  {
    key: 'content-repurposing',
    glyph: 'ticketing-agents-3',
    name: 'Content Repurposing Agent',
    pillar: 'jay',
    description:
      'Takes one article, video, or post and adapts it into social captions, emails, and snippets without losing the original point. Useful for any business that already publishes long-form content.',
    category: 'create-content',
  },
  {
    key: 'survey-followup',
    glyph: 'survey-agents',
    name: 'Survey Follow-up Agent',
    pillar: 'robin',
    description:
      'Chases down incomplete surveys and reaches back out to low-score responses before the feedback goes cold. Works for patient satisfaction, post-visit, or post-purchase surveys alike.',
    category: 'understand-performance',
  },
  {
    key: 'ticket-triage',
    glyph: 'ticketing-agents',
    name: 'Ticket Triage Agent',
    pillar: 'robin',
    description:
      'Reads every incoming support ticket, routes it to the right queue, and prioritizes it by urgency so nothing sits unassigned. Works the same way for a help desk, a clinic front office, or a service department.',
    category: 'understand-performance',
  },
  {
    key: 'contact-health',
    glyph: 'ticketing-agents-3',
    name: 'Patient/Contact Health Agent',
    pillar: 'robin',
    description:
      'Watches sentiment, response rates, and engagement trends per contact and flags who is drifting before they churn or leave a bad review. Works for patient panels, member rosters, or any recurring customer base.',
    category: 'understand-performance',
  },
]

export interface SuperAgentConnectionApp {
  id: string
  /** Real brand asset path (src/assets) when one exists — preferred over `icon`. */
  logoSrc?: string
  /** Material icon fallback for apps without a bundled brand asset. */
  icon?: string
  iconClassName: string
  name: string
  description: string
}

export const SUPER_AGENT_REACH_APPS: SuperAgentConnectionApp[] = [
  {
    id: 'whatsapp',
    logoSrc: 'whatsapp',
    iconClassName: 'bg-chip-success-bg',
    name: 'WhatsApp',
    description:
      'Ask for a status, approve a draft, or start a task from the thread your patients already message you in.',
  },
  {
    id: 'slack',
    icon: 'tag',
    iconClassName: 'bg-chip-info-bg text-chip-info-text',
    name: 'Slack',
    description: 'Put the agents in a channel your team already watches, so anyone can see the work and approve it.',
  },
  {
    id: 'imessage',
    icon: 'sms',
    iconClassName: 'bg-chip-success-bg text-chip-success-text',
    name: 'iMessage',
    description: 'A normal text thread — useful when you are away from a laptop and just want an answer.',
  },
  {
    id: 'telegram',
    icon: 'send',
    iconClassName: 'bg-chip-info-bg text-chip-info-text',
    name: 'Telegram',
    description: 'Runs as a bot, so approvals arrive as buttons rather than free text.',
  },
]

// Ported 1:1 from the prototype's own CHANNEL_SETUP (public/super-agent-prototype.html)
// — steps, pairing blurb, CTA label, and the two-line sample thread shown in the
// connect modal's preview, all exactly as written there. Used by ChannelConnectModal
// and the mobile chat preview.
export interface SuperAgentChannelSetup {
  name: string
  /** brand band color behind the QR/preview hero */
  band: string
  handle: string
  blurb: string
  /** [title, description] pairs, in order */
  steps: [string, string][]
  cta: string
  /** [outgoing sample message, agent's reply] */
  sample: [string, string]
}

export const SUPER_AGENT_CHANNEL_SETUP: Record<string, SuperAgentChannelSetup> = {
  whatsapp: {
    name: 'WhatsApp',
    band: '#128C7E',
    handle: '+1 (555) 0142',
    blurb:
      'Ask for a status, approve a draft, or start a task from the thread your patients already message you in.',
    steps: [
      ['Scan the code, or open WhatsApp', 'Point your phone at the code, or tap the button to open the conversation directly.'],
      ['Send the pairing phrase', 'Send the code below in that chat and every agent in this workspace becomes reachable there.'],
    ],
    cta: 'Open WhatsApp',
    sample: ['Send me a morning briefing at 7am with anything urgent.', 'Done. Your 7:00 AM briefing is set.'],
  },
  slack: {
    name: 'Slack',
    band: '#3F0E40',
    handle: 'birdeye-super-agents',
    blurb: 'Put the agents in a channel your team already watches, so anyone can see the work and approve it.',
    steps: [
      ['Add the app to your workspace', 'Approve the Birdeye Super Agents app and pick the channel it should post in.'],
      ['Send the pairing phrase', 'Post the code in that channel to finish pairing.'],
    ],
    cta: 'Open Slack',
    sample: ['Post the weekly summary here every Monday.', "Set. I'll post Mondays at 9am."],
  },
  imessage: {
    name: 'iMessage',
    band: '#0b8a34',
    handle: '+1 (555) 0142',
    blurb: 'A normal text thread — useful when you are away from a laptop and just want an answer.',
    steps: [
      ['Save the number, or scan the code', 'Add the number to your contacts, or scan to open the thread on your phone.'],
      ['Send the pairing phrase', 'Text the code and the thread is linked to this workspace.'],
    ],
    cta: 'Open Messages',
    sample: ['Any missed calls while I was in surgery?', 'Four. I answered all of them — one needs you.'],
  },
  telegram: {
    name: 'Telegram',
    band: '#1c93d2',
    handle: '@birdeye_superagents',
    blurb: 'Runs as a bot, so approvals arrive as buttons rather than free text.',
    steps: [
      ['Open the bot', 'Scan the code or tap the button to start a chat with the Birdeye bot.'],
      ['Send the pairing phrase', 'Send the code to the bot to link it to this workspace.'],
    ],
    cta: 'Open Telegram',
    sample: ['Anything urgent today?', 'One. A 1-star review at Downtown, 20 minutes ago.'],
  },
}

export interface SuperAgentDataSource {
  id: string
  logoSrc?: string
  icon?: string
  iconClassName: string
  name: string
  detail: string
  state: 'connected' | 'reconnect' | 'connect'
}

export const SUPER_AGENT_DATA_SOURCES: SuperAgentDataSource[] = [
  {
    id: 'gbp',
    logoSrc: 'google',
    iconClassName: 'bg-surface-selected',
    name: 'Google Business Profile',
    detail: '4 locations',
    state: 'connected',
  },
  {
    id: 'facebook',
    logoSrc: 'facebook',
    iconClassName: 'bg-surface-selected',
    name: 'Facebook Pages',
    detail: '4 pages',
    state: 'connected',
  },
  {
    id: 'surveys',
    logoSrc: 'birdeye',
    iconClassName: 'bg-surface-selected',
    name: 'Birdeye surveys',
    detail: 'Connected',
    state: 'connected',
  },
  {
    id: 'appointment-calendar',
    icon: 'calendar_today',
    iconClassName: 'bg-surface-selected text-text-icon',
    name: 'Appointment calendar',
    detail: 'Lakeside disconnected',
    state: 'reconnect',
  },
  {
    id: 'phone-number',
    icon: 'call',
    iconClassName: 'bg-surface-selected text-text-icon',
    name: 'Phone number',
    detail: '(555) 0100',
    state: 'connected',
  },
  {
    id: 'website-chat',
    icon: 'chat',
    iconClassName: 'bg-chip-info-bg text-chip-info-text',
    name: 'Website chat',
    detail: 'Installed',
    state: 'connected',
  },
  {
    id: 'whatsapp-ds',
    logoSrc: 'whatsapp',
    iconClassName: 'bg-surface-selected',
    name: 'WhatsApp',
    detail: 'Not connected',
    state: 'connect',
  },
  {
    id: 'slack-ds',
    icon: 'tag',
    iconClassName: 'bg-surface-selected text-text-icon',
    name: 'Slack',
    detail: 'Not connected',
    state: 'connect',
  },
]
