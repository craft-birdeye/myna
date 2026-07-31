export interface WorkflowPreviewPanelProps {
  agentName: string
  product?: string
  expanded?: boolean
  onExpand?: () => void
  onClose: () => void
}
