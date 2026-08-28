import React from 'react';
import { setFlowDragData } from '../../../flowDragData';
import './LHSExternalAppsGroup.css';

export const EXTERNAL_APPS_TASK_ITEMS = [
  { id: 'freshdesk', name: 'FreshDesk', description: 'FreshDesk CRM tool' },
  { id: 'quickbooks', name: 'QuickBooks Online', description: 'QuickBooks tool' },
  { id: 'servicetitan', name: 'ServiceTitan', description: 'ServiceTitan CRM tool' },
  { id: 'salesforce', name: 'Salesforce', description: 'Salesforce CRM tools' },
  { id: 'zendesk', name: 'Create Zendesk ticket', description: 'Creates a ticket in Zendesk' },
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

  if (id === 'zendesk') {
    return (
      <span className="lhs-external-apps__icon lhs-external-apps__icon--zendesk" aria-hidden>
        <span className="lhs-external-apps__icon-text">Z</span>
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
  onDragStartItem,
  /** Plain inline block under a category header (no flyout card chrome). */
  inline = false,
  showTitle = true,
}) {
  const handleDragStart = (e, app) => {
    setFlowDragData(e.dataTransfer, {
      type: nodeType,
      label: parentLabel,
      description: app.name,
    });

    const ghost = document.createElement('div');
    ghost.className = 'lhs-entity-group__drag-ghost';
    ghost.textContent = app.name;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 16, 16);
    requestAnimationFrame(() => ghost.remove());

    onDragStartItem?.(app);
  };

  return (
    <div className={`lhs-external-apps${inline ? ' lhs-external-apps--inline' : ''}`}>
      {showTitle ? <p className="lhs-external-apps__title">External apps</p> : null}
      <div className="lhs-external-apps__items">
        {apps.map((app) => (
          <div
            key={app.id}
            className={`lhs-external-apps__item${app.description ? ' lhs-external-apps__item--described' : ''}`}
            draggable={!viewOnly}
            onDragStart={(e) => !viewOnly && handleDragStart(e, app)}
          >
            <AppIcon id={app.id} />
            <div className="lhs-external-apps__item-text">
              <span className="lhs-external-apps__item-label">{app.name}</span>
              {app.description ? (
                <span className="lhs-external-apps__item-desc">{app.description}</span>
              ) : null}
            </div>
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
