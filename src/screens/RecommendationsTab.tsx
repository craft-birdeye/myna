import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Chip, FilterPanel, Icon, RefChip, type FilterField } from '../components'
import PreviewPanel from '../workflow/Molecules/PreviewPanel/PreviewPanel'
import '../workflow/Molecules/PreviewPanel/PreviewPanel.css'

// ── Types ─────────────────────────────────────────────────────────────────────

type GapType = 'procedure' | 'knowledge' | 'action'
type Priority = 'High' | 'Medium' | 'Low'

interface ProcedureStep {
  title: string
  bullets: string[]
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
  summary: string
  priority: Priority
  timeAgo: string
  conversationCount: number
  isNew: boolean
  whenToUse: string
  steps: ProcedureStep[]
  tools: { label: string; icon: string }[]
  rationale: string
  changeType: string
  diff?: DiffChange
  conversations: ConversationItem[]
  sim?: { before: Turn[]; after: Turn[] }
}

// ── Data ─────────────────────────────────────────────────────────────────────

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'r1',
    gapType: 'procedure',
    title: 'Payment processing procedure',
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
    rationale: '12 conversations in the past 7 days ended unresolved because the agent had no guidance on handling payment requests.',
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
    title: 'Appointment rescheduling procedure',
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
    title: 'Emergency escalation procedure',
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
          'Connect directly to the on-call service advisor',
          'If unavailable, escalate to the service manager',
          "Relay the customer's name, callback number, and concern before transferring",
        ],
      },
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
    title: 'Business hours',
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
          'Retrieve current hours, weekend hours, and upcoming holiday closures from the knowledge base',
          'Offer to schedule an appointment if the customer wants to come in',
        ],
      },
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
    title: 'VIN lookup — service intake',
    summary: 'Service advisors are manually re-entering vehicle data after every call.',
    priority: 'Medium',
    timeAgo: '6h ago',
    conversationCount: 7,
    isNew: false,
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

const GAP_COLOR: Record<GapType, string> = {
  procedure: '#4F46E5',
  knowledge: '#F59E0B',
  action: '#10B981',
}


const GAP_BAR: Record<GapType, string> = {
  procedure: 'bg-[#4F46E5]',
  knowledge: 'bg-[#F59E0B]',
  action: 'bg-[#10B981]',
}

const GAP_LABEL: Record<GapType, string> = {
  procedure: 'Procedure gap',
  knowledge: 'Knowledge gap',
  action: 'Action gap',
}

const GAP_ICON: Record<GapType, string> = {
  procedure: 'description',
  knowledge: 'menu_book',
  action: 'build',
}

const PRIORITY_VARIANT: Record<Priority, 'danger' | 'warning' | 'neutral'> = {
  High: 'danger',
  Medium: 'warning',
  Low: 'neutral',
}

type StatusFilter = 'all' | 'open' | 'accepted' | 'rejected'
type RecStatus = 'open' | 'accepted' | 'rejected'

const STATUS_FILTER_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
]

const FILTER_FIELDS: FilterField[] = [
  {
    id: 'gap-type',
    label: 'Type',
    multi: true,
    options: [
      { value: 'procedure', label: 'Procedure gap' },
      { value: 'knowledge', label: 'Knowledge gap' },
      { value: 'action', label: 'Action gap' },
    ],
  },
  {
    id: 'impact',
    label: 'Impact',
    multi: true,
    options: [
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' },
    ],
  },
]

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

function StatusDropdown({
  value,
  onChange,
}: {
  value: StatusFilter
  onChange: (value: StatusFilter) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedLabel = STATUS_FILTER_OPTIONS.find((option) => option.id === value)!.label

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-xs rounded-sm text-body text-text-primary hover:bg-surface-hover"
      >
        {selectedLabel}
        <Icon name="expand_more" size={16} className="text-text-icon" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute left-0 top-full z-[110] mt-xs min-w-[168px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
            {STATUS_FILTER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id)
                  setOpen(false)
                }}
                className={`block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover ${
                  value === option.id ? 'bg-surface-hover' : ''
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
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
      className={`w-full rounded-md border p-lg text-left transition-colors ${
        selected
          ? 'border-border-selected bg-surface-selected'
          : 'border-border-selected bg-surface hover:bg-surface-hover'
      }`}
    >
      <div className="mb-sm flex items-center justify-between gap-sm">
        <div className="flex min-w-0 items-center gap-xs">
          <Icon name={GAP_ICON[rec.gapType]} size={14} className="shrink-0 text-text-icon" />
          <span className="truncate text-small text-text-tertiary">{GAP_LABEL[rec.gapType]}</span>
        </div>
        <div className="flex items-center gap-xs">
          <Chip label={rec.priority} variant={PRIORITY_VARIANT[rec.priority]} />
          {recStatus === 'accepted' && <Chip label="Accepted" variant="success" />}
          {recStatus === 'rejected' && <Chip label="Rejected" variant="danger" />}
        </div>
      </div>

      <p className="text-body text-text-primary">
        {rec.title}
        <span className="text-text-tertiary"> · {rec.isNew ? 'New' : 'Modified'}</span>
      </p>

      <p className="mt-xs line-clamp-2 text-small text-text-secondary">
        <span className="text-text-primary">Improve: </span>
        {rec.summary}
      </p>

      <div className="mt-sm flex items-center justify-between gap-sm">
        <span className="inline-flex items-center gap-xs text-small text-text-tertiary">
          <Icon name="sms" size={12} />
          {rec.conversationCount} affected
        </span>
        <span className="text-small text-text-tertiary">{rec.timeAgo}</span>
      </div>
    </button>
  )
}

// ── Gap legend bar ─────────────────────────────────────────────────────────────

function GapLegend() {
  const counts = {
    procedure: RECOMMENDATIONS.filter((r) => r.gapType === 'procedure').length,
    knowledge: RECOMMENDATIONS.filter((r) => r.gapType === 'knowledge').length,
    action: RECOMMENDATIONS.filter((r) => r.gapType === 'action').length,
  }
  const total = RECOMMENDATIONS.length
  const types: GapType[] = ['procedure', 'knowledge', 'action']

  return (
    <div className="flex flex-col gap-md">
      <h2 className="text-h2 text-text-primary">Recommended changes</h2>
      <div className="flex h-2 w-full overflow-hidden rounded-full">
        {types.map((t) => (
          <div
            key={t}
            className={GAP_BAR[t]}
            style={{ width: `${(counts[t] / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex items-center gap-md">
        {types.map((t) => (
          <div key={t} className="flex items-center gap-xs">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: GAP_COLOR[t] }}
            />
            <span className="text-small text-text-tertiary">{GAP_LABEL[t]} ({counts[t]})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

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

        {/* Warning banner */}
        <div className="mb-[20px] flex items-start gap-sm rounded-sm border border-[#fde68a] bg-[#fffbeb] px-md py-sm">
          <Icon name="warning" size={14} className="mt-[2px] shrink-0 text-warning" />
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <p className="text-[12px] leading-[18px] text-text-secondary">
              The agent could not fully resolve this request. This conversation contributed to the recommendation.
            </p>
            <button
              type="button"
              onClick={() => setSimActive(v => !v)}
              className="flex w-fit items-center gap-[4px] text-[12px] text-text-action"
            >
              <Icon name={simActive ? 'visibility_off' : 'auto_awesome'} size={13} />
              {simActive ? 'Hide simulation' : 'Simulate with the new procedure'}
            </button>
          </div>
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
            return (
              <div key={i} className="mb-[16px] flex max-w-[72%] flex-col items-end gap-[10px] self-end">

                {/* Slot above original: typing → improved */}
                {divPhase === 'typing' && (
                  <div className="sim-slide-in flex flex-col items-end gap-[6px]">
                    <span className="text-[11px] text-[#9aa0a6]">Agent working…</span>
                    <div className="rounded-[18px] rounded-tr-[4px] bg-[#e8f0fe] px-[16px] py-[12px]">
                      <TypingDots />
                    </div>
                  </div>
                )}

                {divPhase === 'improved' && (
                  <div className="sim-slide-in flex flex-col items-end gap-[6px]">
                    <span className="rounded-full bg-[#e6f4ea] px-[10px] py-[2px] text-[11px] text-[#188038]">
                      Recommendation applied
                    </span>
                    <div className="rounded-[18px] rounded-tr-[4px] bg-[#e8f0fe] px-[16px] py-[10px]">
                      <p className="text-[15px] leading-[22px] text-[#1a1a1a]">{improvedText}</p>
                    </div>
                  </div>
                )}

                {/* Original — always shown once divPhase >= 'original'; fades when improved arrives */}
                {(divPhase === 'original' || divPhase === 'typing' || divPhase === 'improved') && (
                  <div
                    className="flex flex-col items-end gap-[6px] transition-opacity duration-500"
                    style={{ opacity: divPhase === 'improved' ? 0.38 : 1 }}
                  >
                    {divPhase === 'improved' && (
                      <span className="rounded-full bg-[#f1f3f4] px-[10px] py-[2px] text-[11px] text-[#5f6368]">
                        Original response
                      </span>
                    )}
                    <div className="rounded-[18px] rounded-tr-[4px] bg-[#e8f0fe] px-[16px] py-[10px]">
                      <p className="text-[15px] leading-[22px] text-[#1a1a1a]">{turn.text}</p>
                    </div>
                    <span className="text-[11px] text-[#9aa0a6]">
                      {divPhase === 'improved' ? `Original · ${turn.time}` : turn.time}
                    </span>
                  </div>
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
                        {/* Row 3: location · agent icon · agent */}
                        <div className="flex items-center gap-[4px] text-[12px] text-[#9aa0a6]">
                          <span>{c.location}</span>
                          <span>·</span>
                          <Icon name="person" size={12} className="text-[#9aa0a6]" />
                          <span>{agentName}</span>
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

type ToastData = { message: string; onUndo?: () => void }

function Toast({ data, onDismiss }: { data: ToastData; onDismiss: () => void }) {
  return createPortal(
    <div
      className="fixed left-1/2 top-[24px] z-[500] flex -translate-x-1/2 items-center gap-[12px] rounded-[8px] bg-white px-[16px] py-[12px]"
      style={{ minWidth: 360, maxWidth: 520, boxShadow: '0 4px 16px 0 rgba(0,0,0,0.14), 0 1px 4px 0 rgba(0,0,0,0.08)' }}
    >
      {/* green stroke-only checkmark */}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
        <path d="M4 10.5l4.5 4.5 7.5-9" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

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

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  rec,
  recStatus,
  onReject,
  onAccept,
  onToast,
}: {
  rec: Recommendation
  recStatus: RecStatus
  onReject: (id: string) => void
  onAccept: (id: string) => void
  onToast: (data: ToastData) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [applyOpen, setApplyOpen] = useState(false)
  const [convsOpen, setConvsOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    setPreviewOpen(false)
  }, [rec.id])

  return (
    <>
      <ConversationsDrawer rec={rec} open={convsOpen} onClose={() => setConvsOpen(false)} />
      <DetailPanelInner
        rec={rec}
        recStatus={recStatus}
        expanded={expanded}
        setExpanded={setExpanded}
        applyOpen={applyOpen}
        setApplyOpen={setApplyOpen}
        setConvsOpen={setConvsOpen}
        previewOpen={previewOpen}
        onPreviewOpen={() => setPreviewOpen(true)}
        onPreviewClose={() => setPreviewOpen(false)}
        onReject={onReject}
        onAccept={onAccept}
        onToast={onToast}
      />
    </>
  )
}

function DetailPanelInner({
  rec,
  recStatus,
  expanded,
  setExpanded,
  applyOpen,
  setApplyOpen,
  setConvsOpen,
  previewOpen,
  onPreviewOpen,
  onPreviewClose,
  onReject,
  onAccept,
  onToast,
}: {
  rec: Recommendation
  recStatus: RecStatus
  expanded: boolean
  setExpanded: (v: boolean) => void
  applyOpen: boolean
  setApplyOpen: (v: boolean | ((prev: boolean) => boolean)) => void
  setConvsOpen: (v: boolean) => void
  previewOpen: boolean
  onPreviewOpen: () => void
  onPreviewClose: () => void
  onReject: (id: string) => void
  onAccept: (id: string) => void
  onToast: (data: ToastData) => void
})

{
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-w-0 flex-1 overflow-y-auto">
      <div className="flex flex-col gap-xl px-2xl py-xl">
        {/* Title + CTAs */}
        <div>
          <div className="flex items-start justify-between gap-md">
            <div className="flex min-w-0 flex-wrap items-center gap-sm">
              <Icon name={GAP_ICON[rec.gapType]} size={20} className="mt-0.5 shrink-0 text-text-icon" />
              <h2 className="text-h2 text-text-primary">
                {rec.title}
                <span className="text-text-tertiary"> · {rec.isNew ? 'New' : 'Modified'}</span>
              </h2>
              <Chip label={rec.priority} variant={PRIORITY_VARIANT[rec.priority]} />
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
                <button
                  type="button"
                  onClick={() => onToast({ message: `"${rec.title}" has been added to the procedure library.` })}
                  className="flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
                >
                  Add to library
                </button>
              ) : (
              <div className="relative">
                <div className="flex h-9 overflow-hidden rounded-sm">
                  <button
                    className="flex h-9 items-center bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
                    onClick={() => {
                      setApplyOpen(false)
                      onAccept(rec.id)
                      onToast({ message: `"${rec.title}" has been applied to this agent and is now active.` })
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
                    <div className="absolute right-0 top-full z-[110] mt-xs min-w-[220px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
                      <button
                        type="button"
                        onClick={() => {
                          setApplyOpen(false)
                          onAccept(rec.id)
                          onToast({ message: `"${rec.title}" has been applied to this agent and is now active.` })
                        }}
                        className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                      >
                        Apply to this agent
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setApplyOpen(false)
                          onAccept(rec.id)
                          onToast({ message: `"${rec.title}" has been applied to this agent and saved to the procedure library.` })
                        }}
                        className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                      >
                        Apply and add to library
                      </button>
                      <div className="my-xs border-t border-border" />
                      <button
                        type="button"
                        onClick={() => {
                          setApplyOpen(false)
                          onReject(rec.id)
                        }}
                        className="block w-full px-md py-sm text-left text-body text-chip-danger-text hover:bg-surface-hover"
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

          {/* Rationale — why this came up */}
          <div className="mt-md flex items-start gap-sm rounded-sm border border-ai-summary-border bg-ai-summary px-lg py-md">
            <Icon name="auto_awesome" size={18} className="mt-0.5 shrink-0 text-ai-brand" />
            <div className="flex min-w-0 flex-1 flex-col gap-xs">
              <p className="text-body text-text-secondary">{rec.rationale}</p>
              <button
                type="button"
                onClick={() => setConvsOpen(true)}
                className="flex w-fit items-center gap-xs text-small text-text-action "
              >
                <Icon name="sms" size={13} />
                View {rec.conversationCount} conversations
                <Icon name="chevron_right" size={13} />
              </button>
            </div>
          </div>

        </div>

        {/* When to use */}
        <div>
          <p className="mb-xs text-small text-text-tertiary">When to use</p>
          <p className="text-body text-text-secondary">{rec.whenToUse}</p>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-lg">
          {rec.steps.map((step, i) => (
            <div key={i}>
              <p className="mb-sm text-body text-text-primary">
                {i + 1}. {step.title}
              </p>
              <ul className="flex flex-col gap-xs pl-md">
                {step.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-sm">
                    <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-text-tertiary" />
                    <span className="text-body text-text-secondary">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Tools */}
        {rec.tools.length > 0 && (
          <div>
            <p className="mb-sm text-small text-text-tertiary">Tools</p>
            <div className="flex flex-wrap gap-sm">
              {rec.tools.map((t) => (
                <RefChip key={t.label} kind="tool" label={t.label} />
              ))}
            </div>
          </div>
        )}

        {/* Before / after diff — only for modifications */}
        {rec.diff && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-xs text-small text-text-action "
            >
              <Icon name={expanded ? 'expand_less' : 'expand_more'} size={14} />
              {expanded ? 'Hide' : 'Show'} what changes
            </button>
            {expanded && (
              <div className="mt-sm flex flex-col gap-xs rounded-sm border border-border bg-surface-subtle p-md">
                <p className="text-small text-text-tertiary">{rec.diff.location}</p>
                <div className="rounded-sm bg-chip-danger-bg px-sm py-xs">
                  <p className="text-small text-chip-danger-text line-through">{rec.diff.before}</p>
                </div>
                <div className="rounded-sm bg-chip-success-bg px-sm py-xs">
                  <p className="text-small text-chip-success-text">{rec.diff.after}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {previewOpen && (
        <div className="preview-panel-float-wrap">
          <PreviewPanel
            onClose={onPreviewClose}
            onPreviewActiveChange={() => {}}
            agentName={rec.title}
          />
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function RecommendationsTab() {
  const [selected, setSelected] = useState(RECOMMENDATIONS[0].id)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterSelections, setFilterSelections] = useState<Record<string, string[]>>({})
  const [accepted, setAccepted] = useState<Set<string>>(new Set())
  const [rejected, setRejected] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<ToastData | null>(null)
  const rejectTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

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
    showToast({
      message: `Recommendation removed. This won't show up again.`,
      onUndo: () => {
        if (rejectTimerRef.current) clearTimeout(rejectTimerRef.current)
        rejectTimerRef.current = null
      },
    })
    rejectTimerRef.current = setTimeout(() => {
      setRejected((prev) => new Set(prev).add(id))
      setAccepted((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      if (statusFilter === 'open') {
        setSelected((s) => (s === id ? '' : s))
      }
      rejectTimerRef.current = null
    }, 5000)
  }

  const gapTypes = filterSelections['gap-type'] ?? []
  const impacts = filterSelections.impact ?? []

  const visibleRecommendations = sortRecommendations(
    RECOMMENDATIONS.filter((rec) => {
      const status = getRecStatus(rec.id, rejected, accepted)
      if (statusFilter !== 'all' && status !== statusFilter) return false
      if (gapTypes.length > 0 && !gapTypes.includes(rec.gapType)) return false
      if (impacts.length > 0 && !impacts.includes(rec.priority.toLowerCase())) return false
      return true
    }),
  )
  const rec = visibleRecommendations.find((r) => r.id === selected) ?? visibleRecommendations[0]

  return (
    <div className="flex h-full min-h-0 w-full">
      <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      {/* Left panel */}
      <div className="flex h-full min-h-0 w-[384px] shrink-0 flex-col border-r border-border">
        {/* List header */}
        <div className="flex flex-col border-b border-border px-lg py-lg">
          <GapLegend />
        </div>

        {/* Cards */}
        <div className="flex flex-1 flex-col gap-md overflow-y-auto px-lg py-lg">
          <div className="flex items-center justify-between gap-sm">
            <StatusDropdown value={statusFilter} onChange={setStatusFilter} />
            <button
              type="button"
              onClick={() => setFilterOpen((open) => !open)}
              className="flex items-center gap-xs rounded-sm px-sm py-xs text-small text-text-secondary hover:bg-surface-hover"
            >
              <Icon name="filter_list" size={13} className="text-text-icon" />
              Filter
            </button>
          </div>
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
        <DetailPanel key={rec.id} rec={rec} recStatus={getRecStatus(rec.id, rejected, accepted)} onReject={handleReject} onAccept={handleAccept} onToast={showToast} />
      ) : (
        <div className="flex flex-1 items-center justify-center text-small text-text-tertiary">
          No recommendations match these filters.
        </div>
      )}

      {toast && <Toast data={toast} onDismiss={() => setToast(null)} />}
      </div>

      <FilterPanel
        open={filterOpen}
        fields={FILTER_FIELDS}
        selections={filterSelections}
        onSelectionsChange={setFilterSelections}
        onClose={() => setFilterOpen(false)}
      />
    </div>
  )
}
