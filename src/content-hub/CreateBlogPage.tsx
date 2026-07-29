import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowUpRight, Check, Sparkles, Loader2, Upload, X, FileText, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { Button } from '@/contenthub-ui/button';
import { Switch } from '@/contenthub-ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/contenthub-ui/popover';
import { MOCK_RECOMMENDATIONS } from '@/search-ai/SearchAIRecommendationsPanel';
import {
  ContentFlowStepper,
  ContentFlowInfoLabel,
  ContentFlowKeywordTagInput,
  ContentFlowLocationFlatList,
  ContentFlowSelect,
  ContentFlowTextarea,
  ContentFlowTextInput,
  CONTENT_FLOW_STEP_TITLE_CLASS,
  type ContentFlowStep,
} from './shared/ContentFlowControls';

// ── Data ──────────────────────────────────────────────────────────────────────

interface BrandKit {
  id: string;
  label: string;
  locations: { value: string; label: string }[];
}

const BRAND_KITS: BrandKit[] = [
  {
    id: 'smile-dental',
    label: 'Smile Dental Group',
    locations: [
      { value: 'l1',  label: '1001 - Mountain View, CA' },
      { value: 'l2',  label: '1002 - San Jose, CA' },
      { value: 'l3',  label: '1003 - Palo Alto, CA' },
      { value: 'l4',  label: '1004 - Sunnyvale, CA' },
      { value: 'l5',  label: '1005 - Santa Clara, CA' },
      { value: 'l6',  label: '1006 - Cupertino, CA' },
      { value: 'l7',  label: '1007 - Los Altos, CA' },
      { value: 'l8',  label: '1008 - Menlo Park, CA' },
      { value: 'l9',  label: '1009 - Redwood City, CA' },
      { value: 'l10', label: '1010 - Foster City, CA' },
    ],
  },
  {
    id: 'acme-dental',
    label: 'Acme Dental — Westside',
    locations: [
      { value: 'a1', label: '1001 - West LA, CA' },
      { value: 'a2', label: '1002 - Santa Monica, CA' },
      { value: 'a3', label: '1003 - Brentwood, CA' },
    ],
  },
  {
    id: 'bayview-ortho',
    label: 'Bayview Orthodontics',
    locations: [
      { value: 'b1', label: '1001 - San Francisco, CA' },
      { value: 'b2', label: '1002 - Oakland, CA' },
      { value: 'b3', label: '1003 - Berkeley, CA' },
      { value: 'b4', label: '1004 - Marin, CA' },
      { value: 'b5', label: '1005 - Walnut Creek, CA' },
    ],
  },
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
  'smile-dental':   ['blog-default', 'story-writer', 'brand-voice'],
  'acme-dental':    ['seo-writer', 'local-blogger', 'blog-default'],
  'bayview-ortho':  ['authority', 'seo-writer', 'brand-voice'],
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

const STEPS: ContentFlowStep[] = [
  { id: 'brand-kit', label: 'Brand identity' },
  { id: 'setup',     label: 'Blog setup' },
];

// ── YouTube source-link validation ───────────────────────────────────────────
//
// Covers what's determinable from the URL string alone. Codes that require an
// actual server-side admission probe (video_unavailable, video_too_long,
// rate_limited, summary_generation_temporarily_unavailable) belong to the
// generation API, not this field, and should surface from that response once
// this flow is wired to a real backend.
type VideoLinkErrorCode =
  | 'invalid_youtube_url'
  | 'unsupported_youtube_url_shape'
  | 'video_live_not_supported';

const VIDEO_LINK_ERROR_MESSAGES: Record<VideoLinkErrorCode, string> = {
  invalid_youtube_url: 'Please provide a valid YouTube video link.',
  unsupported_youtube_url_shape: 'This link does not point to a single YouTube video.',
  video_live_not_supported: 'Live or currently airing videos are not supported yet.',
};

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'];

function validateYoutubeUrl(rawUrl: string): VideoLinkErrorCode | null {
  const url = rawUrl.trim();
  if (!url) return 'invalid_youtube_url';

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'invalid_youtube_url';
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'invalid_youtube_url';
  }
  if (!YOUTUBE_HOSTS.includes(parsed.hostname)) {
    return 'invalid_youtube_url';
  }

  if (/^\/live\/[^/]+/.test(parsed.pathname)) {
    return 'video_live_not_supported';
  }

  if (parsed.hostname === 'youtu.be') {
    const videoId = parsed.pathname.replace(/^\//, '');
    return videoId ? null : 'unsupported_youtube_url_shape';
  }

  if (parsed.pathname === '/watch') {
    return parsed.searchParams.get('v') ? null : 'unsupported_youtube_url_shape';
  }
  if (/^\/shorts\/[^/]+/.test(parsed.pathname)) {
    return null;
  }

  // /playlist, /channel/*, /@handle, /results, or anything else without a resolvable single-video shape
  return 'unsupported_youtube_url_shape';
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CreateBlogPageFlowData {
  contentName: string;
  brandKitId: string;
  locations: string[];
  agentId: string;
  topic: string;
  keywords: string[];
  intent: string;
  objective: string;
  funnelStage: string;
  length: string;
  brief: string;
  attachments: string[];
}

export interface CreateBlogPageProps {
  onCancel: () => void;
  onGenerate: (data: CreateBlogPageFlowData) => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export function CreateBlogPage({ onCancel, onGenerate }: CreateBlogPageProps) {
  const [step, setStep] = useState(0);

  // Step 1
  const [blogName, setBlogName]           = useState('');
  const [brandKitId, setBrandKitId]       = useState('smile-dental');
  const currentKit = BRAND_KITS.find(k => k.id === brandKitId) ?? BRAND_KITS[0];
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    BRAND_KITS[0].locations.map(l => l.value),
  );
  const [agentId, setAgentId] = useState('blog-default');

  // Step 2
  const [createMode, setCreateMode] = useState<'topic' | 'url'>('topic');
  const [topic, setTopic]           = useState('');
  const [sourceUrl, setSourceUrl]   = useState('');
  const [sourceUrlError, setSourceUrlError] = useState<string | null>(null);
  const [keywords, setKeywords]     = useState<string[]>([]);
  const [intent, setIntent]         = useState('agent');
  const [objective, setObjective]   = useState('agent');
  const [funnelStage, setFunnelStage] = useState('agent');
  const [length, setLength]         = useState('medium');
  const [brief, setBrief]           = useState('');
  const [refUrls, setRefUrls]       = useState<string[]>([]);
  const [refUrlInput, setRefUrlInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [advancedOpen, setAdvancedOpen]   = useState(false);
  const [includeImages, setIncludeImages]   = useState(true);
  const [includeCTAs, setIncludeCTAs]       = useState(true);
  const [includeFAQ, setIncludeFAQ]         = useState(true);
  const [internalLinks, setInternalLinks]   = useState(true);
  const [generatingTopic, setGeneratingTopic] = useState(false);
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const topicIdxRef   = useRef(0);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const topicTextareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResizeTopic = useCallback(() => {
    const el = topicTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => { autoResizeTopic(); }, [topic, autoResizeTopic]);

  const canAdvance = step === 0
    ? blogName.trim().length > 0 && selectedLocations.length > 0
    : createMode === 'topic'
      ? topic.trim().length >= 5
      : sourceUrl.trim().length > 0;

  function handleBrandKitChange(id: string) {
    const kit = BRAND_KITS.find(k => k.id === id);
    if (!kit) return;
    setBrandKitId(id);
    setSelectedLocations(kit.locations.map(l => l.value));
    const allowedAgents = BRAND_BLOG_AGENTS[id];
    if (allowedAgents && !allowedAgents.includes(agentId)) {
      setAgentId('');
    }
  }

  function handleGenerateTopic() {
    setGeneratingTopic(true);
    setTimeout(() => {
      const pair = GENERATED_TOPIC_PAIRS[topicIdxRef.current % GENERATED_TOPIC_PAIRS.length];
      setTopic(pair.topic);
      setKeywords(pair.keywords);
      topicIdxRef.current += 1;
      setGeneratingTopic(false);
    }, 900);
  }

  function handleAddUrl() {
    const url = refUrlInput.trim();
    if (!url || refUrls.length >= 5 || refUrls.includes(url)) return;
    setRefUrls(prev => [...prev, url]);
    setRefUrlInput('');
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const names = Array.from(files).map(f => f.name);
    setAttachedFiles(prev => [...prev, ...names].filter((v, i, arr) => arr.indexOf(v) === i));
  }

  function handleNext() {
    if (step < 1) {
      setStep(1);
      return;
    }
    if (createMode === 'url') {
      const errorCode = validateYoutubeUrl(sourceUrl);
      if (errorCode) {
        setSourceUrlError(VIDEO_LINK_ERROR_MESSAGES[errorCode]);
        return;
      }
    }
    const resolvedTopic = createMode === 'url' ? sourceUrl : topic;
    const resolvedName = blogName.trim() || resolvedTopic.split('\n')[0].trim();
    onGenerate({
      contentName: resolvedName,
      brandKitId,
      locations: selectedLocations,
      agentId,
      topic: resolvedTopic,
      keywords,
      intent,
      objective,
      funnelStage,
      length,
      brief,
      attachments: attachedFiles,
    });
  }

  // ── Step 1: Blog setup ────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <div className="space-y-8">
        <h2 className={CONTENT_FLOW_STEP_TITLE_CLASS}>Blog setup</h2>

        {/* Create mode radio list */}
        <div className="space-y-1">
          <label className="text-[13px] font-medium text-foreground">
            How would you like to create this blog?
          </label>

          {/* Option 1 — topic */}
          <div className="pt-4">
            <button
              type="button"
              onClick={() => setCreateMode('topic')}
              className="flex items-start gap-3 w-full text-left"
            >
              {/* Radio circle */}
              <span className={cn(
                'mt-0.5 h-4 w-4 flex-none rounded-full border-2 flex items-center justify-center transition-colors',
                createMode === 'topic' ? 'border-primary bg-primary' : 'border-border bg-background',
              )}>
                {createMode === 'topic' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium text-foreground">Start with a topic</span>
                <span className="text-[12px] text-muted-foreground">Describe what you want the blog to cover</span>
              </span>
            </button>

            {/* Inline expanded input for topic mode */}
            {createMode === 'topic' && (
              <div className="ml-7 mt-4 rounded-lg border border-border overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-colors">
                <textarea
                  ref={topicTextareaRef}
                  value={topic}
                  onChange={e => { setTopic(e.target.value); autoResizeTopic(); }}
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
                      <div className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground border-b border-border">
                        Search AI recommendations
                      </div>
                      <div className="flex max-h-[360px] flex-col overflow-y-auto py-1">
                        {MOCK_RECOMMENDATIONS.map((rec) => (
                          <div key={rec.id} className="group/rec relative">
                            <button
                              type="button"
                              onClick={() => {
                                setTopic(`Write a blog post based on this Search AI recommendation: "${rec.title}". Focus on making it locally relevant, authoritative, and optimised for AI search assistants.`);
                                setRecommendationsOpen(false);
                              }}
                              className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-muted"
                            >
                              <span className="text-[13px] text-foreground leading-snug pr-3">{rec.title}</span>
                              <span className={cn(
                                'shrink-0 rounded-full px-2 py-0.5 text-[11px]',
                                rec.impact === 'High'
                                  ? 'bg-red-50 text-red-500'
                                  : rec.impact === 'Medium'
                                    ? 'bg-amber-50 text-amber-600'
                                    : 'bg-muted text-muted-foreground',
                              )}>
                                {rec.impact}
                              </span>
                            </button>
                            <div className="pointer-events-none absolute left-full top-0 z-50 ml-2 w-[240px] rounded-lg border border-border bg-background p-3 shadow-lg opacity-0 transition-opacity group-hover/rec:opacity-100">
                              <p className="text-[12px] font-medium text-foreground mb-1">{rec.impact} impact</p>
                              <p className="text-[12px] leading-relaxed text-muted-foreground">{rec.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <button
                    type="button"
                    disabled={generatingTopic}
                    onClick={handleGenerateTopic}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-60 transition-colors"
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

          {/* Option 2 — URL */}
          <div className="pt-4">
            <button
              type="button"
              onClick={() => setCreateMode('url')}
              className="flex items-start gap-3 w-full text-left"
            >
              <span className={cn(
                'mt-0.5 h-4 w-4 flex-none rounded-full border-2 flex items-center justify-center transition-colors',
                createMode === 'url' ? 'border-primary bg-primary' : 'border-border bg-background',
              )}>
                {createMode === 'url' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium text-foreground">Start with a YouTube video</span>
                <span className="text-[12px] text-muted-foreground">Paste a YouTube video link to use as source material</span>
              </span>
            </button>

            {/* Inline expanded input for URL mode */}
            {createMode === 'url' && (
              <div className="ml-7 mt-4">
                <ContentFlowTextInput
                  value={sourceUrl}
                  onChange={e => {
                    setSourceUrl(e.target.value);
                    if (sourceUrlError) setSourceUrlError(null);
                  }}
                  placeholder="https://youtube.com/watch?v=..."
                  aria-invalid={!!sourceUrlError}
                />
                {sourceUrlError && (
                  <p className="mt-1.5 text-[11px] text-destructive">{sourceUrlError}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Advanced settings accordion — all blog configuration lives here */}
        <div className="rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setAdvancedOpen(o => !o)}
            className="flex items-center justify-between w-full px-4 py-3"
          >
            <span className="text-[13px] font-medium text-foreground">Advanced settings</span>
            {advancedOpen
              ? <ChevronUp size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
              : <ChevronDown size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
            }
          </button>
          {advancedOpen && (
            <div className="flex flex-col gap-5 border-t border-border px-4 py-4">

              {/* Keywords */}
              <div className="space-y-1.5">
                <ContentFlowInfoLabel tooltip="Type a keyword and press Enter, or pick from suggestions.">
                  Keywords
                </ContentFlowInfoLabel>
                <ContentFlowKeywordTagInput
                  values={keywords}
                  suggestions={KEYWORD_OPTIONS}
                  onChange={setKeywords}
                  placeholder="Select or enter keywords"
                />
              </div>

              {/* Length */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground">Length</label>
                <ContentFlowSelect value={length} options={LENGTH_OPTIONS} onChange={setLength} />
              </div>

              {/* Anything specific */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground">Anything specific you want covered?</label>
                <ContentFlowTextarea
                  value={brief}
                  onChange={e => setBrief(e.target.value)}
                  placeholder="What angle, tone, or specific points should the agent know about?"
                  className="min-h-[80px]"
                />
              </div>

              {/* Attachments */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground">Attachments</label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files); }}
                  className={cn(
                    'w-full rounded-lg border-2 border-dashed px-4 py-4 flex flex-col items-center gap-2 transition-colors',
                    isDragOver
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border hover:border-primary/30 hover:bg-muted/30',
                  )}
                >
                  <Upload size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
                  <span className="text-[13px] font-medium text-foreground">Drop files or click to browse</span>
                  <span className="text-[11px] text-muted-foreground">.pdf · .docx · .txt · .png · .jpg</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={e => handleFiles(e.target.files)}
                />
                {attachedFiles.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {attachedFiles.map(name => (
                      <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-[12px]">
                        <FileText size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground shrink-0" />
                        <span className="flex-1 text-foreground truncate">{name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachedFiles(prev => prev.filter(f => f !== name))}
                          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                          <X size={12} strokeWidth={1.6} absoluteStrokeWidth />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Include toggles */}
              <div className="flex flex-col gap-3">
                <label className="text-[13px] font-medium text-foreground">Include in blog</label>
                <ToggleRow label="Images" checked={includeImages} onChange={setIncludeImages} />
                <ToggleRow label="CTAs" checked={includeCTAs} onChange={setIncludeCTAs} />
                <ToggleRow label="FAQ section" checked={includeFAQ} onChange={setIncludeFAQ} />
                <ToggleRow label="Internal links" checked={internalLinks} onChange={setInternalLinks} />
              </div>

              {/* Intent */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground">Intent</label>
                <ContentFlowSelect value={intent} options={INTENT_OPTIONS} onChange={setIntent} />
              </div>

              {/* Objective */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground">Objective</label>
                <ContentFlowSelect value={objective} options={OBJECTIVE_OPTIONS} onChange={setObjective} />
              </div>

              {/* Funnel stage */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground">Funnel stage</label>
                <ContentFlowSelect value={funnelStage} options={FUNNEL_OPTIONS} onChange={setFunnelStage} />
              </div>

              {/* Reference URLs */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground">Reference URLs</label>
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
                    className="h-10 px-4 rounded-[8px] border border-border bg-background text-[13px] font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    Add
                  </button>
                </div>
                {refUrls.length > 0 && (
                  <div className="flex flex-col gap-1 mt-1">
                    {refUrls.map(url => (
                      <div key={url} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-[12px]">
                        <span className="flex-1 text-foreground truncate">{url}</span>
                        <button
                          type="button"
                          onClick={() => setRefUrls(prev => prev.filter(u => u !== url))}
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

            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Step 2: Brand identity ───────────────────────────────────────────────────

  function renderStep2() {
    return (
      <div className="space-y-6">
        <h2 className={CONTENT_FLOW_STEP_TITLE_CLASS}>Select brand identity and location</h2>

        {/* Blog name — auto-filled from topic */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-foreground">
            Blog name <span className="text-destructive">*</span>
          </label>
          <ContentFlowTextInput
            value={blogName}
            onChange={e => setBlogName(e.target.value)}
            placeholder="e.g. Restaurant dining guide series"
          />
        </div>

        {/* Brand identity */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-foreground">
            Brand identity <span className="text-destructive">*</span>
          </label>
          <ContentFlowSelect
            value={brandKitId}
            options={BRAND_KITS.map(k => ({ value: k.id, label: k.label }))}
            onChange={handleBrandKitChange}
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
                <span className="truncate">{BLOG_AGENTS.find(a => a.id === agentId)?.label ?? 'Choose an agent...'}</span>
                <ChevronDown size={16} strokeWidth={1.6} absoluteStrokeWidth className="shrink-0 text-text-icon" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1">
              <div className="flex flex-col">
                {BLOG_AGENTS.filter(a => (BRAND_BLOG_AGENTS[brandKitId] ?? [a.id]).includes(a.id)).map((agent, i) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setAgentId(agent.id)}
                    className={cn(
                      'flex h-[34px] w-full items-center justify-between rounded-sm px-md text-[13px] text-left transition-colors',
                      agentId === agent.id
                        ? 'bg-surface-selected text-text-primary'
                        : 'text-text-primary hover:bg-surface-hover',
                    )}
                  >
                    <span className="truncate">{agent.label}{i === 0 && <span className="ml-1.5 text-[11px] text-text-secondary">(Default)</span>}</span>
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

        {/* Locations */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-foreground">
            Locations <span className="text-destructive">*</span>
          </label>
          <ContentFlowLocationFlatList
            values={selectedLocations}
            options={currentKit.locations}
            onChange={setSelectedLocations}
            description="Choose the locations this content will apply to."
          />
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-background">

      {/* Header — matches ContentEditorShell setup-phase header */}
      <div className="w-full bg-background flex items-center justify-between px-6 py-[9px] flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            aria-label="Go back"
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors flex-none"
          >
            <ArrowLeft size={16} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
          <span className="text-[16px] font-semibold text-foreground leading-tight">Create blog</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(0)}
            disabled={step === 0}
          >
            Back
          </Button>
          <Button
            type="button"
            disabled={!canAdvance}
            onClick={handleNext}
          >
            {step === 0 ? 'Continue' : 'Generate'}
          </Button>
        </div>
      </div>

      {/* Body: left stepper sidebar + right form — same structure as ContentEditorShell */}
      <div className="flex-1 min-h-0 flex">

        {/* Left sidebar — ContentFlowStepper at 250px, exactly matching ContentEditorShell */}
        <aside className="flex-shrink-0 bg-background" style={{ width: 250 }}>
          <div className="px-4 py-4">
            <ContentFlowStepper
              steps={STEPS}
              currentStep={step}
              onStepChange={nextStep => { if (nextStep < step) setStep(nextStep); }}
            />
          </div>
        </aside>

        {/* Right content — same scrollable card shell as BlogInlineCreationFlow */}
        <div className="flex-1 min-w-0 min-h-0 bg-background">
          <div className="h-full overflow-hidden py-4 pl-4 pr-6">
            <div className="h-full overflow-y-auto rounded-lg border border-border bg-background px-[30px] pb-[30px] pt-[30px]">
              <div className="w-1/2 min-w-[520px] max-w-[720px]">
                {step === 0 ? renderStep2() : renderStep1()}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

