import React, { useState, useRef, useEffect } from 'react';
import {
  User, Image as ImageIcon, Type, List, Quote, MousePointerClick,
  LayoutGrid, Minus, MoveVertical, HelpCircle, Video, Code2, Star,
} from 'lucide-react';
import { AvatarIcon } from '@/assets/icons/AvatarIcon';
import { cn } from '@/contenthub-ui/utils';
import { CopilotPromptBox, ContextChipBadge } from '@/contenthub-ui/copilot-prompt-box';

// ── Avatar components ──────────────────────────────────────────────────────────

function CopilotAvatar() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <AvatarIcon className="size-[20px]" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <div className="absolute inset-0 bg-muted rounded-full flex items-center justify-center">
        <User size={12} className="text-muted-foreground" strokeWidth={1.6} absoluteStrokeWidth />
      </div>
    </div>
  );
}

// ── Block-type icon mapping (for the selected-element context chip) ────────────

function blockTypeIcon(blockType?: string) {
  switch (blockType) {
    case 'image':
    case 'gallery':
      return <ImageIcon className="size-3" strokeWidth={1.6} absoluteStrokeWidth />;
    case 'list':
      return <List className="size-3" strokeWidth={1.6} absoluteStrokeWidth />;
    case 'quote':
      return <Quote className="size-3" strokeWidth={1.6} absoluteStrokeWidth />;
    case 'cta':
    case 'cta-section':
      return <MousePointerClick className="size-3" strokeWidth={1.6} absoluteStrokeWidth />;
    case 'divider':
      return <Minus className="size-3" strokeWidth={1.6} absoluteStrokeWidth />;
    case 'spacer':
      return <MoveVertical className="size-3" strokeWidth={1.6} absoluteStrokeWidth />;
    case 'faq-section':
    case 'faq-qa':
      return <HelpCircle className="size-3" strokeWidth={1.6} absoluteStrokeWidth />;
    case 'video-embed':
      return <Video className="size-3" strokeWidth={1.6} absoluteStrokeWidth />;
    case 'code':
      return <Code2 className="size-3" strokeWidth={1.6} absoluteStrokeWidth />;
    case 'review':
    case 'testimonials':
    case 'review-wall':
      return <Star className="size-3" strokeWidth={1.6} absoluteStrokeWidth />;
    case 'feature-grid':
    case 'stats-row':
    case 'comparison-table':
      return <LayoutGrid className="size-3" strokeWidth={1.6} absoluteStrokeWidth />;
    case 'heading':
    case 'paragraph':
    default:
      return <Type className="size-3" strokeWidth={1.6} absoluteStrokeWidth />;
  }
}

// ── Chip component ─────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  onClick: () => void;
  selected?: boolean;
  muted?: boolean;
}

function Chip({ label, onClick, selected, muted }: ChipProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer border rounded-full px-2 py-1 transition-all text-[13px]",
        selected
          ? "border-primary bg-primary/10 text-primary"
          : muted
          ? "border-border bg-background text-muted-foreground hover:border-muted-foreground hover:text-foreground"
          : "border-border bg-background hover:border-primary hover:bg-primary/5/50 text-foreground"
      )}
    >
      {label}
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

type ConvPath = 'choose' | 'project' | 'faq' | 'social' | 'email' | 'blog';
type ConvStep = number;

interface ConvState {
  path: ConvPath;
  step: ConvStep;
  answers: Record<string, string | string[]>;
}

interface QuestionDef {
  text: string;
  chips?: string[];
  multiSelect?: boolean;
  freeText?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  chips?: string[];
  multiSelect?: boolean;
  isSummary?: boolean;
  isLoading?: boolean;
  contextLabel?: string;
  contextBlockType?: string;
}

function WorkingText({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <span>{text}</span>
      <span className="flex items-center gap-0.5" aria-hidden>
        <span className="size-1 rounded-full bg-current animate-bounce [animation-delay:-0.2s]" />
        <span className="size-1 rounded-full bg-current animate-bounce [animation-delay:-0.1s]" />
        <span className="size-1 rounded-full bg-current animate-bounce" />
      </span>
    </span>
  );
}

// ── Question scripts ───────────────────────────────────────────────────────────

const SCRIPTS: Record<Exclude<ConvPath, 'choose'>, QuestionDef[]> = {
  project: [
    {
      text: "What's the main goal for this content project?",
      chips: ["Drive more bookings", "Generate customer reviews", "Promote a new product or offer", "Grow brand awareness", "Re-engage past customers"],
    },
    {
      text: "Who is your target audience?",
      chips: ["Local homeowners", "Small business owners", "Families", "Young professionals", "Seniors"],
      freeText: true,
    },
    {
      text: "Which content types do you need? Pick as many as you want.",
      chips: ["FAQ page", "Social posts", "Email campaign", "Blog post", "Landing page"],
      multiSelect: true,
    },
    {
      text: "Any brand guidelines, reference links, or tone notes? (optional)",
      chips: ["Skip for now"],
      freeText: true,
    },
    {
      text: "What's your timeline for this project?",
      chips: ["This week", "Next 2 weeks", "This month", "No rush — just planning"],
    },
  ],
  faq: [
    {
      text: "What's your business or website URL? I'll use it to understand your offerings.",
      freeText: true,
      chips: ["Skip for now"],
    },
    {
      text: "Which topics should the FAQ cover?",
      chips: ["Our services", "Pricing & plans", "Location & hours", "How we work", "Reviews & reputation", "Industry questions"],
      multiSelect: true,
    },
    {
      text: "Which AI agent should power the generation?",
      chips: ["Local business agent", "Service provider agent", "Restaurant agent", "Healthcare agent", "Real estate agent"],
    },
    {
      text: "Any focus areas for the FAQ generation?",
      chips: ["Voice search answers", "Address common objections", "Include pricing details", "Skip — generate now"],
    },
  ],
  social: [
    {
      text: "Which platform is this post for?",
      chips: ["Instagram", "Facebook", "LinkedIn", "X / Twitter", "TikTok"],
      multiSelect: true,
    },
    {
      text: "What's the main message or announcement?",
      chips: ["New product or service", "Seasonal promotion", "Customer success story", "Behind the scenes", "Event or milestone"],
      freeText: true,
    },
    {
      text: "What action should the audience take?",
      chips: ["Book now", "Visit our website", "Call us", "Leave a review", "No CTA needed"],
    },
    {
      text: "What tone fits your brand voice?",
      chips: ["Friendly & warm", "Bold & direct", "Playful & fun", "Professional & polished"],
    },
    {
      text: "Should hashtags be included?",
      chips: ["Yes — suggest relevant ones", "No hashtags", "I'll add my own"],
    },
  ],
  email: [
    {
      text: "What type of email is this?",
      chips: ["Welcome email", "Promotional offer", "Re-engagement", "Review request", "Seasonal campaign", "Service reminder"],
    },
    {
      text: "Who is the audience segment?",
      chips: ["All customers", "New customers", "Lapsed (6+ months)", "VIP / loyal customers", "Post-purchase"],
    },
    {
      text: "What's the core message or offer?",
      chips: ["Discount or promo", "New service announcement", "Event invite", "Referral program", "Feedback request"],
      freeText: true,
    },
    {
      text: "What tone should the email use?",
      chips: ["Warm & personal", "Professional & crisp", "Urgent & action-driven", "Friendly & casual"],
    },
    {
      text: "Should there be a CTA button?",
      chips: ["Yes — Book now", "Yes — Claim offer", "Yes — Leave a review", "No CTA needed"],
    },
  ],
  blog: [
    {
      text: "What should the blog post be about?",
      chips: ["Local SEO tips", "Industry how-to guide", "Customer success story", "Product or service spotlight", "Seasonal or trending topic"],
      freeText: true,
    },
    {
      text: "Any target keywords to rank for? (optional)",
      chips: ["Skip — AI will suggest"],
      freeText: true,
    },
    {
      text: "How long should the blog post be?",
      chips: ["Short (~500 words)", "Medium (~1,000 words)", "Long (~2,000 words)", "In-depth (~3,000+ words)"],
    },
    {
      text: "What tone and style?",
      chips: ["Conversational & approachable", "Expert & authoritative", "Educational & clear", "Storytelling-focused"],
    },
    {
      text: "Who is the primary reader?",
      chips: ["Local consumers", "Business owners", "First-time buyers", "General audience"],
      freeText: true,
    },
  ],
};

const CHOOSE_MESSAGE: ChatMessage = {
  id: '0',
  role: 'ai',
  text: "What are you creating today?",
  chips: ["📁 Full content project", "FAQ page", "Social post", "Email", "Blog"],
};

function getFirstMessage(path: Exclude<ConvPath, 'choose'>): ChatMessage {
  const q = SCRIPTS[path][0];
  return {
    id: '0',
    role: 'ai',
    text: q.text,
    chips: q.chips,
    multiSelect: q.multiSelect,
  };
}

// ── Props ──────────────────────────────────────────────────────────────────────

/** Partial FAQWizardState shape — keep minimal to avoid circular deps */
interface FAQWizardAnswers {
  goalData?: {
    persona?: string;
    tone?: string;
    faqCount?: number;
  };
}

// ── Block-type contextual chip sets ───────────────────────────────────────────

function getBlockContextChips(blockType: string): string[] {
  switch (blockType) {
    case 'heading':
      return ['Make it punchier', 'Add a keyword', 'Make it shorter', 'Rewrite the headline'];
    case 'paragraph':
      return ['Make it shorter', 'Expand this', 'Adjust the tone', 'Add a supporting detail'];
    case 'image':
      return ['Write alt text', 'Add a caption', 'Replace this image'];
    case 'cta':
      return ['Rewrite CTA', 'Make it more compelling', 'Change the button text'];
    case 'list':
      return ['Add more items', 'Make it shorter', 'Reorder the list', 'Adjust the tone'];
    case 'quote':
      return ['Find a better quote', 'Add attribution', 'Rewrite this quote'];
    case 'key-takeaways':
      return ['Add a takeaway', 'Trim the list', 'Rewrite takeaways'];
    case 'author-bar':
      return ['Update the bio', 'Make the bio shorter'];
    default:
      return ['Rewrite this section', 'Make it shorter', 'Adjust the tone'];
  }
}

// ── EditorCopilot — content-quality focused chat shown after generation ────────

type EditorMode = 'blog' | 'faq' | 'social' | 'email' | 'landing' | 'video' | 'project';

function EditorCopilot({
  mode = 'faq',
  onRegen,
  onSectionEditStart,
  onSectionEditEnd,
  selectedBlock,
  onClearSelectedBlock,
}: {
  mode?: EditorMode;
  onRegen?: () => void;
  onSectionEditStart?: (section: string) => void;
  onSectionEditEnd?: () => void;
  selectedBlock?: { id: string; type: string; label: string } | null;
  onClearSelectedBlock?: () => void;
}) {
  const opening = mode === 'blog' ? EDITOR_OPENING_BLOG : mode === 'project' ? EDITOR_OPENING_PROJECT : EDITOR_OPENING;

  const [messages, setMessages] = useState<ChatMessage[]>([opening]);
  const [input, setInput] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Canvas block selection ─────────────────────────────────────────────────────
  const prevBlockIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedBlock) {
      prevBlockIdRef.current = null;
      return;
    }
    prevBlockIdRef.current = selectedBlock.id;
  }, [selectedBlock]);

  const isBlog = mode === 'blog';

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function clearAndAddUser(text: string, contextLabel?: string, contextBlockType?: string) {
    setMessages(prev => [
      ...prev.map(m => ({ ...m, chips: undefined, multiSelect: undefined })),
      { id: Date.now().toString(), role: 'user' as const, text, contextLabel, contextBlockType },
    ]);
  }

  function pushAi(msg: Partial<ChatMessage>, delay = 600) {
    const id = (Date.now() + Math.random() * 1000).toString();
    setTimeout(() => {
      setMessages(prev => [...prev, { id, role: 'ai' as const, text: '', ...msg } as ChatMessage]);
    }, delay);
  }

  function showPartialLoading(sectionLabel: string | null) {
    onSectionEditStart?.(sectionLabel ?? 'full');
    const loadId = (Date.now() + 1).toString() + '-pl';
    const loadText = sectionLabel
      ? `Applying your changes to "${sectionLabel}"…`
      : 'Applying your changes…';
    setMessages(prev => [
      ...prev,
      { id: loadId, role: 'ai' as const, text: loadText, isLoading: true },
    ]);
    setTimeout(() => {
      onSectionEditEnd?.();
      const successText = sectionLabel
        ? `Done. "${sectionLabel}" has been updated — review it in the canvas.`
        : 'Done. Changes applied — review them in the canvas.';
      const quickFixChips = isBlog ? BLOG_QUICK_FIX_CHIPS : FAQ_QUICK_FIX_CHIPS;
      setMessages(prev =>
        prev.map(m =>
          m.id === loadId
            ? { ...m, text: successText, isLoading: false, chips: quickFixChips }
            : m
        )
      );
    }, 1800);
  }

  // ── Quick-fix chip sets ───────────────────────────────────────────────────────

  const BLOG_QUICK_FIX_CHIPS = [
    'Improve SEO',
    'Make Concise',
    'Expand & Add Depth',
    'Improve Readability',
    'Strengthen Intro & Hook',
    'Improve Structure & Flow',
    'Change Tone',
  ];

  const FAQ_QUICK_FIX_CHIPS = [
    'Improve SEO',
    'Make Concise',
    'Expand & Add Detail',
    'Improve Clarity',
    'Make Conversational',
    'Optimize for Snippets',
    'Change Tone',
  ];

  // Follow-up questions per quick-fix action
  interface FollowUp { text: string; chips: string[] }

  const BLOG_FOLLOWUPS: Record<string, FollowUp> = {
    'Improve SEO': {
      text: "What's your primary target keyword or topic phrase for this post?",
      chips: ['Skip — use existing focus', 'Not sure, just optimise generally'],
    },
    'Make Concise': {
      text: "Anything you want to make sure stays intact?",
      chips: ['Protect all key examples', 'Protect the data & stats', 'Cut everything you safely can'],
    },
    'Expand & Add Depth': {
      text: "Which areas should we deepen?",
      chips: ['All sections equally', 'Introduction only', 'Body sections', 'Conclusion', 'Add more data & examples'],
    },
    'Improve Readability': {
      text: "Who's the target audience for this post?",
      chips: ['General public', 'Business professionals', 'Technical readers', 'First-time readers'],
    },
    'Strengthen Intro & Hook': {
      text: "What feeling should the opening create?",
      chips: ['Curiosity', 'Urgency', 'Relatability', 'Authority'],
    },
    'Improve Structure & Flow': {
      text: "What feels off about the current structure?",
      chips: ['Sections feel out of order', 'Transitions are abrupt', 'Narrative doesn\'t flow', 'Not sure — just improve it'],
    },
    'Change Tone': {
      text: "Which tone would you like?",
      chips: ['Professional', 'Friendly', 'Persuasive', 'Authoritative'],
    },
  };

  const FAQ_FOLLOWUPS: Record<string, FollowUp> = {
    'Improve SEO': {
      text: "Any specific search queries you want to target?",
      chips: ['Skip — use natural language throughout', 'Not sure, just optimise generally'],
    },
    'Make Concise': {
      text: "How tight should the answers be?",
      chips: ['Shorten all answers equally', 'Just remove filler, keep depth', 'Lead with the answer everywhere'],
    },
    'Expand & Add Detail': {
      text: "Which questions feel thin or incomplete?",
      chips: ['All of them', 'Pricing & cost questions', 'Process questions', 'Feature questions'],
    },
    'Improve Clarity': {
      text: "Who is your primary audience for this FAQ?",
      chips: ['General customers', 'Technical users', 'First-time buyers', 'Business clients'],
    },
    'Make Conversational': {
      text: "Where will this FAQ primarily be used?",
      chips: ['Voice search & smart speakers', 'Customer support chat', 'Website / general web', 'Social media'],
    },
    'Optimize for Snippets': {
      text: "Which platforms are you targeting?",
      chips: ['Google featured snippets', 'Google Business Profile', 'All major search engines'],
    },
    'Change Tone': {
      text: "Which tone would you like?",
      chips: ['Professional', 'Friendly', 'Persuasive', 'Authoritative'],
    },
  };

  // Build a confirmation message from the selected action + follow-up answer
  function buildConfirmation(action: string, followUp: string): string {
    const ct = isBlog ? 'blog post' : 'FAQ set';
    const isVague = followUp.toLowerCase().startsWith('skip') || followUp.toLowerCase().startsWith('not sure');
    const suffix = '\n\nThis will take 2–3 minutes and use 120 credits.';

    let body: string;
    switch (action) {
      case 'Improve SEO':
        body = isVague
          ? `Got it. I'll rewrite the ${ct} to strengthen keyword coverage naturally, restructure headings, and sharpen the opening — no stuffing.`
          : `Got it. I'll rewrite the ${ct} to naturally build around "${followUp}" with cleaner headings and a sharper opening.`;
        break;
      case 'Make Concise':
        body = `Got it. I'll tighten the ${ct} — cutting filler and redundancy while preserving every substantive point.`;
        break;
      case 'Expand & Add Depth':
      case 'Expand & Add Detail':
        body = followUp === 'All sections equally' || followUp === 'All of them'
          ? `Got it. I'll deepen the ${ct} across all sections — more examples, supporting arguments, and specifics where they add value.`
          : `Got it. I'll focus the depth work on: "${followUp}".`;
        break;
      case 'Improve Readability':
      case 'Improve Clarity':
        body = `Got it. I'll rewrite for "${followUp}" — simpler language, shorter sentences, clearer structure throughout.`;
        break;
      case 'Strengthen Intro & Hook':
        body = `Got it. I'll craft an opening that leads with ${followUp.toLowerCase()} to pull readers in from the first line.`;
        break;
      case 'Improve Structure & Flow':
        body = `Got it. I'll address "${followUp}" — reordering sections, strengthening transitions, and tightening the overall narrative.`;
        break;
      case 'Make Conversational':
        body = `Got it. I'll rewrite for "${followUp}" — natural phrasing, warm tone, and direct answers throughout.`;
        break;
      case 'Optimize for Snippets':
        body = `Got it. I'll front-load each answer with a clear 40–55 word response optimised for "${followUp}".`;
        break;
      case 'Change Tone':
        body = `Got it. I'll rewrite the ${ct} in a ${followUp.toLowerCase()} tone — preserving all facts and structure, changing only voice and word choice.`;
        break;
      default:
        body = `Got it. I'll apply "${action}" to your ${ct}.`;
    }
    return body + suffix;
  }

  // Block-level contextual chips (all trigger partial edits on the selected block)
  const BLOCK_CONTEXT_CHIPS = new Set([
    'Make it punchier', 'Add a keyword', 'Rewrite the headline',
    'Expand this', 'Add a supporting detail',
    'Write alt text', 'Add a caption', 'Replace this image',
    'Rewrite CTA', 'Make it more compelling', 'Change the button text',
    'Add more items', 'Reorder the list',
    'Find a better quote', 'Add attribution', 'Rewrite this quote',
    'Add a takeaway', 'Trim the list', 'Rewrite takeaways',
    'Update the bio', 'Make the bio shorter',
    'Rewrite this section', 'Make it shorter', 'Adjust the tone',
  ]);

  // ── Chip handler ─────────────────────────────────────────────────────────────

  function triggerRegen(confirmationText: string) {
    pushAi({
      text: confirmationText,
      chips: ['Start regenerating', 'Cancel'],
    });
  }

  function handleChip(chip: string) {
    clearAndAddUser(chip);

    // ── Regen confirmation ────────────────────────────────────────────────────
    if (chip === 'Start regenerating') {
      onRegen?.();
      return;
    }

    // ── Cancel out of the regeneration flow ───────────────────────────────────
    if (chip === 'Cancel') {
      setPendingAction(null);
      const quickFixChips = isBlog ? BLOG_QUICK_FIX_CHIPS : FAQ_QUICK_FIX_CHIPS;
      pushAi({
        text: "No problem — nothing was changed. Let me know if there's anything else you'd like to adjust.",
        chips: quickFixChips,
      });
      return;
    }

    // ── Block-level context chip ──────────────────────────────────────────────
    if (BLOCK_CONTEXT_CHIPS.has(chip)) {
      showPartialLoading(selectedBlock?.label ?? null);
      onClearSelectedBlock?.();
      prevBlockIdRef.current = null;
      return;
    }

    // ── Follow-up answer for a pending quick-fix action ───────────────────────
    if (pendingAction) {
      const confirmation = buildConfirmation(pendingAction, chip);
      setPendingAction(null);
      triggerRegen(confirmation);
      return;
    }

    // ── Quick-fix primary chips — ask follow-up question ──────────────────────
    const allQuickFix = isBlog ? BLOG_QUICK_FIX_CHIPS : FAQ_QUICK_FIX_CHIPS;
    if (allQuickFix.includes(chip)) {
      setPendingAction(chip);
      const followUp = (isBlog ? BLOG_FOLLOWUPS : FAQ_FOLLOWUPS)[chip];
      if (followUp) {
        pushAi({ text: followUp.text, chips: followUp.chips });
      }
      return;
    }

    // ── Wrap-up ───────────────────────────────────────────────────────────────
    if (chip === 'Looks good') {
      pushAi({ text: "Your content is looking strong. Let me know whenever you want to make more changes." });
      return;
    }

    // ── Fallback ──────────────────────────────────────────────────────────────
    const quickFixChips = isBlog ? BLOG_QUICK_FIX_CHIPS : FAQ_QUICK_FIX_CHIPS;
    pushAi({
      text: "What would you like to improve next?",
      chips: quickFixChips,
    });
  }

  function handleSend(text: string) {
    if (!text.trim()) return;
    setInput('');
    clearAndAddUser(text.trim(), selectedBlock?.label, selectedBlock?.type);

    // Block chip active — apply as a targeted partial edit
    if (selectedBlock) {
      onClearSelectedBlock?.();
      prevBlockIdRef.current = null;
      showPartialLoading(selectedBlock.label);
      return;
    }

    // Follow-up free-text answer for a pending action
    if (pendingAction) {
      const confirmation = buildConfirmation(pendingAction, text.trim());
      setPendingAction(null);
      triggerRegen(confirmation);
      return;
    }

    // General free-form instruction → treat as full regen request
    triggerRegen(`Got it. I'll rewrite the ${isBlog ? 'blog post' : 'FAQ set'} based on your instructions. Ready to regenerate?`);
  }

  return (
    <div className="flex flex-col w-full h-full bg-background relative z-20">
      <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-8">
        {messages.map(msg => {
          const isAI = msg.role === 'ai';
          return (
            <div key={msg.id} className="flex gap-2 items-start w-full shrink-0">
              <div className="flex items-center pt-0.5 shrink-0">
                {isAI ? <CopilotAvatar /> : <UserAvatar />}
              </div>
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                {msg.contextLabel && (
                  <div className="self-start">
                    <ContextChipBadge
                      label={msg.contextLabel}
                      icon={blockTypeIcon(msg.contextBlockType)}
                    />
                  </div>
                )}
                <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-line">
                  {msg.isLoading ? <WorkingText text={msg.text} /> : msg.text}
                </p>
                {msg.chips && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {msg.chips.map(chip => (
                      <Chip key={chip} label={chip} muted={chip === 'Cancel'} onClick={() => handleChip(chip)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <CopilotPromptBox
          value={input}
          onChange={setInput}
          onSend={() => handleSend(input)}
          placeholder={selectedBlock ? `Ask about "${selectedBlock.label}"…` : "Describe what you want to improve..."}
          contextChip={selectedBlock ? {
            label: selectedBlock.label,
            icon: blockTypeIcon(selectedBlock.type),
            onRemove: () => { onClearSelectedBlock?.(); prevBlockIdRef.current = null; },
          } : null}
        />
      </div>
    </div>
  );
}

// ── Editor-mode question sets ──────────────────────────────────────────────────

interface EditorReply {
  text: string;
  chips?: string[];
  multiSelect?: boolean;
}

// ── FAQ editor (default) ──────────────────────────────────────────────────────

// ── Project editor ────────────────────────────────────────────────────────────

const EDITOR_OPENING_PROJECT: ChatMessage = {
  id: 'editor-0',
  role: 'ai',
  text: "Your content is ready. What would you like to refine or update?",
  chips: [
    'Refine the blog post',
    'Improve social copy',
    'Adjust the tone',
    'Make it more compelling',
    'Strengthen the CTA',
    'Add location-specific details',
    'Add a new content piece',
    'Change the campaign angle',
  ],
};

interface EditorReplyProject {
  text: string;
  chips?: string[];
}

const EDITOR_REPLIES_PROJECT: Record<string, EditorReplyProject> = {
  'Refine the blog post': {
    text: "Sure. Which part of the blog post needs work?",
    chips: ['The headline', 'The opening paragraph', 'The body sections', 'The closing / CTA'],
  },
  'Improve social copy': {
    text: "Got it. What would you like to change about the social posts?",
    chips: ['Make it punchier', 'Change the hashtags', 'Adjust the CTA', 'Try a different angle'],
  },
  'Adjust the tone': {
    text: "What tone would you like for the project content?",
    chips: ['More conversational', 'More professional', 'More urgent', 'More friendly & warm'],
  },
  'Make it more compelling': {
    text: "Which piece feels flat and needs more impact?",
    chips: ['The blog post', 'The social posts', 'The email', 'All pieces'],
  },
  'Strengthen the CTA': {
    text: "What action do you want readers to take?",
    chips: ['Book now', 'Visit our website', 'Call us today', 'Leave a review', 'Claim the offer'],
  },
  'Add location-specific details': {
    text: "Which locations should be highlighted in the content?",
    chips: ['All locations', 'Top locations only', 'A specific location'],
  },
  'Add a new content piece': {
    text: "What type of content would you like to add to this project?",
    chips: ['Another social post', 'An email campaign', 'An FAQ page', 'A landing page'],
  },
  'Change the campaign angle': {
    text: "What angle would work better for this campaign?",
    chips: ['Focus on customer reviews', 'Highlight a new offer', 'Seasonal theme', 'Community focus'],
  },
};

const EDITOR_OPENING: ChatMessage = {
  id: 'editor-0',
  role: 'ai',
  text: "Your FAQ is ready. What would you like to improve?",
  chips: ['Improve SEO', 'Make Concise', 'Expand & Add Detail', 'Improve Clarity', 'Make Conversational', 'Optimize for Snippets', 'Change Tone'],
};

// ── Blog editor ───────────────────────────────────────────────────────────────

const EDITOR_OPENING_BLOG: ChatMessage = {
  id: 'editor-0',
  role: 'ai',
  text: "Your blog is ready. What would you like to improve?",
  chips: ['Improve SEO', 'Make Concise', 'Expand & Add Depth', 'Improve Readability', 'Strengthen Intro & Hook', 'Improve Structure & Flow', 'Change Tone'],
};

const EDITOR_REPLIES_BLOG: Record<string, EditorReply> = {
  // Level 1
  'Update the headline': {
    text: "What should the updated headline prioritize?",
    chips: ['SEO keyword placement', 'Emotional pull', 'Clarity and directness', 'All three'],
  },
  'Rewrite the intro': {
    text: "How should we reshape the opening?",
    chips: ['A bold claim', 'A story or anecdote', 'A surprising statistic', 'A direct question', 'Show examples first'],
  },
  'Improve section flow': {
    text: "Where does the blog structure need cleanup?",
    chips: ['Introduction', 'Main body sections', 'Examples and case studies', 'The conclusion', 'Whole post'],
  },
  'Add SEO keywords': {
    text: "Where should I work the target keywords into the blog?",
    chips: ['Keyword placement', 'Heading hierarchy (H2/H3)', 'Internal linking', 'Meta description', 'Full SEO audit'],
  },
  'Expand thin sections': {
    text: "Which part needs more useful detail?",
    chips: ['Introduction', 'Main body sections', 'Examples and case studies', 'The conclusion', 'Whole post'],
  },
  'Tighten the CTA': {
    text: "What should the CTA do for this blog?",
    chips: ['Stronger call to action', 'Key takeaway summary', 'Next steps for the reader', 'Emotional resonance'],
  },
  'Change the tone': {
    text: "What tone should the edited blog use?",
    chips: ['Professional', 'Conversational', 'Authoritative', 'Storytelling', 'Educational'],
  },
  'Simplify language': {
    text: "How should I handle simplification?",
    chips: ['Show suggestions first', 'Apply to full post', 'Focus on technical terms', 'Flag complex sentences only'],
  },
  'Improve SEO structure': {
    text: "Which aspect of SEO should I focus on?",
    chips: ['Keyword placement', 'Heading hierarchy (H2/H3)', 'Internal linking', 'Meta description', 'Full SEO audit'],
  },
  'Rewrite in different tone': {
    text: "Which tone would you like?",
    chips: ['Professional', 'Conversational', 'Authoritative', 'Storytelling', 'Educational'],
  },
  'Add examples or data': {
    text: "What kind of supporting content would help?",
    chips: ['Industry statistics', 'Customer examples', 'Case studies', 'Analogies and comparisons', 'All of the above'],
  },

  // Level 2 — headline
  'SEO keyword placement': {
    text: "I'll rewrite the headline to front-load your target keyword while keeping it compelling. Should I suggest 3 options to pick from?",
    chips: ['Yes, show 3 options', 'Just apply the best one'],
  },
  'Emotional pull': {
    text: "I'll add power words and a reader benefit to make the headline more compelling. Show options first?",
    chips: ['Show 3 options', 'Apply directly'],
  },
  'Clarity and directness': {
    text: "I'll strip any ambiguity and make the headline instantly clear about what the post delivers. Show options?",
    chips: ['Show 3 options', 'Apply the clearest version'],
  },
  'All three': {
    text: "I'll generate 3 headline variants — each optimized for keyword, emotion, and clarity. Which do you want to see first?",
    chips: ['All three at once', 'Best overall pick'],
  },

  // Level 2 — hook
  'A bold claim': {
    text: "I'll open with a strong, evidence-backed claim that makes readers want to continue. Apply directly or review first?",
    chips: ['Show me first', 'Apply directly'],
  },
  'A story or anecdote': {
    text: "I'll draft a brief scenario or customer moment to open the post emotionally. Want a preview?",
    chips: ['Show preview', 'Apply directly'],
  },
  'A surprising statistic': {
    text: "I'll find or suggest a relevant industry stat to open with a hook that immediately builds credibility.",
    chips: ['Show the stat first', 'Apply with stat'],
  },
  'A direct question': {
    text: "Opening with a question pulls readers in by making the post feel personally relevant. Apply to the intro?",
    chips: ['Yes, apply it', 'Show me the rewrite'],
  },
  'Show examples first': {
    text: "Here are 3 alternative opening lines — each using a different hook style. Pick one to apply.",
    chips: ['Bold claim version', 'Story version', 'Question version'],
  },

  // Level 2 — depth
  'Introduction': {
    text: "I'll expand the intro to better set context, preview the key takeaways, and improve reader retention. Apply?",
    chips: ['Apply the expansion', 'Show draft first'],
  },
  'Main body sections': {
    text: "Which body sections feel thin? I can add detail, sub-points, or supporting evidence.",
    chips: ['All sections', 'Let me specify', 'The longest section'],
  },
  'Examples and case studies': {
    text: "I'll add 1–2 concrete examples to ground your key points. Want real-world or hypothetical examples?",
    chips: ['Real-world examples', 'Hypothetical scenarios', 'Both'],
  },
  'The conclusion': {
    text: "I'll strengthen the closing with a clearer CTA, a memorable takeaway, and a forward-looking statement. Apply?",
    chips: ['Apply the rewrite', 'Show draft first'],
  },
  'Whole post': {
    text: "I'll do a full depth pass — expanding thin sections, adding transitions, and enriching supporting points throughout.",
    chips: ['Show a summary of changes', 'Apply all directly'],
  },

  // Level 2 — simplify
  'Show suggestions first': {
    text: "Here are the top 5 phrases flagged as overly complex. Approve individual ones to apply simplified rewrites.",
    chips: ['Approve all', 'Skip for now'],
  },
  'Apply to full post': {
    text: "Simplifying language across the whole post — preserving meaning while removing jargon and shortening long sentences.",
    chips: ['Looks good', 'Undo changes'],
  },
  'Focus on technical terms': {
    text: "I'll flag industry jargon and suggest plain-language alternatives without losing authority.",
    chips: ['Show flagged terms', 'Apply replacements'],
  },
  'Flag complex sentences only': {
    text: "I'll highlight sentences over 30 words and those with passive voice, so you can decide what to simplify.",
    chips: ['Show flags', 'Auto-simplify flagged ones'],
  },

  // Level 2 — SEO
  'Keyword placement': {
    text: "I'll ensure your primary keyword appears in the title, first paragraph, and 2–3 subheadings naturally. Apply?",
    chips: ['Apply now', 'Show placement plan first'],
  },
  'Heading hierarchy (H2/H3)': {
    text: "I'll restructure headings so each H2 is a major topic and H3s break it down — better for both readers and crawlers.",
    chips: ['Show new structure', 'Apply directly'],
  },
  'Internal linking': {
    text: "I'll suggest 3–5 anchor text opportunities where internal links would boost SEO authority. Want to see them?",
    chips: ['Yes, show suggestions', 'Apply automatically'],
  },
  'Meta description': {
    text: "I'll write an SEO-optimized meta description under 160 characters that includes your keyword and a clear benefit. Generate?",
    chips: ['Generate meta description', 'Show 3 options'],
  },
  'Full SEO audit': {
    text: "Running a full audit: keyword density, heading structure, meta description, internal linking, and readability score.",
    chips: ['Show full report', 'Apply all fixes'],
  },

  // Level 2 — tone
  'Professional': {
    text: "I'll rewrite in a clear, formal, expert voice — precise language, no contractions. Apply to full post or specific sections?",
    chips: ['Full post', 'Specific sections'],
  },
  'Conversational': {
    text: "I'll use 'you', contractions, and natural phrasing to make the post feel like a one-on-one conversation. Apply to full post?",
    chips: ['Full post', 'Specific sections'],
  },
  'Authoritative': {
    text: "I'll make every statement confident and definitive — citing specifics, avoiding hedging. Apply throughout?",
    chips: ['Full post', 'Specific sections'],
  },
  'Storytelling': {
    text: "I'll weave narrative elements into the post — opening with a scenario, using character-driven examples. Apply?",
    chips: ['Full post', 'Just the intro and conclusion'],
  },
  'Educational': {
    text: "I'll structure the post to teach step by step — clear definitions, examples, and takeaways at each point.",
    chips: ['Full post', 'Specific sections'],
  },

  // Level 2 — examples
  'Industry statistics': {
    text: "I'll source or suggest relevant stats that strengthen your key claims. Want citations included?",
    chips: ['Yes, include sources', 'Stats only'],
  },
  'Customer examples': {
    text: "I'll add anonymized or generalized customer scenarios that make the advice feel real and relatable.",
    chips: ['Add 1–2 examples', 'Add per section'],
  },
  'Case studies': {
    text: "I'll draft a brief before/after case study format to illustrate your main point. Add it as its own section?",
    chips: ['Yes, as a new section', 'Weave it into existing sections'],
  },
  'Analogies and comparisons': {
    text: "I'll add analogies to simplify complex ideas and make the content more memorable.",
    chips: ['Add to key points', 'Apply throughout'],
  },
  'All of the above': {
    text: "I'll add a stat, a customer example, and an analogy — one to each of your main body sections. Proceed?",
    chips: ['Yes, proceed', 'Show preview first'],
  },

  // Level 2 — conclusion
  'Stronger call to action': {
    text: "What action should the reader take after finishing the post?",
    chips: ['Contact us', 'Read another post', 'Sign up', 'Try our product', 'Leave a review'],
  },
  'Key takeaway summary': {
    text: "I'll add a 3-point summary at the end that reinforces the post's core value. Apply?",
    chips: ['Apply summary', 'Show draft first'],
  },
  'Next steps for the reader': {
    text: "I'll close with a clear list of actionable next steps the reader can take right away. Add it?",
    chips: ['Apply it', 'Show draft first'],
  },
  'Emotional resonance': {
    text: "I'll rewrite the final paragraph to leave the reader feeling motivated or inspired — not just informed. Apply?",
    chips: ['Apply the rewrite', 'Show draft first'],
  },

  // Terminal replies shared across blog paths
  'Yes, show 3 options': { text: "Here are 3 headline options. Click one to apply it to the post." },
  'Just apply the best one': { text: "Applied the highest-scoring headline based on clarity, keyword fit, and emotional pull." },
  'Show 3 options': { text: "Here are 3 headline variants. Pick one to swap in." },
  'Apply directly': { text: "Applied. The updated content is showing in the canvas — use undo if you want to revert." },
  'Apply the clearest version': { text: "Clearest version applied. The headline now communicates the post value immediately." },
  'Best overall pick': { text: "Best overall headline applied — strong keyword, clear reader benefit, moderate emotional pull." },
  'All three at once': { text: "All 3 headline variants are ready in the canvas. Tap one to set it as the active headline." },
  'Show me first': { text: "Here's the rewritten intro. Approve it to apply, or describe what to adjust." },
  'Show preview': { text: "Here's the new opening. It starts with a relatable moment before pivoting to the post's core topic." },
  'Show the stat first': { text: "Suggested stat: 72% of consumers trust local businesses more when they find consistent online information. Want to use it?" },
  'Apply with stat': { text: "Opening hook updated with the statistic. The intro now leads with the data point before expanding." },
  'Yes, apply it': { text: "Applied. The post now opens with a direct question that frames the reader's problem before offering a solution." },
  'Show me the rewrite': { text: "Here's the revised opening — review it and approve or adjust." },
  'Bold claim version': { text: "Applying the bold claim opener. It asserts a strong POV immediately — great for thought leadership content." },
  'Story version': { text: "Applying the story opener. This builds empathy before introducing the main argument." },
  'Question version': { text: "Applying the question opener. It makes the reader the subject of the post, increasing personal relevance." },
  'Apply the expansion': { text: "Introduction expanded. It now previews 3 key takeaways and sets clear expectations for the reader." },
  'Show draft first': { text: "Here's the draft. Review it and confirm to apply, or tell me what to adjust." },
  'All sections': { text: "Expanding all body sections now — adding evidence, sub-points, and transitions throughout." },
  'Let me specify': { text: "Click on any section in the canvas to select it, then confirm here to expand that section." },
  'The longest section': { text: "I'll add depth to your longest section first, which is usually where the most value needs reinforcement." },
  'Real-world examples': { text: "Adding real-world industry examples to 2–3 key points. These reference common scenarios your readers will recognize." },
  'Hypothetical scenarios': { text: "Adding hypothetical 'imagine if' scenarios to make abstract points more concrete." },
  'Both': { text: "Adding a mix of real-world references and hypothetical scenarios across the main body sections." },
  'Apply the rewrite': { text: "Applied. The section has been rewritten — check the canvas to review and make further adjustments." },
  'Approve all': { text: "All simplified rewrites applied. Language is now cleaner and more accessible throughout." },
  'Skip for now': { text: "No changes made. Come back anytime." },
  'Looks good': { text: "Great. The simplified version is saved. Want to check anything else?" },
  'Undo changes': { text: "Changes reverted. Your original language is restored." },
  'Show flagged terms': { text: "I've flagged 4 technical terms. Each has a plain-language suggestion you can approve individually." },
  'Apply replacements': { text: "All plain-language replacements applied. The reading level has improved by approximately 2 grade levels." },
  'Show flags': { text: "I've highlighted 3 long sentences and 2 passive-voice constructions in the canvas. Review them at your own pace." },
  'Auto-simplify flagged ones': { text: "Simplified all flagged sentences. Each is now under 25 words in active voice." },
  'Apply now': { text: "Keyword placement optimized. Primary keyword appears in the title, opening paragraph, and 2 subheadings." },
  'Show placement plan first': { text: "Here's the keyword placement plan: Title (position 1), paragraph 1 (natural), H2 #1 and #3, and once in the conclusion." },
  'Show new structure': { text: "Here's the proposed heading structure. 4 H2s cover the main sections, with H3s breaking down each one." },
  'Yes, show suggestions': { text: "I've identified 4 internal linking opportunities — each with suggested anchor text and target page. Approve to add." },
  'Apply automatically': { text: "Internal links added. 4 contextually relevant links have been woven into the post text." },
  'Generate meta description': { text: "Meta description generated (142 chars): 'Learn how local businesses can use AI-powered tools to respond to reviews faster and improve customer trust.'" },
  'Show full report': { text: "SEO audit complete. Keyword density: Good. Headings: 1 H1, 3 H2s detected. Meta: Missing. Internal links: 0 found." },
  'Apply all fixes': { text: "All SEO improvements applied — keyword placement, heading structure, meta description, and 3 internal link suggestions." },
  'Full post': { text: "Tone applied across the full post. The changes are showing in the canvas — you can revert individual paragraphs from there." },
  'Specific sections': { text: "Click on any section in the canvas to select it, then confirm here to apply the tone rewrite to just that section." },
  'Just the intro and conclusion': { text: "Storytelling tone applied to the introduction and conclusion — where narrative impact matters most." },
  'Yes, include sources': { text: "Stats added with source citations in parentheses. You can update the sources from the canvas." },
  'Stats only': { text: "Stats added inline without citations. You can add attribution later if needed." },
  'Add 1–2 examples': { text: "Added 2 relatable customer scenarios to the most relevant sections of the post." },
  'Add per section': { text: "Added one brief customer example to each body section to keep the advice grounded throughout." },
  'Yes, as a new section': { text: "Case study added as its own section between the main body and the conclusion." },
  'Weave it into existing sections': { text: "Case study woven into the main body — referenced at the point where the advice is most actionable." },
  'Add to key points': { text: "Added analogies to the 3 core points of the post to make the concepts more intuitive." },
  'Apply throughout': { text: "Analogies woven throughout the post, with one per major section." },
  'Yes, proceed': { text: "Adding supporting content across sections now — this will strengthen every major claim in the post." },
  'Show preview first': { text: "Here's a preview of the planned additions. Approve each section's addition individually or accept all at once." },
  'Contact us': { text: "CTA updated: 'Ready to get started? Contact our team today and we'll help you apply these strategies at your location.'" },
  'Read another post': { text: "CTA updated with an internal content recommendation block — pointing to a related post for continued engagement." },
  'Sign up': { text: "CTA updated: 'Want more insights like this? Sign up for our newsletter and get tips delivered weekly.'" },
  'Try our product': { text: "CTA updated: 'See how Birdeye can help you put these strategies into practice — start your free trial today.'" },
  'Leave a review': { text: "CTA updated: 'Found this helpful? Leave us a review and let us know what resonated most.'" },
  'Apply summary': { text: "Key takeaway summary added to the conclusion. It reinforces the post's 3 core points in one scannable block." },
  'Apply it': { text: "Next steps section added. The reader now has a clear, action-oriented path forward after finishing the post." },
};

const EDITOR_REPLIES: Record<string, EditorReply> = {
  // Level 1 — initial chip choices
  'Strengthen answers': {
    text: "Which answers should I strengthen? I can rewrite them to be more direct, add evidence, or improve clarity.",
    chips: ['Lowest scoring answers', 'Let me pick', 'All answers'],
  },
  'Add missing questions': {
    text: "What area should I focus on for missing coverage?",
    chips: ['Pricing and costs', 'Booking and availability', 'Emergency situations', 'Policies and guarantees', 'All areas'],
  },
  'Simplify language': {
    text: "How should I handle simplified rewriting?",
    chips: ['Show suggestions first', 'Apply to all automatically', 'Focus on longest answers', 'Just flag complex phrases'],
  },
  'Improve SEO structure': {
    text: "Which aspect of SEO structure should I focus on?",
    chips: ['Question phrasing', 'Answer length', 'Schema markup', 'Heading hierarchy', 'Full audit'],
  },
  'Make more concise': {
    text: "Should I apply conciseness improvements across the board or review first?",
    chips: ['Show me before applying', 'Apply to all', 'Focus on longest answers only', 'Flag answers over 100 words'],
  },
  'Rewrite in different tone': {
    text: "Which tone would you prefer?",
    chips: ['Professional', 'Friendly', 'Authoritative', 'Conversational', 'Empathetic'],
  },
  'Add examples': {
    text: "Which answers should I add examples or analogies to?",
    chips: ['Lowest scoring answers', 'Let me pick', 'All answers'],
  },
  'Check against objective': {
    text: "What was the primary objective for this FAQ set?",
    chips: ['Search visibility', 'Customer support', 'Drive conversions', 'All three'],
  },

  // Level 2 — follow-up chip choices
  'Lowest scoring answers': {
    text: "I'll focus on the lowest-scoring answers. Should I rewrite them for clarity, add evidence, or both?",
    chips: ['Rewrite for clarity', 'Add evidence', 'Both improvements'],
  },
  'Let me pick': {
    text: "Click any answer in the canvas to select it, then I'll apply the change to just that one.",
  },
  'All answers': {
    text: "I'll go through every answer. Want a summary of suggested changes first, or should I apply them directly?",
    chips: ['Show summary first', 'Apply directly'],
  },
  'Pricing and costs': {
    text: "I'll draft 3–5 pricing-related questions that are commonly searched. Want me to also include payment method and refund policy questions?",
    chips: ['Yes, include payment and refunds', 'Pricing questions only'],
  },
  'Booking and availability': {
    text: "I'll add questions covering booking flow, availability windows, and waitlists. Include cancellation policy questions too?",
    chips: ['Yes, add cancellation', 'Booking only'],
  },
  'Emergency situations': {
    text: "I'll add urgent-intent questions with fast, direct answers — the kind people search at 2am. Include after-hours contact info questions?",
    chips: ['Yes, include after-hours', 'Emergency questions only'],
  },
  'Policies and guarantees': {
    text: "I'll cover warranty, satisfaction guarantee, and service agreement questions. Include return or cancellation policy too?",
    chips: ['Yes, include cancellation policy', 'Guarantees and warranties only'],
  },
  'All areas': {
    text: "I'll do a full coverage audit across all topics. This may suggest 8–12 new questions. Want to review before adding?",
    chips: ['Review first', 'Add automatically'],
  },
  'Show suggestions first': {
    text: "Here are the top 5 answers flagged as overly complex. Approve individual ones to apply simplified rewrites.",
    chips: ['Approve all', 'Skip for now'],
  },
  'Apply to all automatically': {
    text: "Simplifying language across all answers now. This will preserve meaning while removing jargon and reducing sentence length.",
    chips: ['Looks good', 'Undo changes'],
  },
  'Question phrasing': {
    text: "I'll reframe questions to match how people actually search — conversational phrasing performs better in SGE. Proceed?",
    chips: ['Yes, reframe questions', 'Show examples first'],
  },
  'Answer length': {
    text: "Ideal AEO answers are 40–60 words. I'll flag any that are too short (under 20) or too long (over 120). Review?",
    chips: ['Flag and review', 'Auto-trim long answers'],
  },
  'Schema markup': {
    text: "I'll verify your FAQ schema structure is valid for Google's FAQ rich results. Want the JSON-LD output too?",
    chips: ['Yes, show JSON-LD', 'Just validate structure'],
  },
  'Full audit': {
    text: "Running a full SEO audit across question phrasing, answer length, schema, and heading structure. This covers everything.",
    chips: ['Great, proceed', 'Show what will be checked'],
  },
  'Professional': {
    text: "I'll rewrite answers in a clear, formal, expert tone — no contractions, precise language. Apply to all or let me pick?",
    chips: ['Apply to all', 'Let me pick'],
  },
  'Friendly': {
    text: "Rewriting in a warm, approachable tone — using 'you', contractions, and conversational phrasing. Apply to all?",
    chips: ['Apply to all', 'Let me pick'],
  },
  'Authoritative': {
    text: "I'll make answers sound confident and definitive — citing specifics, avoiding hedging language. Apply to all?",
    chips: ['Apply to all', 'Let me pick'],
  },
  'Conversational': {
    text: "Going for a natural, dialogue-like tone — as if answering face-to-face. Apply to all answers?",
    chips: ['Apply to all', 'Let me pick'],
  },
  'Empathetic': {
    text: "I'll lead answers with acknowledgment before the solution — ideal for sensitive topics like costs or wait times. Apply to all?",
    chips: ['Apply to all', 'Let me pick'],
  },
  'Search visibility': {
    text: "Checking for question-answer alignment with high-volume search queries, schema validity, and featured snippet formatting.",
    chips: ['Run check', 'Show what to look for'],
  },
  'Customer support': {
    text: "Checking if answers reduce call volume — looking for completeness, clarity, and self-serve sufficiency.",
    chips: ['Run check', 'Show criteria'],
  },
  'Drive conversions': {
    text: "Checking for persuasive language, trust signals, and clear calls to action in each answer.",
    chips: ['Run check', 'Show criteria'],
  },
  'All three': {
    text: "I'll check against all three objectives and flag answers that underperform on any of them. This gives you a complete picture.",
    chips: ['Run full check', 'Prioritize one objective'],
  },

  // Terminal replies
  'Rewrite for clarity': { text: "Rewriting the flagged answers for clarity now. The updated versions will appear inline — you can accept or revert each one." },
  'Add evidence': { text: "Adding concrete evidence — stats, examples, or quotes — to the flagged answers. Changes appear inline in the canvas." },
  'Both improvements': { text: "Perfect. I'll rewrite the flagged answers for clarity and add supporting evidence. Changes will appear in the canvas." },
  'Show summary first': { text: "Here's a summary of proposed changes across all answers. Approve each batch or apply them all at once." },
  'Apply directly': { text: "Applying improvements across all answers now. You can undo any individual change from the canvas." },
  'Yes, include payment and refunds': { text: "Adding 5 new questions covering pricing, payment methods, and refund policy. They'll appear at the bottom of the canvas." },
  'Pricing questions only': { text: "Adding 3 pricing-focused questions with transparent, direct answers." },
  'Yes, add cancellation': { text: "Adding questions on booking, availability, and cancellation policy. These cover the most common pre-booking concerns." },
  'Booking only': { text: "Adding 3 questions focused on the booking flow and availability. Short, action-oriented answers." },
  'Yes, include after-hours': { text: "Including after-hours contact details and protocol in the emergency-related answers." },
  'Emergency questions only': { text: "Adding high-urgency questions with fast, scannable answers — no fluff, just actionable info." },
  'Yes, include cancellation policy': { text: "Covering guarantees, warranties, and cancellation policies in one consolidated set of questions." },
  'Guarantees and warranties only': { text: "Adding clear, specific guarantee and warranty questions that build trust and reduce pre-purchase anxiety." },
  'Review first': { text: "Here are the 8 suggested new questions grouped by topic. Tap any to add it directly to your FAQ." },
  'Add automatically': { text: "Adding all suggested questions now. You can review and delete any from the canvas." },
  'Approve all': { text: "All simplified rewrites applied. Your FAQ now uses cleaner, more accessible language throughout." },
  'Skip for now': { text: "No changes made. Come back anytime — the suggestions are saved." },
  'Yes, reframe questions': { text: "Reframing questions to match natural search language now. Changes appear inline in the canvas." },
  'Show examples first': { text: "Here are 3 examples of reframed questions: 'How much does it cost?' vs 'What is the cost of...?'" },
  'Flag and review': { text: "Flagging 4 answers that are outside the optimal range. Review them in the canvas — each has a suggestion." },
  'Auto-trim long answers': { text: "Trimming answers over 120 words to tighter versions. All original text is preserved as a draft you can restore." },
  'Yes, show JSON-LD': { text: "Your FAQ schema is valid. Here's the JSON-LD snippet — copy it into your page's <head> or use the Export option." },
  'Just validate structure': { text: "Structure looks good. All question-answer pairs are correctly formatted for FAQ rich results." },
  'Great, proceed': { text: "Running the full audit now. Results will appear as inline flags on individual questions in the canvas." },
  'Show what will be checked': { text: "The audit covers: (1) question phrasing vs search intent, (2) answer length, (3) schema validity, (4) heading structure." },
  'Apply to all': { text: "Tone applied across all answers. You can revert individual answers from the canvas using the undo button." },
  'Run check': { text: "Check complete. 2 answers need attention — I've flagged them in the canvas with specific improvement suggestions." },
  'Run full check': { text: "Full objective check complete. Most answers score well on visibility and support. 3 answers could improve conversion language." },
  'Prioritize one objective': { text: "Which objective matters most right now?", chips: ['Search visibility', 'Customer support', 'Drive conversions'] },
  'Show what to look for': { text: "I look for: question-keyword alignment, 40–60 word answers, presence of local signals, and direct answer-first phrasing." },
  'Show criteria': { text: "Criteria: complete self-serve answers, no dead ends, clear next steps, and coverage of the top 5 support call reasons." },
  'Looks good': { text: "Great. Your FAQ language is now clear and accessible. Want to check anything else?" },
  'Undo changes': { text: "Changes reverted. Your original language is restored across all answers." },
};

// ── Props ──────────────────────────────────────────────────────────────────────

/** Partial FAQWizardState shape — keep minimal to avoid circular deps */
interface FAQWizardAnswers {
  goalData?: {
    persona?: string;
    tone?: string;
    faqCount?: number;
  };
}

interface AiCopilotProps {
  onStartGenerating?: () => void;
  onGenerationComplete?: () => void;
  initialContentType?: 'faq' | 'social' | 'email' | 'blog' | 'project';
  /** T5: fired when the FAQ copilot path collects all answers, so the wizard can be pre-filled */
  onFAQAnswersReady?: (answers: FAQWizardAnswers) => void;
  /**
   * 'setup'   — default; shows content-type questions and drives generation
   * 'editing' — shows content-quality chips for improving already-generated content
   */
  editorContext?: 'setup' | 'editing';
  /** Wizard output passed in so the copilot can reference tone/objective without re-asking */
  wizardSummary?: string;
  /** Called when user confirms a full regeneration from the editor copilot */
  onRegen?: () => void;
  /** Called when the copilot starts applying a section edit — section name passed as argument */
  onSectionEditStart?: (section: string) => void;
  /** Called when the section edit completes */
  onSectionEditEnd?: () => void;
  /** Block selected on the canvas — shown as a context chip in the prompt area */
  selectedBlock?: { id: string; type: string; label: string } | null;
  /** Called when the user dismisses the block context chip */
  onClearSelectedBlock?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const AiCopilot = ({ onStartGenerating, onGenerationComplete, initialContentType, onFAQAnswersReady, editorContext = 'setup', wizardSummary: _wizardSummary, onRegen, onSectionEditStart, onSectionEditEnd, selectedBlock, onClearSelectedBlock }: AiCopilotProps) => {
  // Editing mode — completely separate UI path
  if (editorContext === 'editing') {
    const editorMode: EditorMode =
      initialContentType === 'blog'    ? 'blog'    :
      initialContentType === 'social'  ? 'social'  :
      initialContentType === 'email'   ? 'email'   :
      initialContentType === 'faq'     ? 'faq'     :
      initialContentType === 'project' ? 'project' :
      'faq';
    return <EditorCopilot mode={editorMode} onRegen={onRegen} onSectionEditStart={onSectionEditStart} onSectionEditEnd={onSectionEditEnd} selectedBlock={selectedBlock} onClearSelectedBlock={onClearSelectedBlock} />;
  }
  const initialConvState: ConvState = initialContentType && initialContentType !== 'project'
    ? { path: initialContentType, step: 0, answers: {} }
    : initialContentType === 'project'
    ? { path: 'project', step: 0, answers: {} }
    : { path: 'choose', step: 0, answers: {} };

  const initialChatMessages: ChatMessage[] = initialContentType
    ? [getFirstMessage(initialContentType as Exclude<ConvPath, 'choose'>)]
    : [CHOOSE_MESSAGE];

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [convState, setConvState] = useState<ConvState>(initialConvState);
  const [input, setInput] = useState('');
  // multiSelect pending selections keyed by message id
  const [pendingMulti, setPendingMulti] = useState<Record<string, string[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const addChatMessage = (msg: ChatMessage) => {
    setChatMessages(prev => [...prev, msg]);
  };

  // ── Advance conversation after an answer is committed ───────────────────────

  const advanceConversation = (
    currentState: ConvState,
    answer: string | string[],
    answerKey: string,
  ) => {
    const updatedAnswers = { ...currentState.answers, [answerKey]: answer };
    const path = currentState.path;
    const step = currentState.step;

    // "choose" path — pick direction
    if (path === 'choose') {
      const chip = Array.isArray(answer) ? answer[0] : answer;
      const pathMap: Record<string, ConvPath> = {
        '📁 Full content project': 'project',
        'FAQ page': 'faq',
        'Social post': 'social',
        'Email': 'email',
        'Blog': 'blog',
      };
      const nextPath = pathMap[chip] ?? 'choose';
      const newState: ConvState = { path: nextPath, step: 0, answers: {} };
      setConvState(newState);
      const q = SCRIPTS[nextPath as Exclude<ConvPath, 'choose'>][0];
      setTimeout(() => {
        addChatMessage({
          id: Date.now().toString(),
          role: 'ai',
          text: q.text,
          chips: q.chips,
          multiSelect: q.multiSelect,
        });
      }, 800);
      return;
    }

    // Typed paths
    const script = SCRIPTS[path as Exclude<ConvPath, 'choose'>];
    const nextStep = step + 1;

    // Check if we've finished the script
    if (nextStep >= script.length) {
      // After all questions done
      const newState: ConvState = { path, step: nextStep, answers: updatedAnswers };
      setConvState(newState);

      if (path === 'project') {
        // Show summary with confirm chips
        setTimeout(() => {
          const goal = updatedAnswers['0'] as string || 'Not specified';
          const audience = updatedAnswers['1'] as string || 'Not specified';
          const content = Array.isArray(updatedAnswers['2']) ? (updatedAnswers['2'] as string[]).join(', ') : (updatedAnswers['2'] as string) || 'Not specified';
          const timeline = updatedAnswers['4'] as string || 'Not specified';
          addChatMessage({
            id: Date.now().toString(),
            role: 'ai',
            text: `Here's your project summary:\nGoal: ${goal}\nAudience: ${audience}\nContent: ${content}\nTimeline: ${timeline}\nReady to generate?`,
            chips: ["Yes, start generating", "Make changes"],
            isSummary: true,
          });
        }, 800);
      } else {
        // Other paths: show "Start generating →" chip
        setTimeout(() => {
          addChatMessage({
            id: Date.now().toString(),
            role: 'ai',
            text: "Great! All set. Ready to generate your content?",
            chips: ["Start generating →"],
          });
        }, 800);
      }
      return;
    }

    // More steps remain
    const newState: ConvState = { path, step: nextStep, answers: updatedAnswers };
    setConvState(newState);
    const nextQ = script[nextStep];
    setTimeout(() => {
      addChatMessage({
        id: Date.now().toString(),
        role: 'ai',
        text: nextQ.text,
        chips: nextQ.chips,
        multiSelect: nextQ.multiSelect,
      });
    }, 800);
  };

  // ── Handle a committed answer (text or single chip) ─────────────────────────

  const commitAnswer = (answer: string | string[]) => {
    const displayText = Array.isArray(answer) ? answer.join(', ') : answer;
    addChatMessage({
      id: Date.now().toString(),
      role: 'user',
      text: displayText,
    });
    const answerKey = String(convState.step);
    advanceConversation(convState, answer, answerKey);
  };

  // ── Handle chip clicks ───────────────────────────────────────────────────────

  const handleChipClick = (chip: string, msgId: string, isMultiSelect: boolean) => {
    // Summary chips
    if (chip === 'Yes, start generating') {
      addChatMessage({ id: Date.now().toString(), role: 'user', text: chip });
      onStartGenerating?.();
      setTimeout(() => {
        addChatMessage({
          id: Date.now().toString(),
          role: 'ai',
          text: "Your content is being generated. This may take a moment...",
        });
        setTimeout(() => {
          onGenerationComplete?.();
          addChatMessage({
            id: Date.now().toString(),
            role: 'ai',
            text: "Your content is ready! Take a look at the canvas on the right.",
          });
        }, 6000);
      }, 800);
      return;
    }

    if (chip === 'Make changes') {
      addChatMessage({ id: Date.now().toString(), role: 'user', text: chip });
      const newState: ConvState = { path: 'choose', step: 0, answers: {} };
      setConvState(newState);
      setTimeout(() => {
        addChatMessage({ ...CHOOSE_MESSAGE, id: Date.now().toString() });
      }, 800);
      return;
    }

    if (chip === 'Start generating →') {
      addChatMessage({ id: Date.now().toString(), role: 'user', text: chip });
      // T5: emit FAQ answers so wizard can be pre-filled if user switches tabs
      if (convState.path === 'faq' && onFAQAnswersReady) {
        const a = convState.answers;
        const faqCountRaw = (a['3'] as string) ?? '';
        const faqCount = parseInt(faqCountRaw) || 12;
        onFAQAnswersReady({
          goalData: {
            persona: (a['1'] as string) || undefined,
            tone: (a['2'] as string) || undefined,
            faqCount: isNaN(faqCount) ? 12 : faqCount,
          },
        });
      }
      onStartGenerating?.();
      setTimeout(() => {
        addChatMessage({
          id: Date.now().toString(),
          role: 'ai',
          text: "Your content is being generated. This may take a moment...",
        });
        setTimeout(() => {
          onGenerationComplete?.();
          addChatMessage({
            id: Date.now().toString(),
            role: 'ai',
            text: "Your content is ready! Take a look at the canvas on the right.",
          });
        }, 6000);
      }, 800);
      return;
    }

    if (isMultiSelect) {
      setPendingMulti(prev => {
        const current = prev[msgId] ?? [];
        const exists = current.includes(chip);
        return {
          ...prev,
          [msgId]: exists ? current.filter(c => c !== chip) : [...current, chip],
        };
      });
      return;
    }

    // Single-select chip — commit immediately
    commitAnswer(chip);
  };

  const handleMultiContinue = (msgId: string) => {
    const selected = pendingMulti[msgId] ?? [];
    if (selected.length === 0) return;
    setPendingMulti(prev => {
      const next = { ...prev };
      delete next[msgId];
      return next;
    });
    commitAnswer(selected);
  };

  // ── Handle free-text send ────────────────────────────────────────────────────

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setInput('');
    commitAnswer(text.trim());
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col w-full h-full bg-background relative z-20">

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        className="hidden"
      />

      {/* Chat content */}
      <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-8">
        {chatMessages.map((msg) => {
          const isAI = msg.role === 'ai';
          const multiSelections = pendingMulti[msg.id] ?? [];

          return (
            <div key={msg.id} className="flex gap-2 items-start w-full shrink-0">
              <div className="flex items-center pt-0.5 shrink-0">
                {isAI ? <CopilotAvatar /> : <UserAvatar />}
              </div>

              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-line">
                  {msg.text}
                </p>

                {msg.chips && msg.chips.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {msg.chips.map(chip => (
                      <Chip
                        key={chip}
                        label={chip}
                        onClick={() => handleChipClick(chip, msg.id, msg.multiSelect ?? false)}
                        selected={msg.multiSelect ? multiSelections.includes(chip) : false}
                      />
                    ))}
                    {msg.multiSelect && multiSelections.length > 0 && (
                      <button
                        onClick={() => handleMultiContinue(msg.id)}
                        className="px-4 py-1 bg-primary text-primary-foreground rounded-full text-[13px] hover:opacity-90 transition-opacity"
                      >
                        Continue →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt input */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <CopilotPromptBox
          value={input}
          onChange={setInput}
          onSend={() => handleSend(input)}
          onAttach={() => fileInputRef.current?.click()}
          placeholder="Select an option above, or ask directly..."
        />
      </div>
    </div>
  );
};
