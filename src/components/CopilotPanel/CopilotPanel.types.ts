export interface CopilotPanelProps {
  /** Agent instance the panel is scoped to — history is per agent. */
  agentName: string
  userName?: string
  onClose: () => void
  /** When provided, the expand button is delegated to the host (e.g. the create-flow split
   *  view closes the split); otherwise the panel toggles its own 400px ↔ 640px width. */
  onExpand?: () => void
  /** Opens a recommendation's detail page — used by history threads that link to one
   *  (coaching feedback, recommendation visits). When omitted those threads open in place. */
  onOpenRecommendation?: (recommendationId: string) => void
  /** Fired when the scripted "create a review agent" flow finishes ("Build it") so the
   *  host can drop the first Library agent onto the canvas. */
  onBuildAgent?: () => void
}
