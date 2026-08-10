import React from 'react';
import { Mail, Zap, RefreshCw, Star, Megaphone, Plus } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';

const EMAIL_TEMPLATES = [
  { id: 'welcome',      icon: <Mail size={18} strokeWidth={1.6} absoluteStrokeWidth />,       label: 'Welcome series',       description: 'First impression for new customers' },
  { id: 'promo',        icon: <Zap size={18} strokeWidth={1.6} absoluteStrokeWidth />,        label: 'Promotional offer',    description: 'Drive a limited-time deal' },
  { id: 'reengagement', icon: <RefreshCw size={18} strokeWidth={1.6} absoluteStrokeWidth />,  label: 'Re-engagement',        description: 'Win back lapsed customers' },
  { id: 'review',       icon: <Star size={18} strokeWidth={1.6} absoluteStrokeWidth />,       label: 'Review request',       description: 'Ask happy customers for a review' },
  { id: 'announcement', icon: <Megaphone size={18} strokeWidth={1.6} absoluteStrokeWidth />,  label: 'Event / announcement', description: 'Share news about your business' },
  { id: 'custom',       icon: <Plus size={18} strokeWidth={1.6} absoluteStrokeWidth />,       label: 'Custom',               description: 'Start from a blank brief' },
];

function EmailPreview({ templateId }: { templateId: string }) {
  const previewLines: Record<string, number[][]> = {
    welcome:      [[70], [90, 60, 80, 50, 70], [40]],
    promo:        [[85], [65, 80, 90, 55], [40]],
    reengagement: [[75], [80, 60, 85, 55], [40]],
    review:       [[60], [70, 85, 50], [40]],
    announcement: [[80], [75, 65, 85, 70, 50], [40]],
    custom:       [[55], [70, 60, 75], [40]],
  };
  const sections = previewLines[templateId] ?? previewLines.welcome;

  return (
    <div className="bg-background border border-border rounded-[8px] p-4 flex flex-col gap-2 w-full">
      {/* From/subject bar */}
      <div className="border-b border-border pb-2 flex flex-col gap-1">
        <div className="flex gap-2 items-center">
          <span className="text-[10px] text-muted-foreground w-12">From</span>
          <div className="h-2 w-32 bg-muted rounded-full" />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-[10px] text-muted-foreground w-12">Subject</span>
          <div className="h-2 rounded-full bg-primary/20" style={{ width: `${sections[0][0]}%` }} />
        </div>
      </div>
      {/* Greeting */}
      <p className="text-[11px] text-foreground">Hi [First name],</p>
      {/* Body shimmer */}
      {sections[1].map((w, i) => (
        <div key={i} className="h-[9px] rounded-full bg-muted" style={{ width: `${w}%` }} />
      ))}
      {/* CTA */}
      <div className="self-start bg-primary rounded-md px-4 py-1.5">
        <div className="h-[9px] w-16 rounded-full bg-primary-foreground/60" />
      </div>
      {/* Footer */}
      <div className="border-t border-border pt-2 flex gap-2">
        {['Unsubscribe', 'View in browser'].map((t) => (
          <div key={t} className="h-[8px] rounded-full bg-muted" style={{ width: `${t.length * 4}px` }} />
        ))}
      </div>
    </div>
  );
}

interface EmailWizardStep1Props {
  selectedTemplate: string;
  onTemplateChange: (t: string) => void;
}

export const EmailWizardStep1 = ({ selectedTemplate, onTemplateChange }: EmailWizardStep1Props) => (
  <div className="p-6">
    <p className="text-[12px] text-muted-foreground uppercase tracking-wide mb-4">Email type</p>
    <div className="flex flex-col gap-2">
      {EMAIL_TEMPLATES.map((t) => (
        <button
          key={t.id}
          onClick={() => onTemplateChange(t.id)}
          className={cn(
            'flex items-center gap-4 rounded-[8px] border p-4 text-left transition-all w-full',
            selectedTemplate === t.id
              ? 'border-2 border-primary bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-surface-hover',
          )}
        >
          <div className={cn('flex-shrink-0', selectedTemplate === t.id ? 'text-primary' : 'text-muted-foreground')}>
            {t.icon}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[13px] text-foreground">{t.label}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t.description}</p>
          </div>
          {selectedTemplate === t.id && (
            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  </div>
);
