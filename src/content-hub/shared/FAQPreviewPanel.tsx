import React from 'react';
import { FAQTemplatePreview } from '../faq/FAQTemplatePreview';

/**
 * FAQPreviewPanel — live FAQ preview driven by wizard state.
 * Wraps FAQTemplatePreview and adds reactive state metadata display.
 */

export interface FAQPreviewPanelProps {
  /** Selected template id from step 1 */
  template: string;
  /** Hovered template from step 1 (overrides selected for preview) */
  hoveredTemplate?: string | null;
  /** Selected objective from step 3 */
  objective?: string;
  /** Selected tone from step 3 */
  tone?: string;
  /** Target FAQ count */
  faqCount?: number;
  /** Selected publish destinations */
  destinations?: string[];
}

const OBJECTIVE_LABELS: Record<string, string> = {
  visibility:  'Search visibility',
  support:     'Customer support',
  conversion:  'Conversion',
};

const DESTINATION_LABELS: Record<string, string> = {
  library:    'Content library',
  searchai:   'SearchAI',
  website:    'Website embed',
  helpcenter: 'Help center',
  standalone: 'Standalone page',
  social:     'Social',
  json:       'JSON export',
};

export const FAQPreviewPanel = ({
  template,
  hoveredTemplate,
  objective,
  tone,
  faqCount,
  destinations = [],
}: FAQPreviewPanelProps) => {
  const previewTarget = hoveredTemplate || template;

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      {/* Template preview card */}
      <div className="flex-1 overflow-hidden">
        <FAQTemplatePreview template={previewTarget} />
      </div>

      {/* Live state metadata */}
      {(objective || tone || faqCount || destinations.length > 0) && (
        <div className="flex flex-col gap-2 flex-shrink-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Settings</p>
          <div className="flex flex-wrap gap-1.5">
            {objective && (
              <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {OBJECTIVE_LABELS[objective] ?? objective}
              </span>
            )}
            {tone && (
              <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {tone}
              </span>
            )}
            {faqCount != null && (
              <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {faqCount} FAQs
              </span>
            )}
            {destinations.slice(0, 2).map((d) => (
              <span key={d} className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {DESTINATION_LABELS[d] ?? d}
              </span>
            ))}
            {destinations.length > 2 && (
              <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                +{destinations.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
