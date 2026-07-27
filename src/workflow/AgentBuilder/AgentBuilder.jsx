import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import LHSDrawer, { isFrontDeskAgent, INITIATE_VOICE_CALL_TASK } from '../LHSDrawer/LHSDrawer';
import FlowCanvas from '../FlowCanvas/FlowCanvas';
import RHS from '../Organisms/Panels/RHS/RHS';
import ScheduleBased from '../Molecules/RHS/Trigger/ScheduleBased/ScheduleBased';
import ShareModal from '../Organisms/Modals/ShareModal/ShareModal';
import EmptyStates from '../Patterns/EmptyStates/EmptyStates';
import { Button } from '../elemental-stubs';
import { saveAgent, getAgentBySlug, getCachedAgent, saveCustomTool, getCustomTools, getCustomToolsByIds, getSeedTools } from '../services/agentService';
import CustomToolViewer from '../Organisms/Drawers/CustomToolViewer/CustomToolViewer';
import PreviewPanel from '../Molecules/PreviewPanel/PreviewPanel';
import { BookTestAppointmentModal } from '../../components/BookTestAppointmentModal/BookTestAppointmentModal';
import ReminderToolDrawer from '../Organisms/Drawers/ReminderToolDrawer/ReminderToolDrawer';
import VoiceCallToolDrawer from '../Organisms/Drawers/VoiceCallToolDrawer/VoiceCallToolDrawer';
import TransferToolDrawer from '../Organisms/Drawers/TransferToolDrawer/TransferToolDrawer';
import QueryConfigDrawer from '../Organisms/Drawers/QueryConfigDrawer/QueryConfigDrawer';
import AssignContactStatusDrawer from '../Organisms/Drawers/AssignContactStatusDrawer/AssignContactStatusDrawer';
import AssignConversationDrawer from '../Organisms/Drawers/AssignConversationDrawer/AssignConversationDrawer';
import AssignConversationStatusDrawer from '../Organisms/Drawers/AssignConversationStatusDrawer/AssignConversationStatusDrawer';
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
} from '../flowLayoutConstants';
import { computeLoopCanvasHeight, computeLoopBodyHeight } from '../Molecules/Canvas/LoopNode/LoopNode';
import './AgentBuilder.css';

const START_NODE_ID = '__start__';
const END_NODE_ID = '__end__';

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
      conditions: [
        { field: '', operator: '', value: '' },
        { field: '', operator: '', value: '' },
        { field: '', operator: '', value: '' },
      ],
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
  if (type === 'branch') return { basedOn: 'conditions', branches: [] };
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

const TASK_DROP_DEFAULTS = {
  'Initiate voice call': { description: 'Call the customer' },
  'In-call SMS': { description: 'Send a text message to the caller during the active call', selectedTools: ['in-call-sms'] },
  'Send response': { selectedTools: ['send-response'] },
  'Schedule appointment': { description: 'Book a new appointment for the customer' },
  'Reschedule appointment': { description: 'Change an existing appointment date or time' },
  'Cancel appointment': { description: 'Cancel a scheduled appointment' },
  'Confirm appointment': { description: 'Confirm appointment details with the customer' },
  'Appointment reminder': { description: '3 weeks, 3 days and 24 hours before · Email & text', selectedTools: ['reminder-tool'] },
  'Update contact property': { description: 'Update a field on the contact record' },
  'Add contact to list': { description: 'Add the contact to a marketing or CRM list' },
  'Remove contact from list': { description: 'Remove the contact from a list' },
  'Send data to external app': { description: 'Push data to a connected external application' },
  'Fetch data from external app': { description: 'Retrieve data from a connected external application' },
  'Trigger external webhook': { description: 'Fire a webhook to an external system' },
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
      hasToggle: true,
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
  return FLOW_STANDARD_NODE_HEIGHT;
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

function buildFlow(nodeList, startData, nodeDetails = {}, product = 'automotive') {
  let y = 0;
  const nodes = [];
  const edges = [];
  // Shared sequential step counter — incremented for every rendered content node
  let stepCounter = 0;

  nodes.push({
    id: START_NODE_ID,
    type: 'start',
    position: { x: 0, y },
    data: {
      title: startData.title,
      subtitle: startData.subtitle,
      subtitleIsLink: startData.subtitleIsLink,
    },
  });
  y += FLOW_START_GAP;

  let lastNodeY = 0;
  let lastNodeBlockHeight = FLOW_START_NODE_HEIGHT;

  nodeList.forEach((item, i) => {
    const nodeId = item.id;
    const prevId = i === 0 ? START_NODE_ID : nodeList[i - 1].id;
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
            title: 'Based on conditions',
            subtitle: 'Build condition-specific flows',
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
                },
    });
    const prevIsProcedures = i > 0 && nodeList[i - 1].flowType === 'procedures';
    edges.push({
      id: `e-${prevId}-${nodeId}`,
      source: prevId,
      target: nodeId,
      type: 'addButton',
      data: { betweenCards: true, ...(prevIsProcedures ? { hideAddButton: true } : {}) },
    });

    if (item.flowType === 'branch' || item.flowType === 'voiceCall') {
      const isVoiceCall = item.flowType === 'voiceCall';
      const branches = nodeDetails[nodeId]?.branches || [];

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
      const startX = -((branches.length - 1) * spacing) / 2;
      const branchChipY = y + 150;
      const branchNodeStartY = y + 260;

      // Helper: fan out a voiceCall node's sub-branches
      const renderVoiceCallBranches = (vcNodeId, baseX, baseY) => {
        const vcBranches = nodeDetails[vcNodeId]?.branches || [];
        const vcSpacing = 480;
        const vcStartX = baseX - ((vcBranches.length - 1) * vcSpacing) / 2;
        const vcChipY = baseY + 150;
        const vcNodeStartY = baseY + 260;
        vcBranches.forEach((vcBranch, vcBi) => {
          const vcBranchX = vcStartX + vcBi * vcSpacing;
          const vcBranchNodes = nodeDetails[vcBranch.id]?.nodes || [];
          nodes.push({ id: vcBranch.id, type: 'branchPath', position: { x: vcBranchX, y: vcChipY }, data: { label: vcBranch.name, parentId: vcNodeId, isFallback: !!vcBranch.isFallback, isVoiceCallBranch: true } });
          edges.push({ id: `e-${vcNodeId}-${vcBranch.id}`, source: vcNodeId, target: vcBranch.id, type: 'branchFan' });
          let vcPrevId = vcBranch.id;
          vcBranchNodes.forEach((vcChild, vcIdx) => {
            const vcChildId = vcChild.id;
            const vcChildDet = nodeDetails[vcChildId] || {};
            let vcChildData = { ...vcChild.data, stepNumber: ++stepCounter };
            if (vcChild.flowType !== 'delay' && vcChild.flowType !== 'branch') {
              vcChildData = { ...vcChildData, title: vcChildDet.taskName ?? vcChildDet.triggerName ?? vcChildData.title, subtitle: vcChildDet.description ?? vcChildData.subtitle };
            }
            nodes.push({ id: vcChildId, type: vcChild.flowType, position: { x: vcBranchX, y: vcNodeStartY + vcIdx * 250 }, data: vcChildData });
            edges.push({ id: `e-${vcPrevId}-${vcChildId}`, source: vcPrevId, target: vcChildId, type: 'addButton', data: { branchPathId: vcBranch.id, afterNodeId: vcPrevId === vcBranch.id ? null : vcPrevId, betweenCards: vcPrevId !== vcBranch.id } });
            vcPrevId = vcChildId;
          });
          const vcEndId = `${vcBranch.id}-end`;
          nodes.push({ id: vcEndId, type: 'branchEnd', position: { x: vcBranchX, y: vcNodeStartY + vcBranchNodes.length * 250 }, data: { parentId: vcBranch.id } });
          edges.push({ id: `e-${vcPrevId}-${vcEndId}`, source: vcPrevId, target: vcEndId, type: 'addButton', data: { branchPathId: vcBranch.id, afterNodeId: vcPrevId === vcBranch.id ? null : vcPrevId } });
        });
      };

      branches.forEach((branch, bi) => {
        const branchX = startX + bi * spacing;
        const branchNodes = nodeDetails[branch.id]?.nodes || [];
        nodes.push({
          id: branch.id,
          type: 'branchPath',
          position: { x: branchX, y: branchChipY },
          data: { label: branch.name, parentId: nodeId, isFallback: !!branch.isFallback, isVoiceCallBranch: isVoiceCall || !!branch.isVoiceCallBranch },
        });
        edges.push({ id: `e-${nodeId}-${branch.id}`, source: nodeId, target: branch.id, type: 'branchFan' });

        let previousId = branch.id;
        let previousChildFlowType = null;
        let childYOffset = 0;
        branchNodes.forEach((childNode, childIndex) => {
          const childId = childNode.id;
          const childDet = nodeDetails[childId] || {};
          let childData = { ...childNode.data, stepNumber: ++stepCounter };
          if (childNode.flowType === 'procedures') {
            childData = { ...childData, toggleEnabled: childNode.data?.toggleEnabled ?? true, procedureItems: mapProcedureItems(childDet.procedureIds, nodeDetails, childId, product) };
          } else if (childNode.flowType !== 'delay' && childNode.flowType !== 'branch') {
            childData = { ...childData, title: childDet.taskName ?? childDet.triggerName ?? childData.title, subtitle: childDet.description ?? childData.subtitle };
          }
          const childY = branchNodeStartY + childYOffset;
          nodes.push({ id: childId, type: childNode.flowType, position: { x: branchX, y: childY }, data: childData });
          edges.push({ id: `e-${previousId}-${childNode.id}`, source: previousId, target: childNode.id, type: 'addButton', data: { branchPathId: branch.id, afterNodeId: previousId === branch.id ? null : previousId, betweenCards: previousId !== branch.id, ...(previousChildFlowType === 'procedures' ? { hideAddButton: true } : {}) } });
          previousId = childNode.id;
          previousChildFlowType = childNode.flowType;
          childYOffset += 250;

          // Fan out voiceCall sub-branches when voiceCall is nested inside a branch path
          if (childNode.flowType === 'voiceCall') {
            renderVoiceCallBranches(childId, branchX, childY);
          }

          // Fan out a nested branch node inside this branch path
          if (childNode.flowType === 'branch') {
            const innerBranches = childDet.branches || [];
            // Detect if any inner arm contains a voiceCall to size inner spacing
            const innerHasVoiceCall = innerBranches.some(nb =>
              (nodeDetails[nb.id]?.nodes || []).some(nn => nn.flowType === 'voiceCall')
            );
            const innerSpacing = innerHasVoiceCall ? 1100 : 480;
            const innerStartX = branchX - ((innerBranches.length - 1) * innerSpacing) / 2;
            const innerChipY = childY + 150;
            const innerNodeStartY = childY + 260;
            innerBranches.forEach((innerBranch, innerBi) => {
              const innerBranchX = innerStartX + innerBi * innerSpacing;
              const innerBranchNodes = nodeDetails[innerBranch.id]?.nodes || [];
              nodes.push({ id: innerBranch.id, type: 'branchPath', position: { x: innerBranchX, y: innerChipY }, data: { label: innerBranch.name, parentId: childId, isFallback: !!innerBranch.isFallback, isVoiceCallBranch: false } });
              edges.push({ id: `e-${childId}-${innerBranch.id}`, source: childId, target: innerBranch.id, type: 'branchFan' });
              let innerPrevId = innerBranch.id;
              let innerYOff = 0;
              innerBranchNodes.forEach((innerChild) => {
                const innerChildId = innerChild.id;
                const innerChildDet = nodeDetails[innerChildId] || {};
                let innerChildData = { ...innerChild.data, stepNumber: ++stepCounter };
                if (innerChild.flowType !== 'delay' && innerChild.flowType !== 'branch') {
                  innerChildData = { ...innerChildData, title: innerChildDet.taskName ?? innerChildDet.triggerName ?? innerChildData.title, subtitle: innerChildDet.description ?? innerChildData.subtitle };
                }
                const innerChildY = innerNodeStartY + innerYOff;
                nodes.push({ id: innerChildId, type: innerChild.flowType, position: { x: innerBranchX, y: innerChildY }, data: innerChildData });
                edges.push({ id: `e-${innerPrevId}-${innerChildId}`, source: innerPrevId, target: innerChildId, type: 'addButton', data: { branchPathId: innerBranch.id, afterNodeId: innerPrevId === innerBranch.id ? null : innerPrevId, betweenCards: innerPrevId !== innerBranch.id } });
                innerPrevId = innerChildId;
                innerYOff += 250;
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
        });

        // Skip branchEnd when last child is a voiceCall or nested branch (they render their own ends)
        const lastChild = branchNodes.length > 0 ? branchNodes[branchNodes.length - 1] : null;
        const lastChildIsBranchLike = lastChild && (lastChild.flowType === 'voiceCall' || lastChild.flowType === 'branch');
        if (!lastChildIsBranchLike) {
          const branchEndId = `${branch.id}-end`;
          nodes.push({ id: branchEndId, type: 'branchEnd', position: { x: branchX, y: branchNodeStartY + childYOffset }, data: { parentId: branch.id } });
          edges.push({ id: `e-${previousId}-${branchEndId}`, source: previousId, target: branchEndId, type: 'addButton', data: { branchPathId: branch.id, afterNodeId: previousId === branch.id ? null : previousId, viewOnly: !!branch.isFallback, ...(previousChildFlowType === 'procedures' ? { hideAddButton: true } : {}) } });
        }
      });
      // Branch paths fan out to the side — do not inflate main-spine y or spine edges stretch.
    }

    y += getFlowVerticalStep(item, nodeId, nodeDetails, product);
  });

  const lastId = nodeList.length > 0 ? nodeList[nodeList.length - 1].id : START_NODE_ID;
  const lastNodeIsProcedures = nodeList.length > 0 && nodeList[nodeList.length - 1].flowType === 'procedures';
  const lastFlowType = nodeList.length > 0 ? nodeList[nodeList.length - 1].flowType : null;
  if (!nodeList.length || (lastFlowType !== 'branch' && lastFlowType !== 'voiceCall')) {
    const endY = lastNodeY + lastNodeBlockHeight;
    nodes.push({
      id: END_NODE_ID,
      type: 'end',
      // Top of End node aligns with the bottom of the preceding block; connector fills FLOW_CONNECTOR_GAP
      position: { x: 0, y: endY },
      data: { afterNodeId: lastId, hideAddBeforeEnd: lastNodeIsProcedures },
    });
    edges.push({
      id: `e-${lastId}-${END_NODE_ID}`,
      source: lastId,
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
  initialDescription = '',
  initialNodes = null,
  initialNodeDetails = null,
  onSaveAgent,
  onSaveTemplate,
  onClose,
  onEdit,
  viewOnly = false,
  product = 'automotive',
  procedures = null,
  onAddProcedure,
  publishDisabled = false,
  defaultOpenSection = 'Tasks',
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
  // Canvas node clipboard — holds a copied node's entry + a snapshot of its (and any referenced branch/loop) details
  const [clipboard, setClipboard] = useState(null);
  // Tracks which procedure is open in the detail view (UI-only, not persisted)
  const [activeProcedureId, setActiveProcedureId] = useState(null);
  const [lhsPreviewProcedureId, setLhsPreviewProcedureId] = useState(null);
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
  const [toolPickerOpen, setToolPickerOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lhsCollapsed, setLhsCollapsed] = useState(false);
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

  /* ─── Sync live procedure library into the procedureService registry ─── */
  useEffect(() => {
    setLiveProcedures(procedures);
  }, [procedures]);

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
  const headerMenuRef = useRef(null);
  const importInputRef = useRef(null);
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
  /* ─── Agent name is derived from nodeDetails (single source of truth) ─── */
  const agentName = nodeDetails[START_NODE_ID]?.agentName || (typeof pageTitle === 'string' ? pageTitle : '') || '';
  const isReminderAgent = /reminder/i.test(agentName);
  const [agentDesc] = useState(initialDescription || '');
  // isTemplateMode uses state so it correctly activates after applyAgent loads templateId from Firestore
  const isTemplateMode = !!agentTemplateId && agentStatus !== 'Running';

  /* ─── Always-fresh ref so publish never reads stale closure values ─── */
  const latestRef = useRef({});
  useLayoutEffect(() => {
    latestRef.current = { agentId, agentName, agentDesc, moduleContext: agentModuleContext, sectionContext: agentSectionContext, agentStatus, nodeList, nodeDetails, templateId: agentTemplateId, templateSource: agentTemplateSource, moduleSlug: agentModuleSlug, agentSlug };
  }, [agentId, agentName, agentDesc, agentModuleContext, agentSectionContext, agentStatus, nodeList, nodeDetails, agentTemplateId, agentTemplateSource, agentModuleSlug, agentSlug]);

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

  const buildAgentPayload = useCallback((status = 'Running') => {
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
    const payload = buildAgentPayload('Running');
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
      setAgentStatus('Running');
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

  const handleSaveAndPublish = useCallback(async () => {
    clearTimeout(saveTimerRef.current);
    const templatePayload = buildTemplatePayload();
    const agentPayload = buildAgentPayload('Running');
    if (!templatePayload || !agentPayload) return;
    try {
      await onSaveTemplate?.(templatePayload);
      await saveAgent(agentPayload.id, agentPayload);
      setAgentStatus('Running');
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
    setNodeList((prev) => {
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
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      setDrawerOpen(false);
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
  }, [clipboard, nodeList, nodeDetails, selectedNodeId]);

  const handleAddBranchPath = useCallback((branchNodeId) => {
    const newPathId = `${branchNodeId}-path-${Date.now()}`;
    setNodeDetails((prev) => {
      const nodeD = prev[branchNodeId] || {};
      const existing = nodeD.branches || [];
      const nonFallback = existing.filter((b) => !b.isFallback);
      const fallback = existing.filter((b) => b.isFallback);
      const pathNumber = nonFallback.length + 1;
      const newPath = { id: newPathId, name: `Branch ${pathNumber}` };
      return {
        ...prev,
        [branchNodeId]: {
          ...nodeD,
          branches: [...nonFallback, newPath, ...fallback],
        },
        [newPathId]: {
          branchName: newPath.name,
          description: '',
          conditions: [],
          parentId: branchNodeId,
          isBranchPath: true,
        },
      };
    });
  }, []);

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
    if (selectedNodeId === branchPathId) {
      setSelectedNodeId(null);
      setDrawerOpen(false);
    }
  }, [selectedNodeId]);

  const startAgentName = nodeDetails[START_NODE_ID]?.agentName || pageTitle;
  const startLocations = nodeDetails[START_NODE_ID]?.locations || [];
  const locationCount = startLocations.length;
  const startSubtitle = locationCount === 0
    ? 'Add locations'
    : locationCount === 1
      ? '1 location'
      : `${locationCount} locations`;
  const startData = {
    title: startAgentName,
    subtitle: startSubtitle,
    subtitleIsLink: locationCount === 0,
  };
  const { nodes: rawNodes, edges } = buildFlow(nodeList, startData, nodeDetails, product);

  const nodes = rawNodes.map((n) => {
    if (n.id === START_NODE_ID || n.id === END_NODE_ID) return n;
    if (n.type === 'branchPath') {
      return { ...n, data: { ...n.data, onDelete: () => handleDeleteBranchPath(n.id) } };
    }
    if (n.type === 'branchEnd') return n;
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
    };
    if (n.type === 'branch') extra.onAddBranch = () => handleAddBranchPath(n.id);
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

  const handleNodesReorder = useCallback((newIdOrder) => {
    setNodeList((prev) => {
      const byId = Object.fromEntries(prev.map((n) => [n.id, n]));
      const reordered = newIdOrder.map((id) => byId[id]).filter(Boolean);
      return reordered.map((n, i) => ({ ...n, data: { ...n.data, stepNumber: i + 1 } }));
    });
  }, []);

  const handleDropNode = useCallback(({ type, label, description, afterNodeId, branchPathId, position, insertAtBeginning }) => {
    // Nothing can be inserted above the first trigger — start node is always the entry point
    if (insertAtBeginning || afterNodeId === START_NODE_ID) return;

    if (
      isFrontDeskAgent(agentName)
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
    if (effectiveType === 'task' && description && label !== 'Custom') {
      const taskDefaults = TASK_DROP_DEFAULTS[description] || {};
      details = {
        ...details,
        taskName: description,
        description: taskDefaults.description ?? '',
        ...(taskDefaults.selectedTools ? { selectedTools: taskDefaults.selectedTools } : {}),
      };
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
      if (type === 'procedures' && procedureSeed === CUSTOM_PROCEDURE_ID) {
        setSelectedNodeId(id);
        setDrawerOpen(true);
        setActiveProcedureId(CUSTOM_PROCEDURE_ID);
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
      Object.assign(details, {
        basedOn: 'conditions',
        branches: [
          { id: path1Id, name: 'Branch 1' },
          { id: path2Id, name: 'Branch 2' },
          { id: fallbackId, name: 'No conditions met', isFallback: true },
        ],
      });
      extraDetails = {
        [path1Id]: { branchName: 'Branch 1', description: '', conditions: [], parentId: id, isBranchPath: true, nodes: [] },
        [path2Id]: { branchName: 'Branch 2', description: '', conditions: [], parentId: id, isBranchPath: true, nodes: [] },
        [fallbackId]: { branchName: 'No conditions met', description: '', conditions: [], parentId: id, isBranchPath: true, isFallback: true, nodes: [] },
      };
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

    if (type === 'procedures' && procedureSeed === CUSTOM_PROCEDURE_ID) {
      setSelectedNodeId(id);
      setDrawerOpen(true);
      setActiveProcedureId(CUSTOM_PROCEDURE_ID);
    }
  }, [agentName, product]);

  const handleNodeClick = useCallback((node) => {
    if (node.type === 'end' || node.type === 'branchEnd') return;
    // Voice call branches are hard-coded and non-editable — block RHS open
    if (node.data?.isVoiceCallBranch) return;
    setSelectedNodeId(node.id);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedNodeId(null);
    setActiveProcedureId(null);
    setLhsPreviewProcedureId(null);
  }, []);

  const currentDetails = selectedNodeId ? (nodeDetails[selectedNodeId] || {}) : {};

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
      const mergedProc = getProcedureDetailContent(lhsPreviewProcedureId, {}, product);
      return (
        <RHS
          key={`lhs-preview-${lhsPreviewProcedureId}`}
          variant="procedureDetail"
          title={mergedProc.name}
          viewOnly={viewOnly}
          product={product}
          onBack={() => { setLhsPreviewProcedureId(null); setDrawerOpen(false); }}
          bodyProps={{
            initialValues: mergedProc,
            onFieldChange: () => {},
            onOpenToolDrawer: () => setToolPickerOpen(true),
          }}
          onClose={() => { setLhsPreviewProcedureId(null); setDrawerOpen(false); }}
          onSave={() => { setLhsPreviewProcedureId(null); setDrawerOpen(false); }}
        />
      );
    }

    if (!selectedNodeId) return null;

    if (selectedNodeId === START_NODE_ID) {
      const startDetails = nodeDetails[START_NODE_ID] || {
        agentName: pageTitle,
        goals: 'Respond to customer reviews promptly and professionally, maintaining brand voice and addressing specific customer feedback.',
        outcomes: 'Improved customer satisfaction scores, faster response times, and consistent brand messaging across all review platforms.',
        locations: [],
      };
      return (
        <RHS
          variant="agentDetails"
          title="Agent details"
          viewOnly={viewOnly}
          product={product}
          bodyProps={{
            values: startDetails,
            onChange: (field, value) => {
              setNodeDetails((prev) => ({
                ...prev,
                [START_NODE_ID]: { ...(prev[START_NODE_ID] || startDetails), [field]: value },
              }));
            },
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
          viewOnly={viewOnly}
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
          onPreview={() => setPreviewOpen((v) => !v)}
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
          viewOnly={viewOnly}
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
          variant="entityTrigger"
          title="Trigger"
          viewOnly={viewOnly}
          product={product}
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (flowType === 'branch') {
      return (
        <RHS
          variant="controlBranch"
          title="Branch details"
          viewOnly={viewOnly}
          product={product}
          bodyProps={{
            initialValues: { ...currentDetails, branchNodeId: selectedNodeId },
            onFieldChange: activeFieldChange,
            onDeleteBranch: (branchId) => handleDeleteBranchPath(branchId),
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
          viewOnly={viewOnly}
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
          viewOnly={viewOnly}
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
          viewOnly={viewOnly}
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
          viewOnly={viewOnly}
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
              viewOnly={viewOnly}
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
            viewOnly={viewOnly}
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
          viewOnly={viewOnly}
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

    if (data.hasAiIcon) {
      return (
        <RHS
          variant="llmTask"
          title="LLM Task"
          viewOnly={viewOnly}
          product={product}
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange, onOpenToolDrawer: () => setToolPickerOpen(true), onOpenTool: openToolByName }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (flowType === 'voiceCall') {
      return (
        <RHS
          variant="voiceCallTask"
          title="Task"
          viewOnly={viewOnly}
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
          title="Task"
          viewOnly={viewOnly}
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
        title="Task"
        viewOnly={viewOnly}
        bodyProps={{
          initialValues: currentDetails,
          onFieldChange: activeFieldChange,
          onOpenTool: (toolId) => {
            if (toolId === 'reminder-tool') { setReminderToolOpen(true); return; }
            if (toolId === 'get-unscheduled-treatment-plans') { setQueryConfigOpen(true); return; }
            if (toolId === 'assign-contact-status') { setAssignContactStatusToolOpen(true); return; }
            if (toolId === 'assign-conversation') { setAssignConversationToolOpen(true); return; }
            if (toolId === 'assign-conversation-status') { setAssignConversationStatusToolOpen(true); return; }
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
  };

  /* ─── Header actions: Publish + three-dots menu (or view-only badge) ─── */
  const headerActions = viewOnly ? (
    <div className="ab-view-badge">
      <span className="material-symbols-outlined">visibility</span>
      View only
    </div>
  ) : (
    <div className="ab-header-actions">
      {/* Cloud save icon — matches Figma 41-43635 */}
      <button
        type="button"
        className="ab-header-cloud-btn"
        onClick={handleShare}
        title="Save to cloud"
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#555', padding: 4, borderRadius: 4 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: 1, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}>cloud_upload</span>
      </button>
<Button
        theme="primary"
        label={isTemplateMode ? 'Save template' : 'Publish'}
        onClick={isTemplateMode ? handleSaveTemplate : handlePublish}
        disabled={!isTemplateMode && publishDisabled}
      />
    </div>
  );

  const STATUS_BADGE_CLASS = {
    Running: 'ab-header-status--running',
    Paused: 'ab-header-status--paused',
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
    <div className="faq-ab-embedded" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'transparent' }}>
      {/* ─── Embedded builder header ─── */}
      <div className="faq-ab-header" style={{
        height: 52,
        borderBottom: '1px solid #e9e9eb',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        gap: 8,
      }}>
        <div className="ab-header-left">
          {onClose && (
            <button
              type="button"
              className="ab-header-back-btn"
              onClick={onClose}
              title="Back to agents"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M5.98854 10.6267L8.73215 13.3703C8.85608 13.4943 8.91724 13.6393 8.91565 13.8054C8.91403 13.9715 8.85287 14.1192 8.73215 14.2485C8.60288 14.3778 8.45438 14.4446 8.28665 14.4488C8.11892 14.4531 7.97042 14.3906 7.84115 14.2613L4.10877 10.529C3.95813 10.3783 3.88281 10.2026 3.88281 10.0017C3.88281 9.80088 3.95813 9.62514 4.10877 9.4745L7.84115 5.74212C7.96508 5.61819 8.11224 5.55703 8.28265 5.55862C8.45305 5.56024 8.60288 5.62567 8.73215 5.75494C8.85287 5.88421 8.91537 6.03058 8.91965 6.19404C8.92392 6.3575 8.86142 6.50386 8.73215 6.63312L5.98854 9.37675H15.7931C15.9704 9.37675 16.1189 9.43658 16.2386 9.55623C16.3582 9.67588 16.418 9.82438 16.418 10.0017C16.418 10.1791 16.3582 10.3276 16.2386 10.4472C16.1189 10.5669 15.9704 10.6267 15.7931 10.6267H5.98854Z" fill="currentColor"/>
              </svg>
            </button>
          )}
          <span className="ab-header-title">{agentName || 'Untitled agent'}</span>
          <span className={`ab-header-status ${statusBadgeClass}`}>{agentStatus}</span>
        </div>
        <div className="ab-header-spacer" aria-hidden />
        {headerActions}
      </div>

      {/* ─── Builder body ─── */}
      <div className="agent-builder-wrapper" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fb', backgroundImage: 'radial-gradient(circle, #c8cdd8 1px, transparent 1px)', backgroundSize: '28px 28px', overflow: 'hidden' }}>
        {viewOnly && (
          <div className="ab-view-banner">
            <span className="material-symbols-outlined">visibility</span>
            <span>You&apos;re viewing a shared workflow. Editing is disabled.</span>
            <a
              className="ab-view-banner__link"
              href={`mailto:?subject=Request edit access – ${agentName}`}
            >
              Request edit access
            </a>
          </div>
        )}

        <div className="agent-builder">
          <div className={`agent-builder__lhs${lhsCollapsed ? ' agent-builder__lhs--collapsed' : ''}`}>
            <LHSDrawer
              defaultTab="Create manually"
              defaultOpenSection={defaultOpenSection}
              viewOnly={viewOnly}
              product={product}
              agentName={agentName}
              procedures={procedures}
              onCollapse={viewOnly ? undefined : () => setLhsCollapsed(true)}
              onProcedureClick={viewOnly ? undefined : (procedureId) => {
                setLhsPreviewProcedureId(procedureId);
                setSelectedNodeId(null);
                setActiveProcedureId(null);
                setDrawerOpen(true);
              }}
            />
          </div>

          {lhsCollapsed && (
            <button
              className="ab-lhs-expand-pill"
              onClick={() => setLhsCollapsed(false)}
            >
              <span className="material-symbols-outlined">left_panel_open</span>
              <span className="ab-lhs-expand-pill__label">Editor</span>
            </button>
          )}

          <div className={`agent-builder__canvas${drawerOpen ? ' agent-builder__canvas--with-rhs' : ''}`}>
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              onNodeClick={handleNodeClick}
              onDropNode={viewOnly ? undefined : handleDropNode}
              onNodesReorder={viewOnly ? undefined : handleNodesReorder}
              hasClipboard={!viewOnly && !!clipboard}
              onPasteAtConnector={viewOnly ? undefined : handlePasteBelow}
              selectedNodeId={selectedNodeId}
              orientation="vertical"
              viewOnly={viewOnly}
              product={product}
              agentName={agentName}
              onEdit={viewOnly ? onEdit : undefined}
              onRun={() => {
                if (isReminderAgent) {
                  setBookTestModalOpen(true);
                } else {
                  setTestAppointment(null);
                  setPreviewOpen(true);
                }
              }}
            />
          </div>

          {drawerOpen && (
            <div key={selectedNodeId} className="agent-builder__rhs">
              <RHSErrorBoundary key={selectedNodeId}>
                {renderRHSPanel()}
              </RHSErrorBoundary>
            </div>
          )}

          {previewOpen && (
            <div className="agent-builder__preview">
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
      <ReminderToolDrawer isOpen={reminderToolOpen} onClose={() => setReminderToolOpen(false)} />

      {/* ─── Voice call tool drawer ─── */}
      <VoiceCallToolDrawer isOpen={voiceCallToolOpen} onClose={() => setVoiceCallToolOpen(false)} initialValues={currentDetails} product={product} />

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
    </div>
  );
}
