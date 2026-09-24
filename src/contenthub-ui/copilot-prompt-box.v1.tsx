import * as React from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "./utils";
import { AttachFileIcon } from "@/assets/icons/AttachFileIcon";
import { EditNoteIcon } from "@/assets/icons/EditNoteIcon";
import { PaperPlaneRightIcon } from "@/assets/icons/PaperPlaneRightIcon";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "./prompt-input";

export interface CopilotPromptBoxContextChip {
  label: string;
  icon: React.ReactNode;
  onRemove?: () => void;
}

export interface CopilotPromptBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** When set, renders a dismissible context chip inside the prompt box above the textarea */
  contextChip?: CopilotPromptBoxContextChip | null;
}

// ── Prompt enhancement ────────────────────────────────────────────────────────
// Mock: rewrites the user's rough text into a structured, AI-readable prompt.

function enhancePrompt(raw: string): string {
  const trimmed = raw.trim();

  // Simple keyword-based rewrites for common copilot intents
  const lower = trimmed.toLowerCase();

  if (lower.includes('shorter') || lower.includes('concise') || lower.includes('shorter')) {
    return `Please condense the selected content to be more concise. Remove redundant phrases, tighten sentence structure, and preserve all key information while reducing overall word count by approximately 30–40%.`;
  }
  if (lower.includes('longer') || lower.includes('expand') || lower.includes('more detail')) {
    return `Please expand the selected content with additional detail, supporting examples, and context. Maintain the existing tone and style while increasing depth and comprehensiveness.`;
  }
  if (lower.includes('tone') || lower.includes('formal') || lower.includes('friendly') || lower.includes('professional')) {
    return `Please rewrite the selected content to adopt a ${trimmed.replace(/.*tone.*/i, 'professional')} tone. Preserve the original meaning and key points while adjusting word choice, sentence rhythm, and register accordingly.`;
  }
  if (lower.includes('seo') || lower.includes('keyword') || lower.includes('search')) {
    return `Please optimise the selected content for search engines. Incorporate relevant keywords naturally, improve heading structure, enhance meta-relevant phrases, and ensure the content satisfies search intent without keyword stuffing.`;
  }
  if (lower.includes('fix') || lower.includes('grammar') || lower.includes('spelling') || lower.includes('error')) {
    return `Please review and correct all spelling errors, grammatical mistakes, and punctuation issues in the selected content. Maintain the original voice and meaning throughout.`;
  }
  if (lower.includes('cta') || lower.includes('call to action') || lower.includes('convert')) {
    return `Please strengthen the call-to-action in the selected content. Make it more compelling, action-oriented, and aligned with the reader's intent. The CTA should create urgency and clearly communicate the benefit of taking action.`;
  }
  if (lower.includes('headline') || lower.includes('title') || lower.includes('heading')) {
    return `Please rewrite the headline to be more compelling and click-worthy. It should clearly communicate the primary benefit, create curiosity, and be optimised for both readers and search engines. Provide 3 variations.`;
  }
  if (lower.includes('readab') || lower.includes('simpl') || lower.includes('clear')) {
    return `Please improve the readability of the selected content. Break up long sentences, use simpler vocabulary where appropriate, add subheadings for scannability, and ensure the content flows naturally for a general audience.`;
  }

  // Generic fallback — wraps the raw input in a structured instruction
  const capitalised = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return `Please ${capitalised.endsWith('.') ? capitalised.slice(0, -1) : capitalised}. Apply this change to the selected content while maintaining the original tone, brand voice, and factual accuracy. Ensure the result is polished, professional, and ready to publish.`;
}

export function ContextChipBadge({ label, icon, onRemove }: CopilotPromptBoxContextChip) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-primary bg-background pl-1 pr-1.5 py-1 text-[13px] text-foreground max-w-[220px]">
      <span className="flex items-center justify-center size-5 shrink-0 rounded-[4px] border border-border text-muted-foreground">
        {icon}
      </span>
      <span className="truncate">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear context"
        >
          <X className="size-3.5" strokeWidth={1.6} absoluteStrokeWidth />
        </button>
      )}
    </div>
  );
}

export function CopilotPromptBox({
  value,
  onChange,
  onSend,
  onAttach,
  placeholder = "Ask anything...",
  disabled = false,
  className,
  contextChip,
}: CopilotPromptBoxProps) {
  const [isEnhancing, setIsEnhancing] = React.useState(false);

  const canSend    = value.trim().length > 0 && !disabled;
  const canEnhance = value.trim().length > 0 && !disabled && !isEnhancing;

  async function handleEnhance() {
    if (!canEnhance) return;
    setIsEnhancing(true);
    // Simulate a brief AI round-trip
    await new Promise(r => setTimeout(r, 900));
    onChange(enhancePrompt(value));
    setIsEnhancing(false);
  }

  return (
    <PromptInput onSubmit={onSend} disabled={disabled} className={className}>
      {contextChip && (
        <div className="flex items-center px-3.5 pt-2.5 pb-0">
          <ContextChipBadge {...contextChip} />
        </div>
      )}
      <PromptInputTextarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <PromptInputActions>
        <div className="flex items-center gap-0">
          <PromptInputAction
            tooltip="Attach file"
            onClick={onAttach}
            disabled={disabled}
            className="p-1"
          >
            <AttachFileIcon className="size-6" />
          </PromptInputAction>

          {/* Enhance prompt — disabled until user types */}
          <PromptInputAction
            tooltip="Enhance prompt"
            onClick={handleEnhance}
            disabled={!canEnhance}
            className={cn(
              'p-1 transition-colors',
              canEnhance
                ? 'text-[#9970D7] hover:bg-[#9970D7]/8'
                : 'opacity-30',
            )}
          >
            {isEnhancing
              ? <Loader2 className="size-[18px] animate-spin" strokeWidth={1.6} />
              : <EditNoteIcon className="size-6" />
            }
          </PromptInputAction>
        </div>

        <PromptInputAction
          tooltip="Send"
          onClick={onSend}
          disabled={!canSend}
          className={cn(
            'transition-colors',
            canSend ? 'hover:opacity-80' : 'opacity-30',
          )}
        >
          <PaperPlaneRightIcon className="size-6" />
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  );
}
