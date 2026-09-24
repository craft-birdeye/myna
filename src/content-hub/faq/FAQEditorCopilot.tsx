import React, { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

const QUICK_ACTIONS = [
  'Simplify',
  'Expand',
  'Make conversational',
  'Optimize for voice',
  'Shorten',
];

interface FAQEditorCopilotProps {
  onApply: (instruction: string) => void;
  isApplying: boolean;
}

export const FAQEditorCopilot = ({ onApply, isApplying }: FAQEditorCopilotProps) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (!input.trim() || isApplying) return;
    onApply(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (chip: string) => {
    if (isApplying) return;
    onApply(chip);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Quick action chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map(chip => (
          <button
            key={chip}
            onClick={() => handleChipClick(chip)}
            disabled={isApplying}
            className="rounded-full border border-border bg-background hover:bg-surface-hover text-[12px] text-foreground px-2 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Text input row */}
      <div className="flex items-center gap-2 border border-border rounded-lg px-2 py-2 bg-background focus-within:ring-2 focus-within:ring-ring">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Refine this answer with AI..."
          className="flex-1 text-[13px] text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground"
          disabled={isApplying}
        />
        {isApplying ? (
          <Loader2 size={16} strokeWidth={1.6} className="text-primary animate-spin shrink-0" />
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="text-primary transition-opacity disabled:opacity-30 shrink-0"
          >
            <ArrowRight size={16} strokeWidth={1.6} />
          </button>
        )}
      </div>
    </div>
  );
};
