/**
 * BlogWizardStep3 — Tune & publish
 *
 * Used for both 'blog' and 'landing' modes.
 * Collects: target audience, tone, article length, sections to include,
 * publish destinations, and approval flow.
 */

import React from 'react';
import { cn } from '@/contenthub-ui/utils';
import type { WizardMode } from './wizardTypes';
import { ContentFlowSelect, ContentFlowTextarea } from '../shared/ContentFlowControls';

const TONES = ['Professional', 'Friendly', 'Authoritative', 'Conversational', 'Empathetic'];

const LENGTHS = [
  { id: 'short',  label: 'Short',     sub: '~600 words' },
  { id: 'medium', label: 'Medium',    sub: '~1,200 words' },
  { id: 'long',   label: 'Long',      sub: '~2,500 words' },
];

const LANDING_LENGTHS = [
  { id: 'short',  label: 'Concise',   sub: '~400 words' },
  { id: 'medium', label: 'Standard',  sub: '~800 words' },
  { id: 'long',   label: 'Detailed',  sub: '~1,500 words' },
];

const BLOG_SECTIONS = [
  { id: 'intro',     label: 'Introduction' },
  { id: 'takeaways', label: 'Key takeaways' },
  { id: 'faq',       label: 'FAQ at end' },
  { id: 'cta',       label: 'CTA block' },
];

const LANDING_SECTIONS = [
  { id: 'hero',        label: 'Hero section' },
  { id: 'features',    label: 'Features / benefits' },
  { id: 'social',      label: 'Social proof' },
  { id: 'cta',         label: 'CTA block' },
];

const DESTINATIONS_BLOG = [
  { id: 'library',    label: 'Content library', disabled: true },
  { id: 'wordpress',  label: 'WordPress' },
  { id: 'linkedin',   label: 'LinkedIn draft' },
];

const DESTINATIONS_LANDING = [
  { id: 'library',    label: 'Content library', disabled: true },
  { id: 'wordpress',  label: 'WordPress' },
  { id: 'standalone', label: 'Create standalone page' },
];

const APPROVAL_OPTIONS = [
  { id: 'auto',   label: 'Auto-approve and publish' },
  { id: 'review', label: 'Require review before publishing' },
];

interface BlogWizardStep3Props {
  mode: WizardMode;
  step1Data: Record<string, unknown>;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

function PillRadio({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {options.map(opt => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            'flex flex-col items-start border rounded-lg px-4 py-2.5 cursor-pointer text-left transition-colors',
            value === opt.id
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40',
          )}
        >
          <span className="text-[13px] font-medium text-foreground">{opt.label}</span>
          {opt.sub && <span className="text-[11px] text-muted-foreground">{opt.sub}</span>}
        </button>
      ))}
    </div>
  );
}

export function BlogWizardStep3({ mode, step1Data: _s1, data, onChange }: BlogWizardStep3Props) {
  const audience     = (data.audience     as string)   ?? '';
  const tone         = (data.tone         as string)   ?? 'Professional';
  const length       = (data.length       as string)   ?? 'medium';
  const sections     = (data.sections     as string[]) ?? ['cta'];
  const destinations = (data.destinations as string[]) ?? ['library'];
  const approvalFlow = (data.approvalFlow as string)   ?? 'review';

  const availableLengths   = mode === 'landing' ? LANDING_LENGTHS   : LENGTHS;
  const availableSections  = mode === 'landing' ? LANDING_SECTIONS  : BLOG_SECTIONS;
  const availableDests     = mode === 'landing' ? DESTINATIONS_LANDING : DESTINATIONS_BLOG;

  function toggleSection(id: string) {
    const next = sections.includes(id) ? sections.filter(s => s !== id) : [...sections, id];
    onChange({ ...data, sections: next });
  }

  function toggleDestination(id: string) {
    const next = destinations.includes(id) ? destinations.filter(d => d !== id) : [...destinations, id];
    onChange({ ...data, destinations: next });
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Target audience */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-foreground">Target audience</label>
        <ContentFlowTextarea
          rows={2}
          value={audience}
          onChange={e => onChange({ ...data, audience: e.target.value })}
          placeholder="Describe who this content is for..."
        />
        <p className="text-[12px] text-muted-foreground">From your brand identity · edit freely</p>
      </div>

      {/* Tone */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-foreground">Tone of voice</label>
        <ContentFlowSelect
          value={tone}
          onChange={value => onChange({ ...data, tone: value })}
          options={TONES.map(toneOption => ({ value: toneOption, label: toneOption }))}
        />
      </div>

      {/* Length */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-foreground">
          {mode === 'landing' ? 'Page length' : 'Article length'}
        </label>
        <PillRadio
          options={availableLengths}
          value={length}
          onChange={v => onChange({ ...data, length: v })}
        />
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-foreground">Include sections</label>
        <div className="flex flex-wrap gap-2">
          {availableSections.map(s => {
            const checked = sections.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSection(s.id)}
                className={cn(
                  'border rounded-full px-3 py-1.5 text-[12px] transition-colors',
                  checked
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/40',
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Publish destinations */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-foreground">Publish destinations</label>
        {availableDests.map(dest => {
          const checked = dest.disabled || destinations.includes(dest.id);
          return (
            <label
              key={dest.id}
              className={cn(
                'flex items-center gap-3 cursor-pointer',
                dest.disabled && 'opacity-60 cursor-not-allowed',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={dest.disabled}
                onChange={() => !dest.disabled && toggleDestination(dest.id)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-[13px] text-foreground">{dest.label}</span>
            </label>
          );
        })}
      </div>

      {/* Approval flow */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-foreground">Approval flow</label>
        <div className="flex flex-wrap gap-2">
          {APPROVAL_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange({ ...data, approvalFlow: opt.id })}
              className={cn(
                'border rounded-full px-3 py-1.5 text-[12px] transition-colors',
                approvalFlow === opt.id
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/40',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
