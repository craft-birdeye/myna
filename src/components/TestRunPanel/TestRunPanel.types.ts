import type { TestRunStep } from '../../data/testRunSteps'

export type TestRunStepStatus = 'pending' | 'running' | 'done'

export interface TestRunPanelProps {
  /** Ordered steps, one per canvas node the run walks through. */
  steps: TestRunStep[]
  /** Per-step state, aligned with `steps` — comes from `useTestRun`. */
  stepStatuses: TestRunStepStatus[]
  /** Index of the executing step, or -1 when the run has finished. */
  activeIndex: number
  /** Whether the run is still walking steps. */
  status: 'running' | 'complete'
  /** Closes the panel and clears all canvas highlighting. Fired by both the header ✕ and
   *  the footer "Exit test" button. */
  onExit: () => void
  /** Sep 1: "Task"/"Task output" reads "Action"/"Action output" instead. */
  taskLabel?: string
}
