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
 * Two more stories share the same beats and live at the bottom of this file:
 *
 *   - the **file variant** — the user attaches a requirements doc and says "these are my
 *     requirements". The analysis reads the doc, one question offers to create the two
 *     templates it names that the account doesn't have, and the build creates them;
 *   - **follow-ups** — after the agent exists, a request typed into the composer ("also
 *     create a ticket for highly negative reviews") gets a short Working pass, a simple
 *     proposal to accept, an apply pass, and a reply whose node names open the node.
 *
 * Every string the flow says lives here so the story can be rewritten without touching the
 * component.
 */
import type { WorkPhase, WorkTool } from '../components/AgentActivityHeader/AgentWorkSequence'
import type { QuestionCardOption } from '../components/GhostwriterQuestionCard/GhostwriterQuestionCard.types'
import { JR_CREATED_TEMPLATES, REVIEW_RESPONSE_TEMPLATE_NODE_ID, REVIEW_RESPONSE_TICKET_NODE_ID } from './reviewResponseBuildReveal'
import type { ReviewResponseExtra } from './reviewResponseBuildReveal'

/** How the thread was opened: a typed prompt, or a requirements doc attached with one. */
export type JrFlowVariant = 'prompt' | 'file'

/** A copilot line with node names in it — each `{ nodeId }` segment renders as a chip that
 *  opens that node's panel (and its tool) on the canvas. */
export type JrRichSegment = string | { nodeId: string; label: string; tool?: string }

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
  /** A second node the step adds (the file variant's Select template). */
  extraNode?: { id: string; icon: string; label: string }
}

/** The plan reads back what was answered, so the five pointers are built from the answers.
 *  In the file variant, a "yes" to the templates question turns step 4 into creating the two
 *  templates the doc named (and a Select template node) before the writing rules. */
export function buildJrPlan(answers: Record<string, string>, variant: JrFlowVariant = 'prompt'): JrPlanStep[] {
  const publish = answers.publish ?? ''
  const scope = answers.scope ?? ''
  const digest = answers.digest ?? ''
  const createTemplates = variant === 'file' && jrTemplatesAccepted(answers)

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
    createTemplates
      ? {
          title: 'Create the two templates and write to your rules',
          status: 'Creating templates',
          narration:
            'Then the templates. Two your document names don’t exist yet, so I’ll create them first, then hold the writing to your rules.',
          text: 'Create "Missed appointment apology" and "Billing follow-up", select all six templates, and hold every reply to the six rules in your document.',
          actions: [
            { icon: 'description', label: 'Created template "Missed appointment apology"', detail: JR_CREATED_TEMPLATES[0].body },
            { icon: 'description', label: 'Created template "Billing follow-up"', detail: JR_CREATED_TEMPLATES[1].body },
            { icon: 'checklist', label: 'Selected all 6 templates in Select template' },
            { icon: 'rule', label: 'Loaded the six guidelines as writing constraints' },
          ],
          node: { id: 'rr-5', icon: 'edit_note', label: 'Draft reply' },
          extraNode: { id: REVIEW_RESPONSE_TEMPLATE_NODE_ID, icon: 'description', label: 'Select template' },
        }
      : {
          title: 'Write to your six rules',
          status: 'Loading your writing rules',
          narration: variant === 'file'
            ? 'Then the writing itself, held to the six rules in your document.'
            : 'Then the writing itself, held to the six rules I found in your team’s hand-written replies.',
          text: variant === 'file'
            ? 'Hold every reply to the six rules in your document.'
            : 'Hold every reply to the six rules learned from the 31 your team wrote by hand.',
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

/**
 * Every workflow card on the built canvas, named the way the card itself is named.
 * Start uses the agent title. Branch-path chips (Respond, Fallback branch) and End
 * are canvas structure, not cards, so they are left off. A requirements-doc build
 * inserts Select template just before Generate response.
 */
export function buildJrNodeUpdates(plan: JrPlanStep[]): JrNodeUpdate[] {
  const extra = plan.find((step) => step.extraNode)?.extraNode
  const nodes: JrNodeUpdate[] = [
    { kind: 'changed', id: '__start__', icon: 'play_circle', label: 'New review response agent' },
    { kind: 'added', id: 'rr-1', icon: 'bolt', label: 'When a new review is received or updated' },
    { kind: 'added', id: 'rr-2', icon: 'shield', label: 'Triage review' },
    { kind: 'added', id: 'rr-3', icon: 'alt_route', label: 'Evaluate conditions' },
    { kind: 'added', id: 'rr-4', icon: 'manage_search', label: 'Extract review details' },
  ]
  if (extra) {
    nodes.push({ kind: 'added', id: extra.id, icon: extra.icon, label: extra.label })
  }
  nodes.push(
    { kind: 'added', id: 'rr-5', icon: 'edit_note', label: 'Generate response' },
    { kind: 'added', id: 'rr-6', icon: 'send', label: 'Publish response' },
    { kind: 'added', id: 'rr-7', icon: 'mail', label: 'Send email alert' },
  )
  return nodes
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

/* ─── File variant: "these are my requirements" ──────────────────────────────── */

/** What "+ → Files" attaches on the Jay & Robin landing. */
export const JR_REQUIREMENTS_ATTACHMENT = {
  id: 'jr-requirements',
  kind: 'file' as const,
  label: 'Review response requirements.pdf',
}

export const JR_REQUIREMENTS_PROMPT = 'These are my requirements — create an agent for me.'

export const JR_FILE_INTRO_LINE =
  'Got it — I’ll read your requirements first, then check them against the account before I ask you anything.'

export const JR_FILE_ANALYSIS_PHASES: WorkPhase[] = [
  {
    thought: 'Starting with the document itself — what it asks for, and what it assumes already exists.',
    toolsLabel: 'Reading your requirements',
    status: 'Reading Review response requirements.pdf',
    tools: [
      { icon: 'description', label: 'Read Review response requirements.pdf — 4 pages, 11 requirements' },
      { icon: 'rule', label: 'Extracted rating rules, six writing rules and three escalation cases' },
      {
        icon: 'format_list_bulleted',
        label: 'Listed the templates it refers to: 6',
        detail: '5 star thank you · 4 star thank you · 3 star follow-up · 1-2 star apology · Missed appointment apology · Billing follow-up',
      },
    ],
    findings: [
      'Eleven requirements, all buildable. It auto-posts 4–5★ from templates, drafts 3★ and below '
      + 'for approval, and escalates safety, legal and billing. It names six templates.',
    ],
  },
  {
    thought: 'Now the account — which of those six templates exist, and where the reviews come from.',
    toolsLabel: 'Matching against your account',
    status: 'Matching templates',
    tools: [
      { icon: 'reviews', label: 'Pulled 1,035 reviews across 4 locations, last 12 months' },
      {
        icon: 'description',
        label: 'Matched 4 of the 6 templates to saved templates',
        detail: 'Missing: Missed appointment apology · Billing follow-up',
      },
      { icon: 'lock_open', label: 'Checked reply permissions: Google ✓ · Facebook ✓ · Google Play and ShopperApproved read only' },
    ],
    findings: [
      'Four of the six templates are already saved. Two the document relies on — "Missed appointment '
      + 'apology" and "Billing follow-up" — don’t exist in the account yet, so the rules that use them '
      + 'can’t run until they do.',
    ],
  },
  {
    thought: 'Anything that gets answered publicly needs a spam gate in front of it.',
    toolsLabel: 'Screening for spam',
    status: 'Screening for spam',
    tools: [
      { icon: 'shield', label: 'Ran all 1,035 reviews through the spam model' },
      { icon: 'flag', label: 'Flagged 14 scoring above the 0.8 threshold' },
    ],
    findings: [
      '14 look like non-customers. Your document doesn’t mention spam, so I’ll add the gate the same '
      + 'way: hold anything above 0.8 and never reply to it publicly.',
    ],
  },
]

export const JR_FILE_QUESTIONS_LEAD_IN =
  'Your document answers most of what I’d ask. Three things to confirm, then the plan.'

export const JR_FILE_QUESTIONS: JrQuestion[] = [
  {
    id: 'templates',
    question: 'Two templates in your requirements aren’t in the system yet — should I create them?',
    hint: '"Missed appointment apology" and "Billing follow-up". I’ll draft them from the rules in your document.',
    options: [
      {
        id: 'create',
        label: 'Yes, create both',
        description: 'Drafted from your document — you can edit the wording afterwards.',
        recommended: true,
      },
      {
        id: 'skip',
        label: 'Not now — skip the rules that need them',
        description: 'Those reviews fall back to the 1-2 star apology until you add the templates.',
      },
    ],
    freeText: { placeholder: 'Other…', submitLabel: 'Submit' },
    skipAnswer: 'Skipped — create both',
  },
  {
    ...JR_QUESTIONS[0],
    hint: 'Your document says auto-post 4–5★ and hold the rest — confirming.',
    skipAnswer: 'Skipped — as the document says, auto-post 4–5★ and hold 3★ and below',
  },
  JR_QUESTIONS[2],
]

/** Did the file variant's templates question come back as "create them"? */
export function jrTemplatesAccepted(answers: Record<string, string>) {
  const a = answers.templates ?? ''
  if (!a) return false
  return !/not now|skip the rules|later|don’t|don't|no\b/i.test(a) || /skipped — create/i.test(a)
}

export const JR_FILE_PLAN_META = 'Built from your requirements · 1,035 reviews · your 3 answers'

/** Closing line per variant. The file variant names the Select template node so the two new
 *  templates are one click away. */
export function buildJrAcceptedLine(variant: JrFlowVariant, templatesCreated: boolean): JrRichSegment[] {
  if (variant === 'file' && templatesCreated) {
    return [
      'Accepted. The two new templates are created and selected in ',
      { nodeId: REVIEW_RESPONSE_TEMPLATE_NODE_ID, label: 'Select template', tool: 'select-template' },
      ' alongside your existing four — open it to edit the wording. Run the agent against real reviews from the Test tab, or activate it from the top bar when you’re happy.',
    ]
  }
  return [JR_ACCEPTED_LINE]
}

/* ─── Follow-ups: change requests after the agent exists ─────────────────────── */

export interface JrProposal {
  title: string
  /** What the change does, one line each — read top to bottom as the proposal. */
  lines: string[]
  applyLabel: string
  declineLabel: string
}

export interface JrFollowUpScript {
  /** The short Working pass before the proposal. */
  analysisPhases: WorkPhase[]
  /** One line said before the proposal card. */
  leadIn: string
  proposal: JrProposal
  /** Echoed as the user turn when the proposal is accepted / declined. */
  acceptEcho: string
  declineEcho: string
  /** The apply pass once accepted. */
  applyPhases: WorkPhase[]
  applySummary: string
  /** The reply once applied — node names are chips that open the node. */
  result: JrRichSegment[]
  declineLine: string
  /** Shown in the "N nodes updated" card once the change is applied. */
  nodes: JrNodeUpdate[]
  /** The canvas node(s) the change adds. */
  extra?: ReviewResponseExtra
}

/** Pre-filled into the composer on first click once the agent exists — the demo's next line. */
export const JR_TICKET_FOLLOW_UP_PROMPT =
  'Also create a ticket for highly negative reviews that talk about us.'

const JR_TICKET_FOLLOW_UP: JrFollowUpScript = {
  analysisPhases: [
    {
      thought: 'Checking what the Respond path does today for a 1–2★ review, and what a ticket would need from it.',
      toolsLabel: 'Reading the request',
      status: 'Checking the Respond path',
      tools: [
        { icon: 'account_tree', label: 'Read the Respond path — Extract → Generate → Publish, no ticketing step' },
        { icon: 'confirmation_number', label: 'Found the Birdeye ticketing tool: Create ticket in Birdeye' },
        {
          icon: 'bar_chart',
          label: 'Counted 1–2★ reviews about the business, last 30 days: 23',
          detail: 'Severity high on 19 · billing 7 · wait time 6 · staff 4 · other 6',
        },
      ],
      findings: [
        'Nothing opens a ticket today — a 1–2★ review gets a drafted reply and stops there. '
        + 'Extract review details already scores severity, so I can key the ticket off that.',
      ],
    },
  ],
  leadIn: 'Here’s what I’d change — one step, added after the reply is published.',
  proposal: {
    title: 'Create a ticket for highly negative reviews',
    lines: [
      'Add Create ticket after Publish response on the Respond path.',
      'Only for 1–2★ reviews where Review.severity is high and the review talks about the business.',
      'The ticket carries the review, the location and the drafted reply, assigned to the location owner.',
    ],
    applyLabel: 'Apply',
    declineLabel: 'Not now',
  },
  acceptEcho: 'Apply',
  declineEcho: 'Not now',
  applyPhases: [
    {
      kind: 'step',
      thought: 'Adding the step.',
      toolsLabel: 'Create ticket',
      status: 'Adding Create ticket',
      tools: [
        { icon: 'add_box', label: 'Added Create ticket after Publish response' },
        { icon: 'build', label: 'Attached the Create ticket in Birdeye tool' },
        { icon: 'filter_alt', label: 'Set the condition: rating ≤ 2 and Review.severity = high' },
        { icon: 'person', label: 'Assigned to the location owner, with review and reply attached' },
      ],
    },
  ],
  applySummary: 'Change applied.',
  result: [
    'Sure — I’ve added ',
    { nodeId: REVIEW_RESPONSE_TICKET_NODE_ID, label: 'Create ticket', tool: 'create-ticket-birdeye' },
    ' after Publish response. Every 1–2★ review that talks about the business now opens a Birdeye ticket for the location owner, with the review and the drafted reply attached. Open it to change the assignee or the rating cut-off.',
  ],
  declineLine: 'Left as is. Tell me when you want the ticketing step and I’ll add it.',
  nodes: [
    { kind: 'added', id: REVIEW_RESPONSE_TICKET_NODE_ID, icon: 'confirmation_number', label: 'Create ticket' },
  ],
  extra: 'ticket',
}

export const JR_FOLLOW_UP_UNDONE_LINE = 'Reverted that change.'

/** A request the script has no story for — asks for the one thing it needs, changes nothing. */
const JR_GENERIC_FOLLOW_UP: JrFollowUpScript = {
  analysisPhases: [
    {
      thought: 'Reading the request against the workflow.',
      toolsLabel: 'Reading the request',
      status: 'Reading the workflow',
      tools: [
        { icon: 'account_tree', label: 'Read the current workflow — 7 steps across two paths' },
        { icon: 'search', label: 'Looked for the step this would change' },
      ],
    },
  ],
  leadIn: 'I can do that. Here’s how I’d approach it.',
  proposal: {
    title: 'Adjust the workflow',
    lines: [
      'Add the step on the Respond path, after the reply is drafted.',
      'Keep everything else — sources, spam gate and routing — as it is.',
    ],
    applyLabel: 'Apply',
    declineLabel: 'Not now',
  },
  acceptEcho: 'Apply',
  declineEcho: 'Not now',
  applyPhases: [
    {
      kind: 'step',
      thought: 'Applying the change.',
      toolsLabel: 'Adjust the workflow',
      status: 'Applying the change',
      tools: [{ icon: 'edit', label: 'Updated the Respond path' }],
    },
  ],
  applySummary: 'Change applied.',
  result: ['Done — the Respond path is updated. Open any step on the canvas to fine-tune it.'],
  declineLine: 'Left as is.',
  nodes: [
    { kind: 'changed', id: 'rr-5', icon: 'edit_note', label: 'Generate response' },
  ],
}

/** Which follow-up story a typed request gets. */
export function matchJrFollowUp(text: string): JrFollowUpScript {
  if (/ticket/i.test(text)) return JR_TICKET_FOLLOW_UP
  return JR_GENERIC_FOLLOW_UP
}
