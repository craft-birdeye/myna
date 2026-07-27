import React, { useState, useEffect } from 'react';
import { SingleSelect } from '../../../elemental-stubs';
import './AssignContactStatusDrawer.css';

const CONTACT_STATUS_OPTIONS = [
  'Missed call',
  'Voicemails',
  'Scheduling',
  'Callback requested',
  'Rescheduling',
  'Cancellations',
  'Intake',
  'Reminder',
  'Follow up',
  'FAQs',
  'Referrals',
  'Others',
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

export default function AssignContactStatusDrawer({ isOpen, onClose }) {
  const [contactStatus, setContactStatus] = useState('');

  useEffect(() => {
    if (isOpen) setContactStatus('');
  }, [isOpen]);

  return (
    <NativeDrawer isOpen={isOpen} onClose={onClose}>
      <div className="acsd">
        <div className="acsd__header">
          <div className="acsd__header-left">
            <button type="button" className="acsd__back" onClick={onClose} aria-label="Back">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            <span className="acsd__title">Assign contact status</span>
          </div>
          <button type="button" className="acsd__save" onClick={onClose}>Save</button>
        </div>

        <div className="acsd__body">
          <div className="acsd__field">
            <span className="acsd__label">Select contact status</span>
            <SingleSelect
              name="contactStatus"
              selected={contactStatus}
              options={CONTACT_STATUS_OPTIONS}
              placeholder="Select"
              onChange={(opt) => setContactStatus(opt.value)}
            />
          </div>
        </div>
      </div>
    </NativeDrawer>
  );
}
