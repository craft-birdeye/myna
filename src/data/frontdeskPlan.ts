/**
 * Front desk (Myna)'s flavor of the Ghostwriter/Jay & Robin plan card + "See plan" panel —
 * same shape as `data/ghostwriterReadingBlock.ts` (`PLAN_CARD`) and `data/ghostwriterPlan.ts`
 * (`PLAN_SECTIONS`), just grounded in the front-desk conversation's own numbers (847 calls,
 * the four procedures the draft actually landed on) instead of reviews.
 */
import type { PlanSection } from './ghostwriterPlan'

export const FRONTDESK_PLAN_CARD = {
  title: 'Front desk agent',
  badge: 'Plan',
  meta: 'Drafted from 847 calls · 4 procedures · 1 escalation path',
  description:
    'Four sections covering when it runs, how it routes each caller, what it always hands '
    + 'off to a person, and how you keep an eye on it.',
  openLabel: 'Open plan',
} as const

export const FRONTDESK_PLAN_SECTION_PREFIX = 'Step'

export const FRONTDESK_PLAN_SECTIONS: PlanSection[] = [
  {
    n: 1,
    title: 'When it runs',
    lines: [
      { id: 'fd-s1-lead', kind: 'lead', text: 'A voice, chat, or text conversation starts.' },
      { id: 'fd-s1-b1', kind: 'bullet', text: 'Scope: all locations on this instance.' },
      { id: 'fd-s1-b2', kind: 'bullet', text: 'Runs the same way whether the caller reaches out by phone or web chat.' },
    ],
  },
  {
    n: 2,
    title: 'How it routes each caller',
    caption: 'Drafted from what your 847 calls actually asked for.',
    lines: [
      { id: 'fd-s2-lead', kind: 'lead', text: 'General inquiry — answered from the knowledge base: hours, location, insurance, services, doctors.' },
      { id: 'fd-s2-b1', kind: 'bullet', text: 'Book, cancel, or reschedule appointment — the most common job, handled end to end.' },
      { id: 'fd-s2-b2', kind: 'bullet', text: 'Verify insurance — checked against the plans on file before confirming a visit.' },
      { id: 'fd-s2-b3', kind: 'bullet', text: 'Talk to human — whenever the caller asks for a person, or the conversation doesn’t fit the other three.' },
    ],
  },
  {
    n: 3,
    title: 'What it always hands off',
    caption: 'These wait for a person, every time.',
    lines: [
      { id: 'fd-s3-lead', kind: 'lead', text: 'Billing disputes go straight to a human — never resolved or promised on the call.' },
      { id: 'fd-s3-b1', kind: 'bullet', text: 'A caller explicitly asking for a person, or one who sounds frustrated with the agent.' },
      { id: 'fd-s3-b2', kind: 'bullet', text: 'Anything mentioning a medical emergency is routed to the urgent-care procedure, not handled inline.' },
    ],
  },
  {
    n: 4,
    title: 'How you keep an eye on it',
    lines: [
      { id: 'fd-s4-lead', kind: 'lead', text: 'Every call and chat is logged, with the procedure it followed.' },
      { id: 'fd-s4-b1', kind: 'bullet', text: 'Escalations arrive with a full summary of the conversation and the intent it identified.' },
      { id: 'fd-s4-b2', kind: 'bullet', text: 'Pausing the agent stops new conversations at once; calls already in progress finish out.' },
    ],
  },
]
