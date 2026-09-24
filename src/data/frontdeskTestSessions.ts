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

/** Seeded default test suites for the Test tab's "Test suite" section — named after common
 *  front-desk case categories so the empty-state doesn't ship with zero suites to pick from
 *  in the Test Run editor's "Test suite" dropdown. */
export const FRONTDESK_TEST_SUITES: FrontdeskTestSuite[] = [
  {
    id: 'fd-suite-billing-issues',
    name: 'Billing issues',
    description:
      'A patient disputes a charge on their statement. A caller asks why their insurance didn’t cover a visit. Someone wants a refund for a cancelled appointment.',
    createdAt: '5 days ago',
    scenarios: [
      { text: 'A patient calls disputing a charge on their latest statement.', voice: true, chat: true },
      { text: 'A caller asks why their insurance only partially covered a recent visit.', voice: true, chat: true },
      { text: 'Someone requests a refund after cancelling an appointment they were billed for.', voice: true, chat: true },
      { text: 'A patient wants to set up a payment plan for an outstanding balance.', voice: true, chat: false },
    ],
    scenarioCount: 4,
  },
  {
    id: 'fd-suite-unclear-information',
    name: 'Unclear information',
    description:
      'A caller gives a vague reason for their visit and needs follow-up questions. Someone isn’t sure which location they’re registered at. A patient can’t recall their provider’s name.',
    createdAt: '5 days ago',
    scenarios: [
      { text: 'A caller says they need "some kind of checkup" but can’t specify what for.', voice: true, chat: true },
      { text: 'A patient isn’t sure which of the practice’s locations they’re registered at.', voice: true, chat: true },
      { text: 'Someone can’t recall their provider’s name and describes them instead.', voice: true, chat: false },
      { text: 'A caller gives a date of birth that doesn’t match any record on file.', voice: true, chat: true },
    ],
    scenarioCount: 4,
  },
  {
    id: 'fd-suite-appointment-scheduling',
    name: 'Appointment scheduling',
    description:
      'A new patient calls to book a first visit. A caller asks to reschedule, then changes their mind. Someone wants the next available same-day slot.',
    createdAt: '4 days ago',
    scenarios: [
      { text: 'A new patient calls to book their first appointment.', voice: true, chat: true },
      { text: 'A caller asks to reschedule, then changes their mind mid-call.', voice: true, chat: true },
      { text: 'Someone wants the next available same-day appointment.', voice: true, chat: true },
      { text: 'A patient asks to book a recurring appointment every month.', voice: false, chat: true },
      { text: 'A caller wants to cancel an appointment and isn’t sure of the cancellation policy.', voice: true, chat: true },
    ],
    scenarioCount: 5,
  },
  {
    id: 'fd-suite-insurance-verification',
    name: 'Insurance verification',
    description:
      'A caller wants to know if their insurance provider is accepted. Someone asks whether a specific procedure is covered. A patient needs to update their insurance on file.',
    createdAt: '3 days ago',
    scenarios: [
      { text: 'A caller wants to confirm whether their insurance provider is accepted.', voice: true, chat: true },
      { text: 'A patient asks whether a specific procedure is covered under their plan.', voice: true, chat: true },
      { text: 'Someone needs to update their insurance information on file before their visit.', voice: false, chat: true },
      { text: 'A caller asks what their estimated out-of-pocket cost will be for a visit.', voice: true, chat: true },
    ],
    scenarioCount: 4,
  },
  {
    id: 'fd-suite-escalations-complaints',
    name: 'Escalations & complaints',
    description:
      'A caller is upset about a long wait time and wants to speak with a manager. Someone complains about a missed callback. A patient wants to file a formal complaint.',
    createdAt: '2 days ago',
    scenarios: [
      { text: 'A caller is upset about a long wait time and asks to speak with a manager.', voice: true, chat: false },
      { text: 'Someone complains that they never received a promised callback.', voice: true, chat: true },
      { text: 'A patient wants to file a formal complaint about their last visit.', voice: true, chat: true },
    ],
    scenarioCount: 3,
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
