/**
 * Drives a simulated test run over a workflow's steps.
 *
 * Single source of truth for both surfaces — the RHS `TestRunPanel` and the canvas node
 * highlighting read the same `activeIndex`/`doneIds`, so they can't drift out of sync.
 * Auto-starts on mount and advances one step every `stepMs`.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { TestRunStep } from '../data/testRunSteps'

export const TEST_RUN_STEP_MS = 1800

export type TestRunStatus = 'running' | 'complete'

export interface UseTestRunResult {
  /** Index of the step currently executing, or -1 once the run has finished. */
  activeIndex: number
  /** Canvas node id currently executing, or null once finished. */
  activeNodeId: string | null
  /** Canvas node ids that have finished. */
  doneNodeIds: string[]
  status: TestRunStatus
  /** Per-step state, aligned with the `steps` array. */
  stepStatuses: ('pending' | 'running' | 'done')[]
}

export function useTestRun(steps: TestRunStep[], stepMs = TEST_RUN_STEP_MS): UseTestRunResult {
  // -1 before the first tick lands; steps.length once every step has finished.
  const [cursor, setCursor] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setCursor(0)
  }, [steps])

  useEffect(() => {
    if (cursor >= steps.length) return
    timerRef.current = setTimeout(() => setCursor((c) => c + 1), stepMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [cursor, steps.length, stepMs])

  return useMemo(() => {
    const complete = cursor >= steps.length
    return {
      activeIndex: complete ? -1 : cursor,
      activeNodeId: complete ? null : (steps[cursor]?.nodeId ?? null),
      doneNodeIds: steps.slice(0, cursor).map((s) => s.nodeId),
      status: complete ? 'complete' : 'running',
      stepStatuses: steps.map((_, i) => (i < cursor ? 'done' : i === cursor ? 'running' : 'pending')),
    }
  }, [cursor, steps])
}
