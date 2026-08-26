export interface AiBuilderPanelProps {
  onClose: () => void
  /** Opens the full-page Create with AI experience (View agent builder to return). */
  onExpand?: () => void
  /** Agent key used to persist/share the Create with AI transcript. */
  agentName?: string
  /**
   * Live canvas identity name. When set, draft cards show this instead of the
   * frozen trail title so the panel stays in sync with the header.
   */
  draftAgentName?: string
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
  /** Opens a draft procedure on the canvas RHS (procedure name / id). */
  onOpenProcedure?: (name: string) => void
  /** Currently open procedure — highlights the matching draft row. */
  openProcedureName?: string | null
  /** Optional CTA when the knowledge-base tip banner link is clicked. */
  onGoToKnowledge?: () => void
}
