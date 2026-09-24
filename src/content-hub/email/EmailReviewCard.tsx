import React, { useState } from 'react';
import { Edit, Mail, Users } from 'lucide-react';
import { Button } from '@/contenthub-ui/button';
import { cn } from '@/contenthub-ui/utils';
import { scoreColor, STATUS_COLORS } from '../shared/scoreColors';

export interface EmailDraft {
  email_id: string;
  subjectVariants: string[];
  previewText: string;
  bodySnippet: string;
  location: string;
  segment: string;
  tone: string;
  status: 'ready' | 'needs-work';
  openRatePrediction: number; // 0-100
}

interface EmailReviewCardProps extends EmailDraft {
  position: { x: number; y: number };
  onEdit: (id: string) => void;
}

export const EmailReviewCard = ({
  email_id,
  subjectVariants,
  previewText,
  bodySnippet,
  location,
  segment,
  tone,
  status,
  openRatePrediction,
  position,
  onEdit,
}: EmailReviewCardProps) => {
  const [activeVariant, setActiveVariant] = useState(0);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{ position: 'absolute', left: position.x, top: position.y, width: 480 }}
      className="bg-white rounded-lg border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="bg-muted/30 px-4 py-2 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Mail size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
          <span className="text-[12px] text-foreground">Email</span>
          <span className="text-[11px] text-muted-foreground">· {location}</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users size={11} strokeWidth={1.6} absoluteStrokeWidth />
            <span className="text-[11px]">{segment}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Pred. open rate</span>
          <span
            className="text-[11px] px-1.5 py-0.5 rounded-md"
            style={scoreColor(openRatePrediction >= 30 ? 90 : openRatePrediction >= 20 ? 75 : 50)}
          >
            {openRatePrediction}%
          </span>
          <span
            className="text-[11px] px-2 py-0.5 rounded-md"
            style={{ background: STATUS_COLORS[status]?.bg, color: STATUS_COLORS[status]?.text }}
          >
            {STATUS_COLORS[status]?.label ?? status}
          </span>
        </div>
      </div>

      {/* Email preview */}
      <div className="px-4 py-2 flex flex-col gap-2.5">
        {/* Subject line variants */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
            Subject A/B variants
          </p>
          <div className="flex flex-col gap-1">
            {subjectVariants.map((subj, i) => (
              <button
                key={i}
                onClick={() => setActiveVariant(i)}
                className={cn(
                  'text-left text-[13px] px-2 py-2 rounded-md border transition-all',
                  activeVariant === i
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20',
                )}
              >
                <span className="text-[10px] text-muted-foreground mr-2">
                  {String.fromCharCode(65 + i)}
                </span>
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Preview text */}
        <div className="text-[12px] text-muted-foreground">
          <span className="text-foreground">Preview: </span>
          {previewText}
        </div>

        {/* Body snippet */}
        <div
          className={cn(
            'bg-muted/30 rounded-[8px] p-2 text-[13px] text-foreground leading-relaxed cursor-pointer',
            !expanded && 'line-clamp-3',
          )}
          onClick={() => setExpanded((v) => !v)}
        >
          {bodySnippet}
        </div>

        {/* Tone chip */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-[11px]">Tone: {tone}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => onEdit(email_id)}>
          <Edit size={12} strokeWidth={1.6} absoluteStrokeWidth className="mr-1" />
          Edit
        </Button>
      </div>
    </div>
  );
};
