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
  /** Override the default five workflow-editor steps. */
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
    id: 'tasks-controls',
    title: 'Tasks & controls',
    description:
      'Add tasks to define what your workflow does. Use conditions and other controls to decide how the workflow should move from one step to the next.',
    anchorIds: ['tasks', 'controls'],
    placement: 'right',
  },
  {
    id: 'test-run',
    title: 'Test run',
    description:
      'Run your workflow to see how each step behaves and make sure everything works as expected before turning it on.',
    anchorIds: ['test-run'],
    placement: 'bottom',
  },
  {
    id: 'publish',
    title: 'Publish',
    description:
      'Once your workflow is configured and tested, publish it to start running automatically when your trigger occurs.',
    anchorIds: ['publish'],
    placement: 'bottom',
  },
]
