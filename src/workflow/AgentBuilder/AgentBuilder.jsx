import React, { useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import LHSDrawer, {
  isFrontDeskAgent as agentNameIsFrontDesk,
  isFrontDeskCanvasAgent,
  INITIATE_VOICE_CALL_TASK,
  REVIEWS_TASK_SUB_ITEMS,
  DELAY_VARIANT_PRESETS,
} from '../LHSDrawer/LHSDrawer';
import FlowCanvas from '../FlowCanvas/FlowCanvas';
import RHS from '../Organisms/Panels/RHS/RHS';
import ScheduleBased from '../Molecules/RHS/Trigger/ScheduleBased/ScheduleBased';
import ShareModal from '../Organisms/Modals/ShareModal/ShareModal';
import EmptyStates from '../Patterns/EmptyStates/EmptyStates';
import { Button } from '../elemental-stubs';
import { saveAgent, deleteAgent, getAgentBySlug, getCachedAgent, saveCustomTool, getCustomTools, getCustomToolsByIds, getSeedTools } from '../services/agentService';
import CustomToolViewer from '../Organisms/Drawers/CustomToolViewer/CustomToolViewer';
import PreviewPanel from '../Molecules/PreviewPanel/PreviewPanel';
import { BookTestAppointmentModal } from '../../components/BookTestAppointmentModal/BookTestAppointmentModal';
import { formatSelectByCanvasSubtitle } from '../RHSDrawer/LocationsDrawer.jsx';
import { AiAssistPanel } from '../../components/AiAssistPanel/AiAssistPanel';
import { HelpCenterPanel } from '../../components/HelpCenterPanel/HelpCenterPanel';
import { GlossaryModal } from '../../components/HelpCenterPanel/GlossaryModal';
import { WorkflowCoachTour } from '../../components/WorkflowCoachTour/WorkflowCoachTour';
import ReminderToolDrawer from '../Organisms/Drawers/ReminderToolDrawer/ReminderToolDrawer';
import VoiceCallToolDrawer from '../Organisms/Drawers/VoiceCallToolDrawer/VoiceCallToolDrawer';
import TransferToolDrawer from '../Organisms/Drawers/TransferToolDrawer/TransferToolDrawer';
import QueryConfigDrawer from '../Organisms/Drawers/QueryConfigDrawer/QueryConfigDrawer';
import AssignContactStatusDrawer from '../Organisms/Drawers/AssignContactStatusDrawer/AssignContactStatusDrawer';
import AssignConversationDrawer from '../Organisms/Drawers/AssignConversationDrawer/AssignConversationDrawer';
import AssignConversationStatusDrawer from '../Organisms/Drawers/AssignConversationStatusDrawer/AssignConversationStatusDrawer';
import HandleResponseDrawer, { isHandleResponseConfigComplete } from '../Organisms/Drawers/HandleResponseDrawer/HandleResponseDrawer';
import ToolLibraryDrawer from '../Organisms/Drawers/ToolLibraryDrawer/ToolLibraryDrawer';
import AddToolDrawer from '../Organisms/Drawers/AddToolDrawer/AddToolDrawer';
import {
  getProcedureById,
  getProcedureDetailContent,
  resolveProcedurePanelText,
  PROCEDURES,
  setLiveProcedures,
  CUSTOM_PROCEDURE_ID,
  isCustomProcedureId,
} from '../services/procedureService';
import { getModuleNav } from '../Modules/moduleNavigation';
import {
  FLOW_NODE_STEP,
  FLOW_START_GAP,
  FLOW_STANDARD_NODE_HEIGHT,
  FLOW_CONNECTOR_GAP,
  FLOW_START_NODE_HEIGHT,
  FLOW_TRIGGER_PLACEHOLDER_HEIGHT,
} from '../flowLayoutConstants';
import { computeLoopCanvasHeight, computeLoopBodyHeight } from '../Molecules/Canvas/LoopNode/LoopNode';
import iconRrTrigger from '../../assets/rr-chrome/icon-trigger.svg';
import iconRrTasks from '../../assets/rr-chrome/icon-tasks.svg';
import iconRrProcedures from '../../assets/rr-chrome/icon-procedures.svg';
import iconRrControls from '../../assets/rr-chrome/icon-controls.svg';
import iconRrPreview from '../../assets/rr-chrome/icon-preview.svg';
import iconAgentsPurple from '../../assets/icon-agents-purple.svg';
import { Tooltip } from '../../components/Tooltip/Tooltip';
import { Icon } from '../../components/Icon/Icon';
import { AiBuilderPanel } from '../../components/AiBuilderPanel/AiBuilderPanel';
import { TestRunPanel } from '../../components/TestRunPanel/TestRunPanel';
import { Toast } from '../../components/Toast/Toast';
import { buildTestRunSteps } from '../../data/testRunSteps';
import { useTestRun } from '../../hooks/useTestRun';
import { getAgentIssues } from '../../data/agentIssues';
import VersionHistoryPanel, { DEFAULT_VERSIONS as VERSION_HISTORY_VERSIONS, DRAFT_VERSION } from './VersionHistoryPanel';
import './AgentBuilder.css';

const START_NODE_ID = '__start__';
/* Stable identity — `useTestRun` restarts whenever its `steps` reference changes. */
const EMPTY_TEST_RUN_STEPS = [];
const END_NODE_ID = '__end__';
// Synthetic node (not part of nodeList) that reserves step 1 for the trigger while none exists.
const TRIGGER_PLACEHOLDER_ID = '__trigger_placeholder__';

/** RR chrome header title — ellipsizes past a fixed max width; full name on hover only when truncated. */
function RrChromeAgentTitle({ text, onClick }) {
  const textRef = useRef(null);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const check = () => {
      setTruncated(el.scrollWidth > el.clientWidth + 1);
    };

    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [text]);

  return (
    <Tooltip
      content={text}
      variant="detail"
      side="bottom"
      className="rr-chrome-top__title-tip"
      disabled={!truncated}
    >
      {onClick ? (
        <button
          type="button"
          className="ab-header-title ab-header-title--button"
          onClick={onClick}
          aria-label={`Open agent details for ${text}`}
        >
          <span ref={textRef} className="ab-header-title__text">
            {text}
          </span>
          <span className="material-symbols-outlined ab-header-title__edit" aria-hidden>
            edit
          </span>
        </button>
      ) : (
        <span ref={textRef} className="ab-header-title">
          {text}
        </span>
      )}
    </Tooltip>
  );
}

/* ─── Error boundary for RHS panel — prevents blank screen on render error ─── */
class RHSErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[RHS panel error]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', width: 390, height: '100%',
          background: '#fff', borderLeft: '1px solid #e5e9f0',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: 24, boxSizing: 'border-box',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#de1b0c' }}>error</span>
          <span style={{ fontSize: 13, color: '#555', fontFamily: '"Roboto", sans-serif', textAlign: 'center' }}>
            Could not render this panel.
          </span>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 4, fontSize: 12, color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Canonical name/description shown immediately when a Reviews "Event based" leaf item
// is dropped as a trigger (Review response / Review generation agents only — see
// handleDropNode). The last entry matches REVIEW_RESPONSE_WORKFLOW's rr-1 node verbatim.
const REVIEWS_TRIGGER_LEAF_COPY = {
  'When a new review is received': 'Agent triggers when a new review is received across all sources and locations.',
  'When a review is updated': 'Agent triggers when an existing review is updated across all sources and locations.',
  'When a review is responded': 'Agent triggers when a review receives a response across all sources and locations.',
  'When a new review is received or updated': 'Agent triggers on new or updated reviews across all sources and locations.',
};

function makeNodeDetails(type, label) {
  if (type === 'trigger' && label === 'Schedule-based') {
    return {
      triggerName: '',
      description: '',
      frequency: 'Daily',
      day: '7 days',
      time: '9:00 AM',
    };
  }
  if (type === 'trigger') {
    return {
      triggerName: '',
      description: '',
      conditions: [],
    };
  }
  if (type === 'procedures') {
    if (isCustomProcedureId(label)) {
      return {
        procedureIds: [CUSTOM_PROCEDURE_ID],
        procedureOverrides: {
          [CUSTOM_PROCEDURE_ID]: {
            name: 'Custom',
            whenToUse: '',
            stepsText: '',
            contextChips: [],
            addToLibrary: false,
          },
        },
      };
    }
    const firstId = label && label !== 'Custom' ? label : null;
    return { procedureIds: firstId ? [firstId] : [] };
  }
  if (type === 'branch') {
    return {
      basedOn: 'conditions',
      branchNodeTitle: 'Based on conditions',
      description: 'Build condition-specific flows',
      mergeBranches: true,
      // Paths are fully seeded on drop (with node-scoped ids). Keep a named
      // placeholder here so the RHS never opens on an empty Branches list.
      branches: [
        { id: 'pending-path-1', name: 'Branch 1' },
        { id: 'pending-path-fallback', name: 'Fallback branch', isFallback: true },
      ],
    };
  }
  if (type === 'subagent') return { selectedAgent: '', name: '', description: '' };
  if (type === 'delay') return { name: '', duration: '', unit: '' };
  if (type === 'parallel') return { nodeName: '', description: '', branches: [{ name: '' }, { name: '' }] };
  if (type === 'loop') return { name: '', description: '', loopMode: 'manual', loopOver: null };
  if (label === 'Custom') {
    return {
      taskName: '',
      description: '',
      llmModel: 'Fast',
      systemPrompt: '',
      userPrompt: '',
    };
  }
  return {
    taskName: '',
    description: '',
  };
}

/** Seed canvas/RHS description (and optional tools) from the LHS palette leaf name. */
function reviewsTaskDropDefaults() {
  const defaults = {};
  Object.values(REVIEWS_TASK_SUB_ITEMS).forEach((group) => {
    (group.items || []).forEach((item) => {
      if (!item?.label || !item?.description) return;
      defaults[item.label] = { description: item.description };
    });
  });
  return defaults;
}

const TASK_DROP_DEFAULTS = {
  'Initiate voice call': { description: 'Call the customer' },
  'Send text during call': { description: 'Sends a text message to the caller during an active call', selectedTools: ['in-call-sms'] },
  'In-call SMS': { description: 'Sends a text message to the caller during an active call', selectedTools: ['in-call-sms'] },
  'Send response': { description: 'Sends the drafted response to the contact', selectedTools: ['send-response'] },
  'Schedule appointment': { description: 'Books a new appointment for the patient' },
  'Book new appointment': { description: 'Books a new appointment for the patient' },
  'Reschedule appointment': { description: 'Changes an existing appointment date or time' },
  'Cancel appointment': { description: 'Cancels a scheduled appointment' },
  'Confirm appointment': { description: 'Confirms appointment details with the patient' },
  'Appointment reminder': { description: '3 weeks, 3 days and 24 hours before · Email & text', selectedTools: ['reminder-tool'] },
  'Update contact property': { description: 'Updates a field on the contact record' },
  'Add contact to list': { description: 'Adds the contact to a marketing or CRM list' },
  'Remove contact from list': { description: 'Removes the contact from a list' },
  'Create Zendesk ticket': { description: 'Creates a ticket in Zendesk' },
  Zendesk: { description: 'Creates a ticket in Zendesk' },
  FreshDesk: { description: 'FreshDesk CRM tool' },
  'QuickBooks Online': { description: 'QuickBooks tool' },
  ServiceTitan: { description: 'ServiceTitan CRM tool' },
  'Send data to external app': { description: 'Push data to a connected external application' },
  'Fetch data from external app': { description: 'Retrieve data from a connected external application' },
  'Trigger external webhook': { description: 'Fire a webhook to an external system' },
  // Legacy leaf names still used by older workflows / add-step shortcuts
  'Extract review details': {
    description:
      'Identifies what the reviewer means, matches it to the business\'s terms, scores severity, and flags staff or competitors mentioned',
  },
  'Review details extraction': {
    description:
      'Identifies what the reviewer means, matches it to the business\'s terms, scores severity, and flags staff or competitors mentioned',
  },
  'Review responder': { description: 'Reply to the review using the generated response' },
  'Message assembly': {
    description:
      'Combine the crafted approach, extracted insights, and brand voice to create the final reply.',
  },
  'Create ticket': { description: 'Open a support ticket from the review so the right team can follow up.' },
  'Update ticket': { description: 'Update an existing ticket with the latest review context and status.' },
  'Enroll in campaign': { description: 'Add the contact to a review or recovery campaign sequence.' },
  'Send referral invite': { description: 'Invite happy reviewers to refer friends or leave additional feedback.' },
  'Send survey': { description: 'Send a follow-up survey after a review to capture more structured feedback.' },
  // Reviews AI palette copy is the source of truth for leaf descriptions
  ...reviewsTaskDropDefaults(),
  // Tool pre-selection overrides (keep LHS description from the spread above)
  'Assign tags': {
    description: 'Add tags to a review',
    selectedTools: ['assign-tags'],
  },
  'Generate response': {
    description:
      'Assembles the response using the drafted strategy, extracted details, and brand voice',
  },
  'Publish response': {
    description:
      'Sends the response automatically or holds it for approval',
    selectedTools: ['handle-response'],
  },
  'Route response for approval or publish': {
    description:
      'Sends the response automatically or holds it for approval',
    selectedTools: ['handle-response'],
  },
  'Handle response': {
    description:
      'Sends the response automatically or holds it for approval',
    selectedTools: ['handle-response'],
  },
};

function makeNodeConfig(id, type, label, description) {
  let flowType = 'task';
  let hasAiIcon = false;
  let titlePlaceholder = 'Enter name';
  let descriptionPlaceholder = 'Enter description';

  if (type === 'trigger') {
    flowType = 'trigger';
    titlePlaceholder = 'Enter trigger name';
  } else if (type === 'branch') {
    flowType = 'branch';
    titlePlaceholder = 'Enter branch name';
  } else if (type === 'subagent') {
    flowType = 'subagent';
    titlePlaceholder = 'Call subagent';
    descriptionPlaceholder = 'Call subagent workflow.';
  } else if (type === 'delay') {
    flowType = 'delay';
    titlePlaceholder = 'Configure delay settings';
    descriptionPlaceholder = 'Wait for specific time or event.';
  } else if (type === 'parallel') {
    flowType = 'parallel';
  } else if (type === 'loop') {
    flowType = 'loop';
  } else if (type === 'voiceCall') {
    flowType = 'voiceCall';
    titlePlaceholder = 'Enter name';
  } else if (type === 'procedures') {
    flowType = 'procedures';
  } else if (type === 'task') {
    flowType = 'task';
    hasAiIcon = label === 'Custom';
    titlePlaceholder = 'Enter task name';
  }

  return {
    id,
    flowType,
    data: {
      title: '',
      headerLabel: type === 'trigger' && label === 'Schedule-based' ? 'Schedule-based trigger' : undefined,
      subtype: label,
      stepNumber: null,
      description,
      subtitle: '',
      titlePlaceholder,
      descriptionPlaceholder,
      hasAiIcon,
      hasToggle: type !== 'trigger',
      toggleEnabled: true,
    },
  };
}

const PROCEDURE_CARD_INNER_WIDTH = 376; // 400px card minus horizontal padding
const PROCEDURE_SHELL_HEIGHT = 94; // padding + header + step + body gaps (excludes chip grid)
const PROCEDURE_CHIP_HEIGHT = 30;
const PROCEDURE_CHIP_ROW_GAP = 8;
const PROCEDURE_CHIP_BASE_WIDTH = 56; // icon + padding + close + gaps
const PROCEDURE_CHIP_CHAR_WIDTH = 7; // ~13px nowrap label

/** Estimate a single chip's width for flex-wrap row packing (matches ProceduresNode layout). */
function estimateProcedureChipWidth(name = '') {
  return PROCEDURE_CHIP_BASE_WIDTH + name.length * PROCEDURE_CHIP_CHAR_WIDTH;
}

/** Pack chips into rows the same way flex-wrap does inside the 400px procedure card. */
function countProcedureChipRows(procedureIds = [], nodeDetails, nodeId, product) {
  const items = mapProcedureItems(procedureIds, nodeDetails, nodeId, product);
  if (!items.length) return 0;

  let rows = 1;
  let rowUsed = 0;
  items.forEach(({ name }) => {
    const chipWidth = estimateProcedureChipWidth(name);
    const gap = rowUsed > 0 ? PROCEDURE_CHIP_ROW_GAP : 0;
    if (rowUsed > 0 && rowUsed + gap + chipWidth > PROCEDURE_CARD_INNER_WIDTH) {
      rows += 1;
      rowUsed = chipWidth;
    } else {
      rowUsed += gap + chipWidth;
    }
  });
  return rows;
}

function estimateProceduresNodeHeight(procedureIds = [], nodeDetails, nodeId, product) {
  const rows = countProcedureChipRows(procedureIds, nodeDetails, nodeId, product);
  if (rows === 0) return PROCEDURE_SHELL_HEIGHT + 20;
  const chipBlock = rows * PROCEDURE_CHIP_HEIGHT + Math.max(0, rows - 1) * PROCEDURE_CHIP_ROW_GAP;
  return PROCEDURE_SHELL_HEIGHT + chipBlock;
}

const LOOP_INLINE_CARD_W = 400;
const LOOP_INLINE_ARM_GAP = 80;

function computeLoopFlowWidth(nodes, nodeDetails) {
  if (!nodes || nodes.length === 0) return LOOP_INLINE_CARD_W;
  let maxWidth = LOOP_INLINE_CARD_W;
  for (const node of nodes) {
    if (node.flowType === 'branch' || node.flowType === 'voiceCall') {
      const branches = nodeDetails[node.id]?.branches || [];
      if (branches.length === 0) continue;
      const EMPTY_ARM_W = 160; // arms with no nodes only show a small chip
      const armWidths = branches.map(b => {
        const bNodes = nodeDetails[b.id]?.nodes || [];
        if (bNodes.length === 0) return EMPTY_ARM_W;
        return Math.max(LOOP_INLINE_CARD_W, computeLoopFlowWidth(bNodes, nodeDetails));
      });
      const totalW = armWidths.reduce((s, w) => s + w, 0) + (branches.length - 1) * LOOP_INLINE_ARM_GAP;
      maxWidth = Math.max(maxWidth, totalW);
    }
  }
  return maxWidth;
}

/** Task incomplete warning — hidden for design; re-enable checks below when needed. */
function isTaskConfigIncomplete(_item, _details = {}) {
  return false;
}

/**
 * True when a task's tool still has unfilled mandatory config. Checked on RHS Save (not on
 * drop), so the canvas card only flags an error once the user has tried to commit the task.
 */
function taskHasToolConfigError(details = {}) {
  const tools = details.selectedTools || [];
  return tools.includes('handle-response') && !isHandleResponseConfigComplete(details.handleResponse);
}

function getNodeBlockHeight(item, nodeId, nodeDetails, product = 'automotive') {
  if (item?.flowType === 'procedures') {
    const ids = nodeDetails?.[nodeId]?.procedureIds ?? [];
    return estimateProceduresNodeHeight(ids, nodeDetails, nodeId, product);
  }
  if (item?.flowType === 'loop') {
    const loopNodes = nodeDetails?.[nodeId]?.nodes || [];
    const hasBranch = loopNodes.some(n => n.flowType === 'branch' || n.flowType === 'voiceCall');
    if (hasBranch) return 2800;
    const childCount = loopNodes.length;
    return computeLoopCanvasHeight(Math.max(childCount, 1));
  }
  const base = FLOW_STANDARD_NODE_HEIGHT;
  if (isTaskConfigIncomplete(item, nodeDetails?.[nodeId])) return base + 24;
  return base;
}

function getFlowVerticalStep(item, nodeId, nodeDetails, product = 'automotive') {
  return getNodeBlockHeight(item, nodeId, nodeDetails, product) + FLOW_CONNECTOR_GAP;
}

function mapProcedureItems(procedureIds = [], nodeDetails, nodeId, product) {
  const panelOverrides = nodeDetails?.[nodeId]?.procedureOverrides || {};
  return procedureIds.map((pid) => {
    const p = getProcedureById(pid);
    const { name } = resolveProcedurePanelText(
      p || { id: pid, name: pid },
      panelOverrides,
      product,
    );
    return { id: pid, name };
  });
}

function buildFlow(nodeList, startData, nodeDetails = {}, product = 'automotive', collapsedBranches = {}, collapsedBranchPaths = {}, options = {}) {
  const { hideStartNode = false } = options;
  let y = 0;
  const nodes = [];
  const edges = [];
  // The trigger always owns step 1. When no trigger exists yet, render a placeholder slot
  // in its place and start numbering real nodes (tasks etc.) from 2 — a task can never be
  // step 1.
  const hasTrigger = nodeList.some((n) => n.flowType === 'trigger');
  // Shared sequential step counter — incremented for every rendered content node
  let stepCounter = hasTrigger ? 0 : 1;

  if (!hideStartNode) {
    nodes.push({
      id: START_NODE_ID,
      type: 'start',
      position: { x: 0, y },
      data: {
        title: startData.title,
        subtitle: startData.subtitle,
        subtitleIsLink: startData.subtitleIsLink,
        onSubtitleClick: startData.onSubtitleClick,
      },
    });
    y += FLOW_START_GAP;
  }

  let lastNodeY = 0;
  let lastNodeBlockHeight = hideStartNode ? 0 : FLOW_START_NODE_HEIGHT;

  // Trigger placeholder — sits at step 1's position, above any tasks, until a trigger lands.
  if (!hasTrigger) {
    nodes.push({
      id: TRIGGER_PLACEHOLDER_ID,
      type: 'triggerPlaceholder',
      position: { x: 0, y },
      data: {},
    });
    if (!hideStartNode) {
      edges.push({
        id: `e-${START_NODE_ID}-${TRIGGER_PLACEHOLDER_ID}`,
        source: START_NODE_ID,
        target: TRIGGER_PLACEHOLDER_ID,
        type: 'addButton',
      });
    }
    lastNodeY = y;
    lastNodeBlockHeight = FLOW_TRIGGER_PLACEHOLDER_HEIGHT;
    y += FLOW_TRIGGER_PLACEHOLDER_HEIGHT + FLOW_CONNECTOR_GAP;
  }

  const entryId = hasTrigger
    ? (hideStartNode ? null : START_NODE_ID)
    : TRIGGER_PLACEHOLDER_ID;

  nodeList.forEach((item, i) => {
    const nodeId = item.id;
    const prevItem = i === 0 ? null : nodeList[i - 1];
    const prevId = i === 0
      ? entryId
      : (prevItem.flowType === 'branch' && collapsedBranches[prevItem.id]
        ? `${prevItem.id}__collapse`
        : prevItem.id);
    lastNodeY = y;
    lastNodeBlockHeight = getNodeBlockHeight(item, nodeId, nodeDetails, product);
    const topLevelStep = ++stepCounter;
    nodes.push({
      id: nodeId,
      type: item.flowType,
      position: { x: 0, y },
      data: item.flowType === 'branch'
        ? {
            ...item.data,
            stepNumber: topLevelStep,
            title:
              nodeDetails[nodeId]?.branchNodeTitle
              || (nodeDetails[nodeId]?.basedOn === 'percentage'
                ? 'Based on percentage'
                : nodeDetails[nodeId]?.basedOn === 'field'
                  ? 'Based on field'
                  : nodeDetails[nodeId]?.basedOn === 'prompts'
                    ? 'Based on prompts'
                    : 'Based on conditions'),
            subtitle: nodeDetails[nodeId]?.description || 'Build condition-specific flows',
          }
        : item.data?.subtype === 'Schedule-based'
          ? {
              ...item.data,
              stepNumber: topLevelStep,
              headerLabel: 'Schedule-based trigger',
              title: nodeDetails[nodeId]?.triggerName ?? item.data.title,
              subtitle: nodeDetails[nodeId]?.description ?? item.data.subtitle,
            }
          : item.flowType === 'procedures'
            ? {
                ...item.data,
                stepNumber: topLevelStep,
                procedureItems: mapProcedureItems(
                  nodeDetails[nodeId]?.procedureIds,
                  nodeDetails,
                  nodeId,
                  product,
                ),
              }
            : item.flowType === 'loop'
              ? (() => {
                  const loopNodes = nodeDetails[nodeId]?.nodes || [];
                  const hasBranch = loopNodes.some(n => n.flowType === 'branch' || n.flowType === 'voiceCall');
                  const loopBodyH = hasBranch ? 1800 : computeLoopBodyHeight(Math.max(loopNodes.length, 1));
                  const contentW = computeLoopFlowWidth(loopNodes, nodeDetails);
                  const loopContainerWidth = Math.max(contentW + 80, 860); // 40px padding each side
                  return {
                    ...item.data,
                    stepNumber: topLevelStep,
                    title: nodeDetails[nodeId]?.loopName ?? item.data.title,
                    subtitle: nodeDetails[nodeId]?.description ?? item.data.subtitle,
                    loopBodyHeight: loopBodyH,
                    loopContainerWidth,
                    loopChildren: loopNodes.map((child) => ({
                      ...child.data,
                      id: child.id,
                      stepNumber: ++stepCounter,
                      title: nodeDetails[child.id]?.taskName ?? nodeDetails[child.id]?.triggerName ?? child.data.title,
                      subtitle: nodeDetails[child.id]?.description ?? child.data.subtitle,
                    })),
                    loopFlow: loopNodes.map((child) => ({
                      ...child,
                      data: { ...child.data, stepNumber: ++stepCounter },
                    })),
                    loopNodeDetails: nodeDetails,
                  };
                })()
              : {
                  ...item.data,
                  stepNumber: topLevelStep,
                  ...(item.flowType === 'delay'
                    ? {
                        titlePlaceholder: 'Configure delay settings',
                        descriptionPlaceholder: 'Wait for specific time or event.',
                      }
                    : item.flowType === 'subagent'
                      ? {
                          titlePlaceholder: 'Call subagent',
                          descriptionPlaceholder: 'Call subagent workflow.',
                        }
                      : {}),
                  // Pull title and subtitle from saved nodeDetails so canvas nodes
                  // show real content instead of placeholder text
                  title: nodeDetails[nodeId]?.taskName
                    ?? nodeDetails[nodeId]?.triggerName
                    ?? item.data.title,
                  subtitle: nodeDetails[nodeId]?.description ?? item.data.subtitle,
                  showConfigWarning: isTaskConfigIncomplete(item, nodeDetails[nodeId]),
                },
    });
    const prevIsProcedures = i > 0 && nodeList[i - 1].flowType === 'procedures';
    // No "+" between the trigger placeholder and the first task — that slot is reserved for
    // the trigger, so nothing may be inserted above the first real node there.
    const fromPlaceholder = i === 0 && prevId === TRIGGER_PLACEHOLDER_ID;
    if (prevId != null) {
      edges.push({
        id: `e-${prevId}-${nodeId}`,
        source: prevId,
        target: nodeId,
        type: 'addButton',
        data: { betweenCards: true, ...((prevIsProcedures || fromPlaceholder) ? { hideAddButton: true } : {}) },
      });
    }

    if (item.flowType === 'branch' || item.flowType === 'voiceCall') {
      const isVoiceCall = item.flowType === 'voiceCall';
      const branches = nodeDetails[nodeId]?.branches || [];
      const parentCollapsed = !isVoiceCall && !!collapsedBranches[nodeId];

      // Detect nesting depth to set spacing:
      // level-1: voiceCall directly in a branch arm → 1100
      // level-2: branch in a branch arm whose sub-arm contains a voiceCall → 2400
      const hasNestedVoiceCall = !isVoiceCall && branches.some(b =>
        (nodeDetails[b.id]?.nodes || []).some(n => n.flowType === 'voiceCall')
      );
      const hasDoublyNestedVoiceCall = !isVoiceCall && branches.some(b =>
        (nodeDetails[b.id]?.nodes || []).some(n =>
          n.flowType === 'branch' &&
          (nodeDetails[n.id]?.branches || []).some(nb =>
            (nodeDetails[nb.id]?.nodes || []).some(nn => nn.flowType === 'voiceCall')
          )
        )
      );
      const spacing = hasDoublyNestedVoiceCall ? 2400 : hasNestedVoiceCall ? 1100 : 480;
      // Every arm node (path chip, task card, End) uses the same 432px centered
      // wrapper, so sharing position.x keeps source/target handles on one vertical line.
      const startX = -((branches.length - 1) * spacing) / 2;
      const branchChipY = y + 260;
      const branchNodeStartY = y + 370;

      // Stem control between the Branch card and the fan (Reviews-style collapse).
      let fanSourceId = nodeId;
      if (!isVoiceCall) {
        const stemId = `${nodeId}__collapse`;
        const stemY = y + 154;
        const taskCount = branches.reduce(
          (sum, b) => sum + (nodeDetails[b.id]?.nodes || []).length,
          0,
        );
        nodes.push({
          id: stemId,
          type: 'branchCollapse',
          position: { x: 0, y: stemY },
          data: {
            collapsed: parentCollapsed,
            branchCount: branches.length,
            taskCount,
            parentBranchId: nodeId,
          },
        });
        edges.push({
          id: `e-${nodeId}-${stemId}`,
          source: nodeId,
          target: stemId,
          type: 'straight',
        });
        fanSourceId = stemId;
        if (parentCollapsed) {
          lastNodeY = stemY;
          lastNodeBlockHeight = 36;
        }
      }

      // Helper: fan out a voiceCall node's sub-branches
      const renderVoiceCallBranches = (vcNodeId, baseX, baseY) => {
        const vcBranches = nodeDetails[vcNodeId]?.branches || [];
        const vcSpacing = 480;
        const vcStartX = baseX - ((vcBranches.length - 1) * vcSpacing) / 2;
        const vcChipY = baseY + 260;
        const vcNodeStartY = baseY + 370;
        vcBranches.forEach((vcBranch, vcBi) => {
          const vcBranchX = vcStartX + vcBi * vcSpacing;
          const vcBranchNodes = nodeDetails[vcBranch.id]?.nodes || [];
          const vcPathCollapsed = !!collapsedBranchPaths[vcBranch.id];
          nodes.push({
            id: vcBranch.id,
            type: 'branchPath',
            position: { x: vcBranchX, y: vcChipY },
            data: {
              label: vcBranch.name,
              description: nodeDetails[vcBranch.id]?.description || '',
              parentId: vcNodeId,
              isFallback: !!vcBranch.isFallback,
              isVoiceCallBranch: true,
              collapsed: vcPathCollapsed,
              hiddenCount: vcBranchNodes.length,
            },
          });
          edges.push({ id: `e-${vcNodeId}-${vcBranch.id}`, source: vcNodeId, target: vcBranch.id, type: 'branchFan' });
          if (vcPathCollapsed) return;
          let vcPrevId = vcBranch.id;
          vcBranchNodes.forEach((vcChild, vcIdx) => {
            const vcChildId = vcChild.id;
            const vcChildDet = nodeDetails[vcChildId] || {};
            let vcChildData = { ...vcChild.data, stepNumber: ++stepCounter };
            if (vcChild.flowType !== 'delay' && vcChild.flowType !== 'branch') {
              vcChildData = {
                ...vcChildData,
                title: vcChildDet.taskName ?? vcChildDet.triggerName ?? vcChildData.title,
                subtitle: vcChildDet.description ?? vcChildData.subtitle,
                showConfigWarning: isTaskConfigIncomplete(vcChild, vcChildDet),
              };
            }
            nodes.push({ id: vcChildId, type: vcChild.flowType, position: { x: vcBranchX, y: vcNodeStartY + vcIdx * FLOW_NODE_STEP }, data: vcChildData });
            edges.push({ id: `e-${vcPrevId}-${vcChildId}`, source: vcPrevId, target: vcChildId, type: 'addButton', data: { branchPathId: vcBranch.id, afterNodeId: vcPrevId === vcBranch.id ? null : vcPrevId, betweenCards: vcPrevId !== vcBranch.id } });
            vcPrevId = vcChildId;
          });
          const vcEndId = `${vcBranch.id}-end`;
          nodes.push({ id: vcEndId, type: 'branchEnd', position: { x: vcBranchX, y: vcNodeStartY + vcBranchNodes.length * FLOW_NODE_STEP }, data: { parentId: vcBranch.id } });
          edges.push({ id: `e-${vcPrevId}-${vcEndId}`, source: vcPrevId, target: vcEndId, type: 'addButton', data: { branchPathId: vcBranch.id, afterNodeId: vcPrevId === vcBranch.id ? null : vcPrevId } });
        });
      };

      if (!parentCollapsed) {
        branches.forEach((branch, bi) => {
          const branchX = startX + bi * spacing;
          const branchNodes = nodeDetails[branch.id]?.nodes || [];
          const pathCollapsed = !!collapsedBranchPaths[branch.id];
          nodes.push({
            id: branch.id,
            type: 'branchPath',
            position: { x: branchX, y: branchChipY },
            data: {
              label: branch.name,
              description: nodeDetails[branch.id]?.description || '',
              parentId: nodeId,
              isFallback: !!branch.isFallback,
              isVoiceCallBranch: isVoiceCall || !!branch.isVoiceCallBranch,
              collapsed: pathCollapsed,
              hiddenCount: branchNodes.length,
              // Keep at least two paths (e.g. Branch 1 + Fallback).
              canDeletePath: !isVoiceCall && !branch.isVoiceCallBranch && !branch.isFallback && branches.length > 2,
            },
          });
          edges.push({ id: `e-${fanSourceId}-${branch.id}`, source: fanSourceId, target: branch.id, type: 'branchFan' });

          if (pathCollapsed) return;

          let previousId = branch.id;
          let previousChildFlowType = null;
          let childYOffset = 0;
          branchNodes.forEach((childNode) => {
            const childId = childNode.id;
            const childDet = nodeDetails[childId] || {};
            let childData = { ...childNode.data, stepNumber: ++stepCounter };
            if (childNode.flowType === 'procedures') {
              childData = { ...childData, toggleEnabled: childNode.data?.toggleEnabled ?? true, procedureItems: mapProcedureItems(childDet.procedureIds, nodeDetails, childId, product) };
            } else if (childNode.flowType !== 'delay' && childNode.flowType !== 'branch') {
              childData = {
                ...childData,
                title: childDet.taskName ?? childDet.triggerName ?? childData.title,
                subtitle: childDet.description ?? childData.subtitle,
                showConfigWarning: isTaskConfigIncomplete(childNode, childDet),
              };
            }
            const childY = branchNodeStartY + childYOffset;
            nodes.push({ id: childId, type: childNode.flowType, position: { x: branchX, y: childY }, data: childData });
            edges.push({ id: `e-${previousId}-${childNode.id}`, source: previousId, target: childNode.id, type: 'addButton', data: { branchPathId: branch.id, afterNodeId: previousId === branch.id ? null : previousId, betweenCards: previousId !== branch.id, ...(previousChildFlowType === 'procedures' ? { hideAddButton: true } : {}) } });
            previousId = childNode.id;
            previousChildFlowType = childNode.flowType;
            childYOffset += FLOW_NODE_STEP;

            if (childNode.flowType === 'voiceCall') {
              renderVoiceCallBranches(childId, branchX, childY);
            }

            if (childNode.flowType === 'branch') {
              const innerBranches = childDet.branches || [];
              const innerCollapsed = !!collapsedBranches[childId];
              const innerHasVoiceCall = innerBranches.some(nb =>
                (nodeDetails[nb.id]?.nodes || []).some(nn => nn.flowType === 'voiceCall')
              );
              const innerSpacing = innerHasVoiceCall ? 1100 : 480;
              const innerStartX = branchX - ((innerBranches.length - 1) * innerSpacing) / 2;
              const innerChipY = childY + 260;
              const innerNodeStartY = childY + 370;
              const innerStemId = `${childId}__collapse`;
              const innerStemY = childY + 154;
              const innerTaskCount = innerBranches.reduce(
                (sum, b) => sum + (nodeDetails[b.id]?.nodes || []).length,
                0,
              );
              nodes.push({
                id: innerStemId,
                type: 'branchCollapse',
                position: { x: branchX, y: innerStemY },
                data: {
                  collapsed: innerCollapsed,
                  branchCount: innerBranches.length,
                  taskCount: innerTaskCount,
                  parentBranchId: childId,
                },
              });
              edges.push({
                id: `e-${childId}-${innerStemId}`,
                source: childId,
                target: innerStemId,
                type: 'straight',
              });
              if (innerCollapsed) {
                const innerEndId = `${childId}-end`;
                nodes.push({
                  id: innerEndId,
                  type: 'branchEnd',
                  position: { x: branchX, y: innerStemY + 50 },
                  data: { parentId: branch.id },
                });
                edges.push({
                  id: `e-${innerStemId}-${innerEndId}`,
                  source: innerStemId,
                  target: innerEndId,
                  type: 'addButton',
                  data: { branchPathId: branch.id, afterNodeId: childId },
                });
              } else {
                innerBranches.forEach((innerBranch, innerBi) => {
                  const innerBranchX = innerStartX + innerBi * innerSpacing;
                  const innerBranchNodes = nodeDetails[innerBranch.id]?.nodes || [];
                  const innerPathCollapsed = !!collapsedBranchPaths[innerBranch.id];
                  nodes.push({
                    id: innerBranch.id,
                    type: 'branchPath',
                    position: { x: innerBranchX, y: innerChipY },
                    data: {
                      label: innerBranch.name,
                      description: nodeDetails[innerBranch.id]?.description || '',
                      parentId: childId,
                      isFallback: !!innerBranch.isFallback,
                      isVoiceCallBranch: false,
                      collapsed: innerPathCollapsed,
                      hiddenCount: innerBranchNodes.length,
                      canDeletePath: !innerBranch.isFallback && innerBranches.length > 2,
                    },
                  });
                  edges.push({ id: `e-${innerStemId}-${innerBranch.id}`, source: innerStemId, target: innerBranch.id, type: 'branchFan' });
                  if (innerPathCollapsed) return;
                  let innerPrevId = innerBranch.id;
                  let innerYOff = 0;
                  innerBranchNodes.forEach((innerChild) => {
                    const innerChildId = innerChild.id;
                    const innerChildDet = nodeDetails[innerChildId] || {};
                    let innerChildData = { ...innerChild.data, stepNumber: ++stepCounter };
                    if (innerChild.flowType !== 'delay' && innerChild.flowType !== 'branch') {
                      innerChildData = {
                        ...innerChildData,
                        title: innerChildDet.taskName ?? innerChildDet.triggerName ?? innerChildData.title,
                        subtitle: innerChildDet.description ?? innerChildData.subtitle,
                        showConfigWarning: isTaskConfigIncomplete(innerChild, innerChildDet),
                      };
                    }
                    const innerChildY = innerNodeStartY + innerYOff;
                    nodes.push({ id: innerChildId, type: innerChild.flowType, position: { x: innerBranchX, y: innerChildY }, data: innerChildData });
                    edges.push({ id: `e-${innerPrevId}-${innerChildId}`, source: innerPrevId, target: innerChildId, type: 'addButton', data: { branchPathId: innerBranch.id, afterNodeId: innerPrevId === innerBranch.id ? null : innerPrevId, betweenCards: innerPrevId !== innerBranch.id } });
                    innerPrevId = innerChildId;
                    innerYOff += FLOW_NODE_STEP;
                    if (innerChild.flowType === 'voiceCall') {
                      renderVoiceCallBranches(innerChildId, innerBranchX, innerChildY);
                    }
                  });
                  const lastInnerIsVoiceCall = innerBranchNodes.length > 0 && innerBranchNodes[innerBranchNodes.length - 1].flowType === 'voiceCall';
                  if (!lastInnerIsVoiceCall) {
                    const innerEndId = `${innerBranch.id}-end`;
                    nodes.push({ id: innerEndId, type: 'branchEnd', position: { x: innerBranchX, y: innerNodeStartY + innerYOff }, data: { parentId: innerBranch.id } });
                    edges.push({ id: `e-${innerPrevId}-${innerEndId}`, source: innerPrevId, target: innerEndId, type: 'addButton', data: { branchPathId: innerBranch.id, afterNodeId: innerPrevId === innerBranch.id ? null : innerPrevId } });
                  }
                });
              }
            }
          });

          const lastChild = branchNodes.length > 0 ? branchNodes[branchNodes.length - 1] : null;
          const lastChildIsBranchLike = lastChild && (lastChild.flowType === 'voiceCall' || lastChild.flowType === 'branch');
          if (!lastChildIsBranchLike) {
            const branchEndId = `${branch.id}-end`;
            nodes.push({ id: branchEndId, type: 'branchEnd', position: { x: branchX, y: branchNodeStartY + childYOffset }, data: { parentId: branch.id } });
            edges.push({ id: `e-${previousId}-${branchEndId}`, source: previousId, target: branchEndId, type: 'addButton', data: { branchPathId: branch.id, afterNodeId: previousId === branch.id ? null : previousId, viewOnly: !!branch.isFallback, ...(previousChildFlowType === 'procedures' ? { hideAddButton: true } : {}) } });
          }
        });
      }
      // Branch paths fan out to the side — do not inflate main-spine y or spine edges stretch.
    }

    y += getFlowVerticalStep(item, nodeId, nodeDetails, product);
  });

  const lastId = nodeList.length > 0 ? nodeList[nodeList.length - 1].id : entryId;
  const lastNodeIsProcedures = nodeList.length > 0 && nodeList[nodeList.length - 1].flowType === 'procedures';
  const lastFlowType = nodeList.length > 0 ? nodeList[nodeList.length - 1].flowType : null;
  const lastBranchCollapsed = lastFlowType === 'branch' && !!collapsedBranches[lastId];
  if (!nodeList.length || (lastFlowType !== 'branch' && lastFlowType !== 'voiceCall') || lastBranchCollapsed) {
    const endY = lastNodeY + lastNodeBlockHeight;
    const endSourceId = lastBranchCollapsed ? `${lastId}__collapse` : lastId;
    nodes.push({
      id: END_NODE_ID,
      type: 'end',
      // Top of End node aligns with the bottom of the preceding block; connector fills FLOW_CONNECTOR_GAP
      position: { x: 0, y: endY },
      data: { afterNodeId: lastId, hideAddBeforeEnd: lastNodeIsProcedures },
    });
    edges.push({
      id: `e-${endSourceId}-${END_NODE_ID}`,
      source: endSourceId,
      target: END_NODE_ID,
      type: 'addButton',
    });
  }

  return { nodes, edges };
}

let nodeIdCounter = 0;
function nextId() {
  nodeIdCounter += 1;
  return `node-${nodeIdCounter}`;
}

/** Find where a node lives — the top-level trunk, or a branch/loop container's `nodes` array. */
function locateNodeContainer(nodeId, nodeList, nodeDetails) {
  const rootIdx = nodeList.findIndex((n) => n.id === nodeId);
  if (rootIdx !== -1) return { containerId: null, index: rootIdx };
  for (const [key, details] of Object.entries(nodeDetails)) {
    if (Array.isArray(details?.nodes)) {
      const idx = details.nodes.findIndex((n) => n.id === nodeId);
      if (idx !== -1) return { containerId: key, index: idx };
    }
  }
  return null;
}

/** Recursively snapshot a node's nodeDetails entry plus every entry it references (branch paths, loop children). */
function collectDetailsSnapshot(nodeId, nodeDetails, out = {}) {
  if (out[nodeId]) return out;
  const details = nodeDetails[nodeId];
  if (!details) return out;
  out[nodeId] = JSON.parse(JSON.stringify(details));
  (details.nodes || []).forEach((child) => collectDetailsSnapshot(child.id, nodeDetails, out));
  (details.branches || []).forEach((b) => collectDetailsSnapshot(b.id, nodeDetails, out));
  return out;
}

/** Recursively collect a node's own id plus every id it references (branch paths, loop children). */
function collectAllIds(nodeId, nodeDetails, out = []) {
  if (out.includes(nodeId)) return out;
  out.push(nodeId);
  const details = nodeDetails[nodeId];
  if (!details) return out;
  (details.nodes || []).forEach((child) => collectAllIds(child.id, nodeDetails, out));
  (details.branches || []).forEach((b) => collectAllIds(b.id, nodeDetails, out));
  return out;
}

/**
 * Clone a node (and, recursively, any branch/loop children it references) with fresh ids,
 * reading source data from a `detailsSnapshot` map rather than live nodeDetails. Fills
 * `extraOut` with `{ [newId]: clonedDetails }` for the node itself and every cloned descendant.
 */
function cloneSubtreeForPaste(nodeEntry, detailsSnapshot, extraOut) {
  const newId = nextId();
  const clonedEntry = { ...nodeEntry, id: newId, data: { ...nodeEntry.data } };
  const sourceDetails = detailsSnapshot[nodeEntry.id] || {};
  const clonedDetails = JSON.parse(JSON.stringify(sourceDetails));

  if (Array.isArray(clonedDetails.nodes)) {
    clonedDetails.nodes = clonedDetails.nodes.map((child) =>
      cloneSubtreeForPaste(child, detailsSnapshot, extraOut));
  }

  if (Array.isArray(clonedDetails.branches)) {
    clonedDetails.branches = clonedDetails.branches.map((branch) => {
      const branchSource = detailsSnapshot[branch.id];
      const newBranchId = `${newId}-path-${nextId()}`;
      if (branchSource) {
        const clonedBranch = JSON.parse(JSON.stringify(branchSource));
        clonedBranch.parentId = newId;
        if (Array.isArray(clonedBranch.nodes)) {
          clonedBranch.nodes = clonedBranch.nodes.map((child) =>
            cloneSubtreeForPaste(child, detailsSnapshot, extraOut));
        }
        extraOut[newBranchId] = clonedBranch;
      }
      return { ...branch, id: newBranchId };
    });
  }

  extraOut[newId] = clonedDetails;
  return clonedEntry;
}

function publishBlockedCopy(count) {
  const label = count === 1 ? 'error' : 'errors';
  return {
    title: 'Resolve errors to activate',
    body: `Fix ${count} ${label} in your workflow before activating.`,
  };
}

export default function AgentBuilder({
  agentId: propAgentId,
  agentSlug: propAgentSlug,
  moduleSlug: propModuleSlug,
  appTitle,
  pageTitle = '',
  activeNavId = 'search',
  navItems,
  moduleContext = 'search',
  sectionContext = 'faq-generation-agents',
  templateId,
  templateSource,
  initialStatus = 'Draft',
  /** Live Active instance also has an unpublished draft — block Active RHS edits. */
  hasUnpublishedDraft = false,
  initialDescription = '',
  initialNodes = null,
  initialNodeDetails = null,
  onSaveAgent,
  onSaveTemplate,
  onClose,
  /** Confirmed delete — falls back to `onClose` when the parent doesn't handle it. */
  onDeleted,
  onEdit,
  onView,
  viewOnly = false,
  /** View-only canvases that should show edit/run actions instead of the name + status chrome. */
  viewChromeActions = false,
  /** Set false to make node cards inert (no RHS on click) — used by the read-only log run view. */
  nodesInteractive = true,
  product = 'automotive',
  procedures = null,
  onAddProcedure,
  publishDisabled = false,
  issueCount = 0,
  issues = null,
  defaultOpenSection = 'Tasks',
  initialZoom = 1,
  runDisabled = false,
  aiAssistOpen: aiAssistOpenProp,
  onAiAssistOpenChange,
  hideLhs = false,
  createAiPanelOpen = false,
  /** Opens the full-page Create with AI experience (parent-owned navigation). */
  onOpenAiFullscreen = null,
  /** Opens Settings > Account > Product research (Help center "Learn more"). */
  onOpenProductResearchSettings = null,
  /** Parent-controlled AI Builder dock (reopened after fullscreen expand). */
  aiBuilderPanelOpen: aiBuilderPanelOpenProp = false,
  onAiBuilderPanelOpenChange = null,
  /** Initial LHS drawer tab. */
  lhsDefaultTab = 'Create manually',
  /** When set (e.g. from Create-with-AI chat), open this procedure in the canvas RHS. */
  previewProcedureId = null,
  /** Optional full RHS detail payload — used when the procedure isn't in the live library. */
  previewProcedureDetail = null,
  onPreviewProcedureIdChange,
  /** Saved co-pilot transcript for the Create with AI tab. */
  aiTranscript = null,
  /** Editing an already-built agent (Create with AI uses help copy, not build copy). */
  existingAgent = false,
  /** When set by the parent, forces the Procedures floater on/off (preferred over name sniffing). */
  showProceduresPalette = null,
  /** Hides in-canvas agent name + status (identity rendered in the header back cluster). */
  hideTopIdentity = false,
  /** RHS Save follows the content instead of pinning to the panel bottom (Sep 1 only). */
  inlineRhsFooter = false,
  /** Sep 1 chrome: inline RHS footer + other Sep-1-only treatments. */
  sep1Chrome = false,
  /**
   * Action RHS layout explorations (Option 1/2, R1–R4). True only for Response /
   * Front desk exploration — not Sep 1. Prefer this over `explorationChrome && !sep1Chrome`
   * because sep1Chrome is now true for the whole exploration family.
   */
  llmTaskExplorationLayout = false,
  /** Hides the canvas agent-details start node. Defaults to hideTopIdentity. */
  hideCanvasStartNode = hideTopIdentity,
  /** Exploration editor UX — defaults to hideTopIdentity for backward compatibility. */
  explorationChrome = hideTopIdentity,
  /** Log run view: node IDs that completed in this run — show green check on the header icon. */
  logDoneNodeIds = null,
  /** External canvas focus (e.g. clicking a log step in RunDetailView). */
  externalFocusNodeId = null,
  /** Bumped when the same node is focused again so the canvas re-pans. */
  externalFocusNonce = 0,
}) {
  /* ─── Prop-based slug params (no React Router) ─── */
  const urlModuleSlug = propModuleSlug || moduleContext || 'search';
  const urlAgentSlug = propAgentSlug || '';

  const [agentId, setAgentId] = useState(() => propAgentId || crypto.randomUUID());
  const [agentModuleSlug, setAgentModuleSlug] = useState(urlModuleSlug);
  const [agentSlug, setAgentSlug] = useState(urlAgentSlug);
  const [derivedAppTitle, setDerivedAppTitle] = useState(appTitle || 'Content Hub');
  // Tracked as state so applyAgent can update them from Firestore — props alone are wrong after URL load
  const [agentModuleContext, setAgentModuleContext] = useState(urlModuleSlug);
  const [agentSectionContext, setAgentSectionContext] = useState(sectionContext);
  // templateId / templateSource are stateful so applyAgent can load them from Firestore
  const [agentTemplateId, setAgentTemplateId] = useState(templateId || '');
  const [agentTemplateSource, setAgentTemplateSource] = useState(templateSource || '');

  /* ─── Loading / not-found state for slug-based loading ─── */
  const [isLoadingFromSlug, setIsLoadingFromSlug] = useState(!viewOnly && !!urlAgentSlug && !!urlModuleSlug);
  const [agentNotFound, setAgentNotFound] = useState(false);
  const [navId, setNavId] = useState(activeNavId);
  const [nodeList, setNodeList] = useState(() => initialNodes || []);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  /** When a canvas branch-path chip is clicked, expand that path in the Branch RHS. */
  const [focusBranchPathId, setFocusBranchPathId] = useState(null);
  const [focusBranchPathNonce, setFocusBranchPathNonce] = useState(0);
  /** Parent branch nodes whose path arms are collapsed on the canvas. */
  const [collapsedBranches, setCollapsedBranches] = useState({});
  /** Individual branch-path chips whose child steps are collapsed. */
  const [collapsedBranchPaths, setCollapsedBranchPaths] = useState({});
  // Canvas node clipboard — holds a copied node's entry + a snapshot of its (and any referenced branch/loop) details
  const [clipboard, setClipboard] = useState(null);
  // Tracks which procedure is open in the detail view (UI-only, not persisted)
  const [activeProcedureId, setActiveProcedureId] = useState(null);
  /** Exploration LLM task: Setup vs Configure tab (footer Continue / prompt strength). */
  const [llmTaskTab, setLlmTaskTab] = useState('setup');
  /** Exploration LLM task: Option 1 = body tabs, Option 2 = header Setup/Configure menu. */
  const [llmTaskLayoutOption, setLlmTaskLayoutOption] = useState('option1');
  /** Exploration only: Option 1 / Option 2 layouts for tool-based Action RHS. */
  const [entityTaskLayoutOption, setEntityTaskLayoutOption] = useState('option1');
  /** R1 only: true while a required field inside an accordion is empty — disables
   *  the RHS footer's Save and shows the "Mandatory fields missing" warning. */
  const [llmTaskSaveBlocked, setLlmTaskSaveBlocked] = useState(false);
  const [lhsPreviewProcedureId, setLhsPreviewProcedureId] = useState(null);
  const externalPreviewRef = useRef(null);

  useEffect(() => {
    setLlmTaskSaveBlocked(false);
  }, [selectedNodeId]);

  /* Sync external Create-with-AI procedure clicks into the canvas RHS. */
  useEffect(() => {
    if (previewProcedureId) {
      externalPreviewRef.current = previewProcedureId;
      setLhsPreviewProcedureId(previewProcedureId);
      setSelectedNodeId(null);
      setActiveProcedureId(null);
      setDrawerOpen(true);
      return;
    }
    if (externalPreviewRef.current) {
      externalPreviewRef.current = null;
      setLhsPreviewProcedureId(null);
      setDrawerOpen(false);
    }
  }, [previewProcedureId]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [bookTestModalOpen, setBookTestModalOpen] = useState(false);
  const [testAppointment, setTestAppointment] = useState(null);
  const [previewActive, setPreviewActive] = useState(false);
  // Tool viewer state
  const [viewingTool, setViewingTool] = useState(null); // full tool object
  const [viewingToolValues, setViewingToolValues] = useState({}); // saved field values for filled state
  const [reminderToolOpen, setReminderToolOpen] = useState(false);
  const [voiceCallToolOpen, setVoiceCallToolOpen] = useState(false);
  const [transferToolOpen, setTransferToolOpen] = useState(false);
  const [queryConfigOpen, setQueryConfigOpen] = useState(false);
  const [assignContactStatusToolOpen, setAssignContactStatusToolOpen] = useState(false);
  const [assignConversationToolOpen, setAssignConversationToolOpen] = useState(false);
  const [assignConversationStatusToolOpen, setAssignConversationStatusToolOpen] = useState(false);
  const [handleResponseToolOpen, setHandleResponseToolOpen] = useState(false);
  /** Node ids whose Task details were saved while a tool still had missing mandatory config. */
  const [taskErrorNodeIds, setTaskErrorNodeIds] = useState(() => new Set());
  const [toolPickerOpen, setToolPickerOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // RHS panel stays mounted a beat past `drawerOpen` turning false so it can
  // play its slide-out animation instead of vanishing instantly.
  const [rhsRendered, setRhsRendered] = useState(false);
  const [rhsClosing, setRhsClosing] = useState(false);
  const rhsRenderedRef = useRef(false);
  const rhsCloseTimeoutRef = useRef(null);
  // Exploration: Help center shares the node-config RHS slot, so it needs the same
  // stay-mounted-through-the-slide-out treatment.
  const [helpRendered, setHelpRendered] = useState(false);
  const [helpClosing, setHelpClosing] = useState(false);
  const helpRenderedRef = useRef(false);
  const helpCloseTimeoutRef = useRef(null);
  const [lhsCollapsed, setLhsCollapsed] = useState(false);
  /** Review-response left floater: which palette section is open (Trigger / Tasks / Controls). */
  const [paletteSection, setPaletteSection] = useState(
    defaultOpenSection === 'Trigger' ? 'Trigger' : null,
  );
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  /**
   * True only when history was opened from a Draft agent's "View active version" link.
   * That entry point prepends the unpublished draft as the first card; the three-dots
   * menu leaves the list untouched.
   */
  const [draftVersionHistory, setDraftVersionHistory] = useState(false);
  /** Which version the history panel is previewing (first entry = the live one). */
  const [versionHistorySelectedId, setVersionHistorySelectedId] = useState(
    () => VERSION_HISTORY_VERSIONS[0]?.id ?? null,
  );
  /** Version id the "Version restored" toast can send you back to via Undo. */
  const [restoredVersionId, setRestoredVersionId] = useState(null);
  const [rrAiPanelOpen, setRrAiPanelOpen] = useState(() => !!aiBuilderPanelOpenProp);
  const [rrAiPanelRendered, setRrAiPanelRendered] = useState(() => !!aiBuilderPanelOpenProp);
  const [rrAiPanelClosing, setRrAiPanelClosing] = useState(false);
  const [paletteInstant, setPaletteInstant] = useState(false);
  const rrAiPanelRenderedRef = useRef(!!aiBuilderPanelOpenProp);
  const rrAiPanelCloseTimeoutRef = useRef(null);
  const [canvasOrientation, setCanvasOrientation] = useState('vertical');
  const [aiAssistOpenInternal, setAiAssistOpenInternal] = useState(false);
  // AI assist panel is controlled by the parent when it needs to render the
  // panel itself (e.g. spanning the full app height, above this editor's own
  // header) — falls back to internal state otherwise.
  const aiAssistControlled = onAiAssistOpenChange != null;
  const aiAssistOpen = aiAssistControlled ? aiAssistOpenProp : aiAssistOpenInternal;
  const setAiAssistOpen = aiAssistControlled ? onAiAssistOpenChange : setAiAssistOpenInternal;
  const [lhsForceOpenSection, setLhsForceOpenSection] = useState(null);
  // Node most recently clicked on the canvas — surfaced as a removable pill in the
  // "Create with AI" composer so a follow-up message can reference it directly.
  const [aiNodeContext, setAiNodeContext] = useState(null);
  // Bumped each time the start node's "Add locations" link is clicked, so the agent-details
  // RHS panel knows to jump straight to its Locations picker (even if already open).
  const [startLocationsOpenToken, setStartLocationsOpenToken] = useState(0);
  const [nodeDetails, setNodeDetails] = useState(() => {
    const base = initialNodeDetails || {};
    const startNode = base[START_NODE_ID];
    const pageTitleStr = (typeof pageTitle === 'string' ? pageTitle : '') || '';
    if (!startNode || !startNode.agentName) {
      return {
        ...base,
        [START_NODE_ID]: {
          goals: '',
          outcomes: '',
          locations: [],
          ...(startNode || {}),
          agentName: startNode?.agentName || pageTitleStr,
        },
      };
    }
    return base;
  });
  const [agentStatus, setAgentStatus] = useState(initialStatus || 'Draft');

  /* ─── Test run ─── */
  const [testRunOpen, setTestRunOpen] = useState(false);
  // First-time coach queue on the edit canvas — Help center "Start tour" also reopens it.
  const [coachTourOpen, setCoachTourOpen] = useState(false);
  const [helpCenterOpen, setHelpCenterOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [glossaryTermId, setGlossaryTermId] = useState(undefined);
  const openGlossary = (termId) => {
    setGlossaryTermId(termId || undefined);
    setGlossaryOpen(true);
  };
  const closeGlossary = () => {
    setGlossaryOpen(false);
    setGlossaryTermId(undefined);
  };
  // Rebuilt only while the panel is open so the run isn't restarted by unrelated edits.
  const testRunSteps = useMemo(
    () => (testRunOpen ? buildTestRunSteps(nodeList, nodeDetails) : EMPTY_TEST_RUN_STEPS),
    [testRunOpen, nodeList, nodeDetails],
  );
  const testRun = useTestRun(testRunSteps);
  const testRunActiveId = testRunOpen ? testRun.activeNodeId : null;
  // Canvas highlighting for the executing / finished nodes, keyed by react-flow's data-id.
  const testRunCss = testRunOpen
    ? [
        ...testRun.doneNodeIds.map(
          (id) => `.react-flow__node[data-id="${id}"] .canvas-node { border: 1px solid #4caf50 !important; box-shadow: 0 2px 12px 0 rgba(33, 33, 33, 0.06) !important; }`,
        ),
        testRunActiveId
          ? `.react-flow__node[data-id="${testRunActiveId}"] .canvas-node { border: 1px solid #1976d2 !important; animation: ab-test-run-pulse 2.6s ease-in-out infinite; }`
          : '',
      ].join('\n')
    : '';

  /* ─── Sync live procedure library into the procedureService registry ─── */
  useEffect(() => {
    setLiveProcedures(procedures);
  }, [procedures]);

  /* ─── Close AI assist when another right-side panel (node details / preview) opens ─── */
  useEffect(() => {
    if (drawerOpen || previewOpen) setAiAssistOpen(false);
  }, [drawerOpen, previewOpen]);

  /* ─── RHS panel slide in/out: keep it mounted through the close animation ─── */
  useEffect(() => {
    if (drawerOpen) {
      if (rhsCloseTimeoutRef.current) {
        clearTimeout(rhsCloseTimeoutRef.current);
        rhsCloseTimeoutRef.current = null;
      }
      setRhsClosing(false);
      setRhsRendered(true);
      rhsRenderedRef.current = true;
    } else if (rhsRenderedRef.current) {
      setRhsClosing(true);
      rhsCloseTimeoutRef.current = setTimeout(() => {
        rhsRenderedRef.current = false;
        setRhsRendered(false);
        setRhsClosing(false);
      }, 260);
    }
    return () => {
      if (rhsCloseTimeoutRef.current) clearTimeout(rhsCloseTimeoutRef.current);
    };
  }, [drawerOpen]);

  /* ─── Help center panel: same slide in/out lifecycle as the node RHS ─── */
  useEffect(() => {
    if (helpCenterOpen) {
      if (helpCloseTimeoutRef.current) {
        clearTimeout(helpCloseTimeoutRef.current);
        helpCloseTimeoutRef.current = null;
      }
      setHelpClosing(false);
      setHelpRendered(true);
      helpRenderedRef.current = true;
    } else if (helpRenderedRef.current) {
      setHelpClosing(true);
      helpCloseTimeoutRef.current = setTimeout(() => {
        helpRenderedRef.current = false;
        setHelpRendered(false);
        setHelpClosing(false);
      }, 260);
    }
    return () => {
      if (helpCloseTimeoutRef.current) clearTimeout(helpCloseTimeoutRef.current);
    };
  }, [helpCenterOpen]);

  /* ─── Review-response AI panel slide in/out ─── */
  useEffect(() => {
    if (rrAiPanelOpen) {
      if (rrAiPanelCloseTimeoutRef.current) {
        clearTimeout(rrAiPanelCloseTimeoutRef.current);
        rrAiPanelCloseTimeoutRef.current = null;
      }
      setRrAiPanelClosing(false);
      setRrAiPanelRendered(true);
      rrAiPanelRenderedRef.current = true;
    } else if (rrAiPanelRenderedRef.current) {
      setRrAiPanelClosing(true);
      rrAiPanelCloseTimeoutRef.current = setTimeout(() => {
        rrAiPanelRenderedRef.current = false;
        setRrAiPanelRendered(false);
        setRrAiPanelClosing(false);
      }, 260);
    }
    return () => {
      if (rrAiPanelCloseTimeoutRef.current) clearTimeout(rrAiPanelCloseTimeoutRef.current);
    };
  }, [rrAiPanelOpen]);

  /* ─── Reopen AI Builder when parent asks (e.g. View agent builder after expand) ─── */
  useEffect(() => {
    if (aiBuilderPanelOpenProp) setRrAiPanelOpen(true);
  }, [aiBuilderPanelOpenProp]);

  const closeAiBuilderPanel = useCallback(() => {
    setRrAiPanelOpen(false);
    onAiBuilderPanelOpenChange?.(false);
  }, [onAiBuilderPanelOpenChange]);

  const closeAiBuilderPanelInstant = useCallback(() => {
    if (rrAiPanelCloseTimeoutRef.current) {
      clearTimeout(rrAiPanelCloseTimeoutRef.current);
      rrAiPanelCloseTimeoutRef.current = null;
    }
    rrAiPanelRenderedRef.current = false;
    setRrAiPanelRendered(false);
    setRrAiPanelClosing(false);
    setRrAiPanelOpen(false);
    onAiBuilderPanelOpenChange?.(false);
  }, [onAiBuilderPanelOpenChange]);

  /* Re-enable palette position transition after an instant AI → palette swap. */
  useEffect(() => {
    if (!paletteInstant) return undefined;
    const frame = requestAnimationFrame(() => setPaletteInstant(false));
    return () => cancelAnimationFrame(frame);
  }, [paletteInstant, paletteSection]);

  /* ─── View-only: keep canvas state in sync when workflow props change ─── */
  useEffect(() => {
    if (!viewOnly) return;
    if (initialNodes) setNodeList(initialNodes);
    if (initialNodeDetails) {
      setNodeDetails((prev) => {
        const base = initialNodeDetails;
        const startNode = base[START_NODE_ID];
        const pageTitleStr = (typeof pageTitle === 'string' ? pageTitle : '') || '';
        if (!startNode || !startNode.agentName) {
          return {
            ...base,
            [START_NODE_ID]: {
              goals: '',
              outcomes: '',
              locations: [],
              ...(startNode || {}),
              agentName: startNode?.agentName || pageTitleStr,
            },
          };
        }
        return base;
      });
    }
  }, [viewOnly, initialNodes, initialNodeDetails, pageTitle]);

  /* ─── Open a tool viewer by tool name or id (used when clicking a tool chip in prompts) ─── */
  const openToolByName = useCallback((nameOrId) => {
    const all = getSeedTools();
    const found = all.find(t => t.id === nameOrId || t.name === nameOrId || t.id === nameOrId.toLowerCase().replace(/\s+/g, '-'));
    if (found) {
      setViewingTool(found);
      // Look up saved field values for the filled state
      const savedValues = selectedNodeId
        ? (nodeDetails[selectedNodeId]?.toolFieldValues?.[found.id] ?? {})
        : {};
      setViewingToolValues(savedValues);
    }
  }, [selectedNodeId, nodeDetails]);

  /* ─── Load agent from URL slugs — re-runs whenever the URL params change ─── */
  useEffect(() => {
    if (viewOnly || !urlAgentSlug || !urlModuleSlug) return;

    function applyAgent(agent) {
      setAgentId(agent.id);
      setAgentModuleSlug(agent.moduleSlug || urlModuleSlug);
      setAgentSlug(agent.agentSlug || urlAgentSlug);
      const moduleCtx = agent.moduleContext || agent.moduleSlug || urlModuleSlug;
      setAgentModuleContext(moduleCtx);
      setAgentSectionContext(agent.sectionContext || '');
      setNavId(moduleCtx || activeNavId);
      setDerivedAppTitle(getModuleNav(agent.moduleContext || urlModuleSlug).title);
      // Restore template association — this is what puts the builder into template mode
      setAgentTemplateId(agent.templateId || '');
      setAgentTemplateSource(agent.templateSource || '');
      setNodeList(agent.nodes || []);
      setNodeDetails(() => {
        const base = agent.nodeDetails || {};
        const startNode = base[START_NODE_ID];
        return {
          ...base,
          [START_NODE_ID]: {
            goals: '', outcomes: '', locations: [],
            ...(startNode || {}),
            agentName: startNode?.agentName || agent.name || '',
          },
        };
      });
      setAgentStatus(agent.status || 'Draft');
      setSelectedNodeId(null);
      setDrawerOpen(false);
    }

    // Check cache first — instant load, no spinner
    const cached = getCachedAgent(urlAgentSlug, urlModuleSlug);
    if (cached) {
      setAgentNotFound(false);
      applyAgent(cached);
      setIsLoadingFromSlug(false);
      return;
    }

    // Cache miss — fetch from Firestore
    setAgentNotFound(false);
    setIsLoadingFromSlug(true);
    getAgentBySlug(urlModuleSlug, urlAgentSlug)
      .then((agent) => {
        if (!agent) { setAgentNotFound(true); return; }
        applyAgent(agent);
      })
      .catch(() => setAgentNotFound(true))
      .finally(() => setIsLoadingFromSlug(false));
  }, [urlAgentSlug, urlModuleSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Share modal ─── */
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleShare = useCallback(async () => {
    setHeaderMenuOpen(false);
    clearTimeout(saveTimerRef.current);
    const { agentId: id, agentName: name, agentDesc: desc, moduleContext: mod, sectionContext: sec, agentStatus: status, nodeList: nodes, nodeDetails: details, moduleSlug: msSlug, agentSlug: asSlug } = latestRef.current;
    await saveAgent(id, { id, name: name || 'Untitled agent', description: desc, status, moduleContext: mod, sectionContext: sec, moduleSlug: msSlug, agentSlug: asSlug, nodes, nodeDetails: details });
    setShareModalOpen(true);
  }, []);

  /* ─── Header three-dots menu ─── */
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [publishMenuOpen, setPublishMenuOpen] = useState(false);
  const [publishBlockedModalOpen, setPublishBlockedModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [draftRedirectModalOpen, setDraftRedirectModalOpen] = useState(false);
  const [resolveIssuesOpen, setResolveIssuesOpen] = useState(false);
  const headerMenuRef = useRef(null);
  const publishMenuRef = useRef(null);
  const resolveIssuesRef = useRef(null);
  const importInputRef = useRef(null);
  const blockActiveEditsForDraftRef = useRef(false);
  useEffect(() => {
    if (!headerMenuOpen) return;
    const handler = (e) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [headerMenuOpen]);
  useEffect(() => {
    if (!publishMenuOpen) return;
    const handler = (e) => {
      if (publishMenuRef.current && !publishMenuRef.current.contains(e.target)) {
        setPublishMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [publishMenuOpen]);
  useEffect(() => {
    if (!resolveIssuesOpen) return;
    const handler = (e) => {
      if (resolveIssuesRef.current && !resolveIssuesRef.current.contains(e.target)) {
        setResolveIssuesOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [resolveIssuesOpen]);
  /* ─── Agent name is derived from nodeDetails (single source of truth) ─── */
  const agentName = nodeDetails[START_NODE_ID]?.agentName || (typeof pageTitle === 'string' ? pageTitle : '') || '';
  // Shell/chrome identity must stay stable while the user edits the start-node
  // name in Agent details — otherwise renaming off "Review response…" flips the
  // canvas back to the classic LHS drawer mid-edit.
  const entryAgentName = (typeof pageTitle === 'string' && pageTitle.trim()) ? pageTitle : agentName;
  const isReminderAgent = /reminder/i.test(entryAgentName);
  const isWaitlistAgent = /\bwaitlist\b/i.test(entryAgentName);
  const isPreVisitAgent = /\bpre-visit\b/i.test(entryAgentName);
  const appTitleStr = typeof appTitle === 'string' ? appTitle : '';
  // Front-desk-specific behaviour (task filters, etc.) — name / parent flag.
  const isFrontDeskAgentName =
    !!showProceduresPalette ||
    isFrontDeskCanvasAgent(entryAgentName, agentName, appTitleStr);
  const isReviewResponseAgent = /review response/i.test(entryAgentName) || /review response/i.test(agentName);
  const isReviewGenerationAgent = /review generation/i.test(entryAgentName) || /review generation/i.test(agentName);
  const isReviewsAiAgent = isReviewResponseAgent || isReviewGenerationAgent;
  // All exploration-family canvases (Sep 1 + exploration) — grouped bottom-left controls.
  const combineControlsLeft = sep1Chrome;
  const hideProceduresFloater =
    isReviewsAiAgent || isWaitlistAgent || isPreVisitAgent || isReminderAgent;
  // Procedures floater: Front desk family only — not Reviews AI, Waitlist, Pre-visit, or Reminder.
  const showProceduresFloater =
    !hideProceduresFloater &&
    (isFrontDeskAgentName || showProceduresPalette == null);
  const isHcProduct = product === 'healthcare' || product === 'dental';
  // All agent canvases use floating chrome (left floater + Create with AI panel + RHS config).
  const isReviewResponseChrome = true;

  // Close Procedures palette if it was open when landing on a canvas without the floater.
  useEffect(() => {
    if (!showProceduresFloater && paletteSection === 'Procedures') {
      setPaletteSection(null);
    }
  }, [showProceduresFloater, paletteSection]);
  const resolveIssuesList =
    (Array.isArray(issues) && issues.length > 0 ? issues : null) ||
    getAgentIssues(entryAgentName);

  const issuesByNodeId = useMemo(() => {
    const map = new Map();
    resolveIssuesList.forEach((issue) => {
      if (!issue.nodeId) return;
      const existing = map.get(issue.nodeId) || [];
      map.set(issue.nodeId, [...existing, issue]);
    });
    return map;
  }, [resolveIssuesList]);

  const [canvasFocusNodeId, setCanvasFocusNodeId] = useState(null);

  // Parent-driven focus (log step click) — also expand any collapsed branch that holds the node.
  useEffect(() => {
    if (!externalFocusNodeId) return;
    const located = locateNodeContainer(externalFocusNodeId, nodeList, nodeDetails);
    if (located?.containerId) {
      const branchPathId = located.containerId;
      const parentBranchId = nodeDetails[branchPathId]?.parentId;
      if (parentBranchId) {
        setCollapsedBranches((prev) => ({ ...prev, [parentBranchId]: false }));
      }
      setCollapsedBranchPaths((prev) => ({ ...prev, [branchPathId]: false }));
    }
    // Clear first so re-focusing the same id still triggers FlowCanvas's pan effect.
    setCanvasFocusNodeId(null);
    const frame = requestAnimationFrame(() => setCanvasFocusNodeId(externalFocusNodeId));
    return () => cancelAnimationFrame(frame);
  }, [externalFocusNodeId, externalFocusNonce, nodeList, nodeDetails]);

  // Undo/redo history for the floating-chrome canvas toolbar.
  const [historyPast, setHistoryPast] = useState([]);
  const [historyFuture, setHistoryFuture] = useState([]);
  const historySnapshotRef = useRef(null);
  const isApplyingHistoryRef = useRef(false);

  useEffect(() => {
    if (!isReviewResponseChrome) return;
    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false;
      historySnapshotRef.current = { nodeList, nodeDetails };
      return;
    }
    if (historySnapshotRef.current) {
      setHistoryPast((prev) => [...prev, historySnapshotRef.current].slice(-50));
      setHistoryFuture([]);
    }
    historySnapshotRef.current = { nodeList, nodeDetails };
  }, [nodeList, nodeDetails, isReviewResponseChrome]);

  const handleUndo = useCallback(() => {
    setHistoryPast((prev) => {
      if (!prev.length) return prev;
      const previous = prev[prev.length - 1];
      setHistoryFuture((future) => [{ nodeList, nodeDetails }, ...future]);
      isApplyingHistoryRef.current = true;
      setNodeList(previous.nodeList);
      setNodeDetails(previous.nodeDetails);
      return prev.slice(0, -1);
    });
  }, [nodeList, nodeDetails]);

  const handleRedo = useCallback(() => {
    setHistoryFuture((future) => {
      if (!future.length) return future;
      const next = future[0];
      setHistoryPast((past) => [...past, { nodeList, nodeDetails }]);
      isApplyingHistoryRef.current = true;
      setNodeList(next.nodeList);
      setNodeDetails(next.nodeDetails);
      return future.slice(1);
    });
  }, [nodeList, nodeDetails]);

  const [agentDesc] = useState(initialDescription || '');
  // isTemplateMode uses state so it correctly activates after applyAgent loads templateId from Firestore
  const isTemplateMode = !!agentTemplateId && agentStatus !== 'Active';

  /* ─── Always-fresh ref so publish never reads stale closure values ─── */
  const latestRef = useRef({});
  useLayoutEffect(() => {
    latestRef.current = { agentId, agentName, agentDesc, moduleContext: agentModuleContext, sectionContext: agentSectionContext, agentStatus, nodeList, nodeDetails, selectedNodeId, templateId: agentTemplateId, templateSource: agentTemplateSource, moduleSlug: agentModuleSlug, agentSlug };
  }, [agentId, agentName, agentDesc, agentModuleContext, agentSectionContext, agentStatus, nodeList, nodeDetails, selectedNodeId, agentTemplateId, agentTemplateSource, agentModuleSlug, agentSlug]);

  /* ─── Auto-save to Firestore (debounced 1.5 s) ─── */
  const saveTimerRef = useRef(null);
  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    if (!agentId || viewOnly || isTemplateMode) return;
    saveTimerRef.current = setTimeout(() => {
      const { agentId: id, agentName: name, agentDesc: desc, moduleContext: mod, sectionContext: sec, agentStatus: status, nodeList: nodes, nodeDetails: details, moduleSlug: msSlug, agentSlug: asSlug } = latestRef.current;
      saveAgent(id, { id, name: name || 'Untitled agent', description: desc, status, moduleContext: mod, sectionContext: sec, moduleSlug: msSlug, agentSlug: asSlug, nodes, nodeDetails: details });
    }, 1500);
    return () => clearTimeout(saveTimerRef.current);
  }, [agentName, nodeList, nodeDetails, agentId, agentModuleContext, agentSectionContext, agentStatus, isTemplateMode]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Flush any pending auto-save immediately when navigating away ─── */
  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current);
      const { agentId: id, agentName: name, agentDesc: desc, moduleContext: mod, sectionContext: sec, agentStatus: status, nodeList: nodes, nodeDetails: details, moduleSlug: msSlug, agentSlug: asSlug } = latestRef.current;
      if (id && !viewOnly && !isTemplateMode) {
        saveAgent(id, { id, name: name || 'Untitled agent', description: desc, status, moduleContext: mod, sectionContext: sec, moduleSlug: msSlug, agentSlug: asSlug, nodes, nodeDetails: details });
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const buildTemplatePayload = useCallback(() => {
    const { agentName: name, agentDesc: desc, moduleContext: mod, sectionContext: sec, nodeList: nodes, nodeDetails: details, templateId: tmplId, templateSource: source } = latestRef.current;
    const finalName = (name || details?.[START_NODE_ID]?.agentName || '').trim();
    if (!finalName) return null;
    return {
      id: tmplId,
      title: finalName,
      description: (desc || initialDescription || '').trim(),
      moduleContext: mod,
      sectionContext: sec,
      source: source || 'custom',
      nodes,
      nodeDetails: details,
    };
  }, [initialDescription]);

  const buildAgentPayload = useCallback((status = 'Active') => {
    const { agentId: id, agentName: name, agentDesc: desc, moduleContext: mod, sectionContext: sec, nodeList: nodes, nodeDetails: details, moduleSlug: msSlug, agentSlug: asSlug, templateId: tmplId } = latestRef.current;
    const finalName = (name || details?.[START_NODE_ID]?.agentName || '').trim();
    if (!finalName) return null;
    return {
      id,
      name: finalName,
      description: (desc || '').trim(),
      status,
      moduleContext: mod,
      sectionContext: sec,
      moduleSlug: msSlug,
      agentSlug: asSlug,
      templateId: tmplId,
      nodes,
      nodeDetails: details,
    };
  }, []);

  const handleSaveTemplate = useCallback(async () => {
    clearTimeout(saveTimerRef.current);
    const payload = buildTemplatePayload();
    if (!payload) return;
    try {
      await onSaveTemplate?.(payload);
      onClose?.();
    } catch (e) {
      console.error('Template save failed', e);
    }
  }, [buildTemplatePayload, onClose, onSaveTemplate]);

  const handlePublish = useCallback(async () => {
    clearTimeout(saveTimerRef.current);
    const payload = buildAgentPayload('Active');
    if (!payload) {
      // No agent name — reschedule auto-save so the pending changes are not lost
      saveTimerRef.current = setTimeout(() => {
        const { agentId: id, agentName: name, agentDesc: desc, moduleContext: mod, sectionContext: sec, agentStatus: status, nodeList: nodes, nodeDetails: details, moduleSlug: msSlug, agentSlug: asSlug } = latestRef.current;
        saveAgent(id, { id, name: name || 'Untitled agent', description: desc, status, moduleContext: mod, sectionContext: sec, moduleSlug: msSlug, agentSlug: asSlug, nodes, nodeDetails: details });
      }, 1500);
      return;
    }
    try {
      await saveAgent(payload.id, payload);
      setAgentStatus('Active');
      onSaveAgent?.(true, payload);
    } catch (e) {
      console.error('Publish failed', e);
      // Save failed — reschedule auto-save so data is not silently lost
      saveTimerRef.current = setTimeout(() => {
        const { agentId: id, agentName: name, agentDesc: desc, moduleContext: mod, sectionContext: sec, agentStatus: status, nodeList: nodes, nodeDetails: details, moduleSlug: msSlug, agentSlug: asSlug } = latestRef.current;
        saveAgent(id, { id, name: name || 'Untitled agent', description: desc, status, moduleContext: mod, sectionContext: sec, moduleSlug: msSlug, agentSlug: asSlug, nodes, nodeDetails: details });
      }, 1500);
    }
  }, [buildAgentPayload, onSaveAgent]);

  const handlePublishAttempt = useCallback(() => {
    if (issueCount > 0) {
      setPublishMenuOpen(false);
      setPublishBlockedModalOpen(true);
      return;
    }
    handlePublish();
  }, [issueCount, handlePublish]);

  const handleViewPublishErrors = useCallback(() => {
    setPublishBlockedModalOpen(false);
    setResolveIssuesOpen(true);
  }, []);

  const handleSaveAsDraft = useCallback(async () => {
    setPublishMenuOpen(false);
    clearTimeout(saveTimerRef.current);
    const payload = buildAgentPayload('Draft');
    if (!payload) return;
    try {
      await saveAgent(payload.id, payload);
      setAgentStatus('Draft');
      onSaveAgent?.(false, payload);
    } catch (e) {
      console.error('Save as draft failed', e);
    }
  }, [buildAgentPayload, onSaveAgent]);

  const handlePause = useCallback(async () => {
    clearTimeout(saveTimerRef.current);
    const payload = buildAgentPayload('Inactive');
    if (!payload) {
      setAgentStatus('Inactive');
      return;
    }
    try {
      await saveAgent(payload.id, payload);
      setAgentStatus('Inactive');
      onSaveAgent?.(false, payload);
    } catch (e) {
      console.error('Pause failed', e);
      setAgentStatus('Inactive');
    }
  }, [buildAgentPayload, onSaveAgent]);

  const handleResume = useCallback(async () => {
    clearTimeout(saveTimerRef.current);
    const payload = buildAgentPayload('Active');
    if (!payload) {
      setAgentStatus('Active');
      return;
    }
    try {
      await saveAgent(payload.id, payload);
      setAgentStatus('Active');
      onSaveAgent?.(true, payload);
    } catch (e) {
      console.error('Resume failed', e);
      setAgentStatus('Active');
    }
  }, [buildAgentPayload, onSaveAgent]);

  const handleActivateMain = useCallback(() => {
    if (agentStatus === 'Inactive') {
      handleResume();
      return;
    }
    handlePublishAttempt();
  }, [agentStatus, handleResume, handlePublishAttempt]);

  const handleOpenVersionHistory = useCallback(() => {
    setHeaderMenuOpen(false);
    setPaletteSection(null);
    if (!versionHistoryOpen) closeAiBuilderPanel();
    setDraftVersionHistory(false);
    setVersionHistorySelectedId(VERSION_HISTORY_VERSIONS[0]?.id ?? null);
    setVersionHistoryOpen((open) => !open);
    setHelpCenterOpen(false);
  }, [versionHistoryOpen, closeAiBuilderPanel]);

  /**
   * Draft agent's "View active version": opens history with the unpublished draft as the
   * first card and the live version selected, so the canvas shows what's actually running.
   * The agent stays in Draft — this only browses.
   */
  const handleViewActiveVersion = useCallback(() => {
    setHeaderMenuOpen(false);
    setPaletteSection(null);
    closeAiBuilderPanel();
    setDraftVersionHistory(true);
    const liveVersion = VERSION_HISTORY_VERSIONS.find((v) => v.status === 'Active');
    setVersionHistorySelectedId(liveVersion?.id ?? VERSION_HISTORY_VERSIONS[0]?.id ?? null);
    setVersionHistoryOpen(true);
    setHelpCenterOpen(false);
  }, [closeAiBuilderPanel]);

  /** Leave Active and open the unpublished draft so the user can continue editing there. */
  const handleGoToDraftVersion = useCallback(() => {
    setDraftRedirectModalOpen(false);
    setVersionHistoryOpen(false);
    setDraftVersionHistory(false);
    setAgentStatus('Draft');
  }, []);

  /** Delete is destructive and irreversible — always confirm before acting. */
  const handleDeleteAgent = useCallback(() => {
    setHeaderMenuOpen(false);
    setDeleteConfirmOpen(true);
  }, []);

  /**
   * Confirmed delete. `onClose` is what returns the user to the agent list, so it runs
   * whether or not the service call succeeds — the agent is gone from their view either
   * way, and stranding them on a deleted agent's canvas would be worse.
   */
  const handleConfirmDeleteAgent = useCallback(async () => {
    setDeleteConfirmOpen(false);
    try {
      await deleteAgent(agentId);
    } catch (e) {
      console.error('Delete agent failed', e);
    }
    // `onDeleted` lands on the agent list; `onClose` would restore the deleted agent's
    // own instance screen, so it's only the fallback when the parent opts out.
    (onDeleted ?? onClose)?.();
  }, [agentId, onDeleted, onClose]);

  const handleSaveAndPublish = useCallback(async () => {
    clearTimeout(saveTimerRef.current);
    const templatePayload = buildTemplatePayload();
    const agentPayload = buildAgentPayload('Active');
    if (!templatePayload || !agentPayload) return;
    try {
      await onSaveTemplate?.(templatePayload);
      await saveAgent(agentPayload.id, agentPayload);
      setAgentStatus('Active');
    } catch (e) {
      console.error('Save and publish failed', e);
      return;
    }
    onSaveAgent?.(true, agentPayload);
  }, [buildAgentPayload, buildTemplatePayload, onSaveAgent, onSaveTemplate]);

  /* ─── Download handler — full self-contained export ─── */
  const handleExport = useCallback(async () => {
    // Collect IDs of custom tools referenced in any node's selectedTools
    const referencedIds = new Set();
    Object.values(nodeDetails).forEach((detail) => {
      if (Array.isArray(detail.selectedTools)) {
        detail.selectedTools.forEach((id) => referencedIds.add(id));
      }
    });

    let exportedTools = [];
    if (referencedIds.size > 0) {
      const allTools = await getCustomTools();
      exportedTools = allTools.filter((t) => referencedIds.has(t.id));
    }

    const payload = {
      name: agentName,
      description: agentDesc,
      moduleContext: agentModuleContext,
      exportedAt: new Date().toISOString(),
      nodes: nodeList,
      nodeDetails,
      customTools: exportedTools,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agentName.replace(/\s+/g, '-').toLowerCase() || 'agent'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [agentName, agentDesc, agentModuleContext, nodeList, nodeDetails]);

  /* ─── Import handler — load agent from JSON file ─── */
  const handleImport = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Re-save any embedded custom tools so they exist in this project's Firestore
      if (Array.isArray(data.customTools) && data.customTools.length > 0) {
        await Promise.all(data.customTools.map((tool) => saveCustomTool(tool)));
      }

      // Apply the imported graph as a new agent (fresh ID so it doesn't overwrite an existing one)
      const newId = crypto.randomUUID();
      setAgentId(newId);
      if (data.moduleContext) setAgentModuleContext(data.moduleContext);
      setNodeList(data.nodes || []);
      setNodeDetails(data.nodeDetails || {});
    } catch (err) {
      console.error('Import failed:', err);
    }
    // Reset so the same file can be re-imported if needed
    e.target.value = '';
  }, []);

  /* ─── Live node sync: RHS → canvas ─── */
  const handleNodeFieldChange = useCallback((nodeId, field, value) => {
    if (blockActiveEditsForDraftRef.current) {
      setDraftRedirectModalOpen(true);
      return;
    }
    setNodeDetails((prev) => {
      const nodeDet = prev[nodeId] || {};
      const updated = { ...prev, [nodeId]: { ...nodeDet, [field]: value } };
      // When a branch path's name changes, sync it into the parent's branches array
      // so buildFlow picks up the new label for the canvas chip
      if (field === 'branchName' && nodeDet.isBranchPath && nodeDet.parentId) {
        const parentId = nodeDet.parentId;
        const parentDet = prev[parentId] || {};
        updated[parentId] = {
          ...parentDet,
          branches: (parentDet.branches || []).map((b) =>
            b.id === nodeId ? { ...b, name: value } : b
          ),
        };
      }
      if (field === 'branches') {
        value.forEach((branch) => {
          if (!updated[branch.id]) {
            updated[branch.id] = {
              branchName: branch.name,
              description: '',
              conditions: [],
              parentId: nodeId,
              isBranchPath: true,
              isFallback: !!branch.isFallback,
              nodes: [],
            };
          } else {
            updated[branch.id] = {
              ...updated[branch.id],
              branchName: branch.name,
              parentId: nodeId,
              isBranchPath: true,
              isFallback: !!branch.isFallback,
            };
          }
        });
      }
      Object.entries(updated).forEach(([key, details]) => {
        if (!details?.nodes) return;
        updated[key] = {
          ...details,
          nodes: details.nodes.map((node) => {
            if (node.id !== nodeId) return node;
            const nodeUpdates = {};
            if (['triggerName', 'taskName', 'name', 'nodeName', 'branchName'].includes(field)) {
              nodeUpdates.title = value;
            }
            if (field === 'description') nodeUpdates.subtitle = value;
            return { ...node, data: { ...node.data, ...nodeUpdates } };
          }),
        };
      });
      return updated;
    });
    // Mirror name/description changes into the canvas node body
    setNodeList((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId) return n;
        const updates = {};
        if (['triggerName', 'taskName', 'name', 'nodeName', 'branchName'].includes(field)) {
          updates.title = value;
        }
        if (field === 'description') updates.subtitle = value;
        return { ...n, data: { ...n.data, ...updates } };
      })
    );
  }, []);

  /* ─── Node management ─── */

  const handleDeleteNode = useCallback((nodeId) => {
    const target = (latestRef.current.nodeList || []).find((n) => n.id === nodeId);
    const wasTrigger = target?.flowType === 'trigger';

    setNodeList((prev) => {
      const found = prev.find((n) => n.id === nodeId);
      if (!found) return prev;
      const updated = prev.filter((n) => n.id !== nodeId);
      return updated.map((n, i) => ({
        ...n,
        data: { ...n.data, stepNumber: i + 1 },
      }));
    });
    setNodeDetails((prev) => {
      const copy = { ...prev };
      Object.values(copy).forEach((details) => {
        if (details?.nodes) {
          details.nodes = details.nodes.filter((node) => node.id !== nodeId);
        }
      });
      Object.keys(copy).forEach((key) => {
        if (key === nodeId || copy[key]?.parentId === nodeId) {
          delete copy[key];
        }
      });
      return copy;
    });
    setCollapsedBranches((prev) => {
      if (!prev[nodeId]) return prev;
      const next = { ...prev };
      delete next[nodeId];
      return next;
    });
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      setDrawerOpen(false);
    }
    // Deleting the trigger removes only the trigger — the steps below stay. buildFlow then
    // brings the "Add a trigger" placeholder back at slot 1 and renumbers steps from 2.
    // Re-open the LHS Trigger section to invite adding a new one.
    if (wasTrigger) {
      setActiveProcedureId(null);
      setLhsCollapsed(false);
      setLhsForceOpenSection('Trigger');
    }
  }, [selectedNodeId]);

  const handleCopyNode = useCallback((nodeId) => {
    const located = locateNodeContainer(nodeId, nodeList, nodeDetails);
    if (!located) return;
    const nodeEntry = located.containerId
      ? nodeDetails[located.containerId]?.nodes?.[located.index]
      : nodeList[located.index];
    if (!nodeEntry) return;
    setClipboard({
      nodeEntry: JSON.parse(JSON.stringify(nodeEntry)),
      detailsSnapshot: collectDetailsSnapshot(nodeId, nodeDetails),
    });
  }, [nodeList, nodeDetails]);

  const handlePasteBelow = useCallback((afterNodeId) => {
    if (!clipboard) return;
    const located = locateNodeContainer(afterNodeId, nodeList, nodeDetails);
    if (!located) return;
    const extraOut = {};
    const newEntry = cloneSubtreeForPaste(clipboard.nodeEntry, clipboard.detailsSnapshot, extraOut);

    if (located.containerId) {
      setNodeDetails((prev) => {
        const container = prev[located.containerId] || {};
        const existingNodes = container.nodes || [];
        const nextNodes = [
          ...existingNodes.slice(0, located.index + 1),
          newEntry,
          ...existingNodes.slice(located.index + 1),
        ].map((n, i) => ({ ...n, data: { ...n.data, stepNumber: i + 1 } }));
        return {
          ...prev,
          ...extraOut,
          [located.containerId]: { ...container, nodes: nextNodes },
        };
      });
    } else {
      setNodeList((prev) => {
        const next = [
          ...prev.slice(0, located.index + 1),
          newEntry,
          ...prev.slice(located.index + 1),
        ];
        return next.map((n, i) => ({ ...n, data: { ...n.data, stepNumber: i + 1 } }));
      });
      setNodeDetails((prev) => ({ ...prev, ...extraOut }));
    }
    setClipboard(null);
  }, [clipboard, nodeList, nodeDetails]);

  const handlePasteReplace = useCallback((nodeId) => {
    if (!clipboard) return;
    const located = locateNodeContainer(nodeId, nodeList, nodeDetails);
    if (!located) return;
    const extraOut = {};
    const newEntry = cloneSubtreeForPaste(clipboard.nodeEntry, clipboard.detailsSnapshot, extraOut);
    const oldIds = collectAllIds(nodeId, nodeDetails);

    if (located.containerId) {
      setNodeDetails((prev) => {
        const parentContainer = prev[located.containerId] || {};
        const nodes = (parentContainer.nodes || []).map((n, i) => {
          const updated = n.id === nodeId ? newEntry : n;
          return { ...updated, data: { ...updated.data, stepNumber: i + 1 } };
        });
        const copy = { ...prev };
        oldIds.forEach((id) => { delete copy[id]; });
        Object.assign(copy, extraOut);
        copy[located.containerId] = { ...parentContainer, nodes };
        return copy;
      });
    } else {
      setNodeList((prev) => prev.map((n, i) => {
        const updated = n.id === nodeId ? newEntry : n;
        return { ...updated, data: { ...updated.data, stepNumber: i + 1 } };
      }));
      setNodeDetails((prev) => {
        const copy = { ...prev };
        oldIds.forEach((id) => { delete copy[id]; });
        Object.assign(copy, extraOut);
        return copy;
      });
    }
    if (oldIds.includes(selectedNodeId)) {
      setSelectedNodeId(null);
      setDrawerOpen(false);
    }
    setClipboard(null);
  }, [clipboard, nodeList, nodeDetails, selectedNodeId]);

  const handleMoveNode = useCallback((nodeId, direction) => {
    setNodeList((prev) => {
      const idx = prev.findIndex((n) => n.id === nodeId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next.map((n, i) => ({ ...n, data: { ...n.data, stepNumber: i + 1 } }));
    });
  }, []);

  const handleNodeToggleChange = useCallback((nodeId, enabled) => {
    setNodeList((prev) => {
      const inMain = prev.some((n) => n.id === nodeId);
      if (inMain) {
        return prev.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, toggleEnabled: enabled } } : n,
        );
      }
      return prev;
    });
    setNodeDetails((prev) => {
      let updated = false;
      const copy = { ...prev };
      Object.keys(copy).forEach((key) => {
        const branchNodes = copy[key]?.nodes;
        if (!branchNodes?.length) return;
        const idx = branchNodes.findIndex((n) => n.id === nodeId);
        if (idx === -1) return;
        const nodes = [...branchNodes];
        nodes[idx] = { ...nodes[idx], data: { ...nodes[idx].data, toggleEnabled: enabled } };
        copy[key] = { ...copy[key], nodes };
        updated = true;
      });
      return updated ? copy : prev;
    });
  }, []);

  const handleDeleteBranchPath = useCallback((branchPathId) => {
    setNodeDetails((prev) => {
      const copy = { ...prev };
      const parentId = copy[branchPathId]?.parentId;
      const siblingCount = parentId ? (copy[parentId]?.branches || []).length : 0;
      // Never drop below two paths on a condition branch.
      if (parentId && siblingCount <= 2) return prev;
      if (copy[branchPathId]?.isFallback) return prev;
      if (parentId) {
        copy[parentId] = {
          ...copy[parentId],
          branches: (copy[parentId]?.branches || []).filter((b) => b.id !== branchPathId),
        };
      }
      const childNodes = copy[branchPathId]?.nodes || [];
      childNodes.forEach((node) => { delete copy[node.id]; });
      delete copy[branchPathId];
      return copy;
    });
    setCollapsedBranches((prev) => {
      if (!prev[branchPathId]) return prev;
      const next = { ...prev };
      delete next[branchPathId];
      return next;
    });
    setCollapsedBranchPaths((prev) => {
      if (!prev[branchPathId]) return prev;
      const next = { ...prev };
      delete next[branchPathId];
      return next;
    });
    if (selectedNodeId === branchPathId) {
      setSelectedNodeId(null);
      setDrawerOpen(false);
    }
  }, [selectedNodeId]);

  const handleToggleBranchCollapse = useCallback((branchNodeId) => {
    setCollapsedBranches((prev) => {
      const nextCollapsed = !prev[branchNodeId];
      if (nextCollapsed) {
        const details = latestRef.current.nodeDetails || {};
        const childIds = new Set();
        (details[branchNodeId]?.branches || []).forEach((b) => {
          childIds.add(b.id);
          (details[b.id]?.nodes || []).forEach((n) => childIds.add(n.id));
        });
        const selected = latestRef.current.selectedNodeId;
        if (selected && childIds.has(selected)) {
          setSelectedNodeId(null);
          setDrawerOpen(false);
        }
      }
      return { ...prev, [branchNodeId]: nextCollapsed };
    });
  }, []);

  const handleToggleBranchPathCollapse = useCallback((branchPathId) => {
    setCollapsedBranchPaths((prev) => {
      const nextCollapsed = !prev[branchPathId];
      if (nextCollapsed) {
        const childIds = new Set(
          (latestRef.current.nodeDetails?.[branchPathId]?.nodes || []).map((n) => n.id),
        );
        const selected = latestRef.current.selectedNodeId;
        if (selected && childIds.has(selected)) {
          setSelectedNodeId(null);
          setDrawerOpen(false);
        }
      }
      return { ...prev, [branchPathId]: nextCollapsed };
    });
  }, []);

  // "Add locations" link on the start node — opens the agent-details RHS panel straight
  // into its Locations picker, whether or not that panel is already open.
  const handleAddLocationsFromCanvas = () => {
    setSelectedNodeId(START_NODE_ID);
    setDrawerOpen(true);
    setStartLocationsOpenToken((t) => t + 1);
  };

  // Shared open path for the header agent name and the canvas start-node card.
  const handleOpenAgentDetails = useCallback(() => {
    setPaletteSection(null);
    setVersionHistoryOpen(false);
    setSelectedNodeId(START_NODE_ID);
    setDrawerOpen(true);
  }, []);

  const startAgentName = nodeDetails[START_NODE_ID]?.agentName || pageTitle;
  const startLocations = nodeDetails[START_NODE_ID]?.locations || [];
  const locationsSelectBy = nodeDetails[START_NODE_ID]?.locationsSelectBy || null;
  const locationCount = startLocations.length;
  const startSubtitle = (() => {
    const byGroup = formatSelectByCanvasSubtitle(locationsSelectBy);
    if (byGroup) return byGroup;
    if (locationCount === 0) return 'Add locations';
    if (locationCount === 1) return '1 location';
    return `${locationCount} locations`;
  })();
  const startData = {
    title: startAgentName,
    subtitle: startSubtitle,
    subtitleIsLink: locationCount === 0 && !locationsSelectBy,
    onSubtitleClick: locationCount === 0 && !locationsSelectBy ? handleAddLocationsFromCanvas : undefined,
  };
  // Scratch create (exploration): no version history yet; test/preview stays off until the agent exists.
  const isScratchCreate = explorationChrome && !existingAgent;
  /**
   * Exploration only: while the version history panel is open the canvas turns into a
   * read-only "browsing an old version" surface — no add-node palette, no build/run
   * actions, and Publish is swapped for a Restore CTA.
   */
  const versionHistoryMode = versionHistoryOpen && explorationChrome;
  /** Live Active + unpublished draft — RHS mutations redirect to the draft instead. */
  blockActiveEditsForDraftRef.current =
    Boolean(hasUnpublishedDraft) && agentStatus !== 'Draft' && !viewOnly && !versionHistoryMode;
  /** Draft entry point prepends the working copy; every other entry point uses the plain list. */
  const versionHistoryList = draftVersionHistory
    ? [DRAFT_VERSION, ...VERSION_HISTORY_VERSIONS]
    : VERSION_HISTORY_VERSIONS;
  const selectedVersion =
    versionHistoryList.find((v) => v.id === versionHistorySelectedId)
    || versionHistoryList[0];
  /**
   * Cancel/Restore is hidden only where restoring would be a no-op:
   *  - the draft — it already *is* the working copy;
   *  - the live version, except in the draft flow, where restoring it is meaningful:
   *    it discards the draft and puts the canvas back on what's running.
   */
  const hideVersionActions =
    selectedVersion?.status === 'Draft'
    || (selectedVersion?.status === 'Active' && !draftVersionHistory);
  const rhsViewOnly = viewOnly || versionHistoryMode;
  const closeVersionHistory = () => {
    setVersionHistoryOpen(false);
    setDraftVersionHistory(false);
    setVersionHistorySelectedId(VERSION_HISTORY_VERSIONS[0]?.id ?? null);
  };
  /**
   * Anything occupying the 450px right slot — node config, Help center, or Test details.
   * Drives the exploration actions pill sliding left so the panel never covers it.
   */
  // Preview (Front desk play) sits in the same right slot as node config / Help / Test details —
  // slide the top-right chrome left so Pause / Publish don't overlap it.
  const rightPanelOpen =
    rhsRendered || helpRendered || testRunOpen || (previewOpen && !isReviewResponseAgent);
  /** Shared by the top-right floater and (exploration) the bottom editor-row pill. */
  const toggleHelpCenter = () => {
    setVersionHistoryOpen(false);
    setHelpCenterOpen((open) => {
      // Exploration: help occupies the node-config RHS slot, so the two can't coexist.
      if (!open && explorationChrome) {
        handleCloseDrawer();
        setPreviewOpen(false);
      }
      return !open;
    });
  };
  const { nodes: rawNodes, edges } = buildFlow(
    nodeList,
    startData,
    nodeDetails,
    product,
    collapsedBranches,
    collapsedBranchPaths,
    { hideStartNode: hideCanvasStartNode },
  );

  const nodes = rawNodes.map((n) => {
    if (n.id === START_NODE_ID || n.id === END_NODE_ID) return n;
    if (n.type === 'branchCollapse') {
      return {
        ...n,
        data: {
          ...n.data,
          onToggle: () => handleToggleBranchCollapse(n.data.parentBranchId),
        },
      };
    }
    if (n.type === 'branchPath') {
      return {
        ...n,
        data: {
          ...n.data,
          viewOnly,
          focusBranchPathId,
          onDelete:
            viewOnly || n.data.isFallback || n.data.isVoiceCallBranch || !n.data.canDeletePath
              ? undefined
              : () => handleDeleteBranchPath(n.id),
          onToggleCollapse: () => handleToggleBranchPathCollapse(n.id),
        },
      };
    }
    if (n.type === 'branchEnd') return n;
    const nodeIssueList = issuesByNodeId.get(n.id);
    const hasAgentIssue = !!(nodeIssueList?.length);
    const hasTaskSaveError = taskErrorNodeIds.has(n.id);
    const issueLabel = hasAgentIssue ? nodeIssueList[0].title : undefined;
    const issueTooltip = issueLabel
      || (hasTaskSaveError ? 'Missing mandatory fields' : undefined);
    const nodeIdx = nodeList.findIndex((nl) => nl.id === n.id);
    const extra = {
      onDelete: () => handleDeleteNode(n.id),
      onCopy: () => handleCopyNode(n.id),
      hasClipboard: !!clipboard,
      onPasteBelow: () => handlePasteBelow(n.id),
      onPasteReplace: () => handlePasteReplace(n.id),
      onMoveUp: () => handleMoveNode(n.id, 'up'),
      onMoveDown: () => handleMoveNode(n.id, 'down'),
      canMoveUp: !viewOnly && nodeIdx > 0,
      canMoveDown: !viewOnly && nodeIdx !== -1 && nodeIdx < nodeList.length - 1,
      hasError: explorationChrome && (hasTaskSaveError || hasAgentIssue),
      showConfigWarning: !!(n.data.showConfigWarning && !hasAgentIssue && !hasTaskSaveError),
      errorTooltip: issueTooltip,
      // Log run view + exploration Run test: swap the header glyph for a spinner/check.
      runStatus: logDoneNodeIds?.includes(n.id)
        ? 'done'
        : !explorationChrome || !testRunOpen
          ? undefined
          : n.id === testRunActiveId
            ? 'running'
            : testRun.doneNodeIds.includes(n.id)
              ? 'done'
              : undefined,
    };
    if (n.type === 'task' && !viewOnly) {
      extra.onToggleChange = (enabled) => handleNodeToggleChange(n.id, enabled);
    }
    if (n.type === 'procedures') {
      extra.selectedProcedureId = n.id === selectedNodeId ? activeProcedureId : null;
      extra.onSelectProcedure = (procedureId) => {
        setSelectedNodeId(n.id);
        setDrawerOpen(true);
        setActiveProcedureId(procedureId);
      };
      if (!viewOnly) {
        extra.onToggleChange = (enabled) => handleNodeToggleChange(n.id, enabled);
        extra.onDropProcedure = (procedureId) => {
          const resolvedId = isCustomProcedureId(procedureId) ? CUSTOM_PROCEDURE_ID : procedureId;
          setNodeDetails((prev) => {
            const existing = prev[n.id]?.procedureIds || [];
            if (existing.includes(resolvedId)) return prev;
            const nodePatch = {
              ...(prev[n.id] || {}),
              procedureIds: [...existing, resolvedId],
            };
            if (resolvedId === CUSTOM_PROCEDURE_ID) {
              nodePatch.procedureOverrides = {
                ...(prev[n.id]?.procedureOverrides || {}),
                [CUSTOM_PROCEDURE_ID]: {
                  name: 'Custom',
                  whenToUse: '',
                  stepsText: '',
                  contextChips: [],
                  addToLibrary: false,
                  ...(prev[n.id]?.procedureOverrides?.[CUSTOM_PROCEDURE_ID] || {}),
                },
              };
            }
            return { ...prev, [n.id]: nodePatch };
          });
          // Open the RHS detail panel for the dropped procedure
          setSelectedNodeId(n.id);
          setDrawerOpen(true);
          setActiveProcedureId(resolvedId);
        };
        extra.onRemoveProcedure = (procedureId) => {
          setNodeDetails((prev) => {
            const existing = prev[n.id]?.procedureIds || [];
            return {
              ...prev,
              [n.id]: {
                ...(prev[n.id] || {}),
                procedureIds: existing.filter((pid) => pid !== procedureId),
              },
            };
          });
        };
      }
    }
    return { ...n, data: { ...n.data, ...extra } };
  });

  const branchChildNodes = Object.values(nodeDetails).flatMap((details) => details?.nodes || []);

  // Branch path entries (e.g. wl-5-path-1) are not in nodeList or branchChildNodes,
  // so synthesise lightweight node objects from nodeDetails so clicking a branch chip
  // can resolve selectedNode and open the correct RHS panel.
  const branchPathNodes = Object.entries(nodeDetails)
    .filter(([, d]) => d?.isBranchPath)
    .map(([id, d]) => ({ id, flowType: 'branch', data: { title: d.branchName ?? id } }));

  const selectedNode = nodeList.find((n) => n.id === selectedNodeId) ||
    branchChildNodes.find((n) => n.id === selectedNodeId) ||
    branchPathNodes.find((n) => n.id === selectedNodeId);

  // Procedure RHS is 500px (vs the default 450); chrome needs the wider offset.
  const rightPanelWide =
    rhsRendered
    && (Boolean(lhsPreviewProcedureId) || Boolean(activeProcedureId));

  const handleNodesReorder = useCallback((newIdOrder) => {
    setNodeList((prev) => {
      const byId = Object.fromEntries(prev.map((n) => [n.id, n]));
      const reordered = newIdOrder.map((id) => byId[id]).filter(Boolean);
      return reordered.map((n, i) => ({ ...n, data: { ...n.data, stepNumber: i + 1 } }));
    });
  }, []);

  const handleDropNode = useCallback(({ type, label, description, afterNodeId, branchPathId, position, insertAtBeginning, replaceTrigger }) => {
    // Nothing may be inserted above the entry point. When a trigger already exists it IS the
    // entry point, so block any top / START-targeted insertion. When there's no trigger yet,
    // a START-targeted drop is exactly how the first node — trigger OR task — gets added
    // (the empty-canvas trigger box and the "+" above End both target START), so allow it.
    const hasExistingTrigger = (latestRef.current.nodeList || []).some((n) => n.flowType === 'trigger');
    if ((insertAtBeginning || afterNodeId === START_NODE_ID) && hasExistingTrigger) return;

    // Triggers may only land on the empty trigger slot or replace the existing trigger node —
    // never mid-flow + / end + / free canvas.
    if (type === 'trigger' && !branchPathId) {
      const fromEmptyTriggerSlot = !hasExistingTrigger && afterNodeId === START_NODE_ID;
      if (!replaceTrigger && !fromEmptyTriggerSlot) return;
    }

    if (
      agentNameIsFrontDesk(agentName)
      && (description === INITIATE_VOICE_CALL_TASK || label === INITIATE_VOICE_CALL_TASK)
    ) {
      return;
    }

    const isVoiceCallDrop = type === 'task' && (description === INITIATE_VOICE_CALL_TASK || label === INITIATE_VOICE_CALL_TASK);
    const effectiveType = isVoiceCallDrop ? 'voiceCall' : type;

    const id = nextId();
    const newNode = makeNodeConfig(id, effectiveType, label, description);
    // For procedures, `description` is the procedure name from the sub-item dropdown
    // while `label` is the category name — use the procedure name as the seed ID
    const procedureSeed = effectiveType === 'procedures'
      ? (isCustomProcedureId(description) || isCustomProcedureId(label)
        ? CUSTOM_PROCEDURE_ID
        : (description || label))
      : label;
    let details = makeNodeDetails(effectiveType, effectiveType === 'procedures' ? procedureSeed : label);
    if (effectiveType === 'trigger' && label === 'Reviews' && REVIEWS_TRIGGER_LEAF_COPY[description]) {
      // Seed trigger name from the palette leaf; description stays optional (+ Add description).
      details = { ...details, triggerName: description, description: '' };
    }
    if (effectiveType === 'task' && description && label !== 'Custom') {
      const taskDefaults = TASK_DROP_DEFAULTS[description] || {};
      const seededDescription = taskDefaults.description ?? '';
      details = {
        ...details,
        taskName: description,
        description: seededDescription,
        ...(taskDefaults.selectedTools ? { selectedTools: taskDefaults.selectedTools } : {}),
      };
      // Mirror onto the canvas node so the card shows the LHS blurb immediately
      if (seededDescription) {
        newNode.data = { ...newNode.data, subtitle: seededDescription };
      }
    }

    // Controls variant name comes through the drag payload's `description`
    // (both the compact CardRow and the rich LHSEntityGroup cards set it), while
    // `label` may be the parent group name ('Branch' / 'Delay') for the palette cards.
    const controlVariant = description || label;

    // Delay dropped from one of the LHS Controls variant cards (For a set amount
    // of time / Until a calendar date / …) — preselect that delay option.
    // (Branch variants are handled by the scaffold block below since it owns the
    // branch/path structure the canvas renders.)
    if (effectiveType === 'delay' && DELAY_VARIANT_PRESETS[controlVariant]) {
      details = { ...details, delayOption: DELAY_VARIANT_PRESETS[controlVariant] };
    }

    if (effectiveType === 'trigger' && !branchPathId) {
      const currentList = latestRef.current.nodeList || [];
      const triggerIdx = currentList.findIndex((n) => n.flowType === 'trigger');
      const oldTriggerId = triggerIdx !== -1 ? currentList[triggerIdx].id : null;

      setNodeList((prev) => {
        const idx = prev.findIndex((n) => n.flowType === 'trigger');
        let updated;
        if (idx !== -1) {
          updated = [...prev];
          updated[idx] = newNode;
        } else {
          updated = [newNode, ...prev];
        }
        return updated.map((n, i) => ({ ...n, data: { ...n.data, stepNumber: i + 1 } }));
      });

      setNodeDetails((prev) => {
        const copy = { ...prev };
        if (oldTriggerId) delete copy[oldTriggerId];
        return { ...copy, [id]: details };
      });

      setFocusBranchPathId(null);
      setSelectedNodeId(id);
      setDrawerOpen(true);
      setActiveProcedureId(null);
      // After the first (or replaced) trigger lands, open Tasks so the next step is ready to drag.
      // Review-response chrome uses the floater palette instead — close it after drop.
      if (isReviewResponseChrome) {
        setPaletteSection(null);
      } else {
        setLhsCollapsed(false);
        setLhsForceOpenSection('Tasks');
      }
      return;
    }

    if (branchPathId) {
      setNodeDetails((prev) => {
        const branchPath = prev[branchPathId] || {};
        const existingNodes = branchPath.nodes || [];
        const index = afterNodeId ? existingNodes.findIndex((node) => node.id === afterNodeId) : -1;
        const nextNodes = index !== -1
          ? [...existingNodes.slice(0, index + 1), newNode, ...existingNodes.slice(index + 1)]
          : [newNode, ...existingNodes];
        return {
          ...prev,
          [branchPathId]: {
            ...branchPath,
            nodes: nextNodes.map((node, i) => ({
              ...node,
              data: { ...node.data, stepNumber: i + 1 },
            })),
          },
          [id]: details,
        };
      });
      setFocusBranchPathId(null);
      setSelectedNodeId(id);
      setDrawerOpen(true);
      setActiveProcedureId(type === 'procedures' && procedureSeed === CUSTOM_PROCEDURE_ID ? CUSTOM_PROCEDURE_ID : null);
      if (isReviewResponseChrome) {
        setPaletteSection(null);
      }
      return;
    }

    // When dropped freely on the canvas (not via an edge button), use the drop Y coordinate
    // to find the correct insertion point rather than always appending at the end.
    let dropInsertIdx = null;
    if (position && !afterNodeId) {
      const currentNodeList = latestRef.current.nodeList || [];
      const currentNodeDetails = latestRef.current.nodeDetails || {};
      let y = FLOW_START_GAP;
      for (let i = 0; i < currentNodeList.length; i++) {
        if (position.y < y) {
          dropInsertIdx = i;
          break;
        }
        const item = currentNodeList[i];
        y += getFlowVerticalStep(item, item.id, currentNodeDetails, product);
      }
      if (dropInsertIdx === null) dropInsertIdx = currentNodeList.length;
      if (dropInsertIdx === 0 && currentNodeList.length > 0) dropInsertIdx = 1;
    }

    setNodeList((prev) => {
      let updated;
      if (afterNodeId) {
        const idx = prev.findIndex((n) => n.id === afterNodeId);
        updated = idx !== -1
          ? [...prev.slice(0, idx + 1), newNode, ...prev.slice(idx + 1)]
          : [...prev, newNode];
      } else if (dropInsertIdx !== null) {
        updated = [...prev.slice(0, dropInsertIdx), newNode, ...prev.slice(dropInsertIdx)];
      } else {
        updated = [...prev, newNode];
      }
      return updated.map((n, i) => ({ ...n, data: { ...n.data, stepNumber: i + 1 } }));
    });

    let extraDetails = {};

    if (type === 'branch') {
      const path1Id = `${id}-path-1`;
      const path2Id = `${id}-path-2`;
      const fallbackId = `${id}-path-fallback`;
      const makePath = (extra) => ({ description: '', conditions: [], parentId: id, isBranchPath: true, nodes: [], ...extra });

      if (controlVariant === 'Based on percentage') {
        Object.assign(details, {
          basedOn: 'percentage',
          branchNodeTitle: 'Based on percentage',
          description: 'Split the flow by percentage',
          mergeBranches: true,
          branches: [
            { id: path1Id, name: 'Branch 1', percentage: 50 },
            { id: path2Id, name: 'Branch 2', percentage: 50 },
          ],
        });
        extraDetails = {
          [path1Id]: makePath({ branchName: 'Branch 1' }),
          [path2Id]: makePath({ branchName: 'Branch 2' }),
        };
      } else if (controlVariant === 'Always run') {
        Object.assign(details, {
          basedOn: 'conditions',
          branchNodeTitle: 'Always run',
          description: 'Always run this path',
          mergeBranches: true,
          branches: [
            { id: path1Id, name: 'Always run', isFallback: true },
          ],
        });
        extraDetails = {
          [path1Id]: makePath({ branchName: 'Always run', isFallback: true }),
        };
      } else {
        // 'Based on condition' (and the legacy plain "Branch" card / add-step menu)
        Object.assign(details, {
          basedOn: 'conditions',
          branchNodeTitle: 'Based on conditions',
          description: 'Build condition-specific flows',
          mergeBranches: true,
          branches: [
            { id: path1Id, name: 'Branch 1' },
            { id: fallbackId, name: 'Fallback branch', isFallback: true },
          ],
        });
        extraDetails = {
          [path1Id]: makePath({ branchName: 'Branch 1' }),
          [fallbackId]: makePath({ branchName: 'Fallback branch', isFallback: true }),
        };
      }
    }

    if (effectiveType === 'voiceCall') {
      const completedId = `${id}-vc-completed`;
      const rejectedId  = `${id}-vc-rejected`;
      const missedId    = `${id}-vc-missed`;
      const voicemailId = `${id}-vc-voicemail`;
      details = {
        taskName: 'Initiate voice call',
        description: 'Call the customer',
        toolId: 'initiate-voice-call',
        selectedTools: ['initiate-voice-call'],
        branches: [
          { id: completedId, name: 'Call completed', isVoiceCallBranch: true },
          { id: rejectedId,  name: 'Call rejected',  isVoiceCallBranch: true },
          { id: missedId,    name: 'Call missed',     isVoiceCallBranch: true },
          { id: voicemailId, name: 'Voicemail',       isVoiceCallBranch: true },
        ],
      };
      extraDetails = {
        [completedId]: { branchName: 'Call completed', parentId: id, isBranchPath: true, isVoiceCallBranch: true, nodes: [] },
        [rejectedId]:  { branchName: 'Call rejected',  parentId: id, isBranchPath: true, isVoiceCallBranch: true, nodes: [] },
        [missedId]:    { branchName: 'Call missed',     parentId: id, isBranchPath: true, isVoiceCallBranch: true, nodes: [] },
        [voicemailId]: { branchName: 'Voicemail',       parentId: id, isBranchPath: true, isVoiceCallBranch: true, nodes: [] },
      };
    }

    setNodeDetails((prev) => ({
      ...prev,
      [id]: details,
      ...extraDetails,
    }));

    setFocusBranchPathId(null);
    setSelectedNodeId(id);
    setDrawerOpen(true);
    setActiveProcedureId(type === 'procedures' && procedureSeed === CUSTOM_PROCEDURE_ID ? CUSTOM_PROCEDURE_ID : null);
    if (isReviewResponseChrome) {
      setPaletteSection(null);
    }
  }, [agentName, product, isReviewResponseChrome]);

  const handleNodeClick = useCallback((node) => {
    if (node.type === 'end' || node.type === 'branchEnd' || node.type === 'triggerPlaceholder' || node.type === 'branchCollapse') return;
    // Voice call branches are hard-coded and non-editable — block RHS open
    if (node.data?.isVoiceCallBranch) return;
    // Start node shares the Agent details panel with the chrome header title.
    if (node.type === 'start' || node.id === START_NODE_ID) {
      setPaletteSection(null);
      // Exploration: version history docks on the left, so it stays open and the
      // node config opens read-only beside it.
      if (!explorationChrome) setVersionHistoryOpen(false);
      if (explorationChrome) {
        setHelpCenterOpen(false);
        setPreviewOpen(false);
      }
      setFocusBranchPathId(null);
      setSelectedNodeId(START_NODE_ID);
      setDrawerOpen(true);
      return;
    }
    // Path chips open the parent Branch panel with that path's accordion expanded.
    if (node.type === 'branchPath') {
      const parentId = node.data?.parentId
        || latestRef.current.nodeDetails?.[node.id]?.parentId;
      if (!parentId) return;
      setPaletteSection(null);
      if (!explorationChrome) setVersionHistoryOpen(false);
      if (explorationChrome) {
        setHelpCenterOpen(false);
        setPreviewOpen(false);
      }
      setFocusBranchPathId(node.id);
      setFocusBranchPathNonce((n) => n + 1);
      setSelectedNodeId(parentId);
      setDrawerOpen(true);
      return;
    }
    // AI Builder docks on the left; node config uses the right pane — both can stay open.
    setPaletteSection(null);
    if (!explorationChrome) setVersionHistoryOpen(false);
    // Exploration: help / preview share the node-config RHS slot, so opening a node closes them.
    if (explorationChrome) {
      setHelpCenterOpen(false);
      setPreviewOpen(false);
    }
    setFocusBranchPathId(null);
    setSelectedNodeId(node.id);
    setDrawerOpen(true);
    if (node.data?.title) {
      setAiNodeContext({ id: node.id, type: node.type, title: node.data.title });
    }
  }, [explorationChrome]);

  useEffect(() => {
    setLlmTaskTab('setup');
  }, [selectedNodeId]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedNodeId(null);
    setFocusBranchPathId(null);
    setActiveProcedureId(null);
    setLhsPreviewProcedureId(null);
    setLlmTaskTab('setup');
    // Do not reopen AI Builder — user closed config and should return to a clean canvas
    // (FAB remains available to reopen AI explicitly).
  }, []);

  /** Open a task on the canvas that has a publish-blocking issue. */
  const navigateToIssueNode = useCallback((nodeId) => {
    if (!nodeId) return;
    setResolveIssuesOpen(false);
    setPublishBlockedModalOpen(false);
    setPaletteSection(null);
    setHelpCenterOpen(false);
    setVersionHistoryOpen(false);

    const located = locateNodeContainer(nodeId, nodeList, nodeDetails);
    if (located?.containerId) {
      const branchPathId = located.containerId;
      const parentBranchId = nodeDetails[branchPathId]?.parentId;
      if (parentBranchId) {
        setCollapsedBranches((prev) => ({ ...prev, [parentBranchId]: false }));
      }
      setCollapsedBranchPaths((prev) => ({ ...prev, [branchPathId]: false }));
      setFocusBranchPathId(branchPathId);
    } else {
      setFocusBranchPathId(null);
    }

    setSelectedNodeId(nodeId);
    setDrawerOpen(true);
    setCanvasFocusNodeId(nodeId);
  }, [nodeList, nodeDetails]);

  const currentDetails = selectedNodeId ? (nodeDetails[selectedNodeId] || {}) : {};

  /**
   * Task details Save — validates the node's tool config and flags the canvas card when a
   * mandatory field is still missing (cleared again once the tool is configured and re-saved).
   */
  const handleSaveTaskDetails = () => {
    const id = selectedNodeId;
    if (id) {
      const hasError = taskHasToolConfigError(nodeDetails[id]);
      setTaskErrorNodeIds((prev) => {
        if (hasError === prev.has(id)) return prev;
        const next = new Set(prev);
        if (hasError) next.add(id);
        else next.delete(id);
        return next;
      });
    }
    handleCloseDrawer();
  };

  /* ─── Shared onFieldChange for the active node ─── */
  const activeFieldChange = useCallback(
    (field, value) => handleNodeFieldChange(selectedNodeId, field, value),
    [selectedNodeId, handleNodeFieldChange]
  );

  const handleSaveCustomProcedure = useCallback(() => {
    if (!selectedNodeId) return;
    const nodeData = nodeDetails[selectedNodeId] || {};
    const overrides = nodeData.procedureOverrides?.[CUSTOM_PROCEDURE_ID] || {};
    const title = (overrides.name || '').trim() || 'Custom';
    const whenToUse = overrides.whenToUse || '';
    const stepsText = overrides.stepsText || '';
    const contextChips = overrides.contextChips || [];
    const addToLibrary = Boolean(overrides.addToLibrary);

    const chipsToContextItems = (chips) => {
      const kindMap = { variable: 'context', attachment: 'file', link: 'link' };
      return (chips || []).map((c) => ({
        kind: kindMap[c.type] || 'context',
        label: c.value,
      }));
    };

    const parseStepsText = (text) => {
      if (!text?.trim()) return [];
      return text
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => ({ title: l.replace(/^[\d•.\-\s]+/, '').trim(), bullets: [] }));
    };

    if (addToLibrary && onAddProcedure) {
      const isHC = product === 'healthcare' || product === 'dental';
      const newId = title;
      onAddProcedure({
        id: newId,
        name: title,
        category: isHC ? 'Healthcare Frontdesk' : 'Inbound General',
        description: whenToUse.trim().split(/[.!?]/)[0].trim() || title,
        lastEdited: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        whenToUse: whenToUse.trim(),
        steps: parseStepsText(stepsText),
        tools: [],
        context: chipsToContextItems(contextChips),
      });

      setNodeDetails((prev) => {
        const node = prev[selectedNodeId] || {};
        const ids = (node.procedureIds || []).map((pid) =>
          pid === CUSTOM_PROCEDURE_ID ? newId : pid,
        );
        const overridesNext = { ...(node.procedureOverrides || {}) };
        delete overridesNext[CUSTOM_PROCEDURE_ID];
        overridesNext[newId] = { name: title, whenToUse, stepsText, contextChips };
        return {
          ...prev,
          [selectedNodeId]: { ...node, procedureIds: ids, procedureOverrides: overridesNext },
        };
      });
    } else {
      setNodeDetails((prev) => ({
        ...prev,
        [selectedNodeId]: {
          ...(prev[selectedNodeId] || {}),
          procedureOverrides: {
            ...(prev[selectedNodeId]?.procedureOverrides || {}),
            [CUSTOM_PROCEDURE_ID]: {
              ...(prev[selectedNodeId]?.procedureOverrides?.[CUSTOM_PROCEDURE_ID] || {}),
              name: title,
              whenToUse,
              stepsText,
              contextChips,
              addToLibrary,
            },
          },
        },
      }));
    }

    setActiveProcedureId(null);
  }, [selectedNodeId, nodeDetails, onAddProcedure, product]);

  const renderRHSPanel = () => {
    if (lhsPreviewProcedureId) {
      const closeLhsPreview = () => {
        const wasExternal = externalPreviewRef.current === lhsPreviewProcedureId;
        externalPreviewRef.current = null;
        setLhsPreviewProcedureId(null);
        setDrawerOpen(false);
        if (wasExternal) onPreviewProcedureIdChange?.(null);
      };
      const mergedProc =
        previewProcedureDetail &&
        (previewProcedureDetail.id === lhsPreviewProcedureId ||
          previewProcedureDetail.name === lhsPreviewProcedureId)
          ? previewProcedureDetail
          : getProcedureDetailContent(lhsPreviewProcedureId, {}, product);
      return (
        <RHS
          key={`lhs-preview-${lhsPreviewProcedureId}`}
          variant="procedureDetail"
          title={mergedProc.name}
          viewOnly={rhsViewOnly}
          inlineFooter={inlineRhsFooter}
          product={product}
          onBack={closeLhsPreview}
          bodyProps={{
            initialValues: mergedProc,
            onFieldChange: () => {},
            onOpenToolDrawer: () => setToolPickerOpen(true),
          }}
          onClose={closeLhsPreview}
          onSave={closeLhsPreview}
        />
      );
    }

    if (!selectedNodeId) return null;

    if (selectedNodeId === START_NODE_ID) {
      const isReviewGeneration = /review generation/i.test(pageTitle || '');
      const isReviewResponse = /review response/i.test(pageTitle || '');
      const startDetails = nodeDetails[START_NODE_ID] || {
        agentName: pageTitle,
        goals: isReviewGeneration
          ? 'Request reviews from customers after a completed transaction, using email and text to maximize response rates.'
          : isReviewResponse
            ? 'Executes rule-based logic to rotate through qualifying templates and publish them automatically. If technical restrictions prevent immediate posting, the response is queued as a suggestion for manual review'
            : 'Respond to customer reviews promptly and professionally, maintaining brand voice and addressing specific customer feedback.',
        outcomes: isReviewGeneration
          ? 'Increase review volume across locations while saving staff time on manual follow-up.'
          : isReviewResponse
            ? 'Ensure safe, effortless engagement by relying exclusively on your pre-approved templates. Eliminate manual effort and operational overhead by autonomously responding across platforms'
            : 'Improved customer satisfaction scores, faster response times, and consistent brand messaging across all review platforms.',
        locations: [],
      };
      return (
        <RHS
          variant="agentDetails"
          title="Agent details"
          viewOnly={rhsViewOnly}
          inlineFooter={inlineRhsFooter}
          product={product}
          bodyProps={{
            values: startDetails,
            onChange: (field, value) => {
              if (blockActiveEditsForDraftRef.current) {
                setDraftRedirectModalOpen(true);
                return;
              }
              setNodeDetails((prev) => ({
                ...prev,
                [START_NODE_ID]: { ...(prev[START_NODE_ID] || startDetails), [field]: value },
              }));
            },
            autoOpenLocationsToken: startLocationsOpenToken,
            includeCustomFields: explorationChrome,
          }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (currentDetails.isBranchPath) {
      return (
        <RHS
          variant="branch"
          title="Branch"
          viewOnly={rhsViewOnly}
          inlineFooter={inlineRhsFooter}
          product={product}
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (!selectedNode) return null;
    const { flowType, data } = selectedNode;

    if (flowType === 'trigger' && data.subtype === 'Schedule-based') {
      return (
        <ScheduleBased
          onClose={handleCloseDrawer}
          onSave={(values) => {
            setNodeDetails((prev) => ({
              ...prev,
              [selectedNodeId]: { ...(prev[selectedNodeId] || {}), ...values },
            }));
            handleCloseDrawer();
          }}
          onPreview={isReviewResponseAgent ? undefined : () => setPreviewOpen((v) => !v)}
          previewOpen={previewOpen}
          previewActive={previewActive}
          onExpand={() => {}}
          triggerName={currentDetails.triggerName ?? ''}
          description={currentDetails.description ?? ''}
          onFieldChange={activeFieldChange}
          frequencyOptions={['Daily', 'Every 3 days', 'Weekly', 'Every 2 weeks', 'Monthly']}
          dayOptions={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']}
          timeOptions={['8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']}
          defaultFrequency={currentDetails.frequency || 'Every 2 weeks'}
          defaultDay={currentDetails.day || 'Monday'}
          defaultTime={currentDetails.time || '9:00 AM'}
        />
      );
    }

    if (flowType === 'trigger' && data.subtype === 'Conversation trigger') {
      return (
        <RHS
          variant="conversationTrigger"
          title="Trigger"
          viewOnly={rhsViewOnly}
          inlineFooter={inlineRhsFooter}
          product={product}
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (flowType === 'trigger') {
      return (
        <RHS
          variant={(isReviewResponseAgent || isReviewGenerationAgent) ? 'reviewTrigger' : 'entityTrigger'}
          title="Trigger"
          viewOnly={rhsViewOnly}
          inlineFooter={inlineRhsFooter}
          product={product}
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (flowType === 'branch') {
      const pathDetails = Object.fromEntries(
        (currentDetails.branches || []).map((b) => [b.id, nodeDetails[b.id] || {}]),
      );
      return (
        <RHS
          variant="controlBranch"
          title="Branch"
          viewOnly={rhsViewOnly}
          inlineFooter
          product={product}
          bodyProps={{
            initialValues: {
              ...currentDetails,
              description: currentDetails.description ?? selectedNode?.data?.descriptionPlaceholder ?? '',
              mergeBranches: currentDetails.mergeBranches ?? true,
              branchNodeId: selectedNodeId,
              pathDetails,
              initialExpandedPathId: focusBranchPathId,
              expandNonce: focusBranchPathNonce,
            },
            onFieldChange: activeFieldChange,
            onPathFieldChange: (pathId, field, value) => handleNodeFieldChange(pathId, field, value),
            onDeleteBranch: (branchId) => handleDeleteBranchPath(branchId),
            onFocusBranchPath: (pathId) => {
              setFocusBranchPathId(pathId);
              if (pathId) setFocusBranchPathNonce((n) => n + 1);
            },
            onOpenGlossary: openGlossary,
          }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (flowType === 'subagent') {
      return (
        <RHS
          variant="subagent"
          title="Sub-agent"
          viewOnly={rhsViewOnly}
          inlineFooter={inlineRhsFooter}
          product={product}
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (flowType === 'delay') {
      return (
        <RHS
          variant="delay"
          title="Delay"
          viewOnly={rhsViewOnly}
          inlineFooter={inlineRhsFooter}
          product={product}
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (flowType === 'parallel') {
      return (
        <RHS
          variant="parallel"
          title="Parallel tasks"
          viewOnly={rhsViewOnly}
          inlineFooter={inlineRhsFooter}
          product={product}
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (flowType === 'loop') {
      return (
        <RHS
          variant="loop"
          title="Loop"
          viewOnly={rhsViewOnly}
          inlineFooter={inlineRhsFooter}
          product={product}
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (flowType === 'procedures') {
      if (activeProcedureId) {
        const overrides = currentDetails.procedureOverrides?.[activeProcedureId] || {};
        const mergedProc = getProcedureDetailContent(activeProcedureId, overrides, product);
        const isCustom = isCustomProcedureId(activeProcedureId);

        if (isCustom) {
          return (
            <RHS
              key="proc-create-custom"
              variant="createCustomProcedure"
              title="Create custom procedure"
              viewOnly={rhsViewOnly}
              inlineFooter={inlineRhsFooter}
              product={product}
              onBack={() => setActiveProcedureId(null)}
              bodyProps={{
                initialValues: mergedProc,
                showTitle: true,
                showLibraryCheckbox: true,
                contextEditable: true,
                isNewProcedure: true,
                onFieldChange: (field, value) => {
                  const overridesNext = {
                    ...(currentDetails.procedureOverrides || {}),
                    [activeProcedureId]: {
                      ...(currentDetails.procedureOverrides?.[activeProcedureId] || {}),
                      [field]: value,
                    },
                  };
                  activeFieldChange('procedureOverrides', overridesNext);
                },
              }}
              onClose={handleCloseDrawer}
              onSave={handleSaveCustomProcedure}
            />
          );
        }

        return (
          <RHS
            key={`proc-detail-${activeProcedureId}`}
            variant="procedureDetail"
            title={mergedProc.name}
            viewOnly={rhsViewOnly}
            inlineFooter={inlineRhsFooter}
            product={product}
            onBack={() => setActiveProcedureId(null)}
            bodyProps={{
              initialValues: mergedProc,
              onFieldChange: (field, value) => {
                const overridesNext = {
                  ...(currentDetails.procedureOverrides || {}),
                  [activeProcedureId]: { ...(currentDetails.procedureOverrides?.[activeProcedureId] || {}), [field]: value },
                };
                activeFieldChange('procedureOverrides', overridesNext);
              },
              onOpenToolDrawer: () => setToolPickerOpen(true),
            }}
            onClose={handleCloseDrawer}
            onSave={() => setActiveProcedureId(null)}
          />
        );
      }
      return (
        <RHS
          key="proc-list"
          variant="procedureTask"
          title="Procedures"
          viewOnly={rhsViewOnly}
          inlineFooter={inlineRhsFooter}
          product={product}
          bodyProps={{
            initialValues: currentDetails,
            onFieldChange: activeFieldChange,
            onSelectProcedure: (id) => setActiveProcedureId(id),
          }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (data.hasAiIcon || (data.subtype === 'Custom' && !(currentDetails.selectedTools || []).includes('handle-response'))) {
      const llmTaskOption2 = llmTaskExplorationLayout && llmTaskLayoutOption === 'option2';
      const llmTaskOption3 = llmTaskExplorationLayout && llmTaskLayoutOption === 'option3';
      // R1/R2/R3/R4 layouts are scoped to the Review response agent's exploration chrome
      // only — Frontdesk exploration (and any other agent) never sees any of these options or their behavior.
      const llmTaskR1 = llmTaskExplorationLayout && llmTaskLayoutOption === 'r1' && isReviewResponseAgent;
      const llmTaskR2 = llmTaskExplorationLayout && llmTaskLayoutOption === 'r2' && isReviewResponseAgent;
      const llmTaskR3 = llmTaskExplorationLayout && llmTaskLayoutOption === 'r3' && isReviewResponseAgent;
      const llmTaskR4 = llmTaskExplorationLayout && llmTaskLayoutOption === 'r4' && isReviewResponseAgent;
      // Sep 1 agents always get the segmented Action RHS (Basic/Prompts/Fields/Context).
      // Use sep1Chrome props — activeNavId is often still the default 'search' here.
      const llmTaskSep1Segmented = sep1Chrome && !llmTaskExplorationLayout;
      const llmTaskSegmented = llmTaskR4 || llmTaskSep1Segmented;
      return (
        <RHS
          variant="llmTask"
          title="Action"
          viewOnly={rhsViewOnly}
          inlineFooter={inlineRhsFooter}
          product={product}
          saveLabel="Save"
          showPromptStrength={llmTaskExplorationLayout ? true : undefined}
          titleLayoutMenu={llmTaskExplorationLayout ? {
            value: llmTaskLayoutOption,
            options: [
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
              { value: 'option3', label: 'Option 3' },
              ...(isReviewResponseAgent ? [
                { value: 'r1', label: 'R1' },
                { value: 'r2', label: 'R2' },
                { value: 'r3', label: 'R3' },
                { value: 'r4', label: 'R4' },
              ] : []),
            ],
            onChange: (next) => {
              setLlmTaskLayoutOption(next);
              if (next === 'option2') setLlmTaskTab('setup');
            },
          } : null}
          titleTabMenu={null}
          bodyProps={{
            initialValues: currentDetails,
            onFieldChange: activeFieldChange,
            onOpenToolDrawer: () => setToolPickerOpen(true),
            onOpenTool: openToolByName,
            collapseChipsToOneLine: llmTaskExplorationLayout,
            collapseChipsToTwoLines: explorationChrome,
            setupConfigureTabs: llmTaskOption2,
            option3Stepper: llmTaskOption3,
            hideDescriptionLabel: llmTaskOption3,
            tightNameDescription: llmTaskOption3,
            accordionLayout: llmTaskR1 || llmTaskR2 || llmTaskR3,
            accordionBare: llmTaskR2 || llmTaskR3,
            accordionLined: llmTaskR3,
            segmentedLayout: llmTaskSegmented,
            activeTab: llmTaskTab,
            onTabChange: llmTaskExplorationLayout ? setLlmTaskTab : undefined,
            onOpenGlossary: openGlossary,
            onValidationChange: setLlmTaskSaveBlocked,
            saveBlocked: llmTaskSaveBlocked,
          }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (flowType === 'voiceCall') {
      return (
        <RHS
          variant="voiceCallTask"
          title="Action"
          viewOnly={rhsViewOnly}
          inlineFooter={inlineRhsFooter}
          product={product}
          bodyProps={{
            initialValues: currentDetails,
            onFieldChange: activeFieldChange,
            onEditTool: (toolId) => {
              if (toolId === 'initiate-voice-call') { setVoiceCallToolOpen(true); return; }
              if (toolId === 'transfer') { setTransferToolOpen(true); return; }
              getCustomToolsByIds([toolId]).then((tools) => {
                if (tools[0]) setViewingTool(tools[0]);
              });
            },
            onSwapTool: () => setToolPickerOpen(true),
          }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (flowType === 'task' && (currentDetails.selectedTools || []).includes('send-response')) {
      return (
        <RHS
          variant="sendResponseTask"
          title="Action"
          viewOnly={rhsViewOnly}
          inlineFooter={inlineRhsFooter}
          product={product}
          bodyProps={{
            initialValues: currentDetails,
            onFieldChange: activeFieldChange,
          }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    return (
      <RHS
        variant="entityTask"
        title="Action"
        viewOnly={rhsViewOnly}
        inlineFooter={inlineRhsFooter}
        titleLayoutMenu={llmTaskExplorationLayout ? {
          value: entityTaskLayoutOption,
          options: [
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
            { value: 'option3', label: 'Option 3' },
          ],
          onChange: setEntityTaskLayoutOption,
        } : null}
        bodyProps={{
          initialValues: currentDetails,
          onFieldChange: activeFieldChange,
          option2Stepper: llmTaskExplorationLayout && entityTaskLayoutOption === 'option2',
          // Sep 1: always use Basic / Tool details tabs (same as exploration Option 3).
          option3Tabs:
            (sep1Chrome && !llmTaskExplorationLayout)
            || (llmTaskExplorationLayout && entityTaskLayoutOption === 'option3'),
          toolFieldValues: currentDetails.toolFieldValues || {},
          onToolFieldValuesChange: (toolId, values) => {
            activeFieldChange('toolFieldValues', {
              ...(currentDetails.toolFieldValues || {}),
              [toolId]: values,
            });
          },
          // Only surface tool errors once this task has been saved in that state.
          showToolErrors: taskErrorNodeIds.has(selectedNodeId) || issuesByNodeId.has(selectedNodeId),
          onOpenTool: (toolId) => {
            if (toolId === 'reminder-tool') { setReminderToolOpen(true); return; }
            if (toolId === 'get-unscheduled-treatment-plans') { setQueryConfigOpen(true); return; }
            if (toolId === 'assign-contact-status') { setAssignContactStatusToolOpen(true); return; }
            if (toolId === 'assign-conversation') { setAssignConversationToolOpen(true); return; }
            if (toolId === 'assign-conversation-status') { setAssignConversationStatusToolOpen(true); return; }
            if (toolId === 'handle-response') { setHandleResponseToolOpen(true); return; }
            getCustomToolsByIds([toolId]).then((tools) => {
              if (tools[0]) setViewingTool(tools[0]);
            });
          },
          onSwapTool: () => setToolPickerOpen(true),
        }}
        onClose={handleCloseDrawer}
        onSave={handleSaveTaskDetails}
      />
    );
  };

  /* ─── Header actions: Publish + three-dots menu (or view-only chrome) ─── */
  const handleRunTest = () => {
    // Front desk: voice/chat preview instead of the step-log test run.
    if (isFrontDeskAgentName) {
      setTestRunOpen(false);
      setDrawerOpen(false);
      setSelectedNodeId(null);
      setTestAppointment(null);
      if (explorationChrome) setHelpCenterOpen(false);
      setPreviewOpen(true);
      return;
    }
    setPreviewOpen(false);
    setTestRunOpen(true);
  };

  const viewChromeButtons = (
    <div className="ab-header-actions ab-header-actions--view-mode">
      <div className="rr-chrome-mode-switch" role="group" aria-label="Workflow mode">
        <button
          type="button"
          className="rr-chrome-mode-btn rr-chrome-mode-btn--active"
          aria-current="true"
          aria-label="View-only"
        >
          <span className="material-symbols-outlined" aria-hidden>visibility</span>
          <span>View-only</span>
        </button>
        <button
          type="button"
          className="rr-chrome-mode-btn"
          onClick={onEdit}
          aria-label="Edit"
        >
          <span className="material-symbols-outlined" aria-hidden>edit</span>
          <span>Edit</span>
        </button>
      </div>
      <button
        type="button"
        className="rr-chrome-run-test"
        onClick={handleRunTest}
        aria-label={isFrontDeskAgentName ? 'Preview' : 'Run test'}
      >
        <span className="material-symbols-outlined rr-chrome-run-test__play" aria-hidden>play_arrow</span>
        <span>{isFrontDeskAgentName ? 'Preview' : 'Run test'}</span>
      </button>
    </div>
  );

  // Restore applies straight away (no confirm step), drops back to the live editor
  // and confirms with a toast whose Undo reopens history on the same version.
  const handleRestoreVersion = () => {
    setRestoredVersionId(versionHistorySelectedId);
    closeVersionHistory();
  };

  const handleUndoRestore = () => {
    setVersionHistorySelectedId(restoredVersionId);
    setRestoredVersionId(null);
    setVersionHistoryOpen(true);
  };

  /**
   * Issue-count affordance. Exploration chrome shows a red "N errors" chip after the
   * run-test icon; legacy agents keep the original text trigger before the icons.
   * Both open the same issues popover.
   */
  const resolveIssues = (
    <div className="ab-resolve-issues" ref={resolveIssuesRef}>
      <button
        type="button"
        className={explorationChrome ? 'ab-error-chip' : 'ab-resolve-issues__trigger'}
        aria-expanded={resolveIssuesOpen}
        aria-haspopup="dialog"
        onClick={() => {
          setPublishMenuOpen(false);
          setHeaderMenuOpen(false);
          setResolveIssuesOpen((open) => !open);
        }}
      >
        <span className="material-symbols-outlined" aria-hidden>error</span>
        {explorationChrome
          ? `${issueCount} ${issueCount === 1 ? 'error' : 'errors'}`
          : `Resolve issues (${issueCount})`}
      </button>
      {resolveIssuesOpen && (
        <div
          className={`ab-resolve-issues__popover${explorationChrome ? ' ab-resolve-issues__popover--anchor-right' : ''}`}
          role="dialog"
          aria-label="Resolve issues"
        >
          <div className="ab-resolve-issues__heading">
            {issueCount} {issueCount === 1 ? 'issue' : 'issues'} to resolve
          </div>
          <ul className="ab-resolve-issues__list">
            {(resolveIssuesList.length > 0
              ? resolveIssuesList
              : Array.from({ length: issueCount }, (_, i) => ({
                  id: `issue-${i + 1}`,
                  title: `Issue ${i + 1}`,
                  description: 'Review this item before publishing.',
                }))
            ).map((issue) => (
              <li key={issue.id}>
                <button
                  type="button"
                  className="ab-resolve-issues__item"
                  onClick={() => {
                    if (issue.nodeId) navigateToIssueNode(issue.nodeId);
                    else setResolveIssuesOpen(false);
                  }}
                >
                  <span className="material-symbols-outlined ab-resolve-issues__item-icon" aria-hidden>
                    error
                  </span>
                  <span className="ab-resolve-issues__item-body">
                    <span className="ab-resolve-issues__item-title">{issue.title}</span>
                    {issue.description ? (
                      <span className="ab-resolve-issues__item-desc">{issue.description}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const headerActions = viewOnly ? (
    viewChromeActions ? viewChromeButtons : (
      <div className="ab-view-badge">
        <span className="material-symbols-outlined">visibility</span>
        View only
      </div>
    )
  ) : versionHistoryMode ? (
    // Nothing to cancel or restore on the draft (or on the live version outside the draft
    // flow) — the whole pill is hidden rather than shown empty; Back exits history instead.
    hideVersionActions ? null : (
      <div className="ab-header-actions">
        <button
          type="button"
          className="ab-header-cancel-btn"
          aria-label="Cancel"
          onClick={closeVersionHistory}
        >
          Cancel
        </button>
        <button
          type="button"
          className="ab-header-restore-btn"
          aria-label="Restore this version"
          onClick={handleRestoreVersion}
        >
          Restore
        </button>
      </div>
    )
  ) : (
    <div className="ab-header-actions">
      {issueCount > 0 && !explorationChrome && resolveIssues}
      {/* Labelled button — no Tooltip, it would just repeat the visible text. */}
      <button
        type="button"
        className="ab-header-runtest-btn"
        onClick={handleRunTest}
        aria-label={isFrontDeskAgentName ? 'Preview' : 'Run test'}
        data-tour-id="test-run"
        disabled={isScratchCreate}
      >
        <img src={iconRrPreview} alt="" width={18} height={18} className="ab-header-runtest-btn__icon" />
        <span>{isFrontDeskAgentName ? 'Preview' : 'Run test'}</span>
      </button>
      {issueCount > 0 && explorationChrome && resolveIssues}
      {isTemplateMode ? (
        <Button
          theme="primary"
          label="Save template"
          onClick={handleSaveTemplate}
        />
      ) : (
        <>
          <div className="ab-publish-split" ref={publishMenuRef}>
            {/* Inactive agents re-activate through the same CTA (handleActivateMain routes
                to resume vs publish), so there is no separate Resume button. */}
            <button
              type="button"
              className="ab-publish-split__main"
              aria-label="Activate"
              data-tour-id="publish"
              disabled={publishDisabled}
              onClick={handleActivateMain}
            >
              Activate
            </button>
            <button
              type="button"
              className={`ab-publish-split__chevron${publishMenuOpen ? ' ab-publish-split__chevron--open' : ''}`}
              aria-label="More activate options"
              aria-haspopup="menu"
              aria-expanded={publishMenuOpen}
              disabled={publishDisabled}
              onClick={() => setPublishMenuOpen((open) => !open)}
            >
              <span className="material-symbols-outlined">expand_more</span>
            </button>
            {publishMenuOpen && (
              <div className="ab-publish-split__menu" role="menu">
                <button
                  type="button"
                  className="ab-publish-split__menu-item"
                  role="menuitem"
                  onClick={handleSaveAsDraft}
                >
                  Save as draft
                </button>
                {/* Only a live agent can be deactivated. */}
                {agentStatus === 'Active' && (
                  <button
                    type="button"
                    className="ab-publish-split__menu-item"
                    role="menuitem"
                    onClick={() => {
                      setPublishMenuOpen(false);
                      handlePause();
                    }}
                  >
                    Deactivate
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Version history + Delete live behind the three-dots menu. */}
          <div className="ab-header-more" ref={headerMenuRef}>
            <button
              type="button"
              className="ab-header-more-btn"
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={headerMenuOpen}
              onClick={() => {
                setPublishMenuOpen(false);
                setHeaderMenuOpen((open) => !open);
              }}
            >
              <span className="material-symbols-outlined" aria-hidden>more_vert</span>
            </button>
            {headerMenuOpen && (
              <div className="ab-header-menu" role="menu">
                {!isScratchCreate && (
                  <button
                    type="button"
                    className="ab-header-menu-item"
                    role="menuitem"
                    onClick={handleOpenVersionHistory}
                  >
                    Version history
                  </button>
                )}
                <button
                  type="button"
                  className="ab-header-menu-item ab-header-menu-item--danger"
                  role="menuitem"
                  onClick={handleDeleteAgent}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const STATUS_BADGE_CLASS = {
    Active: 'ab-header-status--active',
    Inactive: 'ab-header-status--inactive',
    Draft: 'ab-header-status--draft',
  };
  const statusBadgeClass = STATUS_BADGE_CLASS[agentStatus] || 'ab-header-status--draft';

  /* ─── Loading / not-found guards ─── */
  if (isLoadingFromSlug) {
    return (
      <div className="ab-loading">
        <div className="ab-spinner" />
        <span>Loading agent…</span>
      </div>
    );
  }

  if (agentNotFound) {
    return (
      <div className="ab-not-found">
        <EmptyStates title="Agent not found" description="This link is no longer valid or the agent has been deleted." />
      </div>
    );
  }

  return (
    <div className="faq-ab-embedded faq-ab-embedded--rr-chrome" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'transparent' }}>
      {/* ─── Builder body ─── */}
      <div
        className="agent-builder-wrapper"
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fb', backgroundImage: 'radial-gradient(circle, #c8cdd8 1px, transparent 1px)', backgroundSize: '28px 28px', overflow: 'hidden' }}
      >
        <div className={`agent-builder agent-builder--rr-chrome${sep1Chrome ? ' agent-builder--lhs-labelled' : ''}${rrAiPanelRendered ? ' agent-builder--lhs-ai-open' : ''}${paletteInstant ? ' agent-builder--palette-instant' : ''}${versionHistoryOpen ? ' agent-builder--version-history-open' : ''}${versionHistoryMode ? ' agent-builder--version-history-canvas' : ''}`}>
          {/* Floating canvas chrome (all agents) */}
          <>
              {(onClose || explorationChrome) && (
                <div className={`rr-chrome-back-cluster${explorationChrome ? ' rr-chrome-back-cluster--identity' : ''}`}>
                  {onClose && (
                    <button
                      type="button"
                      className="rr-chrome-back"
                      // Browsing version history: Back returns to the canvas rather
                      // than leaving the editor for the agent list.
                      onClick={versionHistoryMode ? closeVersionHistory : onClose}
                      aria-label="Back"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                        <path d="M5.98854 10.6267L8.73215 13.3703C8.85608 13.4943 8.91724 13.6393 8.91565 13.8054C8.91403 13.9715 8.85287 14.1192 8.73215 14.2485C8.60288 14.3778 8.45438 14.4446 8.28665 14.4488C8.11892 14.4531 7.97042 14.3906 7.84115 14.2613L4.10877 10.529C3.95813 10.3783 3.88281 10.2026 3.88281 10.0017C3.88281 9.80088 3.95813 9.62514 4.10877 9.4745L7.84115 5.74212C7.96508 5.61819 8.11224 5.55703 8.28265 5.55862C8.45305 5.56024 8.60288 5.62567 8.73215 5.75494C8.85287 5.88421 8.91537 6.03058 8.91965 6.19404C8.92392 6.3575 8.86142 6.50386 8.73215 6.63312L5.98854 9.37675H15.7931C15.9704 9.37675 16.1189 9.43658 16.2386 9.55623C16.3582 9.67588 16.418 9.82438 16.418 10.0017C16.418 10.1791 16.3582 10.3276 16.2386 10.4472C16.1189 10.5669 15.9704 10.6267 15.7931 10.6267H5.98854Z" fill="currentColor"/>
                      </svg>
                      {!explorationChrome && <span>Back</span>}
                    </button>
                  )}
                  {explorationChrome && versionHistoryMode && (
                    <div className="rr-chrome-identity">
                      <div className="rr-chrome-identity__row">
                        <span className="rr-chrome-identity__name">Version history</span>
                        <span className="rr-chrome-identity__version-sep" aria-hidden>·</span>
                        <span className="rr-chrome-identity__version-stamp">
                          {selectedVersion?.stamp || selectedVersion?.title}
                        </span>
                        {/* Keyed off the version's own status, not `hideVersionActions` —
                            that also covers the draft, which must not read "Active". */}
                        {selectedVersion?.status === 'Active' && (
                          <span className="ab-header-status ab-header-status--active ab-header-status--dot">
                            Active
                          </span>
                        )}
                        {selectedVersion?.status === 'Draft' && (
                          <span className="ab-header-status ab-header-status--draft ab-header-status--dot">
                            Draft
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {explorationChrome && !versionHistoryMode && (
                    <div className="rr-chrome-identity">
                      <div className="rr-chrome-identity__row">
                        <div className="rr-chrome-identity__name-group">
                          <button
                            type="button"
                            className="rr-chrome-identity__title"
                            onClick={nodesInteractive ? handleOpenAgentDetails : undefined}
                            aria-label={`Open agent details for ${agentName || 'Untitled agent'}`}
                          >
                            <span className="rr-chrome-identity__name">
                              {agentName || 'Untitled agent'}
                            </span>
                          </button>
                        </div>
                        {nodesInteractive && (
                          <Tooltip content="Edit" variant="brief" side="bottom">
                            <button
                              type="button"
                              className="ab-header-cloud-btn"
                              onClick={handleOpenAgentDetails}
                              aria-label="Edit"
                            >
                              <span className="material-symbols-outlined ab-header-cloud-btn__material" aria-hidden>
                                edit
                              </span>
                            </button>
                          </Tooltip>
                        )}
                        {agentStatus === 'Draft' && existingAgent ? (
                          <>
                            <span className="ab-header-status ab-header-status--draft ab-header-status--dot">
                              Draft
                            </span>
                            <button
                              type="button"
                              className="ab-header-status__view-live"
                              onClick={handleViewActiveVersion}
                            >
                              View active version
                            </button>
                          </>
                        ) : hasUnpublishedDraft && agentStatus === 'Active' ? (
                          <>
                            <span className="ab-header-status ab-header-status--active ab-header-status--dot">
                              Active
                            </span>
                            <button
                              type="button"
                              className="ab-header-status__view-live"
                              onClick={handleGoToDraftVersion}
                            >
                              View draft
                            </button>
                          </>
                        ) : (
                          <span className={`ab-header-status ${statusBadgeClass} ab-header-status--dot`}>
                            {agentStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Exploration and combined-controls (Response agents Sep1) render this trigger in the bottom editor row instead (GraphControls). */}
              {!viewOnly && !explorationChrome && !combineControlsLeft && (
                <div className="rr-chrome-help-wrap">
                  <Tooltip content="Help center" variant="brief" side="bottom">
                    <button
                      type="button"
                      className={`rr-chrome-help${helpCenterOpen ? ' rr-chrome-help--active' : ''}`}
                      aria-label="Help center"
                      aria-pressed={helpCenterOpen}
                      onClick={toggleHelpCenter}
                    >
                      <span className="material-symbols-outlined" aria-hidden>help</span>
                    </button>
                  </Tooltip>
                </div>
              )}

              {/* Version history on the live version has no actions — skip the pill entirely
                  so an empty white chip doesn't float over the canvas. */}
              {!(versionHistoryMode && !headerActions) && (
              <div
                className={`rr-chrome-top${viewOnly && viewChromeActions ? ' rr-chrome-top--actions-only' : ''}${
                  explorationChrome ? ' rr-chrome-top--right' : ''
                }${explorationChrome && rightPanelOpen ? ' rr-chrome-top--rhs-open' : ''}${
                  explorationChrome && rightPanelWide ? ' rr-chrome-top--rhs-wide' : ''
                }`}
              >
                {!(viewOnly && viewChromeActions) && !explorationChrome && (
                  <>
                    <RrChromeAgentTitle
                      text={agentName || 'Untitled agent'}
                      onClick={nodesInteractive ? handleOpenAgentDetails : undefined}
                    />
                    <span className={`ab-header-status ${statusBadgeClass} ab-header-status--dot`}>
                      {agentStatus}
                    </span>
                    <div className="rr-chrome-top__spacer" aria-hidden />
                  </>
                )}
                {headerActions}
              </div>
              )}

              {!viewOnly && !versionHistoryMode && (
                <div className={`rr-chrome-left-stack${sep1Chrome ? ' rr-chrome-left-stack--labelled' : ''}`}>
                  <Tooltip content="Create with AI" variant="brief" side="right">
                    <button
                      type="button"
                      className={`rr-chrome-left-ai${rrAiPanelOpen ? ' rr-chrome-left-ai--active' : ''}`}
                      aria-label="Create with AI"
                      data-tour-id="create-with-ai"
                      aria-pressed={rrAiPanelOpen}
                      onClick={() => {
                        setPaletteSection(null);
                        setVersionHistoryOpen(false);
                        setRrAiPanelOpen((open) => {
                          const nextOpen = !open;
                          if (nextOpen) {
                            onAiBuilderPanelOpenChange?.(true);
                          } else {
                            onAiBuilderPanelOpenChange?.(false);
                          }
                          return nextOpen;
                        });
                      }}
                    >
                      <span
                        className="ai-gradient-icon rr-chrome-left-floater__icon rr-chrome-left-floater__icon--ai"
                        style={{
                          WebkitMaskImage: `url("${iconAgentsPurple}")`,
                          maskImage: `url("${iconAgentsPurple}")`,
                        }}
                        aria-hidden
                      />
                      {sep1Chrome && <span className="rr-chrome-left-label">AI</span>}
                    </button>
                  </Tooltip>
                  <div className="rr-chrome-left-floater" role="toolbar" aria-label="Add nodes">
                    {[
                      {
                        id: 'Trigger',
                        src: iconRrTrigger,
                        icon: 'bolt',
                        color: '#FE9A00',
                        label: 'Trigger',
                        tourId: 'trigger',
                      },
                      ...(showProceduresFloater
                        ? [{
                            id: 'Procedures',
                            src: iconRrProcedures,
                            icon: 'menu_book',
                            color: '#7C3AED',
                            label: 'Procedures',
                            tourId: null,
                          }]
                        : []),
                      {
                        id: 'Tasks',
                        src: iconRrTasks,
                        icon: 'description',
                        color: '#00C950',
                        label: 'Action',
                        underLabel: 'Actions',
                        tourId: 'tasks',
                      },
                      {
                        id: 'Controls',
                        src: iconRrControls,
                        icon: 'account_tree',
                        color: '#62748E',
                        label: 'Controls',
                        tourId: 'controls',
                      },
                    ].map((item) => {
                      const displayLabel = sep1Chrome ? (item.underLabel || item.label) : item.label;
                      const btn = (
                        <button
                          type="button"
                          className={`rr-chrome-left-floater__btn${paletteSection === item.id ? ' rr-chrome-left-floater__btn--active' : ''}`}
                          aria-label={displayLabel}
                          data-tour-id={item.tourId || undefined}
                          aria-pressed={paletteSection === item.id}
                          onClick={() => {
                            setVersionHistoryOpen(false);
                            const opening = paletteSection !== item.id;
                            if (opening && rrAiPanelOpen) {
                              setPaletteInstant(true);
                              closeAiBuilderPanelInstant();
                            } else if (opening) {
                              closeAiBuilderPanel();
                            }
                            setPaletteSection((prev) => (prev === item.id ? null : item.id));
                          }}
                        >
                          {/* Filled glyphs only on exploration chrome — Sep 1 keeps outlined SVGs. */}
                          {explorationChrome && !sep1Chrome ? (
                            <span className="rr-chrome-left-floater__icon" style={{ color: item.color }} aria-hidden>
                              <Icon name={item.icon} size={20} fill />
                            </span>
                          ) : (
                            <img src={item.src} alt="" width={20} height={20} className="rr-chrome-left-floater__icon" />
                          )}
                          {sep1Chrome && <span className="rr-chrome-left-label">{displayLabel}</span>}
                        </button>
                      );
                      // Sep 1 shows labels under icons — skip redundant tooltips (Create with AI keeps its tooltip).
                      if (sep1Chrome) {
                        return <React.Fragment key={item.id}>{btn}</React.Fragment>;
                      }
                      return (
                        <Tooltip key={item.id} content={displayLabel} variant="brief" side="right">
                          {btn}
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              )}

              {paletteSection && !viewOnly && (
                <div className={`rr-chrome-palette${paletteInstant ? ' rr-chrome-palette--instant' : ''}`}>
                  <LHSDrawer
                    key={paletteSection}
                    defaultTab="Create manually"
                    showTabs={false}
                    sectionOnly
                    defaultOpenSection={paletteSection}
                    forceOpenSection={paletteSection}
                    viewOnly={viewOnly}
                    product={product}
                    agentName={agentName}
                    procedures={procedures}
                    onCollapse={() => setPaletteSection(null)}
                    onDropNode={handleDropNode}
                    onProcedureClick={(procedureId) => {
                      setLhsPreviewProcedureId(procedureId);
                      setSelectedNodeId(null);
                      setActiveProcedureId(null);
                      setDrawerOpen(true);
                    }}
                  />
                </div>
              )}

              {versionHistoryOpen && !viewOnly && (
                <VersionHistoryPanel
                  variant={versionHistoryMode ? 'canvas' : 'default'}
                  versions={versionHistoryList}
                  selectedId={versionHistorySelectedId}
                  onSelect={setVersionHistorySelectedId}
                  onClose={closeVersionHistory}
                />
              )}

              {/* Clears the app nav and the canvas header pill, which the default top-6 sits on top of. */}
              <Toast
                message="Version restored successfully"
                visible={!!restoredVersionId}
                actionLabel="Undo"
                onAction={handleUndoRestore}
                onClose={() => setRestoredVersionId(null)}
                className="!top-[124px]"
              />

              {/* Exploration opens Help center in the node-config RHS slot instead (below). */}
              {helpCenterOpen && !explorationChrome && (
                <div className="rr-chrome-right-panel rr-chrome-right-panel--help">
                  <HelpCenterPanel
                    open={helpCenterOpen}
                    onClose={() => setHelpCenterOpen(false)}
                    onOpenGlossary={openGlossary}
                    onOpenProductResearchSettings={onOpenProductResearchSettings}
                    onStartTour={() => {
                      setHelpCenterOpen(false);
                      if (!viewOnly) setCoachTourOpen(true);
                    }}
                  />
                </div>
              )}

              {rrAiPanelRendered && !viewOnly && (
                <div className={`agent-builder__lhs-ai${rrAiPanelClosing ? ' agent-builder__lhs-ai--closing' : ' agent-builder__lhs-ai--opening'}`}>
                  <AiBuilderPanel
                    agentName={(typeof pageTitle === 'string' && pageTitle.trim()) ? pageTitle : agentName}
                    draftAgentName={agentName}
                    onClose={closeAiBuilderPanel}
                    onExpand={
                      onOpenAiFullscreen
                        ? () => {
                            closeAiBuilderPanel();
                            onOpenAiFullscreen();
                          }
                        : undefined
                    }
                    className="rr-chrome-ai-panel"
                    fillShell
                    side="left"
                    openProcedureName={lhsPreviewProcedureId}
                    onOpenProcedure={(procedureId) => {
                      setLhsPreviewProcedureId(procedureId);
                      setSelectedNodeId(null);
                      setActiveProcedureId(null);
                      setDrawerOpen(true);
                    }}
                  />
                </div>
              )}

          </>

          <div className={`agent-builder__canvas${drawerOpen ? ' agent-builder__canvas--with-rhs' : ''}`}>
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              onNodeClick={nodesInteractive ? handleNodeClick : undefined}
              onDropNode={viewOnly ? undefined : handleDropNode}
              onNodesReorder={viewOnly ? undefined : handleNodesReorder}
              hasClipboard={!viewOnly && !!clipboard}
              onPasteAtConnector={viewOnly ? undefined : handlePasteBelow}
              selectedNodeId={selectedNodeId}
              orientation={canvasOrientation}
              onOrientationChange={setCanvasOrientation}
              viewOnly={viewOnly}
              product={product}
              agentName={agentName}
              rrChrome
              initialZoom={initialZoom}
              runDisabled={runDisabled}
              focusNodeId={testRunOpen ? testRunActiveId : canvasFocusNodeId}
              onEdit={onEdit}
              onView={onView}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={historyPast.length > 0}
              canRedo={historyFuture.length > 0}
              hideUndoRedo={versionHistoryOpen}
              onHelpToggle={(explorationChrome || combineControlsLeft) ? toggleHelpCenter : null}
              helpOpen={helpCenterOpen}
              combineControlsLeft={combineControlsLeft}
              singleAddStepSearch={sep1Chrome}
              onRun={() => {
                if (isReviewResponseAgent) return;
                if (isReminderAgent) {
                  setBookTestModalOpen(true);
                } else {
                  setTestAppointment(null);
                  setPreviewOpen(true);
                }
              }}
            />
          </div>

          {!aiAssistControlled && aiAssistOpen && (
            <div className="agent-builder__ai-assist">
              <AiAssistPanel onClose={() => setAiAssistOpen(false)} />
            </div>
          )}

          {testRunOpen && (
            <>
              <style>{testRunCss}</style>
              <div className="agent-builder__rhs agent-builder__rhs--opening">
                <TestRunPanel
                  steps={testRunSteps}
                  stepStatuses={testRun.stepStatuses}
                  activeIndex={testRun.activeIndex}
                  status={testRun.status}
                  onExit={() => setTestRunOpen(false)}
                />
              </div>
            </>
          )}

          {rhsRendered && (
            <div
              key={selectedNodeId || lhsPreviewProcedureId || 'rhs'}
              className={`agent-builder__rhs${rhsClosing ? ' agent-builder__rhs--closing' : ' agent-builder__rhs--opening'}`}
            >
              <RHSErrorBoundary key={selectedNodeId || lhsPreviewProcedureId || 'rhs'}>
                {renderRHSPanel()}
              </RHSErrorBoundary>
            </div>
          )}

          {/* Exploration: Help center uses the same RHS slot + slide as the node cards. */}
          {helpRendered && explorationChrome && (
            <div
              className={`agent-builder__rhs agent-builder__rhs--help${helpClosing ? ' agent-builder__rhs--closing' : ' agent-builder__rhs--opening'}`}
            >
              <HelpCenterPanel
                open={helpCenterOpen}
                onClose={() => setHelpCenterOpen(false)}
                onOpenGlossary={openGlossary}
                onOpenProductResearchSettings={onOpenProductResearchSettings}
                onStartTour={() => {
                  setHelpCenterOpen(false);
                  if (!viewOnly) setCoachTourOpen(true);
                }}
              />
            </div>
          )}

          {previewOpen && !isReviewResponseAgent && (
            <div className="agent-builder__rhs agent-builder__rhs--opening">
              <PreviewPanel
                onClose={() => {
                  setPreviewOpen(false);
                  setPreviewActive(false);
                  setTestAppointment(null);
                }}
                onPreviewActiveChange={setPreviewActive}
                agentName={agentName}
                testAppointment={testAppointment}
                onEditAppointment={() => setBookTestModalOpen(true)}
              />
            </div>
          )}

          {/* ─── Publish blocked alert (viewport overlay — L1 + top nav + canvas) ─── */}
          {publishBlockedModalOpen && createPortal(
            <div
              className={`ab-publish-blocked-overlay${
                rightPanelOpen
                  ? rightPanelWide
                    ? ' ab-publish-blocked-overlay--rhs-wide'
                    : ' ab-publish-blocked-overlay--rhs-open'
                  : ''
              }`}
              onClick={(e) => {
                if (e.target === e.currentTarget) setPublishBlockedModalOpen(false);
              }}
            >
              <div
                className="ab-publish-blocked-dialog"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="ab-publish-blocked-title"
              >
                <div className="ab-publish-blocked-dialog__header">
                  <h2 id="ab-publish-blocked-title" className="ab-publish-blocked-dialog__title">
                    {publishBlockedCopy(issueCount).title}
                  </h2>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setPublishBlockedModalOpen(false)}
                    className="ab-publish-blocked-dialog__close"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <p className="ab-publish-blocked-dialog__body">
                  {publishBlockedCopy(issueCount).body}
                </p>
                <div className="ab-publish-blocked-dialog__footer">
                  <button
                    type="button"
                    className="ab-publish-blocked-dialog__cancel"
                    onClick={() => setPublishBlockedModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="ab-publish-blocked-dialog__primary"
                    onClick={handleViewPublishErrors}
                  >
                    View errors
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}

          {/* ─── Draft redirect alert (edit Active while unpublished draft exists) ─── */}
          {draftRedirectModalOpen && createPortal(
            <div
              className={`ab-confirm-overlay${
                rightPanelOpen
                  ? rightPanelWide
                    ? ' ab-confirm-overlay--rhs-wide'
                    : ' ab-confirm-overlay--rhs-open'
                  : ''
              }`}
              onClick={(e) => {
                if (e.target === e.currentTarget) setDraftRedirectModalOpen(false);
              }}
            >
              <div
                className="ab-confirm-dialog"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="ab-draft-redirect-title"
              >
                <div className="ab-confirm-dialog__header">
                  <h2 id="ab-draft-redirect-title" className="ab-confirm-dialog__title">
                    This agent has an unpublished draft
                  </h2>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setDraftRedirectModalOpen(false)}
                    className="ab-confirm-dialog__close"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <p className="ab-confirm-dialog__body">
                  Continue editing the draft — changes to the active version won't carry over once it's published.
                </p>
                <div className="ab-confirm-dialog__footer">
                  <button
                    type="button"
                    className="ab-confirm-dialog__cancel"
                    onClick={() => setDraftRedirectModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="ab-confirm-dialog__primary"
                    onClick={handleGoToDraftVersion}
                  >
                    Edit draft
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}

          {/* ─── Delete agent confirm (viewport overlay) ─── */}
          {deleteConfirmOpen && createPortal(
            <div
              className={`ab-confirm-overlay${
                rightPanelOpen
                  ? rightPanelWide
                    ? ' ab-confirm-overlay--rhs-wide'
                    : ' ab-confirm-overlay--rhs-open'
                  : ''
              }`}
              onClick={(e) => {
                if (e.target === e.currentTarget) setDeleteConfirmOpen(false);
              }}
            >
              <div
                className="ab-confirm-dialog"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="ab-delete-confirm-title"
              >
                <div className="ab-confirm-dialog__header">
                  <h2 id="ab-delete-confirm-title" className="ab-confirm-dialog__title">
                    Delete agent?
                  </h2>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="ab-confirm-dialog__close"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <p className="ab-confirm-dialog__body">
                  Are you sure you want to delete this agent? This action cannot be undone.
                </p>
                <div className="ab-confirm-dialog__footer">
                  <button
                    type="button"
                    className="ab-confirm-dialog__cancel"
                    onClick={() => setDeleteConfirmOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="ab-confirm-dialog__primary ab-confirm-dialog__primary--danger"
                    onClick={handleConfirmDeleteAgent}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}
        </div>
      </div>

      {isReminderAgent && (
        <BookTestAppointmentModal
          open={bookTestModalOpen}
          initialValues={testAppointment}
          onClose={() => setBookTestModalOpen(false)}
          onBookAndRun={(values) => {
            setBookTestModalOpen(false);
            setTestAppointment(values);
            setPreviewOpen(true);
          }}
        />
      )}

      {/* ─── Share modal ─── */}
      {shareModalOpen && (
        <ShareModal
          shareUrl={agentSlug && agentModuleSlug
            ? `${window.location.origin}/view/${agentModuleSlug}/${agentSlug}`
            : `${window.location.origin}/view/${agentId}`}
          onClose={() => setShareModalOpen(false)}
        />
      )}

      {/* ─── Reminder tool drawer ─── */}
      <ReminderToolDrawer isOpen={reminderToolOpen} onClose={() => setReminderToolOpen(false)} initialValues={currentDetails} onFieldChange={activeFieldChange} />

      {/* ─── Voice call tool drawer ─── */}
      <VoiceCallToolDrawer isOpen={voiceCallToolOpen} onClose={() => setVoiceCallToolOpen(false)} initialValues={currentDetails} product={product} onFieldChange={activeFieldChange} />

      {/* ─── Transfer tool drawer ─── */}
      <TransferToolDrawer isOpen={transferToolOpen} onClose={() => setTransferToolOpen(false)} />

      {/* ─── Query config drawer (Get all unscheduled treatment plans) ─── */}
      <QueryConfigDrawer isOpen={queryConfigOpen} onClose={() => setQueryConfigOpen(false)} />

      {/* ─── Assign contact status tool drawer ─── */}
      <AssignContactStatusDrawer isOpen={assignContactStatusToolOpen} onClose={() => setAssignContactStatusToolOpen(false)} />

      {/* ─── Assign conversation tool drawer ─── */}
      <AssignConversationDrawer isOpen={assignConversationToolOpen} onClose={() => setAssignConversationToolOpen(false)} />

      {/* ─── Assign conversation status tool drawer ─── */}
      <AssignConversationStatusDrawer isOpen={assignConversationStatusToolOpen} onClose={() => setAssignConversationStatusToolOpen(false)} />

      <HandleResponseDrawer
        isOpen={handleResponseToolOpen}
        value={currentDetails.handleResponse}
        onClose={() => setHandleResponseToolOpen(false)}
        onSave={(config) => {
          activeFieldChange('handleResponse', config);
          setHandleResponseToolOpen(false);
        }}
      />

      {/* ─── Tool configuration overlay ─── */}
      {viewingTool && (
        <CustomToolViewer
          isOpen={!!viewingTool}
          tool={viewingTool}
          initialValues={viewingToolValues}
          onClose={() => { setViewingTool(null); setViewingToolValues({}); }}
          onSave={(tool, fieldValues) => {
            // Persist filled state back into nodeDetails
            if (selectedNodeId) {
              setNodeDetails((prev) => ({
                ...prev,
                [selectedNodeId]: {
                  ...(prev[selectedNodeId] || {}),
                  toolFieldValues: {
                    ...(prev[selectedNodeId]?.toolFieldValues || {}),
                    [tool.id]: fieldValues,
                  },
                },
              }));
            }
            setViewingTool(null);
            setViewingToolValues({});
          }}
        />
      )}

      {/* ─── Tool picker (add/swap tool) ─── */}
      <AddToolDrawer
        isOpen={toolPickerOpen}
        onClose={() => setToolPickerOpen(false)}
        product={product}
        activeNavId={activeNavId}
        onSelectTool={(tool) => {
          if (!selectedNodeId) return;
          const { fieldValues, ...toolBase } = tool;
          setNodeDetails((prev) => ({
            ...prev,
            [selectedNodeId]: {
              ...(prev[selectedNodeId] || {}),
              toolId: toolBase.id,
              selectedTools: [...(prev[selectedNodeId]?.selectedTools || []), toolBase.id].filter((v, i, a) => a.indexOf(v) === i),
              toolFieldValues: {
                ...(prev[selectedNodeId]?.toolFieldValues || {}),
                ...(fieldValues ? { [toolBase.id]: fieldValues } : {}),
              },
            },
          }));
          setToolPickerOpen(false);
        }}
      />

      {/* ─── Hidden file input for JSON import ─── */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        className="ab-hidden-input"
        onChange={handleImport}
      />

      {!viewOnly && (
        <WorkflowCoachTour open={coachTourOpen} onClose={() => setCoachTourOpen(false)} />
      )}

      <GlossaryModal
        open={glossaryOpen}
        onClose={closeGlossary}
        initialTermId={glossaryTermId}
      />
    </div>
  );
}
