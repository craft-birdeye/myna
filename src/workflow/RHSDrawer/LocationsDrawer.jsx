import React, { useState, useMemo } from 'react';
import { Button } from '../elemental-stubs';
import './LocationsDrawer.css';

const font = '"Roboto", arial, sans-serif';

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
  { id: '1019', name: 'Dallas, TX' },
];

const SELECT_BY_OPTIONS = [
  { label: 'Location', value: 'location' },
  { label: 'Region', value: 'region' },
  { label: 'Division', value: 'division' },
  { label: 'City', value: 'city' },
  { label: 'Zip', value: 'zip' },
];

const DEFAULT_SELECTED = ['1001', '1002', '1004', '1011', '1014', '1017'];

export default function LocationsDrawer({ selectedIds: initialSelectedIds, onBack, onSave }) {
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds || DEFAULT_SELECTED);
  const [search, setSearch] = useState('');
  const [selectBy, setSelectBy] = useState('location');

  const filteredLocations = useMemo(() => {
    if (!search.trim()) return ALL_LOCATIONS;
    const q = search.toLowerCase();
    return ALL_LOCATIONS.filter(
      (loc) => loc.id.includes(q) || loc.name.toLowerCase().includes(q)
    );
  }, [search]);

  const selectedCount = selectedIds.length;
  const allSelected = filteredLocations.length > 0 && filteredLocations.every((loc) => selectedIds.includes(loc.id));
  const someSelected = filteredLocations.some((loc) => selectedIds.includes(loc.id)) && !allSelected;

  const toggleLocation = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    const ids = filteredLocations.map((l) => l.id);
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const handleSave = () => onSave?.(ALL_LOCATIONS.filter((loc) => selectedIds.includes(loc.id)));

  return (
    <div className="loc-overlay">
      <div className="loc-drawer">

        {/* Header */}
        <div className="loc-header">
          <div className="loc-header__left">
            <button className="loc-back-btn" onClick={onBack}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5.98854 10.6267L8.73215 13.3703C8.85608 13.4943 8.91724 13.6393 8.91565 13.8054C8.91403 13.9715 8.85287 14.1192 8.73215 14.2485C8.60288 14.3778 8.45438 14.4446 8.28665 14.4488C8.11892 14.4531 7.97042 14.3906 7.84115 14.2613L4.10877 10.529C3.95813 10.3783 3.88281 10.2026 3.88281 10.0017C3.88281 9.80088 3.95813 9.62514 4.10877 9.4745L7.84115 5.74212C7.96508 5.61819 8.11224 5.55703 8.28265 5.55862C8.45305 5.56024 8.60288 5.62567 8.73215 5.75494C8.85287 5.88421 8.91537 6.03058 8.91965 6.19404C8.92392 6.3575 8.86142 6.50386 8.73215 6.63312L5.98854 9.37675H15.7931C15.9704 9.37675 16.1189 9.43658 16.2386 9.55623C16.3582 9.67588 16.418 9.82438 16.418 10.0017C16.418 10.1791 16.3582 10.3276 16.2386 10.4472C16.1189 10.5669 15.9704 10.6267 15.7931 10.6267H5.98854Z" fill="currentColor"/>
              </svg>
            </button>
            <span className="loc-title">Locations</span>
          </div>
          <Button theme="primary" label="Save" onClick={handleSave} />
        </div>

        {/* Body */}
        <div className="loc-body">
          <div className="loc-inner">

            {/* Description + select by */}
            <div className="loc-description">
              <span>Choose the locations this agent will work for. Select by</span>
              <div className="loc-select-wrapper">
                <select
                  className="loc-select-by"
                  value={selectBy}
                  onChange={(e) => setSelectBy(e.target.value)}
                >
                  {SELECT_BY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined loc-select-chevron">expand_more</span>
              </div>
              <span className="material-symbols-outlined loc-info-icon">info</span>
            </div>

            {/* Search */}
            <div className="loc-search">
              <span className="material-symbols-outlined loc-search-icon">search</span>
              <input
                className="loc-search-input"
                type="text"
                placeholder="Search location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* List */}
            <div className="loc-list">
              {/* Select all */}
              <div className="loc-row" onClick={toggleAll}>
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
            </div>

          </div>
        </div>
      </div>
    </div>
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
