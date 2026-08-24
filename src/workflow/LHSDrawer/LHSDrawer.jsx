import React, { useState, useRef, useEffect } from 'react';
import { FormInput, Tooltip } from '../elemental-stubs';
import NodeType from '../Organisms/Accordion/NodeType/NodeType';
import AIChatBubble from '../Molecules/AIChatBubble/AIChatBubble';
import { PromptComposer } from '../../components';
import { setFlowDragData } from '../flowDragData';
import {
  appendCreateAiDraftTurn,
  getCreateAiDraftSession,
} from '../../data/createAgentChatStore';

// Uploaded procedure.svg icon — used for all procedure category cards
const ProcedureSvgIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M19.7996 6.30078H14.3996C13.9339 6.30078 13.4745 6.40922 13.058 6.6175C12.6414 6.82578 12.279 7.12819 11.9996 7.50078C11.7202 7.12819 11.3578 6.82578 10.9412 6.6175C10.5247 6.40922 10.0653 6.30078 9.59961 6.30078H4.19961C4.04048 6.30078 3.88787 6.364 3.77535 6.47652C3.66282 6.58904 3.59961 6.74165 3.59961 6.90078V17.7008C3.59961 17.8599 3.66282 18.0125 3.77535 18.125C3.88787 18.2376 4.04048 18.3008 4.19961 18.3008H9.59961C10.077 18.3008 10.5348 18.4904 10.8724 18.828C11.21 19.1656 11.3996 19.6234 11.3996 20.1008C11.3996 20.2599 11.4628 20.4125 11.5753 20.525C11.6879 20.6376 11.8405 20.7008 11.9996 20.7008C12.1587 20.7008 12.3114 20.6376 12.4239 20.525C12.5364 20.4125 12.5996 20.2599 12.5996 20.1008C12.5996 19.6234 12.7893 19.1656 13.1268 18.828C13.4644 18.4904 13.9222 18.3008 14.3996 18.3008H19.7996C19.9587 18.3008 20.1114 18.2376 20.2239 18.125C20.3364 18.0125 20.3996 17.8599 20.3996 17.7008V6.90078C20.3996 6.74165 20.3364 6.58904 20.2239 6.47652C20.1114 6.364 19.9587 6.30078 19.7996 6.30078ZM9.59961 17.1008H4.79961V7.50078H9.59961C10.077 7.50078 10.5348 7.69042 10.8724 8.02799C11.21 8.36555 11.3996 8.82339 11.3996 9.30078V17.7008C10.8808 17.3104 10.2489 17.0997 9.59961 17.1008ZM19.1996 17.1008H14.3996C13.7503 17.0997 13.1184 17.3104 12.5996 17.7008V9.30078C12.5996 8.82339 12.7893 8.36555 13.1268 8.02799C13.4644 7.69042 13.9222 7.50078 14.3996 7.50078H19.1996V17.1008Z" fill="currentColor"/>
  </svg>
);
import LHSEntityGroup from '../Molecules/LHS/LHSEntityGroup/LHSEntityGroup';
import LHSExternalAppsGroup from '../Molecules/LHS/LHSExternalAppsGroup/LHSExternalAppsGroup';
import iconRrTrigger from '../../assets/rr-chrome/icon-trigger.svg';
import iconRrTasks from '../../assets/rr-chrome/icon-tasks.svg';
import iconRrProcedures from '../../assets/rr-chrome/icon-procedures.svg';
import iconRrControls from '../../assets/rr-chrome/icon-controls.svg';
import './LHSDrawer.css';

const EXTERNAL_APPS_TASK_KEY = 'External apps-task';

/* ─── Trigger data ─── */
const TRIGGER_SUB_ITEMS = {
  // Healthcare / Dental + shared
  'Appointment-trigger': {
    title: 'Appointment events',
    items: [
      'Appointment is booked',
      'Appointment is confirmed',
      'Appointment is cancelled',
      'Appointment is missed',
      'Appointment is completed',
    ],
  },
  // Automotive + shared
  'Contact-trigger': {
    title: 'Contact triggers',
    items: [
      'Contact is added',
      'Contact is updated',
      'Contact is added or updated',
    ],
  },
  Reviews: {
    title: 'Reviews',
    items: [
      {
        label: 'When a new review is received',
        description: 'Fires when a customer leaves a new review on any connected source or location.',
      },
      {
        label: 'When a review is updated',
        description: 'Fires when an existing review is edited, including rating or comment changes.',
      },
      {
        label: 'When a review is responded',
        description: 'Fires when a response is posted to a review, by your agent or a team member.',
      },
      {
        label: 'When a new review is received or updated',
        description: 'Fires on both new reviews and updates so one workflow can cover either event.',
      },
    ],
  },
  Inbox: {
    title: 'Inbox',
    items: [
      'When a new message is received',
      'When a conversation is assigned',
      'When a conversation is closed',
    ],
  },
  Listings: {
    title: 'Listings',
    items: [
      'When a listing is updated',
      'When a new listing is added',
      'When listing data changes',
    ],
  },
  Social: {
    title: 'Social',
    items: [
      'When a new post is published',
      'When a comment is received',
      'When a mention is detected',
    ],
  },
  Surveys: {
    title: 'Surveys',
    items: [
      'When a survey response is received',
      'When a survey is completed',
      'When survey score changes',
    ],
  },
  Ticketing: {
    title: 'Ticketing',
    items: [
      'When a new ticket is created',
      'When a ticket is updated',
      'When a ticket is resolved',
    ],
  },
  'External apps': {
    title: 'External apps',
    items: [
      'When webhook is triggered',
      'When external data is synced',
    ],
  },
};

// Automotive trigger cards (original full set)
export const AUTOMOTIVE_TRIGGER_CARDS = [
  { label: 'Schedule-based',      icon: 'schedule',            action: 'drag'    },
  { label: 'Conversation trigger',icon: 'forum',               action: 'drag'    },
  { label: 'Appointment',         icon: 'calendar_month',      action: 'chevron', subKey: 'Appointment-trigger' },
  { label: 'Reviews',             icon: 'grade',               action: 'chevron' },
  { label: 'Inbox',               icon: 'sms',                 action: 'chevron' },
  { label: 'Listings',            icon: 'location_on',         action: 'chevron' },
  { label: 'Social',              icon: 'workspaces',          action: 'chevron' },
  { label: 'Surveys',             icon: 'assignment_turned_in',action: 'chevron' },
  { label: 'Ticketing',           icon: 'shapes',              action: 'chevron' },
  { label: 'Contact',             icon: 'group',               action: 'chevron', subKey: 'Contact-trigger' },
  { label: 'External apps',       icon: 'grid_view',           action: 'chevron' },
];

// Healthcare / Dental — event-based triggers nested under "Event-based"
export const HEALTHCARE_EVENT_BASED_TRIGGER_CARDS = [
  { label: 'Conversation', dragLabel: 'Conversation trigger', icon: 'forum', action: 'drag' },
  { label: 'Appointment', icon: 'calendar_month', action: 'chevron', subKey: 'Appointment-trigger' },
  { label: 'Contact', icon: 'group', action: 'chevron', subKey: 'Contact-trigger' },
];

export const HEALTHCARE_TRIGGER_STANDALONE_CARDS = [
  { label: 'Schedule-based', icon: 'schedule', action: 'drag' },
];

export const HEALTHCARE_TRIGGER_GROUP = {
  label: 'Event-based',
  icon: 'graph_2',
  cards: HEALTHCARE_EVENT_BASED_TRIGGER_CARDS,
};

/** Flat list kept for backward-compat exports / search helpers */
export const HEALTHCARE_TRIGGER_CARDS = [
  ...HEALTHCARE_EVENT_BASED_TRIGGER_CARDS,
  ...HEALTHCARE_TRIGGER_STANDALONE_CARDS,
];

// Reviews AI — event-based triggers nested under "Event based" (Review response /
// Review generation agents only; matches the Reviews AI "Create from scratch" mock).
export const REVIEWS_EVENT_BASED_TRIGGER_CARDS = [
  { label: 'Reviews',       icon: 'grade',                action: 'chevron' },
];

export const REVIEWS_TRIGGER_GROUP = {
  label: 'Event based',
  icon: 'graph_2',
  cards: REVIEWS_EVENT_BASED_TRIGGER_CARDS,
};

export const REVIEWS_TRIGGER_CARDS = [
  ...REVIEWS_EVENT_BASED_TRIGGER_CARDS,
  ...HEALTHCARE_TRIGGER_STANDALONE_CARDS,
];

/** Section-only Trigger palette: flat collapsible categories (icon + label + arrow). */
export const REVIEWS_SECTION_TRIGGER_CATEGORIES = REVIEWS_EVENT_BASED_TRIGGER_CARDS.map((card) => ({
  id: card.subKey || card.label,
  label: card.label,
  icon: card.icon,
  items: TRIGGER_SUB_ITEMS[card.subKey || card.label]?.items ?? [],
}));

/** Healthcare / Front desk — same Controls-style categories for the floating palette. */
export const HEALTHCARE_SECTION_TRIGGER_CATEGORIES = [
  {
    id: 'Conversation',
    label: 'Conversation',
    icon: 'forum',
    items: [
      {
        label: 'Conversation trigger',
        description: 'Starts when a patient calls or messages your front desk.',
      },
    ],
  },
  {
    id: 'Appointment-trigger',
    label: 'Appointment',
    icon: 'calendar_month',
    items: (TRIGGER_SUB_ITEMS['Appointment-trigger']?.items ?? []).map((label) =>
      typeof label === 'string'
        ? { label, description: `Fires when ${label.replace(/^Appointment is /, 'an appointment is ')}.` }
        : label,
    ),
  },
  {
    id: 'Contact-trigger',
    label: 'Contact',
    icon: 'group',
    items: (TRIGGER_SUB_ITEMS['Contact-trigger']?.items ?? []).map((label) =>
      typeof label === 'string'
        ? { label, description: `Fires when a ${label.replace(/^Contact is /, 'contact is ').toLowerCase()}.` }
        : label,
    ),
  },
  {
    id: 'Schedule-based',
    label: 'Schedule based',
    icon: 'schedule',
    items: [
      {
        label: 'Schedule-based',
        description: 'Runs the workflow on a set schedule or cadence.',
      },
    ],
  },
];

/** Automotive floating-palette trigger categories (chevron cards + schedule). */
export const AUTOMOTIVE_SECTION_TRIGGER_CATEGORIES = [
  ...AUTOMOTIVE_TRIGGER_CARDS.filter((card) => card.action === 'chevron').map((card) => ({
    id: card.subKey || card.label,
    label: card.label,
    icon: card.icon,
    items: TRIGGER_SUB_ITEMS[card.subKey || card.label]?.items ?? [],
  })),
  {
    id: 'Schedule-based',
    label: 'Schedule based',
    icon: 'schedule',
    items: [
      {
        label: 'Schedule-based',
        description: 'Runs the workflow on a set schedule or cadence.',
      },
    ],
  },
  {
    id: 'Conversation',
    label: 'Conversation',
    icon: 'forum',
    items: [
      {
        label: 'Conversation trigger',
        description: 'Starts when a customer calls or messages your business.',
      },
    ],
  },
];

// Default export for backward compat (automotive)
export const TRIGGER_CARDS = AUTOMOTIVE_TRIGGER_CARDS;

/* ─── Task data ─── */
const AUTOMOTIVE_TASK_SUB_ITEMS = {
  Conversation: {
    title: 'Conversation tasks',
    items: [
      'Initiate voice call',
      'In call text',
    ],
  },
  Appointment: {
    title: 'Appointment tasks',
    items: [
      'Schedule appointment',
      'Reschedule appointment',
      'Cancel appointment',
      'Confirm appointment',
    ],
  },
  Contact: {
    title: 'Contact tasks',
    items: [
      'Update contact property',
      'Add contact to list',
      'Remove contact from list',
    ],
  },
  'External apps-task': {
    title: 'External app tasks',
    items: [
      'Send data to external app',
      'Fetch data from external app',
      'Trigger external webhook',
    ],
  },
};

export const HEALTHCARE_TASK_SUB_ITEMS = {
  Conversation: {
    title: 'Conversation tasks',
    items: [
      'Initiate voice call',
      'In-call SMS',
      'Send response',
    ],
  },
  Appointment: {
    title: 'Appointment tasks',
    items: [
      'Book new appointment',
      'Reschedule appointment',
      'Cancel appointment',
      'Confirm appointment',
      'Appointment reminder',
    ],
  },
  Contact: {
    title: 'Contact tasks',
    items: [
      'Update contact property',
      'Add contact to list',
      'Remove contact from list',
    ],
  },
  'External apps-task': {
    title: 'External app tasks',
    items: [
      'Send data to external app',
      'Fetch data from external app',
      'Trigger external webhook',
    ],
  },
};

/** Reviews AI task flyouts — title + description (2-line clamp + tooltip). */
export const REVIEWS_TASK_SUB_ITEMS = {
  Review: {
    title: 'Review',
    items: [
      {
        label: 'Assign tags',
        description: 'Add tags to a review',
      },
      {
        label: 'Classify tags',
        description: 'Manage review tags and their descriptions',
      },
      {
        label: 'Response generation',
        description: 'Assemble the final message from the drafted strategy',
      },
      {
        label: 'Review analysis',
        description:
          'Detects what the reviewer is talking about, maps it to the business\' vocabulary, score severity, identifies staff mentioned and competitors, and flags relevant business context details.',
      },
      {
        label: 'Triage review',
        description:
          'The system evaluates each review to determine if a response is needed, filtering out spam, irrelevant content, or policy violations.',
      },
      {
        label: 'Handle response',
        description:
          'Decide what the agent will do with the response composed for a review — have a human in the loop or reply automatically.',
      },
      {
        label: 'Select template',
        description: 'Choose which templates can be used as review responses',
      },
    ],
  },
  Referral: {
    title: 'Referral',
    items: [
      {
        label: 'Send referral request text',
        description: 'Sends referral texts to your contacts',
      },
      {
        label: 'Send referral request email',
        description: 'Sends referral emails to your contacts',
      },
    ],
  },
  Survey: {
    title: 'Survey',
    items: [
      {
        label: 'Send survey request text',
        description: 'Sends survey request text to your contacts',
      },
      {
        label: 'Send survey request email',
        description: 'Sends survey emails to your contacts',
      },
    ],
  },
  Ticketing: {
    title: 'Ticketing',
    items: [
      {
        label: 'Apply escalation rules',
        description: 'Send alerts or update tickets when TAT is missed',
      },
      {
        label: 'Create ticket in Birdeye',
        description: 'Creates a Birdeye ticket for a review or survey response',
      },
    ],
  },
  'External apps-task': {
    title: 'External apps',
    items: [
      {
        label: 'FreshDesk',
        description: 'Freshdesk CRM tools',
      },
      {
        label: 'QuickBooks Online',
        description: 'QuickBooks CRM tools',
      },
      {
        label: 'ServiceTitan',
        description: 'Service titan CRM tools',
      },
      {
        label: 'Salesforce',
        description: 'Salesforce CRM tools',
      },
      {
        label: 'Zendesk',
        description: 'Creates a ticket in Zendesk',
      },
    ],
  },
  General: {
    title: 'General',
    items: [
      {
        label: 'Send internal alert',
        description: 'Notifies your team through an email of an event that needs attention',
      },
      {
        label: 'Send text',
        description: 'Sends a text message to your contact',
      },
      {
        label: 'Send email',
        description: 'Sends an email to your contact',
      },
    ],
  },
};

export const REVIEWS_TASK_CARDS = [
  { label: 'Custom', icon: 'dashboard_customize', action: 'drag' },
  { label: 'Review', icon: 'grade', action: 'chevron', subKey: 'Review' },
  { label: 'Referral', icon: 'featured_seasonal_and_gifts', action: 'chevron', subKey: 'Referral' },
  { label: 'Survey', icon: 'assignment_turned_in', action: 'chevron', subKey: 'Survey' },
  { label: 'Ticketing', icon: 'shapes', action: 'chevron', subKey: 'Ticketing' },
  { label: 'External apps', icon: 'dashboard_customize', action: 'chevron', subKey: 'External apps-task' },
  { label: 'General', icon: 'grid_view', action: 'chevron', subKey: 'General' },
];

/** Section-only Tasks palette: flat collapsible categories (icon + label + arrow). */
export const REVIEWS_SECTION_TASK_CATEGORIES = REVIEWS_TASK_CARDS
  .filter((card) => card.action === 'chevron')
  .map((card) => ({
    id: card.subKey || card.label,
    label: card.label,
    icon: card.icon,
    items: REVIEWS_TASK_SUB_ITEMS[card.subKey || card.label]?.items ?? [],
  }));

export const REVIEWS_SECTION_TASK_STANDALONE = REVIEWS_TASK_CARDS.filter((card) => card.action === 'drag');

export { AUTOMOTIVE_TASK_SUB_ITEMS };

export const INITIATE_VOICE_CALL_TASK = 'Initiate voice call';

/** True for "Front desk agent", regional instances, and create-flow titles
 *  (e.g. "New front desk agent - inbound"). */
export function isFrontDeskAgent(agentName = '') {
  const name = String(agentName).toLowerCase();
  return /front\s*desk/.test(name) || name.includes('frontdesk');
}

/** Front desk library template titles (Use agent from the Front desk agent library tab). */
const FRONT_DESK_LIBRARY_TITLES = new Set([
  'Routing and triage',
  'New patient intake',
  'Patient scheduling',
  'Established patient scheduling',
  'Urgent escalations',
]);

export function isFrontDeskLibraryTemplate(agentName = '') {
  return FRONT_DESK_LIBRARY_TITLES.has(String(agentName).trim());
}

/** True when the canvas belongs to the front desk agent family (base, regional, create-flow, or library template). */
export function isFrontDeskCanvasAgent(...names) {
  return names.some((name) => isFrontDeskAgent(name) || isFrontDeskLibraryTemplate(name));
}

/** Remove task sub-items unavailable for the current agent. */
export function filterTaskItemsForAgent(items = [], agentName = '') {
  if (!isFrontDeskAgent(agentName)) return items;
  return items.filter((item) => {
    const label = typeof item === 'string' ? item : item?.label;
    return label !== INITIATE_VOICE_CALL_TASK;
  });
}

function filterTaskSubItemsMap(subItemsMap, agentName = '') {
  if (!isFrontDeskAgent(agentName)) return subItemsMap;
  return Object.fromEntries(
    Object.entries(subItemsMap).map(([key, group]) => [
      key,
      {
        ...group,
        items: filterTaskItemsForAgent(group.items, agentName),
      },
    ]),
  );
}

const READONLY_TRIGGER_SUBMENUS = new Set(['Contact-trigger', 'Appointment-trigger', 'Reviews']);
const READONLY_TASK_SUBMENUS = new Set([
  'Conversation',
  'Contact',
  'Appointment',
  'Review',
  'Ticketing',
  'Campaign',
  'Referral',
  'Survey',
  'Surveys',
  'General',
  'External apps-task',
]);
const DISABLED_TASK_SUB_ITEMS = new Set(['In call text']);
const PROCEDURE_COLLAPSE_LIMIT = 7;

export const AUTOMOTIVE_TASK_CARDS = [
  { label: 'Custom', icon: 'dashboard_customize', action: 'drag' },
  { label: 'Conversation', icon: 'forum', action: 'chevron', subKey: 'Conversation' },
  { label: 'Appointment', icon: 'calendar_month', action: 'chevron', subKey: 'Appointment' },
  { label: 'Contact', icon: 'person', action: 'chevron', subKey: 'Contact' },
  { label: 'External apps', icon: 'grid_view', action: 'chevron', subKey: 'External apps-task' },
];

export const HEALTHCARE_TASK_CARDS = [
  { label: 'Custom', icon: 'dashboard_customize', action: 'drag' },
  { label: 'Conversation', icon: 'forum', action: 'chevron', subKey: 'Conversation' },
  { label: 'Appointment', icon: 'calendar_month', action: 'chevron', subKey: 'Appointment' },
  { label: 'Contact', icon: 'person', action: 'chevron', subKey: 'Contact' },
  { label: 'External apps', icon: 'grid_view', action: 'chevron', subKey: 'External apps-task' },
];

// Default export for backward compat (automotive)
export const TASK_CARDS = AUTOMOTIVE_TASK_CARDS;

/* ─── Procedures — categorised with hover dropdowns (same pattern as Tasks) ─── */
const PROCEDURE_SUB_ITEMS = {
  'Inbound General': {
    title: 'Inbound General',
    items: [
      'Greeting & Intent Detection',
      'Department Transfer',
      'General Inquiry',
      'Handle Unclear Message',
      'Emergency / Urgent Handling',
      'Talk to Human',
      'Spanish Language Handling',
    ],
  },
  Service: {
    title: 'Service',
    items: [
      'Schedule Service Appointment',
      'Repair / Diagnostic Triage',
      'Recall Inquiry',
      'Service Status Check',
      'Reschedule / Cancel Appointment',
      'Warranty Inquiry',
    ],
  },
  Sales: {
    title: 'Sales',
    items: [
      'New Vehicle Inquiry',
      'Used / CPO Vehicle Inquiry',
      'Trade-In Valuation',
      'Finance Pre-Qualification',
      'Test Drive Scheduling',
      'Internet Lead Qualification',
    ],
  },
  Parts: {
    title: 'Parts',
    items: [
      'Parts Availability & Pricing',
    ],
  },
  'After-Hours': {
    title: 'After-Hours',
    items: [
      'After-Hours Lead Capture',
      'After-Hours Service Request',
    ],
  },
  Outbound: {
    title: 'Outbound',
    items: [
      'Lead Follow-Up Call',
      'Missed Call Callback',
      'Appointment Confirmation',
      'No-Show Re-Engagement',
      'Lease Maturity Outreach',
      'Equity Mining Outreach',
      'Service Lapse Re-Engagement',
      'CSI Follow-Up',
      'NHTSA Recall Notification',
      'Orphan Customer Introduction',
      'Welcome / Onboarding',
      'Unsold Showroom Follow-Up',
    ],
  },
};

/** Draggable card — opens the create-custom-procedure panel on drop. */
export const CUSTOM_PROCEDURE_CARD = {
  label: 'Custom',
  icon: 'list',
  action: 'drag',
  nodeType: 'procedures',
  procedureId: '__custom__',
};

// Automotive procedure cards (all 6 categories)
export const PROCEDURE_CARDS = [
  { label: 'Inbound General', svgIcon: true, action: 'chevron', subKey: 'Inbound General' },
  { label: 'Service',         svgIcon: true, action: 'chevron', subKey: 'Service' },
  { label: 'Sales',           svgIcon: true, action: 'chevron', subKey: 'Sales' },
  { label: 'Parts',           svgIcon: true, action: 'chevron', subKey: 'Parts' },
  { label: 'After-Hours',     svgIcon: true, action: 'chevron', subKey: 'After-Hours' },
  { label: 'Outbound',        svgIcon: true, action: 'chevron', subKey: 'Outbound' },
];

// Healthcare / Dental — Frontdesk procedures (draggable, no sub-menu)
export const HEALTHCARE_PROCEDURE_CARDS = [
  { label: 'Handle general inquiry',             svgIcon: true, action: 'drag', nodeType: 'procedures', procedureId: 'Handle general inquiry' },
  { label: 'Talk to human',                      svgIcon: true, action: 'drag', nodeType: 'procedures', procedureId: 'Talk to human' },
  { label: 'Book new appointment',               svgIcon: true, action: 'drag', nodeType: 'procedures', procedureId: 'Book new appointment' },
  { label: 'Reschedule appointment',             svgIcon: true, action: 'drag', nodeType: 'procedures', procedureId: 'Reschedule appointment' },
  { label: 'Cancel appointment',                 svgIcon: true, action: 'drag', nodeType: 'procedures', procedureId: 'Cancel appointment' },
  { label: 'Handle slot conflict',               svgIcon: true, action: 'drag', nodeType: 'procedures', procedureId: 'Handle slot conflict' },
  { label: 'Handle booking failure',             svgIcon: true, action: 'drag', nodeType: 'procedures', procedureId: 'Handle booking failure' },
  { label: 'Verify insurance',                   svgIcon: true, action: 'drag', nodeType: 'procedures', procedureId: 'Verify insurance' },
  { label: 'Appointment confirmation',           svgIcon: true, action: 'drag', nodeType: 'procedures', procedureId: 'Appointment confirmation' },
  { label: 'Waitlist slot confirmation',         svgIcon: true, action: 'drag', nodeType: 'procedures', procedureId: 'Waitlist slot confirmation' },
  { label: 'Handle emergency or urgent concern', svgIcon: true, action: 'drag', nodeType: 'procedures', procedureId: 'Handle emergency or urgent concern' },
  { label: 'Handle unclear message',             svgIcon: true, action: 'drag', nodeType: 'procedures', procedureId: 'Handle unclear message' },
];

/* ─── Dynamic procedure helpers (derive from library procedures prop) ─── */
function buildProcedureSubItems(procedures) {
  const groups = {};
  procedures.forEach(({ name, category }) => {
    if (!groups[category]) groups[category] = { title: category, items: [] };
    groups[category].items.push(name);
  });
  return groups;
}

function buildAutomotiveProcedureCards(procedures) {
  const seen = new Set();
  const cards = [];
  procedures.forEach(({ category }) => {
    if (!seen.has(category)) {
      seen.add(category);
      cards.push({ label: category, svgIcon: true, action: 'chevron', subKey: category });
    }
  });
  return cards;
}

function buildHCProcedureCards(procedures) {
  return procedures.map(({ name }) => ({
    label: name,
    svgIcon: true,
    action: 'drag',
    nodeType: 'procedures',
    procedureId: name,
  }));
}

/* ─── Controls data ─── */
export const CONTROL_CARDS = [
  { label: 'Branch', icon: 'account_tree', action: 'drag', nodeType: 'branch' },
  { label: 'Delay', icon: 'schedule', action: 'drag', nodeType: 'delay' },
  { label: 'Parallel tasks', icon: 'splitscreen_add', action: 'drag', nodeType: 'parallel' },
  { label: 'Loop', icon: 'all_inclusive', action: 'drag', nodeType: 'loop' },
  {
    label: 'Sub-agent (TBD)',
    dragLabel: 'Sub-agent',
    icon: 'smart_toy',
    action: 'drag',
    nodeType: 'subagent',
    disabled: true,
  },
];

/** Leaf items shown when the LHS drawer's "Branch" / "Delay" controls are expanded.
 *  Each carries a `description` so it renders as a rich `LHSEntityGroup` card (title +
 *  description + drag handle) — the same treatment as the Trigger / Task panels. */
export const BRANCH_VARIANT_ITEMS = [
  { label: 'Based on condition', description: 'Route the flow down different paths based on conditions you define.' },
  { label: 'Based on percentage', description: 'Split traffic across paths by percentage — useful for testing variations.' },
  { label: 'Always run', description: 'Add a path that always runs, regardless of any conditions.' },
];

export const DELAY_VARIANT_ITEMS = [
  { label: 'For a set amount of time', description: 'Pause the workflow for a fixed duration before continuing.' },
  { label: 'Until a calendar date', description: 'Wait until a specific calendar date to continue.' },
  { label: 'Until a date property', description: 'Wait until a date stored on the contact or record.' },
  { label: 'Until a date of the week', description: 'Wait until a specific day of the week to continue.' },
  { label: 'Until a specific time of the day', description: 'Wait until a set time of day before continuing.' },
];

/** Compact card variants (label only) used by the tabbed accordion's `TriggerGroup` rows. */
export const BRANCH_VARIANT_CARDS = BRANCH_VARIANT_ITEMS.map((it) => ({
  label: it.label, action: 'drag', nodeType: 'branch',
}));
export const DELAY_VARIANT_CARDS = DELAY_VARIANT_ITEMS.map((it) => ({
  label: it.label, action: 'drag', nodeType: 'delay',
}));

/** Delay option preselected on drop, keyed by the dropped variant's name (see AgentBuilder's
 *  handleDropNode, which reads the variant from the drag payload's `description`).
 *  Branch variants are seeded by AgentBuilder's branch scaffold, which owns the path structure. */
export const DELAY_VARIANT_PRESETS = {
  'For a set amount of time': 'set-time',
  'Until a calendar date': 'calendar-date',
  'Until a date property': 'date-property',
  'Until a date of the week': 'day-of-week',
  'Until a specific time of the day': 'time-of-day',
};

/** Controls list rendered in the LHS drawer's "Controls" accordion — Branch/Delay expand
 *  inline (via `TriggerGroup`) to their variant cards above; everything else in
 *  `CONTROL_CARDS` stays a single draggable row. The canvas "+" add-step popover
 *  (`AddStepMenu`) keeps using the flat `CONTROL_CARDS` list untouched. */
const LHS_CONTROL_GROUPS = [
  { icon: 'schedule', label: 'Delay', cards: DELAY_VARIANT_CARDS },
  { icon: 'account_tree', label: 'Branch', cards: BRANCH_VARIANT_CARDS },
];
const LHS_CONTROL_STANDALONE_CARDS = CONTROL_CARDS.filter(
  (c) => c.nodeType !== 'branch' && c.nodeType !== 'delay',
);

/** Section-only (floating palette) Controls — mirrors the Trigger/Task palette:
 *  collapsible categories whose bodies are rich `LHSEntityGroup` cards. */
const CONTROL_SECTION_CATEGORIES = [
  { id: 'Delay', label: 'Delay', icon: 'schedule', nodeType: 'delay', items: DELAY_VARIANT_ITEMS },
  { id: 'Branch', label: 'Branch', icon: 'account_tree', nodeType: 'branch', items: BRANCH_VARIANT_ITEMS },
];

/** Single controls (no sub-variants) shown as standalone rich cards below the categories. */
const CONTROL_STANDALONE_DESCRIPTIONS = {
  'Parallel tasks': 'Run several tasks at the same time, then continue once they all finish.',
  Loop: 'Repeat a set of steps for each item or until a condition is met.',
  'Sub-agent': 'Call another agent’s workflow as a step. Coming soon.',
};

/** Sub-items for the canvas add-step menu, keyed by product. */
export function getTaskSubItems(product = 'automotive', agentName = '') {
  const isHC = product === 'healthcare' || product === 'dental';
  const isReviews = /review (response|generation) agent/i.test(agentName || '');
  const base = isReviews
    ? { ...HEALTHCARE_TASK_SUB_ITEMS, ...REVIEWS_TASK_SUB_ITEMS }
    : isHC
      ? HEALTHCARE_TASK_SUB_ITEMS
      : AUTOMOTIVE_TASK_SUB_ITEMS;
  return filterTaskSubItemsMap(base, agentName);
}

/** Task cards for the canvas add-step menu (excludes External apps for a cleaner popover). */
export function getAddStepTaskCards(product = 'automotive', agentName = '') {
  const isHC = product === 'healthcare' || product === 'dental';
  const isReviews = /review (response|generation) agent/i.test(agentName || '');
  const cards = isReviews ? REVIEWS_TASK_CARDS : isHC ? HEALTHCARE_TASK_CARDS : AUTOMOTIVE_TASK_CARDS;
  return cards.filter((c) => c.subKey !== 'External apps-task');
}

/** Control cards shown in the add-step popover (matches Figma: Branch + Delay). */
export function getAddStepControlCards() {
  return CONTROL_CARDS.filter((c) => c.nodeType === 'branch' || c.nodeType === 'delay');
}

/* ─── Trigger + task sub-items (mutable state; procedures are derived dynamically) ─── */
function buildInitialSubItems(isHC, isReviews = false) {
  const taskSubItems = isReviews
    ? { ...HEALTHCARE_TASK_SUB_ITEMS, ...REVIEWS_TASK_SUB_ITEMS }
    : isHC
      ? HEALTHCARE_TASK_SUB_ITEMS
      : AUTOMOTIVE_TASK_SUB_ITEMS;
  return { ...TRIGGER_SUB_ITEMS, ...taskSubItems };
}

/* ─── Card Row ─── */
export function CardRow({
  label,
  icon,
  svgIcon,
  action,
  isActive,
  onClick,
  onHover,
  cardRef,
  nodeType,
  viewOnly,
  procedureId,
  dragLabel,
  disabled = false,
}) {
  const handleDragStart = (e) => {
    setFlowDragData(e.dataTransfer, {
      type: nodeType,
      // For procedure cards, use the procedureId as the label so AgentBuilder
      // can seed the first procedureIds entry correctly
      label: procedureId || dragLabel || label,
      description: label,
    });
  };

  const isDraggable = action === 'drag' && !viewOnly && !disabled;

  return (
    <div
      ref={cardRef}
      className={`lhs-drawer__card ${action === 'drag' && !disabled ? 'lhs-drawer__card--drag' : ''} ${isActive ? 'lhs-drawer__card--active' : ''} ${viewOnly ? 'lhs-drawer__card--view-only' : ''} ${disabled ? 'lhs-drawer__card--disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={disabled ? undefined : onHover}
      draggable={isDraggable}
      aria-disabled={disabled || undefined}
      onDragStart={isDraggable ? handleDragStart : undefined}
    >
      {svgIcon ? (
        <span className="lhs-drawer__card-icon" style={{ display: 'flex', alignItems: 'center', color: '#212121' }}>
          <ProcedureSvgIcon />
        </span>
      ) : (
        <span className="lhs-drawer__card-icon material-symbols-outlined">
          {icon}
        </span>
      )}
      <span className="lhs-drawer__card-label">{label}</span>
      {action === 'drag' ? (
        <span className="lhs-drawer__card-action">
          <span className="material-symbols-outlined">drag_indicator</span>
        </span>
      ) : (
        <span className="lhs-drawer__card-action lhs-drawer__card-action--chevron">
          <span className="material-symbols-outlined">{isActive ? 'expand_less' : 'chevron_right'}</span>
        </span>
      )}
    </div>
  );
}

function TriggerGroup({
  group,
  section,
  isOpen,
  onToggle,
  renderCardRow,
  search,
  /** Section-only chrome: plain label, no card chrome / chevron; always expanded. */
  plainHeading = false,
}) {
  const filteredCards = group.cards.filter(
    (card) => !search || card.label.toLowerCase().includes(search.toLowerCase()),
  );
  const showGroup = filteredCards.length > 0 || !search;
  if (!showGroup) return null;

  const isExpanded = plainHeading || isOpen || (search.length > 0 && filteredCards.length > 0);

  return (
    <div className={`lhs-drawer__trigger-group${isExpanded ? ' lhs-drawer__trigger-group--open' : ''}${plainHeading ? ' lhs-drawer__trigger-group--plain' : ''}${section === 'control' ? ' lhs-drawer__trigger-group--control' : ''}`}>
      {plainHeading ? (
        <div className="lhs-drawer__trigger-group-heading">
          <span className="lhs-drawer__trigger-group-icon material-symbols-outlined" aria-hidden>
            {group.icon}
          </span>
          <span className="lhs-drawer__trigger-group-label">{group.label}</span>
        </div>
      ) : (
        <button
          type="button"
          className="lhs-drawer__trigger-group-header"
          onClick={onToggle}
          aria-expanded={isExpanded}
        >
          <span className="lhs-drawer__trigger-group-icon material-symbols-outlined">{group.icon}</span>
          <span className="lhs-drawer__trigger-group-label">{group.label}</span>
          <span className="material-symbols-outlined lhs-drawer__trigger-group-chevron">expand_more</span>
        </button>
      )}
      {isExpanded && (
        <div className="lhs-drawer__trigger-group-items">
          {filteredCards.map((card) => renderCardRow(card, section, 'trigger'))}
        </div>
      )}
    </div>
  );
}

const TABS = ['Create with AI', 'Create manually'];

/** Quickstarts when creating a new agent from scratch. */
const BUILD_AI_OPTIONS = [
  'Replying using templates',
  'Replying autonomously',
  'Replying after human approval',
  'Suggesting replies in dashboard',
];

/** Contextual follow-ups when editing an already-built agent. */
function getExistingAgentAiOptions(agentName = '') {
  const name = String(agentName).toLowerCase();
  if (name.includes('review generation')) {
    return [
      'Change request tone',
      'Update send timing',
      'Adjust who receives requests',
      'Add a follow-up nudge',
    ];
  }
  if (name.includes('review response') || name.includes('review')) {
    return [
      'Change reply tone',
      'Update escalation for negative reviews',
      'Adjust which sources to watch',
      'Add another location',
    ];
  }
  if (name.includes('reminder')) {
    return [
      'Change reminder timing',
      'Update email, text, or call channels',
      'Adjust confirmation follow-up',
      'Skip reminders for certain visits',
    ];
  }
  if (name.includes('front desk') || name.includes('frontdesk')) {
    return [
      'Update call routing',
      'Change the greeting',
      'Add a booking rule',
      'Escalate more intents to a human',
    ];
  }
  return [
    'Update a workflow step',
    'Change a trigger condition',
    'Add a task or procedure',
    'Adjust escalation rules',
  ];
}

/** @deprecated use BUILD_AI_OPTIONS — kept for any external imports */
const AI_OPTIONS = BUILD_AI_OPTIONS;

/** First trigger + task the "Create with AI" quickstarts seed onto an empty Reviews AI
 *  canvas — same drop payload shape `onDropNode` (FlowCanvas drag-drop) expects, so the
 *  AI-picked node ends up identical to one dragged in by hand from "Create manually". */
const REVIEWS_AI_QUICKSTART_SEED_NODES = [
  { type: 'trigger', label: 'Reviews', description: 'When a new review is received', afterNodeId: '__start__' },
  { type: 'task', label: 'Review', description: 'Triage review' },
];

export default function LHSDrawer({
  defaultTab = 'Create manually',
  defaultOpenSection = 'Tasks',
  forceOpenSection = null,
  onForceOpenSectionHandled = null,
  viewOnly = false,
  product = 'automotive',
  agentName = '',
  procedures = null,
  onProcedureClick = null,
  onCollapse = null,
  showTabs = false,
  /** Renders ONLY `forceOpenSection`'s content, with its own icon/title/close header,
   *  instead of the full tabbed Trigger/Tasks/Procedures/Controls accordion. Category
   *  chevron cards expand their leaf items inline (accordion) instead of in a side
   *  flyout. Used by the review-response chrome's per-section floater panel. */
  sectionOnly = false,
  /** When set, Create with AI shows this saved co-pilot transcript instead of the empty welcome. */
  aiTranscript = null,
  /** External full-screen takeover of the Create with AI chat (Reviews AI create flow). */
  aiFullscreen = false,
  onAiFullscreenChange = null,
  onOpenAiFullscreen = null,
  /** True when editing an already-built agent (not create-from-scratch). */
  existingAgent = false,
  /** Adds a node to the canvas (same handler FlowCanvas drag-drop uses) — lets the
   *  Create with AI quickstarts seed the trigger/task nodes shown in the mock. */
  onDropNode = null,
  /** The canvas node most recently clicked ({id, type, title}) — shown as a removable
   *  pill in the Create with AI composer so a follow-up message can reference it. */
  nodeContext = null,
  onClearNodeContext = null,
  /** Sep 1: floating "Tasks" palette section reads "Actions" instead. */
  actionLabel = 'Task',
}) {
  const isHC = product === 'healthcare' || product === 'dental';
  // Review response / Review generation agents get their own "Event based" trigger
  // grouping regardless of `product` (Reviews AI isn't a distinct product value —
  // see LHSDrawer plan notes) so the picker matches the Reviews AI create-from-scratch mock.
  const isReviewsAgent = /review (response|generation) agent/i.test(agentName || '');
  const isFrontDesk = isFrontDeskAgent(agentName);

  const activeTriggerCards = isReviewsAgent
    ? REVIEWS_TRIGGER_CARDS
    : isHC
      ? HEALTHCARE_TRIGGER_CARDS
      : AUTOMOTIVE_TRIGGER_CARDS;
  const activeTriggerGroup = isReviewsAgent ? REVIEWS_TRIGGER_GROUP : (isHC ? HEALTHCARE_TRIGGER_GROUP : null);
  const activeTriggerStandaloneCards = (isReviewsAgent || isHC) ? HEALTHCARE_TRIGGER_STANDALONE_CARDS : [];
  const activeTaskCards = isReviewsAgent
    ? REVIEWS_TASK_CARDS
    : isHC
      ? HEALTHCARE_TASK_CARDS
      : AUTOMOTIVE_TASK_CARDS;

  // Derive procedure cards + sub-items from the live library when the prop is provided;
  // fall back to the static hardcoded lists for backward-compat.
  const baseProcedureCards = procedures
    ? (isHC ? buildHCProcedureCards(procedures) : buildAutomotiveProcedureCards(procedures))
    : (isHC ? HEALTHCARE_PROCEDURE_CARDS : PROCEDURE_CARDS);
  const activeProcedureCards = [
    CUSTOM_PROCEDURE_CARD,
    ...baseProcedureCards.filter((c) => c.label !== 'Custom'),
  ];

  const procedureSubItems = procedures
    ? buildProcedureSubItems(procedures)
    : PROCEDURE_SUB_ITEMS;
  const [activeTab, setActiveTab] = useState(
    aiTranscript ? 'Create with AI' : defaultTab,
  );
  const [aiInputValue, setAiInputValue] = useState('');
  const showAiBody = activeTab === 'Create with AI';
  const [aiTrail, setAiTrail] = useState(() => {
    const draft = getCreateAiDraftSession(agentName || '');
    if (draft?.trail?.length) return draft.trail;
    if (aiTranscript?.trail?.length) return aiTranscript.trail;
    return [];
  });

  // A transcript can resolve after mount (e.g. saved during this session).
  useEffect(() => {
    if (aiTranscript) setActiveTab('Create with AI');
  }, [aiTranscript]);

  // Parent can request Create with AI after exiting fullscreen expand.
  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    const draft = getCreateAiDraftSession(agentName || '');
    if (draft?.trail?.length) {
      setAiTrail(draft.trail);
      return;
    }
    if (aiTranscript?.trail?.length) {
      setAiTrail(aiTranscript.trail);
      return;
    }
    if (aiTranscript?.prompt) {
      setAiTrail([
        { kind: 'user', text: aiTranscript.prompt },
        ...(aiTranscript.replies ?? []).map((paragraphs) => ({
          kind: 'agent',
          paragraphs: Array.isArray(paragraphs) ? paragraphs : [String(paragraphs)],
        })),
      ]);
      return;
    }
    setAiTrail([]);
  }, [agentName, aiTranscript]);

  const handleAiSend = (text) => {
    const trimmed = String(text || '').trim();
    if (!trimmed) return;
    const key = agentName || 'agent';
    appendCreateAiDraftTurn(key, { kind: 'user', text: trimmed });

    // First message on a fresh Reviews AI canvas, picked from the quickstarts: seed the
    // trigger + task nodes (same as dragging them in from "Create manually") instead of
    // the generic "expand to full screen" placeholder reply.
    const isQuickstartPick = BUILD_AI_OPTIONS.includes(trimmed);
    if (
      !existingAgent &&
      isReviewsAgent &&
      isQuickstartPick &&
      aiTrail.length === 0 &&
      onDropNode
    ) {
      REVIEWS_AI_QUICKSTART_SEED_NODES.forEach((seed) => onDropNode(seed));
      appendCreateAiDraftTurn(key, {
        kind: 'draft',
        title: '1. When a new review is received',
        description: 'Trigger added',
      });
      appendCreateAiDraftTurn(key, {
        kind: 'draft',
        title: '2. Triage review',
        description: 'Task added',
      });
      const next = appendCreateAiDraftTurn(key, {
        kind: 'agent',
        paragraphs: [
          "I've started your workflow with a trigger and a first task — click either node to fine-tune it, or keep describing what you'd like to build next.",
        ],
      });
      setAiTrail(next.trail);
      return;
    }

    const next = appendCreateAiDraftTurn(key, {
      kind: 'agent',
      paragraphs: [
        existingAgent
          ? 'Got it — I can help with that. Expand to full screen to continue the conversation.'
          : 'Got it — I can help you build that. Expand to full screen to continue the conversation.',
      ],
    });
    setAiTrail(next.trail);
  };
  const [openSection, setOpenSection] = useState(defaultOpenSection);
  const toggleSection = (section) =>
    setOpenSection((prev) => (prev === section ? null : section));

  useEffect(() => {
    if (forceOpenSection) {
      setOpenSection(forceOpenSection);
      onForceOpenSectionHandled?.();
    }
  }, [forceOpenSection, onForceOpenSectionHandled]);
  const [search, setSearch] = useState('');
  const [proceduresExpanded, setProceduresExpanded] = useState(false);
  const [eventBasedOpen, setEventBasedOpen] = useState(true);
  /** Exclusive accordion — which Controls group ('Delay' | 'Branch') is expanded. */
  const [openControlGroup, setOpenControlGroup] = useState('Branch');
  const [expandedCard, setExpandedCard] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  /** Section-only palette: which category header is open (exclusive). */
  const [paletteCategoryId, setPaletteCategoryId] = useState(
    forceOpenSection === 'Tasks' ? 'Review'
      : forceOpenSection === 'Controls' ? 'Branch'
        : 'Reviews',
  );
  const [dropdownTop, setDropdownTop] = useState(0);
  const [subItems, setSubItems] = useState(() => buildInitialSubItems(isHC, isReviewsAgent));
  const allSubItems = { ...subItems, ...procedureSubItems };
  const panelRef = useRef(null);
  const cardRefs = useRef({});
  const closeDropdownTimerRef = useRef(null);
  const hoverDropdownRef = useRef(false);
  const draggingFromFlyoutRef = useRef(false);
  const [flyoutDragging, setFlyoutDragging] = useState(false);

  useEffect(() => () => cancelCloseDropdown(), []);

  const handleSubItemsChange = (key, newItems) => {
    setSubItems((prev) => ({
      ...prev,
      [key]: { ...prev[key], items: newItems },
    }));
  };

  const openCardDropdown = (card, section, subKey) => {
    cancelCloseDropdown();
    const key = subKey || card.label;
    const cardEl = cardRefs.current[`${section}-${card.label}`];
    const panelEl = panelRef.current;
    if (cardEl && panelEl) {
      const cardRect = cardEl.getBoundingClientRect();
      const panelRect = panelEl.getBoundingClientRect();
      setDropdownTop(cardRect.top - panelRect.top);
    }
    setExpandedCard(key);
    setExpandedSection(section);
  };

  const handleCardHover = (card, section, subKey) => {
    if (card.action !== 'chevron') {
      // Hovering a non-chevron card closes any open dropdown
      setExpandedCard(null);
      setExpandedSection(null);
      return;
    }
    openCardDropdown(card, section, subKey);
  };

  const handleCardClick = (card, section, subKey) => {
    if (card.action === 'drag' && card.nodeType === 'procedures' && card.procedureId && onProcedureClick) {
      onProcedureClick(card.procedureId);
      return;
    }
    if (card.action !== 'chevron') return;
    const key = subKey || card.label;
    // Exclusive accordion — only one chevron card open at a time.
    const closing = expandedCard === key && expandedSection === section;
    if (closing) {
      setExpandedCard(null);
      setExpandedSection(null);
    } else {
      setExpandedCard(key);
      setExpandedSection(section);
    }
    cancelCloseDropdown();
    const cardEl = cardRefs.current[`${section}-${card.label}`];
    const panelEl = panelRef.current;
    if (cardEl && panelEl) {
      const cardRect = cardEl.getBoundingClientRect();
      const panelRect = panelEl.getBoundingClientRect();
      setDropdownTop(cardRect.top - panelRect.top);
    }
  };

  const renderCardRow = (card, section, nodeType) => {
    const subKey = card.subKey || card.label;
    const isActive = expandedCard === subKey && expandedSection === section;
    const isExternalAppsTask = subKey === EXTERNAL_APPS_TASK_KEY;
    const rawSubItems = !isExternalAppsTask ? allSubItems[subKey] : null;
    const inlineSubItems = rawSubItems
      ? { ...rawSubItems, items: filterTaskItemsForAgent(rawSubItems.items, agentName) }
      : null;
    const showInline = sectionOnly && isActive && (isExternalAppsTask || inlineSubItems);

    return (
      <div key={card.label} className="lhs-drawer__card-wrapper">
        <CardRow
          label={card.label}
          icon={card.icon}
          svgIcon={card.svgIcon}
          action={card.action}
          nodeType={card.nodeType || nodeType}
          isActive={isActive}
          onClick={() => handleCardClick(card, section, card.subKey)}
          onHover={sectionOnly ? undefined : () => handleCardHover(card, section, card.subKey)}
          cardRef={(el) => { cardRefs.current[`${section}-${card.label}`] = el; }}
          viewOnly={viewOnly}
          procedureId={card.procedureId}
          dragLabel={card.dragLabel}
          disabled={card.disabled}
        />
        {showInline && (
          <div className="lhs-drawer__inline-group">
            {isExternalAppsTask ? (
              <LHSExternalAppsGroup
                nodeType={section === 'trigger' ? 'trigger' : 'task'}
                parentLabel="External apps"
                viewOnly={viewOnly}
              />
            ) : (
              <LHSEntityGroup
                title={inlineSubItems.title}
                items={inlineSubItems.items}
                nodeType={section === 'trigger' ? 'trigger' : section === 'procedures' ? 'procedures' : 'task'}
                parentLabel={subKey}
                onItemsChange={(newItems) => handleSubItemsChange(subKey, newItems)}
                viewOnly={viewOnly}
                readOnly={
                  (section === 'trigger' && READONLY_TRIGGER_SUBMENUS.has(subKey))
                  || (section === 'task' && READONLY_TASK_SUBMENUS.has(subKey))
                }
                dragAlwaysVisible
                disabledItems={DISABLED_TASK_SUB_ITEMS}
                inline
                showTitle={section === 'trigger'}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCards = (cards, section, nodeType) => {
    const filtered = cards.filter(
      (c) => !search || c.label.toLowerCase().includes(search.toLowerCase()),
    );

    const isCollapsibleProcedureList =
      section === 'procedures'
      && filtered.length > PROCEDURE_COLLAPSE_LIMIT
      && filtered.every((c) => c.action === 'drag');

    const shouldCollapse = isCollapsibleProcedureList && !proceduresExpanded && !search;
    const visibleCards = shouldCollapse
      ? filtered.slice(0, PROCEDURE_COLLAPSE_LIMIT)
      : filtered;
    const hiddenCount = filtered.length - PROCEDURE_COLLAPSE_LIMIT;

    const cardsClass = 'lhs-drawer__cards';

    return (
      <div className={cardsClass}>
        {visibleCards.map((card) => renderCardRow(card, section, nodeType))}
        {shouldCollapse && (
          <button
            type="button"
            className="lhs-drawer__view-more"
            onClick={() => setProceduresExpanded(true)}
          >
            View {hiddenCount} more
          </button>
        )}
      </div>
    );
  };

  const renderTriggerContent = () => {
    // Floating palette (section-only): Controls-style collapsible categories.
    if (sectionOnly) {
      const q = search.trim().toLowerCase();
      const scheduleCategory = {
        id: 'Schedule-based',
        label: 'Schedule based',
        icon: 'schedule',
        items: [
          { label: 'Schedule-based', description: 'Runs the workflow on a set schedule or cadence.' },
        ],
      };
      const baseCategories = isReviewsAgent
        ? [...REVIEWS_SECTION_TRIGGER_CATEGORIES, scheduleCategory]
        : isHC
          ? HEALTHCARE_SECTION_TRIGGER_CATEGORIES
          : AUTOMOTIVE_SECTION_TRIGGER_CATEGORIES;

      const categories = baseCategories
        .map((cat) => {
          const liveItems = allSubItems[cat.id]?.items ?? cat.items;
          const items = (liveItems || []).filter((item) => {
            if (!q) return true;
            const label = typeof item === 'string' ? item : item.label;
            const desc = typeof item === 'string' ? '' : (item.description || '');
            return (
              cat.label.toLowerCase().includes(q)
              || String(label).toLowerCase().includes(q)
              || desc.toLowerCase().includes(q)
            );
          });
          return { ...cat, items };
        })
        .filter((cat) => !q || cat.items.length > 0 || cat.label.toLowerCase().includes(q));

      if (categories.length === 0) {
        return <p className="lhs-drawer__section-empty">No triggers match your search</p>;
      }

      return (
        <div className="lhs-drawer__palette-categories">
          {categories.map((cat) => {
            const isOpen = paletteCategoryId === cat.id || (q.length > 0 && cat.items.length > 0);
            return (
              <div key={cat.id} className={`lhs-drawer__palette-category${isOpen ? ' lhs-drawer__palette-category--open' : ''}`}>
                <button
                  type="button"
                  className="lhs-drawer__palette-category-header"
                  onClick={() => setPaletteCategoryId((id) => (id === cat.id ? null : cat.id))}
                  aria-expanded={isOpen}
                >
                  <span className="material-symbols-outlined lhs-drawer__palette-category-icon" aria-hidden>
                    {cat.icon}
                  </span>
                  <span className="lhs-drawer__palette-category-label">{cat.label}</span>
                  <span className="material-symbols-outlined lhs-drawer__palette-category-chevron" aria-hidden>
                    expand_more
                  </span>
                </button>
                {isOpen && (
                  <div className="lhs-drawer__palette-category-body">
                    <LHSEntityGroup
                      items={cat.items}
                      nodeType="trigger"
                      parentLabel={cat.id === 'Conversation' ? 'Conversation trigger' : cat.id}
                      onItemsChange={
                        allSubItems[cat.id]
                          ? (newItems) => handleSubItemsChange(cat.id, newItems)
                          : undefined
                      }
                      viewOnly={viewOnly}
                      readOnly
                      dragAlwaysVisible
                      inline
                      showTitle={false}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (!activeTriggerGroup) {
      return renderCards(activeTriggerCards, 'trigger', 'trigger');
    }

    const standaloneCards = activeTriggerStandaloneCards.filter(
      (card) => !search || card.label.toLowerCase().includes(search.toLowerCase()),
    );

    return (
      <div className="lhs-drawer__cards lhs-drawer__cards--trigger">
        <TriggerGroup
          group={activeTriggerGroup}
          section="trigger"
          isOpen={eventBasedOpen}
          onToggle={() => {
            setEventBasedOpen((open) => {
              if (open) {
                setExpandedCard(null);
                setExpandedSection(null);
              }
              return !open;
            });
          }}
          renderCardRow={renderCardRow}
          search={search}
          plainHeading={sectionOnly}
        />
        {standaloneCards.map((card) => renderCardRow(card, 'trigger', 'trigger'))}
      </div>
    );
  };

  const renderTasksContent = () => {
    // Floating palette (section-only): Controls-style collapsible categories.
    if (sectionOnly) {
      const q = search.trim().toLowerCase();
      const categories = activeTaskCards
        .filter((card) => card.action === 'chevron')
        .map((card) => {
          const id = card.subKey || card.label;
          const liveItems = allSubItems[id]?.items ?? [];
          const items = liveItems.filter((item) => {
            if (!q) return true;
            const label = typeof item === 'string' ? item : item.label;
            const desc = typeof item === 'string' ? '' : (item.description || '');
            return (
              card.label.toLowerCase().includes(q)
              || String(label).toLowerCase().includes(q)
              || desc.toLowerCase().includes(q)
            );
          });
          return { id, label: card.label, icon: card.icon, items };
        })
        .filter((cat) => !q || cat.items.length > 0 || cat.label.toLowerCase().includes(q));

      const standaloneCards = activeTaskCards
        .filter((card) => card.action === 'drag')
        .filter((card) => !q || card.label.toLowerCase().includes(q));

      if (categories.length === 0 && standaloneCards.length === 0) {
        return <p className="lhs-drawer__section-empty">No tasks match your search</p>;
      }

      return (
        <div className="lhs-drawer__palette-categories">
          {standaloneCards.length > 0 && (
            <div className="lhs-drawer__palette-standalone lhs-drawer__palette-standalone--top">
              {standaloneCards.map((card) => (
                <LHSEntityGroup
                  key={card.label}
                  items={[
                    {
                      label: card.dragLabel || card.label,
                      description: 'Build a custom task for this workflow.',
                      icon: card.icon,
                    },
                  ]}
                  nodeType="task"
                  parentLabel={card.dragLabel || card.label}
                  viewOnly={viewOnly}
                  readOnly
                  dragAlwaysVisible
                  inline
                  showTitle={false}
                />
              ))}
            </div>
          )}
          {categories.map((cat) => {
            const isOpen = paletteCategoryId === cat.id || (q.length > 0 && cat.items.length > 0);
            const isExternalApps = cat.id === EXTERNAL_APPS_TASK_KEY;
            return (
              <div key={cat.id} className={`lhs-drawer__palette-category${isOpen ? ' lhs-drawer__palette-category--open' : ''}`}>
                <button
                  type="button"
                  className="lhs-drawer__palette-category-header"
                  onClick={() => setPaletteCategoryId((id) => (id === cat.id ? null : cat.id))}
                  aria-expanded={isOpen}
                >
                  <span className="material-symbols-outlined lhs-drawer__palette-category-icon" aria-hidden>
                    {cat.icon}
                  </span>
                  <span className="lhs-drawer__palette-category-label">{cat.label}</span>
                  <span className="material-symbols-outlined lhs-drawer__palette-category-chevron" aria-hidden>
                    expand_more
                  </span>
                </button>
                {isOpen && (
                  <div className="lhs-drawer__palette-category-body">
                    {isExternalApps ? (
                      <LHSExternalAppsGroup
                        nodeType="task"
                        parentLabel="External apps"
                        viewOnly={viewOnly}
                        inline
                        showTitle={false}
                      />
                    ) : (
                      <LHSEntityGroup
                        items={cat.items}
                        nodeType="task"
                        parentLabel={cat.label}
                        onItemsChange={(newItems) => handleSubItemsChange(cat.id, newItems)}
                        viewOnly={viewOnly}
                        readOnly
                        dragAlwaysVisible
                        inline
                        showTitle={false}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return renderCards(activeTaskCards, 'task', 'task');
  };

  const renderControlsContent = () => {
    // Section-only (floating palette) — mirror the Trigger/Task panel: collapsible
    // category headers over rich LHSEntityGroup cards (title + description + drag handle).
    if (sectionOnly) {
      const q = search.trim().toLowerCase();
      const matches = (text) => !q || String(text).toLowerCase().includes(q);

      const categories = CONTROL_SECTION_CATEGORIES
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (item) => matches(cat.label) || matches(item.label) || matches(item.description),
          ),
        }))
        .filter((cat) => !q || cat.items.length > 0 || matches(cat.label));

      const standalone = LHS_CONTROL_STANDALONE_CARDS
        .map((card) => ({
          card,
          name: card.dragLabel || card.label,
          description: CONTROL_STANDALONE_DESCRIPTIONS[card.dragLabel || card.label] || '',
        }))
        .filter(({ card }) => matches(card.label));

      if (categories.length === 0 && standalone.length === 0) {
        return <p className="lhs-drawer__section-empty">No controls match your search</p>;
      }

      return (
        <div className="lhs-drawer__palette-categories">
          {categories.map((cat) => {
            const isOpen = paletteCategoryId === cat.id || (q.length > 0 && cat.items.length > 0);
            return (
              <div key={cat.id} className={`lhs-drawer__palette-category${isOpen ? ' lhs-drawer__palette-category--open' : ''}`}>
                <button
                  type="button"
                  className="lhs-drawer__palette-category-header"
                  onClick={() => setPaletteCategoryId((id) => (id === cat.id ? null : cat.id))}
                  aria-expanded={isOpen}
                >
                  <span className="material-symbols-outlined lhs-drawer__palette-category-icon" aria-hidden>
                    {cat.icon}
                  </span>
                  <span className="lhs-drawer__palette-category-label">{cat.label}</span>
                  <span className="material-symbols-outlined lhs-drawer__palette-category-chevron" aria-hidden>
                    expand_more
                  </span>
                </button>
                {isOpen && (
                  <div className="lhs-drawer__palette-category-body">
                    <LHSEntityGroup
                      items={cat.items}
                      nodeType={cat.nodeType}
                      parentLabel={cat.label}
                      viewOnly={viewOnly}
                      readOnly
                      dragAlwaysVisible
                      inline
                      showTitle={false}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {standalone.length > 0 && (
            <div className="lhs-drawer__palette-standalone">
              {standalone.map(({ card, name, description }) => (
                <LHSEntityGroup
                  key={card.label}
                  items={[{ label: card.label, description, icon: card.icon }]}
                  nodeType={card.nodeType}
                  parentLabel={name}
                  viewOnly={viewOnly}
                  readOnly
                  dragAlwaysVisible
                  inline
                  showTitle={false}
                  disabledItems={card.disabled ? [card.label] : null}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    // Tabbed accordion — compact collapsible groups (Delay / Branch) + standalone rows.
    return (
      <div className="lhs-drawer__cards">
        {LHS_CONTROL_GROUPS.map((group) => (
          <TriggerGroup
            key={group.label}
            group={group}
            section="control"
            isOpen={openControlGroup === group.label}
            onToggle={() =>
              setOpenControlGroup((k) => (k === group.label ? null : group.label))
            }
            renderCardRow={renderCardRow}
            search={search}
          />
        ))}
        {LHS_CONTROL_STANDALONE_CARDS.filter(
          (c) => !search || c.label.toLowerCase().includes(search.toLowerCase()),
        ).map((card) => renderCardRow(card, 'control', 'branch'))}
      </div>
    );
  };

  const renderProceduresContent = () => {
    // Floating palette: Controls-style rich standalone cards (title + description + drag).
    if (sectionOnly) {
      const q = search.trim().toLowerCase();
      const cards = activeProcedureCards.filter(
        (card) => !q || card.label.toLowerCase().includes(q),
      );
      if (cards.length === 0) {
        return <p className="lhs-drawer__section-empty">No procedures match your search</p>;
      }
      return (
        <div className="lhs-drawer__palette-categories">
          <div className="lhs-drawer__palette-standalone lhs-drawer__palette-standalone--top">
            {cards.map((card) => {
              const name = card.procedureId || card.dragLabel || card.label;
              const isCustom = card.procedureId === '__custom__' || card.label === 'Custom';
              return (
                <LHSEntityGroup
                  key={card.label}
                  items={[
                    {
                      label: card.label,
                      description: isCustom
                        ? 'Build a custom procedure for this workflow.'
                        : `Add the "${card.label}" procedure to this workflow.`,
                      icon: card.icon || 'menu_book',
                    },
                  ]}
                  nodeType="procedures"
                  parentLabel={isCustom ? '__custom__' : name}
                  viewOnly={viewOnly}
                  readOnly
                  dragAlwaysVisible
                  inline
                  showTitle={false}
                />
              );
            })}
          </div>
        </div>
      );
    }
    return renderCards(activeProcedureCards, 'procedures', 'procedures');
  };

  const triggerContent = renderTriggerContent();
  const tasksContent = renderTasksContent();
  const proceduresContent = renderProceduresContent();
  const controlsContent = renderControlsContent();

  const showExternalAppsDropdown = expandedCard === EXTERNAL_APPS_TASK_KEY;
  const activeSubItems = expandedCard && !showExternalAppsDropdown
    ? allSubItems[expandedCard]
    : null;
  const visibleSubItems = activeSubItems
    ? {
        ...activeSubItems,
        items: filterTaskItemsForAgent(activeSubItems.items, agentName),
      }
    : null;

  const cancelCloseDropdown = () => {
    if (closeDropdownTimerRef.current) {
      clearTimeout(closeDropdownTimerRef.current);
      closeDropdownTimerRef.current = null;
    }
  };

  const closeDropdown = () => {
    cancelCloseDropdown();
    hoverDropdownRef.current = false;
    draggingFromFlyoutRef.current = false;
    setFlyoutDragging(false);
    setExpandedCard(null);
    setExpandedSection(null);
  };

  const scheduleCloseDropdown = () => {
    if (draggingFromFlyoutRef.current) return;
    cancelCloseDropdown();
    closeDropdownTimerRef.current = setTimeout(() => {
      if (!hoverDropdownRef.current && !draggingFromFlyoutRef.current) {
        closeDropdown();
      }
    }, 120);
  };

  const handleDropdownMouseEnter = () => {
    if (draggingFromFlyoutRef.current) return;
    hoverDropdownRef.current = true;
    cancelCloseDropdown();
  };

  const handleDropdownMouseLeave = () => {
    if (draggingFromFlyoutRef.current) return;
    hoverDropdownRef.current = false;
    scheduleCloseDropdown();
  };

  // Hide the flyout visually while dragging, but keep it mounted so HTML5 DnD
  // is not cancelled by unmounting the drag source mid-gesture.
  const handleFlyoutItemDragStart = () => {
    draggingFromFlyoutRef.current = true;
    hoverDropdownRef.current = true;
    cancelCloseDropdown();
    // Defer hide until after the browser has captured the drag source.
    requestAnimationFrame(() => {
      if (draggingFromFlyoutRef.current) setFlyoutDragging(true);
    });

    const finish = () => {
      window.removeEventListener('dragend', finish);
      if (!draggingFromFlyoutRef.current) return;
      draggingFromFlyoutRef.current = false;
      setFlyoutDragging(false);
      closeDropdown();
    };
    window.addEventListener('dragend', finish);
  };

  if (sectionOnly) {
    const SECTION_META = {
      Trigger: {
        iconSrc: iconRrTrigger,
        tone: 'trigger',
        title: 'Trigger',
        content: triggerContent,
        searchPlaceholder: 'Search trigger...',
      },
      Tasks: {
        iconSrc: iconRrTasks,
        tone: 'tasks',
        title: `${actionLabel}s`,
        content: tasksContent,
        searchPlaceholder: `Search ${actionLabel.toLowerCase()}s...`,
      },
      Procedures: {
        iconSrc: iconRrProcedures,
        tone: 'procedures',
        title: 'Procedures',
        content: proceduresContent,
        searchPlaceholder: 'Search procedures...',
      },
      Controls: {
        iconSrc: iconRrControls,
        tone: 'controls',
        title: 'Controls',
        content: controlsContent,
        searchPlaceholder: 'Search controls...',
      },
    };
    const sectionMeta = SECTION_META[forceOpenSection] || SECTION_META.Trigger;

    return (
      <div className="lhs-drawer lhs-drawer--section-only">
        <div className="lhs-drawer__section-header">
          <span className={`lhs-drawer__section-header-icon lhs-drawer__section-header-icon--${sectionMeta.tone}`}>
            <img src={sectionMeta.iconSrc} alt="" width={14} height={14} />
          </span>
          <span className="lhs-drawer__section-header-title">{sectionMeta.title}</span>
          {onCollapse && (
            <button
              type="button"
              className="lhs-drawer__section-header-close"
              onClick={onCollapse}
              aria-label="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>
        <div className="lhs-drawer__search">
          <FormInput
            name="search"
            type="text"
            placeholder={sectionMeta.searchPlaceholder}
            value={search}
            onChange={(e, value) => setSearch(value)}
            showLeftIcon
            customIconClass="icon_phoenix-search-glass"
          />
        </div>
        <div className="lhs-drawer__section-body">
          {sectionMeta.content}
        </div>
      </div>
    );
  }

  return (
    <div className="lhs-drawer" ref={panelRef} onMouseLeave={scheduleCloseDropdown}>
        <div className={`lhs-drawer__tabs${showTabs || onCollapse ? ' lhs-drawer__tabs--visible' : ''}`}>
          {showTabs && (
            <div className="lhs-drawer__tabs-list">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  className={`lhs-drawer__tab${activeTab === tab ? ' lhs-drawer__tab--active' : ''}`}
                  onClick={() => {
                    if (tab !== 'Create with AI' && aiFullscreen) {
                      onAiFullscreenChange?.(false);
                    }
                    setActiveTab(tab);
                  }}
                >
                  <span className="lhs-drawer__tab-label">{tab}</span>
                  <span className="lhs-drawer__tab-underline" />
                </button>
              ))}
            </div>
          )}
          {(onCollapse || (activeTab === 'Create with AI' && (onOpenAiFullscreen || onAiFullscreenChange))) && (
            <div className="lhs-drawer__tab-actions">
              {activeTab === 'Create with AI' && (onOpenAiFullscreen || onAiFullscreenChange) && (
                <Tooltip text={aiFullscreen ? 'Exit full screen' : 'Full screen'} position="bottom">
                  <button
                    className="lhs-drawer__collapse-btn"
                    onClick={() => {
                      if (onOpenAiFullscreen) {
                        onOpenAiFullscreen();
                        return;
                      }
                      onAiFullscreenChange?.(!aiFullscreen);
                    }}
                    type="button"
                    aria-label={aiFullscreen ? 'Exit full screen' : 'Full screen'}
                  >
                    <span className="material-symbols-outlined">
                      {aiFullscreen ? 'close_fullscreen' : 'open_in_full'}
                    </span>
                  </button>
                </Tooltip>
              )}
              {onCollapse && (
                <Tooltip text="Collapse editor" position="bottom">
                  <button
                    className="lhs-drawer__collapse-btn"
                    onClick={() => {
                      if (aiFullscreen) onAiFullscreenChange?.(false);
                      onCollapse();
                    }}
                    type="button"
                    aria-label="Collapse editor"
                  >
                    <span className="material-symbols-outlined">left_panel_close</span>
                  </button>
                </Tooltip>
              )}
            </div>
          )}
        </div>

      {!showAiBody ? (
        <div className="lhs-drawer__body">
          <div className="lhs-drawer__search">
            <FormInput
              name="search"
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e, value) => setSearch(value)}
              showLeftIcon
              customIconClass="icon_phoenix-search-glass"
            />
          </div>

          <div className="lhs-drawer__sections">
            <NodeType title="Trigger" content={triggerContent} isOpen={openSection === 'Trigger'} onToggle={() => toggleSection('Trigger')} />
            <NodeType title="Tasks" content={tasksContent} isOpen={openSection === 'Tasks'} onToggle={() => toggleSection('Tasks')} />
            {isFrontDesk && (
              <NodeType
                title="Procedures"
                content={proceduresContent}
                isOpen={openSection === 'Procedures'}
                onToggle={() => {
                  if (openSection === 'Procedures') setProceduresExpanded(false);
                  toggleSection('Procedures');
                }}
              />
            )}
            <NodeType title="Controls" content={controlsContent} isOpen={openSection === 'Controls'} onToggle={() => toggleSection('Controls')} />
          </div>
        </div>
      ) : (
        <div className="lhs-drawer__ai-body">
          <div className="lhs-drawer__ai-chat-area">
            {aiTrail.length > 0 || aiTranscript?.trail?.length || aiTranscript?.prompt ? (
              <div className="lhs-drawer__ai-transcript">
                {(aiTrail.length > 0
                  ? aiTrail
                  : aiTranscript?.trail?.length
                    ? aiTranscript.trail
                    : null
                )?.map((turn, i) => {
                      if (turn.kind === 'user') {
                        return (
                          <div key={i} className="lhs-drawer__ai-user-msg">
                            {turn.text}
                          </div>
                        )
                      }
                      if (turn.kind === 'user-files') {
                        return (
                          <div key={i} className="lhs-drawer__ai-user-files">
                            {turn.labels.map((label) => (
                              <span key={label} className="lhs-drawer__ai-file-chip">
                                {label}
                              </span>
                            ))}
                          </div>
                        )
                      }
                      if (turn.kind === 'thoughts') {
                        return (
                          <details key={i} className="lhs-drawer__ai-thoughts">
                            <summary>{turn.label || 'Thoughts'}</summary>
                            <pre className="lhs-drawer__ai-thoughts-body">{turn.text}</pre>
                          </details>
                        )
                      }
                      if (turn.kind === 'agent') {
                        return (
                          <AIChatBubble
                            key={i}
                            message={(turn.paragraphs || []).join('\n')}
                          />
                        )
                      }
                      if (turn.kind === 'status') {
                        return (
                          <div key={i} className="lhs-drawer__ai-status">
                            {turn.text}
                          </div>
                        )
                      }
                      if (turn.kind === 'draft') {
                        return (
                          <div key={i} className="lhs-drawer__ai-draft-card">
                            <span className="material-symbols-outlined">account_tree</span>
                            <div>
                              <div className="lhs-drawer__ai-draft-title">{turn.title}</div>
                              {turn.description && (
                                <div className="lhs-drawer__ai-draft-desc">{turn.description}</div>
                              )}
                            </div>
                          </div>
                        )
                      }
                      return null
                    })
                  ?? (
                    <>
                      <div className="lhs-drawer__ai-user-msg">{aiTranscript.prompt}</div>
                      {(aiTranscript.replies ?? []).map((paragraphs, replyIndex) => (
                        <AIChatBubble
                          key={replyIndex}
                          message={Array.isArray(paragraphs) ? paragraphs.join('\n') : String(paragraphs)}
                        />
                      ))}
                      {aiTranscript.draftTitle && (
                        <div className="lhs-drawer__ai-draft-card">
                          <span className="material-symbols-outlined">account_tree</span>
                          <div>
                            <div className="lhs-drawer__ai-draft-title">{aiTranscript.draftTitle}</div>
                            {aiTranscript.draftDescription && (
                              <div className="lhs-drawer__ai-draft-desc">{aiTranscript.draftDescription}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
              </div>
            ) : (
              <AIChatBubble
                message={
                  existingAgent
                    ? "Hi! I'm here to help you. Tell me what you'd like to do"
                    : `Hi! I'm here to help you build your ${agentName || 'Review response'} agent. Tell me what you'd like to build`
                }
                options={existingAgent ? getExistingAgentAiOptions(agentName) : BUILD_AI_OPTIONS}
                onOptionSelect={handleAiSend}
              />
            )}
          </div>
          <PromptComposer
            value={aiInputValue}
            onChange={setAiInputValue}
            onSend={() => {
              handleAiSend(aiInputValue);
              setAiInputValue('');
              onClearNodeContext?.();
            }}
            placeholder={
              nodeContext
                ? `What would you like to modify in this ${nodeContext.type === 'trigger' ? 'trigger' : nodeContext.type === 'task' ? 'task' : 'step'}?`
                : existingAgent
                  ? 'What would you like to do?'
                  : 'What would you like to build? For example: Review response agent replying autonomously.'
            }
            attachments={nodeContext ? [{ id: nodeContext.id, kind: 'context', label: nodeContext.title }] : []}
            onRemoveAttachment={() => onClearNodeContext?.()}
            rows={2}
          />
        </div>
      )}

      {(visibleSubItems || showExternalAppsDropdown) && (
        <div
          className={`lhs-drawer__dropdown-zone${flyoutDragging ? ' lhs-drawer__dropdown-zone--dragging' : ''}`}
          style={{ top: dropdownTop }}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        >
          <div className="lhs-drawer__dropdown-bridge" />
          {showExternalAppsDropdown ? (
            <LHSExternalAppsGroup
              nodeType={expandedSection === 'trigger' ? 'trigger' : 'task'}
              parentLabel="External apps"
              viewOnly={viewOnly}
              onDragStartItem={handleFlyoutItemDragStart}
            />
          ) : (
            <LHSEntityGroup
              title={visibleSubItems.title}
              items={visibleSubItems.items}
              nodeType={expandedSection === 'trigger' ? 'trigger' : expandedSection === 'procedures' ? 'procedures' : 'task'}
              parentLabel={expandedCard}
              onItemsChange={(newItems) => handleSubItemsChange(expandedCard, newItems)}
              onDragStartItem={handleFlyoutItemDragStart}
              viewOnly={viewOnly}
              readOnly={
                (expandedSection === 'trigger' && READONLY_TRIGGER_SUBMENUS.has(expandedCard))
                || (expandedSection === 'task' && READONLY_TASK_SUBMENUS.has(expandedCard))
              }
              dragAlwaysVisible={
                (expandedSection === 'trigger' && READONLY_TRIGGER_SUBMENUS.has(expandedCard))
                || (expandedSection === 'task' && READONLY_TASK_SUBMENUS.has(expandedCard))
              }
              disabledItems={DISABLED_TASK_SUB_ITEMS}
            />
          )}
        </div>
      )}
    </div>
  );
}
