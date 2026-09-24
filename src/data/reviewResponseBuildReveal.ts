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

/** Node ids each stage adds — cumulative. */
const STAGE_NODE_IDS: string[][] = [
  [],
  ['rr-1'],
  ['rr-2'],
  ['rr-3', 'rr-3-path-respond', 'rr-3-path-fallback'],
  ['rr-4', 'rr-5'],
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
