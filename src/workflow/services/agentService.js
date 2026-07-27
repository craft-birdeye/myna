/**
 * agentService — in-memory mock for Content Hub prototype.
 * No Firebase / Firestore. All operations work on an in-memory store
 * so the agent builder canvas is fully interactive without a backend.
 */
import chronoLogo from '../../assets/logo-chrono.svg';

/* ─── In-memory store ─── */
const _agents = new Map();

const _SEED_TOOLS = [
  // ── Automotive dealership tools ─────────────────────────────────────────
  {
    id: 'dms-integration',
    name: 'DMS Integration',
    icon: 'storage',
    description: 'Reads and writes appointment records, repair orders, vehicle data, and customer history in the Dealer Management System.',
    category: 'Dealership Systems',
    modules: ['Front desk'],
    products: ['automotive', 'dental'],
    inputs: [{ name: 'query', type: 'string', description: 'DMS query or record ID' }],
    outputs: [{ name: 'result', type: 'object', description: 'DMS record data' }],
  },
  {
    id: 'send-confirmation',
    name: 'Send confirmation',
    icon: 'send',
    description: 'Sends appointment confirmations, reminders, and follow-up messages via SMS and email to the customer.',
    category: 'Communication',
    modules: ['Front desk'],
    products: ['automotive', 'healthcare', 'dental'],
    entities: ['frontdesk'],
    inputs: [{ name: 'channel', type: 'string', description: 'sms | email | both' }, { name: 'message', type: 'string', description: 'Message body' }],
    outputs: [{ name: 'status', type: 'string', description: 'sent | failed' }],
  },
  {
    id: 'schedule-appointment',
    name: 'Schedule Appointment',
    icon: 'calendar_today',
    description: 'Checks availability and books, reschedules, or cancels service and sales appointments in the DMS.',
    category: 'Dealership Systems',
    modules: ['Front desk'],
    products: ['automotive'],
    inputs: [{ name: 'date', type: 'string' }, { name: 'time', type: 'string' }, { name: 'type', type: 'string' }],
    outputs: [{ name: 'appointmentId', type: 'string' }, { name: 'confirmed', type: 'boolean' }],
  },
  {
    id: 'transfer',
    name: 'Transfer',
    icon: 'call_made',
    description: 'Transfers the active call or chat to a human agent or department with an optional spoken summary.',
    category: 'Conversation',
    modules: ['Conversation'],
    products: ['automotive', 'healthcare', 'dental'],
    entities: ['conversation'],
    inputs: [{ name: 'phoneNumber', type: 'string', description: 'Destination phone number or variable' }],
    outputs: [{ name: 'status', type: 'string', description: 'transferred | failed' }],
  },
  {
    id: 'initiate-voice-call',
    name: 'Initiate voice call',
    icon: 'call',
    description: 'Places an outbound voice call to the customer and routes the outcome to Call completed, Call rejected, Call missed, or Voicemail.',
    category: 'Communication',
    modules: ['Conversation'],
    products: ['automotive'],
    fields: [
      {
        id: 'initiate-voice-call-phone',
        label: 'Phone number',
        type: 'variable',
        defaultValue: 'Contact.PhoneNumber',
      },
      {
        id: 'initiate-voice-call-from-number',
        label: 'Call from',
        type: 'select',
        placeholder: 'Select',
        showInfoIcon: true,
        options: [
          'Main dealership line',
          'Service department',
          'Sales department',
          'Parts department',
        ],
      },
      {
        id: 'initiate-voice-call-calling-window',
        label: 'Calling window',
        type: 'radio',
        defaultValue: 'Custom range',
        options: ['During business hours', 'Custom range'],
        showWhenValue: 'Custom range',
        conditionalLayout: 'row',
        conditionalFields: [
          {
            id: 'initiate-voice-call-from',
            label: 'From',
            type: 'select',
            placeholder: 'Select',
            defaultValue: '9:00 AM',
            options: ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'],
          },
          {
            id: 'initiate-voice-call-to',
            label: 'To',
            type: 'select',
            placeholder: 'Select',
            defaultValue: '10:00 PM',
            options: ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'],
          },
        ],
      },
      {
        id: 'initiate-voice-call-retry',
        label: 'Retry settings',
        type: 'checkbox',
        layout: 'row',
        helpText: 'Enable automatic retry if customer does not connect on the first attempt',
        options: ['No answer', 'Call rejected', 'Voice mail'],
        defaultValue: ['No answer', 'Voice mail'],
        conditionalFields: [
          {
            id: 'initiate-voice-call-max-attempts',
            label: 'Max attempts',
            type: 'select',
            defaultValue: '2',
            options: ['1', '2', '3', '4', '5'],
          },
          {
            id: 'initiate-voice-call-retry-interval',
            label: 'Interval between retries',
            type: 'selectRow',
            selects: [
              {
                defaultValue: '24',
                options: ['1', '2', '4', '6', '12', '24', '48'],
              },
              {
                defaultValue: 'Hours',
                options: ['Minutes', 'Hours', 'Days'],
              },
            ],
          },
          {
            id: 'initiate-voice-call-voicemail',
            label: 'Configure voice mail message',
            type: 'textarea',
            placeholder: 'Enter your message here',
            showVariableToolbar: true,
            rows: 5,
            showWhenIncludes: 'Voice mail',
          },
        ],
      },
    ],
    inputs: [{ name: 'phoneNumber', type: 'string' }],
    outputs: [{ name: 'outcome', type: 'string', description: 'accepted | rejected | missed' }],
  },
  {
    id: 'crm-update',
    name: 'CRM Update',
    icon: 'sync_alt',
    description: 'Creates and updates lead records, contact notes, tags, and journey status in the CRM system.',
    category: 'Dealership Systems',
    modules: ['Front desk'],
    products: ['automotive'],
    inputs: [{ name: 'recordId', type: 'string' }, { name: 'fields', type: 'object' }],
    outputs: [{ name: 'success', type: 'boolean' }],
  },
  {
    id: 'inventory-search',
    name: 'Inventory Search',
    icon: 'inventory_2',
    description: 'Searches real-time vehicle inventory for new, used, and CPO vehicles matching customer preferences.',
    category: 'Dealership Systems',
    modules: ['Front desk'],
    products: ['automotive'],
    entities: ['frontdesk'],
    inputs: [{ name: 'filters', type: 'object', description: 'make, model, year, price, mileage' }],
    outputs: [{ name: 'vehicles', type: 'array', description: 'Matching inventory items' }],
  },
  {
    id: 'lead-routing',
    name: 'Lead Routing',
    icon: 'route',
    description: 'Assigns and routes leads to the appropriate sales consultant based on availability, specialty, and round-robin rules.',
    category: 'Sales',
    modules: ['Front desk'],
    products: ['automotive'],
    inputs: [{ name: 'leadId', type: 'string' }, { name: 'department', type: 'string' }],
    outputs: [{ name: 'assignedTo', type: 'string' }],
  },
  {
    id: 'trigger-escalation',
    name: 'Trigger escalation',
    icon: 'priority_high',
    description: 'Immediately transfers the conversation to a live human agent with full context and priority queue placement.',
    category: 'Escalation',
    modules: ['Front desk'],
    products: ['automotive', 'healthcare', 'dental'],
    entities: ['frontdesk'],
    inputs: [{ name: 'reason', type: 'string' }, { name: 'priority', type: 'string', description: 'normal | high | urgent' }],
    outputs: [{ name: 'transferredTo', type: 'string' }],
  },
  {
    id: 'intent-classifier',
    name: 'Intent Classifier',
    icon: 'psychology',
    description: 'Detects the caller\'s department intent and purpose using NLP — routes to service, sales, parts, or general.',
    category: 'AI',
    modules: ['Front desk'],
    products: ['automotive'],
    inputs: [{ name: 'transcript', type: 'string' }],
    outputs: [{ name: 'intent', type: 'string' }, { name: 'confidence', type: 'number' }],
  },
  {
    id: 'vin-decode',
    name: 'VIN Decode',
    icon: 'qr_code',
    description: 'Decodes a VIN to retrieve year, make, model, trim, and service history for the vehicle.',
    category: 'Dealership Systems',
    modules: ['Front desk'],
    products: ['automotive'],
    inputs: [{ name: 'vin', type: 'string' }],
    outputs: [{ name: 'vehicle', type: 'object' }],
  },
  {
    id: 'check-business-hours',
    name: 'Check Business Hours',
    icon: 'schedule',
    description: 'Looks up department-specific business hours to determine availability for transfers and scheduling.',
    category: 'Operations',
    modules: ['Front desk'],
    products: ['automotive'],
    inputs: [{ name: 'department', type: 'string' }],
    outputs: [{ name: 'isOpen', type: 'boolean' }, { name: 'nextOpen', type: 'string' }],
  },
  {
    id: 'nhtsa-recall-lookup',
    name: 'NHTSA Recall Lookup',
    icon: 'find_in_page',
    description: 'Queries the NHTSA database for open recalls by VIN or year/make/model.',
    category: 'Compliance',
    modules: ['Front desk'],
    products: ['automotive'],
    inputs: [{ name: 'vin', type: 'string' }],
    outputs: [{ name: 'recalls', type: 'array' }],
  },
  {
    id: 'get-unscheduled-treatment-plans',
    name: 'Get all unscheduled treatment plans',
    icon: 'filter_alt',
    description: 'Queries the DMS for all treatment plans that have been presented but not yet scheduled, with configurable filters for status, D-code, treating office, and schedule state.',
    category: 'Dental',
    inputs: [
      { name: 'status',         type: 'array',  label: 'Status'          },
      { name: 'dcode',          type: 'string', label: 'D-code'          },
      { name: 'treatingOffice', type: 'string', label: 'Treating office' },
      { name: 'scheduled',      type: 'string', label: 'Scheduled'       },
    ],
    outputs: [{ name: 'plans', type: 'array' }],
  },
  {
    id: 'reminder-tool',
    name: 'Reminder tool',
    icon: 'notifications',
    description: 'Sends automated multi-channel appointment reminders at configurable intervals before the appointment.',
    category: 'Healthcare',
    modules: ['Front desk'],
    products: ['healthcare', 'dental'],
    entities: ['frontdesk'],
    inputs: [{ name: 'appointmentId', type: 'string' }],
    outputs: [{ name: 'sent', type: 'boolean' }],
  },
  {
    id: 'send-communication',
    name: 'Send communication',
    icon: 'campaign',
    isBirdeye: true,
    description: 'Send a multi-channel communication (email, SMS, or both) to a patient at a configured time before their appointment.',
    category: 'Communication',
    modules: ['Front desk'],
    products: ['healthcare', 'dental'],
    entities: ['frontdesk'],
    fields: [
      {
        id: 'sc-channel',
        label: 'Channel to send',
        type: 'select',
        defaultValue: 'Best channel',
        options: ['Best channel', 'Email only', 'Text only', 'Email and text'],
      },
      {
        id: 'sc-emails',
        type: 'section',
        label: 'Emails',
        defaultOpen: true,
        sectionFields: [
          {
            id: 'sc-ab-email',
            type: 'abSection',
            checkboxLabel: 'Run A/B Test for emails',
            defaultChecked: false,
            alwaysFields: [
              { id: 'sc-email-template', type: 'templateSelect', label: 'Email template', placeholder: 'Select' },
            ],
            cardFields: [
              { id: 'sc-email-distribution', type: 'distribution', label: 'Distribution', variants: [{ id: 'a', name: 'Variant A', sublabel: 'Template 1', defaultValue: 50 }, { id: 'b', name: 'Variant B', sublabel: 'Template 2', defaultValue: 50 }] },
              { id: 'sc-email-test-ends', type: 'dateSelect', label: 'Test ends', prefix: 'After', options: ['1 day', '2 days', '3 days', '5 days', '7 days', '14 days', '30 days'], defaultValue: '7 days' },
              { id: 'sc-email-winning', type: 'radio', label: 'Winning metric', options: ['Open rate', 'Click rate', 'Conversion rate'], defaultValue: 'Open rate' },
            ],
          },
        ],
      },
      {
        id: 'sc-text',
        type: 'section',
        label: 'Text',
        defaultOpen: true,
        sectionFields: [
          {
            id: 'sc-ab-text',
            type: 'abSection',
            checkboxLabel: 'Run A/B Test for text',
            defaultChecked: false,
            alwaysFields: [
              { id: 'sc-text-template', type: 'templateSelect', label: 'Text template', placeholder: 'Select' },
            ],
            cardFields: [
              { id: 'sc-text-distribution', type: 'distribution', label: 'Distribution', variants: [{ id: 'a', name: 'Variant A', sublabel: 'Template 1', defaultValue: 50 }, { id: 'b', name: 'Variant B', sublabel: 'Template 2', defaultValue: 50 }] },
              { id: 'sc-text-test-ends', type: 'dateSelect', label: 'Test ends', prefix: 'After', options: ['1 day', '2 days', '3 days', '5 days', '7 days', '14 days', '30 days'], defaultValue: '7 days' },
              { id: 'sc-text-winning', type: 'radio', label: 'Winning metric', options: ['Open rate', 'Click rate', 'Conversion rate'], defaultValue: 'Open rate' },
            ],
          },
        ],
      },
      { id: 'sc-override', type: 'checkbox', hideLabel: true, options: ['Override communication restrictions'], defaultValue: [] },
      { id: 'sc-ai', type: 'checkbox', label: 'AI consideration', showInfoIcon: true, options: ['Best day to send', 'Best time to send'], defaultValue: [] },
    ],
    inputs: [{ name: 'channel', type: 'string', description: 'email | sms | both' }, { name: 'timing', type: 'string', description: 'Days before appointment' }],
    outputs: [{ name: 'status', type: 'string', description: 'sent | failed' }],
  },
  {
    id: 'assign-contact-status',
    name: 'Assign contact status',
    icon: 'how_to_reg',
    isBirdeye: true,
    description: 'Analyzes the incoming message and updates the conversation contact status (e.g. Scheduling, Callback requested, Rescheduling).',
    category: 'Communication',
    modules: ['Inbox'],
    products: ['healthcare', 'dental'],
    entities: ['conversation'],
    inputs: [{ name: 'message', type: 'string' }],
    outputs: [{ name: 'contactStatus', type: 'string' }],
  },
  {
    id: 'assign-conversation',
    name: 'Assign conversation',
    icon: 'assignment_ind',
    isBirdeye: true,
    description: 'Analyzes the incoming messages and assigns the conversation to a team or agent.',
    category: 'Communication',
    modules: ['Inbox'],
    products: ['healthcare', 'dental'],
    entities: ['conversation'],
    inputs: [{ name: 'message', type: 'string' }],
    outputs: [{ name: 'assignedTo', type: 'string' }],
  },
  {
    id: 'assign-conversation-status',
    name: 'Assign conversation status',
    icon: 'label',
    isBirdeye: true,
    description: 'Marks the conversation with a status so the right team knows it needs follow-up.',
    category: 'Communication',
    modules: ['Inbox'],
    products: ['healthcare', 'dental'],
    entities: ['conversation'],
    inputs: [{ name: 'message', type: 'string' }],
    outputs: [{ name: 'conversationStatus', type: 'string' }],
  },
  {
    id: 'initiate-voice-call-hc',
    name: 'Initiate voice call',
    icon: 'call',
    description: 'Places an outbound voice call to the patient and routes the outcome to Call completed, Call rejected, or Call missed.',
    category: 'Communication',
    modules: ['Conversation'],
    products: ['healthcare', 'dental'],
    entities: ['conversation'],
    fields: [
      { id: 'ivc-hc-phone', label: 'Phone number', type: 'variable', defaultValue: 'Contact.PhoneNumber' },
      { id: 'ivc-hc-call-from', label: 'Call from', type: 'select', placeholder: 'Select a caller ID', showInfoIcon: true, options: ['Main clinic line', 'Scheduling department', 'Provider direct line', 'Billing department'] },
      { id: 'ivc-hc-procedure', label: 'Starting procedure', type: 'select', showInfoIcon: true, defaultValue: 'Slot confirmation', options: ['Slot confirmation', 'Form not filled'] },
      { id: 'ivc-hc-route', label: 'Route to front desk agent', type: 'toggle', showInfoIcon: true, defaultValue: true, helpText: 'Anything outside the selected procedures is handed off to the Front desk agent of respective locations' },
      { id: 'ivc-hc-context', label: 'Context', type: 'tags', showInfoIcon: true, placeholder: 'Add context variable...', defaultValue: ['Appointment ID', 'Patient ID', 'Provider ID', 'Diagnosis Code', 'Appointment_Type'] },
      { id: 'ivc-hc-retry-header', label: 'Retry settings', type: 'sectionLabel', helpText: "Automatically retry if the customer doesn't connect on the first attempt." },
      { id: 'ivc-hc-retry', type: 'checkbox', hideLabel: true, layout: 'row', options: ['No answer', 'Call rejected', 'Voice mail'], defaultValue: ['No answer', 'Voice mail'], conditionalFields: [{ id: 'ivc-hc-voicemail-msg', showWhenIncludes: 'Voice mail', type: 'textarea', label: 'Leave a message if the call goes to voicemail.', showVariableToolbar: true, placeholder: 'Enter your message here', rows: 3 }] },
      { id: 'ivc-hc-attempts-header', label: 'Retry attempts', type: 'sectionLabel' },
      { id: 'ivc-hc-max-attempts', label: 'Max attempts', type: 'select', defaultValue: '2', options: ['1', '2', '3', '4', '5'], width: 'half' },
      { id: 'ivc-hc-interval', label: 'Interval between retries', type: 'selectRow', selects: [{ options: ['6', '12', '24', '48'], defaultValue: '24' }, { options: ['Hours', 'Days'], defaultValue: 'Hours' }] },
    ],
    inputs: [{ name: 'phoneNumber', type: 'string' }],
    outputs: [{ name: 'outcome', type: 'string', description: 'completed | rejected | missed' }],
  },
  {
    id: 'send-text-hc',
    name: 'Send text',
    icon: 'sms',
    isBirdeye: true,
    modules: ['Front desk'],
    products: ['healthcare', 'dental'],
    entities: ['frontdesk'],
    description: 'Send a text message to the customer with a predefined message, personalized content, or automated updates.',
    category: 'Communication',
    fields: [
      {
        id: 'st-hc-ab-text',
        type: 'abSection',
        checkboxLabel: 'Run A/B Test for text',
        defaultChecked: false,
        alwaysFields: [
          { id: 'st-hc-text-template', type: 'templateSelect', label: 'Text template', placeholder: 'Select' },
        ],
        cardFields: [
          { id: 'st-hc-distribution', type: 'distribution', label: 'Distribution', required: true, variants: [{ id: 'a', name: 'Variant A', sublabel: 'Text A', defaultValue: 50 }, { id: 'b', name: 'Variant B', sublabel: 'Text B', defaultValue: 50 }] },
          { id: 'st-hc-test-ends', type: 'dateSelect', label: 'Test ends', prefix: 'On', options: ['1 day', '2 days', '3 days', '5 days', '7 days', '14 days', '30 days'], defaultValue: '7 days' },
          { id: 'st-hc-winning', type: 'radio', label: 'Winning metric', options: ['Open rate', 'Click rate', 'Review written'], defaultValue: 'Open rate' },
        ],
      },
      { id: 'st-hc-ai', type: 'checkbox', label: 'AI consideration', showInfoIcon: true, options: ['Best day to send', 'Best time to send'], defaultValue: [] },
      { id: 'st-hc-override', type: 'checkbox', hideLabel: true, options: ['Override communication restrictions'], defaultValue: ['Override communication restrictions'] },
    ],
    inputs: [{ name: 'patientId', type: 'string' }, { name: 'message', type: 'string' }],
    outputs: [{ name: 'status', type: 'string' }],
  },
  {
    id: 'fetch-waitlist-hc',
    name: 'Fetch waitlist',
    iconDataUrl: chronoLogo,
    description: 'Retrieves patients currently on the waitlist, including relevant details such as requested service, preferred time, and current status.',
    category: 'Healthcare',
    // Already offered under External tools (EHR_TOOLS in AddToolDrawer) — keep the
    // metadata here only so already-selected tool chips (e.g. Waitlist agent nodes)
    // still resolve; hide it from the Internal tools picker so it isn't duplicated.
    hideFromInternalPicker: true,
    modules: ['Front desk'],
    products: ['healthcare', 'dental'],
    entities: ['frontdesk'],
    fields: [
      { id: 'fwl-batch',      type: 'number',   label: 'Waitlist outbound batch', placeholder: 'No. of patients' },
      { id: 'fwl-provider',   type: 'radio',    label: 'If no preferred provider, offer slots of', options: ['Last seen / scheduled provider', 'Any provider (matching appointment type)'], defaultValue: 'Last seen / scheduled provider' },
      { id: 'fwl-ai',         type: 'checkbox', label: 'AI consideration',    showInfoIcon: true, options: ['Best day to send', 'Best time to send'], defaultValue: [] },
      { id: 'fwl-additional', type: 'checkbox', label: 'Additional config',   showInfoIcon: true, options: ['Do not carry over unfilled slots to the next working day.'], defaultValue: [] },
    ],
    inputs: [],
    outputs: [{ name: 'waitlist', type: 'array' }],
  },
  // ── Conversation tools (ported from agent-builder) ──────────────────────
  {
    id: 'in-call-sms',
    name: 'In-call SMS',
    icon: 'sms',
    description: 'Sends a text message to the caller during an active call, from the agent number or a configured number.',
    category: 'Communication',
    modules: ['Conversation'],
    products: ['healthcare'],
    entities: ['conversation'],
    fields: [
      {
        id: 'ics-send-from',
        label: 'Send from',
        type: 'radio',
        showInfoIcon: true,
        defaultValue: "Agent's associated number",
        options: [
          "Agent's associated number",
          { value: 'Different number', label: 'Different number', disabled: true },
        ],
      },
      {
        id: 'ics-message-mode',
        label: 'Configure message',
        type: 'radio',
        layout: 'row',
        defaultValue: 'Literal',
        options: [
          { value: 'Literal', label: 'Literal', infoIcon: true },
          { value: 'Prompt', label: 'Prompt', infoIcon: true },
        ],
        conditionalFieldsMap: {
          Literal: [
            {
              id: 'ics-literal-message',
              label: 'Enter literal message',
              type: 'textarea',
              required: true,
              showInfoIcon: true,
              showVariableToolbar: true,
              rows: 4,
            },
          ],
          Prompt: [
            {
              id: 'ics-prompt-message',
              label: 'Enter prompt',
              type: 'textarea',
              required: true,
              showInfoIcon: true,
              showVariableToolbar: true,
              rows: 4,
            },
          ],
        },
      },
      {
        id: 'ics-send-to',
        label: 'Send to',
        type: 'radio',
        showInfoIcon: true,
        defaultValue: "Caller's number",
        options: ["Caller's number", 'Different number'],
        showWhenValue: 'Different number',
        conditionalFields: [
          {
            id: 'ics-send-to-phone',
            label: 'Phone number',
            type: 'text',
            icon: 'call',
            placeholder: 'Enter input',
          },
        ],
      },
    ],
    inputs: [{ name: 'sendFrom', type: 'string' }, { name: 'message', type: 'string' }, { name: 'sendTo', type: 'string' }],
    outputs: [{ name: 'status', type: 'string', description: 'sent | failed' }],
  },
  {
    id: 'send-response',
    name: 'Send response',
    icon: 'reply',
    description: 'Sends a reply to the customer in the active conversation, on whichever channel — voice, web chat, or text — the conversation is currently on.',
    category: 'Communication',
    modules: ['Conversation'],
    products: ['healthcare'],
    entities: ['conversation'],
    inputs: [{ name: 'messageMode', type: 'string' }, { name: 'message', type: 'string' }],
    outputs: [{ name: 'status', type: 'string', description: 'sent | failed' }],
  },
  {
    id: 'auto-follow-up',
    name: 'Auto follow-up',
    icon: 'replay',
    description: 'Sends automated follow-up messages or calls to visitors via text, email, or phone after inactivity, with configurable timing and business-hours-aware messaging.',
    category: 'Communication',
    modules: ['Front desk'],
    products: ['automotive', 'healthcare', 'dental'],
    hasDrawer: true,
    inputs: [],
    outputs: [],
  },
  {
    id: 'escalation-notifier',
    name: 'Escalation notifier',
    icon: 'priority_high',
    description: 'Handles human escalation across voice, chat, text, and email — transfers calls, sends notifications to business users, and plays configurable messages during and outside business hours.',
    category: 'Communication',
    modules: ['Front desk'],
    products: ['automotive', 'healthcare', 'dental'],
    hasDrawer: true,
    inputs: [],
    outputs: [],
  },
  {
    id: 'lead-capture',
    name: 'Lead capture',
    icon: 'contact_page',
    description: 'Collects visitor contact details (name, phone, email) across voice, chat, and text channels with configurable mandatory fields and preview.',
    category: 'Sales',
    modules: ['Front desk'],
    products: ['automotive', 'healthcare', 'dental'],
    hasDrawer: true,
    inputs: [],
    outputs: [{ name: 'lead', type: 'object' }],
  },
  {
    id: 'lead-qualification',
    name: 'Lead qualification',
    icon: 'checklist',
    description: 'Runs a configurable qualification questionnaire to score and categorize incoming leads by intent, budget, and timeline.',
    category: 'Sales',
    modules: ['Front desk'],
    products: ['automotive', 'healthcare', 'dental'],
    hasDrawer: true,
    inputs: [],
    outputs: [{ name: 'qualificationScore', type: 'number' }, { name: 'qualified', type: 'boolean' }],
  },
  {
    id: 'voicemail-detection',
    name: 'Voicemail detection',
    icon: 'voicemail',
    description: 'Detects when an outbound call reaches voicemail and leaves a configurable message or hangs up based on settings.',
    category: 'Communication',
    modules: ['Front desk'],
    products: ['automotive', 'healthcare', 'dental'],
    hasDrawer: true,
    inputs: [],
    outputs: [{ name: 'leftVoicemail', type: 'boolean' }],
  },
];

const _customTools = new Map(_SEED_TOOLS.map(t => [t.id, t]));
const _agentListeners = new Set();
const _toolListeners = new Set();

function _notifyAgentListeners() {
  const list = Array.from(_agents.values());
  _agentListeners.forEach((cb) => cb(list));
}

function _notifyToolListeners() {
  const list = Array.from(_customTools.values());
  _toolListeners.forEach((cb) => cb(list));
}

/* ─── Agent operations ─── */

export function subscribeToAgents(callback) {
  _agentListeners.add(callback);
  callback(Array.from(_agents.values()));
  return () => _agentListeners.delete(callback);
}

export async function saveAgent(id, agent) {
  _agents.set(id, { ...agent, id });
  _notifyAgentListeners();
}

export async function deleteAgent(id) {
  _agents.delete(id);
  _notifyAgentListeners();
}

export async function getAgentBySlug(_moduleSlug, _agentSlug) {
  return null;
}

export function getCachedAgent(_agentSlug, _moduleSlug) {
  return null;
}

export async function prefetchAgent() {}

export async function getAgentsByModuleSlug(_moduleSlug) {
  return Array.from(_agents.values());
}

/* ─── Custom tool operations ─── */

export async function saveCustomTool(tool) {
  _customTools.set(tool.id, tool);
  _notifyToolListeners();
  return tool;
}

export async function deleteCustomTool(id) {
  _customTools.delete(id);
  _notifyToolListeners();
}

export function subscribeToCustomTools(callback) {
  _toolListeners.add(callback);
  callback(Array.from(_customTools.values()));
  return () => _toolListeners.delete(callback);
}

export async function getCustomTools() {
  return Array.from(_customTools.values());
}

export function getSeedTools() {
  return _SEED_TOOLS;
}

function _formatInputLabel(name, explicitLabel) {
  if (explicitLabel) return explicitLabel;
  const spaced = name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

// Transform agentService tool → CustomToolViewer field format
function _toolToViewerFields(tool) {
  if (tool.fields) return tool; // already in viewer format
  const fields = (tool.inputs || []).map((inp, i) => {
    const label = _formatInputLabel(inp.name, inp.label);
    const id = `${tool.id}-in-${i}`;

    // Boolean → toggle
    if (inp.type === 'boolean') {
      return { id, label, type: 'toggle', required: false };
    }

    // Enum (pipe-separated options in description or options array) → select
    const isEnum = (inp.description && inp.description.includes(' | ')) || Array.isArray(inp.options);
    if (isEnum || inp.type === 'enum') {
      const raw = Array.isArray(inp.options)
        ? inp.options
        : (inp.description || '').split(' | ').map((o) => o.trim()).filter(Boolean);
      return {
        id, label, type: 'select', required: false,
        options: raw.map((o) => ({ label: o, value: o })),
      };
    }

    // Object or array → variable chip (maps a workflow variable)
    if (inp.type === 'object' || inp.type === 'array') {
      return { id, label, type: 'variable', required: false, placeholder: inp.description || 'Map a workflow variable' };
    }

    // Number → number field
    if (inp.type === 'number') {
      return { id, label, type: 'number', required: false, placeholder: inp.description || '' };
    }

    // Default string → variable chip (most tool inputs map from workflow variables)
    return { id, label, type: 'variable', required: false, placeholder: inp.description || 'Map a workflow variable' };
  });
  return { ...tool, fields };
}

export async function getCustomToolsByIds(ids) {
  return (ids || []).map((id) => _customTools.get(id)).filter(Boolean).map(_toolToViewerFields);
}
