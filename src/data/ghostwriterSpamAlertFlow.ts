/**
 * Scripted "Edit with AI" run for the Ghostwriter canvas, triggered by the seeded
 * spam-alerts prompt (GHOSTWRITER_CANVAS_SEED_PROMPT). Copy and timings live here so the
 * flow component stays presentational.
 */

export interface SpamAlertStep {
  /** Row copy. Grey once complete, dark while active. */
  label: string
}

export interface SpamAlertMessage {
  /** Text before the inline link, if any. */
  text: string
  /** When set, `text` is followed by this link and then `textAfter`. */
  link?: string
  textAfter?: string
}

export interface SpamAlertOption {
  id: string
  title: string
  description: string
  recommended?: boolean
  /** Reply posted when this option is chosen. The option's title echoes as a user turn first. */
  reply: SpamAlertMessage
}

export const SPAM_ALERT_STEPS: SpamAlertStep[] = [
  { label: 'Located the spam gate — task 2 of 7 in your workflow' },
  { label: 'Confirmed the digest recipient lives on that task, not in account settings' },
  { label: 'Checked whether anything else references the old address' },
]

/** Lands under a hairline once the steps finish. */
export const SPAM_ALERT_VERDICT =
  'Only the spam gate uses it, so this is a clean change — nothing else in the workflow points at that address.'

/** The node the "Spam and abuse gate" link points at. */
export const SPAM_ALERT_LINK_LABEL = 'Spam and abuse gate'

export const SPAM_ALERT_MESSAGES: SpamAlertMessage[] = [
  {
    text:
      'Done. The daily spam digest now goes to reviews-alerts@birdeye.com — it was '
      + 'reviews-team@example.com. You can check it in ',
    link: SPAM_ALERT_LINK_LABEL,
    textAfter: '.',
  },
  {
    text:
      "One thing you'll want to know before you leave it there: reviews-alerts@birdeye.com "
      + 'isn’t a user on this account. The digest will arrive, but nobody reading that inbox '
      + 'can release or discard a held review without logging in as someone else — so the 11 '
      + 'reviews currently on hold would just sit there.',
  },
  { text: 'Worth keeping a real user on it as well:' },
]

/**
 * Both options reply with this same confirmation — per the approved design. Note the copy
 * says "Both addresses are on it now" even for "Just the new address"; that's intentional
 * per the reference, not a mix-up. Give each option its own `reply` to differentiate.
 */
const SPAM_ALERT_CHOICE_REPLY: SpamAlertMessage = {
  text:
    'Both addresses are on it now, and the old one keeps its dashboard permissions. '
    + 'Have a look in ',
  link: SPAM_ALERT_LINK_LABEL,
  textAfter: ' — nothing else about the agent changed.',
}

export const SPAM_ALERT_OPTIONS: SpamAlertOption[] = [
  {
    id: 'both',
    title: 'Send to both addresses',
    description:
      'reviews-team@example.com stays on it, so someone can still action a hold from the dashboard.',
    recommended: true,
    reply: SPAM_ALERT_CHOICE_REPLY,
  },
  {
    id: 'new-only',
    title: 'Just the new address',
    description:
      "I'll leave it as a notification-only inbox. Holds will need someone to go looking for them.",
    reply: SPAM_ALERT_CHOICE_REPLY,
  },
]

/** Placeholder shown while the run is in flight. */
export const SPAM_ALERT_BUSY_PLACEHOLDER = 'Reading your account — one moment…'

/** Timeline, ms from the send. */
export const SPAM_ALERT_TIMING = {
  /** Working card appears. */
  cardIn: 400,
  /** Gap between each step completing. */
  stepInterval: 1100,
  /** After the last step: hairline, then the verdict. */
  verdictDelay: 500,
  /** After the verdict: each reply. */
  messageDelay: 700,
  /** After the last reply: the option cards. */
  optionsDelay: 500,
} as const
