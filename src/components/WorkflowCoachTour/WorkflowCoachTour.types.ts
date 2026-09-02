export type WorkflowCoachPlacement = 'right' | 'bottom'

export interface WorkflowCoachStep {
  id: string
  title: string
  description: string
  /** One or more `data-tour-id` values; multi-id uses the combined bounding box. */
  anchorIds: string[]
  placement: WorkflowCoachPlacement
}

export interface WorkflowCoachTourProps {
  open: boolean
  onClose: () => void
  /** Override the default workflow-editor steps. */
  steps?: WorkflowCoachStep[]
}

export const WORKFLOW_COACH_STEPS: WorkflowCoachStep[] = [
  {
    id: 'create-with-ai',
    title: 'Create with AI',
    description:
      'Describe what you want your agent to do, and AI builds the workflow for you in minutes. Review and refine it before you activate.',
    anchorIds: ['create-with-ai'],
    placement: 'right',
  },
  {
    id: 'trigger',
    title: 'Trigger',
    description:
      'Choose what starts your agent. It can be a new review, an incoming message, or a schedule you set.',
    anchorIds: ['trigger'],
    placement: 'right',
  },
  {
    id: 'procedures',
    title: 'Procedures',
    description:
      'Add procedures so your agent knows what to do, what to collect, and how to respond to patients, every time.',
    anchorIds: ['procedures'],
    placement: 'right',
  },
  {
    id: 'action',
    title: 'Action',
    description:
      'Add the steps your agent takes to get the job done, automatically, every time.',
    anchorIds: ['tasks'],
    placement: 'right',
  },
  {
    id: 'controls',
    title: 'Controls',
    description:
      'Add conditions and branches so your agent knows exactly which route to take in any situation.',
    anchorIds: ['controls'],
    placement: 'right',
  },
  {
    id: 'test-run',
    title: 'Run test',
    description:
      'Test your agent so you know exactly how it will perform before you activate it.',
    anchorIds: ['test-run'],
    placement: 'bottom',
  },
  {
    id: 'publish',
    title: 'Activate',
    description:
      'Activate once your agent is fully configured and tested, so it runs automatically when triggered.',
    anchorIds: ['publish'],
    placement: 'bottom',
  },
]

/** Coach steps with optional Procedures step (Front desk only). */
export function buildWorkflowCoachSteps(options?: {
  includeProcedures?: boolean
  /** Matches the header run-test button — "Preview" on front desk, "Run test" elsewhere. */
  testRunTitle?: string
}): WorkflowCoachStep[] {
  const includeProcedures = options?.includeProcedures ?? true
  const testRunTitle = options?.testRunTitle ?? 'Run test'
  return WORKFLOW_COACH_STEPS.filter((step) => includeProcedures || step.id !== 'procedures').map(
    (step) => (step.id === 'test-run' ? { ...step, title: testRunTitle } : step),
  )
}
