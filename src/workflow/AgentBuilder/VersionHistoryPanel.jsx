import React, { useState } from 'react';
import './VersionHistoryPanel.css';

/**
 * Newest-first — the list renders in this order.
 * `stamp` is the canvas-chrome form of `title` (comma before the time), used by the
 * canvas identity header. `avatarTint`/`avatarInk` are the tonal pair used by the
 * canvas variant.
 */
export const DEFAULT_VERSIONS = [
  {
    id: 'current',
    title: 'Aug 06, 2026 10:11 AM',
    stamp: 'Aug 06, 2026, 10:11 AM',
    author: 'Raynil kumar',
    initials: 'R',
    avatarColor: '#7e57c2',
    avatarTint: '#ede7f6',
    avatarInk: '#5e35b1',
    status: 'Running',
  },
  {
    id: 'v3',
    title: 'Jul 22, 2026 11:24 AM',
    stamp: 'Jul 22, 2026, 11:24 AM',
    author: 'Rupa',
    initials: 'R',
    avatarColor: '#f9a825',
    avatarTint: '#fff8e1',
    avatarInk: '#f57f17',
  },
  {
    id: 'v2',
    title: 'Jun 30, 2026 04:12 PM',
    stamp: 'Jun 30, 2026, 04:12 PM',
    author: 'Shubham',
    initials: 'S',
    avatarColor: '#ab47bc',
    avatarTint: '#f8e7fb',
    avatarInk: '#8e24aa',
  },
  {
    id: 'v1',
    title: 'Dec 10, 2025 11:24 AM',
    stamp: 'Dec 10, 2025, 11:24 AM',
    author: 'Tanmay',
    initials: 'T',
    avatarColor: '#66bb6a',
    avatarTint: '#e8f5e9',
    avatarInk: '#388e3c',
  },
];

/**
 * Floating LHS "Version history" panel for Review response chrome.
 *
 * `variant='canvas'` is the exploration treatment: no title/close header (the
 * canvas chrome owns Cancel/Restore), flush-left with the identity card, and
 * tonal avatars. `variant='default'` keeps the original header for every other
 * agent. Both render one flat, newest-first list.
 */
export default function VersionHistoryPanel({
  versions = DEFAULT_VERSIONS,
  selectedId: selectedIdProp,
  onSelect,
  onClose,
  variant = 'default',
}) {
  const isCanvas = variant === 'canvas';
  const [selectedId, setSelectedId] = useState(selectedIdProp ?? versions[0]?.id ?? null);
  const activeId = selectedIdProp ?? selectedId;

  const renderItem = (version) => {
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
                <span className="rr-version-history__item-name">
                  {version.title}
                </span>
                {running && (
                  <span className="ab-header-status ab-header-status--running ab-header-status--dot">
                    Running
                  </span>
                )}
              </div>
              <div className="rr-version-history__author">
                <span
                  className="rr-version-history__avatar"
                  style={
                    isCanvas
                      ? { background: version.avatarTint, color: version.avatarInk }
                      : { background: version.avatarColor }
                  }
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
  };

  return (
    <aside
      className={`rr-version-history${isCanvas ? ' rr-version-history--canvas' : ''}`}
      aria-label="Version history"
    >
      {!isCanvas && (
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
      )}

      <ul className="rr-version-history__list">{versions.map(renderItem)}</ul>
    </aside>
  );
}
