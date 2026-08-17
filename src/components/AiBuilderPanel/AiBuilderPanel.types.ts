export interface AiBuilderPanelProps {
  onClose: () => void
  /** Opens the full-page Create with AI experience (View agent builder to return). */
  onExpand?: () => void
  /** Agent key used to persist/share the Create with AI transcript. */
  agentName?: string
  /** Quick-start prompts shown before the user types anything. */
  suggestions?: string[]
  /** Called when the user sends a message (Enter or the send button). */
  onSend?: (text: string) => void
  /** Optional class for container sizing/chrome overrides. */
  className?: string
  /** When true, panel fills parent shell width instead of fixed 392px. */
  fillShell?: boolean
  /** Which edge the panel docks to (affects border + corner radius). */
  side?: 'left' | 'right'
}
