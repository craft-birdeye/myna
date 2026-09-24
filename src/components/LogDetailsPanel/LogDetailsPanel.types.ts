import type { HealthcareLogRow } from '../../data/healthcareAgentLogs'
import type { RunLogStep } from '../RunDetailsPanel/RunDetailsPanel.types'

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
      /** Spoken/message duration shown next to Coach agent (e.g. "4s"). */
      durationLabel?: string
      /** @deprecated Prefer `durationLabel`. */
      time?: string
    }
  | { id: string; role: 'caller'; text: string; durationLabel?: string; time?: string }

export interface LogDetailsPanelProps {
  row: HealthcareLogRow
  agentName?: string
  agentBadge?: string
  metrics?: LogDetailsMetric[]
  transcript?: LogTranscriptEntry[]
  /** Logs-tab trigger/task/delay/branch steps — defaults to the Front-desk call's steps. */
  steps?: RunLogStep[]
  durationSecs?: number
  audioUrl?: string
  /** Called when a "Track your feedback" link is clicked — the host screen navigates to that
   *  recommendation's detail page. */
  onTrackFeedback?: (recommendationId: string) => void
  /** Overrides for the "Call details" tab — fall back to sensible demo defaults. */
  callerNumber?: string
  sidNumber?: string
  languageDetected?: string
  callEndReason?: string
  /** Defaults to `agentName`. */
  routedVia?: string
  /** Whether to show the "Call details" tab at all — some agents (e.g. Reminder) don't have one. */
  showCallDetails?: boolean
  /** Front desk exploration: show status chip above the call-end-reason copy. */
  callEndResultBadge?: string
  /** Front desk exploration: e.g. "4 of 5". */
  userRating?: string
  /** Front desk exploration: language / translate control under AI summary. */
  showTranscriptTranslation?: boolean
  /** Click a log step to focus the matching canvas node. */
  onStepFocus?: (step: RunLogStep) => void
  initialTab?: string
  onTabChange?: (tab: string) => void
}
