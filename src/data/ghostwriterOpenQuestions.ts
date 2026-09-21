/**
 * Ghostwriter playbook flow — the clarifying step before the plan is drafted.
 *
 * Down to a single question. The p.3-vs-p.11 conflict used to be asked here too, but it
 * came out of the per-rule verdict list that the requirements beat no longer shows, so
 * asking about it would reference something the agent never raised. What's left stands on
 * its own: the clinical template it just drafted has a blank in it that only the user can
 * fill.
 *
 * Answering is optional. Skipping carries the question onto the plan as an open decision
 * rather than letting the agent guess.
 */

export interface OpenQuestion {
  id: string
  /** The question, phrased the way the agent would ask it out loud. */
  title: string
  /** Where in the document it comes from, e.g. "p.3 vs p.11". */
  page?: string
  /** The context the user needs to answer well — one short paragraph. */
  body: string
  placeholder: string
}

/** Said just before the modal opens. */
export const OPEN_QUESTIONS_INTRO =
  'One thing I cannot fill in myself, and it is the blank in the clinical template I just '
  + 'drafted.'

export const OPEN_QUESTIONS: OpenQuestion[] = [
  {
    id: 'oq-escalation',
    title: 'Who should a clinical concern escalate to?',
    page: 'p.7',
    body:
      'Page 7 says "the regional team member" but never names anyone, so the escalation has '
      + 'nowhere to go and the clinical template has a blank in it.',
    placeholder: 'Name or email…',
  },
]

/** The reply once the modal is submitted — said before the plan card appears. */
export const OPEN_QUESTIONS_LOCKED_IN =
  'Locked in. Anything you skipped is on the plan as an open decision rather than a default '
  + "I picked for you — you'll see them listed at the bottom."

export const OPEN_QUESTIONS_COPY = {
  /** Trailing button on the question card's free-text row, once something is typed. */
  submit: 'Save',
  skip: 'Skip',
  /** Chat line after the modal closes — counts against however many questions there are. */
  answered: (n: number, total: number) =>
    n === 0
      ? total === 1 ? 'Left open.' : 'All left open.'
      : n === total
        ? total === 1 ? 'Answered.' : 'All answered.'
        : `${n} of ${total} answered.`,
  /** Text link that puts the modal back up. */
  reopen: 'Reopen',
  deferredLabel: 'Deferred to the plan',
} as const
