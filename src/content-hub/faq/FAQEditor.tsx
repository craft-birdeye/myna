import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/contenthub-ui/button';
import { CanvasBackButton } from '../shared/CanvasBackButton';
import { FAQEditorLeft } from './FAQEditorLeft';
import { EditorialScorePanel } from './EditorialScorePanel';
import { getFAQs, updateFAQ } from './faqStore';

interface FAQEditorProps {
  faqId: string;
  onBack: () => void;
  /** When true the internal top-bar is hidden — the parent (CreateView) owns navigation */
  embedded?: boolean;
  /** Callback so the parent can mirror score state in the left panel */
  onScoreChange?: (score: number, dimensions: typeof DEFAULT_DIMENSIONS) => void;
}

const DEFAULT_DIMENSIONS = [
  { label: 'Brand voice', score: 88, weight: 30 },
  { label: 'Factual accuracy', score: 90, weight: 30 },
  { label: 'Content readability', score: 85, weight: 25 },
  { label: 'Originality', score: 78, weight: 15 },
];

export const FAQEditor = ({ faqId, onBack, embedded = false, onScoreChange }: FAQEditorProps) => {
  const faq = getFAQs().find(f => f.faq_id === faqId) || getFAQs()[0];
  const [answer, setAnswer] = useState(faq.answer);
  const [score, setScore] = useState(faq.editorialScore);
  const [dimensions, setDimensions] = useState(DEFAULT_DIMENSIONS);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const recalcTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScoreRecalculate = useCallback(() => {
    setIsRecalculating(true);
    if (recalcTimer.current) clearTimeout(recalcTimer.current);
    recalcTimer.current = setTimeout(() => {
      // Simulate a score change (+/- up to 5 points)
      const delta = Math.floor(Math.random() * 11) - 5;
      const newScore = Math.max(0, Math.min(100, score + delta));
      const newDimensions = dimensions.map(d => ({
        ...d,
        score: Math.max(0, Math.min(100, d.score + Math.floor(Math.random() * 7) - 3)),
      }));
      setScore(newScore);
      setDimensions(newDimensions);
      setIsRecalculating(false);
      onScoreChange?.(newScore, newDimensions);
    }, 1500);
  }, [score, dimensions, onScoreChange]);

  // T8: write-back handler — persists edits to the shared FAQ store
  const handleSave = useCallback((currentAnswer: string) => {
    // Derive new status from score
    const newStatus: 'ready' | 'needs-work' | 'blocked' =
      faq.hardBlock ? 'blocked' : score >= 75 ? 'ready' : 'needs-work';
    updateFAQ(faqId, {
      answer: currentAnswer,
      editorialScore: score,
      status: newStatus,
      warnings: score < 75 ? ['Score below target — review before publishing'] : [],
    });
    onBack();
  }, [faqId, score, faq.hardBlock, onBack]);

  const compliance = {
    passed: !faq.hardBlock,
    blockedReason: faq.hardBlock ? 'Hallucination detected in answer' : undefined,
  };

  const warnings = faq.warnings.map(w => ({ text: w, type: 'warning' as const }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top action bar — hidden when embedded (CreateView topbar owns navigation) */}
      {!embedded && (
        <div className="bg-background border-b border-border h-[52px] flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <CanvasBackButton label="Back to review" onClick={onBack} />
            <div className="h-4 w-px bg-border" />
            <p className="text-[13px] text-foreground truncate max-w-[300px]">
              {faq.question}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>Discard</Button>
            <Button variant="default" size="sm" onClick={() => handleSave(answer)}>Save changes</Button>
          </div>
        </div>
      )}

      {/* Embedded save/discard bar — shown when CreateView owns the topbar */}
      {embedded && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-border bg-background/80">
          <p className="text-[12px] text-muted-foreground truncate max-w-[360px]">{faq.question}</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>Discard</Button>
            <Button variant="default" size="sm" onClick={() => handleSave(answer)}>Save changes</Button>
          </div>
        </div>
      )}

      {/* Two-column editor */}
      <div className="flex flex-row flex-grow overflow-hidden">
        {/* Left — Q&A + AI copilot */}
        <div className="flex-1 overflow-y-auto border-r border-border">
          <FAQEditorLeft
            question={faq.question}
            answer={answer}
            onAnswerChange={setAnswer}
            onScoreRecalculate={handleScoreRecalculate}
          />
        </div>

        {/* Right — Editorial score panel */}
        <div className="w-[320px] flex-shrink-0 overflow-y-auto">
          <EditorialScorePanel
            score={score}
            dimensions={dimensions}
            compliance={compliance}
            warnings={warnings}
            aeoScore={faq.aeoScore}
            isRecalculating={isRecalculating}
          />
        </div>
      </div>
    </div>
  );
};
