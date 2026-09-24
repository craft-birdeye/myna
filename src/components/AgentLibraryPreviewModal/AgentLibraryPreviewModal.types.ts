export interface AgentLibraryPreviewStep {
  kind: 'trigger' | 'task'
  title: string
  description: string
}

export interface AgentLibraryPreviewData {
  id: string
  name: string
  goal: string
  outcome: string
  locationsLabel?: string
  steps: AgentLibraryPreviewStep[]
  /** Product used to pick the real canvas workflow for the preview. */
  product?: string
  /** Key into `getAgentWorkflows(product)` — e.g. "Front desk agent". */
  workflowAgentName?: string
}

export interface AgentLibraryPreviewModalProps {
  open: boolean
  data: AgentLibraryPreviewData | null
  onClose: () => void
  onUseAgent: () => void
}
