// Real per-instance issue counts. Single source shared by the region-level
// status column (AgentDetailScreen) and the workflow editor's "Resolve
// issues (N)" gate (WorkflowEditorScreen → AgentBuilder), keyed by the exact
// instance name ("<agent name> - <region>") so all three surfaces agree.
export const AGENT_INSTANCE_ISSUE_COUNTS: Record<string, number> = {
  'Front desk agent - North region': 2,
  'Front desk agent - South region': 1,
}
