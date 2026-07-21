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
    title: 'Add a payment processing procedure',
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
    id: 'r2',
    gapType: 'procedure',
    title: 'Update appointment rescheduling procedure',
    procedureTitle: 'Appointment rescheduling procedure',
    summary: 'Same-day reschedule and waitlist paths are missing from the current procedure.',
    priority: 'High',
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
    priority: 'High',
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
    priority: 'High',
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
    priority: 'Medium',
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
    priority: 'High',
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

/** Turns raw feedback text into an actionable recommendation title (e.g. "Update business
 *  hours") instead of just echoing back what was typed — no LLM summarization available, so
 *  this recognizes known topics first, then falls back to stripping common request framing
 *  ("we need...", "...is needed") and leading with an action verb. */
export function titleFromFeedback(text: string, gapType: GapType): string {
  const normalized = text.trim().toLowerCase()
  const verb = gapType === 'action' ? 'Add' : 'Update'
  const knownTopic = extractKnownTopic(normalized)
  if (knownTopic) return `${verb} ${knownTopic}`

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
