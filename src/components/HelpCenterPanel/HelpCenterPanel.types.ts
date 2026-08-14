export type HelpCenterView = 'home' | 'videos' | 'tours' | 'articles'

export interface HelpVideoItem {
  id: string
  title: string
  description: string
  duration: string
  /** Tailwind bg token class for the thumbnail placeholder */
  thumbClassName: string
}

export interface HelpTourItem {
  id: string
  title: string
  description: string
  /** Material Symbol name */
  icon: string
  iconBgClassName: string
  iconColorClassName: string
  /** When true, Start tour invokes onStartTour */
  startsCoachTour?: boolean
}

export interface HelpArticleItem {
  id: string
  title: string
  description: string
}

export interface HelpCenterPanelProps {
  open: boolean
  onClose: () => void
  /** Called when the user starts the Workflow builder basics tour (or any startsCoachTour item). */
  onStartTour?: (tourId: string) => void
}

export const HELP_VIDEOS: HelpVideoItem[] = [
  {
    id: 'getting-started',
    title: 'Getting started with Workflow Builder',
    description: 'Learn the basics of creating and configuring workflows',
    duration: '4:32',
    thumbClassName: 'bg-ai-summary',
  },
  {
    id: 'first-workflow',
    title: 'Create your first workflow',
    description: 'Step-by-step guide to building a simple automation',
    duration: '3:15',
    thumbClassName: 'bg-chip-info-bg',
  },
  {
    id: 'review-response',
    title: 'Creating a Review response agent',
    description: 'Deep dive into workflow to create an agent',
    duration: '5:47',
    thumbClassName: 'bg-chip-success-bg',
  },
  {
    id: 'triggers-tour',
    title: 'Setting up triggers',
    description: 'Choose the right event to start your workflow',
    duration: '2:48',
    thumbClassName: 'bg-chip-warning-bg',
  },
  {
    id: 'test-publish-video',
    title: 'Test run and publish',
    description: 'Validate your flow before turning it on',
    duration: '4:05',
    thumbClassName: 'bg-surface-selected',
  },
]

export const HELP_TOURS: HelpTourItem[] = [
  {
    id: 'workflow-basics',
    title: 'Workflow builder basics',
    description: 'Learn the core features of the Workflow Builder canvas.',
    icon: 'explore',
    iconBgClassName: 'bg-chip-info-bg',
    iconColorClassName: 'text-chip-info-text',
    startsCoachTour: true,
  },
  {
    id: 'from-scratch',
    title: 'Build a workflow from scratch',
    description: 'Start with a blank canvas and add your first nodes.',
    icon: 'construction',
    iconBgClassName: 'bg-ai-summary',
    iconColorClassName: 'text-ai-brand',
  },
  {
    id: 'configure-triggers',
    title: 'Configure triggers',
    description: 'Set up events that start your agent workflows.',
    icon: 'bolt',
    iconBgClassName: 'bg-chip-warning-bg',
    iconColorClassName: 'text-chip-warning-text',
  },
  {
    id: 'actions-conditions',
    title: 'Add actions and conditions',
    description: 'Use tasks and controls to shape your workflow logic.',
    icon: 'layers',
    iconBgClassName: 'bg-chip-success-bg',
    iconColorClassName: 'text-chip-success-text',
  },
  {
    id: 'test-publish',
    title: 'Test and publish',
    description: 'Run a test and publish when everything looks right.',
    icon: 'check_circle',
    iconBgClassName: 'bg-chip-info-bg',
    iconColorClassName: 'text-accent-positive',
  },
]

export const HELP_ARTICLES: HelpArticleItem[] = [
  {
    id: 'overview',
    title: 'Workflow Builder overview',
    description: 'What you can build and how the canvas is organized.',
  },
  {
    id: 'triggers',
    title: 'Understanding triggers',
    description: 'Conversation, schedule, and entity triggers explained.',
  },
  {
    id: 'tasks',
    title: 'Working with tasks',
    description: 'Add tools, configure inputs, and chain task steps.',
  },
  {
    id: 'publish',
    title: 'Publishing and drafts',
    description: 'Save as draft, publish, and manage version history.',
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting common issues',
    description: 'Resolve publish blockers and failed test runs.',
  },
]
