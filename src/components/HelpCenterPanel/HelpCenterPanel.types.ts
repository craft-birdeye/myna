export type HelpCenterView = 'home' | 'videos' | 'articles'

export interface HelpVideoItem {
  id: string
  title: string
  description: string
  duration: string
}

export interface HelpArticleItem {
  id: string
  title: string
  description: string
}

export interface HelpGlossaryItem {
  id: string
  term: string
  /** One-line summary shown in the left list */
  summary: string
  definition: string
  example: string
  visualCaption: string
  category: string
}

export interface HelpCenterPanelProps {
  open: boolean
  onClose: () => void
  /** Starts the Agent builder basics coach tour. */
  onStartTour?: (tourId?: string) => void
  /** Opens the Glossary popup (Figma `15988:11969`). */
  onOpenGlossary?: () => void
}

export const HELP_VIDEOS: HelpVideoItem[] = [
  {
    id: 'getting-started',
    title: 'Getting started with agent builder',
    description: 'Learn the basics of creating and configuring workflows',
    duration: '4:32',
  },
  {
    id: 'first-workflow',
    title: 'Create your first workflow',
    description: 'Step-by-step guide to building your first automation',
    duration: '3:15',
  },
  {
    id: 'review-response',
    title: 'Creating a Review response agent',
    description: 'Deep dive into workflow to create an agent',
    duration: '5:47',
  },
  {
    id: 'triggers-tasks',
    title: 'Working with triggers and tasks',
    description: 'Connect events to actions and keep your flow organized',
    duration: '4:10',
  },
  {
    id: 'branches-conditions',
    title: 'Using branches and conditions',
    description: 'Split your flow based on review rating or other rules',
    duration: '3:40',
  },
  {
    id: 'test-publish',
    title: 'Test run and publish',
    description: 'Validate your flow before turning it on',
    duration: '4:05',
  },
  {
    id: 'llm-tasks',
    title: 'Configuring LLM tasks',
    description: 'Set up prompts, inputs, outputs, and context',
    duration: '5:20',
  },
  {
    id: 'coach-feedback',
    title: 'Coaching your agent with feedback',
    description: 'Improve replies using recommendations and coaching',
    duration: '3:55',
  },
]

export const HELP_ARTICLES: HelpArticleItem[] = [
  {
    id: 'overview',
    title: 'Workflow builder overview',
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

/** Glossary terms for Figma Agent ARC `15988:11969` popup. */
export const HELP_GLOSSARY: HelpGlossaryItem[] = [
  {
    id: 'workflow',
    category: 'Workflow',
    term: 'Workflow',
    summary: 'A sequence of steps that an agent follows to achieve a specific goal',
    definition:
      'A workflow is a sequence of steps that an agent follows to achieve a specific goal. It defines what the agent does, when it does it, and what happens next.',
    example: '',
    visualCaption: 'Workflow canvas showing connected steps',
  },
  {
    id: 'agent-goal',
    category: 'Workflow',
    term: 'Agent goal',
    summary: 'What the agent is designed to accomplish',
    definition:
      'The goal defines what the agent is designed to accomplish. It provides the overall purpose and desired result of the agent.',
    example:
      'Goal: Respond to customer reviews\nOutcome: A personalized response is generated and published.',
    visualCaption: 'Agent goal field in agent details',
  },
  {
    id: 'outcome',
    category: 'Workflow',
    term: 'Outcome',
    summary: 'The measurable result an agent is expected to produce',
    definition:
      'An outcome is the result an agent is expected to produce after completing its goal. These outcomes are measurable metrics.',
    example:
      'Goal: Respond to customer reviews\nOutcome: A personalized response is generated and published.',
    visualCaption: 'Outcomes listed in agent details',
  },
  {
    id: 'location-settings',
    category: 'Workflow',
    term: 'Location settings',
    summary: 'Which business locations the agent applies to',
    definition:
      'Location settings define which business locations the agent applies to and allow you to configure location-specific agents.',
    example: '',
    visualCaption: 'Location settings in agent configuration',
  },
  {
    id: 'trigger',
    category: 'Triggers',
    term: 'Trigger',
    summary: 'The first step that determines when a workflow starts',
    definition:
      'A trigger is the first step in a workflow. It determines when the workflow should start.\n\nThe trigger can be replaced if you want the workflow to start in a different way.',
    example: '',
    visualCaption: 'Trigger node on the workflow canvas',
  },
  {
    id: 'event-based-trigger',
    category: 'Triggers',
    term: 'Event-based trigger',
    summary: 'Starts a workflow when a specific event occurs',
    definition: 'Starts a workflow when a specific event occurs.',
    example: 'A new customer review is received.',
    visualCaption: 'Event-based trigger configuration',
  },
  {
    id: 'schedule-based-trigger',
    category: 'Triggers',
    term: 'Schedule-based trigger',
    summary: 'Starts a workflow at a specific time or recurring schedule',
    definition: 'Starts a workflow at a specific time or recurring schedule.',
    example: 'Run every Monday at 9 AM.',
    visualCaption: 'Schedule-based trigger configuration',
  },
  {
    id: 'task',
    category: 'Tasks',
    term: 'Task',
    summary: 'An action the agent performs as part of a workflow',
    definition:
      'A task is an action the agent performs as part of a workflow. Tasks allow the agent to process information, make decisions, use tools, or generate an output.',
    example: '',
    visualCaption: 'Task node on the workflow canvas',
  },
  {
    id: 'custom-task',
    category: 'Tasks',
    term: 'Custom task',
    summary: 'An LLM task you define with your own prompts and outputs',
    definition:
      'An LLM task you define using your own System and User prompts, inputs, context, and expected outputs.',
    example: '',
    visualCaption: 'Custom task configuration panel',
  },
  {
    id: 'task-as-tool-call',
    category: 'Tasks',
    term: 'Task as a tool call',
    summary: 'A task that uses a tool to act or retrieve information',
    definition:
      'A task that allows the agent to use a tool to perform an action or retrieve information.',
    example: '',
    visualCaption: 'Tool call task on the workflow canvas',
  },
  {
    id: 'internal-tool',
    category: 'Tasks',
    term: 'Internal tool',
    summary: 'A tool provided within Birdeye for the agent to use',
    definition:
      'A tool provided within Birdeye that the agent can use to perform an action or access information.',
    example: '',
    visualCaption: 'Internal tool picker in a task',
  },
  {
    id: 'external-tool',
    category: 'Tasks',
    term: 'External tool',
    summary: 'A tool or service outside the platform the agent can use',
    definition:
      'A tool or service outside the platform that the agent can integrate to and use.',
    example: '',
    visualCaption: 'External tool connection in a task',
  },
  {
    id: 'llm-task',
    category: 'Tasks',
    term: 'LLM task',
    summary: 'Uses a language model to process information and generate output',
    definition:
      'An LLM task uses a language model to process information and generate an output based on your instructions and the context provided.',
    example: '',
    visualCaption: 'LLM task configuration panel',
  },
  {
    id: 'llm-model',
    category: 'Tasks',
    term: 'LLM model',
    summary: 'The language model used by the task',
    definition:
      'The language model used by the task to understand inputs, reason over context, and generate outputs.',
    example: '',
    visualCaption: 'LLM model selector in a task',
  },
  {
    id: 'context',
    category: 'Context & prompts',
    term: 'Context',
    summary: 'Information available to the model for completing a task',
    definition:
      'The information available to the model for completing a task.\n\nContext can include:\nFields — Data available from the workflow or customer record.\nKnowledge — Relevant information the agent can reference, such as links, docs.\nBrand — Brand-specific guidelines, tone, and preferences.',
    example: '',
    visualCaption: 'Context panel with Fields, Knowledge, and Brand',
  },
  {
    id: 'input-field',
    category: 'Context & prompts',
    term: 'Input field',
    summary: 'A piece of information provided to the task as an input',
    definition: 'A piece of information provided to the task as an input.',
    example: 'Customer name, review text, ticket details.',
    visualCaption: 'Input fields configured on a task',
  },
  {
    id: 'system-prompt',
    category: 'Context & prompts',
    term: 'System prompt',
    summary: 'Instructions that define the agent persona for the task',
    definition: 'Instructions that define the agent persona while completing the task.',
    example: '',
    visualCaption: 'System prompt editor in an LLM task',
  },
  {
    id: 'user-prompt',
    category: 'Context & prompts',
    term: 'User prompt',
    summary: 'The instruction that tells the model what to do for this task',
    definition:
      'The specific instruction that tells the model what to do for this task. User can feed fields that are output of previous tasks as input for another. Specific tools can also be invoked within user prompt that enables to perform the task.',
    example: '',
    visualCaption: 'User prompt editor in an LLM task',
  },
  {
    id: 'output-field',
    category: 'Context & prompts',
    term: 'Output field',
    summary: 'Structured information generated by the task for later steps',
    definition:
      'A structured piece of information generated by the task and made available for use in later workflow steps. User can configure their own output as well.',
    example: '',
    visualCaption: 'Output fields configured on a task',
  },
  {
    id: 'generate-output-fields',
    category: 'Context & prompts',
    term: 'Generate output fields from prompt',
    summary: 'Automatically create output fields from the task instructions',
    definition:
      'Automatically identify and create output fields based on the information the task is instructed to produce.',
    example: '',
    visualCaption: 'Generate output fields action in a task',
  },
  {
    id: 'output-field-types',
    category: 'Context & prompts',
    term: 'Output field types',
    summary: 'The format of information produced by the task',
    definition:
      'The format of the information produced by the task, such as text, number, boolean, or other supported field types.',
    example: '',
    visualCaption: 'Output field type selector',
  },
  {
    id: 'add-tools-to-user-prompt',
    category: 'Context & prompts',
    term: 'Add tools to user prompt',
    summary: 'Make tools available to the model while completing the task',
    definition:
      'Make tools available to the model so it can use them while completing the task.',
    example: '',
    visualCaption: 'Tools attached to a user prompt',
  },
  {
    id: 'add-variables-to-user-prompt',
    category: 'Context & prompts',
    term: 'Add variables to user prompt',
    summary: 'Insert dynamic workflow data into the prompt',
    definition:
      'Insert dynamic workflow data into the prompt so the model can use information that changes for each execution.',
    example: '',
    visualCaption: 'Variables inserted into a user prompt',
  },
  {
    id: 'prompt-strength',
    category: 'Context & prompts',
    term: 'Prompt strength',
    summary: 'How strongly the prompt steers model behavior',
    definition: 'Details for this term are coming soon.',
    example: '',
    visualCaption: 'Prompt strength control in an LLM task',
  },
  {
    id: 'task-preview',
    category: 'Context & prompts',
    term: 'Task preview',
    summary: 'Preview how a task processes inputs and generates output',
    definition:
      'Preview how a task processes its inputs and context and what output it is expected to generate.',
    example: '',
    visualCaption: 'Task preview panel',
  },
  {
    id: 'delay',
    category: 'Controls',
    term: 'Delay',
    summary: 'Pauses the workflow before continuing to the next step',
    definition:
      'Pauses the workflow for a specified amount of time before continuing to the next step.',
    example: '',
    visualCaption: 'Delay node on the workflow canvas',
  },
  {
    id: 'branch',
    category: 'Controls',
    term: 'Branch',
    summary: 'Follow different paths based on defined rules',
    definition:
      'A branch allows a workflow to follow different paths based on defined rules.',
    example: '',
    visualCaption: 'Branch node on the workflow canvas',
  },
  {
    id: 'branch-based-on-conditions',
    category: 'Controls',
    term: 'Branch based on conditions',
    summary: 'Routes the workflow when specific conditions are met',
    definition: 'Routes the workflow based on whether specific conditions are met.',
    example: '',
    visualCaption: 'Condition-based branch configuration',
  },
  {
    id: 'branch-based-on-percentage',
    category: 'Controls',
    term: 'Branch based on percentage',
    summary: 'Splits workflow traffic between paths by percentage',
    definition: 'Splits workflow traffic between different paths by percentage.',
    example: '',
    visualCaption: 'Percentage-based branch configuration',
  },
  {
    id: 'branch-based-on-fields',
    category: 'Controls',
    term: 'Branch based on fields',
    summary: 'Routes the workflow based on a selected field value',
    definition: 'Routes the workflow based on the value of a selected field.',
    example: '',
    visualCaption: 'Field-based branch configuration',
  },
  {
    id: 'add-or-delete-branch',
    category: 'Controls',
    term: 'Add or delete a branch',
    summary: 'Create an additional workflow path or remove one',
    definition:
      'Add a branch to create an additional workflow path, or delete a branch to remove that path.',
    example: '',
    visualCaption: 'Add and delete branch actions',
  },
  {
    id: 'loop',
    category: 'Controls',
    term: 'Loop',
    summary: 'Repeats workflow steps for multiple items or until a condition is met',
    definition:
      'A loop repeats a set of workflow steps for multiple items or until a defined condition is met.',
    example: '',
    visualCaption: 'Loop control on the workflow canvas',
  },
  {
    id: 'parallel',
    category: 'Controls',
    term: 'Parallel',
    summary: 'Run multiple paths or tasks at the same time',
    definition:
      'Parallel allows multiple workflow paths or tasks to run at the same time instead of waiting for one to finish before starting another.',
    example: '',
    visualCaption: 'Parallel paths on the workflow canvas',
  },
  {
    id: 'procedure',
    category: 'Procedures',
    term: 'Procedure',
    summary: 'A predefined set of instructions for an operational process',
    definition:
      'A procedure is a predefined set of instructions or actions that an agent can follow to complete a specific operational process.',
    example:
      'A Front Desk procedure can guide an agent through handling an appointment booking.',
    visualCaption: 'Procedure node and procedure library',
  },
  {
    id: 'voice-call-tool',
    category: 'Procedures',
    term: 'Voice call tool',
    summary: 'A tool for placing or handling voice calls',
    definition: 'Details for this term are coming soon.',
    example: '',
    visualCaption: 'Voice call tool configuration',
  },
  {
    id: 'add-step-to-workflow',
    category: 'Canvas',
    term: 'Add a step to the workflow',
    summary: 'Add a new step by dragging or using the + on the workflow',
    definition:
      'Add a new step to a workflow by dragging a step onto the canvas or using the “+” on the workflow.',
    example: '',
    visualCaption: 'Adding a step on the workflow canvas',
  },
  {
    id: 'copy-paste-nodes',
    category: 'Canvas',
    term: 'Copy & paste nodes',
    summary: 'Duplicate workflow nodes and reuse them elsewhere',
    definition:
      'Copy and paste allows you to duplicate workflow nodes and reuse them elsewhere in the workflow.',
    example: '',
    visualCaption: 'Copied nodes on the workflow canvas',
  },
  {
    id: 'toggle-task-off',
    category: 'Canvas',
    term: 'Toggle task off',
    summary: 'Temporarily disable a task without deleting it',
    definition:
      'Turning a task off temporarily disables it without deleting it from the workflow.',
    example: '',
    visualCaption: 'Task toggle on a canvas node',
  },
  {
    id: 'test-preview',
    category: 'Canvas',
    term: 'Test preview',
    summary: 'Run a workflow with sample data before enabling it',
    definition:
      'Test Preview allows you to run a workflow or selected steps with sample data before enabling it. Use it to verify the workflow logic, inputs, outputs, and agent behavior.',
    example: '',
    visualCaption: 'Test preview panel beside the canvas',
  },
]

/** @deprecated Use HELP_GLOSSARY */
export const HELP_DICTIONARY = HELP_GLOSSARY
/** @deprecated Use HelpGlossaryItem */
export type HelpDictionaryItem = HelpGlossaryItem
