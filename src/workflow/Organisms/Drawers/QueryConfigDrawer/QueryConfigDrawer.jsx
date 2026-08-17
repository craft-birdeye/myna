import React, { useState, useEffect } from 'react';
import { SingleSelect } from '../../../elemental-stubs';
import './QueryConfigDrawer.css';

const toOpts = (arr) => arr.map((v) => ({ value: v, label: v }));

const STATUS_CHIPS = ['Diagnosed', 'Accepted', 'Rejected', 'Completed'];
const DCODE_OPTIONS = toOpts(['XYZ', 'D0120', 'D0150', 'D1110', 'D2160', 'D4341', 'D5213']);
const OFFICE_OPTIONS = toOpts(['124', 'Cedar Park Dental', 'Austin Main', 'Round Rock']);
const SCHED_OPTIONS = toOpts(['Unscheduled only', 'All', 'Scheduled only']);

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

function FieldLabel({ children }) {
  return (
    <div className="qcd__label-row">
      <span className="qcd__label">{children}</span>
    </div>
  );
}

export default function QueryConfigDrawer({ isOpen, onClose }) {
  const [selectedStatuses, setSelectedStatuses] = useState(['Diagnosed', 'Accepted']);
  const [dcode, setDcode] = useState('XYZ');
  const [office, setOffice] = useState('124');
  const [scheduled, setScheduled] = useState('Unscheduled only');

  useEffect(() => {
    if (isOpen) {
      setSelectedStatuses(['Diagnosed', 'Accepted']);
      setDcode('XYZ');
      setOffice('124');
      setScheduled('Unscheduled only');
    }
  }, [isOpen]);

  const toggleStatus = (s) =>
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  return (
    <NativeDrawer isOpen={isOpen} onClose={onClose}>
      <div className="qcd">
        {/* Header */}
        <div className="qcd__header">
          <div className="qcd__header-left">
            <button type="button" className="qcd__back" onClick={onClose} aria-label="Back">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            <span className="qcd__title">Get all unscheduled treatment plans</span>
          </div>
          <button type="button" className="qcd__save" onClick={onClose}>Save</button>
        </div>

        <div className="qcd__body">

          {/* Status */}
          <div className="qcd__field">
            <FieldLabel>Status</FieldLabel>
            <div className="qcd__checkbox-list">
              {STATUS_CHIPS.map((s) => (
                <label key={s} className="qcd__checkbox">
                  <span
                    role="checkbox"
                    aria-checked={selectedStatuses.includes(s)}
                    tabIndex={0}
                    className={`qcd__checkbox-box${selectedStatuses.includes(s) ? ' qcd__checkbox-box--checked' : ''}`}
                    onClick={() => toggleStatus(s)}
                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleStatus(s); } }}
                  >
                    {selectedStatuses.includes(s) && <span className="material-symbols-outlined">check</span>}
                  </span>
                  {s}
                </label>
              ))}
            </div>
          </div>

          {/* D-code */}
          <div className="qcd__field">
            <FieldLabel>D-code</FieldLabel>
            <SingleSelect
              name="dcode"
              selected={dcode}
              options={DCODE_OPTIONS}
              placeholder="Select"
              onChange={(opt) => setDcode(opt.value)}
            />
          </div>

          {/* Treating office */}
          <div className="qcd__field">
            <FieldLabel>Treating office</FieldLabel>
            <SingleSelect
              name="office"
              selected={office}
              options={OFFICE_OPTIONS}
              placeholder="Select"
              onChange={(opt) => setOffice(opt.value)}
            />
          </div>

          {/* Scheduled */}
          <div className="qcd__field">
            <FieldLabel>Scheduled</FieldLabel>
            <SingleSelect
              name="scheduled"
              selected={scheduled}
              options={SCHED_OPTIONS}
              placeholder="Select"
              onChange={(opt) => setScheduled(opt.value)}
            />
          </div>

        </div>
      </div>
    </NativeDrawer>
  );
}
