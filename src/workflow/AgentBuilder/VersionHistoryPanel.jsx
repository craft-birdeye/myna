import React, { useState } from 'react';
import './VersionHistoryPanel.css';

const DEFAULT_VERSIONS = [
  {
    id: 'current',
    title: 'Dec 10, 2025 10:11 AM',
    author: 'Raynil kumar',
    initials: 'R',
    avatarColor: '#7e57c2',
    status: 'Running',
  },
  {
    id: 'v3',
    title: 'Dec 04, 2025 11:24 AM',
    author: 'Rupa',
    initials: 'R',
    avatarColor: '#f9a825',
  },
  {
    id: 'v2',
    title: 'Nov 28, 2025 04:12 PM',
    author: 'Shubham',
    initials: 'S',
    avatarColor: '#ab47bc',
  },
  {
    id: 'v1',
    title: 'Nov 28, 2025 11:24 AM',
    author: 'Tanmay',
    initials: 'T',
    avatarColor: '#66bb6a',
  },
];

/**
 * Floating LHS "Version history" panel for Review response chrome.
 */
export default function VersionHistoryPanel({
  versions = DEFAULT_VERSIONS,
  selectedId: selectedIdProp,
  onSelect,
  onClose,
}) {
  const [selectedId, setSelectedId] = useState(selectedIdProp ?? versions[0]?.id ?? null);
  const activeId = selectedIdProp ?? selectedId;

  return (
    <aside className="rr-version-history" aria-label="Version history">
      <header className="rr-version-history__header">
        <h2 className="rr-version-history__title">Version history</h2>
        <button
          type="button"
          className="rr-version-history__close"
          aria-label="Close version history"
          onClick={onClose}
        >
          <span className="material-symbols-outlined" aria-hidden>
            close
          </span>
        </button>
      </header>

      <ul className="rr-version-history__list">
        {versions.map((version) => {
          const selected = version.id === activeId;
          const running = version.status === 'Running';
          return (
            <li key={version.id}>
              <button
                type="button"
                className={`rr-version-history__item${selected ? ' rr-version-history__item--selected' : ''}`}
                aria-current={selected ? 'true' : undefined}
                onClick={() => {
                  if (selectedIdProp == null) setSelectedId(version.id);
                  onSelect?.(version.id);
                }}
              >
                <div className="rr-version-history__item-main">
                  <div className="rr-version-history__item-copy">
                    <div className="rr-version-history__item-title-row">
                      <span className="rr-version-history__item-name">{version.title}</span>
                      {running && (
                        <span className="ab-header-status ab-header-status--running ab-header-status--dot">
                          Running
                        </span>
                      )}
                    </div>
                    <div className="rr-version-history__author">
                      <span
                        className="rr-version-history__avatar"
                        style={{ background: version.avatarColor }}
                        aria-hidden
                      >
                        {version.initials}
                      </span>
                      <span className="rr-version-history__author-name">{version.author}</span>
                    </div>
                  </div>
                  {selected && (
                    <span className="rr-version-history__check material-symbols-outlined" aria-hidden>
                      check
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
