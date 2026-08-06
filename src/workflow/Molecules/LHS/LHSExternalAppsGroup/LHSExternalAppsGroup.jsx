import React from 'react';
import './LHSExternalAppsGroup.css';

export const EXTERNAL_APPS_TASK_ITEMS = [
  { id: 'freshdesk', name: 'FreshDesk' },
  { id: 'quickbooks', name: 'QuickBooks Online' },
  { id: 'servicetitan', name: 'ServiceTitan' },
  { id: 'salesforce', name: 'Salesforce' },
];

function AppIcon({ id }) {
  if (id === 'freshdesk') {
    return (
      <span className="lhs-external-apps__icon lhs-external-apps__icon--freshdesk" aria-hidden>
        <span className="material-symbols-outlined">headset_mic</span>
      </span>
    );
  }

  if (id === 'quickbooks') {
    return (
      <span className="lhs-external-apps__icon lhs-external-apps__icon--quickbooks" aria-hidden>
        <span className="lhs-external-apps__icon-text">qb</span>
      </span>
    );
  }

  if (id === 'servicetitan') {
    return (
      <span className="lhs-external-apps__icon lhs-external-apps__icon--servicetitan" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="3.5" fill="#212121" />
          <path
            d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"
            stroke="#212121"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  if (id === 'salesforce') {
    return (
      <span className="lhs-external-apps__icon lhs-external-apps__icon--salesforce" aria-hidden>
        <svg viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8.5 14.2c-2.4 0-4.3-1.6-4.3-3.7C4.2 8.4 6.8 6 10.2 6c1.5 0 2.8.5 3.7 1.3.6-2.4 2.8-4.1 5.4-4.1 3 0 5.5 2.2 5.5 4.9 0 .3 0 .6-.1.9 2 .5 3.4 2.1 3.4 4.1 0 2.3-2.1 4.1-4.7 4.1H8.5z"
            fill="#00A1E0"
          />
        </svg>
      </span>
    );
  }

  return null;
}

export default function LHSExternalAppsGroup({
  apps = EXTERNAL_APPS_TASK_ITEMS,
  nodeType = 'task',
  parentLabel = 'External apps',
  viewOnly = false,
}) {
  const handleDragStart = (e, app) => {
    e.dataTransfer.setData('application/reactflow-type', nodeType);
    e.dataTransfer.setData('application/reactflow-label', parentLabel);
    e.dataTransfer.setData('application/reactflow-description', app.name);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="lhs-external-apps">
      <p className="lhs-external-apps__title">External apps</p>
      <div className="lhs-external-apps__items">
        {apps.map((app) => (
          <div
            key={app.id}
            className="lhs-external-apps__item"
            draggable={!viewOnly}
            onDragStart={(e) => !viewOnly && handleDragStart(e, app)}
          >
            <AppIcon id={app.id} />
            <span className="lhs-external-apps__item-label">{app.name}</span>
            {!viewOnly && (
              <span className="lhs-external-apps__item-drag material-symbols-outlined">
                drag_indicator
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
