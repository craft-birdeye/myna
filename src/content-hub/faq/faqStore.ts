/**
 * Shared mutable FAQ store — sections, items, listeners.
 */

import type { FAQItem as LegacyFAQItem } from './FAQReviewCard';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FAQSection {
  id: string;
  name: string;
  order: number;
  visible: boolean;
}

// Re-export the canonical FAQItem type extended with our new fields.
// Legacy code still imports from FAQReviewCard — that interface stays unchanged.
export type { LegacyFAQItem };

// ── Seed data ──────────────────────────────────────────────────────────────────

const INITIAL_SECTIONS: FAQSection[] = [];

// Canvas starts empty — questions are added by the AI copilot, manually,
// or via "Accept and edit FAQ →" from the Search AI recommendation popup.
const INITIAL_FAQS: LegacyFAQItem[] = [];

// Extended FAQ item metadata (sectionId, visible, answerFormat, order)
export interface FAQMeta {
  faq_id: string;
  sectionId: string | null;
  visible: boolean;
  answerFormat: 'text' | 'list' | 'steps';
  order: number;
}

const INITIAL_META: FAQMeta[] = INITIAL_FAQS.map((f, i) => ({
  faq_id: f.faq_id,
  sectionId: i < 5 ? 'sec-1' : i < 9 ? 'sec-2' : null,
  visible: true,
  answerFormat: 'text' as const,
  order: i,
}));

// ── Mutable state ──────────────────────────────────────────────────────────────

let _faqs: LegacyFAQItem[] = INITIAL_FAQS.map(f => ({ ...f }));
let _meta: FAQMeta[]       = INITIAL_META.map(m => ({ ...m }));
let _sections: FAQSection[] = INITIAL_SECTIONS.map(s => ({ ...s }));

type Listener = () => void;
const _listeners = new Set<Listener>();

function notify() {
  _listeners.forEach(fn => fn());
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Read ───────────────────────────────────────────────────────────────────────

export function getFAQs(): LegacyFAQItem[] {
  return _faqs;
}

export function getFAQMeta(): FAQMeta[] {
  return _meta;
}

export function getSections(): FAQSection[] {
  return [..._sections].sort((a, b) => a.order - b.order);
}

export function getMeta(faqId: string): FAQMeta | undefined {
  return _meta.find(m => m.faq_id === faqId);
}

// ── Write ──────────────────────────────────────────────────────────────────────

export function updateFAQ(faqId: string, patch: Partial<LegacyFAQItem>): void {
  _faqs = _faqs.map(f => f.faq_id === faqId ? { ...f, ...patch } : f);
  notify();
}

export function updateMeta(faqId: string, patch: Partial<FAQMeta>): void {
  _meta = _meta.map(m => m.faq_id === faqId ? { ...m, ...patch } : m);
  notify();
}

export function subscribeFAQs(listener: Listener): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

// ── Sections ──────────────────────────────────────────────────────────────────

export function addSection(name?: string): FAQSection {
  const order = _sections.length;
  const generated = name ?? `Section ${order + 1}`;
  const section: FAQSection = { id: nextId('sec'), name: generated, order, visible: true };
  _sections = [..._sections, section];
  notify();
  return section;
}

export function renameSection(sectionId: string, name: string): void {
  _sections = _sections.map(s => s.id === sectionId ? { ...s, name } : s);
  notify();
}

export function deleteSection(sectionId: string, keepItems: boolean): void {
  _sections = _sections.filter(s => s.id !== sectionId);
  if (keepItems) {
    _meta = _meta.map(m => m.sectionId === sectionId ? { ...m, sectionId: null } : m);
  } else {
    const idsToDelete = _meta.filter(m => m.sectionId === sectionId).map(m => m.faq_id);
    _faqs = _faqs.filter(f => !idsToDelete.includes(f.faq_id));
    _meta = _meta.filter(m => m.sectionId !== sectionId);
  }
  notify();
}

export function reorderSections(orderedIds: string[]): void {
  _sections = _sections.map(s => ({ ...s, order: orderedIds.indexOf(s.id) }));
  notify();
}

// ── Questions ─────────────────────────────────────────────────────────────────

export function addQuestion(sectionId: string | null): LegacyFAQItem {
  const id = nextId('faq');
  const item: LegacyFAQItem = {
    faq_id: id,
    question: '',
    answer: '',
    intent: 'informational',
    funnel_stage: 'awareness',
    editorialScore: 0,
    lowestDimension: '',
    status: 'needs-work',
    warnings: [],
    hardBlock: false,
  };
  const maxOrder = _meta.filter(m => m.sectionId === sectionId).reduce((max, m) => Math.max(max, m.order), -1);
  const meta: FAQMeta = { faq_id: id, sectionId, visible: true, answerFormat: 'text', order: maxOrder + 1 };
  _faqs = [..._faqs, item];
  _meta = [..._meta, meta];
  notify();
  return item;
}

export function deleteQuestion(faqId: string): void {
  _faqs = _faqs.filter(f => f.faq_id !== faqId);
  _meta = _meta.filter(m => m.faq_id !== faqId);
  notify();
}

export function reorderItems(orderedIds: string[]): void {
  _meta = _meta.map(m => ({ ...m, order: orderedIds.indexOf(m.faq_id) }));
  notify();
}

export function moveToSection(faqId: string, sectionId: string | null, afterId?: string): void {
  const maxOrder = _meta.filter(m => m.sectionId === sectionId).reduce((max, m) => Math.max(max, m.order), -1);
  const afterOrder = afterId ? (_meta.find(m => m.faq_id === afterId)?.order ?? maxOrder) : maxOrder;
  // Shift items after the insertion point
  _meta = _meta.map(m => {
    if (m.faq_id === faqId) return { ...m, sectionId, order: afterOrder + 0.5 };
    return m;
  });
  // Re-normalise orders within the target section
  const sectionItems = _meta.filter(m => m.sectionId === sectionId).sort((a, b) => a.order - b.order);
  sectionItems.forEach((m, i) => { _meta = _meta.map(x => x.faq_id === m.faq_id ? { ...x, order: i } : x); });
  notify();
}

export function setVisible(faqId: string, visible: boolean): void {
  updateMeta(faqId, { visible });
}

export function bulkAddQuestions(questions: string[], sectionId: string | null = null): LegacyFAQItem[] {
  return questions.map(q => {
    const item = addQuestion(sectionId);
    updateFAQ(item.faq_id, { question: q });
    return item;
  });
}

/**
 * Replace the entire FAQ set with a new list of questions.
 * Used when navigating from the Search AI "Accept and edit FAQ" flow.
 * Each string in `questions` becomes a new FAQItem with an empty answer.
 */
export function bulkReplaceQuestions(questions: { question: string; answer: string }[]): void {
  const id = nextId('faq');
  _faqs = questions.map((q, i) => ({
    faq_id: `${id}-${i}`,
    question: q.question,
    answer: q.answer,
    intent: 'informational' as const,
    funnel_stage: 'awareness' as const,
    editorialScore: 0,
    lowestDimension: '',
    status: 'needs-work' as const,
    warnings: [],
    hardBlock: false,
  }));
  _meta = _faqs.map((f, i) => ({
    faq_id: f.faq_id,
    sectionId: null,
    visible: true,
    answerFormat: 'text' as const,
    order: i,
  }));
  notify();
}
