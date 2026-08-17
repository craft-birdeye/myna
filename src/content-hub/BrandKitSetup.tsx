import React, { useState, useEffect } from 'react';
import { Upload, MapPin } from 'lucide-react';
import { Button } from '@/contenthub-ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/contenthub-ui/sheet';
import { cn } from '@/contenthub-ui/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

export type BrandVoiceOption = 'professional' | 'friendly' | 'playful' | 'authoritative';

export interface BrandKit {
  businessName: string;
  tagline: string;
  brandVoice: BrandVoiceOption;
  toneNotes: string;
  primaryColor: string;
  locations: string[];
  styleGuideUrl?: string;
}

interface BrandKitSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (kit: BrandKit) => void;
  initialKit?: BrandKit | null;
}

// ── Brand voice cards ──────────────────────────────────────────────────────────

const VOICE_OPTIONS: Array<{ id: BrandVoiceOption; label: string; description: string; emoji: string }> = [
  { id: 'professional',  label: 'Professional',  description: 'Polished, credible, expert',   emoji: '💼' },
  { id: 'friendly',      label: 'Friendly',       description: 'Warm, approachable, helpful',  emoji: '😊' },
  { id: 'playful',       label: 'Playful',        description: 'Fun, witty, conversational',   emoji: '🎉' },
  { id: 'authoritative', label: 'Authoritative',  description: 'Bold, confident, decisive',    emoji: '🎯' },
];

const DEFAULT_LOCATIONS = ['All 500 locations', 'Downtown Chicago', 'Miami Beach'];

const DEFAULT_KIT: BrandKit = {
  businessName: 'Olive Garden Corporate',
  tagline: '',
  brandVoice: 'friendly',
  toneNotes: '',
  primaryColor: '#1E44CC',
  locations: DEFAULT_LOCATIONS,
  styleGuideUrl: '',
};

// ── Component ──────────────────────────────────────────────────────────────────

export const BrandKitSetup = ({ open, onOpenChange, onSave, initialKit }: BrandKitSetupProps) => {
  const [kit, setKit] = useState<BrandKit>(initialKit ?? DEFAULT_KIT);
  const [styleDropActive, setStyleDropActive] = useState(false);
  const [styleUploaded, setStyleUploaded] = useState(false);

  // Sync when initialKit changes (e.g. re-opening after save)
  useEffect(() => {
    if (initialKit) setKit(initialKit);
  }, [initialKit]);

  const removeLocation = (loc: string) => {
    setKit((k) => ({ ...k, locations: k.locations.filter((l) => l !== loc) }));
  };

  const handleSave = () => {
    onSave(kit);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" inset="floating" floatingSize="md" className="flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <SheetTitle>Brand identity</SheetTitle>
          <SheetDescription>
            Set once. Applied to every content type automatically.
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-grow overflow-y-auto px-6 py-5 flex flex-col gap-6">

          {/* Business */}
          <section>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Business</p>
            <div className="flex flex-col gap-2">
              <div>
                <label className="block text-[12px] text-muted-foreground mb-1">Business name</label>
                <input
                  value={kit.businessName}
                  onChange={(e) => setKit((k) => ({ ...k, businessName: e.target.value }))}
                  className="w-full border border-input rounded-md h-[34px] px-2 text-[13px] bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-[12px] text-muted-foreground mb-1">Tagline</label>
                <input
                  value={kit.tagline}
                  onChange={(e) => setKit((k) => ({ ...k, tagline: e.target.value }))}
                  placeholder={`e.g. "When you're here, you're family"`}
                  className="w-full border border-input rounded-md h-[34px] px-2 text-[13px] bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </section>

          {/* Brand voice */}
          <section>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Brand voice</p>
            <div className="grid grid-cols-2 gap-2">
              {VOICE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setKit((k) => ({ ...k, brandVoice: opt.id }))}
                  className={cn(
                    'flex flex-col gap-1 rounded-[8px] border p-4 text-left transition-all',
                    kit.brandVoice === opt.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-surface-hover',
                  )}
                >
                  <span className="text-[16px]">{opt.emoji}</span>
                  <span className="text-[12px] text-foreground">{opt.label}</span>
                  <span className="text-[11px] text-muted-foreground">{opt.description}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Tone notes */}
          <section>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Tone notes</p>
            <textarea
              value={kit.toneNotes}
              onChange={(e) => setKit((k) => ({ ...k, toneNotes: e.target.value }))}
              rows={3}
              placeholder={"Any nuances? e.g. 'Always warm, never salesy. Use first names. Avoid corporate jargon.'"}
              className="w-full border border-input rounded-md px-2 py-2 text-[13px] bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </section>

          {/* Locations */}
          <section>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Locations</p>
            <div className="flex flex-wrap gap-2">
              {kit.locations.map((loc) => (
                <span
                  key={loc}
                  className="flex items-center gap-1.5 bg-primary/10 text-primary text-[12px] rounded-full px-2 py-1"
                >
                  <MapPin size={11} strokeWidth={1.6} absoluteStrokeWidth />
                  {loc}
                  <button
                    onClick={() => removeLocation(loc)}
                    className="text-primary/60 hover:text-primary ml-1 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={() => setKit((k) => ({ ...k, locations: [...k.locations, 'New location'] }))}
                className="text-[12px] text-primary hover:underline px-1"
              >
                + Add location
              </button>
            </div>
          </section>

          {/* Style guide */}
          <section>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Style guide <span className="normal-case font-normal">(optional)</span></p>
            {styleUploaded ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-green-200 rounded-[8px]">
                <span className="text-[12px] text-text-primary">✓ style-guide.pdf uploaded</span>
                <button onClick={() => setStyleUploaded(false)} className="ml-auto text-[11px] text-muted-foreground hover:text-foreground">Remove</button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setStyleDropActive(true); }}
                onDragLeave={() => setStyleDropActive(false)}
                onDrop={(e) => { e.preventDefault(); setStyleDropActive(false); setStyleUploaded(true); }}
                className={cn(
                  'border-2 border-dashed rounded-[8px] p-4 text-center transition-colors cursor-pointer',
                  styleDropActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                )}
              >
                <Upload size={16} strokeWidth={1.6} absoluteStrokeWidth className="mx-auto text-muted-foreground mb-2" />
                <p className="text-[12px] text-muted-foreground">Drop a PDF or paste a URL</p>
                <input
                  value={kit.styleGuideUrl}
                  onChange={(e) => setKit((k) => ({ ...k, styleGuideUrl: e.target.value }))}
                  placeholder="https://brand.example.com/guide"
                  className="mt-2 w-full border border-input rounded-md h-[34px] px-2 text-[12px] bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <SheetFooter className="px-6 py-4 border-t border-border flex-shrink-0 flex flex-row justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="default" size="sm" onClick={handleSave}>
            Save brand identity
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
