import React, { useState, useEffect } from 'react';
import { SingleSelect } from '../../../elemental-stubs';
import './AssignConversationStatusDrawer.css';

const CONVERSATION_STATUS_OPTIONS = [
  'Open',
  'Needs follow-up',
  'Escalated',
  'Resolved',
  'Closed',
].map((label) => ({ value: label, label }));

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

export default function AssignConversationStatusDrawer({ isOpen, onClose }) {
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (isOpen) setStatus('');
  }, [isOpen]);

  return (
    <NativeDrawer isOpen={isOpen} onClose={onClose}>
      <div className="acvsd">
        <div className="acvsd__header">
          <div className="acvsd__header-left">
            <button type="button" className="acvsd__back" onClick={onClose} aria-label="Back">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            <span className="acvsd__title">Assign conversation status</span>
          </div>
          <button type="button" className="acvsd__save" onClick={onClose}>Save</button>
        </div>

        <div className="acvsd__body">
          <div className="acvsd__field">
            <span className="acvsd__label">Select conversation status</span>
            <SingleSelect
              name="conversationStatus"
              selected={status}
              options={CONVERSATION_STATUS_OPTIONS}
              placeholder="Select"
              onChange={(opt) => setStatus(opt.value)}
            />
          </div>
        </div>
      </div>
    </NativeDrawer>
  );
}
