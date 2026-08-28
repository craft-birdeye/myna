import type { RunLogStep, RunLogStepType } from '../components/RunDetailsPanel/RunDetailsPanel.types'
import {
  CALL_LOG_STEPS,
  REMINDER_CALL_LOG_STEPS,
} from '../components/LogDetailsPanel/LogDetailsPanel'
import type { HealthcareLogRow, LogStepId } from './healthcareAgentLogs'
import {
  HEALTHCARE_AGENT_WORKFLOWS,
  HEALTHCARE_REMINDER_NORTH_WORKFLOW,
  type AgentWorkflow,
} from './agentWorkflows'

export interface WorkflowNodeSeed {
  id: string
  flowType: string
  data: {
    title: string
    subtype?: string
    descriptionPlaceholder?: string
  }
}

export type LogStepPayloadSlice = Pick<
  RunLogStep,
  'output' | 'inputs' | 'tool' | 'note' | 'outputLabel' | 'durationMs'
>

const FLOW_TYPE_TO_STEP_TYPE: Record<string, RunLogStepType> = {
  trigger: 'trigger',
  task: 'task',
  procedures: 'procedures',
  delay: 'delay',
  branch: 'branch',
  subagent: 'task',
  voiceCall: 'task',
}

function pickPayloadFields(step: RunLogStep): LogStepPayloadSlice {
  const { output, inputs, tool, note, outputLabel, durationMs } = step
  return { output, inputs, tool, note, outputLabel, durationMs }
}

function zipStepsToPayloads(
  nodes: WorkflowNodeSeed[],
  steps: RunLogStep[],
): Record<string, LogStepPayloadSlice> {
  const map: Record<string, LogStepPayloadSlice> = {}
  nodes.forEach((node, index) => {
    const step = steps[index]
    if (step) map[node.id] = pickPayloadFields(step)
  })
  return map
}

function filterByImplementedSteps(
  nodes: WorkflowNodeSeed[],
  implementedSteps?: LogStepId[],
): WorkflowNodeSeed[] {
  if (!implementedSteps?.length) return nodes
  const allowed = new Set(implementedSteps)
  return nodes.filter((node) => {
    if (node.flowType === 'trigger') return allowed.has('trigger')
    if (node.flowType === 'procedures') return allowed.has('procedures')
    return true
  })
}

/** Ordered workflow nodes this run actually executed — same path the canvas highlights. */
export function collectExecutedWorkflowNodes(
  row: HealthcareLogRow,
  nodes: WorkflowNodeSeed[],
  nodeDetails: Record<string, unknown>,
): WorkflowNodeSeed[] {
  const indexNodes = (list: WorkflowNodeSeed[], byId: Map<string, WorkflowNodeSeed>) => {
    list.forEach((node) => {
      byId.set(node.id, node)
      const detail = nodeDetails[node.id] as { branches?: Array<{ id: string }> } | undefined
      if (!detail?.branches?.length) return
      detail.branches.forEach((branch) => {
        const path = nodeDetails[branch.id] as { nodes?: WorkflowNodeSeed[] } | undefined
        if (path?.nodes?.length) indexNodes(path.nodes, byId)
      })
    })
  }

  const explicit = row.executedNodeIds
  if (Array.isArray(explicit) && explicit.length > 0) {
    const byId = new Map<string, WorkflowNodeSeed>()
    indexNodes(nodes, byId)
    return explicit
      .map((id) => byId.get(id))
      .filter((node): node is WorkflowNodeSeed => Boolean(node))
  }

  if (row.status === 'In progress') {
    return filterByImplementedSteps(nodes.slice(0, Math.min(2, nodes.length)), row.implementedSteps)
  }

  const collected: WorkflowNodeSeed[] = []
  const visit = (items: WorkflowNodeSeed[]) => {
    items.forEach((node) => {
      collected.push(node)
      const detail = nodeDetails[node.id] as {
        branches?: Array<{ id: string; isFallback?: boolean }>
      } | undefined
      if (!detail?.branches?.length) return

      const chosen =
        row.status === 'Failed' || row.status === 'Not resolved'
          ? detail.branches.find((b) => b.isFallback) ?? detail.branches[detail.branches.length - 1]
          : detail.branches.find((b) => !b.isFallback) ?? detail.branches[0]

      const path = chosen
        ? (nodeDetails[chosen.id] as { nodes?: WorkflowNodeSeed[] } | undefined)
        : undefined
      if (path?.nodes?.length) visit(path.nodes)
    })
  }
  visit(nodes)
  return filterByImplementedSteps(collected, row.implementedSteps)
}

export function getExecutedNodeIds(
  row: HealthcareLogRow,
  nodes: WorkflowNodeSeed[],
  nodeDetails: Record<string, unknown>,
): string[] {
  return collectExecutedWorkflowNodes(row, nodes, nodeDetails).map((node) => node.id)
}

function buildFrontDeskPayloads(
  row: HealthcareLogRow,
  nodeDetails: Record<string, unknown>,
): Record<string, LogStepPayloadSlice> {
  const triggerStep = CALL_LOG_STEPS[0]
  const proceduresStep = CALL_LOG_STEPS[1]
  const procedureIds = (nodeDetails['fd-2'] as { procedureIds?: string[] } | undefined)?.procedureIds ?? []

  return {
    'fd-1': {
      ...pickPayloadFields(triggerStep),
      output: [
        { key: 'Source', value: row.channel },
        { key: 'Caller', value: row.contact },
        {
          key: 'Comments',
          value:
            triggerStep.output?.find((field) => field.key === 'Comments')?.value ??
            'I am having a very bad headache. I think it is migraine.',
        },
      ],
    },
    'fd-2': {
      ...pickPayloadFields(proceduresStep),
      output: [
        ...(proceduresStep.output ?? []).filter((field) => field.key !== 'Procedures available'),
        ...(procedureIds.length
          ? [
              {
                key: 'Procedures available',
                properties: procedureIds.map((name, index) => ({
                  key: String(index + 1),
                  value: name,
                })),
              },
            ]
          : []),
      ],
    },
  }
}

function buildReminderPayloads(): Record<string, LogStepPayloadSlice> {
  const ids = ['hcr-1', 'hcr-2', 'hcr-3', 'hcr-4', 'hcr-5', 'hcr-6']
  const map: Record<string, LogStepPayloadSlice> = {}
  ids.forEach((id, index) => {
    const step = REMINDER_CALL_LOG_STEPS[index]
    if (step) map[id] = pickPayloadFields(step)
  })
  return map
}

export function resolveAgentWorkflowForLog(
  instanceName: string,
  agentName: string,
): AgentWorkflow | undefined {
  if (instanceName === 'Reminder agent - North region') {
    return HEALTHCARE_REMINDER_NORTH_WORKFLOW
  }
  return HEALTHCARE_AGENT_WORKFLOWS[agentName]
}

export function buildLogRunSteps(
  row: HealthcareLogRow,
  workflow: AgentWorkflow,
  options: {
    agentName: string
    legacySteps?: RunLogStep[]
  },
): RunLogStep[] {
  const nodes = workflow.nodes as WorkflowNodeSeed[]
  const executedNodes = collectExecutedWorkflowNodes(row, nodes, workflow.nodeDetails)

  let payloads: Record<string, LogStepPayloadSlice> = {}
  if (options.agentName === 'Front desk agent' || options.agentName === 'Front desk agent (exploration)') {
    payloads = buildFrontDeskPayloads(row, workflow.nodeDetails)
  } else if (nodes[0]?.id === 'hcr-1') {
    payloads = buildReminderPayloads()
  } else if (options.legacySteps?.length) {
    payloads = zipStepsToPayloads(executedNodes, options.legacySteps)
  }

  return executedNodes.map((node, index) => {
    const type = FLOW_TYPE_TO_STEP_TYPE[node.flowType] ?? 'task'
    const payload = payloads[node.id] ?? {}
    return {
      id: `log-${node.id}`,
      type,
      stepNumber: index + 1,
      title: node.data?.title || 'Untitled step',
      ...payload,
    }
  })
}
