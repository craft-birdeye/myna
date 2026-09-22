import voicemailSample from '../assets/voicemail_sample.mp3'

/** Front desk (Myna) Test tab — dummy test session history, grouped into batches (one per
 *  timestamp) the same way Jay & Robin's Test tab groups reviews by "Run test" confirmation. */
export interface FrontdeskTestTranscriptLine {
  speaker: 'business' | 'user'
  text: string
}

export interface FrontdeskTestSession {
  id: string
  /** Short label for the LHS row, e.g. "Book an appointment". */
  title: string
  channel: 'voice' | 'chat'
  outcome: 'passed' | 'failed'
  /** Voice sessions only. */
  durationSecs?: number
  audioUrl?: string
  transcript: FrontdeskTestTranscriptLine[]
}

export interface FrontdeskTestBatch {
  sessions: FrontdeskTestSession[]
  /** Pre-formatted — e.g. "Today, 2:15 PM". */
  testedAt: string
  /** Who ran this test — a person's name, or 'Myna' for AI-generated batches (shown with the
   *  sparkle glyph instead of a person). */
  testedBy: string
}

export const FRONTDESK_TEST_BATCHES: FrontdeskTestBatch[] = [
  {
    testedAt: 'Sep 18, 4:30 PM',
    testedBy: 'Haresh',
    sessions: [
      {
        id: 'fd-test-billing-dispute',
        title: 'Billing dispute escalation',
        channel: 'chat',
        outcome: 'passed',
        transcript: [
          { speaker: 'user', text: "I was charged twice for my last visit and I want it fixed." },
          {
            speaker: 'business',
            text: "I'm sorry about that — billing disputes need a real person to sort out safely, so let me connect you with our front desk team. They'll have your account pulled up in a moment.",
          },
          { speaker: 'user', text: 'Okay, thank you.' },
          { speaker: 'business', text: "You're welcome — hang tight, someone will be with you shortly." },
        ],
      },
    ],
  },
  {
    testedAt: 'Sep 20, 9:05 AM',
    testedBy: 'Raynil',
    sessions: [
      {
        id: 'fd-test-reschedule',
        title: 'Reschedule appointment',
        channel: 'voice',
        outcome: 'failed',
        durationSecs: 42,
        audioUrl: voicemailSample,
        transcript: [
          { speaker: 'user', text: 'I need to move my Thursday appointment to next week.' },
          { speaker: 'business', text: 'Sure — can I get your date of birth to pull up your appointment?' },
          { speaker: 'user', text: "It's the 14th of March." },
          {
            speaker: 'business',
            text: "I'm not finding an appointment under that date — could you also give me the phone number on file?",
          },
        ],
      },
    ],
  },
  {
    testedAt: 'Yesterday, 10:42 AM',
    testedBy: 'Akhil',
    sessions: [
      {
        id: 'fd-test-insurance',
        title: 'Insurance coverage question',
        channel: 'chat',
        outcome: 'passed',
        transcript: [
          { speaker: 'user', text: 'Do you take Blue Cross Blue Shield?' },
          {
            speaker: 'business',
            text: 'Yes, we accept Blue Cross Blue Shield at all of our locations. Would you like help booking a visit?',
          },
          { speaker: 'user', text: 'Yes please, sometime next week.' },
          { speaker: 'business', text: "Great — what day and time works best for you?" },
        ],
      },
    ],
  },
  {
    testedAt: 'Today, 2:15 PM',
    testedBy: 'Rupa',
    sessions: [
      {
        id: 'fd-test-book-appointment',
        title: 'Book an appointment',
        channel: 'voice',
        outcome: 'passed',
        durationSecs: 64,
        audioUrl: voicemailSample,
        transcript: [
          { speaker: 'user', text: "Hi, I'd like to book a new patient appointment." },
          { speaker: 'business', text: "I'd be happy to help. What's the reason for the visit?" },
          { speaker: 'user', text: 'Just an annual physical.' },
          {
            speaker: 'business',
            text: "Got it. I have an opening this Thursday at 10:30 AM with Dr. Baker — does that work?",
          },
          { speaker: 'user', text: 'That works great, thank you.' },
          { speaker: 'business', text: "You're all set for Thursday at 10:30 AM. See you then!" },
        ],
      },
    ],
  },
]

/** "Generate testcases" pool — revealed one batch at a time, each tagged `testedBy: 'Myna'`
 *  (shown with the sparkle glyph) since the AI authored them, not a person. */
export const FRONTDESK_GENERATED_TEST_POOL: FrontdeskTestBatch[] = [
  {
    testedAt: 'Just now',
    testedBy: 'Myna',
    sessions: [
      {
        id: 'fd-test-gen-verify-insurance',
        title: 'Verify insurance eligibility',
        channel: 'chat',
        outcome: 'passed',
        transcript: [
          { speaker: 'user', text: "Can you check if I'm covered for a cleaning this month?" },
          {
            speaker: 'business',
            text: "Let me check — yes, your plan covers one cleaning every six months, and you're eligible now.",
          },
        ],
      },
    ],
  },
  {
    testedAt: 'Just now',
    testedBy: 'Myna',
    sessions: [
      {
        id: 'fd-test-gen-cancel-appointment',
        title: 'Cancel appointment',
        channel: 'voice',
        outcome: 'passed',
        durationSecs: 29,
        audioUrl: voicemailSample,
        transcript: [
          { speaker: 'user', text: "I need to cancel my appointment on Friday." },
          { speaker: 'business', text: "No problem — I've cancelled your Friday appointment. Would you like to rebook?" },
          { speaker: 'user', text: 'Not right now, thanks.' },
          { speaker: 'business', text: "Sounds good — call us back whenever you're ready." },
        ],
      },
    ],
  },
  {
    testedAt: 'Just now',
    testedBy: 'Myna',
    sessions: [
      {
        id: 'fd-test-gen-hours',
        title: 'General inquiry — office hours',
        channel: 'chat',
        outcome: 'passed',
        transcript: [
          { speaker: 'user', text: 'What time do you close today?' },
          { speaker: 'business', text: "We're open until 6 PM today. Anything else I can help with?" },
        ],
      },
    ],
  },
]
