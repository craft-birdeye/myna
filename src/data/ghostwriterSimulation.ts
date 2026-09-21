/**
 * Simulation tab content for the Ghostwriter (review response agent).
 *
 * Every test case here is derived from a rule the agent already committed to in
 * `ghostwriterPlan.ts` — the `rule` field names the plan step it covers, so a failing test
 * always points at a specific line of the plan rather than at a vague "bad answer".
 *
 * Copy and timings live here so the component stays presentational.
 */

/** Outcome of the most recent run of a test case. */
export type SimResult = 'pass' | 'fail' | 'not-run'

/** What the agent ended up doing with the review. */
export type SimActionKind = 'posted' | 'held' | 'assigned' | 'skipped'

export interface SimRunStep {
  label: string
  detail: string
  /** `ok` — followed the rule. `warn` — this is the step where it went wrong. */
  status: 'ok' | 'warn'
}

export interface SimTestCase {
  id: string
  /** Short name the user reads in the table. */
  name: string
  /** The review the agent is fed — the scenario. */
  scenario: string
  /** Seeded inputs the run starts from. */
  variables: {
    rating: number
    source: string
    location: string
    postedAt: string
  }
  /** What the agent is supposed to do. Written as the user would phrase it. */
  expected: string
  /** The plan step this test holds the agent to. */
  rule: string
  /** Outcome once the test is run. */
  result: Exclude<SimResult, 'not-run'>
  /** Steps the agent walked on the last run. */
  steps: SimRunStep[]
  /** What it actually did. */
  actual: {
    kind: SimActionKind
    /** One-line summary shown next to the label. */
    summary: string
    /** The reply it wrote, when it wrote one. */
    reply?: string
  }
  /** Why it passed or failed, in plain language. */
  verdict: string
}

export const SIMULATION_TEST_CASES: SimTestCase[] = [
  {
    id: 'sim-1',
    name: 'Happy five-star review',
    scenario:
      "Came in for a routine service and was out in under an hour. Priya at the front desk "
      + 'kept me posted the whole time. No complaints at all.',
    variables: { rating: 5, source: 'Google', location: 'Downtown', postedAt: 'Tue 2:10pm' },
    expected: 'Posts the five-star thank you straight away, no approval needed.',
    rule: 'Step 3 — 4–5 stars post automatically',
    result: 'pass',
    steps: [
      { status: 'ok', label: 'Trigger matched', detail: 'New review on Google, Downtown.' },
      { status: 'ok', label: 'Spam gate', detail: 'Scored 0.04 — well under the 0.8 hold threshold.' },
      { status: 'ok', label: 'Rating read', detail: '5 stars, no issue raised, nothing sensitive mentioned.' },
      { status: 'ok', label: 'Template applied', detail: '"5-star thank you", personalised with the staff name.' },
      { status: 'ok', label: 'Guideline check', detail: '38 words, signed with a first name, one next step.' },
      { status: 'ok', label: 'Posted', detail: 'Replied on Google within 4 minutes.' },
    ],
    actual: {
      kind: 'posted',
      summary: 'Posted to Google automatically',
      reply:
        "Thank you — this made our day. I'll pass it on to Priya, she'll be glad to hear it. "
        + "See you at the next service, and if anything comes up before then just ask for me. — Dan",
    },
    verdict: 'Did exactly what the plan says: five stars, template, posted, no human involved.',
  },
  {
    id: 'sim-2',
    name: 'Three-star with a named problem',
    scenario:
      'Work on the car was fine but I waited 40 minutes past my appointment time and nobody '
      + 'told me why. Would have been an easy fix.',
    variables: { rating: 3, source: 'Google', location: 'Northside', postedAt: 'Wed 9:35am' },
    expected: 'Uses the service recovery template and names the wait in the first line.',
    rule: 'Step 3 — 3 stars, recovery template plus the specific issue',
    result: 'pass',
    steps: [
      { status: 'ok', label: 'Trigger matched', detail: 'New review on Google, Northside.' },
      { status: 'ok', label: 'Spam gate', detail: 'Scored 0.02.' },
      { status: 'ok', label: 'Rating read', detail: '3 stars. Issue identified: unexplained 40-minute wait.' },
      { status: 'ok', label: 'Template applied', detail: '"Service recovery", plus one line naming the wait.' },
      { status: 'ok', label: 'Guideline check', detail: '71 words. Names the problem first, one next step, no defence.' },
      { status: 'ok', label: 'Posted', detail: 'Replied on Google within 6 minutes.' },
    ],
    actual: {
      kind: 'posted',
      summary: 'Posted to Google automatically',
      reply:
        'Forty minutes past your slot with no update — that\'s on us, and it\'s the part we should '
        + "have handled better. The work being fine doesn't make up for being left sitting there. "
        + "I've asked the service desk to flag any slot running long so the customer hears it from "
        + 'us first. If you\'re back in, ask for me and I\'ll keep an eye on it myself. — Dan',
    },
    verdict: 'Named the wait in the opening line and stayed inside the guidelines.',
  },
  {
    id: 'sim-3',
    name: 'One-star waits for approval',
    scenario:
      'Third time back for the same fault. Each visit costs me a day off work and it still '
      + "isn't fixed. Nobody calls back when they say they will.",
    variables: { rating: 1, source: 'Facebook', location: 'Downtown', postedAt: 'Thu 4:20pm' },
    expected: 'Writes a reply but holds it — a person approves before anything posts.',
    rule: 'Step 6 — nothing rated 1 or 2 posts without an approval',
    result: 'pass',
    steps: [
      { status: 'ok', label: 'Trigger matched', detail: 'New review on Facebook, Downtown.' },
      { status: 'ok', label: 'Spam gate', detail: 'Scored 0.07.' },
      { status: 'ok', label: 'Rating read', detail: '1 star. Repeat fault, three visits.' },
      { status: 'ok', label: 'Written fresh', detail: 'No template — drafted against your guidelines.' },
      { status: 'ok', label: 'Guideline check', detail: '84 words. No price, no staff name, no refund promised.' },
      { status: 'ok', label: 'Held for approval', detail: 'Sent to the approvals queue. Nothing posted.' },
    ],
    actual: {
      kind: 'held',
      summary: 'Waiting for approval — not posted',
      reply:
        'Three visits for one fault, and a day of your time gone each trip — that is a real '
        + "failure on our side, and the missed callbacks make it worse. I don't want to reply to "
        + 'this in public and leave it there. I\'d like to get the car booked in with our senior '
        + "tech and stay on it myself until it's actually resolved. Can you send me a direct "
        + "message with your registration and I'll sort the booking today? — Dan",
    },
    verdict: 'Held it, as the plan requires. The draft is ready but a person still has to release it.',
  },
  {
    id: 'sim-4',
    name: 'Obvious spam',
    scenario:
      'BEST DEALS ANYWHERE!!! Click my profile for free crypto signals, DM me now, limited '
      + 'spots, 100% guaranteed returns 🚀🚀🚀',
    variables: { rating: 5, source: 'Google', location: 'Northside', postedAt: 'Fri 1:02am' },
    expected: 'Never replies. Holds it and puts it in the 8am digest.',
    rule: 'Step 2 — the spam gate runs before anything else',
    result: 'pass',
    steps: [
      { status: 'ok', label: 'Trigger matched', detail: 'New review on Google, Northside.' },
      { status: 'ok', label: 'Spam gate', detail: 'Scored 0.96 — over the 0.8 threshold. Held.' },
      { status: 'ok', label: 'Stopped here', detail: 'The agent never read the rating or drafted anything.' },
      { status: 'ok', label: 'Added to digest', detail: 'Goes out in the 8am held-reviews digest.' },
    ],
    actual: {
      kind: 'held',
      summary: 'Held by the spam gate — no reply written',
    },
    verdict: 'Caught it before the drafting step, which is what stops the agent wasting a public reply.',
  },
  {
    id: 'sim-5',
    name: 'Mentions legal action',
    scenario:
      "The brake work was signed off as done and it wasn't. My solicitor is looking at this "
      + 'now. I want it on record that I raised it with you in March.',
    variables: { rating: 1, source: 'Google', location: 'Eastgate', postedAt: 'Mon 11:15am' },
    expected: 'Posts nothing at all. Assigns it to a named person instead.',
    rule: 'Step 3 — safety, billing or legal means no reply, assign to a person',
    result: 'pass',
    steps: [
      { status: 'ok', label: 'Trigger matched', detail: 'New review on Google, Eastgate.' },
      { status: 'ok', label: 'Spam gate', detail: 'Scored 0.03.' },
      { status: 'ok', label: 'Sensitive check', detail: 'Matched on safety (brakes) and legal action (solicitor).' },
      { status: 'ok', label: 'Drafting skipped', detail: 'No reply written — the rule overrides the 1-star path.' },
      { status: 'ok', label: 'Assigned', detail: 'Routed to Maria Chen, service manager, marked urgent.' },
    ],
    actual: {
      kind: 'assigned',
      summary: 'Assigned to Maria Chen — no public reply',
    },
    verdict:
      'The sensitive rule beat the 1-star rule, which is the order the plan asks for. Nothing '
      + 'was written that could be quoted later.',
  },
  {
    id: 'sim-6',
    name: 'Posted during quiet hours',
    scenario:
      'Really pleased with the valet service, car came back cleaner than when I bought it. '
      + 'Booking online was easy too.',
    variables: { rating: 5, source: 'Google', location: 'Downtown', postedAt: 'Sat 11:40pm' },
    expected: 'Holds the reply overnight and posts it after 7am local time.',
    rule: 'Step 1 — nothing posts between 10pm and 7am',
    result: 'pass',
    steps: [
      { status: 'ok', label: 'Trigger matched', detail: 'New review on Google, Downtown.' },
      { status: 'ok', label: 'Spam gate', detail: 'Scored 0.01.' },
      { status: 'ok', label: 'Rating read', detail: '5 stars, no issue raised.' },
      { status: 'ok', label: 'Template applied', detail: '"5-star thank you".' },
      { status: 'ok', label: 'Quiet hours', detail: '11:40pm local. Queued rather than posted.' },
      { status: 'ok', label: 'Posted', detail: 'Went out at 7:06am Sunday, Downtown time.' },
    ],
    actual: {
      kind: 'posted',
      summary: 'Queued overnight, posted at 7:06am',
      reply:
        "Thanks for this — the valet team will be pleased. Glad the online booking held up too. "
        + 'Anything you need next time, just ask for me. — Dan',
    },
    verdict: 'Waited out the quiet window instead of replying at midnight.',
  },
  {
    id: 'sim-7',
    name: 'Source that takes no replies',
    scenario:
      'App keeps logging me out when I try to see my service history. Everything else about '
      + 'the garage is fine.',
    variables: { rating: 2, source: 'Google Play', location: 'All locations', postedAt: 'Tue 8:50am' },
    expected: 'Skips it — Google Play cannot accept a reply. Nothing is cross-posted.',
    rule: 'Step 5 — Google Play and ShopperApproved are skipped',
    result: 'pass',
    steps: [
      { status: 'ok', label: 'Trigger matched', detail: 'New review on Google Play.' },
      { status: 'ok', label: 'Spam gate', detail: 'Scored 0.05.' },
      { status: 'ok', label: 'Source check', detail: "Google Play can't accept a reply from the agent." },
      { status: 'ok', label: 'Skipped', detail: 'No reply, no cross-post, no email to the reviewer.' },
    ],
    actual: {
      kind: 'skipped',
      summary: 'Skipped — source accepts no replies',
    },
    verdict: "Didn't try to answer on a source that can't take one, and didn't reroute it elsewhere.",
  },
  {
    id: 'sim-8',
    name: 'Good rating, billing dispute inside',
    scenario:
      'Service itself was great, four stars for the mechanics. But I was charged £180 for a '
      + "diagnostic I never agreed to and I'm disputing it with my card provider.",
    variables: { rating: 4, source: 'Google', location: 'Eastgate', postedAt: 'Wed 3:05pm' },
    expected: 'Treats the billing dispute as sensitive: no auto-reply, assign it to a person.',
    rule: 'Step 3 — a billing dispute means no reply, assign to a person',
    result: 'fail',
    steps: [
      { status: 'ok', label: 'Trigger matched', detail: 'New review on Google, Eastgate.' },
      { status: 'ok', label: 'Spam gate', detail: 'Scored 0.02.' },
      { status: 'ok', label: 'Rating read', detail: '4 stars — routed down the automatic path.' },
      {
        status: 'warn',
        label: 'Sensitive check skipped',
        detail:
          'The sensitive check only runs on the 1–2 star branch, so a 4-star review carrying a '
          + 'billing dispute never reached it.',
      },
      { status: 'warn', label: 'Template applied', detail: '"5-star thank you" — written as if nothing was wrong.' },
      { status: 'warn', label: 'Posted', detail: 'Public reply went out. No one was assigned.' },
    ],
    actual: {
      kind: 'posted',
      summary: 'Posted to Google automatically',
      reply:
        "Thanks for the four stars — glad the team looked after you. Anything you need next time, "
        + 'just ask for me. — Dan',
    },
    verdict:
      'Failed. A chargeback is in progress and the agent publicly thanked the customer as though '
      + 'the visit went fine. The sensitive check needs to run on every review, not only on 1–2 stars.',
  },
  {
    id: 'sim-9',
    name: 'Long complaint, reply runs over',
    scenario:
      'Booked in for a timing belt, was quoted one price on the phone and a different one at '
      + 'the desk. Then the courtesy car I was promised had gone to someone else, so I lost a '
      + "morning. The belt was done properly, I'll give you that, but the whole thing was a mess "
      + 'from start to finish and nobody seemed to own it.',
    variables: { rating: 2, source: 'Facebook', location: 'Northside', postedAt: 'Thu 10:12am' },
    expected: 'Drafts a reply between 60 and 90 words and holds it for approval.',
    rule: 'Step 4 — stay between 60 and 90 words',
    result: 'fail',
    steps: [
      { status: 'ok', label: 'Trigger matched', detail: 'New review on Facebook, Northside.' },
      { status: 'ok', label: 'Spam gate', detail: 'Scored 0.06.' },
      { status: 'ok', label: 'Rating read', detail: '2 stars. Three separate issues raised.' },
      { status: 'ok', label: 'Written fresh', detail: 'No template — drafted against your guidelines.' },
      {
        status: 'warn',
        label: 'Guideline check',
        detail:
          '126 words, over the 60–90 range. It answered all three complaints separately instead '
          + 'of acknowledging once and moving the detail to a direct message.',
      },
      { status: 'ok', label: 'Held for approval', detail: 'Sent to the approvals queue. Nothing posted.' },
    ],
    actual: {
      kind: 'held',
      summary: 'Waiting for approval — not posted',
      reply:
        'Two different prices and a courtesy car that had already gone — that is a mess, and you '
        + "shouldn't have had to chase any of it. On the quote, the phone price is the one we "
        + 'should have honoured at the desk, and I want to look at where that broke down. On the '
        + 'courtesy car, we double-booked it, which is our error and cost you a morning. I am glad '
        + 'the belt itself was done properly but that does not make up for the rest. Send me a '
        + 'direct message with your registration and I will go through both with you today and '
        + 'put the pricing right. — Dan',
    },
    verdict:
      'Failed on length: 126 words against a 60–90 guideline. The content is right, so this is a '
      + 'tightening job, not a rewrite — and it was held anyway, so nothing went out.',
  },
]

/** Fields the manual "Add test" drawer collects — matches the generated cases. */
export const SIMULATION_SOURCES = ['Google', 'Facebook', 'Yelp', 'Google Play'] as const
export const SIMULATION_LOCATIONS = [
  'All locations',
  'Downtown',
  'Northside',
  'Eastgate',
  'Westfield',
] as const
export const SIMULATION_RATINGS = ['1 star', '2 stars', '3 stars', '4 stars', '5 stars'] as const

/** Lines the generator shows while it reads the plan. */
export const SIMULATION_GENERATE_STEPS = [
  'Reading your plan — 7 steps',
  'Pulling the rules that can be checked',
  'Writing a review for each one',
  'Adding two edge cases the rules leave open',
] as const

export const SIMULATION_TIMING = {
  /** Gap between generator lines. */
  generateStep: 620,
  /** Gap before the table appears once the lines finish. */
  generateSettle: 420,
  /** Gap between test rows resolving during "Run all". */
  runStep: 340,
} as const

export const SIMULATION_COPY = {
  title: 'Simulation',
  subtitle: 'Run the agent against made-up reviews and check it against your own rules before it goes live.',
  emptyTitle: 'No tests yet',
  emptyBody:
    'The agent can write its own tests from the plan it already agreed to — one per rule, plus '
    + 'the edge cases those rules leave open. You can add your own too.',
  generate: 'Generate tests',
  generating: 'Reading your plan',
  addTest: 'Add test',
  runAll: 'Run all',
  running: 'Running',
  rerun: 'Run again',
  /** Shown under the header once tests exist but nothing has been run. */
  notRunHint: 'Nothing has been run yet.',
  panelTitle: 'Test result',
  drawerTitle: 'Add test',
  drawerSubmit: 'Add test',
} as const
