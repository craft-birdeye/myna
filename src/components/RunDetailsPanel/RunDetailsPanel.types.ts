import type { ReactNode } from 'react'

export interface RunLogField {
  key: string
  value?: string
  /** When present, renders as a collapsible nested block instead of a plain value. */
  properties?: RunLogField[]
}

export type RunLogStepType = 'trigger' | 'task' | 'delay' | 'branch'

export interface RunLogStep {
  id: string
  type: RunLogStepType
  stepNumber: number
  title: string
  /** Defaults to "Branch output" for branch steps, "Task output" otherwise. */
  outputLabel?: string
  output?: RunLogField[]
  inputs?: RunLogField[]
  tool?: { name: string; properties: RunLogField[] }
  /** Plain status line shown instead of output/inputs (e.g. delay steps). */
  note?: string
}

export interface RunDetailsPanelProps {
  steps: RunLogStep[]
  /** Rendered inside the "Conversation" tab — e.g. a call recording player + transcript. */
  conversation: ReactNode
  /** Rendered inside a third "Call details" tab (to the right of Conversation) when provided —
   *  e.g. caller number, duration, call SID. Tab is omitted entirely when not passed. */
  callDetails?: ReactNode
}
