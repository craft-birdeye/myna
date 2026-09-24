/**
 * Ghostwriter landing — what the agent reports back after "Respond as reviews come in".
 * Instead of asking for sources/templates/tone, it reads the account and shows what it found.
 */

export const READING_INTRO_PARAGRAPH =
  'Ongoing, then. Rather than ask you for your sources, templates and tone of voice, '
  + 'let me go and read how you already do this. Two minutes.'

export const READING_HEADER_LABEL = 'Reading how you respond today'

export const READING_STEPS = [
  'Pulled 1,035 reviews across 500 locations',
  'Grouped 742 existing replies by rating, source and author',
  'Matched every reply against your 4 saved templates',
]

export const READING_SUMMARY =
  'Your templates are doing the heavy lifting on positive reviews, and doing it well — '
  + '73% of all replies come from just four of them.'

export interface ReadingTemplateRow {
  template: string
  usedOn: string
  share: string
}

export const READING_TABLE_COLUMNS = ['Template', 'Used on', 'Share of replies'] as const

export const READING_TABLE_ROWS: ReadingTemplateRow[] = [
  { template: '5-star thank you', usedOn: '4–5★', share: '62%' },
  { template: 'Service recovery', usedOn: '3★', share: '9%' },
  { template: 'Appointment follow-up', usedOn: 'Mixed', share: '7%' },
  { template: 'Referral ask', usedOn: '5★', share: '4%' },
]

export const READING_CALLOUT =
  "The negative reviews aren't using them. 31 of the 34 replies to 3★-or-less match no "
  + 'template at all — they average 78 words against 22 for a template reply, and every one '
  + 'of them names a specific problem. Someone on your team is writing these by hand.'

/** Timeline, ms from mount. */
export const READING_TIMING = {
  /** "Agent is thinking" beat before any rows appear. */
  thinking: 1600,
  /** Gap between step rows landing. */
  stepInterval: 450,
  /** After the last step: hairline, then the summary. */
  summaryDelay: 400,
  /** After the summary: the table. */
  tableDelay: 450,
  /** Cascade between table rows. */
  rowStagger: 60,
  /** After the table: the amber callout. */
  calloutDelay: 500,
} as const

/* ─── Second beat: learning the hand-written replies ─────────────────────────── */

export const LEARNING_INTRO_PARAGRAPH =
  "That's the most valuable thing in your account, and I'd rather learn it than paper over "
  + 'it with a template. Let me read those 31 properly.'

export const LEARNING_HEADER_LABEL = 'Learning how your team writes the hard ones'

export const LEARNING_STEPS = [
  'Re-read 31 human-written replies end to end',
  'Extracted the moves they have in common',
  'Checked what they deliberately never do',
]

export const LEARNING_SUMMARY =
  "There's no template hiding in here — but there is a consistent method. I've written it "
  + 'down as guidelines:'

export interface LearningGuideline {
  text: string
  /** Support count, e.g. "29 of 31" — or a stat like "median 78". */
  meta: string
}

export const LEARNING_GUIDELINES: LearningGuideline[] = [
  { text: 'Name the specific problem in the first line. Never open with "Sorry for your experience".', meta: '29 of 31' },
  { text: 'Acknowledge before explaining. Not one reply leads with a defence.', meta: '31 of 31' },
  { text: 'Offer exactly one next step, with a named person and a channel to reach them.', meta: '27 of 31' },
  { text: 'Move refunds, billing disputes and clinical detail out of public view and into a direct message.', meta: '31 of 31' },
  { text: 'Sign off with a real first name, never the brand name.', meta: '30 of 31' },
  { text: 'Stay between 60 and 90 words.', meta: 'median 78' },
]

export const LEARNING_CALLOUT =
  "Guidelines sorted. I'll hold every reply I generate to these — not just the negative ones."

/* ─── Third beat: where the reviews actually come from ───────────────────────── */

export const SOURCES_HEADER_LABEL = 'Checking where your reviews actually come from'

export const SOURCES_STEPS = [
  'Scanned connected sources',
  'Checked reply permissions on each',
  'Compared that against where reviews are landing',
]

export const SOURCES_SUMMARY =
  'Two sources are connected and will accept a reply from the agent, so those are the two '
  + 'I will post to.'

export interface ReviewSourceRow {
  name: string
  reviews: string
  note: string
}

export const SOURCES_CONNECTED: ReviewSourceRow[] = [
  { name: 'Google', reviews: '650.2K reviews', note: 'Connected · replies enabled' },
  { name: 'Facebook', reviews: '128.4K reviews', note: 'Connected · replies enabled' },
]

export const SOURCES_SKIPPED_INTRO =
  "These are collecting reviews but can't accept a reply yet, so the agent will skip them:"

export const SOURCES_SKIPPED: ReviewSourceRow[] = [
  { name: 'Google Play', reviews: '239.9K reviews', note: 'Review volume, but not connected for replies' },
  { name: 'ShopperApproved', reviews: '82.3K reviews', note: 'Review volume, but not connected for replies' },
]

/** Teases the fourth beat — sits outside the block as its own reply. */
export const SOURCES_NEXT_PARAGRAPH =
  "One more thing, which you didn't ask for and I think you'll want."

/* ─── Fourth beat: the spam gate ─────────────────────────────────────────────── */

export const SPAM_SCREEN_HEADER_LABEL = 'Screening for reviews you should never reply to'

export const SPAM_SCREEN_STEPS = [
  'Clustered near-identical review text across unrelated locations',
  'Flagged off-topic links and competitor brand mentions',
]

/** Leads the findings here — the risk comes before the resolution. */
export const SPAM_SCREEN_ALERT =
  '11 of the 1,035 are spam. Identical text posted across six unrelated locations, two '
  + 'carrying off-topic links, and one where a competitor names their own brand. A public '
  + 'reply to any of those makes you look automated and hands them reach.'

export const SPAM_SCREEN_FOOTNOTE =
  'So the spam gate runs before anything else: anything scoring above 0.8 gets held, never '
  + 'answered publicly, and lands in a daily digest so a human makes the call.'

export const SPAM_DIGEST_QUESTION = 'Where should the daily spam digest go?'
export const SPAM_DIGEST_PLACEHOLDER = 'name@company.com'
export const SPAM_DIGEST_CTA = 'Use this address'

/* ─── Fifth beat: the drafted plan ───────────────────────────────────────────── */

export const PLAN_INTRO_PARAGRAPH =
  "That's everything — cadence, sources, routing, guidelines and a spam gate. I'd rather "
  + 'you pull it apart before I build it than after.'

export const PLAN_CARD = {
  title: 'Review response agent',
  badge: 'Plan',
  meta: 'Drafted from 1,035 reviews · 742 replies · 4 templates · 2 connected sources',
  description:
    'Seven sections covering when it runs, how it decides what to say, the guidelines it '
    + 'writes to, and what it will never do on its own.',
  openLabel: 'Open plan',
} as const

export const PLAN_CREATE_CTA = 'Create agent'
