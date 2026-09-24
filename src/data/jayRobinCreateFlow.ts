/**
 * Jay & Robin's create flow — the story the copilot tells from "build me an agent" to "your
 * agent is ready", in five beats:
 *
 *   1. one line of intro, then a "Working…" pass over the account (narration + tool calls);
 *   2. three questions, asked back to back, one card at a time;
 *   3. a brief plan — five pointers, each of which is a thing that gets built;
 *   4. "Create agent" executes those pointers one by one inside a second "Working…" pass,
 *      then offers the canvas changes as "N nodes updated · Accept / Undo";
 *   5. a closing line pointing at the canvas and the Test tab.
 *
 * Every string the flow says lives here so the story can be rewritten without touching the
 * component.
 */
import type { WorkPhase, WorkTool } from '../components/AgentActivityHeader/AgentWorkSequence'
import type { QuestionCardOption } from '../components/GhostwriterQuestionCard/GhostwriterQuestionCard.types'

/* ─── Beat 1: intro + the analysis pass ──────────────────────────────────────── */

export const JR_INTRO_LINE =
  'A review response agent — on it. Let me look at how you handle reviews today before I ask you anything.'

export const JR_ANALYSIS_PHASES: WorkPhase[] = [
  {
    thought:
      'I’ll start with the account itself — volume, sources and how much already gets answered — '
      + 'before asking a single question I could answer myself.',
    toolsLabel: 'Reading your account',
    status: 'Fetching previous responses',
    tools: [
      { icon: 'reviews', label: 'Pulled 1,035 reviews across 4 locations, last 12 months' },
      { icon: 'forum', label: 'Grouped 742 existing replies by rating, source and author' },
      {
        icon: 'description',
        label: 'Matched every reply against your 4 saved templates',
        detail: '5-star thank you · Service recovery · Apology · Referral thanks',
      },
    ],
    findings: [
      'Four templates cover 73% of replies and handle the positive ones well — the 5-star '
      + 'thank you alone is 62% of them. The 31 replies to 3★ or less match no template; '
      + 'someone on the team writes those by hand.',
    ],
  },
  {
    thought:
      'Those 31 are the most valuable thing in the account. I’d rather learn the method than '
      + 'paper over it with a template.',
    toolsLabel: 'Learning how your team writes the hard ones',
    status: 'Analysing responses',
    tools: [
      { icon: 'menu_book', label: 'Re-read 31 human-written replies end to end' },
      { icon: 'insights', label: 'Extracted the moves they have in common' },
      { icon: 'block', label: 'Checked what they deliberately never do' },
    ],
    findings: [
      'Six consistent rules: name the problem in the first line, acknowledge before explaining, '
      + 'offer one next step with a named person, move billing into a direct message, sign off '
      + 'with a real first name, stay between 60 and 90 words.',
    ],
  },
  {
    thought: 'Next, where the reviews actually land — and which of those places will take a reply.',
    toolsLabel: 'Checking where your reviews come from',
    status: 'Fetching review sources',
    tools: [
      { icon: 'hub', label: 'Scanned connected sources' },
      {
        icon: 'lock_open',
        label: 'Checked reply permissions on each',
        detail: 'Google ✓ · Facebook ✓ · Google Play — read only · ShopperApproved — read only',
      },
      { icon: 'bar_chart', label: 'Compared that against where reviews are landing' },
    ],
    findings: [
      'Google and Facebook accept replies and carry 91% of volume. Google Play and '
      + 'ShopperApproved can’t take a reply yet, so they’re skipped.',
    ],
  },
  {
    thought: 'Anything that gets answered publicly needs a spam gate in front of it.',
    toolsLabel: 'Screening for spam',
    status: 'Screening for spam',
    tools: [
      { icon: 'shield', label: 'Ran all 1,035 reviews through the spam model' },
      { icon: 'flag', label: 'Flagged 14 scoring above the 0.8 threshold' },
      { icon: 'search', label: 'Checked whether any of those had been replied to' },
    ],
    findings: [
      '14 look like non-customers. None were answered — but nothing currently stops it. '
      + 'The agent will hold anything above 0.8 and never reply to it publicly.',
    ],
  },
]

/* ─── Beat 2: three questions, back to back ───────────────────────────────────── */

export interface JrQuestion {
  id: string
  question: string
  hint?: string
  options?: readonly QuestionCardOption[]
  /** Free-text row under the options (the "Other…" escape) — or the only answer when there
   *  are no options. */
  freeText?: { placeholder: string; submitLabel: string }
  /** What the echoed turn says if the question is skipped. */
  skipAnswer: string
}

export const JR_QUESTIONS_LEAD_IN =
  'I have what I need from the account. Three quick questions, then I’ll show you the plan.'

export const JR_QUESTIONS: JrQuestion[] = [
  {
    id: 'publish',
    question: 'How much should it publish without a person looking first?',
    options: [
      {
        id: 'split',
        label: 'Auto-post 4–5★, hold 3★ and below',
        description: 'Positive replies go out on their own; anything critical waits for approval.',
        recommended: true,
      },
      {
        id: 'all',
        label: 'Auto-post everything',
        description: 'Every reply publishes on its own — fastest, least oversight.',
      },
      {
        id: 'none',
        label: 'Hold everything for approval',
        description: 'Nothing publishes until someone approves it.',
      },
    ],
    freeText: { placeholder: 'Other…', submitLabel: 'Submit' },
    skipAnswer: 'Skipped — auto-post 4–5★, hold 3★ and below',
  },
  {
    id: 'scope',
    question: 'Which locations should it cover?',
    options: [
      {
        id: 'all',
        label: 'All 4 locations',
        description: 'One policy everywhere from day one.',
        recommended: true,
      },
      {
        id: 'pilot',
        label: 'Start with one as a pilot',
        description: 'Quieter first week — roll out to the rest once you’ve seen it work.',
      },
    ],
    freeText: { placeholder: 'Other…', submitLabel: 'Submit' },
    skipAnswer: 'Skipped — all 4 locations',
  },
  {
    id: 'digest',
    question: 'Where should the daily digest of held reviews go?',
    hint: 'Sent at 8am with everything the spam gate held the day before.',
    freeText: { placeholder: 'name@company.com', submitLabel: 'Use this address' },
    skipAnswer: 'Skipped — send it to the account owner',
  },
]

/* ─── Beat 3: the plan ───────────────────────────────────────────────────────── */

export const JR_PLAN_LEAD_IN = 'Here’s the plan — five steps, built in this order.'

export const JR_PLAN_CARD = {
  title: 'Review response agent',
  badge: 'Plan',
  meta: 'Built from 1,035 reviews · 31 hand-written replies · your 3 answers',
  detailsLabel: 'See details',
  detailsOpenLabel: 'Details open',
  createLabel: 'Create agent',
} as const

export interface JrPlanStep {
  /** Short label — the row the build pass checks off. */
  title: string
  /** What the header says while this step's actions run ("Connecting sources"). */
  status: string
  /** What the agent says before it starts the step — narration inside the build pass. */
  narration: string
  /** One line of what it does — the pointer itself. */
  text: string
  /** The concrete actions the build pass runs for this step. */
  actions: WorkTool[]
  /** The canvas node this step adds — listed in the "N nodes updated" review card; `id` is
   *  the workflow node it opens on the canvas. */
  node: { id: string; icon: string; label: string }
}

/** The plan reads back what was answered, so the five pointers are built from the answers. */
export function buildJrPlan(answers: Record<string, string>): JrPlanStep[] {
  const publish = answers.publish ?? ''
  const scope = answers.scope ?? ''
  const digest = answers.digest ?? ''

  const pilot = /pilot|one/i.test(scope) && !/all/i.test(scope)
  const holdAll = /hold everything|everything for approval/i.test(publish)
  const postAll = /auto-post everything/i.test(publish)
  const digestTo = /@/.test(digest) ? digest : 'the account owner'
  const where = pilot ? 'your pilot location' : 'all 4 locations'

  return [
    {
      title: 'Watch Google and Facebook',
      status: 'Connecting review sources',
      narration: 'First, the trigger. It fires on every new or edited review from the two sources that accept replies.',
      text: `Trigger on every new or edited review on Google and Facebook across ${where}.`,
      actions: [
        { icon: 'storefront', label: 'Connected Google Business Profile (4 locations)' },
        { icon: 'thumb_up', label: 'Connected Facebook page' },
        { icon: 'notifications_active', label: 'Subscribed to new and edited review events' },
      ],
      node: { id: 'rr-1', icon: 'bolt', label: 'When a review is received or updated' },
    },
    {
      title: 'Spam gate and digest',
      status: 'Setting up the spam gate',
      narration: 'Next the gate, so nothing that looks like a non-customer ever gets a public reply.',
      text: `Hold anything the spam model scores above 0.8 — never answer it publicly — and send the digest to ${digestTo} at 8am.`,
      actions: [
        { icon: 'shield', label: 'Set the spam threshold at 0.8' },
        { icon: 'inbox', label: 'Created the held-reviews queue' },
        { icon: 'mail', label: `Scheduled the daily digest to ${digestTo}, 8am` },
      ],
      node: { id: 'rr-2', icon: 'shield', label: 'Triage review' },
    },
    {
      title: 'Route by rating',
      status: 'Wiring the routing',
      narration: holdAll
        ? 'Now the routing. Everything drafts, nothing publishes without a person.'
        : postAll
          ? 'Now the routing. Templates for the positive ones, fresh writing for the rest — all published automatically.'
          : 'Now the routing. Templates for 4–5★ go out on their own; 3★ and below draft and wait.',
      text: holdAll
        ? 'Draft every reply — 4–5★ from your templates, 3★ and below written fresh — and hold all of them for approval.'
        : postAll
          ? 'Post 4–5★ from your templates and write 3★ and below fresh, all published automatically.'
          : 'Post 4–5★ from your templates automatically; write 3★ and below fresh and hold them for approval.',
      actions: [
        { icon: 'star', label: 'Mapped 4–5★ to the "5-star thank you" template' },
        { icon: 'star_half', label: 'Mapped 3★ to "Service recovery" plus one line naming the issue' },
        holdAll
          ? { icon: 'how_to_reg', label: 'Routed every reply to the approval queue' }
          : postAll
            ? { icon: 'send', label: 'Set every reply to publish automatically' }
            : { icon: 'how_to_reg', label: 'Routed 3★ and below to the approval queue' },
      ],
      node: { id: 'rr-3', icon: 'alt_route', label: 'Route by rating' },
    },
    {
      title: 'Write to your six rules',
      status: 'Loading your writing rules',
      narration: 'Then the writing itself, held to the six rules I found in your team’s hand-written replies.',
      text: 'Hold every reply to the six rules learned from the 31 your team wrote by hand.',
      actions: [
        { icon: 'rule', label: 'Loaded the six guidelines as writing constraints' },
        { icon: 'straighten', label: 'Set the 60–90 word bound' },
        { icon: 'badge', label: 'Set first-name sign-off, never the brand' },
      ],
      node: { id: 'rr-5', icon: 'edit_note', label: 'Draft reply' },
    },
    {
      title: 'Publish and protect',
      status: 'Locking down publishing',
      narration: 'Last, publishing — back to the source only, with the hard stops a person should always handle.',
      text: 'Reply only on the source the review came from; never reply where safety, legal action or a billing dispute is mentioned — assign those to a person.',
      actions: [
        { icon: 'reply', label: 'Restricted replies to the originating source' },
        { icon: 'gavel', label: 'Blocked safety, legal and billing mentions → assigned to a named person' },
        { icon: 'history', label: 'Turned on the reply log' },
      ],
      node: { id: 'rr-6', icon: 'send', label: 'Publish reply' },
    },
  ]
}

/* ─── Beat 4/5: the build pass, the review card, the closing line ────────────── */

export const JR_BUILD_SUMMARY = 'Your agent is ready.'

/** One executed step per plan pointer, in plan order. */
export function buildJrBuildPhases(plan: JrPlanStep[]): WorkPhase[] {
  return plan.map((step, i) => ({
    kind: 'step',
    thought: step.narration,
    toolsLabel: `Step ${i + 1} — ${step.title}`,
    status: step.status,
    tools: step.actions,
  }))
}

export interface JrNodeUpdate {
  /** `added` renders a green +, `changed` a grey ± — Start/End exist already and only get rewired. */
  kind: 'added' | 'changed'
  icon: string
  label: string
  /** Canvas node the row opens; End has no panel, so it's the one row without an id. */
  id?: string
}

/** What the build pass changed on the canvas — Start and End were already there. */
export function buildJrNodeUpdates(plan: JrPlanStep[]): JrNodeUpdate[] {
  return [
    { kind: 'changed', id: '__start__', icon: 'play_circle', label: 'Start' },
    ...plan.map((step) => ({ kind: 'added' as const, id: step.node.id, icon: step.node.icon, label: step.node.label })),
    { kind: 'changed', icon: 'flag', label: 'End' },
  ]
}

export const JR_NODES_CARD = {
  accept: 'Accept',
  undo: 'Undo',
  /** `{n}` is replaced with the count. */
  title: '{n} nodes updated',
} as const

export const JR_ACCEPTED_LINE =
  'Accepted. It’s live on the canvas to your right — run it against real reviews from the Test tab, or activate it from the top bar when you’re happy.'

export const JR_UNDONE_LINE =
  'Reverted those changes. Tell me what to adjust and I’ll rebuild the plan around it.'
