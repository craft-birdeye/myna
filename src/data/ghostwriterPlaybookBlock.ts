/**
 * Ghostwriter landing — the beat that runs when the conversation opens with an attached
 * playbook instead of a sentence. The agent reads the document and plays every requirement
 * back with a verdict, so the disagreements surface before anything is built.
 */

export const PLAYBOOK_HEADER_LABEL = 'Reading your playbook'

export const PLAYBOOK_STEPS = [
  'Parsed the document — 14 pages',
  'Pulled out 9 explicit rules and 4 things implied but not stated',
  'Checked each rule against what I can actually build today',
]

export const PLAYBOOK_SUMMARY =
  "Before I build anything, here's the requirement as I understand it. Correct me on any "
  + "line — I'd rather be wrong now than in production."

/**
 * `clear` = buildable as written. `detail` = buildable once one blank is filled.
 * `conflict` = contradicts another rule in the same document. `blocked` = not possible on
 * this account. `pushback` = possible, but the agent thinks it's a bad idea.
 */
export type PlaybookVerdict = 'clear' | 'detail' | 'conflict' | 'blocked' | 'pushback'

export interface PlaybookRequirement {
  id: string
  /** The requirement in the agent's own words. */
  text: string
  /** Where it came from, e.g. "p.7". */
  page: string
  verdict: PlaybookVerdict
  /** Why it isn't simply `clear` — omitted for the ones that are. */
  note?: string
}

export const PLAYBOOK_VERDICT_LABELS: Record<PlaybookVerdict, string> = {
  clear: 'Clear',
  detail: 'Needs a detail',
  conflict: 'Conflict',
  blocked: "Can't build",
  pushback: "I'd push back",
}

export const PLAYBOOK_REQUIREMENTS: PlaybookRequirement[] = [
  {
    id: 'pb-1',
    text: 'Reply to every review on Google and Facebook within one hour of it landing.',
    page: 'p.2',
    verdict: 'clear',
  },
  {
    id: 'pb-2',
    text: 'Use the approved template library rather than free-writing, wherever a template fits.',
    page: 'p.3',
    verdict: 'clear',
  },
  {
    id: 'pb-3',
    text: '1-star and 2-star replies must be approved by a human before they post.',
    page: 'p.3',
    verdict: 'clear',
  },
  {
    id: 'pb-4',
    text: 'Never discuss billing disputes in public.',
    page: 'p.5',
    verdict: 'clear',
  },
  {
    id: 'pb-5',
    text: 'Escalate anything mentioning a clinical concern to the regional team member.',
    page: 'p.7',
    verdict: 'detail',
    note: 'No team member is named anywhere in the document, so the agent has nowhere to send these.',
  },
  {
    id: 'pb-6',
    text: 'Respond quickly to negative reviews.',
    page: 'p.4',
    verdict: 'detail',
    note: '"Quickly" is never defined. Your current median is 4h 12m.',
  },
  {
    id: 'pb-7',
    text: 'Reply to everything within the hour, including 1-star reviews.',
    page: 'p.11',
    verdict: 'conflict',
    note: 'Contradicts the human-approval rule on p.3 — approval cannot be guaranteed inside an hour.',
  },
  {
    id: 'pb-8',
    text: 'Post replies on Yelp.',
    page: 'p.9',
    verdict: 'blocked',
    note: "Yelp isn't connected, and agent replies aren't permitted on your current plan.",
  },
  {
    id: 'pb-9',
    text: 'The agent may offer a 10% service credit to resolve a complaint.',
    page: 'p.12',
    verdict: 'pushback',
    note:
      'Buildable, but offering compensation in public invites others to ask for the same — '
      + 'and you cannot retract it.',
  },
]

/* ─── Second beat: the templates the playbook leans on ───────────────────────── */

/** Counts the verdicts above back to the user, then picks what to dig into first. */
export const PLAYBOOK_TRIAGE_PARAGRAPH =
  'Four of those I can build exactly as written. Four need a decision from you, and there\'s '
  + "a fifth I'd raise even though you didn't ask. I'll come back to all of them. First the "
  + 'templates, because the whole playbook leans on them.'

export const TEMPLATES_HEADER_LABEL = 'Checking the templates your playbook depends on'

export const TEMPLATES_STEPS = [
  'Searched the template library for all six names in the document',
  'Re-matched by body text, in case any had been renamed',
  'Compared language coverage against your actual review mix',
]

export const TEMPLATES_SUMMARY = 'Your document names six templates. Here is what actually exists:'

/** `renamed` = the same template is already there under a different name. */
export type PlaybookTemplateStatus = 'exists' | 'renamed' | 'missing'

export interface PlaybookTemplate {
  id: string
  name: string
  /** Usage share, the name it's hiding under, or why nothing matched. */
  note: string
  status: PlaybookTemplateStatus
}

export const PLAYBOOK_TEMPLATE_STATUS_LABELS: Record<PlaybookTemplateStatus, string> = {
  exists: 'Exists',
  renamed: 'Already there, renamed',
  missing: 'Missing',
}

export const PLAYBOOK_TEMPLATES: PlaybookTemplate[] = [
  { id: 'tpl-1', name: '5-star thank you', note: 'In use · 62% of your replies', status: 'exists' },
  { id: 'tpl-2', name: 'Service recovery', note: 'In use · 9% of your replies', status: 'exists' },
  {
    id: 'tpl-3',
    name: 'Late delivery apology',
    note: 'You have "Shipping delay" — 80% identical body, different name',
    status: 'renamed',
  },
  {
    id: 'tpl-4',
    name: 'Billing dispute holding reply',
    note: 'Nothing similar in the library',
    status: 'missing',
  },
  {
    id: 'tpl-5',
    name: 'Clinical concern acknowledgement',
    note: 'Nothing similar in the library',
    status: 'missing',
  },
  {
    id: 'tpl-6',
    name: 'Spanish 5-star thank you',
    note: 'You have no Spanish templates at all',
    status: 'missing',
  },
]

export const TEMPLATES_CALLOUT =
  'Two exist, one is effectively already there under a different name, and three do not '
  + 'exist. As written, the playbook cannot run until they do.'

export const TEMPLATES_FOOTNOTE =
  'Worth knowing why the Spanish one matters more than it looks: 8% of your reviews are '
  + 'already in Spanish, and nothing in your library answers them.'

/* ─── The one decision the templates beat leaves open ────────────────────────── */

export const PLAYBOOK_TEMPLATE_QUESTION = 'Shall I create the missing ones?'

export interface PlaybookChoiceOption {
  id: string
  title: string
  description: string
  recommended?: boolean
}

export const PLAYBOOK_TEMPLATE_OPTIONS: PlaybookChoiceOption[] = [
  {
    id: 'draft-all',
    title: 'Yes — draft all four and show me',
    description:
      'Three new templates, plus reusing "Shipping delay" for late deliveries instead of '
      + 'duplicating it.',
    recommended: true,
  },
  {
    id: 'english-only',
    title: 'Only the three English ones',
    description: "Leave Spanish until you've decided on language coverage.",
  },
  {
    id: 'write-myself',
    title: "No, I'll write them myself",
    description:
      'I reference them in the workflow and leave them empty. The agent will skip any review '
      + 'that needs one.',
  },
]

/* ─── Third beat: the drafts, shown only if the user asks for all four ───────── */

export const TEMPLATE_DRAFTS_HEADER_LABEL = 'Drafting the templates'

export const TEMPLATE_DRAFTS_STEPS = [
  'Matched each to the voice in the 31 replies your team wrote by hand',
  'Held them to the 60–90 word limit from p.5',
  'Checked none of them promise money, refunds or clinical advice in public',
]

export const TEMPLATE_DRAFTS_SUMMARY = 'Four templates, ready for you to read:'

export const TEMPLATE_DRAFT_CHIP = 'Draft'

export interface PlaybookTemplateDraft {
  id: string
  name: string
  /** When the agent would reach for this template. */
  trigger: string
  /** The draft copy, `{{token}}` placeholders and all. */
  body: string
}

export const PLAYBOOK_TEMPLATE_DRAFTS: PlaybookTemplateDraft[] = [
  {
    id: 'draft-billing',
    name: 'Billing dispute holding reply',
    trigger: 'Review mentions a charge, refund or billing error',
    body:
      "Thanks for raising this, {{first_name}} — a charge that doesn't look right is worth "
      + "sorting properly rather than in public. I've sent you a direct message so we can pull "
      + 'up your account and go through it line by line. — {{agent_first_name}}',
  },
  {
    id: 'draft-clinical',
    name: 'Clinical concern acknowledgement',
    trigger: 'Review mentions symptoms, treatment or a clinical outcome',
    body:
      "I'm sorry this is how your visit ended, {{first_name}}. Anything to do with your care "
      + "needs a clinician rather than a reply here, so I've passed this to {{escalation_owner}} "
      + "and they'll contact you directly today. — {{agent_first_name}}",
  },
  {
    id: 'draft-spanish',
    name: 'Spanish 5-star thank you',
    trigger: 'Review is 4 or 5 stars and written in Spanish',
    body:
      '¡Gracias por tomarse el tiempo de escribir, {{first_name}}! Nos alegra mucho saber que '
      + 'su visita a {{location_name}} fue positiva. Le esperamos de nuevo pronto. — '
      + '{{agent_first_name}}',
  },
  {
    id: 'draft-late',
    name: 'Late delivery apology',
    trigger: 'Review mentions a delay — reuses your existing "Shipping delay" body',
    body:
      "You're right to be annoyed about the wait, {{first_name}} — that isn't the timeline we "
      + "promised you. I've flagged it with the team at {{location_name}} so we can see what "
      + "slipped. If it's still outstanding, message me and I'll chase it personally. — "
      + '{{agent_first_name}}',
  },
]

export const TEMPLATE_DRAFTS_CALLOUT =
  'Four templates saved to your library as drafts. Nothing posts until you activate them, '
  + 'and you can edit any of them without touching the agent.'

export const TEMPLATE_DRAFTS_FOOTNOTE =
  'One of them leans on {{escalation_owner}}, which nothing in your document fills in. That '
  + 'brings us to the open questions.'

/**
 * Plan-card overrides for the playbook path — it cites the document rather than the account.
 * The counts describe what reading the playbook produced, so they don't move with how many
 * questions the user chose to answer.
 */
export const PLAYBOOK_PLAN_CARD = {
  meta: '14 pages · 9 stated rules · 4 templates created · 5 open questions raised',
  description:
    'Built from your playbook, with every line cited back to the page it came from — '
    + 'including what I left out and what still needs deciding.',
} as const
