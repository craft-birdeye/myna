import React, { useState } from 'react';
import { DataTypeIcon } from '../../../Molecules/Inputs/VariableChip/VariableChip';
import './TransferToolDrawer.css';

const CHANNELS = ['Voice call', 'Web chat', 'Text'];

function NativeDrawer({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', right: 8, top: 8,
          width: 650,
          maxWidth: 'calc(92vw - 8px)',
          height: 'calc(100% - 16px)', borderRadius: 16,
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

function BackArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5.99 10.627L8.733 13.37c.124.124.185.27.184.536s-.062.617-.184.748c-.13.13-.278.196-.446.2-.168.005-.317-.058-.446-.188L3.109 10.53C2.958 10.378 2.883 10.203 2.883 10c0-.202.075-.378.226-.529L6.84 5.742c.124-.124.271-.185.441-.184.17.002.32.068.449.197.12.129.183.275.188.439.004.163-.059.31-.188.44L5.99 9.377H15.793c.178 0 .326.06.446.179.12.12.179.268.179.446s-.06.326-.179.446c-.12.12-.268.179-.446.179H5.99z" fill="currentColor" />
    </svg>
  );
}

/* ── Reusable content (no overlay) — used inline inside AddToolDrawer ── */
export function TransferToolContent({ onClose, onSave }) {
  const [activeChannel, setActiveChannel] = useState('Voice call');
  const [phoneChip, setPhoneChip] = useState(true);
  const [transferMessage, setTransferMessage] = useState('Please hold while I connect you');
  const [summarize, setSummarize] = useState(true);

  function handleSave() {
    onSave?.({ channel: activeChannel, transferMessage, summarize });
  }

  return (
    <div className="tfd" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="tfd__header">
        <div className="tfd__header-left">
          <button type="button" className="tfd__back" onClick={onClose} aria-label="Back">
            <BackArrow />
          </button>
          <span className="tfd__title">Transfer</span>
        </div>
        <button type="button" className="tfd__save" onClick={handleSave}>Save</button>
      </div>

      <div className="tfd__tabs">
        {CHANNELS.map((ch) => (
          <button
            key={ch}
            type="button"
            className={`tfd__tab${activeChannel === ch ? ' tfd__tab--active' : ''}`}
            onClick={() => setActiveChannel(ch)}
          >
            {ch}
          </button>
        ))}
      </div>

      {activeChannel === 'Voice call' ? (
        <div className="tfd__body">
          <div className="tfd__field">
            <span className="tfd__label">Phone number</span>
            <div className="tfd__chip-input">
              {phoneChip && (
                <span className="tfd__chip">
                  <span className="tfd__chip-swatch"><DataTypeIcon /></span>
                  <span className="tfd__chip-label">Department.PhoneNumber</span>
                  <button
                    type="button"
                    className="tfd__chip-remove"
                    onClick={() => setPhoneChip(false)}
                    aria-label="Remove phone number variable"
                  >
                    <svg width="16" height="16" viewBox="158 5 16 16" fill="none"><path d="M166 13.6188L163.151 16.4675C163.059 16.5598 162.959 16.6042 162.853 16.6008C162.747 16.5974 162.645 16.5474 162.549 16.4508C162.452 16.3542 162.404 16.251 162.404 16.1412C162.404 16.0314 162.452 15.9282 162.549 15.8316L165.381 12.9995L162.532 10.1508C162.44 10.0585 162.395 9.95637 162.399 9.8444C162.402 9.73245 162.452 9.62818 162.549 9.5316C162.645 9.43501 162.748 9.38672 162.858 9.38672C162.968 9.38672 163.071 9.43501 163.168 9.5316L166 12.3803L168.849 9.5316C168.941 9.43929 169.043 9.39207 169.155 9.38994C169.267 9.38779 169.371 9.43501 169.468 9.5316C169.564 9.62818 169.613 9.73138 169.613 9.8412C169.613 9.95102 169.564 10.0542 169.468 10.1508L166.619 12.9995L169.468 15.8483C169.56 15.9406 169.607 16.0399 169.609 16.1463C169.612 16.2527 169.564 16.3542 169.468 16.4508C169.371 16.5474 169.268 16.5957 169.158 16.5957C169.048 16.5957 168.945 16.5474 168.849 16.4508L166 13.6188Z" fill="#303030"/></svg>
                  </button>
                </span>
              )}
            </div>
          </div>

          <div className="tfd__field">
            <span className="tfd__label">Transfer message to caller</span>
            <textarea
              className="tfd__textarea"
              value={transferMessage}
              onChange={(e) => setTransferMessage(e.target.value)}
              placeholder="Enter a message to play while transferring..."
            />
          </div>

          <div className="tfd__toggle-row">
            <div className="tfd__toggle-text">
              <div className="tfd__toggle-label-row">
                <span className="tfd__toggle-label">Summarize the call before transfer</span>
                <span className="material-symbols-outlined tfd__info" aria-hidden="true">info</span>
              </div>
              <span className="tfd__toggle-subtext">
                The AI gives the human agent a short spoken recap (up to 10 seconds) before connecting the caller
              </span>
            </div>
            <button
              type="button"
              className={`tfd__toggle-btn${summarize ? ' tfd__toggle-btn--on' : ''}`}
              onClick={() => setSummarize((v) => !v)}
              aria-pressed={summarize}
            >
              <span className="tfd__toggle-thumb" />
            </button>
          </div>
        </div>
      ) : (
        <div className="tfd__empty">
          No configuration available for {activeChannel}.
        </div>
      )}
    </div>
  );
}

/* ── Standalone drawer (used from AgentBuilder when editing an existing chip) ── */
export default function TransferToolDrawer({ isOpen, onClose, onSave }) {
  return (
    <NativeDrawer isOpen={isOpen} onClose={onClose}>
      <TransferToolContent
        onClose={onClose}
        onSave={(config) => { onSave?.(config); onClose?.(); }}
      />
    </NativeDrawer>
  );
}
