/** Annette Black — inbox chatbot transcript (healthcare). */

export const ANNETTE_BLACK_CONVERSATION_ID = '2'

export type AnnetteChatEvent =
  | { kind: 'date'; id: string; label: string }
  | { kind: 'status'; id: string; text: string; time?: string }
  | {
      kind: 'bubble'
      id: string
      sender: 'customer' | 'agent'
      text?: string
      /** Structured fields shown inside the bubble (e.g. contact details). */
      fields?: { label: string; value: string }[]
      attribution?: string
      time: string
      /** Show channel/link icon beside the timestamp (customer messages). */
      showLink?: boolean
      /** Bot-style attribution with robot icon (agent messages). */
      isBot?: boolean
    }

/** What the agent should have said once it actually has accurate business hours on file —
 *  used as the "revised message" half of the knowledge-gap diff preview. */
export const ANNETTE_BLACK_IMPROVED_HOURS_REPLY =
  "Thanks for waiting — we're open Monday–Friday 8:00 AM–6:00 PM and Saturday 9:00 AM–1:00 PM. We're closed on Sundays. Would you like me to help you book a visit?"

export const ANNETTE_BLACK_CHAT_EVENTS: AnnetteChatEvent[] = [
  { kind: 'date', id: 'ab-d1', label: 'Fri • Jul 17' },
  {
    kind: 'status',
    id: 'ab-s1',
    text: 'Chatbot AI conversation started',
    time: '02:09 PM',
  },
  {
    kind: 'bubble',
    id: 'ab-m1',
    sender: 'agent',
    text: 'Hello! Welcome to Rock Dental Brands. How can I help you today?',
    attribution: 'Myna',
    time: '02:09 PM',
    isBot: true,
  },
  {
    kind: 'bubble',
    id: 'ab-m2',
    sender: 'customer',
    text: 'Hi',
    time: '02:09 PM',
    showLink: true,
  },
  {
    kind: 'bubble',
    id: 'ab-m3',
    sender: 'agent',
    fields: [
      { label: 'Email ID', value: 'annette.black@email.com' },
      { label: 'Phone number', value: '+1 415 555 0142' },
    ],
    attribution: 'Myna',
    time: '02:09 PM',
    isBot: true,
  },
  {
    kind: 'bubble',
    id: 'ab-m4',
    sender: 'customer',
    text: 'What are your business hours?',
    time: '02:10 PM',
    showLink: true,
  },
  {
    kind: 'bubble',
    id: 'ab-m5',
    sender: 'agent',
    text: "I'm sorry, I don't have our current business hours available right now. I'd recommend checking our website or calling the clinic directly to confirm.",
    attribution: 'Myna',
    time: '02:10 PM',
    isBot: true,
  },
  {
    kind: 'bubble',
    id: 'ab-m6',
    sender: 'customer',
    text: "Seriously? You're a booking assistant and you don't know your own hours? That's frustrating.",
    time: '02:11 PM',
  },
  {
    kind: 'bubble',
    id: 'ab-m7',
    sender: 'agent',
    text: "I understand the frustration, and I apologize for the inconvenience. I still don't have that information available right now — calling the clinic directly would be the fastest way to confirm.",
    attribution: 'Myna',
    time: '02:11 PM',
    isBot: true,
  },
]
