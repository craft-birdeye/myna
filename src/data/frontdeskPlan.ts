/**
 * Front desk (Myna) plan — the card and sections `GhostwriterPlanCard` / `GhostwriterPlanPanel`
 * show for the Front desk create flow, in place of the review-response defaults.
 *
 * NOTE: this file is referenced by `AgentDetailScreen.tsx` (commit c50566a) but was never
 * committed to the repo. This is a local stand-in with the same exports so the app compiles;
 * replace it with the real file once it lands on the branch.
 */

import type { PlanSection } from './ghostwriterPlan'

export const FRONTDESK_PLAN_CARD = {
  title: 'Front desk agent',
  badge: 'Plan',
  meta: 'Drafted from 312 calls · 4 intents · 2 calendars · 5 tests passing',
  description:
    'Five sections covering when it answers, how it books and reschedules, what it says, '
    + 'and what it will always hand to a person.',
} as const

/** Sections render as `FRONTDESK_PLAN_SECTION_PREFIX` + n, e.g. "Step 3". */
export const FRONTDESK_PLAN_SECTION_PREFIX = 'Step'

export const FRONTDESK_PLAN_SECTIONS: PlanSection[] = [
  {
    n: 1,
    title: 'When it answers',
    lines: [
      { id: 'fd1-lead', kind: 'lead', text: 'Every inbound call the front desk does not pick up within three rings.' },
      { id: 'fd1-b1', kind: 'bullet', text: 'Covers all locations, around the clock — including after hours and weekends.' },
      { id: 'fd1-b2', kind: 'bullet', text: 'If a staff member picks up mid-greeting, the agent drops off silently.' },
    ],
  },
  {
    n: 2,
    title: 'What it handles on its own',
    lines: [
      { id: 'fd2-lead', kind: 'lead', text: 'Booking, rescheduling and cancelling appointments against the live calendar.' },
      { id: 'fd2-b1', kind: 'bullet', text: 'Hours, address, parking and insurance questions, answered from the knowledge base.' },
      { id: 'fd2-b2', kind: 'bullet', text: 'Confirmation by text to the number the caller rang from.' },
    ],
  },
  {
    n: 3,
    title: 'How it speaks',
    caption: 'Learned from the calls your team handled by hand.',
    lines: [
      { id: 'fd3-lead', kind: 'lead', text: 'Opens with the location name and asks how it can help — no scripted menu.' },
      { id: 'fd3-b1', kind: 'bullet', text: 'Confirms date, time and location back to the caller before booking.' },
      { id: 'fd3-b2', kind: 'bullet', text: 'Keeps every turn under two sentences.' },
    ],
  },
  {
    n: 4,
    title: 'What it always hands to a person',
    caption: 'These never resolve without a human.',
    lines: [
      { id: 'fd4-lead', kind: 'lead', text: 'Anything that sounds like an emergency — transferred at once, no questions first.' },
      { id: 'fd4-b1', kind: 'bullet', text: 'Billing disputes, complaints and requests to speak to a manager.' },
      { id: 'fd4-b2', kind: 'bullet', text: 'A caller who asks for a person, at any point, for any reason.' },
    ],
  },
  {
    n: 5,
    title: 'How you keep an eye on it',
    lines: [
      { id: 'fd5-lead', kind: 'lead', text: 'Every call is recorded, transcribed and tagged with what the agent did.' },
      { id: 'fd5-b1', kind: 'bullet', text: 'A daily digest of transfers and missed bookings arrives at 8am.' },
      { id: 'fd5-b2', kind: 'bullet', text: 'Pausing the agent sends calls straight to voicemail; nothing already booked changes.' },
    ],
  },
]
