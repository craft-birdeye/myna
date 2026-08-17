/**
 * ProjectWizardStep2 — Source & context
 *
 * Collects the raw material the AI will use when building the project:
 * campaign brief, reference URLs, uploaded files, and data source toggles.
 */

import React, { useState } from 'react';
import { Sparkles, X, Plus } from 'lucide-react';
import { Button } from '@/contenthub-ui/button';
import { cn } from '@/contenthub-ui/utils';
import { ContentFlowInfoLabel, ContentFlowTextarea, ContentFlowTextInput } from '../shared/ContentFlowControls';

interface ProjectWizardStep2Props {
  step1Data: Record<string, unknown>;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export function ProjectWizardStep2({ step1Data: _s1, data, onChange }: ProjectWizardStep2Props) {
  const brief       = (data.brief       as string)   ?? '';
  const refUrls     = (data.refUrls     as string[]) ?? [];
  const sources     = (data.sources     as string[]) ?? ['reviews'];

  const [urlInput, setUrlInput] = useState('');

  function handleAutoFill() {
    onChange({ ...data, brief: 'Spring landscaping campaign for homeowners in suburban US markets. Goal: drive bookings for lawn care and garden design packages. All 10 locations active.' });
  }

  function addUrl() {
    if (!urlInput.trim()) return;
    onChange({ ...data, refUrls: [...refUrls, urlInput.trim()] });
    setUrlInput('');
  }

  function removeUrl(i: number) {
    onChange({ ...data, refUrls: refUrls.filter((_, idx) => idx !== i) });
  }

  function toggleSource(src: string) {
    const next = sources.includes(src) ? sources.filter(s => s !== src) : [...sources, src];
    onChange({ ...data, sources: next });
  }

  const DATA_SOURCES = [
    { id: 'reviews', label: 'Birdeye reviews',   sub: '3,421 reviews available' },
    { id: 'tickets', label: 'Support tickets',    sub: 'Upload CSV to connect' },
    { id: 'nps',     label: 'NPS responses',      sub: 'Upload CSV to connect' },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Auto-suggest */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
        <Sparkles size={15} strokeWidth={1.6} absoluteStrokeWidth className="text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground">Use your project context</p>
          <p className="text-[12px] text-muted-foreground">We found recent campaign data from your brand identity</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleAutoFill}>
          Use this
        </Button>
      </div>

      {/* Campaign brief */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-foreground">Campaign brief</label>
        <ContentFlowTextarea
          rows={4}
          value={brief}
          onChange={e => onChange({ ...data, brief: e.target.value })}
          placeholder="Describe what this project is about — the goal, audience, key messages, and any important context..."
        />
      </div>

      {/* Reference URLs */}
      <div className="flex flex-col gap-2">
        <ContentFlowInfoLabel tooltip="Add source pages for the AI to reference while building the project.">
          Reference URLs
        </ContentFlowInfoLabel>
        <div className="flex items-center gap-2">
          <ContentFlowTextInput
            type="text"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
            placeholder="https://example.com/page"
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={addUrl} disabled={!urlInput.trim()}>
            <Plus size={14} strokeWidth={1.6} absoluteStrokeWidth />
            Add
          </Button>
        </div>
        {refUrls.length > 0 && (
          <div className="flex flex-col gap-1">
            {refUrls.map((url, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-[12px]">
                <span className="flex-1 text-foreground truncate">{url}</span>
                <button
                  type="button"
                  onClick={() => removeUrl(i)}
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  <X size={12} strokeWidth={1.6} absoluteStrokeWidth />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File attachment */}
      <div className="flex flex-col gap-2">
        <ContentFlowInfoLabel tooltip="Attach supporting files for the AI to reference.">
          Attach files
        </ContentFlowInfoLabel>
        <div className={cn(
          'border-2 border-dashed border-border rounded-lg p-6 text-center',
          'flex flex-col items-center gap-2',
          'hover:border-primary/40 hover:bg-muted/30 transition-colors cursor-pointer',
        )}>
          <p className="text-[13px] text-foreground font-medium">Drop files or click to browse</p>
          <p className="text-[12px] text-muted-foreground">Accepts .pdf .docx .txt .png .jpg</p>
        </div>
      </div>

      {/* Data sources */}
      <div className="flex flex-col gap-3">
        <label className="text-[13px] font-medium text-foreground">Data sources</label>
        {DATA_SOURCES.map(src => (
          <div key={src.id} className="flex items-center gap-3 p-4 border border-border rounded-lg bg-background">
            <button
              type="button"
              onClick={() => toggleSource(src.id)}
              className={cn(
                'w-9 h-5 rounded-full transition-colors relative flex-shrink-0',
                sources.includes(src.id) ? 'bg-primary' : 'bg-muted border border-border',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-4 bg-white rounded-full transition-transform',
                  sources.includes(src.id) ? 'translate-x-4' : 'translate-x-0.5',
                )}
              />
            </button>
            <div>
              <p className="text-[13px] font-medium text-foreground">{src.label}</p>
              <p className="text-[12px] text-muted-foreground">{src.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
