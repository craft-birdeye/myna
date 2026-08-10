import React, { useState, useEffect, useRef } from 'react';
import { Button, FormInput, TextArea } from '../../../elemental-stubs';
import { saveCustomTool, deleteCustomTool, subscribeToCustomTools } from '../../../services/agentService';
import {
  FieldCard,
  AddFieldPanel,
  LivePreview,
  makeId,
  emptyField,
} from '../CustomToolBuilder/CustomToolBuilder';
import '../CustomToolBuilder/CustomToolBuilder.css';
import styles from './ToolLibraryDrawer.module.css';

const font = '"Roboto", arial, sans-serif';

/* ─── Native slide-in drawer wrapper ─── */
function NativeDrawer({ isOpen, onClose, children, width = 960 }) {
  /* Lock body scroll when open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)',
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: 'absolute', right: 8, top: 8,
          width,
          maxWidth: 'calc(92vw - 8px)',
          height: 'calc(100% - 16px)', borderRadius: 16,
          background: '#fff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.14)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          fontFamily: font,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function ToolLibraryDrawer({ isOpen, onClose, selectedToolIds = [], onToggleTool }) {
  const [tools, setTools] = useState([]);
  const [toolsLoaded, setToolsLoaded] = useState(false);
  const [view, setView] = useState('list');
  const [editingTool, setEditingTool] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  /* Builder form state */
  const [toolName, setToolName] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [iconDataUrl, setIconDataUrl] = useState(null);
  const [fields, setFields] = useState([]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const iconInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setView('list');
      setEditingTool(null);
      setDeletingId(null);
      setToolsLoaded(false);
      return;
    }
    const unsub = subscribeToCustomTools((t) => {
      setTools(t);
      setToolsLoaded(true);
    });
    return unsub;
  }, [isOpen]);

  function openBuilder(tool = null) {
    setEditingTool(tool);
    setToolName(tool?.name ?? '');
    setToolDescription(tool?.description ?? '');
    setIconDataUrl(tool?.iconDataUrl ?? null);
    setFields(tool?.fields ?? []);
    setShowAddPanel(false);
    setView('builder');
  }

  function goToList() {
    setView('list');
    setEditingTool(null);
  }

  function handleSaveTool() {
    if (!toolName.trim()) return;
    const tool = {
      id: editingTool?.id ?? makeId(),
      name: toolName.trim(),
      description: toolDescription.trim(),
      fields,
      iconDataUrl,
      createdAt: editingTool?.createdAt ?? new Date().toISOString(),
    };
    saveCustomTool(tool);
    goToList();
  }

  function handleDeleteTool(id) {
    deleteCustomTool(id);
    setDeletingId(null);
  }

  function handleToggle(toolId) {
    onToggleTool?.(toolId);
    onClose?.();
  }

  function handleIconChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setIconDataUrl(evt.target.result);
    reader.readAsDataURL(file);
  }

  function handleAddField(type) {
    setFields((prev) => [...prev, emptyField(type)]);
    setShowAddPanel(false);
  }

  function handleUpdateField(id, updated) {
    setFields((prev) => prev.map((f) => (f.id === id ? updated : f)));
  }

  function handleDeleteField(id) {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }

  function handleMoveUp(index) {
    if (index === 0) return;
    setFields((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function handleMoveDown(index) {
    setFields((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  const canSave = toolName.trim().length > 0;

  return (
    <NativeDrawer isOpen={isOpen} onClose={onClose} width={960}>
      <div className="ctb-outer" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {view === 'list' ? (
          <>
            {/* Header */}
            <div className="ctb__header">
              <div className="ctb__header-left">
                <span className="ctb__header-title">Tool library</span>
              </div>
              <div className="ctb__header-actions">
                <Button theme="secondary" label="New tool" onClick={() => openBuilder(null)} />
                <button className={styles.closeBtn} type="button" onClick={onClose} title="Close">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* List body */}
            <div className={styles.listBody}>
              {!toolsLoaded ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: '#9e9e9e', fontSize: 13, fontFamily: font }}>
                  Loading tools...
                </div>
              ) : tools.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#b0bec5' }}>build_circle</span>
                  <p className={styles.emptyStateTitle}>No custom tools yet</p>
                  <p className={styles.emptyStateDesc}>
                    Build reusable form tools that agents can use to collect structured data.
                  </p>
                  <Button theme="primary" label="Create your first tool" onClick={() => openBuilder(null)} />
                </div>
              ) : (
                tools.map((tool) => (
                  <div key={tool.id} className={styles.toolRow}>
                    <button
                      className={styles.toolRowMain}
                      type="button"
                      onClick={() => handleToggle(tool.id)}
                    >
                      <div className={styles.toolIconWrap}>
                        {tool.iconDataUrl ? (
                          <img src={tool.iconDataUrl} alt="" className={styles.toolIconImg} />
                        ) : (
                          <span className={`material-symbols-outlined ${styles.toolIconFallback}`}>build</span>
                        )}
                      </div>
                      <div className={styles.toolInfo}>
                        <span className={styles.toolName}>{tool.name}</span>
                        {tool.description && (
                          <span className={styles.toolDesc}>{tool.description}</span>
                        )}
                      </div>
                      {selectedToolIds.includes(tool.id) && (
                        <span className={`material-symbols-outlined ${styles.checkIcon}`}>check_circle</span>
                      )}
                    </button>

                    <div className={styles.rowActions}>
                      <button
                        className={styles.actionBtn}
                        type="button"
                        title="Edit tool"
                        onClick={(e) => { e.stopPropagation(); openBuilder(tool); }}
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>

                      {deletingId === tool.id ? (
                        <div className={styles.deleteConfirm}>
                          <span className={styles.deleteConfirmText}>Delete?</span>
                          <button
                            className={`${styles.deleteConfirmBtn} ${styles.deleteConfirmYes}`}
                            type="button"
                            title="Confirm delete"
                            onClick={() => handleDeleteTool(tool.id)}
                          >
                            <span className="material-symbols-outlined">check</span>
                          </button>
                          <button
                            className={`${styles.deleteConfirmBtn} ${styles.deleteConfirmNo}`}
                            type="button"
                            title="Cancel"
                            onClick={() => setDeletingId(null)}
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          type="button"
                          title="Delete tool"
                          onClick={(e) => { e.stopPropagation(); setDeletingId(tool.id); }}
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* Builder header */}
            <div className="ctb__header">
              <div className="ctb__header-left">
                <button className="ctb__back-btn" type="button" onClick={goToList}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5.98854 10.6267L8.73215 13.3703C8.85608 13.4943 8.91724 13.6393 8.91565 13.8054C8.91403 13.9715 8.85287 14.1192 8.73215 14.2485C8.60288 14.3778 8.45438 14.4446 8.28665 14.4488C8.11892 14.4531 7.97042 14.3906 7.84115 14.2613L4.10877 10.529C3.95813 10.3783 3.88281 10.2026 3.88281 10.0017C3.88281 9.80088 3.95813 9.62514 4.10877 9.4745L7.84115 5.74212C7.96508 5.61819 8.11224 5.55703 8.28265 5.55862C8.45305 5.56024 8.60288 5.62567 8.73215 5.75494C8.85287 5.88421 8.91537 6.03058 8.91965 6.19404C8.92392 6.3575 8.86142 6.50386 8.73215 6.63312L5.98854 9.37675H15.7931C15.9704 9.37675 16.1189 9.43658 16.2386 9.55623C16.3582 9.67588 16.418 9.82438 16.418 10.0017C16.418 10.1791 16.3582 10.3276 16.2386 10.4472C16.1189 10.5669 15.9704 10.6267 15.7931 10.6267H5.98854Z" fill="currentColor"/>
                  </svg>
                </button>
                <span className="ctb__header-title">
                  {editingTool ? 'Edit custom tool' : 'Build custom tool'}
                </span>
              </div>
              <div className="ctb__header-actions">
                <Button theme="primary" label="Save tool" disabled={!canSave} onClick={handleSaveTool} />
              </div>
            </div>

            {/* Builder body */}
            <div className="ctb" style={{ flex: 1, minHeight: 0 }}>
              <div className="ctb__left">
                <div className="ctb__left-scroll">

                  <div className="ctb__field-group">
                    <FormInput
                      name="tld__toolName"
                      type="text"
                      label="Tool name"
                      placeholder="e.g. Create support ticket"
                      value={toolName}
                      onChange={(e) => setToolName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="ctb__field-group">
                    <span className="ctb__label">Tool icon</span>
                    <span className="ctb__sublabel">Upload SVG or PNG (optional)</span>
                    <button
                      className="ctb__icon-upload"
                      type="button"
                      onClick={() => iconInputRef.current?.click()}
                    >
                      {iconDataUrl ? (
                        <img src={iconDataUrl} alt="Tool icon" className="ctb__icon-preview" />
                      ) : (
                        <span className="material-symbols-outlined ctb__icon-upload-sym">upload</span>
                      )}
                    </button>
                    <input
                      ref={iconInputRef}
                      type="file"
                      accept=".svg,.png"
                      className="ctb__icon-input"
                      onChange={handleIconChange}
                    />
                  </div>

                  <div className="ctb__field-group">
                    <TextArea
                      name="tld__toolDescription"
                      label="Description"
                      placeholder="Describe what this tool does and when to use it…"
                      value={toolDescription}
                      onChange={(e) => setToolDescription(e.target.value)}
                      noFloatingLabel
                    />
                  </div>

                  <div className="ctb__divider" />

                  <div className="ctb__fields-section">
                    <div className="ctb__fields-header">
                      <span className="ctb__fields-title">Form fields</span>
                      <span className="ctb__fields-count">
                        {fields.length} field{fields.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {fields.length > 0 && (
                      <div className="ctb__fields">
                        {fields.map((field, i) => (
                          <FieldCard
                            key={field.id}
                            field={field}
                            index={i}
                            total={fields.length}
                            onChange={(updated) => handleUpdateField(field.id, updated)}
                            onDelete={() => handleDeleteField(field.id)}
                            onMoveUp={() => handleMoveUp(i)}
                            onMoveDown={() => handleMoveDown(i)}
                          />
                        ))}
                      </div>
                    )}

                    {showAddPanel ? (
                      <AddFieldPanel
                        onAdd={handleAddField}
                        onCancel={() => setShowAddPanel(false)}
                      />
                    ) : (
                      <button
                        className="ctb__add-field-btn"
                        type="button"
                        onClick={() => setShowAddPanel(true)}
                      >
                        <span className="material-symbols-outlined">add_circle</span>
                        Add a field
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="ctb__right">
                <div className="ctb__preview-header">Live preview</div>
                <div className="ctb__preview-scroll">
                  <LivePreview
                    toolName={toolName}
                    toolDescription={toolDescription}
                    fields={fields}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </NativeDrawer>
  );
}
