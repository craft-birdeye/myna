import React, { useState } from 'react';
import { cn } from '@/contenthub-ui/utils';
import { ContentFlowInfoLabel, ContentFlowSelect } from '../shared/ContentFlowControls';

interface Template {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const TEMPLATES: Template[] = [
  {
    id: 'aeo',
    label: 'AEO optimized FAQ',
    description: 'Built to rank in AI answer engines and Google SGE',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'newpage',
    label: 'New page FAQ builder',
    description: 'Start from scratch for a new landing or product page',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 10h6M10 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'optimizer',
    label: 'Existing FAQ optimizer',
    description: 'Improve and expand FAQs you already have',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 10h12M13 7l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'support',
    label: 'Customer support FAQs',
    description: 'Turn support tickets and reviews into helpful FAQs',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2C6.69 2 4 4.69 4 8c0 2.49 1.45 4.64 3.56 5.68L7 16h6l-.56-2.32C14.55 12.64 16 10.49 16 8c0-3.31-2.69-6-6-6z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'location',
    label: 'Location-specific FAQs',
    description: 'Tailored answers for each of your locations',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2C7.24 2 5 4.24 5 7c0 4 5 11 5 11s5-7 5-11c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Full control over sources, tone, and structure',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 6h12M4 10h8M4 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const AGENT_OPTIONS = [
  { value: 'balanced', label: 'Balanced (recommended)', description: 'Best mix of speed and quality' },
  { value: 'speed', label: 'Speed', description: 'Faster generation, fewer sources' },
  { value: 'deep', label: 'Deep research', description: 'Slower but more thorough and cited' },
];

interface FAQWizardStep1Props {
  selectedTemplate: string;
  selectedAgent: string;
  onTemplateChange: (id: string) => void;
  onAgentChange: (agent: string) => void;
  /** Called when the user hovers over a template card — used by parent to update preview */
  onHoverTemplate?: (id: string | null) => void;
}

export const FAQWizardStep1 = ({
  selectedTemplate,
  selectedAgent,
  onTemplateChange,
  onAgentChange,
  onHoverTemplate,
}: FAQWizardStep1Props) => {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const selectedAgent_ = AGENT_OPTIONS.find(a => a.value === selectedAgent) || AGENT_OPTIONS[0];

  const handleHoverEnter = (id: string) => {
    setHoveredTemplate(id);
    onHoverTemplate?.(id);
  };
  const handleHoverLeave = () => {
    setHoveredTemplate(null);
    onHoverTemplate?.(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto max-w-2xl">
      {/* Locked context banner */}
        <div className="bg-muted border border-border rounded-[8px] px-4 py-2 flex items-center gap-2 flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-muted-foreground">
            <rect x="3" y="6" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M5 6V4.5a2 2 0 014 0V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span className="text-[12px] text-muted-foreground">
            <span className="text-foreground">LushGreen corporate</span>
            <span className="mx-2">·</span>
            <span className="text-foreground">10 locations</span>
          </span>
        </div>

        {/* Template list — single column */}
        <div>
          <p className="text-[13px] text-foreground mb-3">Choose a template</p>
          <div className="flex flex-col gap-2">
            {TEMPLATES.map((t) => {
              const isSelected = selectedTemplate === t.id;
              return (
                <button
                  key={t.id}
                  onMouseEnter={() => handleHoverEnter(t.id)}
                  onMouseLeave={() => handleHoverLeave()}
                  onClick={() => onTemplateChange(t.id)}
                  className={cn(
                    'relative flex items-center gap-4 text-left bg-background rounded-[8px] p-4 transition-all w-full',
                    isSelected
                      ? 'border-2 border-primary bg-primary/5'
                      : 'border border-border hover:border-primary/40 hover:bg-surface-hover',
                  )}
                >
                  <div className={cn('flex-shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')}>
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground leading-snug">{t.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{t.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Agent picker */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <ContentFlowInfoLabel tooltip={selectedAgent_.description}>
            Generation agent
          </ContentFlowInfoLabel>
          <ContentFlowSelect
            value={selectedAgent}
            onChange={onAgentChange}
            options={AGENT_OPTIONS}
          />
        </div>
    </div>
  );
};
