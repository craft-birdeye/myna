/**
 * Test-run step data for the "Run test" RHS panel.
 *
 * Steps mirror the canvas node cards one-for-one so the panel and the canvas can be driven from
 * a single index. Tool / output / inputs are derived from each node's own `nodeDetails` entry
 * (task name, selected tool ids, LLM prompt fields, etc.) so a step's payload actually matches
 * the workflow it belongs to, with a generic fallback for nodes with no such detail yet.
 */
import { getSeedTools } from '../workflow/services/agentService'
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

/* ── Generic payloads (agent-neutral — used only when a node has no detail to derive from) ─── */

const GENERIC_OUTPUT: RunLogField[] = [
  { key: 'Status', value: 'Success' },
  { key: 'Duration', value: '1.2s' },
]

function toolNameForId(id?: string): string | undefined {
  if (!id) return undefined
  return getSeedTools().find((t) => t.id === id)?.name
}

/** Builds the "Tool" block from a node's own detail rather than a fixed placeholder. */
function buildTool(
  detail: Record<string, any> | undefined,
  node: WorkflowNode,
): { name: string; properties: RunLogField[] } {
  const toolId: string | undefined = detail?.selectedTools?.[0]
  const name =
    toolNameForId(toolId) ?? detail?.taskName ?? detail?.triggerName ?? node.data?.title ?? 'Task'

  const properties: RunLogField[] = []
  if (detail?.selectedTools?.length) {
    properties.push({ key: 'Tools', value: detail.selectedTools.map((id: string) => toolNameForId(id) ?? id).join(', ') })
  }
  if (detail?.procedureIds?.length) properties.push({ key: 'Procedures', value: detail.procedureIds.join(', ') })
  if (detail?.systemPrompt) properties.push({ key: 'System prompt', value: detail.systemPrompt })
  if (detail?.userPrompt) properties.push({ key: 'User prompt', value: detail.userPrompt })
  if (!properties.length) properties.push({ key: 'Status', value: 'Success' })

  return { name, properties }
}

/** Builds the "Inputs" block from a node's own `inputFields`/`contextFields`, when present. */
function buildInputs(detail: Record<string, any> | undefined): RunLogField[] {
  const fields = detail?.inputFields ?? detail?.contextFields
  if (!Array.isArray(fields) || !fields.length) return []
  return fields.map((f, i) => ({ key: `Input ${i + 1}`, value: String(f?.value ?? f) }))
}

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
      const detail = nodeDetails[node.id] as Record<string, any> | undefined
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
          : GENERIC_OUTPUT,
        inputs: isGenerateFanoutStep
          ? [{ key: 'Prompt.userPrompt', value: collectedPrompt }]
          : isCollectPromptStep
            ? []
            : buildInputs(detail),
        tool: buildTool(detail, node),
      })

      if (type !== 'branch') return

      const branchDetail = detail as { branches?: { id: string; isFallback?: boolean }[] } | undefined
      const taken = branchDetail?.branches?.find((b) => !b.isFallback) ?? branchDetail?.branches?.[0]
      if (!taken) return

      const path = nodeDetails[taken.id] as { nodes?: WorkflowNode[] } | undefined
      if (path?.nodes?.length) visit(path.nodes)
    })
  }

  visit(nodes)
  return steps
}
