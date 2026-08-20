import React, { useState } from 'react';
import './VersionHistoryPanel.css';

/**
 * Newest-first — the year grouping takes its order from this array.
 * `stamp` is the canvas-chrome form of `title`; `shortStamp` drops the year for
 * grouped rows (the year group header already carries it). `year` is explicit
 * rather than parsed so grouping never depends on date-string locale.
 * `avatarTint`/`avatarInk` are the tonal pair used by the canvas variant.
 */
export const DEFAULT_VERSIONS = [
  {
    id: 'current',
    title: 'Aug 06, 2026 10:11 AM',
    stamp: 'Aug 06, 2026, 10:11 AM',
    shortStamp: 'Aug 06, 10:11 AM',
    year: 2026,
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
    shortStamp: 'Jul 22, 11:24 AM',
    year: 2026,
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
    shortStamp: 'Jun 30, 04:12 PM',
    year: 2026,
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
    shortStamp: 'Dec 10, 11:24 AM',
    year: 2025,
    author: 'Tanmay',
    initials: 'T',
    avatarColor: '#66bb6a',
    avatarTint: '#e8f5e9',
    avatarInk: '#388e3c',
  },
];

/** Buckets versions by year, preserving the source (newest-first) order. */
function groupByYear(versions) {
  const years = [];
  versions.forEach((version) => {
    let year = years.find((y) => y.year === version.year);
    if (!year) {
      year = { year: version.year, versions: [] };
      years.push(year);
    }
    year.versions.push(version);
  });
  return years;
}

const countLabel = (n) => `${n} ${n === 1 ? 'version' : 'versions'}`;

/**
 * Floating LHS "Version history" panel for Review response chrome.
 *
 * `variant='canvas'` is the exploration treatment: no title/close header (the
 * canvas chrome owns Cancel/Restore), flush-left with the identity card,
 * collapsible year groups and tonal avatars. `variant='default'` keeps the
 * original header + flat list for every other agent.
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

  const groups = isCanvas ? groupByYear(versions) : [];
  // Newest year opens expanded; older years start collapsed unless one holds the
  // selected version — a hidden ✓ would leave the header stamp unexplained.
  const [collapsedYears, setCollapsedYears] = useState(() => {
    if (!isCanvas) return new Set();
    const active = versions.find((v) => v.id === (selectedIdProp ?? versions[0]?.id));
    const allYears = [...new Set(versions.map((v) => v.year))];
    return new Set(allYears.filter((y, i) => i !== 0 && y !== active?.year));
  });
  const toggleYear = (year) =>
    setCollapsedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });

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
                  {isCanvas ? version.shortStamp || version.title : version.title}
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

  const renderYearToggle = ({ year, collapsed, count, onToggle }) => (
    <button
      type="button"
      className="rr-version-history__group-toggle rr-version-history__group-toggle--year"
      aria-expanded={!collapsed}
      onClick={onToggle}
    >
      <span className="rr-version-history__group-label rr-version-history__group-label--year">
        {year}
      </span>
      {collapsed && <span className="rr-version-history__group-count">{countLabel(count)}</span>}
      <span className="material-symbols-outlined rr-version-history__group-chevron" aria-hidden>
        {collapsed ? 'expand_more' : 'expand_less'}
      </span>
    </button>
  );

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

      {isCanvas ? (
        <div className="rr-version-history__groups">
          {groups.map((yearGroup) => {
            const yearCollapsed = collapsedYears.has(yearGroup.year);
            return (
              <section key={yearGroup.year} className="rr-version-history__year">
                {renderYearToggle({
                  year: yearGroup.year,
                  collapsed: yearCollapsed,
                  count: yearGroup.versions.length,
                  onToggle: () => toggleYear(yearGroup.year),
                })}
                {!yearCollapsed && (
                  <ul className="rr-version-history__list rr-version-history__list--grouped">
                    {yearGroup.versions.map(renderItem)}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <ul className="rr-version-history__list">{versions.map(renderItem)}</ul>
      )}
    </aside>
  );
}
