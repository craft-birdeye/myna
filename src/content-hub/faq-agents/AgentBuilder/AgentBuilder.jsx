import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import LHSDrawer from '../LHSDrawer/LHSDrawer';
import FlowCanvas from '../FlowCanvas/FlowCanvas';
import RHS from '../Organisms/Panels/RHS/RHS';
import ScheduleBased from '../Molecules/RHS/Trigger/ScheduleBased/ScheduleBased';
import ShareModal from '../Organisms/Modals/ShareModal/ShareModal';
import EmptyStates from '../Patterns/EmptyStates/EmptyStates';
import { Button } from '../elemental-stubs';
import { saveAgent, getAgentBySlug, getCachedAgent, saveCustomTool, getCustomTools } from '../services/agentService';
import { getProcedureById, PROCEDURES } from '../services/procedureService';
import { getModuleNav } from '../Modules/moduleNavigation';
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
    const firstId = label && label !== 'Custom' ? label : null;
    return { procedureIds: firstId ? [firstId] : [] };
  }
  if (type === 'branch') return { basedOn: 'conditions', branches: [] };
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
  } else if (type === 'delay') {
    flowType = 'delay';
  } else if (type === 'parallel') {
    flowType = 'parallel';
  } else if (type === 'loop') {
    flowType = 'loop';
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

function buildFlow(nodeList, startData, nodeDetails = {}) {
  let y = 0;
  const nodes = [];
  const edges = [];

  nodes.push({
    id: START_NODE_ID,
    type: 'start',
    position: { x: 0, y },
    data: { title: startData.title, subtitle: startData.subtitle },
  });
  y += 150;

  nodeList.forEach((item, i) => {
    const nodeId = item.id;
    const prevId = i === 0 ? START_NODE_ID : nodeList[i - 1].id;
    nodes.push({
      id: nodeId,
      type: item.flowType,
      position: { x: 0, y },
      data: item.flowType === 'branch'
        ? {
            ...item.data,
            title: 'Based on conditions',
            subtitle: 'Build condition-specific flows',
          }
        : item.data?.subtype === 'Schedule-based'
          ? {
              ...item.data,
              headerLabel: 'Schedule-based trigger',
              title: nodeDetails[nodeId]?.triggerName ?? item.data.title,
              subtitle: nodeDetails[nodeId]?.description ?? item.data.subtitle,
            }
          : item.flowType === 'procedures'
            ? {
                ...item.data,
                procedureItems: (nodeDetails[nodeId]?.procedureIds || []).map((pid) => {
                  const p = getProcedureById(pid);
                  return { id: pid, name: p ? p.name : pid };
                }),
              }
            : { ...item.data },
    });
    edges.push({
      id: `e-${prevId}-${nodeId}`,
      source: prevId,
      target: nodeId,
      type: 'addButton',
    });

    if (item.flowType === 'branch') {
      const branches = nodeDetails[nodeId]?.branches || [];
      const spacing = 480;
      const startX = -((branches.length - 1) * spacing) / 2;
      const branchChipY = y + 150;
      const branchNodeStartY = y + 260;
      let maxBranchNodes = 0;
      branches.forEach((branch, bi) => {
        const branchX = startX + bi * spacing;
        const branchNodes = nodeDetails[branch.id]?.nodes || [];
        maxBranchNodes = Math.max(maxBranchNodes, branchNodes.length);
        nodes.push({
          id: branch.id,
          type: 'branchPath',
          position: { x: branchX, y: branchChipY },
          data: { label: branch.name, parentId: nodeId, isFallback: !!branch.isFallback },
        });
        edges.push({
          id: `e-${nodeId}-${branch.id}`,
          source: nodeId,
          target: branch.id,
          type: 'branchFan',
        });

        let previousId = branch.id;
        branchNodes.forEach((childNode, childIndex) => {
          nodes.push({
            id: childNode.id,
            type: childNode.flowType,
            position: { x: branchX, y: branchNodeStartY + childIndex * 250 },
            data: { ...childNode.data, stepNumber: childNode.data?.stepNumber ?? null },
          });
          edges.push({
            id: `e-${previousId}-${childNode.id}`,
            source: previousId,
            target: childNode.id,
            type: 'addButton',
            data: {
              branchPathId: branch.id,
              afterNodeId: previousId === branch.id ? null : previousId,
            },
          });
          previousId = childNode.id;
        });

        const branchEndId = `${branch.id}-end`;
        nodes.push({
          id: branchEndId,
          type: 'branchEnd',
          position: { x: branchX, y: branchNodeStartY + branchNodes.length * 250 },
          data: { parentId: branch.id },
        });
        edges.push({
          id: `e-${previousId}-${branchEndId}`,
          source: previousId,
          target: branchEndId,
          type: 'addButton',
          data: {
            branchPathId: branch.id,
            afterNodeId: previousId === branch.id ? null : previousId,
            viewOnly: !!branch.isFallback,
          },
        });
      });
      y += 150 + (maxBranchNodes + 1) * 250;
    }

    y += 250;
  });

  const lastId = nodeList.length > 0 ? nodeList[nodeList.length - 1].id : START_NODE_ID;
  if (!nodeList.length || nodeList[nodeList.length - 1].flowType !== 'branch') {
    nodes.push({
      id: END_NODE_ID,
      type: 'end',
      position: { x: 0, y },
      data: {},
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
  viewOnly = false,
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
  // Tracks which procedure is open in the detail view (UI-only, not persisted)
  const [activeProcedureId, setActiveProcedureId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
  const startData = { title: startAgentName, subtitle: 'All locations' };
  const { nodes: rawNodes, edges } = buildFlow(nodeList, startData, nodeDetails);

  const nodes = rawNodes.map((n) => {
    if (n.id === START_NODE_ID || n.id === END_NODE_ID) return n;
    if (n.type === 'branchPath') {
      return { ...n, data: { ...n.data, onDelete: () => handleDeleteBranchPath(n.id) } };
    }
    if (n.type === 'branchEnd') return n;
    const nodeIdx = nodeList.findIndex((nl) => nl.id === n.id);
    const extra = {
      onDelete: () => handleDeleteNode(n.id),
      onMoveUp: () => handleMoveNode(n.id, 'up'),
      onMoveDown: () => handleMoveNode(n.id, 'down'),
      canMoveUp: !viewOnly && nodeIdx > 0,
      canMoveDown: !viewOnly && nodeIdx !== -1 && nodeIdx < nodeList.length - 1,
    };
    if (n.type === 'branch') extra.onAddBranch = () => handleAddBranchPath(n.id);
    if (n.type === 'procedures' && !viewOnly) {
      extra.onDropProcedure = (procedureId) => {
        setNodeDetails((prev) => {
          const existing = prev[n.id]?.procedureIds || [];
          if (existing.includes(procedureId)) return prev;
          return { ...prev, [n.id]: { ...(prev[n.id] || {}), procedureIds: [...existing, procedureId] } };
        });
      };
    }
    return { ...n, data: { ...n.data, ...extra } };
  });

  const branchChildNodes = Object.values(nodeDetails).flatMap((details) => details?.nodes || []);
  const selectedNode = nodeList.find((n) => n.id === selectedNodeId) ||
    branchChildNodes.find((n) => n.id === selectedNodeId);

  const handleNodesReorder = useCallback((newIdOrder) => {
    setNodeList((prev) => {
      const byId = Object.fromEntries(prev.map((n) => [n.id, n]));
      const reordered = newIdOrder.map((id) => byId[id]).filter(Boolean);
      return reordered.map((n, i) => ({ ...n, data: { ...n.data, stepNumber: i + 1 } }));
    });
  }, []);

  const handleDropNode = useCallback(({ type, label, description, afterNodeId, branchPathId, position }) => {
    const id = nextId();
    const newNode = makeNodeConfig(id, type, label, description);
    const details = makeNodeDetails(type, label);

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
      return;
    }

    // When dropped freely on the canvas (not via an edge button), use the drop Y coordinate
    // to find the correct insertion point rather than always appending at the end.
    let dropInsertIdx = null;
    if (position && !afterNodeId) {
      const currentNodeList = latestRef.current.nodeList || [];
      const currentNodeDetails = latestRef.current.nodeDetails || {};
      let y = 150; // first content node starts here (start node is at y=0, +150 gap)
      for (let i = 0; i < currentNodeList.length; i++) {
        if (position.y < y) {
          dropInsertIdx = i;
          break;
        }
        const item = currentNodeList[i];
        if (item.flowType === 'branch') {
          const branches = currentNodeDetails[item.id]?.branches || [];
          let maxBranchNodes = 0;
          branches.forEach((b) => {
            const bNodes = currentNodeDetails[b.id]?.nodes || [];
            maxBranchNodes = Math.max(maxBranchNodes, bNodes.length);
          });
          y += 150 + (maxBranchNodes + 1) * 250;
        }
        y += 250;
      }
      if (dropInsertIdx === null) dropInsertIdx = currentNodeList.length;
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

    setNodeDetails((prev) => ({
      ...prev,
      [id]: details,
      ...extraDetails,
    }));
  }, []);

  const handleNodeClick = useCallback((node) => {
    if (node.type === 'end' || node.type === 'branchEnd') return;
    setSelectedNodeId(node.id);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedNodeId(null);
    setActiveProcedureId(null);
  }, []);

  const currentDetails = selectedNodeId ? (nodeDetails[selectedNodeId] || {}) : {};

  /* ─── Shared onFieldChange for the active node ─── */
  const activeFieldChange = useCallback(
    (field, value) => handleNodeFieldChange(selectedNodeId, field, value),
    [selectedNodeId, handleNodeFieldChange]
  );

  const renderRHSPanel = () => {
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
          onPreview={() => {}}
          onExpand={() => {}}
          triggerName={currentDetails.triggerName ?? ''}
          description={currentDetails.description ?? ''}
          onFieldChange={activeFieldChange}
          frequencyOptions={['Hourly', 'Daily', 'Weekly', 'Monthly']}
          dayOptions={['1 day', '2 days', '3 days', '7 days', '14 days', '30 days']}
          timeOptions={['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM']}
          defaultFrequency={currentDetails.frequency || 'Daily'}
          defaultDay={currentDetails.day || '7 days'}
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

    if (flowType === 'delay') {
      return (
        <RHS
          variant="delay"
          title="Delay"
          viewOnly={viewOnly}
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
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (flowType === 'procedures') {
      if (activeProcedureId) {
        const proc = getProcedureById(activeProcedureId);
        const overrides = currentDetails.procedureOverrides?.[activeProcedureId] || {};
        const mergedProc = proc ? { ...proc, ...overrides } : { id: activeProcedureId, name: activeProcedureId, ...overrides };
        return (
          <RHS
            key={`proc-detail-${activeProcedureId}`}
            variant="procedureDetail"
            title={mergedProc.name}
            viewOnly={viewOnly}
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
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
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
        bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
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
      <Button
        theme="primary"
        label={isTemplateMode ? 'Save template' : 'Publish'}
        onClick={isTemplateMode ? handleSaveTemplate : handlePublish}
      />
      <div className="ab-header-more" ref={headerMenuRef}>
        <button
          className="ab-header-more-btn"
          type="button"
          onClick={() => setHeaderMenuOpen((m) => !m)}
          title="More options"
        >
          <span className="material-symbols-outlined">more_vert</span>
        </button>
        {headerMenuOpen && (
          <div className="ab-header-menu">
            {isTemplateMode && (
              <button
                className="ab-header-menu-item"
                type="button"
                onClick={() => { setHeaderMenuOpen(false); handleSaveAndPublish(); }}
              >
                <span className="material-symbols-outlined">rocket_launch</span>
                Save and publish
              </button>
            )}
            <button
              className="ab-header-menu-item"
              type="button"
              onClick={handleShare}
            >
              <span className="material-symbols-outlined">share</span>
              Share
            </button>
            <button
              className="ab-header-menu-item"
              type="button"
              onClick={() => { setHeaderMenuOpen(false); handleExport(); }}
            >
              <span className="material-symbols-outlined">download</span>
              Download
            </button>
            <div className="ab-header-menu-divider" />
            <button
              className="ab-header-menu-item"
              type="button"
              onClick={() => { setHeaderMenuOpen(false); importInputRef.current?.click(); }}
            >
              <span className="material-symbols-outlined">upload_file</span>
              Import from JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const editableName = viewOnly ? agentName : (
    <input
      className="ab-name-input"
      value={agentName}
      placeholder="Untitled agent"
      onChange={(e) => {
        const val = e.target.value;
        setNodeDetails((prev) => ({
          ...prev,
          [START_NODE_ID]: { ...(prev[START_NODE_ID] || {}), agentName: val },
        }));
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );

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
    <div className="faq-ab-embedded" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#fff' }}>
      {/* ─── Embedded builder header ─── */}
      <div className="faq-ab-header" style={{
        height: 52,
        borderBottom: '1px solid #e9e9eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        gap: 8,
      }}>
        {/* Back button */}
        {onClose && (
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: '#555' }}
            title="Back to agents"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: 1 }}>arrow_back</span>
          </button>
        )}
        {/* Agent name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editableName}
        </div>
        {/* Header actions */}
        {headerActions}
      </div>

      {/* ─── Builder body ─── */}
      <div className="agent-builder-wrapper" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'transparent' }}>
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
          <div className="agent-builder__lhs">
            <LHSDrawer
              defaultTab="Create manually"
              triggerOpen
              tasksOpen={false}
              controlsOpen={false}
              viewOnly={viewOnly}
              usedProcedureIds={
                Object.values(nodeDetails).flatMap((d) => d?.procedureIds || [])
              }
            />
          </div>

          <div className={`agent-builder__canvas${drawerOpen ? ' agent-builder__canvas--with-rhs' : ''}`}>
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              onNodeClick={handleNodeClick}
              onDropNode={viewOnly ? undefined : handleDropNode}
              onNodesReorder={viewOnly ? undefined : handleNodesReorder}
              selectedNodeId={selectedNodeId}
              orientation="vertical"
              viewOnly={viewOnly}
            />
          </div>

          {drawerOpen && (
            <div key={selectedNodeId} className="agent-builder__rhs">
              <RHSErrorBoundary key={selectedNodeId}>
                {renderRHSPanel()}
              </RHSErrorBoundary>
            </div>
          )}
        </div>
      </div>

      {/* ─── Share modal ─── */}
      {shareModalOpen && (
        <ShareModal
          shareUrl={agentSlug && agentModuleSlug
            ? `${window.location.origin}/view/${agentModuleSlug}/${agentSlug}`
            : `${window.location.origin}/view/${agentId}`}
          onClose={() => setShareModalOpen(false)}
        />
      )}

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
