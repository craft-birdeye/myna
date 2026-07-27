import type { HealthcareProcedureCatalogItem } from './healthcareProcedureCatalog'
import type {
  TextChannelSettings,
  WebChatChannelSettings,
} from '../screens/channelSetupSettings.types'

export type WizardChannelId = 'voice' | 'webchat' | 'text' | 'email' | 'facebook' | 'instagram'
export type WizardRecordingMode = 'off' | 'announced' | 'silent'

export interface WizardAgentDraft {
  agentName: string
  systemPrompt: string
  language: string
  additionalLanguages: string[]
  selectedChannels: WizardChannelId[]
  voice: string
  voiceSpeed: number
  additionalVoices: string[]
  greeting: string
  recording: WizardRecordingMode
  consent: string
  webchatSettings: WebChatChannelSettings
  textSettings: TextChannelSettings
  selectedLocationIds: string[]
  selectedProcedureIds: string[]
  procedureCatalog: HealthcareProcedureCatalogItem[]
  selectedIntegrationId: string | null
  connectedIntegrationIds: string[]
}
