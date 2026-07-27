import React, { useState, useRef, useEffect } from 'react';
import { FormInput, Tooltip } from '../elemental-stubs';
import NodeType from '../Organisms/Accordion/NodeType/NodeType';
import AIChatBubble from '../Molecules/AIChatBubble/AIChatBubble';
import AIPromptBox from '../Molecules/AIPromptBox/AIPromptBox';

// Uploaded procedure.svg icon — used for all procedure category cards
const ProcedureSvgIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M19.7996 6.30078H14.3996C13.9339 6.30078 13.4745 6.40922 13.058 6.6175C12.6414 6.82578 12.279 7.12819 11.9996 7.50078C11.7202 7.12819 11.3578 6.82578 10.9412 6.6175C10.5247 6.40922 10.0653 6.30078 9.59961 6.30078H4.19961C4.04048 6.30078 3.88787 6.364 3.77535 6.47652C3.66282 6.58904 3.59961 6.74165 3.59961 6.90078V17.7008C3.59961 17.8599 3.66282 18.0125 3.77535 18.125C3.88787 18.2376 4.04048 18.3008 4.19961 18.3008H9.59961C10.077 18.3008 10.5348 18.4904 10.8724 18.828C11.21 19.1656 11.3996 19.6234 11.3996 20.1008C11.3996 20.2599 11.4628 20.4125 11.5753 20.525C11.6879 20.6376 11.8405 20.7008 11.9996 20.7008C12.1587 20.7008 12.3114 20.6376 12.4239 20.525C12.5364 20.4125 12.5996 20.2599 12.5996 20.1008C12.5996 19.6234 12.7893 19.1656 13.1268 18.828C13.4644 18.4904 13.9222 18.3008 14.3996 18.3008H19.7996C19.9587 18.3008 20.1114 18.2376 20.2239 18.125C20.3364 18.0125 20.3996 17.8599 20.3996 17.7008V6.90078C20.3996 6.74165 20.3364 6.58904 20.2239 6.47652C20.1114 6.364 19.9587 6.30078 19.7996 6.30078ZM9.59961 17.1008H4.79961V7.50078H9.59961C10.077 7.50078 10.5348 7.69042 10.8724 8.02799C11.21 8.36555 11.3996 8.82339 11.3996 9.30078V17.7008C10.8808 17.3104 10.2489 17.0997 9.59961 17.1008ZM19.1996 17.1008H14.3996C13.7503 17.0997 13.1184 17.3104 12.5996 17.7008V9.30078C12.5996 8.82339 12.7893 8.36555 13.1268 8.02799C13.4644 7.69042 13.9222 7.50078 14.3996 7.50078H19.1996V17.1008Z" fill="currentColor"/>
  </svg>
);
// AI sparkle icon — inline SVG replaces the elemental asset import
const AiSparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
    <path d="M10 2L11.5 7.5L17 9L11.5 10.5L10 16L8.5 10.5L3 9L8.5 7.5L10 2Z" fill="#7C3AED" />
    <path d="M16 1L16.8 3.2L19 4L16.8 4.8L16 7L15.2 4.8L13 4L15.2 3.2L16 1Z" fill="#7C3AED" />
    <path d="M4 13L4.6 14.8L6.5 15.5L4.6 16.2L4 18L3.4 16.2L1.5 15.5L3.4 14.8L4 13Z" fill="#7C3AED" />
  </svg>
);
import LHSEntityGroup from '../Molecules/LHS/LHSEntityGroup/LHSEntityGroup';
import LHSExternalAppsGroup from '../Molecules/LHS/LHSExternalAppsGroup/LHSExternalAppsGroup';
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
    title: 'Review event',
    items: [
      'When a new review is received',
      'When a review is updated',
      'When a review is responded',
      'When a new review is received or updated',
    ],
  },
  Inbox: {
    title: 'Inbox event',
    items: [
      'When a new message is received',
      'When a conversation is assigned',
      'When a conversation is closed',
    ],
  },
  Listings: {
    title: 'Listing event',
    items: [
      'When a listing is updated',
      'When a new listing is added',
      'When listing data changes',
    ],
  },
  Social: {
    title: 'Social event',
    items: [
      'When a new post is published',
      'When a comment is received',
      'When a mention is detected',
    ],
  },
  Surveys: {
    title: 'Survey event',
    items: [
      'When a survey response is received',
      'When a survey is completed',
      'When survey score changes',
    ],
  },
  Ticketing: {
    title: 'Ticketing event',
    items: [
      'When a new ticket is created',
      'When a ticket is updated',
      'When a ticket is resolved',
    ],
  },
  'External apps': {
    title: 'External app event',
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

export { AUTOMOTIVE_TASK_SUB_ITEMS };

export const INITIATE_VOICE_CALL_TASK = 'Initiate voice call';

/** True for "Front desk agent" and regional instances (e.g. "Front desk agent - North region"). */
export function isFrontDeskAgent(agentName = '') {
  const base = String(agentName).replace(/ - .+$/, '').trim();
  return base === 'Front desk agent';
}

/** Remove task sub-items unavailable for the current agent. */
export function filterTaskItemsForAgent(items = [], agentName = '') {
  if (!isFrontDeskAgent(agentName)) return items;
  return items.filter((item) => item !== INITIATE_VOICE_CALL_TASK);
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

const READONLY_TRIGGER_SUBMENUS = new Set(['Contact-trigger', 'Appointment-trigger']);
const READONLY_TASK_SUBMENUS = new Set(['Conversation', 'Contact', 'Appointment']);
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
  { label: 'Loop', icon: 'repeat', action: 'drag', nodeType: 'loop' },
  {
    label: 'Sub-agent (TBD)',
    dragLabel: 'Sub-agent',
    icon: 'smart_toy',
    action: 'drag',
    nodeType: 'subagent',
    disabled: true,
  },
];

/** Sub-items for the canvas add-step menu, keyed by product. */
export function getTaskSubItems(product = 'automotive', agentName = '') {
  const isHC = product === 'healthcare' || product === 'dental';
  const base = isHC ? HEALTHCARE_TASK_SUB_ITEMS : AUTOMOTIVE_TASK_SUB_ITEMS;
  return filterTaskSubItemsMap(base, agentName);
}

/** Task cards for the canvas add-step menu (excludes External apps for a cleaner popover). */
export function getAddStepTaskCards(product = 'automotive') {
  const isHC = product === 'healthcare' || product === 'dental';
  const cards = isHC ? HEALTHCARE_TASK_CARDS : AUTOMOTIVE_TASK_CARDS;
  return cards.filter((c) => c.subKey !== 'External apps-task');
}

/** Control cards shown in the add-step popover (matches Figma: Branch + Delay). */
export function getAddStepControlCards() {
  return CONTROL_CARDS.filter((c) => c.nodeType === 'branch' || c.nodeType === 'delay');
}

/* ─── Trigger + task sub-items (mutable state; procedures are derived dynamically) ─── */
function buildInitialSubItems(isHC) {
  const taskSubItems = isHC ? HEALTHCARE_TASK_SUB_ITEMS : AUTOMOTIVE_TASK_SUB_ITEMS;
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
    e.dataTransfer.setData('application/reactflow-type', nodeType);
    // For procedure cards, use the procedureId as the label so AgentBuilder
    // can seed the first procedureIds entry correctly
    e.dataTransfer.setData('application/reactflow-label', procedureId || dragLabel || label);
    e.dataTransfer.setData('application/reactflow-description', label);
    e.dataTransfer.effectAllowed = 'copy';
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
          <span className="material-symbols-outlined">expand_more</span>
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
}) {
  const filteredCards = group.cards.filter(
    (card) => !search || card.label.toLowerCase().includes(search.toLowerCase()),
  );
  const showGroup = filteredCards.length > 0 || !search;
  if (!showGroup) return null;

  const isExpanded = isOpen || (search.length > 0 && filteredCards.length > 0);

  return (
    <div className={`lhs-drawer__trigger-group${isExpanded ? ' lhs-drawer__trigger-group--open' : ''}`}>
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
      {isExpanded && (
        <div className="lhs-drawer__trigger-group-items">
          {filteredCards.map((card) => renderCardRow(card, section, 'trigger'))}
        </div>
      )}
    </div>
  );
}

const TABS = ['Create with AI', 'Create manually'];

const AI_OPTIONS = [
  'Replying using templates',
  'Replying autonomously',
  'Replying after human approval',
  'Suggesting replies in dashboard',
];

export default function LHSDrawer({
  defaultTab = 'Create manually',
  defaultOpenSection = 'Tasks',
  viewOnly = false,
  product = 'automotive',
  agentName = '',
  procedures = null,
  onProcedureClick = null,
  onCollapse = null,
}) {
  const isHC = product === 'healthcare' || product === 'dental';

  const activeTriggerCards = isHC ? HEALTHCARE_TRIGGER_CARDS : AUTOMOTIVE_TRIGGER_CARDS;
  const activeTriggerGroup = isHC ? HEALTHCARE_TRIGGER_GROUP : null;
  const activeTriggerStandaloneCards = isHC ? HEALTHCARE_TRIGGER_STANDALONE_CARDS : [];
  const activeTaskCards = isHC ? HEALTHCARE_TASK_CARDS : AUTOMOTIVE_TASK_CARDS;

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
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [openSection, setOpenSection] = useState(defaultOpenSection);
  const toggleSection = (section) =>
    setOpenSection((prev) => (prev === section ? null : section));
  const [search, setSearch] = useState('');
  const [proceduresExpanded, setProceduresExpanded] = useState(false);
  const [eventBasedOpen, setEventBasedOpen] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [dropdownTop, setDropdownTop] = useState(0);
  const [subItems, setSubItems] = useState(() => buildInitialSubItems(isHC));
  const panelRef = useRef(null);
  const cardRefs = useRef({});
  const closeDropdownTimerRef = useRef(null);
  const hoverDropdownRef = useRef(false);

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
    if (expandedCard === key && expandedSection === section) {
      closeDropdown();
      return;
    }
    openCardDropdown(card, section, subKey);
  };

  const renderCardRow = (card, section, nodeType) => {
    const subKey = card.subKey || card.label;
    return (
      <div key={card.label} className="lhs-drawer__card-wrapper">
        <CardRow
          label={card.label}
          icon={card.icon}
          svgIcon={card.svgIcon}
          action={card.action}
          nodeType={card.nodeType || nodeType}
          isActive={expandedCard === subKey && expandedSection === section}
          onClick={() => handleCardClick(card, section, card.subKey)}
          onHover={() => handleCardHover(card, section, card.subKey)}
          cardRef={(el) => { cardRefs.current[`${section}-${card.label}`] = el; }}
          viewOnly={viewOnly}
          procedureId={card.procedureId}
          dragLabel={card.dragLabel}
          disabled={card.disabled}
        />
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
          onToggle={() => setEventBasedOpen((open) => !open)}
          renderCardRow={renderCardRow}
          search={search}
        />
        {standaloneCards.map((card) => renderCardRow(card, 'trigger', 'trigger'))}
      </div>
    );
  };

  const triggerContent = renderTriggerContent();
  const tasksContent = renderCards(activeTaskCards, 'task', 'task');
  const proceduresContent = renderCards(activeProcedureCards, 'procedures', 'procedures');
  const controlsContent = renderCards(CONTROL_CARDS, 'control', 'branch');

  const allSubItems = { ...subItems, ...procedureSubItems };
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
    setExpandedCard(null);
    setExpandedSection(null);
  };

  const scheduleCloseDropdown = () => {
    cancelCloseDropdown();
    closeDropdownTimerRef.current = setTimeout(() => {
      if (!hoverDropdownRef.current) {
        closeDropdown();
      }
    }, 120);
  };

  const handleDropdownMouseEnter = () => {
    hoverDropdownRef.current = true;
    cancelCloseDropdown();
  };

  const handleDropdownMouseLeave = () => {
    hoverDropdownRef.current = false;
    scheduleCloseDropdown();
  };

  return (
    <div className="lhs-drawer" ref={panelRef} onMouseLeave={scheduleCloseDropdown}>
      <div className="lhs-drawer__tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`lhs-drawer__tab${activeTab === tab ? ' lhs-drawer__tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            <span className="lhs-drawer__tab-label">
              {tab === 'Create with AI' ? (
                <>Create with <AiSparkleIcon /></>
              ) : tab}
            </span>
            <span className="lhs-drawer__tab-underline" />
          </button>
        ))}
      </div>

      {activeTab === 'Create manually' ? (
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
            {onCollapse && (
              <Tooltip text="Collapse editor" position="bottom">
                <button
                  className="lhs-drawer__collapse-btn"
                  onClick={onCollapse}
                  type="button"
                  aria-label="Collapse editor"
                >
                  <span className="material-symbols-outlined">left_panel_close</span>
                </button>
              </Tooltip>
            )}
          </div>

          <div className="lhs-drawer__sections">
            <NodeType title="Trigger" content={triggerContent} isOpen={openSection === 'Trigger'} onToggle={() => toggleSection('Trigger')} />
            <NodeType title="Tasks" content={tasksContent} isOpen={openSection === 'Tasks'} onToggle={() => toggleSection('Tasks')} />
            <NodeType
              title="Procedures"
              content={proceduresContent}
              isOpen={openSection === 'Procedures'}
              onToggle={() => {
                if (openSection === 'Procedures') setProceduresExpanded(false);
                toggleSection('Procedures');
              }}
            />
            <NodeType title="Controls" content={controlsContent} isOpen={openSection === 'Controls'} onToggle={() => toggleSection('Controls')} />
          </div>
        </div>
      ) : (
        <div className="lhs-drawer__ai-body">
          <div className="lhs-drawer__ai-chat-area">
            <AIChatBubble
              message="Hi! I'm here to help you build your Review response agent. Tell me what you'd like to build"
              options={AI_OPTIONS}
            />
          </div>
          <AIPromptBox onSend={() => {}} />
        </div>
      )}

      {(visibleSubItems || showExternalAppsDropdown) && (
        <div
          className="lhs-drawer__dropdown-zone"
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
            />
          ) : (
            <LHSEntityGroup
              title={visibleSubItems.title}
              items={visibleSubItems.items}
              nodeType={expandedSection === 'trigger' ? 'trigger' : expandedSection === 'procedures' ? 'procedures' : 'task'}
              parentLabel={expandedCard}
              onItemsChange={(newItems) => handleSubItemsChange(expandedCard, newItems)}
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
