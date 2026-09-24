import type { AgentLanguageId } from '../../data/agentLanguages'

export interface VoiceOption {
  label: string
  preview: string
}

export interface AdditionalVoiceConfig {
  label: string
  voice: string
  language: AgentLanguageId
  whenToUse: string
  speed: number
}

export interface DefaultVoiceDrawerProps {
  open: boolean
  voice: string
  speed: number
  onClose: () => void
  onSave: (next: { voice: string; speed: number }) => void
  /** Defaults to voice wording; use `'persona'` for the TTS failover path. */
  terminology?: 'voice' | 'persona'
}

export interface AdditionalVoiceDrawerProps {
  open: boolean
  initialConfig?: AdditionalVoiceConfig | null
  defaultLanguage: AgentLanguageId
  defaultSpeed: number
  defaultVoice: string
  onClose: () => void
  onSave: (config: AdditionalVoiceConfig) => void
  /** Defaults to voice wording; use `'persona'` for the TTS failover path. */
  terminology?: 'voice' | 'persona'
}
