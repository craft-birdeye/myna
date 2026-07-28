// Shared data + helpers for the agent Recommendation tab (table) and its full-page detail screen.

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
  | { kind: 'collapsible'; label: string; meta?: string; defaultExpanded?: boolean; children: IntroBlock[] }
  | { kind: 'transcript'; lines: { speaker: string; text: string }[] }
  | { kind: 'section'; heading: string; text: string; showConversationsLink?: boolean }

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
  priority: Priority
  timeAgo: string
  conversationCount: number
  isNew: boolean
  whenToUse: string
  originalWhenToUse?: string
  steps: ProcedureStep[]
  originalSteps?: ProcedureStep[]
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
    summary: '12 customers asked about payments with no agent guidance available.',
    priority: 'High',
    timeAgo: '2h ago',
    conversationCount: 12,
    isNew: true,
    whenToUse: 'When a customer asks about making a payment for services, parts, or outstanding balances — by phone, online, or in person.',
    steps: [
      {
        title: 'Acknowledge and identify payment type',
        bullets: [
          '"I\'d be happy to help you take care of that." Ask what the payment is for: a service invoice, a parts order, or an outstanding balance.',
          "Look up the customer's account using their name or phone number via DMS Integration.",
          'Confirm the exact amount due and read it back to the customer before proceeding.',
        ],
      },
      {
        title: 'Route to the right payment channel',
        bullets: [
          'Phone — collect card details securely over the call and process through DMS Integration. Never ask the customer to say their full card number out loud if a secure entry line is available.',
          'Online — direct the customer to payments.dealership.com and confirm they have the invoice number from their receipt.',
          'In person — confirm the service desk location and current business hours before ending the call.',
        ],
      },
      {
        title: 'Process and confirm',
        bullets: [
          'Submit the payment through DMS Integration and wait for confirmation before telling the customer it succeeded.',
          'If the payment fails, offer to retry with a different card or escalate to billing — do not end the call on a failure with no next step.',
          'Send a payment confirmation via email or text using Send Confirmation once the transaction clears.',
        ],
      },
      {
        title: 'Close and log',
        bullets: [
          "Update the customer's record in the DMS with the payment details and channel used.",
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
      { kind: 'thought', text: 'The gap is that Myna has no payment info, so let me first check whether any payment content already exists before I ask the user for anything.' },
      { kind: 'thought', label: 'Searched procedures', text: "Myna has procedures for booking, insurance collection, and cancellation — but nothing for payments or pricing. So the moment a caller mentions paying, there's nothing to fall back on and it transfers." },
      { kind: 'thought', text: "This is a content gap, not a logic change — how to pay and what a visit costs are fixed, non-private facts that are safe for Myna to say. But I don't have those details, and I shouldn't invent a payment link or a price. I need to get them from the user before I can build anything. I'll lay out exactly what's needed and stop here." },
      { kind: 'text', text: "Here's what's happening: 12 recent calls asked about payments, and since Myna had no payment guidance to fall back on, every one was routed to a live agent." },
      { kind: 'section', heading: 'Issue', text: "Callers ask how to pay a bill, or what a visit will cost. Myna has no payment or pricing information, so it sends every one of these calls to a live agent — and outside business hours, when billing is closed, the call just ends with no help." },
      { kind: 'section', heading: 'Impact: Medium', text: 'In the last 24 hours, 12 calls about payments were routed to a live agent — 3 of them outside business hours. Agents spent an average of 3 minutes on each.', showConversationsLink: true },
      { kind: 'section', heading: 'Recommendation', text: "Give Myna a Payments & Cost procedure so it can answer these directly instead of transferring. To build it, I need a few details from you (or upload a billing/pricing doc and I'll pull them from it):" },
      { kind: 'list', items: [
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
          label: 'Testing agent response',
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
      approvalPrompt: "Would you like to proceed with adding this procedure to the agent's workflow? Please approve to continue, or reject to discard these changes.",
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
    summary: '18 conversations started with an insurance question — 11 ended without booking.',
    priority: 'High',
    timeAgo: '1h ago',
    conversationCount: 18,
    isNew: true,
    whenToUse: 'When a caller asks whether a specific insurance plan is accepted, or what a visit costs without insurance.',
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
      { kind: 'thought', text: "Callers are asking whether their plan is accepted, and Myna can't answer. Let me check what the current insurance procedure actually covers." },
      { kind: 'thought', label: 'Searched procedures', text: "The insurance procedure collects plan name and member ID during booking and says the team verifies offline. Nothing anywhere lists which plans are accepted — so Myna can't answer the question callers ask first." },
      { kind: 'thought', text: "The accepted-plan list is a fixed business fact and safe to share. But I don't have it, and guessing a plan list would be a serious mistake — Myna could tell someone we take a plan we don't. I need the real list from the user before building anything." },
      { kind: 'text', text: "Here's what's happening: 18 conversations in the last 7 days opened with an insurance question, and 11 of those callers hung up without booking rather than register just to find out if they're covered." },
      { kind: 'section', heading: 'Issue', text: "Customers call before booking to ask if the clinic takes their insurance, or what a visit costs without it. Myna only knows how to collect insurance details during booking — it can't say which plans are accepted. So it gives a vague answer, and new customers hang up rather than register just to find out if they're covered." },
      { kind: 'section', heading: 'Impact: High', text: '18 conversations in the last 7 days started with an insurance-acceptance question. 11 of them ended without a booking — these are new patients lost at the very first question.', showConversationsLink: true },
      { kind: 'section', heading: 'Recommendation', text: "Add accepted-insurance details to the agent. To build it, I need a few details from you (or upload an insurance acceptance doc and I'll pull them from it):" },
      { kind: 'list', items: [
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
          label: 'Testing agent response',
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
      approvalPrompt: "Would you like to proceed with adding this procedure to the agent's workflow? Please approve to continue, or reject to discard these changes.",
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
    summary: '21 conversations asked about documents, visit length, or hours — all routed to staff.',
    priority: 'Medium',
    timeAgo: '3h ago',
    conversationCount: 21,
    isNew: true,
    whenToUse: 'When a caller with an appointment asks what to bring, how long the visit takes, or clinic hours.',
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
      { kind: 'thought', text: "These are the simplest possible questions — what to bring, how long, what time you close — and they're all being transferred. Let me check whether any visit-info content exists." },
      { kind: 'thought', label: 'Searched procedures', text: 'There\'s booking logic, but no visit information at all — no document list, no visit lengths, no hours. Myna even fails on "what time do you close today," the most basic fact about the business.' },
      { kind: 'thought', text: "Everything asked here is fixed and non-private. One small content block closes the whole group. I need the real values from the user — hours and visit lengths aren't things I should guess." },
      { kind: 'text', text: "Here's what's happening: 21 conversations in the last 7 days asked basic visit questions — what to bring, how long it takes, when the clinic closes — and every one was routed to staff." },
      { kind: 'section', heading: 'Issue', text: "Customers with an appointment call to ask basic questions — what to bring, how long the visit takes, what time the clinic closes. Myna doesn't have any of this, so it transfers or gives a vague answer, for information that never changes." },
      { kind: 'section', heading: 'Impact: High', text: '21 conversations in the last 7 days asked about documents, visit length, or clinic hours — all routed to staff. Each took about 2 minutes of front-desk time to answer.', showConversationsLink: true },
      { kind: 'section', heading: 'Recommendation', text: 'Add visit information to the agent. To get started, please share:' },
      { kind: 'list', items: [
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
          label: 'Testing agent response',
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
      approvalPrompt: "Would you like to proceed with adding this procedure to the agent's workflow? Please approve to continue, or reject to discard these changes.",
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
    summary: '26 refill conversations were routed to staff in the last 7 days.',
    priority: 'Medium',
    timeAgo: '4h ago',
    conversationCount: 26,
    isNew: true,
    whenToUse: 'When a caller asks for a prescription refill, such as a daily inhaler or asthma medicine.',
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
          'Safety rule: if a child is out of a rescue inhaler and struggling to breathe right now, send the caller to 911 or the on-call line instead of taking a refill.',
        ],
      },
    ],
    tools: [{ label: 'Trigger Escalation', icon: 'priority_high' }],
    thoughts: 'Refills are one of the biggest transfer groups. Let me check whether any refill handling exists today.',
    rationale: "Customers call for refills — often an inhaler or a daily asthma medicine. Myna has no refill step, so every one of these calls goes to a person, even though it's mostly just collecting a few details.",
    introBlocks: [
      { kind: 'thought', text: 'Refills are one of the biggest transfer groups. Let me check whether any refill handling exists today.' },
      { kind: 'thought', label: 'Searched procedures', text: 'No refill procedure exists. Refill calls fall into the out-of-scope path and transfer every time — then staff write down the patient, the medicine, and the pharmacy by hand.' },
      { kind: 'thought', text: "The task is almost entirely detail collection — confirm the patient, capture the medicine, the pharmacy, and any note, and hand it to the clinician to approve. The only part that needs a human is the approval, which happens after the call anyway. One thing I won't skip: refills touch medicine, so there's a safety edge — a child out of a rescue inhaler and struggling right now is an emergency, not a refill. I'll propose the capture steps and ask for the two operational details I can't decide myself." },
      { kind: 'text', text: "Here's what's happening: 26 refill requests came in over the last 7 days, and every one was routed to staff even though it's mostly just collecting a few details." },
      { kind: 'section', heading: 'Issue', text: "Customers call for refills — often an inhaler or a daily asthma medicine. Myna has no refill step, so every one of these calls goes to a person, even though it's mostly just collecting a few details." },
      { kind: 'section', heading: 'Impact: Medium', text: '26 refill conversations in the last 7 days were routed to staff. Each took about 4 minutes — mostly writing down the same details Myna could have captured in the call.', showConversationsLink: true },
      { kind: 'section', heading: 'Recommendation', text: 'Add a refill request step to the agent. Myna will confirm the patient, capture the medicine, the pharmacy, and any special note (like a travel supply), then log a task for the clinical team. To set it up, please confirm:' },
      { kind: 'list', items: [
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
          label: 'Testing agent response',
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
      approvalPrompt: "Would you like to proceed with adding this procedure to the agent's workflow? Please approve to continue, or reject to discard these changes.",
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
    summary: '14 conversations asked about a same-day sick visit — all routed to staff.',
    priority: 'Medium',
    timeAgo: '5h ago',
    conversationCount: 14,
    isNew: true,
    whenToUse: 'When a caller asks if their child can be seen today for a sudden illness.',
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
          'If no emergency, confirm same-day sick visits are available and any cutoff time (e.g. call before 11am).',
          'Check for an opening and offer to book it.',
          'If the child has an existing appointment and is sick beforehand, keep the appointment unless the clinic calls to reschedule.',
        ],
      },
    ],
    tools: [{ label: 'Check Business Hours', icon: 'schedule' }],
    thoughts: 'These calls sound urgent, but the actual question is a scheduling one — do you take same-day sick visits, and how do I get one. Let me check if any same-day policy exists.',
    rationale: 'Customers call the morning of, or when a child is suddenly sick, asking if they can come in today or if the clinic takes same-day sick visits. Myna has no procedure for this, so it transfers — and these calls spike in cold and flu season, exactly when the front desk is busiest.',
    introBlocks: [
      { kind: 'thought', text: 'These calls sound urgent, but the actual question is a scheduling one — do you take same-day sick visits, and how do I get one. Let me check if any same-day policy exists.' },
      { kind: 'thought', label: 'Searched procedures', text: 'The booking procedure handles regular scheduling, but there\'s no same-day or sick-visit policy anywhere. Every "can we come in today?" call transfers.' },
      { kind: 'thought', text: 'Two things to keep separate here. The answerable part is policy — whether same-day exists and how to request it — and I need that from the user. The part Myna must never do is judge symptoms. "He has a fever" can go to a same-day booking, but for a lung clinic, "he\'s struggling to breathe" or "his lips look blue" is an emergency, and Myna should send that to 911 or the on-call line, not book it. I\'ll build that rule in as fixed, and ask only for the policy.' },
      { kind: 'text', text: "Here's what's happening: 14 conversations in the last 7 days asked about a same-day sick visit, and all of them were routed to staff." },
      { kind: 'section', heading: 'Issue', text: 'Customers call the morning of, or when a child is suddenly sick, asking if they can come in today or if the clinic takes same-day sick visits. Myna has no procedure for this, so it transfers — and these calls spike in cold and flu season, exactly when the front desk is busiest.' },
      { kind: 'section', heading: 'Impact', text: "14 conversations in the last 7 days asked about a same-day sick visit — all routed to staff. Most came in before 10am, the front desk's busiest window.", showConversationsLink: true },
      { kind: 'section', heading: 'Recommendation', text: 'Add the same-day visit policy to the agent. To get started, please share:' },
      { kind: 'list', items: [
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
          label: 'Testing agent response',
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
      approvalPrompt: "Would you like to proceed with adding this procedure to the agent's workflow? Please approve to continue, or reject to discard these changes.",
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
    summary: '11 conversations asked about test results — all routed to staff or ended in a refusal.',
    priority: 'Medium',
    timeAgo: '6h ago',
    conversationCount: 11,
    isNew: true,
    whenToUse: 'When a caller asks whether test results have come back, or how to check them.',
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
          'If it has been longer than the usual timeline, offer to leave a note for the team to follow up.',
          "Point callers who can't log in to the portal to the front desk for help.",
        ],
      },
    ],
    tools: [{ label: 'Trigger Escalation', icon: 'priority_high' }],
    thoughts: "This one's delicate. Myna correctly refuses to read out results — that rule must stay. But callers usually aren't asking for the values; they're asking a status question: are they back, and when will someone tell me? Let me check what exists today.",
    rationale: "Customers call about test results — did they come back, why haven't I heard, how do I see them. Myna is right not to read results out loud, but today it can't even say whether results are in or how they'll arrive.",
    introBlocks: [
      { kind: 'thought', text: "This one's delicate. Myna correctly refuses to read out results — that rule must stay. But callers usually aren't asking for the values; they're asking a status question: are they back, and when will someone tell me? Let me check what exists today." },
      { kind: 'thought', label: 'Searched procedures', text: "The guardrails block sharing medical results — correct — but there's nothing telling Myna what it can say: no timeline, no portal info, no follow-up option. So every results call ends in a refusal or a transfer." },
      { kind: 'thought', text: "There's a safe middle path: how results arrive, the usual timeline, portal help, and a follow-up note if it's overdue. None of that touches a result value. I need the portal link and the timeline from the user — those aren't things to guess — and I'll spell out the boundary so it's clearly safe." },
      { kind: 'text', text: "Here's what's happening: 11 conversations in the last 7 days asked about test results, and each one ended in a transfer or a flat refusal." },
      { kind: 'section', heading: 'Issue', text: "Customers call about test results — did they come back, why haven't I heard, how do I see them. Myna is right not to read results out loud, but today it can't even say whether results are in or how they'll arrive. So a worried parent gets a transfer or a flat refusal." },
      { kind: 'section', heading: 'Impact', text: '11 conversations in the last 7 days asked about test results — every one was routed to staff or ended in a refusal. These calls had the lowest caller ratings of any group.', showConversationsLink: true },
      { kind: 'section', heading: 'Recommendation', text: 'Add results-status information to the agent — status and process only, never the actual results. To get started, please share:' },
      { kind: 'list', items: [
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
          label: 'Testing agent response',
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
      approvalPrompt: "Would you like to proceed with adding this procedure to the agent's workflow? Please approve to continue, or reject to discard these changes.",
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
    summary: 'Same-day reschedule and waitlist paths are missing from the current procedure.',
    priority: 'Low',
    timeAgo: '5h ago',
    conversationCount: 8,
    isNew: false,
    whenToUse: 'When a customer requests to reschedule an existing appointment, including same-day changes and waitlist additions.',
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
          'For same-day requests: check technician availability in real time — do not assume same-day is unavailable.',
          'If no slots are open, offer to add the customer to the waitlist and explain how waitlist notifications work.',
        ],
      },
      {
        title: 'Confirm the reschedule',
        bullets: [
          'Book the new slot using Schedule Appointment and cancel the old one in the same step.',
          'Send an updated confirmation to the customer via Send Confirmation immediately.',
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
    outcomes: [
      'Updated the Appointment rescheduling procedure to support same-day changes and a waitlist fallback.',
      'Once accepted, the updated procedure will replace the existing version in this workflow and your procedure library.',
    ],
    manualUpdates: [
      { icon: 'checklist', title: 'Confirm waitlist notification channel', description: 'Choose whether waitlisted customers are notified by text, email, or both.' },
      { icon: 'schedule', title: 'Set same-day cutoff time', description: 'Define the latest time a same-day reschedule request can be accepted.' },
    ],
    tools: [
      { label: 'Schedule Appointment', icon: 'calendar_today' },
      { label: 'Send Confirmation', icon: 'send' },
    ],
    thoughts: "I clustered 8 recent conversations where customers asked to reschedule the same day and the agent said it wasn't possible. Let me review the current rescheduling procedure for gaps.",
    rationale: "8 conversations were flagged because customers requesting same-day reschedules were told it wasn't possible, causing escalations.",
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
    diff: {
      location: 'Step 2 — Check availability',
      before: 'Search for available slots on the requested date.',
      after: 'Search for available slots. For same-day, check technician availability in real time. If no slots, offer to add the customer to the waitlist.',
    },
  },
  {
    id: 'r3',
    gapType: 'procedure',
    title: 'Update emergency escalation procedure',
    procedureTitle: 'Emergency escalation procedure',
    summary: 'Safety-critical calls are taking 3+ minutes to reach a human agent.',
    priority: 'Low',
    timeAgo: '3h ago',
    conversationCount: 5,
    isNew: false,
    whenToUse: 'When a customer reports a safety concern, breakdown, or any urgent issue requiring immediate human attention.',
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
          'Connect directly to the on-call service advisor using Voice Call.',
          'If the on-call advisor is unavailable, escalate to the service manager immediately via Trigger Escalation — never leave the customer on hold while retrying the same person.',
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
    outcomes: [
      'Updated the Emergency escalation procedure to detect urgency signals and cut the transfer target from 2 minutes to 30 seconds.',
      'Once accepted, the updated procedure will replace the existing version in this workflow and your procedure library.',
    ],
    manualUpdates: [
      { icon: 'call', title: 'Confirm on-call advisor routing', description: 'Verify the phone number or queue that urgent transfers should ring first.' },
      { icon: 'priority_high', title: 'Review urgency keyword list', description: 'Add or remove trigger phrases specific to your dealership.' },
    ],
    tools: [
      { label: 'Voice Call', icon: 'call' },
      { label: 'Trigger Escalation', icon: 'priority_high' },
    ],
    thoughts: 'I flagged 5 recent conversations involving safety concerns where the transfer to a human took too long. Let me review the current escalation procedure for delays.',
    rationale: '5 safety-concern conversations were handled through standard intake, causing 3+ minute delays before a human responded.',
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
    diff: {
      location: 'Transfer time target',
      before: 'Escalate to a live agent within 2 minutes.',
      after: 'Detect urgency signals at the start. Transfer within 30 seconds. Skip standard intake when urgency keywords are present.',
    },
  },
  {
    id: 'r4',
    gapType: 'knowledge',
    title: 'Update business hours',
    procedureTitle: 'Business hours',
    summary: 'Agent is saying "I don\'t have that information" for 19 business hours questions.',
    priority: 'Low',
    timeAgo: '1h ago',
    conversationCount: 19,
    isNew: false,
    whenToUse: 'When a customer asks about operating hours, weekend availability, or holiday schedules.',
    steps: [
      {
        title: 'Provide accurate hours',
        bullets: [
          'Retrieve current hours, weekend hours, and upcoming holiday closures from the knowledge base.',
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
    outcomes: [
      'Updated the Business hours procedure to include weekend hours, holiday closures, and same-day lookups.',
      'Once accepted, the updated procedure will replace the existing version in this workflow and your procedure library.',
    ],
    manualUpdates: [
      {
        icon: 'calendar_today',
        title: 'Upload holiday closure calendar',
        description: 'Provide the list of upcoming holiday closures so the agent can reference them.',
        relatedType: 'knowledge',
      },
      { icon: 'schedule', title: 'Confirm weekend hours', description: 'Verify Saturday and Sunday hours are current for every location.' },
    ],
    tools: [
      { label: 'Check Business Hours', icon: 'schedule' },
    ],
    thoughts: 'I clustered 19 recent conversations where customers asked about business hours and the agent had no answer. Let me check the knowledge base for what\'s missing.',
    rationale: '19 conversations ended with the agent unable to answer — the business hours record is missing or outdated.',
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
    summary: 'Service advisors are manually re-entering vehicle data after every call.',
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
    summary: '9 after-hours callers got no information on when they\'d hear back.',
    priority: 'Low',
    timeAgo: '30m ago',
    conversationCount: 9,
    isNew: true,
    whenToUse: 'When a customer calls outside business hours and reaches the after-hours voice flow.',
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
          'Automatically create a callback task assigned to the front desk queue via Trigger Escalation, flagged as after-hours priority.',
          'Send a text confirmation via Send Confirmation summarizing what was logged and when to expect a callback.',
        ],
      },
    ],
    tools: [
      { label: 'Trigger Escalation', icon: 'priority_high' },
      { label: 'Send Confirmation', icon: 'send' },
    ],
    thoughts: 'I clustered 9 recent after-hours conversations where customers got no information on callback timing. Let me review the knowledge base, call script, and follow-up actions for gaps.',
    rationale: "9 after-hours calls ended with the agent unable to say when the customer would hear back, and no callback task was created for the team the next morning. This spans three separate gaps in the same call flow — knowledge, procedure, and action — so we've generated one combined recommendation:",
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
    manualUpdates: [
      {
        icon: 'upload_file',
        title: 'Upload callback policy',
        description: "The agent has no callback policy on file, so we can't confirm the promised callback window is accurate — upload the document so we can add it to its knowledge.",
        relatedType: 'knowledge',
      },
    ],
    changes: [
      {
        type: 'knowledge',
        description: "The agent doesn't have the after-hours callback policy, so it can't tell customers when to expect a response — it just takes a message and hopes for the best.",
        proposedSteps: [
          {
            title: 'Share callback policy',
            bullets: [
              'State that after-hours messages are returned within 2 business hours',
              'Mention the after-hours emergency line for urgent issues',
            ],
          },
        ],
      },
      {
        type: 'procedure',
        description: 'The after-hours script skips setting expectations and ends the call without confirming the best way to reach the customer back.',
        currentSteps: [
          {
            title: 'Take a message',
            bullets: [
              "Ask for the customer's name and reason for calling.",
              'End the call.',
            ],
          },
        ],
        proposedSteps: [
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
              'Automatically create a callback task assigned to the front desk queue via Trigger Escalation, flagged as after-hours priority.',
              'Send a text confirmation via Send Confirmation summarizing what was logged and when to expect a callback.',
            ],
          },
        ],
      },
      {
        type: 'action',
        description: "Even when a message is taken correctly, no task is created for the team — so after-hours messages can sit unseen until a customer calls again.",
        proposedSteps: [
          {
            title: 'Log callback task',
            bullets: [
              'Automatically create a callback task assigned to the front desk queue',
              'Flag the task as after-hours priority so it surfaces first the next morning',
            ],
          },
        ],
      },
    ],
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

export type RecStatus = 'open' | 'accepted' | 'rejected'

const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 }

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

/** For now this always frames a feedback recommendation as raised by several people — a
 *  placeholder for a real "similar reports" count, tuned so a fresh single-conversation report
 *  reads as "4 other similar issues raised by 9 users". */
export function similarIssuesSummary(count: number): string {
  return `${count + 3} other similar issues raised by ${count + 8} users`
}
