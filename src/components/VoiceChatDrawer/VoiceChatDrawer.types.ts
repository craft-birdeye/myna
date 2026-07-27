export interface VoiceChatMessage {
  id: string | number
  role: 'system' | 'agent' | 'user'
  text: string
}

export interface VoiceChatDrawerProps {
  open: boolean
  messages: VoiceChatMessage[]
  summary?: string
  audioUrl?: string
  durationSecs?: number
  mode?: 'voice' | 'chat'
  /** Drawer header title. Defaults to "Call with Myna" / "Chat with Myna". */
  title?: string
  onClose: () => void
}
