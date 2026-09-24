import React, { useState, useRef, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { FAQEditorCopilot } from './FAQEditorCopilot';

const MOCK_VARIATIONS: Record<string, string> = {
  'Simplify': 'Professional landscaping costs $50–$150/hour. We offer free consultations to give you an accurate quote for your specific yard.',
  'Expand': 'Professional landscaping typically costs $50–$150 per hour depending on scope, complexity, and location. Most residential projects range from $500 to $3,000.\n\nAdditional factors include terrain complexity, soil conditions, and whether irrigation systems need to be installed or extended. We recommend scheduling a site visit for an accurate, itemized estimate.',
  'Make conversational': "Great question! Landscaping costs can vary quite a bit — generally you're looking at $50–$150 per hour depending on what you need done. The best way to know for sure? Book a free consultation and we'll walk your yard with you.",
  'Optimize for voice': 'The cost of professional landscaping is typically between 50 and 150 dollars per hour. For an exact quote, you can book a free yard consultation with our team.',
  'Shorten': 'Professional landscaping costs $50–$150/hour. Book a free consultation for an accurate quote.',
};

function getMockVariation(instruction: string, currentText: string): string {
  if (MOCK_VARIATIONS[instruction]) return MOCK_VARIATIONS[instruction];
  // For custom instructions, trim a bit and append a note
  return currentText.slice(0, Math.floor(currentText.length * 0.85)) + ' (refined per your instruction)';
}

interface FAQEditorLeftProps {
  question: string;
  answer: string;
  onAnswerChange: (answer: string) => void;
  onScoreRecalculate: () => void;
}

export const FAQEditorLeft = ({
  question,
  answer,
  onAnswerChange,
  onScoreRecalculate,
}: FAQEditorLeftProps) => {
  const [questionText, setQuestionText] = useState(question);
  const [answerText, setAnswerText] = useState(answer);
  const [prevAnswer, setPrevAnswer] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = (ref: React.RefObject<HTMLTextAreaElement>) => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  };

  const handleApply = useCallback((instruction: string) => {
    setPrevAnswer(answerText);
    setIsApplying(true);
    setTimeout(() => {
      const newAnswer = getMockVariation(instruction, answerText);
      setAnswerText(newAnswer);
      onAnswerChange(newAnswer);
      setIsApplying(false);
      setCanUndo(true);
      setHighlight(true);
      onScoreRecalculate();
      // Trigger auto-resize after state update
      setTimeout(() => autoResize(answerRef), 10);
      setTimeout(() => setHighlight(false), 1500);
    }, 1200);
  }, [answerText, onAnswerChange, onScoreRecalculate]);

  const handleUndo = () => {
    setAnswerText(prevAnswer);
    onAnswerChange(prevAnswer);
    setCanUndo(false);
  };

  const charCount = answerText.length;

  return (
    <div className="flex flex-col gap-4 p-6 overflow-y-auto h-full">
      {/* Question textarea */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Question</label>
        <textarea
          ref={questionRef}
          value={questionText}
          onChange={(e) => {
            setQuestionText(e.target.value);
            autoResize(questionRef);
          }}
          className="w-full text-[15px] text-foreground leading-snug bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground"
          rows={2}
          placeholder="Enter question..."
        />
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Answer textarea */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Answer</label>
          <div className="flex items-center gap-2">
            {canUndo && (
              <button
                onClick={handleUndo}
                className="text-[12px] text-primary flex items-center gap-1 hover:underline"
              >
                <RotateCcw size={12} strokeWidth={1.6} />
                Undo
              </button>
            )}
            <span className="text-[11px] text-muted-foreground">{charCount} chars</span>
          </div>
        </div>
        <textarea
          ref={answerRef}
          value={answerText}
          onChange={(e) => {
            setAnswerText(e.target.value);
            onAnswerChange(e.target.value);
            autoResize(answerRef);
          }}
          className="w-full text-[13px] text-foreground leading-relaxed bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground rounded-md px-0 transition-colors duration-300"
          style={{ backgroundColor: highlight ? 'rgba(251, 191, 36, 0.08)' : 'transparent' }}
          rows={6}
          placeholder="Enter answer..."
        />
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Inline AI copilot */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Refine with AI</label>
        <FAQEditorCopilot onApply={handleApply} isApplying={isApplying} />
      </div>
    </div>
  );
};
