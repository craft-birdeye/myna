/** Shared Rock Dental demo call — used by LogDetailsPanel transcript and Inbox deep-link. */

export const FRONT_DESK_INBOX_CONVERSATION_ID = 'dana-whitfield'

export const FRONT_DESK_CALL_SUMMARY =
  'The caller reported a bad headache she suspected was a migraine. The agent traced it to a back tooth with mild swelling, then routed her to booking, which scheduled her with Dr. Patel for Thursday at 2 PM.'

export interface FrontDeskVoiceMessage {
  id: string | number
  role: 'system' | 'agent' | 'user'
  text: string
}

/** Full call transcript for VoiceChatDrawer / inbox "View transcript". */
export const FRONT_DESK_VOICE_MESSAGES: FrontDeskVoiceMessage[] = [
  { id: 'sys1', role: 'system', text: 'Conversation started' },
  {
    id: 'a1',
    role: 'agent',
    text: 'Thank you for calling Rock Dental Brands — my name is Myna, your virtual assistant. How can I help you today?',
  },
  {
    id: 'c1',
    role: 'user',
    text: 'I am having a very bad headache. I think it is migraine.',
  },
  {
    id: 'a2',
    role: 'agent',
    text: "I'm really sorry you're dealing with that — a bad headache is no fun. Just so I point you in the right direction: is the pain coming from your teeth, jaw, or gums, or is it more of a general head pain?",
  },
  {
    id: 'c2',
    role: 'user',
    text: 'Now that you ask — it kind of started near my back tooth and spread up.',
  },
  {
    id: 'a3',
    role: 'agent',
    text: 'Thank you, that helps. Pain that radiates from a tooth can sometimes need prompt attention. Are you having any swelling in your face or jaw, fever, or trouble swallowing or breathing?',
  },
  {
    id: 'c3',
    role: 'user',
    text: 'A little swelling near the tooth, no fever',
  },
  {
    id: 'a4',
    role: 'agent',
    text: "Good to know there's no fever. Swelling near a tooth is still worth having a dentist look at soon, so let's get you an appointment rather than wait it out.",
  },
  { id: 'sys2', role: 'system', text: 'Routed to appointment booking agent' },
  { id: 'sys3', role: 'system', text: 'Procedure switched : Book appointment' },
  {
    id: 'a5',
    role: 'agent',
    text: 'I have an opening this Thursday at 2 PM with Dr. Patel — would that work for you?',
  },
  {
    id: 'c4',
    role: 'user',
    text: 'Yes please, Thursday at 2 PM works.',
  },
  {
    id: 'a6',
    role: 'agent',
    text: "You're all set for Thursday at 2 PM with Dr. Patel. Anything else I can help with?",
  },
  {
    id: 'c5',
    role: 'user',
    text: "No, that's all. Thank you!",
  },
]

export type FrontDeskInboxEvent =
  | { kind: 'date'; id: string; label: string }
  | { kind: 'status'; id: string; text: string; time?: string }
  | { kind: 'bubble'; id: string; sender: 'customer' | 'agent'; text: string; time: string }

/** Inbox thread events mirroring the log transcript (without tool-call chrome). */
export const FRONT_DESK_INBOX_EVENTS: FrontDeskInboxEvent[] = [
  { kind: 'status', id: 's1', text: 'Conversation started', time: '5:30 PM' },
  {
    kind: 'bubble',
    id: 'm1',
    sender: 'agent',
    text: 'Thank you for calling Rock Dental Brands — my name is Myna, your virtual assistant. How can I help you today?',
    time: '5:30 PM',
  },
  {
    kind: 'bubble',
    id: 'm2',
    sender: 'customer',
    text: 'I am having a very bad headache. I think it is migraine.',
    time: '5:30 PM',
  },
  {
    kind: 'bubble',
    id: 'm3',
    sender: 'agent',
    text: "I'm really sorry you're dealing with that — a bad headache is no fun. Just so I point you in the right direction: is the pain coming from your teeth, jaw, or gums, or is it more of a general head pain?",
    time: '5:31 PM',
  },
  {
    kind: 'bubble',
    id: 'm4',
    sender: 'customer',
    text: 'Now that you ask — it kind of started near my back tooth and spread up.',
    time: '5:31 PM',
  },
  {
    kind: 'bubble',
    id: 'm5',
    sender: 'agent',
    text: 'Thank you, that helps. Pain that radiates from a tooth can sometimes need prompt attention. Are you having any swelling in your face or jaw, fever, or trouble swallowing or breathing?',
    time: '5:31 PM',
  },
  {
    kind: 'bubble',
    id: 'm6',
    sender: 'customer',
    text: 'A little swelling near the tooth, no fever',
    time: '5:32 PM',
  },
  {
    kind: 'bubble',
    id: 'm7',
    sender: 'agent',
    text: "Good to know there's no fever. Swelling near a tooth is still worth having a dentist look at soon, so let's get you an appointment rather than wait it out.",
    time: '5:32 PM',
  },
  { kind: 'status', id: 's2', text: 'Routed to appointment booking agent' },
  { kind: 'status', id: 's3', text: 'Procedure switched : Book appointment' },
  {
    kind: 'bubble',
    id: 'm8',
    sender: 'agent',
    text: 'I have an opening this Thursday at 2 PM with Dr. Patel — would that work for you?',
    time: '5:32 PM',
  },
  {
    kind: 'bubble',
    id: 'm9',
    sender: 'customer',
    text: 'Yes please, Thursday at 2 PM works.',
    time: '5:33 PM',
  },
  {
    kind: 'bubble',
    id: 'm10',
    sender: 'agent',
    text: "You're all set for Thursday at 2 PM with Dr. Patel. Anything else I can help with?",
    time: '5:33 PM',
  },
  {
    kind: 'bubble',
    id: 'm11',
    sender: 'customer',
    text: "No, that's all. Thank you!",
    time: '5:33 PM',
  },
]
