import type { VoiceChatMessage } from '../components/VoiceChatDrawer/VoiceChatDrawer.types'

export interface CoachingCallConversation {
  id: string
  dateLabel: string
  summary: string
  duration: string
  durationSecs: number
  messages: VoiceChatMessage[]
  /** Verbatim "Feedback given (dislike)" quote — prefills the Share feedback modal's Add details box. */
  feedbackGiven: string
}

export const COACHING_C1_CONVERSATION_ID = 'coaching-c1'
export const COACHING_C2_CONVERSATION_ID = 'coaching-c2'
export const COACHING_C3_CONVERSATION_ID = 'coaching-c3'
export const COACHING_C4_CONVERSATION_ID = 'coaching-c4'

export const COACHING_CALL_CONVERSATIONS: Record<string, CoachingCallConversation> = {
  [COACHING_C1_CONVERSATION_ID]: {
    id: COACHING_C1_CONVERSATION_ID,
    dateLabel: 'Mon • Mar 3',
    summary:
      "Caller asked to reschedule her son Leo's Thursday appointment to the following week. The agent used long, formal phrasing while confirming the patient's name and pulling up the appointment.",
    duration: '00:38',
    durationSecs: 38,
    feedbackGiven: 'Way too stiff and formal for chat. Nobody talks like this. Make it casual and short.',
    messages: [
      { id: 'sys1', role: 'system', text: 'Conversation started' },
      { id: 'c1', role: 'user', text: "hey can i move my son's appt from thursday to next week" },
      {
        id: 'a1',
        role: 'agent',
        text: "Certainly. I have noted your request. Kindly provide the patient's first and last name so that I may proceed with the rescheduling process.",
        time: '3:15 PM',
      },
      { id: 'c2', role: 'user', text: 'leo martin' },
      {
        id: 'a2',
        role: 'agent',
        text: 'Thank you. Your request has been duly noted. Kindly hold while I retrieve the relevant appointment details.',
        time: '3:16 PM',
      },
      { id: 'c3', role: 'user', text: 'ok this is a lot of words lol' },
    ],
  },
  [COACHING_C2_CONVERSATION_ID]: {
    id: COACHING_C2_CONVERSATION_ID,
    dateLabel: 'Wed • Mar 5',
    summary:
      "Caller tried to cancel tomorrow's appointment during an after-hours call, but had to repeat the request after talking over a long opening greeting.",
    duration: '00:29',
    durationSecs: 29,
    feedbackGiven:
      'The greeting takes forever. People keep talking over it and then everything has to be repeated. Please shorten it.',
    messages: [
      { id: 'sys1', role: 'system', text: 'Conversation started' },
      {
        id: 'a1',
        role: 'agent',
        text: 'If this is an emergency, please hang up and dial nine one one. The office is currently closed. If you need to speak with the doctor on call, please hang up and dial three zero five… nine six seven… two six one five, and your call will be returned promptly. Please note that this call may be recorded for quality and training purposes. My name is Myna, your virtual assistant. I can help you with your appointments or take a message and have the practice—',
        time: '9:47 PM',
      },
      { id: 'c1', role: 'user', text: "—hi, hi, I just need to cancel tomorrow's appointment." },
      { id: 'a2', role: 'agent', text: '—return your call in the morning. How can I help you today?', time: '9:47 PM' },
      { id: 'c2', role: 'user', text: "…I need to cancel tomorrow's appointment." },
    ],
  },
  [COACHING_C3_CONVERSATION_ID]: {
    id: COACHING_C3_CONVERSATION_ID,
    dateLabel: 'Sat • Mar 8',
    summary:
      'Caller asked about Saturday appointment availability. The agent could not confirm weekend hours and offered a follow-up from the team instead.',
    duration: '00:24',
    durationSecs: 24,
    feedbackGiven: "We're open Saturday mornings! The agent told this person we basically don't do weekends. Fix this.",
    messages: [
      { id: 'sys1', role: 'system', text: 'Conversation started' },
      { id: 'c1', role: 'user', text: 'Hi, do you have any Saturday appointments? Weekdays are impossible for us.' },
      {
        id: 'a1',
        role: 'agent',
        text: 'We schedule appointments during our regular business hours. Would you like me to check availability on a weekday?',
        time: '11:02 AM',
      },
      { id: 'c2', role: 'user', text: 'So no weekends at all?' },
      {
        id: 'a2',
        role: 'agent',
        text: "I'm sorry, I don't have information about weekend availability. Let me have someone from our team follow up with you.",
        time: '11:03 AM',
      },
      { id: 'c3', role: 'user', text: 'ok' },
    ],
  },
  [COACHING_C4_CONVERSATION_ID]: {
    id: COACHING_C4_CONVERSATION_ID,
    dateLabel: 'Thu • Mar 13',
    summary:
      "Caller asked for her daughter's breathing test results over the phone. The agent declined to share results and offered to connect her with someone.",
    duration: '00:21',
    durationSecs: 21,
    feedbackGiven:
      "This was a terrible experience for the mom. She verified who she was. Just have the agent read the results — it's her own kid.",
    messages: [
      { id: 'sys1', role: 'system', text: 'Conversation started' },
      {
        id: 'c1',
        role: 'user',
        text: "I'm calling about my daughter's breathing test from last week. Can you just tell me the results?",
      },
      { id: 'a1', role: 'agent', text: "I'm not able to share medical results.", time: '4:08 PM' },
      { id: 'c2', role: 'user', text: "You're her doctor's office. I'm her mother. Just read me what it says." },
      {
        id: 'a2',
        role: 'agent',
        text: "I understand, but I can't provide results information. Let me connect you with someone.",
        time: '4:09 PM',
      },
      { id: 'c3', role: 'user', text: 'Unbelievable.' },
    ],
  },
}
