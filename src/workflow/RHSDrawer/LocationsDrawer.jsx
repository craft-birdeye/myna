import React, { useCallback, useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../elemental-stubs';
import { SelectMenu } from '../../components/SelectMenu/SelectMenu';
import './LocationsDrawer.css';

const ALL_LOCATIONS = [
  { id: '1001', name: 'Mountain view, CA' },
  { id: '1002', name: 'Seattle, WA' },
  { id: '1003', name: 'Dallas, TX' },
  { id: '1004', name: 'Chicago, IL' },
  { id: '1008', name: 'Phoenix, AZ' },
  { id: '1014', name: 'Atlanta, GA' },
  { id: '1009', name: 'Denver, CO' },
  { id: '1015', name: 'Boston, MA' },
  { id: '1010', name: 'New York, NY' },
  { id: '1016', name: 'Philadelphia, PA' },
  { id: '1011', name: 'Austin, TX' },
  { id: '1017', name: 'San Antonio, TX' },
  { id: '1012', name: 'Portland, OR' },
  { id: '1018', name: 'San Diego, CA' },
  { id: '1013', name: 'Miami, FL' },
  { id: '1019', name: 'Houston, TX' },
];

const REVIEW_MANAGERS = [
  { id: 'rm-1', name: 'Sarah Chen' },
  { id: 'rm-2', name: 'Marcus Webb' },
  { id: 'rm-3', name: 'Priya Nair' },
  { id: 'rm-4', name: 'Jordan Blake' },
  { id: 'rm-5', name: 'Elena Rossi' },
  { id: 'rm-6', name: 'Chris Patel' },
  { id: 'rm-7', name: 'Ava Thompson' },
  { id: 'rm-8', name: 'Noah Kim' },
];

const CONTENT_MANAGERS = [
  { id: 'cm-1', name: 'Lily Ortega' },
  { id: 'cm-2', name: 'Sam Okonkwo' },
  { id: 'cm-3', name: 'Grace Liu' },
  { id: 'cm-4', name: 'Ethan Brooks' },
  { id: 'cm-5', name: 'Maya Singh' },
  { id: 'cm-6', name: 'Owen Hart' },
  { id: 'cm-7', name: 'Zoe Alvarez' },
  { id: 'cm-8', name: 'Ian Foster' },
];

const DEPARTMENTS = [
  { id: 'dept-1', name: 'Employer benefits' },
  { id: 'dept-2', name: 'Life insurance' },
  { id: 'dept-3', name: 'Local outreach' },
  { id: 'dept-4', name: 'Medicare' },
  { id: 'dept-5', name: 'Retirement & Annuities' },
  { id: 'dept-6', name: 'Customer experience' },
  { id: 'dept-7', name: 'Brand & communications' },
  { id: 'dept-8', name: 'Compliance' },
  { id: 'dept-9', name: 'Sales enablement' },
  { id: 'dept-10', name: 'Product support' },
];

const LOCATIONS_BY_ENTITY = {
  'review-managers': {
    'rm-1': ['1001', '1002', '1011'],
    'rm-2': ['1004', '1008', '1009'],
    'rm-3': ['1010', '1015', '1016'],
    'rm-4': ['1014', '1013', '1017'],
    'rm-5': ['1003', '1019', '1012'],
    'rm-6': ['1018', '1001', '1004'],
    'rm-7': ['1002', '1009', '1011'],
    'rm-8': ['1010', '1014', '1015'],
  },
  'content-managers': {
    'cm-1': ['1001', '1018', '1012'],
    'cm-2': ['1002', '1009', '1015'],
    'cm-3': ['1004', '1010', '1016'],
    'cm-4': ['1008', '1014', '1013'],
    'cm-5': ['1011', '1017', '1003'],
    'cm-6': ['1019', '1001', '1002'],
    'cm-7': ['1004', '1009', '1018'],
    'cm-8': ['1010', '1015', '1012'],
  },
  departments: {
    'dept-1': ['1001', '1002', '1004'],
    'dept-2': ['1008', '1009', '1010'],
    'dept-3': ['1011', '1012', '1013'],
    'dept-4': ['1014', '1015', '1016'],
    'dept-5': ['1017', '1018', '1019'],
    'dept-6': ['1001', '1010', '1014'],
    'dept-7': ['1002', '1004', '1015'],
    'dept-8': ['1003', '1008', '1011'],
    'dept-9': ['1009', '1012', '1017'],
    'dept-10': ['1013', '1016', '1018'],
  },
};

const BASE_SELECT_BY_OPTIONS = [
  { label: 'Location', value: 'location' },
  { label: 'Region', value: 'region' },
  { label: 'Division', value: 'division' },
  { label: 'City', value: 'city' },
  { label: 'Zip', value: 'zip' },
];

const CUSTOM_FIELD_OPTIONS = [
  { label: 'Review managers', value: 'review-managers', showChevron: true },
  { label: 'Content managers', value: 'content-managers', showChevron: true },
  { label: 'Departments', value: 'departments', showChevron: true },
];

const CUSTOM_FIELD_VALUES = new Set(CUSTOM_FIELD_OPTIONS.map((opt) => opt.value));

const PLAIN_SELECT_BY_VALUES = new Set(BASE_SELECT_BY_OPTIONS.map((opt) => opt.value));

/** Left-nav rows in the picker: plain Location…Zip stay visible; custom fields open the right panel. */
const PICKER_NAV_ITEMS = [
  ...BASE_SELECT_BY_OPTIONS.map((opt) => ({
    id: opt.value,
    label: opt.label,
    hasPanel: false,
  })),
  ...CUSTOM_FIELD_OPTIONS.map((opt) => ({
    id: opt.value,
    label: opt.label,
    hasPanel: true,
    items:
      opt.value === 'review-managers' ? REVIEW_MANAGERS
        : opt.value === 'content-managers' ? CONTENT_MANAGERS
          : DEPARTMENTS,
    badge:
      opt.value === 'review-managers' ? REVIEW_MANAGERS.length
        : opt.value === 'content-managers' ? CONTENT_MANAGERS.length
          : DEPARTMENTS.length,
  })),
];

const DEFAULT_SELECTED = ['1001', '1002', '1004', '1011', '1014', '1017'];
const APPLY_LOAD_MS = 520;

function resolveLocationIds(categoryId, entityIds) {
  const map = LOCATIONS_BY_ENTITY[categoryId] || {};
  const locationIds = new Set();
  entityIds.forEach((id) => {
    (map[id] || []).forEach((locId) => locationIds.add(locId));
  });
  return [...locationIds];
}

export default function LocationsDrawer({
  selectedIds: initialSelectedIds = DEFAULT_SELECTED,
  onBack,
  onSave,
  includeCustomFields = false,
}) {
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
  /** When set, the drawer only shows these location ids (post-Apply from a custom field). */
  const [scopedLocationIds, setScopedLocationIds] = useState(null);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectBy, setSelectBy] = useState('location');
  /** Unified flyout: closed | menu | picker — same anchor, no position jump. */
  const [flyoutMode, setFlyoutMode] = useState('closed');
  const [popoverCategory, setPopoverCategory] = useState('content-managers');
  const [popoverDraftByCategory, setPopoverDraftByCategory] = useState({});
  /** Last applied entity ids per category — used to restore selection on reopen / cancel. */
  const [appliedByCategory, setAppliedByCategory] = useState({});
  const [popoverSearch, setPopoverSearch] = useState('');
  const [flyoutPos, setFlyoutPos] = useState({ top: 0, left: 0, width: 168 });
  const selectByRef = useRef(null);
  const innerRef = useRef(null);
  const flyoutRef = useRef(null);
  const loadTimerRef = useRef(null);

  const selectByOptions = useMemo(
    () => (includeCustomFields ? [...BASE_SELECT_BY_OPTIONS, ...CUSTOM_FIELD_OPTIONS] : BASE_SELECT_BY_OPTIONS),
    [includeCustomFields],
  );

  const pickerNavItems = useMemo(
    () => (includeCustomFields ? PICKER_NAV_ITEMS : BASE_SELECT_BY_OPTIONS.map((opt) => ({
      id: opt.value,
      label: opt.label,
      hasPanel: false,
    }))),
    [includeCustomFields],
  );

  useEffect(() => () => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
  }, []);

  useEffect(() => {
    if (flyoutMode === 'closed') return;
    // Use click (not mousedown) so the same gesture that opens the menu
    // cannot immediately close it; ignore events from the trigger button.
    const handleOutsideClick = (e) => {
      const inTrigger = selectByRef.current?.contains(e.target);
      const inFlyout = flyoutRef.current?.contains(e.target);
      if (inTrigger || inFlyout) return;
      setFlyoutMode('closed');
      setPopoverSearch('');
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setFlyoutMode('closed');
        setPopoverSearch('');
      }
    };
    // Defer attach so the opening click does not count as an outside click.
    const timer = window.setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);
    document.addEventListener('keydown', handleEsc);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [flyoutMode]);

  const measureFlyoutPos = useCallback((mode, categoryId) => {
    if (!innerRef.current || !selectByRef.current) return null;
    const inner = innerRef.current.getBoundingClientRect();
    const trigger = selectByRef.current.getBoundingClientRect();
    const top = trigger.bottom - inner.top + 4;
    const wantsPanel = mode === 'picker' && CUSTOM_FIELD_VALUES.has(categoryId);
    if (mode === 'picker' && wantsPanel) {
      const width = Math.min(520, inner.width);
      const preferredLeft = trigger.left - inner.left;
      const left = Math.min(Math.max(0, preferredLeft), Math.max(0, inner.width - width));
      return { top, left, width };
    }
    if (mode === 'picker') {
      const width = Math.min(220, inner.width);
      const preferredLeft = trigger.left - inner.left;
      const left = Math.min(Math.max(0, preferredLeft), Math.max(0, inner.width - width));
      return { top, left, width };
    }
    const width = 168;
    const preferredLeft = trigger.left - inner.left;
    const left = Math.min(Math.max(0, preferredLeft), Math.max(0, inner.width - width));
    return { top, left, width };
  }, []);

  const locationUniverse = useMemo(() => {
    if (!scopedLocationIds) return ALL_LOCATIONS;
    const allowed = new Set(scopedLocationIds);
    return ALL_LOCATIONS.filter((loc) => allowed.has(loc.id));
  }, [scopedLocationIds]);

  const filteredLocations = useMemo(() => {
    if (!search.trim()) return locationUniverse;
    const q = search.toLowerCase();
    return locationUniverse.filter(
      (loc) => loc.id.includes(q) || loc.name.toLowerCase().includes(q),
    );
  }, [locationUniverse, search]);

  const selectedCount = selectedIds.filter((id) => locationUniverse.some((loc) => loc.id === id)).length;
  const allSelected = filteredLocations.length > 0 && filteredLocations.every((loc) => selectedIds.includes(loc.id));
  const someSelected = filteredLocations.some((loc) => selectedIds.includes(loc.id)) && !allSelected;

  const toggleLocation = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAllLocations = () => {
    const ids = filteredLocations.map((loc) => loc.id);
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const openPicker = (categoryId) => {
    const pos = measureFlyoutPos('picker', categoryId);
    if (pos) setFlyoutPos(pos);
    setPopoverCategory(categoryId);
    setPopoverSearch('');
    setPopoverDraftByCategory((prev) => {
      if (prev[categoryId]?.length) return prev;
      const applied = appliedByCategory[categoryId];
      return {
        ...prev,
        [categoryId]: applied?.length ? [...applied] : (prev[categoryId] ?? []),
      };
    });
    if (CUSTOM_FIELD_VALUES.has(categoryId)) {
      setSelectBy(categoryId);
    }
    // Stay in the same flyout shell — only swap content (menu → picker).
    setFlyoutMode('picker');
  };

  const handleSelectByChange = (value) => {
    const next = value[0];
    if (CUSTOM_FIELD_VALUES.has(next)) {
      openPicker(next);
      return;
    }
    setSelectBy(next);
    setScopedLocationIds(null);
    setFlyoutMode('closed');
    setSearch('');
  };

  const activeCategory = pickerNavItems.find((c) => c.id === popoverCategory) || pickerNavItems[0];
  const showPickerPanel = CUSTOM_FIELD_VALUES.has(popoverCategory);
  const popoverDraftIds = popoverDraftByCategory[popoverCategory] || [];

  const filteredPopoverItems = useMemo(() => {
    const items = activeCategory?.items || [];
    if (!popoverSearch.trim()) return items;
    const q = popoverSearch.toLowerCase();
    return items.filter(
      (item) => item.id.toLowerCase().includes(q) || item.name.toLowerCase().includes(q),
    );
  }, [activeCategory, popoverSearch]);

  const popoverAllSelected =
    filteredPopoverItems.length > 0 && filteredPopoverItems.every((item) => popoverDraftIds.includes(item.id));
  const popoverSomeSelected =
    filteredPopoverItems.some((item) => popoverDraftIds.includes(item.id)) && !popoverAllSelected;

  const setPopoverDraftIds = (updater) => {
    setPopoverDraftByCategory((prev) => {
      const current = prev[popoverCategory] || [];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [popoverCategory]: next };
    });
  };

  const togglePopoverItem = (id) => {
    setPopoverDraftIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAllPopoverItems = () => {
    const ids = filteredPopoverItems.map((item) => item.id);
    if (popoverAllSelected) {
      setPopoverDraftIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setPopoverDraftIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const handlePopoverCancel = () => {
    // Restore last applied selection for this category (discard in-progress edits).
    setPopoverDraftByCategory((prev) => ({
      ...prev,
      [popoverCategory]: appliedByCategory[popoverCategory]
        ? [...appliedByCategory[popoverCategory]]
        : (prev[popoverCategory] ?? []),
    }));
    setPopoverSearch('');
    // Stay on the combined list so Location…Zip remain visible.
    setFlyoutMode('picker');
  };

  const handlePopoverApply = () => {
    const draftIds = [...popoverDraftIds];
    const locationIds = resolveLocationIds(popoverCategory, draftIds);
    setAppliedByCategory((prev) => ({ ...prev, [popoverCategory]: draftIds }));
    setPopoverDraftByCategory((prev) => ({ ...prev, [popoverCategory]: draftIds }));
    setFlyoutMode('closed');
    setPopoverSearch('');
    setSearch('');
    // Keep Select by showing the applied custom field.
    if (CUSTOM_FIELD_VALUES.has(popoverCategory)) {
      setSelectBy(popoverCategory);
    }
    setLocationsLoading(true);
    setScopedLocationIds(null);
    setSelectedIds([]);

    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => {
      setScopedLocationIds(locationIds);
      setSelectedIds(locationIds);
      setLocationsLoading(false);
      loadTimerRef.current = null;
    }, APPLY_LOAD_MS);
  };

  const handleSave = () => {
    onSave?.(ALL_LOCATIONS.filter((loc) => selectedIds.includes(loc.id)));
  };

  const selectByLabel = selectByOptions.find((opt) => opt.value === selectBy)?.label ?? 'Location';
  const flyoutOpen = flyoutMode !== 'closed';

  // Keep the flyout fully inside the drawer — no horizontal page scroll.
  useLayoutEffect(() => {
    if (!flyoutOpen) return;
    const pos = measureFlyoutPos(flyoutMode, popoverCategory);
    if (pos) setFlyoutPos(pos);
    const onResize = () => {
      const next = measureFlyoutPos(flyoutMode, popoverCategory);
      if (next) setFlyoutPos(next);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [flyoutOpen, flyoutMode, popoverCategory, measureFlyoutPos]);

  return createPortal(
    <div className="loc-overlay">
      <div className="loc-drawer">

        <div className="loc-header">
          <div className="loc-header__left">
            <button className="loc-back-btn" onClick={onBack} type="button">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5.98854 10.6267L8.73215 13.3703C8.85608 13.4943 8.91724 13.6393 8.91565 13.8054C8.91403 13.9715 8.85287 14.1192 8.73215 14.2485C8.60288 14.3778 8.45438 14.4446 8.28665 14.4488C8.11892 14.4531 7.97042 14.3906 7.84115 14.2613L4.10877 10.529C3.95813 10.3783 3.88281 10.2026 3.88281 10.0017C3.88281 9.80088 3.95813 9.62514 4.10877 9.4745L7.84115 5.74212C7.96508 5.61819 8.11224 5.55703 8.28265 5.55862C8.45305 5.56024 8.60288 5.62567 8.73215 5.75494C8.85287 5.88421 8.91537 6.03058 8.91965 6.19404C8.92392 6.3575 8.86142 6.50386 8.73215 6.63312L5.98854 9.37675H15.7931C15.9704 9.37675 16.1189 9.43658 16.2386 9.55623C16.3582 9.67588 16.418 9.82438 16.418 10.0017C16.418 10.1791 16.3582 10.3276 16.2386 10.4472C16.1189 10.5669 15.9704 10.6267 15.7931 10.6267H5.98854Z" fill="currentColor"/>
              </svg>
            </button>
            <span className="loc-title">Locations</span>
          </div>
          <Button theme="primary" label="Add" onClick={handleSave} disabled={locationsLoading} />
        </div>

        <div className="loc-body">
          <div className="loc-inner" ref={innerRef}>

            <div className="loc-description">
              <span>Choose the locations this agent will work for. Select by</span>
              <div className="loc-select-wrapper" ref={selectByRef}>
                <button
                  type="button"
                  className="loc-select-by"
                  onMouseDown={(e) => {
                    // Keep document outside-click from treating this as a dismiss.
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPopoverSearch('');
                    if (flyoutMode !== 'closed') {
                      setFlyoutMode('closed');
                      return;
                    }
                    if (includeCustomFields) {
                      // Combined list: Location…Zip stay visible; custom fields open the right panel.
                      const initial = CUSTOM_FIELD_VALUES.has(selectBy) ? selectBy : selectBy;
                      const pos = measureFlyoutPos('picker', initial);
                      if (pos) setFlyoutPos(pos);
                      setPopoverCategory(initial);
                      if (CUSTOM_FIELD_VALUES.has(initial)) {
                        openPicker(initial);
                      } else {
                        setFlyoutMode('picker');
                      }
                      return;
                    }
                    const pos = measureFlyoutPos('menu', selectBy);
                    if (pos) setFlyoutPos(pos);
                    setFlyoutMode('menu');
                  }}
                >
                  {selectByLabel}
                  <span className="material-symbols-outlined loc-select-chevron">expand_more</span>
                </button>
              </div>
              <span className="material-symbols-outlined loc-info-icon">info</span>
            </div>

            {flyoutOpen && (
              <div
                ref={flyoutRef}
                className={`loc-flyout${flyoutMode === 'picker' ? ' loc-flyout--picker' : ' loc-flyout--menu'}`}
                role="dialog"
                aria-label={flyoutMode === 'picker' ? 'Select by filter' : 'Select by'}
                style={{
                  top: flyoutPos.top,
                  left: flyoutPos.left,
                  width: flyoutPos.width,
                }}
              >
                {flyoutMode === 'menu' ? (
                  <SelectMenu
                    options={selectByOptions}
                    value={[selectBy]}
                    multi={false}
                    searchable={false}
                    onChange={handleSelectByChange}
                  />
                ) : (
                  <>
                    <div className={`loc-picker-popover__body${showPickerPanel ? '' : ' loc-picker-popover__body--nav-only'}`}>
                      <div className="loc-picker-popover__nav">
                        {pickerNavItems.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            className={`loc-picker-popover__nav-item${
                              (showPickerPanel ? popoverCategory === category.id : selectBy === category.id)
                                ? ' loc-picker-popover__nav-item--active'
                                : ''
                            }`}
                            onClick={() => {
                              if (!category.hasPanel) {
                                // Plain Location / Region / … — keep list, no right panel, close flyout.
                                setSelectBy(category.id);
                                setScopedLocationIds(null);
                                setPopoverCategory(category.id);
                                setFlyoutMode('closed');
                                setPopoverSearch('');
                                setSearch('');
                                return;
                              }
                              setPopoverCategory(category.id);
                              setPopoverSearch('');
                              setSelectBy(category.id);
                              const pos = measureFlyoutPos('picker', category.id);
                              if (pos) setFlyoutPos(pos);
                              setPopoverDraftByCategory((prev) => {
                                if (prev[category.id]?.length) return prev;
                                const applied = appliedByCategory[category.id];
                                return {
                                  ...prev,
                                  [category.id]: applied?.length ? [...applied] : (prev[category.id] ?? []),
                                };
                              });
                            }}
                          >
                            <span className="loc-picker-popover__nav-label">{category.label}</span>
                            {category.hasPanel ? (
                              <span className="loc-picker-popover__nav-meta">
                                {category.badge != null && (
                                  <span className="loc-picker-popover__badge">{category.badge}</span>
                                )}
                                <span className="material-symbols-outlined loc-picker-popover__chevron" aria-hidden>
                                  chevron_right
                                </span>
                              </span>
                            ) : (
                              selectBy === category.id && (
                                <span className="material-symbols-outlined loc-picker-popover__check" aria-hidden>
                                  check
                                </span>
                              )
                            )}
                          </button>
                        ))}
                      </div>

                      {showPickerPanel && (
                        <div className="loc-picker-popover__panel">
                          <div className="loc-picker-popover__search">
                            <span className="material-symbols-outlined" aria-hidden>search</span>
                            <input
                              type="text"
                              placeholder="Search"
                              value={popoverSearch}
                              onChange={(e) => setPopoverSearch(e.target.value)}
                            />
                          </div>

                          <div className="loc-picker-popover__list">
                            <button
                              type="button"
                              className="loc-picker-popover__row"
                              onClick={toggleAllPopoverItems}
                            >
                              <Checkbox checked={popoverAllSelected} indeterminate={popoverSomeSelected} />
                              <span>Select all</span>
                            </button>
                            {filteredPopoverItems.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                className="loc-picker-popover__row"
                                onClick={() => togglePopoverItem(item.id)}
                              >
                                <Checkbox checked={popoverDraftIds.includes(item.id)} />
                                <span>{item.name}</span>
                              </button>
                            ))}
                            {filteredPopoverItems.length === 0 && (
                              <p className="loc-picker-popover__empty">No results.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {showPickerPanel && (
                      <div className="loc-picker-popover__footer">
                        <button type="button" className="loc-picker-popover__cancel" onClick={handlePopoverCancel}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="loc-picker-popover__apply"
                          onClick={handlePopoverApply}
                          disabled={popoverDraftIds.length === 0}
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="loc-search">
              <span className="material-symbols-outlined loc-search-icon">search</span>
              <input
                className="loc-search-input"
                type="text"
                placeholder="Search location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={locationsLoading}
              />
            </div>

            <div className="loc-list">
              {locationsLoading ? (
                <div className="loc-list-loading" aria-live="polite" aria-busy="true">
                  <div className="loc-list-loading__spinner" />
                  <span>Loading locations…</span>
                </div>
              ) : (
                <>
                  <div className="loc-row" onClick={toggleAllLocations}>
                    <Checkbox checked={allSelected} indeterminate={someSelected} />
                    <span className="loc-row__label">Select all</span>
                    <span className="loc-row__count">{selectedCount} locations selected</span>
                  </div>

                  {filteredLocations.map((loc) => (
                    <div key={loc.id} className="loc-row" onClick={() => toggleLocation(loc.id)}>
                      <Checkbox checked={selectedIds.includes(loc.id)} />
                      <span className="loc-row__label">{loc.id} - {loc.name}</span>
                    </div>
                  ))}

                  {filteredLocations.length === 0 && (
                    <p className="loc-list-empty">No locations for this selection.</p>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Checkbox({ checked, indeterminate }) {
  return (
    <div className={`loc-checkbox ${checked || indeterminate ? 'loc-checkbox--on' : ''}`}>
      {checked && !indeterminate && (
        <span className="material-symbols-outlined loc-checkbox__check">check</span>
      )}
      {indeterminate && <span className="loc-checkbox__dash" />}
    </div>
  );
}
