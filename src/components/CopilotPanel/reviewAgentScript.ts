/**
 * Scripted "create a review agent" demo flow for the Copilot.
 *
 * Step 0 is the opening — it plays right after the user sends "create a review agent",
 * so it has no `user` line of its own. Every later step is one exchange: the pre-written
 * `user` line is revealed, its `thinking` lines play transiently, then `reply` lands.
 * The panel advances one step each time the user taps the composer.
 */
export interface CopilotScriptStep {
  /** Pre-written user line, revealed when the demo advances. Omitted on the opening step. */
  user?: string
  /** Sequential "thinking" lines shown transiently before the reply. */
  thinking?: string[]
  /** The Copilot's reply for this step. */
  reply: string
}

export function isReviewAgentTrigger(text: string): boolean {
  return /review\s*agent|respond(ing)?\s+to\s+reviews|review\s+respon/i.test(text)
}

/** First Library-tab agent for Review response — canvas target after "Build it". */
export const REVIEW_AGENT_BUILT_NAME = 'Review response agent replying autonomously'

export const REVIEW_AGENT_SCRIPT: CopilotScriptStep[] = [
  // 0 — opening (plays right after the user sends "create a review agent")
  {
    thinking: [
      'Scanning your review profile…',
      '1,035 reviews · 3.8★ average · 2.4K awaiting a response',
      'Top sources: Google, Facebook, Yelp',
    ],
    reply:
      "You're getting about 120 new reviews a week and 2,400 are still unanswered. I'll build an agent that triages every review, writes an on-brand reply, and publishes it — let me get a few details right.\n\nFirst: which review sources should it watch — Google, Facebook, Yelp, or all of them?",
  },
  // 1 — sources
  {
    user: 'Watch all sources.',
    thinking: ['Adding the review trigger…'],
    reply:
      "Done — it'll trigger on every new or updated review across all sources.\n\nAnd which locations should it cover: all 4, or just a few to start?",
  },
  // 2 — locations
  {
    user: 'All 4 locations.',
    reply:
      'Scoped to all 4 locations.\n\nNow, spam — about 7% of what comes in isn\'t a real customer, so I\'ll add a triage step up front so we never reply to those.',
    thinking: ['Sampling your last 200 reviews for spam patterns…', 'Found 14 likely spam — crypto promos, competitor links, "test" reviews'],
  },
  // 3 — spam email clarifier (the one you asked for)
  {
    user: 'Makes sense.',
    reply: 'Do you want to receive alerts for these spam reviews in your email?',
  },
  // 4 — which email
  {
    user: 'Yes, email me the spam alerts.',
    reply: 'Which address should they go to — your account email (john@birdeye.com), or a different one?',
  },
  // 5 — email set → builds spam branch, moves to negative reviews
  {
    user: 'Use my account email.',
    thinking: ['Adding the spam branch + email alert…'],
    reply:
      "Set. Spam reviews now branch off and email you an alert so your team can flag them on the review site.\n\nNow the genuine ones — negative reviews especially. 41% of your negative reviews name a staff member. My recommendation: never name staff in a negative reply — acknowledge it and take the conversation offline. Should unhappy customers be invited to call or email the business?",
  },
  // 6 — contact + severity
  {
    user: 'Yes — phone and email.',
    reply:
      "Good. I'll also flag severe cases — legal threats or safety issues — as CRITICAL and recommend an immediate call.\n\nFor writing style, I suggest three rules: reply in the review's language, keep it under 60 words, and add one SEO keyword to positive replies only. Keep all three?",
  },
  // 7 — style → autonomy question
  {
    user: 'Keep all three.',
    thinking: ['Composing the response rules from your answers…'],
    reply:
      "Last decision, and it's the big one: should replies post automatically, or wait in the dashboard for your approval?",
  },
  // 8 — autonomy
  {
    user: 'Post automatically.',
    reply:
      "Smart to keep a safety net — I'll post directly with a 15-minute hold so your team can catch anything first. That's everything I need.",
  },
  // 9 — build
  {
    user: 'Build it.',
    thinking: [
      'Wiring the trigger…',
      'Writing the triage prompts…',
      'Composing the response rules…',
      'Connecting the response handler…',
    ],
    reply:
      'Your review response agent is ready:\n\n• Triggers on every new review across all sources, all 4 locations\n• Triages spam → emails you an alert\n• Analyzes genuine reviews (sentiment, topics, severity, staff mentions)\n• Writes an on-brand reply in the review\'s language, under 60 words\n• Publishes directly with a 15-minute hold\n\nReview it on the canvas, then hit Publish when you\'re happy.',
  },
]
