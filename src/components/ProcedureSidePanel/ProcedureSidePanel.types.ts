export interface ProcedureSidePanelStep {
  title: string
  bullets: string[]
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
