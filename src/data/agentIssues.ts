// Real per-instance issues. Single source shared by the region-level status
// column (AgentDetailScreen) and the workflow editor's "Resolve issues (N)"
// gate (WorkflowEditorScreen → AgentBuilder), keyed by the exact instance
// name ("<agent name> - <region>") so all surfaces agree.

export interface AgentIssue {
  id: string
  title: string
  description: string
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
  'Front desk agent - South region': [
    {
      id: 'fd-south-phone',
      title: 'Phone number not assigned',
      description: 'Assign a voice number to this location before publishing.',
    },
  ],
}

export const AGENT_INSTANCE_ISSUE_COUNTS: Record<string, number> = Object.fromEntries(
  Object.entries(AGENT_INSTANCE_ISSUES).map(([name, issues]) => [name, issues.length]),
)

export function getAgentIssues(agentName: string): AgentIssue[] {
  return AGENT_INSTANCE_ISSUES[agentName] ?? []
}
