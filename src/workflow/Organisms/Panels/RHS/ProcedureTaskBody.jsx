import React, { useState, useEffect, useRef } from 'react';
import {
  getProcedureById,
  resolveProcedurePanelText,
  isCustomProcedureId,
} from '../../../services/procedureService';
import { ProcedureListCard } from '../../../../components/ProcedureListCard/ProcedureListCard';
import SystemPromptInput from '../../../Molecules/Inputs/SystemPromptInput/SystemPromptInput.jsx';
import { useOptionalAgentSystemPromptStore } from '../../../../data/AgentSystemPromptStoreContext';
import {
  UpdateStateToolDetails,
} from './UpdateStateTaskBody.jsx';
import updateStyles from './UpdateStateTaskBody.module.css';
import styles from './ProcedureTaskBody.module.css';

const UPDATE_STATE_TOOL_ID = 'update-state';

const OPTION2_TABS = [
  { id: 'basic', label: 'Basic' },
  { id: 'advanced', label: 'Advanced settings' },
];

const ADDABLE_TOOLS = [
  {
    id: UPDATE_STATE_TOOL_ID,
    name: 'Update state',
    description: 'Update dynamic variables when this step runs',
  },
];

export default function ProcedureTaskBody({
  initialValues = {},
  onFieldChange,
  onSelectProcedure,
  viewOnly = false,
  product = 'automotive',
  /** Exploration: option1 = flat list; option2 = Basic / Advanced tabs. */
  layoutOption = 'option1',
}) {
  const [procedureIds, setProcedureIds] = useState(initialValues.procedureIds ?? []);
  const [selectedTools, setSelectedTools] = useState(initialValues.selectedTools ?? []);
  const [stateUpdates, setStateUpdates] = useState(
    () => (Array.isArray(initialValues.stateUpdates) ? initialValues.stateUpdates : []),
  );
  const [activeTab, setActiveTab] = useState('basic');
  const [addToolMenuOpen, setAddToolMenuOpen] = useState(false);
  const addToolMenuRef = useRef(null);
  const overrides = initialValues.procedureOverrides || {};
  const promptStore = useOptionalAgentSystemPromptStore();
  const isOption2 = layoutOption === 'option2';
  const hasUpdateState = selectedTools.includes(UPDATE_STATE_TOOL_ID);

  useEffect(() => {
    setProcedureIds(initialValues.procedureIds ?? []);
    setSelectedTools(initialValues.selectedTools ?? []);
    setStateUpdates(Array.isArray(initialValues.stateUpdates) ? initialValues.stateUpdates : []);
  }, [initialValues.procedureIds, initialValues.selectedTools, initialValues.stateUpdates]);

  useEffect(() => {
    if (layoutOption === 'option1') setActiveTab('basic');
  }, [layoutOption]);

  useEffect(() => {
    if (!addToolMenuOpen) return undefined;
    const handler = (e) => {
      if (addToolMenuRef.current && !addToolMenuRef.current.contains(e.target)) {
        setAddToolMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [addToolMenuOpen]);

  const procedures = procedureIds.map((id) => {
    const found = getProcedureById(id);
    if (found) return found;
    if (isCustomProcedureId(id)) return { id, name: 'Custom', whenToUse: '' };
    return null;
  }).filter(Boolean);

  const handleRemove = (id) => {
    const next = procedureIds.filter((pid) => pid !== id);
    setProcedureIds(next);
    onFieldChange?.('procedureIds', next);
  };

  const handleDuplicate = (id) => {
    const next = [...procedureIds, id];
    setProcedureIds(next);
    onFieldChange?.('procedureIds', next);
  };

  const handleAddTool = (toolId) => {
    if (viewOnly || selectedTools.includes(toolId)) return;
    const next = [...selectedTools, toolId];
    setSelectedTools(next);
    onFieldChange?.('selectedTools', next);
    setAddToolMenuOpen(false);
  };

  const handleRemoveTool = (toolId) => {
    if (viewOnly) return;
    const next = selectedTools.filter((id) => id !== toolId);
    setSelectedTools(next);
    onFieldChange?.('selectedTools', next);
    if (toolId === UPDATE_STATE_TOOL_ID) {
      setStateUpdates([]);
      onFieldChange?.('stateUpdates', []);
    }
  };

  const handleStateUpdatesChange = (next) => {
    setStateUpdates(next);
    onFieldChange?.('stateUpdates', next);
  };

  const instructionsBlock = promptStore ? (
    <div className={styles.systemPrompt}>
      {viewOnly ? (
        <>
          <div className={styles.systemPromptLabelRow}>
            <span className={styles.systemPromptLabel}>Instructions</span>
          </div>
          <textarea
            className={styles.systemPromptReadOnly}
            value={promptStore.systemPrompt}
            readOnly
            tabIndex={-1}
            aria-readonly="true"
            rows={8}
          />
        </>
      ) : (
        <SystemPromptInput
          value={promptStore.systemPrompt}
          onChange={promptStore.setSystemPrompt}
          tall
          showTriggerFields={false}
          label="Instructions"
          placeholder="Enter instructions on how to run these procedures"
        />
      )}
    </div>
  ) : null;

  const procedureList = (
    <div className={styles.list}>
      {procedures.map((p) => {
        const { name, whenToUse } = resolveProcedurePanelText(p, overrides, product);
        return (
          <ProcedureListCard
            key={p.id}
            title={name}
            description={whenToUse}
            onClick={() => onSelectProcedure?.(p.id)}
            onEdit={!viewOnly ? () => onSelectProcedure?.(p.id) : undefined}
            onDuplicate={!viewOnly ? () => handleDuplicate(p.id) : undefined}
            onRemove={!viewOnly ? () => handleRemove(p.id) : undefined}
          />
        );
      })}
    </div>
  );

  const basicContent = (
    <>
      {instructionsBlock}
      {procedureList}
    </>
  );

  const availableTools = ADDABLE_TOOLS.filter((t) => !selectedTools.includes(t.id));

  const advancedContent = (
    <div className={styles.advancedBody}>
      {hasUpdateState ? (
        <UpdateStateToolDetails
          stateUpdates={stateUpdates}
          onStateUpdatesChange={handleStateUpdatesChange}
          viewOnly={viewOnly}
          onRemoveTool={() => handleRemoveTool(UPDATE_STATE_TOOL_ID)}
        />
      ) : (
        <div className={updateStyles.toolSelectField}>
          <span className={updateStyles.toolLabel}>Tool</span>
          <div
            className={`${updateStyles.chipContainer} ${updateStyles.chipContainerEmpty}`}
            ref={addToolMenuRef}
          >
            {!viewOnly && (
              <>
                <button
                  type="button"
                  className={updateStyles.addBtn}
                  onClick={() => setAddToolMenuOpen((v) => !v)}
                  disabled={availableTools.length === 0}
                  aria-haspopup="listbox"
                  aria-expanded={addToolMenuOpen}
                >
                  <span className="material-symbols-outlined">add_circle</span>
                  <span className={updateStyles.addBtnLabel}>Add tool</span>
                </button>
                {addToolMenuOpen && availableTools.length > 0 && (
                  <div className={styles.addToolMenu} role="listbox">
                    {availableTools.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        className={styles.addToolMenuItem}
                        role="option"
                        onClick={() => handleAddTool(tool.id)}
                      >
                        <span className={`material-symbols-outlined ${styles.addToolMenuIcon}`}>
                          data_object
                        </span>
                        <span className={styles.addToolMenuText}>
                          <span className={styles.addToolMenuName}>{tool.name}</span>
                          <span className={styles.addToolMenuDesc}>{tool.description}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (!isOption2) {
    return (
      <div
        className={styles.body}
        style={viewOnly ? { pointerEvents: 'auto' } : undefined}
      >
        {basicContent}
      </div>
    );
  }

  return (
    <div
      className={styles.body}
      style={viewOnly ? { pointerEvents: 'auto' } : undefined}
    >
      <div className={updateStyles.tabbedContainer}>
        <div className={updateStyles.tabTrack} role="tablist" aria-label="Procedure sections">
          {OPTION2_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              className={`${updateStyles.tabButton}${activeTab === tab.id ? ` ${updateStyles.tabButtonActive}` : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={updateStyles.tabContent} role="tabpanel">
          {activeTab === 'advanced' ? advancedContent : basicContent}
        </div>
      </div>
    </div>
  );
}
