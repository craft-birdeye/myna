export interface AiAssistPanelProps {
  /** First name shown in the greeting (e.g. "Hi John,"). Defaults to "John". */
  userName?: string
  /** Close the panel. */
  onClose: () => void
  /**
   * Override the expand button's behavior (e.g. to navigate back to a
   * conversational create-agent view) instead of the default in-place
   * 400px → 640px width toggle.
   */
  onExpand?: () => void
}
