import React from 'react';
import { cn } from '@/contenthub-ui/utils';

const TONE_OPTIONS = [
  { id: 'professional', label: 'Professional', description: 'Polished and credible' },
  { id: 'warm',         label: 'Warm',         description: 'Empathetic and caring' },
  { id: 'urgent',       label: 'Urgent',       description: 'Direct and time-sensitive' },
  { id: 'conversational', label: 'Conversational', description: 'Natural and friendly' },
];

const SEND_OPTIONS = [
  { id: 'best',     label: 'Best time (AI-recommended)', sub: 'Birdeye recommends Tuesday 10am for your audience' },
  { id: 'specific', label: 'Specific time',              sub: null },
  { id: 'queue',    label: 'Add to queue',               sub: null },
];

interface EmailWizardStep3Props {
  tone: string;
  onToneChange: (t: string) => void;
  subjectCount: number;
  onSubjectCountChange: (n: number) => void;
  sendTime: string;
  onSendTimeChange: (t: string) => void;
  sendDate: string;
  onSendDateChange: (d: string) => void;
  requireApproval: boolean;
  onRequireApprovalChange: (v: boolean) => void;
}

export const EmailWizardStep3 = ({
  tone, onToneChange,
  subjectCount, onSubjectCountChange,
  sendTime, onSendTimeChange,
  sendDate, onSendDateChange,
  requireApproval, onRequireApprovalChange,
}: EmailWizardStep3Props) => (
  <div className="max-w-[600px] mx-auto p-8 flex flex-col gap-6">

    {/* Tone */}
    <div>
      <p className="text-[12px] text-muted-foreground uppercase tracking-wide mb-4">Tone</p>
      <div className="grid grid-cols-2 gap-2">
        {TONE_OPTIONS.map((t) => (
          <button
            key={t.id}
            onClick={() => onToneChange(t.id)}
            className={cn(
              'flex flex-col gap-1 rounded-[8px] border p-4 text-left transition-all',
              tone === t.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-hover',
            )}
          >
            <span className="text-[13px] text-foreground">{t.label}</span>
            <span className="text-[11px] text-muted-foreground">{t.description}</span>
          </button>
        ))}
      </div>
    </div>

    {/* Subject line variants */}
    <div>
      <p className="text-[12px] text-muted-foreground uppercase tracking-wide mb-4">Subject line A/B variants</p>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={1}
          max={5}
          value={subjectCount}
          onChange={(e) => onSubjectCountChange(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <span className="text-[15px] text-foreground w-6 text-center">{subjectCount}</span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">
        AI will generate {subjectCount} subject line option{subjectCount !== 1 ? 's' : ''} for A/B testing
      </p>
    </div>

    {/* Send time */}
    <div>
      <p className="text-[12px] text-muted-foreground uppercase tracking-wide mb-4">Send time</p>
      <div className="flex flex-col gap-2">
        {SEND_OPTIONS.map((opt) => (
          <label key={opt.id} className="cursor-pointer">
            <div
              className="flex items-start gap-2"
              onClick={() => onSendTimeChange(opt.id)}
            >
              <div className={cn(
                'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                sendTime === opt.id ? 'border-primary' : 'border-muted-foreground',
              )}>
                {sendTime === opt.id && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <div>
                <span className="text-[13px] text-foreground">{opt.label}</span>
                {opt.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{opt.sub}</p>}
              </div>
            </div>
          </label>
        ))}
        {sendTime === 'specific' && (
          <input
            type="datetime-local"
            value={sendDate}
            onChange={(e) => onSendDateChange(e.target.value)}
            className="mt-1 ml-7 border border-input rounded-md h-[34px] px-2 text-[13px] bg-background w-auto focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        )}
      </div>
    </div>

    {/* Approval */}
    <div className="border-t border-border pt-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={requireApproval}
          onChange={(e) => onRequireApprovalChange(e.target.checked)}
          className="accent-primary"
        />
        <div>
          <span className="text-[13px] text-foreground">Require approval before sending</span>
          <p className="text-[11px] text-muted-foreground">Emails will be staged for review before sending.</p>
        </div>
      </label>
    </div>
  </div>
);
