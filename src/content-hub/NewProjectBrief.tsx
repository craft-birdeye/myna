import React, { useState } from 'react';
import { ArrowLeft, Loader2, MapPin, FileText, MessageSquare, Mail, Share2, Star, Newspaper, Link2 } from 'lucide-react';
import { Button } from '@/contenthub-ui/button';
import { Badge } from '@/contenthub-ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/contenthub-ui/select';
import { cn } from '@/contenthub-ui/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ContentType = 'faq' | 'social' | 'email' | 'blog' | 'response' | 'ads';

export interface ContentTypeSelection {
  type: ContentType;
  label: string;
  icon: React.ReactNode;
  rationale: string;
  count: string;
  selected: boolean;
}

export interface ProjectBrief {
  name: string;
  goal: string;
  locations: string[];
  sourceContent?: string;
  suggestedMix: ContentTypeSelection[];
  campaignId?: string;
}

// ── Mock content mix ───────────────────────────────────────────────────────────

const MOCK_MIX: Omit<ContentTypeSelection, 'selected'>[] = [
  { type: 'faq',      label: 'FAQ page',         icon: <MessageSquare size={20} strokeWidth={1.6} absoluteStrokeWidth />, rationale: 'Address common questions about your launch before they become support tickets.', count: '12 FAQs' },
  { type: 'social',   label: 'Social posts',      icon: <Share2 size={20} strokeWidth={1.6} absoluteStrokeWidth />,       rationale: 'Drive awareness across Facebook, Instagram, and Google for all 500 locations.', count: '5 variations' },
  { type: 'email',    label: 'Email campaign',    icon: <Mail size={20} strokeWidth={1.6} absoluteStrokeWidth />,          rationale: 'Reach lapsed customers and high-value contacts with a personalised offer.', count: '3 emails' },
  { type: 'blog',     label: 'Blog post',         icon: <Newspaper size={20} strokeWidth={1.6} absoluteStrokeWidth />,    rationale: 'Capture organic search traffic for queries related to your launch topic.', count: '1 article' },
  { type: 'response', label: 'Review responses',  icon: <Star size={20} strokeWidth={1.6} absoluteStrokeWidth />,          rationale: 'Pre-build on-brand responses for anticipated feedback during the campaign.', count: '4 templates' },
  { type: 'ads',      label: 'Ad copy',           icon: <FileText size={20} strokeWidth={1.6} absoluteStrokeWidth />,     rationale: 'Supplement organic reach with targeted paid copy for your top markets.', count: '6 variants' },
];

const DEFAULT_SELECTED: ContentType[] = ['faq', 'social', 'email'];

const DEFAULT_LOCATIONS = ['All 500 locations', 'Downtown Chicago', 'Miami Beach'];

// ── Mock campaigns ─────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'completed';
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 'c-1', name: 'Spring 2025 — All locations',         status: 'active' },
  { id: 'c-2', name: 'Summer loyalty push',                 status: 'draft' },
  { id: 'c-3', name: 'Q4 holiday campaign',                 status: 'draft' },
  { id: 'c-4', name: 'Downtown Chicago re-engagement',      status: 'active' },
  { id: 'c-5', name: 'Miami Beach seasonal 2024',           status: 'completed' },
];

// ── Component ──────────────────────────────────────────────────────────────────

interface NewProjectBriefProps {
  onBack: () => void;
  onComplete: (brief: ProjectBrief) => void;
  /** When true the internal top-bar is hidden — CreateView topbar owns navigation */
  embedded?: boolean;
  /** Optional campaign ID pre-selected from parent */
  linkedCampaignId?: string;
}

export const NewProjectBrief = ({ onBack, onComplete, embedded = false, linkedCampaignId }: NewProjectBriefProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [analysing, setAnalysing] = useState(false);

  // Step 1 state
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [locations, setLocations] = useState<string[]>(DEFAULT_LOCATIONS);
  const [sourceExpanded, setSourceExpanded] = useState(false);
  const [sourceContent, setSourceContent] = useState('');
  const [campaignId, setCampaignId] = useState<string>(linkedCampaignId ?? '');

  // Step 2 state
  const [mix, setMix] = useState<ContentTypeSelection[]>(
    MOCK_MIX.map((m) => ({ ...m, selected: DEFAULT_SELECTED.includes(m.type) }))
  );

  const selectedCount = mix.filter((m) => m.selected).length;

  const handleAnalyse = () => {
    setAnalysing(true);
    setTimeout(() => {
      setAnalysing(false);
      setStep(2);
    }, 1200);
  };

  const handleComplete = () => {
    onComplete({
      name: name || 'New project',
      goal,
      locations,
      sourceContent,
      suggestedMix: mix,
      ...(campaignId ? { campaignId } : {}),
    });
  };

  const toggleMix = (type: ContentType) => {
    setMix((prev) => prev.map((m) => m.type === type ? { ...m, selected: !m.selected } : m));
  };

  const removeLocation = (loc: string) => {
    setLocations((prev) => prev.filter((l) => l !== loc));
  };

  return (
    <div className="flex flex-col h-full bg-muted overflow-hidden">
      {/* Top bar — hidden when embedded (CreateView topbar owns navigation) */}
      {!embedded && (
        <div className="bg-background border-b border-border px-6 py-2 flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={1.6} absoluteStrokeWidth />
            Back
          </button>
          <div className="h-4 w-px bg-border" />
          <span className="text-[13px] text-foreground">
            {step === 1 ? 'New project' : 'Suggested content mix'}
          </span>
          <Badge variant="secondary" className="ml-1 font-normal">Step {step} of 2</Badge>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-grow overflow-y-auto">
        <div className="max-w-[580px] mx-auto py-8 px-6 flex flex-col gap-6">

          {step === 1 && (
            <>
              <div>
                <h2 className="text-[15px] text-foreground mb-1">Tell us about your campaign</h2>
                <p className="text-[13px] text-muted-foreground">Fill in the details and AI will suggest the right content mix.</p>
              </div>

              {/* Project name */}
              <div>
                <label className="block text-[12px] text-muted-foreground mb-1">Project name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Spring promotion — Olive Garden"
                  className="w-full border border-input rounded-md h-[34px] px-2 text-[13px] bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Link to campaign (optional) */}
              <div>
                <label className="block text-[12px] text-muted-foreground mb-1">
                  Link to campaign <span className="font-normal">(optional)</span>
                </label>
                <Select value={campaignId || 'none'} onValueChange={value => setCampaignId(value === 'none' ? '' : value)}>
                  <SelectTrigger className="h-[34px] rounded-md border-input bg-background text-[13px]">
                    <span className="flex min-w-0 items-center gap-2">
                      <Link2 size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
                      <SelectValue />
                    </span>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="none">No campaign linked</SelectItem>
                    {MOCK_CAMPAIGNS.map(c => (
                      <SelectItem key={c.id} value={c.id} disabled={c.status === 'completed'}>
                        {c.name}{c.status === 'completed' ? ' (completed)' : c.status === 'draft' ? ' · Draft' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {campaignId && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Published content will be added to this campaign's content list.
                  </p>
                )}
              </div>

              {/* Locations */}
              <div>
                <label className="block text-[12px] text-muted-foreground mb-1">Locations</label>
                <div className="flex flex-wrap gap-2">
                  {locations.map((loc) => (
                    <span key={loc} className="flex items-center gap-1.5 bg-primary/10 text-primary text-[12px] rounded-full px-2 py-1">
                      <MapPin size={11} strokeWidth={1.6} absoluteStrokeWidth />
                      {loc}
                      <button onClick={() => removeLocation(loc)} className="text-primary/60 hover:text-primary ml-0.5 leading-none">×</button>
                    </span>
                  ))}
                  <button
                    onClick={() => setLocations((l) => [...l, 'New location'])}
                    className="text-[12px] text-muted-foreground hover:text-primary transition-colors px-1"
                  >
                    + Add location
                  </button>
                </div>
              </div>

              {/* Campaign goal */}
              <div>
                <label className="block text-[12px] text-muted-foreground mb-0.5">Campaign goal</label>
                <p className="text-[11px] text-muted-foreground mb-1">What outcome do you want?</p>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={3}
                  placeholder="e.g. Drive awareness of our new outdoor seating across spring"
                  className="w-full border border-input rounded-md px-2 py-2 text-[13px] bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Source content (optional collapsible) */}
              <div>
                <button
                  onClick={() => setSourceExpanded((v) => !v)}
                  className="text-[13px] text-primary flex items-center gap-1 hover:underline"
                >
                  {sourceExpanded ? '− ' : '＋ '}Add source content <span className="text-muted-foreground font-normal">(optional)</span>
                </button>
                {sourceExpanded && (
                  <textarea
                    value={sourceContent}
                    onChange={(e) => setSourceContent(e.target.value)}
                    rows={4}
                    placeholder="Paste a press release, product page, or brief…"
                    className="w-full mt-2 border border-input rounded-md px-2 py-2 text-[13px] bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                )}
              </div>

              <Button
                variant="default"
                className="self-end"
                disabled={analysing}
                onClick={handleAnalyse}
              >
                {analysing ? (
                  <><Loader2 size={14} strokeWidth={1.6} className="animate-spin mr-2" />Analysing brief…</>
                ) : 'Suggest content mix →'}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h2 className="text-[15px] text-foreground mb-1">Suggested content for this campaign</h2>
                <p className="text-[13px] text-muted-foreground">AI selected these based on your goal and locations. Edit the mix.</p>
                {campaignId && (() => {
                  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === campaignId);
                  return campaign ? (
                    <div className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <Link2 size={12} strokeWidth={1.6} absoluteStrokeWidth />
                      Linked to <span className="text-foreground">{campaign.name}</span>
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {mix.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => toggleMix(item.type)}
                    className={cn(
                      'flex flex-col gap-2 rounded-md border p-4 text-left transition-all relative',
                      item.selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-surface-hover',
                    )}
                  >
                    {/* Checkbox */}
                    <div className={cn(
                      'absolute top-3 right-3 w-4 h-4 rounded border-2 flex items-center justify-center',
                      item.selected ? 'border-primary bg-primary' : 'border-muted-foreground',
                    )}>
                      {item.selected && <span className="text-white text-[9px]">✓</span>}
                    </div>

                    <div className={cn('text-muted-foreground', item.selected && 'text-primary')}>
                      {item.icon}
                    </div>
                    <span className="text-[13px] text-foreground pr-4">{item.label}</span>
                    <p className="text-[11px] text-muted-foreground leading-snug">{item.rationale}</p>
                    <Badge variant="secondary" className="font-normal self-start text-[10px]">{item.count}</Badge>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      {step === 2 && (
        <div className="bg-background border-t border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
          <span className="text-[13px] text-muted-foreground">
            {selectedCount} content type{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Back</Button>
            <Button variant="default" size="sm" disabled={selectedCount === 0} onClick={handleComplete}>
              Create project →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
