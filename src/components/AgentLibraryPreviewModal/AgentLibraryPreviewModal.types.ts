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
}

export interface AgentLibraryPreviewModalProps {
  open: boolean
  data: AgentLibraryPreviewData | null
  onClose: () => void
  onUseAgent: () => void
}
