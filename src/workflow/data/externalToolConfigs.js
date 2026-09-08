/**
 * External-integration tool configs for EntityTaskBody "Tool details".
 * Account → action → dynamic fields (prototype mock data).
 */

export const EXTERNAL_TOOL_BY_TASK_NAME = {
  FreshDesk: 'freshdesk',
  Freshdesk: 'freshdesk',
};

const FRESHDESK_CREATE_TICKET_FIELDS = [
  {
    id: 'subject',
    type: 'text',
    label: 'Subject',
    required: true,
    helpText: 'The subject/title of the new ticket being created. The default Value is null',
    placeholder: 'Enter Subject',
    showVariableToolbar: true,
  },
  {
    id: 'priority',
    type: 'select',
    label: 'Priority',
    required: true,
    showInfoIcon: true,
    infoText: 'Options: Low, Medium, High, Urgent. Defaults to Low if not specified',
    placeholder: 'Select',
    options: ['Low', 'Medium', 'High', 'Urgent'],
  },
  {
    id: 'status',
    type: 'select',
    label: 'Status',
    required: true,
    showInfoIcon: true,
    infoText: 'Options: Open, Pending, Resolved, Closed. Defaults to Open if not specified',
    placeholder: 'Select',
    options: ['Open', 'Pending', 'Resolved', 'Closed'],
  },
  {
    id: 'description',
    type: 'text',
    label: 'Description',
    required: true,
    helpText: 'The initial description explaining the ticket issue or request',
    placeholder: 'Enter Description',
    showVariableToolbar: true,
  },
  {
    id: 'comment',
    type: 'text',
    label: 'Comment',
    required: false,
    helpText: 'The initial comment/reply to be added to the ticket',
    placeholder: 'Enter Comment',
    showVariableToolbar: true,
  },
  {
    id: 'email',
    type: 'text',
    label: 'Email',
    required: true,
    helpText: 'Email address of the requester',
    showInfoIcon: true,
    infoText:
      'If no contact exists with this email address in Freshdesk, it will be added as a new contact.',
    placeholder: 'Enter Email',
    showVariableToolbar: true,
  },
  {
    id: 'phone',
    type: 'text',
    label: 'Phone',
    required: false,
    helpText: 'Phone number of the requester',
    showInfoIcon: true,
    infoText:
      'If no contact exists with this phone number in Freshdesk, it will be added as a new contact. If the phone number is set and the email address is not, then the name attribute is mandatory',
    placeholder: 'Enter Phone',
    showVariableToolbar: true,
  },
];
export const EXTERNAL_TOOL_CONFIGS = {
  freshdesk: {
    id: 'freshdesk',
    name: 'FreshDesk',
    brandName: 'Freshdesk',
    icon: 'headset_mic',
    iconBg: '#25c16f',
    accounts: [
      {
        id: 'fd-1',
        label: 'Account - divanshu.singh@birdeye.com (167634889330972)',
        email: 'divanshu.singh@birdeye.com',
        status: 'connected',
      },
      {
        id: 'fd-2',
        label: 'Account - support@birdeye.com (167634889330100)',
        email: 'support@birdeye.com',
        status: 'connected',
      },
      {
        id: 'fd-3',
        label: 'Account - ops@birdeye.com (167634889330200)',
        email: 'ops@birdeye.com',
        status: 'expired',
      },
    ],
    actions: [
      {
        id: 'create-ticket',
        name: 'Freshdesk create ticket',
        description: 'Activate this trigger to automatically create tickets from Birdeye in Freshdesk.',
        fields: FRESHDESK_CREATE_TICKET_FIELDS,
      },
      {
        id: 'get-tickets',
        name: 'Freshdesk get tickets trigger',
        description: 'Activate this trigger to automatically sync ticket details from Freshdesk to Birdeye.',
        fields: [
          {
            id: 'ticket-id',
            type: 'text',
            label: 'Ticket ID',
            required: true,
            helpText: 'Freshdesk ticket identifier to sync',
            placeholder: 'Enter Ticket ID',
            showVariableToolbar: true,
          },
        ],
      },
      {
        id: 'update-ticket',
        name: 'Freshdesk update ticket',
        description: 'Activate this trigger to automatically update tickets from Birdeye in Freshdesk.',
        fields: [
          {
            id: 'ticket-id',
            type: 'text',
            label: 'Ticket ID',
            required: true,
            helpText: 'Freshdesk ticket to update',
            placeholder: 'Enter Ticket ID',
            showVariableToolbar: true,
          },
          {
            id: 'status',
            type: 'select',
            label: 'Status',
            required: true,
            showInfoIcon: true,
            infoText: 'Options: Open, Pending, Resolved, Closed',
            placeholder: 'Select',
            options: ['Open', 'Pending', 'Resolved', 'Closed'],
          },
          {
            id: 'priority',
            type: 'select',
            label: 'Priority',
            required: false,
            showInfoIcon: true,
            infoText: 'Options: Low, Medium, High, Urgent',
            placeholder: 'Select',
            options: ['Low', 'Medium', 'High', 'Urgent'],
          },
        ],
      },
      {
        id: 'add-reply',
        name: 'Freshdesk add reply to ticket trigger',
        description: 'Activate this trigger to automatically add a reply to tickets from Birdeye in Freshdesk.',
        fields: [
          {
            id: 'ticket-id',
            type: 'text',
            label: 'Ticket ID',
            required: true,
            helpText: 'Ticket to reply to',
            placeholder: 'Enter Ticket ID',
            showVariableToolbar: true,
          },
          {
            id: 'reply-body',
            type: 'text',
            label: 'Reply',
            required: true,
            helpText: 'Reply body posted to the ticket',
            placeholder: 'Enter Reply',
            showVariableToolbar: true,
          },
        ],
      },
      {
        id: 'add-note',
        name: 'Freshdesk add note to ticket trigger',
        description: 'Activate this trigger to automatically add a note to tickets from Birdeye in Freshdesk.',
        fields: [
          {
            id: 'ticket-id',
            type: 'text',
            label: 'Ticket ID',
            required: true,
            helpText: 'Ticket to add a note to',
            placeholder: 'Enter Ticket ID',
            showVariableToolbar: true,
          },
          {
            id: 'note-body',
            type: 'text',
            label: 'Note',
            required: true,
            helpText: 'Private note body',
            placeholder: 'Enter Note',
            showVariableToolbar: true,
          },
        ],
      },
    ],
  },
};

export function resolveExternalToolId({ selectedTools = [], taskName = '' } = {}) {
  for (const id of selectedTools) {
    if (EXTERNAL_TOOL_CONFIGS[id]) return id;
  }
  const fromName = EXTERNAL_TOOL_BY_TASK_NAME[taskName];
  if (fromName && EXTERNAL_TOOL_CONFIGS[fromName]) return fromName;
  return null;
}

export function getExternalToolConfig(toolId) {
  return toolId ? EXTERNAL_TOOL_CONFIGS[toolId] || null : null;
}
