import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FormInput, TextArea } from '../../../elemental-stubs';
import { subscribeToCustomTools, resolveToolForViewer } from '../../../services/agentService';
import {
  HandleResponseForm,
  isHandleResponseConfigComplete,
} from '../../Drawers/HandleResponseDrawer/HandleResponseDrawer';
import { ToolViewerContent } from '../../Drawers/CustomToolViewer/CustomToolViewer';
import { Tooltip } from '../../../../components/Tooltip/Tooltip';
import birdeyeLogoUrl from '../../../../assets/birdeye-logo.svg';
import styles from './EntityTaskBody.module.css';

export default function EntityTaskBody({
  initialValues = {},
  onFieldChange,
  onOpenTool,
  onSwapTool,
  /**
   * True once this task has been saved with a tool still missing mandatory config. Until
   * then an unconfigured tool shows no error — just the Configure CTA — so a freshly
   * dropped tool never looks broken before the user has had a chance to set it up.
   */
  showToolErrors = false,
  viewOnly = false,
  /** Exploration Option 2: Basic / Tool details stepper accordion. */
  option2Stepper = false,
  /** Persisted per-tool field values (CustomToolViewer snapshot keyed by tool id). */
  toolFieldValues = {},
  onToolFieldValuesChange,
}) {
  const [taskName, setTaskName] = useState(initialValues.taskName ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [selectedTools, setSelectedTools] = useState(initialValues.selectedTools ?? []);
  const [allTools, setAllTools] = useState([]);
  const [openSteps, setOpenSteps] = useState({ 1: false, 2: true });

  useEffect(() => {
    const unsub = subscribeToCustomTools((tools) => setAllTools(tools));
    return unsub;
  }, []);

  // Re-sync from the parent when the underlying node data changes externally — e.g. a tool
  // drawer (Reminder tool, Initiate voice call) saving its own edits, which regenerates this
  // node's description without going through this panel's own onChange handlers.
  useEffect(() => {
    setTaskName(initialValues.taskName ?? '');
    setDescription(initialValues.description ?? '');
    setSelectedTools(initialValues.selectedTools ?? []);
  }, [initialValues]);

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

  const displayedTools = allTools.filter((t) => selectedTools.includes(t.id));
  const viewerTools = useMemo(
    () => selectedTools.map((id) => resolveToolForViewer(id)).filter(Boolean),
    [selectedTools],
  );

  const handleInlineToolValues = useCallback((toolId, values) => {
    onToolFieldValuesChange?.(toolId, values);
  }, [onToolFieldValuesChange]);

  /**
   * Tools with their own mandatory config. Unconfigured → the row offers Configure instead
   * of edit/swap; the error icon only joins once `showToolErrors` says the task was saved
   * in that state. `handle-response` is the only such tool today.
   */
  const toolNeedsConfig = (toolId) =>
    toolId === 'handle-response' && !isHandleResponseConfigComplete(initialValues.handleResponse);

  const toggleStep = (id) =>
    setOpenSteps((prev) => ({ ...prev, [id]: !prev[id] }));

  const taskNameField = (
    <FormInput
      name="taskName"
      type="text"
      label="Action name"
      placeholder="Enter name"
      value={taskName}
      onChange={handleTaskName}
      required
    />
  );

  const descriptionField = (
    <TextArea
      name="description"
      label="Description"
      placeholder="Enter description"
      value={description}
      onChange={handleDescription}
      required
      noFloatingLabel
    />
  );

  const toolsSection = (
    <div className={styles.toolsSection}>
      <span className={styles.sectionLabelText}>Tool</span>

      {displayedTools.length > 0 && (
        <>
          <div className={styles.toolCard}>
            {displayedTools.map((tool) => (
              <div
                key={tool.id}
                className={styles.toolRow}
                onClick={() => {
                  if (option2Stepper) return;
                  onOpenTool?.(tool.id);
                }}
                style={{ cursor: option2Stepper ? 'default' : (onOpenTool ? 'pointer' : 'default') }}
              >
                <div className={styles.toolRowMain}>
                  <div
                    className={`${styles.toolIconWrap}${tool.isBirdeye ? ` ${styles.toolIconWrapBirdeye}` : ''}`}
                  >
                    {tool.isBirdeye ? (
                      <img
                        src={birdeyeLogoUrl}
                        alt=""
                        className={styles.toolIconBirdeye}
                      />
                    ) : tool.icon ? (
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, color: '#555', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                      >
                        {tool.icon}
                      </span>
                    ) : tool.iconDataUrl ? (
                      <img src={tool.iconDataUrl} alt={tool.name} className={styles.toolIconImg} />
                    ) : (
                      <span className={`material-symbols-outlined ${styles.toolIconFallback}`}>build</span>
                    )}
                  </div>
                  <span className={styles.toolName}>{tool.name}</span>
                  {toolNeedsConfig(tool.id) && showToolErrors && (
                    <Tooltip content="Missing mandatory fields" variant="brief" side="top">
                      <span className={styles.toolErrorIcon} role="img" aria-label="Missing mandatory fields">
                        <span className="material-symbols-outlined" aria-hidden>error</span>
                      </span>
                    </Tooltip>
                  )}
                </div>
                <div className={styles.toolRowActions}>
                  {viewOnly ? (
                    <span
                      role="button"
                      tabIndex={0}
                      className={styles.toolViewBtn}
                      onClick={(e) => { e.stopPropagation(); onOpenTool?.(tool.id); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          onOpenTool?.(tool.id);
                        }
                      }}
                    >
                      View
                    </span>
                  ) : toolNeedsConfig(tool.id) && !option2Stepper ? (
                    <button
                      type="button"
                      className={styles.toolConfigureBtn}
                      onClick={(e) => { e.stopPropagation(); onOpenTool?.(tool.id); }}
                    >
                      Configure
                    </button>
                  ) : (
                    <>
                      {!option2Stepper && (
                        <button
                          type="button"
                          className={styles.toolActionBtn}
                          onClick={(e) => { e.stopPropagation(); onOpenTool?.(tool.id); }}
                          title="Edit tool configuration"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
                            edit
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.toolActionBtn}
                        onClick={(e) => { e.stopPropagation(); onSwapTool?.(); }}
                        title="Replace tool"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
                          swap_horiz
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {option2Stepper && selectedTools.includes('handle-response') && (
            <div className={styles.inlineToolConfig}>
              <HandleResponseForm
                key="hr-inline"
                value={initialValues.handleResponse || {}}
                live
                embedded
                onChange={(config) => onFieldChange?.('handleResponse', config)}
                namePrefix="handle-response-inline"
                fieldPickerPlacement="dock"
                fieldPickerZIndex={120}
              />
            </div>
          )}
          {option2Stepper && viewerTools
            .filter((viewerTool) => viewerTool.id !== 'handle-response')
            .map((viewerTool) => (
            <div key={viewerTool.id} className={styles.inlineToolConfig}>
              <ToolViewerContent
                tool={viewerTool}
                embedded
                initialValues={toolFieldValues?.[viewerTool.id] || {}}
                onFieldValuesChange={(values) => handleInlineToolValues(viewerTool.id, values)}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );

  if (option2Stepper) {
    const STEPS = [
      {
        id: 1,
        label: 'Basic',
        content: (
          <div className={styles.stepFields}>
            {taskNameField}
            {descriptionField}
          </div>
        ),
      },
      {
        id: 2,
        label: 'Tool details',
        content: toolsSection,
      },
    ];
    return (
      <div className={styles.stepperContainer}>
        <nav className={styles.stepper} aria-label="Action setup steps">
          <ol className={styles.stepperList}>
            {STEPS.map((step) => {
              const isOpen = !!openSteps[step.id];
              return (
                <li key={step.id} className={styles.stepperItem}>
                  <div className={styles.stepperRail}>
                    <span
                      className={`${styles.stepMarker}${isOpen ? ` ${styles.stepMarkerActive}` : ''}`}
                      aria-hidden
                    >
                      {step.id}
                    </span>
                    <div className={styles.stepConnector} aria-hidden />
                  </div>
                  <div className={styles.stepMain}>
                    <button
                      type="button"
                      className={styles.stepHeader}
                      onClick={() => toggleStep(step.id)}
                      aria-expanded={isOpen}
                    >
                      <span
                        className={`${styles.stepLabel}${isOpen ? ` ${styles.stepLabelActive}` : ''}`}
                      >
                        {step.label}
                      </span>
                      <span
                        className={`material-symbols-outlined ${styles.stepChevron}${
                          isOpen ? ` ${styles.stepChevronOpen}` : ''
                        }`}
                        aria-hidden
                      >
                        expand_more
                      </span>
                    </button>
                    {isOpen && <div className={styles.stepBody}>{step.content}</div>}
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      {taskNameField}
      {descriptionField}
      {toolsSection}
    </div>
  );
}
