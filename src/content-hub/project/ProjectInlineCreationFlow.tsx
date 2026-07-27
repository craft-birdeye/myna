/**
 * ProjectInlineCreationFlow
 *
 * 3-step inline creation flow for project generation inside ContentEditorShell.
 * Matches contenthub 2.0 ProjectWizardStep1/2/3 content.
 *
 * Steps:
 *  1. brand-kit — Project name, brand identity, locations
 *  2. source    — Campaign brief, reference URLs, files, data sources
 *  3. tune      — Objective, audience, tone, content mix, approval flow
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Check, Minus, Plus, Upload, X } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import {
  CONTENT_FLOW_STEP_TITLE_CLASS,
  ContentFlowLocationFlatList,
  ContentFlowSelect,
  ContentFlowTextarea,
  ContentFlowTextInput,
} from '../shared/ContentFlowControls';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ContentMixItem {
  type: string;
  count: number;
}

export interface ProjectFlowData {
  projectName: string;
  brandKit: string;
  locations: string[];
  brief: string;
  refUrls: string[];
  attachedFiles: string[];
  sources: string[];
  objective: string;
  audience: string;
  tone: string;
  contentMix: ContentMixItem[];
  approvalFlow: string;
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

export interface ProjectInlineCreationFlowProps {
  onComplete: (data: ProjectFlowData) => void;
  onCancel: () => void;
  controlRef?: React.MutableRefObject<FlowNavControls | null>;
  onNavStateChange?: (state: FlowNavState) => void;
  hideProgress?: boolean;
  initialData?: Partial<ProjectFlowData>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BRAND_KITS = [
  { value: 'olive-garden', label: 'Olive Garden corporate' },
  { value: 'birdeye-demo', label: 'Birdeye demo brand' },
  { value: 'local-seo',    label: 'Local SEO identity' },
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

const ALL_LOCATION_IDS = LOCATIONS.map(l => l.id);

const TONES = [
  { value: 'Professional',    label: 'Professional' },
  { value: 'Friendly',        label: 'Friendly' },
  { value: 'Authoritative',   label: 'Authoritative' },
  { value: 'Conversational',  label: 'Conversational' },
  { value: 'Empathetic',      label: 'Empathetic' },
];

const DEFAULT_CONTENT_MIX: ContentMixItem[] = [
  { type: 'Blog post',      count: 1 },
  { type: 'Facebook post',  count: 2 },
  { type: 'Instagram post', count: 2 },
  { type: 'LinkedIn post',  count: 1 },
  { type: 'Email',          count: 1 },
];

const ALL_CONTENT_TYPES = [
  'Blog post', 'Facebook post', 'Instagram post', 'LinkedIn post',
  'Email', 'FAQ', 'Landing page', 'Review responses',
];

const OBJECTIVES = [
  { id: 'visibility', label: 'Search visibility',  description: 'Rank in Google SGE, AI answer engines, and featured snippets' },
  { id: 'support',    label: 'Customer support',   description: 'Reduce repetitive support questions with self-serve answers' },
  { id: 'conversion', label: 'Conversion',          description: 'Answer objections and build trust to convert more visitors' },
];

const DATA_SOURCES = [
  { id: 'reviews', label: 'Birdeye reviews',   sub: '3,421 reviews available' },
  { id: 'tickets', label: 'Support tickets',   sub: 'Upload CSV to connect' },
  { id: 'nps',     label: 'NPS responses',     sub: 'Upload CSV to connect' },
];

const APPROVAL_OPTIONS = [
  { id: 'auto',   label: 'Auto-approve and publish' },
  { id: 'review', label: 'Require review before publishing' },
];

const STEP_LABELS = ['Brand & location', 'Source & context', 'Tune & publish'];

// ── Step indicator ─────────────────────────────────────────────────────────────

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
                'w-[60px] h-px shrink-0 transition-colors',
                done ? 'bg-accent-positive' : 'bg-border',
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Toggle row helper ──────────────────────────────────────────────────────────

function ToggleRow({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-background">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn('w-8 h-5 rounded-full transition-colors relative flex-shrink-0', checked ? 'bg-primary' : 'bg-muted')}
      >
        <span className={cn('absolute top-0.5 size-3.5 bg-white rounded-full transition-transform shadow-sm', checked ? 'translate-x-4' : 'translate-x-0.5')} />
      </button>
      <div>
        <p className="text-[13px] text-foreground">{label}</p>
        {sub && <p className="text-[12px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

// ── Step 1: Brand & location ───────────────────────────────────────────────────

interface Step1Props {
  projectName: string;
  brandKit: string;
  locations: string[];
  onChange: (patch: { projectName?: string; brandKit?: string; locations?: string[] }) => void;
}

function Step1BrandLocation({ projectName, brandKit, locations, onChange }: Step1Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className={CONTENT_FLOW_STEP_TITLE_CLASS}>Select brand identity and location</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Content will be created from the selected brand identity and location context.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-[13px] text-foreground">
            Project name <span className="text-destructive">*</span>
          </label>
          <ContentFlowTextInput
            value={projectName}
            onChange={e => onChange({ projectName: e.target.value })}
            placeholder="e.g. LushGreen spring campaign 2025"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] text-foreground">
            Brand identity <span className="text-destructive">*</span>
          </label>
          <ContentFlowSelect
            value={brandKit}
            onChange={value => onChange({ brandKit: value })}
            options={BRAND_KITS}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] text-foreground">
            Locations <span className="text-destructive">*</span>
          </label>
          <ContentFlowLocationFlatList
            values={locations}
            options={LOCATIONS.map(loc => ({ value: loc.id, label: loc.label }))}
            onChange={locs => onChange({ locations: locs })}
            description="Choose the locations this project will apply to."
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Source & context ───────────────────────────────────────────────────

interface Step2Props {
  brief: string;
  refUrls: string[];
  attachedFiles: string[];
  sources: string[];
  onChange: (patch: Partial<Pick<ProjectFlowData, 'brief' | 'refUrls' | 'attachedFiles' | 'sources'>>) => void;
}

function Step2Source({ brief, refUrls, attachedFiles, sources, onChange }: Step2Props) {
  const [urlInput, setUrlInput] = useState('');

  function handleAutoFill() {
    onChange({ brief: 'Spring landscaping campaign for homeowners in suburban US markets. Goal: drive bookings for lawn care and garden design packages. All 10 locations active.' });
  }

  function addUrl() {
    const url = urlInput.trim();
    if (!url || refUrls.length >= 5 || refUrls.includes(url)) return;
    onChange({ refUrls: [...refUrls, url] });
    setUrlInput('');
  }

  function removeUrl(i: number) {
    onChange({ refUrls: refUrls.filter((_, idx) => idx !== i) });
  }

  function toggleSource(src: string) {
    const next = sources.includes(src) ? sources.filter(s => s !== src) : [...sources, src];
    onChange({ sources: next });
  }

  function handleMockBrowse() {
    const name = 'campaign-brief.pdf';
    if (!attachedFiles.includes(name)) onChange({ attachedFiles: [...attachedFiles, name] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={CONTENT_FLOW_STEP_TITLE_CLASS}>Source & context</h2>
      </div>

      {/* Auto-suggest banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-primary shrink-0">
          <path d="M7.5 1L9.18 5.26L13.5 5.63L10.5 8.14L11.45 12.5L7.5 10.27L3.55 12.5L4.5 8.14L1.5 5.63L5.82 5.26L7.5 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-foreground">Use your project context</p>
          <p className="text-[12px] text-muted-foreground">We found recent campaign data from your brand identity</p>
        </div>
        <button
          type="button"
          onClick={handleAutoFill}
          className="h-8 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground hover:bg-muted transition-colors shrink-0"
        >
          Use this
        </button>
      </div>

      {/* Campaign brief */}
      <div className="space-y-1.5">
        <label className="text-[13px] text-foreground">Campaign brief</label>
        <ContentFlowTextarea
          rows={4}
          value={brief}
          onChange={e => onChange({ brief: e.target.value })}
          placeholder="Describe what this project is about — the goal, audience, key messages, and any important context..."
        />
      </div>

      {/* Reference URLs */}
      <div className="space-y-1.5">
        <label className="text-[13px] text-foreground">Reference URLs</label>
        <div className="flex items-center gap-2">
          <ContentFlowTextInput
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
            placeholder="https://example.com/page"
            className="flex-1"
          />
          <button
            type="button"
            onClick={addUrl}
            disabled={!urlInput.trim() || refUrls.length >= 5}
            className="h-10 px-4 rounded-lg border border-border bg-background text-[13px] text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5"
          >
            <Plus size={14} strokeWidth={1.6} absoluteStrokeWidth />
            Add
          </button>
        </div>
        {refUrls.length > 0 && (
          <div className="flex flex-col gap-1">
            {refUrls.map((url, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-[12px]">
                <span className="flex-1 text-foreground truncate">{url}</span>
                <button type="button" onClick={() => removeUrl(i)} className="text-muted-foreground hover:text-foreground shrink-0">
                  <X size={12} strokeWidth={1.6} absoluteStrokeWidth />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File attachments */}
      <div className="space-y-1.5">
        <label className="text-[13px] text-foreground">Attach files</label>
        <button
          type="button"
          onClick={handleMockBrowse}
          className="w-full rounded-lg border-2 border-dashed border-border px-4 py-6 flex flex-col items-center gap-2 transition-colors hover:border-primary/30 hover:bg-muted/30"
        >
          <Upload size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
          <span className="text-[13px] text-foreground">Drop files or click to browse</span>
          <span className="text-[11px] text-muted-foreground">Accepts .pdf .docx .txt .png .jpg</span>
        </button>
        {attachedFiles.length > 0 && (
          <div className="flex flex-col gap-1">
            {attachedFiles.map(name => (
              <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-[12px]">
                <span className="flex-1 text-foreground truncate">{name}</span>
                <button type="button" onClick={() => onChange({ attachedFiles: attachedFiles.filter(f => f !== name) })} className="text-muted-foreground hover:text-foreground">
                  <X size={12} strokeWidth={1.6} absoluteStrokeWidth />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data sources */}
      <div className="flex flex-col gap-3">
        <label className="text-[13px] text-foreground">Data sources</label>
        {DATA_SOURCES.map(src => (
          <ToggleRow
            key={src.id}
            label={src.label}
            sub={src.sub}
            checked={sources.includes(src.id)}
            onChange={v => toggleSource(src.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Step 3: Tune & publish ─────────────────────────────────────────────────────

interface Step3Props {
  objective: string;
  audience: string;
  tone: string;
  contentMix: ContentMixItem[];
  approvalFlow: string;
  onChange: (patch: Partial<Pick<ProjectFlowData, 'objective' | 'audience' | 'tone' | 'contentMix' | 'approvalFlow'>>) => void;
}

function Step3Tune({ objective, audience, tone, contentMix, approvalFlow, onChange }: Step3Props) {
  const unusedTypes = ALL_CONTENT_TYPES.filter(t => !contentMix.find(m => m.type === t));

  function adjustCount(type: string, delta: number) {
    onChange({
      contentMix: contentMix.map(m =>
        m.type === type ? { ...m, count: Math.max(1, m.count + delta) } : m,
      ),
    });
  }

  function removeType(type: string) {
    onChange({ contentMix: contentMix.filter(m => m.type !== type) });
  }

  function addType(type: string) {
    if (!contentMix.find(m => m.type === type)) {
      onChange({ contentMix: [...contentMix, { type, count: 1 }] });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={CONTENT_FLOW_STEP_TITLE_CLASS}>Tune & publish</h2>
      </div>

      {/* Objective */}
      <div className="space-y-2">
        <label className="text-[13px] text-foreground">Objective</label>
        <div className="flex flex-col gap-2">
          {OBJECTIVES.map(obj => {
            const selected = objective === obj.id;
            return (
              <button
                key={obj.id}
                type="button"
                onClick={() => onChange({ objective: obj.id })}
                className={cn(
                  'relative flex items-center gap-3 text-left bg-background rounded-lg px-4 py-3 transition-all',
                  selected ? 'border-2 border-primary' : 'border border-border hover:border-primary/40',
                )}
              >
                <div className="flex-1 flex flex-col gap-0.5">
                  <p className="text-[13px] text-foreground">{obj.label}</p>
                  <p className="text-[12px] text-muted-foreground leading-snug">{obj.description}</p>
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
      </div>

      {/* Target audience */}
      <div className="space-y-1.5">
        <label className="text-[13px] text-foreground">Target audience</label>
        <ContentFlowTextarea
          rows={2}
          value={audience}
          onChange={e => onChange({ audience: e.target.value })}
          placeholder="Describe who this project is for..."
        />
        <p className="text-[12px] text-muted-foreground">From your brand identity · edit freely</p>
      </div>

      {/* Tone of voice */}
      <div className="space-y-1.5">
        <label className="text-[13px] text-foreground">Tone of voice</label>
        <ContentFlowSelect
          value={tone}
          onChange={value => onChange({ tone: value })}
          options={TONES}
        />
      </div>

      {/* Content mix */}
      <div className="flex flex-col gap-3">
        <label className="text-[13px] text-foreground">Content mix</label>
        {contentMix.map(item => (
          <div key={item.type} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-background">
            <span className="flex-1 text-[13px] text-foreground">{item.type}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustCount(item.type, -1)}
                disabled={item.count <= 1}
                className="size-6 flex items-center justify-center rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-40"
              >
                <Minus size={12} strokeWidth={1.6} absoluteStrokeWidth />
              </button>
              <span className="text-[13px] text-foreground w-4 text-center">{item.count}</span>
              <button
                type="button"
                onClick={() => adjustCount(item.type, 1)}
                className="size-6 flex items-center justify-center rounded-md border border-border hover:bg-muted transition-colors"
              >
                <Plus size={12} strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </div>
            <button
              type="button"
              onClick={() => removeType(item.type)}
              className="text-muted-foreground hover:text-foreground text-[11px] px-2 py-1 rounded hover:bg-muted transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
        {unusedTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {unusedTypes.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => addType(t)}
                className="flex items-center gap-1.5 border border-dashed border-border rounded-full px-3 py-1 text-[12px] text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
              >
                <Plus size={11} strokeWidth={1.6} absoluteStrokeWidth />
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border" />

      {/* Approval flow */}
      <div className="space-y-2">
        <label className="text-[13px] text-foreground">Approval flow</label>
        <div className="flex flex-wrap gap-2">
          {APPROVAL_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange({ approvalFlow: opt.id })}
              className={cn(
                'border rounded-full px-3 py-1.5 text-[12px] transition-colors',
                approvalFlow === opt.id
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/40',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ProjectInlineCreationFlow({
  onComplete, onCancel, controlRef, onNavStateChange, hideProgress = false, initialData,
}: ProjectInlineCreationFlowProps) {
  const TOTAL_STEPS = 3;
  const [step, setStep] = useState(0);

  // Step 1
  const [projectName, setProjectName] = useState(initialData?.projectName ?? '');
  const [brandKit, setBrandKit]       = useState(initialData?.brandKit ?? 'olive-garden');
  const [locations, setLocations]     = useState<string[]>(initialData?.locations ?? ALL_LOCATION_IDS);

  // Step 2
  const [brief, setBrief]                 = useState(initialData?.brief ?? '');
  const [refUrls, setRefUrls]             = useState<string[]>(initialData?.refUrls ?? []);
  const [attachedFiles, setAttachedFiles] = useState<string[]>(initialData?.attachedFiles ?? []);
  const [sources, setSources]             = useState<string[]>(initialData?.sources ?? ['reviews']);

  // Step 3
  const [objective, setObjective]     = useState(initialData?.objective ?? 'visibility');
  const [audience, setAudience]       = useState(initialData?.audience ?? '');
  const [tone, setTone]               = useState(initialData?.tone ?? 'Professional');
  const [contentMix, setContentMix]   = useState<ContentMixItem[]>(initialData?.contentMix ?? DEFAULT_CONTENT_MIX);
  const [approvalFlow, setApproval]   = useState(initialData?.approvalFlow ?? 'review');

  const handleStep1Change = (patch: { projectName?: string; brandKit?: string; locations?: string[] }) => {
    if (patch.projectName !== undefined) setProjectName(patch.projectName);
    if (patch.brandKit !== undefined) setBrandKit(patch.brandKit);
    if (patch.locations !== undefined) setLocations(patch.locations);
  };

  const handleStep2Change = (patch: Partial<Pick<ProjectFlowData, 'brief' | 'refUrls' | 'attachedFiles' | 'sources'>>) => {
    if (patch.brief !== undefined) setBrief(patch.brief);
    if (patch.refUrls !== undefined) setRefUrls(patch.refUrls);
    if (patch.attachedFiles !== undefined) setAttachedFiles(patch.attachedFiles);
    if (patch.sources !== undefined) setSources(patch.sources);
  };

  const handleStep3Change = (patch: Partial<Pick<ProjectFlowData, 'objective' | 'audience' | 'tone' | 'contentMix' | 'approvalFlow'>>) => {
    if (patch.objective !== undefined) setObjective(patch.objective);
    if (patch.audience !== undefined) setAudience(patch.audience);
    if (patch.tone !== undefined) setTone(patch.tone);
    if (patch.contentMix !== undefined) setContentMix(patch.contentMix);
    if (patch.approvalFlow !== undefined) setApproval(patch.approvalFlow);
  };

  const canAdvance = [
    projectName.trim() !== '' && brandKit !== '' && locations.length > 0,
    true, // step 2 brief is optional
    true, // step 3 always valid
  ][step];

  const handleGenerate = useCallback(() => {
    onComplete({
      projectName, brandKit, locations,
      brief, refUrls, attachedFiles, sources,
      objective, audience, tone, contentMix, approvalFlow,
    });
  }, [approvalFlow, attachedFiles, audience, brandKit, brief, contentMix, locations, objective, onComplete, projectName, refUrls, sources, tone]);

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

      <div className="flex-1 min-h-0 overflow-hidden py-4 pl-4 pr-6">
        <div className="h-full overflow-y-auto rounded-lg border border-border bg-background px-[30px] pb-[30px] pt-[30px]">
          <div className="w-1/2 min-w-[520px] max-w-[720px]">

            {step === 0 && (
              <Step1BrandLocation
                projectName={projectName}
                brandKit={brandKit}
                locations={locations}
                onChange={handleStep1Change}
              />
            )}

            {step === 1 && (
              <Step2Source
                brief={brief}
                refUrls={refUrls}
                attachedFiles={attachedFiles}
                sources={sources}
                onChange={handleStep2Change}
              />
            )}

            {step === 2 && (
              <Step3Tune
                objective={objective}
                audience={audience}
                tone={tone}
                contentMix={contentMix}
                approvalFlow={approvalFlow}
                onChange={handleStep3Change}
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
