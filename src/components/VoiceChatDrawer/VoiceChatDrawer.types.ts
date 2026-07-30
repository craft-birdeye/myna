export interface VoiceChatMessage {
  id: string | number
  role: 'system' | 'agent' | 'user'
  text: string
}

export interface VoiceChatDrawerProps {
  open: boolean
  messages: VoiceChatMessage[]
  summary?: string
  /** Pre-fills the Add details box in the "Coach agent" Share feedback modal. */
  feedbackPrefill?: string
  /** Called when the "Coach agent" Share feedback modal is submitted, so the host screen can
   *  record it as a Human feedback recommendation for the current agent. Returns the id of the
   *  recommendation the feedback landed on, so the bubble can switch to a "Track your feedback"
   *  link once it's known. */
  onSubmitFeedback?: (details: string, messageId: string) => string | void
  /** Called when a "Track your feedback" link is clicked — the host screen navigates to that
   *  recommendation's detail page. */
  onTrackFeedback?: (recommendationId: string) => void
  /** When set, "Coach agent" skips the local Share-feedback modal and calls this directly instead
   *  — used when the destination recommendation page itself asks for the feedback up front. */
  onCoachAgentDirect?: (messageId: string) => void
  mode?: 'voice' | 'chat'
  /** Drawer header title. Defaults to "Call with Myna" / "Chat with Myna". */
  title?: string
  onClose: () => void
}
