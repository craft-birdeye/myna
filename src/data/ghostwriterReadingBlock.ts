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
  'Four templates cover 73% of all your replies, and they do the positive reviews well — '
  + 'the 5-star thank you alone is 62% of them.'

/** The finding that matters, as prose rather than a table — the plan carries the detail. */
export const READING_FOOTNOTE =
  "The negative reviews aren't using them at all. 31 of the 34 replies to 3★ or less match "
  + 'no template: they average 78 words against 22, and every one names a specific problem. '
  + 'Someone on your team is writing those by hand.'

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
  "There's no template hiding in here, but there is a consistent method. Six rules, and "
  + 'almost every reply follows them: name the specific problem in the first line, '
  + 'acknowledge before explaining, offer exactly one next step with a named person, move '
  + 'refunds and billing into a direct message, sign off with a real first name, and stay '
  + 'between 60 and 90 words.'

export const LEARNING_FOOTNOTE =
  "I'll hold every reply I generate to those — not just the negative ones. They're written "
  + 'out in full in the plan.'

/* ─── Third beat: where the reviews actually come from ───────────────────────── */

export const SOURCES_HEADER_LABEL = 'Checking where your reviews actually come from'

export const SOURCES_STEPS = [
  'Scanned connected sources',
  'Checked reply permissions on each',
  'Compared that against where reviews are landing',
]

/** One paragraph, so the Configure sources link can sit last rather than mid-thought. */
export const SOURCES_SUMMARY =
  'Google and Facebook are connected and will accept a reply, so those are the two I will '
  + "post to. Google Play and ShopperApproved are collecting reviews but can't take a reply "
  + 'yet, so the agent skips them rather than queueing replies that would never land.'

/** Plain text link under the finding — the one action this beat offers. */
export const SOURCES_CONFIGURE_CTA = 'Configure sources'

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
export const SPAM_SCREEN_SUMMARY =
  '11 of the 1,035 are spam — identical text posted across six unrelated locations, two '
  + 'carrying off-topic links, and one where a competitor names their own brand. Replying '
  + 'to any of those publicly makes you look automated and hands them reach.'

export const SPAM_SCREEN_FOOTNOTE =
  'So the spam gate runs before anything else: anything scoring above 0.8 gets held, never '
  + 'answered publicly, and lands in a daily digest so a human makes the call.'

export const SPAM_DIGEST_QUESTION = 'Where should the daily spam digest go?'
export const SPAM_DIGEST_PLACEHOLDER = 'name@company.com'
export const SPAM_DIGEST_CTA = 'Submit'

/* ─── Fifth beat: testing the draft before the plan is shown ────────────────── */

export const SIMULATION_INTRO_PARAGRAPH =
  "Before I show you the plan, I'd rather find out where it breaks myself."

export const SIM_RUN_HEADER_LABEL = 'Testing the draft against its own rules'

export const SIM_RUN_STEPS = [
  'Turned each rule in the plan into a scenario it has to survive',
  'Wrote 6 test reviews — one per branch, plus two nobody asks for',
  'Ran all 6 against the draft',
]

export const SIM_RUN_SUMMARY =
  'Four passed. Two did not, and both would have been visible to a customer.'

export const SIM_RUN_FOOTNOTE =
  'An edited review re-triggers the agent, and the draft had no check for a reply already '
  + 'being there — so a customer fixing a typo in their 5-star review gets thanked twice. '
  + 'And on a 2-star review naming a service advisor, the draft repeated that name back in '
  + 'the public reply, which your own guidelines say never to do.'

/* ─── Sixth beat: the fixes, then the same suite again ──────────────────────── */

export const SIM_FIX_HEADER_LABEL = 'Fixing both, then running it again'

export const SIM_FIX_STEPS = [
  'Added a check for an existing reply before anything posts',
  'Made the agent strip staff names out of public replies',
  'Re-ran all 6',
]

export const SIM_FIX_SUMMARY = 'All 6 pass now.'

export const SIM_FIX_FOOTNOTE =
  'Both fixes are in the plan below — the duplicate check in step 1, the name rule in '
  + 'step 6. The full suite lives in the Simulation tab if you want to push on it harder '
  + 'than I did.'

/* ─── Fifth beat: the drafted plan ───────────────────────────────────────────── */

export const PLAN_INTRO_PARAGRAPH =
  "That's everything — cadence, sources, routing, guidelines and a spam gate, and it has "
  + "been through a test pass. I'd still rather you pull it apart before I build it than "
  + 'after.'

export const PLAN_CARD = {
  title: 'Review response agent',
  badge: 'Plan',
  meta: 'Drafted from 1,035 reviews · 742 replies · 4 templates · 2 sources · 6 tests passing',
  description:
    'Seven sections covering when it runs, how it decides what to say, the guidelines it '
    + 'writes to, and what it will never do on its own.',
  openLabel: 'Open plan',
} as const

export const PLAN_CREATE_CTA = 'Create agent'
