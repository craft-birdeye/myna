// Shared data + helpers for the agent Recommendation tab (table) and its full-page detail screen.

import type { BlockVariant } from '../components/Block/Block.types'
import type { ProcedureSidePanelStep } from '../components/ProcedureSidePanel/ProcedureSidePanel.types'

export type GapType = 'procedure' | 'knowledge' | 'action'
export type Priority = 'High' | 'Medium' | 'Low'

export interface ProcedureStep {
  title: string
  bullets: string[]
}

export interface ManualUpdate {
  icon: string
  title: string
  description: string
  /** Which change section this manual action feeds back into once resolved (Chat view routes the
   *  refinement here directly instead of guessing from the answer text). */
  relatedType?: GapType
}

export interface DiffChange {
  location: string
  before: string
  after: string
}

export type Channel = 'Voice' | 'Chat' | 'Text'

export interface ConversationItem {
  name: string
  message: string
  channel: Channel
  date: string
  location: string
}

export type Turn = { role: 'user' | 'agent'; text: string; time: string }

/**
 * One type-specific piece of a recommendation (a procedure change, a knowledge gap, or an
 * action gap) with its own description and current/proposed steps. A recommendation can bundle
 * more than one of these together (e.g. a call gap that's part knowledge, part procedure, part
 * action) — see `Recommendation.changes`.
 */
export interface RecommendationChange {
  type: GapType
  description: string
  currentSteps?: ProcedureStep[]
  proposedSteps: ProcedureStep[]
}

/** One piece of a bespoke, hand-authored initial Chat-view message — used instead of the
 *  generic `thoughts` + `rationale` pairing when a recommendation's opening message needs a
 *  specific narrative (e.g. multiple named "thinking" steps) that doesn't fit that template. */
export type IntroBlock =
  | { kind: 'thought'; label?: string; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'list'; items: { label: string; text: string }[] }
  | { kind: 'divider'; text: string }
  | {
      kind: 'collapsible'
      label: string
      meta?: string
      defaultExpanded?: boolean
      children: IntroBlock[]
      /** Only meaningful on the "Read the reported conversation" block: a short excerpt of the
       *  flagged exchange (shown inline in the "Reported conversation" block) and the feedback
       *  text a team member gave when flagging it. The full transcript (in `children`) is only
       *  shown via the "View Transcript" side panel, not inline. */
      reportedExcerpt?: { speaker: string; text: string }[]
      feedback?: string
    }
  | { kind: 'transcript'; lines: { speaker: string; text: string }[] }
  | {
      kind: 'section'
      heading: string
      text: string
      showConversationsLink?: boolean
      /** Rendered as a bullet list inside the same bar-quoted block as `text` — e.g. the list
       *  of details needed under an "Action needed" section, so the whole ask reads as one
       *  block instead of a floating list underneath it. */
      items?: { label: string; text: string }[]
      /** Bar color for this block — see `Block`. Defaults to 'neutral' (plain gray bar). */
      variant?: BlockVariant
    }

/** A hand-authored reply to the first Chat-view refinement turn — replaces the generic
 *  "I've updated the recommendation..." response, and ends in a custom approve/reject prompt
 *  instead of the standard "Do you accept this recommendation?" one. */
export interface ScriptedTurnResponse {
  introBlocks: IntroBlock[]
  approvalPrompt: string
}

export interface Recommendation {
  id: string
  gapType: GapType
  title: string
  procedureTitle: string
  summary: string
  /** Seed value only — the Recommendations table always recomputes the displayed Impact chip
   *  from `conversationCount` relative to the busiest recommendation currently shown (see
   *  `computeImpact`), rather than trusting this hand-authored value. */
  priority: Priority
  timeAgo: string
  conversationCount: number
  isNew: boolean
  whenToUse: string
  originalWhenToUse?: string
  /** Shown in the procedure side panel's "When to exit this procedure?" section. */
  exitCriteria?: string
  steps: ProcedureStep[]
  originalSteps?: ProcedureStep[]
  /** Overrides the procedure side panel's Steps with an added/removed-annotated version — only
   *  for "Procedure updated" recommendations where there's a genuine before/after to show. Omit
   *  for "Procedure created" recommendations (nothing to diff against yet). */
  stepsWithDiff?: ProcedureSidePanelStep[]
  tools: { label: string; icon: string }[]
  rationale: string
  /** First-person "chain of thought" line shown in the Chat view's collapsible Thoughts section. */
  thoughts?: string
  /** Overrides the initial Chat-view message (normally `thoughts` + `rationale`) with a
   *  hand-authored sequence of thought/searched/text/list blocks. Only applies to the very
   *  first message — refinement turns are unaffected. */
  introBlocks?: IntroBlock[]
  /** Shows an Approve/Reject prompt right after `introBlocks` finishes revealing — for a
   *  recommendation that resolves entirely in its first message, with no `composerPrefill`/
   *  `scriptedTurnResponse` second turn needed (e.g. a "direct fix" coaching recommendation). */
  introApprovalPrompt?: string
  /** Text that pre-fills the Chat-view composer the first time it's focused, before the user
   *  has sent a refinement — lets a bespoke scripted flow demo without retyping the answer. */
  composerPrefill?: string
  /** Hand-authored reply to the first refinement turn — see `ScriptedTurnResponse`. */
  scriptedTurnResponse?: ScriptedTurnResponse
  /** Agent's reply once a `scriptedTurnResponse`'s Approve button is clicked. */
  approvedReply?: string
  changeType: string
  diff?: DiffChange
  conversations: ConversationItem[]
  sim?: { before: Turn[]; after: Turn[] }
  outcomes?: string[]
  manualUpdates?: ManualUpdate[]
  /** Where this recommendation came from. Omitted (or 'ai') for the static, gap-detected rows below. */
  source?: 'ai' | 'feedback'
  /** Restricts a recommendation to one agent's table. Omitted = shown for every agent (existing behavior). */
  agentName?: string
  /** Inbox conversation id this feedback was raised from — lets "See conversations" open the
   *  actual real transcript instead of a synthetic one. Only set for `source: 'feedback'` rows. */
  sourceConversationId?: string
  /** Id of the specific message that was marked thumbs-down — the real transcript preview
   *  highlights this one with a thumbs-down icon. Only set for `source: 'feedback'` rows. */
  sourceMessageId?: string
  /** Name of the person who flagged the message — shown in the Recommendation tab's Type
   *  column in place of "Human feedback". Only set for `source: 'feedback'` rows. */
  reportedBy?: string
  /** Short excerpt of the real Inbox exchange the feedback was raised on — rendered as a "Read
   *  the reported conversation" screenshot at the top of the recommendation detail chat. Only
   *  set for generic (non-`introBlocks`) `source: 'feedback'` rows — the hand-scripted coaching
   *  examples already embed their own excerpt directly inside `introBlocks`. */
  reportedExcerpt?: { speaker: string; text: string }[]
  /** Full transcript backing `reportedExcerpt`, shown via the "View Transcript" side panel. */
  reportedTranscript?: { speaker: string; text: string }[]
  /** The exact text a team member typed when flagging the message — quoted in the "Read the
   *  reported conversation" block's Feedback line. */
  reportedFeedbackText?: string
  /**
   * When a recommendation spans more than one gap type (procedure + knowledge + action all at
   * once), this lists each piece separately for the detail screen. Omitted = single-type
   * recommendation, and the detail screen falls back to the legacy `steps`/`originalSteps`/`changeType` fields.
   */
  changes?: RecommendationChange[]
  [key: string]: unknown
}

/** All distinct gap types a recommendation touches — usually one, but see `changes` above. */
export function getRecommendationTypes(rec: Recommendation): GapType[] {
  if (rec.changes && rec.changes.length > 0) {
    return Array.from(new Set(rec.changes.map((c) => c.type)))
  }
  return [rec.gapType]
}

// ── Data ─────────────────────────────────────────────────────────────────────

export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'r1',
    gapType: 'procedure',
    title: 'Add payment procedure',
    procedureTitle: 'Payment processing procedure',
    summary: '12 conversations impacted • No payment guidance available',
    priority: 'High',
    timeAgo: '2h ago',
    conversationCount: 12,
    isNew: true,
    whenToUse: 'When a customer asks about making a payment for services, parts, or outstanding balances — by phone, online, or in person.',
    exitCriteria: 'The payment is confirmed and logged, or the customer is handed off to billing for a failed payment — whichever comes first.',
    steps: [
      {
        title: 'Acknowledge and identify payment type',
        bullets: [
          '"I\'d be happy to help you take care of that." Ask what the payment is for: a service invoice, a parts order, or an outstanding balance.',
          "Look up the customer's account using their name or phone number via {{DMS Integration}}.",
          'Confirm the exact amount due and read it back to the customer before proceeding.',
        ],
      },
      {
        title: 'Route to the right payment channel',
        bullets: [
          'Phone — collect card details securely over the call and process through {{DMS Integration}}. Never ask the customer to say their full card number out loud if a secure entry line is available.',
          'Online — direct the customer to payments.dealership.com and confirm they have the invoice number from their receipt.',
          'In person — confirm the service desk location and current business hours before ending the call.',
        ],
      },
      {
        title: 'Process and confirm',
        bullets: [
          'Submit the payment through {{DMS Integration}} and wait for confirmation before telling the customer it succeeded.',
          'If the payment fails, offer to retry with a different card or escalate to billing — do not end the call on a failure with no next step.',
          'Send a payment confirmation via email or text using {{Send Confirmation}} once the transaction clears.',
        ],
      },
      {
        title: 'Close and log',
        bullets: [
          "Update the customer's record in the {{DMS Integration}} with the payment details and channel used.",
          'Ask if there is anything else the customer needs before ending the conversation.',
        ],
      },
    ],
    tools: [
      { label: 'DMS Integration', icon: 'storage' },
      { label: 'Send Confirmation', icon: 'send' },
    ],
    thoughts: 'I clustered 12 recent conversations where customers asked about payments and the agent had no guidance. Let me review the current procedure library for coverage.',
    rationale: "Based on the last 7 days of conversations, we identified that 12 customers couldn't complete a payment because the agent lacked the necessary guidance. We've generated the following recommendation:",
    introBlocks: [
      { kind: 'section', heading: 'Issue', text: "Callers ask how to pay a bill, or what a visit will cost. Myna has no payment or pricing information, so it sends every one of these calls to a live agent — 12 in the last 24 hours, at an average of 3 minutes each. And 3 of those came in outside business hours, when billing is closed, so the call just ended with no help.", showConversationsLink: true },
      { kind: 'thought', text: 'The gap is that Myna has no payment info, so let me first check whether any payment content already exists before I ask the user for anything.' },
      { kind: 'thought', label: 'Searched procedures', text: "Myna has procedures for booking, insurance collection, and cancellation — but nothing for payments or pricing. So the moment a caller mentions paying, there's nothing to fall back on and it transfers." },
      { kind: 'thought', text: "This is a content gap, not a logic change — how to pay and what a visit costs are fixed, non-private facts that are safe for Myna to say. But I don't have those details, and I shouldn't invent a payment link or a price. I need to get them from the user before I can build anything. I'll lay out exactly what's needed and stop here." },
      { kind: 'text', text: "Here's what's happening: 12 recent calls asked about payments, and since Myna had no payment guidance to fall back on, every one was routed to a live agent." },
      { kind: 'section', heading: 'Action needed', variant: 'danger', text: "Give Myna a Payments & Cost procedure so it can answer these directly instead of transferring. To build it, I need a few details from you (or upload a billing/pricing doc and I'll pull them from it):", items: [
        { label: 'How to pay', text: 'online link, phone number for billing, in person?' },
        { label: 'Billing hours', text: 'e.g., Mon–Fri, 9am–5pm' },
        { label: 'Payment plans', text: 'do you offer them, and how does someone set one up?' },
        { label: 'Self-pay price for a standard visit', text: 'a rough figure is fine; Myna will say "around" or "starting at"' },
      ] },
    ],
    composerPrefill: 'Pay online at pay.kidzpulm.com/bill, or by phone at (305) 555-0190. Billing is open Mon–Fri, 9 to 5. Yes we do payment plans — patients call that same billing number to set one up. A standard self-pay visit is around $150.',
    scriptedTurnResponse: {
      introBlocks: [
        { kind: 'thought', text: "Now I have everything. I'll create a Payments & Cost procedure with these details, and add a line so Myna offers to text the payment link — that's the fastest path for the caller. Then I'll test it before locking it in." },
        {
          kind: 'collapsible',
          label: 'Procedure created: Payments & Cost',
          meta: '+4 additions',
          children: [
            { kind: 'list', items: [
              { label: 'How to pay', text: 'online link or phone for billing' },
              { label: 'Billing hours', text: 'Mon–Fri, 9 to 5' },
              { label: 'Payment plans', text: 'call the billing number to set one up' },
              { label: 'Self-pay price', text: 'around $150 for a standard visit' },
            ] },
          ],
        },
        { kind: 'thought', text: 'Let me test it with a sample first message to make sure Myna answers directly instead of transferring.' },
        {
          kind: 'collapsible',
          label: 'Current agent response',
          meta: 'Before this update',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "Hi, I got a bill for my son's visit, how do I pay?" },
              { speaker: 'Myna', text: "I'm sorry, I don't have information about payments. Let me transfer you to our billing team." },
            ] },
          ],
        },
        {
          kind: 'collapsible',
          label: 'Revised agent response',
          meta: '18.4s',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "Hi, I got a bill for my son's visit, how do I pay?" },
              { speaker: 'Myna', text: 'You can pay online — I can text you the secure payment link right now. You can also pay by phone at (305) 555-0190, Monday to Friday, 9 to 5, or in person at the front desk. Would you like me to text you the link?' },
            ] },
          ],
        },
      ],
      approvalPrompt: "Would you like to proceed with adding this procedure to the agent's workflow? Please accept to continue, or reject to discard these changes.",
    },
    approvedReply: 'The Payments & Cost procedure has been added to the workflow and saved to your procedure library.',
    outcomes: [
      'Added a Payment processing procedure to help the agent handle future payment requests more effectively.',
      'Once accepted, the procedure will be added to this workflow and saved to your procedure library for reuse.',
    ],
    changeType: 'New procedure added to the library.',
    conversations: [
      { name: 'Sarah Mitchell',  message: 'How do I make a payment for my service invoice?', channel: 'Voice', date: 'Jun 9', location: 'Mountain View' },
      { name: 'James Rodriguez', message: 'Can I pay my balance online somewhere?',           channel: 'Chat',  date: 'Jun 8', location: 'Palo Alto' },
      { name: 'Emily Chen',      message: 'I need to pay for my oil change, do you accept Apple Pay?', channel: 'Text', date: 'Jun 7', location: 'San Jose' },
      { name: 'Marcus Williams', message: 'What are my payment options for the repair?',      channel: 'Voice', date: 'Jun 7', location: 'Sunnyvale' },
      { name: 'Priya Patel',     message: 'Can I split the payment across two cards?',        channel: 'Chat',  date: 'Jun 6', location: 'Mountain View' },
    ],
    sim: {
      before: [],
      after: [
        { role: 'user' as const,  text: 'Hi, I just picked up my car and I got an invoice. How do I make a payment?', time: '10:12 AM' },
        { role: 'agent' as const, text: "Hi! Thanks for reaching out. I'd be happy to help. Could you tell me if you'd prefer to pay by phone, online, or in person?", time: '10:12 AM' },
        { role: 'user' as const,  text: 'Online would be easiest for me. Do you have a payment portal?', time: '10:13 AM' },
        { role: 'agent' as const, text: "Yes! You can pay securely at payments.dealership.com — it accepts Visa, Mastercard, Amex, and most debit cards. You'll need the invoice number from the top of your receipt. I can also send the link to the email on file if that's easier. Would you like me to do that?", time: '10:13 AM' },
      ],
    },
  },
  {
    id: 'r7',
    gapType: 'knowledge',
    title: 'Add insurance verification procedure',
    procedureTitle: 'Accepted insurance & self-pay procedure',
    summary: "18 conversations impacted • Agent couldn't confirm coverage",
    priority: 'High',
    timeAgo: '1h ago',
    conversationCount: 18,
    isNew: true,
    whenToUse: 'When a caller asks whether a specific insurance plan is accepted, or what a visit costs without insurance.',
    exitCriteria: 'The caller has a clear coverage answer and either moves into booking or ends the call — whichever they choose.',
    steps: [
      {
        title: 'Confirm accepted plans',
        bullets: [
          'State whether the Medicaid or commercial plan the caller named is accepted.',
          'If the plan is not on the list, use the fallback line: "I don\'t see that one on our accepted list, but I can take your details and our team will confirm before your visit."',
        ],
      },
      {
        title: 'Move into booking',
        bullets: [
          'Quote the self-pay price for callers with no insurance.',
          'Offer to continue straight into booking once coverage is confirmed.',
        ],
      },
    ],
    tools: [],
    thoughts: "Callers are asking whether their plan is accepted, and Myna can't answer. Let me check what the current insurance procedure actually covers.",
    rationale: "Customers call before booking to ask if the clinic takes their insurance, or what a visit costs without it. Myna only knows how to collect insurance details during booking — it can't say which plans are accepted, so new customers hang up rather than register just to find out if they're covered.",
    introBlocks: [
      { kind: 'section', heading: 'Issue', text: "Customers call before booking to ask if the clinic takes their insurance, or what a visit costs without it. Myna only knows how to collect insurance details during booking — it can't say which plans are accepted, so it gives a vague answer. 18 conversations in the last 7 days started with an insurance-acceptance question, and 11 of those ended without a booking — new patients lost at the very first question.", showConversationsLink: true },
      { kind: 'thought', text: "Callers are asking whether their plan is accepted, and Myna can't answer. Let me check what the current insurance procedure actually covers." },
      { kind: 'thought', label: 'Searched procedures', text: "The insurance procedure collects plan name and member ID during booking and says the team verifies offline. Nothing anywhere lists which plans are accepted — so Myna can't answer the question callers ask first." },
      { kind: 'thought', text: "The accepted-plan list is a fixed business fact and safe to share. But I don't have it, and guessing a plan list would be a serious mistake — Myna could tell someone we take a plan we don't. I need the real list from the user before building anything." },
      { kind: 'text', text: "Here's what's happening: 18 conversations in the last 7 days opened with an insurance question, and 11 of those callers hung up without booking rather than register just to find out if they're covered." },
      { kind: 'section', heading: 'Action needed', variant: 'danger', text: "Add accepted-insurance details to the agent. To build it, I need a few details from you (or upload an insurance acceptance doc and I'll pull them from it):", items: [
        { label: 'Medicaid plans accepted', text: 'e.g., Sunshine Health, Simply, Molina' },
        { label: 'Commercial plans accepted', text: 'e.g., Aetna, Cigna, Florida Blue' },
        { label: 'Self-pay price, standard visit', text: 'for callers with no insurance' },
        { label: 'What to say for a plan not on the list', text: 'or Myna can use a standard line: "I can take your details and our team will confirm before your visit."' },
      ] },
    ],
    composerPrefill: 'Medicaid: Sunshine Health, Simply, Molina. Commercial: Aetna, Cigna, Florida Blue, UnitedHealthcare. Self-pay is around $150. And yes, that fallback line is fine.',
    scriptedTurnResponse: {
      introBlocks: [
        { kind: 'thought', text: "I have the plan lists, the self-pay price, and the fallback line. I'll create the procedure so Myna confirms accepted plans, quotes the self-pay price, uses the fallback for anything else, and always offers to continue into booking — the goal is to stop losing these callers at question one." },
        {
          kind: 'collapsible',
          label: 'Procedure created: Accepted Insurance & Self-Pay',
          meta: '+3 additions',
          children: [
            { kind: 'list', items: [
              { label: 'Medicaid', text: 'Sunshine Health, Simply, Molina' },
              { label: 'Commercial', text: 'Aetna, Cigna, Florida Blue, UnitedHealthcare' },
              { label: 'Self-pay price', text: 'around $150 for a standard visit' },
            ] },
          ],
        },
        { kind: 'thought', text: 'Testing with the most common opening question.' },
        {
          kind: 'collapsible',
          label: 'Current agent response',
          meta: 'Before this update',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "Do you take Sunshine Health? That's our Medicaid plan." },
              { speaker: 'Myna', text: "I can help you book an appointment. I'll collect your insurance details during the booking, and our team will verify them." },
            ] },
          ],
        },
        {
          kind: 'collapsible',
          label: 'Revised agent response',
          meta: '21.7s',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "Do you take Sunshine Health? That's our Medicaid plan." },
              { speaker: 'Myna', text: "Yes, we accept Sunshine Health. I can get you booked now — I'll take your insurance details during the booking, and our team will confirm everything before the visit. Would you like to go ahead?" },
            ] },
          ],
        },
      ],
      approvalPrompt: "Would you like to proceed with adding this procedure to the agent's workflow? Please accept to continue, or reject to discard these changes.",
    },
    approvedReply: 'The Accepted Insurance & Self-Pay procedure has been added to the workflow and saved to your procedure library.',
    outcomes: [
      'Added an Accepted Insurance & Self-Pay procedure to help the agent confirm coverage on the spot and carry the caller straight into booking.',
      'Once accepted, the procedure will be added to this workflow and saved to your procedure library for reuse.',
    ],
    changeType: 'New procedure added to the library.',
    conversations: [
      { name: 'Hannah Lee',     message: "Hi, I'm trying to find a lung doctor for my daughter. Before anything else — do you take Sunshine Health? That's our Medicaid plan.", channel: 'Voice', date: 'Jun 9', location: 'Miami' },
      { name: 'Omar Farouk',    message: 'Is Aetna accepted there?',       channel: 'Chat',  date: 'Jun 8', location: 'Doral' },
      { name: 'Susan Park',     message: 'How much is it without insurance?', channel: 'Voice', date: 'Jun 8', location: 'Coral Gables' },
      { name: 'Michael Torres', message: 'Do you take Florida Blue?',      channel: 'Text',  date: 'Jun 7', location: 'Miami' },
    ],
    sim: {
      before: [],
      after: [
        { role: 'user' as const,  text: "Hi, I'm trying to find a lung doctor for my daughter. Before anything else — do you take Sunshine Health? That's our Medicaid plan.", time: '11:02 AM' },
        { role: 'agent' as const, text: "Yes, we accept Sunshine Health. I can get you booked now — I'll take your insurance details during the booking, and our team will confirm everything before the visit. Would you like to go ahead?", time: '11:02 AM' },
      ],
    },
  },
  {
    id: 'r8',
    gapType: 'knowledge',
    title: 'Add visit information procedure',
    procedureTitle: 'Visit information procedure',
    summary: '21 conversations impacted • Routed to staff for basic info',
    priority: 'Medium',
    timeAgo: '3h ago',
    conversationCount: 21,
    isNew: true,
    whenToUse: 'When a caller with an appointment asks what to bring, how long the visit takes, or clinic hours.',
    exitCriteria: "The caller's questions about the visit are answered and they have nothing further to ask.",
    steps: [
      {
        title: 'Share what to bring',
        bullets: ['List photo ID, insurance card, referral if the plan needs one, current medicines, and past records.'],
      },
      {
        title: 'Share visit length and hours',
        bullets: [
          'Give visit length by type — first visit, and extra time for a breathing test.',
          'State clinic hours and mention parking if useful.',
        ],
      },
    ],
    tools: [],
    thoughts: "These are the simplest possible questions — what to bring, how long, what time you close — and they're all being transferred. Let me check whether any visit-info content exists.",
    rationale: "Customers with an appointment call to ask basic questions — what to bring, how long the visit takes, what time the clinic closes. Myna doesn't have any of this, so it transfers or gives a vague answer, for information that never changes.",
    introBlocks: [
      { kind: 'section', heading: 'Issue', text: "Customers with an appointment call to ask basic questions — what to bring, how long the visit takes, what time the clinic closes. Myna doesn't have any of this, so it transfers or gives a vague answer, for information that never changes — 21 conversations in the last 7 days asked one of these questions, all routed to staff, each taking about 2 minutes of front-desk time to answer.", showConversationsLink: true },
      { kind: 'thought', text: "These are the simplest possible questions — what to bring, how long, what time you close — and they're all being transferred. Let me check whether any visit-info content exists." },
      { kind: 'thought', label: 'Searched procedures', text: 'There\'s booking logic, but no visit information at all — no document list, no visit lengths, no hours. Myna even fails on "what time do you close today," the most basic fact about the business.' },
      { kind: 'thought', text: "Everything asked here is fixed and non-private. One small content block closes the whole group. I need the real values from the user — hours and visit lengths aren't things I should guess." },
      { kind: 'text', text: "Here's what's happening: 21 conversations in the last 7 days asked basic visit questions — what to bring, how long it takes, when the clinic closes — and every one was routed to staff." },
      { kind: 'section', heading: 'Action needed', variant: 'danger', text: 'Add visit information to the agent. To get started, please share:', items: [
        { label: 'What to bring to a first visit', text: 'e.g., photo ID, insurance card, referral if the plan needs one, list of current medicines, past records' },
        { label: 'Visit length by type', text: 'e.g., first visit 45–60 min; breathing test adds 20–30 min' },
        { label: 'Clinic hours', text: 'your standard hours' },
        { label: 'Parking', text: 'one line, if useful' },
      ] },
    ],
    composerPrefill: 'Bring a photo ID, insurance card, referral if the plan needs one, a list of current medicines, and any past records. First visit is about 45 minutes to an hour; a breathing test adds 20 to 30 minutes. Hours are Mon–Fri, 8:30 to 5. Free parking behind the building.',
    scriptedTurnResponse: {
      introBlocks: [
        { kind: 'thought', text: "Everything's here. I'll create the Visit Info procedure with the document list, both visit lengths, hours, and the parking note." },
        {
          kind: 'collapsible',
          label: 'Procedure created: Visit Info',
          meta: '+4 additions',
          children: [
            { kind: 'list', items: [
              { label: 'Bring', text: 'photo ID, insurance card, referral if needed, medicines list, past records' },
              { label: 'Visit length', text: 'first visit 45–60 min; breathing test +20–30 min' },
              { label: 'Hours', text: 'Mon–Fri, 8:30 to 5' },
              { label: 'Parking', text: 'free parking behind the building' },
            ] },
          ],
        },
        { kind: 'thought', text: "Testing with a caller who asks several of these at once, since that's how they usually come in." },
        {
          kind: 'collapsible',
          label: 'Current agent response',
          meta: 'Before this update',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "My son's first appointment is today — what do we bring, and how long will it take? He has a breathing test." },
              { speaker: 'Myna', text: 'For that, let me connect you with our front desk. One moment.' },
            ] },
          ],
        },
        {
          kind: 'collapsible',
          label: 'Revised agent response',
          meta: '16.9s',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "My son's first appointment is today — what do we bring, and how long will it take? He has a breathing test." },
              { speaker: 'Myna', text: 'Please bring a photo ID, your insurance card, a referral if your plan needs one, a list of his current medicines, and any past records. A first visit runs about forty-five minutes to an hour, and the breathing test adds twenty to thirty minutes. Anything else?' },
            ] },
          ],
        },
      ],
      approvalPrompt: "Would you like to proceed with adding this procedure to the agent's workflow? Please accept to continue, or reject to discard these changes.",
    },
    approvedReply: 'The Visit Info procedure has been added to the workflow and saved to your procedure library.',
    outcomes: [
      'Added a Visit Info procedure to help the agent answer what to bring, visit length, hours, and parking on the spot.',
      'Once accepted, the procedure will be added to this workflow and saved to your procedure library for reuse.',
    ],
    changeType: 'New procedure added to the library.',
    conversations: [
      { name: 'Elena Sokolova', message: 'Hi, my son has his first appointment today. I just have a couple quick questions.', channel: 'Voice', date: 'Jun 8', location: 'Coral Gables' },
      { name: 'Marcus Rivera',  message: 'What time do you close today?',                 channel: 'Text',  date: 'Jun 8', location: 'Miami' },
      { name: 'Priya Anand',    message: 'How long does a first visit usually take?',     channel: 'Chat',  date: 'Jun 7', location: 'Doral' },
      { name: 'Derek Wong',     message: 'What documents do I need to bring?',            channel: 'Voice', date: 'Jun 7', location: 'Coral Gables' },
    ],
    sim: {
      before: [],
      after: [
        { role: 'user' as const,  text: 'Hi, my son has his first appointment today. I just have a couple quick questions.', time: '09:14 AM' },
        { role: 'agent' as const, text: 'Of course. What would you like to know?', time: '09:14 AM' },
        { role: 'user' as const,  text: 'What do we need to bring? And how long will it take — he has a breathing test, I think.', time: '09:14 AM' },
        { role: 'agent' as const, text: 'Please bring a photo ID, your insurance card, a referral if your plan needs one, a list of his current medicines, and any past records. A first visit runs about forty-five minutes to an hour, and the breathing test adds twenty to thirty minutes.', time: '09:15 AM' },
      ],
    },
  },
  {
    id: 'r9',
    gapType: 'action',
    title: 'Add prescription refill procedure',
    procedureTitle: 'Prescription refill procedure',
    summary: '26 conversations impacted • Refill requests routed to staff',
    priority: 'Medium',
    timeAgo: '4h ago',
    conversationCount: 26,
    isNew: true,
    whenToUse: 'When a caller asks for a prescription refill, such as a daily inhaler or asthma medicine.',
    exitCriteria: 'The refill task is logged for the clinical team, or the caller was escalated because of a safety concern.',
    steps: [
      {
        title: 'Capture refill details',
        bullets: [
          "Confirm the patient's name and date of birth.",
          'Capture the medicine, the pharmacy name and location, and any special note (like a travel supply).',
        ],
      },
      {
        title: 'Set expectations and log the task',
        bullets: [
          'Tell the caller refills are usually sent within 1–2 business days.',
          'Log a task for the clinical team queue to review and approve the refill.',
          'Safety rule: if a child is out of a rescue inhaler and struggling to breathe right now, use {{Trigger Escalation}} to send the caller to 911 or the on-call line instead of taking a refill.',
        ],
      },
    ],
    tools: [{ label: 'Trigger Escalation', icon: 'priority_high' }],
    thoughts: 'Refills are one of the biggest transfer groups. Let me check whether any refill handling exists today.',
    rationale: "Customers call for refills — often an inhaler or a daily asthma medicine. Myna has no refill step, so every one of these calls goes to a person, even though it's mostly just collecting a few details.",
    introBlocks: [
      { kind: 'section', heading: 'Issue', text: "Customers call for refills — often an inhaler or a daily asthma medicine. Myna has no refill step, so every one of these calls goes to a person, even though it's mostly just collecting a few details — 26 refill conversations in the last 7 days were routed to staff this way, each taking about 4 minutes to mostly write down the same details Myna could have captured in the call.", showConversationsLink: true },
      { kind: 'thought', text: 'Refills are one of the biggest transfer groups. Let me check whether any refill handling exists today.' },
      { kind: 'thought', label: 'Searched procedures', text: 'No refill procedure exists. Refill calls fall into the out-of-scope path and transfer every time — then staff write down the patient, the medicine, and the pharmacy by hand.' },
      { kind: 'thought', text: "The task is almost entirely detail collection — confirm the patient, capture the medicine, the pharmacy, and any note, and hand it to the clinician to approve. The only part that needs a human is the approval, which happens after the call anyway. One thing I won't skip: refills touch medicine, so there's a safety edge — a child out of a rescue inhaler and struggling right now is an emergency, not a refill. I'll propose the capture steps and ask for the two operational details I can't decide myself." },
      { kind: 'text', text: "Here's what's happening: 26 refill requests came in over the last 7 days, and every one was routed to staff even though it's mostly just collecting a few details." },
      { kind: 'section', heading: 'Action needed', variant: 'danger', text: 'Add a refill request step to the agent. Myna will confirm the patient, capture the medicine, the pharmacy, and any special note (like a travel supply), then log a task for the clinical team. To set it up, please confirm:', items: [
        { label: 'Turnaround time to tell callers', text: 'e.g., refills are usually sent within 1–2 business days' },
        { label: 'Where refill tasks should go', text: 'which team or queue' },
        { label: 'The safety rule', text: 'if a child is out of a rescue inhaler and struggling to breathe now, Myna sends them to 911 / the on-call line instead of taking a refill' },
      ] },
    ],
    composerPrefill: 'Refills usually go out within 1–2 business days. Send the tasks to the clinical team queue. And yes, keep that emergency rule in.',
    scriptedTurnResponse: {
      introBlocks: [
        { kind: 'thought', text: 'Creating the procedure: confirm patient name and date of birth, capture medicine, pharmacy name and location, any special note, log the task to the clinical queue, and set the 1–2 business day expectation. The emergency branch stays fixed at the top of the flow.' },
        {
          kind: 'collapsible',
          label: 'Procedure created: Refill Request',
          meta: '+6 additions',
          children: [
            { kind: 'list', items: [
              { label: 'Capture', text: 'patient name/DOB, medicine, pharmacy, special note' },
              { label: 'Turnaround', text: '1–2 business days, logged to the clinical queue' },
              { label: 'Safety rule', text: 'struggling to breathe → 911 / on-call line, not a refill' },
            ] },
          ],
        },
        { kind: 'thought', text: "Testing with the travel case, since that's the kind of detail that gets lost in voicemails today." },
        {
          kind: 'collapsible',
          label: 'Current agent response',
          meta: 'Before this update',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "My son takes a daily inhaler for his asthma, and we're traveling to India for two months. I need a refill that covers the whole trip." },
              { speaker: 'Myna', text: "I'm sorry, I'm not able to process refill requests. Let me transfer you to our clinical team." },
            ] },
          ],
        },
        {
          kind: 'collapsible',
          label: 'Revised agent response',
          meta: '24.1s',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "My son takes a daily inhaler for his asthma, and we're traveling to India for two months. I need a refill that covers the whole trip." },
              { speaker: 'Myna', text: "I can take down that refill request. First, can you confirm the patient's name and date of birth?" },
            ] },
          ],
        },
      ],
      approvalPrompt: "Would you like to proceed with adding this procedure to the agent's workflow? Please accept to continue, or reject to discard these changes.",
    },
    approvedReply: 'The Refill Request procedure has been added to the workflow and saved to your procedure library.',
    outcomes: [
      'Added a Refill Request procedure so Myna can capture the patient, medicine, pharmacy, and any note, then log a task for the clinical team.',
      'Once accepted, the procedure will be added to this workflow and saved to your procedure library for reuse.',
    ],
    changeType: 'New procedure added to the library.',
    conversations: [
      { name: 'Diego Ramirez', message: "Hi, my son takes a daily inhaler for his asthma, and we're traveling to India for two months. I need a refill that covers the whole trip — about two months' worth.", channel: 'Voice', date: 'Jun 9', location: 'Miami' },
      { name: 'Sofia Reyes',   message: 'Can I get a refill on my daily asthma medicine?', channel: 'Chat', date: 'Jun 8', location: 'Coral Gables' },
      { name: 'Hannah Lee',    message: 'Need a two-month refill for my inhaler.',          channel: 'Text', date: 'Jun 8', location: 'Doral' },
      { name: 'Marcus Bell',   message: 'How do I request a prescription refill?',          channel: 'Voice', date: 'Jun 7', location: 'Miami' },
    ],
    sim: {
      before: [],
      after: [
        { role: 'user' as const,  text: "Hi, my son takes a daily inhaler for his asthma, and we're traveling to India for two months. I need a refill that covers the whole trip — about two months' worth.", time: '02:20 PM' },
        { role: 'agent' as const, text: "I can take down a refill request for you. First, can you confirm the patient's name and date of birth?", time: '02:20 PM' },
        { role: 'user' as const,  text: 'Diego Ramirez, March third, two thousand fifteen.', time: '02:21 PM' },
        { role: 'agent' as const, text: 'Thank you. Which medicine needs the refill?', time: '02:21 PM' },
        { role: 'user' as const,  text: 'His controller inhaler — the one he takes every day.', time: '02:21 PM' },
        { role: 'agent' as const, text: 'And which pharmacy should we send it to — the name and location?', time: '02:21 PM' },
        { role: 'user' as const,  text: 'The CVS on Bird Road.', time: '02:22 PM' },
        { role: 'agent' as const, text: "Got it. I'll note that you need about a two-month supply because you'll be traveling. Is there anything else the doctor should know?", time: '02:22 PM' },
      ],
    },
  },
  {
    id: 'r10',
    gapType: 'procedure',
    title: 'Add same-day sick visit procedure',
    procedureTitle: 'Sick-visit same-day procedure',
    summary: '14 conversations impacted • Same-day visit routed to staff',
    priority: 'Medium',
    timeAgo: '5h ago',
    conversationCount: 14,
    isNew: true,
    whenToUse: 'When a caller asks if their child can be seen today for a sudden illness.',
    exitCriteria: 'The caller has either booked a same-day slot, been told none are left, or was escalated for an emergency.',
    steps: [
      {
        title: 'Check for emergencies first',
        bullets: [
          'Ask one plain question: is the child having any trouble breathing, or do their lips look blue at all?',
          'If yes, direct the caller to 911 or the on-call line — never book that as a routine visit.',
        ],
      },
      {
        title: 'Offer a same-day slot',
        bullets: [
          'If no emergency, use {{Check Business Hours}} to confirm same-day sick visits are available and any cutoff time (e.g. call before 11am).',
          'Check for an opening and offer to book it.',
          'If the child has an existing appointment and is sick beforehand, keep the appointment unless the clinic calls to reschedule.',
        ],
      },
    ],
    tools: [{ label: 'Check Business Hours', icon: 'schedule' }],
    thoughts: 'These calls sound urgent, but the actual question is a scheduling one — do you take same-day sick visits, and how do I get one. Let me check if any same-day policy exists.',
    rationale: 'Customers call the morning of, or when a child is suddenly sick, asking if they can come in today or if the clinic takes same-day sick visits. Myna has no procedure for this, so it transfers — and these calls spike in cold and flu season, exactly when the front desk is busiest.',
    introBlocks: [
      { kind: 'section', heading: 'Issue', text: "Customers call the morning of, or when a child is suddenly sick, asking if they can come in today or if the clinic takes same-day sick visits. Myna has no procedure for this, so it transfers — 14 conversations in the last 7 days asked about a same-day sick visit this way, most before 10am, the front desk's busiest window.", showConversationsLink: true },
      { kind: 'thought', text: 'These calls sound urgent, but the actual question is a scheduling one — do you take same-day sick visits, and how do I get one. Let me check if any same-day policy exists.' },
      { kind: 'thought', label: 'Searched procedures', text: 'The booking procedure handles regular scheduling, but there\'s no same-day or sick-visit policy anywhere. Every "can we come in today?" call transfers.' },
      { kind: 'thought', text: 'Two things to keep separate here. The answerable part is policy — whether same-day exists and how to request it — and I need that from the user. The part Myna must never do is judge symptoms. "He has a fever" can go to a same-day booking, but for a lung clinic, "he\'s struggling to breathe" or "his lips look blue" is an emergency, and Myna should send that to 911 or the on-call line, not book it. I\'ll build that rule in as fixed, and ask only for the policy.' },
      { kind: 'text', text: "Here's what's happening: 14 conversations in the last 7 days asked about a same-day sick visit, and all of them were routed to staff." },
      { kind: 'section', heading: 'Action needed', variant: 'danger', text: 'Add the same-day visit policy to the agent. To get started, please share:', items: [
        { label: 'Same-day sick visits', text: 'offered? Any cutoff time, e.g., call before 11am?' },
        { label: 'Child sick before an existing appointment', text: 'keep it, or reschedule? The emergency rule stays fixed: if a caller describes trouble breathing, blue lips, or an unresponsive child, Myna sends them to 911 or the on-call line — it never books that as a routine visit.' },
      ] },
    ],
    composerPrefill: 'Yes, we hold same-day sick slots — parents should call before 11am. If a child is sick before a routine appointment, they should keep it unless we call them. And yes, keep the emergency rule exactly as you described.',
    scriptedTurnResponse: {
      introBlocks: [
        { kind: 'thought', text: 'Creating the procedure: same-day slots exist with an 11am cutoff; keep existing appointments unless the clinic calls; and the fixed emergency check runs before any same-day booking — one plain question about trouble breathing or blue lips, then either the emergency line or the booking.' },
        {
          kind: 'collapsible',
          label: 'Procedure created: Sick-Visit / Same-Day',
          meta: '+3 additions',
          children: [
            { kind: 'list', items: [
              { label: 'Emergency check', text: 'trouble breathing or blue lips → 911 / on-call line' },
              { label: 'Same-day cutoff', text: 'call before 11am' },
              { label: 'Existing appointment', text: 'keep it unless the clinic calls to reschedule' },
            ] },
          ],
        },
        { kind: 'thought', text: 'Testing the common case — fever, no breathing trouble — to make sure the safety check runs and the call moves to a booking.' },
        {
          kind: 'collapsible',
          label: 'Current agent response',
          meta: 'Before this update',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "My son woke up with a fever and he's coughing a lot. Can we still come in today?" },
              { speaker: 'Myna', text: "I'm sorry, I don't have same-day availability information. Let me transfer you to the front desk." },
            ] },
          ],
        },
        {
          kind: 'collapsible',
          label: 'Revised agent response',
          meta: '22.8s',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "My son woke up with a fever and he's coughing a lot. Can we still come in today?" },
              { speaker: 'Myna', text: "Let's get him seen. We do same-day sick visits — if you call before eleven, we'll try to fit him in today. Before I check, one important thing: is he having any trouble breathing, or do his lips look blue at all?" },
            ] },
          ],
        },
      ],
      approvalPrompt: "Would you like to proceed with adding this procedure to the agent's workflow? Please accept to continue, or reject to discard these changes.",
    },
    approvedReply: 'The Sick-Visit / Same-Day procedure has been added to the workflow and saved to your procedure library.',
    outcomes: [
      'Added a Sick-Visit / Same-Day procedure so Myna can check for same-day availability and book directly, with a fixed emergency check running first.',
      'Once accepted, the procedure will be added to this workflow and saved to your procedure library for reuse.',
    ],
    changeType: 'New procedure added to the library.',
    conversations: [
      { name: 'Sofia Reyes',    message: "Hi, my son woke up this morning with a fever and he's coughing a lot. He's a patient there. Can we still come in today?", channel: 'Voice', date: 'Jun 10', location: 'Coral Gables' },
      { name: 'Omar Farouk',    message: 'Do you take same-day sick visits?',            channel: 'Chat',  date: 'Jun 9', location: 'Miami' },
      { name: 'Hannah Lee',     message: 'My daughter is sick, can we be seen today?',    channel: 'Voice', date: 'Jun 9', location: 'Doral' },
      { name: 'Michael Torres', message: 'Is there a cutoff time for same-day appointments?', channel: 'Text', date: 'Jun 8', location: 'Coral Gables' },
    ],
    sim: {
      before: [],
      after: [
        { role: 'user' as const,  text: "Hi, my son woke up this morning with a fever and he's coughing a lot. He's a patient there. Can we still come in today?", time: '08:05 AM' },
        { role: 'agent' as const, text: "Let's get him seen. We do same-day sick visits — if you call before eleven, we'll try to fit him in today. Before I check, one important thing: is he having any trouble breathing, or do his lips look blue at all?", time: '08:05 AM' },
        { role: 'user' as const,  text: 'No, no — just the fever and the cough.', time: '08:06 AM' },
        { role: 'agent' as const, text: "Okay, thank you. Let me check today's openings for a sick visit. One moment.", time: '08:06 AM' },
        { role: 'user' as const,  text: 'Thank you.', time: '08:06 AM' },
        { role: 'agent' as const, text: 'I have an opening at ten forty-five this morning. Would you like me to book that?', time: '08:07 AM' },
      ],
    },
  },
  {
    id: 'r11',
    gapType: 'knowledge',
    title: 'Add results status procedure',
    procedureTitle: 'Results status procedure',
    summary: '11 conversations impacted • Routed to staff or refused',
    priority: 'Medium',
    timeAgo: '6h ago',
    conversationCount: 11,
    isNew: true,
    whenToUse: 'When a caller asks whether test results have come back, or how to check them.',
    exitCriteria: 'The caller has a timeline and next step, and no medical detail was read out.',
    steps: [
      {
        title: 'Share status and process only',
        bullets: [
          'State how results are shared (e.g. the patient portal link, or a call from the team).',
          'Give the usual timeline (e.g. 3–5 business days after the test).',
          'Never read out a result value or any medical detail — status and process only.',
        ],
      },
      {
        title: 'Offer a follow-up',
        bullets: [
          'If it has been longer than the usual timeline, use {{Trigger Escalation}} to leave a note for the team to follow up.',
          "Point callers who can't log in to the portal to the front desk for help.",
        ],
      },
    ],
    tools: [{ label: 'Trigger Escalation', icon: 'priority_high' }],
    thoughts: "This one's delicate. Myna correctly refuses to read out results — that rule must stay. But callers usually aren't asking for the values; they're asking a status question: are they back, and when will someone tell me? Let me check what exists today.",
    rationale: "Customers call about test results — did they come back, why haven't I heard, how do I see them. Myna is right not to read results out loud, but today it can't even say whether results are in or how they'll arrive.",
    introBlocks: [
      { kind: 'section', heading: 'Issue', text: "Customers call about test results — did they come back, why haven't I heard, how do I see them. Myna is right not to read results out loud, but today it can't even say whether results are in or how they'll arrive, so a worried parent gets a transfer or a flat refusal — 11 conversations in the last 7 days asked about test results this way, and these calls had the lowest caller ratings of any group.", showConversationsLink: true },
      { kind: 'thought', text: "This one's delicate. Myna correctly refuses to read out results — that rule must stay. But callers usually aren't asking for the values; they're asking a status question: are they back, and when will someone tell me? Let me check what exists today." },
      { kind: 'thought', label: 'Searched procedures', text: "The guardrails block sharing medical results — correct — but there's nothing telling Myna what it can say: no timeline, no portal info, no follow-up option. So every results call ends in a refusal or a transfer." },
      { kind: 'thought', text: "There's a safe middle path: how results arrive, the usual timeline, portal help, and a follow-up note if it's overdue. None of that touches a result value. I need the portal link and the timeline from the user — those aren't things to guess — and I'll spell out the boundary so it's clearly safe." },
      { kind: 'text', text: "Here's what's happening: 11 conversations in the last 7 days asked about test results, and each one ended in a transfer or a flat refusal." },
      { kind: 'section', heading: 'Action needed', variant: 'danger', text: 'Add results-status information to the agent — status and process only, never the actual results. To get started, please share:', items: [
        { label: 'How results are shared', text: 'e.g., the patient portal link, or a call from the team' },
        { label: 'Usual timeline', text: 'e.g., 3–5 business days after the test' },
        { label: 'Portal help', text: "who to contact if a caller can't log in" },
      ] },
    ],
    composerPrefill: "Results go to the patient portal at portal.kidzpulm.com, usually 3 to 5 business days after the test. If someone can't log in, the front desk helps with that.",
    scriptedTurnResponse: {
      introBlocks: [
        { kind: 'thought', text: "Creating the procedure: portal link, 3–5 business day timeline, front desk for portal help, and a follow-up note when it's overdue. The hard boundary is written into the procedure itself: status and process only — never a value, a number, or a medical detail." },
        {
          kind: 'collapsible',
          label: 'Procedure created: Results Status',
          meta: '+4 additions',
          children: [
            { kind: 'list', items: [
              { label: 'Portal', text: 'portal.kidzpulm.com' },
              { label: 'Timeline', text: '3–5 business days after the test' },
              { label: 'Portal help', text: 'front desk' },
              { label: 'Boundary', text: 'never a result value or medical detail' },
            ] },
          ],
        },
        { kind: 'thought', text: 'Testing the exact call that fails today — a parent a week out from a breathing test.' },
        {
          kind: 'collapsible',
          label: 'Current agent response',
          meta: 'Before this update',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "My daughter had a breathing test last week and I still haven't gotten the results. Did they come in? How do I check?" },
              { speaker: 'Myna', text: "I'm not able to share medical results. Let me connect you with someone." },
            ] },
          ],
        },
        {
          kind: 'collapsible',
          label: 'Revised agent response',
          meta: '19.6s',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "My daughter had a breathing test last week and I still haven't gotten the results. Did they come in? How do I check?" },
              { speaker: 'Myna', text: "Results usually come through the patient portal within three to five business days after the test. Since it's been about a week, I can leave a note for our team to follow up with you — would you like me to do that? You can also check the portal at portal dot kidzpulm dot com, and if you have trouble logging in, our front desk can help." },
            ] },
          ],
        },
      ],
      approvalPrompt: "Would you like to proceed with adding this procedure to the agent's workflow? Please accept to continue, or reject to discard these changes.",
    },
    approvedReply: 'The Results Status procedure has been added to the workflow and saved to your procedure library.',
    outcomes: [
      'Added a Results Status procedure so Myna can share the portal link, usual timeline, and a follow-up option — never the results themselves.',
      'Once accepted, the procedure will be added to this workflow and saved to your procedure library for reuse.',
    ],
    changeType: 'New procedure added to the library.',
    conversations: [
      { name: 'Elena Sokolova', message: "Hi, my daughter had a breathing test last week and I still haven't gotten the results. Did they come in? How do I check?", channel: 'Voice', date: 'Jun 9', location: 'Coral Gables' },
      { name: 'Derek Wong',     message: 'How do I check if my test results are ready?', channel: 'Chat',  date: 'Jun 8', location: 'Miami' },
      { name: 'Priya Anand',    message: "I haven't heard back about my son's results.", channel: 'Text',  date: 'Jun 8', location: 'Doral' },
      { name: 'Marcus Rivera',  message: 'Where do I log in to see my results?',         channel: 'Voice', date: 'Jun 7', location: 'Coral Gables' },
    ],
    sim: {
      before: [],
      after: [
        { role: 'user' as const,  text: "Hi, my daughter had a breathing test last week and I still haven't gotten the results. Did they come in? How do I check?", time: '03:40 PM' },
        { role: 'agent' as const, text: "Results usually come through the patient portal within three to five business days after the test. Since it's been about a week, I can leave a note for our team to follow up with you. Would you like me to do that?", time: '03:40 PM' },
        { role: 'user' as const,  text: 'Yes, please. And where do I check online?', time: '03:41 PM' },
        { role: 'agent' as const, text: "You can check the patient portal at portal dot kidzpulm dot com. If you have trouble logging in, our front desk can help. I've left a note for the team to follow up on your daughter's results.", time: '03:41 PM' },
      ],
    },
  },
  {
    id: 'r2',
    gapType: 'procedure',
    title: 'Update appointment rescheduling procedure',
    procedureTitle: 'Appointment rescheduling procedure',
    summary: '8 conversations impacted • Same-day reschedule and waitlist paths missing',
    priority: 'Low',
    timeAgo: '5h ago',
    conversationCount: 8,
    isNew: false,
    whenToUse: 'When a customer requests to reschedule an existing appointment, including same-day changes and waitlist additions.',
    exitCriteria: 'The customer has a confirmed new appointment time, or has been added to the waitlist and told how they\'ll be notified.',
    steps: [
      {
        title: 'Look up the existing appointment',
        bullets: [
          "Retrieve the appointment using the customer's name, phone number, or confirmation number.",
          '"Let me pull that up for you." Confirm the date, time, and service type with the customer before making any changes.',
        ],
      },
      {
        title: 'Check availability for the new time',
        bullets: [
          'Search for open slots on the requested date across all service bays.',
          'For same-day requests: check technician availability in real time via {{Schedule Appointment}} — do not assume same-day is unavailable.',
          'If no slots are open, offer to add the customer to the waitlist and explain how waitlist notifications work.',
        ],
      },
      {
        title: 'Confirm the reschedule',
        bullets: [
          'Book the new slot using {{Schedule Appointment}} and cancel the old one in the same step.',
          'Send an updated confirmation to the customer via {{Send Confirmation}} immediately.',
          'If the technician assignment changes as a result, notify the service advisor before ending the call.',
        ],
      },
      {
        title: 'Close and log',
        bullets: [
          'Ask if the customer needs anything else related to this appointment before ending the conversation.',
          'Update the appointment record so the change history is visible to the front desk team.',
        ],
      },
    ],
    originalSteps: [
      {
        title: 'Look up the existing appointment',
        bullets: [
          "Retrieve the appointment using the customer's name, phone number, or confirmation number.",
          'Confirm details with the customer.',
        ],
      },
      {
        title: 'Check availability',
        bullets: ['Search for open slots on the requested date.'],
      },
      {
        title: 'Confirm reschedule',
        bullets: [
          'Book the new slot and cancel the old one.',
          'Send updated confirmation to the customer.',
        ],
      },
    ],
    stepsWithDiff: [
      {
        title: 'Look up the existing appointment',
        bullets: [
          "Retrieve the appointment using the customer's name, phone number, or confirmation number.",
          '"Let me pull that up for you." Confirm the date, time, and service type with the customer before making any changes.',
        ],
      },
      {
        title: 'Check availability for the new time',
        bullets: [
          'Search for open slots on the requested date across all service bays.',
          'For same-day requests: check technician availability in real time via {{Schedule Appointment}} — do not assume same-day is unavailable.',
          'If no slots are open, offer to add the customer to the waitlist and explain how waitlist notifications work.',
        ],
        addedBullets: [
          'For same-day requests: check technician availability in real time via {{Schedule Appointment}} — do not assume same-day is unavailable.',
          'If no slots are open, offer to add the customer to the waitlist and explain how waitlist notifications work.',
        ],
      },
      {
        title: 'Confirm the reschedule',
        bullets: [
          'Book the new slot using {{Schedule Appointment}} and cancel the old one in the same step.',
          'Send an updated confirmation to the customer via {{Send Confirmation}} immediately.',
          'If the technician assignment changes as a result, notify the service advisor before ending the call.',
        ],
      },
      {
        title: 'Close and log',
        bullets: [
          'Ask if the customer needs anything else related to this appointment before ending the conversation.',
          'Update the appointment record so the change history is visible to the front desk team.',
        ],
        addedBullets: [
          'Ask if the customer needs anything else related to this appointment before ending the conversation.',
          'Update the appointment record so the change history is visible to the front desk team.',
        ],
      },
    ],
    outcomes: [
      'Updated the Appointment rescheduling procedure to support same-day changes and a waitlist fallback.',
      'Once accepted, the updated procedure will replace the existing version in this workflow and your procedure library.',
    ],
    tools: [
      { label: 'Schedule Appointment', icon: 'calendar_today' },
      { label: 'Send Confirmation', icon: 'send' },
    ],
    thoughts: "I clustered 8 recent conversations where customers asked to reschedule the same day and the agent said it wasn't possible. Let me review the current rescheduling procedure for gaps.",
    rationale: "8 conversations were flagged because customers requesting same-day reschedules were told it wasn't possible, causing escalations.",
    introBlocks: [
      { kind: 'section', heading: 'Issue', text: 'Customers ask to reschedule an appointment for the same day, and Myna tells them it isn\'t possible without checking real technician availability — 8 conversations in the last 7 days were told this without a real check, and 3 of those escalated when the customer pushed back. When no slot is truly open, there\'s also no waitlist fallback — the call just ends.', showConversationsLink: true },
      { kind: 'thought', text: "I clustered 8 recent conversations where customers asked to reschedule the same day and the agent said it wasn't possible. Let me review the current rescheduling procedure for gaps." },
      { kind: 'thought', label: 'Searched procedures', text: "The rescheduling procedure looks up the appointment and checks availability, but nothing accounts for same-day requests — Myna treats every same-day ask as automatically unavailable instead of actually checking, and there's no waitlist fallback when a slot really isn't open." },
      { kind: 'thought', text: "Checking real-time same-day availability is a fixed behavior change I can make on my own. But a waitlist needs two operational calls I can't make: which notification channel to use, and where the same-day cutoff falls. I'll lay those out and wait for the answer." },
      { kind: 'text', text: "Here's what's happening: 8 recent conversations asked to reschedule for the same day, and every one was told it wasn't possible — without Myna actually checking." },
      { kind: 'section', heading: 'Action needed', variant: 'danger', text: "Update the rescheduling procedure so same-day requests get a real availability check, with a waitlist fallback when nothing's open. To finish this, I need two details from you:", items: [
        { label: 'Waitlist notification channel', text: 'text, email, or both, when a waitlisted slot opens up' },
        { label: 'Same-day cutoff time', text: 'the latest time a same-day reschedule request can be accepted, e.g. by 2pm' },
      ] },
    ],
    composerPrefill: "Text is fine for waitlist notifications — email's optional. Same-day requests should be accepted up until 2pm.",
    scriptedTurnResponse: {
      introBlocks: [
        { kind: 'thought', text: 'Now I have both. I\'ll update the procedure so same-day checks technician availability in real time up to the 2pm cutoff, and anyone who can\'t get a same-day slot goes on a waitlist notified by text.' },
        {
          kind: 'collapsible',
          label: 'Procedure updated: Appointment Rescheduling',
          meta: '+2 additions, 1 change',
          children: [
            { kind: 'list', items: [
              { label: 'Same-day check', text: 'real-time technician availability, accepted up to 2pm' },
              { label: 'Waitlist fallback', text: 'added when no same-day slot is open, notified by text' },
            ] },
          ],
        },
        { kind: 'thought', text: 'Testing with the exact same-day scenario from the reported conversations.' },
        {
          kind: 'collapsible',
          label: 'Current agent response',
          meta: 'Before this update',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: 'Hi, I have an appointment for Thursday but my car is making a strange noise. Can I move it to today?' },
              { speaker: 'Myna', text: "I'm sorry, same-day changes aren't possible. The earliest opening I can offer is tomorrow." },
            ] },
          ],
        },
        {
          kind: 'collapsible',
          label: 'Revised agent response',
          meta: '19.6s',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: 'Hi, I have an appointment for Thursday but my car is making a strange noise. Can I move it to today?' },
              { speaker: 'Myna', text: "Let me check today's availability for you — one moment... I have a 2:15 PM slot open today. I'll move your Thursday appointment there and text you a confirmation. If nothing had been open, I'd have added you to our waitlist and texted you the moment a same-day slot freed up." },
            ] },
          ],
        },
      ],
      approvalPrompt: "Would you like to proceed with updating this procedure in the agent's workflow? Please accept to continue, or reject to discard these changes.",
    },
    approvedReply: 'The updated Appointment Rescheduling procedure has been saved to your procedure library.',
    changeType: 'Existing procedure updated with a same-day path and waitlist fallback.',
    conversations: [
      { name: 'Linda Nakamura',  message: 'I need to move my appointment to today, is that possible?', channel: 'Voice', date: 'Jun 9', location: 'Palo Alto' },
      { name: 'Tom Okafor',      message: 'Can I reschedule for the same day?',                         channel: 'Chat',  date: 'Jun 8', location: 'San Jose' },
      { name: 'Rachel Gomez',    message: 'The agent told me same-day changes aren\'t allowed.',         channel: 'Text',  date: 'Jun 7', location: 'Mountain View' },
    ],
    sim: {
      before: [],
      after: [
        { role: 'user' as const,  text: "Hi, I have an appointment for Thursday but my car is making a strange noise. Can I move it to today?", time: '09:05 AM' },
        { role: 'agent' as const, text: "I understand the urgency. Let me check availability for today.", time: '09:05 AM' },
        { role: 'user' as const,  text: "Sure, I can be flexible on timing.", time: '09:06 AM' },
        { role: 'agent' as const, text: "I've got a 2:15 PM slot available today. I've moved your Thursday appointment and flagged the noise concern so your technician is ready. You'll receive a confirmation text shortly — is there anything else you need?", time: '09:06 AM' },
      ],
    },
  },
  {
    id: 'r3',
    gapType: 'procedure',
    title: 'Update emergency escalation procedure',
    procedureTitle: 'Emergency escalation procedure',
    summary: '5 conversations impacted • Escalation taking 3+ minutes',
    priority: 'Low',
    timeAgo: '3h ago',
    conversationCount: 5,
    isNew: false,
    whenToUse: 'When a customer reports a safety concern, breakdown, or any urgent issue requiring immediate human attention.',
    exitCriteria: 'The customer has been connected to a live advisor, or — if the transfer fails — a callback number was taken and an escalation ticket was filed.',
    steps: [
      {
        title: 'Detect urgency immediately',
        bullets: [
          'Listen for keywords: "not safe", "smoke", "brakes failed", "accident", "urgent" — in the first sentence, not just when asked directly.',
          'If detected, skip standard intake questions entirely and move straight to transfer — do not ask for VIN, appointment history, or account lookups first.',
        ],
      },
      {
        title: 'Transfer within 30 seconds',
        bullets: [
          'Connect directly to the on-call service advisor using {{Voice Call}}.',
          'If the on-call advisor is unavailable, escalate to the service manager immediately via {{Trigger Escalation}} — never leave the customer on hold while retrying the same person.',
          "Relay the customer's name, callback number, and a one-line summary of the concern to whoever picks up, before transferring the call.",
        ],
      },
      {
        title: 'Stay on the line until handoff completes',
        bullets: [
          '"I\'m connecting you to someone who can help right now — please stay on the line." Do not disconnect until the advisor confirms they have the customer.',
          'If the transfer fails, apologize, take a callback number, and trigger an escalation ticket rather than ending the call with no resolution.',
        ],
      },
    ],
    originalSteps: [
      {
        title: 'Transfer to a live agent',
        bullets: [
          'Escalate to a live agent within 2 minutes.',
          'If unavailable, escalate to the service manager.',
          "Relay the customer's name, callback number, and concern before transferring.",
        ],
      },
    ],
    stepsWithDiff: [
      {
        title: 'Detect urgency immediately',
        bullets: [
          'Listen for keywords: "not safe", "smoke", "brakes failed", "accident", "urgent" — in the first sentence, not just when asked directly.',
          'If detected, skip standard intake questions entirely and move straight to transfer — do not ask for VIN, appointment history, or account lookups first.',
        ],
        addedBullets: [
          'Listen for keywords: "not safe", "smoke", "brakes failed", "accident", "urgent" — in the first sentence, not just when asked directly.',
          'If detected, skip standard intake questions entirely and move straight to transfer — do not ask for VIN, appointment history, or account lookups first.',
        ],
      },
      {
        title: 'Transfer within 30 seconds',
        bullets: [
          'Connect directly to the on-call service advisor using {{Voice Call}}.',
          'If the on-call advisor is unavailable, escalate to the service manager immediately via {{Trigger Escalation}} — never leave the customer on hold while retrying the same person.',
          "Relay the customer's name, callback number, and a one-line summary of the concern to whoever picks up, before transferring the call.",
        ],
        addedBullets: [
          'Connect directly to the on-call service advisor using {{Voice Call}}.',
          'If the on-call advisor is unavailable, escalate to the service manager immediately via {{Trigger Escalation}} — never leave the customer on hold while retrying the same person.',
        ],
        removedBullets: [
          'Escalate to a live agent within 2 minutes.',
          'If unavailable, escalate to the service manager.',
        ],
      },
      {
        title: 'Stay on the line until handoff completes',
        bullets: [
          '"I\'m connecting you to someone who can help right now — please stay on the line." Do not disconnect until the advisor confirms they have the customer.',
          'If the transfer fails, apologize, take a callback number, and trigger an escalation ticket rather than ending the call with no resolution.',
        ],
        addedBullets: [
          '"I\'m connecting you to someone who can help right now — please stay on the line." Do not disconnect until the advisor confirms they have the customer.',
          'If the transfer fails, apologize, take a callback number, and trigger an escalation ticket rather than ending the call with no resolution.',
        ],
      },
    ],
    outcomes: [
      'Updated the Emergency escalation procedure to detect urgency signals and cut the transfer target from 2 minutes to 30 seconds.',
      'Once accepted, the updated procedure will replace the existing version in this workflow and your procedure library.',
    ],
    tools: [
      { label: 'Voice Call', icon: 'call' },
      { label: 'Trigger Escalation', icon: 'priority_high' },
    ],
    thoughts: 'I flagged 5 recent conversations involving safety concerns where the transfer to a human took too long. Let me review the current escalation procedure for delays.',
    rationale: '5 safety-concern conversations were handled through standard intake, causing 3+ minute delays before a human responded.',
    introBlocks: [
      { kind: 'section', heading: 'Issue', text: 'Customers reporting a safety concern — brakes failing, smoke, an accident — still go through standard intake (VIN, appointment history, account lookup) before Myna transfers them, adding 3 or more minutes before a human ever picks up. 5 safety-concern conversations in the last 7 days took this long to reach a person — every one of them a customer describing an active vehicle safety issue.', showConversationsLink: true },
      { kind: 'thought', text: 'I flagged 5 recent conversations involving safety concerns where the transfer to a human took too long. Let me review the current escalation procedure for delays.' },
      { kind: 'thought', label: 'Searched procedures', text: "The escalation procedure only kicks in once standard intake is done — VIN, appointment history, account lookup — before it ever checks for urgency. That's exactly why safety calls were taking 3+ minutes to reach a person." },
      { kind: 'thought', text: "Detecting urgency keywords and skipping straight to transfer is a fixed behavior change I can make on my own — no judgment call needed there. But I can't invent where the transfer should actually ring, or which phrases count as urgent for this dealership specifically. I need those two facts from you." },
      { kind: 'text', text: 'Here\'s what\'s happening: 5 safety-concern calls in the last 7 days went through standard intake first, taking 3+ minutes to reach a person.' },
      { kind: 'section', heading: 'Action needed', variant: 'danger', text: 'Update the escalation procedure so urgency is detected immediately and skips straight to transfer. To finish this, I need two details from you:', items: [
        { label: 'On-call advisor routing', text: 'the phone number or queue urgent transfers should ring first' },
        { label: 'Urgency keyword list', text: 'any phrases specific to your dealership to add or remove, beyond the standard set ("not safe", "smoke", "brakes failed", "accident", "urgent")' },
      ] },
    ],
    composerPrefill: "Route urgent transfers to the on-call service advisor's direct line first. The standard keyword list looks right — no dealership-specific additions needed.",
    scriptedTurnResponse: {
      introBlocks: [
        { kind: 'thought', text: "I'll update the procedure so urgency keywords are checked first, skip straight to transfer, ring the on-call advisor's direct line, and escalate to the service manager if they don't pick up — cutting the target from 2 minutes to 30 seconds." },
        {
          kind: 'collapsible',
          label: 'Procedure updated: Emergency Escalation',
          meta: '+1 addition, 1 change',
          children: [
            { kind: 'list', items: [
              { label: 'Urgency detection', text: 'checked in the first sentence, skips standard intake' },
              { label: 'Transfer target', text: "cut from 2 minutes to 30 seconds, on-call advisor's direct line first" },
            ] },
          ],
        },
        { kind: 'thought', text: 'Testing with the exact scenario from the reported calls — a brakes concern in the opening line.' },
        {
          kind: 'collapsible',
          label: 'Current agent response',
          meta: 'Before this update',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "My brakes feel really wrong — there's a grinding noise and the pedal feels soft. I need help now." },
              { speaker: 'Myna', text: 'I can help with that. Can I get your VIN and the last time your vehicle was serviced?' },
            ] },
          ],
        },
        {
          kind: 'collapsible',
          label: 'Revised agent response',
          meta: '15.2s',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "My brakes feel really wrong — there's a grinding noise and the pedal feels soft. I need help now." },
              { speaker: 'Myna', text: "I'm flagging this as a safety concern right now and escalating to our on-call service advisor. Please pull over if you're driving. They will call you back within 30 seconds — your name and situation have been passed on." },
            ] },
          ],
        },
      ],
      approvalPrompt: "Would you like to proceed with updating this procedure in the agent's workflow? Please accept to continue, or reject to discard these changes.",
    },
    approvedReply: 'The updated Emergency Escalation procedure has been saved to your procedure library.',
    changeType: 'Escalation procedure updated — urgency detection added, transfer target reduced from 2 min to 30 sec.',
    conversations: [
      { name: 'Derek Huang',    message: 'My brakes feel wrong, I need help immediately.',   channel: 'Voice', date: 'Jun 8', location: 'Sunnyvale' },
      { name: 'Aisha Johnson',  message: 'There\'s smoke coming from my engine right now.',   channel: 'Voice', date: 'Jun 7', location: 'Mountain View' },
      { name: 'Carlos Rivera',  message: 'This is an emergency, my car won\'t stop.',         channel: 'Chat',  date: 'Jun 6', location: 'Palo Alto' },
    ],
    sim: {
      before: [],
      after: [
        { role: 'user' as const,  text: "My brakes feel really wrong — there's a grinding noise and the pedal feels soft. I need help now.", time: '08:55 AM' },
        { role: 'agent' as const, text: "I'm flagging this as a safety concern right now and escalating to our on-call service advisor. Please pull over if you're driving. They will call you back within 30 seconds — your name and situation have been passed on.", time: '08:55 AM' },
      ],
    },
  },
  {
    id: 'r4',
    gapType: 'knowledge',
    title: 'Update business hours',
    procedureTitle: 'Business hours',
    summary: "19 conversations impacted • Agent couldn't answer the hours question",
    priority: 'Low',
    timeAgo: '1h ago',
    conversationCount: 19,
    isNew: false,
    whenToUse: 'When a customer asks about operating hours, weekend availability, or holiday schedules.',
    exitCriteria: 'The caller has an accurate hours answer for the day, weekend, or holiday they asked about.',
    steps: [
      {
        title: 'Provide accurate hours',
        bullets: [
          'Retrieve current hours, weekend hours, and upcoming holiday closures via {{Check Business Hours}}.',
          'Confirm same-day hours if the customer asks',
          'Offer to schedule an appointment if the customer wants to come in',
        ],
      },
    ],
    originalSteps: [
      {
        title: 'Provide accurate hours',
        bullets: [
          'Retrieve current hours from the knowledge base.',
          'Offer to schedule an appointment if the customer wants to come in',
        ],
      },
    ],
    stepsWithDiff: [
      {
        title: 'Provide accurate hours',
        bullets: [
          'Retrieve current hours, weekend hours, and upcoming holiday closures via {{Check Business Hours}}.',
          'Confirm same-day hours if the customer asks',
          'Offer to schedule an appointment if the customer wants to come in',
        ],
        addedBullets: [
          'Retrieve current hours, weekend hours, and upcoming holiday closures via {{Check Business Hours}}.',
          'Confirm same-day hours if the customer asks',
        ],
        removedBullets: [
          'Retrieve current hours from the knowledge base.',
        ],
      },
    ],
    outcomes: [
      'Updated the Business hours procedure to include weekend hours, holiday closures, and same-day lookups.',
      'Once accepted, the updated procedure will replace the existing version in this workflow and your procedure library.',
    ],
    tools: [
      { label: 'Check Business Hours', icon: 'schedule' },
    ],
    thoughts: 'I clustered 19 recent conversations where customers asked about business hours and the agent had no answer. Let me check the knowledge base for what\'s missing.',
    rationale: '19 conversations ended with the agent unable to answer — the business hours record is missing or outdated.',
    introBlocks: [
      { kind: 'section', heading: 'Issue', text: 'Customers ask about weekend hours, today\'s closing time, or whether the clinic is open on a holiday. The knowledge base only has weekday hours on file, so Myna gives a vague answer or none at all — 19 conversations in the last 7 days asked something the agent couldn\'t confirm, most of them weekend or holiday questions.', showConversationsLink: true },
      { kind: 'thought', text: 'I clustered 19 recent conversations where customers asked about business hours and the agent had no answer. Let me check the knowledge base for what\'s missing.' },
      { kind: 'thought', label: 'Searched procedures', text: 'The knowledge base only has weekday hours on file — nothing for Saturday, Sunday, or holidays. So the moment anyone asks about a weekend or a holiday, Myna has nothing to check and gives a vague non-answer.' },
      { kind: 'thought', text: "Hours and closures are fixed, non-private business facts — completely safe for Myna to state directly. But I can't invent your actual weekend hours or which holidays you close for. I need those two things from you before I can update anything." },
      { kind: 'text', text: "Here's what's happening: 19 conversations in the last 7 days asked about hours — mostly weekends and holidays — and the agent had no answer for any of them." },
      { kind: 'section', heading: 'Action needed', variant: 'danger', text: "Update the business hours knowledge with weekend and holiday coverage. To finish this, I need two things from you (or upload your hours/holiday doc and I'll pull them from it):", items: [
        { label: 'Weekend hours', text: 'Saturday and Sunday hours for every location' },
        { label: 'Upcoming holiday closures', text: 'the list of dates the clinic is closed' },
      ] },
    ],
    composerPrefill: "We're open Saturday 8 AM to 5 PM and Sunday 10 AM to 3 PM, parts & accessories both days. Closed for Memorial Day, July 4th, Labor Day, Thanksgiving, and Christmas.",
    scriptedTurnResponse: {
      introBlocks: [
        { kind: 'thought', text: "Now I have both. I'll add the weekend hours and the holiday closure list to the knowledge base, and set Myna to check same-day hours automatically before answering." },
        {
          kind: 'collapsible',
          label: 'Procedure updated: Business Hours',
          meta: '+2 additions',
          children: [
            { kind: 'list', items: [
              { label: 'Weekend hours', text: 'Sat 8–5, Sun 10–3, parts & accessories both days' },
              { label: 'Holiday closures', text: 'Memorial Day, July 4th, Labor Day, Thanksgiving, Christmas' },
            ] },
          ],
        },
        { kind: 'thought', text: 'Testing with the exact weekend question from the reported conversations.' },
        {
          kind: 'collapsible',
          label: 'Current agent response',
          meta: 'Before this update',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: 'Hi, are you open on Saturdays? I work during the week and can only come in on weekends.' },
              { speaker: 'Myna', text: "I'm sorry, I only have our weekday hours on file. Let me have someone from our team follow up with you." },
            ] },
          ],
        },
        {
          kind: 'collapsible',
          label: 'Revised agent response',
          meta: '13.4s',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: 'Hi, are you open on Saturdays? I work during the week and can only come in on weekends.' },
              { speaker: 'Myna', text: "We're open Saturday 8 AM to 5 PM and Sunday 10 AM to 3 PM. Parts & accessories are available both days. Would you like to book a weekend slot?" },
            ] },
          ],
        },
      ],
      approvalPrompt: "Would you like to proceed with updating this procedure in the agent's workflow? Please accept to continue, or reject to discard these changes.",
    },
    approvedReply: 'The updated Business Hours knowledge has been saved to your procedure library.',
    changeType: 'Business hours, weekend availability, and holiday closures added to the knowledge base.',
    conversations: [
      { name: 'Susan Park',      message: 'Are you open on Saturdays?',                         channel: 'Chat',  date: 'Jun 9', location: 'San Jose' },
      { name: 'Michael Torres',  message: 'What time do you close today?',                      channel: 'Voice', date: 'Jun 9', location: 'Mountain View' },
      { name: 'Hannah Lee',      message: 'Are you open on Memorial Day?',                      channel: 'Text',  date: 'Jun 8', location: 'Sunnyvale' },
      { name: 'Omar Farouk',     message: 'What are your weekend service hours?',               channel: 'Chat',  date: 'Jun 7', location: 'Palo Alto' },
    ],
    sim: {
      before: [],
      after: [
        { role: 'user' as const,  text: "Hi, are you open on Saturdays? I work during the week and can only come in on weekends.", time: '06:45 PM' },
        { role: 'agent' as const, text: "Hi! Great question. Let me look that up for you.", time: '06:45 PM' },
        { role: 'user' as const,  text: "Thanks.", time: '06:46 PM' },
        { role: 'agent' as const, text: "We're open Saturday 8 AM – 5 PM and Sunday 10 AM – 3 PM. Parts & accessories are available both days. Holiday hours may vary — I'll flag if your visit falls on one. Would you like to book a weekend slot?", time: '06:46 PM' },
      ],
    },
  },
  {
    id: 'r5',
    gapType: 'action',
    title: 'Add VIN lookup service intake procedure',
    procedureTitle: 'VIN lookup service intake',
    summary: '7 conversations impacted • Manual re-entry of vehicle data',
    priority: 'Low',
    timeAgo: '6h ago',
    conversationCount: 7,
    isNew: true,
    whenToUse: 'During any service intake where vehicle identification is needed.',
    steps: [
      {
        title: 'Collect and decode VIN',
        bullets: [
          'Ask the customer to provide the VIN from the dashboard or registration',
          'Decode via the VIN lookup tool to confirm year, make, and model',
          'Pre-populate the service record with decoded vehicle details',
        ],
      },
    ],
    outcomes: [
      'Added a VIN lookup service intake procedure to help the agent capture and decode vehicle data automatically.',
      'Once accepted, the procedure will be added to this workflow and saved to your procedure library for reuse.',
    ],
    tools: [
      { label: 'VIN Decode', icon: 'qr_code' },
      { label: 'DMS Integration', icon: 'storage' },
    ],
    thoughts: 'I noticed 7 recent conversations where advisors had to manually re-enter vehicle data after the call. Let me review the current intake flow for a capture step.',
    rationale: 'Advisors flagged 7 calls where they had to re-enter vehicle data manually because the agent did not capture the VIN.',
    changeType: 'VIN capture step added to service intake, with automatic decode and DMS pre-fill.',
    conversations: [
      { name: 'Brett Simmons',  message: 'I need to book a service but I don\'t know my VIN.', channel: 'Voice', date: 'Jun 8', location: 'Mountain View' },
      { name: 'Yuki Tanaka',    message: 'Can I book without the vehicle number?',              channel: 'Chat',  date: 'Jun 7', location: 'San Jose' },
    ],
    sim: {
      before: [],
      after: [
        { role: 'user' as const,  text: "I need to schedule a service but I don't have my VIN on hand. Can I still book?", time: '11:00 AM' },
        { role: 'agent' as const, text: "You can try to book, but I'll need the VIN to look up your vehicle record. Do you have your registration handy?", time: '11:00 AM' },
        { role: 'user' as const,  text: "I don't have it with me right now. Can I give you the make and model instead?", time: '11:01 AM' },
        { role: 'agent' as const, text: "No problem — your VIN is printed on a small metal plate at the base of the windshield on the driver's side, and also on your insurance card. Takes about 10 seconds to find. I can wait while you check — or if you share your license plate I can look it up in our DMS.", time: '11:01 AM' },
      ],
    },
  },
  {
    id: 'r6',
    gapType: 'procedure',
    title: 'Improve after-hours call handling',
    procedureTitle: 'After-hours call handling',
    summary: '9 conversations impacted • No callback timing given',
    priority: 'Low',
    timeAgo: '30m ago',
    conversationCount: 9,
    isNew: true,
    whenToUse: 'When a customer calls outside business hours and reaches the after-hours voice flow.',
    exitCriteria: 'The caller has a callback window (or was pointed to the emergency line), and a flagged callback task has been logged for the front desk queue.',
    steps: [
      {
        title: 'Greet and take a message',
        bullets: [
          '"Thanks for calling — we\'re closed right now, but I can take a message and make sure the team follows up." Ask for the reason for calling.',
          "Ask for the customer's name and confirm the best callback number.",
        ],
      },
      {
        title: 'Set expectations',
        bullets: [
          'Explain when they will hear back using the after-hours callback policy (within 2 business hours).',
          'If the concern sounds urgent, mention the after-hours emergency line instead of just taking a message.',
        ],
      },
      {
        title: 'Log and close',
        bullets: [
          'Automatically create a callback task assigned to the front desk queue via {{Trigger Escalation}}, flagged as after-hours priority.',
          'Send a text confirmation via {{Send Confirmation}} summarizing what was logged and when to expect a callback.',
        ],
      },
    ],
    originalSteps: [
      {
        title: 'Take a message',
        bullets: [
          "Ask for the customer's name and reason for calling.",
          'End the call.',
        ],
      },
    ],
    stepsWithDiff: [
      {
        title: 'Greet and take a message',
        bullets: [
          '"Thanks for calling — we\'re closed right now, but I can take a message and make sure the team follows up." Ask for the reason for calling.',
          "Ask for the customer's name and confirm the best callback number.",
        ],
        addedBullets: [
          '"Thanks for calling — we\'re closed right now, but I can take a message and make sure the team follows up." Ask for the reason for calling.',
          "Ask for the customer's name and confirm the best callback number.",
        ],
        removedBullets: [
          "Ask for the customer's name and reason for calling.",
          'End the call.',
        ],
      },
      {
        title: 'Set expectations',
        bullets: [
          'Explain when they will hear back using the after-hours callback policy (within 2 business hours).',
          'If the concern sounds urgent, mention the after-hours emergency line instead of just taking a message.',
        ],
        addedBullets: [
          'Explain when they will hear back using the after-hours callback policy (within 2 business hours).',
          'If the concern sounds urgent, mention the after-hours emergency line instead of just taking a message.',
        ],
      },
      {
        title: 'Log and close',
        bullets: [
          'Automatically create a callback task assigned to the front desk queue via {{Trigger Escalation}}, flagged as after-hours priority.',
          'Send a text confirmation via {{Send Confirmation}} summarizing what was logged and when to expect a callback.',
        ],
        addedBullets: [
          'Automatically create a callback task assigned to the front desk queue via {{Trigger Escalation}}, flagged as after-hours priority.',
          'Send a text confirmation via {{Send Confirmation}} summarizing what was logged and when to expect a callback.',
        ],
      },
    ],
    tools: [
      { label: 'Trigger Escalation', icon: 'priority_high' },
      { label: 'Send Confirmation', icon: 'send' },
    ],
    thoughts: 'I clustered 9 recent after-hours conversations where customers got no information on callback timing. Let me review the knowledge base, call script, and follow-up actions for gaps.',
    rationale: "9 after-hours calls ended with the agent unable to say when the customer would hear back, and no callback task was created for the team the next morning. This spans three separate gaps in the same call flow — knowledge, procedure, and action — so we've generated one combined recommendation:",
    introBlocks: [
      { kind: 'section', heading: 'Issue', text: "Customers who call after hours get a message taken, but Myna can't say when they'll hear back, doesn't mention the emergency line for urgent issues, and no callback task is created — so messages can sit unseen until the customer calls again. 9 after-hours conversations in the last 7 days ended exactly this way, with no callback timing given and no task logged for the team.", showConversationsLink: true },
      { kind: 'thought', text: 'I clustered 9 recent after-hours conversations where customers got no information on callback timing. Let me review the knowledge base, call script, and follow-up actions for gaps.' },
      { kind: 'thought', label: 'Searched procedures', text: "The after-hours script takes a message and ends the call — it never states a callback window, doesn't mention the emergency line, and no task gets created afterward. That's three separate gaps in the same flow: no callback policy on file, a script that doesn't set expectations, and no automatic follow-up task." },
      { kind: 'thought', text: "The script fix and the automatic callback task are just fixed logic — I can build both without asking anyone. But I can't invent your actual callback policy; I need the real turnaround window from you before Myna can promise it to a customer." },
      { kind: 'text', text: 'Here\'s what\'s happening: 9 after-hours calls in the last 7 days ended with no callback timing given, and no task was created for the team to follow up the next morning.' },
      { kind: 'section', heading: 'Action needed', variant: 'danger', text: "Update after-hours call handling end to end — add the callback policy to Myna's knowledge, update the script to set expectations, and automatically log a callback task each time. To finish this, I need:", items: [
        { label: 'Callback policy', text: 'how soon after-hours messages are returned (e.g. within 2 business hours), and where the after-hours emergency line routes to' },
      ] },
    ],
    composerPrefill: 'After-hours messages get returned within 2 business hours. Urgent-sounding calls should be pointed to the after-hours emergency line instead of just a message.',
    scriptedTurnResponse: {
      introBlocks: [
        { kind: 'thought', text: 'Now I have the policy. I\'ll add it to the knowledge base, update the script to state the callback window and mention the emergency line for urgent calls, and automatically log a callback task to the front desk queue, flagged after-hours priority, on every call.' },
        {
          kind: 'collapsible',
          label: 'Procedure updated: After-Hours Call Handling',
          meta: '+3 additions',
          children: [
            { kind: 'list', items: [
              { label: 'Callback policy', text: 'returned within 2 business hours' },
              { label: 'Script', text: 'states the callback window, mentions the emergency line for urgent calls' },
              { label: 'Callback task', text: 'auto-logged to the front desk queue, flagged after-hours priority' },
            ] },
          ],
        },
        { kind: 'thought', text: "Testing with the exact scenario from the reported calls — a customer asking when they'll actually hear back." },
        {
          kind: 'collapsible',
          label: 'Current agent response',
          meta: 'Before this update',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "It's 9pm, will anyone call me back tonight or tomorrow?" },
              { speaker: 'Myna', text: "Thanks for calling — we're closed right now, but I can take a message. What's this regarding?" },
              { speaker: 'Test — caller', text: 'My check engine light came on. I just want to know when someone will actually call me back.' },
              { speaker: 'Myna', text: "Got it — I've noted that down." },
            ] },
          ],
        },
        {
          kind: 'collapsible',
          label: 'Revised agent response',
          meta: '17.1s',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "It's 9pm, will anyone call me back tonight or tomorrow?" },
              { speaker: 'Myna', text: "Thanks for calling — we're closed right now, but I can take a message and make sure the team follows up. What's this regarding?" },
              { speaker: 'Test — caller', text: 'My check engine light came on. I just want to know when someone will actually call me back.' },
              { speaker: 'Myna', text: "Got it — I've logged your callback request. Per our after-hours policy, you'll hear back within 2 business hours. If this feels urgent in the meantime, you can reach our after-hours emergency line." },
            ] },
          ],
        },
      ],
      approvalPrompt: "Would you like to proceed with updating this procedure in the agent's workflow? Please accept to continue, or reject to discard these changes.",
    },
    approvedReply: 'The updated After-Hours Call Handling procedure has been saved to your procedure library.',
    outcomes: [
      "Adds the after-hours callback policy to the agent's knowledge so it can set accurate expectations.",
      'Updates the after-hours call script to confirm callback details before ending the call.',
      'Automatically logs a callback task for the front desk queue so no message is missed.',
    ],
    changeType: "Adds the after-hours callback policy to the agent's knowledge, updates the after-hours call script to confirm callback details and set expectations, and automatically logs a callback task for the front desk team each morning.",
    sim: {
      before: [],
      after: [
        { role: 'user' as const,  text: "It's 9pm, will anyone call me back tonight or tomorrow?", time: '09:02 PM' },
        { role: 'agent' as const, text: "Thanks for calling — we're closed right now, but I can take a message and make sure the team follows up. What's this regarding?", time: '09:02 PM' },
        { role: 'user' as const,  text: 'My check engine light came on. I just want to know when someone will actually call me back.', time: '09:03 PM' },
        { role: 'agent' as const, text: "Got it — I've logged your callback request. Per our after-hours policy, you'll hear back within 2 business hours. If this feels urgent in the meantime, you can reach our after-hours emergency line.", time: '09:03 PM' },
      ],
    },
    conversations: [
      { name: 'Priya Anand',      message: "It's 9pm, will anyone call me back tonight or tomorrow?", channel: 'Voice', date: 'Jun 10', location: 'Mountain View' },
      { name: 'Marcus Bell',      message: 'I left a message after closing — when should I expect a callback?', channel: 'Voice', date: 'Jun 9', location: 'Palo Alto' },
      { name: 'Sofia Ramirez',    message: 'Does anyone actually check the after-hours voicemail?', channel: 'Voice', date: 'Jun 9', location: 'San Jose' },
      { name: 'Derek Wong',       message: 'No one told me when to expect a call back, so I just called again.', channel: 'Voice', date: 'Jun 8', location: 'Sunnyvale' },
    ],
  },
  {
    id: 'r12',
    gapType: 'procedure',
    title: 'Update results status procedure',
    procedureTitle: 'Results Status procedure',
    summary: '28 conversations impacted • Results procedure only gives a timeline',
    priority: 'High',
    timeAgo: '15m ago',
    conversationCount: 28,
    isNew: false,
    whenToUse: 'When a caller asks about test results, on any channel.',
    exitCriteria: "The caller has a timeline and a way to check results, and — if overdue — a follow-up note has been filed. No medical detail was shared.",
    steps: [
      {
        title: 'Share status and process only',
        bullets: [
          'State that results usually take 4–5 business days.',
          'Share the patient portal link so the caller can check status themselves, and who to contact if they have trouble logging in.',
        ],
      },
      {
        title: 'Offer a follow-up',
        bullets: [
          "If it's been longer than the usual timeline, use {{Trigger Escalation}} to leave a note for the team to follow up that day.",
        ],
      },
    ],
    originalSteps: [
      {
        title: 'Share timeline only',
        bullets: ['State that results usually take 4–5 business days.'],
      },
    ],
    stepsWithDiff: [
      {
        title: 'Share status and process only',
        bullets: [
          'State that results usually take 4–5 business days.',
          'Share the patient portal link so the caller can check status themselves, and who to contact if they have trouble logging in.',
        ],
        addedBullets: [
          'Share the patient portal link so the caller can check status themselves, and who to contact if they have trouble logging in.',
        ],
      },
      {
        title: 'Offer a follow-up',
        bullets: [
          "If it's been longer than the usual timeline, use {{Trigger Escalation}} to leave a note for the team to follow up that day.",
        ],
        addedBullets: [
          "If it's been longer than the usual timeline, use {{Trigger Escalation}} to leave a note for the team to follow up that day.",
        ],
      },
    ],
    outcomes: [
      'Updated the Results Status procedure to add the patient portal link, login help, and an overdue follow-up note — while keeping the existing 4–5 business day timeline.',
      'Once accepted, the updated procedure will replace the existing version in this workflow and your procedure library.',
    ],
    tools: [{ label: 'Trigger Escalation', icon: 'priority_high' }],
    thoughts: 'Callers are asking two things — are the results in, and how do I see them. Let me check what the agent has today before asking for anything.',
    rationale: "A Results Status procedure already exists but only states the 4–5 day timeline — it has nothing about where results arrive, how to check, or what to do when it's overdue, so callers who've already waited past the timeline still get transferred.",
    introBlocks: [
      { kind: 'section', heading: 'Issue', text: "Customers call about test results — did they come back, how do I see them. A Results Status procedure already exists, but it only says one thing: reports usually take 4–5 business days. It has nothing about where results arrive, how to check, or what to do when it's been longer — which is exactly what these callers are asking. So a worried parent hears a timeline they've often already outlived, and still ends up transferred — 28 conversations in the last 7 days asked about test results this way, and in every one, the agent could only repeat the 4–5 day timeline. These calls had the lowest caller ratings of any group.", showConversationsLink: true },
      { kind: 'thought', text: 'Callers are asking two things — are the results in, and how do I see them. Let me check what the agent has today before asking for anything.' },
      { kind: 'thought', label: 'Searched procedures', text: "A Results Status procedure already exists — this isn't a missing procedure. Let me read what's in it before changing anything." },
      { kind: 'thought', label: 'Read procedure', text: 'The whole procedure is one line: results usually take four to five business days. No portal, no way to check, nothing for when it\'s been longer.' },
      { kind: 'thought', text: "That one line fails exactly the callers who need help most — the ones already past five days. The timeline is fine and stays. What's missing: where results arrive, help logging in, and a follow-up when it's overdue. The follow-up note I can add myself; the portal link and the help contact have to come from the user — those aren't things to guess." },
      { kind: 'text', text: "Here's what's happening: the agent already has a Results Status procedure, but it only knows the timeline — 28 conversations in the last 7 days asked about results and the agent could only repeat it, then hand off." },
      { kind: 'section', heading: 'Action needed', variant: 'danger', text: 'Update the existing Results Status procedure. Keep what\'s there — the 4–5 business day timeline — and add the missing parts:', items: [
        { label: 'Portal link', text: 'where results are shared, e.g. the patient portal link' },
        { label: 'Portal help', text: "who to contact if a caller can't log in" },
      ] },
    ],
    composerPrefill: 'Timeline is right. Portal is portal.kidzpulm.com, and the front desk helps with login issues.',
    scriptedTurnResponse: {
      introBlocks: [
        { kind: 'thought', text: "Updating the procedure: the 4–5 day timeline stays, and I'm adding the portal link, front desk for login help, and the overdue follow-up note. The boundary is written into the procedure itself: status and process only — never a value, a number, or a medical detail." },
        {
          kind: 'collapsible',
          label: 'Procedure updated: Results Status',
          meta: '+3 additions',
          children: [
            { kind: 'list', items: [
              { label: 'Portal link', text: 'portal.kidzpulm.com' },
              { label: 'Portal help', text: 'front desk assists with login issues' },
              { label: 'Follow-up', text: 'leaves a note for the team when results are overdue' },
            ] },
          ],
        },
        { kind: 'thought', text: 'Testing the exact call that fails today — a parent a week out from a breathing test.' },
        {
          kind: 'collapsible',
          label: 'Current agent response',
          meta: 'Before this update',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "My daughter had a breathing test last week and I still haven't gotten the results. Did they come in? How do I check?" },
              { speaker: 'Myna', text: 'Results usually take four to five business days to come in.' },
            ] },
          ],
        },
        {
          kind: 'collapsible',
          label: 'Revised agent response',
          meta: '19.6s',
          defaultExpanded: true,
          children: [
            { kind: 'transcript', lines: [
              { speaker: 'Test — caller', text: "My daughter had a breathing test last week and I still haven't gotten the results. Did they come in? How do I check?" },
              { speaker: 'Myna', text: "Results usually come through the patient portal within four to five business days after the test. Since it's been about a week, I can leave a note for our team to follow up with you — would you like me to do that? The portal is portal dot kidzpulm dot com, and if you have trouble logging in, our front desk can help." },
            ] },
          ],
        },
        { kind: 'text', text: "The Results Status update is submitted for review. The agent keeps the timeline it already had — and a caller who's past it now gets a place to check and a follow-up instead of a hand-off." },
      ],
      approvalPrompt: "Would you like to proceed with updating this procedure in the agent's workflow? Please accept to continue, or reject to discard these changes.",
    },
    approvedReply: 'The updated Results Status procedure has been saved to your procedure library.',
    changeType: 'Existing procedure updated with a portal link, login help, and an overdue follow-up note.',
    conversations: [
      { name: 'Priya Anand',    message: "Did my daughter's test results come in yet? I haven't heard anything.", channel: 'Voice', date: 'Jun 10', location: 'Doral' },
      { name: 'Marcus Bell',    message: 'How do I check if my results are ready?', channel: 'Chat', date: 'Jun 9', location: 'Miami' },
      { name: 'Sofia Ramirez',  message: "It's been over a week, still no results.", channel: 'Voice', date: 'Jun 9', location: 'Coral Gables' },
      { name: 'Derek Wong',     message: 'Is there a website where I can check my test results?', channel: 'Text', date: 'Jun 8', location: 'Miami' },
    ],
    sim: {
      before: [],
      after: [
        { role: 'user' as const,  text: "Hi, my daughter had a breathing test last week and I still haven't gotten the results. Did they come in? How do I check?", time: '03:40 PM' },
        { role: 'agent' as const, text: "Results usually come through the patient portal within four to five business days after the test. Since it's been about a week, I can leave a note for our team to follow up with you. Would you like me to do that?", time: '03:40 PM' },
        { role: 'user' as const,  text: 'Yes, please. And where do I check online?', time: '03:41 PM' },
        { role: 'agent' as const, text: "You can check the patient portal at portal dot kidzpulm dot com. If you have trouble logging in, our front desk can help. I've left a note for the team to follow up on your daughter's results.", time: '03:41 PM' },
      ],
    },
  },
  // ─── Query fanout agent — content opportunity recommendations ──────────────
  // Restricted via `agentName` so they only show on the Query fanout agent's Recommendation tab.
  {
    id: 'r-fanout-1',
    gapType: 'knowledge',
    title: 'Create FAQ for "dental implant financing Austin TX"',
    procedureTitle: 'Dental implant financing FAQ',
    summary: '0% citation coverage • High AI engine frequency',
    priority: 'High',
    timeAgo: '2h ago',
    conversationCount: 0,
    isNew: true,
    whenToUse: 'When a tracked prompt\'s fanout sub-query has zero brand citation coverage and high AI engine frequency.',
    steps: [
      {
        title: 'Publish a financing FAQ',
        bullets: [
          'Answer common financing questions: monthly payment plans, insurance coverage, CareCredit, and interest-free options',
          'Include Austin-specific pricing and financing partner names so AI engines can cite a local, specific answer',
          'Structure as FAQ schema so it is easy for AI engines to extract and cite',
        ],
      },
    ],
    outcomes: [
      'Closes a 0% coverage fanout gap on a high-frequency sub-query.',
      'Once published, the next fanout run will re-check citation coverage for this sub-query.',
    ],
    tools: [
      { label: 'Query fanout generator', icon: 'call_split' },
      { label: 'Citation validator', icon: 'link' },
    ],
    thoughts: 'The fanout run estimated "dental implant financing Austin TX" as a sub-query for the tracked prompt "How much do dental implants cost in Austin?" — checking the citation index, the brand has zero coverage on it.',
    rationale: '"dental implant financing Austin TX" is a high-frequency estimated fanout sub-query with 0% brand citation coverage — none of the brand\'s published pages currently answer it.',
    changeType: 'New FAQ page targeting "dental implant financing Austin TX" published and submitted for re-indexing.',
    conversations: [],
    agentName: 'Query fanout agent',
  },
  {
    id: 'r-fanout-2',
    gapType: 'knowledge',
    title: 'Create comparison page for "Invisalign vs traditional braces cost"',
    procedureTitle: 'Invisalign vs braces comparison page',
    summary: '12% citation coverage • Medium AI engine frequency',
    priority: 'Medium',
    timeAgo: '1d ago',
    conversationCount: 0,
    isNew: true,
    whenToUse: 'When a tracked prompt\'s fanout sub-query has low brand citation coverage relative to its AI engine frequency.',
    steps: [
      {
        title: 'Publish a comparison page',
        bullets: [
          'Compare cost, treatment time, and appearance between Invisalign and traditional braces',
          'Include a clear pricing table so AI engines can cite specific numbers',
          "Link to the practice's financing FAQ for a natural next step",
        ],
      },
    ],
    outcomes: [
      'Improves the Fanout Coverage Score for the "orthodontic treatment options" tracked prompt.',
      'Once published, the next fanout run will re-check citation coverage for this sub-query.',
    ],
    tools: [
      { label: 'Query fanout generator', icon: 'call_split' },
      { label: 'AI platform query runner', icon: 'travel_explore' },
    ],
    thoughts: 'The fanout run estimated "Invisalign vs traditional braces cost" as a sub-query for the tracked prompt "What are my orthodontic treatment options?" — only 12% of the estimated sub-queries for this prompt currently have brand citations.',
    rationale: '"Invisalign vs traditional braces cost" is an estimated fanout sub-query with low brand citation coverage relative to how often AI engines surface it.',
    changeType: 'New comparison page targeting "Invisalign vs traditional braces cost" published and submitted for re-indexing.',
    conversations: [],
    agentName: 'Query fanout agent',
  },
  // ─── Domain health agent — crawl, freshness, and renderability recommendations ──
  // Restricted via `agentName` so they only show on the Domain health agent's Recommendation tab.
  {
    id: 'r-domain-health-1',
    gapType: 'action',
    title: 'Fix renderability failure on 14 service pages',
    procedureTitle: 'Service page renderability fix',
    summary: '14 pages affected • Content invisible to crawlers',
    priority: 'High',
    timeAgo: '3h ago',
    conversationCount: 0,
    isNew: true,
    whenToUse: 'When the website health analysis flags pages where key content only renders after client-side JavaScript runs, so a crawler reading the raw HTML sees an empty or incomplete page.',
    steps: [
      {
        title: 'Server-render or pre-render the affected content',
        bullets: [
          'Move the service descriptions and pricing blocks currently injected client-side into the server-rendered HTML response',
          'Re-run the crawl and confirm the content now appears in the raw HTML, not just after JavaScript executes',
        ],
      },
    ],
    outcomes: [
      'Closes a renderability gap flagged across 14 service pages.',
      'Once fixed, the next scheduled crawl will re-check renderability for these pages.',
    ],
    tools: [
      { label: 'Website Health Analysis', icon: 'health_and_safety' },
      { label: 'Check crawl status', icon: 'sync' },
    ],
    thoughts: 'The website health analysis flagged 14 service pages where the crawled HTML is missing content that\'s visible in the browser — checking further, that content is being injected by client-side JavaScript after the initial page load.',
    rationale: '14 service pages render their key content client-side only, so crawlers that don\'t execute JavaScript see an empty or incomplete page — reducing the odds this content gets cited by AI engines.',
    changeType: 'Service page content moved to server-rendered HTML so it is visible without executing JavaScript.',
    conversations: [],
    agentName: 'Domain health agent',
  },
  {
    id: 'r-domain-health-2',
    gapType: 'knowledge',
    title: 'Refresh 9 pricing pages flagged as stale',
    procedureTitle: 'Pricing page refresh',
    summary: '9 pages affected • Last updated over 18 months ago',
    priority: 'Medium',
    timeAgo: '1d ago',
    conversationCount: 0,
    isNew: true,
    whenToUse: 'When the freshness check flags pages that haven\'t been updated in over a year, reducing the odds an AI engine treats them as a current, citable source.',
    steps: [
      {
        title: 'Update pricing and outdated references',
        bullets: [
          'Review and update listed prices, promotions, and any dated references on each flagged page',
          'Update the page\'s last-modified date so freshness signals reflect the real edit',
        ],
      },
    ],
    outcomes: [
      'Closes a freshness gap flagged across 9 pricing pages.',
      'Once published, the next scheduled crawl will re-check freshness for these pages.',
    ],
    tools: [
      { label: 'Website Health Analysis', icon: 'health_and_safety' },
      { label: 'Send to domain health', icon: 'send' },
    ],
    thoughts: 'The website health analysis flagged 9 pricing pages whose content hasn\'t changed in over 18 months — that staleness lowers how confidently an AI engine can cite them as current.',
    rationale: '9 pricing pages are flagged stale by the freshness check, so AI engines are less likely to treat them as current, citable sources.',
    changeType: 'Pricing and outdated references updated on 9 flagged pages; last-modified dates refreshed.',
    conversations: [],
    agentName: 'Domain health agent',
  },
]

// ── Conversation transcripts (keyed by opening customer message) ────────────

export const CONV_THREADS: Record<string, Turn[]> = {
  "Hi, I'm trying to find a lung doctor for my daughter. Before anything else — do you take Sunshine Health? That's our Medicaid plan.": [
    { role: 'user',  text: "Hi, I'm trying to find a lung doctor for my daughter. Before anything else — do you take Sunshine Health? That's our Medicaid plan.", time: '11:02 AM' },
    { role: 'agent', text: "I can help you book an appointment. To check your coverage, I'll collect your insurance details during the booking and our team will verify them.", time: '11:02 AM' },
    { role: 'user',  text: "No, I mean — do you even accept Sunshine Health? I don't want to go through all this if you're not in network.", time: '11:03 AM' },
    { role: 'agent', text: "I understand. I'm not able to confirm that right now, but if we register, our team will verify your insurance before the visit.", time: '11:03 AM' },
    { role: 'user',  text: "So you can't just tell me yes or no?", time: '11:04 AM' },
    { role: 'agent', text: "I'm sorry, I can't confirm the plan directly. I can start the registration and someone will check afterward.", time: '11:04 AM' },
  ],
  'Hi, my son has his first appointment today. I just have a couple quick questions.': [
    { role: 'user',  text: 'Hi, my son has his first appointment today. I just have a couple quick questions.', time: '09:14 AM' },
    { role: 'agent', text: 'Of course. What would you like to know?', time: '09:14 AM' },
    { role: 'user',  text: 'What do we need to bring? And how long will it take — he has a breathing test, I think.', time: '09:14 AM' },
    { role: 'agent', text: 'For that, let me connect you with our front desk. One moment.', time: '09:15 AM' },
    { role: 'user',  text: "It's really just — what documents, and how long. And actually, what time do you close today?", time: '09:15 AM' },
    { role: 'agent', text: "I'm sorry, I don't have those details. Let me transfer you.", time: '09:15 AM' },
    { role: 'user',  text: "You don't know what time you close?", time: '09:16 AM' },
    { role: 'agent', text: 'One moment while I connect you.', time: '09:16 AM' },
  ],
  "Hi, my son takes a daily inhaler for his asthma, and we're traveling to India for two months. I need a refill that covers the whole trip — about two months' worth.": [
    { role: 'user',  text: "Hi, my son takes a daily inhaler for his asthma, and we're traveling to India for two months. I need a refill that covers the whole trip — about two months' worth.", time: '02:20 PM' },
    { role: 'agent', text: 'I can help with appointments and scheduling. For a prescription refill, let me connect you with someone who can help. One moment.', time: '02:20 PM' },
    { role: 'user',  text: "Can't you just take down what I need? It's his controller inhaler, and I need enough for two months because we'll be out of the country.", time: '02:21 PM' },
    { role: 'agent', text: "I'm sorry, I'm not able to handle refills. Let me transfer you.", time: '02:21 PM' },
    { role: 'user',  text: 'We leave in a few days, so I really need this sorted out.', time: '02:22 PM' },
    { role: 'agent', text: 'One moment while I connect you.', time: '02:22 PM' },
  ],
  "Hi, my son woke up this morning with a fever and he's coughing a lot. He's a patient there. Can we still come in today?": [
    { role: 'user',  text: "Hi, my son woke up this morning with a fever and he's coughing a lot. He's a patient there. Can we still come in today?", time: '08:05 AM' },
    { role: 'agent', text: 'I can help with appointments. Let me connect you with someone about a same-day visit. One moment.', time: '08:05 AM' },
    { role: 'user',  text: 'So do you guys do same-day sick visits or not? I just need to know if I should bring him in or go somewhere else.', time: '08:06 AM' },
    { role: 'agent', text: "I'm sorry, I don't have that information. Let me transfer you.", time: '08:06 AM' },
    { role: 'user',  text: "Okay, but please hurry — I don't want to wait on hold with a sick kid.", time: '08:06 AM' },
    { role: 'agent', text: 'One moment while I connect you.', time: '08:07 AM' },
  ],
  "Hi, my daughter had a breathing test last week and I still haven't gotten the results. Did they come in? How do I check?": [
    { role: 'user',  text: "Hi, my daughter had a breathing test last week and I still haven't gotten the results. Did they come in? How do I check?", time: '03:40 PM' },
    { role: 'agent', text: "I'm not able to share medical results.", time: '03:40 PM' },
    { role: 'user',  text: "I'm not asking you to read them to me. I just want to know if they're back yet, and how I'm supposed to see them.", time: '03:41 PM' },
    { role: 'agent', text: "I understand, but I can't provide results information. Let me connect you with someone.", time: '03:41 PM' },
    { role: 'user',  text: 'Can you at least tell me if the doctor has looked at them? Or where I go to check online?', time: '03:41 PM' },
    { role: 'agent', text: "I'm sorry, I don't have that. One moment while I transfer you.", time: '03:42 PM' },
  ],
  'How do I make a payment for my service invoice?': [
    { role: 'user',  text: 'Hi, I just picked up my car and I got an invoice. How do I make a payment?', time: '10:12 AM' },
    { role: 'agent', text: "Hi! Thanks for reaching out. I'd be happy to help. Could you tell me if you'd prefer to pay by phone, online, or in person?", time: '10:12 AM' },
    { role: 'user',  text: 'Online would be easiest for me. Do you have a payment portal?', time: '10:13 AM' },
    { role: 'agent', text: "I'm sorry, I don't currently have information about an online payment portal. I don't want to give you incorrect details. Could you call the dealership directly or visit the service desk?", time: '10:13 AM' },
    { role: 'user',  text: 'Really? There\'s no way to pay online? That\'s frustrating.', time: '10:14 AM' },
    { role: 'agent', text: "I completely understand your frustration. Unfortunately I don't have the payment options details available right now. I'd recommend speaking with our billing team at the dealership — they'll be able to sort this out quickly.", time: '10:14 AM' },
    { role: 'user',  text: 'Ok fine. I\'ll just call. Thanks I guess.', time: '10:15 AM' },
  ],
  'Can I pay my balance online somewhere?': [
    { role: 'user',  text: 'I have an outstanding balance from my last service visit. Can I pay it online?', time: '02:08 PM' },
    { role: 'agent', text: "Hello! Thanks for contacting us. I want to help but I don't have access to payment portal details right now. I'd hate to give you the wrong link.", time: '02:08 PM' },
    { role: 'user',  text: 'Can you at least tell me if you have one?', time: '02:09 PM' },
    { role: 'agent', text: "I believe there may be online options available, but I can't confirm the details from here. Your best bet would be to call our billing team — they can confirm and walk you through the process.", time: '02:09 PM' },
    { role: 'user',  text: 'This should be a simple question. I\'ll figure it out myself.', time: '02:10 PM' },
  ],
  "I need to pay for my oil change, do you accept Apple Pay?": [
    { role: 'user',  text: 'Hey, I just got an oil change. Do you accept Apple Pay for payment?', time: '09:45 AM' },
    { role: 'agent', text: "Hi! Great question. Unfortunately I don't have information about which payment methods are accepted at the service desk.", time: '09:45 AM' },
    { role: 'user',  text: 'What about card payments? Or Venmo?', time: '09:46 AM' },
    { role: 'agent', text: "I'm not able to confirm accepted payment methods from here. I'd recommend calling the service desk directly before heading over — they'll be able to tell you exactly what's accepted.", time: '09:46 AM' },
    { role: 'user',  text: 'Kind of pointless if I have to call anyway. Nevermind.', time: '09:47 AM' },
  ],
  'What are my payment options for the repair?': [
    { role: 'user',  text: 'My car just had a major repair. What payment options do you have?', time: '03:15 PM' },
    { role: 'agent', text: "Thank you for reaching out. I want to make sure I give you accurate information — I don't currently have the list of accepted payment methods in my knowledge base.", time: '03:15 PM' },
    { role: 'user',  text: 'Do you at least accept credit cards?', time: '03:16 PM' },
    { role: 'agent', text: "I'd expect so, but I can't confirm that for certain. I'd recommend calling our service desk to confirm before you come in.", time: '03:16 PM' },
    { role: 'user',  text: 'This is basic information. Why don\'t you know this?', time: '03:17 PM' },
    { role: 'agent', text: "You're right, and I apologize for the inconvenience. This is a gap in the information available to me right now. I'll make sure this is flagged for the team.", time: '03:17 PM' },
  ],
  "Can I split the payment across two cards?": [
    { role: 'user',  text: 'I\'d like to split my payment across two credit cards. Is that possible?', time: '11:30 AM' },
    { role: 'agent', text: "That's a great question. I don't have guidance on split payments in my current knowledge base, so I wouldn't want to guess.", time: '11:30 AM' },
    { role: 'user',  text: 'I just need a yes or no. Can you check?', time: '11:31 AM' },
    { role: 'agent', text: "I'm sorry, I'm unable to check payment processing details. I'd suggest calling our billing department directly — they can confirm if split payments are possible.", time: '11:31 AM' },
    { role: 'user',  text: 'Ok, will do.', time: '11:32 AM' },
  ],
  'I need to move my appointment to today, is that possible?': [
    { role: 'user',  text: 'Hi, I have an appointment for Thursday but my car is making a strange noise. Can I move it to today?', time: '09:05 AM' },
    { role: 'agent', text: "I understand the urgency. Let me check availability for today.", time: '09:05 AM' },
    { role: 'user',  text: 'Sure, I can be flexible on timing.', time: '09:06 AM' },
    { role: 'agent', text: "I'm sorry, I'm not able to confirm same-day appointment changes directly. The system I have access to doesn't support same-day rescheduling. You'd need to call the service desk.", time: '09:06 AM' },
    { role: 'user',  text: 'Really? The noise sounds serious though.', time: '09:07 AM' },
    { role: 'agent', text: "I completely understand your concern. I wish I could do more but same-day changes are outside what I'm currently set up to handle. Please call us directly and mention the noise — we'll do our best.", time: '09:07 AM' },
    { role: 'user',  text: 'Ok, calling now.', time: '09:08 AM' },
  ],
  'Can I reschedule for the same day?': [
    { role: 'user',  text: 'I need to reschedule my 2pm appointment to earlier today if possible.', time: '10:40 AM' },
    { role: 'agent', text: "I'd like to help with that. Unfortunately the rescheduling tool I have access to doesn't support same-day changes.", time: '10:40 AM' },
    { role: 'user',  text: 'Is there anything you can do or should I just call?', time: '10:41 AM' },
    { role: 'agent', text: "Calling would be the fastest option. I'm sorry I can't handle this directly — same-day rescheduling isn't something I'm currently equipped to process.", time: '10:41 AM' },
  ],
  "The agent told me same-day changes aren't allowed.": [
    { role: 'user',  text: 'I tried to reschedule my appointment earlier and the agent said same-day changes aren\'t allowed. Is that true?', time: '01:15 PM' },
    { role: 'agent', text: "I apologize for the confusion. I don't have clear guidance on same-day rescheduling in my current setup, so I defaulted to saying it wasn't allowed — which may not be accurate.", time: '01:15 PM' },
    { role: 'user',  text: 'So you don\'t actually know?', time: '01:16 PM' },
    { role: 'agent', text: "That's correct, and I sincerely apologize. I should not have stated it as a firm policy. I'd recommend calling the service desk to get a definitive answer.", time: '01:16 PM' },
    { role: 'user',  text: 'This is really poor. I wasted 20 minutes on hold yesterday because of wrong info.', time: '01:17 PM' },
    { role: 'agent', text: "I'm very sorry for the trouble this caused. Your feedback is important — I'll flag this as a gap so it gets resolved.", time: '01:17 PM' },
  ],
  'My brakes feel wrong, I need help immediately.': [
    { role: 'user',  text: 'My brakes feel really wrong — there\'s a grinding noise and the pedal feels soft. I need help now.', time: '08:55 AM' },
    { role: 'agent', text: "I'm sorry to hear that — that does sound serious. Can you tell me more about the symptoms so I can help?", time: '08:55 AM' },
    { role: 'user',  text: 'The grinding is getting worse. I\'m worried it\'s not safe to drive.', time: '08:56 AM' },
    { role: 'agent', text: "I understand your concern. Let me see if I can get you in touch with someone who can help.", time: '08:57 AM' },
    { role: 'user',  text: 'It\'s been 3 minutes and I\'m still waiting. This is a safety issue!', time: '08:58 AM' },
    { role: 'agent', text: "I apologize for the delay. I'm trying to locate an available service advisor. Please stay on the line.", time: '08:59 AM' },
    { role: 'user',  text: 'I\'m going to call 911 if nobody picks up.', time: '09:01 AM' },
  ],
  "There's smoke coming from my engine right now.": [
    { role: 'user',  text: 'There is smoke coming from under my hood right now. What do I do?', time: '02:33 PM' },
    { role: 'agent', text: "That sounds very serious. Are you safe? Please pull over immediately if you haven't already.", time: '02:33 PM' },
    { role: 'user',  text: 'I\'ve pulled over. The smoke is getting worse. I need someone now.', time: '02:34 PM' },
    { role: 'agent', text: "I'm escalating this right away. Please stay away from the vehicle. I'm trying to reach our emergency contact.", time: '02:35 PM' },
    { role: 'user',  text: 'It\'s been 2 minutes. Nobody has called me back.', time: '02:37 PM' },
    { role: 'agent', text: "I sincerely apologize. I'm not equipped to directly place emergency calls. Please call 911 immediately if you feel unsafe, and also call our service line directly.", time: '02:37 PM' },
  ],
  'Are you open on Saturdays?': [
    { role: 'user',  text: 'Hi, are you open on Saturdays? I work during the week and can only come in on weekends.', time: '06:45 PM' },
    { role: 'agent', text: "Hi! Great question. Let me look that up for you.", time: '06:45 PM' },
    { role: 'user',  text: 'Thanks.', time: '06:46 PM' },
    { role: 'agent', text: "I'm sorry, I don't have the current business hours in my knowledge base. I'd recommend checking the website or calling the dealership directly.", time: '06:46 PM' },
    { role: 'user',  text: 'Can\'t you just tell me if you\'re open Saturday or not?', time: '06:47 PM' },
    { role: 'agent', text: "I understand how frustrating that must be — that should be a simple answer. Unfortunately I don't have that information. I'll flag this as a gap.", time: '06:47 PM' },
    { role: 'user',  text: 'Great, so I still don\'t know. I\'ll just show up and hope for the best.', time: '06:48 PM' },
  ],
  'What time do you close today?': [
    { role: 'user',  text: 'Hey quick question — what time do you close today? I want to drop off my car after work.', time: '04:20 PM' },
    { role: 'agent', text: "Hi there! Let me check on that for you.", time: '04:20 PM' },
    { role: 'user',  text: 'I get off at 5:30, so I\'m hoping you\'re open till 6.', time: '04:21 PM' },
    { role: 'agent', text: "I'm sorry, I don't have today's closing time available. The business hours aren't in my current knowledge base.", time: '04:21 PM' },
    { role: 'user',  text: 'Seriously? You don\'t know your own hours?', time: '04:22 PM' },
    { role: 'agent', text: "I understand how frustrating this is. This is a gap that needs to be fixed. I'd suggest calling us directly to confirm before you head over.", time: '04:22 PM' },
  ],
  'Are you open on Memorial Day?': [
    { role: 'user',  text: 'Are you open on Memorial Day? I need to get my car looked at.', time: '10:05 AM' },
    { role: 'agent', text: "Hi! That's a good question. Let me check our holiday schedule.", time: '10:05 AM' },
    { role: 'user',  text: 'It\'s coming up next week so I\'m trying to plan ahead.', time: '10:06 AM' },
    { role: 'agent', text: "I'm sorry, I don't have holiday hours available in my knowledge base. I'd recommend calling us or checking our website for updated holiday schedules.", time: '10:06 AM' },
    { role: 'user',  text: 'The website doesn\'t list holidays. That\'s why I\'m asking you.', time: '10:07 AM' },
    { role: 'agent', text: "I completely understand. I apologize that I can't give you a direct answer. This is information that should be available here.", time: '10:07 AM' },
  ],
  "I need to book a service but I don't know my VIN.": [
    { role: 'user',  text: 'I need to schedule a service but I don\'t have my VIN on hand. Can I still book?', time: '11:00 AM' },
    { role: 'agent', text: "You can try to book, but I'll need the VIN to look up your vehicle record. Do you have your registration handy?", time: '11:00 AM' },
    { role: 'user',  text: 'I don\'t have it with me right now. Can I give you the make and model instead?', time: '11:01 AM' },
    { role: 'agent', text: "I'll need a VIN or license plate to pull up the correct record — there can be multiple configurations of the same model.", time: '11:01 AM' },
    { role: 'user',  text: 'Can I just give you my name and phone number and you look it up?', time: '11:02 AM' },
    { role: 'agent', text: "I'm not able to search by name or phone in this system. I'd recommend calling the service desk directly — they have more lookup options available.", time: '11:02 AM' },
    { role: 'user',  text: 'Ok. Seems like a lot of friction just to book a service.', time: '11:03 AM' },
  ],
  "Can I book without the vehicle number?": [
    { role: 'user',  text: 'Can I book a service appointment without providing a VIN?', time: '02:15 PM' },
    { role: 'agent', text: "I'd recommend having the VIN ready as it helps us pull your vehicle details accurately.", time: '02:15 PM' },
    { role: 'user',  text: 'I don\'t have it right now. What if I book now and provide it later?', time: '02:16 PM' },
    { role: 'agent', text: "I don't currently have a way to create a partial booking in this system. The VIN is required to proceed.", time: '02:16 PM' },
    { role: 'user',  text: 'Why can\'t you just take my name and number and call me back?', time: '02:17 PM' },
    { role: 'agent', text: "That's a reasonable request. Unfortunately I'm not set up to capture callback requests in this flow. Calling the service desk directly would be the best option.", time: '02:17 PM' },
  ],
  "It's 9pm, will anyone call me back tonight or tomorrow?": [
    { role: 'user',  text: "It's 9pm, will anyone call me back tonight or tomorrow?", time: '09:02 PM' },
    { role: 'agent', text: "Thanks for calling — we're closed right now, but I can take a message and make sure the team follows up. What's this regarding?", time: '09:02 PM' },
    { role: 'user',  text: 'My check engine light came on. I just want to know when someone will actually call me back.', time: '09:03 PM' },
    { role: 'agent', text: "I've noted your concern and taken your callback number. I don't have specific timing details available, so I can't say exactly when you'll hear back — someone will follow up when they can.", time: '09:03 PM' },
    { role: 'user',  text: "That's not very reassuring. Tonight? Tomorrow? Next week?", time: '09:04 PM' },
    { role: 'agent', text: "I understand the frustration — I just don't have that information available right now. I'll flag this as a gap so it gets fixed.", time: '09:04 PM' },
  ],
  "Did my daughter's test results come in yet? I haven't heard anything.": [
    { role: 'agent', text: 'If this is an emergency, please hang up and dial nine one one. This call may be recorded for quality and training purposes. My name is Myna, your virtual assistant. How can I help you today?', time: '10:12 AM' },
    { role: 'user',  text: "Hi, my daughter had a breathing test last week and I still haven't gotten the results. Did they come in? How do I check?", time: '10:12 AM' },
    { role: 'agent', text: 'Results usually take four to five business days to come in.', time: '10:13 AM' },
    { role: 'user',  text: "Right, but it's been a week now. So are they in? Where do I check?", time: '10:13 AM' },
    { role: 'agent', text: "I'm sorry, I don't have that information. Results usually arrive within four to five business days.", time: '10:13 AM' },
    { role: 'user',  text: 'You just said that. Can I see them online somewhere? Has the doctor looked at them?', time: '10:14 AM' },
    { role: 'agent', text: "I'm not able to help with that. Let me connect you with someone. One moment.", time: '10:14 AM' },
    { role: 'user',  text: "This is frustrating — I've been waiting a week.", time: '10:14 AM' },
  ],
  'How do I check if my results are ready?': [
    { role: 'user',  text: 'How do I check if my results are ready?', time: '2:15 PM' },
    { role: 'agent', text: 'Results usually take four to five business days.', time: '2:15 PM' },
    { role: 'user',  text: "It's been six days already. Is there a portal or something I can check myself?", time: '2:16 PM' },
    { role: 'agent', text: "I'm sorry, I don't have that information. Let me connect you with someone.", time: '2:16 PM' },
    { role: 'user',  text: "This has been the same non-answer every time I ask.", time: '2:17 PM' },
  ],
}

// ── Token maps + helpers ─────────────────────────────────────────────────────

export const GAP_ICON: Record<GapType, string> = {
  procedure: 'description',
  knowledge: 'menu_book',
  action: 'build',
}

export const GAP_LABEL: Record<GapType, string> = {
  procedure: 'Procedure',
  knowledge: 'Knowledge',
  action: 'Action',
}

export const PRIORITY_VARIANT: Record<Priority, 'danger' | 'warning' | 'neutral'> = {
  High: 'danger',
  Medium: 'warning',
  Low: 'neutral',
}

/** Impact tier is driven purely by how many conversations a recommendation affects, relative to
 *  the busiest recommendation currently in view — never hand-picked. Splits the 0..max range
 *  into three equal bands: the busiest third of the range is High, the middle third Medium, and
 *  the rest Low. `maxConversationCount` should be the max `conversationCount` across whatever
 *  set of recommendations is currently being displayed (e.g. one agent's table). */
export function computeImpact(conversationCount: number, maxConversationCount: number): Priority {
  if (maxConversationCount <= 0) return 'Low'
  const ratio = conversationCount / maxConversationCount
  if (ratio >= 2 / 3) return 'High'
  if (ratio >= 1 / 3) return 'Medium'
  return 'Low'
}

export type RecStatus = 'open' | 'accepted' | 'rejected'

const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 }

const FEEDBACK_REPORTER_NAMES = ['Anil', 'Robert', 'Dylan', 'Jobin', 'Maria', 'Chen', 'Fatima', 'Alex']

/** Deterministically picks a name for the Recommendation tab's Type column — stable across
 *  reloads/re-renders (unlike `Math.random()`) since it's derived from a fixed seed, but varies
 *  across recommendations so it reads as "a real person reported this," not one fixed name. */
export function pickReporterName(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return FEEDBACK_REPORTER_NAMES[hash % FEEDBACK_REPORTER_NAMES.length]
}

/** Formats a `Recommendation.timeAgo` value (e.g. "15m ago", "4h ago", "Just now") for the
 *  Recommendation tab's Date column: minutes/hours ago under 24h, "Yesterday" for the next day,
 *  and an absolute date ("March 15, 2026") beyond that. */
/** Parses a `Recommendation.timeAgo` value (e.g. "15m ago", "4h ago", "Just now") into minutes
 *  elapsed — shared by `formatRecommendationDate` and `recommendationAgeMinutes` (for sorting).
 *  Returns `null` for an already-absolute date or unrecognized format. */
function parseTimeAgoMinutes(timeAgo: string): number | null {
  if (timeAgo === 'Just now') return 0
  const minutesMatch = timeAgo.match(/^(\d+)m ago$/)
  if (minutesMatch) return Number(minutesMatch[1])
  const hoursMatch = timeAgo.match(/^(\d+)h ago$/)
  if (hoursMatch) return Number(hoursMatch[1]) * 60
  const daysMatch = timeAgo.match(/^(\d+)d ago$/)
  if (daysMatch) return Number(daysMatch[1]) * 1440
  return null
}

export function formatRecommendationDate(timeAgo: string): string {
  const minutesElapsed = parseTimeAgoMinutes(timeAgo)
  if (minutesElapsed === null) return timeAgo // already an absolute date or some other format

  if (minutesElapsed < 1) return 'Just now'
  if (minutesElapsed < 60) return `${minutesElapsed} minute${minutesElapsed === 1 ? '' : 's'} ago`

  const hoursElapsed = Math.floor(minutesElapsed / 60)
  if (hoursElapsed < 24) return `${hoursElapsed} hour${hoursElapsed === 1 ? '' : 's'} ago`

  const daysElapsed = Math.floor(minutesElapsed / 1440)
  if (daysElapsed === 1) return 'Yesterday'

  const date = new Date(Date.now() - minutesElapsed * 60_000)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/** Minutes elapsed for a `Recommendation.timeAgo` value — lower means more recent. Used to sort
 *  the Recommendation tab by date (default order, and the Date column's own sort). Unrecognized/
 *  absolute-date formats sort as oldest, since there's no elapsed time to compare against "now". */
export function recommendationAgeMinutes(timeAgo: string): number {
  return parseTimeAgoMinutes(timeAgo) ?? Number.MAX_SAFE_INTEGER
}

export function sortRecommendations(recs: Recommendation[]): Recommendation[] {
  return [...recs].sort((a, b) => {
    // Human feedback always leads the table — it's a direct report on this agent, not a
    // pattern the system found on its own, so it shouldn't wait behind AI-detected priority tiers.
    const feedbackDiff = (a.source === 'feedback' ? 0 : 1) - (b.source === 'feedback' ? 0 : 1)
    if (feedbackDiff !== 0) return feedbackDiff
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return b.conversationCount - a.conversationCount
  })
}

export function getRecStatus(id: string, rejected: Set<string>, accepted: Set<string>): RecStatus {
  if (rejected.has(id)) return 'rejected'
  if (accepted.has(id)) return 'accepted'
  return 'open'
}

// ── Feedback → recommendation helpers ────────────────────────────────────────
//
// Keyword heuristics for classifying free-text Inbox feedback with no LLM available:
//   - knowledge:  the agent lacked information that should have existed (hours, policy, pricing, etc.)
//   - action:     an action should have been taken (booked, sent, updated, escalated) and wasn't
//   - procedure:  the agent should have said or done something differently (wrong script, tone, steps)

const KNOWLEDGE_KEYWORDS = [
  'don’t know', 'dont know', "didn't know", 'doesn’t know', "doesn't know",
  'no information', 'missing information', "didn't have", "doesn't have",
  'not aware', 'wasn’t aware', 'unaware', 'outdated', 'incorrect hours', 'wrong hours',
  'business hours', 'hours', 'pricing', 'price', 'cost', 'policy', 'location', 'address',
  'knowledge base', 'couldn’t tell', "couldn't tell", 'no idea', 'information',
]

const ACTION_KEYWORDS = [
  "didn't book", 'did not book', "didn't schedule", 'did not schedule', "didn't send",
  'did not send', "didn't process", 'did not process', "didn't update", 'did not update',
  'failed to', 'never did', "wasn't done", 'was not done', 'forgot to', 'no follow up',
  'no follow-up', 'book', 'schedule', 'reschedule', 'cancel', 'refund', 'process the',
  'send a', 'update the', 'escalate', 'transfer',
]

const PROCEDURE_KEYWORDS = [
  'should have said', 'should have told', 'supposed to say', 'supposed to do',
  'wrong information', 'wrong info', 'misinformed', 'rude', 'tone', 'script',
  'protocol', 'procedure', 'process was', 'steps', 'said the wrong', 'told me the wrong',
  'not supposed to', 'shouldn’t have said', "shouldn't have said",
]

function countMatches(text: string, keywords: string[]): number {
  return keywords.reduce((count, kw) => (text.includes(kw) ? count + 1 : count), 0)
}

/** Best-effort, keyword-based classification of free-text feedback — no LLM available in this prototype. */
export function classifyFeedbackType(text: string): GapType {
  const normalized = text.toLowerCase()
  const scores: Record<GapType, number> = {
    knowledge: countMatches(normalized, KNOWLEDGE_KEYWORDS),
    action: countMatches(normalized, ACTION_KEYWORDS),
    procedure: countMatches(normalized, PROCEDURE_KEYWORDS),
  }
  // Human feedback is most often a knowledge gap (the agent didn't know something) — so any
  // knowledge-keyword match wins outright, instead of only when it happens to score highest.
  // Covers both "no keywords matched at all" (short/typo'd feedback) and ties/near-ties against
  // an incidental procedure or action keyword.
  if (scores.knowledge > 0 || (scores.action === 0 && scores.procedure === 0)) return 'knowledge'
  return scores.action >= scores.procedure ? 'action' : 'procedure'
}

// Known topic phrases, longest/most-specific first — lets the title generator recognize a
// familiar subject (e.g. "business hours") inside otherwise messy free-text feedback.
const ACTIONABLE_TOPIC_PHRASES = [
  'after-hours callback policy', 'callback policy', 'business hours', 'holiday hours',
  'weekend hours', 'return policy', 'refund policy', 'pricing', 'policy', 'location',
  'address', 'cost', 'price', 'hours',
]

function extractKnownTopic(normalized: string): string | null {
  return ACTIONABLE_TOPIC_PHRASES.find((phrase) => normalized.includes(phrase)) ?? null
}

/** Turns raw feedback text into an actionable recommendation title instead of just echoing back
 *  what was typed — no LLM summarization available, so this recognizes known topics first (e.g.
 *  "Business hours" — left as a bare topic name, not verb-prefixed, so it reads distinctly from
 *  an AI-detected recommendation like "Update business hours" rather than duplicating it), then
 *  falls back to stripping common request framing ("we need...", "...is needed") and leading
 *  with an action verb for anything unrecognized. */
export function titleFromFeedback(text: string, gapType: GapType): string {
  const normalized = text.trim().toLowerCase()
  const knownTopic = extractKnownTopic(normalized)
  if (knownTopic) return knownTopic.charAt(0).toUpperCase() + knownTopic.slice(1)

  const verb = gapType === 'action' ? 'Add' : 'Update'
  let topic = normalized
    .replace(/^(we\s+(should|need|require|must)\s+(to\s+)?(give|provide|add|share|have|update)?\s*)/, '')
    .replace(/^(please\s+)?(add|update|give|provide|share|need|needs|needed)\s+/, '')
    .replace(/\s+(is|are)\s+needed\s*[.!]*$/, '')
    .replace(/\s+needed\s*[.!]*$/, '')
    .replace(/[.!?]+$/, '')
    .trim()

  if (!topic) topic = normalized.replace(/[.!?]+$/, '').trim()
  const title = `${verb} ${topic}`
  return title.length > 90 ? `${title.slice(0, 87)}...` : title
}

/** Standardized recommendation subtext — "{N} conversation(s) impacted • {Reason}" — used by
 *  every recommendation's table subtitle so the format stays consistent across AI-detected and
 *  human-feedback rows alike. `reason` is capitalized automatically, so callers can pass it in
 *  lowercase. */
export function impactSummary(conversationCount: number, reason: string): string {
  const noun = conversationCount === 1 ? 'conversation' : 'conversations'
  const capitalizedReason = reason.charAt(0).toUpperCase() + reason.slice(1)
  return `${conversationCount} ${noun} impacted • ${capitalizedReason}`
}

/** For now this always frames a feedback recommendation as raised by several people — a
 *  placeholder for a real "similar reports" count, tuned so a fresh single-conversation report
 *  reads as "4 conversations impacted • Reported via inbox feedback". */
export function similarIssuesSummary(count: number): string {
  return impactSummary(count + 3, 'reported via inbox feedback')
}

export const GENERIC_FEEDBACK_APPROVAL_PROMPT =
  'Do you accept these changes? Accept to submit them for review, or reject to discard them.'

const GAP_TYPE_SEARCH_NOTE: Record<GapType, string> = {
  knowledge: "The procedure library doesn't have this information on file yet — that's exactly why the agent couldn't answer it.",
  action: "The agent isn't wired up to take this action yet — the procedure stops short of it.",
  procedure: "The current procedure doesn't account for this — it needs an explicit rule for it.",
}

const GAP_TYPE_FIX_NOTE: Record<GapType, string> = {
  knowledge: "add this to the agent's knowledge",
  action: 'wire this action into the procedure',
  procedure: 'update the procedure',
}

/** Builds a coaching-style scripted narrative (reported excerpt → thoughts → procedure update →
 *  before/after test → approval prompt) for a free-text Inbox feedback submission — matching the
 *  hand-authored C1–C4 coaching examples' shape. Since there's no real LLM, the "fix" is a
 *  generic templated acknowledgment rather than a genuinely reasoned change. */
export function buildGenericFeedbackIntroBlocks({
  gapType,
  title,
  procedureTitle,
  text,
  reportedExcerpt,
  reportedTranscript,
}: {
  gapType: GapType
  title: string
  procedureTitle: string
  text: string
  reportedExcerpt?: { speaker: string; text: string }[]
  reportedTranscript?: { speaker: string; text: string }[]
}): IntroBlock[] {
  const hasExcerpt = Boolean(reportedExcerpt && reportedExcerpt.length > 0)
  const blocks: IntroBlock[] = []

  if (hasExcerpt) {
    blocks.push({
      kind: 'collapsible',
      label: 'Read the reported conversation',
      meta: 'Previously',
      defaultExpanded: true,
      reportedExcerpt,
      feedback: text,
      children: reportedTranscript ? [{ kind: 'transcript', lines: reportedTranscript }] : [],
    })
  }

  blocks.push(
    { kind: 'thought', text: `The feedback flags: "${text}" — let me check what the procedure says today before changing anything.` },
    { kind: 'thought', label: 'Searched procedures', text: GAP_TYPE_SEARCH_NOTE[gapType] },
    { kind: 'thought', text: `I'll ${GAP_TYPE_FIX_NOTE[gapType]} so the agent handles this correctly going forward.` },
    {
      kind: 'collapsible',
      label: `Procedure updated: ${procedureTitle}`,
      meta: '1 change',
      children: [{ kind: 'list', items: [{ label: title, text }] }],
    },
    { kind: 'thought', text: 'Testing with the reported message.' },
  )

  if (hasExcerpt) {
    blocks.push({
      kind: 'collapsible',
      label: 'Current agent response',
      meta: 'Before this update',
      defaultExpanded: true,
      children: [{ kind: 'transcript', lines: reportedExcerpt! }],
    })
  }

  blocks.push(
    {
      kind: 'collapsible',
      label: 'Revised agent response',
      meta: 'Now',
      defaultExpanded: true,
      children: [
        {
          kind: 'transcript',
          lines: [{ speaker: 'Myna', text: "Thanks for flagging that — I've updated things so this is handled correctly now." }],
        },
      ],
    },
    { kind: 'text', text: `Done — I've updated ${procedureTitle} based on this feedback.` },
  )

  return blocks
}
