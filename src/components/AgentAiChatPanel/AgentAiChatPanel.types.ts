export interface AgentAiChatPanelProps {
  /** Full instance name (e.g. "Reminder agent - North region") — used for the greeting. */
  agentName: string
  /** Full-page layout (own header, centered 720px column) vs. docked layout (fills the LHS panel). */
  expanded?: boolean
  /** Requests switching from expanded back to docked. Only used when `expanded`. */
  onCollapse?: () => void
}
