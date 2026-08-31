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
  /** Override the default six workflow-editor steps. */
  steps?: WorkflowCoachStep[]
}

export const WORKFLOW_COACH_STEPS: WorkflowCoachStep[] = [
  {
    id: 'create-with-ai',
    title: 'Create with AI',
    description:
      'Describe what you want your workflow to do, and AI will help you build it. You can review and refine the workflow before publishing.',
    anchorIds: ['create-with-ai'],
    placement: 'right',
  },
  {
    id: 'trigger',
    title: 'Trigger',
    description:
      'Set the event that starts your workflow. A trigger can be something like a new review, an incoming message, or a scheduled event.',
    anchorIds: ['trigger'],
    placement: 'right',
  },
  {
    id: 'procedures',
    title: 'Procedures',
    description:
      'Add procedures to guide your front desk agent through common situations. Define the steps it should follow, the information it should collect, and how it should respond to customers.',
    anchorIds: ['procedures'],
    placement: 'right',
  },
  {
    id: 'tasks-controls',
    title: 'Action & controls',
    description:
      'Add actions to define what your workflow does. Use conditions and other controls to decide how the workflow should move from one step to the next.',
    anchorIds: ['tasks', 'controls'],
    placement: 'right',
  },
  {
    id: 'test-run',
    title: 'Run test',
    description:
      'Run your workflow to see how each step behaves and make sure everything works as expected before turning it on.',
    anchorIds: ['test-run'],
    placement: 'bottom',
  },
  {
    id: 'publish',
    title: 'Activate',
    description:
      'Once your workflow is configured and tested, activate it to start running automatically when your trigger occurs.',
    anchorIds: ['publish'],
    placement: 'bottom',
  },
]

const FRONT_DESK_PREVIEW_STEP_COPY = {
  title: 'Preview',
  description:
    'Test your agent to see how it handles inbound calls, texts, and chats. Walk through common front desk scenarios and confirm each step works before you activate it.',
} as const

/** Coach steps with optional Procedures step and front desk Preview wording. */
export function buildWorkflowCoachSteps(options?: {
  includeProcedures?: boolean
  frontDeskPreview?: boolean
}): WorkflowCoachStep[] {
  const includeProcedures = options?.includeProcedures ?? true
  const frontDeskPreview = options?.frontDeskPreview ?? false

  return WORKFLOW_COACH_STEPS.filter((step) => includeProcedures || step.id !== 'procedures').map(
    (step) =>
      frontDeskPreview && step.id === 'test-run'
        ? { ...step, ...FRONT_DESK_PREVIEW_STEP_COPY }
        : step,
  )
}
