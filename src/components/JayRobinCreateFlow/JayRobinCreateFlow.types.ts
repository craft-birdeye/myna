export interface JayRobinCreateFlowProps {
  /** The message that opened the thread — rendered here (not by the parent) so it can carry
   *  the same hover actions (time · copy · rewind) as every other user turn. */
  prompt: string
  /** "Create agent" on the plan card was pressed — the build pass is starting. The parent
   *  switches the canvas from the empty scratch to the (still empty) real workflow. */
  onBuildStart?: () => void
  /** One plan step finished building — `completedSteps` is 1…5. The parent reveals the
   *  canvas nodes that step produced. */
  onBuildProgress?: (completedSteps: number) => void
  /** The build pass finished — the agent now exists. The parent marks it created (toast,
   *  Activate button, Test tab). Fired at the end of the build, not when the button is
   *  clicked, so the toast lands when the work is actually done. */
  onCreateAgent?: () => void
  /** "See details" on the plan card — opens the parent's canvas-docked plan panel. */
  onOpenPlan?: () => void
  planOpen?: boolean
  agentCreated?: boolean
  /** True while a question card is docked above the composer — the parent drops its bottom
   *  padding so the card sits flush. */
  onAnswerCardOpenChange?: (open: boolean) => void
  /** True while the copilot is working (typing, analysing, building) — the parent disables
   *  the composer. */
  onBusyChange?: (busy: boolean) => void
  /** Typed into the bottom composer while a question is open — taken as that question's
   *  answer. */
  pendingAnswer?: string
  onPendingAnswerConsumed?: () => void
  /** A row in the "N nodes updated" card was clicked — open that node's panel on the canvas. */
  onOpenNode?: (nodeId: string) => void
  /** Rewind on the opening message: the parent clears the thread and puts the text back in
   *  the composer. */
  onRewindToStart?: (prompt: string) => void
}
