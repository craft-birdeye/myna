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
}
