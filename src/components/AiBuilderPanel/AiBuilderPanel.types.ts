import type { ReactNode } from 'react'

export interface AiBuilderPanelMessage {
  role: 'user' | 'agent'
  text: string
}

export interface AiBuilderPanelSession {
  id: string
  /** Generic chat summary — for now a canned label rather than a real recap. */
  title: string
  /** Who the chat belongs to. Shown before the timestamp. */
  author: string
  /** Already-formatted date + time (e.g. "Today, 2:41 PM"). */
  timestamp: string
  /** The finished conversation. Opening the session shows this at once. */
  messages: AiBuilderPanelMessage[]
  /** The in-progress chat. Selecting it returns to the live pane instead of a transcript. */
  current?: boolean
}

export interface AiBuilderPanelProps {
  onClose: () => void
  /** Opens the full-page Create with AI experience (View agent builder to return). */
  onExpand?: () => void
  /** Agent key used to persist/share the Create with AI transcript. */
  agentName?: string
  /**
   * Live canvas identity name. When set, draft cards show this instead of the
   * frozen trail title so the panel stays in sync with the header.
   */
  draftAgentName?: string
  /** Quick-start prompts shown before the user types anything. */
  suggestions?: string[]
  /** Called when the user sends a message (Enter or the send button). */
  onSend?: (text: string) => void
  /** Optional class for container sizing/chrome overrides. */
  className?: string
  /** When true, panel fills parent shell width instead of fixed 392px. */
  fillShell?: boolean
  /** Which edge the panel docks to (affects border + corner radius). */
  side?: 'left' | 'right'
  /** Header title. Defaults to "Edit with AI" when `seedPrompt` is set, else "Create with AI";
   *  a coaching session passes "Coaching". */
  title?: string
  /** Filled into the composer the first time it's focused while empty. */
  seedPrompt?: string
  /** Inline node link in a scripted reply — selects that node on the canvas. */
  onOpenNode?: (label: string) => void
  /** Opens a draft procedure on the canvas RHS (procedure name / id). */
  onOpenProcedure?: (name: string) => void
  /** Currently open procedure — highlights the matching draft row. */
  openProcedureName?: string | null
  /** Optional CTA when the knowledge-base tip banner link is clicked. */
  onGoToKnowledge?: () => void
  /**
   * Renders inside the panel's body (below the header, above nothing else — this fully
   * replaces the greeting/suggestions/trail/composer) instead of the default content. Used to
   * dock an arbitrary live conversation in the exact same panel chrome as every other workflow.
   */
  content?: ReactNode
  /** Renders a sessions list icon to the left of expand/close. Clicking it replaces the
   *  chat with the full history. Omit to hide it. */
  sessions?: AiBuilderPanelSession[]
  /** Fired when a session row is picked. The history view closes either way. */
  onSelectSession?: (id: string) => void
}
