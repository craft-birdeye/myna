import React, { useState, useEffect } from 'react';
import { Grid, List, Calendar, ZoomIn, ZoomOut, Plus } from 'lucide-react';
import { type FAQItem } from './FAQReviewCard';
import { FAQGroupCard } from './FAQGroupCard';
import { FAQPublishModal } from './FAQPublishModal';
import {
  getFAQs, getFAQMeta, updateFAQ, subscribeFAQs,
  addQuestion, deleteQuestion, reorderItems,
} from './faqStore';

/** @deprecated Use getFAQs() from faqStore for live data. Kept for backwards compat lookups. */
export const MOCK_FAQS: FAQItem[] = getFAQs();

interface FAQReviewScreenProps {
  onEdit: (faqId: string) => void;
  onQuestionSelect?: (index: number) => void;
  selectedQuestionIndex?: number | null;
  score?: number;
  showAEO?: boolean;
  /** When true, shows drag handles, delete buttons, and "Add question" footer */
  editable?: boolean;
}

export const FAQReviewScreen = ({
  onEdit: _onEdit,
  onQuestionSelect,
  selectedQuestionIndex = null,
  score = 80,
  showAEO = false,
  editable = true,
}: FAQReviewScreenProps) => {
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [faqs, setFaqs] = useState<FAQItem[]>(() => getFAQs());
  const [zoom, setZoom] = useState(1);
  useEffect(() => subscribeFAQs(() => setFaqs(getFAQs())), []);

  void showAEO;

  const avgScore = Math.round(faqs.reduce((s, f) => s + f.editorialScore, 0) / faqs.length);

  // Build items with faq_id for FAQGroupCard
  const questions = faqs.map(f => ({
    faq_id:   f.faq_id,
    question: f.question,
    answer:   f.answer,
  }));

  const handleDelete = (faqId: string, index: number) => {
    // If the deleted item was selected, deselect
    if (selectedQuestionIndex === index) {
      onQuestionSelect?.(-1); // signal deselect to parent
    }
    deleteQuestion(faqId);
  };

  const handleAddQuestion = () => {
    const meta = getFAQMeta();
    // Add to first section or ungrouped
    const firstSectionId = meta.find(m => m.sectionId !== null)?.sectionId ?? null;
    const newItem = addQuestion(firstSectionId);
    // Select the new question
    const updatedFaqs = getFAQs();
    const newIdx = updatedFaqs.findIndex(f => f.faq_id === newItem.faq_id);
    if (newIdx >= 0) onQuestionSelect?.(newIdx);
  };

  const handleReorder = (fromIdx: number, toIdx: number) => {
    const orderedIds = faqs.map(f => f.faq_id);
    const reordered = [...orderedIds];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, orderedIds[fromIdx]);
    reorderItems(reordered);
  };

  return (
    <div className="flex-grow h-full bg-muted overflow-hidden relative flex flex-col">

      {/* Floating canvas toolbar — identical to InfiniteCanvas */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background rounded-lg z-30 border border-border">
        <div className="flex flex-row items-center px-4 py-2 gap-4">
          <span className="text-[13px] text-foreground text-nowrap">
            {selectedQuestionIndex !== null ? '1 selected' : '0 selected'}
          </span>
          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
            <div className="bg-background flex items-center justify-center px-2 py-1 rounded-md">
              <Grid size={16} strokeWidth={1.6} className="text-foreground" />
            </div>
            <div className="flex items-center justify-center px-2 py-1 rounded-md cursor-pointer hover:bg-background/50">
              <List size={16} strokeWidth={1.6} className="text-foreground" />
            </div>
            <div className="flex items-center justify-center px-2 py-1 rounded-md cursor-pointer hover:bg-background/50">
              <Calendar size={16} strokeWidth={1.6} className="text-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="p-1 hover:bg-surface-hover rounded-md transition-colors">
              <ZoomOut size={16} strokeWidth={1.6} className="text-foreground" />
            </button>
            <span className="text-[13px] text-muted-foreground text-nowrap">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1 hover:bg-surface-hover rounded-md transition-colors">
              <ZoomIn size={16} strokeWidth={1.6} className="text-foreground" />
            </button>
          </div>
          <div className="w-px h-4 bg-border" />
          <button className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[13px] text-foreground hover:bg-surface-hover transition-colors">
            <Plus size={14} strokeWidth={1.6} />
            Add content
          </button>
        </div>
      </div>

      {/* Main content — centered card */}
      <div className="flex-grow overflow-y-auto flex items-start justify-center p-8 pt-20">
        <div style={{ zoom, width: '100%', maxWidth: 620 }}>
          <FAQGroupCard
            questions={questions}
            onQuestionsChange={updated => updated.forEach((q, i) => {
              const faq = faqs[i];
              if (faq) updateFAQ(faq.faq_id, { question: q.question, answer: q.answer });
            })}
            onQuestionSelect={onQuestionSelect ?? (() => {})}
            selectedQuestionIndex={selectedQuestionIndex}
            score={score}
            editable={true}
            onDelete={handleDelete}
            onAddQuestion={handleAddQuestion}
            onReorder={handleReorder}
          />
        </div>
      </div>

      <FAQPublishModal
        open={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        faqs={faqs}
        overallScore={avgScore}
      />
    </div>
  );
};
