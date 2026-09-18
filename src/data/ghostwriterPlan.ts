/**
 * The plan the Ghostwriter drafts before building — opened from the plan card's "Open plan".
 *
 * Every line carries a stable id so a note can be attached to it. Sections 1–4 come from the
 * conversation that produced them; 5–7 were drafted to match (routing, the hard limits, and
 * how it stays reviewable).
 */

export interface PlanLine {
  id: string
  text: string
  /** `lead` = the section's opening statement, `bullet` = a supporting point. */
  kind: 'lead' | 'bullet'
}

export interface PlanSection {
  n: number
  title: string
  /** Grey aside under the title. */
  caption?: string
  lines: PlanLine[]
}

export const PLAN_PANEL_HINT =
  'Select any line to leave a note — the agent revises the plan before anything gets built.'

/** Sections render as `PLAN_SECTION_PREFIX` + n, e.g. "Step 3". */
export const PLAN_SECTION_PREFIX = 'Step'

export const PLAN_SECTIONS: PlanSection[] = [
  {
    n: 1,
    title: 'When it runs',
    lines: [
      { id: 's1-lead', kind: 'lead', text: 'A new review is posted, or an existing review is edited.' },
      { id: 's1-b1', kind: 'bullet', text: 'Sources: Google and Facebook.' },
      { id: 's1-b2', kind: 'bullet', text: 'Scope: all 500 locations.' },
      {
        id: 's1-b3',
        kind: 'bullet',
        text:
          "Nothing posts between 10pm and 7am in the location's own timezone — replies land "
          + 'when a human would plausibly have sent them.',
      },
    ],
  },
  {
    n: 2,
    title: 'Spam and abuse gate',
    caption: 'Runs first, before the agent reads anything else.',
    lines: [
      { id: 's2-lead', kind: 'lead', text: 'Hold any review scoring above 0.8 on the spam model.' },
      { id: 's2-b1', kind: 'bullet', text: 'A held review is never answered publicly, under any condition.' },
      { id: 's2-b2', kind: 'bullet', text: 'Daily digest of everything held, sent at 8am.' },
      { id: 's2-b3', kind: 'bullet', text: 'A human releases it back into the flow or discards it.' },
    ],
  },
  {
    n: 3,
    title: 'How it decides what to say',
    lines: [
      {
        id: 's3-lead',
        kind: 'lead',
        text: '4–5 stars → "5-star thank you" template, posted automatically.',
      },
      {
        id: 's3-b1',
        kind: 'bullet',
        text:
          '3 stars → "Service recovery" template, plus one line naming the specific issue raised, '
          + 'posted automatically.',
      },
      {
        id: 's3-b2',
        kind: 'bullet',
        text:
          '1–2 stars → written fresh against your guidelines, then held for a human to approve '
          + 'before it posts.',
      },
      {
        id: 's3-b3',
        kind: 'bullet',
        text:
          'Anything mentioning safety, a billing dispute or legal action → no reply at all, '
          + 'assigned to a named person instead.',
      },
    ],
  },
  {
    n: 4,
    title: 'Guidelines it writes to',
    caption: 'Learned from the 31 replies your team wrote by hand.',
    lines: [
      { id: 's4-lead', kind: 'lead', text: 'Name the specific problem in the first line.' },
      { id: 's4-b1', kind: 'bullet', text: 'Acknowledge before explaining. Never lead with a defence.' },
      { id: 's4-b2', kind: 'bullet', text: 'Offer exactly one next step, with a named person and a channel to reach them.' },
      { id: 's4-b3', kind: 'bullet', text: 'Move refunds, billing disputes and clinical detail into a direct message.' },
      { id: 's4-b4', kind: 'bullet', text: 'Sign off with a real first name, never the brand name.' },
      { id: 's4-b5', kind: 'bullet', text: 'Stay between 60 and 90 words.' },
    ],
  },
  {
    n: 5,
    title: 'Where it posts',
    caption: 'Only sources that will accept a reply.',
    lines: [
      { id: 's5-lead', kind: 'lead', text: 'A reply goes back to the source the review came from, and nowhere else.' },
      { id: 's5-b1', kind: 'bullet', text: 'Google and Facebook — posted directly by the agent.' },
      { id: 's5-b2', kind: 'bullet', text: "Google Play and ShopperApproved — skipped, they can't accept a reply yet." },
      { id: 's5-b3', kind: 'bullet', text: 'Nothing is cross-posted, and nothing is sent by email to the reviewer.' },
    ],
  },
  {
    n: 6,
    title: 'What it never does on its own',
    caption: 'These always wait for a person.',
    lines: [
      { id: 's6-lead', kind: 'lead', text: 'Publishing anything rated 1 or 2 stars without an approval.' },
      { id: 's6-b1', kind: 'bullet', text: 'Answering a review the spam gate has held.' },
      { id: 's6-b2', kind: 'bullet', text: 'Naming a staff member, quoting a price, or promising a refund.' },
      { id: 's6-b3', kind: 'bullet', text: 'Replying where safety, legal action or a billing dispute is mentioned.' },
    ],
  },
  {
    n: 7,
    title: 'How you keep an eye on it',
    lines: [
      { id: 's7-lead', kind: 'lead', text: 'Everything it does is logged, and nothing it does is hidden.' },
      { id: 's7-b1', kind: 'bullet', text: 'Every reply records the template or guideline it was written against.' },
      { id: 's7-b2', kind: 'bullet', text: 'The daily digest of held reviews arrives at 8am.' },
      { id: 's7-b3', kind: 'bullet', text: 'Pausing the agent stops new replies at once; replies already posted stay up.' },
    ],
  },
]

export const PLAN_PANEL_COPY = {
  notePrompt: 'What should change here?',
  noteAdd: 'Add note',
  noteCancel: 'Cancel',
  revise: 'Revise plan',
  emptyNotes: 'No notes yet',
} as const
