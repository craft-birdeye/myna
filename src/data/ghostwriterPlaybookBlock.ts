/**
 * Ghostwriter landing — the beat that runs when the conversation opens with an attached
 * playbook instead of a sentence.
 *
 * The agent used to play all nine requirements back with a per-rule verdict
 * (`Needs a detail` / `Conflict` / `Can't build` / `I'd push back`). That read like a lint
 * report, so it is gone: the rules are confirmed in a sentence, and the one finding worth
 * stopping on — the templates the playbook depends on that don't exist — gets the beat to
 * itself.
 */

export const PLAYBOOK_HEADER_LABEL = 'Reading your playbook'

export const PLAYBOOK_STEPS = [
  'Parsed the document — 14 pages',
  'Pulled out 9 explicit rules and 4 things implied but not stated',
  'Checked each rule against what I can actually build today',
]

export const PLAYBOOK_SUMMARY =
  'Nine rules, and I can build all nine as written — reply within the hour on Google and '
  + 'Facebook (p.2), use the template library wherever one fits (p.3), hold 1- and 2-star '
  + 'replies for a human to approve (p.3), and keep billing disputes out of public replies '
  + '(p.5).'

/* ─── Second beat: the templates the playbook leans on ───────────────────────── */

/** Hands off to the one beat that found something. */
export const PLAYBOOK_TRIAGE_PARAGRAPH =
  'One thing does stop me, though — the templates. The whole playbook leans on them, so '
  + 'let me check those before anything else.'

export const TEMPLATES_HEADER_LABEL = 'Checking the templates your playbook depends on'

export const TEMPLATES_STEPS = [
  'Searched the template library for all six names in the document',
  'Re-matched by body text, in case any had been renamed',
  'Compared language coverage against your actual review mix',
]

export const TEMPLATES_SUMMARY =
  'Your document names six templates. Two are already in use — 5-star thank you, which is '
  + '62% of your replies, and Service recovery at 9%. A third is effectively there under '
  + 'another name: your "Shipping delay" is 80% the same body as the "Late delivery '
  + 'apology" the document asks for, so I would reuse it rather than duplicate it.'

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

export const TEMPLATES_FOOTNOTE =
  'The other three do not exist and nothing in the library is close: Billing dispute '
  + 'holding reply, Clinical concern acknowledgement, and Spanish 5-star thank you. As '
  + 'written the playbook cannot run until they do — and the Spanish one matters more than '
  + 'it looks, because 8% of your reviews are already in Spanish and nothing you have '
  + 'answers them.'

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

export const TEMPLATE_DRAFTS_FOOTNOTE =
  'All four are saved to your library as drafts — nothing posts until you activate them, '
  + 'and you can edit any of them without touching the agent. One leans on '
  + '{{escalation_owner}}, which nothing in your document fills in. That brings us to the '
  + 'open questions.'

/**
 * Plan-card overrides for the playbook path — it cites the document rather than the account.
 * The counts describe what reading the playbook produced, so they don't move with how many
 * questions the user chose to answer.
 */
export const PLAYBOOK_PLAN_CARD = {
  meta: '14 pages · 9 stated rules · 4 templates created · 1 question raised',
  description:
    'Built from your playbook, with every line cited back to the page it came from — '
    + 'including what I left out and what still needs deciding.',
} as const
