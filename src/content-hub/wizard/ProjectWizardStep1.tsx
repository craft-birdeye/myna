/**
 * ProjectWizardStep1 — Brand identity & location
 *
 * Collects the project name, brand identity, and target locations.
 */

import React from 'react';
import {
  CONTENT_FLOW_STEP_TITLE_CLASS,
  ContentFlowLocationFlatList,
  ContentFlowSelect,
  ContentFlowTextInput,
} from '../shared/ContentFlowControls';

// ── Constants ─────────────────────────────────────────────────────────────────

const BRAND_KITS = [
  { value: 'olive-garden', label: 'Olive Garden corporate' },
  { value: 'birdeye-demo', label: 'Birdeye demo brand' },
  { value: 'local-seo',    label: 'Local SEO identity' },
];

const LOCATIONS = [
  { id: 'loc-1001', label: '1001 - Mountain View, CA' },
  { id: 'loc-1002', label: '1002 - Seattle, WA' },
  { id: 'loc-1003', label: '1003 - Dallas, TX' },
  { id: 'loc-1004', label: '1004 - Chicago, IL' },
  { id: 'loc-1005', label: '1005 - Los Angeles, CA' },
  { id: 'loc-1006', label: '1006 - Las Vegas, NV' },
  { id: 'loc-1007', label: '1007 - Austin, TX' },
  { id: 'loc-1008', label: '1008 - Houston, TX' },
  { id: 'loc-1009', label: '1009 - Phoenix, AZ' },
  { id: 'loc-1010', label: '1010 - Denver, CO' },
  { id: 'loc-1011', label: '1011 - New York, NY' },
  { id: 'loc-1012', label: '1012 - Miami, FL' },
  { id: 'loc-1013', label: '1013 - Atlanta, GA' },
  { id: 'loc-1014', label: '1014 - Boston, MA' },
  { id: 'loc-1015', label: '1015 - Portland, OR' },
  { id: 'loc-1016', label: '1016 - San Diego, CA' },
  { id: 'loc-1017', label: '1017 - Nashville, TN' },
  { id: 'loc-1018', label: '1018 - San Antonio, TX' },
  { id: 'loc-1019', label: '1019 - Minneapolis, MN' },
  { id: 'loc-1020', label: '1020 - Charlotte, NC' },
];

const ALL_LOCATION_IDS = LOCATIONS.map(l => l.id);

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProjectWizardStep1Props {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectWizardStep1({ data, onChange }: ProjectWizardStep1Props) {
  const projectName = (data.projectName as string) ?? '';
  const brandKit    = (data.brandKit    as string) ?? 'olive-garden';
  const locations   = (data.locations   as string[]) ?? ALL_LOCATION_IDS;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className={CONTENT_FLOW_STEP_TITLE_CLASS}>Select brand identity and location</h2>
        <p className="text-[13px] text-muted-foreground">
          Content will be created from the selected brand identity and location context.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-foreground">
            Project name <span className="text-destructive">*</span>
          </label>
          <ContentFlowTextInput
            value={projectName}
            onChange={e => onChange({ ...data, projectName: e.target.value })}
            placeholder="e.g. LushGreen spring campaign 2025"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-foreground">
            Brand identity <span className="text-destructive">*</span>
          </label>
          <ContentFlowSelect
            value={brandKit}
            onChange={value => onChange({ ...data, brandKit: value })}
            options={BRAND_KITS}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-foreground">Locations <span className="text-destructive">*</span></label>
          <ContentFlowLocationFlatList
            values={locations}
            options={LOCATIONS.map(loc => ({ value: loc.id, label: loc.label }))}
            onChange={locs => onChange({ ...data, locations: locs })}
            description="Choose the locations this project will apply to."
          />
        </div>
      </div>
    </div>
  );
}
