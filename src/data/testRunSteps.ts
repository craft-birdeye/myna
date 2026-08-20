/**
 * Test-run step data for the "Run test" RHS panel.
 *
 * Steps mirror the canvas node cards one-for-one so the panel and the canvas can be driven from
 * a single index. Payloads (tool / output / inputs) are placeholder for now — every card gets the
 * same canned block until real test execution data exists.
 */
import type {
  RunLogField,
  RunLogStep,
  RunLogStepType,
} from '../components/RunDetailsPanel/RunDetailsPanel.types'

export interface TestRunStep extends RunLogStep {
  /** Canvas node this step mirrors — drives the node highlight and auto-pan. */
  nodeId: string
}

/** Canvas `flowType` → the step types `TYPE_META` knows how to render. */
const FLOW_TYPE_TO_STEP_TYPE: Record<string, RunLogStepType> = {
  trigger: 'trigger',
  task: 'task',
  procedures: 'procedures',
  delay: 'delay',
  branch: 'branch',
}

/* ── Placeholder payloads ──────────────────────────────────────────────────── */

const PLACEHOLDER_TOOL_PROPERTIES: RunLogField[] = [
  { key: 'Source', value: 'Google' },
  { key: 'Rating', value: '2 Star' },
  {
    key: 'Comments',
    value:
      'Terrible experience at Aspen Dental on Oak street. I waited over 45 minutes past my scheduled appointment',
  },
  {
    key: 'Reviewer',
    properties: [
      { key: 'Name', value: 'Sarah Jones' },
      {
        key: 'Contact',
        properties: [
          { key: 'Email', value: 'Sarah Jones@birdeye.com' },
          { key: 'ID', value: 'Bird_82391' },
        ],
      },
    ],
  },
  { key: 'Source type', value: 'Google' },
  { key: 'Has comment', value: 'True' },
  { key: 'Has edit', value: 'True' },
]

const PLACEHOLDER_OUTPUT: RunLogField[] = [
  { key: 'Status', value: 'Success' },
  { key: 'Duration', value: '1.2s' },
]

const PLACEHOLDER_INPUTS: RunLogField[] = [
  { key: 'Location', value: 'Aspen Dental — Oak Street' },
  { key: 'Channel', value: 'Google' },
]

/* ── Builder ───────────────────────────────────────────────────────────────── */

interface WorkflowNode {
  id: string
  flowType?: string
  data?: { title?: string }
}

/**
 * Flattens a workflow into the ordered list of steps a test run walks through.
 *
 * Branch nodes contribute their own step, then the run continues into the first non-fallback
 * path only — the untaken paths stay idle on the canvas, matching "highlight the active paths".
 */
export function buildTestRunSteps(
  nodes: WorkflowNode[],
  nodeDetails: Record<string, unknown>,
  /** Prompt typed into the Run-test modal — threaded into the Query fanout agent's
   *  "Collect user prompt" / "Generate fanout queries and output prompt" steps in place of
   *  the placeholder fields. No-op for every other agent's nodes. */
  collectedPrompt?: string,
): TestRunStep[] {
  const steps: TestRunStep[] = []

  const visit = (list: WorkflowNode[]) => {
    list.forEach((node) => {
      const type = FLOW_TYPE_TO_STEP_TYPE[node.flowType ?? ''] ?? 'task'
      const isCollectPromptStep = collectedPrompt && node.id === 'qf-2'
      const isGenerateFanoutStep = collectedPrompt && node.id === 'qf-4'
      steps.push({
        id: `test-${node.id}`,
        nodeId: node.id,
        type,
        stepNumber: steps.length + 1,
        title: node.data?.title || 'Untitled step',
        output: isCollectPromptStep
          ? [{ key: 'User prompt', value: collectedPrompt }]
          : PLACEHOLDER_OUTPUT,
        inputs: isGenerateFanoutStep
          ? [{ key: 'Prompt.userPrompt', value: collectedPrompt }]
          : isCollectPromptStep
            ? []
            : PLACEHOLDER_INPUTS,
        tool: { name: 'Review responder', properties: PLACEHOLDER_TOOL_PROPERTIES },
      })

      if (type !== 'branch') return

      const detail = nodeDetails[node.id] as
        | { branches?: { id: string; isFallback?: boolean }[] }
        | undefined
      const taken = detail?.branches?.find((b) => !b.isFallback) ?? detail?.branches?.[0]
      if (!taken) return

      const path = nodeDetails[taken.id] as { nodes?: WorkflowNode[] } | undefined
      if (path?.nodes?.length) visit(path.nodes)
    })
  }

  visit(nodes)
  return steps
}
