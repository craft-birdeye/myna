import type { HealthcareLogRow } from '../../data/healthcareAgentLogs'

export interface LogDetailsMetric {
  id: string
  label: string
  value: string
}

export interface LogToolProperty {
  key: string
  value: string
}

export type LogToolOutputEntry =
  | { kind: 'field'; key: string; value: string }
  | {
      kind: 'object'
      key: string
      propertyCount: number
      properties: LogToolProperty[]
      trailingRaw?: string
    }
  | { kind: 'raw'; value: string }

export interface LogToolCall {
  id: string
  name: string
  propertyCount: number
  durationLabel?: string
  /** Structured tool response shown when the row is expanded. */
  output?: LogToolOutputEntry[]
  /** Optional request inputs (shown under "View inputs"). */
  inputs?: LogToolProperty[]
  /** @deprecated Prefer `output` — kept for simple flat lists. */
  properties?: { label: string; value: string }[]
}

export type LogTranscriptEntry =
  | { id: string; role: 'system'; text: string }
  | {
      id: string
      role: 'agent'
      text: string
      llmResponseTime?: string
      tts?: string
      knowledgeBase?: string
      toolCall?: LogToolCall
    }
  | { id: string; role: 'caller'; text: string; durationLabel?: string }

export interface LogDetailsPanelProps {
  row: HealthcareLogRow
  agentName?: string
  agentBadge?: string
  callerNumber?: string
  sidNumber?: string
  languageDetected?: string
  callEndReason?: string
  routedVia?: string
  metrics?: LogDetailsMetric[]
  summary?: string
  transcript?: LogTranscriptEntry[]
  durationSecs?: number
  audioUrl?: string
  onViewConversation?: () => void
}
