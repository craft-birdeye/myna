import React, { useState, useEffect, useRef } from 'react';
import './AssignConversationDrawer.css';

const USERS = ['Kelsy Hiltz', 'Robin K.', 'Savannah A.', 'Mia L.'];
const TEAMS = ['USA - Sales', 'Support team', 'Billing team'];

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

function AssignToSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const q = query.trim().toLowerCase();
  const filteredUsers = USERS.filter((u) => u.toLowerCase().includes(q));
  const filteredTeams = TEAMS.filter((t) => t.toLowerCase().includes(q));
  const hasResults = filteredUsers.length > 0 || filteredTeams.length > 0;

  return (
    <div className="acvd__field" ref={ref}>
      <span className="acvd__label">Assign to</span>
      <button
        type="button"
        className={`acvd__select-trigger${!value ? ' acvd__select-trigger--placeholder' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        {value || 'Select'}
        <span className="material-symbols-outlined">expand_more</span>
      </button>

      {open && (
        <div className="acvd__panel">
          <div className="acvd__search">
            <span className="material-symbols-outlined">search</span>
            <input
              autoFocus
              placeholder="Search for teams or users"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {!hasResults && <div className="acvd__empty">No matches found</div>}

          {filteredUsers.length > 0 && (
            <>
              <div className="acvd__group-label">Users</div>
              {filteredUsers.map((u) => (
                <div key={u} className="acvd__option" onClick={() => { onChange(u); setOpen(false); setQuery(''); }}>
                  {u}
                </div>
              ))}
            </>
          )}

          {filteredTeams.length > 0 && (
            <>
              <div className="acvd__group-label">Teams</div>
              {filteredTeams.map((t) => (
                <div key={t} className="acvd__option" onClick={() => { onChange(t); setOpen(false); setQuery(''); }}>
                  {t}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AssignConversationDrawer({ isOpen, onClose }) {
  const [assignTo, setAssignTo] = useState('');

  useEffect(() => {
    if (isOpen) setAssignTo('');
  }, [isOpen]);

  return (
    <NativeDrawer isOpen={isOpen} onClose={onClose}>
      <div className="acvd">
        <div className="acvd__header">
          <div className="acvd__header-left">
            <button type="button" className="acvd__back" onClick={onClose} aria-label="Back">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            <span className="acvd__title">Assign conversation</span>
          </div>
          <button type="button" className="acvd__save" onClick={onClose}>Save</button>
        </div>

        <div className="acvd__body">
          <AssignToSelect value={assignTo} onChange={setAssignTo} />
        </div>
      </div>
    </NativeDrawer>
  );
}
