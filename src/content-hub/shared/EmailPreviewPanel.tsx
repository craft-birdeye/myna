import React from 'react';

/**
 * EmailPreviewPanel — live email preview driven by wizard state.
 * Props mirror the EmailWizard state fields that affect preview appearance.
 */

export interface EmailPreviewPanelProps {
  /** Which email template is selected (welcome, promo, etc.) */
  templateId: string;
  /** Selected audience segments */
  segments?: string[];
  /** Tone selection */
  tone?: string;
  /** Subject variant count */
  subjectCount?: number;
}

const TEMPLATE_LABELS: Record<string, string> = {
  welcome:      'Welcome series',
  promo:        'Promotional offer',
  reengagement: 'Re-engagement',
  review:       'Review request',
  announcement: 'Event / announcement',
  custom:       'Custom',
};

const PREVIEW_LINES: Record<string, number[][]> = {
  welcome:      [[70], [90, 60, 80, 50, 70], [40]],
  promo:        [[85], [65, 80, 90, 55], [40]],
  reengagement: [[75], [80, 60, 85, 55], [40]],
  review:       [[60], [70, 85, 50], [40]],
  announcement: [[80], [75, 65, 85, 70, 50], [40]],
  custom:       [[55], [70, 60, 75], [40]],
};

const TONE_LABELS: Record<string, string> = {
  professional:   'Professional',
  warm:           'Warm',
  urgent:         'Urgent',
  conversational: 'Conversational',
};

function EmailMockBody({ templateId }: { templateId: string }) {
  const sections = PREVIEW_LINES[templateId] ?? PREVIEW_LINES.welcome;

  return (
    <div className="bg-background border border-border rounded-[8px] p-4 flex flex-col gap-4 w-full">
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
      <div className="flex flex-col gap-2">
        {sections[1].map((w, i) => (
          <div key={i} className="h-[9px] rounded-full bg-muted" style={{ width: `${w}%` }} />
        ))}
      </div>
      {/* CTA */}
      <div className="self-start bg-primary rounded-md px-4 py-1.5">
        <div className="h-[9px] w-16 rounded-full bg-primary-foreground/60" />
      </div>
      {/* Footer */}
      <div className="border-t border-border pt-2 flex gap-4">
        {['Unsubscribe', 'View in browser'].map((t) => (
          <div key={t} className="h-[8px] rounded-full bg-muted" style={{ width: `${t.length * 4}px` }} />
        ))}
      </div>
    </div>
  );
}

export const EmailPreviewPanel = ({
  templateId,
  segments = [],
  tone,
  subjectCount,
}: EmailPreviewPanelProps) => {
  const hasTemplate = Boolean(templateId);

  return (
    <div className="flex flex-col gap-4">
      {/* Header label */}
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Preview</p>

      {hasTemplate ? (
        <>
          {/* Template badge */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-foreground">
              {TEMPLATE_LABELS[templateId] ?? templateId}
            </span>
          </div>

          <EmailMockBody templateId={templateId} />

          {/* Live state chips */}
          <div className="flex flex-wrap gap-1.5">
            {tone && (
              <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {TONE_LABELS[tone] ?? tone}
              </span>
            )}
            {subjectCount != null && subjectCount > 1 && (
              <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {subjectCount} subject variants
              </span>
            )}
            {segments.length > 0 && (
              <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {segments.length} segment{segments.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="text-[12px] text-muted-foreground">Select a template to preview</p>
      )}
    </div>
  );
};
