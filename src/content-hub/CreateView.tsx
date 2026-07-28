import React from 'react';
import { AiCopilot } from './AiCopilot';
import { InfiniteCanvas } from './InfiniteCanvas';
import {
  ArrowLeft, Edit2, ChevronDown, MoreVertical, Sparkles, LayoutGrid,
  CheckCircle2, RefreshCw, Sliders, Zap, X, BookOpen, Wand2, Plus, GripVertical,
  User, Paperclip, Send, PenLine, Loader2, Check,
} from 'lucide-react';
import { AIIcon } from '@/assets/icons/AIIcon';
import { cn } from '@/contenthub-ui/utils';
import { CopilotPromptBox } from '@/contenthub-ui/copilot-prompt-box';
import { MAIN_VIEW_PRIMARY_HEADING_CLASS } from '@/contenthub-ui/mainViewTitleClasses';
import { Button } from '@/contenthub-ui/button';
import { Input } from '@/contenthub-ui/input';
import { Textarea } from '@/contenthub-ui/textarea';
import { SegmentedToggle } from '@/contenthub-ui/segmented-toggle.v1';

// FAQ flow
import { FAQWizard, type FAQWizardState } from './faq/FAQWizard';
import { FAQCanvasProgress } from './faq/FAQCanvasProgress';
import { FAQCanvas } from './faq/FAQCanvas';           // THE one FAQ canvas
import { FAQEditor } from './faq/FAQEditor';
import { FAQShareModal } from './faq/FAQShareModal';
import { FAQPublishModal } from './faq/FAQPublishModal';

// Social flow
import { SocialWizard, type SocialWizardState } from './social/SocialWizard';
import { SocialEditor } from './social/SocialEditor';

// Email flow
import { EmailWizard, type EmailWizardState } from './email/EmailWizard';
import { EmailEditor } from './email/EmailEditor';

// Blog flow
import { BlogEditor } from './blog/BlogEditor';

// Project / multi-content flow
import { NewProjectBrief, type ProjectBrief } from './NewProjectBrief';
import { ProjectGenerationCanvas } from './ProjectGenerationCanvas';
import { UnifiedReviewCanvas } from './UnifiedReviewCanvas';
import type { ContentCardType } from './shared/GenericSkeletonCard';
import type { ContentType } from './shared/ContentCard';

// Template gallery
import { type TemplateItem } from './TemplateGallery';
import { TemplatePickerModal } from './TemplatePickerModal';
import type { ContentHomeInitialMode } from './ContentHome';

// Canonical overall score — exported so FAQGroupCard badge and publish modal can use it
import { DEFAULT_OVERALL_SCORE } from './shared/ContentScorePanel';

// FAQ data for editor context
import { MOCK_FAQS } from './faq/FAQReviewScreen';
import {
  getFAQs, updateFAQ, updateMeta, subscribeFAQs,
  addQuestion, addSection, getMeta, bulkReplaceQuestions,
} from './faq/faqStore';

// ── Props ────────────────────────────────────────────────────────────────────

interface CreateViewProps {
  onBack: () => void;
  /** Pre-select an initial mode when navigating from ContentHome quick-create */
  initialMode?: ContentHomeInitialMode;
  /** Force a specific left tab on mount (home-driven entry) */
  initialTab?: 'ai' | 'wizard';
  /** Skip straight to the FAQ canvas review screen (e.g. from Recommendations) */
  startAtFAQCanvas?: boolean;
  /** Recommendation context — if set, canvas is in "from recommendation" mode */
  recId?: string;
  recTitle?: string;
  recAeoScore?: number;
  /** Callback to navigate back to the originating recommendation */
  onReturnToRec?: () => void;
  /** Callback so the parent can fire completeRec() when content is published */
  onPublishComplete?: () => void;
  /** Pre-loaded FAQ questions from the Search AI "Accept and edit FAQ" flow */
  preloadedQuestions?: { question: string; answer: string }[];
}

// ── State types ──────────────────────────────────────────────────────────────

type LeftTab = 'ai' | 'wizard';
type WizardType = 'faq' | 'social' | 'email' | null;

/**
 * Canvas modes — governs what the RIGHT panel shows.
 * The LEFT panel is ALWAYS visible and shows contextual content per mode.
 *
 * Direct-editor modes ('socialEditor', 'emailEditor', 'blogEditor') render the
 * full-width 3-column editor, hiding the left panel entirely.
 */
type FullScreenMode =
  | 'faqGenerating'
  | 'faqReady'
  | 'faqEditor'
  | 'brief'
  | 'projectGenerating'
  | 'projectReview'
  | 'socialEditor'
  | 'emailEditor'
  | 'blogEditor'
  | null;

// Editorial score shape (mirrored from FAQEditor)
interface ScoreDimension { label: string; score: number; weight: number }

const DEFAULT_SCORE_DIMS: ScoreDimension[] = [
  { label: 'Brand voice',        score: 88, weight: 30 },
  { label: 'Factual accuracy',   score: 90, weight: 30 },
  { label: 'Content readability',score: 85, weight: 25 },
  { label: 'Originality',        score: 78, weight: 15 },
];

// ── Left-panel mode toggle items (shared by all three panel states) ───────────

const LEFT_TAB_ITEMS = [
  { value: 'ai'     as const, label: 'AI',     icon: <AIIcon size={20} /> },
  { value: 'wizard' as const, label: 'Manual' },
];

// ── Content type options ─────────────────────────────────────────────────────

const CONTENT_TYPES: Array<{
  id: WizardType;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'faq',
    label: 'FAQ page',
    description: 'AEO-ready question & answer sets',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 8h8M6 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'social',
    label: 'Social post',
    description: 'Multi-platform posts with hashtags',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="15" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="5" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="15" cy="15" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.5 8.75l5 -2.5M7.5 11.25l5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'email',
    label: 'Email campaign',
    description: 'Segmented emails with A/B subjects',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

// ── Project canvas shared state ───────────────────────────────────────────────

export interface ProjectDraft {
  goal: string;
  audience: string;
  details: string;
  attachedFile: File | null;
  contentTypes: string[];
  quantities: Record<string, number>;
  duration: string;
}

const DEFAULT_PROJECT_DRAFT: ProjectDraft = {
  goal: '', audience: '', details: '', attachedFile: null,
  contentTypes: [], quantities: {}, duration: '',
};

const PROJ_CONTENT_TYPES = ['Social post', 'Email', 'Blog', 'FAQ', 'Landing page'];
const PROJ_DURATIONS     = ['This week', 'Next 2 weeks', 'This month'];

type ProjectStep = 'goal' | 'audience' | 'details' | 'contentTypes' | 'quantities' | 'duration' | 'confirm' | 'done';

const PROJECT_STEP_ORDER: ProjectStep[] = ['goal','audience','details','contentTypes','quantities','duration','confirm','done'];

const PROJECT_AI_TEXTS: Record<ProjectStep, string> = {
  goal:         "Hey there! 👋 Let's start with a few quick details.\nWhat's the main goal for this project?",
  audience:     "Nice one! Who's your target audience for this project?",
  details:      "Would you like to share any project details or references?\nYou can type a short brief or attach any document to help me understand better.",
  contentTypes: "Perfect! I've noted your focus. What kind of content would you like to generate?",
  quantities:   "How many pieces for each type?",
  duration:     "Project timeline?",
  confirm:      "Ready to generate them now?",
  done:         "✅ Your content is ready! I've created your personalised content for this project. You can review them, make quick edits, or get them ready to publish.",
};

interface ProjMsg { id: string; role: 'ai' | 'user'; text: string; }

function draftUserText(step: ProjectStep, draft: ProjectDraft): string | null {
  switch (step) {
    case 'goal':         return draft.goal.trim() || null;
    case 'audience':     return draft.audience.trim() || null;
    case 'details':      return draft.details.trim() || (draft.attachedFile ? draft.attachedFile.name : null);
    case 'contentTypes': return draft.contentTypes.length > 0 ? draft.contentTypes.join(', ') : null;
    case 'quantities': {
      if (!draft.contentTypes.length) return null;
      const allSet = draft.contentTypes.every(t => (draft.quantities[t] ?? 0) > 0);
      if (!allSet) return null;
      return draft.contentTypes.map(t => `${draft.quantities[t]} × ${t}`).join(', ');
    }
    case 'duration': return draft.duration.trim() || null;
    default: return null;
  }
}

function buildProjectMessages(draft: ProjectDraft): { messages: ProjMsg[]; currentStep: ProjectStep } {
  const msgs: ProjMsg[] = [];
  const checkSteps: ProjectStep[] = ['goal','audience','details','contentTypes','quantities','duration'];
  for (const step of checkSteps) {
    msgs.push({ id: `ai-${step}`, role: 'ai', text: PROJECT_AI_TEXTS[step] });
    const answer = draftUserText(step, draft);
    if (!answer) return { messages: msgs, currentStep: step };
    msgs.push({ id: `user-${step}`, role: 'user', text: answer });
  }
  msgs.push({ id: 'ai-confirm', role: 'ai', text: PROJECT_AI_TEXTS.confirm });
  return { messages: msgs, currentStep: 'confirm' };
}

// ── ProjectCopilot ────────────────────────────────────────────────────────────

interface ProjectCopilotProps {
  draft: ProjectDraft;
  onDraftChange: (partial: Partial<ProjectDraft>) => void;
  onStartGenerating: () => void;
  onGenerationComplete: () => void;
}

function ProjectCopilot({ draft, onDraftChange, onStartGenerating, onGenerationComplete }: ProjectCopilotProps) {
  const { messages: initMsgs, currentStep: initStep } = React.useMemo(() => buildProjectMessages(draft), []);

  const [messages, setMessages]           = React.useState<ProjMsg[]>(initMsgs);
  const [currentStep, setCurrentStep]     = React.useState<ProjectStep>(initStep);
  const [textInput, setTextInput]         = React.useState('');
  const [pendingTypes, setPendingTypes]   = React.useState<string[]>(draft.contentTypes);
  const [pendingQtys, setPendingQtys]     = React.useState<Record<string, number>>({ ...draft.quantities });
  const [localFile, setLocalFile]         = React.useState<File | null>(draft.attachedFile);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef   = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMsg = (msg: ProjMsg) => setMessages(prev => [...prev, msg]);

  const advanceTo = (nextStep: ProjectStep) => {
    setTimeout(() => {
      if (nextStep !== 'done') {
        addMsg({ id: `ai-${nextStep}-${Date.now()}`, role: 'ai', text: PROJECT_AI_TEXTS[nextStep] });
      }
      setCurrentStep(nextStep);
    }, 600);
  };

  const commitAnswer = (userText: string) => {
    addMsg({ id: `user-${Date.now()}`, role: 'user', text: userText });
    const idx = PROJECT_STEP_ORDER.indexOf(currentStep);
    advanceTo(PROJECT_STEP_ORDER[idx + 1] ?? 'done');
  };

  const handleTextSubmit = () => {
    const val = textInput.trim();
    if (!val) return;
    if (currentStep === 'goal')     onDraftChange({ goal: val });
    if (currentStep === 'audience') onDraftChange({ audience: val });
    if (currentStep === 'details')  onDraftChange({ details: val, attachedFile: localFile });
    commitAnswer(val);
    setTextInput('');
  };

  const handleSkipDetails = () => {
    onDraftChange({ details: '', attachedFile: null });
    commitAnswer('Skip');
  };

  const handleContentTypesContinue = () => {
    if (!pendingTypes.length) return;
    const newQtys: Record<string, number> = {};
    pendingTypes.forEach(t => { newQtys[t] = pendingQtys[t] ?? 1; });
    onDraftChange({ contentTypes: pendingTypes, quantities: newQtys });
    setPendingQtys(newQtys);
    commitAnswer(pendingTypes.join(', '));
  };

  const handleQuantitiesContinue = () => {
    const types = draft.contentTypes.length ? draft.contentTypes : pendingTypes;
    const finalQtys: Record<string, number> = {};
    types.forEach(t => { finalQtys[t] = pendingQtys[t] ?? 1; });
    onDraftChange({ quantities: finalQtys });
    commitAnswer(types.map(t => `${finalQtys[t]} × ${t}`).join(', '));
  };

  const handleConfirm = (chip: 'Yes, generate' | 'Let me review first') => {
    addMsg({ id: `user-confirm-${Date.now()}`, role: 'user', text: chip });
    setCurrentStep('done');
    if (chip === 'Yes, generate') {
      onStartGenerating();
      setTimeout(() => {
        addMsg({ id: `ai-done-${Date.now()}`, role: 'ai', text: PROJECT_AI_TEXTS.done });
        onGenerationComplete();
      }, 2500);
    } else {
      setTimeout(() => {
        addMsg({ id: `ai-review-${Date.now()}`, role: 'ai', text: "No problem! Review your selections in the form and click 'Generate content' when you're ready." });
      }, 600);
    }
  };

  const renderInput = () => {
    if (currentStep === 'done') return null;

    if (currentStep === 'goal' || currentStep === 'audience' || currentStep === 'details') {
      return (
        <div className="flex-shrink-0 border-t border-border p-2 bg-background flex flex-col gap-2">
          {currentStep === 'details' && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Paperclip size={12} strokeWidth={1.6} absoluteStrokeWidth />
                {localFile ? localFile.name : 'Attach file'}
              </button>
              <button onClick={handleSkipDetails} className="text-[11px] text-muted-foreground hover:text-foreground">
                Skip
              </button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={e => setLocalFile(e.target.files?.[0] ?? null)} />
            </div>
          )}
          <CopilotPromptBox
            value={textInput}
            onChange={setTextInput}
            onSend={handleTextSubmit}
            onAttach={() => fileInputRef.current?.click()}
            placeholder="Type your answer…"
          />
        </div>
      );
    }

    if (currentStep === 'contentTypes') {
      return (
        <div className="flex-shrink-0 border-t border-border p-2 bg-background flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {PROJ_CONTENT_TYPES.map(t => {
              const sel = pendingTypes.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => setPendingTypes(prev => sel ? prev.filter(x => x !== t) : [...prev, t])}
                  className={cn(
                    'text-[12px] px-2 py-1 rounded-full border transition-all',
                    sel ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:border-primary/40 text-foreground',
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <Button variant="default" size="sm" onClick={handleContentTypesContinue} disabled={!pendingTypes.length} className="w-full">
            Continue →
          </Button>
        </div>
      );
    }

    if (currentStep === 'quantities') {
      const types = draft.contentTypes.length ? draft.contentTypes : pendingTypes;
      return (
        <div className="flex-shrink-0 border-t border-border p-2 bg-background flex flex-col gap-2">
          {types.map(t => (
            <div key={t} className="flex items-center justify-between">
              <span className="text-[13px] text-foreground">{t}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPendingQtys(prev => ({ ...prev, [t]: Math.max(1, (prev[t] ?? 1) - 1) }))}
                  className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-surface-hover text-[14px]"
                >−</button>
                <span className="text-[13px] w-5 text-center">{pendingQtys[t] ?? 1}</span>
                <button
                  onClick={() => setPendingQtys(prev => ({ ...prev, [t]: Math.min(20, (prev[t] ?? 1) + 1) }))}
                  className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-surface-hover text-[14px]"
                >+</button>
              </div>
            </div>
          ))}
          <Button variant="default" size="sm" onClick={handleQuantitiesContinue} className="w-full">
            Continue →
          </Button>
        </div>
      );
    }

    if (currentStep === 'duration') {
      return (
        <div className="flex-shrink-0 border-t border-border p-2 bg-background flex gap-2">
          {PROJ_DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => { onDraftChange({ duration: d }); commitAnswer(d); }}
              className="flex-1 text-[12px] py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-foreground transition-all"
            >
              {d}
            </button>
          ))}
        </div>
      );
    }

    if (currentStep === 'confirm') {
      return (
        <div className="flex-shrink-0 border-t border-border p-2 bg-background flex gap-2">
          <Button variant="default" size="sm" className="flex-1" onClick={() => handleConfirm('Yes, generate')}>
            Yes, generate
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleConfirm('Let me review first')}>
            Let me review first
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-6">
        {messages.map(msg => (
          <div key={msg.id} className="flex gap-2 items-start w-full shrink-0">
            <div className="flex-shrink-0 pt-0.5">
              {msg.role === 'ai' ? (
                <div className="relative size-[20px]">
                  <div className="absolute inset-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles size={10} className="text-primary" strokeWidth={1.6} absoluteStrokeWidth />
                  </div>
                </div>
              ) : (
                <div className="relative size-[20px]">
                  <div className="absolute inset-0 bg-muted rounded-full flex items-center justify-center">
                    <User size={12} className="text-muted-foreground" strokeWidth={1.6} absoluteStrokeWidth />
                  </div>
                </div>
              )}
            </div>
            <p className="flex-1 text-[13px] text-foreground leading-relaxed whitespace-pre-line">{msg.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {renderInput()}
    </div>
  );
}

// ── ProjectManualForm ─────────────────────────────────────────────────────────

interface ProjectManualFormProps {
  draft: ProjectDraft;
  onDraftChange: (partial: Partial<ProjectDraft>) => void;
  onGenerate: () => void;
  onSaveDraft: () => void;
}

function ProjectManualForm({ draft, onDraftChange, onGenerate, onSaveDraft }: ProjectManualFormProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-4 bg-background">

      {/* Project goal */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Project goal</label>
        <input
          value={draft.goal}
          onChange={e => onDraftChange({ goal: e.target.value })}
          placeholder="e.g. Drive awareness of our spring promotion"
          className="text-[12px] border border-input rounded-md h-[34px] px-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Target audience */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Target audience</label>
        <input
          value={draft.audience}
          onChange={e => onDraftChange({ audience: e.target.value })}
          placeholder="e.g. Homeowners in the metro area"
          className="text-[12px] border border-input rounded-md h-[34px] px-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Project details */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Project details</label>
        <textarea
          value={draft.details}
          onChange={e => onDraftChange({ details: e.target.value })}
          placeholder="Add a brief or paste context"
          rows={3}
          className="text-[12px] border border-input rounded-md px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="self-start flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Paperclip size={12} strokeWidth={1.6} absoluteStrokeWidth />
          {draft.attachedFile ? draft.attachedFile.name : 'Attach file'}
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={e => onDraftChange({ attachedFile: e.target.files?.[0] ?? null })} />
      </div>

      {/* Content types */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Content types</label>
        <div className="flex flex-wrap gap-2">
          {PROJ_CONTENT_TYPES.map(type => {
            const sel = draft.contentTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => {
                  const next = sel ? draft.contentTypes.filter(t => t !== type) : [...draft.contentTypes, type];
                  onDraftChange({ contentTypes: next });
                }}
                className={cn(
                  'text-[12px] px-2 py-1 rounded-full border transition-all',
                  sel ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:border-primary/40 text-foreground',
                )}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity per type */}
      {draft.contentTypes.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Quantity per type</label>
          <div className="flex flex-col gap-2">
            {draft.contentTypes.map(type => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-[13px] text-foreground">{type}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDraftChange({ quantities: { ...draft.quantities, [type]: Math.max(1, (draft.quantities[type] ?? 1) - 1) } })}
                    className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-surface-hover text-[14px]"
                  >−</button>
                  <span className="text-[13px] w-5 text-center">{draft.quantities[type] ?? 1}</span>
                  <button
                    onClick={() => onDraftChange({ quantities: { ...draft.quantities, [type]: Math.min(20, (draft.quantities[type] ?? 1) + 1) } })}
                    className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-surface-hover text-[14px]"
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duration */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Duration</label>
        <div className="flex gap-2">
          {PROJ_DURATIONS.map(opt => (
            <button
              key={opt}
              onClick={() => onDraftChange({ duration: opt })}
              className={cn(
                'flex-1 text-[11px] py-2 rounded-lg border transition-all',
                draft.duration === opt ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:border-primary/40 text-foreground',
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-border">
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={onGenerate}
          disabled={!draft.contentTypes.length}
        >
          Generate content
        </Button>
        <button
          onClick={onSaveDraft}
          className="text-[12px] text-muted-foreground hover:text-primary transition-colors text-center py-1"
        >
          Save draft
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ContentTypePicker({
  onSelect,
  onProjectBrief,
  onTemplates,
}: {
  onSelect: (type: WizardType) => void;
  onProjectBrief: () => void;
  onTemplates: () => void;
}) {
  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto h-full">
      <div>
        <p className="text-[12px] text-muted-foreground uppercase tracking-wide mb-4">
          Single content type
        </p>
        <div className="flex flex-col gap-2">
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct.id}
              onClick={() => onSelect(ct.id)}
              className="flex items-start gap-4 p-4 rounded-[8px] border border-border bg-background hover:border-primary/40 hover:bg-surface-hover text-left transition-all group"
            >
              <div className="text-muted-foreground group-hover:text-primary mt-0.5 transition-colors shrink-0">
                {ct.icon}
              </div>
              <div>
                <span className="text-[13px] text-foreground">{ct.label}</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">{ct.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      <div>
        <p className="text-[12px] text-muted-foreground uppercase tracking-wide mb-4">
          More options
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onProjectBrief}
            className="flex items-start gap-4 p-4 rounded-[8px] border border-border bg-background hover:border-primary/40 hover:bg-surface-hover text-left transition-all group"
          >
            <div className="text-muted-foreground group-hover:text-primary mt-0.5 transition-colors shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 6v8M6 10h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <span className="text-[13px] text-foreground">Full project brief</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Generate multiple content types at once</p>
            </div>
          </button>
          <button
            onClick={onTemplates}
            className="flex items-start gap-4 p-4 rounded-[8px] border border-border bg-background hover:border-primary/40 hover:bg-surface-hover text-left transition-all group"
          >
            <div className="text-muted-foreground group-hover:text-primary mt-0.5 transition-colors shrink-0">
              <LayoutGrid size={20} strokeWidth={1.6} />
            </div>
            <div>
              <span className="text-[13px] text-foreground">Browse templates</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Start from a curated template</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Left-panel contextual components ────────────────────────────────────────

/** Left panel shown while FAQ cards are generating */
function FAQGeneratingPanel() {
  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto">
      <div className="flex items-center gap-2">
        <Sparkles size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-primary" />
        <span className="text-[13px] text-foreground">Generating your FAQ set</span>
      </div>
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        Bird AI is drafting 12 AEO-optimised FAQ cards based on your brief. This takes about 5–10 seconds.
      </p>
      <div className="flex flex-col gap-2 mt-2">
        {['Researching common questions', 'Crafting structured answers', 'Scoring each FAQ', 'Applying brand voice'].map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles size={10} strokeWidth={1.6} absoluteStrokeWidth className="text-primary" />
            </div>
            <span className="text-[12px] text-foreground">{step}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto pt-4 border-t border-border">
        <p className="text-[11px] text-muted-foreground">
          Tip: FAQs are ranked by AEO score. High-scoring cards are published immediately — lower ones can be edited first.
        </p>
      </div>
    </div>
  );
}

/** Left panel shown while project content is generating */
function ProjectGeneratingPanel({ brief }: { brief: ProjectBrief | null }) {
  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto">
      <div className="flex items-center gap-2">
        <Sparkles size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-primary" />
        <span className="text-[13px] text-foreground">Generating project content</span>
      </div>
      {brief && (
        <div className="bg-muted/60 rounded-lg px-2 py-2 flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Project</span>
          <span className="text-[13px] text-foreground">{brief.name}</span>
        </div>
      )}
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        Bird AI is generating all content types in parallel. Each card will appear as it completes.
      </p>
      <div className="mt-auto pt-4 border-t border-border">
        <p className="text-[11px] text-muted-foreground">
          Tip: You can review and edit individual pieces after generation. Nothing is published automatically.
        </p>
      </div>
    </div>
  );
}

/** Left panel shown in project review mode */
function ProjectReviewPanel({ brief }: { brief: ProjectBrief | null }) {
  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-primary" />
        <span className="text-[13px] text-foreground">Review & publish</span>
      </div>
      {brief && (
        <div className="bg-muted/60 rounded-lg px-2 py-2 flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Project</span>
          <span className="text-[13px] text-foreground">{brief.name}</span>
          {brief.goal && <span className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{brief.goal}</span>}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Review checklist</p>
        {[
          'Read each piece and adjust tone',
          'Verify brand voice consistency',
          'Check locations are correct',
          'Confirm publish destinations',
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-4 h-4 rounded border border-border mt-0.5 flex-shrink-0" />
            <span className="text-[12px] text-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Left panel in brief mode — guidance on filling out the project brief */
function BriefGuidancePanel({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto">
      <div className="flex items-center gap-2">
        <BookOpen size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-primary" />
        <span className="text-[13px] text-foreground">
          {step === 1 ? 'Brief tips' : 'Content mix tips'}
        </span>
      </div>
      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            A strong brief gives AI the context it needs. The more specific your goal, the better the output.
          </p>
          {[
            { title: 'Be specific', tip: 'Instead of "promote our restaurant", say "drive awareness of outdoor seating across spring weekends".' },
            { title: 'Include locations', tip: 'Different markets may need different content angles. Select all relevant locations.' },
            { title: 'Add source content', tip: 'Pasting a press release or product page dramatically improves accuracy and brand voice.' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <span className="text-[12px] text-foreground">{item.title}</span>
              <span className="text-[11px] text-muted-foreground leading-relaxed">{item.tip}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            AI has suggested a content mix based on your brief. You can adjust it before generating.
          </p>
          {[
            { title: 'Start smaller', tip: 'Select 2–3 types for a first run. You can always generate more later.' },
            { title: 'FAQ always works', tip: 'FAQ content has the highest AEO citation rate of any content type.' },
            { title: 'Review before publishing', tip: 'Everything goes into draft. Nothing publishes without your approval.' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <span className="text-[12px] text-foreground">{item.title}</span>
              <span className="text-[11px] text-muted-foreground leading-relaxed">{item.tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Left panel bulk AI copilot shown in faqReady mode (T10) */
function FAQBulkCopilotPanel({
  recId,
  recTitle,
  recAeoScore,
  onDismissRecContext,
  showRecBanner,
}: {
  recId?: string;
  recTitle?: string;
  recAeoScore?: number;
  onDismissRecContext: () => void;
  showRecBanner: boolean;
}) {
  const [appliedOp, setAppliedOp] = React.useState<string | null>(null);
  const [isApplying, setIsApplying] = React.useState(false);

  const handleBulkOp = (op: string) => {
    if (isApplying) return;
    setIsApplying(true);
    setTimeout(() => {
      setAppliedOp(op);
      setIsApplying(false);
    }, 1400);
  };

  const BULK_OPS = [
    { label: 'Fix all brand-voice issues', icon: <Wand2 size={13} strokeWidth={1.6} absoluteStrokeWidth /> },
    { label: 'Regenerate low-scoring FAQs', icon: <RefreshCw size={13} strokeWidth={1.6} absoluteStrokeWidth /> },
    { label: 'Make tone conversational', icon: <Sliders size={13} strokeWidth={1.6} absoluteStrokeWidth /> },
    { label: 'Optimise all for voice search', icon: <Zap size={13} strokeWidth={1.6} absoluteStrokeWidth /> },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Recommendation context banner (T11) */}
      {recId && showRecBanner && (
        <div className="flex-shrink-0 mx-4 mt-4 bg-primary/8 border border-primary/20 rounded-lg px-2 py-2 flex flex-col gap-1.5 relative">
          <button
            onClick={onDismissRecContext}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          >
            <X size={12} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
          <div className="flex items-center gap-1.5">
            <Sparkles size={11} strokeWidth={1.6} absoluteStrokeWidth className="text-primary flex-shrink-0" />
            <span className="text-[11px] text-primary uppercase tracking-wide">From recommendation</span>
          </div>
          {recTitle && (
            <p className="text-[12px] text-foreground leading-snug pr-4">{recTitle}</p>
          )}
          {recAeoScore != null && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-muted-foreground">AEO score:</span>
              <span className="text-[12px] text-primary">{recAeoScore}/100</span>
              <span className="text-[11px] text-muted-foreground ml-1">· +13 vs competitor</span>
            </div>
          )}
        </div>
      )}

      {/* Bulk AI copilot */}
      <div className="flex flex-col gap-4 p-4 flex-grow overflow-y-auto">
        <div className="flex items-center gap-2">
          <Sparkles size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-primary" />
          <span className="text-[12px] text-foreground">Bulk AI actions</span>
        </div>

        {appliedOp ? (
          <div className="flex items-start gap-2 bg-primary/8 border border-primary/20 rounded-lg px-2 py-2">
            <CheckCircle2 size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-[12px] text-foreground leading-snug">
              <span>{appliedOp}</span> applied to all FAQs. Review changes in the canvas.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          {BULK_OPS.map((op) => (
            <button
              key={op.label}
              onClick={() => handleBulkOp(op.label)}
              disabled={isApplying}
              className={cn(
                'flex items-center gap-2 px-2 py-2.5 rounded-lg border text-left transition-all text-[12px]',
                isApplying
                  ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                  : 'border-border bg-background hover:border-primary/40 hover:bg-surface-hover text-foreground',
              )}
            >
              <span className="text-muted-foreground">{op.icon}</span>
              {op.label}
            </button>
          ))}
        </div>

        <div className="border-t border-border mt-1 pt-3">
          <p className="text-[11px] text-muted-foreground mb-2">Or ask AI anything</p>
          <div className="flex gap-2">
            <input
              className="flex-1 text-[12px] border border-input rounded-md h-[34px] px-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="e.g. Add a question about pricing…"
            />
            <button className="flex items-center justify-center size-[34px] rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0 transition-colors">
              <Sparkles size={12} strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const FAQ_SHIMMER_STEPS = [
  'Analyzing your business profile',
  'Generating FAQ questions',
  'Writing optimized answers',
  'Scoring for AEO impact',
];

function FAQShimmerOverlay() {
  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    FAQ_SHIMMER_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setActiveStep(i + 1), (i + 1) * 550));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex-grow bg-muted overflow-y-auto flex items-start justify-center p-8 pt-20">
      <div className="bg-white rounded-lg relative w-full max-w-[620px]">
        {/* Purple gradient border — 1px */}
        <div
          className="absolute inset-[-1px] rounded-[13px] pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, #7C3AED, #A78BFA, #DDD6FE, #A78BFA, #7C3AED)',
            backgroundSize: '300% 100%',
            animation: 'gradient-shift 4s ease-in-out infinite',
          }}
        />
        <div className="absolute inset-0 bg-white rounded-lg pointer-events-none" />

        <div className="relative p-4 flex flex-col gap-2">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-muted-foreground">
                <rect x="1" y="2" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M3 5h6M3 7h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] text-muted-foreground">FAQ</span>
            </div>
            <div className="w-20 h-3.5 rounded-full bg-muted animate-pulse" />
          </div>

          {/* Checklist */}
          <div className="relative rounded-md">
            <div className="absolute border border-border inset-0 pointer-events-none rounded-md" />
            <div className="p-4 flex flex-col gap-2">
              {FAQ_SHIMMER_STEPS.map((step, i) => {
                const isCompleted = i < activeStep;
                const isActive = i === activeStep;
                const isUpcoming = i > activeStep;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="shrink-0">
                      {isCompleted && (
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      )}
                      {isActive && (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-violet-600 animate-spin" />
                      )}
                      {isUpcoming && (
                        <div className="w-4 h-4 rounded-full border border-border" />
                      )}
                    </div>
                    <span className={`text-[13px] leading-[20px] transition-colors duration-300 ${isUpcoming ? 'text-text-secondary' : 'text-text-primary'}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * FAQReadyPanel — conversational copilot shown in the left panel once FAQ cards
 * are visible on the canvas. No recommendation banner. Three guided questions
 * with chip selections drive targeted AI enhancement actions.
 */
function FAQReadyPanel({
  recTitle,
  recAeoScore,
}: {
  recId?: string;
  recTitle?: string;
  recAeoScore?: number;
  showRecBanner?: boolean;
  onDismissRecContext?: () => void;
}) {
  // ── State ──────────────────────────────────────────────────────────────────

  // Answers to the three sequential questions
  const [goal,     setGoal]     = React.useState<string | null>(null);
  const [focus,    setFocus]    = React.useState<string | null>(null);
  const [answerLen, setAnswerLen] = React.useState<string | null>(null);

  // Free-form input
  const [freeInput, setFreeInput] = React.useState('');

  // Applied action feedback
  const [appliedAction, setAppliedAction] = React.useState<string | null>(null);
  const [isApplying, setIsApplying]       = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll when a new question unlocks
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [goal, focus, answerLen]);

  // ── Question definitions ───────────────────────────────────────────────────

  const Q1_CHIPS = [
    'Improve AEO score',
    'Fix brand voice',
    'Add missing topics',
    'Make it more local',
    'Improve readability',
  ];

  const Q2_MAP: Record<string, { question: string; chips: string[] }> = {
    'Improve AEO score': {
      question: 'Which answer engine should these FAQs optimise for?',
      chips: ['Voice search (Alexa / Siri)', 'AI chat (ChatGPT, Gemini)', 'Google featured snippets', 'All of the above'],
    },
    'Fix brand voice': {
      question: 'How should the tone feel to readers?',
      chips: ['Warm & personal', 'Professional & authoritative', 'Friendly & approachable', 'Clear & concise'],
    },
    'Add missing topics': {
      question: "What's missing from the current set?",
      chips: ['Pricing & fees', 'Location-specific details', 'Process & how it works', 'Competitor differentiation'],
    },
    'Make it more local': {
      question: 'Which market focus matters most?',
      chips: ['Current location only', 'All locations equally', 'High-priority locations first', 'Mix by location type'],
    },
    'Improve readability': {
      question: 'Who is the primary reader of these FAQs?',
      chips: ['First-time customers', 'Returning customers', 'Industry professionals', 'General public'],
    },
  };

  const Q3_CHIPS = [
    'Short & punchy (1–2 sentences)',
    'Standard (3–5 sentences)',
    'Detailed (full paragraph)',
    'Mixed — vary by question',
  ];

  const q2Config = goal ? Q2_MAP[goal] : null;

  // ── Suggested actions (derived from selections) ────────────────────────────

  function buildActions(): Array<{ label: string; icon: React.ReactNode }> {
    if (!goal) return [];
    const actions: Array<{ label: string; icon: React.ReactNode }> = [];

    if (goal === 'Improve AEO score') {
      actions.push({ label: 'Rewrite answers as direct, concise responses', icon: <Wand2 size={13} strokeWidth={1.6} absoluteStrokeWidth /> });
      actions.push({ label: 'Add structured schema markup to all FAQs', icon: <Zap size={13} strokeWidth={1.6} absoluteStrokeWidth /> });
    } else if (goal === 'Fix brand voice') {
      actions.push({ label: `Apply "${focus ?? 'chosen'}" tone across all answers`, icon: <Sliders size={13} strokeWidth={1.6} absoluteStrokeWidth /> });
      actions.push({ label: 'Regenerate low brand-voice FAQs', icon: <RefreshCw size={13} strokeWidth={1.6} absoluteStrokeWidth /> });
    } else if (goal === 'Add missing topics') {
      actions.push({ label: `Add 3 new FAQs covering ${focus ?? 'selected topic'}`, icon: <Plus size={13} strokeWidth={1.6} absoluteStrokeWidth /> });
      actions.push({ label: 'Expand answers that lack depth', icon: <Wand2 size={13} strokeWidth={1.6} absoluteStrokeWidth /> });
    } else if (goal === 'Make it more local') {
      actions.push({ label: 'Inject location name & context into answers', icon: <Sparkles size={13} strokeWidth={1.6} absoluteStrokeWidth /> });
      actions.push({ label: 'Add suburb / city references where relevant', icon: <Zap size={13} strokeWidth={1.6} absoluteStrokeWidth /> });
    } else {
      actions.push({ label: 'Simplify complex answers for clarity', icon: <Wand2 size={13} strokeWidth={1.6} absoluteStrokeWidth /> });
      actions.push({ label: 'Shorten answers exceeding 100 words', icon: <Sliders size={13} strokeWidth={1.6} absoluteStrokeWidth /> });
    }

    if (answerLen && answerLen !== 'Mixed — vary by question') {
      actions.push({ label: `Adjust all answers to ${answerLen.toLowerCase()}`, icon: <RefreshCw size={13} strokeWidth={1.6} absoluteStrokeWidth /> });
    }

    return actions;
  }

  const suggestedActions = buildActions();
  const showActions = goal !== null && focus !== null && answerLen !== null;

  const handleApply = (label: string) => {
    if (isApplying) return;
    setIsApplying(true);
    setTimeout(() => { setAppliedAction(label); setIsApplying(false); }, 1400);
  };

  const handleFreeInput = () => {
    if (!freeInput.trim() || isApplying) return;
    handleApply(freeInput.trim());
    setFreeInput('');
  };

  // ── Sub-components ────────────────────────────────────────────────────────

  /** AI avatar — purple sparkle circle matching reference design */
  const AIAvatar = () => (
    <div className="size-[20px] rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-px">
      <Sparkles size={9} className="text-primary" strokeWidth={1.6} absoluteStrokeWidth />
    </div>
  );

  /** User avatar — person silhouette matching reference design */
  const UserAvatar = () => (
    <div className="size-[20px] rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-px">
      <User size={10} className="text-muted-foreground" strokeWidth={1.6} absoluteStrokeWidth />
    </div>
  );

  /**
   * OptionChip — pill chip following the reference design:
   * unselected: white bg, #e8def6 border
   * selected:   #f2f4f7 bg, #e8def6 border (slightly filled, not blue)
   */
  const ChipGroup = ({
    chips,
    selected,
    onSelect,
  }: {
    chips: string[];
    selected: string | null;
    onSelect: (v: string) => void;
  }) => (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => { if (!selected) onSelect(chip); }}
          disabled={selected !== null}
          className={cn(
            'text-[12px] px-2 py-1 rounded-[40px] border transition-all leading-[18px]',
            selected === chip
              ? 'bg-surface-hover border-border text-text-primary cursor-default'
              : selected !== null
              ? 'bg-white border-border text-text-secondary cursor-default opacity-50'
              : 'bg-white border-border text-text-primary hover:bg-surface-hover',
          )}
        >
          {chip}
        </button>
      ))}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  // Personalise opening line using rec context if available
  const openingLine = recTitle
    ? `Your FAQ set is ready on the canvas. Let's make it stronger.`
    : `Your FAQs are ready on the canvas. Let's sharpen them before you publish.`;

  const aeoNote = recAeoScore != null
    ? ` Current AEO score is ${recAeoScore} — let's push it higher.`
    : '';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scrollable conversation area */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto px-4 py-4 flex flex-col gap-4">

        {/* Opening message */}
        <div className="flex gap-2.5 items-start">
          <AIAvatar />
          <div className="flex flex-col gap-1.5">
            <p className="text-[13px] text-foreground leading-relaxed">
              {openingLine}{aeoNote}
            </p>
          </div>
        </div>

        {/* Q1 */}
        <div className="flex gap-2.5 items-start">
          <AIAvatar />
          <div className="flex flex-col gap-2 flex-1">
            <p className="text-[13px] text-foreground leading-relaxed">
              What's your main goal for this FAQ set?
            </p>
            <ChipGroup chips={Q1_CHIPS} selected={goal} onSelect={setGoal} />
          </div>
        </div>

        {/* User's Q1 answer (echo back) */}
        {goal && (
          <div className="flex gap-2 items-start">
            <UserAvatar />
            <p className="text-[13px] text-foreground leading-[20px]">{goal}</p>
          </div>
        )}

        {/* Q2 — unlocks after Q1 */}
        {goal && q2Config && (
          <div className="flex gap-2.5 items-start">
            <AIAvatar />
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[13px] text-foreground leading-relaxed">
                {q2Config.question}
              </p>
              <ChipGroup chips={q2Config.chips} selected={focus} onSelect={setFocus} />
            </div>
          </div>
        )}

        {/* User's Q2 answer */}
        {focus && (
          <div className="flex gap-2 items-start">
            <UserAvatar />
            <p className="text-[13px] text-foreground leading-[20px]">{focus}</p>
          </div>
        )}

        {/* Q3 — unlocks after Q2 */}
        {focus && (
          <div className="flex gap-2.5 items-start">
            <AIAvatar />
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[13px] text-foreground leading-relaxed">
                How long should the answers be?
              </p>
              <ChipGroup chips={Q3_CHIPS} selected={answerLen} onSelect={setAnswerLen} />
            </div>
          </div>
        )}

        {/* User's Q3 answer */}
        {answerLen && (
          <div className="flex gap-2 items-start">
            <UserAvatar />
            <p className="text-[13px] text-foreground leading-[20px]">{answerLen}</p>
          </div>
        )}

        {/* AI action suggestions — unlocks after all 3 questions answered */}
        {showActions && (
          <div className="flex gap-2.5 items-start">
            <AIAvatar />
            <div className="flex flex-col gap-2.5 flex-1">
              <p className="text-[13px] text-foreground leading-relaxed">
                Got it. Here's what I'd do to your FAQ set:
              </p>

              {/* Applied action feedback */}
              {appliedAction && (
                <div className="flex items-start gap-2 bg-primary/8 border border-primary/20 rounded-lg px-2 py-2.5">
                  <CheckCircle2 size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-[12px] text-foreground leading-snug">
                    <span>{appliedAction}</span> applied to all FAQs. Review changes in the canvas.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                {suggestedActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleApply(action.label)}
                    disabled={isApplying}
                    className={cn(
                      'flex items-center gap-2 px-2 py-2.5 rounded-lg border text-left transition-all text-[12px]',
                      isApplying
                        ? 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                        : 'border-border bg-background hover:border-primary/40 hover:bg-surface-hover text-foreground',
                    )}
                  >
                    <span className="text-primary flex-shrink-0">{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom prompt box */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2 bg-background">
        <CopilotPromptBox
          value={freeInput}
          onChange={setFreeInput}
          onSend={handleFreeInput}
          disabled={isApplying}
          placeholder={
            !goal
              ? 'Select an option above, or ask directly…'
              : !focus
              ? 'Answer the question above, or ask directly…'
              : !answerLen
              ? 'One more above, or ask directly…'
              : 'Ask anything…'
          }
        />
      </div>
    </div>
  );
}

/** Left panel in faqEditor mode — editorial score (T7) */
function FAQEditorContextPanel({
  score,
  dimensions,
  isRecalculating,
  faqQuestion,
}: {
  score: number;
  dimensions: ScoreDimension[];
  isRecalculating: boolean;
  faqQuestion: string;
}) {
  // Mini score ring
  const r = 22;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const scoreCol = score >= 85 ? '#22c55e' : score >= 65 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {/* Current FAQ being edited */}
      <div className="bg-muted/60 rounded-lg px-2 py-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Editing</span>
        <p className="text-[12px] text-foreground leading-snug mt-0.5 line-clamp-2">{faqQuestion}</p>
      </div>

      {/* Editorial score ring */}
      <div className="flex flex-col gap-2 items-center py-2">
        <div className="relative">
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="30" cy="30" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
            <circle
              cx="30" cy="30" r={r} fill="none"
              stroke={scoreCol} strokeWidth="4"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          {isRecalculating ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground animate-spin" />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[16px]" style={{ color: scoreCol }}>{score}</span>
            </div>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground">Editorial score</span>
      </div>

      {/* Dimension breakdown */}
      <div className="flex flex-col gap-1">
        {dimensions.map((d) => (
          <div key={d.label} className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground truncate">{d.label}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${d.score}%`,
                    backgroundColor: d.score >= 85 ? '#22c55e' : d.score >= 65 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-6 text-right">{d.score}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-[11px] text-muted-foreground">
          Score updates automatically as you edit. Aim for 85+ on all dimensions before publishing.
        </p>
      </div>
    </div>
  );
}

// ── FAQ canvas score constant ─────────────────────────────────────────────────
// FAQCanvas (faq/FAQCanvas.tsx) owns the score panel and edit panel — no duplicates here.
// CONTENT_OVERALL_SCORE is kept as an export for the FAQPublishModal.
export const CONTENT_OVERALL_SCORE = DEFAULT_OVERALL_SCORE;

// ── Main component ───────────────────────────────────────────────────────────

export const CreateView = ({
  onBack,
  initialMode,
  initialTab,
  startAtFAQCanvas,
  recId,
  recTitle,
  recAeoScore,
  onReturnToRec,
  onPublishComplete,
  preloadedQuestions,
}: CreateViewProps) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);

  // Left panel state — always start on AI tab; wizard tab still accessible for faq/social/email
  const isHomeDriven = initialTab === 'wizard' && initialMode != null;
  const [leftTab, setLeftTab] = React.useState<LeftTab>(initialTab ?? 'ai');
  const [wizardType, setWizardType] = React.useState<WizardType>(
    initialMode === 'faq'    ? 'faq'
    : initialMode === 'social' ? 'social'
    : initialMode === 'email'  ? 'email'
    : null,
  );

  // Canvas mode
  const [fullScreen, setFullScreen] = React.useState<FullScreenMode>(() => {
    if (startAtFAQCanvas) return 'faqReady';
    if (initialMode === 'brief' || initialMode === 'project') return 'brief';
    if (initialMode === 'blog')         return 'blogEditor';
    if (initialMode === 'socialEditor') return 'socialEditor';
    if (initialMode === 'emailEditor')  return 'emailEditor';
    if (initialMode === 'blogEditor')   return 'blogEditor';
    return null;
  });

  // Brief step — tracked so left panel can show contextual guidance
  const [briefStep, setBriefStep] = React.useState<1 | 2>(1);

  // Template modal
  const [showTemplateModal, setShowTemplateModal] = React.useState(
    initialMode === 'templates',
  );

  // FAQ state
  const [faqReady, setFaqReady] = React.useState(false);
  const [faqEditorId, setFaqEditorId] = React.useState<string | null>(null);
  const [editorScore, setEditorScore] = React.useState(88);
  const [editorDimensions, setEditorDimensions] = React.useState<ScoreDimension[]>(DEFAULT_SCORE_DIMS);
  // T12: track which mode launched faqEditor so back goes to the right place
  const [faqEditorReturnMode, setFaqEditorReturnMode] = React.useState<'faqReady' | 'projectReview'>('faqReady');

  // Rec context banner dismissal (T11)
  const [recBannerVisible, setRecBannerVisible] = React.useState(true);

  // Shimmer overlay for FAQ canvas entry
  const [showShimmer, setShowShimmer] = React.useState(startAtFAQCanvas === true);
  React.useEffect(() => {
    if (!showShimmer) return;
    const t = setTimeout(() => setShowShimmer(false), 2500);
    return () => clearTimeout(t);
  }, [showShimmer]);

  // Pre-load FAQ questions from Search AI "Accept and edit FAQ" flow
  React.useEffect(() => {
    if (startAtFAQCanvas && preloadedQuestions && preloadedQuestions.length > 0) {
      bulkReplaceQuestions(preloadedQuestions);
      setFullScreen('faqReady');
    } else if (startAtFAQCanvas) {
      setFullScreen('faqReady');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // T5: copilot FAQ answers for wizard pre-fill
  const [copilotFAQAnswers, setCopilotFAQAnswers] = React.useState<Partial<FAQWizardState> | undefined>(undefined);

  // Inline title editing (T9)
  const [projectTitle, setProjectTitle] = React.useState(recTitle ?? 'New project');
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);

  // Project state (brief mode — NewProjectBrief form)
  const [projectBrief, setProjectBrief] = React.useState<ProjectBrief | null>(null);
  const [projectContentTypes, setProjectContentTypes] = React.useState<ContentCardType[]>([]);

  // Project canvas draft (project mode — AI copilot / manual form)
  const [projectDraft, setProjectDraft] = React.useState<ProjectDraft>(DEFAULT_PROJECT_DRAFT);


  // Create manually mode — selected FAQ + resizable left panel
  const [selectedFaqId,      setSelectedFaqId]      = React.useState<string | null>(null);
  const [faqLeftPanelWidth,  setFaqLeftPanelWidth]  = React.useState(320);
  const [toolbarVisible,     setToolbarVisible]     = React.useState(false);
  const [shareModalOpen,     setShareModalOpen]     = React.useState(false);
  const [publishModalOpen,   setPublishModalOpen]   = React.useState(false);

  // Keep selected-FAQ data in sync with store changes
  const [manualFaqs, setManualFaqs] = React.useState(() => getFAQs());
  React.useEffect(() => subscribeFAQs(() => setManualFaqs(getFAQs())), []);
  const selectedFaq     = selectedFaqId ? (manualFaqs.find(f => f.faq_id === selectedFaqId) ?? null) : null;
  const selectedFaqMeta = selectedFaqId ? getMeta(selectedFaqId) : undefined;

  // Project canvas editor origin — 'projectReview' when opened from UnifiedReviewCanvas
  const [editorOrigin, setEditorOrigin] = React.useState<'default' | 'projectReview'>('default');
  // Remember which tab to restore when returning from a project-canvas editor
  const [projectCanvasActiveTab, setProjectCanvasActiveTab] = React.useState<ContentCardType | undefined>(undefined);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStartGenerating = () => { setIsGenerating(true); setIsReady(false); };
  const handleGenerationComplete = () => { setIsGenerating(false); setIsReady(true); };

  const handleFAQWizardComplete = (_state: FAQWizardState) => {
    setFullScreen('faqGenerating');
  };
  const handleFAQGenerationComplete = () => {
    setFaqReady(true);
    setFullScreen('faqReady');
  };

  const handleSocialWizardComplete = (_state: SocialWizardState) => {
    setWizardType(null);
  };
  const handleEmailWizardComplete = (_state: EmailWizardState) => {
    setWizardType(null);
  };

  const handleBriefComplete = (brief: ProjectBrief) => {
    const selected = brief.suggestedMix
      .filter((m) => m.selected)
      .map((m) => m.type as ContentCardType);
    setProjectBrief(brief);
    setProjectTitle(brief.name || 'New project');
    setProjectContentTypes(selected.length > 0 ? selected : ['faq', 'social', 'email']);
    setFullScreen('projectGenerating');
  };

  const handleProjectGenerationComplete = () => {
    setFullScreen('projectReview');
  };

  const handleTemplateSelect = (template: TemplateItem) => {
    setShowTemplateModal(false);
    setLeftTab('wizard');
    if (template.type === 'faq') setWizardType('faq');
    else if (template.type === 'social') setWizardType('social');
    else if (template.type === 'email') setWizardType('email');
    else setWizardType(null);
  };

  // ── Back navigation (T3) ──────────────────────────────────────────────────

  const handleFullScreenBack = () => {
    if (fullScreen === 'socialEditor' || fullScreen === 'emailEditor' || fullScreen === 'blogEditor') {
      if (editorOrigin === 'projectReview') {
        setEditorOrigin('default');
        setFullScreen('projectReview');
      } else {
        setFullScreen(null);
      }
      return;
    }
    if (fullScreen === 'faqEditor') {
      setFaqEditorId(null);
      setEditorOrigin('default');
      setFullScreen(faqEditorReturnMode); // T12: return to whichever mode launched the editor
      return;
    }
    if (fullScreen === 'faqReady') {
      // When we arrived from recommendations, back goes to rec — not to faqGenerating
      if (startAtFAQCanvas) {
        if (onReturnToRec) { onReturnToRec(); return; }
        onBack();
        return;
      }
      // When FAQCanvas was opened from project review, return there
      if (faqEditorReturnMode === 'projectReview') {
        setFaqEditorReturnMode('faqReady');
        setFullScreen('projectReview');
        return;
      }
      setFullScreen('faqGenerating');
      return;
    }
    if (fullScreen === 'faqGenerating') {
      setFullScreen(null);
      setWizardType('faq');
      setLeftTab('wizard');
      return;
    }
    if (fullScreen === 'projectReview') { setFullScreen('projectGenerating'); return; }
    if (fullScreen === 'projectGenerating') { setFullScreen('brief'); return; }
    if (fullScreen === 'brief') { setFullScreen(null); return; }
    setFullScreen(null);
  };

  const handleGlobalBack = () => {
    if (fullScreen) { handleFullScreenBack(); return; }
    if (wizardType && isHomeDriven) { onBack(); return; }
    if (wizardType) { setWizardType(null); return; }
    onBack();
  };

  // ── Publish (T4) ─────────────────────────────────────────────────────────

  const handlePublish = () => {
    onPublishComplete?.();
    setFullScreen(null);
  };


  // ── Topbar title ──────────────────────────────────────────────────────────

  const topbarTitle = (() => {
    if (fullScreen === 'socialEditor') return 'Social post editor';
    if (fullScreen === 'emailEditor')  return 'Email editor';
    if (fullScreen === 'blogEditor')   return 'Blog editor';
    if (fullScreen === 'brief') return 'New project brief';
    if (fullScreen === 'faqGenerating') return 'Generating FAQ set';
    if (fullScreen === 'faqReady') return projectTitle;
    if (fullScreen === 'faqEditor') return 'Editing FAQ';
    if (fullScreen === 'projectGenerating') return projectTitle;
    if (fullScreen === 'projectReview') return projectTitle;
    return projectTitle;
  })();

  // Get the FAQ question for the editor context panel
  const editingFAQ = faqEditorId
    ? (MOCK_FAQS.find((f) => f.faq_id === faqEditorId) ?? null)
    : null;

  // ── Derive initial content type for the AI copilot ───────────────────────

  const aiCopilotContentType: 'faq' | 'social' | 'email' | 'blog' | 'project' | undefined = (
    initialMode === 'project' ? 'project' :
    initialMode === 'faq'     ? 'faq' :
    initialMode === 'social'  ? 'social' :
    initialMode === 'email'   ? 'email' :
    initialMode === 'blog'    ? 'blog' :
    undefined
  );

  // ── Left panel content ────────────────────────────────────────────────────

  const renderLeftPanel = () => {
    switch (fullScreen) {
      case 'faqGenerating':
        return <FAQGeneratingPanel />;

      case 'faqReady':
        return (
          <>
            {/* Mode toggle */}
            <div className="flex-shrink-0 px-4 py-2 border-b border-border">
              <SegmentedToggle ariaLabel="Create mode" items={LEFT_TAB_ITEMS} value={leftTab} onChange={setLeftTab} />
            </div>

            {/* Panel body — AI copilot panel or FAQ wizard depending on active tab */}
            <div className="flex-grow overflow-hidden">
              {leftTab === 'wizard' ? (
                <FAQWizard
                  onExit={() => setLeftTab('ai')}
                  onComplete={handleFAQWizardComplete}
                  embedded
                  prefilledState={copilotFAQAnswers}
                />
              ) : (
                <FAQReadyPanel
                  recId={recId}
                  recTitle={recTitle}
                  recAeoScore={recAeoScore}
                  showRecBanner={recBannerVisible}
                  onDismissRecContext={() => setRecBannerVisible(false)}
                />
              )}
            </div>
          </>
        );

      case 'faqEditor':
        return (
          <FAQEditorContextPanel
            score={editorScore}
            dimensions={editorDimensions}
            isRecalculating={false}
            faqQuestion={editingFAQ?.question ?? 'Editing FAQ…'}
          />
        );

      case 'brief':
        return <BriefGuidancePanel step={briefStep} />;

      case 'projectGenerating':
        return <ProjectGeneratingPanel brief={projectBrief} />;

      case 'projectReview':
        return <ProjectReviewPanel brief={projectBrief} />;

      default:
        // Project mode: SegmentedToggle with ProjectCopilot / ProjectManualForm
        if (initialMode === 'project') {
          return (
            <>
              {/* Mode toggle */}
              <div className="flex-shrink-0 px-4 py-2 border-b border-border">
                <SegmentedToggle ariaLabel="Create mode" items={LEFT_TAB_ITEMS} value={leftTab} onChange={setLeftTab} />
              </div>

              {/* Panel body */}
              <div className="flex-grow overflow-hidden">
                {leftTab === 'ai' ? (
                  <ProjectCopilot
                    key="project-copilot"
                    draft={projectDraft}
                    onDraftChange={partial => setProjectDraft(prev => ({ ...prev, ...partial }))}
                    onStartGenerating={handleStartGenerating}
                    onGenerationComplete={handleGenerationComplete}
                  />
                ) : (
                  <ProjectManualForm
                    draft={projectDraft}
                    onDraftChange={partial => setProjectDraft(prev => ({ ...prev, ...partial }))}
                    onGenerate={() => {
                      handleStartGenerating();
                      setTimeout(handleGenerationComplete, 2500);
                    }}
                    onSaveDraft={() => {}}
                  />
                )}
              </div>
            </>
          );
        }

        // Single-content and general mode: tab switcher + AI copilot / wizard
        return (
          <>
            {/* Rec context banner — shown when landing from recommendations */}
            {recId && recBannerVisible && leftTab === 'ai' && (
              <div className="flex-shrink-0 mx-4 mt-4 bg-primary/8 border border-primary/20 rounded-lg px-2 py-2 flex flex-col gap-1.5 relative">
                <button
                  onClick={() => setRecBannerVisible(false)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                >
                  <X size={12} strokeWidth={1.6} absoluteStrokeWidth />
                </button>
                <div className="flex items-center gap-1.5">
                  <Sparkles size={11} strokeWidth={1.6} absoluteStrokeWidth className="text-primary flex-shrink-0" />
                  <span className="text-[11px] text-primary uppercase tracking-wide">From recommendation</span>
                </div>
                {recTitle && <p className="text-[12px] text-foreground leading-snug pr-4">{recTitle}</p>}
                {recAeoScore != null && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-muted-foreground">AEO score:</span>
                    <span className="text-[12px] text-primary">{recAeoScore}/100</span>
                    <span className="text-[11px] text-muted-foreground ml-1">· +13 vs competitor</span>
                  </div>
                )}
              </div>
            )}

            {/* Mode toggle */}
            <div className="flex-shrink-0 px-4 py-2 border-b border-border">
              <SegmentedToggle ariaLabel="Create mode" items={LEFT_TAB_ITEMS} value={leftTab} onChange={setLeftTab} />
            </div>

            {/* Left panel body */}
            <div className="flex-grow overflow-hidden">
              {leftTab === 'ai' ? (
                <AiCopilot
                  onStartGenerating={handleStartGenerating}
                  onGenerationComplete={handleGenerationComplete}
                  initialContentType={aiCopilotContentType}
                  onFAQAnswersReady={(answers) => {
                    setCopilotFAQAnswers(answers as Partial<FAQWizardState>);
                  }}
                />
              ) : wizardType === 'faq' ? (
                <FAQWizard
                  onExit={() => setWizardType(null)}
                  onComplete={handleFAQWizardComplete}
                  embedded
                  prefilledState={copilotFAQAnswers}
                />
              ) : wizardType === 'social' ? (
                <SocialWizard
                  onExit={() => setWizardType(null)}
                  onComplete={handleSocialWizardComplete}
                  embedded
                />
              ) : wizardType === 'email' ? (
                <EmailWizard
                  onExit={() => setWizardType(null)}
                  onComplete={handleEmailWizardComplete}
                  embedded
                />
              ) : (
                <ContentTypePicker
                  onSelect={setWizardType}
                  onProjectBrief={() => setFullScreen('brief')}
                  onTemplates={() => setShowTemplateModal(true)}
                />
              )}
            </div>
          </>
        );
    }
  };

  // ── Right panel content ───────────────────────────────────────────────────

  const renderRightPanel = () => {
    switch (fullScreen) {
      case 'faqGenerating':
        return (
          <div className="flex-1 overflow-hidden">
            <FAQCanvasProgress onAllComplete={handleFAQGenerationComplete} />
          </div>
        );

      case 'faqEditor':
        return (
          <div className="flex-1 overflow-hidden">
            {faqEditorId && (
              <FAQEditor
                faqId={faqEditorId}
                onBack={() => { setFaqEditorId(null); setFullScreen('faqReady'); }}
                embedded
                onScoreChange={(s, dims) => {
                  setEditorScore(s);
                  setEditorDimensions(dims);
                }}
              />
            )}
          </div>
        );

      case 'brief':
        return (
          <div className="flex-1 overflow-hidden">
            <NewProjectBrief
              onBack={() => setFullScreen(null)}
              onComplete={handleBriefComplete}
              embedded
            />
          </div>
        );

      case 'projectGenerating':
        return projectBrief ? (
          <div className="flex-1 overflow-hidden">
            <ProjectGenerationCanvas
              brief={projectBrief}
              contentTypes={projectContentTypes}
              onAllComplete={handleProjectGenerationComplete}
            />
          </div>
        ) : null;

      case 'projectReview':
        return projectBrief ? (
          <div className="flex-1 overflow-hidden">
            <UnifiedReviewCanvas
              brief={projectBrief}
              contentTypes={projectContentTypes}
              onPublish={handlePublish}
              initialTab={projectCanvasActiveTab}
              onEdit={(id, type: ContentType) => {
                setEditorOrigin('projectReview');
                if (type === 'faq') {
                  // Open FAQCanvas (full numbered-row experience) from project review
                  setFaqEditorReturnMode('projectReview');
                  setProjectCanvasActiveTab('faq');
                  setFullScreen('faqReady');
                } else if (type === 'social') {
                  setProjectCanvasActiveTab('social');
                  setFullScreen('socialEditor');
                } else if (type === 'email') {
                  setProjectCanvasActiveTab('email');
                  setFullScreen('emailEditor');
                } else if (type === 'blog') {
                  setProjectCanvasActiveTab('blog');
                  setFullScreen('blogEditor');
                }
              }}
            />
          </div>
        ) : null;

      default:
        return null;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  // Suppress briefStep unused warning until NewProjectBrief exposes step callbacks
  void setBriefStep;

  return (
    <div className="flex flex-col h-full w-full bg-muted">

      {/* ── Top action bar ──────────────────────────────────────────────────── */}
      <div className="w-full bg-background border-b border-border h-[52px] flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={handleGlobalBack}
            className="flex items-center justify-center size-[34px] rounded hover:bg-surface-hover/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={1.6} />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <input
                  autoFocus
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setIsEditingTitle(false); }}
                  className={cn(MAIN_VIEW_PRIMARY_HEADING_CLASS, 'tracking-tight bg-transparent border-b border-primary outline-none min-w-[120px] max-w-[260px]')}
                />
              ) : (
                <span className={cn(MAIN_VIEW_PRIMARY_HEADING_CLASS, 'tracking-tight')}>
                  {topbarTitle}
                </span>
              )}
              {/* T9: inline title edit trigger */}
              {!isEditingTitle && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="Rename"
                >
                  <Edit2 size={14} strokeWidth={1.6} />
                </button>
              )}
              <div className="bg-muted px-2 py-0.5 rounded-md">
                <span className="text-xs text-muted-foreground">Draft</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {editorOrigin === 'projectReview' ? (
                <button
                  onClick={handleFullScreenBack}
                  className="text-xs text-primary hover:text-primary/70 transition-colors"
                >
                  ← Back to project
                </button>
              ) : (
                <span className="text-xs text-primary">
                  {projectBrief
                    ? projectBrief.locations.join(' · ')
                    : 'Olive garden corporate · 10 locations'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Share button — visible in create-manually mode */}
          {fullScreen === 'faqReady' && leftTab === 'wizard' && (
            <Button variant="outline" size="sm" onClick={() => setShareModalOpen(true)}>
              Share
            </Button>
          )}
          {/* Split publish button — joined with no gap, divider via border */}
          <div className="flex items-center">
            <Button
              variant="default"
              size="sm"
              className="rounded-r-none pr-3"
              onClick={() => fullScreen === 'faqReady' ? setPublishModalOpen(true) : handlePublish()}
            >
              Publish
            </Button>
            <Button
              variant="default"
              size="icon"
              className="rounded-l-none border-l border-primary-foreground/20 h-[var(--button-height-sm)] w-[34px]"
              onClick={() => fullScreen === 'faqReady' ? setPublishModalOpen(true) : handlePublish()}
            >
              <ChevronDown size={14} strokeWidth={1.6} absoluteStrokeWidth />
            </Button>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical size={18} strokeWidth={1.6} absoluteStrokeWidth />
          </Button>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex flex-grow overflow-hidden">
        {/* Direct editors span the full width — no left panel */}
        {fullScreen === 'socialEditor' ? (
          <SocialEditor
            platform="instagram"
            onBack={handleGlobalBack}
            onPublish={handlePublish}
          />
        ) : fullScreen === 'emailEditor' ? (
          <EmailEditor
            onBack={handleGlobalBack}
            onPublish={handlePublish}
          />
        ) : fullScreen === 'blogEditor' ? (
          <BlogEditor
            onBack={handleGlobalBack}
            onPublish={handlePublish}
          />
        ) : (
          <>
            {/* Left panel — resizable, shared width state across AI and wizard tabs */}
            <div
              className="flex-shrink-0 flex flex-col overflow-hidden relative"
              style={{ width: faqLeftPanelWidth, background: '#ffffff', borderRight: '1px solid #e5e9f0' }}
            >
              {renderLeftPanel()}
              {/* Drag-resize handle */}
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startX = e.clientX;
                  const startW = faqLeftPanelWidth;
                  const onMove = (mv: MouseEvent) => {
                    setFaqLeftPanelWidth(Math.max(220, Math.min(480, startW + mv.clientX - startX)));
                  };
                  const onUp = () => {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                  };
                  document.addEventListener('mousemove', onMove);
                  document.addEventListener('mouseup', onUp);
                }}
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40 transition-colors z-10"
              />
            </div>

            {/* null + faqReady: center canvas */}
            {(fullScreen === null || fullScreen === 'faqReady') ? (
              <>
                {fullScreen === null && (
                  <InfiniteCanvas
                    isGenerating={isGenerating}
                    isReady={isReady}
                    faqReady={faqReady}
                    onAddFAQ={() => { setLeftTab('wizard'); setWizardType('faq'); }}
                  />
                )}
                {fullScreen === 'faqReady' && (
                  showShimmer
                    ? <div className="flex-grow"><FAQShimmerOverlay /></div>
                    : <FAQCanvas score={CONTENT_OVERALL_SCORE} />
                )}
              </>
            ) : (
              /* All other fullScreen modes: existing 2-column renderRightPanel() */
              renderRightPanel()
            )}
          </>
        )}
      </div>

      {/* Template picker modal */}
      <TemplatePickerModal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelect={handleTemplateSelect}
      />

      {/* FAQ Share modal */}
      <FAQShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      {/* FAQ Publish modal — opened from topbar Publish button in faqReady mode */}
      <FAQPublishModal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        faqs={manualFaqs}
        overallScore={CONTENT_OVERALL_SCORE}
      />
    </div>
  );
};
