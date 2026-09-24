/** Live Front desk copy. Kept out of `agentWorkflows.ts` so Vite actually hot-reloads it. */

export const FD_COPY_REV = 'fd-copy-2'

export const FD_GOALS =
  'Answer all inbound calls, texts, and chats. Handle general questions, book, cancel, and reschedule appointments, verify insurance, and bring in a human when something is too complex to handle.'

export function isFrontDeskAgentName(...names: (string | undefined)[]): boolean {
  return names.some((n) => {
    if (!n) return false
    const name = n.toLowerCase()
    return /front\s*desk/.test(name) || name.includes('frontdesk')
  })
}

type WorkflowLike = {
  nodes?: unknown[]
  nodeDetails?: Record<string, Record<string, unknown>>
}

export function applyFrontDeskCopy<T extends WorkflowLike>(
  workflow: T,
  ...names: (string | undefined)[]
): T {
  if (!isFrontDeskAgentName(...names)) return workflow
  const nodeDetails = { ...(workflow.nodeDetails ?? {}) }
  const start = nodeDetails['__start__']
  if (start) nodeDetails['__start__'] = { ...start, goals: FD_GOALS }
  return { ...workflow, nodeDetails }
}
