import type { VoiceChatMessage } from '../VoiceChatDrawer/VoiceChatDrawer.types'

export interface VoicemailMessageProps {
  variant?: 'voicemail' | 'voice-chat'
  transcript: string
  summary?: string   // voice-chat only — shown in bubble instead of transcript
  duration: string   // e.g. "00:11"
  durationSecs: number
  time: string       // e.g. "10:42 PM"
  audioUrl?: string
  /** Override drawer transcript; defaults to the Rock Dental demo messages. */
  messages?: VoiceChatMessage[]
  /** Contact name for the transcript drawer title ("Call with …"). */
  contactName?: string
  /** Pre-fills the Add details box in the "Coach agent" Share feedback modal. */
  feedbackPrefill?: string
  /** Called when the "Coach agent" Share feedback modal is submitted, so the host screen can
   *  record it as a Human feedback recommendation for the current agent. Returns the id of the
   *  recommendation the feedback landed on. */
  onSubmitFeedback?: (details: string, messageId: string) => string | void
  /** Called when a "Track your feedback" link is clicked — the host screen navigates to that
   *  recommendation's detail page. */
  onTrackFeedback?: (recommendationId: string) => void
  /** When set, "Coach agent" skips the local Share-feedback modal and calls this directly instead
   *  — used when the destination recommendation page itself asks for the feedback up front. */
  onCoachAgentDirect?: (messageId: string) => void
}
