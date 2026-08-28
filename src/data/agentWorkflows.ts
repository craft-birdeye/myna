import { CONDITION_OPERATORS } from '../workflow/constants/conditionOperators'

export interface AgentWorkflow {
  nodes: any[]
  nodeDetails: Record<string, any>
}

// Helper — all triggers use Conversation trigger subtype
const CONV_TRIGGER = {
  flowType: 'trigger' as const,
  data: {
    subtype: 'Conversation trigger',
    headerLabel: 'Conversation trigger',
    hasToggle: true,
    toggleEnabled: true,
    titlePlaceholder: 'Enter trigger name',
    descriptionPlaceholder: 'Enter description',
    hasAiIcon: false,
  },
}

// ─── Frontdesk Agent ─────────────────────────────────────────────────────────
// Workflow: Conversation trigger → Procedures (greet, detect intent, route)

const FRONTDESK_NODES = [
  { id: 'fd-1', ...CONV_TRIGGER, data: { ...CONV_TRIGGER.data, title: 'Channel' } },
  {
    id: 'fd-2',
    flowType: 'procedures',
    data: { title: 'Follow procedures', subtype: 'Procedures', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Enter description' },
  },
]

const FRONTDESK_NODE_DETAILS: Record<string, any> = {
  '__start__': {
    agentName: 'Front desk agent',
    goals: 'Serves as the first point of contact for inbound calls, texts, and chats — routing customer inquiries, scheduling service and sales appointments, answering vehicle and inventory questions, and escalating complex cases to the right department.',
    outcomes: `1. Customer inquiry is resolved or routed without human intervention
2. Service or sales appointment is confirmed, modified, or cancelled and reflected in the DMS
3. Vehicle availability and pricing questions are answered instantly from inventory data
4. No customer is left waiting without a response or a clear next step
5. Escalations include a full summary of the conversation and identified customer intent`,
    locations: ['1001 - Mountain View, CA', '1002 - Seattle, WA', '1004 - Chicago, IL', '1006 - Las Vegas, NV'],
  },
  'fd-1': {
    triggerName: 'Channel',
    description: 'Agent triggers when a voice, chat, or text event occurs',
    voiceRows: [{ id: 'voice-1', condition: 'incoming_call', time: 'during_business' }],
    webChatRows: [{ id: 'web-1', condition: 'message_received', time: 'during_business' }],
  },
  'fd-2': {
    procedureIds: [
      'Greeting & Intent Detection',
      'Department Transfer',
      'General Inquiry',
      'Handle Unclear Message',
      'Emergency / Urgent Handling',
      'Talk to Human',
      'Spanish Language Handling',
      'Schedule Service Appointment',
      'Repair / Diagnostic Triage',
      'Recall Inquiry',
      'Service Status Check',
      'Reschedule / Cancel Appointment',
      'Warranty Inquiry',
      'New Vehicle Inquiry',
      'Used / CPO Vehicle Inquiry',
      'Trade-In Valuation',
      'Finance Pre-Qualification',
      'Test Drive Scheduling',
      'Internet Lead Qualification',
      'Parts Availability & Pricing',
      'After-Hours Lead Capture',
      'After-Hours Service Request',
    ],
  },
}

// ─── Reminder Agent ──────────────────────────────────────────────────────────

// ─── Outreach Agent ──────────────────────────────────────────────────────────
// Workflow: Conversation trigger → LLM outreach call → Branch (Interested | No Answer | Objection)

const OUTREACH_NODES = [
  { id: 'out-1', ...CONV_TRIGGER, data: { ...CONV_TRIGGER.data, title: 'Internet Lead Received' } },
  {
    id: 'out-2',
    flowType: 'task',
    data: { title: 'Initial Outreach Call', subtype: 'Custom', hasToggle: true, toggleEnabled: true, hasAiIcon: true, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Enter description' },
  },
  {
    id: 'out-3',
    flowType: 'branch',
    data: { title: 'Lead Response', subtype: 'Branch', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter branch name', descriptionPlaceholder: 'Enter description' },
  },
]

const OUTREACH_NODE_DETAILS: Record<string, any> = {
  '__start__': {
    agentName: 'Outreach agent',
    goals: 'Execute proactive outbound journey workflows covering lead follow-up, customer re-engagement, recall notifications, and lifecycle marketing. Contact internet leads within 5 minutes of submission.',
    outcomes: 'Leads are contacted at speed-to-lead P0 targets, qualification notes are logged in CRM, and hot leads are immediately transferred to available sales consultants.',
    locations: ['1001 - Mountain View, CA', '1002 - Seattle, WA', '1004 - Chicago, IL', '1006 - Las Vegas, NV'],
  },
  'out-1': {
    triggerName: 'Internet Lead Received',
    description: 'Fires when a new internet lead is submitted from any configured lead source or website inquiry form.',
    voiceConditions: [{ field: 'event', operator: 'is', value: 'New internet lead submitted' }],
    webchatConditions: [{ field: 'event', operator: 'is', value: 'Website inquiry form submitted' }],
  },
  'out-2': {
    taskName: 'Initial Outreach Call',
    description: 'Introduce self, reference the specific inquiry, confirm interest and ask qualifying questions. Present matching inventory and offer test drive. Initiate within 5 minutes of lead receipt.',
    llmModel: 'Fast',
    systemPrompt: "You are calling on behalf of the dealership to follow up on an internet lead. Be professional, friendly, and reference the specific vehicle or inquiry. Your goal is to confirm interest, ask qualifying questions (budget, timeline, trade-in), and schedule a test drive or appointment.",
    userPrompt: 'Lead inquiry: {{Lead_inquiry}}\nVehicle interest: {{Vehicle_interest}}\nCustomer name: {{Customer_name}}',
  },
  'out-3': {
    basedOn: 'conditions',
    branches: [
      { id: 'out-3-path-1', name: 'Interested / Engaged' },
      { id: 'out-3-path-2', name: 'No Answer' },
      { id: 'out-3-path-fallback', name: 'Objection / Transfer', isFallback: true },
    ],
  },
  'out-3-path-1': {
    branchName: 'Interested / Engaged',
    description: 'Lead expressed interest — qualify and schedule',
    conditions: [],
    parentId: 'out-3',
    isBranchPath: true,
    nodes: [
      { id: 'out-4', flowType: 'procedures', data: { title: 'Qualify Lead & Schedule', subtype: 'Procedures', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Enter description' } },
    ],
  },
  'out-3-path-2': {
    branchName: 'No Answer',
    description: 'Lead did not answer — leave voicemail and follow up via SMS',
    conditions: [],
    parentId: 'out-3',
    isBranchPath: true,
    nodes: [
      { id: 'out-5', flowType: 'task', data: { title: 'Voicemail + Follow-Up SMS', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Enter description' } },
    ],
  },
  'out-3-path-fallback': {
    branchName: 'Objection / Transfer',
    description: 'Lead raised an objection or requested a manager',
    conditions: [],
    parentId: 'out-3',
    isBranchPath: true,
    isFallback: true,
    nodes: [
      { id: 'out-6', flowType: 'task', data: { title: 'Transfer to Sales Manager', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Enter description' } },
    ],
  },
  'out-4': { procedureIds: ['Internet Lead Qualification', 'Test Drive Scheduling'] },
  'out-5': {
    taskName: 'Voicemail + Follow-Up SMS',
    description: 'Leave professional voicemail referencing the inquiry, then send follow-up SMS with callback link and top inventory match.',
    selectedTools: ['initiate-voice-call', 'send-confirmation'],
  },
  'out-6': {
    taskName: 'Transfer to Sales Manager',
    description: 'Immediately transfer to available sales manager. Log objection or manager request in CRM with full conversation context.',
    selectedTools: ['trigger-escalation'],
  },
}

// ─── Healthcare / Dental Frontdesk node details ───────────────────────────────

const FRONTDESK_HC_NODE_DETAILS: Record<string, any> = {
  '__start__': {
    agentName: 'Front desk agent - North region',
    goals: 'Serves as the first point of contact for inbound calls, texts, and chats — routing customer inquiries, scheduling service and sales appointments, answering vehicle and inventory questions, and escalating complex cases to the right department.',
    outcomes: [
      '1. Customer inquiry is resolved or routed without human intervention',
      '2. Service or sales appointment is confirmed, modified, or cancelled and reflected in the DMS',
      '3. Vehicle availability and pricing questions are answered instantly from inventory data',
      '4. No customer is left waiting without a response or a clear next step',
      '5. Escalations include a full summary of the conversation and identified customer intent',
    ].join('\n'),
    locations: [
      '1001 - Mountain View, CA',
      '1002 - Seattle, WA',
      '1004 - Chicago, IL',
      '1006 - Las Vegas, NV',
      '1007 - Dallas, TX',
      '1008 - Houston, TX',
      '1009 - Phoenix, AZ',
      '1010 - San Diego, CA',
      '1011 - Portland, OR',
      '1012 - Denver, CO',
      '1013 - Atlanta, GA',
      '1014 - Miami, FL',
    ],
  },
  'fd-1': { ...FRONTDESK_NODE_DETAILS['fd-1'] },
  'fd-2': {
    procedureIds: [
      'General inquiry',
      'Talk to human',
      'Book, cancel, reschedule appointment',
      'Verify insurance',
    ],
  },
}


const HEALTHCARE_REMINDER_NODES = [
  { id: 'hcr-1', flowType: 'trigger', data: { title: 'Appointment is booked', subtype: 'Appointment booked', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter trigger name', descriptionPlaceholder: 'Agent triggers when an appointment is booked' } },
  { id: 'hcr-2', flowType: 'task', data: { title: 'Send scheduled reminders', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Send text and email reminders 4 weeks before appointment' } },
  { id: 'hcr-3', flowType: 'task', data: { title: 'Schedule appointment reminder', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Send text and email reminders 2 weeks before appointment' } },
  { id: 'hcr-4', flowType: 'delay', data: { title: 'Delay until 2 days before appointment date and time', subtype: 'Delay', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait for a specific time or event' } },
  { id: 'hcr-5', flowType: 'branch', data: { title: 'Based on conditions', subtype: 'Branch', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter branch name', descriptionPlaceholder: 'Build condition-specific flows' } },
]

const HEALTHCARE_REMINDER_NODE_DETAILS: Record<string, any> = {
  '__start__': {
    agentName: 'Reminder agent - North region',
    goals: 'Reduce appointment no-shows through automated multi-channel reminders sent at 3 weeks, 3 days, and 24 hours before each appointment, with live agent handoff on patient request.',
    outcomes:
      '1. Appointment confirmation rates improve\n' +
      '2. No-show rate decreases\n' +
      '3. Patients receive timely reminders with one-click reschedule options\n' +
      '4. Unanswered calls trigger SMS follow-up automatically\n' +
      '5. Live agent handoff is seamless when patients request it',
    locations: [
      '1001 - Mountain View, CA',
      '1002 - Seattle, WA',
      '1004 - Chicago, IL',
      '1006 - Las Vegas, NV',
      '1007 - Dallas, TX',
      '1013 - Atlanta, GA',
    ],
  },
  'hcr-1': {
    triggerName: 'Appointment is booked',
    description: 'Agent triggers when an appointment is booked',
    conditions: [
      { id: 1, fieldValue: 'appointment_status', operatorValue: 'equals', valueValue: 'booked' },
    ],
    conditionOptions: {
      field: [
        { value: 'appointment_status', label: 'Appointment status' },
        { value: 'appointment_type',   label: 'Appointment type' },
        { value: 'location',           label: 'Location' },
        { value: 'provider',           label: 'Provider' },
        { value: 'insurance_verified', label: 'Insurance verified' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'booked',    label: 'Booked' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'pending',   label: 'Pending' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'rescheduled', label: 'Rescheduled' },
      ],
    },
  },
  'hcr-2': {
    taskName: 'Send scheduled reminders',
    description: 'Send text and email reminders 4 weeks before appointment',
    selectedTools: ['reminder-tool'],
  },
  'hcr-3': {
    taskName: 'Schedule appointment reminder',
    description: 'Send text and email reminders 2 weeks before appointment',
    selectedTools: ['reminder-tool'],
  },
  'hcr-4': {
    name: 'Delay until 2 days before appointment date and time',
    duration: '2',
    unit: 'days',
  },
  'hcr-5': {
    basedOn: 'conditions',
    branches: [
      { id: 'hcr-5-path-1', name: 'Not confirmed' },
      { id: 'hcr-5-path-2', name: 'Confirmed', isFallback: true },
    ],
  },
  'hcr-5-path-1': {
    branchName: 'Not confirmed',
    description: 'The appointment has not been confirmed.',
    conditions: [
      { id: 1, fieldValue: 'appointment_status', operatorValue: 'not_equals', valueValue: 'confirmed' },
    ],
    parentId: 'hcr-5',
    isBranchPath: true,
    nodes: [
      { id: 'hcr-6', flowType: 'task', data: { title: 'Initiate voice call', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Call the customer' } },
    ],
  },
  'hcr-5-path-2': {
    branchName: 'Confirmed',
    description: 'The appointment is confirmed.',
    conditions: [
      { id: 1, fieldValue: 'appointment_status', operatorValue: 'equals', valueValue: 'confirmed' },
    ],
    parentId: 'hcr-5',
    isBranchPath: true,
    isFallback: true,
    nodes: [],
  },
  'hcr-4-path-1': {
    branchName: 'Appointment not confirmed',
    description: 'Patient replied and confirmed the appointment.',
    conditions: [
      { id: 1, fieldValue: 'patient_response', operatorValue: 'equals', valueValue: 'confirmed' },
    ],
    conditionOptions: {
      field: [
        { value: 'patient_response',    label: 'Patient response' },
        { value: 'appointment_status',  label: 'Appointment status' },
        { value: 'reminder_channel',    label: 'Reminder channel' },
        { value: 'response_time',       label: 'Response time' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'confirmed',    label: 'Confirmed' },
        { value: 'cancelled',    label: 'Cancelled' },
        { value: 'rescheduled',  label: 'Rescheduled' },
        { value: 'no_response',  label: 'No response' },
      ],
    },
    parentId: 'hcr-4',
    isBranchPath: true,
    nodes: [
      { id: 'hcr-5', flowType: 'voiceCall', data: { title: 'Initiate voice call', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter name', descriptionPlaceholder: 'Call the patient for their upcoming appointment' } },
    ],
  },
  'hcr-4-path-2': {
    branchName: 'Appointment confirmed',
    description: 'Patient did not respond or did not confirm the appointment.',
    conditions: [
      { id: 1, fieldValue: 'patient_response', operatorValue: 'equals', valueValue: 'no_response' },
    ],
    conditionOptions: {
      field: [
        { value: 'patient_response',    label: 'Patient response' },
        { value: 'appointment_status',  label: 'Appointment status' },
        { value: 'reminder_channel',    label: 'Reminder channel' },
        { value: 'response_time',       label: 'Response time' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'confirmed',    label: 'Confirmed' },
        { value: 'cancelled',    label: 'Cancelled' },
        { value: 'rescheduled',  label: 'Rescheduled' },
        { value: 'no_response',  label: 'No response' },
      ],
    },
    parentId: 'hcr-4',
    isBranchPath: true,
    isFallback: true,
    nodes: [
      { id: 'hcr-10', flowType: 'task', data: { title: 'Send text reminder', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: '3 hours before' } },
    ],
  },
  'hcr-legacy-voice-call': {
    taskName: 'Initiate voice call',
    description: 'Call the patient for their upcoming appointment.',
    toolId: 'initiate-voice-call',
    startingProcedure: 'Appointment confirmation (Copy)',
    routeToFrontdesk: false,
    retrySettings: { noAnswer: true, callRejected: false, voiceMail: false },
    maxAttempts: '2',
    retryInterval: '24',
    retryIntervalUnit: 'Hours',
    branches: [
      { id: 'hcr-5-vc-completed', name: 'Call answered', isVoiceCallBranch: true, isFallback: false },
      { id: 'hcr-5-vc-rejected',  name: 'Call rejected',  isVoiceCallBranch: true, isFallback: false },
      { id: 'hcr-5-vc-missed',    name: 'Call missed',    isVoiceCallBranch: true, isFallback: true  },
      { id: 'hcr-5-vc-voicemail', name: 'Voice mail',     isVoiceCallBranch: true, isFallback: false },
    ],
  },
  'hcr-5-vc-completed': {
    branchName: 'Call answered',
    isVoiceCallBranch: true,
    isFallback: false,
    conditions: [
      { id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'answered' },
    ],
    conditionOptions: {
      field: [
        { value: 'call_status',      label: 'Call status' },
        { value: 'call_duration',    label: 'Call duration' },
        { value: 'patient_response', label: 'Patient response' },
        { value: 'call_attempt',     label: 'Call attempt' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'answered',   label: 'Answered' },
        { value: 'rejected',   label: 'Rejected' },
        { value: 'missed',     label: 'Missed' },
        { value: 'voicemail',  label: 'Voicemail' },
      ],
    },
    parentId: 'hcr-5',
    isBranchPath: true,
    nodes: [
      { id: 'hcr-6', flowType: 'subagent', data: { title: 'Front desk agent - North region', subtype: 'Sub-agent', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Call subagent', descriptionPlaceholder: 'Call subagent workflow.' } },
    ],
  },
  'hcr-5-vc-rejected': {
    branchName: 'Call rejected',
    isVoiceCallBranch: true,
    isFallback: false,
    conditions: [
      { id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'rejected' },
    ],
    conditionOptions: {
      field: [
        { value: 'call_status',      label: 'Call status' },
        { value: 'call_duration',    label: 'Call duration' },
        { value: 'patient_response', label: 'Patient response' },
        { value: 'call_attempt',     label: 'Call attempt' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'answered',   label: 'Answered' },
        { value: 'rejected',   label: 'Rejected' },
        { value: 'missed',     label: 'Missed' },
        { value: 'voicemail',  label: 'Voicemail' },
      ],
    },
    parentId: 'hcr-5',
    isBranchPath: true,
    nodes: [
      { id: 'hcr-7', flowType: 'delay', data: { title: 'Wait 2 hours',       subtype: 'Delay',        hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait for specific time or event.' } },
      { id: 'hcr-8', flowType: 'task',  data: { title: 'Send text reminder',  subtype: 'Integration',  hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name',          descriptionPlaceholder: 'Enter description' } },
    ],
  },
  'hcr-5-vc-missed': {
    branchName: 'Call missed',
    isVoiceCallBranch: true,
    isFallback: true,
    conditions: [
      { id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'missed' },
    ],
    conditionOptions: {
      field: [
        { value: 'call_status',      label: 'Call status' },
        { value: 'call_duration',    label: 'Call duration' },
        { value: 'patient_response', label: 'Patient response' },
        { value: 'call_attempt',     label: 'Call attempt' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'answered',   label: 'Answered' },
        { value: 'rejected',   label: 'Rejected' },
        { value: 'missed',     label: 'Missed' },
        { value: 'voicemail',  label: 'Voicemail' },
      ],
    },
    parentId: 'hcr-5',
    isBranchPath: true,
    nodes: [
      { id: 'hcr-11', flowType: 'delay', data: { title: 'Wait 2 hours',      subtype: 'Delay',       hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait for specific time or event.' } },
      { id: 'hcr-9',  flowType: 'task',  data: { title: 'Send text reminder', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name',          descriptionPlaceholder: '3 hours before' } },
    ],
  },
  'hcr-5-vc-voicemail': {
    branchName: 'Voice mail',
    isVoiceCallBranch: true,
    isFallback: false,
    conditions: [
      { id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'voicemail' },
    ],
    conditionOptions: {
      field: [
        { value: 'call_status',      label: 'Call status' },
        { value: 'call_duration',    label: 'Call duration' },
        { value: 'patient_response', label: 'Patient response' },
        { value: 'call_attempt',     label: 'Call attempt' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'answered',   label: 'Answered' },
        { value: 'rejected',   label: 'Rejected' },
        { value: 'missed',     label: 'Missed' },
        { value: 'voicemail',  label: 'Voicemail' },
      ],
    },
    parentId: 'hcr-5',
    isBranchPath: true,
    nodes: [],
  },
  'hcr-6': {
    taskName: 'Initiate voice call',
    description: 'Call the customer',
    selectedTools: ['voice-call'],
  },
  'hcr-7': { name: 'Wait 2 hours',       duration: '2', unit: 'hours' },
  'hcr-8': { taskName: 'Send text reminder', description: '3 hours before', selectedTools: ['send-confirmation'] },
  'hcr-9':  { taskName: 'Send text reminder', description: '3 hours before', selectedTools: ['send-confirmation'] },
  'hcr-10': { taskName: 'Send text reminder', description: '3 hours before', selectedTools: ['send-confirmation'] },
  'hcr-11': { name: 'Wait 2 hours', duration: '2', unit: 'hours' },
}

/** The attached flow is intentionally scoped to Reminder agent - North region. */
export const HEALTHCARE_REMINDER_NORTH_WORKFLOW: AgentWorkflow = {
  nodes: HEALTHCARE_REMINDER_NODES,
  nodeDetails: HEALTHCARE_REMINDER_NODE_DETAILS,
}

/** Original Reminder workflow retained for East, South, and West regions. */
const HEALTHCARE_REMINDER_DEFAULT_NODES = [
  { id: 'hcr-1', flowType: 'trigger', data: { title: 'Appointment is booked', subtype: 'Appointment booked', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter trigger name', descriptionPlaceholder: 'Enter description' } },
  { id: 'hcr-2', flowType: 'task', data: { title: 'Appointment reminder', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: '3 weeks, 3 days and 24 hours before · Email & text' } },
  { id: 'hcr-3', flowType: 'delay', data: { title: 'Until 12 hrs before appointment', subtype: 'Delay', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait for specific time or event.' } },
  { id: 'hcr-4', flowType: 'branch', data: { title: 'Based on conditions', subtype: 'Branch', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter branch name', descriptionPlaceholder: 'Appointment confirmed or not?' } },
]

const HEALTHCARE_REMINDER_DEFAULT_NODE_DETAILS: Record<string, any> = {
  ...HEALTHCARE_REMINDER_NODE_DETAILS,
  'hcr-1': {
    ...HEALTHCARE_REMINDER_NODE_DETAILS['hcr-1'],
    description: 'Fires when a new appointment is created or confirmed in the system for any configured location.',
  },
  'hcr-2': {
    taskName: 'Appointment reminder',
    description: '3 weeks, 3 days and 24 hours before · Email & text',
    selectedTools: ['reminder-tool'],
  },
  'hcr-3': { name: 'Until 12 hrs before appointment', duration: '12', unit: 'hours' },
  'hcr-4': {
    basedOn: 'conditions',
    branches: [
      { id: 'hcr-4-path-1', name: 'Appointment not confirmed' },
      { id: 'hcr-4-path-2', name: 'Appointment confirmed', isFallback: true },
    ],
  },
  'hcr-5': HEALTHCARE_REMINDER_NODE_DETAILS['hcr-legacy-voice-call'],
  'hcr-6': {
    selectedAgent: 'frontdesk-north',
    name: 'Front desk agent - North region',
    description: 'Transfer to the front desk agent for assisted patient handling with a reminder.',
    intent: 'Reminder',
  },
}

const HEALTHCARE_REMINDER_DEFAULT_WORKFLOW: AgentWorkflow = {
  nodes: HEALTHCARE_REMINDER_DEFAULT_NODES,
  nodeDetails: HEALTHCARE_REMINDER_DEFAULT_NODE_DETAILS,
}

export const AUTOMOTIVE_AGENT_WORKFLOWS: Record<string, AgentWorkflow> = {
  'Front desk agent': { nodes: FRONTDESK_NODES,           nodeDetails: FRONTDESK_NODE_DETAILS           },
  'Front desk agent (exploration)': { nodes: FRONTDESK_NODES, nodeDetails: FRONTDESK_NODE_DETAILS },
  'Reminder agent':  HEALTHCARE_REMINDER_DEFAULT_WORKFLOW,
  'Outreach agent':  { nodes: OUTREACH_NODES,             nodeDetails: OUTREACH_NODE_DETAILS            },
}

// ─── Waitlist Agent ──────────────────────────────────────────────────────────

const WAITLIST_NODES = [
  { id: 'wl-1', flowType: 'trigger' as const, data: { title: 'Appointment is cancelled', subtype: 'Appointment', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter trigger name',       descriptionPlaceholder: 'Enter description' } },
  { id: 'wl-2', flowType: 'delay'   as const, data: { title: 'Delay for 30 mins',        subtype: 'Delay',       hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait for a specific time or event' } },
  { id: 'wl-3', flowType: 'loop'    as const, data: { title: 'For slot',                  subtype: 'Loop',        hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter loop name',          descriptionPlaceholder: 'Repeat the following tasks for each slot' } },
]

const WAITLIST_NODE_DETAILS: Record<string, any> = {
  '__start__': {
    agentName: 'Waitlist agent - North region',
    goals:
      'Automatically fill cancelled appointment slots by reaching out to waitlisted patients via text and voice, reducing revenue loss from unfilled chair time and eliminating manual waitlist management.',
    outcomes:
      '1. Open slot is filled within hours via automated text outreach\n' +
      '2. Patient confirms the slot by replying to the SMS\n' +
      '3. Unresponsive patients receive a follow-up voice call\n' +
      '4. Slot remains open if no waitlisted patients are available or confirm\n' +
      '5. Staff spend zero time manually calling through the waitlist',
    locations: [
      '1001 - Mountain View, CA',
      '1002 - Seattle, WA',
      '1004 - Chicago, IL',
      '1006 - Las Vegas, NV',
      '1007 - Dallas, TX',
      '1013 - Atlanta, GA',
    ],
  },
  'wl-1': {
    triggerName: 'When an appointment is cancelled',
    description: 'Agent triggers when an appointment is cancelled.',
    conditions: [
      { id: 1, fieldValue: 'appointment_status', operatorValue: 'equals', valueValue: 'cancelled' },
    ],
    conditionOptions: {
      field: [
        { value: 'appointment_status', label: 'Appointment status' },
        { value: 'appointment_type',   label: 'Appointment type' },
        { value: 'provider',           label: 'Provider' },
        { value: 'location',           label: 'Location' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'cancelled',  label: 'Cancelled' },
        { value: 'updated',    label: 'Updated' },
      ],
    },
  },
  'wl-2': { name: 'Delay for 30 mins', duration: '30', unit: 'minutes' },
  'wl-3': {
    loopName: 'For slot',
    name: 'For slot',
    description: 'Repeat the following tasks for each slot.',
    loopOver: 'Waitlist slot',
    loopMode: 'variable',
    nodes: [
      { id: 'wl-4', flowType: 'task' as const, data: { title: 'Fetch waitlist', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Retrieves patients currently on the waitlist.' } },
      { id: 'wl-5', flowType: 'branch' as const, data: { title: 'Based on conditions', subtype: 'Branch', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter branch name', descriptionPlaceholder: 'Build condition-specific flows' } },
    ],
  },
  'wl-4': {
    taskName: 'Fetch waitlist',
    description: 'Retrieves patients currently on the waitlist, including relevant details such as requested service, preferred time, and current status.',
    selectedTools: ['fetch-waitlist-hc'],
  },
  'wl-5': {
    basedOn: 'conditions',
    branches: [
      { id: 'wl-5-path-1', name: 'Slot open' },
      { id: 'wl-5-path-2', name: 'Fallback', isFallback: true },
    ],
  },
  'wl-5-path-1': {
    branchName: 'Slot open',
    description: 'Slot is available.',
    conditions: [
      { id: 1, fieldValue: 'slot', operatorValue: 'is', valueValue: 'available' },
    ],
    conditionOptions: {
      field:    [{ value: 'slot', label: 'Slot' }],
      operator: [...CONDITION_OPERATORS],
      value:    [{ value: 'available', label: 'Available' }, { value: 'unavailable', label: 'Unavailable' }],
    },
    parentId: 'wl-5',
    isBranchPath: true,
    nodes: [
      { id: 'wl-6', flowType: 'task'   as const, data: { title: 'Send text',           subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name',          descriptionPlaceholder: 'Send a text message to the customer with a predefined message, personalized content, or automated updates.' } },
      { id: 'wl-7', flowType: 'delay'  as const, data: { title: 'Delay for 10 mins',   subtype: 'Delay',       hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait for a specific time or event' } },
      { id: 'wl-8',  flowType: 'task'       as const, data: { title: 'Fetch waitlist',       subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name',    descriptionPlaceholder: 'Retrieves patients currently on the waitlist, including relevant details such as requested service, preferred time, and current status.' } },
      { id: 'wl-9',  flowType: 'branch'     as const, data: { title: 'Based on conditions', subtype: 'Branch',      hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter branch name',  descriptionPlaceholder: 'Build condition-specific flows' } },
    ],
  },
  'wl-5-path-2': {
    branchName: 'Fallback',
    description: 'No slot available — end loop iteration.',
    conditions: [],
    parentId: 'wl-5',
    isBranchPath: true,
    isFallback: true,
    nodes: [],
  },
  'wl-6': {
    taskName: 'Send text',
    description: 'Send a text message to the customer with a predefined message, personalized content, or automated updates.',
    selectedTools: ['send-text-hc'],
  },
  'wl-7': { name: 'Delay for 10 mins', duration: '10', unit: 'minutes' },
  'wl-8': {
    taskName: 'Fetch waitlist',
    description: 'Retrieves patients currently on the waitlist, including relevant details such as requested service, preferred time, and current status.',
    selectedTools: ['fetch-waitlist-hc'],
  },
  'wl-9': {
    basedOn: 'conditions',
    branches: [
      { id: 'wl-9-path-1', name: 'Slot open' },
      { id: 'wl-9-path-2', name: 'Fallback', isFallback: true },
    ],
  },
  'wl-9-path-1': {
    branchName: 'Slot open',
    description: 'Slot is still available — initiate voice call to confirm with patient.',
    conditions: [
      { id: 1, fieldValue: 'slot', operatorValue: 'is', valueValue: 'open' },
    ],
    conditionOptions: {
      field:    [{ value: 'slot', label: 'Slot' }],
      operator: [...CONDITION_OPERATORS],
      value:    [{ value: 'open', label: 'Open' }, { value: 'filled', label: 'Filled' }],
    },
    parentId: 'wl-9',
    isBranchPath: true,
    nodes: [
      { id: 'wl-10', flowType: 'voiceCall' as const, data: { title: 'Initiate voice call', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Call the customer' } },
    ],
  },
  'wl-9-path-2': {
    branchName: 'Fallback',
    description: 'Slot no longer available — end loop iteration.',
    conditions: [],
    parentId: 'wl-9',
    isBranchPath: true,
    isFallback: true,
    nodes: [],
  },
  'wl-10': {
    taskName: 'Initiate voice call',
    description: 'Call the customer.',
    selectedTools: ['initiate-voice-call-hc'],
    isVoiceCall: true,
    branches: [
      { id: 'wl-10-completed',  name: 'Call completed' },
      { id: 'wl-10-rejected',   name: 'Call rejected' },
      { id: 'wl-10-missed',     name: 'Call missed' },
      { id: 'wl-10-voicemail',  name: 'Voice mail', isFallback: true },
    ],
  },
  'wl-10-completed': { branchName: 'Call completed', conditions: [], parentId: 'wl-10', isBranchPath: true, isVoiceCallBranch: true, nodes: [] },
  'wl-10-rejected':  { branchName: 'Call rejected',  conditions: [], parentId: 'wl-10', isBranchPath: true, isVoiceCallBranch: true, nodes: [] },
  'wl-10-missed':    { branchName: 'Call missed',     conditions: [], parentId: 'wl-10', isBranchPath: true, isVoiceCallBranch: true, nodes: [] },
  'wl-10-voicemail': { branchName: 'Voice mail',      conditions: [], parentId: 'wl-10', isBranchPath: true, isVoiceCallBranch: true, isFallback: true, nodes: [] },
}

// ─── Pre-visit Agent ─────────────────────────────────────────────────────────

const PREVISIT_NODES = [
  { id: 'pv-1', flowType: 'trigger',  data: { title: 'Appointment is booked',          subtype: 'Appointment booked', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter trigger name',       descriptionPlaceholder: 'Enter description' } },
  { id: 'pv-2', flowType: 'delay',    data: { title: 'Until 4 days before appointment', subtype: 'Delay',              hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait for a specific time or event' } },
  { id: 'pv-3', flowType: 'task',     data: { title: 'Send communication',              subtype: 'Integration',        hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name',          descriptionPlaceholder: '4 days before appointment · Email or Email + text' } },
  { id: 'pv-4', flowType: 'branch',   data: { title: 'Based on conditions',             subtype: 'Branch',             hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter branch name',        descriptionPlaceholder: 'Appointment confirmed or not?' } },
]

const PREVISIT_NODE_DETAILS: Record<string, any> = {
  '__start__': {
    agentName: 'Pre-visit agent - North region',
    goals: 'Automate pre-appointment check-in form outreach, ensuring patients complete intake forms before their visit and reducing administrative burden on front desk staff.',
    outcomes:
      '1. Patients receive timely outreach to complete pre-visit intake forms\n' +
      '2. Form completion rate improves, reducing day-of delays\n' +
      '3. Patients who have not filled the form receive follow-up communication automatically\n' +
      '4. Voice call escalation is triggered for unresponsive patients close to the appointment\n' +
      '5. Front desk staff spend less time on manual outreach',
    locations: [
      '1001 - Mountain View, CA',
      '1002 - Seattle, WA',
      '1004 - Chicago, IL',
      '1006 - Las Vegas, NV',
      '1007 - Dallas, TX',
      '1013 - Atlanta, GA',
    ],
  },
  'pv-1': {
    triggerName: 'Appointment is booked',
    description: 'Agent triggers when an appointment is booked',
    conditions: [
      { id: 1, fieldValue: 'appointment_status', operatorValue: 'equals', valueValue: 'booked' },
    ],
    conditionOptions: {
      field: [
        { value: 'appointment_status', label: 'Appointment status' },
        { value: 'appointment_type',   label: 'Appointment type' },
        { value: 'location',           label: 'Location' },
        { value: 'provider',           label: 'Provider' },
        { value: 'insurance_verified', label: 'Insurance verified' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'booked',      label: 'Booked' },
        { value: 'confirmed',   label: 'Confirmed' },
        { value: 'pending',     label: 'Pending' },
        { value: 'cancelled',   label: 'Cancelled' },
        { value: 'rescheduled', label: 'Rescheduled' },
      ],
    },
  },
  'pv-2': { name: 'Until 4 days before appointment', duration: '4', unit: 'days' },
  'pv-3': {
    taskName: 'Send communication',
    description: '4 days before appointment · Email or Email + text',
    selectedTools: ['send-communication'],
  },
  'pv-4': {
    basedOn: 'conditions',
    branches: [
      { id: 'pv-4-path-1', name: 'Form not filled' },
      { id: 'pv-4-path-2', name: 'No conditions match', isFallback: true },
    ],
  },
  'pv-4-path-1': {
    branchName: 'Form not filled',
    description: 'Form status is not filled',
    conditions: [
      { id: 1, fieldValue: 'form_status', operatorValue: 'equals', valueValue: 'not_filled' },
    ],
    conditionOptions: {
      field: [
        { value: 'form_status',        label: 'Form' },
        { value: 'appointment_status', label: 'Appointment status' },
        { value: 'patient_response',   label: 'Patient response' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'not_filled', label: 'Not filled' },
        { value: 'filled',     label: 'Filled' },
        { value: 'partial',    label: 'Partial' },
      ],
    },
    parentId: 'pv-4',
    isBranchPath: true,
    nodes: [
      { id: 'pv-5', flowType: 'task',   data: { title: 'Send communication', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name',   descriptionPlaceholder: '2 days before appointment · Email or Email + text' } },
      { id: 'pv-6', flowType: 'branch', data: { title: 'Based on conditions', subtype: 'Branch',    hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter branch name', descriptionPlaceholder: 'Form not filled?' } },
    ],
  },
  'pv-4-path-2': {
    branchName: 'No conditions match',
    description: 'No conditions matched — end workflow.',
    conditions: [],
    parentId: 'pv-4',
    isBranchPath: true,
    isFallback: true,
    nodes: [],
  },
  'pv-5': {
    taskName: 'Send communication',
    description: '2 days before appointment · Email or Email + text',
    selectedTools: ['send-communication'],
  },
  'pv-6': {
    basedOn: 'conditions',
    branches: [
      { id: 'pv-6-path-1', name: 'Form not filled' },
      { id: 'pv-6-path-2', name: 'No conditions match', isFallback: true },
    ],
  },
  'pv-6-path-1': {
    branchName: 'Form not filled',
    description: 'Intake form has not been filled out.',
    conditions: [
      { id: 1, fieldValue: 'form_status', operatorValue: 'equals', valueValue: 'not_filled' },
    ],
    conditionOptions: {
      field: [
        { value: 'form_status',  label: 'Form status' },
        { value: 'intake_form',  label: 'Intake form' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'not_filled', label: 'Not filled' },
        { value: 'filled',     label: 'Filled' },
      ],
    },
    parentId: 'pv-6',
    isBranchPath: true,
    nodes: [
      { id: 'pv-7', flowType: 'voiceCall', data: { title: 'Initiate voice call', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Call the customer' } },
    ],
  },
  'pv-6-path-2': {
    branchName: 'No conditions match',
    description: 'No conditions matched — end workflow.',
    conditions: [],
    parentId: 'pv-6',
    isBranchPath: true,
    isFallback: true,
    nodes: [],
  },
  'pv-7': {
    taskName: 'Initiate voice call',
    description: 'Call the customer',
    selectedTools: ['initiate-voice-call-hc'],
    isVoiceCall: true,
    branches: [
      { id: 'pv-7-completed', name: 'Call completed' },
      { id: 'pv-7-rejected',  name: 'Call rejected' },
      { id: 'pv-7-missed',    name: 'Call missed' },
    ],
  },
  'pv-7-completed': { branchName: 'Call completed', conditions: [], parentId: 'pv-7', isBranchPath: true, isVoiceCallBranch: true, nodes: [] },
  'pv-7-rejected':  { branchName: 'Call rejected',  conditions: [], parentId: 'pv-7', isBranchPath: true, isVoiceCallBranch: true, nodes: [] },
  'pv-7-missed':    { branchName: 'Call missed',    conditions: [], parentId: 'pv-7', isBranchPath: true, isVoiceCallBranch: true, isFallback: true, nodes: [] },
}

// ─── Tagging & routing agent ────────────────────────────────────────────────
// Workflow: Inbox trigger → identify message intent → branch on conversation history
//   → "Pricing request" / "Scheduling request": assign contact status → assign conversation
//   → "Referral": wait 3 days → check message received → branch (appointment confirmed?)
//       → "No new message": assign conversation status
//   → "No conditions match" fallback: end

const TAGGING_ROUTING_NODES = [
  { id: 'tr-1', flowType: 'trigger' as const, data: { title: 'Inbox', subtype: 'Inactivity', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter trigger name', descriptionPlaceholder: 'Agent triggers based on inactivity' } },
  { id: 'tr-2', flowType: 'task' as const, data: { title: 'Identify message intent or action taken', subtype: 'Custom', hasToggle: true, toggleEnabled: true, hasAiIcon: true, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Understand what the user needs and help accordingly.' } },
  { id: 'tr-3', flowType: 'branch' as const, data: { title: 'Based on conditions', subtype: 'Branch', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter branch name', descriptionPlaceholder: 'Conversation history contains' } },
]

const TAGGING_ROUTING_NODE_DETAILS: Record<string, any> = {
  '__start__': {
    agentName: 'Tagging & routing agent - North region',
    goals: 'Analyzes incoming conversations to detect intent, assigns the appropriate contact status, and routes messages to the right team or user based on conversation history.',
    outcomes: [
      '1. Conversation intent is identified from message content',
      '2. Contact status is assigned automatically without manual triage',
      '3. Conversations are routed to the correct team or user',
      '4. Referral conversations are monitored and escalated if no response is received',
      '5. No conversation is left untagged or unrouted',
    ].join('\n'),
    locations: ['Atlanta, GA', 'Chicago, IL', 'Los Angeles, CA', 'Stamford, CT'],
  },
  'tr-1': {
    triggerName: 'Agent triggers based on inactivity',
    description: 'Agent triggers when no new message is received.',
    logic: 'AND',
    conditions: [
      { id: 1, fieldValue: 'conversation_inactive', operatorValue: 'since',        valueValue: '15_mins',  indent: 0 },
      { id: 2, fieldValue: 'channel',               operatorValue: 'is',           valueValue: 'web',       indent: 1, connector: 'AND' },
      { id: 3, fieldValue: 'conversation_assigned', operatorValue: 'assigned_to',  valueValue: '3_selected', indent: 2, connector: 'AND' },
      { id: 4, fieldValue: 'channel',               operatorValue: 'is',           valueValue: '5_selected', indent: 1, connector: 'OR' },
      { id: 5, fieldValue: 'conversation_assigned', operatorValue: 'assigned_to',  valueValue: '3_selected', indent: 2, connector: 'AND' },
    ],
    conditionOptions: {
      field: [
        { value: 'conversation_inactive', label: 'Conversation inactive' },
        { value: 'channel',               label: 'Channel' },
        { value: 'conversation_assigned', label: 'Conversation assigned to' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: '15_mins',   label: '15mins' },
        { value: 'web',       label: 'Web' },
        { value: '3_selected', label: '3 selected' },
        { value: '5_selected', label: '5 selected' },
      ],
    },
  },
  'tr-2': {
    taskName: 'Identify message intent or action taken',
    description: 'Understand what the user needs and help accordingly.',
    llmModel: 'Fast',
    systemPrompt: '',
    userPrompt: 'If visitor/patient is asking about referrals then its a referral conversation\nIf patient is asking about rescheduling or modifying dates then its rescheduling',
    outputFields: ['Intent'],
  },
  'tr-3': {
    basedOn: 'conditions',
    branches: [
      { id: 'tr-3-path-1', name: 'Pricing request' },
      { id: 'tr-3-path-2', name: 'Scheduling request' },
      { id: 'tr-3-path-3', name: 'Referral' },
      { id: 'tr-3-path-fallback', name: 'No conditions match', isFallback: true },
    ],
  },
  'tr-3-path-1': {
    branchName: 'Pricing request',
    description: 'Conversation history contains a pricing request.',
    conditions: [
      { id: 1, fieldValue: 'conversation_history', operatorValue: 'contains', valueValue: 'pricing_request' },
    ],
    conditionOptions: {
      field:    [{ value: 'conversation_history', label: 'Conversation history' }],
      operator: [...CONDITION_OPERATORS],
      value:    [{ value: 'pricing_request', label: 'Pricing request' }, { value: 'scheduling_request', label: 'Scheduling request' }, { value: 'referral', label: 'Referral' }],
    },
    parentId: 'tr-3',
    isBranchPath: true,
    nodes: [
      { id: 'tr-4', flowType: 'task' as const, data: { title: 'Assign contact status', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Update the status as per the messages.' } },
      { id: 'tr-5', flowType: 'task' as const, data: { title: 'Assign conversation', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Conversation will be managed by team or user' } },
    ],
  },
  'tr-3-path-2': {
    branchName: 'Scheduling request',
    description: 'Conversation history contains a scheduling request.',
    conditions: [
      { id: 1, fieldValue: 'conversation_history', operatorValue: 'contains', valueValue: 'scheduling_request' },
    ],
    conditionOptions: {
      field:    [{ value: 'conversation_history', label: 'Conversation history' }],
      operator: [...CONDITION_OPERATORS],
      value:    [{ value: 'pricing_request', label: 'Pricing request' }, { value: 'scheduling_request', label: 'Scheduling request' }, { value: 'referral', label: 'Referral' }],
    },
    parentId: 'tr-3',
    isBranchPath: true,
    nodes: [
      { id: 'tr-6', flowType: 'task' as const, data: { title: 'Assign contact status', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Update the status as per the messages.' } },
      { id: 'tr-7', flowType: 'task' as const, data: { title: 'Assign conversation', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Conversation will be managed by team or user' } },
    ],
  },
  'tr-3-path-3': {
    branchName: 'Referral',
    description: 'Conversation history contains a referral.',
    conditions: [
      { id: 1, fieldValue: 'conversation_history', operatorValue: 'contains', valueValue: 'referral' },
    ],
    conditionOptions: {
      field:    [{ value: 'conversation_history', label: 'Conversation history' }],
      operator: [...CONDITION_OPERATORS],
      value:    [{ value: 'pricing_request', label: 'Pricing request' }, { value: 'scheduling_request', label: 'Scheduling request' }, { value: 'referral', label: 'Referral' }],
    },
    parentId: 'tr-3',
    isBranchPath: true,
    nodes: [
      { id: 'tr-8', flowType: 'delay' as const, data: { title: 'Wait 3 days', subtype: 'Delay', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Description' } },
      { id: 'tr-9', flowType: 'task' as const, data: { title: 'Check message received', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Check whether the contact has replied since the referral was sent.' } },
      { id: 'tr-10', flowType: 'branch' as const, data: { title: 'Based on conditions', subtype: 'Branch', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter branch name', descriptionPlaceholder: 'Appointment confirmed or not?' } },
    ],
  },
  'tr-3-path-fallback': {
    branchName: 'No conditions match',
    description: 'None of the above conditions matched.',
    conditions: [],
    parentId: 'tr-3',
    isBranchPath: true,
    isFallback: true,
    nodes: [],
  },
  'tr-4': { taskName: 'Assign contact status', description: 'Analyze the incoming messages and assign the contact status', selectedTools: ['assign-contact-status'] },
  'tr-5': { taskName: 'Assign conversation', description: 'Analyze the incoming messages and assign the conversation to team or agent', selectedTools: ['assign-conversation'] },
  'tr-6': { taskName: 'Assign contact status', description: 'Analyze the incoming messages and assign the contact status', selectedTools: ['assign-contact-status'] },
  'tr-7': { taskName: 'Assign conversation', description: 'Analyze the incoming messages and assign the conversation to team or agent', selectedTools: ['assign-conversation'] },
  'tr-8': { name: 'Wait 3 days', duration: '3', unit: 'days' },
  'tr-9': { taskName: 'Check message received', description: 'Check whether the contact has replied since the referral was sent.', selectedTools: [] },
  'tr-10': {
    basedOn: 'conditions',
    branches: [
      { id: 'tr-10-path-1', name: 'No new message' },
      { id: 'tr-10-path-fallback', name: 'Message received', isFallback: true },
    ],
  },
  'tr-10-path-1': {
    branchName: 'No new message',
    description: 'No new message received from the contact.',
    conditions: [
      { id: 1, fieldValue: 'message_received', operatorValue: 'equals', valueValue: 'false' },
    ],
    conditionOptions: {
      field:    [{ value: 'message_received', label: 'Message received' }],
      operator: [...CONDITION_OPERATORS],
      value:    [{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }],
    },
    parentId: 'tr-10',
    isBranchPath: true,
    nodes: [
      { id: 'tr-11', flowType: 'task' as const, data: { title: 'Assign conversation status', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Mark the conversation as needing follow-up since no reply was received.' } },
    ],
  },
  'tr-10-path-fallback': {
    branchName: 'Message received',
    description: 'Contact responded before the wait period elapsed.',
    conditions: [],
    parentId: 'tr-10',
    isBranchPath: true,
    isFallback: true,
    nodes: [],
  },
  'tr-11': { taskName: 'Assign conversation status', description: 'Mark the conversation as needing follow-up since no reply was received.', selectedTools: ['assign-conversation-status'] },
}

// ─── Review response agent ───────────────────────────────────────────────────
// Workflow: new/updated review → triage → branch
//   → "Respond": extract details → generate response → post reply
//   → "Fallback" (spam): send email alert

const REVIEW_RESPONSE_NODES = [
  {
    id: 'rr-1',
    flowType: 'trigger' as const,
    data: {
      title: 'When a new review is received or updated',
      subtype: 'Entity trigger',
      headerLabel: 'Trigger',
      hasToggle: true,
      toggleEnabled: true,
      hasAiIcon: false,
      titlePlaceholder: 'Enter trigger name',
      descriptionPlaceholder: 'Enter description',
    },
  },
  {
    id: 'rr-2',
    flowType: 'task' as const,
    data: {
      title: 'Triage review',
      subtype: 'Custom',
      hasToggle: true,
      toggleEnabled: true,
      hasAiIcon: false,
      titlePlaceholder: 'Enter task name',
      descriptionPlaceholder:
        'The system checks the review to decide whether a response is required based on whether it is a genuine customer review or spam content that is irrelevant to the business or in any way violates the content policy of the source.',
    },
  },
  {
    id: 'rr-3',
    flowType: 'branch' as const,
    data: {
      title: 'Based on conditions',
      subtype: 'Branch',
      hasToggle: true,
      toggleEnabled: true,
      hasAiIcon: false,
      titlePlaceholder: 'Enter branch name',
      descriptionPlaceholder: 'Build condition-specific flows',
    },
  },
]

const REVIEW_RESPONSE_LOCATION_CITIES = [
  'Mountain view, CA',
  'Seattle, WA',
  'Dallas, TX',
  'Chicago, IL',
  'Phoenix, AZ',
  'Atlanta, GA',
  'Denver, CO',
  'Boston, MA',
  'New York, NY',
  'Philadelphia, PA',
  'Austin, TX',
  'San Antonio, TX',
  'Portland, OR',
  'San Diego, CA',
  'Miami, FL',
  'Las Vegas, NV',
]

/** 104 locations so Agent details shows 4 chips + "+ 100 more". */
const REVIEW_RESPONSE_LOCATIONS = Array.from({ length: 104 }, (_, i) => {
  const id = String(1001 + i)
  const city = REVIEW_RESPONSE_LOCATION_CITIES[i % REVIEW_RESPONSE_LOCATION_CITIES.length]
  return { id, name: `${id} - ${city}` }
})

const REVIEW_RESPONSE_NODE_DETAILS: Record<string, any> = {
  '__start__': {
    agentName: 'Review response agent replying autonomously',
    goals:
      'Executes rule-based logic to rotate through qualifying templates and publish them automatically. If technical restrictions prevent immediate posting, the response is queued as a suggestion for manual review',
    outcomes:
      'Ensure safe, effortless engagement by relying exclusively on your pre-approved templates. Eliminate manual effort and operational overhead by autonomously responding across platforms',
    locations: REVIEW_RESPONSE_LOCATIONS,
  },
  'rr-1': {
    triggerName: 'When a new review is received or updated',
    description: 'Agent triggers on new or updated reviews across all sources and locations.',
    conditions: [],
    conditionOptions: {
      field: [
        { value: 'review_event',  label: 'Review event' },
        { value: 'review_source', label: 'Review source' },
        { value: 'location',      label: 'Location' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'created_or_updated', label: 'Created or updated' },
        { value: 'created',            label: 'Created' },
        { value: 'updated',            label: 'Updated' },
      ],
    },
  },
  'rr-2': {
    taskName: 'Triage review',
    description:
      'The system checks the review to decide whether a response is required based on whether it is a genuine customer review or spam content that is irrelevant to the business or in any way violates the content policy of the source.',
    llmModel: 'Fast',
    contextFields: [
      { value: 'Review.comment', type: 'variable' },
      { value: 'Review.source', type: 'variable' },
      { value: 'https://www.yelp.com/guidelines', type: 'link' },
      { value: 'Review.rating', type: 'variable' },
      { value: 'Review.id', type: 'variable' },
      { value: 'Location.name', type: 'variable' },
      { value: 'Location.brand', type: 'variable' },
      { value: 'https://support.google.com/business/answer/4596773', type: 'link' },
      { value: 'Business.contentPolicy', type: 'variable' },
      { value: 'Review.language', type: 'variable' },
      { value: 'Contact.email', type: 'variable' },
    ],
    inputFields: [
      { value: 'Review.comment', type: 'variable' },
      { value: 'Review.source', type: 'variable' },
      { value: 'Review.rating', type: 'variable' },
    ],
    systemPrompt:
      'You are the First-Line triaging agent. Analyze the incoming review if it is a genuine customer review or irrelevant spam.',
    userPrompt:
      'If the review content violates any content terms of {{Review.source}} treat it as spam.\n' +
      'If the review contains business-unrelated self-promotion or distracts from the business profile, treat it as spam.\n' +
      'Otherwise mark it as a genuine customer review.\n' +
      'Set Review.isSpam and Review.spamReason accordingly.',
    outputFields: [
      { value: 'Review.isSpam', type: 'variable' },
      { value: 'Review.spamReason', type: 'variable' },
    ],
  },
  'rr-3': {
    basedOn: 'conditions',
    branches: [
      { id: 'rr-3-path-respond', name: 'Respond' },
      { id: 'rr-3-path-fallback', name: 'Fallback branch', isFallback: true },
    ],
  },
  'rr-3-path-respond': {
    branchName: 'Respond',
    description: 'Review is a genuine customer review — extract details, generate a reply, and post it.',
    conditions: [
      { id: 1, fieldValue: 'Review.isSpam', operatorValue: 'equals', valueValue: 'false' },
    ],
    conditionOptions: {
      field: [
        { value: 'Review.isSpam', label: 'Review.isSpam' },
        { value: 'triage_result', label: 'Triage result' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'true',  label: 'True' },
        { value: 'false', label: 'False' },
        { value: 'genuine', label: 'Genuine' },
        { value: 'spam', label: 'Spam' },
      ],
    },
    parentId: 'rr-3',
    isBranchPath: true,
    nodes: [
      {
        id: 'rr-4',
        flowType: 'task' as const,
        data: {
          title: 'Extract review details',
          subtype: 'Custom',
          hasToggle: true,
          toggleEnabled: true,
          hasAiIcon: false,
          titlePlaceholder: 'Enter task name',
          descriptionPlaceholder:
            'Identifies what the reviewer means, matches it to the business\'s terms, scores severity, and flags staff or competitors mentioned',
        },
      },
      {
        id: 'rr-5',
        flowType: 'task' as const,
        data: {
          title: 'Generate response',
          subtype: 'Custom',
          hasToggle: true,
          toggleEnabled: true,
          hasAiIcon: false,
          titlePlaceholder: 'Enter task name',
          descriptionPlaceholder:
            'Assembles the response using the drafted strategy, extracted details, and brand voice',
        },
      },
      {
        id: 'rr-6',
        flowType: 'task' as const,
        data: {
          title: 'Publish response',
          subtype: 'Integration',
          hasToggle: true,
          toggleEnabled: true,
          hasAiIcon: false,
          titlePlaceholder: 'Enter task name',
          descriptionPlaceholder:
            'Sends the response automatically or holds it for approval',
        },
      },
    ],
  },
  'rr-4': {
    taskName: 'Extract review details',
    description:
      'Identifies what the reviewer means, matches it to the business\'s terms, scores severity, and flags staff or competitors mentioned',
    llmModel: 'Thinking',
    contextFields: [
      { value: 'Location.name', type: 'variable' },
      { value: 'Location.brand', type: 'variable' },
      { value: 'location.speciality', type: 'variable' },
      { value: 'www.aspendental.com', type: 'link' },
      { value: 'Location.address', type: 'variable' },
      { value: 'Business.vocabulary', type: 'variable' },
    ],
    inputFields: [
      { value: 'Review.comment', type: 'variable' },
      { value: 'Review.rating', type: 'variable' },
      { value: 'Review.source', type: 'variable' },
      { value: 'Contact.assistedby', type: 'variable' },
    ],
    systemPrompt:
      'You are a Review Intelligence Extractor. Your job is to analyze a customer review and extract details. Be precise. Do not hallucinate. If something is not mentioned or cannot be confidently determined, leave the field empty.',
    userPrompt:
      'Analyze the following review:\n' +
      'Review Text: {{Review.text}}\n' +
      'Star Rating: {{Review.rating}}\n' +
      'Perform all of the following:\n' +
      '1. Detect the review language\n' +
      '2. Score sentiment and severity, and explain the severity reason\n' +
      '3. Decide whether to escalate (legal threats, safety, CRITICAL)\n' +
      '4. Extract topics, staff mentions, and competitor mentions\n' +
      'Never invent staff or competitor names that are not in the review.',
    outputFields: [
      { value: 'Review.language', type: 'variable' },
      { value: 'Review.severity', type: 'variable' },
      { value: 'Review.sentiment', type: 'variable' },
      { value: 'Review.severityreason', type: 'variable' },
      { value: 'Review.escalate', type: 'variable' },
      { value: 'Topics', type: 'variable' },
      { value: 'Staff_mentions', type: 'variable' },
      { value: 'Competitor_mentions', type: 'variable' },
    ],
  },
  'rr-5': {
    taskName: 'Generate response',
    description:
      'Assembles the response using the drafted strategy, extracted details, and brand voice',
    llmModel: 'Balanced',
    contextFields: [
      { value: 'Location.brand', type: 'variable' },
      { value: 'Location.name', type: 'variable' },
      { value: 'Locaiton.alias', type: 'variable' },
      { value: 'Location.address', type: 'variable' },
      { value: 'Location.phone', type: 'variable' },
      { value: 'Location.email', type: 'variable' },
      { value: 'Location.hours', type: 'variable' },
      { value: 'Brand.voice', type: 'variable' },
      { value: 'Brand.tone', type: 'variable' },
      { value: 'Business.seoKeywords', type: 'variable' },
      { value: 'Business.phone', type: 'variable' },
      { value: 'Business.email', type: 'variable' },
      { value: 'Review.source', type: 'variable' },
      { value: 'Contact.firstName', type: 'variable' },
      { value: 'Location.speciality', type: 'variable' },
      { value: 'Brand.forbiddenPhrases', type: 'variable' },
      { value: 'Business.offlineInvite', type: 'variable' },
      { value: 'Location.website', type: 'variable' },
      { value: 'Brand.signature', type: 'variable' },
      { value: 'Business.faq', type: 'variable' },
    ],
    inputFields: [
      { value: '4.review.sentiment', type: 'variable' },
      { value: '4.review.language', type: 'variable' },
      { value: '4.review.escalate', type: 'variable' },
      { value: '4.topics', type: 'variable' },
    ],
    systemPrompt:
      'You are a marketing manager specialised in writing responses to customer reviews',
    userPrompt:
      'Write a response to {{Review.text}} with Star rating: {{Review.rating}}\n' +
      'Apply all relevant rules below (cumulative, not exclusive).\n' +
      'Rule 0 — LANGUAGE: reply in the same language as the review ({{4.review.language}}).\n' +
      'Rule 1 — LENGTH: keep the reply under 60 words.\n' +
      'Rule 2 — POSITIVE: for positive sentiment, thank them and add one SEO keyword.\n' +
      'Rule 3 — NEGATIVE: never name staff; acknowledge and invite them to call or email the business.\n' +
      'Rule 4 — ESCALATE: if {{4.review.escalate}} is true, keep the reply short and recommend an immediate call.',
    outputFields: [
      { value: 'Review.response', type: 'variable' },
    ],
  },
  'rr-6': {
    taskName: 'Publish response',
    description:
      'Sends the response automatically or holds it for approval',
    selectedTools: ['handle-response'],
  },
  'rr-3-path-fallback': {
    branchName: 'Fallback branch',
    description: 'Review was marked as spam — alert the team instead of posting a reply.',
    conditions: [],
    parentId: 'rr-3',
    isBranchPath: true,
    isFallback: true,
    nodes: [
      {
        id: 'rr-7',
        flowType: 'task' as const,
        data: {
          title: 'Send email alert',
          subtype: 'Integration',
          hasToggle: true,
          toggleEnabled: true,
          hasAiIcon: false,
          titlePlaceholder: 'Enter task name',
          descriptionPlaceholder:
            'Notifies your team when a review is marked as spam and needs manual action on the review site',
        },
      },
    ],
  },
  'rr-7': {
    taskName: 'Send email alert',
    description:
      'Notifies your team when a review is marked as spam and needs manual action on the review site',
    selectedTools: ['send-email'],
  },
}

export const REVIEW_RESPONSE_WORKFLOW: AgentWorkflow = {
  nodes: REVIEW_RESPONSE_NODES,
  nodeDetails: REVIEW_RESPONSE_NODE_DETAILS,
}

// ─── Review generation agent ─────────────────────────────────────────────────
// Workflow: transaction complete → send review request email → send review request text

const REVIEW_GENERATION_NODES = [
  {
    id: 'rg-1',
    flowType: 'trigger' as const,
    data: {
      title: 'When a transaction is completed',
      subtype: 'Entity trigger',
      headerLabel: 'Trigger',
      hasToggle: false,
      hasAiIcon: false,
      titlePlaceholder: 'Enter trigger name',
      descriptionPlaceholder: 'Enter description',
    },
  },
  {
    id: 'rg-2',
    flowType: 'task' as const,
    data: {
      title: 'Send review request email',
      subtype: 'Integration',
      hasToggle: false,
      hasAiIcon: false,
      titlePlaceholder: 'Enter task name',
      descriptionPlaceholder: 'Enter description',
    },
  },
  {
    id: 'rg-3',
    flowType: 'task' as const,
    data: {
      title: 'Send review request text',
      subtype: 'Integration',
      hasToggle: false,
      hasAiIcon: false,
      titlePlaceholder: 'Enter task name',
      descriptionPlaceholder: 'Enter description',
    },
  },
]

const REVIEW_GENERATION_NODE_DETAILS: Record<string, any> = {
  '__start__': {
    agentName: 'Review generation agent',
    goals:
      'Request reviews from customers after a completed transaction, using email and text to maximize response rates.',
    outcomes:
      'Increase review volume across locations while saving staff time on manual follow-up.',
    locations: [
      { id: 'loc-1', name: 'North Region' },
      { id: 'loc-2', name: 'A/B testing cohort' },
    ],
  },
  'rg-1': {
    triggerName: 'When a transaction is completed',
    description: 'Agent triggers when a customer completes a qualifying transaction at an enabled location.',
    conditions: [
      { id: 1, fieldValue: 'transaction_status', operatorValue: 'equals', valueValue: 'completed' },
    ],
    conditionOptions: {
      field: [
        { value: 'transaction_status', label: 'Transaction status' },
        { value: 'location', label: 'Location' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'completed', label: 'Completed' },
      ],
    },
  },
  'rg-2': {
    taskName: 'Send review request email',
    description: 'Sends a branded email asking the customer to leave a review on their preferred review site.',
    selectedTools: ['send-email'],
  },
  'rg-3': {
    taskName: 'Send review request text',
    description: 'Follows up with a short text message containing a review request link.',
    selectedTools: ['send-sms'],
  },
}

export const REVIEW_GENERATION_WORKFLOW: AgentWorkflow = {
  nodes: REVIEW_GENERATION_NODES,
  nodeDetails: REVIEW_GENERATION_NODE_DETAILS,
}

export const HEALTHCARE_AGENT_WORKFLOWS: Record<string, AgentWorkflow> = {
  'Front desk agent': { nodes: FRONTDESK_NODES,             nodeDetails: FRONTDESK_HC_NODE_DETAILS          },
  'Front desk agent (exploration)': { nodes: FRONTDESK_NODES, nodeDetails: FRONTDESK_HC_NODE_DETAILS },
  'Reminder agent':  HEALTHCARE_REMINDER_DEFAULT_WORKFLOW,
  'Outreach agent':  { nodes: OUTREACH_NODES,              nodeDetails: OUTREACH_NODE_DETAILS              },
  'Pre-visit agent':  { nodes: PREVISIT_NODES,             nodeDetails: PREVISIT_NODE_DETAILS              },
  'Waitlist agent':   { nodes: WAITLIST_NODES,             nodeDetails: WAITLIST_NODE_DETAILS              },
  'Tagging & routing agent': { nodes: TAGGING_ROUTING_NODES, nodeDetails: TAGGING_ROUTING_NODE_DETAILS      },
  // Instance names strip to "Review response agent"; library / create uses the longer titles.
  'Review response agent': REVIEW_RESPONSE_WORKFLOW,
  'Review response agent replying autonomously': REVIEW_RESPONSE_WORKFLOW,
  'Review response agent replying using templates': REVIEW_RESPONSE_WORKFLOW,
  'Review response agent replying after human approval': REVIEW_RESPONSE_WORKFLOW,
  'Review response agent suggesting replies in dashboard': REVIEW_RESPONSE_WORKFLOW,
  'Review response agents': REVIEW_RESPONSE_WORKFLOW,
  'Review response agents (exploration)': REVIEW_RESPONSE_WORKFLOW,
  'Review generation agent': REVIEW_GENERATION_WORKFLOW,
  'Review generation agent with A/B testing': REVIEW_GENERATION_WORKFLOW,
  'Review generation agents': REVIEW_GENERATION_WORKFLOW,
}

// ─── Shared voice-call conditionOptions (reused across all three dental agents) ─

const VC_CONDITION_OPTIONS = {
  field: [
    { value: 'call_status',      label: 'Call status' },
    { value: 'call_duration',    label: 'Call duration' },
    { value: 'patient_response', label: 'Patient response' },
    { value: 'call_attempt',     label: 'Call attempt' },
  ],
  operator: [...CONDITION_OPERATORS],
  value: [
    { value: 'answered',  label: 'Answered' },
    { value: 'rejected',  label: 'Rejected' },
    { value: 'missed',    label: 'Missed' },
    { value: 'voicemail', label: 'Voicemail' },
  ],
}

// ─── Dental: Recall Agent ────────────────────────────────────────────────────
// Sketch: trigger → send recall email → send recall SMS → delay 2 days
//   → branch (app not booked / booked)
//     → "App not booked": initiate voice call
//         → call answered:  (empty — frontdesk routing done inside call)
//         → call rejected:  (empty)
//         → call missed:    delay 1 day → send recall SMS → branch (same condition)
//     → "Appointment booked" fallback: (empty)

const RECALL_NODES = [
  {
    id: 'rcl-1',
    flowType: 'trigger' as const,
    data: { title: 'Contact is added to segment — Hygiene recall', subtype: 'Trigger', headerLabel: 'Trigger', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter trigger name', descriptionPlaceholder: 'Enter description' },
  },
  {
    id: 'rcl-2',
    flowType: 'task' as const,
    data: { title: 'Send recall email', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Personalized hygiene recall email with self-schedule link' },
  },
  {
    id: 'rcl-3',
    flowType: 'task' as const,
    data: { title: 'Send recall SMS', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Short recall SMS with booking link' },
  },
  {
    id: 'rcl-4',
    flowType: 'delay' as const,
    data: { title: 'Delay for 2 days', subtype: 'Delay', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait for specific time or event.' },
  },
  {
    id: 'rcl-5',
    flowType: 'branch' as const,
    data: { title: 'Based on conditions', subtype: 'Branch', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter branch name', descriptionPlaceholder: 'Appointment booked or not?' },
  },
]

const RECALL_NODE_DETAILS: Record<string, any> = {
  '__start__': {
    agentName: 'Recall agent',
    goals: 'Reactivate overdue patients by sending personalized recall outreach via email, SMS, and voice, and booking them into hygiene appointments with minimal staff effort.',
    outcomes:
      '1. Patient books a hygiene appointment via self-schedule link\n' +
      '2. Patient books over the phone during the voice call\n' +
      '3. Voicemail left — patient calls back to book\n' +
      '4. Patient does not respond — sequence completes without booking',
    locations: ['Atlanta, GA', 'Dallas, TX', 'Chicago, IL', 'Miami, FL'],
  },
  'rcl-1': {
    triggerName: 'Contact is added to segment — Hygiene recall',
    description: 'Fires when a contact is added to the Hygiene recall segment, indicating the patient is overdue for a hygiene visit.',
    conditions: [
      { id: 1, fieldValue: 'segment', operatorValue: 'equals', valueValue: 'hygiene_recall' },
    ],
    conditionOptions: {
      field: [
        { value: 'segment',         label: 'Segment' },
        { value: 'last_visit_date', label: 'Last visit date' },
        { value: 'recall_due_date', label: 'Recall due date' },
        { value: 'patient_status',  label: 'Patient status' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'hygiene_recall', label: 'Hygiene recall' },
        { value: 'active',         label: 'Active' },
        { value: 'inactive',       label: 'Inactive' },
      ],
    },
  },
  'rcl-2': {
    taskName: 'Send recall email',
    description: 'Personalized hygiene recall email with self-schedule link',
    selectedTools: ['send-confirmation', 'dms-integration'],
  },
  'rcl-3': {
    taskName: 'Send recall SMS',
    description: 'Short recall SMS with booking link',
    selectedTools: ['send-confirmation'],
  },
  'rcl-4': { name: 'Delay for 2 days', duration: '2', unit: 'days' },
  'rcl-5': {
    basedOn: 'conditions',
    branches: [
      { id: 'rcl-5-path-1', name: 'Appointment not booked' },
      { id: 'rcl-5-path-2', name: 'Appointment booked', isFallback: true },
    ],
  },
  'rcl-5-path-1': {
    branchName: 'Appointment not booked',
    description: 'Patient has not booked after email and SMS — escalate to voice call.',
    conditions: [
      { id: 1, fieldValue: 'future_appointment', operatorValue: 'equals', valueValue: 'false' },
    ],
    conditionOptions: {
      field: [
        { value: 'future_appointment', label: 'Future appointment' },
        { value: 'appointment_status', label: 'Appointment status' },
        { value: 'booking_response',   label: 'Booking response' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'true',  label: 'True' },
        { value: 'false', label: 'False' },
      ],
    },
    parentId: 'rcl-5',
    isBranchPath: true,
    nodes: [
      {
        id: 'rcl-6',
        flowType: 'voiceCall',
        data: { title: 'Initiate voice call', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter name', descriptionPlaceholder: 'Call the patient to book a hygiene recall appointment', branches: [{ id: 'rcl-6-vc-completed', name: 'Call answered', isVoiceCallBranch: true }, { id: 'rcl-6-vc-rejected', name: 'Call rejected', isVoiceCallBranch: true }, { id: 'rcl-6-vc-missed', name: 'Call missed', isVoiceCallBranch: true }, { id: 'rcl-6-vc-voicemail', name: 'Voice mail', isVoiceCallBranch: true, isFallback: true }] },
      },
    ],
  },
  'rcl-5-path-2': {
    branchName: 'Appointment booked',
    description: 'Patient already booked — no further outreach needed.',
    conditions: [
      { id: 1, fieldValue: 'future_appointment', operatorValue: 'equals', valueValue: 'true' },
    ],
    conditionOptions: {
      field: [
        { value: 'future_appointment', label: 'Future appointment' },
        { value: 'appointment_status', label: 'Appointment status' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }],
    },
    parentId: 'rcl-5',
    isBranchPath: true,
    isFallback: true,
    nodes: [],
  },
  'rcl-6': {
    taskName: 'Initiate voice call',
    description: 'Call the patient to book a hygiene recall appointment.',
    toolId: 'initiate-voice-call',
    phoneNumber: 'Contact.PhoneNumber',
    callFrom: '',
    startingProcedure: 'Hygiene recall procedure',
    routeToFrontdesk: true,
    contextItems: [
      { id: '1', label: 'Patient ID',       variable: 'Contact.PatientId'      },
      { id: '2', label: 'Patient name',     variable: 'Contact.FullName'       },
      { id: '3', label: 'Last visit date',  variable: 'Contact.LastVisitDate'  },
      { id: '4', label: 'Recall due date',  variable: 'Contact.RecallDueDate'  },
      { id: '5', label: 'Provider ID',      variable: 'Contact.ProviderId'     },
    ],
    retrySettings: { noAnswer: true, callRejected: false, voiceMail: true },
    voicemailMessage: 'Hi {{Contact.FirstName}}, this is {{Practice.Name}} calling to schedule your hygiene recall appointment. Please call us back at {{Practice.PhoneNumber}} to book your visit.',
    maxAttempts: 2,
    retryInterval: 24,
    retryIntervalUnit: 'Hours',
    branches: [
      { id: 'rcl-6-vc-completed', name: 'Call answered', isVoiceCallBranch: true, isFallback: false },
      { id: 'rcl-6-vc-rejected',  name: 'Call rejected', isVoiceCallBranch: true, isFallback: false },
      { id: 'rcl-6-vc-missed',    name: 'Call missed',   isVoiceCallBranch: true, isFallback: false },
      { id: 'rcl-6-vc-voicemail', name: 'Voice mail',    isVoiceCallBranch: true, isFallback: true  },
    ],
  },
  'rcl-6-vc-completed': {
    branchName: 'Call answered',
    isVoiceCallBranch: true,
    isFallback: false,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'answered' }],
    conditionOptions: VC_CONDITION_OPTIONS,
    parentId: 'rcl-6',
    isBranchPath: true,
    nodes: [
      { id: 'rcl-6-fd', flowType: 'subagent', data: { title: 'Front desk agent - North region', subtype: 'Sub-agent', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Call subagent', descriptionPlaceholder: 'Call subagent workflow.' } },
    ],
  },
  'rcl-6-vc-rejected': {
    branchName: 'Call rejected',
    isVoiceCallBranch: true,
    isFallback: false,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'rejected' }],
    conditionOptions: VC_CONDITION_OPTIONS,
    parentId: 'rcl-6',
    isBranchPath: true,
    nodes: [
      { id: 'rcl-r1', flowType: 'delay', data: { title: 'Delay for 1 day',   subtype: 'Delay',       hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait before retrying.' } },
      { id: 'rcl-r-email', flowType: 'task', data: { title: 'Send recall email', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Follow-up recall email with booking link' } },
      { id: 'rcl-r2', flowType: 'task',  data: { title: 'Send recall SMS',    subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name',          descriptionPlaceholder: 'Follow-up recall SMS with booking link' } },
    ],
  },
  'rcl-6-vc-missed': {
    branchName: 'Call missed',
    isVoiceCallBranch: true,
    isFallback: false,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'missed' }],
    conditionOptions: VC_CONDITION_OPTIONS,
    parentId: 'rcl-6',
    isBranchPath: true,
    nodes: [
      { id: 'rcl-m1', flowType: 'delay', data: { title: 'Delay for 1 day',   subtype: 'Delay',       hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait before retrying.' } },
      { id: 'rcl-m-email', flowType: 'task', data: { title: 'Send recall email', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Follow-up recall email with booking link' } },
      { id: 'rcl-m2', flowType: 'task',  data: { title: 'Send recall SMS',    subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name',          descriptionPlaceholder: 'Follow-up recall SMS with booking link' } },
    ],
  },
  'rcl-6-vc-voicemail': {
    branchName: 'Voice mail',
    isVoiceCallBranch: true,
    isFallback: true,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'voicemail' }],
    conditionOptions: VC_CONDITION_OPTIONS,
    parentId: 'rcl-6',
    isBranchPath: true,
    nodes: [
      { id: 'rcl-v1', flowType: 'delay', data: { title: 'Delay for 1 day',   subtype: 'Delay',       hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait before retrying.' } },
      { id: 'rcl-v-email', flowType: 'task', data: { title: 'Send recall email', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Follow-up recall email with booking link' } },
      { id: 'rcl-v2', flowType: 'task',  data: { title: 'Send recall SMS',    subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name',          descriptionPlaceholder: 'Follow-up recall SMS with booking link' } },
    ],
  },
  // ── Rejected path sub-nodes ──
  'rcl-r1': { name: 'Delay for 1 day', duration: '1', unit: 'days' },
  'rcl-r2': { taskName: 'Send recall SMS', description: 'Follow-up recall SMS with booking link', selectedTools: ['send-confirmation'] },
  // ── Missed path sub-nodes ──
  'rcl-m1': { name: 'Delay for 1 day', duration: '1', unit: 'days' },
  'rcl-m2': { taskName: 'Send recall SMS', description: 'Follow-up recall SMS with booking link', selectedTools: ['send-confirmation'] },
  // ── Voicemail path sub-nodes ──
  'rcl-v1': { name: 'Delay for 1 day', duration: '1', unit: 'days' },
  'rcl-v2': { taskName: 'Send recall SMS', description: 'Follow-up recall SMS with booking link', selectedTools: ['send-confirmation'] },
  // Front desk agent subagent node
  'rcl-6-fd': { selectedAgent: 'frontdesk-north', name: 'Front desk agent - North region', description: 'Transfer to the front desk agent for assisted patient handling on recall call.', intent: 'Recall' },
  // ── Email task nodeDetails ──
  'rcl-r-email': { taskName: 'Send recall email', description: 'Follow-up recall email with booking link', selectedTools: ['send-confirmation'] },
  'rcl-m-email': { taskName: 'Send recall email', description: 'Follow-up recall email with booking link', selectedTools: ['send-confirmation'] },
  'rcl-v-email': { taskName: 'Send recall email', description: 'Follow-up recall email with booking link', selectedTools: ['send-confirmation'] },
}

// ─── Dental: Revenue (Payment) Agent ─────────────────────────────────────────
// Sketch: trigger → send payment due email → send payment due SMS → delay 2 days
//   → branch (payment not done / done)
//     → "Payment not done": initiate voice call → start procedure: payment reminder
//         → call rejected:  repeat-after-branch (same sequence)
//         → call missed:    delay 1 day → send payment due SMS → repeat-after-branch
//     → fallback (payment done): (empty)

const REVENUE_NODES = [
  {
    id: 'rev-1',
    flowType: 'trigger' as const,
    data: { title: 'Contact added to segment — Overdue 30 days', subtype: 'Trigger', headerLabel: 'Trigger', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter trigger name', descriptionPlaceholder: 'Enter description' },
  },
  {
    id: 'rev-2',
    flowType: 'task' as const,
    data: { title: 'Send payment due email', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Personalized payment reminder email with click-to-pay link' },
  },
  {
    id: 'rev-3',
    flowType: 'task' as const,
    data: { title: 'Send payment due SMS', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Short SMS with secure payment link' },
  },
  {
    id: 'rev-4',
    flowType: 'delay' as const,
    data: { title: 'Delay for 2 days', subtype: 'Delay', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait for specific time or event.' },
  },
  {
    id: 'rev-5',
    flowType: 'branch' as const,
    data: { title: 'Based on conditions', subtype: 'Branch', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter branch name', descriptionPlaceholder: 'Payment done or not?' },
  },
]

const REVENUE_NODE_DETAILS: Record<string, any> = {
  '__start__': {
    agentName: 'Revenue agent',
    goals: 'Collect outstanding patient balances by delivering timely, personalized payment reminders via email, SMS, and voice, reducing A/R days and minimizing staff effort.',
    outcomes:
      '1. Patient pays via click-to-pay link in email or SMS\n' +
      '2. Payment collected or payment plan set up over the phone\n' +
      '3. Dispute escalated to billing team for resolution\n' +
      '4. Patient does not respond — sequence completes after retry',
    locations: ['Atlanta, GA', 'Dallas, TX', 'Chicago, IL', 'Miami, FL'],
  },
  'rev-1': {
    triggerName: 'Contact added to segment — Overdue 30 days',
    description: 'Fires when a patient is added to the Overdue 30 days segment, indicating an outstanding balance older than 30 days.',
    conditions: [
      { id: 1, fieldValue: 'segment',     operatorValue: 'equals',       valueValue: 'overdue_30_days' },
      { id: 2, fieldValue: 'balance_age', operatorValue: 'greater_than', valueValue: '30_days' },
    ],
    conditionOptions: {
      field: [
        { value: 'segment',         label: 'Segment' },
        { value: 'balance_age',     label: 'Balance age (days)' },
        { value: 'balance_amount',  label: 'Balance amount' },
        { value: 'payment_status',  label: 'Payment status' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'overdue_30_days', label: 'Overdue 30 days' },
        { value: '30_days',         label: '30 days' },
        { value: '60_days',         label: '60 days' },
        { value: 'paid',            label: 'Paid' },
        { value: 'unpaid',          label: 'Unpaid' },
      ],
    },
  },
  'rev-2': {
    taskName: 'Send payment due email',
    description: 'Personalized payment reminder email with click-to-pay link',
    selectedTools: ['send-confirmation', 'dms-integration'],
  },
  'rev-3': {
    taskName: 'Send payment due SMS',
    description: 'Short SMS with secure payment link',
    selectedTools: ['send-confirmation'],
  },
  'rev-4': { name: 'Delay for 2 days', duration: '2', unit: 'days' },
  'rev-5': {
    basedOn: 'conditions',
    branches: [
      { id: 'rev-5-path-1', name: 'Payment not done' },
      { id: 'rev-5-path-2', name: 'Payment done', isFallback: true },
    ],
  },
  'rev-5-path-1': {
    branchName: 'Payment not done',
    description: 'Balance still outstanding after email and SMS — escalate to voice call.',
    conditions: [
      { id: 1, fieldValue: 'payment_done', operatorValue: 'equals', valueValue: 'false' },
    ],
    conditionOptions: {
      field: [
        { value: 'payment_done',   label: 'Payment done' },
        { value: 'payment_status', label: 'Payment status' },
        { value: 'balance_amount', label: 'Balance amount' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }],
    },
    parentId: 'rev-5',
    isBranchPath: true,
    nodes: [
      {
        id: 'rev-6',
        flowType: 'voiceCall',
        data: { title: 'Initiate voice call', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter name', descriptionPlaceholder: 'Call the patient to collect payment or arrange a plan', branches: [{ id: 'rev-6-vc-completed', name: 'Call answered', isVoiceCallBranch: true }, { id: 'rev-6-vc-rejected', name: 'Call rejected', isVoiceCallBranch: true }, { id: 'rev-6-vc-missed', name: 'Call missed', isVoiceCallBranch: true }, { id: 'rev-6-vc-voicemail', name: 'Voice mail', isVoiceCallBranch: true, isFallback: true }] },
      },
    ],
  },
  'rev-5-path-2': {
    branchName: 'Payment done',
    description: 'Payment received — sequence complete.',
    conditions: [
      { id: 1, fieldValue: 'payment_done', operatorValue: 'equals', valueValue: 'true' },
    ],
    conditionOptions: {
      field: [{ value: 'payment_done', label: 'Payment done' }],
      operator: [...CONDITION_OPERATORS],
      value: [{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }],
    },
    parentId: 'rev-5',
    isBranchPath: true,
    isFallback: true,
    nodes: [],
  },
  'rev-6': {
    taskName: 'Initiate voice call',
    description: 'Call the patient to collect payment or arrange a payment plan.',
    toolId: 'initiate-voice-call',
    phoneNumber: 'Contact.PhoneNumber',
    callFrom: '',
    startingProcedure: 'Payment reminder procedure',
    routeToFrontdesk: false,
    contextItems: [
      { id: '1', label: 'Patient ID',        variable: 'Contact.PatientId'       },
      { id: '2', label: 'Patient name',      variable: 'Contact.FullName'        },
      { id: '3', label: 'Balance amount',    variable: 'Contact.BalanceAmount'   },
      { id: '4', label: 'Invoice ID',        variable: 'Contact.InvoiceId'       },
      { id: '5', label: 'Payment due date',  variable: 'Contact.PaymentDueDate'  },
    ],
    retrySettings: { noAnswer: true, callRejected: false, voiceMail: true },
    voicemailMessage: 'Hi {{Contact.FirstName}}, this is {{Practice.Name}} calling regarding an outstanding balance of {{Contact.BalanceAmount}} on your account. Please call us back at {{Practice.PhoneNumber}} to discuss your payment options.',
    maxAttempts: 2,
    retryInterval: 24,
    retryIntervalUnit: 'Hours',
    branches: [
      { id: 'rev-6-vc-completed', name: 'Call answered', isVoiceCallBranch: true, isFallback: false },
      { id: 'rev-6-vc-rejected',  name: 'Call rejected', isVoiceCallBranch: true, isFallback: false },
      { id: 'rev-6-vc-missed',    name: 'Call missed',   isVoiceCallBranch: true, isFallback: false },
      { id: 'rev-6-vc-voicemail', name: 'Voice mail',    isVoiceCallBranch: true, isFallback: true  },
    ],
  },
  'rev-6-vc-completed': {
    branchName: 'Call answered',
    isVoiceCallBranch: true,
    isFallback: false,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'answered' }],
    conditionOptions: VC_CONDITION_OPTIONS,
    parentId: 'rev-6',
    isBranchPath: true,
    nodes: [
      { id: 'rev-6-fd', flowType: 'subagent', data: { title: 'Front desk agent - North region', subtype: 'Sub-agent', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Call subagent', descriptionPlaceholder: 'Call subagent workflow.' } },
    ],
  },
  'rev-6-vc-rejected': {
    branchName: 'Call rejected',
    isVoiceCallBranch: true,
    isFallback: false,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'rejected' }],
    conditionOptions: VC_CONDITION_OPTIONS,
    parentId: 'rev-6',
    isBranchPath: true,
    nodes: [
      { id: 'rev-r1', flowType: 'delay', data: { title: 'Delay for 1 day',       subtype: 'Delay',       hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait before retrying.' } },
      { id: 'rev-r-email', flowType: 'task', data: { title: 'Send payment due email', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Follow-up payment reminder email with click-to-pay link' } },
      { id: 'rev-r2', flowType: 'task',  data: { title: 'Send payment due SMS',   subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name',          descriptionPlaceholder: 'Follow-up payment reminder SMS' } },
    ],
  },
  'rev-6-vc-missed': {
    branchName: 'Call missed',
    isVoiceCallBranch: true,
    isFallback: false,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'missed' }],
    conditionOptions: VC_CONDITION_OPTIONS,
    parentId: 'rev-6',
    isBranchPath: true,
    nodes: [
      { id: 'rev-m1', flowType: 'delay', data: { title: 'Delay for 1 day',       subtype: 'Delay',       hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait before retrying.' } },
      { id: 'rev-m-email', flowType: 'task', data: { title: 'Send payment due email', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Follow-up payment reminder email with click-to-pay link' } },
      { id: 'rev-m2', flowType: 'task',  data: { title: 'Send payment due SMS',   subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name',          descriptionPlaceholder: 'Follow-up payment reminder SMS' } },
    ],
  },
  'rev-6-vc-voicemail': {
    branchName: 'Voice mail',
    isVoiceCallBranch: true,
    isFallback: true,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'voicemail' }],
    conditionOptions: VC_CONDITION_OPTIONS,
    parentId: 'rev-6',
    isBranchPath: true,
    nodes: [
      { id: 'rev-v1', flowType: 'delay', data: { title: 'Delay for 1 day',       subtype: 'Delay',       hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait before retrying.' } },
      { id: 'rev-v-email', flowType: 'task', data: { title: 'Send payment due email', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Follow-up payment reminder email with click-to-pay link' } },
      { id: 'rev-v2', flowType: 'task',  data: { title: 'Send payment due SMS',   subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name',          descriptionPlaceholder: 'Follow-up payment reminder SMS' } },
    ],
  },
  // ── Rejected/Missed/Voicemail path sub-nodes ──
  'rev-r1': { name: 'Delay for 1 day', duration: '1', unit: 'days' },
  'rev-r2': { taskName: 'Send payment due SMS', description: 'Follow-up payment reminder SMS', selectedTools: ['send-confirmation'] },
  'rev-m1': { name: 'Delay for 1 day', duration: '1', unit: 'days' },
  'rev-m2': { taskName: 'Send payment due SMS', description: 'Follow-up payment reminder SMS', selectedTools: ['send-confirmation'] },
  'rev-v1': { name: 'Delay for 1 day', duration: '1', unit: 'days' },
  'rev-v2': { taskName: 'Send payment due SMS', description: 'Follow-up payment reminder SMS', selectedTools: ['send-confirmation'] },
  // Front desk agent subagent node
  'rev-6-fd': { selectedAgent: 'frontdesk-north', name: 'Front desk agent - North region', description: 'Transfer to the front desk agent for assisted patient handling on payment call.', intent: 'Revenue' },
  // ── Email task nodeDetails ──
  'rev-r-email': { taskName: 'Send payment due email', description: 'Follow-up payment reminder email with click-to-pay link', selectedTools: ['send-confirmation'] },
  'rev-m-email': { taskName: 'Send payment due email', description: 'Follow-up payment reminder email with click-to-pay link', selectedTools: ['send-confirmation'] },
  'rev-v-email': { taskName: 'Send payment due email', description: 'Follow-up payment reminder email with click-to-pay link', selectedTools: ['send-confirmation'] },
}

// ─── Dental: Treatment Plan Agent ────────────────────────────────────────────
// Sketch: trigger → send TP email → send TP SMS → delay 2 days
//   → branch (TP not scheduled / scheduled)
//     → "Treatment plan not scheduled": initiate voice call → start procedure: TP coordinator
//         → call rejected:  repeat-after-branch (same check)
//         → call missed:    delay 1 day → send TP SMS → repeat-after-branch
//     → fallback (scheduled): (empty)

const TREATMENT_PLAN_NODES = [
  {
    id: 'tpa-1',
    flowType: 'trigger' as const,
    data: { title: 'Contact is added to segment — Treatment plan due', subtype: 'Trigger', headerLabel: 'Trigger', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter trigger name', descriptionPlaceholder: 'Enter description' },
  },
  {
    id: 'tpa-2',
    flowType: 'task' as const,
    data: { title: 'Send treatment plan unscheduled email', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Personalized treatment plan email with scheduling link' },
  },
  {
    id: 'tpa-3',
    flowType: 'task' as const,
    data: { title: 'Send treatment plan unscheduled SMS', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Short SMS with treatment plan scheduling link' },
  },
  {
    id: 'tpa-4',
    flowType: 'delay' as const,
    data: { title: 'Delay for 2 days', subtype: 'Delay', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait for specific time or event.' },
  },
  {
    id: 'tpa-5',
    flowType: 'branch' as const,
    data: { title: 'Based on conditions', subtype: 'Branch', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter branch name', descriptionPlaceholder: 'Treatment plan scheduled or not?' },
  },
]

const TREATMENT_PLAN_NODE_DETAILS: Record<string, any> = {
  '__start__': {
    agentName: 'Treatment plan agent',
    goals: 'Convert unscheduled treatment plans into booked appointments by following up via email, SMS, and voice, connecting engaged patients with the treatment plan coordinator.',
    outcomes:
      '1. Patient schedules via self-schedule link in email or SMS\n' +
      '2. Appointment booked over the phone during the voice call\n' +
      '3. Patient connected to treatment plan coordinator for complex questions\n' +
      '4. Patient does not respond — sequence completes after retry',
    locations: ['Atlanta, GA', 'Dallas, TX', 'Chicago, IL', 'Miami, FL'],
  },
  'tpa-1': {
    triggerName: 'Contact is added to segment — Treatment plan due',
    description: 'Fires when a contact is added to the Treatment plan due segment — treatment plan has been presented but no appointment is scheduled.',
    conditions: [
      { id: 1, fieldValue: 'segment', operatorValue: 'equals', valueValue: 'treatment_plan_due' },
    ],
    conditionOptions: {
      field: [
        { value: 'segment',              label: 'Segment' },
        { value: 'treatment_plan_status',label: 'Treatment plan status' },
        { value: 'days_since_presented', label: 'Days since presented' },
        { value: 'tp_value',             label: 'Treatment plan value' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'treatment_plan_due',  label: 'Treatment plan due' },
        { value: 'presented',           label: 'Presented' },
        { value: 'accepted',            label: 'Accepted' },
        { value: 'declined',            label: 'Declined' },
      ],
    },
  },
  'tpa-2': {
    taskName: 'Send treatment plan unscheduled email',
    description: 'Personalized treatment plan email with scheduling link',
    selectedTools: ['send-confirmation', 'dms-integration'],
  },
  'tpa-3': {
    taskName: 'Send treatment plan unscheduled SMS',
    description: 'Short SMS with treatment plan scheduling link',
    selectedTools: ['send-confirmation'],
  },
  'tpa-4': { name: 'Delay for 2 days', duration: '2', unit: 'days' },
  'tpa-5': {
    basedOn: 'conditions',
    branches: [
      { id: 'tpa-5-path-1', name: 'Treatment plan not scheduled' },
      { id: 'tpa-5-path-2', name: 'Treatment plan scheduled', isFallback: true },
    ],
  },
  'tpa-5-path-1': {
    branchName: 'Treatment plan not scheduled',
    description: 'Patient has not scheduled after email and SMS — escalate to voice call.',
    conditions: [
      { id: 1, fieldValue: 'treatment_plan_scheduled', operatorValue: 'equals', valueValue: 'false' },
    ],
    conditionOptions: {
      field: [
        { value: 'treatment_plan_scheduled', label: 'Treatment plan scheduled' },
        { value: 'treatment_plan_status',    label: 'Treatment plan status' },
        { value: 'future_appointment',       label: 'Future appointment' },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }],
    },
    parentId: 'tpa-5',
    isBranchPath: true,
    nodes: [
      {
        id: 'tpa-6',
        flowType: 'voiceCall',
        data: { title: 'Initiate voice call', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter name', descriptionPlaceholder: 'Call the patient to discuss and schedule their treatment plan', branches: [{ id: 'tpa-6-vc-completed', name: 'Call answered', isVoiceCallBranch: true }, { id: 'tpa-6-vc-rejected', name: 'Call rejected', isVoiceCallBranch: true }, { id: 'tpa-6-vc-missed', name: 'Call missed', isVoiceCallBranch: true }, { id: 'tpa-6-vc-voicemail', name: 'Voice mail', isVoiceCallBranch: true, isFallback: true }] },
      },
    ],
  },
  'tpa-5-path-2': {
    branchName: 'Treatment plan scheduled',
    description: 'Patient already scheduled — no further outreach needed.',
    conditions: [
      { id: 1, fieldValue: 'treatment_plan_scheduled', operatorValue: 'equals', valueValue: 'true' },
    ],
    conditionOptions: {
      field: [{ value: 'treatment_plan_scheduled', label: 'Treatment plan scheduled' }],
      operator: [...CONDITION_OPERATORS],
      value: [{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }],
    },
    parentId: 'tpa-5',
    isBranchPath: true,
    isFallback: true,
    nodes: [],
  },
  'tpa-6': {
    taskName: 'Initiate voice call',
    description: 'Call the patient to discuss the treatment plan and schedule their appointment.',
    toolId: 'initiate-voice-call',
    phoneNumber: 'Contact.PhoneNumber',
    callFrom: '',
    startingProcedure: 'Treatment plan coordinator procedure',
    routeToFrontdesk: true,
    contextItems: [
      { id: '1', label: 'Patient ID',         variable: 'Contact.PatientId'        },
      { id: '2', label: 'Patient name',       variable: 'Contact.FullName'         },
      { id: '3', label: 'Treatment plan ID',  variable: 'Contact.TreatmentPlanId'  },
      { id: '4', label: 'Provider ID',        variable: 'Contact.ProviderId'       },
      { id: '5', label: 'Plan value',         variable: 'Contact.TreatmentPlanValue'},
    ],
    retrySettings: { noAnswer: true, callRejected: false, voiceMail: true },
    voicemailMessage: 'Hi {{Contact.FirstName}}, this is {{Practice.Name}} calling to discuss your treatment plan and help you schedule your next appointment. Please call us back at {{Practice.PhoneNumber}} at your earliest convenience.',
    maxAttempts: 2,
    retryInterval: 24,
    retryIntervalUnit: 'Hours',
    branches: [
      { id: 'tpa-6-vc-completed', name: 'Call answered', isVoiceCallBranch: true, isFallback: false },
      { id: 'tpa-6-vc-rejected',  name: 'Call rejected', isVoiceCallBranch: true, isFallback: false },
      { id: 'tpa-6-vc-missed',    name: 'Call missed',   isVoiceCallBranch: true, isFallback: false },
      { id: 'tpa-6-vc-voicemail', name: 'Voice mail',    isVoiceCallBranch: true, isFallback: true  },
    ],
  },
  'tpa-6-vc-completed': {
    branchName: 'Call answered',
    isVoiceCallBranch: true,
    isFallback: false,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'answered' }],
    conditionOptions: VC_CONDITION_OPTIONS,
    parentId: 'tpa-6',
    isBranchPath: true,
    nodes: [
      { id: 'tpa-6-fd', flowType: 'subagent', data: { title: 'Front desk agent - North region', subtype: 'Sub-agent', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Call subagent', descriptionPlaceholder: 'Call subagent workflow.' } },
    ],
  },
  'tpa-6-vc-rejected': {
    branchName: 'Call rejected',
    isVoiceCallBranch: true,
    isFallback: false,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'rejected' }],
    conditionOptions: VC_CONDITION_OPTIONS,
    parentId: 'tpa-6',
    isBranchPath: true,
    nodes: [
      { id: 'tpa-r1', flowType: 'delay', data: { title: 'Delay for 1 day',                      subtype: 'Delay',       hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait before retrying.' } },
      { id: 'tpa-r-email', flowType: 'task', data: { title: 'Send treatment plan email', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Follow-up treatment plan email with scheduling link' } },
      { id: 'tpa-r2', flowType: 'task',  data: { title: 'Send treatment plan unscheduled SMS',   subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name',          descriptionPlaceholder: 'Follow-up treatment plan SMS with scheduling link' } },
    ],
  },
  'tpa-6-vc-missed': {
    branchName: 'Call missed',
    isVoiceCallBranch: true,
    isFallback: false,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'missed' }],
    conditionOptions: VC_CONDITION_OPTIONS,
    parentId: 'tpa-6',
    isBranchPath: true,
    nodes: [
      { id: 'tpa-m1', flowType: 'delay', data: { title: 'Delay for 1 day', subtype: 'Delay', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait before retrying.' } },
      { id: 'tpa-m-email', flowType: 'task', data: { title: 'Send treatment plan email', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Follow-up treatment plan email with scheduling link' } },
      { id: 'tpa-m2', flowType: 'task', data: { title: 'Send treatment plan unscheduled SMS', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Follow-up treatment plan SMS with scheduling link' } },
    ],
  },
  'tpa-6-vc-voicemail': {
    branchName: 'Voice mail',
    isVoiceCallBranch: true,
    isFallback: true,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'voicemail' }],
    conditionOptions: VC_CONDITION_OPTIONS,
    parentId: 'tpa-6',
    isBranchPath: true,
    nodes: [
      { id: 'tpa-v1', flowType: 'delay', data: { title: 'Delay for 1 day',                      subtype: 'Delay',       hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait before retrying.' } },
      { id: 'tpa-v-email', flowType: 'task', data: { title: 'Send treatment plan email', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Follow-up treatment plan email with scheduling link' } },
      { id: 'tpa-v2', flowType: 'task',  data: { title: 'Send treatment plan unscheduled SMS',   subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name',          descriptionPlaceholder: 'Follow-up treatment plan SMS with scheduling link' } },
    ],
  },
  // ── Rejected/Missed/Voicemail path sub-nodes ──
  'tpa-r1': { name: 'Delay for 1 day', duration: '1', unit: 'days' },
  'tpa-r2': { taskName: 'Send treatment plan unscheduled SMS', description: 'Follow-up treatment plan SMS with scheduling link', selectedTools: ['send-confirmation'] },
  'tpa-m1': { name: 'Delay for 1 day', duration: '1', unit: 'days' },
  'tpa-m2': { taskName: 'Send treatment plan unscheduled SMS', description: 'Follow-up treatment plan SMS with scheduling link', selectedTools: ['send-confirmation'] },
  'tpa-v1': { name: 'Delay for 1 day', duration: '1', unit: 'days' },
  'tpa-v2': { taskName: 'Send treatment plan unscheduled SMS', description: 'Follow-up treatment plan SMS with scheduling link', selectedTools: ['send-confirmation'] },
  // Front desk agent subagent node
  'tpa-6-fd': { selectedAgent: 'frontdesk-north', name: 'Front desk agent - North region', description: 'Transfer to the front desk agent for assisted patient handling on treatment plan call.', intent: 'Treatment plan' },
  // ── Email task nodeDetails ──
  'tpa-r-email': { taskName: 'Send treatment plan email', description: 'Follow-up treatment plan email with scheduling link', selectedTools: ['send-confirmation'] },
  'tpa-m-email': { taskName: 'Send treatment plan email', description: 'Follow-up treatment plan email with scheduling link', selectedTools: ['send-confirmation'] },
  'tpa-v-email': { taskName: 'Send treatment plan email', description: 'Follow-up treatment plan email with scheduling link', selectedTools: ['send-confirmation'] },
}

// ─── Dental: Treatment Plan Agent — Schedule based ───────────────────────────
// Workflow: schedule trigger → query unscheduled plans → email → text → delay 2d
//   → condition (if still unscheduled)
//     → initiate voice call (4 branches: answered / rejected / missed / voicemail)
//     → fallback (scheduled)

const TPS_NODES = [
  { id: 'tps-1', flowType: 'trigger' as const, data: { title: 'Schedule — every 2 weeks', subtype: 'Schedule-based', headerLabel: 'Trigger', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter trigger name', descriptionPlaceholder: 'Enter description' } },
  { id: 'tps-2', flowType: 'task'    as const, data: { title: 'Get all unscheduled treatment plans', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Query all plans with no scheduled appointment' } },
  { id: 'tps-3', flowType: 'task'    as const, data: { title: 'Send email', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Personalized treatment plan with scheduling link.' } },
  { id: 'tps-4', flowType: 'task'    as const, data: { title: 'Send text', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Short SMS with scheduling link.' } },
  { id: 'tps-5', flowType: 'delay'   as const, data: { title: 'Delay for 2 days', subtype: 'Delay', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait before checking schedule status.' } },
  { id: 'tps-6', flowType: 'branch'  as const, data: { title: 'If still unscheduled', subtype: 'Branch', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter branch name', descriptionPlaceholder: 'Check if treatment plan is still unscheduled.', branches: [{ id: 'tps-6-path-1', name: 'Still unscheduled' }, { id: 'tps-6-path-2', name: 'Now scheduled', isFallback: true }] } },
]

const TPS_NODE_DETAILS: Record<string, unknown> = {
  '__start__': {
    agentName: 'Treatment plan agent — Schedule based',
    goals: 'Re-engage patients with unscheduled treatment plans through a cadenced outreach sequence that escalates from email to SMS to a live voice call.',
    outcomes: 'Increase treatment plan acceptance rate by automatically following up with every unscheduled plan on a fixed 2-week cadence.',
    locations: ['Cedar Park Dental', 'Riverside Family Dental', 'Lakeview Dental'],
  },
  'tps-1': {
    triggerName: 'Schedule — every 2 weeks',
    description: 'Runs on a fixed 2-week cadence to identify and reach out to patients with unscheduled treatment plans.',
    frequency: 'Every 2 weeks',
    day: 'Monday',
    time: '9:00 AM',
  },
  'tps-2': {
    taskName: 'Get all unscheduled treatment plans',
    description: 'Filters applied: D-code = XYZ & treating office = 124.',
    selectedTools: ['get-unscheduled-treatment-plans'],
  },
  'tps-3': {
    taskName: 'Send email',
    description: 'Personalized treatment plan with scheduling link.',
    selectedTools: ['send-confirmation'],
  },
  'tps-4': {
    taskName: 'Send text',
    description: 'Short SMS with scheduling link.',
    selectedTools: ['send-confirmation'],
  },
  'tps-5': { name: 'Delay for 2 days', duration: '2', unit: 'days' },
  'tps-6': {
    basedOn: 'conditions',
    branches: [
      { id: 'tps-6-path-1', name: 'Still unscheduled' },
      { id: 'tps-6-path-2', name: 'Now scheduled', isFallback: true },
    ],
  },
  'tps-6-path-1': {
    branchName: 'Still unscheduled',
    description: 'Patient has not yet scheduled — escalate to voice call.',
    conditions: [{ id: 1, fieldValue: 'treatment_plan_scheduled', operatorValue: 'equals', valueValue: 'false' }],
    conditionOptions: {
      field:    [{ value: 'treatment_plan_scheduled', label: 'Treatment plan scheduled' }],
      operator: [...CONDITION_OPERATORS],
      value:    [{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }],
    },
    parentId: 'tps-6',
    isBranchPath: true,
    nodes: [
      { id: 'tps-7', flowType: 'voiceCall' as const, data: { title: 'Initiate voice call', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter name', descriptionPlaceholder: 'Call the patient to schedule their treatment plan.', branches: [{ id: 'tps-7-vc-answered', name: 'Call answered', isVoiceCallBranch: true }, { id: 'tps-7-vc-rejected', name: 'Call rejected', isVoiceCallBranch: true }, { id: 'tps-7-vc-missed', name: 'Call missed', isVoiceCallBranch: true }, { id: 'tps-7-vc-voicemail', name: 'Voice mail', isVoiceCallBranch: true, isFallback: true }] } },
    ],
  },
  'tps-6-path-2': {
    branchName: 'Now scheduled',
    description: 'Treatment plan is already scheduled — sequence complete.',
    conditions: [{ id: 1, fieldValue: 'treatment_plan_scheduled', operatorValue: 'equals', valueValue: 'true' }],
    conditionOptions: {
      field:    [{ value: 'treatment_plan_scheduled', label: 'Treatment plan scheduled' }],
      operator: [...CONDITION_OPERATORS],
      value:    [{ value: 'true', label: 'True' }],
    },
    parentId: 'tps-6',
    isBranchPath: true,
    isFallback: true,
    nodes: [],
  },
  'tps-7': {
    taskName: 'Initiate voice call',
    description: 'Call the patient to schedule their unscheduled treatment plan.',
    toolId: 'voice-call',
    phoneNumber: 'Contact.PhoneNumber',
    callFrom: '',
    startingProcedure: 'Treatment plan coordinator',
    routeToFrontdesk: false,
    contextItems: [
      { id: '1', label: 'Patient name',        variable: 'Contact.FullName'          },
      { id: '2', label: 'Treatment plan ID',   variable: 'Contact.TreatmentPlanId'   },
      { id: '3', label: 'Procedure code',      variable: 'Contact.ProcedureCode'     },
      { id: '4', label: 'Treating provider',   variable: 'Contact.Provider'          },
      { id: '5', label: 'Office',              variable: 'Contact.Office'            },
    ],
    retrySettings: { noAnswer: true, callRejected: false, voiceMail: true },
    voicemailMessage: 'Hi {{Contact.FirstName}}, this is {{Practice.Name}} calling about your treatment plan. We noticed your appointment hasn\'t been scheduled yet. Please call us at {{Practice.PhoneNumber}} or use the link we sent to book at your convenience.',
    maxAttempts: 2,
    retryInterval: 24,
    retryIntervalUnit: 'Hours',
    branches: [
      { id: 'tps-7-vc-answered',  name: 'Call answered', isVoiceCallBranch: true, isFallback: false },
      { id: 'tps-7-vc-rejected',  name: 'Call rejected', isVoiceCallBranch: true, isFallback: false },
      { id: 'tps-7-vc-missed',    name: 'Call missed',   isVoiceCallBranch: true, isFallback: false },
      { id: 'tps-7-vc-voicemail', name: 'Voice mail',    isVoiceCallBranch: true, isFallback: true  },
    ],
  },
  'tps-7-vc-answered': {
    branchName: 'Call answered',
    isVoiceCallBranch: true,
    isFallback: false,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'answered' }],
    conditionOptions: VC_CONDITION_OPTIONS,
    parentId: 'tps-7',
    isBranchPath: true,
    nodes: [
      { id: 'tps-7-a1', flowType: 'task' as const, data: { title: 'Send text', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Send booking confirmation SMS.' } },
    ],
  },
  'tps-7-vc-rejected': {
    branchName: 'Call rejected',
    isVoiceCallBranch: true,
    isFallback: false,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'rejected' }],
    conditionOptions: VC_CONDITION_OPTIONS,
    parentId: 'tps-7',
    isBranchPath: true,
    nodes: [
      { id: 'tps-7-r1', flowType: 'delay' as const, data: { title: 'Delay for 1 day', subtype: 'Delay', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait before retrying.' } },
      { id: 'tps-7-r2', flowType: 'task'  as const, data: { title: 'Send text', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Follow-up SMS with scheduling link.' } },
    ],
  },
  'tps-7-vc-missed': {
    branchName: 'Call missed',
    isVoiceCallBranch: true,
    isFallback: false,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'missed' }],
    conditionOptions: VC_CONDITION_OPTIONS,
    parentId: 'tps-7',
    isBranchPath: true,
    nodes: [
      { id: 'tps-7-m1', flowType: 'delay' as const, data: { title: 'Delay for 1 day', subtype: 'Delay', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait before retrying.' } },
      { id: 'tps-7-m2', flowType: 'task'  as const, data: { title: 'Send text', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Follow-up SMS with scheduling link.' } },
    ],
  },
  'tps-7-vc-voicemail': {
    branchName: 'Voice mail',
    isVoiceCallBranch: true,
    isFallback: true,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'voicemail' }],
    conditionOptions: VC_CONDITION_OPTIONS,
    parentId: 'tps-7',
    isBranchPath: true,
    nodes: [
      { id: 'tps-7-v1', flowType: 'delay' as const, data: { title: 'Delay for 1 day', subtype: 'Delay', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait after voicemail.' } },
      { id: 'tps-7-v2', flowType: 'task'  as const, data: { title: 'Send text', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Follow-up SMS with scheduling link.' } },
    ],
  },
  'tps-7-a1': { taskName: 'Send text', description: 'Send booking confirmation SMS.', selectedTools: ['send-confirmation'] },
  'tps-7-r1': { name: 'Delay for 1 day', duration: '1', unit: 'days' },
  'tps-7-r2': { taskName: 'Send text', description: 'Follow-up SMS with scheduling link.', selectedTools: ['send-confirmation'] },
  'tps-7-m1': { name: 'Delay for 1 day', duration: '1', unit: 'days' },
  'tps-7-m2': { taskName: 'Send text', description: 'Follow-up SMS with scheduling link.', selectedTools: ['send-confirmation'] },
  'tps-7-v1': { name: 'Delay for 1 day', duration: '1', unit: 'days' },
  'tps-7-v2': { taskName: 'Send text', description: 'Follow-up SMS with scheduling link.', selectedTools: ['send-confirmation'] },
}

/* ─── Treatment plan agent — Event trigger based ─── */
const TPE_NODES = [
  { id: 'tpe-1', flowType: 'trigger' as const, data: { title: 'New treatment plan added (unscheduled)', subtype: 'Entity trigger', headerLabel: 'Trigger', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter trigger name', descriptionPlaceholder: 'Enter description' } },
  { id: 'tpe-2', flowType: 'delay'   as const, data: { title: 'Delay for 2 days', subtype: 'Delay', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait before first outreach.' } },
  { id: 'tpe-3', flowType: 'branch'  as const, data: { title: 'If still unscheduled', subtype: 'Branch', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter branch name', descriptionPlaceholder: 'Check if treatment plan is still unscheduled.', branches: [{ id: 'tpe-3-path-1', name: 'Still unscheduled' }, { id: 'tpe-3-path-2', name: 'Now scheduled', isFallback: true }] } },
]

const TPE_NODE_DETAILS: Record<string, unknown> = {
  '__start__': {
    agentName: 'Treatment plan agent — Event trigger based',
    goals: 'Convert unscheduled treatment plans into booked appointments by reaching out as soon as a new plan is created.',
    outcomes: 'Patients with unscheduled treatment plans receive timely, personalized outreach across email, text, and voice.',
    locations: ['All locations'],
  },
  'tpe-1': {
    triggerName: 'New treatment plan added (unscheduled)',
    description: 'Fires when a new plan satisfies filters: D-code = ABC & treating office = 124.',
    conditions: [
      { id: 1, fieldValue: 'dcode',          operatorValue: 'equals', valueValue: 'ABC' },
      { id: 2, fieldValue: 'treating_office', operatorValue: 'equals', valueValue: '124' },
    ],
    conditionOptions: {
      field: [
        { value: 'dcode',                 label: 'D-code'          },
        { value: 'treating_office',       label: 'Treating office' },
        { value: 'treatment_plan_status', label: 'Plan status'     },
        { value: 'plan_value',            label: 'Plan value'      },
      ],
      operator: [...CONDITION_OPERATORS],
      value: [
        { value: 'ABC', label: 'ABC' },
        { value: '124', label: '124' },
        { value: 'unscheduled', label: 'Unscheduled' },
        { value: 'diagnosed',   label: 'Diagnosed'   },
        { value: 'accepted',    label: 'Accepted'    },
      ],
    },
  },
  'tpe-2': { name: 'Delay for 2 days', duration: '2', unit: 'days' },
  'tpe-3': {
    basedOn: 'conditions',
    branches: [
      { id: 'tpe-3-path-1', name: 'Still unscheduled' },
      { id: 'tpe-3-path-2', name: 'Now scheduled', isFallback: true },
    ],
  },
  'tpe-3-path-1': {
    branchName: 'Still unscheduled',
    description: 'Treatment plan has not been scheduled — proceed with outreach.',
    conditions: [{ id: 1, fieldValue: 'treatment_plan_scheduled', operatorValue: 'equals', valueValue: 'false' }],
    field: [{ value: 'treatment_plan_scheduled', label: 'Treatment plan scheduled' }],
    parentId: 'tpe-3',
    isBranchPath: true,
    nodes: [
      { id: 'tpe-4', flowType: 'task'   as const, data: { title: 'Send email', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Personalized treatment plan with scheduling link.' } },
      { id: 'tpe-5', flowType: 'task'   as const, data: { title: 'Send text',  subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Short SMS with scheduling link.' } },
      { id: 'tpe-6', flowType: 'delay'  as const, data: { title: 'Delay for 2 days', subtype: 'Delay', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait before checking schedule status again.' } },
      { id: 'tpe-7', flowType: 'branch' as const, data: { title: 'If still unscheduled', subtype: 'Branch', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter branch name', descriptionPlaceholder: 'Second check — escalate to voice if still unscheduled.', branches: [{ id: 'tpe-7-path-1', name: 'Still unscheduled' }, { id: 'tpe-7-path-2', name: 'Now scheduled', isFallback: true }] } },
    ],
  },
  'tpe-3-path-2': {
    branchName: 'Now scheduled',
    description: 'Treatment plan is already scheduled — sequence complete.',
    conditions: [{ id: 1, fieldValue: 'treatment_plan_scheduled', operatorValue: 'equals', valueValue: 'true' }],
    field: [{ value: 'treatment_plan_scheduled', label: 'Treatment plan scheduled' }],
    parentId: 'tpe-3',
    isBranchPath: true,
    isFallback: true,
    nodes: [],
  },
  'tpe-4': { taskName: 'Send email', description: 'Personalized treatment plan with scheduling link.', selectedTools: ['send-confirmation'] },
  'tpe-5': { taskName: 'Send text',  description: 'Short SMS with scheduling link.',                  selectedTools: ['send-confirmation'] },
  'tpe-6': { name: 'Delay for 2 days', duration: '2', unit: 'days' },
  'tpe-7': {
    basedOn: 'conditions',
    branches: [
      { id: 'tpe-7-path-1', name: 'Still unscheduled' },
      { id: 'tpe-7-path-2', name: 'Now scheduled', isFallback: true },
    ],
  },
  'tpe-7-path-1': {
    branchName: 'Still unscheduled',
    description: 'Escalate to voice call.',
    conditions: [{ id: 1, fieldValue: 'treatment_plan_scheduled', operatorValue: 'equals', valueValue: 'false' }],
    field: [{ value: 'treatment_plan_scheduled', label: 'Treatment plan scheduled' }],
    parentId: 'tpe-7',
    isBranchPath: true,
    nodes: [
      { id: 'tpe-8', flowType: 'voiceCall' as const, data: { title: 'Initiate voice call', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter name', descriptionPlaceholder: 'Initial procedure: Treatment plan coordinator.', branches: [{ id: 'tpe-8-vc-answered', name: 'Call answered', isVoiceCallBranch: true }, { id: 'tpe-8-vc-rejected', name: 'Call rejected', isVoiceCallBranch: true }, { id: 'tpe-8-vc-missed', name: 'Call not answered', isVoiceCallBranch: true }, { id: 'tpe-8-vc-voicemail', name: 'Voice mail', isVoiceCallBranch: true, isFallback: true }] } },
    ],
  },
  'tpe-7-path-2': {
    branchName: 'Now scheduled',
    description: 'Treatment plan is already scheduled — sequence complete.',
    conditions: [{ id: 1, fieldValue: 'treatment_plan_scheduled', operatorValue: 'equals', valueValue: 'true' }],
    field: [{ value: 'treatment_plan_scheduled', label: 'Treatment plan scheduled' }],
    parentId: 'tpe-7',
    isBranchPath: true,
    isFallback: true,
    nodes: [],
  },
  'tpe-8': {
    taskName: 'Initiate voice call',
    description: 'Initial procedure: Treatment plan coordinator.',
    toolId: 'initiate-voice-call',
    selectedTools: ['initiate-voice-call'],
    startingProcedure: 'Treatment plan coordinator procedure',
    routeToFrontdesk: true,
    contextItems: [
      { id: '1', label: 'Patient ID',          variable: 'Contact.PatientId'       },
      { id: '2', label: 'Treatment plan ID',   variable: 'Contact.TreatmentPlanId' },
      { id: '3', label: 'Full name',           variable: 'Contact.FullName'        },
    ],
    retrySettings: { noAnswer: true, callRejected: false, voiceMail: true },
    voicemailMessage: 'Hi {{Contact.FirstName}}, this is {{Practice.Name}} calling about your treatment plan. Please call us back at {{Practice.PhoneNumber}} to schedule your appointment.',
    maxAttempts: '2',
    retryInterval: '24',
    retryIntervalUnit: 'Hours',
    branches: [
      { id: 'tpe-8-vc-answered',  name: 'Call answered',     isVoiceCallBranch: true, isFallback: false },
      { id: 'tpe-8-vc-rejected',  name: 'Call rejected',     isVoiceCallBranch: true, isFallback: false },
      { id: 'tpe-8-vc-missed',    name: 'Call not answered', isVoiceCallBranch: true, isFallback: false },
      { id: 'tpe-8-vc-voicemail', name: 'Voice mail',        isVoiceCallBranch: true, isFallback: true  },
    ],
  },
  'tpe-8-vc-answered': {
    branchName: 'Call answered', isVoiceCallBranch: true, isFallback: false,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'answered' }],
    conditionOptions: VC_CONDITION_OPTIONS, parentId: 'tpe-8', isBranchPath: true,
    nodes: [
      { id: 'tpe-8-a1', flowType: 'task' as const, data: { title: 'Send text', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Send booking confirmation SMS.' } },
    ],
  },
  'tpe-8-vc-rejected': {
    branchName: 'Call rejected', isVoiceCallBranch: true, isFallback: false,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'rejected' }],
    conditionOptions: VC_CONDITION_OPTIONS, parentId: 'tpe-8', isBranchPath: true,
    nodes: [
      { id: 'tpe-8-r1', flowType: 'delay' as const, data: { title: 'Delay for 1 day', subtype: 'Delay', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait before retrying.' } },
      { id: 'tpe-8-r2', flowType: 'task'  as const, data: { title: 'Send text', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Follow-up SMS with scheduling link.' } },
    ],
  },
  'tpe-8-vc-missed': {
    branchName: 'Call not answered', isVoiceCallBranch: true, isFallback: false,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'missed' }],
    conditionOptions: VC_CONDITION_OPTIONS, parentId: 'tpe-8', isBranchPath: true,
    nodes: [
      { id: 'tpe-8-m1', flowType: 'task' as const, data: { title: 'Send text', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Follow-up SMS with scheduling link.' } },
    ],
  },
  'tpe-8-vc-voicemail': {
    branchName: 'Voice mail', isVoiceCallBranch: true, isFallback: true,
    conditions: [{ id: 1, fieldValue: 'call_status', operatorValue: 'equals', valueValue: 'voicemail' }],
    conditionOptions: VC_CONDITION_OPTIONS, parentId: 'tpe-8', isBranchPath: true,
    nodes: [
      { id: 'tpe-8-v1', flowType: 'delay' as const, data: { title: 'Delay for 1 day', subtype: 'Delay', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Configure delay settings', descriptionPlaceholder: 'Wait after voicemail.' } },
      { id: 'tpe-8-v2', flowType: 'task'  as const, data: { title: 'Send text', subtype: 'Integration', hasToggle: true, toggleEnabled: true, hasAiIcon: false, titlePlaceholder: 'Enter task name', descriptionPlaceholder: 'Follow-up SMS with scheduling link.' } },
    ],
  },
  'tpe-8-a1': { taskName: 'Send text', description: 'Send booking confirmation SMS.',        selectedTools: ['send-confirmation'] },
  'tpe-8-r1': { name: 'Delay for 1 day', duration: '1', unit: 'days' },
  'tpe-8-r2': { taskName: 'Send text', description: 'Follow-up SMS with scheduling link.',   selectedTools: ['send-confirmation'] },
  'tpe-8-m1': { taskName: 'Send text', description: 'Follow-up SMS with scheduling link.',   selectedTools: ['send-confirmation'] },
  'tpe-8-v1': { name: 'Delay for 1 day', duration: '1', unit: 'days' },
  'tpe-8-v2': { taskName: 'Send text', description: 'Follow-up SMS with scheduling link.',   selectedTools: ['send-confirmation'] },
}

// Dental extends healthcare with three additional agent workflows
export const DENTAL_AGENT_WORKFLOWS: Record<string, AgentWorkflow> = {
  ...HEALTHCARE_AGENT_WORKFLOWS,
  'Recall agent':         { nodes: RECALL_NODES,         nodeDetails: RECALL_NODE_DETAILS         },
  'Revenue agent':        { nodes: REVENUE_NODES,         nodeDetails: REVENUE_NODE_DETAILS         },
  'Treatment plan agent': { nodes: TREATMENT_PLAN_NODES,  nodeDetails: TREATMENT_PLAN_NODE_DETAILS  },
  'Treatment plan agent — Schedule based':      { nodes: TPS_NODES, nodeDetails: TPS_NODE_DETAILS },
  'Treatment plan agent — Event trigger based': { nodes: TPE_NODES, nodeDetails: TPE_NODE_DETAILS },
}

// Default export kept for backward compat
export const AGENT_WORKFLOWS = AUTOMOTIVE_AGENT_WORKFLOWS

export function getAgentWorkflows(product?: string) {
  if (product === 'dental') return DENTAL_AGENT_WORKFLOWS
  if (product === 'healthcare') return HEALTHCARE_AGENT_WORKFLOWS
  return AUTOMOTIVE_AGENT_WORKFLOWS
}
