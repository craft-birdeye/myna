import React, { useEffect, useState } from 'react';
import { FormInput, TextArea } from '../../../elemental-stubs';
import { InfoTooltip } from '../../../../components/InfoTooltip/InfoTooltip';
import { VariableIcon } from '../../../Molecules/Inputs/PromptToolbarIcons.jsx';
import VariableChip from '../../../Molecules/Inputs/VariableChip/VariableChip';
import { subscribeToCustomTools } from '../../../services/agentService';
import { Checkbox } from '../../Drawers/shared/DrawerShared';
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
    fieldValue: '',
    ...overrides,
  };
}

export function defaultUpdateStateDetails() {
  return {
    taskName: DEFAULT_TASK_NAME,
    description: 'Update dynamic variables when this step runs',
    selectedTools: [UPDATE_STATE_TOOL_ID],
    stateUpdates: [],
    fieldsGlobal: false,
  };
}

/**
 * Tool card + Select fields — shared by the Update state Action RHS and
 * Procedures Option 2 Advanced tab.
 */
export function UpdateStateToolDetails({
  stateUpdates = [],
  onStateUpdatesChange,
  fieldsGlobal = false,
  onFieldsGlobalChange,
  toolName = 'Update state',
  viewOnly = false,
  onRemoveTool,
  /** When false, only Select fields is shown (drawer already has Description). */
  showToolCard = true,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [tool, setTool] = useState(FALLBACK_TOOL);

  useEffect(() => {
    const unsub = subscribeToCustomTools((tools) => {
      const found = tools.find((t) => t.id === UPDATE_STATE_TOOL_ID);
      if (found) setTool(found);
    });
    return unsub;
  }, []);

  const persistUpdates = (next) => {
    onStateUpdatesChange?.(next);
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

  const handleModalAdd = ({ fieldName, fieldType, description: instructions, fieldValue }) => {
    if (editingUpdate) {
      persistUpdates(stateUpdates.map((u) => (
        u.id === editingUpdate.id
          ? {
            ...u,
            variable: fieldName,
            fieldType,
            instructions: instructions || '',
            fieldValue: fieldValue || '',
          }
          : u
      )));
      return;
    }
    persistUpdates([
      ...stateUpdates,
      createEmptyStateUpdate({
        variable: fieldName,
        fieldType,
        instructions: instructions || '',
        fieldValue: fieldValue || '',
      }),
    ]);
  };

  const handleRemove = (id) => {
    if (viewOnly) return;
    persistUpdates(stateUpdates.filter((u) => u.id !== id));
  };

  return (
    <>
      {showToolCard && (
      <div className={styles.toolSelectField}>
        <span className={styles.toolLabel}>Tool</span>
        <div className={styles.toolCard}>
          <div className={styles.toolRow}>
            <div className={styles.toolRowMain}>
              <div className={styles.toolIconWrap}>
                <VariableIcon />
              </div>
              <span className={styles.toolName}>{tool.name || toolName}</span>
            </div>
            {!viewOnly && onRemoveTool && (
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Remove tool"
                onClick={onRemoveTool}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
        </div>
      </div>
      )}

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
          <div className={`${styles.chipContainer} ${styles.chipContainerFilled}`}>
            {stateUpdates.map((update) => (
              <VariableChip
                key={update.id}
                value={update.variable}
                type="variable"
                onSwatchClick={viewOnly ? undefined : () => openEditModal(update)}
                onDelete={viewOnly ? undefined : () => handleRemove(update.id)}
              />
            ))}
          </div>
        )}

        {!viewOnly && (
          <div className={styles.globalCheckWrap}>
            <Checkbox
              checked={Boolean(fieldsGlobal)}
              onChange={(next) => onFieldsGlobalChange?.(next)}
              label="Make these fields globally available"
            />
          </div>
        )}
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
  const [fieldsGlobal, setFieldsGlobal] = useState(Boolean(initialValues.fieldsGlobal));
  const [activeTab, setActiveTab] = useState('toolDetails');

  useEffect(() => {
    setTaskName(initialValues.taskName ?? defaults.taskName);
    setDescription(initialValues.description ?? defaults.description);
    setFieldsGlobal(Boolean(initialValues.fieldsGlobal));
    if (Array.isArray(initialValues.stateUpdates) && initialValues.stateUpdates.length) {
      setStateUpdates(initialValues.stateUpdates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when parent node details swap
  }, [initialValues]);

  const persistUpdates = (next) => {
    setStateUpdates(next);
    onFieldChange?.('stateUpdates', next);
  };

  const handleFieldsGlobal = (next) => {
    setFieldsGlobal(next);
    onFieldChange?.('fieldsGlobal', next);
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
      <UpdateStateToolDetails
        stateUpdates={stateUpdates}
        onStateUpdatesChange={persistUpdates}
        fieldsGlobal={fieldsGlobal}
        onFieldsGlobalChange={handleFieldsGlobal}
        viewOnly={viewOnly}
      />
    </div>
  );

  return (
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
  );
}
