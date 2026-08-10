/**
 * ProjectWizardStep3 — Tune & publish
 *
 * Collects: objective, target audience, tone, content mix (adjustable
 * per content type), optional target date, and approval flow.
 */

import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { ContentFlowSelect, ContentFlowTextarea } from '../shared/ContentFlowControls';
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_BY_LABEL } from '../shared/socialPlatforms';

// ── Content mix defaults per project type ─────────────────────────────────────

const TYPE_MIX_DEFAULTS: Record<string, { type: string; count: number }[]> = {
  campaign: [
    { type: 'Blog post',       count: 1 },
    { type: 'Facebook post',   count: 2 },
    { type: 'Instagram post',  count: 2 },
    { type: 'LinkedIn post',   count: 1 },
    { type: 'Email',           count: 1 },
  ],
  location: [
    { type: 'FAQ',            count: 1 },
    { type: 'Facebook post',  count: 2 },
    { type: 'Instagram post', count: 1 },
  ],
  launch: [
    { type: 'Landing page', count: 1 },
    { type: 'Blog post',    count: 1 },
    { type: 'FAQ',          count: 1 },
  ],
  reviews: [
    { type: 'Review responses', count: 10 },
  ],
  custom: [
    { type: 'Blog post', count: 1 },
  ],
};

const SOCIAL_TYPE_LABELS = SOCIAL_PLATFORMS.map(p => p.label);

const ALL_CONTENT_TYPES = [
  'Blog post',
  ...SOCIAL_TYPE_LABELS,
  'Email',
  'FAQ',
  'Landing page',
  'Review responses',
];

const OBJECTIVES = [
  { id: 'visibility', label: 'Search visibility',  description: 'Rank in Google SGE, AI answer engines, and featured snippets' },
  { id: 'support',    label: 'Customer support',   description: 'Reduce repetitive support questions with self-serve answers' },
  { id: 'conversion', label: 'Conversion',          description: 'Answer objections and build trust to convert more visitors' },
];

const TONES = ['Professional', 'Friendly', 'Authoritative', 'Conversational', 'Empathetic'];

const APPROVAL_OPTIONS = [
  { id: 'auto',   label: 'Auto-approve and publish' },
  { id: 'review', label: 'Require review before publishing' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface ContentMixItem { type: string; count: number }

interface ProjectWizardStep3Props {
  step1Data: Record<string, unknown>;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectWizardStep3({ step1Data, data, onChange }: ProjectWizardStep3Props) {
  const projectType  = (step1Data.projectType as string) ?? 'campaign';
  const objective    = (data.objective    as string)            ?? 'visibility';
  const audience     = (data.audience     as string)            ?? '';
  const tone         = (data.tone         as string)            ?? 'Professional';
  const approvalFlow = (data.approvalFlow  as string)            ?? 'review';
  const contentMix   = (data.contentMix   as ContentMixItem[])  ?? TYPE_MIX_DEFAULTS[projectType] ?? TYPE_MIX_DEFAULTS.campaign;

  function setMix(mix: ContentMixItem[]) {
    onChange({ ...data, contentMix: mix });
  }

  function adjustCount(type: string, delta: number) {
    const next = contentMix.map(m =>
      m.type === type ? { ...m, count: Math.max(1, m.count + delta) } : m,
    );
    setMix(next);
  }

  function removeType(type: string) {
    setMix(contentMix.filter(m => m.type !== type));
  }

  function addType(type: string) {
    if (!contentMix.find(m => m.type === type)) {
      setMix([...contentMix, { type, count: 1 }]);
    }
  }

  const unusedTypes = ALL_CONTENT_TYPES.filter(t => !contentMix.find(m => m.type === t));

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Objective */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-foreground">Objective</label>
        <div className="flex flex-col gap-2">
          {OBJECTIVES.map(obj => {
            const selected = objective === obj.id;
            return (
              <button
                key={obj.id}
                type="button"
                onClick={() => onChange({ ...data, objective: obj.id })}
                className={cn(
                  'relative flex items-center gap-3 text-left bg-background rounded-lg px-4 py-3 transition-all',
                  selected ? '' : 'border border-border hover:border-primary/40',
                )}
                style={selected ? { border: '2px solid var(--color-primary)' } : undefined}
              >
                <div className="flex-1 flex flex-col gap-0.5">
                  <p className="text-[13px] font-medium text-foreground">{obj.label}</p>
                  <p className="text-[12px] text-muted-foreground leading-snug">{obj.description}</p>
                </div>
                <div className={cn(
                  'size-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                  selected ? 'bg-primary border-primary' : 'border-border',
                )}>
                  {selected && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Audience */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-foreground">Target audience</label>
        <ContentFlowTextarea
          rows={2}
          value={audience}
          onChange={e => onChange({ ...data, audience: e.target.value })}
          placeholder="Describe who this project is for..."
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

      {/* Content mix */}
      <div className="flex flex-col gap-3">
        <label className="text-[13px] font-medium text-foreground">Content mix</label>
        {contentMix.map(item => {
          const socialDef = SOCIAL_PLATFORM_BY_LABEL.get(item.type);
          return (
          <div key={item.type} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-background">
            {socialDef ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <socialDef.Logo size={16} />
                <span className="text-[13px] text-foreground">{item.type}</span>
              </div>
            ) : (
              <span className="flex-1 text-[13px] text-foreground">{item.type}</span>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustCount(item.type, -1)}
                disabled={item.count <= 1}
                className="size-6 flex items-center justify-center rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-40"
              >
                <Minus size={12} strokeWidth={1.6} absoluteStrokeWidth />
              </button>
              <span className="text-[13px] font-medium text-foreground w-4 text-center">{item.count}</span>
              <button
                type="button"
                onClick={() => adjustCount(item.type, 1)}
                className="size-6 flex items-center justify-center rounded-md border border-border hover:bg-muted transition-colors"
              >
                <Plus size={12} strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </div>
            <button
              type="button"
              onClick={() => removeType(item.type)}
              className="text-muted-foreground hover:text-foreground text-[11px] px-2 py-1 rounded hover:bg-muted transition-colors"
            >
              Remove
            </button>
          </div>
          );
        })}

        {/* Add type */}
        {unusedTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {unusedTypes.map(t => {
              const socialDef = SOCIAL_PLATFORM_BY_LABEL.get(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => addType(t)}
                  className="flex items-center gap-1.5 border border-dashed border-border rounded-full px-3 py-1 text-[12px] text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                >
                  {socialDef ? (
                    <socialDef.Logo size={13} />
                  ) : (
                    <Plus size={11} strokeWidth={1.6} absoluteStrokeWidth />
                  )}
                  {t}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border" />

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
