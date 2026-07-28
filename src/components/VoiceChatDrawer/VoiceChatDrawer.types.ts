export interface VoiceChatMessage {
  id: string | number
  role: 'system' | 'agent' | 'user'
  text: string
}

export interface VoiceChatDrawerProps {
  open: boolean
  messages: VoiceChatMessage[]
  summary?: string
  /** Pre-fills the Add details box in the thumbs-down Share feedback modal. */
  feedbackPrefill?: string
  /** Called when the thumbs-down Share feedback modal is submitted, so the host screen can
   *  record it as a Human feedback recommendation for the current agent. */
  onSubmitFeedback?: (details: string, messageId: string) => void
  mode?: 'voice' | 'chat'
  /** Drawer header title. Defaults to "Call with Myna" / "Chat with Myna". */
  title?: string
  onClose: () => void
}
