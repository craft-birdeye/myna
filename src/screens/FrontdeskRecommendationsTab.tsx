import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Chip, Icon } from '../components'
import PreviewPanel from '../workflow/Molecules/PreviewPanel/PreviewPanel'
import '../workflow/Molecules/PreviewPanel/PreviewPanel.css'

// ── Types ─────────────────────────────────────────────────────────────────────

type GapType = 'procedure' | 'knowledge' | 'action'
type Priority = 'High' | 'Medium' | 'Low'

interface ProcedureStep {
  title: string
  bullets: string[]
}

interface ManualUpdate {
  icon: string
  title: string
  description: string
}

interface DiffChange {
  location: string
  before: string
  after: string
}

type Channel = 'Voice' | 'Chat' | 'Text'

interface ConversationItem {
  name: string
  message: string
  channel: Channel
  date: string
  location: string
}

interface Recommendation {
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
  changeType: string
  diff?: DiffChange
  conversations: ConversationItem[]
  sim?: { before: Turn[]; after: Turn[] }
  outcomes?: string[]
  manualUpdates?: ManualUpdate[]
}

// ── Data ─────────────────────────────────────────────────────────────────────

const RECOMMENDATIONS: Recommendation[] = [
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
        title: 'Identify payment type',
        bullets: [
          'Ask what the payment is for (service invoice, parts order, outstanding balance)',
          'Look up the customer account by name or phone number',
          'Confirm the amount due',
        ],
      },
      {
        title: 'Process payment',
        bullets: [
          'Phone — collect card details securely and process through the DMS',
          'Online — direct the customer to the payment portal link',
          'In person — confirm location and business hours',
        ],
      },
      {
        title: 'Confirm and follow up',
        bullets: [
          'Send payment confirmation via email or text',
          'Update the customer record in the DMS',
          'If payment fails, offer alternatives or escalate to billing',
        ],
      },
    ],
    tools: [
      { label: 'DMS Integration', icon: 'storage' },
      { label: 'Send Confirmation', icon: 'send' },
    ],
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
        title: 'Look up existing appointment',
        bullets: [
          "Retrieve the appointment using the customer's name, phone, or confirmation number",
          'Confirm details with the customer',
        ],
      },
      {
        title: 'Check availability',
        bullets: [
          'Search for open slots on the requested date',
          'For same-day: check technician availability in real time',
          'If no slots — offer to add to the waitlist',
        ],
      },
      {
        title: 'Confirm reschedule',
        bullets: [
          'Book the new slot and cancel the old one',
          'Send updated confirmation to the customer',
          'Notify the service advisor if technician assignment changes',
        ],
      },
    ],
    originalSteps: [
      {
        title: 'Look up existing appointment',
        bullets: [
          "Retrieve the appointment using the customer's name, phone, or confirmation number",
          'Confirm details with the customer',
        ],
      },
      {
        title: 'Check availability',
        bullets: ['Search for open slots on the requested date'],
      },
      {
        title: 'Confirm reschedule',
        bullets: [
          'Book the new slot and cancel the old one',
          'Send updated confirmation to the customer',
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
        title: 'Detect urgency',
        bullets: [
          'Listen for keywords: "not safe", "smoke", "brakes failed", "accident", "urgent"',
          'If detected, skip standard intake questions immediately',
        ],
      },
      {
        title: 'Transfer within 30 seconds',
        bullets: [
          'Connect directly to the on-call service advisor.',
          'If unavailable, escalate to the service manager',
          "Relay the customer's name, callback number, and concern before transferring",
        ],
      },
    ],
    originalSteps: [
      {
        title: 'Transfer to a live agent',
        bullets: [
          'Escalate to a live agent within 2 minutes.',
          'If unavailable, escalate to the service manager',
          "Relay the customer's name, callback number, and concern before transferring",
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
      { icon: 'calendar_today', title: 'Upload holiday closure calendar', description: 'Provide the list of upcoming holiday closures so the agent can reference them.' },
      { icon: 'schedule', title: 'Confirm weekend hours', description: 'Verify Saturday and Sunday hours are current for every location.' },
    ],
    tools: [
      { label: 'Check Business Hours', icon: 'schedule' },
    ],
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
]

// ── Token maps ────────────────────────────────────────────────────────────────

const PRIORITY_VARIANT: Record<Priority, 'danger' | 'warning' | 'neutral'> = {
  High: 'danger',
  Medium: 'warning',
  Low: 'neutral',
}

type RecStatus = 'open' | 'accepted' | 'rejected'

const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 }

function sortRecommendations(recs: Recommendation[]): Recommendation[] {
  return [...recs].sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return b.conversationCount - a.conversationCount
  })
}

function getRecStatus(id: string, rejected: Set<string>, accepted: Set<string>): RecStatus {
  if (rejected.has(id)) return 'rejected'
  if (accepted.has(id)) return 'accepted'
  return 'open'
}

// ── Left card ─────────────────────────────────────────────────────────────────

function RecCard({
  rec,
  selected,
  recStatus,
  onClick,
}: {
  rec: Recommendation
  selected: boolean
  recStatus: RecStatus
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md border border-border-selected p-lg text-left transition-colors ${
        selected ? 'bg-surface-hover' : 'bg-surface hover:bg-surface-hover'
      }`}
    >
      <div className="mb-sm flex items-center justify-between gap-sm">
        <p className="min-w-0 flex-1 truncate text-body text-text-primary">{rec.title}</p>
        <div className="flex shrink-0 items-center gap-xs">
          {recStatus === 'open' && <Chip label={rec.priority} variant={PRIORITY_VARIANT[rec.priority]} />}
          {recStatus === 'accepted' && <Chip label="Accepted" variant="success" />}
          {recStatus === 'rejected' && <Chip label="Rejected" variant="danger" />}
        </div>
      </div>

      <p className="line-clamp-2 text-small text-text-secondary">{rec.summary}</p>

      <div className="mt-sm flex items-center gap-xs text-small text-text-tertiary">
        <Icon name="chat_bubble_outline" size={12} />
        {rec.conversationCount} affected
      </div>
    </button>
  )
}

// ── Gap legend bar ─────────────────────────────────────────────────────────────

// ── Conversations drawer ──────────────────────────────────────────────────────

function channelIcon(ch: Channel) {
  return ch === 'Voice' ? 'call' : ch === 'Chat' ? 'chat_bubble_outline' : 'sms'
}

// Multi-turn conversation threads keyed by the customer's opening message.
// Each turn: role 'user' | 'agent', text, time.
// Designed to show exactly why the gap was triggered — agent hits a wall.

type Turn = { role: 'user' | 'agent'; text: string; time: string }

const CONV_THREADS: Record<string, Turn[]> = {
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
}

// ── Typing dots ───────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-[5px]">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="size-[7px] rounded-full bg-[#6b9fd4]"
          style={{ animation: 'sim-bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}

// ── Conversation thread view ───────────────────────────────────────────────────

type DivPhase = 'hidden' | 'original' | 'typing' | 'improved'

function ConversationThread({ conv, sim, onBack }: { conv: ConversationItem; sim?: { before: Turn[]; after: Turn[] }; onBack: () => void }) {
  const [simActive, setSimActive] = useState(false)
  const [visibleCount, setVisibleCount] = useState(9999)
  const [divPhase, setDivPhase] = useState<DivPhase>('hidden')
  const afterCardRef = React.useRef<HTMLDivElement>(null)

  const allTurns = CONV_THREADS[conv.message] ?? [
    { role: 'user' as const,  text: conv.message, time: '10:12 AM' },
    { role: 'agent' as const, text: 'Thank you for reaching out. Let me look into that for you.', time: '10:12 AM' },
  ]

  const improvedAgentTexts = (sim?.after ?? []).filter(t => t.role === 'agent').map(t => t.text)

  // Find first agent turn where improved text differs
  let aIdx = 0
  let divergeTurnIdx = -1
  let divergeAgentIdx = -1
  for (let i = 0; i < allTurns.length; i++) {
    if (allTurns[i].role === 'agent') {
      if (improvedAgentTexts[aIdx] && improvedAgentTexts[aIdx] !== allTurns[i].text) {
        divergeTurnIdx = i
        divergeAgentIdx = aIdx
        break
      }
      aIdx++
    }
  }

  const displayTurns = simActive && divergeTurnIdx >= 0
    ? allTurns.slice(0, divergeTurnIdx + 1)
    : allTurns

  const startTime    = allTurns[0]?.time ?? '10:12 AM'
  const endTime      = allTurns[allTurns.length - 1]?.time ?? '10:15 AM'
  const channelLabel = conv.channel === 'Voice' ? 'Voice call' : conv.channel === 'Chat' ? 'Chatbot AI' : 'Text message'
  const improvedText = divergeAgentIdx >= 0 ? (improvedAgentTexts[divergeAgentIdx] ?? '') : ''

  // Animation sequence on simulate toggle
  React.useEffect(() => {
    if (!simActive || divergeTurnIdx < 0) {
      setVisibleCount(9999)
      setDivPhase('hidden')
      return
    }

    setVisibleCount(0)
    setDivPhase('hidden')

    const preTurns = divergeTurnIdx // number of turns before the divergence
    let count = 0
    let t1: ReturnType<typeof setTimeout>
    let t2: ReturnType<typeof setTimeout>
    let t3: ReturnType<typeof setTimeout>

    const schedulePhases = () => {
      // Step 2: show original bubble (no tags, normal look)
      t1 = setTimeout(() => {
        setDivPhase('original')
        // Step 3: replace with typing indicator
        t2 = setTimeout(() => {
          setDivPhase('typing')
          // Step 4: push original down, slide in improved
          t3 = setTimeout(() => {
            setDivPhase('improved')
          }, 1600)
        }, 1000)
      }, 400)
    }

    if (preTurns === 0) {
      schedulePhases()
    } else {
      // Reveal pre-divergence turns one by one first
      const reveal = () => {
        count++
        setVisibleCount(count)
        if (count < preTurns) {
          setTimeout(reveal, 500)
        } else {
          schedulePhases()
        }
      }
      setTimeout(reveal, 300)
    }

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [simActive, divergeTurnIdx])

  React.useEffect(() => {
    if (divPhase === 'improved') {
      afterCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [divPhase])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <style>{`
        @keyframes sim-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes sim-slide-in {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sim-slide-in { animation: sim-slide-in 0.4s ease-out forwards; }
        @keyframes sim-msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sim-msg-in { animation: sim-msg-in 0.3s ease-out forwards; }
        @keyframes sim-glow-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(176, 144, 224, 0.45); }
          70%  { box-shadow: 0 0 0 14px rgba(176, 144, 224, 0); }
          100% { box-shadow: 0 0 0 0 rgba(176, 144, 224, 0); }
        }
        .sim-glow-pulse { animation: sim-glow-pulse 1s ease-out; }
        @keyframes sim-sparkle-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.3); opacity: 0.7; }
        }
        .sim-sparkle-pulse { animation: sim-sparkle-pulse 1.1s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="flex shrink-0 items-center border-b border-border px-lg" style={{ minHeight: 56 }}>
        <button
          type="button"
          onClick={onBack}
          className="mr-sm flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          aria-label="Back"
        >
          <Icon name="arrow_back" size={18} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-sm">
          <span className="truncate text-[15px] text-text-primary">{conv.name}</span>
          <Icon name={channelIcon(conv.channel)} size={15} className="shrink-0 text-text-tertiary" />
        </div>
      </div>

      {/* Thread body */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-white px-[28px] py-lg">

        {/* Info banner */}
        <div className="mb-[20px] flex items-center gap-sm rounded-sm border border-[#bfdbfe] bg-[#eff6ff] px-md py-sm">
          <Icon name="info" size={14} className="shrink-0 text-[#2563eb]" />
          <p className="min-w-0 flex-1 text-[12px] leading-[18px] text-text-secondary">
            {simActive
              ? 'Simulating how this conversation would go with the new procedure'
              : 'The agent could not fully resolve this request. This conversation contributed to the recommendation.'}
          </p>
          <button
            type="button"
            onClick={() => setSimActive(v => !v)}
            className="flex w-fit shrink-0 items-center gap-[4px] text-[12px] text-text-action"
          >
            {simActive ? 'Hide simulation' : 'Simulate with the new procedure'}
          </button>
        </div>

        <p className="mb-[20px] text-center text-[13px] text-text-tertiary">{conv.date}</p>
        <p className="mb-[20px] text-center text-[13px] text-text-tertiary">
          {channelLabel} conversation started · {startTime}
        </p>

        {displayTurns.map((turn, i) => {
          const isDivergence = simActive && i === divergeTurnIdx

          // Pre-divergence fade-in during reveal phase
          const preVisible = !simActive || i < visibleCount
          const fadeClass = simActive && !isDivergence
            ? preVisible
              ? 'opacity-100 translate-y-0 transition-all duration-300'
              : 'opacity-0 translate-y-2 pointer-events-none'
            : ''

          if (turn.role === 'user') {
            return (
              <div key={i} className={`mb-[16px] flex max-w-[72%] flex-col gap-[6px] self-start ${fadeClass}`}>
                <div className="rounded-[18px] rounded-tl-[4px] bg-[#f1f3f4] px-[16px] py-[10px]">
                  <p className="text-[15px] leading-[22px] text-[#1a1a1a]">{turn.text}</p>
                </div>
                <div className="flex items-center gap-[6px]">
                  <span className="text-[12px] text-[#9aa0a6]">{turn.time}</span>
                  <Icon name="link" size={12} className="text-[#9aa0a6]" />
                </div>
              </div>
            )
          }

          // ── Divergence agent turn ──────────────────────────────────────────
          if (isDivergence) {
            const beforeSettled = divPhase === 'improved'
            return (
              <div key={i} className="mb-[16px] flex max-w-[78%] flex-col items-end gap-[10px] self-end">

                {/* Before — original response, settles back once the new one lands */}
                {(divPhase === 'original' || divPhase === 'typing' || divPhase === 'improved') && (
                  <div
                    className="sim-msg-in flex flex-col items-end gap-[6px] transition-opacity duration-500 ease-out"
                    style={{ opacity: beforeSettled ? 0.5 : 1 }}
                  >
                    <span className="text-[11px] text-text-tertiary">Previous reply</span>
                    <div className="rounded-[18px] rounded-tr-[4px] bg-[#e8f0fe] px-[16px] py-[10px]">
                      <p className="text-[15px] leading-[22px] text-[#1a1a1a]">{turn.text}</p>
                    </div>
                    <span className="text-[11px] text-[#9aa0a6]">{turn.time}</span>
                  </div>
                )}

                {/* Typing */}
                {divPhase === 'typing' && (
                  <div className="sim-msg-in rounded-[18px] rounded-tr-[4px] bg-[#e8f0fe] px-[16px] py-[12px]">
                    <TypingDots />
                  </div>
                )}

                {/* Connector + After */}
                {divPhase === 'improved' && (
                  <>
                    <div className="sim-msg-in flex shrink-0 items-center gap-[6px] rounded-full bg-[#f9f7fd] px-[12px] py-[5px]">
                      <Icon name="auto_awesome" size={12} className="sim-sparkle-pulse text-ai-brand" />
                      <span className="text-[11px] text-ai-brand">Recommendation applied</span>
                    </div>
                    <div ref={afterCardRef} className="sim-msg-in flex flex-col items-end gap-[6px]">
                      <div className="sim-glow-pulse rounded-[18px]">
                        <div className="rounded-[18px] rounded-tr-[4px] bg-[#e8f0fe] px-[16px] py-[10px]">
                          <p className="text-[15px] leading-[22px] text-[#1a1a1a]">{improvedText}</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#9aa0a6]">{turn.time}</span>
                    </div>
                  </>
                )}
              </div>
            )
          }

          // Normal agent turn
          return (
            <div key={i} className={`mb-[16px] flex max-w-[72%] flex-col items-end gap-[6px] self-end ${fadeClass}`}>
              <div className="rounded-[18px] rounded-tr-[4px] bg-[#e8f0fe] px-[16px] py-[10px]">
                <p className="text-[15px] leading-[22px] text-[#1a1a1a]">{turn.text}</p>
              </div>
              <span className="text-[12px] text-[#9aa0a6]">{turn.time}</span>
            </div>
          )
        })}

        {/* End label */}
        {(!simActive || divPhase === 'improved') && (
          <p className="mb-[20px] mt-[8px] text-center text-[13px] text-text-tertiary">
            {simActive
              ? 'With the new procedure, the conversation continues smoothly.'
              : `${conv.name} is inactive on ${channelLabel.toLowerCase()} · ${endTime}`}
          </p>
        )}

      </div>
    </div>
  )
}

// ── Conversations list + drawer shell ─────────────────────────────────────────

function ConversationsDrawer({ rec, open, onClose }: { rec: Recommendation; open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<ConversationItem | null>(null)

  if (!open) return null

  const handleClose = () => { setSelected(null); onClose() }

  return createPortal(
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[200] bg-black/30" onClick={handleClose} aria-hidden />

      {/* Drawer */}
      <div className="fixed bottom-0 right-0 top-0 z-[210] flex w-[650px] flex-col bg-surface shadow-modal">

        {selected ? (
          <ConversationThread conv={selected} sim={rec.sim} onBack={() => setSelected(null)} />
        ) : (
          <>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between py-lg pl-[28px] pr-xl">
              <span className="text-h3 text-text-primary">Conversations</span>
              <button
                type="button"
                onClick={handleClose}
                className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* List — inbox style, no borders */}
            <div className="flex flex-1 flex-col overflow-y-auto">
              {rec.conversations.map((c, i) => {
                const agentName = c.channel === 'Voice' ? 'Robin K.' : c.channel === 'Chat' ? 'Savannah A.' : 'Mia L.'
                const isUnread = i < 2
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelected(c)}
                    className="flex w-full items-start gap-sm py-[14px] pl-[28px] pr-xl text-left hover:bg-surface-hover"
                  >
                      {/* Unread dot */}
                      <div className="mt-[6px] flex w-[10px] shrink-0 items-center justify-center">
                        {isUnread && <span className="size-[8px] rounded-full bg-primary" />}
                      </div>

                      {/* Content */}
                      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                        {/* Row 1: name + date */}
                        <div className="flex items-baseline justify-between gap-sm">
                          <span className="truncate text-[15px] leading-[20px] text-[#3c3c3c]">
                            {c.name}
                          </span>
                          <span className="shrink-0 text-[13px] text-[#9aa0a6]">{c.date}</span>
                        </div>
                        {/* Row 2: agent: message */}
                        <span className="truncate text-[13px] leading-[18px] text-[#5f6368]">
                          {agentName}: {c.message}
                        </span>
                        {/* Row 3: location */}
                        <div className="flex items-center gap-[4px] text-[12px] text-[#9aa0a6]">
                          <span>{c.location}</span>
                        </div>
                      </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>,
    document.body
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

type ToastData = { message: string; onUndo?: () => void; variant?: 'success' | 'danger' }

function Toast({ data, onDismiss }: { data: ToastData; onDismiss: () => void }) {
  const isDanger = data.variant === 'danger'
  return createPortal(
    <div
      className="fixed left-1/2 top-[24px] z-[500] flex -translate-x-1/2 items-center gap-[12px] rounded-[8px] bg-white px-[16px] py-[12px]"
      style={{ minWidth: 360, maxWidth: 520, boxShadow: '0 4px 16px 0 rgba(0,0,0,0.14), 0 1px 4px 0 rgba(0,0,0,0.08)' }}
    >
      {isDanger ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
          <circle cx="10" cy="10" r="8" stroke="#DE1B0C" strokeWidth="1.5" />
          <path d="M10 5.5v5" stroke="#DE1B0C" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="13.5" r="1" fill="#DE1B0C" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
          <path d="M4 10.5l4.5 4.5 7.5-9" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}

      <span className="flex-1 text-[13px] leading-[20px] text-[#111827]">{data.message}</span>

      {data.onUndo && (
        <button
          type="button"
          onClick={() => { data.onUndo?.(); onDismiss() }}
          className="shrink-0 text-[13px] leading-[20px] text-[#2563EB]"
        >
          Undo
        </button>
      )}

      <button
        type="button"
        onClick={onDismiss}
        className="ml-[4px] flex size-[20px] shrink-0 items-center justify-center text-[#6B7280] hover:text-[#111827]"
      >
        <Icon name="close" size={16} />
      </button>
    </div>,
    document.body
  )
}

// ── Steps toolbar icons (exact Figma paths, thin/light weight) ─────────────────

function ToolbarExpandIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M4.24694 10.2505C4.46354 10.4287 4.63807 10.6525 4.75805 10.906C5.06471 11.5385 5.06471 12.3116 5.06471 13.0616C5.06471 14.6148 5.1286 15.3616 6.59805 15.3616C6.7336 15.3616 6.8636 15.4155 6.95946 15.5113C7.05531 15.6072 7.10916 15.7372 7.10916 15.8727C7.10916 16.0083 7.05531 16.1383 6.95946 16.2342C6.8636 16.33 6.7336 16.3839 6.59805 16.3839C5.48127 16.3839 4.72482 15.9916 4.34916 15.2172C4.04249 14.5847 4.04249 13.8117 4.04249 13.0616C4.04249 11.5085 3.9786 10.7616 2.50916 10.7616C2.3736 10.7616 2.2436 10.7078 2.14775 10.6119C2.0519 10.5161 1.99805 10.3861 1.99805 10.2505C1.99805 10.115 2.0519 9.98496 2.14775 9.88911C2.2436 9.79326 2.3736 9.73941 2.50916 9.73941C3.9786 9.73941 4.04249 8.99255 4.04249 7.43941C4.04249 6.69063 4.04249 5.9163 4.34916 5.2838C4.7261 4.50947 5.48255 4.11719 6.59932 4.11719C6.73488 4.11719 6.86488 4.17104 6.96073 4.26689C7.05659 4.36274 7.11044 4.49274 7.11044 4.6283C7.11044 4.76385 7.05659 4.89386 6.96073 4.98971C6.86488 5.08556 6.73488 5.13941 6.59932 5.13941C5.12988 5.13941 5.06599 5.88627 5.06599 7.43941C5.06599 8.18819 5.06599 8.96252 4.75932 9.59502C4.63898 9.84865 4.464 10.0725 4.24694 10.2505ZM17.8215 9.73941C16.3521 9.73941 16.2882 8.99255 16.2882 7.43941C16.2882 6.69063 16.2882 5.9163 15.9815 5.2838C15.6059 4.50947 14.8494 4.11719 13.7327 4.11719C13.5971 4.11719 13.4671 4.17104 13.3712 4.26689C13.2754 4.36274 13.2215 4.49274 13.2215 4.6283C13.2215 4.76385 13.2754 4.89386 13.3712 4.98971C13.4671 5.08556 13.5971 5.13941 13.7327 5.13941C15.2021 5.13941 15.266 5.88627 15.266 7.43941C15.266 8.18819 15.266 8.96252 15.5727 9.59502C15.6926 9.84852 15.8672 10.0724 16.0838 10.2505C15.8672 10.4287 15.6926 10.6525 15.5727 10.906C15.266 11.5385 15.266 12.3116 15.266 13.0616C15.266 14.6148 15.2021 15.3616 13.7327 15.3616C13.5971 15.3616 13.4671 15.4155 13.3712 15.5113C13.2754 15.6072 13.2215 15.7372 13.2215 15.8727C13.2215 16.0083 13.2754 16.1383 13.3712 16.2342C13.4671 16.33 13.5971 16.3839 13.7327 16.3839C14.8494 16.3839 15.6059 15.9916 15.9815 15.2172C16.2882 14.5847 16.2882 13.8117 16.2882 13.0616C16.2882 11.5085 16.3521 10.7616 17.8215 10.7616C17.9571 10.7616 18.0871 10.7078 18.183 10.6119C18.2788 10.5161 18.3327 10.3861 18.3327 10.2505C18.3327 10.115 18.2788 9.98496 18.183 9.88911C18.0871 9.79326 17.9571 9.73941 17.8215 9.73941Z"
        fill="currentColor"
      />
      <path
        d="M11.4123 9.08609L9.99805 10.5003L8.58383 11.9145M8.58383 9.08609L11.4123 11.9145"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ToolbarBuildIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M7.95182 12.7715C6.63474 12.7715 5.50689 12.3057 4.56828 11.374C3.62953 10.4422 3.16016 9.31773 3.16016 8.00065C3.16016 7.72746 3.1805 7.46475 3.2212 7.21253C3.26175 6.96016 3.33543 6.70683 3.44224 6.45253C3.48182 6.35211 3.54196 6.26773 3.62266 6.1994C3.70349 6.13107 3.79509 6.08301 3.89745 6.05523C3.99967 6.02746 4.10238 6.02954 4.20557 6.06148C4.30891 6.09357 4.40113 6.15023 4.48224 6.23148L6.74349 8.47669L8.49037 6.72982L6.27391 4.50544C6.19127 4.42266 6.13432 4.32884 6.10307 4.22398C6.07168 4.11898 6.06988 4.01676 6.09766 3.91732C6.12543 3.81801 6.17488 3.72294 6.24599 3.63211C6.31696 3.54128 6.40696 3.47607 6.51599 3.43648C6.75641 3.35218 6.99606 3.29315 7.23495 3.2594C7.47398 3.22579 7.71293 3.20898 7.95182 3.20898C9.28293 3.20898 10.4143 3.68176 11.346 4.62732C12.2777 5.57301 12.7435 6.70572 12.7435 8.02544C12.7435 8.37433 12.7069 8.6935 12.6337 8.98294C12.5605 9.27253 12.4577 9.55892 12.3252 9.84211L15.9999 13.5119C16.3493 13.8598 16.5239 14.2734 16.5239 14.7527C16.5239 15.2319 16.3498 15.6377 16.0016 15.97C15.6534 16.3024 15.2445 16.4651 14.7749 16.4582C14.3054 16.4512 13.9028 16.2827 13.5672 15.9525L9.95995 12.3532C9.66606 12.4804 9.34655 12.5819 9.00141 12.6577C8.65613 12.7336 8.30627 12.7715 7.95182 12.7715ZM7.95182 11.6882C8.19155 11.6882 8.52155 11.6409 8.94182 11.5463C9.36196 11.4518 9.75793 11.2614 10.1297 10.975L14.3254 15.1707C14.4545 15.2998 14.6024 15.3658 14.7691 15.3686C14.9358 15.3712 15.0907 15.3044 15.2339 15.1682C15.3771 15.0319 15.4487 14.8804 15.4487 14.7138C15.4487 14.5471 15.3771 14.3922 15.2339 14.249L11.0177 10.0663C11.2793 9.72225 11.4518 9.35232 11.5352 8.95648C11.6185 8.56065 11.6602 8.24898 11.6602 8.02148C11.6602 7.00232 11.2675 6.10169 10.4822 5.31961C9.69696 4.53753 8.72953 4.1951 7.57995 4.29232L9.55287 6.24419C9.68953 6.3835 9.75786 6.546 9.75786 6.73169C9.75786 6.91739 9.68752 7.0801 9.54682 7.21982L7.21432 9.53461C7.07349 9.67433 6.9153 9.74419 6.73974 9.74419C6.56418 9.74419 6.4105 9.67586 6.2787 9.53919L4.24349 7.50378C4.12057 8.73989 4.45231 9.74635 5.2387 10.5232C6.02509 11.2998 6.92946 11.6882 7.95182 11.6882Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ToolbarBookIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M16.5 5.25H12C11.6119 5.25 11.2291 5.34036 10.882 5.51393C10.5348 5.6875 10.2329 5.93951 10 6.25C9.76713 5.93951 9.46517 5.6875 9.11803 5.51393C8.7709 5.34036 8.38811 5.25 8 5.25H3.5C3.36739 5.25 3.24021 5.30268 3.14645 5.39645C3.05268 5.49021 3 5.61739 3 5.75V14.75C3 14.8826 3.05268 15.0098 3.14645 15.1036C3.24021 15.1973 3.36739 15.25 3.5 15.25H8C8.39782 15.25 8.77936 15.408 9.06066 15.6893C9.34196 15.9706 9.5 16.3522 9.5 16.75C9.5 16.8826 9.55268 17.0098 9.64645 17.1036C9.74021 17.1973 9.86739 17.25 10 17.25C10.1326 17.25 10.2598 17.1973 10.3536 17.1036C10.4473 17.0098 10.5 16.8826 10.5 16.75C10.5 16.3522 10.658 15.9706 10.9393 15.6893C11.2206 15.408 11.6022 15.25 12 15.25H16.5C16.6326 15.25 16.7598 15.1973 16.8536 15.1036C16.9473 15.0098 17 14.8826 17 14.75V5.75C17 5.61739 16.9473 5.49021 16.8536 5.39645C16.7598 5.30268 16.6326 5.25 16.5 5.25ZM8 14.25H4V6.25H8C8.39782 6.25 8.77936 6.40804 9.06066 6.68934C9.34196 6.97064 9.5 7.35218 9.5 7.75V14.75C9.06766 14.4247 8.54106 14.2491 8 14.25ZM16 14.25H12C11.4589 14.2491 10.9323 14.4247 10.5 14.75V7.75C10.5 7.35218 10.658 6.97064 10.9393 6.68934C11.2206 6.40804 11.6022 6.25 12 6.25H16V14.25Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ToolbarEditNoteIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M7.49951 13.9997C7.49951 13.7235 7.72386 13.5 8 13.5C8.27599 13.5002 8.49967 13.7236 8.49967 13.9997C8.49967 14.2207 8.58753 14.4326 8.74381 14.5889C8.9001 14.7451 9.11199 14.833 9.33301 14.833H9.99951C10.2755 14.833 10.4998 15.0567 10.5 15.3327C10.5 15.6088 10.2757 15.8332 9.99951 15.8332H9.33301C8.84678 15.8332 8.38044 15.6399 8.03662 15.2961C8.02343 15.2829 8.01193 15.2681 7.99919 15.2546C7.98659 15.2679 7.9756 15.283 7.96256 15.2961C7.61876 15.6398 7.15237 15.8332 6.66618 15.8332H5.99967C5.72353 15.8332 5.5 15.6088 5.5 15.3327C5.50018 15.0567 5.72364 14.833 5.99967 14.833H6.66618C6.88715 14.833 7.0991 14.7451 7.25537 14.5889C7.41165 14.4326 7.49951 14.2207 7.49951 13.9997Z" fill="currentColor" />
      <path d="M16.1673 11.3433V8.67643C16.1672 8.45554 16.0794 8.24344 15.9232 8.08724C15.7669 7.93116 15.5548 7.8431 15.334 7.8431H10.6676C10.3915 7.8431 10.168 7.61957 10.168 7.34342C10.168 7.06728 10.3915 6.84375 10.6676 6.84375H15.334C15.8201 6.84375 16.2866 7.03643 16.6304 7.38005C16.9741 7.72379 17.1674 8.19032 17.1675 8.67643V11.3433C17.1675 11.8295 16.9742 12.2958 16.6304 12.6396C16.2866 12.9834 15.8202 13.1768 15.334 13.1768H10.6676C10.3916 13.1768 10.1681 12.9531 10.168 12.6771C10.168 12.4009 10.3915 12.1766 10.6676 12.1766H15.334C15.555 12.1766 15.7669 12.0887 15.9232 11.9325C16.0795 11.7762 16.1673 11.5643 16.1673 11.3433Z" fill="currentColor" />
      <path d="M2.83398 11.3433V8.67643C2.83407 8.19032 3.02654 7.72379 3.37028 7.38005C3.71402 7.03631 4.18055 6.84384 4.66667 6.84375H5.33398C5.60998 6.84393 5.83366 7.06739 5.83366 7.34342C5.83366 7.61946 5.60998 7.84292 5.33398 7.8431H4.66667C4.44577 7.84319 4.23368 7.93104 4.07747 8.08724C3.92127 8.24344 3.83342 8.45554 3.83333 8.67643V11.3433C3.83333 11.5642 3.92135 11.7762 4.07747 11.9325C4.23368 12.0887 4.44577 12.1765 4.66667 12.1766H5.33398C5.60998 12.1768 5.83366 12.401 5.83366 12.6771C5.83348 12.953 5.60987 13.1766 5.33398 13.1768H4.66667C4.18055 13.1767 3.71402 12.9834 3.37028 12.6396C3.02662 12.2959 2.83398 11.8294 2.83398 11.3433Z" fill="currentColor" />
      <path d="M7.49951 6.00456C7.49943 5.78366 7.41157 5.57157 7.25537 5.41536C7.09911 5.25924 6.88708 5.17122 6.66618 5.17122H5.99967C5.72353 5.17122 5.5 4.94769 5.5 4.67155C5.5 4.39541 5.72353 4.17188 5.99967 4.17188H6.66618C7.15229 4.17188 7.61877 4.36451 7.96256 4.70817C7.9754 4.72101 7.98677 4.73569 7.99919 4.74886C8.01175 4.73552 8.02362 4.72117 8.03662 4.70817C8.38042 4.36446 8.84685 4.17188 9.33301 4.17188H9.99951C10.2757 4.17188 10.5 4.39541 10.5 4.67155C10.5 4.94769 10.2757 5.17122 9.99951 5.17122H9.33301C9.11207 5.17122 8.90008 5.25919 8.74381 5.41536C8.58761 5.57157 8.49976 5.78366 8.49967 6.00456C8.49967 6.28059 8.27599 6.50487 8 6.50505C7.72386 6.50505 7.49951 6.2807 7.49951 6.00456Z" fill="currentColor" />
      <path d="M7.5 13.9993V5.99967C7.5 5.72353 7.72353 5.5 7.99967 5.5C8.27582 5.5 8.49935 5.72353 8.49935 5.99967V13.9993C8.49935 14.2755 8.27582 14.4998 7.99967 14.4998C7.72353 14.4998 7.5 14.2755 7.5 13.9993Z" fill="currentColor" />
    </svg>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function ConfirmAddProcedureModal({
  isNew,
  procedureTitle,
  onCancel,
  onConfirm,
}: {
  isNew: boolean
  procedureTitle: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
      <div className="w-[480px] rounded-md bg-surface p-xl shadow-modal">
        <div className="flex items-center justify-between">
          <h3 className="text-h3 text-text-primary">
            {isNew ? 'Confirm adding procedure' : 'Confirm updating procedure'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <p className="mt-lg text-body text-text-secondary">
          {isNew ? (
            <>
              This will add "<span className="text-text-primary">{procedureTitle}</span>" to the current workflow
              and save it to your shared procedure library, so it can be reused across other agents
            </>
          ) : (
            <>
              This will update "<span className="text-text-primary">{procedureTitle}</span>" in the current workflow
              and save the changes to your shared procedure library, so other agents using it stay up to date
            </>
          )}
        </p>
        <div className="mt-xl flex items-center justify-end gap-md">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailPanel({
  rec,
  recStatus,
  onReject,
  onAccept,
  onToast,
  onPreviewOpen,
}: {
  rec: Recommendation
  recStatus: RecStatus
  onReject: (id: string) => void
  onAccept: (id: string) => void
  onToast: (data: ToastData) => void
  onPreviewOpen: () => void
}) {
  const [applyOpen, setApplyOpen] = useState(false)
  const [convsOpen, setConvsOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <ConversationsDrawer rec={rec} open={convsOpen} onClose={() => setConvsOpen(false)} />
      {confirmOpen && (
        <ConfirmAddProcedureModal
          isNew={rec.isNew}
          procedureTitle={rec.procedureTitle}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false)
            onAccept(rec.id)
            onToast({ message: `${rec.procedureTitle} successfully ${rec.isNew ? 'added' : 'updated'}` })
          }}
        />
      )}
      <DetailPanelInner
        rec={rec}
        recStatus={recStatus}
        applyOpen={applyOpen}
        setApplyOpen={setApplyOpen}
        setConvsOpen={setConvsOpen}
        onPreviewOpen={onPreviewOpen}
        onReject={onReject}
        onRequestAccept={() => setConfirmOpen(true)}
        onToast={onToast}
      />
    </>
  )
}

function DetailPanelInner({
  rec,
  recStatus,
  applyOpen,
  setApplyOpen,
  setConvsOpen,
  onPreviewOpen,
  onReject,
  onRequestAccept,
  onToast,
}: {
  rec: Recommendation
  recStatus: RecStatus
  applyOpen: boolean
  setApplyOpen: (v: boolean | ((prev: boolean) => boolean)) => void
  setConvsOpen: (v: boolean) => void
  onPreviewOpen: () => void
  onReject: (id: string) => void
  onRequestAccept: () => void
  onToast: (data: ToastData) => void
})

{
  const [titleValue, setTitleValue] = useState(rec.procedureTitle)
  const [whenToUseValue, setWhenToUseValue] = useState(rec.whenToUse)
  const [savedTitle, setSavedTitle] = useState(rec.procedureTitle)
  const [savedWhenToUse, setSavedWhenToUse] = useState(rec.whenToUse)
  const [showOriginal, setShowOriginal] = useState(false)

  const dirty = titleValue !== savedTitle || whenToUseValue !== savedWhenToUse

  const handleSave = () => {
    setSavedTitle(titleValue)
    setSavedWhenToUse(whenToUseValue)
    onToast({ message: 'Changes saved.' })
  }

  return (
    <div className="min-w-0 flex-1 overflow-y-auto">
      <div className="flex flex-col gap-xl py-xl pl-lg pr-2xl">
        {/* Title + CTAs */}
        <div>
          <div className="flex items-center justify-between gap-md">
            <div className="flex min-w-0 flex-1 items-center gap-sm">
              <h2 className="min-w-0 truncate text-h2 text-text-primary">{rec.title}</h2>
              {recStatus === 'open' && <Chip label={rec.priority} variant={PRIORITY_VARIANT[rec.priority]} />}
              {recStatus === 'open' && rec.manualUpdates && rec.manualUpdates.length > 0 && (
                <Chip
                  label={`${rec.manualUpdates.length} manual update${rec.manualUpdates.length > 1 ? 's' : ''} needed`}
                  variant="warning"
                />
              )}
              {recStatus === 'accepted' && <Chip label="Accepted" variant="success" />}
              {recStatus === 'rejected' && <Chip label="Rejected" variant="danger" />}
            </div>
            <div className="flex shrink-0 items-center gap-sm">
              <button
                type="button"
                onClick={onPreviewOpen}
                className="flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
              >
                <Icon name="play_arrow" size={16} className="text-text-icon" />
                Test
              </button>
              {recStatus === 'accepted' ? (
                <div className="relative">
                  <div className="flex h-9 overflow-hidden rounded-sm">
                    <button
                      type="button"
                      disabled={!dirty}
                      onClick={handleSave}
                      className={`flex h-9 items-center px-lg text-body transition-colors ${
                        dirty
                          ? 'bg-primary text-white hover:bg-primary-hover'
                          : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
                      }`}
                    >
                      Save
                    </button>
                    <div className={`w-px ${dirty ? 'bg-white/30' : 'bg-border'}`} />
                    <button
                      type="button"
                      disabled={!dirty}
                      onClick={() => setApplyOpen((v) => !v)}
                      aria-label="More save options"
                      className={`flex h-9 items-center px-sm transition-colors ${
                        dirty
                          ? 'bg-primary text-white hover:bg-primary-hover'
                          : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
                      }`}
                    >
                      <Icon name="expand_more" size={16} />
                    </button>
                  </div>
                  {dirty && applyOpen && (
                    <>
                      <div className="fixed inset-0 z-[105]" onClick={() => setApplyOpen(false)} aria-hidden />
                      <div className="absolute right-0 top-full z-[110] mt-xs min-w-[220px] rounded-sm border border-border bg-surface py-sm shadow-dropdown">
                        <button
                          type="button"
                          onClick={() => {
                            setApplyOpen(false)
                            handleSave()
                            onToast({ message: `${rec.procedureTitle} successfully added to the library.` })
                          }}
                          className="block w-full px-lg py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                        >
                          Add to library
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
              <div className="relative">
                <div className="flex h-9 overflow-hidden rounded-sm">
                  <button
                    className="flex h-9 items-center bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
                    onClick={() => {
                      setApplyOpen(false)
                      onRequestAccept()
                    }}
                  >
                    Accept
                  </button>
                  <div className="w-px bg-white/30" />
                  <button
                    className="flex h-9 items-center bg-primary px-sm text-white transition-colors hover:bg-primary-hover"
                    onClick={() => setApplyOpen((v) => !v)}
                    aria-label="More apply options"
                  >
                    <Icon name="expand_more" size={16} />
                  </button>
                </div>
                {applyOpen && (
                  <>
                    <div className="fixed inset-0 z-[105]" onClick={() => setApplyOpen(false)} aria-hidden />
                    <div className="absolute right-0 top-full z-[110] mt-xs min-w-[220px] rounded-sm border border-border bg-surface py-sm shadow-dropdown">
                      <button
                        type="button"
                        onClick={() => {
                          setApplyOpen(false)
                          onRequestAccept()
                        }}
                        className="block w-full px-lg py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                      >
                        Add to library
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setApplyOpen(false)
                          onReject(rec.id)
                        }}
                        className="block w-full px-lg py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                      >
                        Reject
                      </button>
                    </div>
                  </>
                )}
              </div>
              )}
            </div>
          </div>

          {/* AI insight callout */}
          <div className="mt-md flex items-start gap-sm rounded-sm border border-[#b090e0] bg-[#f9f7fd] px-lg py-md">
            <Icon name="auto_awesome" size={14} className="mt-0.5 shrink-0 text-ai-brand" />
            <div className="flex min-w-0 flex-1 flex-col gap-xs">
              <p className="text-body text-text-secondary">{rec.rationale}</p>
              {rec.outcomes && rec.outcomes.length > 0 && (
                <ul className="flex flex-col gap-[4px] pl-md">
                  {rec.outcomes.map((o, i) => (
                    <li key={i} className="list-disc text-body text-text-secondary marker:text-text-tertiary">
                      {o.includes(rec.procedureTitle) ? (
                        <>
                          {o.split(rec.procedureTitle)[0]}
                          <span className="text-text-primary">{rec.procedureTitle}</span>
                          {o.split(rec.procedureTitle)[1]}
                        </>
                      ) : (
                        o
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => setConvsOpen(true)}
                className="flex w-fit items-center gap-xs text-small text-text-action "
              >
                <Icon name="chat_bubble_outline" size={13} />
                View {rec.conversationCount} conversations
                <Icon name="chevron_right" size={13} />
              </button>
            </div>
          </div>

        </div>

        {/* Show original procedure toggle */}
        {recStatus === 'open' && rec.originalSteps && rec.originalSteps.length > 0 && (
          <div className="flex items-center gap-sm">
            <span className="text-body text-text-primary">Show original procedure</span>
            <button
              type="button"
              role="switch"
              aria-checked={showOriginal}
              onClick={() => setShowOriginal((v) => !v)}
              className={`relative h-[16px] w-[32px] shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none ${
                showOriginal ? 'bg-primary' : 'bg-surface-selected'
              }`}
            >
              <span
                className={`absolute top-[2px] size-3 rounded-full bg-white shadow-sm transition-[left] ${
                  showOriginal ? 'left-[18px]' : 'left-[2px]'
                }`}
              />
            </button>
          </div>
        )}

        {/* Procedure title */}
        <div className="flex flex-col gap-xs">
          <p className="text-small text-text-primary">Procedure title</p>
          <input
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            readOnly={showOriginal}
            className="flex h-9 items-center rounded-sm border border-border-selected bg-surface px-md text-body text-text-primary outline-none focus:border-border-strong"
          />
        </div>

        {/* When to use this procedure? */}
        <div className="flex flex-col gap-xs">
          <p className="text-small text-text-primary">When to use this procedure?</p>
          <textarea
            value={showOriginal ? rec.originalWhenToUse ?? whenToUseValue : whenToUseValue}
            onChange={(e) => setWhenToUseValue(e.target.value)}
            rows={2}
            readOnly={showOriginal}
            className="min-h-9 resize-none rounded-sm border border-border-selected bg-surface px-md py-sm text-body text-text-primary outline-none focus:border-border-strong"
          />
        </div>

        {/* Context */}
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-xs">
            <p className="text-small text-text-primary">Context</p>
            <Icon name="info" size={16} className="text-text-icon" />
          </div>
          <div className="flex min-h-9 items-center rounded-sm border border-border-selected bg-surface px-md py-sm">
            <button type="button" className="flex items-center gap-xs text-small text-text-action">
              <Icon name="add_circle" size={20} />
              Add
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-xs">
            <p className="text-small text-text-primary">Steps</p>
            <Icon name="info" size={16} className="text-text-icon" />
          </div>
          <div className="flex min-h-[547px] flex-col rounded-sm border border-border-selected bg-surface p-md">
            <div className="flex flex-1 flex-col gap-xl">
              {(showOriginal && rec.originalSteps ? rec.originalSteps : rec.steps).map((step, i) => (
                <div key={i}>
                  <p className="mb-xs text-body text-text-primary">
                    {i + 1}. {step.title}
                  </p>
                  <ul className="flex flex-col pl-lg">
                    {step.bullets.map((b, j) => (
                      <li key={j} className="list-disc text-body text-text-primary marker:text-text-primary">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-sm pt-md">
              <ToolbarExpandIcon className="size-5 text-text-icon" />
              <ToolbarBuildIcon className="size-5 text-text-icon" />
              <ToolbarBookIcon className="size-5 text-text-icon" />
              <ToolbarEditNoteIcon className="size-5 text-text-icon" />
            </div>
          </div>
        </div>

        {/* Manual updates needed */}
        {recStatus === 'open' && rec.manualUpdates && rec.manualUpdates.length > 0 && (
          <div className="flex flex-col gap-md">
            <p className="text-small text-text-primary">Manual updates needed</p>
            <div className="flex items-start gap-sm rounded-sm border border-[#fde68a] bg-[#fffbeb] px-md py-sm">
              <Icon name="warning" size={14} className="mt-[2px] shrink-0 text-warning" />
              <p className="text-[12px] leading-[18px] text-text-secondary">
                Complete these steps to finish setting up this procedure. They require your input and can't be
                completed automatically.
              </p>
            </div>
            <div className="flex flex-col gap-md">
              {rec.manualUpdates.map((m, i) => (
                <div key={i} className="flex items-start gap-md">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-l2">
                    <Icon name={m.icon} size={16} className="text-text-icon" />
                  </span>
                  <div className="flex flex-col gap-[2px]">
                    <p className="text-body text-text-primary">{m.title}</p>
                    <p className="text-small text-text-secondary">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function FrontdeskRecommendationsTab() {
  const [selected, setSelected] = useState(RECOMMENDATIONS[0].id)
  const [accepted, setAccepted] = useState<Set<string>>(new Set())
  const [rejected, setRejected] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<ToastData | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    setPreviewOpen(false)
  }, [selected])

  const showToast = (data: ToastData) => {
    setToast(data)
    setTimeout(() => setToast(null), 5000)
  }

  const handleAccept = (id: string) => {
    setAccepted((prev) => new Set(prev).add(id))
    setRejected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleReject = (id: string) => {
    showToast({ message: 'Recommendation rejected', variant: 'danger' })
    setRejected((prev) => new Set(prev).add(id))
    setAccepted((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setSelected((s) => (s === id ? '' : s))
  }

  const visibleRecommendations = sortRecommendations(RECOMMENDATIONS)
  const rec = visibleRecommendations.find((r) => r.id === selected) ?? visibleRecommendations[0]

  return (
    <div className="flex h-full min-h-0 w-full">
      <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      {/* Left panel */}
      <div
        className={`flex h-full min-h-0 shrink-0 flex-col transition-[width] duration-200 ${
          previewOpen ? 'w-[260px]' : 'w-[384px]'
        }`}
      >
        {/* Cards */}
        <div className="flex flex-1 flex-col gap-md overflow-y-auto py-xl pl-2xl">
          {visibleRecommendations.map((r) => (
            <RecCard
              key={r.id}
              rec={r}
              selected={r.id === selected}
              recStatus={getRecStatus(r.id, rejected, accepted)}
              onClick={() => setSelected(r.id)}
            />
          ))}
        </div>
      </div>

      {/* Right panel */}
      {rec ? (
        <DetailPanel
          key={rec.id}
          rec={rec}
          recStatus={getRecStatus(rec.id, rejected, accepted)}
          onReject={handleReject}
          onAccept={handleAccept}
          onToast={showToast}
          onPreviewOpen={() => setPreviewOpen(true)}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-small text-text-tertiary">
          No recommendations found.
        </div>
      )}

      {previewOpen && rec && (
        <div className="preview-panel-float-wrap">
          <PreviewPanel
            onClose={() => setPreviewOpen(false)}
            onPreviewActiveChange={() => {}}
            agentName={rec.title}
          />
        </div>
      )}

      {toast && <Toast data={toast} onDismiss={() => setToast(null)} />}
      </div>
    </div>
  )
}
