// Real per-instance issues. Single source shared by the region-level status
// column (AgentDetailScreen) and the workflow editor's "Resolve issues (N)"
// gate (WorkflowEditorScreen → AgentBuilder), keyed by the exact instance
// name ("<agent name> - <region>") so all surfaces agree.

export interface AgentIssue {
  id: string
  title: string
  description: string
  /** Workflow node id — used to flag the task card on the canvas. */
  nodeId?: string
}

export const AGENT_INSTANCE_ISSUES: Record<string, AgentIssue[]> = {
  'Front desk agent - North region': [
    {
      id: 'fd-north-pharmacy',
      title: 'Pharmacy integration not connected',
      description: 'The refill procedure needs e-prescribe before it can go live.',
    },
    {
      id: 'fd-north-hours',
      title: 'Business hours not configured',
      description: 'Add hours so the agent knows when to escalate after hours.',
    },
  ],
  'Review response agent - North Region': [
    {
      id: 'rr-north-template',
      title: 'Response template not selected',
      description: 'Pick the templates this agent is allowed to reply with before publishing.',
      nodeId: 'rr-5',
    },
    {
      id: 'rr-north-handle-response',
      title: 'Handle response is not configured',
      description: 'Set the response text and posting delay on the Handle response task.',
      nodeId: 'rr-6',
    },
  ],
  'Front desk agent - South region': [
    {
      id: 'fd-south-phone',
      title: 'Phone number not assigned',
      description: 'Assign a voice number to this location before publishing.',
    },
  ],
  'Reminder agent - North region': [
    {
      id: 'rem-north-hours',
      title: 'Calling window not configured',
      description: 'Set quiet hours so reminder calls never go out at odd times.',
    },
    {
      id: 'rem-north-voice',
      title: 'Default voice not selected',
      description: 'Pick a TTS voice for the phone reminder arm before publishing.',
    },
  ],
}

export const AGENT_INSTANCE_ISSUE_COUNTS: Record<string, number> = Object.fromEntries(
  Object.entries(AGENT_INSTANCE_ISSUES).map(([name, issues]) => [name, issues.length]),
)

export function getAgentIssues(agentName: string): AgentIssue[] {
  return AGENT_INSTANCE_ISSUES[agentName] ?? []
}
