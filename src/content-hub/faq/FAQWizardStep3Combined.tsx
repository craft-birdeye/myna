import React, { useState } from 'react';
import { cn } from '@/contenthub-ui/utils';
import { STATUS_COLORS } from '../shared/scoreColors';
import { ContentFlowSelect, ContentFlowTextarea } from '../shared/ContentFlowControls';

interface GoalData {
  objective: string;
  persona: string;
  tone: string;
  readingLevel: string;
  faqCount: number;
}

interface OutputData {
  destinations: string[];
  schemaMarkup: string;
  approvalFlow: string;
}

interface FAQWizardStep3CombinedProps {
  goalData: GoalData;
  outputData: OutputData;
  onGoalDataChange: (data: GoalData) => void;
  onOutputDataChange: (data: OutputData) => void;
}

const OBJECTIVES = [
  { id: 'visibility', label: 'Search visibility', description: 'Rank in Google SGE, AI answer engines, and featured snippets' },
  { id: 'support', label: 'Customer support', description: 'Reduce repetitive support questions with self-serve answers' },
  { id: 'conversion', label: 'Conversion', description: 'Answer objections and build trust to convert more visitors' },
];

const TONES = ['Professional', 'Friendly', 'Authoritative', 'Conversational', 'Empathetic'];

const PRIMARY_DESTINATIONS = [
  { id: 'library', label: 'Content library', disabled: true },
  { id: 'searchai', label: 'SearchAI', helper: 'Recommended for visibility' },
  { id: 'website', label: 'Embed on website' },
];

const MORE_DESTINATIONS = [
  { id: 'helpcenter', label: 'Add to help center' },
  { id: 'standalone', label: 'Create standalone FAQ page' },
  { id: 'social', label: 'Crosspost to social' },
  { id: 'json', label: 'Export as JSON' },
];

const SCHEMA_OPTIONS = [
  { id: 'jsonld', label: 'JSON-LD schema markup', sub: 'Recommended' },
  { id: 'microdata', label: 'Inline microdata', sub: '' },
  { id: 'none', label: 'No schema markup', sub: '' },
];

const APPROVAL_OPTIONS = [
  { id: 'auto', label: 'Auto-approve and publish to selected destinations' },
  { id: 'review', label: 'Require review before publishing' },
];

export const FAQWizardStep3Combined = ({
  goalData,
  outputData,
  onGoalDataChange,
  onOutputDataChange,
}: FAQWizardStep3CombinedProps) => {
  const [showMore, setShowMore] = useState(false);

  const updateGoal = (patch: Partial<GoalData>) => onGoalDataChange({ ...goalData, ...patch });
  const updateOutput = (patch: Partial<OutputData>) => onOutputDataChange({ ...outputData, ...patch });

  const toggleDestination = (id: string) => {
    const next = outputData.destinations.includes(id)
      ? outputData.destinations.filter(d => d !== id)
      : [...outputData.destinations, id];
    updateOutput({ destinations: next });
  };

  // Auto-check SearchAI when visibility is selected
  const handleObjectiveChange = (id: string) => {
    updateGoal({ objective: id });
    if (id === 'visibility' && !outputData.destinations.includes('searchai')) {
      updateOutput({ destinations: [...outputData.destinations, 'searchai'] });
    }
  };

  const candidateCount = Math.round(goalData.faqCount * 1.5);

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl overflow-y-auto">

      {/* ── SECTION 1: Goal & Audience ── */}
      <div className="flex flex-col gap-4">
        {/* Objective radio cards */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] text-foreground">Objective</label>
          <div className="flex flex-col gap-2">
            {OBJECTIVES.map(obj => {
              const isSelected = goalData.objective === obj.id;
              return (
                <button
                  key={obj.id}
                  onClick={() => handleObjectiveChange(obj.id)}
                  className={cn(
                    'relative text-left bg-background rounded-[8px] px-4 py-2 flex flex-row items-center gap-2 transition-all',
                    isSelected ? '' : 'border border-border hover:border-primary/40',
                  )}
                  style={isSelected ? { border: '2px solid var(--color-primary)' } : undefined}
                >
                  <div className="flex-1 flex flex-col gap-0.5">
                    <p className="text-[13px] text-foreground">{obj.label}</p>
                    <p className="text-[12px] text-muted-foreground leading-snug">{obj.description}</p>
                  </div>
                  <div className={cn(
                    'w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors',
                    isSelected ? 'bg-primary border-primary' : 'border-border',
                  )}>
                    {isSelected && (
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

        {/* Audience persona */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-foreground">Target audience</label>
          <ContentFlowTextarea
            rows={2}
            value={goalData.persona}
            onChange={(e) => updateGoal({ persona: e.target.value })}
          />
          <p className="text-[12px] text-muted-foreground">From your brand identity · edit freely</p>
        </div>

        {/* Tone + Reading level inline */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[13px] text-foreground">Tone of voice</label>
            <ContentFlowSelect
              value={goalData.tone}
              onChange={value => updateGoal({ tone: value })}
              options={TONES.map(tone => ({ value: tone, label: tone }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-foreground">Reading level</label>
            <div className="flex items-center gap-2 h-[38px]">
              {[
                { id: 'general', label: 'General' },
                { id: 'expert', label: 'Expert' },
              ].map(opt => (
                <label key={opt.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="readingLevel"
                    value={opt.id}
                    checked={goalData.readingLevel === opt.id}
                    onChange={() => updateGoal({ readingLevel: opt.id })}
                    className="accent-primary"
                  />
                  <span className="text-[13px] text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ count slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[13px] text-foreground">Number of FAQs</label>
            <span className="text-[12px] text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              {goalData.faqCount} FAQs
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={25}
            step={1}
            value={goalData.faqCount}
            onChange={(e) => updateGoal({ faqCount: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <p className="text-[12px] text-muted-foreground">
            We'll generate up to {candidateCount} candidates, then keep the best {goalData.faqCount}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* ── SECTION 2: Output & Publishing ── */}
      <div className="flex flex-col gap-4">

        {/* Destinations */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] text-foreground">Publish destinations</label>
          {PRIMARY_DESTINATIONS.map(dest => {
            const isChecked = dest.disabled || outputData.destinations.includes(dest.id);
            return (
              <label
                key={dest.id}
                className={cn(
                  'flex items-center gap-2 cursor-pointer',
                  dest.disabled && 'opacity-60 cursor-not-allowed'
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={dest.disabled}
                  onChange={() => !dest.disabled && toggleDestination(dest.id)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-[13px] text-foreground">{dest.label}</span>
                {'helper' in dest && dest.helper && isChecked && (
                  <span className="text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-md">{dest.helper}</span>
                )}
              </label>
            );
          })}

          <button
            onClick={() => setShowMore(!showMore)}
            className="text-[13px] text-primary flex items-center gap-1 w-fit hover:underline mt-1"
          >
            {showMore ? 'Fewer options ▴' : 'More options ▸'}
          </button>

          {showMore && MORE_DESTINATIONS.map(dest => (
            <label key={dest.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={outputData.destinations.includes(dest.id)}
                onChange={() => toggleDestination(dest.id)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-[13px] text-foreground">{dest.label}</span>
            </label>
          ))}
        </div>

        {/* Schema markup pills */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] text-foreground">Schema markup</label>
          <div className="flex items-center gap-2 flex-wrap">
            {SCHEMA_OPTIONS.map(opt => (
              <label
                key={opt.id}
                className={cn(
                  'flex items-center gap-2 border rounded-full px-2 py-1.5 cursor-pointer text-[12px] transition-colors',
                  outputData.schemaMarkup === opt.id
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                )}
              >
                <input
                  type="radio"
                  name="schemaMarkup"
                  value={opt.id}
                  checked={outputData.schemaMarkup === opt.id}
                  onChange={() => updateOutput({ schemaMarkup: opt.id })}
                  className="sr-only"
                />
                {opt.label}
                {opt.sub && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: STATUS_COLORS.ready.bg, color: STATUS_COLORS.ready.text }}>{opt.sub}</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Approval flow pills */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] text-foreground">Approval flow</label>
          <div className="flex items-center gap-2 flex-wrap">
            {APPROVAL_OPTIONS.map(opt => (
              <label
                key={opt.id}
                className={cn(
                  'flex items-center gap-2 border rounded-full px-2 py-1.5 cursor-pointer text-[12px] transition-colors',
                  outputData.approvalFlow === opt.id
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                )}
              >
                <input
                  type="radio"
                  name="approvalFlow"
                  value={opt.id}
                  checked={outputData.approvalFlow === opt.id}
                  onChange={() => updateOutput({ approvalFlow: opt.id })}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
