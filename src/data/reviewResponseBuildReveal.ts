/**
 * Jay & Robin's build pass reveals the Review response workflow on the canvas one plan step
 * at a time, in lockstep with the chat's "Step N — …" rows. Each stage adds the node(s) that
 * step builds; `nodeDetails` is sliced to match so the canvas's seed-sync sees a change and
 * applies the new node list (it fingerprints `nodeDetails`, not `nodes`).
 *
 *   0  nothing yet (Start only)
 *   1  Watch Google and Facebook   → rr-1 trigger
 *   2  Spam gate and digest        → rr-2 triage
 *   3  Route by rating             → rr-3 branch, both paths empty
 *   4  Write to your six rules     → rr-4 extract + rr-5 generate on the Respond path
 *   5  Publish and protect         → rr-6 post + rr-7 alert (everything)
 */

/** Node ids each stage adds — cumulative. `rr-5t` (Select template) only exists when the
 *  build created templates from a requirements doc; filtering an absent id is a no-op. */
const STAGE_NODE_IDS: string[][] = [
  [],
  ['rr-1'],
  ['rr-2'],
  ['rr-3', 'rr-3-path-respond', 'rr-3-path-fallback'],
  ['rr-4', 'rr-5t', 'rr-5'],
  ['rr-6', 'rr-7'],
]

export const REVIEW_RESPONSE_BUILD_STAGES = STAGE_NODE_IDS.length - 1

interface NodeLike {
  id: string
}
interface WorkflowLike {
  nodes: NodeLike[]
  nodeDetails: Record<string, unknown>
}

function allowedThrough(stage: number) {
  const allowed = new Set<string>(['__start__'])
  for (let i = 0; i <= Math.min(stage, REVIEW_RESPONSE_BUILD_STAGES); i++) {
    STAGE_NODE_IDS[i].forEach((id) => allowed.add(id))
  }
  return allowed
}

/** The workflow as it stands after `stage` steps have been built. Stage ≥ 5 is the full
 *  workflow; anything unrelated to the review-response ids passes through untouched. */
export function revealReviewResponseWorkflow<T extends WorkflowLike>(workflow: T, stage: number): T {
  if (stage >= REVIEW_RESPONSE_BUILD_STAGES) return workflow
  const allowed = allowedThrough(stage)
  const keep = (node: NodeLike) => allowed.has(node.id)

  const nodeDetails: Record<string, unknown> = {}
  for (const [id, detail] of Object.entries(workflow.nodeDetails ?? {})) {
    if (!allowed.has(id)) continue
    /* Branch paths carry their own child node list — slice it the same way. */
    const d = detail as { nodes?: NodeLike[] } | undefined
    nodeDetails[id] = d && Array.isArray(d.nodes) ? { ...d, nodes: d.nodes.filter(keep) } : detail
  }

  return { ...workflow, nodes: (workflow.nodes ?? []).filter(keep), nodeDetails }
}

/* ─── Extras the copilot adds on top of the stock workflow ───────────────────── */

/**
 * Nodes the Jay & Robin copilot can add beyond the stock Review response workflow:
 *
 *   - `templates` — a "Select template" step before Generate response, with the two templates
 *     the requirements doc named (created by the build) selected alongside the existing ones;
 *   - `ticket`    — a "Create ticket" step after Publish response for highly negative reviews.
 *
 * Applied by `WorkflowEditorScreen` before the staged reveal, so a node added mid-chat shows
 * up on the canvas through the same seed-sync the reveal uses.
 */
export type ReviewResponseExtra = 'templates' | 'ticket'

export const REVIEW_RESPONSE_TEMPLATE_NODE_ID = 'rr-5t'
export const REVIEW_RESPONSE_TICKET_NODE_ID = 'rr-8'

/** The two templates the requirements doc refers to that the account didn't have yet. */
export const JR_CREATED_TEMPLATES = [
  {
    id: 'missed-appointment-apology',
    title: 'Missed appointment apology',
    body: "We're sorry we missed you, [Reviewer first name]. That's not the experience we want anyone to have at [Business Name] — please call [Location phone/Business phone] and we'll make it right.",
    categoryId: 'reviews',
  },
  {
    id: 'billing-follow-up',
    title: 'Billing follow-up',
    body: "Thank you for flagging this, [Reviewer first name]. We'd like to look into your bill directly — please reach us at [Location phone/Business phone] so we can sort it out.",
    categoryId: 'reviews',
  },
] as const

/** The account's four saved templates the build maps to, by library id. */
const EXISTING_TEMPLATE_IDS = ['five-star-thanks', 'four-star-thanks', 'three-star-follow-up', 'low-rating-apology']

const TEMPLATE_NODE = {
  id: REVIEW_RESPONSE_TEMPLATE_NODE_ID,
  flowType: 'task' as const,
  data: {
    title: 'Select template',
    subtype: 'Integration',
    hasToggle: true,
    toggleEnabled: true,
    hasAiIcon: false,
    titlePlaceholder: 'Enter task name',
    descriptionPlaceholder: 'Chooses which saved templates the reply can be built from',
  },
}

const TICKET_NODE = {
  id: REVIEW_RESPONSE_TICKET_NODE_ID,
  flowType: 'task' as const,
  data: {
    title: 'Create ticket',
    subtype: 'Integration',
    hasToggle: true,
    toggleEnabled: true,
    hasAiIcon: false,
    titlePlaceholder: 'Enter task name',
    descriptionPlaceholder: 'Opens a Birdeye ticket for 1–2★ reviews that talk about the business',
  },
}

function templateNodeDetails(existingTemplates: { id: string; title: string; body: string }[]) {
  const selected = [...EXISTING_TEMPLATE_IDS, ...JR_CREATED_TEMPLATES.map((t) => t.id)]
  const options = [
    ...existingTemplates.filter((t) => EXISTING_TEMPLATE_IDS.includes(t.id)),
    ...JR_CREATED_TEMPLATES,
  ]
  return {
    taskName: 'Select template',
    description: 'Chooses which saved templates the reply can be built from',
    selectedTools: ['select-template'],
    toolFieldValues: { 'select-template': { 'st-templates': selected } },
    /* Per-node field overrides the tool viewer applies on top of the seed tool: the two new
       templates exist only in this agent, and all six start selected. */
    toolFieldOverrides: { 'select-template': { 'st-templates': { options, defaultValue: selected } } },
  }
}

const TICKET_NODE_DETAILS = {
  taskName: 'Create ticket',
  description:
    'Opens a Birdeye ticket for every 1–2★ review that talks about the business, with the review and the drafted reply attached, assigned to the location owner',
  selectedTools: ['create-ticket-birdeye'],
}

interface RespondPathLike {
  nodes?: NodeLike[]
}

/** The stock workflow plus whichever extras the copilot has added. Order inside the Respond
 *  path: Extract → Select template → Generate → Publish → Create ticket. */
export function extendReviewResponseWorkflow<T extends WorkflowLike>(
  workflow: T,
  extras: readonly ReviewResponseExtra[],
  templateLibrary: { id: string; title: string; body: string }[] = [],
): T {
  if (!extras.length) return workflow
  const respondId = 'rr-3-path-respond'
  const respond = (workflow.nodeDetails?.[respondId] as RespondPathLike | undefined) ?? {}
  let nodes = [...(respond.nodes ?? [])]
  const nodeDetails: Record<string, unknown> = { ...(workflow.nodeDetails ?? {}) }

  if (extras.includes('templates') && !nodes.some((n) => n.id === TEMPLATE_NODE.id)) {
    const at = nodes.findIndex((n) => n.id === 'rr-5')
    nodes.splice(at < 0 ? nodes.length : at, 0, TEMPLATE_NODE)
    nodeDetails[TEMPLATE_NODE.id] = templateNodeDetails(templateLibrary)
  }
  if (extras.includes('ticket') && !nodes.some((n) => n.id === TICKET_NODE.id)) {
    const at = nodes.findIndex((n) => n.id === 'rr-6')
    nodes.splice(at < 0 ? nodes.length : at + 1, 0, TICKET_NODE)
    nodeDetails[TICKET_NODE.id] = TICKET_NODE_DETAILS
  }
  nodeDetails[respondId] = { ...respond, nodes }
  return { ...workflow, nodeDetails }
}
