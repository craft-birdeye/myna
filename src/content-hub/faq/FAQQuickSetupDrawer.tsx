/**
 * FAQQuickSetupDrawer
 *
 * Right-side Sheet that collects the three minimal fields needed to start
 * a new FAQ: content name, brand identity, and locations.
 * Replaces the 3-step inline wizard as the entry point for FAQ creation.
 */
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Sheet, SheetContent } from '@/contenthub-ui/sheet';
import { Button } from '@/contenthub-ui/button';
import {
  ContentFlowLocationFlatList,
  ContentFlowLocationInfoTooltip,
  CONTENT_FLOW_STEP_TITLE_CLASS,
  CONTENT_FLOW_FIELD_CLASS,
} from '../shared/ContentFlowControls';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/contenthub-ui/select';

// ── Constants ─────────────────────────────────────────────────────────────────

const BRAND_KITS = [
  { id: 'olive-garden', label: 'Olive Garden corporate' },
  { id: 'birdeye-demo', label: 'Birdeye demo brand' },
  { id: 'local-seo', label: 'Local SEO identity' },
];

const LOCATION_OPTIONS = [
  { value: 'loc-1001', label: '1001 - Mountain View, CA' },
  { value: 'loc-1002', label: '1002 - Seattle, WA' },
  { value: 'loc-1003', label: '1003 - Dallas, TX' },
  { value: 'loc-1004', label: '1004 - Chicago, IL' },
  { value: 'loc-1005', label: '1005 - Los Angeles, CA' },
  { value: 'loc-1006', label: '1006 - Las Vegas, NV' },
  { value: 'loc-1007', label: '1007 - Austin, TX' },
  { value: 'loc-1008', label: '1008 - Houston, TX' },
  { value: 'loc-1009', label: '1009 - Phoenix, AZ' },
  { value: 'loc-1010', label: '1010 - Denver, CO' },
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FAQQuickSetupData {
  name: string;
  brandKit: string;
  locations: string[];
}

export interface FAQQuickSetupDrawerProps {
  open: boolean;
  onClose: () => void;
  onContinue: (data: FAQQuickSetupData) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FAQQuickSetupDrawer({ open, onClose, onContinue }: FAQQuickSetupDrawerProps) {
  const [name, setName] = useState('');
  const [brandKit, setBrandKit] = useState('olive-garden');
  const [locations, setLocations] = useState<string[]>([]);

  const canContinue = name.trim().length > 0 && locations.length > 0;

  function handleContinue() {
    if (!canContinue) return;
    onContinue({ name: name.trim(), brandKit, locations });
  }

  return (
    <Sheet open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <SheetContent
        side="right"
        inset="floating"
        floatingSize="lg"
        className="flex flex-col gap-0 p-0"
        onInteractOutside={e => e.preventDefault()}
      >
          {/* Header */}
          <div className="flex flex-none items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex size-[34px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                aria-label="Back"
              >
                <ArrowLeft size={16} strokeWidth={1.6} absoluteStrokeWidth />
              </button>
              <span className={CONTENT_FLOW_STEP_TITLE_CLASS}>Create FAQs</span>
            </div>
            <Button
              type="button"
              disabled={!canContinue}
              onClick={handleContinue}
            >
              Save
            </Button>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-8">
            {/* FAQ name */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-foreground">
                FAQ name <span className="text-destructive ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. LushGreen Landscaping"
                className={CONTENT_FLOW_FIELD_CLASS}
                autoFocus
              />
            </div>

            {/* Brand identity */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-foreground">
                Brand identity <span className="text-destructive ml-0.5">*</span>
              </label>
              <Select value={brandKit} onValueChange={setBrandKit}>
                <SelectTrigger className="h-[34px] rounded-md border-border-selected bg-surface text-body text-text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRAND_KITS.map(kit => (
                    <SelectItem key={kit.id} value={kit.id}>
                      {kit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Locations */}
            <div className="flex flex-col gap-2">
              <ContentFlowLocationFlatList
                values={locations}
                options={LOCATION_OPTIONS}
                onChange={setLocations}
                description="Choose the locations this project will apply to."
              />
              <div className="mt-1 flex items-center gap-1">
                <ContentFlowLocationInfoTooltip />
              </div>
            </div>
          </div>
        </SheetContent>
    </Sheet>
  );
}
