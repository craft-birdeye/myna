export interface AiAssistPanelProps {
  /** First name shown in the greeting (e.g. "Hi John,"). Defaults to "John". */
  userName?: string
  /** Close the panel. */
  onClose: () => void
}
