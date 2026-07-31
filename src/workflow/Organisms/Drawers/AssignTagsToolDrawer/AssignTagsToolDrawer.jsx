import React from 'react';
import './AssignTagsToolDrawer.css';

/* Sample tag library (managed in Settings) shown read-only in the drawer */
const SAMPLE_TAGS = [
  'Already Addressed',
  'Ashley',
  'Asiya',
  "Can't Respond",
  'Corrina',
  'Eva',
  'Maria',
];

function NativeDrawer({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 650,
          maxWidth: '95vw',
          height: '100%',
          overflowY: 'auto',
          background: '#fff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.14)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function AssignTagsToolDrawer({ isOpen, onClose }) {
  return (
    <NativeDrawer isOpen={isOpen} onClose={onClose}>
      <div className="atd">
        <div className="atd__header">
          <div className="atd__header-left">
            <button type="button" className="atd__back" onClick={onClose} aria-label="Back">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            <span className="atd__title">Assign tags</span>
          </div>
          <button type="button" className="atd__save" disabled>Save</button>
        </div>

        <div className="atd__body">
          <span className="atd__label">
            Tags to add<span className="atd__required"> *</span>
          </span>

          {/* Multiselect trigger — disabled at reseller level */}
          <div className="atd__field" aria-disabled="true">
            <span className="atd__field-placeholder">Choose tags that should be added to the reviews</span>
            <div className="atd__field-actions">
              <button type="button" className="atd__field-btn" disabled aria-label="Collapse">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>keyboard_arrow_up</span>
              </button>
              <button type="button" className="atd__field-btn atd__field-btn--plain" disabled aria-label="Insert variable">
                {'{x}'}
              </button>
            </div>
          </div>

          <div className="atd__locked-note">
            <span className="material-symbols-outlined atd__locked-icon">lock</span>
            <span>Tags come from your tag library in Settings — manage the list there, then choose the tags this agent should apply.</span>
          </div>

          {/* Tag list preview — read-only */}
          <div className="atd__panel" aria-hidden="true">
            <div className="atd__search">
              <span className="material-symbols-outlined atd__search-icon">search</span>
              <input placeholder="Search" readOnly tabIndex={-1} />
            </div>
            <div className="atd__options">
              {SAMPLE_TAGS.map((tag) => (
                <div key={tag} className="atd__option">
                  <span className="atd__checkbox" />
                  <span>{tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </NativeDrawer>
  );
}
