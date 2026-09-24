/**
 * FAQCanvas — THE definitive FAQ editing canvas.
 *
 * One component, used everywhere FAQ is edited:
 *   • ContentEditorShell (FAQ mode from Content Hub)
 *   • CreateView faqReady mode (from Search AI recommendations)
 *
 * Layout:
 *  ┌───────────────────────────────────────────────────────────────┐
 *  │  Floating toolbar: [N selected] [grid/list/cal] [zoom] [+Add] │
 *  ├──────────────────────────────────┬────────────────────────────┤
 *  │  Scrollable canvas               │  Right panel (300px)       │
 *  │  FAQGroupCard                    │  • ContentScorePanel       │
 *  │    Q1…Qn list                    │    (no selection)          │
 *  │    + Add question footer         │  • EditFAQPanel            │
 *  │                                  │    (question selected)     │
 *  └──────────────────────────────────┴────────────────────────────┘
 */

import React, { useState, useEffect } from 'react';
import { Grid, List, Calendar, ZoomIn, ZoomOut, Plus, X, Sparkles, Check, Loader2 } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { FAQGroupCard } from './FAQGroupCard';
import {
  ContentScorePanel,
  DEFAULT_AEO_DIMS,
  DEFAULT_OVERALL_SCORE,
  DEFAULT_QUICK_WINS,
} from '../shared/ContentScorePanel';
import {
  getFAQs, updateFAQ, subscribeFAQs,
  addQuestion, deleteQuestion, reorderItems, getFAQMeta,
} from './faqStore';
import type { FAQItem } from './FAQReviewCard';
import { Button } from '@/contenthub-ui/button';
import { Textarea } from '@/contenthub-ui/textarea';

// ── AI quick actions (same as in CreateView EditFAQPanel) ──────────────────────

const AI_QUICK_ACTIONS = [
  { id: 'aeo',     label: 'Improve AEO score' },
  { id: 'rewrite', label: 'Rewrite for clarity' },
  { id: 'local',   label: 'Add local context' },
  { id: 'concise', label: 'Make more concise' },
  { id: 'expand',  label: 'Expand answer' },
] as const;

type ActionId = typeof AI_QUICK_ACTIONS[number]['id'];

function simulateAI(action: ActionId | 'custom', currentQ: string, prompt?: string): Promise<{ question: string; answer: string }> {
  return new Promise(resolve =>
    setTimeout(() => {
      const base = currentQ.replace(/\?$/, '').toLowerCase();
      switch (action) {
        case 'aeo':
          resolve({
            question: currentQ || 'How much does this service cost?',
            answer: `Professional service costs vary depending on the scope of work, property size, and materials. For most projects, expect to pay between $50–$150 per hour for labour, or $1,000–$10,000 for full-service work.\n\nFactors affecting pricing:\n• Size and complexity\n• Materials selected\n• Ongoing maintenance requirements\n\nContact us for a free consultation and transparent quote before work begins.`,
          });
          break;
        case 'rewrite':
          resolve({
            question: currentQ,
            answer: `Here's a clear, direct answer about ${base}.\n\nWe provide expert service tailored to your specific needs. Our team is experienced, reliable, and committed to delivering results that exceed your expectations.\n\nReach out for a no-obligation consultation.`,
          });
          break;
        case 'local':
          resolve({
            question: currentQ,
            answer: `For customers across the local area, we offer fully tailored solutions for ${base}.\n\nOur local team understands the specific conditions and requirements in your area, which means faster turnaround and better long-term results for your property.`,
          });
          break;
        case 'concise':
          resolve({
            question: currentQ,
            answer: `Yes — we handle ${base} for residential and commercial properties. Contact us for a free quote and we'll get started within 48 hours.`,
          });
          break;
        case 'expand':
          resolve({
            question: currentQ,
            answer: `Here's everything you need to know about ${base}:\n\n**What's included:** Full-service assessment, planning, execution, and follow-up care.\n\n**Timeline:** Most projects completed within 3–7 business days.\n\n**Guarantee:** 30-day satisfaction guarantee — if something isn't right, we'll fix it at no cost.\n\n**Getting started:** Book a free consultation online or call us.`,
          });
          break;
        default:
          resolve({
            question: currentQ,
            answer: `Based on your instruction${prompt ? ` ("${prompt}")` : ''}, here is an improved answer for this FAQ.\n\nOur team provides expert service for ${base}, backed by years of local experience and a commitment to customer satisfaction.`,
          });
      }
    }, 1400),
  );
}

// ── Edit FAQ right panel ──────────────────────────────────────────────────────

interface EditFAQPanelProps {
  index: number;
  onDismiss: () => void;
}

function EditFAQPanel({ index, onDismiss }: EditFAQPanelProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>(() => getFAQs());
  useEffect(() => subscribeFAQs(() => setFaqs(getFAQs())), []);

  const faq = faqs[index] ?? null;
  const [question, setQuestion] = useState(faq?.question ?? '');
  const [answer, setAnswer]     = useState(faq?.answer ?? '');
  const [savedQ, setSavedQ]     = useState(faq?.question ?? '');
  const [savedA, setSavedA]     = useState(faq?.answer ?? '');
  const [generating, setGenerating] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  // Sync when index changes
  useEffect(() => {
    const f = getFAQs()[index];
    if (f) {
      setQuestion(f.question); setAnswer(f.answer);
      setSavedQ(f.question);   setSavedA(f.answer);
      setActiveAction(null);   setCustomPrompt('');
      setJustSaved(false);
    }
  }, [index]);

  if (!faq) return null;

  const isDirty = question !== savedQ || answer !== savedA;

  const handleGenerate = async (action: ActionId | 'custom', prompt?: string) => {
    setActiveAction(action);
    setGenerating(true);
    const result = await simulateAI(action, question, prompt);
    setQuestion(result.question);
    setAnswer(result.answer);
    setGenerating(false);
  };

  const handleSave = () => {
    updateFAQ(faq.faq_id, { question, answer });
    setSavedQ(question); setSavedA(answer);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between bg-surface px-2xl py-xl">
        <div className="flex items-center gap-2">
          <Sparkles size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-primary" />
          <span className="text-[13px] text-foreground">Edit FAQ</span>
        </div>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={14} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
        {/* AI quick actions */}
        <div className="flex flex-col gap-2">
          <p className="text-[12px] text-muted-foreground">Generate with AI</p>
          <div className="flex flex-wrap gap-1.5">
            {AI_QUICK_ACTIONS.map(action => {
              const isActive = activeAction === action.id && generating;
              return (
                <button
                  key={action.id}
                  onClick={() => !generating && handleGenerate(action.id)}
                  disabled={generating}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] border transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5',
                    generating && !isActive && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  {isActive
                    ? <Loader2 size={10} strokeWidth={1.6} absoluteStrokeWidth className="animate-spin" />
                    : <Sparkles size={10} strokeWidth={1.6} absoluteStrokeWidth className="text-primary" />
                  }
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] text-muted-foreground">Question</label>
          <div className={cn('relative rounded-md', generating && 'opacity-50 pointer-events-none')}>
            <Textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              className="text-[13px] leading-relaxed"
              style={{ minHeight: '72px' }}
            />
            {generating && (
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 animate-pulse" />
            )}
          </div>
        </div>

        {/* Answer */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] text-muted-foreground">Answer</label>
          <div className={cn('relative rounded-md', generating && 'opacity-50 pointer-events-none')}>
            <Textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              className="text-[13px] leading-relaxed"
              style={{ minHeight: '160px' }}
            />
            {generating && (
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 animate-pulse" />
            )}
          </div>
        </div>

        {/* Custom AI prompt */}
        <div className="flex gap-1.5">
          <input
            type="text"
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && customPrompt.trim() && handleGenerate('custom', customPrompt.trim())}
            placeholder="Ask AI to improve this…"
            className="flex-1 text-[12px] border border-input rounded-md h-[34px] px-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={generating}
          />
          <button
            onClick={() => customPrompt.trim() && handleGenerate('custom', customPrompt.trim())}
            disabled={generating || !customPrompt.trim()}
            className={cn(
              'flex items-center justify-center size-[34px] rounded-md bg-primary text-primary-foreground transition-opacity',
              (!customPrompt.trim() || generating) && 'opacity-40 cursor-not-allowed',
            )}
          >
            <Sparkles size={12} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex items-center justify-between gap-2 bg-surface px-2xl py-xl">
        <button
          onClick={() => { setQuestion(savedQ); setAnswer(savedA); }}
          disabled={!isDirty || generating}
          className={cn(
            'text-[12px] transition-colors',
            isDirty && !generating ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/30 cursor-not-allowed',
          )}
        >
          Discard
        </button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={generating}
          className={cn('gap-1.5 transition-all', justSaved && 'bg-green-600 hover:bg-green-600')}
        >
          {justSaved
            ? <><Check size={12} strokeWidth={1.6} absoluteStrokeWidth /> Saved</>
            : 'Save'
          }
        </Button>
      </div>
    </div>
  );
}

// ── Score right panel ─────────────────────────────────────────────────────────

function ScoreRightPanel({ score }: { score: number }) {
  return (
    <ContentScorePanel
      score={score}
      dimensions={DEFAULT_AEO_DIMS}
      quickWins={DEFAULT_QUICK_WINS}
    />
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface FAQCanvasProps {
  /** Overall AEO score to show in the card header + score panel */
  score?: number;
  /** Extra class on the outer wrapper */
  className?: string;
}

// ── FAQCanvas ─────────────────────────────────────────────────────────────────

export function FAQCanvas({ score = DEFAULT_OVERALL_SCORE, className }: FAQCanvasProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>(() => getFAQs());
  const [zoom, setZoom] = useState(1);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  useEffect(() => subscribeFAQs(() => setFaqs(getFAQs())), []);

  // Build items for FAQGroupCard
  const questions = faqs.map(f => ({
    faq_id:   f.faq_id,
    question: f.question,
    answer:   f.answer,
  }));

  const handleDelete = (faqId: string, index: number) => {
    if (selectedIdx === index) setSelectedIdx(null);
    deleteQuestion(faqId);
  };

  const handleAddQuestion = () => {
    const meta = getFAQMeta();
    const firstSectionId = meta.find(m => m.sectionId !== null)?.sectionId ?? null;
    const newItem = addQuestion(firstSectionId);
    const updatedFaqs = getFAQs();
    const newIdx = updatedFaqs.findIndex(f => f.faq_id === newItem.faq_id);
    if (newIdx >= 0) setSelectedIdx(newIdx);
  };

  const handleReorder = (fromIdx: number, toIdx: number) => {
    const orderedIds = faqs.map(f => f.faq_id);
    const reordered = [...orderedIds];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, orderedIds[fromIdx]);
    reorderItems(reordered);
  };

  const handleQuestionSelect = (idx: number) => {
    setSelectedIdx(prev => prev === idx ? null : idx);
  };

  return (
    <div className={cn('flex flex-grow overflow-hidden relative', className)}>

      {/* ── Center: canvas + floating toolbar ─────────────────────────── */}
      <div
        className="flex-grow overflow-hidden relative flex flex-col bg-surface-hover"
        onClick={e => {
          // Deselect when clicking outside the card
          if ((e.target as HTMLElement).closest('.faq-group-card') === null) {
            setSelectedIdx(null);
          }
        }}
      >
        {/* Floating toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background rounded-lg z-30 border border-border pointer-events-auto">
          <div className="flex flex-row items-center px-4 py-2 gap-4">
            {/* Selection counter */}
            <span className="text-[13px] text-foreground text-nowrap">
              {selectedIdx !== null ? '1 selected' : '0 selected'}
            </span>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
              <div className="bg-background flex items-center justify-center px-2 py-1 rounded-md">
                <Grid size={16} strokeWidth={1.6} className="text-foreground" />
              </div>
              <div className="flex items-center justify-center px-2 py-1 rounded-md cursor-pointer hover:bg-background/50">
                <List size={16} strokeWidth={1.6} className="text-muted-foreground" />
              </div>
              <div className="flex items-center justify-center px-2 py-1 rounded-md cursor-pointer hover:bg-background/50">
                <Calendar size={16} strokeWidth={1.6} className="text-muted-foreground" />
              </div>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); setZoom(z => Math.max(0.3, z - 0.1)); }}
                className="p-1 hover:bg-surface-hover rounded-md transition-colors"
              >
                <ZoomOut size={16} strokeWidth={1.6} className="text-foreground" />
              </button>
              <span className="text-[13px] text-muted-foreground text-nowrap">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={e => { e.stopPropagation(); setZoom(z => Math.min(2, z + 0.1)); }}
                className="p-1 hover:bg-surface-hover rounded-md transition-colors"
              >
                <ZoomIn size={16} strokeWidth={1.6} className="text-foreground" />
              </button>
            </div>

            <div className="w-px h-4 bg-border" />

            {/* Add content */}
            <button
              onClick={e => { e.stopPropagation(); handleAddQuestion(); }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[13px] text-foreground hover:bg-surface-hover transition-colors"
            >
              <Plus size={14} strokeWidth={1.6} />
              Add content
            </button>
          </div>
        </div>

        {/* Scrollable card area */}
        <div className="flex-grow overflow-y-auto flex items-start justify-center p-8 pt-20">
          <div style={{ zoom, width: '100%', maxWidth: 620 }} className="faq-group-card">
            <FAQGroupCard
              questions={questions}
              onQuestionsChange={updated => updated.forEach((q, i) => {
                const faq = faqs[i];
                if (faq) updateFAQ(faq.faq_id, { question: q.question, answer: q.answer });
              })}
              onQuestionSelect={handleQuestionSelect}
              selectedQuestionIndex={selectedIdx}
              score={score}
              editable
              onDelete={handleDelete}
              onAddQuestion={handleAddQuestion}
              onReorder={handleReorder}
            />
          </div>
        </div>
      </div>

      {/* ── Right panel (300px fixed) ──────────────────────────────────── */}
      <div
        className="w-[300px] flex-shrink-0 flex flex-col overflow-hidden border-l border-border bg-background"
      >
        {selectedIdx !== null ? (
          <EditFAQPanel
            index={selectedIdx}
            onDismiss={() => setSelectedIdx(null)}
          />
        ) : (
          <ScoreRightPanel score={score} />
        )}
      </div>
    </div>
  );
}
