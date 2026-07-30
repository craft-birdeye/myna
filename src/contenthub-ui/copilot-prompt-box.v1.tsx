import * as React from "react";
import { X } from "lucide-react";
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
  const canSend = value.trim().length > 0 && !disabled;

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
        <div className="flex items-center gap-[8px]">
          <PromptInputAction
            tooltip="Attach file"
            onClick={onAttach}
            disabled={disabled}
          >
            <AttachFileIcon className="size-6" />
          </PromptInputAction>
          <PromptInputAction tooltip="Edit note" disabled={disabled}>
            <EditNoteIcon className="size-6" />
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
