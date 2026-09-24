import React from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';

const SEGMENTS = [
  { id: 'all',     label: 'All contacts',       sub: '500 contacts across 10 locations' },
  { id: 'recent',  label: 'Recent visitors',     sub: 'Visited in last 90 days' },
  { id: 'lapsed',  label: 'Lapsed customers',    sub: 'No visit in 6+ months' },
  { id: 'high',    label: 'High-value',          sub: 'Top 20% by spend' },
];

const DEFAULT_TOKENS = ['First name', 'Location name', 'Last visit date', 'Top service'];
const DEFAULT_LOCATIONS = ['All 500 locations', 'Downtown Chicago', 'Miami Beach'];

interface EmailWizardStep2Props {
  segments: string[];
  onSegmentsChange: (s: string[]) => void;
  tokens: string[];
  onTokensChange: (t: string[]) => void;
  locations: string[];
  onLocationsChange: (l: string[]) => void;
}

export const EmailWizardStep2 = ({
  segments, onSegmentsChange,
  tokens, onTokensChange,
  locations, onLocationsChange,
}: EmailWizardStep2Props) => {
  const toggleSegment = (id: string) => {
    onSegmentsChange(
      segments.includes(id) ? segments.filter((s) => s !== id) : [...segments, id]
    );
  };
  const toggleToken = (t: string) => {
    onTokensChange(
      tokens.includes(t) ? tokens.filter((tk) => tk !== t) : [...tokens, t]
    );
  };
  const removeLocation = (loc: string) => onLocationsChange(locations.filter((l) => l !== loc));

  return (
    <div className="max-w-[600px] mx-auto p-8 flex flex-col gap-6">

      {/* Audience segments */}
      <div>
        <p className="text-[12px] text-muted-foreground uppercase tracking-wide mb-4">Audience segment</p>
        <div className="grid grid-cols-2 gap-4">
          {SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              onClick={() => toggleSegment(seg.id)}
              className={cn(
                'flex flex-col gap-1 rounded-[8px] border p-4 text-left transition-all',
                segments.includes(seg.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-surface-hover',
              )}
            >
              <span className="text-[13px] text-foreground">{seg.label}</span>
              <span className="text-[11px] text-muted-foreground">{seg.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Personalisation tokens */}
      <div>
        <p className="text-[12px] text-muted-foreground uppercase tracking-wide mb-1">Personalisation</p>
        <p className="text-[12px] text-muted-foreground mb-4">AI will personalise using:</p>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_TOKENS.map((t) => (
            <button
              key={t}
              onClick={() => toggleToken(t)}
              className={cn(
                'rounded-full border px-2 py-1 text-[12px] transition-all',
                tokens.includes(t)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              [{t}]
            </button>
          ))}
        </div>
      </div>

      {/* Locations */}
      <div>
        <p className="text-[12px] text-muted-foreground uppercase tracking-wide mb-4">Location targeting</p>
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
