export interface ProcedureSidePanelStep {
  title: string
  bullets: string[]
  /** Bullets in `bullets` that are new in this update — rendered in green with an "Added" chip.
   *  Must match entries in `bullets` exactly (string equality). Omit for a "Procedure created"
   *  panel with nothing to diff against. */
  addedBullets?: string[]
  /** Bullets from the previous version of this step that no longer appear — rendered with a
   *  strikethrough in red, appended after this step's current bullets. */
  removedBullets?: string[]
}

export interface ProcedureSidePanelProps {
  open: boolean
  title: string
  whenToUse?: string
  steps: ProcedureSidePanelStep[]
  /** Shown in the "When to exit this procedure?" section, below Steps. */
  exitCriteria?: string
  onClose: () => void
}
