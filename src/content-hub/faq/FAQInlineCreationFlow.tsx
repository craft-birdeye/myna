/**
 * FAQInlineCreationFlow
 *
 * 3-step inline creation flow for FAQ generation inside ContentEditorShell.
 * Replaces InlineCreationFlow for mode === 'faq'.
 *
 * Steps:
 *  1. brand-kit — Select brand identity + business location
 *  2. setup     — Template, source URL, signal sources, objective, publish destinations
 *  3. brief     — Review / edit the content brief
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUpRight, Check, ChevronDown, Sparkles, X } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import {
  CONTENT_FLOW_STEP_TITLE_CLASS,
  ContentFlowInfoLabel,
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

export interface FAQSection {
  id: string;
  title: string;
  description: string;
  count: number;
}

export interface FAQFlowData {
  contentName: string;
  brandKit: string;
  locations: string[];
  template: string;
  customAgent?: string;
  sourceUrl: string;
  additionalContext: string;
  questionCount: number;
  signalSources: string[];
  attachments: string[];
  contentBrief?: string;
  sections: FAQSection[];
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

export interface FAQInlineCreationFlowProps {
  onComplete: (data: FAQFlowData) => void;
  onCancel: () => void;
  controlRef?: React.MutableRefObject<FlowNavControls | null>;
  onNavStateChange?: (state: FlowNavState) => void;
  hideProgress?: boolean;
  initialData?: Partial<FAQFlowData>;
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

const TEMPLATES = [
  { id: 'aeo',      label: 'AEO optimized',        description: 'Win answer-engine visibility for specific queries' },
  { id: 'newpage',  label: 'New page FAQ builder',  description: 'Generate FAQs for a new page or service' },
  { id: 'existing', label: 'Optimize existing',     description: 'Improve existing FAQs on a page' },
  { id: 'support',  label: 'Customer support FAQs', description: 'From tickets, reviews, queries' },
  { id: 'location', label: 'Location-specific',     description: 'FAQs tailored to a specific location' },
  { id: 'custom',   label: 'Custom',                description: 'Configure everything manually' },
];

const CUSTOM_AGENTS = [
  { id: 'on-demand',   label: 'On demand FAQ generation agent' },
  { id: 'faq-pro',     label: 'FAQ Pro — deep Q&A structuring' },
  { id: 'local-seo',   label: 'Local SEO Agent — geo-targeted FAQs' },
  { id: 'support-ai',  label: 'Support AI — ticket-driven FAQs' },
  { id: 'voice-opt',   label: 'Voice Optimizer — voice-search phrasing' },
  { id: 'brand-gpt',   label: 'Brand GPT — on-voice, on-brand answers' },
];

const BRAND_FAQ_AGENTS: Record<string, string[]> = {
  'olive-garden':  ['on-demand', 'brand-gpt', 'support-ai'],
  'birdeye-demo':  ['faq-pro', 'local-seo', 'voice-opt'],
  'local-seo':     ['local-seo', 'voice-opt', 'on-demand'],
};

const SIGNAL_SOURCES = [
  { id: 'reviews', label: 'Reviews data' },
  { id: 'tickets', label: 'Ticketing data' },
  { id: 'website', label: 'Website content' },
  { id: 'helpcenter', label: 'Help center articles' },
  { id: 'social', label: 'Social media posts' },
  { id: 'competitor', label: 'Competitor FAQs' },
];


const DEFAULT_SECTIONS: FAQSection[] = [
  { id: 's1', title: 'FAQ overview', description: 'Cover the most common questions customers have about pricing, bookings, services, locations, and any edge cases worth addressing upfront', count: 14 },
];

function distributeQuestionCount(sections: FAQSection[], total: number): FAQSection[] {
  if (sections.length === 0) return sections;
  const base = Math.floor(total / sections.length);
  const remainder = total % sections.length;
  return sections.map((section, index) => ({
    ...section,
    count: Math.max(1, base + (index < remainder ? 1 : 0)),
  }));
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEP_LABELS = ['Brand identity', 'Content setup'];

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
                'w-6 h-6 rounded-full flex items-center justify-center text-[11px] transition-colors flex-shrink-0',
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
  customAgent: string;
  onChange: (contentName: string, brandKit: string, locations: string[]) => void;
  onAgentChange: (agentId: string) => void;
}

function Step1BrandKit({ contentName, brandKit, locations, customAgent, onChange, onAgentChange }: Step1Props) {
  const filteredAgents = CUSTOM_AGENTS.filter(a => (BRAND_FAQ_AGENTS[brandKit] ?? [a.id]).includes(a.id));
  const selectedAgent = CUSTOM_AGENTS.find(a => a.id === customAgent);

  return (
    <div className="space-y-6">
      <div>
        <h2 className={CONTENT_FLOW_STEP_TITLE_CLASS}>Select brand identity and location</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-[13px] text-foreground">FAQ name <span className="text-destructive">*</span></label>
          <ContentFlowTextInput
            value={contentName}
            onChange={e => onChange(e.target.value, brandKit, locations)}
            placeholder="e.g. Customer service FAQ 2025"
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
          <ContentFlowInfoLabel tooltip="Each agent is optimized for a different FAQ style and goal.">
            Agent
          </ContentFlowInfoLabel>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-border bg-white px-2 py-2 text-[13px] text-text-primary transition-colors hover:border-border dark:border-[#333a47] dark:bg-[#262b35] dark:text-[#e4e4e4] dark:hover:border-[#4d5568]"
              >
                <span className="truncate">{selectedAgent?.label ?? 'Choose an agent...'}</span>
                <ChevronDown size={20} strokeWidth={1.6} absoluteStrokeWidth className="size-5 shrink-0 text-[#888] dark:text-[#6b7280]" />
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
                      'flex w-full items-center rounded-md px-2 py-2 text-[13px] text-left transition-colors',
                      customAgent === agent.id
                        ? 'bg-[#e8effe] text-primary dark:bg-[#1e2d5e] dark:text-[#6b9bff]'
                        : 'text-foreground hover:bg-surface-hover',
                    )}
                  >
                    {agent.label}{i === 0 && <span className="ml-1.5 text-[11px] text-muted-foreground">(Default)</span>}
                  </button>
                ))}
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  className="flex h-[34px] w-full items-center gap-1.5 rounded-md px-2 text-[13px] text-primary transition-colors hover:bg-surface-hover"
                >
                  <span>Manage FAQ agents</span>
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

// ── Agent select with "Manage FAQ agents" footer ──────────────────────────────

function AgentSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = CUSTOM_AGENTS.find(a => a.id === value);
  const displayLabel = selected?.label ?? 'Choose an agent...';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border border-border bg-white px-2 py-2 text-[13px] text-text-primary transition-colors hover:border-border dark:border-[#333a47] dark:bg-[#262b35] dark:text-[#e4e4e4] dark:hover:border-[#4d5568]"
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown size={20} strokeWidth={1.6} absoluteStrokeWidth className="size-5 shrink-0 text-[#888] dark:text-[#6b7280]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1">
        <div className="flex flex-col">
          {CUSTOM_AGENTS.map(agent => (
            <button
              key={agent.id}
              type="button"
              onClick={() => onChange(agent.id)}
              className={cn(
                'flex w-full items-center rounded-md px-2 py-2 text-[13px] text-left transition-colors',
                value === agent.id
                  ? 'bg-[#e8effe] text-primary dark:bg-[#1e2d5e] dark:text-[#6b9bff]'
                  : 'text-foreground hover:bg-surface-hover',
              )}
            >
              {agent.label}
            </button>
          ))}
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            className="flex h-[34px] w-full items-center gap-1.5 rounded-md px-2 text-[13px] text-primary transition-colors hover:bg-surface-hover"
          >
            <span>Manage FAQ agents</span>
            <ArrowUpRight size={13} strokeWidth={1.6} absoluteStrokeWidth className="shrink-0" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Toggle row helper ─────────────────────────────────────────────────────────

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn('w-8 h-4 rounded-full transition-colors relative flex-shrink-0', checked ? 'bg-primary' : 'bg-muted')}
      >
        <span className={cn('absolute top-0.5 size-3 bg-white rounded-full transition-transform shadow-sm', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

// ── Step 2: Content setup ─────────────────────────────────────────────────────

interface Step2Props {
  template: string;
  customAgent: string;
  sourceUrl: string;
  additionalContext: string;
  signalSources: string[];
  onChange: (patch: Partial<Pick<FAQFlowData, 'customAgent' | 'sourceUrl' | 'additionalContext' | 'signalSources'>>) => void;
}

type TabId = 'upload' | 'url' | 'paste';

function Step2Setup({ template, sourceUrl, additionalContext, signalSources, onChange }: Step2Props) {
  const [urlScraping, setUrlScraping] = useState(false);
  const [urlScraped, setUrlScraped] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('url');
  const [pasteText, setPasteText] = useState('');
  const [supportToggles, setSupportToggles] = useState({ reviews: true, tickets: false, nps: false });

  function handleAutoFill() {
    onChange({ sourceUrl: 'https://lushgreen.com/services' });
    setAutoFilled(true);
  }

  function handleScrape() {
    if (!sourceUrl) return;
    setUrlScraping(true);
    setTimeout(() => {
      setUrlScraping(false);
      setUrlScraped(true);
    }, 1500);
  }

  function toggleSignal(id: string) {
    const next = signalSources.includes(id)
      ? signalSources.filter(s => s !== id)
      : [...signalSources, id];
    onChange({ signalSources: next });
  }

  const showSignalSources = template !== 'custom';

  return (
    <div className="space-y-6">
      <div>
        <h2 className={CONTENT_FLOW_STEP_TITLE_CLASS}>Content setup</h2>
      </div>

      {/* Auto-suggest banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
        <Sparkles size={15} strokeWidth={1.6} absoluteStrokeWidth className="text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-foreground">Use your project context</p>
          <p className="text-[12px] text-muted-foreground">We found lushgreen.com/services from your brand identity</p>
        </div>
        <button
          type="button"
          onClick={handleAutoFill}
          className="h-8 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground hover:bg-muted transition-colors shrink-0"
        >
          Use this
        </button>
      </div>

      {/* Template-conditional URL input */}
      {(template === 'aeo' || template === 'newpage') && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <ContentFlowInfoLabel required tooltip="We'll extract questions your customers are already asking.">
              {template === 'aeo' ? 'Page to optimise' : 'Page URL'}
            </ContentFlowInfoLabel>
            {autoFilled && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-green-50 text-green-700">Auto-filled</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ContentFlowTextInput
              required
              value={sourceUrl}
              onChange={e => { onChange({ sourceUrl: e.target.value }); setUrlScraped(false); }}
              placeholder="https://example.com/services"
              className="flex-1"
            />
            <button
              type="button"
              onClick={handleScrape}
              disabled={!sourceUrl || urlScraping}
              className="h-10 px-4 rounded-lg border border-border bg-background text-[13px] text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {urlScraping ? 'Scraping...' : 'Scrape page'}
            </button>
          </div>
          {urlScraped && (
            <div className="flex items-center gap-2 text-[12px] rounded-lg px-3 py-2 bg-green-50 border border-green-100 text-green-700">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" fill="#4CAE3D" />
                <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="flex-1">LushGreen Landscapes · Services page</span>
              <button type="button" onClick={() => setUrlScraped(false)} className="text-green-600 hover:text-green-800">
                <X size={12} strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </div>
          )}
        </div>
      )}

      {template === 'existing' && (
        <div className="space-y-2">
          <p className="text-[13px] text-foreground">Import your existing FAQs</p>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
            {(['upload', 'url', 'paste'] as TabId[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-[12px] transition-colors capitalize',
                  activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeTab === 'url' && (
            <ContentFlowTextInput
              value={sourceUrl}
              onChange={e => onChange({ sourceUrl: e.target.value })}
              placeholder="https://example.com/faq"
            />
          )}
          {activeTab === 'paste' && (
            <ContentFlowTextarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="Paste your existing FAQ content here..."
              rows={5}
            />
          )}
          {activeTab === 'upload' && (
            <div className="rounded-lg border-2 border-dashed border-border px-4 py-6 text-center text-[13px] text-muted-foreground hover:border-primary/30 transition-colors cursor-pointer">
              Drop a file or click to browse (.pdf · .docx · .txt)
            </div>
          )}
        </div>
      )}

      {template === 'support' && (
        <div className="flex flex-col gap-3">
          <label className="text-[13px] text-foreground">Data sources</label>
          <ToggleRow label="Reviews data" checked={supportToggles.reviews} onChange={v => setSupportToggles(p => ({ ...p, reviews: v }))} />
          <ToggleRow label="Ticketing data" checked={supportToggles.tickets} onChange={v => setSupportToggles(p => ({ ...p, tickets: v }))} />
          <ToggleRow label="NPS responses" checked={supportToggles.nps} onChange={v => setSupportToggles(p => ({ ...p, nps: v }))} />
        </div>
      )}

      {template === 'location' && (
        <div className="rounded-lg bg-muted px-4 py-3 text-[13px] text-muted-foreground">
          FAQs will be generated per selected location using your brand identity and location context.
        </div>
      )}

      {template === 'custom' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <ContentFlowInfoLabel tooltip="Paste a URL or add context for your custom FAQ set.">
              Source URL (optional)
            </ContentFlowInfoLabel>
            <ContentFlowTextInput
              value={sourceUrl}
              onChange={e => onChange({ sourceUrl: e.target.value })}
              placeholder="https://yourwebsite.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-foreground">Custom sources</label>
            {SIGNAL_SOURCES.map(src => (
              <label key={src.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={signalSources.includes(src.id)}
                  onChange={() => toggleSignal(src.id)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-[13px] text-foreground">{src.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Signal sources (shown for all non-custom templates) */}
      {showSignalSources && (
        <div className="flex flex-col gap-2">
          <label className="text-[13px] text-foreground">Signal sources</label>
          {SIGNAL_SOURCES.slice(0, 4).map(src => (
            <label key={src.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={signalSources.includes(src.id)}
                onChange={() => toggleSignal(src.id)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-[13px] text-foreground">{src.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* Additional context */}
      <div className="space-y-1.5">
        <label className="text-[13px] text-foreground">Anything specific you want covered?</label>
        <ContentFlowTextarea
          value={additionalContext}
          onChange={e => onChange({ additionalContext: e.target.value })}
          placeholder="e.g. Focus on pricing questions, cover our new service offering, avoid mentioning competitors..."
          rows={3}
        />
      </div>
    </div>
  );
}

// ── Step 3: Content brief ─────────────────────────────────────────────────────

interface Step3Props {
  value: string;
  onChange: (value: string) => void;
}

function Step3ContentBrief({ value, onChange }: Step3Props) {
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setGenerating(false), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className={CONTENT_FLOW_STEP_TITLE_CLASS}>Content brief</h2>
      </div>

      {generating ? (
        <div className="px-4 py-2 rounded-[8px] border border-border bg-background animate-pulse">
          <div className="space-y-2">
            <div className="h-2.5 rounded-full bg-muted w-[90%]" />
            <div className="h-2.5 rounded-full bg-muted w-full" />
            <div className="h-2.5 rounded-full bg-muted w-[70%]" />
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <ContentFlowTextarea
            value={value}
            onChange={event => onChange(event.target.value)}
            rows={5}
            className="text-[14px] md:text-[14px] leading-6"
          />
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FAQInlineCreationFlow({ onComplete, onCancel, controlRef, onNavStateChange, hideProgress = false, initialData }: FAQInlineCreationFlowProps) {
  const TOTAL_STEPS = 2;
  const [step, setStep] = useState(0);

  // Step 1 state
  const [contentName, setContentName] = useState(initialData?.contentName ?? '');
  const [brandKit, setBrandKit]       = useState(initialData?.brandKit ?? 'olive-garden');
  const [locations, setLocations]     = useState<string[]>(initialData?.locations ?? LOCATIONS.map(l => l.id));

  // Step 2 state
  const [template, setTemplate]           = useState(initialData?.template ?? 'aeo');
  const [customAgent, setCustomAgent]     = useState(initialData?.customAgent ?? 'on-demand');
  const [sourceUrl, setSourceUrl]         = useState(initialData?.sourceUrl ?? '');
  const [additionalContext, setContext]   = useState(initialData?.additionalContext ?? '');
  const [questionCount, setQuestionCount] = useState(initialData?.questionCount ?? 14);
  const [signalSources, setSignals]       = useState<string[]>(initialData?.signalSources ?? ['reviews', 'website']);
  const [attachments, setAttachments]     = useState<string[]>(initialData?.attachments ?? []);

  // Step 3 state
  const [contentBrief, setContentBrief] = useState('Create an AEO-ready FAQ set that answers the most common customer questions about pricing, bookings, services, locations, response times, and edge cases. Use the selected brand identity and location context, pull supporting signals from reviews and website content, and keep answers clear, direct, and useful for search and AI-generated responses.');
  const [sections] = useState<FAQSection[]>(DEFAULT_SECTIONS);

  const handleStep2Change = (patch: Partial<Pick<FAQFlowData, 'customAgent' | 'sourceUrl' | 'additionalContext' | 'signalSources'>>) => {
    if (patch.customAgent !== undefined) setCustomAgent(patch.customAgent);
    if (patch.sourceUrl !== undefined) setSourceUrl(patch.sourceUrl);
    if (patch.additionalContext !== undefined) setContext(patch.additionalContext);
    if (patch.signalSources !== undefined) setSignals(patch.signalSources);
  };

  const canAdvance = [
    contentName.trim() !== '' && brandKit !== '' && locations.length > 0,
    sourceUrl.trim() !== '',
  ][step];

  const handleGenerate = useCallback(() => {
    const briefSections = sections.map((section, index) => index === 0 ? { ...section, description: contentBrief } : section);
    const distributedSections = distributeQuestionCount(briefSections, questionCount);
    onComplete({
      contentName, brandKit, locations, template, customAgent, sourceUrl,
      additionalContext, questionCount, signalSources, attachments, contentBrief, sections: distributedSections,
    });
  }, [
    additionalContext,
    attachments,
    brandKit,
    contentBrief,
    contentName,
    customAgent,
    locations,
    onComplete,
    questionCount,
    sections,
    signalSources,
    sourceUrl,
    template,
  ]);

  // Keep external navigation controls fresh without notifying parent state.
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

  // Notify parent navigation state only when the visible step state changes.
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
        <div className="h-full overflow-y-auto rounded-lg border border-border bg-background px-[30px] pb-[30px] pt-[30px]">
          <div className="w-1/2 min-w-[520px] max-w-[720px]">

          {step === 0 && (
            <Step1BrandKit
              contentName={contentName}
              brandKit={brandKit}
              locations={locations}
              customAgent={customAgent}
              onChange={(name, bk, locs) => {
                setContentName(name);
                if (bk !== brandKit) {
                  const allowed = BRAND_FAQ_AGENTS[bk];
                  if (allowed && !allowed.includes(customAgent)) setCustomAgent('');
                }
                setBrandKit(bk);
                setLocations(locs);
              }}
              onAgentChange={setCustomAgent}
            />
          )}

          {step === 1 && (
            <Step2Setup
              template={template}
              customAgent={customAgent}
              sourceUrl={sourceUrl}
              additionalContext={additionalContext}
              signalSources={signalSources}
              onChange={handleStep2Change}
            />
          )}
          </div>
        </div>
      </div>

    </div>
  );
}
