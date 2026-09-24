/**
 * BlogInlineCreationFlow
 *
 * 3-step inline creation flow for blog post generation inside ContentEditorShell.
 *
 * Steps:
 *  1. brand-kit — Select brand identity + business location
 *  2. setup     — Topic, keywords, tone, blog count
 *  3. brief     — Review / edit the content brief
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, ChevronDown, ChevronUp, Info, Loader2, Sparkles, ArrowUpRight, Lightbulb, Upload, X } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/contenthub-ui/tooltip';
import { AttachmentPickerModal, AttachedFile } from './AttachmentPickerModal';
import { MOCK_RECOMMENDATIONS } from '@/search-ai/SearchAIRecommendationsPanel';
import { cn } from '@/contenthub-ui/utils';
import {
  CONTENT_FLOW_STEP_TITLE_CLASS,
  ContentFlowInfoLabel,
  ContentFlowKeywordTagInput,
  ContentFlowLocationFlatList,
  ContentFlowSelect,
  ContentFlowTextarea,
  ContentFlowTextInput,
} from '../shared/ContentFlowControls';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/contenthub-ui/popover';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BlogSection {
  id: string;
  heading: string;
  description: string;
  wordCount: number;
}

export interface BlogFlowData {
  contentName: string;
  brandKit: string;
  locations: string[];
  agentId: string;
  createMode?: 'topic' | 'url';
  sourceUrl?: string;
  topic: string;
  keywords: string[];
  targetAudience?: string;
  intent: string;
  objective: string;
  funnelStage: string;
  length: string;
  brief?: string;
  attachedFiles?: string[];
  includeImages?: boolean;
  includeCTAs?: boolean;
  includeFAQ?: boolean;
  internalLinks?: boolean;
  refUrls?: string[];
  signalSources: string[];
  publishTo: string[];
  attachments: string[];
  blogCount: number;
  contentBrief?: string;
  sections: BlogSection[];
  // legacy fields kept for compatibility
  blogType?: string;
  wordTarget?: number;
  keywords_text?: string;
}

export interface FlowNavControls {
  advance: () => void;
  back: () => void;
  generate: () => void;
  goTo?: (step: number) => void;
}

export interface FlowNavState {
  step: number;
  totalSteps: number;
  canAdvance: boolean;
}

export interface BlogInlineCreationFlowProps {
  onComplete: (data: BlogFlowData) => void;
  onCancel: () => void;
  controlRef?: React.MutableRefObject<FlowNavControls | null>;
  onNavStateChange?: (state: FlowNavState) => void;
  hideProgress?: boolean;
  initialData?: Partial<BlogFlowData>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BRAND_KITS = [
  { id: 'olive-garden', label: 'Olive Garden corporate' },
  { id: 'birdeye-demo', label: 'Birdeye demo brand' },
  { id: 'local-seo', label: 'Local SEO identity' },
];

const LOCATIONS = [
  { id: 'loc-1001', label: '1001 - Mountain View, CA' },
  { id: 'loc-1002', label: '1002 - Seattle, WA' },
  { id: 'loc-1003', label: '1003 - Dallas, TX' },
  { id: 'loc-1004', label: '1004 - Chicago, IL' },
  { id: 'loc-1005', label: '1005 - Los Angeles, CA' },
  { id: 'loc-1006', label: '1006 - Las Vegas, NV' },
  { id: 'loc-1007', label: '1007 - Austin, TX' },
  { id: 'loc-1008', label: '1008 - Houston, TX' },
  { id: 'loc-1009', label: '1009 - Phoenix, AZ' },
  { id: 'loc-1010', label: '1010 - Denver, CO' },
  { id: 'loc-1011', label: '1011 - New York, NY' },
  { id: 'loc-1012', label: '1012 - Miami, FL' },
  { id: 'loc-1013', label: '1013 - Atlanta, GA' },
  { id: 'loc-1014', label: '1014 - Boston, MA' },
  { id: 'loc-1015', label: '1015 - Portland, OR' },
  { id: 'loc-1016', label: '1016 - San Diego, CA' },
  { id: 'loc-1017', label: '1017 - Nashville, TN' },
  { id: 'loc-1018', label: '1018 - San Antonio, TX' },
  { id: 'loc-1019', label: '1019 - Minneapolis, MN' },
  { id: 'loc-1020', label: '1020 - Charlotte, NC' },
];

const BLOG_AGENTS = [
  { id: 'blog-default',  label: 'Blog generation agent' },
  { id: 'seo-writer',    label: 'SEO Writer — keyword-first content' },
  { id: 'local-blogger', label: 'Local Blogger — location-targeted posts' },
  { id: 'authority',     label: 'Authority Builder — thought leadership' },
  { id: 'story-writer',  label: 'Story Writer — patient & case stories' },
  { id: 'brand-voice',   label: 'Brand Voice — on-brand, on-tone content' },
];

const BRAND_BLOG_AGENTS: Record<string, string[]> = {
  'olive-garden':  ['blog-default', 'story-writer', 'brand-voice'],
  'birdeye-demo':  ['seo-writer', 'authority', 'local-blogger'],
  'local-seo':     ['local-blogger', 'seo-writer', 'brand-voice'],
};

const KEYWORD_OPTIONS = [
  { value: 'dental-anxiety',       label: 'Dental anxiety' },
  { value: 'family-dentist',       label: 'Family dentist' },
  { value: 'sedation-dentistry',   label: 'Sedation dentistry' },
  { value: 'preventive-care',      label: 'Preventive care' },
  { value: 'teeth-whitening',      label: 'Teeth whitening' },
  { value: 'dental-implants',      label: 'Dental implants' },
  { value: 'orthodontics',         label: 'Orthodontics' },
  { value: 'emergency-dentist',    label: 'Emergency dentist' },
  { value: 'cosmetic-dentistry',   label: 'Cosmetic dentistry' },
  { value: 'local-seo',            label: 'Local SEO' },
  { value: 'patient-experience',   label: 'Patient experience' },
  { value: 'dental-checkup',       label: 'Dental checkup' },
];

const INTENT_OPTIONS = [
  { value: 'agent',         label: 'Let agent decide' },
  { value: 'informational', label: 'Informational' },
  { value: 'commercial',    label: 'Commercial' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'navigational',  label: 'Navigational' },
];

const OBJECTIVE_OPTIONS = [
  { value: 'agent',       label: 'Let agent decide' },
  { value: 'traffic',     label: 'Traffic' },
  { value: 'aeo',         label: 'AEO' },
  { value: 'authority',   label: 'Authority' },
  { value: 'conversions', label: 'Conversions' },
];

const FUNNEL_OPTIONS = [
  { value: 'agent',         label: 'Let agent decide' },
  { value: 'awareness',     label: 'Awareness' },
  { value: 'consideration', label: 'Consideration' },
  { value: 'decision',      label: 'Decision' },
];

const LENGTH_OPTIONS = [
  { value: 'short',  label: 'Short (~800 words)' },
  { value: 'medium', label: 'Medium (~1,500 words)' },
  { value: 'long',   label: 'Long (~2,500 words)' },
];

const GENERATED_TOPIC_PAIRS: { topic: string; keywords: string[] }[] = [
  {
    topic: 'Are dental implants right for you?\n\nDental implants are the gold standard for replacing missing teeth — but not everyone is an immediate candidate. This post walks through who qualifies, what the process looks like, and how implants compare to bridges and dentures.',
    keywords: ['dental-implants', 'tooth-replacement', 'implant-candidacy'],
  },
  {
    topic: '5 tips for finding the right dentist for your family\n\nChoosing a family dentist is one of the most important healthcare decisions you can make. Learn what to look for — from preventive care philosophy to kid-friendly environments — so the whole family feels comfortable and cared for.',
    keywords: ['family-dentist', 'preventive-care', 'dental-checkup'],
  },
  {
    topic: 'The benefits of preventive dental care and regular checkups\n\nPreventive dentistry is the most cost-effective way to protect your long-term oral health. This article explains how routine cleanings, early screening, and personalised care plans keep small issues from becoming expensive problems.',
    keywords: ['preventive-care', 'dental-checkup', 'patient-experience'],
  },
  {
    topic: 'Understanding sedation dentistry: what patients need to know\n\nSedation dentistry has made dental care accessible for millions of anxious or medically complex patients. We break down the types of sedation available, who they are suitable for, and what to expect before, during, and after your appointment.',
    keywords: ['sedation-dentistry', 'dental-anxiety', 'family-dentist'],
  },
];

const PUBLISH_DESTINATIONS = [
  { id: 'library',   label: 'Save to content library', alwaysOn: true },
  { id: 'website',   label: 'Publish to website' },
  { id: 'helpcenter',label: 'Add to help center' },
  { id: 'social',    label: 'Share to social media' },
];

const BLOG_DESCRIPTIONS = [
  'Explore key benefits, expert tips, and industry insights that matter most to your readers',
  'A detailed breakdown of best practices, common mistakes, and actionable recommendations',
  'Real-world examples, customer success stories, and practical advice for your target audience',
  'Step-by-step guidance to help your audience make informed decisions and take action',
  'A data-driven look at trends, opportunities, and strategies relevant to your market',
];

const DEFAULT_SECTIONS: BlogSection[] = [
  { id: 'b1', heading: 'Blog post 1', description: BLOG_DESCRIPTIONS[0], wordCount: 1200 },
];

let sectionCounter = 4;
function makeSection(idx: number): BlogSection {
  const id = `b${sectionCounter++}`;
  const desc = BLOG_DESCRIPTIONS[(idx - 1) % BLOG_DESCRIPTIONS.length];
  return { id, heading: `Blog post ${idx}`, description: desc, wordCount: 1200 };
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEP_LABELS = ['Brand identity', 'Blog setup'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEP_LABELS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-colors flex-shrink-0',
                done ? 'bg-accent-positive text-white' : active ? 'bg-white border border-[#eaeaea] text-foreground' : 'bg-muted text-muted-foreground',
              )}>
                {done ? <Check size={12} strokeWidth={1.6} absoluteStrokeWidth /> : i + 1}
              </div>
              <span className={cn(
                'text-[13px] transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={cn(
                'w-[75px] h-px shrink-0 transition-colors',
                done ? 'bg-accent-positive' : 'bg-border',
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Step 1: Brand identity + location ──────────────────────────────────────────────

interface Step1Props {
  contentName: string;
  brandKit: string;
  locations: string[];
  agentId: string;
  onChange: (contentName: string, brandKit: string, locations: string[]) => void;
  onAgentChange: (agentId: string) => void;
}

function Step1BrandKit({ contentName, brandKit, locations, agentId, onChange, onAgentChange }: Step1Props) {
  const filteredAgents = BLOG_AGENTS.filter(a => (BRAND_BLOG_AGENTS[brandKit] ?? [a.id]).includes(a.id));
  const selectedAgent = BLOG_AGENTS.find(a => a.id === agentId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className={CONTENT_FLOW_STEP_TITLE_CLASS}>Select brand identity and location</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-[13px] text-foreground">Blog name <span className="text-destructive">*</span></label>
          <ContentFlowTextInput
            value={contentName}
            onChange={e => onChange(e.target.value, brandKit, locations)}
            placeholder="e.g. Restaurant dining guide series"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] text-foreground">Brand identity <span className="text-destructive">*</span></label>
          <ContentFlowSelect
            value={brandKit}
            onChange={value => onChange(contentName, value, locations)}
            options={BRAND_KITS.map(bk => ({ value: bk.id, label: bk.label }))}
          />
        </div>

        {/* Agent — filtered by selected brand identity */}
        <div className="space-y-1.5">
          <ContentFlowInfoLabel tooltip="Each agent is optimised for a different blog style and goal.">
            Agent
          </ContentFlowInfoLabel>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-[34px] w-full items-center justify-between rounded-md border border-border-selected bg-surface px-md text-[13px] text-text-primary transition-colors hover:bg-surface-l2"
              >
                <span className="truncate">{selectedAgent?.label ?? 'Choose an agent...'}</span>
                <ChevronDown size={16} strokeWidth={1.6} absoluteStrokeWidth className="shrink-0 text-text-icon" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1">
              <div className="flex flex-col">
                {filteredAgents.map((agent, i) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => onAgentChange(agent.id)}
                    className={cn(
                      'flex h-[34px] w-full items-center justify-between rounded-sm px-md text-[13px] text-left transition-colors',
                      agentId === agent.id
                        ? 'bg-surface-selected text-text-primary'
                        : 'text-text-primary hover:bg-surface-hover',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-xs truncate">
                      {agent.label}
                      {i === 0 && <span className="text-[11px] text-muted-foreground">(Default)</span>}
                    </span>
                    {agentId === agent.id && <Check size={14} strokeWidth={1.6} absoluteStrokeWidth className="shrink-0 text-primary" />}
                  </button>
                ))}
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  className="flex h-[34px] w-full items-center gap-xs rounded-sm px-md text-[13px] text-primary transition-colors hover:bg-surface-hover"
                >
                  <span>Manage blog agents</span>
                  <ArrowUpRight size={13} strokeWidth={1.6} absoluteStrokeWidth className="shrink-0" />
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] text-foreground">Locations <span className="text-destructive">*</span></label>
          <ContentFlowLocationFlatList
            values={locations}
            options={LOCATIONS.map(loc => ({ value: loc.id, label: loc.label }))}
            onChange={locs => onChange(contentName, brandKit, locs)}
            description="Choose the locations this content will apply to."
          />
        </div>
      </div>
    </div>
  );
}

// ── Toggle row helper ─────────────────────────────────────────────────────────

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative flex-shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-muted')}
        style={{ width: 32, height: 20 }}
      >
        <span
          className="absolute rounded-full bg-white shadow-sm"
          style={{
            top: 3,
            left: 0,
            width: 14,
            height: 14,
            transition: 'transform 150ms ease',
            transform: `translateX(${checked ? 15 : 3}px)`,
          }}
        />
      </button>
    </div>
  );
}

// ── Step 2: Blog setup ────────────────────────────────────────────────────────

interface Step2Props {
  topic: string;
  keywords: string[];
  targetAudience: string;
  intent: string;
  objective: string;
  funnelStage: string;
  length: string;
  createMode: 'topic' | 'url';
  sourceUrl: string;
  brief: string;
  attachedFileMeta: AttachedFile[];
  includeImages: boolean;
  includeCTAs: boolean;
  includeFAQ: boolean;
  internalLinks: boolean;
  refUrls: string[];
  onChange: (patch: Partial<Pick<BlogFlowData,
    | 'topic' | 'keywords' | 'targetAudience' | 'intent' | 'objective' | 'funnelStage' | 'length'
    | 'createMode' | 'sourceUrl' | 'brief'
    | 'includeImages' | 'includeCTAs' | 'includeFAQ' | 'internalLinks' | 'refUrls'
  >> & { attachedFileMeta?: AttachedFile[] }) => void;
}

function Step2Setup({
  topic, keywords, targetAudience, intent, objective, funnelStage, length,
  createMode, sourceUrl,
  brief, attachedFileMeta, includeImages, includeCTAs, includeFAQ, internalLinks, refUrls,
  onChange,
}: Step2Props) {
  const [generatingTopic, setGeneratingTopic] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [refUrlInput, setRefUrlInput] = useState('');
  const topicIdxRef = useRef(0);
  const topicTextareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResizeTopic = useCallback(() => {
    const el = topicTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => { autoResizeTopic(); }, [topic, autoResizeTopic]);

  function handleGenerateTopic() {
    setGeneratingTopic(true);
    setTimeout(() => {
      const pair = GENERATED_TOPIC_PAIRS[topicIdxRef.current % GENERATED_TOPIC_PAIRS.length];
      onChange({ topic: pair.topic, keywords: pair.keywords });
      topicIdxRef.current += 1;
      setGeneratingTopic(false);
    }, 900);
  }

  function handleAddUrl() {
    const url = refUrlInput.trim();
    if (!url || refUrls.length >= 5 || refUrls.includes(url)) return;
    onChange({ refUrls: [...refUrls, url] });
    setRefUrlInput('');
  }

  function handleMockFileBrowse() {
    setAttachmentModalOpen(true);
  }

  return (<>
    <div className="space-y-6">
      <div>
        <h2 className={CONTENT_FLOW_STEP_TITLE_CLASS}>Blog setup</h2>
      </div>

      {/* Create mode */}
      <div className="space-y-1">
        <label className="text-[13px] text-foreground">
          How would you like to create this blog?
        </label>

        {/* Option 1 — topic */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => onChange({ createMode: 'topic' })}
            className="flex items-start gap-3 w-full text-left"
          >
            <span className={cn(
              'mt-0.5 h-4 w-4 flex-none rounded-full border-[1.5px] flex items-center justify-center transition-colors bg-background',
              createMode === 'topic' ? 'border-primary' : 'border-[#cccccc]',
            )}>
              {createMode === 'topic' && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[13px] text-foreground">Start with a topic</span>
              <span className="text-[12px] text-muted-foreground">Describe what you want the blog to cover</span>
            </span>
          </button>

          {createMode === 'topic' && (
            <div className="ml-7 mt-4 rounded-sm border border-border overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-colors">
              <textarea
                ref={topicTextareaRef}
                value={topic}
                onChange={e => { onChange({ topic: e.target.value }); autoResizeTopic(); }}
                placeholder="e.g. Top 5 ways restaurants can respond to negative reviews to make it industry-relevant"
                className="w-full resize-none overflow-hidden bg-background px-4 pt-3 pb-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 outline-none border-none min-h-[100px]"
              />
              <div className="px-3 py-2 bg-background flex items-center gap-1">
                <Popover open={recommendationsOpen} onOpenChange={setRecommendationsOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Insert a Search AI recommendation"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Lightbulb size={13} strokeWidth={1.6} absoluteStrokeWidth />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[480px] p-0">
                    <div className="px-4 pt-3 pb-1 text-[11px] text-muted-foreground">
                      Search AI recommendations
                    </div>
                    <div className="flex max-h-[360px] flex-col overflow-y-auto pb-1">
                      {MOCK_RECOMMENDATIONS.map((rec) => (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => {
                            onChange({ topic: `Write a blog post based on this Search AI recommendation: "${rec.title}". Focus on making it locally relevant, authoritative, and optimised for AI search assistants.` });
                            setRecommendationsOpen(false);
                          }}
                          className="flex w-full flex-col gap-[3px] px-4 py-2.5 text-left transition-colors hover:bg-muted"
                        >
                          <span className="text-[13px] text-foreground leading-snug">{rec.title}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-text-secondary">
                              AEO score : {rec.aeoScore}/100
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className="flex items-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Info size={12} strokeWidth={1.6} absoluteStrokeWidth />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-[240px] space-y-1 text-left">
                                <p className="text-[11px] opacity-70">{rec.impact} impact</p>
                                <p className="text-xs leading-relaxed">{rec.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <button
                  type="button"
                  disabled={generatingTopic}
                  onClick={handleGenerateTopic}
                  className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground disabled:opacity-60 transition-colors"
                >
                  {generatingTopic
                    ? <Loader2 size={13} strokeWidth={1.6} absoluteStrokeWidth className="animate-spin text-[#7c3aed]" />
                    : <Sparkles size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-[#7c3aed]" />
                  }
                  {generatingTopic ? 'Generating...' : topic ? 'Regenerate topic' : 'Generate a topic for me'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Option 2 — YouTube URL */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => onChange({ createMode: 'url' })}
            className="flex items-start gap-3 w-full text-left"
          >
            <span className={cn(
              'mt-0.5 h-4 w-4 flex-none rounded-full border-[1.5px] flex items-center justify-center transition-colors bg-background',
              createMode === 'url' ? 'border-primary' : 'border-[#cccccc]',
            )}>
              {createMode === 'url' && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[13px] text-foreground">Start with a YouTube video</span>
              <span className="text-[12px] text-muted-foreground">Paste a YouTube video link to use as source material</span>
            </span>
          </button>

          {createMode === 'url' && (
            <div className="ml-7 mt-4">
              <ContentFlowTextInput
                value={sourceUrl}
                onChange={e => onChange({ sourceUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Advanced settings */}
      <div className="rounded-sm border border-border">
        <button
          type="button"
          onClick={() => setAdvancedOpen(o => !o)}
          className="flex items-center justify-between w-full px-4 py-3"
        >
          <span className="text-[13px] text-foreground">Advanced settings</span>
          {advancedOpen
            ? <ChevronUp size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
            : <ChevronDown size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
          }
        </button>
        {advancedOpen && (
          <div className="flex flex-col gap-5 border-t border-border px-4 py-4">

            {/* 1. Keywords */}
            <div className="space-y-1.5">
              <ContentFlowInfoLabel tooltip="Type a keyword and press Enter, or pick from suggestions.">
                Keywords
              </ContentFlowInfoLabel>
              <ContentFlowKeywordTagInput
                values={keywords}
                suggestions={KEYWORD_OPTIONS}
                onChange={vals => onChange({ keywords: vals })}
                placeholder="Select or enter keywords"
              />
            </div>

            {/* 2. Target audience */}
            <div className="space-y-1.5">
              <ContentFlowInfoLabel tooltip="Describe the primary reader — e.g. first-home buyers, landlords, healthcare administrators.">
                Target audience
              </ContentFlowInfoLabel>
              <ContentFlowTextInput
                value={targetAudience}
                onChange={e => onChange({ targetAudience: e.target.value })}
                placeholder="e.g. First-home buyers in regional NSW"
              />
            </div>

            {/* 3. Length */}
            <div className="space-y-1.5">
              <label className="text-[13px] text-foreground">Length</label>
              <ContentFlowSelect value={length} options={LENGTH_OPTIONS} onChange={val => onChange({ length: val })} />
            </div>

            {/* 3. Anything specific */}
            <div className="space-y-1.5">
              <label className="text-[13px] text-foreground">Anything specific you want covered?</label>
              <ContentFlowTextarea
                value={brief}
                onChange={e => onChange({ brief: e.target.value })}
                placeholder="What angle, tone, or specific points should the agent know about?"
                rows={3}
              />
            </div>

            {/* 4. Attachments */}
            <div className="space-y-1.5">
              <label className="text-[13px] text-foreground">Attachments</label>
              <button
                type="button"
                onClick={handleMockFileBrowse}
                className="w-full rounded-sm border-2 border-dashed border-border px-4 py-4 flex flex-col items-center gap-2 transition-colors hover:border-primary/30 hover:bg-muted/30"
              >
                <Upload size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
                <span className="text-[13px] text-foreground">Drop files or click to browse</span>
                <span className="text-[11px] text-muted-foreground">.pdf · .docx · .txt · .png · .jpg</span>
              </button>
              {attachedFileMeta.length > 0 && (
                <div className="flex flex-col gap-1">
                  {attachedFileMeta.map(file => (
                    <div key={file.name} className="flex items-center gap-2 px-2 py-1.5 rounded-sm bg-muted/60 border border-border/40">
                      {/* Thumbnail */}
                      {file.thumbUrl && (file.kind === 'image' || file.kind === 'video') ? (
                        <div className="relative size-[36px] rounded-[4px] overflow-hidden flex-shrink-0 border border-border/40 bg-white">
                          <img src={file.thumbUrl} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                          {file.kind === 'video' && (
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                              <svg viewBox="0 0 10 10" className="size-2.5 text-white fill-white"><polygon points="2,1 9,5 2,9" /></svg>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="size-[36px] rounded-[4px] flex items-center justify-center bg-surface-muted flex-shrink-0 text-[8px] text-text-secondary border border-border/40">
                          {file.name.split('.').pop()?.toUpperCase() ?? 'FILE'}
                        </div>
                      )}
                      <span className="flex-1 text-small text-text-primary truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => onChange({ attachedFileMeta: attachedFileMeta.filter(f => f.name !== file.name) })}
                        className="text-text-secondary hover:text-text-primary transition-colors shrink-0"
                      >
                        <X size={12} strokeWidth={1.6} absoluteStrokeWidth />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Intent */}
            <div className="space-y-1.5">
              <label className="text-[13px] text-foreground">Intent</label>
              <ContentFlowSelect value={intent} options={INTENT_OPTIONS} onChange={val => onChange({ intent: val })} />
            </div>

            {/* 7. Objective */}
            <div className="space-y-1.5">
              <label className="text-[13px] text-foreground">Objective</label>
              <ContentFlowSelect value={objective} options={OBJECTIVE_OPTIONS} onChange={val => onChange({ objective: val })} />
            </div>

            {/* 8. Funnel stage */}
            <div className="space-y-1.5">
              <label className="text-[13px] text-foreground">Funnel stage</label>
              <ContentFlowSelect value={funnelStage} options={FUNNEL_OPTIONS} onChange={val => onChange({ funnelStage: val })} />
            </div>

            {/* 9. Reference URLs */}
            <div className="space-y-1.5">
              <label className="text-[13px] text-foreground">Reference URLs</label>
              <div className="flex items-center gap-2">
                <ContentFlowTextInput
                  value={refUrlInput}
                  onChange={e => setRefUrlInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } }}
                  placeholder="https://..."
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  disabled={!refUrlInput.trim() || refUrls.length >= 5}
                  className="h-[34px] px-md rounded-md border border-border-selected bg-surface text-[13px] text-text-primary hover:bg-surface-l2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  Add
                </button>
              </div>
              {refUrls.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  {refUrls.map(url => (
                    <div key={url} className="flex items-center gap-2 px-3 py-2 rounded-sm bg-muted text-[12px]">
                      <span className="flex-1 text-foreground truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() => onChange({ refUrls: refUrls.filter(u => u !== url) })}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        <X size={12} strokeWidth={1.6} absoluteStrokeWidth />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {refUrls.length >= 5 && (
                <p className="text-[11px] text-muted-foreground">Maximum 5 URLs added</p>
              )}
            </div>

            {/* 10. Include in blog */}
            <div className="flex flex-col gap-3">
              <label className="text-[13px] text-foreground">Include in blog</label>
              <ToggleRow label="Images" checked={includeImages} onChange={v => onChange({ includeImages: v })} />
              <ToggleRow label="CTAs" checked={includeCTAs} onChange={v => onChange({ includeCTAs: v })} />
              <ToggleRow label="FAQ section" checked={includeFAQ} onChange={v => onChange({ includeFAQ: v })} />
              <ToggleRow label="Internal links" checked={internalLinks} onChange={v => onChange({ internalLinks: v })} />
            </div>

          </div>
        )}
      </div>
    </div>

    <AttachmentPickerModal
      open={attachmentModalOpen}
      onClose={() => setAttachmentModalOpen(false)}
      onSave={files => onChange({ attachedFileMeta: files })}
      initialSelected={attachedFileMeta.map(f => f.name)}
    />
  </>);
}

// ── Step 3: Content brief ─────────────────────────────────────────────────────

interface Step3Props {
  sections: BlogSection[];
  onChange: (sections: BlogSection[]) => void;
}

function BlogSummaryCard({
  section,
  onDescriptionChange,
}: {
  section: BlogSection;
  onDescriptionChange: (id: string, description: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[12px] text-muted-foreground">{section.heading}</p>
      <ContentFlowTextarea
        value={section.description}
        onChange={event => onDescriptionChange(section.id, event.target.value)}
        rows={3}
        className="text-[14px] leading-6"
      />
    </div>
  );
}

function BlogSummarySkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="px-4 py-2 rounded-sm border border-border bg-background animate-pulse"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="space-y-2">
        <div className="h-2.5 rounded-full bg-muted w-[90%]" />
        <div className="h-2.5 rounded-full bg-muted w-full" />
        <div className="h-2.5 rounded-full bg-muted w-[65%]" />
      </div>
    </div>
  );
}

function Step3ContentBrief({ sections, onChange }: Step3Props) {
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setGenerating(false), 1400);
    return () => clearTimeout(t);
  }, []);

  const updateDescription = (id: string, description: string) => {
    onChange(sections.map(section => section.id === id ? { ...section, description } : section));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={CONTENT_FLOW_STEP_TITLE_CLASS}>Content brief</h2>
      </div>

      {generating ? (
        <div className="space-y-4">
          {sections.map((_, index) => <BlogSummarySkeleton key={index} index={index} />)}
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-500">
          {sections.map(section => (
            <BlogSummaryCard
              key={section.id}
              section={section}
              onDescriptionChange={updateDescription}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BlogInlineCreationFlow({ onComplete, onCancel, controlRef, onNavStateChange, hideProgress = false, initialData }: BlogInlineCreationFlowProps) {
  const TOTAL_STEPS = 2;
  const [step, setStep] = useState(0);

  // Step 1 state
  const [contentName, setContentName] = useState(initialData?.contentName ?? '');
  const [brandKit, setBrandKit]       = useState(initialData?.brandKit ?? 'olive-garden');
  const [locations, setLocations]     = useState<string[]>(initialData?.locations ?? LOCATIONS.map(l => l.id));

  // Step 2 state
  const [agentId, setAgentId]         = useState(initialData?.agentId ?? 'blog-default');
  const [topic, setTopic]             = useState(initialData?.topic ?? '');
  const [createMode, setCreateMode]   = useState<'topic' | 'url'>(initialData?.createMode ?? 'topic');
  const [sourceUrl, setSourceUrl]     = useState(initialData?.sourceUrl ?? '');
  const [keywords, setKeywords]       = useState<string[]>(Array.isArray(initialData?.keywords) ? initialData.keywords : []);
  const [intent, setIntent]           = useState(initialData?.intent ?? 'agent');
  const [objective, setObjective]     = useState(initialData?.objective ?? 'agent');
  const [funnelStage, setFunnelStage] = useState(initialData?.funnelStage ?? 'agent');
  const [length, setLength]           = useState(initialData?.length ?? 'medium');
  const [brief, setBrief]             = useState(initialData?.brief ?? '');
  const [attachedFileMeta, setAttachedFileMeta] = useState<AttachedFile[]>(
    initialData?.attachedFiles?.map(name => ({ name })) ?? []
  );
  const [includeImages, setIncludeImages] = useState(initialData?.includeImages ?? true);
  const [includeCTAs, setIncludeCTAs]     = useState(initialData?.includeCTAs ?? true);
  const [includeFAQ, setIncludeFAQ]       = useState(initialData?.includeFAQ ?? true);
  const [internalLinks, setInternalLinks] = useState(initialData?.internalLinks ?? true);
  const [refUrls, setRefUrls]             = useState<string[]>(initialData?.refUrls ?? []);
  const [signalSources, setSignalSources] = useState<string[]>([]);
  const [blogCount, setBlogCount]     = useState(1);

  // Step 3 state — synced to blogCount
  const [sections, setSections] = useState<BlogSection[]>(DEFAULT_SECTIONS);

  // Sync section cards to blogCount whenever it changes
  useEffect(() => {
    setSections(prev => {
      if (prev.length === blogCount) return prev;
      if (prev.length > blogCount) return prev.slice(0, blogCount);
      const added = Array.from({ length: blogCount - prev.length }, (_, i) =>
        makeSection(prev.length + i + 1)
      );
      return [...prev, ...added];
    });
  }, [blogCount]);

  const handleStep2Change = (patch: Partial<Pick<BlogFlowData,
    | 'topic' | 'keywords' | 'intent' | 'objective' | 'funnelStage' | 'length'
    | 'signalSources' | 'attachments' | 'blogCount' | 'createMode' | 'sourceUrl'
    | 'brief' | 'includeImages' | 'includeCTAs' | 'includeFAQ'
    | 'internalLinks' | 'refUrls'
  >>) => {
    if (patch.topic !== undefined) setTopic(patch.topic);
    if (patch.createMode !== undefined) setCreateMode(patch.createMode);
    if (patch.sourceUrl !== undefined) setSourceUrl(patch.sourceUrl);
    if (patch.keywords !== undefined) setKeywords(patch.keywords);
    if (patch.intent !== undefined) setIntent(patch.intent);
    if (patch.objective !== undefined) setObjective(patch.objective);
    if (patch.funnelStage !== undefined) setFunnelStage(patch.funnelStage);
    if (patch.length !== undefined) setLength(patch.length);
    if (patch.brief !== undefined) setBrief(patch.brief);
    if ((patch as { attachedFileMeta?: AttachedFile[] }).attachedFileMeta !== undefined) {
      setAttachedFileMeta((patch as { attachedFileMeta: AttachedFile[] }).attachedFileMeta);
    }
    if (patch.includeImages !== undefined) setIncludeImages(patch.includeImages);
    if (patch.includeCTAs !== undefined) setIncludeCTAs(patch.includeCTAs);
    if (patch.includeFAQ !== undefined) setIncludeFAQ(patch.includeFAQ);
    if (patch.internalLinks !== undefined) setInternalLinks(patch.internalLinks);
    if (patch.refUrls !== undefined) setRefUrls(patch.refUrls);
    if (patch.signalSources !== undefined) setSignalSources(patch.signalSources);
    if (patch.blogCount !== undefined) setBlogCount(patch.blogCount);
  };

  const canAdvance = [
    contentName.trim() !== '' && brandKit !== '' && locations.length > 0,
    createMode === 'topic' ? topic.trim() !== '' : sourceUrl.trim() !== '',
  ][step];

  const handleGenerate = useCallback(() => {
    onComplete({
      contentName, brandKit, locations, agentId, topic, keywords,
      intent, objective, funnelStage, length,
      brief, attachedFiles: attachedFileMeta.map(f => f.name),
      includeImages, includeCTAs, includeFAQ, internalLinks, refUrls,
      signalSources, publishTo: ['library'],
      attachments: attachedFileMeta.map(f => f.name), blogCount,
      contentBrief: sections.map(section => `${section.heading}: ${section.description}`).join('\n\n'),
      sections,
    });
  }, [agentId, attachedFileMeta, blogCount, brandKit, brief, contentName, funnelStage, includeCTAs, includeFAQ, includeImages, internalLinks, intent, keywords, length, locations, objective, onComplete, refUrls, sections, signalSources, topic]);

  useEffect(() => {
    if (controlRef) {
      controlRef.current = {
        advance:  () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1)),
        back:     () => { if (step === 0) onCancel(); else setStep(s => s - 1); },
        generate: handleGenerate,
        goTo:     (nextStep: number) => setStep(Math.max(0, Math.min(nextStep, TOTAL_STEPS - 1))),
      };
    }
  });

  useEffect(() => {
    onNavStateChange?.({ step, totalSteps: TOTAL_STEPS, canAdvance });
  }, [canAdvance, onNavStateChange, step]);

  return (
    <div className="flex flex-col h-full bg-background">
      {!hideProgress && (
        <div className="flex-none px-8 py-4 border-b border-border bg-background flex justify-center">
          <StepIndicator current={step} />
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-hidden py-4 pl-4 pr-6">
        <div className="h-full overflow-y-auto rounded-sm border border-border bg-background px-[30px] pb-[30px] pt-[30px]">
          <div className="w-1/2 min-w-[520px] max-w-[720px]">

          {step === 0 && (
            <Step1BrandKit
              contentName={contentName}
              brandKit={brandKit}
              locations={locations}
              agentId={agentId}
              onChange={(name, bk, locs) => {
                setContentName(name);
                if (bk !== brandKit) {
                  const allowed = BRAND_BLOG_AGENTS[bk];
                  if (allowed && !allowed.includes(agentId)) setAgentId('');
                }
                setBrandKit(bk);
                setLocations(locs);
              }}
              onAgentChange={setAgentId}
            />
          )}

          {step === 1 && (
            <Step2Setup
              topic={topic}
              keywords={keywords}
              intent={intent}
              objective={objective}
              funnelStage={funnelStage}
              length={length}
              createMode={createMode}
              sourceUrl={sourceUrl}
              brief={brief}
              attachedFileMeta={attachedFileMeta}
              includeImages={includeImages}
              includeCTAs={includeCTAs}
              includeFAQ={includeFAQ}
              internalLinks={internalLinks}
              refUrls={refUrls}
              onChange={handleStep2Change}
            />
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
