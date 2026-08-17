/**
 * EditorLeftPanel
 *
 * Left panel for the unified ContentEditorShell.
 * Matches the reference design:
 *   - Underline-style "Create with AI | Create manually" tabs
 *   - AI tab: chat copilot with greeting+question in one bubble,
 *     chips inline below each bot message, persistent text input at bottom
 *   - Manual tab: form fields + Add content type buttons
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, Mail, MessageSquare, Monitor, Video,
  Sparkles, Plus, Paperclip, SendHorizontal, GripHorizontal,
} from 'lucide-react';
import { AIIcon } from '@/assets/icons/AIIcon';
import { cn } from '@/contenthub-ui/utils';
import { SegmentedToggle } from '@/contenthub-ui/segmented-toggle.v1';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/contenthub-ui/select';
import {
  type ContentMode,
  type ContentItemType,
  type CopilotQuestion,
  EDITOR_CONFIGS,
  ITEM_TYPE_LABEL,
} from './editorConfig';
import { SOCIAL_PLATFORMS } from '../shared/socialPlatforms';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EditorLeftPanelProps {
  mode: ContentMode;
  onGenerate: (answers: Record<string, string | string[]>) => void;
  onAddCard: (itemType: ContentItemType) => void;
}

// ── Icon maps ─────────────────────────────────────────────────────────────────


const ITEM_ICON: Record<ContentItemType, React.ElementType> = {
  blog: FileText, social: MessageSquare, email: Mail,
  faq: MessageSquare, landing: Monitor, video: Video,
};

// ── Mode toggle items ─────────────────────────────────────────────────────────

const MODE_ITEMS = [
  { value: 'ai'     as const, label: 'AI',     icon: <AIIcon size={20} /> },
  { value: 'manual' as const, label: 'Manual' },
];

// ── Chip button ───────────────────────────────────────────────────────────────

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2 py-1.5 rounded-lg text-[12px] border transition-all text-left',
        selected
          ? 'bg-primary/10 border-primary/40 text-primary'
          : 'bg-background border-border text-foreground hover:border-primary/30 hover:bg-primary/[0.04]',
      )}
    >
      {label}
    </button>
  );
}

// ── AI Copilot ────────────────────────────────────────────────────────────────

interface CopilotMsg {
  role: 'bot' | 'user';
  text: string;
  /** Chips to show inline below this bot message (only for bot messages) */
  chips?: string[];
  chipType?: 'single' | 'multi';
  questionId?: string;
  answered?: boolean;
}

function AiCopilot({
  mode,
  onGenerate,
}: {
  mode: ContentMode;
  onGenerate: (answers: Record<string, string | string[]>) => void;
}) {
  const config = EDITOR_CONFIGS[mode];
  const questions = config.copilotQuestions;
  const firstQ = questions[0];

  const [messages, setMessages] = useState<CopilotMsg[]>([
    {
      role: 'bot',
      // Combine greeting + first question in one bubble
      text: `${config.copilotGreeting.replace(/\.$/, '')}. ${firstQ.question}`,
      chips: firstQ.chips,
      chipType: firstQ.inputType === 'multiselect' ? 'multi' : 'single',
      questionId: firstQ.id,
      answered: false,
    },
  ]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [textInput, setTextInput] = useState('');
  const [pendingMulti, setPendingMulti] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentQuestion: CopilotQuestion | undefined = questions[currentIdx];

  function advance(answer: string | string[]) {
    const displayText = Array.isArray(answer) ? answer.join(', ') : answer;
    if (!displayText.trim()) return;

    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);

    // Mark current bot message as answered
    setMessages(prev => prev.map((m, i) =>
      i === prev.length - 1 && m.role === 'bot' ? { ...m, answered: true } : m,
    ));

    const nextIdx = currentIdx + 1;

    setMessages(prev => {
      const updated = [...prev, { role: 'user' as const, text: displayText }];
      if (nextIdx < questions.length) {
        const nextQ = questions[nextIdx];
        updated.push({
          role: 'bot',
          text: nextQ.question,
          chips: nextQ.chips,
          chipType: nextQ.inputType === 'multiselect' ? 'multi' : 'single',
          questionId: nextQ.id,
          answered: false,
        });
      } else {
        updated.push({
          role: 'bot',
          text: "Great! I have everything I need. Ready to generate your content?",
        });
      }
      return updated;
    });

    if (nextIdx >= questions.length) {
      setDone(true);
    }
    setCurrentIdx(nextIdx);
    setTextInput('');
    setPendingMulti([]);
  }

  function toggleMultiChip(chip: string) {
    setPendingMulti(prev =>
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip],
    );
  }

  function handleTextSend() {
    if (done) return;
    const val = textInput.trim();
    if (!val) return;
    advance(val);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSend();
    }
  }

  // Compute active chips (for the last unanswered bot message)
  const lastBotMsg = [...messages].reverse().find(m => m.role === 'bot' && !m.answered && m.chips);

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i}>
            {/* Bot message row */}
            {msg.role === 'bot' && (
              <div className="flex items-start gap-2.5">
                {/* AI+ avatar */}
                <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center flex-none mt-0.5">
                  <span className="text-[9px] text-primary leading-none">AI<sup style={{ fontSize: 7 }}>+</sup></span>
                </div>
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  {/* Bubble */}
                  <div className="bg-muted rounded-xl rounded-tl-sm px-2 py-2.5 text-[12.5px] text-foreground leading-relaxed">
                    {msg.text}
                  </div>
                  {/* Inline chips — only for the last unanswered message */}
                  {msg.chips && !msg.answered && msg === lastBotMsg && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {msg.chips.map(chip => (
                          <Chip
                            key={chip}
                            label={chip}
                            selected={pendingMulti.includes(chip)}
                            onClick={() => {
                              if (msg.chipType === 'multi') {
                                toggleMultiChip(chip);
                              } else {
                                advance(chip);
                              }
                            }}
                          />
                        ))}
                      </div>
                      {msg.chipType === 'multi' && pendingMulti.length > 0 && (
                        <button
                          type="button"
                          onClick={() => advance(pendingMulti)}
                          className="self-start h-7 px-2 rounded-lg bg-primary text-primary-foreground text-[12px] hover:bg-primary/90 transition-colors"
                        >
                          Continue →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User message */}
            {msg.role === 'user' && (
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-primary text-primary-foreground rounded-xl rounded-tr-sm px-2 py-2.5 text-[12.5px] leading-relaxed">
                  {msg.text}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Generate button inline */}
        {done && (
          <button
            type="button"
            onClick={() => onGenerate(answers)}
            className="w-full h-[34px] rounded-xl bg-primary text-primary-foreground text-[13px] hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles size={14} strokeWidth={1.6} absoluteStrokeWidth />
            Generate content
          </button>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Persistent text input */}
      {!done && (
        <div className="flex-none border-t border-border bg-background">
          <div className="mx-3 my-3 rounded-xl border border-border bg-background focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all overflow-hidden">
            <textarea
              ref={inputRef}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              placeholder={
                currentQuestion?.placeholder ??
                "Type your answer, or pick from the options above…"
              }
              className="w-full px-2 pt-3 pb-1 text-[12.5px] text-foreground placeholder:text-muted-foreground resize-none bg-transparent focus:outline-none leading-relaxed"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <button
                type="button"
                aria-label="Attach file"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <Paperclip size={14} strokeWidth={1.6} absoluteStrokeWidth />
              </button>
              <button
                type="button"
                onClick={handleTextSend}
                disabled={!textInput.trim()}
                aria-label="Send"
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 transition-opacity hover:bg-primary/90"
              >
                <SendHorizontal size={13} strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Manual form ───────────────────────────────────────────────────────────────

// ── Project manual panel — content type blocks only ───────────────────────────

const NON_SOCIAL_ADDABLE_TYPES: ContentItemType[] = ['blog', 'email', 'faq', 'landing', 'video'];

function ProjectManualPanel({ onAddCard }: { onAddCard: (itemType: ContentItemType) => void }) {
  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className="px-4 py-4 flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Add content
          </span>
          <p className="text-[12px] text-muted-foreground">
            Click a block to add another piece of content to the canvas.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {NON_SOCIAL_ADDABLE_TYPES.map(type => {
            const Icon = ITEM_ICON[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => onAddCard(type)}
                className="group flex aspect-square min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-background p-2 transition-all hover:border-primary/40 hover:bg-primary/[0.03]"
              >
                <GripHorizontal size={12} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/60" />
                <Icon size={18} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground transition-colors group-hover:text-primary" />
                <span className="text-center text-[12px] leading-tight text-muted-foreground transition-colors group-hover:text-foreground">
                  {ITEM_TYPE_LABEL[type]}
                </span>
              </button>
            );
          })}
          {SOCIAL_PLATFORMS.map(platform => (
            <button
              key={platform.id}
              type="button"
              onClick={() => onAddCard('social')}
              className="group flex aspect-square min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-background p-2 transition-all hover:border-primary/40 hover:bg-primary/[0.03]"
            >
              <GripHorizontal size={12} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/60" />
              <platform.Logo size={20} />
              <span className="text-center text-[12px] leading-tight text-muted-foreground transition-colors group-hover:text-foreground">
                {platform.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── FAQ manual panel — add question / add section only ────────────────────────

function FAQManualPanel({ onAddCard }: { onAddCard: (itemType: ContentItemType) => void }) {
  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className="px-4 py-4 flex flex-col gap-4">
        <p className="text-[12px] text-muted-foreground">
          Build and structure your FAQ directly on the canvas.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="flex items-center gap-2 h-10 px-2 rounded-xl border border-border bg-background hover:border-primary/30 hover:bg-surface-hover/40 transition-all text-left group"
          >
            <div className="size-7 rounded-lg bg-muted flex items-center justify-center flex-none">
              <Plus size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-foreground/60 group-hover:text-primary/70 transition-colors" />
            </div>
            <span className="text-[13px] text-foreground group-hover:text-primary transition-colors flex-1">
              Add question
            </span>
          </button>
          <button
            type="button"
            className="flex items-center gap-2 h-10 px-2 rounded-xl border border-border bg-background hover:border-primary/30 hover:bg-surface-hover/40 transition-all text-left group"
          >
            <div className="size-7 rounded-lg bg-muted flex items-center justify-center flex-none">
              <Plus size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-foreground/60 group-hover:text-primary/70 transition-colors" />
            </div>
            <span className="text-[13px] text-foreground group-hover:text-primary transition-colors flex-1">
              Add section
            </span>
          </button>
        </div>
        <div className="pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => onAddCard('faq')}
            className="flex items-center gap-2 h-10 px-2 rounded-xl border border-dashed border-border bg-background hover:border-primary/40 hover:bg-surface-hover/40 transition-all text-left group w-full"
          >
            <div className="size-7 rounded-lg bg-muted flex items-center justify-center flex-none">
              <MessageSquare size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-foreground/60" />
            </div>
            <span className="text-[13px] text-muted-foreground group-hover:text-primary transition-colors">
              Add new FAQ block
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Standard manual panel (blog / social / email / landing / video) ───────────

function ManualPanel({
  mode,
  onAddCard,
}: {
  mode: ContentMode;
  onAddCard: (itemType: ContentItemType) => void;
}) {
  // Project and FAQ have dedicated compact panels
  if (mode === 'project') return <ProjectManualPanel onAddCard={onAddCard} />;
  if (mode === 'faq')     return <FAQManualPanel onAddCard={onAddCard} />;

  const config = EDITOR_CONFIGS[mode];
  const [values, setValues] = useState<Record<string, string>>({});

  function set(id: string, value: string) {
    setValues(prev => ({ ...prev, [id]: value }));
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-4 px-4 py-4">
        {config.manualFields.map(field => (
          <div key={field.id} className="flex flex-col gap-1.5">
            <label className="text-[12px] text-foreground">{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                value={values[field.id] ?? ''}
                onChange={e => set(field.id, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-2 py-2 text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            ) : field.type === 'select' && field.options ? (
              <Select
                value={values[field.id] ?? ''}
                onValueChange={value => set(field.id, value)}
              >
                <SelectTrigger size="sm" className="h-[34px] rounded-lg border-border bg-background text-[12.5px]">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent align="start">
                  {field.options.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <input
                type="text"
                value={values[field.id] ?? ''}
                onChange={e => set(field.id, e.target.value)}
                placeholder={field.placeholder}
                className="w-full h-[34px] rounded-lg border border-border bg-background px-2 text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            )}
          </div>
        ))}

        {config.addableTypes && config.addableTypes.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <span className="text-[12px] text-muted-foreground">Add content</span>
            <div className="flex flex-col gap-1">
              {config.addableTypes.map(type => {
                const Icon = ITEM_ICON[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onAddCard(type)}
                    className="flex items-center gap-2 h-[34px] px-2 rounded-lg hover:bg-surface-hover transition-colors text-left group"
                  >
                    <div className="size-6 rounded-md bg-primary/[0.07] flex items-center justify-center flex-none">
                      <Icon size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-foreground/70" />
                    </div>
                    <span className="text-[13px] text-foreground group-hover:text-primary transition-colors">
                      {ITEM_TYPE_LABEL[type]}
                    </span>
                    <Plus size={13} strokeWidth={1.6} absoluteStrokeWidth className="ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export { ManualPanel };

export function EditorLeftPanel({ mode, onGenerate, onAddCard }: EditorLeftPanelProps) {
  const [tab, setTab] = useState<'ai' | 'manual'>('ai');

  return (
    <div className="flex flex-col h-full min-h-0 w-[320px] flex-none border-r border-border bg-background">

      {/* Mode toggle */}
      <div className="flex-none px-4 py-2 border-b border-border">
        <SegmentedToggle
          ariaLabel="Create mode"
          items={MODE_ITEMS}
          value={tab}
          onChange={setTab}
        />
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {tab === 'ai' ? (
          <AiCopilot mode={mode} onGenerate={onGenerate} />
        ) : (
          <ManualPanel mode={mode} onAddCard={onAddCard} />
        )}
      </div>
    </div>
  );
}
