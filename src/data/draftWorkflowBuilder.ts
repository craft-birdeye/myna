// Builds a demo-plausible `AgentWorkflow` for a not-yet-created agent straight out of the
// "Create agent" ghostwriter chat's own script + jobs checklist — used by the Agents
// module's "View agent builder" hand-off (see `SuperAgentCreateScreen.tsx` /
// `WorkflowEditorScreen.tsx`'s `initialWorkflow` prop) so the canvas opens with real,
// plausible nodes instead of a blank trigger. This is additive only — it never touches
// `agentWorkflows.ts`'s own exported maps/constants, which back real, already-created
// agents keyed by display name.
import type { AgentWorkflow } from './agentWorkflows'
import type { AgentCreateScript } from './agentCreateFamilyScripts'

// Simple keyword → tool id matching against a job's own wording. Only genuinely fitting
// tools are attached — a job with no match keeps an empty `tools` array rather than
// forcing one. Ids must exist in `_SEED_TOOLS` (src/workflow/services/agentService.js).
const JOB_TOOL_RULES: { toolId: string; keywords: string[] }[] = [
  { toolId: 'schedule-appointment', keywords: ['book', 'appointment', 'reschedule', 'schedule'] },
  { toolId: 'send-confirmation', keywords: ['confirm', 'reminder', 'notify', 'nudge', 'follow-up', 'follow up'] },
  { toolId: 'crm-update', keywords: ['crm', 'lead', 'contact record', 'log'] },
  { toolId: 'dms-integration', keywords: ['record lookup', 'patient record', 'ehr', 'dms', 'insurance'] },
  { toolId: 'trigger-escalation', keywords: ['escalate', 'human', 'urgent', 'sensitive'] },
  { toolId: 'intent-classifier', keywords: ['triage', 'classify', 'route', 'department'] },
]

function toolsForJob(job: string): string[] {
  const lower = job.toLowerCase()
  const matched = JOB_TOOL_RULES.filter((rule) => rule.keywords.some((kw) => lower.includes(kw))).map(
    (rule) => rule.toolId,
  )
  return [...new Set(matched)]
}

function taskTitleForJob(job: string): string {
  // Sentence case, trimmed — jobs are already written as short imperative phrases
  // ("Book an appointment"), which double as reasonable task titles as-is.
  return job.charAt(0).toUpperCase() + job.slice(1)
}

/** Builds a simple, linear (non-branching) draft workflow: one trigger node followed by
 *  one task node per job in `jobs` — demo-plausible, not production-accurate. */
export function buildDraftWorkflow(script: AgentCreateScript, jobs: string[], agentName: string): AgentWorkflow {
  const triggerNode =
    script.triggerKind === 'conversation'
      ? {
          id: 'draft-1',
          flowType: 'trigger' as const,
          data: {
            subtype: 'Conversation trigger',
            headerLabel: 'Conversation trigger',
            title: 'Conversation trigger',
            hasToggle: true,
            toggleEnabled: true,
            hasAiIcon: false,
            titlePlaceholder: 'Enter trigger name',
            descriptionPlaceholder: 'Enter description',
          },
        }
      : {
          id: 'draft-1',
          flowType: 'trigger' as const,
          data: {
            subtype: 'Schedule-based',
            headerLabel: 'Schedule-based',
            title: 'Schedule-based trigger',
            hasToggle: true,
            toggleEnabled: true,
            hasAiIcon: false,
            titlePlaceholder: 'Enter trigger name',
            descriptionPlaceholder: 'Enter description',
          },
        }

  const taskNodes = jobs.map((job, i) => ({
    id: `draft-task-${i + 1}`,
    flowType: 'task' as const,
    data: {
      title: taskTitleForJob(job),
      subtype: 'Custom',
      hasToggle: true,
      toggleEnabled: true,
      hasAiIcon: true,
      titlePlaceholder: 'Enter task name',
      descriptionPlaceholder: 'Enter description',
    },
  }))

  const nodeDetails: Record<string, unknown> = {
    '__start__': {
      agentName,
      goals: script.introParagraphs[0] ?? `Handle the jobs this agent was built for: ${jobs.join(', ')}.`,
      outcomes: script.summaryBullets.join('\n'),
      locations: [] as string[],
    },
    'draft-1':
      script.triggerKind === 'conversation'
        ? {
            triggerName: 'Conversation trigger',
            description: 'Agent triggers when a voice, chat, or text conversation starts',
            voiceConditions: [{ field: 'event', operator: 'is', value: 'Incoming call' }],
            webchatConditions: [{ field: 'event', operator: 'is', value: 'Message received' }],
          }
        : {
            triggerName: 'Schedule-based trigger',
            description: 'Agent runs on the schedule/event this family is built around',
            frequency: 'Daily',
            day: 'Every day',
            time: '9:00 AM',
          },
  }

  jobs.forEach((job, i) => {
    nodeDetails[`draft-task-${i + 1}`] = {
      taskName: taskTitleForJob(job),
      description: job,
      tools: toolsForJob(job),
    }
  })

  return {
    nodes: [triggerNode, ...taskNodes],
    nodeDetails,
  }
}
