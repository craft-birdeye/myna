/** Live Review response copy. Kept out of `agentWorkflows.ts` so Vite actually hot-reloads it. */

export const RR_COPY_REV = 'rr-copy-7'

export const RR_GOALS =
  "Respond to reviews automatically using the right template. If it can't post right away, save the response for someone to review."

export const RR_TRIGGER_DESC =
  'Agent triggers when a new review is received or an existing review is updated across all sources and locations'

export const RR_TRIAGE_DESC =
  'Checks whether the review is genuine or spam, then decides if a response is needed'

export const RR_EXTRACT_DESC =
  "Reads the review to understand what it's about, how serious it is, and if it mentions any staff or competitors"

export const RR_GENERATE_DESC =
  "Writes a reply that matches the review's language and rating, and follows the rules for tone, length, and escalation"

export const RR_BRANCH_TITLE = 'Evaluate conditions'

export const RR_BRANCH_DESC =
  'Checks your conditions, then sends the flow down the matching branch. If nothing matches, it uses the fallback branch.'

export function isReviewResponseAgent(...names: (string | undefined)[]): boolean {
  return names.some((n) => !!n && /review response/i.test(n))
}

type WorkflowLike = {
  nodes?: Array<{ id?: string; data?: Record<string, unknown> }>
  nodeDetails?: Record<string, Record<string, unknown>>
}

export function applyReviewResponseCopy<T extends WorkflowLike>(
  workflow: T,
  ...names: (string | undefined)[]
): T {
  if (!isReviewResponseAgent(...names)) return workflow

  const nodeDetails = { ...(workflow.nodeDetails ?? {}) }
  const start = nodeDetails['__start__']
  if (start) nodeDetails['__start__'] = { ...start, goals: RR_GOALS }
  if (nodeDetails['rr-1']) {
    nodeDetails['rr-1'] = { ...nodeDetails['rr-1'], description: RR_TRIGGER_DESC }
  }
  if (nodeDetails['rr-2']) {
    nodeDetails['rr-2'] = { ...nodeDetails['rr-2'], description: RR_TRIAGE_DESC }
  }
  if (nodeDetails['rr-3']) {
    nodeDetails['rr-3'] = {
      ...nodeDetails['rr-3'],
      branchNodeTitle: RR_BRANCH_TITLE,
      description: RR_BRANCH_DESC,
    }
  }
  if (nodeDetails['rr-4']) {
    nodeDetails['rr-4'] = { ...nodeDetails['rr-4'], description: RR_EXTRACT_DESC }
  }
  if (nodeDetails['rr-5']) {
    nodeDetails['rr-5'] = { ...nodeDetails['rr-5'], description: RR_GENERATE_DESC }
  }

  const nodes = (workflow.nodes ?? []).map((node) => {
    if (node.id === 'rr-1') {
      return { ...node, data: { ...node.data, descriptionPlaceholder: RR_TRIGGER_DESC } }
    }
    if (node.id === 'rr-2') {
      return { ...node, data: { ...node.data, descriptionPlaceholder: RR_TRIAGE_DESC } }
    }
    if (node.id === 'rr-3') {
      return {
        ...node,
        data: {
          ...node.data,
          title: RR_BRANCH_TITLE,
          descriptionPlaceholder: RR_BRANCH_DESC,
        },
      }
    }
    return node
  })

  return { ...workflow, nodes, nodeDetails }
}
