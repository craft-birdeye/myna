/**
 * Ghostwriter playbook flow — everything the document left unsettled, asked all at once
 * before the plan is drafted. Four gaps in the playbook, one thing it asks for that can't be
 * built, and one thing it never mentions that the agent raises anyway.
 *
 * Skipping is a first-class answer: an unanswered question is carried onto the plan as an
 * open decision rather than quietly guessed.
 */

export const OPEN_QUESTIONS_INTRO =
  'Six things to settle before I build: four your playbook leaves open, one it asks for that '
  + "I can't do, and one it never mentions that I think it should. Answer what you can now — "
  + 'anything you skip goes onto the plan as an open decision rather than something I guessed.'

/** Mirrors the verdicts in the requirements block, minus `clear` (nothing to settle there). */
export type OpenQuestionVerdict = 'detail' | 'conflict' | 'blocked' | 'pushback'

export interface OpenQuestionOption {
  id: string
  label: string
  recommended?: boolean
}

export interface OpenQuestion {
  id: string
  title: string
  /** Where in the document this comes from — omitted for the one it never mentions. */
  page?: string
  verdict: OpenQuestionVerdict
  /** One or two paragraphs of reasoning under the title. */
  body: string[]
  /** Free-text answer instead of options. */
  input?: { placeholder: string; submitLabel: string }
  options?: OpenQuestionOption[]
  /** The "not now" escape. Choosing it defers the question onto the plan. */
  deferLabel?: string
  /** A link out that isn't an answer — doesn't count either way. */
  actionLabel?: string
}

export const OPEN_QUESTIONS: OpenQuestion[] = [
  {
    id: 'oq-escalation',
    title: 'Who should clinical concerns escalate to?',
    page: 'p.7',
    verdict: 'detail',
    body: [
      'Page 7 says "the regional team member" but never names anyone. Without a name, the '
      + 'escalation has nowhere to go and the template above has a blank in it.',
    ],
    input: { placeholder: 'Name or email, comma-separated', submitLabel: 'Assign' },
    deferLabel: 'Add later',
  },
  {
    id: 'oq-speed',
    title: 'How quickly is "quickly"?',
    page: 'p.4',
    verdict: 'detail',
    body: [
      'Page 4 asks for a quick response to negative reviews without giving a number. Your '
      + 'median today is 4h 12m, so this is a real change either way.',
    ],
    options: [
      { id: 'one-hour', label: 'Within 1 hour — matches p.11', recommended: true },
      { id: 'two-hours', label: 'Within 2 hours' },
      { id: 'today', label: "Keep today's pace" },
    ],
    deferLabel: 'Decide later',
  },
  {
    id: 'oq-conflict',
    title: 'Two pages contradict each other',
    page: 'p.3 vs p.11',
    verdict: 'conflict',
    body: [
      'Page 3: 1-star and 2-star must be human-approved. Page 11: everything gets a reply '
      + 'within the hour, including 1-star. A human cannot be guaranteed to approve inside an '
      + 'hour, so one of them has to give.',
    ],
    options: [
      { id: 'approval', label: 'Approval wins — 1-star waits for a human', recommended: true },
      { id: 'speed', label: 'Speed wins — 1-star auto-replies within the hour' },
    ],
    deferLabel: 'Leave unresolved',
  },
  {
    id: 'oq-yelp',
    title: "Yelp can't be included",
    page: 'p.9',
    verdict: 'blocked',
    body: [
      "Page 9 asks for Yelp replies. Yelp isn't connected, and agent replies aren't available "
      + "on your current plan — so I've left it out of the build rather than pretend it works.",
    ],
    options: [{ id: 'understood', label: 'Understood' }],
    actionLabel: 'Configure sources',
  },
  {
    id: 'oq-credit',
    title: 'Offering a 10% credit in a public reply',
    page: 'p.12',
    verdict: 'pushback',
    body: [
      "Page 12 authorises this and I can build it. I'd rather you decided knowingly: a public "
      + "offer invites every other reviewer to ask for the same, and you can't retract it once "
      + "it's posted.",
      'Acknowledging publicly and moving the offer to a direct message gets the same outcome '
      + 'without the exposure.',
    ],
    options: [
      { id: 'dm', label: 'Acknowledge publicly, offer the credit in DM', recommended: true },
      { id: 'public', label: 'Keep it public, as written on p.12' },
    ],
    deferLabel: 'Decide later',
  },
  {
    id: 'oq-spanish',
    title: "Spanish reviews aren't mentioned anywhere",
    verdict: 'pushback',
    body: [
      "You didn't ask about this. 8% of your reviews are in Spanish and the playbook is "
      + 'English-only, so as written the agent would answer a Spanish reviewer in English.',
    ],
    options: [
      { id: 'reviewer-language', label: "Reply in the reviewer's language", recommended: true },
      { id: 'english', label: 'English only' },
    ],
    deferLabel: 'Decide later',
  },
]

/** The reply once the form is submitted — said before the plan card appears. */
export const OPEN_QUESTIONS_LOCKED_IN =
  'Locked in. Anything you skipped is on the plan as an open decision rather than a default '
  + "I picked for you — you'll see them listed at the bottom."

export const OPEN_QUESTIONS_COPY = {
  done: 'Done — draft the plan',
  recommended: 'Recommended',
  /** Reopens a settled question's controls. */
  change: 'Change',
  /** Sub-line for a question that was skipped or explicitly deferred. */
  deferredLabel: 'Deferred to the plan',
  /** Footer tally, e.g. "2 answered · 4 will be deferred". */
  tally: (answered: number, deferred: number) =>
    `${answered} answered · ${deferred} will be deferred`,
} as const
