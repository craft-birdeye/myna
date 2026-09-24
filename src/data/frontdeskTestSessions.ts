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
  /** Front desk (Sep 23) full-page Test tab only — set when this batch came from "Use test
   *  suite" rather than a one-off Test call/Test webchat run; the summary card reads it to
   *  prefix its title and reword "Tested by" to "Suite tested by", same convention as
   *  review-response's `TestRunBatch.suiteName`. */
  suiteName?: string
  /** Name given on the test-run page, e.g. "#1 test run". */
  runName?: string
  personaIds?: string[]
  qualityEvaluationIds?: string[]
}

/** Front desk (Sep 23) full-page Test tab only — a saved, reusable set of scenarios (same
 *  shape "Create test cases" already collects one-off), so "Use test suite" in the Run-test
 *  menu can re-run them without redefining scenarios every time. */
export interface FrontdeskTestSuite {
  id: string
  name: string
  scenarios: { text: string; voice: boolean; chat: boolean }[]
  /** Pre-formatted — e.g. "Sep 23, 2026". */
  createdAt: string
  /** How many scenarios the author asked AI to write. */
  scenarioCount?: number
  /** Free-text examples the author gave for those scenarios. */
  description?: string
  /** Personality ids selected for the suite. */
  personaIds?: string[]
  /** Response-quality evaluation ids the author turned on (latency included). */
  qualityEvaluationIds?: string[]
  uploadedFileName?: string
  /** True after Generate scenarios, until the suite finishes writing scenarios. */
  generating?: boolean
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

/** "Create Test Cases" modal — the sparkle "Generate" button on a scenario field prefills it
 *  with one of these, cycling through so repeat clicks (or several scenarios in one modal
 *  session) don't repeat the same suggestion. */
export const FRONTDESK_SCENARIO_SUGGESTIONS: string[] = [
  "A patient calls to reschedule their appointment to next week.",
  "A caller wants to know if their insurance covers a cleaning this month.",
  "Someone wants to cancel their Friday appointment.",
  "A patient asks what time the office closes today.",
  "A caller wants to book a new patient appointment for an annual physical.",
  "Someone wants to know if a specific insurance provider is accepted.",
]

/** Generic reply used for sessions created from the "Create Test Cases" modal — there's no
 *  real model behind these, so every run reads as passing with the same canned acknowledgement. */
export const FRONTDESK_CUSTOM_TEST_REPLY =
  "Sure, I can help with that — let me take care of it for you."
