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
}

export interface AdditionalVoiceDrawerProps {
  open: boolean
  initialConfig?: AdditionalVoiceConfig | null
  defaultLanguage: AgentLanguageId
  defaultSpeed: number
  defaultVoice: string
  onClose: () => void
  onSave: (config: AdditionalVoiceConfig) => void
}
