import React, { useEffect, useState } from 'react';
import { FormInput, TextArea } from '../../../elemental-stubs';
import { InfoTooltip } from '../../../../components/InfoTooltip/InfoTooltip';
import { VariableIcon } from '../../../Molecules/Inputs/PromptToolbarIcons.jsx';
import { subscribeToCustomTools } from '../../../services/agentService';
import AddStateFieldModal from '../../Modals/AddStateFieldModal/AddStateFieldModal.jsx';
import styles from './UpdateStateTaskBody.module.css';

const DEFAULT_TASK_NAME = 'Update state';
const UPDATE_STATE_TOOL_ID = 'update-state';
const SELECT_FIELDS_INFO =
  'Select fields to define how their state should be updated. Agent uses these dynamic fields during the session.';

const TABS = [
  { id: 'basic', label: 'Basic' },
  { id: 'toolDetails', label: 'Tool details' },
];

const FALLBACK_TOOL = {
  id: UPDATE_STATE_TOOL_ID,
  name: 'Update state',
  icon: 'data_object',
};

function nextUpdateId() {
  return `su-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyStateUpdate(overrides = {}) {
  return {
    id: nextUpdateId(),
    variable: '',
    fieldType: '',
    instructions: '',
    ...overrides,
  };
}

export function defaultUpdateStateDetails() {
  return {
    taskName: DEFAULT_TASK_NAME,
    description: 'Update dynamic variables when this step runs',
    selectedTools: [UPDATE_STATE_TOOL_ID],
    stateUpdates: [],
  };
}

export default function UpdateStateTaskBody({
  initialValues = {},
  onFieldChange,
  viewOnly = false,
}) {
  const defaults = defaultUpdateStateDetails();
  const [taskName, setTaskName] = useState(initialValues.taskName ?? defaults.taskName);
  const [description, setDescription] = useState(initialValues.description ?? defaults.description);
  const [stateUpdates, setStateUpdates] = useState(
    () => (Array.isArray(initialValues.stateUpdates) && initialValues.stateUpdates.length
      ? initialValues.stateUpdates
      : defaults.stateUpdates),
  );
  const [activeTab, setActiveTab] = useState('toolDetails');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [tool, setTool] = useState(FALLBACK_TOOL);

  useEffect(() => {
    setTaskName(initialValues.taskName ?? defaults.taskName);
    setDescription(initialValues.description ?? defaults.description);
    if (Array.isArray(initialValues.stateUpdates) && initialValues.stateUpdates.length) {
      setStateUpdates(initialValues.stateUpdates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when parent node details swap
  }, [initialValues]);

  useEffect(() => {
    const unsub = subscribeToCustomTools((tools) => {
      const found = tools.find((t) => t.id === UPDATE_STATE_TOOL_ID);
      if (found) setTool(found);
    });
    return unsub;
  }, []);

  const persistUpdates = (next) => {
    setStateUpdates(next);
    onFieldChange?.('stateUpdates', next);
  };

  const handleTaskName = (e) => {
    const val = e.target.value;
    setTaskName(val);
    onFieldChange?.('taskName', val);
  };

  const handleDescription = (e) => {
    const val = e.target.value;
    setDescription(val);
    onFieldChange?.('description', val);
  };

  const openAddModal = () => {
    if (viewOnly) return;
    setEditingUpdate(null);
    setModalOpen(true);
  };

  const openEditModal = (update) => {
    if (viewOnly) return;
    setEditingUpdate(update);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUpdate(null);
  };

  const handleModalAdd = ({ fieldName, fieldType, description: instructions }) => {
    if (editingUpdate) {
      persistUpdates(stateUpdates.map((u) => (
        u.id === editingUpdate.id
          ? { ...u, variable: fieldName, fieldType, instructions }
          : u
      )));
      return;
    }
    persistUpdates([
      ...stateUpdates,
      createEmptyStateUpdate({
        variable: fieldName,
        fieldType,
        instructions,
      }),
    ]);
  };

  const handleRemove = (id) => {
    if (viewOnly) return;
    persistUpdates(stateUpdates.filter((u) => u.id !== id));
  };

  const onDragStart = (index) => {
    if (viewOnly) return;
    setDragIndex(index);
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex == null || dragIndex === index) return;
    const next = [...stateUpdates];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(index);
    persistUpdates(next);
  };

  const onDragEnd = () => setDragIndex(null);

  const basicTab = (
    <div className={styles.tabContent}>
      <FormInput
        name="taskName"
        type="text"
        label="Tool name"
        placeholder="Enter name"
        value={taskName}
        onChange={handleTaskName}
        required
        readOnly={viewOnly}
      />
      <TextArea
        name="description"
        label="Description"
        placeholder="Enter"
        value={description}
        onChange={handleDescription}
        required
        noFloatingLabel
        readOnly={viewOnly}
      />
    </div>
  );

  const toolDetailsTab = (
    <div className={styles.tabContent}>
      <div className={styles.toolSelectField}>
        <span className={styles.toolLabel}>Tool</span>
        <div className={styles.toolCard}>
          <div className={styles.toolRow}>
            <div className={styles.toolRowMain}>
              <div className={styles.toolIconWrap}>
                <VariableIcon />
              </div>
              <span className={styles.toolName}>{tool.name || 'Update state'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.stateSection}>
        <div className={styles.labelRow}>
          <span className={styles.label}>Select fields</span>
          <InfoTooltip text={SELECT_FIELDS_INFO} variant="detail" />
          {stateUpdates.length > 0 && !viewOnly && (
            <button type="button" className={styles.fieldAddBtn} onClick={openAddModal}>
              <span className="material-symbols-outlined">add_circle</span>
              <span className={styles.fieldAddBtnLabel}>Add</span>
            </button>
          )}
        </div>

        {stateUpdates.length === 0 ? (
          <div className={`${styles.chipContainer} ${styles.chipContainerEmpty}`}>
            {!viewOnly && (
              <button type="button" className={styles.addBtn} onClick={openAddModal}>
                <span className="material-symbols-outlined">add_circle</span>
                <span className={styles.addBtnLabel}>Add</span>
              </button>
            )}
          </div>
        ) : (
          <div className={styles.updateList}>
            {stateUpdates.map((update, index) => (
              <div
                key={update.id}
                className={styles.updateCard}
                draggable={!viewOnly}
                onDragStart={() => onDragStart(index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragEnd={onDragEnd}
              >
                <button
                  type="button"
                  className={styles.updateSummary}
                  onClick={() => openEditModal(update)}
                >
                  <span className={styles.braceGlyph} aria-hidden>{'{}'}</span>
                  <span className={styles.summaryVar}>{update.variable}</span>
                </button>
                <div className={styles.updateActions}>
                  {!viewOnly && (
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label="Delete update"
                      onClick={() => handleRemove(update.id)}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  )}
                  <span className={styles.dragHandle} aria-hidden>
                    <span className="material-symbols-outlined">drag_indicator</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className={styles.tabbedContainer}>
        <div className={styles.tabTrack} role="tablist" aria-label="Action sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              className={`${styles.tabButton}${activeTab === tab.id ? ` ${styles.tabButtonActive}` : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div role="tabpanel">
          {activeTab === 'toolDetails' ? toolDetailsTab : basicTab}
        </div>
      </div>

      {modalOpen && (
        <AddStateFieldModal
          onClose={closeModal}
          onAdd={handleModalAdd}
          initialValues={editingUpdate}
        />
      )}
    </>
  );
}
