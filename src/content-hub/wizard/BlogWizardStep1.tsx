/**
 * BlogWizardStep1 — Goal
 *
 * Used for both 'blog' and 'landing' modes inside ContentCreationWizardModal.
 * Collects the primary goal for the content and the generation agent preference.
 */

import React from 'react';
import { cn } from '@/contenthub-ui/utils';
import type { WizardMode } from './wizardTypes';
import { ContentFlowInfoLabel, ContentFlowSelect } from '../shared/ContentFlowControls';

// ── Goal options ──────────────────────────────────────────────────────────────

interface GoalOption {
  id: string;
  label: string;
  description: string;
}

const BLOG_GOALS: GoalOption[] = [
  { id: 'seo',        label: 'SEO traffic',         description: 'Rank for target keywords and capture organic search traffic' },
  { id: 'authority',  label: 'Thought leadership',   description: 'Build authority and establish expertise in your space' },
  { id: 'education',  label: 'Product education',    description: 'Help customers understand your offering or process' },
  { id: 'story',      label: 'Customer story',        description: 'Showcase a real customer success and build social proof' },
];

const LANDING_GOALS: GoalOption[] = [
  { id: 'leads',      label: 'Lead generation',      description: 'Capture contact details from interested visitors' },
  { id: 'showcase',   label: 'Product showcase',      description: 'Highlight features, benefits, and social proof' },
  { id: 'event',      label: 'Event registration',    description: 'Drive sign-ups for a webinar, demo, or in-person event' },
  { id: 'service',    label: 'Service promotion',     description: 'Drive bookings or enquiries for a specific service' },
];

const AGENT_OPTIONS = [
  { value: 'balanced', label: 'Balanced (recommended)', description: 'Best mix of speed and quality' },
  { value: 'speed',    label: 'Speed',                  description: 'Faster generation, fewer sources' },
  { value: 'deep',     label: 'Deep research',           description: 'Slower but more thorough and cited' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface BlogWizardStep1Props {
  mode: WizardMode;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BlogWizardStep1({ mode, data, onChange }: BlogWizardStep1Props) {
  const goals = mode === 'landing' ? LANDING_GOALS : BLOG_GOALS;
  const selectedGoal  = (data.goal  as string) ?? goals[0].id;
  const selectedAgent = (data.agent as string) ?? 'balanced';
  const agentDesc = AGENT_OPTIONS.find(a => a.value === selectedAgent)?.description ?? '';

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Brand identity context bar */}
      <div className="bg-muted border border-border rounded-lg px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-muted-foreground">
          <rect x="3" y="6" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5 6V4.5a2 2 0 014 0V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span className="text-[12px] text-muted-foreground">
          <span className="font-medium text-foreground">LushGreen corporate</span>
          <span className="mx-2">·</span>
          <span className="font-medium text-foreground">10 locations</span>
        </span>
      </div>

      {/* Goal list */}
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-foreground">
          {mode === 'landing' ? 'What is the goal of this landing page?' : 'What is the goal of this blog post?'}
        </p>
        {goals.map(g => {
          const selected = selectedGoal === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onChange({ ...data, goal: g.id })}
              className={cn(
                'relative flex items-center gap-4 text-left bg-background rounded-lg p-4 transition-all w-full',
                selected
                  ? 'border-2 border-primary bg-primary/5'
                  : 'border border-border hover:border-primary/40 hover:bg-muted/50',
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground leading-snug">{g.label}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{g.description}</p>
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

      {/* Agent picker */}
      <div className="flex flex-col gap-2">
        <ContentFlowInfoLabel tooltip={agentDesc}>
          Writing agent
        </ContentFlowInfoLabel>
        <ContentFlowSelect
          value={selectedAgent}
          onChange={value => onChange({ ...data, agent: value })}
          options={AGENT_OPTIONS}
        />
      </div>
    </div>
  );
}
