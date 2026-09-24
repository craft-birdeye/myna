/**
 * BlogWizardStep2 — Source & context
 *
 * Used for both 'blog' and 'landing' modes.
 * Collects the source material the AI will draw from:
 * - Brand identity auto-suggest
 * - Topic / keyword input
 * - Optional reference URL
 * - Optional file attachment (brief / notes)
 */

import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/contenthub-ui/button';
import { cn } from '@/contenthub-ui/utils';
import { STATUS_COLORS } from '../shared/scoreColors';
import { ContentFlowInfoLabel, ContentFlowTextarea, ContentFlowTextInput } from '../shared/ContentFlowControls';
import type { WizardMode } from './wizardTypes';

interface BlogWizardStep2Props {
  mode: WizardMode;
  step1Data: Record<string, unknown>;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export function BlogWizardStep2({ mode, step1Data: _step1Data, data, onChange }: BlogWizardStep2Props) {
  const topic       = (data.topic       as string)   ?? '';
  const refUrl      = (data.refUrl      as string)   ?? '';
  const urlScraped  = (data.urlScraped  as boolean)  ?? false;
  const keywords    = (data.keywords    as string)   ?? '';
  const autoFilled  = (data.autoFilled  as boolean)  ?? false;

  const [scraping, setScraping] = useState(false);

  function handleAutoFill() {
    onChange({ ...data, refUrl: 'https://lushgreen.com/services', autoFilled: true });
  }

  function handleScrape() {
    if (!refUrl) return;
    setScraping(true);
    setTimeout(() => {
      setScraping(false);
      onChange({ ...data, urlScraped: true });
    }, 1400);
  }

  const topicLabel = mode === 'landing' ? 'Page topic or offer' : 'Topic or headline idea';
  const topicPlaceholder = mode === 'landing'
    ? 'e.g. Spring landscaping packages for homeowners'
    : 'e.g. How AI is changing local SEO for small businesses';

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Auto-suggest banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
        <Sparkles size={15} strokeWidth={1.6} absoluteStrokeWidth className="text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground">Use your project context</p>
          <p className="text-[12px] text-muted-foreground">We found lushgreen.com/services from your brand identity</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleAutoFill}>
          Use this
        </Button>
      </div>

      {/* Topic input */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-foreground">{topicLabel}</label>
        <ContentFlowTextarea
          rows={2}
          value={topic}
          onChange={e => onChange({ ...data, topic: e.target.value })}
          placeholder={topicPlaceholder}
        />
      </div>

      {/* Keywords (blog only) */}
      {mode === 'blog' && (
        <div className="flex flex-col gap-2">
          <ContentFlowInfoLabel tooltip="Separate multiple keywords with commas.">
            Target keywords
          </ContentFlowInfoLabel>
          <ContentFlowTextInput
            type="text"
            value={keywords}
            onChange={e => onChange({ ...data, keywords: e.target.value })}
            placeholder="e.g. lawn care tips, landscaping services near me"
          />
        </div>
      )}

      {/* Reference URL */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <ContentFlowInfoLabel
            tooltip={
              mode === 'landing'
                ? 'We will extract key messaging and structure from this page.'
                : 'We will extract context and competing angles from this page.'
            }
          >
            Reference page
          </ContentFlowInfoLabel>
          {autoFilled && (
            <span
              className="text-[11px] px-2 py-0.5 rounded-md"
              style={{ background: STATUS_COLORS.ready.bg, color: STATUS_COLORS.ready.text }}
            >
              Auto-filled
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ContentFlowTextInput
            type="text"
            value={refUrl}
            onChange={e => onChange({ ...data, refUrl: e.target.value, urlScraped: false })}
            placeholder="https://example.com/page"
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleScrape}
            disabled={!refUrl || scraping}
          >
            {scraping ? 'Scraping...' : 'Scrape page'}
          </Button>
        </div>
        {urlScraped && (
          <div
            className="flex items-center gap-2 text-[12px] rounded-md px-3 py-2 border"
            style={{ color: STATUS_COLORS.ready.text, background: STATUS_COLORS.ready.bg, borderColor: STATUS_COLORS.ready.bg }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" fill="#4CAE3D" />
              <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="flex-1">LushGreen Landscapes · Services page</span>
            <button
              type="button"
              onClick={() => onChange({ ...data, urlScraped: false })}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={12} strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </div>
        )}
      </div>

      {/* File attachment */}
      <div className="flex flex-col gap-2">
        <ContentFlowInfoLabel tooltip="Attach a brief or notes for additional context.">
          Attach a brief or notes
        </ContentFlowInfoLabel>
        <div className={cn(
          'border-2 border-dashed border-border rounded-lg p-6 text-center flex flex-col items-center gap-2',
          'hover:border-primary/40 hover:bg-muted/30 transition-colors cursor-pointer',
        )}>
          <p className="text-[13px] text-foreground font-medium">Drop a file or click to browse</p>
          <p className="text-[12px] text-muted-foreground">Accepts .pdf .docx .txt</p>
        </div>
      </div>
    </div>
  );
}
