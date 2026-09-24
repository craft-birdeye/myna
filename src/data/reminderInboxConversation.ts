/** Shared Sarah Lauren reminder-run conversation — used by RunDetailsPanel and the Inbox deep-link. */

export const REMINDER_INBOX_CONVERSATION_ID = 'sarah-lauren'

export interface ReminderConversationCardField {
  label: string
  value: string
}

export type ReminderConversationEntry =
  | {
      id: string
      kind: 'system'
      text: string
      /** When true and the caller opts in via `showCallRecording`, the call-recording waveform
       *  renders immediately after this line (e.g. right when the voice portion of the call
       *  starts). */
      insertCallRecordingAfter?: boolean
    }
  | {
      id: string
      kind: 'card'
      tone: 'business' | 'neutral'
      icon: string
      title: string
      contactName?: string
      contactType?: string
      fields?: ReminderConversationCardField[]
      body?: string
      actionLabel?: string
      time?: string
    }
  | {
      id: string
      kind: 'message'
      sender: 'business' | 'user'
      text: string
      time?: string
      llmResponseTime?: string
      tts?: string
      sttLabel?: string
    }

export const REMINDER_CONVERSATION_EVENTS: ReminderConversationEntry[] = [
  { id: 'sys-1', kind: 'system', text: 'Email conversation started • 09:55 PM' },
  {
    id: 'card-1',
    kind: 'card',
    tone: 'business',
    icon: 'check_circle',
    title: 'Appointment booked',
    contactName: 'Sarah Lauren',
    contactType: 'Other',
    fields: [
      { label: 'Appointment type', value: 'Routine checkup' },
      { label: 'Booking date and time', value: 'Sat, Jun 14, 2026 • 2:30 PM - 3:00 PM' },
    ],
    time: '08:03 PM',
  },
  { id: 'card-2', kind: 'card', tone: 'neutral', icon: 'mail', title: 'Appointment booked', actionLabel: 'Confirm' },
  {
    id: 'card-3',
    kind: 'card',
    tone: 'business',
    icon: 'mail',
    title: 'Appointment reminder sent!',
    body:
      'Hi Sarah,\nThis is a reminder that you have a Routine Checkup scheduled for Sat, Jun 14 · 2:30 PM. Please confirm your attendance by replying to this email.\n\nIf you need to reschedule, tap "I need to reschedule" and a team member will be in touch.',
    time: '08:03 PM',
  },
  { id: 'card-4', kind: 'card', tone: 'neutral', icon: 'mail', title: 'Reminder confirmation', actionLabel: 'Confirm' },
  { id: 'sys-2', kind: 'system', text: 'Voice call started • 09:55 PM', insertCallRecordingAfter: true },
  {
    id: 'msg-1',
    kind: 'message',
    sender: 'business',
    text:
      "Hi there! I'm Myna, your virtual assistant from Rock Dental Brands. I'm reaching out to confirm your upcoming appointment. Is now a good time to chat?",
    time: '09:55 PM',
    llmResponseTime: '0.42s',
    tts: '700ms',
  },
  { id: 'msg-2', kind: 'message', sender: 'user', text: 'Yes, go ahead', time: '09:55 PM', sttLabel: '7s' },
  {
    id: 'msg-3',
    kind: 'message',
    sender: 'business',
    text:
      "Great! You have an appointment scheduled with us. I just wanted to make sure you're still planning to come in and answer any questions you might have beforehand.",
    time: '09:56 PM',
    llmResponseTime: '0.42s',
    tts: '700ms',
  },
  { id: 'msg-4', kind: 'message', sender: 'user', text: "Yes, I'll be there. Do I need to bring anything?", time: '09:56 PM', sttLabel: '7s' },
  {
    id: 'msg-5',
    kind: 'message',
    sender: 'business',
    text:
      "Glad to hear it! Please bring a valid photo ID and your insurance card if applicable. Also, arrive about 10 minutes early to complete any paperwork. Is there anything else you'd like to know before your visit?",
    time: '09:57 PM',
    llmResponseTime: '0.42s',
    tts: '700ms',
  },
  {
    id: 'msg-6',
    kind: 'message',
    sender: 'user',
    text: 'Actually, can you also tell me what my insurance covers for this visit?',
    time: '09:57 PM',
    sttLabel: '7s',
  },
  { id: 'sys-3', kind: 'system', text: 'Routed to Front desk agent' },
  {
    id: 'msg-7',
    kind: 'message',
    sender: 'business',
    text:
      "That's a great question! I want to make sure you get the most accurate information on that. Let me connect you with our front desk team — they'll be able to walk you through your coverage details right away.",
    time: '09:58 PM',
    llmResponseTime: '0.42s',
    tts: '700ms',
  },
]

/** Multi-channel summary for Reminder agent logs — email, SMS, and voice legs combined. */
export const REMINDER_CONVERSATION_AI_SUMMARY = [
  'Sarah Lauren booked a routine checkup by email and received an automated appointment reminder.',
  'She confirmed her attendance via email before the agent followed up with a voice call.',
  'Across email and voice, the agent reconfirmed the Jun 14 visit and answered insurance questions.',
]
