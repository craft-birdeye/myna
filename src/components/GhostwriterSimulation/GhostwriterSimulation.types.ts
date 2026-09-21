import type { SimResult, SimTestCase } from '../../data/ghostwriterSimulation'

/** Where the tab is in its lifecycle: nothing yet → the agent is writing tests → tests exist. */
export type SimulationPhase = 'empty' | 'generating' | 'ready'

export interface GhostwriterSimulationProps {
  /**
   * Whether the Simulation tab is the one on screen. The component stays mounted when it
   * isn't (hidden with `display:none`) so generated tests and their results survive a trip
   * to Workflow and back — unmounting would silently throw the run away.
   */
  active?: boolean
  /** Fired when something worth a toast happens (tests generated, run finished, test added). */
  onNotify?: (message: string) => void
  className?: string
}

/** A test plus the outcome of the last run in this session. */
export interface SimulationRow extends SimTestCase {
  /** `not-run` until the row has been through a run. */
  status: SimResult
  /** Set while this row is executing. */
  busy: boolean
  /** `DataTable`'s generic is constrained to `Record<string, unknown>`. */
  [key: string]: unknown
}
