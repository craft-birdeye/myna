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
      toolCall?: LogToolCall
      /** Shown at the end of the meta line (e.g. "5:31 PM"). */
      time?: string
    }
  | { id: string; role: 'caller'; text: string; durationLabel?: string; time?: string }

export interface LogDetailsPanelProps {
  row: HealthcareLogRow
  agentName?: string
  agentBadge?: string
  metrics?: LogDetailsMetric[]
  transcript?: LogTranscriptEntry[]
  durationSecs?: number
  audioUrl?: string
  /** Called when a "Track your feedback" link is clicked — the host screen navigates to that
   *  recommendation's detail page. */
  onTrackFeedback?: (recommendationId: string) => void
}
