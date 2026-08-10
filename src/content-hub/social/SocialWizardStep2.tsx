import React from 'react';
import { MapPin, Sparkles } from 'lucide-react';
import { ContentFlowChip } from '../shared/ContentFlowControls';

const SOURCE_OPTIONS = [
  { id: 'brief',   label: 'Write a brief',       placeholder: 'Describe what the post should be about…' },
  { id: 'url',     label: 'Use product page URL', placeholder: 'https://your-site.com/product-page' },
  { id: 'paste',   label: 'Paste copy',           placeholder: 'Paste existing copy to rewrite or adapt…' },
];

const DEFAULT_LOCATIONS = ['All 500 locations', 'Downtown Chicago', 'Miami Beach'];

interface SocialWizardStep2Props {
  sourceType: string;
  onSourceTypeChange: (t: string) => void;
  sourceText: string;
  onSourceTextChange: (t: string) => void;
  locations: string[];
  onLocationsChange: (l: string[]) => void;
  useSentiment: boolean;
  onUseSentimentChange: (v: boolean) => void;
}

export const SocialWizardStep2 = ({
  sourceType,
  onSourceTypeChange,
  sourceText,
  onSourceTextChange,
  locations,
  onLocationsChange,
  useSentiment,
  onUseSentimentChange,
}: SocialWizardStep2Props) => {
  const selected = SOURCE_OPTIONS.find((o) => o.id === sourceType) ?? SOURCE_OPTIONS[0];

  const removeLocation = (loc: string) => onLocationsChange(locations.filter((l) => l !== loc));

  return (
    <div className="max-w-[600px] mx-auto p-8 flex flex-col gap-6">
      {/* Birdeye auto-suggest banner */}
      <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-[8px] px-4 py-2">
        <Sparkles size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-[13px] text-foreground">
            Birdeye found 12 recent reviews mentioning your promo — use them as inspiration?
          </p>
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useSentiment}
              onChange={(e) => onUseSentimentChange(e.target.checked)}
              className="accent-primary"
            />
            <span className="text-[12px] text-muted-foreground">Include customer sentiment from reviews</span>
          </label>
        </div>
      </div>

      {/* Source selector */}
      <div>
        <p className="text-[12px] text-muted-foreground uppercase tracking-wide mb-3">Source content</p>
        <div className="flex gap-2 mb-3">
          {SOURCE_OPTIONS.map((opt) => (
            <ContentFlowChip
              key={opt.id}
              label={opt.label}
              selected={sourceType === opt.id}
              onClick={() => onSourceTypeChange(opt.id)}
            />
          ))}
        </div>
        {sourceType === 'url' ? (
          <input
            value={sourceText}
            onChange={(e) => onSourceTextChange(e.target.value)}
            placeholder={selected.placeholder}
            className="w-full border border-input rounded-md h-[34px] px-2 text-[13px] bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        ) : (
          <textarea
            value={sourceText}
            onChange={(e) => onSourceTextChange(e.target.value)}
            rows={4}
            placeholder={selected.placeholder}
            className="w-full border border-input rounded-md px-2 py-2 text-[13px] bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        )}
      </div>

      {/* Locations */}
      <div>
        <p className="text-[12px] text-muted-foreground uppercase tracking-wide mb-3">Location targeting</p>
        <div className="flex flex-wrap gap-2">
          {locations.map((loc) => (
            <span key={loc} className="flex items-center gap-1.5 bg-primary/10 text-primary text-[12px] rounded-full px-2 py-1">
              <MapPin size={11} strokeWidth={1.6} absoluteStrokeWidth />
              {loc}
              <button onClick={() => removeLocation(loc)} className="text-primary/60 hover:text-primary ml-0.5">×</button>
            </span>
          ))}
          <button
            onClick={() => onLocationsChange([...locations, 'New location'])}
            className="text-[12px] text-muted-foreground hover:text-primary transition-colors px-1"
          >
            + Add location
          </button>
        </div>
      </div>
    </div>
  );
};
