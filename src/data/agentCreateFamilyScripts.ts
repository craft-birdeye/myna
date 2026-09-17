// Family-aware scripted copy for the "Create agent" ghostwriter chat, covering the WHOLE
// conversation (jobs checklist, docs-ask, build summary, completion reply) — not just the
// landing screen. This is deliberately a *different* file from
// `src/screens/superAgent/agentCreateScripts.ts`, which only supplies the landing library
// cards + initial composer prompt per SuperAgentPillar (role). That file's own comment says
// "everything past the first submitted message is the existing generic Front Desk script" —
// this file is what replaces that generic fallback with copy that matches the *kind* of
// agent actually being built (a "family"), independent of which role/pillar is asking.
//
// `HealthcareFrontdeskCreateAgentLive` (src/screens/AgentDetailScreen.tsx) accepts an
// optional `createScript` prop built from this file; when present it swaps in for the
// hardcoded Front-Desk-only constants in its generic (non review-response / non-reminder)
// fallthrough branch. When absent, every existing caller (real Front Desk / Reminder /
// Review response / Review generation) is byte-for-byte unaffected.

/**
 * Broad category of agent being built. Kept intentionally small (not 1:1 with every
 * Super Agent Library `key`, of which there are 20+) — `familyForLibraryKey` below maps
 * every library key onto one of these five buckets so no picked template is ever left
 * without a script, without requiring a hand-authored narrative per library card.
 */
export type Family = 'front-desk' | 'review-response' | 'review-generation' | 'social-publishing' | 'general'

export interface AgentCreateScript {
  family: Family
  /** 'conversation' = inbound call/chat trigger; 'schedule' = event/schedule-driven. */
  triggerKind: 'conversation' | 'schedule'
  /** The jobs checklist shown under the intro line (also feeds `buildDraftWorkflow`). */
  jobs: string[]
  /** Lead sentence(s) shown before the jobs bullet list in the intro reply. */
  introParagraphs: string[]
  /** Short "please share X" ask, rendered as the intro reply's ACTION line. */
  docsAskPrompt: string
  /** One-sentence rationale for the docs ask, rendered as the ACTION_CONT line. */
  docsAskRationale: string
  /** "Here's how I'm going to work for you" bullet list in the build summary. */
  summaryBullets: string[]
  /** Post-draft "I have created a ... agent" completion paragraph(s). */
  completionParagraphs: string[]
}

/** Builds the full intro-reply paragraph array (matches the shape of the legacy
 *  `CREATE_AGENT_INTRO_PARAGRAPHS` constant) so `CreateAgentIntroReply` and its
 *  "copy" affordance can share one source of truth. */
export function buildIntroParagraphs(script: AgentCreateScript): string[] {
  return [
    ...script.introParagraphs,
    ...script.jobs.map((job) => `• ${job}`),
    `ACTION: ${script.docsAskPrompt}`,
    `ACTION_CONT: ${script.docsAskRationale}`,
    'You can drop in as many as you have.',
  ]
}

// Front desk keeps today's exact existing copy (see CREATE_AGENT_INTRO_JOBS /
// CREATE_AGENT_INTRO_PARAGRAPHS / the hardcoded summary bullets / FRONTDESK_POST_DRAFT_REPLY
// in AgentDetailScreen.tsx) so the real Front Desk module's behavior is unchanged.
const FRONT_DESK_SCRIPT: AgentCreateScript = {
  family: 'front-desk',
  triggerKind: 'conversation',
  jobs: [
    'Book an appointment',
    'Reschedule an appointment',
    'Answer insurance questions',
    'Escalate billing disputes to a human',
  ],
  introParagraphs: [
    'Great — a Front desk agent for inbound is a perfect fit. From what you said, I can already see four jobs:',
  ],
  docsAskPrompt: 'Please upload those call recordings or transcripts.',
  docsAskRationale:
    'They are the best thing you can give me: they’ll show me what your callers actually ask for and how your team handles it, so I build procedures that match how you really work — not a generic template.',
  summaryBullets: [
    "I'll respond to inbound calls, texts, and web chats from patients",
    'I can look up answers from your knowledge base and FAQs',
    'I can check availability, book, confirm, and reschedule appointments',
    "I'll escalate urgent symptoms straight to your front desk team",
  ],
  completionParagraphs: [
    'I have created a Front desk agent for you to answer inbound calls, book and reschedule appointments, answer basic insurance questions, and hand off anything about billing disputes to a human.',
  ],
}

// Adapted from REVIEW_RESPONSE_INTRO_PARAGRAPHS / REVIEW_RESPONSE_* constants in
// AgentDetailScreen.tsx (the real review-response create flow's own copy) — not invented.
const REVIEW_RESPONSE_SCRIPT: AgentCreateScript = {
  family: 'review-response',
  triggerKind: 'schedule',
  jobs: [
    'Watch new reviews across Google, Facebook, and Yelp',
    'Triage spam and non-customer reviews',
    'Draft an on-brand reply for each real review',
    'Publish approved replies automatically',
  ],
  introParagraphs: [
    "You're getting a steady stream of new reviews and a lot of them are still unanswered. A Review response agent is a perfect fit — from what you said, I can already see four jobs:",
  ],
  docsAskPrompt: 'Please share a few examples of replies your team is proud of.',
  docsAskRationale:
    'They show me your brand voice and how your team already handles praise, complaints, and edge cases — so replies sound like you, not a generic template.',
  summaryBullets: [
    "I'll watch every new review across Google, Facebook, and Yelp",
    "I'll filter out spam and non-customer reviews before drafting anything",
    "I'll write an on-brand reply for each real review",
    "I'll escalate anything sensitive — like a staff complaint — to a human first",
  ],
  completionParagraphs: [
    'I have created a Review response agent for you to triage incoming reviews, filter out spam, draft on-brand replies, and publish them automatically — escalating anything sensitive to your team first.',
  ],
}

// Adapted from REVIEW_GENERATION_SCRATCH_START (WorkflowEditorScreen.tsx) — same
// goals/outcomes, re-shaped into the jobs-checklist format this chat uses.
const REVIEW_GENERATION_SCRIPT: AgentCreateScript = {
  family: 'review-generation',
  triggerKind: 'schedule',
  jobs: [
    'Request a review after every completed visit or transaction',
    'Send follow-up nudges by email and text',
    'Route the reviewer to the right review site',
    'Track response rates by location',
  ],
  introParagraphs: [
    'Getting more reviews starts right after the visit. A Review generation agent is a perfect fit — from what you said, I can already see four jobs:',
  ],
  docsAskPrompt: 'Please share your current review-request email or text template, if you have one.',
  docsAskRationale:
    'It shows me the tone and offer you already use, so requests keep sounding like you instead of a generic template.',
  summaryBullets: [
    "I'll send a review request right after each completed visit or transaction",
    "I'll follow up by email and text to maximize response rates",
    "I'll route each reviewer straight to the right review site",
    "I'll track response rates by location so you can see what's working",
  ],
  completionParagraphs: [
    'I have created a Review generation agent for you to request reviews after every completed transaction, follow up by email and text, and track response rates across locations.',
  ],
}

// New family — plausible, demo-quality copy consistent with what a social publishing
// agent would actually do (no existing constants to mirror for this one).
const SOCIAL_PUBLISHING_SCRIPT: AgentCreateScript = {
  family: 'social-publishing',
  triggerKind: 'schedule',
  jobs: [
    'Draft social posts from your latest updates and offers',
    'Schedule posts across your connected channels',
    'Keep captions and hashtags on-brand',
    'Flag anything sensitive for review before it goes out',
  ],
  introParagraphs: [
    'Keeping your social channels active takes a lot of manual posting. A Social publishing agent is a perfect fit — from what you said, I can already see four jobs:',
  ],
  docsAskPrompt: 'Please share a few recent posts you liked.',
  docsAskRationale:
    'They show me your tone, format, and hashtag style, so new posts sound like you instead of a generic template.',
  summaryBullets: [
    "I'll draft posts from your latest updates, offers, and reviews",
    "I'll schedule posts across your connected social channels",
    "I'll keep captions and hashtags consistent with your brand",
    "I'll flag anything sensitive for a human to review before it publishes",
  ],
  completionParagraphs: [
    'I have created a Social publishing agent for you to draft on-brand posts, schedule them across your connected channels, and flag anything sensitive for review before it goes out.',
  ],
}

// Catch-all family for library templates that don't fit the four named families above
// (and the default for roles/prompts that don't clearly signal one of those either).
const GENERAL_SCRIPT: AgentCreateScript = {
  family: 'general',
  triggerKind: 'schedule',
  jobs: [
    'Watch incoming customer feedback and support requests',
    'Triage each item by urgency and topic',
    'Draft a suggested response or next step',
    'Escalate anything that needs a human to the right person',
  ],
  introParagraphs: [
    'Keeping up with everything coming in can be a lot. A general-purpose agent is a perfect fit — from what you said, I can already see four jobs:',
  ],
  docsAskPrompt: 'Please share a few recent examples of the requests you want covered.',
  docsAskRationale:
    'They show me the range of what comes in and how your team already handles it, so this agent matches how you really work — not a generic template.',
  summaryBullets: [
    "I'll watch incoming feedback and requests as they come in",
    "I'll triage each item by urgency and topic",
    "I'll draft a suggested response or next step",
    "I'll escalate anything that needs a human to the right person",
  ],
  completionParagraphs: [
    'I have created an agent for you to triage incoming requests, draft suggested responses, and escalate anything that needs a human to the right person.',
  ],
}

export const AGENT_CREATE_SCRIPTS: Record<Family, AgentCreateScript> = {
  'front-desk': FRONT_DESK_SCRIPT,
  'review-response': REVIEW_RESPONSE_SCRIPT,
  'review-generation': REVIEW_GENERATION_SCRIPT,
  'social-publishing': SOCIAL_PUBLISHING_SCRIPT,
  general: GENERAL_SCRIPT,
}

/** Maps a Super Agent Library `key` (superAgentSeedData.ts's `SUPER_AGENT_LIBRARY_AGENTS`)
 *  onto one of the five families above, so every "Use agent" pick has a script. */
const LIBRARY_KEY_TO_FAMILY: Record<string, Family> = {
  'front-desk': 'front-desk',
  'missed-call-recovery': 'front-desk',
  'appointment-booking': 'front-desk',
  'lead-qualification': 'front-desk',
  'negative-review-recovery': 'review-response',
  'review-response': 'review-response',
  'listings-health': 'review-response',
  'business-info': 'review-response',
  'review-generation': 'review-generation',
  'survey-followup': 'review-generation',
  'social-publishing': 'social-publishing',
  'social-engagement': 'social-publishing',
  'local-social-content': 'social-publishing',
  'local-content': 'social-publishing',
  'marketing-content': 'social-publishing',
  'blog-seo': 'social-publishing',
  'content-repurposing': 'social-publishing',
  'location-performance': 'general',
  'executive-summary': 'general',
  'performance-alert': 'general',
  'ticket-triage': 'general',
  'contact-health': 'general',
}

export function familyForLibraryKey(key: string): Family {
  return LIBRARY_KEY_TO_FAMILY[key] ?? 'general'
}

interface PromptIntentRule {
  family: Family
  keywords: string[]
}

// Order matters — first matching rule wins. Front desk / review-generation / social
// checked ahead of review-response so their more specific phrasing ("request a review",
// "post to instagram") doesn't fall through to a generic "review"/"social" match.
export const PROMPT_INTENT_RULES: PromptIntentRule[] = [
  {
    family: 'front-desk',
    keywords: ['front desk', 'inbound call', 'answer calls', 'answer the phone', 'book an appointment', 'booking', 'reschedule', 'phone call', 'webchat', 'web chat'],
  },
  {
    family: 'review-generation',
    keywords: ['request a review', 'request reviews', 'ask for a review', 'ask for reviews', 'get more reviews', 'review request', 'increase review', 'review generation', 'review volume'],
  },
  {
    family: 'social-publishing',
    keywords: ['social media', 'social post', 'instagram', 'facebook post', 'publish a post', 'content calendar', 'schedule posts', 'social channel'],
  },
  {
    family: 'review-response',
    keywords: ['review', 'rating', 'listing', 'google business profile', 'yelp', 'reply to review', 'respond to review'],
  },
  {
    family: 'general',
    keywords: ['follow up', 'follow-up', 'feedback', 'ticket', 'escalate', 'support request'],
  },
]

/** Simple, deterministic keyword classifier — first matching rule wins, `fallback`
 *  (the role's default family) otherwise. No fuzzy scoring. */
export function classifyPrompt(text: string, fallback: Family): Family {
  const lower = text.toLowerCase()
  for (const rule of PROMPT_INTENT_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) return rule.family
  }
  return fallback
}
