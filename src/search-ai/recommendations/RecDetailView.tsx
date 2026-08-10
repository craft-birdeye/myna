import { useState, useRef, Fragment, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Dialog, DialogPortal, DialogOverlay } from '@/contenthub-ui/dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'

// Asset base path — '/' locally, '/contenthub/' on GitHub Pages
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const B: string = (import.meta as any).env?.BASE_URL ?? '/'
import { ArrowLeft, Sparkles, X, Copy, Check, ChevronDown, ChevronUp, CheckCircle2, Info, MoreVertical, Maximize2, Clock } from 'lucide-react'
import { Button } from '@/contenthub-ui/button'
import { TextTabsRow } from '@/contenthub-ui/text-tabs'
import { Checkbox } from '@/contenthub-ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/contenthub-ui/dropdown-menu'
import { toast } from 'sonner'
import type { Recommendation, BusinessMetrics, AeoSubScore, RecStatus } from './recTypes'
import { scoreColor, scoreStrokeColor } from '@/content-hub/shared/scoreColors'

// ── helpers ───────────────────────────────────────────────────────────────────

type MetricsKey = 'citationShare' | 'visibility' | 'sentiment'

function getMetricForCategory(category: string): { label: string; key: MetricsKey } {
  if (['Content', 'Website content', 'FAQ', 'Social'].includes(category)) {
    return { label: 'Citation share', key: 'citationShare' }
  }
  if (['Local SEO', 'Technical SEO', 'Website improvement', 'Conversion'].includes(category)) {
    return { label: 'Visibility score', key: 'visibility' }
  }
  return { label: 'Sentiment score', key: 'sentiment' }
}

// ── Default AEO sub-scores (fallback when not in data) ────────────────────────

// Weighted sums: You = 89×10.2+94×16.3+91×8.5+90×30.5+96×11.5+93×22.9 ≈ 92
//                Comp = 77×10.2+79×16.3+85×8.5+82×30.5+82×11.5+82×22.9 ≈ 81
const DEFAULT_BLOG_SUBSCORES: AeoSubScore[] = [
  { name: 'Intent Match',          weight: 20, you: 89, competitor: 75, delta: 14 },
  { name: 'Search Visibility',     weight: 25, you: 94, competitor: 79, delta: 15 },
  { name: 'Content Depth',         weight: 20, you: 91, competitor: 82, delta:  9 },
  { name: 'Brand Alignment',       weight: 20, you: 90, competitor: 77, delta: 13 },
  { name: 'Publishing Readiness',  weight: 15, you: 96, competitor: 82, delta: 14 },
]

const DEFAULT_FAQ_SUBSCORES: AeoSubScore[] = [
  { name: 'Intent Match',          weight: 25, you: 96, competitor: 75, delta: 21 },
  { name: 'Search Visibility',     weight: 25, you: 95, competitor: 78, delta: 17 },
  { name: 'Content Depth',         weight: 20, you: 94, competitor: 72, delta: 22 },
  { name: 'Brand Alignment',       weight: 20, you: 93, competitor: 73, delta: 20 },
  { name: 'Publishing Readiness',  weight: 10, you: 92, competitor: 65, delta: 27 },
]

// ── AEO score box (mini, in-card thumbnail) ───────────────────────────────────

function AeoScoreBox({ score }: { score: number }) {
  const r = 8
  const circ = 2 * Math.PI * r
  const pct = Math.min(score, 100) / 100
  return (
    <div className="bg-background border border-border rounded p-2 flex flex-col gap-1 items-start flex-shrink-0">
      <div className="flex items-end gap-2">
        <svg width="20" height="20" viewBox="0 0 20 20" style={{ transform: 'rotate(270deg)' }} className="flex-shrink-0">
          <circle cx="10" cy="10" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="2.5" />
          <circle cx="10" cy="10" r={r} fill="none" stroke="#4cae3d" strokeWidth="2.5" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" />
        </svg>
        <span className="text-[16px] leading-none font-normal" style={{ color: '#4cae3d' }}>{score}</span>
        <span className="text-[14px] text-muted-foreground leading-none">/100</span>
      </div>
      <p className="text-[12px] text-foreground leading-normal whitespace-nowrap">AEO content score</p>
    </div>
  )
}

// ── AEO Score left panel (screenshot-accurate style) ─────────────────────────
// Matches the design: large number, "AEO Content score" label, progress bar with
// "You" pill, then sub-score rows (name + weight label + score/100).

interface AeoLeftPanelProps {
  score: number
  subScores: AeoSubScore[]
  /** When true, bar + pill use red (low/gap score). Default = high/green. */
  lowScore?: boolean
}

function AeoLeftPanel({ score, subScores, lowScore = false }: AeoLeftPanelProps) {
  const color = scoreColor(lowScore ? Math.min(score, 49) : score).text
  const barFill = scoreStrokeColor(lowScore ? Math.min(score, 49) : score)
  const pct = Math.max(0, Math.min(score, 100))

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      {/* Large score number */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-[32px] font-normal leading-[44px]" style={{ color }}>{score}</span>
        <span className="text-[15px] text-muted-foreground leading-[32px]">/ 100</span>
      </div>

      {/* Label + info icon */}
      <div className="flex items-center gap-1.5 -mt-2">
        <span className="text-[14px] text-muted-foreground font-normal leading-[20px]">AEO Content score</span>
        <div className="w-4 h-4 rounded-full border border-muted-foreground/40 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] text-muted-foreground leading-none">?</span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        style={{ width: '100%', height: 8, borderRadius: 999, backgroundColor: '#E5E7EB', overflow: 'hidden' }}
      >
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, backgroundColor: barFill, transition: 'width 600ms ease' }} />
      </div>

      {/* Sub-score breakdown — name + score/100 */}
      <div className="flex flex-col">
        {subScores.map((sub) => (
          <div key={sub.name} className="flex items-start justify-between gap-2 py-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] text-foreground leading-[18px]">{sub.name}</span>
            </div>
            <div className="flex items-baseline gap-0.5 flex-shrink-0">
              <span className="text-[14px] text-foreground leading-none">{sub.you}</span>
              <span className="text-[12px] text-muted-foreground leading-none">/100</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── CopyButton ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
      {copied
        ? <Check size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-primary" />
        : <Copy size={13} strokeWidth={1.6} absoluteStrokeWidth />}
    </button>
  )
}

// ── Blog Preview Modal ────────────────────────────────────────────────────────

interface BlogPreviewModalProps {
  rec: Recommendation
  onClose: () => void
  onAccept: () => void
  onNavigateToBlogCanvas?: () => void
  status: RecStatus
}

type DynSection = { heading?: string; body?: string; listItems?: string[]; image?: string; imageAlt?: string }

function BlogPreviewModal({ rec, onClose, onAccept, onNavigateToBlogCanvas, status }: BlogPreviewModalProps) {
  const aeoScore  = rec.aeoScore?.you ?? 98
  const subScores = rec.aeoScore?.subScores ?? DEFAULT_BLOG_SUBSCORES
  const metaTitle = rec.title
  const metaDesc  = rec.description.slice(0, 155)
  const slug      = rec.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const dynamicSections: DynSection[] | null = (() => {
    try { return rec.generatedAsset?.fullContent ? JSON.parse(rec.generatedAsset.fullContent) : null } catch { return null }
  })()

  return (
    <Dialog open={true} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          onInteractOutside={onClose}
          className="fixed left-1/2 top-[5vh] z-50 -translate-x-1/2 w-[1200px] max-w-[calc(100vw-48px)] bg-background rounded-xl shadow-modal flex flex-col overflow-hidden focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
        {/* Modal header */}
        <div className="flex-shrink-0 flex items-center justify-between bg-surface px-2xl py-xl rounded-t">
          <span className="text-[16px] text-foreground font-normal leading-[24px]">Preview blog</span>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onNavigateToBlogCanvas ?? onAccept} className="h-[34px] px-4 text-[14px]">
              {(status === 'accepted' || status === 'in_progress') ? 'Edit blog' : 'Accept and edit blog'}
            </Button>
            <button onClick={onClose} className="size-[34px] flex items-center justify-center rounded hover:bg-surface-hover transition-colors">
              <X size={16} strokeWidth={1.6} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Modal body: two columns */}
        <div className="flex gap-4 px-4 pb-5 pt-5 min-h-0" style={{ maxHeight: 'calc(90vh - 64px)' }}>
          {/* Left panel: AEO scores */}
          <div className="w-[360px] flex-shrink-0 border border-border rounded-lg overflow-y-auto bg-background">
            <AeoLeftPanel score={aeoScore} subScores={subScores} lowScore={false} />
          </div>

          {/* Right panel: real blog layout */}
          <div className="flex-1 min-w-0 border border-border rounded-lg overflow-y-auto flex flex-col">

            {/* Article header */}
            <div className="px-10 pt-8 pb-5 flex-shrink-0">
              <h1 className="text-[26px] leading-tight tracking-tight text-foreground mb-4">
                {rec.title}
              </h1>
              {/* Author row */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground flex-shrink-0">
                  AI
                </div>
                <span className="text-sm text-foreground">Birdeye AI</span>
                <span className="text-muted-foreground text-sm">·</span>
                <span className="text-sm text-muted-foreground">15 min read</span>
              </div>
            </div>

            {/* Hero image */}
            <div className="px-10 pb-6 flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80"
                alt={rec.title}
                className="w-full h-[220px] object-cover rounded-xl"
              />
            </div>

            {/* Article body */}
            <article className="flex flex-col flex-1" style={{ paddingLeft: 40, paddingRight: 37, paddingBottom: 24 }}>

              {(dynamicSections ?? []).map((s, i) => {
                const isFaqHeading = !s.body && !s.listItems && !s.image && s.heading?.toLowerCase().includes('frequently asked question');
                const isFaqItem = !s.listItems && !s.image && s.heading && s.body;
                if (isFaqHeading) {
                  return <h2 key={i} className="mt-8 text-[18px] tracking-tight text-foreground">{s.heading}</h2>;
                }
                if (isFaqItem && dynamicSections && i > 0 && dynamicSections[i - 1] && !dynamicSections[i - 1].listItems) {
                  return (
                    <div key={i} className="mt-4">
                      <p className="text-[14px] text-foreground leading-[22px] mb-1">{s.heading}</p>
                      <p className="text-[14px] text-foreground leading-[24px]">{s.body}</p>
                    </div>
                  );
                }
                return (
                  <div key={i} className={s.heading ? "mt-8" : "mt-2"}>
                    {s.heading && <h2 className="mb-2 text-[18px] text-foreground leading-[26px]">{s.heading}</h2>}
                    {s.body && <p className="text-[14px] text-foreground leading-[24px]">{s.body}</p>}
                    {s.listItems && s.listItems.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {s.listItems.map((item, j) => (
                          <li key={j} className="flex items-start gap-2.5 text-[14px] text-foreground leading-[22px]">
                            <span className="mt-[9px] w-[4px] h-[4px] rounded-full bg-primary flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                    {s.image && (
                      <div className="w-full rounded-xl overflow-hidden flex-shrink-0 mt-4" style={{ height: 200 }}>
                        <img src={s.image} alt={s.imageAlt ?? s.heading ?? ''} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                );
              })}
            </article>

            {/* SEO metadata */}
            <div className="border-t border-border px-8 py-5 flex-shrink-0 flex flex-col gap-2 bg-muted/30">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide leading-none">SEO metadata</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2 bg-background border border-border rounded px-2 py-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none">Meta title</span>
                    <span className="text-[13px] text-foreground leading-[20px] mt-1">{metaTitle}</span>
                  </div>
                  <CopyButton text={metaTitle} />
                </div>
                <div className="flex items-start justify-between gap-2 bg-background border border-border rounded px-2 py-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none">Meta description</span>
                    <span className="text-[13px] text-foreground leading-[20px] mt-1">{metaDesc}</span>
                  </div>
                  <CopyButton text={metaDesc} />
                </div>
                <div className="flex items-center justify-between gap-2 bg-background border border-border rounded px-2 py-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none">Slug</span>
                    <span className="text-[13px] text-muted-foreground leading-[20px] mt-1 font-mono">{slug}</span>
                  </div>
                  <CopyButton text={slug} />
                </div>
              </div>
            </div>

          </div>
        </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

// ── FAQ Preview Modal ─────────────────────────────────────────────────────────

interface FAQPreviewModalProps {
  rec: Recommendation
  onClose: () => void
  onNavigateToContentHub?: (questions: { question: string; answer: string }[]) => void
  status: RecStatus
}

interface FAQItem {
  question: string
  answer: string
}

const FAQ_ITEMS_PROPERTY_APPRAISAL: FAQItem[] = [
  {
    question: 'What is a property appraisal and why do I need one?',
    answer: 'A property appraisal is a professional assessment of your property\'s current market value, based on comparable sales, location, condition, and local demand. In Dubbo, it\'s the essential first step before listing for sale or setting a rental price — it ensures you enter the market with confidence and accurate expectations.',
  },
  {
    question: 'How much does a property appraisal in Dubbo cost?',
    answer: 'Our sales and rental appraisals are completely free and come with no obligation to list or lease with us. It\'s part of the service we provide to help Dubbo homeowners and landlords make informed decisions. Formal bank valuations ordered by lenders are a separate process and carry their own fee.',
  },
  {
    question: 'How long does a property appraisal take?',
    answer: 'An in-person appraisal typically takes 20–40 minutes. You\'ll receive a written report within 24–48 hours covering the estimated market or rental value, comparable data, and our recommended next steps — whether that\'s listing for sale, leasing, or holding.',
  },
  {
    question: 'What factors affect my property\'s value in Dubbo?',
    answer: 'Key factors include land size, the number of bedrooms and bathrooms, build quality and age, recent renovations, proximity to Dubbo\'s CBD, schools, and amenities, street appeal, and recent comparable sales in your suburb. Regional infrastructure activity and current buyer or tenant demand also influence the final estimate.',
  },
  {
    question: 'What is a rental appraisal and how does it differ from a sales appraisal?',
    answer: 'A rental appraisal estimates the weekly rent your property could achieve in the current Dubbo rental market. A sales appraisal estimates the price a buyer would pay. Both are free services we offer — some landlords request both to compare the returns from selling versus continuing to rent.',
  },
  {
    question: 'How do you determine the right rent for my Dubbo rental property?',
    answer: 'We review current vacancy rates across Dubbo suburbs, comparable rental listings, your property\'s size, condition, and features, and recent leasing outcomes in your area. The goal is to set a rent that is competitive enough to minimise vacancy while maximising your return as a landlord.',
  },
  {
    question: 'What does Raine & Horne Dubbo\'s property management service include?',
    answer: 'Our property management service covers tenant sourcing and screening, lease preparation, rent collection, routine and emergency maintenance coordination, regular property inspections, disbursements and monthly statements, bond management, and end-of-tenancy processes — all handled by a dedicated local property manager.',
  },
  {
    question: 'How quickly can you find a tenant for my Dubbo rental property?',
    answer: 'Most well-presented Dubbo rental properties are leased within 1–3 weeks of listing. We market your property across major rental platforms, leverage our active tenant database, and conduct open inspections to minimise vacancy periods and find quality, long-term tenants.',
  },
  {
    question: 'What are your property management fees in Dubbo?',
    answer: 'Our fees are transparent and competitive. We charge a management percentage of the weekly rent, plus a letting fee when a new tenant is placed. All fees are disclosed upfront in your management agreement — there are no hidden charges. Contact us for a full fee schedule tailored to your property.',
  },
  {
    question: 'How do I switch to Raine & Horne Dubbo from my current property manager?',
    answer: 'Switching is straightforward. We handle the transition on your behalf — including notifying your current manager, transferring tenant and lease documentation, and ensuring no disruption to your rental income. Most landlords are fully transitioned within two weeks of signing a new management authority with us.',
  },
]

function FAQPreviewModal({ rec, onClose, onNavigateToContentHub, status }: FAQPreviewModalProps) {
  const aeoScore = rec.aeoScore?.you ?? 95
  const subScores = rec.aeoScore?.subScores ?? DEFAULT_FAQ_SUBSCORES
  const asset = rec.generatedAsset
  const [expandedIdx, setExpandedIdx] = useState<number>(0)

  const faqItems: FAQItem[] = asset?.fullContent
    ? [{ question: asset.title, answer: asset.fullContent }]
    : FAQ_ITEMS_PROPERTY_APPRAISAL

  return (
    <Dialog open={true} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          onInteractOutside={onClose}
          className="fixed left-1/2 top-[5vh] z-50 -translate-x-1/2 w-[1200px] max-w-[calc(100vw-48px)] bg-background rounded-xl shadow-modal flex flex-col overflow-hidden focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
        {/* Modal header */}
        <div className="flex-shrink-0 flex items-center justify-between bg-surface px-2xl py-xl rounded-t">
          <div className="flex items-center gap-2">
            <img src={`${B}assets/rec/ai-agent.svg`} alt="" className="w-4 h-4 flex-shrink-0" />
            <span className="text-[16px] text-foreground font-normal leading-[24px]">Preview FAQ set</span>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToContentHub && (
              <Button
                size="sm"
                className="h-[34px] px-4 text-[14px]"
                onClick={() => {
                  if (status === 'pending') {
                    toast.success('Recommendation accepted', {
                      duration: 5000,
                      icon: <CheckCircle2 size={20} strokeWidth={1.6} absoluteStrokeWidth className="text-text-primary" />,
                    })
                  }
                  onClose()
                  onNavigateToContentHub(faqItems)
                }}
              >
                {(status === 'accepted' || status === 'in_progress') ? 'Edit FAQs' : 'Accept and edit FAQ'}
              </Button>
            )}
            <button onClick={onClose} className="size-[34px] flex items-center justify-center rounded hover:bg-surface-hover transition-colors">
              <X size={16} strokeWidth={1.6} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Modal body: two columns */}
        <div className="flex gap-4 px-4 pb-5 pt-5 min-h-0" style={{ maxHeight: 'calc(90vh - 64px)' }}>
          {/* Left panel: AEO score + breakdown */}
          <div className="w-[360px] flex-shrink-0 border border-border rounded-lg overflow-y-auto bg-background">
            <AeoLeftPanel score={aeoScore} subScores={subScores} lowScore={false} />
          </div>

          {/* Right panel: FAQ Q&A accordion */}
          <div className="flex-1 min-w-0 border border-border rounded-lg overflow-y-auto flex flex-col gap-6" style={{ paddingLeft: 50, paddingRight: 37, paddingTop: 38, paddingBottom: 24 }}>
            <div className="flex flex-col gap-1">
              <h1 className="text-[18px] text-foreground font-normal leading-[28px]">{asset?.title ?? rec.title}</h1>
              <p className="text-[13px] text-muted-foreground leading-[20px]">AI-generated FAQ set · {faqItems.length} questions</p>
            </div>

            {/* FAQ accordion */}
            <div className="flex flex-col divide-y divide-border border border-border rounded-lg overflow-hidden">
              {faqItems.map((faq, i) => {
                const isOpen = expandedIdx === i
                return (
                  <div key={i}>
                    <button
                      className="w-full flex items-center justify-between gap-2 px-4 py-2 text-left hover:bg-surface-hover transition-colors"
                      onClick={() => setExpandedIdx(isOpen ? -1 : i)}
                    >
                      <p className="text-[13px] text-foreground font-normal leading-[20px]">
                        <span className="text-muted-foreground mr-2">Q{i + 1}.</span>
                        {faq.question}
                      </p>
                      <ChevronDown
                        size={15}
                        strokeWidth={1.6}
                        absoluteStrokeWidth
                        className={cn('flex-shrink-0 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 bg-muted/20">
                        <p className="text-[13px] text-foreground leading-[22px]">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Schema note */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 flex items-start gap-2">
              <Sparkles size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-primary flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-foreground leading-[18px]">
                JSON-LD schema markup is automatically generated and ready to embed in your website's <code className="text-primary text-[11px] bg-primary/10 px-1 py-0.5 rounded">&lt;head&gt;</code> for maximum AI platform coverage.
              </p>
            </div>
          </div>
        </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

// ── Score card ────────────────────────────────────────────────────────────────

function ScoreCard({ rec, metrics }: { rec: Recommendation; metrics: BusinessMetrics }) {
  const { label: metricLabel, key: metricsKey } = getMetricForCategory(rec.category)
  const current = rec.youScore !== undefined ? rec.youScore : metrics[metricsKey]
  const compPct = rec.compScore !== undefined ? rec.compScore : 50
  const yourW = Math.min(current, 100)
  const compW = Math.min(compPct, 100)

  return (
    <div className="bg-background border border-border rounded-lg p-5 flex flex-col gap-2 h-full">
      <div className="flex flex-col gap-0.5">
        <p className="text-[16px] text-foreground font-normal leading-[24px]">
          What is your {metricLabel}
        </p>
        <p className="text-[12px] text-muted-foreground leading-[18px]">You vs competitor average</p>
      </div>

      {/* Scores — 40px gap, both left-aligned, legend dot paired below each number */}
      <div className="flex items-start gap-10 mt-2">
        <div className="flex flex-col gap-1">
          <p className="text-[32px] font-normal text-foreground leading-[48px] tracking-[-0.64px]">{current.toFixed(1)}%</p>
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            Current score
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[32px] font-normal text-foreground leading-[48px] tracking-[-0.64px]">{compPct.toFixed(1)}%</p>
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
            Competitor average
          </span>
        </div>
      </div>

      {/* Progress bar — blue (your score) then red (competitor gap) then gray track */}
      <div className="relative h-[6px] bg-muted rounded-full">
        <div className="absolute left-0 top-0 h-full bg-destructive rounded-full" style={{ width: `${compW}%` }} />
        <div className="absolute left-0 top-0 h-full bg-primary rounded-full" style={{ width: `${yourW}%` }} />
        <div className="absolute top-1/2 w-[9px] h-[9px] bg-primary rounded-full border-2 border-background shadow-sm" style={{ left: `${yourW}%`, transform: 'translate(-50%, -50%)' }} />
        <div className="absolute top-1/2 w-3 h-3 bg-destructive rounded-full border-2 border-background shadow-sm" style={{ left: `${compW}%`, transform: 'translate(-50%, -50%)' }} />
      </div>
    </div>
  )
}

// ── Citation share section ────────────────────────────────────────────────────

function CitationShareSection({ rec, metrics }: { rec: Recommendation; metrics: BusinessMetrics }) {
  const { key: metricsKey } = getMetricForCategory(rec.category)
  const yourPct = rec.youScore !== undefined ? rec.youScore : metrics[metricsKey]
  const rawCompetitors = rec.competitors.length > 0 ? rec.competitors : MOCK_EVIDENCE_COMPETITORS
  const competitors = rawCompetitors.slice(0, 3)
  const compPercentages = [83.3, 4.0, 3.0]
  const topic = 'Residential Property Sales'

  return (
    <div className="bg-background border border-border rounded-lg p-5">
      <p className="text-[16px] text-foreground font-normal leading-[24px] mb-4">
        What is your citation share compared to competitors for &lsquo;{topic}&rsquo;
      </p>
      <div className="flex items-center overflow-x-auto">
        {/* You */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <p className="text-[24px] font-normal text-foreground leading-[1.2] tracking-[-0.5px]">{yourPct.toFixed(1)}%</p>
          <span className="inline-flex items-center w-fit text-[12px] bg-primary text-primary-foreground px-2 py-1 rounded-full font-normal leading-none">You</span>
        </div>

        {competitors.map((comp, i) => (
          <Fragment key={comp.id}>
            <div className="flex-shrink-0 px-6">
              <span
                className="flex items-center justify-center size-[34px] rounded-full text-[12px] text-muted-foreground font-light"
                style={{ background: '#e8f0fe' }}
              >
                vs
              </span>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <p className="text-[24px] font-normal text-foreground leading-[1.2] tracking-[-0.5px]">{compPercentages[i].toFixed(1)}%</p>
              <span className="text-[12px] font-light text-muted-foreground leading-[18px]">{comp.name}</span>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

// ── Blog preview box ──────────────────────────────────────────────────────────

interface BlogPreviewBoxProps {
  rec: Recommendation
  aeoScore: number
  onOpenClick?: () => void
  onAccept?: () => void
}

function BlogPreviewBox({ rec, aeoScore, onOpenClick, onAccept }: BlogPreviewBoxProps) {
  return (
    <div
      className="flex items-start gap-2 rounded-lg p-2 cursor-pointer"
      style={{ background: '#f9f7fd' }}
      onClick={onOpenClick}
    >
      <img
        src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=120&h=120&fit=crop&crop=center&q=80"
        alt=""
        className="w-[60px] h-[60px] object-cover rounded-lg flex-shrink-0"
      />
      <div className="flex flex-1 min-w-0 flex-col gap-0.5 justify-center">
        <div className="flex items-center gap-1">
          <img src={`${B}assets/rec/ai-agent.svg`} alt="" className="w-3 h-3 flex-shrink-0" />
          <span className="text-[12px] leading-[18px]" style={{ color: '#6834B7' }}>AI draft ready</span>
        </div>
        <p className="text-[14px] text-foreground leading-[20px] font-normal truncate">{rec.title}</p>
        <p className="text-[12px] text-muted-foreground leading-[18px] flex items-baseline gap-1 min-w-0">
          <span className="truncate">{rec.description}</span>
          {onOpenClick && (
            <span className="text-primary hover:underline font-normal whitespace-nowrap shrink-0">
              View blog
            </span>
          )}
        </p>
      </div>
      <AeoScoreBox score={aeoScore} />
    </div>
  )
}

// ── FAQ preview box ───────────────────────────────────────────────────────────

interface FAQPreviewBoxProps {
  rec: Recommendation
  onPreviewClick?: () => void
  onNavigateToContentHub?: (questions: { question: string; answer: string }[]) => void
}

function FAQPreviewBox({ rec, onPreviewClick, onNavigateToContentHub }: FAQPreviewBoxProps) {
  const aeoScore = rec.aeoScore?.you ?? 95
  // Title: use shortAction if available (e.g. "Add rental FAQ section"), else rec title — append " draft"
  const draftTitle = `${rec.shortAction ?? rec.title} draft`

  return (
    <div
      className="flex items-start gap-2 rounded-lg p-2 cursor-pointer"
      style={{ background: '#f9f7fd' }}
      onClick={onPreviewClick}
    >
      <div className="flex flex-1 min-w-0 flex-col gap-0.5 justify-center">
        <div className="flex items-center gap-1">
          <img src={`${B}assets/rec/ai-agent.svg`} alt="" className="w-3 h-3 flex-shrink-0" />
          <span className="text-[12px] leading-[18px]" style={{ color: '#6834B7' }}>AI draft ready</span>
        </div>
        <p className="text-[14px] text-foreground leading-[20px] font-normal truncate">{draftTitle}</p>
        <p className="text-[12px] text-muted-foreground leading-[18px] flex items-baseline gap-1 min-w-0">
          <span className="truncate">We&apos;ve created a FAQ section draft based on what&apos;s working for competitors. Review and publish on your website.</span>
          {onPreviewClick && (
            <span className="text-primary hover:underline font-normal whitespace-nowrap shrink-0">
              View FAQs
            </span>
          )}
        </p>
      </div>
      <AeoScoreBox score={aeoScore} />
    </div>
  )
}

// ── Stepper ───────────────────────────────────────────────────────────────────

interface Step {
  label: string
  description: ReactNode
  cta?: { label: string; onClick: () => void }
}

function Stepper({ steps }: { steps: Step[] }) {
  return (
    <div className="pb-2">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1
        return (
          <div key={idx} className="flex gap-2 items-stretch px-4">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-5 h-5 border border-border rounded-full flex items-center justify-center text-[11px] text-muted-foreground leading-none flex-shrink-0 bg-background mt-0.5">
                {idx + 1}
              </div>
              {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            <div className={cn('flex flex-col flex-1 min-w-0 pt-0.5', !isLast ? 'pb-5' : 'pb-1')}>
              <p className="text-[14px] font-light text-foreground leading-[22px]">{step.label}</p>
              <div className="text-[12px] font-light text-muted-foreground leading-[18px] mt-0.5">{step.description}</div>
              {step.cta && (
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={step.cta.onClick} className="h-[34px] text-[13px]">
                    {step.cta.label}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Need Help banner ──────────────────────────────────────────────────────────

function NeedHelpBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="flex items-center justify-between gap-4 mx-6 mb-4 mt-2 px-4 py-2 bg-primary/[0.06] rounded-lg">
      <div className="flex items-center gap-2 min-w-0">
        <Info size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-primary flex-shrink-0" />
        <span className="text-[12px] font-light text-muted-foreground leading-[18px]">
          Need help with implementation? Our team will make the updates for you on your website.
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button className="text-[14px] font-light text-primary whitespace-nowrap hover:underline">
          Contact support
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-primary/10 transition-colors"
        >
          <X size={12} strokeWidth={1.6} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

// ── Content/Blog detail ───────────────────────────────────────────────────────

interface ContentDetailProps {
  rec: Recommendation
  metrics: BusinessMetrics
  onAccept: () => void
  onNavigateToBlogCanvas?: () => void
}

function ContentDetail({ rec, metrics, onAccept, onNavigateToBlogCanvas }: ContentDetailProps) {
  const [showBlogPreview, setShowBlogPreview] = useState(false)
  const aeoScore = rec.aeoScore?.you ?? 92

  const isRejectedOrCompleted = rec.status === 'rejected' || rec.status === 'completed' || rec.status === 'in_progress'

  const steps: Step[] = [
    {
      label: 'Review your Search AI-generated blog',
      description: 'Read through the draft. Change any details, prices, or tone to match your voice',
      cta: isRejectedOrCompleted
        ? undefined
        : { label: 'Review blog', onClick: () => setShowBlogPreview(true) },
    },
    {
      label: rec.status === 'accepted' || rec.status === 'completed' || rec.status === 'in_progress'
        ? 'Publish to your website'
        : 'Accept and publish to your website',
      description: (
        <>Publish <a href="#" className="text-primary hover:underline">on these pages</a> to boost your Search AI score</>
      ),
    },
    {
      label: 'Mark it as complete after publishing',
      description: 'Mark this task as complete to observe your progress in Search AI score',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {showBlogPreview && (
        <BlogPreviewModal
          rec={rec}
          onClose={() => setShowBlogPreview(false)}
          onAccept={() => { setShowBlogPreview(false); onAccept() }}
          onNavigateToBlogCanvas={onNavigateToBlogCanvas ? () => { setShowBlogPreview(false); onNavigateToBlogCanvas() } : undefined}
          status={rec.status}
        />
      )}

      {/* Citation share */}
      <CitationShareSection rec={rec} metrics={metrics} />

      {/* Blog preview card */}
      <div className="bg-background border border-border rounded-lg">
        <div className="px-4 pt-4 pb-4 flex flex-col">
          <p className="text-[16px] text-foreground font-normal leading-[24px]">How can you fix this gap</p>
          <p className="text-[14px] font-light text-muted-foreground leading-[22px] mt-1">{rec.title}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <p className="text-[12px] font-light text-muted-foreground leading-[18px] flex-1 min-w-0">{rec.description}</p>
            <span className="inline-flex items-center rounded-full border border-border text-muted-foreground text-[12px] font-light px-2.5 py-0.5 flex-shrink-0">12 locations</span>
          </div>
          <div className="mt-3">
            <BlogPreviewBox rec={rec} aeoScore={aeoScore} onOpenClick={() => setShowBlogPreview(true)} onAccept={onNavigateToBlogCanvas ?? onAccept} />
          </div>
        </div>
      </div>

      {/* What to do next — hidden when completed */}
      {rec.status !== 'completed' && (
        <div className="bg-background border border-border rounded-lg">
          <div className="px-4 pt-5 pb-3">
            <p className="text-[16px] text-foreground font-normal leading-[24px]">What to do next</p>
            <p className="text-[12px] font-light text-muted-foreground leading-[18px] mt-0.5">Step by step guide on what you need to do next</p>
          </div>
          <Stepper steps={steps} />
          <NeedHelpBanner />
        </div>
      )}

      {/* Evidence sections */}
      <CompetitorCitationsCard rec={rec} />
      <LLMResponsesCard rec={rec} />

    </div>
  )
}

// ── FAQ detail ────────────────────────────────────────────────────────────────

interface FAQDetailProps {
  rec: Recommendation
  metrics: BusinessMetrics
  onNavigateToContentHub?: (questions: { question: string; answer: string }[]) => void
}

function FAQDetail({ rec, metrics, onNavigateToContentHub }: FAQDetailProps) {
  const [showFAQPreview, setShowFAQPreview] = useState(false)

  const isFAQRejectedOrCompleted = rec.status === 'rejected' || rec.status === 'completed' || rec.status === 'in_progress'

  const steps: Step[] = [
    {
      label: 'Review your AI-generated FAQ set',
      description: 'Read through the generated Q&As and edit any details to match your voice and local knowledge.',
      cta: isFAQRejectedOrCompleted
        ? undefined
        : { label: 'Review FAQs', onClick: () => setShowFAQPreview(true) },
    },
    {
      label: 'Add FAQ schema to your website',
      description: (
        <>Paste the FAQ schema <a href="#" className="text-primary hover:underline">on these pages</a> to improve AI citation potential.</>
      ),
    },
    {
      label: 'Publish to Birdeye website page',
      description: 'Create a dedicated FAQ page and publish it through Birdeye to maximize AI citation potential.',
    },
    {
      label: 'Mark complete after publishing',
      description: 'Mark this task as complete to track your progress in Search AI score.',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {showFAQPreview && (
        <FAQPreviewModal
          rec={rec}
          onClose={() => setShowFAQPreview(false)}
          onNavigateToContentHub={onNavigateToContentHub}
          status={rec.status}
        />
      )}

      {/* Citation share */}
      <CitationShareSection rec={rec} metrics={metrics} />

      {/* FAQ preview card */}
      <div className="bg-background border border-border rounded-lg">
        <div className="px-4 pt-4 pb-4 flex flex-col">
          <p className="text-[16px] text-foreground font-normal leading-[24px]">How can you fix this gap</p>
          <p className="text-[14px] font-light text-muted-foreground leading-[22px] mt-1">{rec.title}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <p className="text-[12px] font-light text-muted-foreground leading-[18px] flex-1 min-w-0">{rec.description}</p>
            <span className="inline-flex items-center rounded-full border border-border text-muted-foreground text-[12px] font-light px-2.5 py-0.5 flex-shrink-0">12 locations</span>
          </div>
          <div className="mt-3">
            <FAQPreviewBox
              rec={rec}
              onPreviewClick={() => setShowFAQPreview(true)}
              onNavigateToContentHub={onNavigateToContentHub}
            />
          </div>
        </div>
      </div>

      {/* What to do next — hidden when completed */}
      {rec.status !== 'completed' && (
        <div className="bg-background border border-border rounded-lg">
          <div className="px-4 pt-5 pb-3">
            <p className="text-[16px] text-foreground font-normal leading-[24px]">What to do next</p>
            <p className="text-[12px] font-light text-muted-foreground leading-[18px] mt-0.5">Step by step guide on what you need to do next</p>
          </div>
          <Stepper steps={steps} />
          <NeedHelpBanner />
        </div>
      )}

      {/* Evidence sections */}
      <CompetitorCitationsCard rec={rec} />
      <LLMResponsesCard rec={rec} />
    </div>
  )
}

// ── Generic detail ────────────────────────────────────────────────────────────

interface GenericDetailProps {
  rec: Recommendation
  metrics: BusinessMetrics
}

function GenericDetail({ rec, metrics }: GenericDetailProps) {
  const topComp = rec.competitors[0]

  const steps: Step[] = rec.checklist.map(step => ({
    label: step.label,
    description: step.description,
  }))

  return (
    <div className="flex flex-col gap-4">
      {/* Score + why it matters */}
      <div className="flex gap-4 items-stretch">
        <div className="w-[30%] flex-shrink-0">
          <ScoreCard rec={rec} metrics={metrics} />
        </div>
        {rec.whyItWorks.length > 0 && (
          <div className="flex-1 bg-background border border-border rounded-lg p-5 min-w-0">
            <p className="text-[16px] text-foreground font-normal leading-[24px] mb-0.5">Why does this recommendation matter to you</p>
            <p className="text-[12px] text-muted-foreground leading-[18px] mb-3">We analyzed your reports and found these gaps</p>
            <ul className="flex flex-col gap-2.5">
              {rec.whyItWorks.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-foreground leading-[21px]">
                  <span className="mt-[7px] w-[5px] h-[5px] rounded-full bg-muted-foreground flex-shrink-0" />
                  {pt}
                </li>
              ))}
              {topComp && (
                <li className="flex items-start gap-2.5 text-[13px] text-foreground leading-[21px]">
                  <span className="mt-[7px] w-[5px] h-[5px] rounded-full bg-muted-foreground flex-shrink-0" />
                  {topComp.name} is the top cited competitor for {rec.category}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* How can you fix this gap card */}
      <div className="bg-background border border-border rounded-lg">
        <div className="px-4 pt-4 pb-1">
          <div className="flex flex-col gap-1">
            <p className="text-[16px] text-foreground font-normal leading-[24px]">How can you fix this gap</p>
            <p className="text-[16px] text-foreground font-normal leading-[24px]">{rec.title}</p>
          </div>
        </div>
        <div className="px-4 py-2">
          <p className="text-[14px] text-muted-foreground font-normal leading-[20px]">{rec.expectedImpact ?? rec.description}</p>
        </div>
      </div>

      {/* What to do next — hidden when completed */}
      {steps.length > 0 && rec.status !== 'completed' && (
        <div className="bg-background border border-border rounded-lg">
          <div className="px-4 pt-5 pb-3">
            <p className="text-[16px] text-foreground font-normal leading-[24px]">What to do next</p>
            <p className="text-[12px] text-muted-foreground leading-[18px] mt-0.5">Step by step guide on what you need to do next</p>
          </div>
          <Stepper steps={steps} />
          <NeedHelpBanner />
        </div>
      )}

      {/* Evidence sections */}
      <CompetitorCitationsCard rec={rec} />
      <LLMResponsesCard rec={rec} />
    </div>
  )
}

// ── Evidence tab ─────────────────────────────────────────────────────────────

const LLM_EVIDENCE_PLATFORMS = ['ChatGPT', 'Gemini', 'Perplexity', 'Google AI Mode', 'Google AI Overviews'] as const
type EvidencePlatform = (typeof LLM_EVIDENCE_PLATFORMS)[number]

interface LLMResponseRow {
  date: string
  location: string
  mentioned: boolean
  position: number | null
  positionDelta: number | null
  mentions: { initial: string; color: string }[]
  mentionsOverflow: number
  citations: { initial: string; color: string }[]
  response: string
}

const EVIDENCE_AVATAR_COLORS: Record<string, string> = {
  Z: '#1a73e8', R: '#e53935', T: '#43a047', H: '#fb8c00',
  L: '#3949ab', C: '#00acc1', B: '#8e24aa', M: '#00897b',
}
function avatarColor(initial: string): string {
  return EVIDENCE_AVATAR_COLORS[initial.toUpperCase()]
    ?? `hsl(${(initial.toUpperCase().charCodeAt(0) * 47) % 360},55%,45%)`
}

const MOCK_LLM_ROWS: LLMResponseRow[] = [
  {
    date: 'Jan 10, 2026', location: 'Dubbo, NSW', mentioned: true,
    position: 3, positionDelta: 1,
    mentions: [{ initial: 'Z', color: avatarColor('Z') }, { initial: 'R', color: avatarColor('R') }, { initial: 'T', color: avatarColor('T') }],
    mentionsOverflow: 17,
    citations: [{ initial: 'T', color: avatarColor('T') }, { initial: 'H', color: avatarColor('H') }, { initial: 'L', color: avatarColor('L') }],
    response: 'Here are the top-rated real estate agencies in Dubbo that consistently appear in AI-generated recommendati...',
  },
  {
    date: 'Jan 10, 2026', location: 'Orange, NSW', mentioned: false,
    position: null, positionDelta: null,
    mentions: [], mentionsOverflow: 0,
    citations: [{ initial: 'H', color: avatarColor('H') }, { initial: 'L', color: avatarColor('L') }],
    response: 'The leading property agencies in Orange NSW include several highly regarded firms offering residential sale...',
  },
  {
    date: 'Jan 9, 2026', location: 'Bathurst, NSW', mentioned: true,
    position: 5, positionDelta: 3,
    mentions: [{ initial: 'T', color: avatarColor('T') }, { initial: 'H', color: avatarColor('H') }, { initial: 'L', color: avatarColor('L') }],
    mentionsOverflow: 15,
    citations: [{ initial: 'L', color: avatarColor('L') }, { initial: 'C', color: avatarColor('C') }, { initial: 'Z', color: avatarColor('Z') }],
    response: 'Top real estate agents in Bathurst are active across multiple suburbs, with many offering complimentary pro...',
  },
  {
    date: 'Jan 8, 2026', location: 'Parkes, NSW', mentioned: true,
    position: 4, positionDelta: 2,
    mentions: [{ initial: 'H', color: avatarColor('H') }, { initial: 'L', color: avatarColor('L') }, { initial: 'C', color: avatarColor('C') }],
    mentionsOverflow: 17,
    citations: [{ initial: 'C', color: avatarColor('C') }, { initial: 'Z', color: avatarColor('Z') }],
    response: 'Looking for a property appraisal in Parkes? Several well-reviewed agencies offer no-obligation valuations wit...',
  },
]

function getBadgeStyle(initial: string): { bg: string; color: string } {
  const PALETTES = [
    { bg: '#fef3c7', color: '#92400e' },
    { bg: '#dbeafe', color: '#1e3a8a' },
    { bg: '#dcfce7', color: '#166534' },
    { bg: '#fce7f3', color: '#9d174d' },
    { bg: '#ede9fe', color: '#5b21b6' },
    { bg: '#f1f5f9', color: '#334155' },
    { bg: '#fef2f2', color: '#991b1b' },
    { bg: '#ecfdf5', color: '#065f46' },
  ]
  return PALETTES[initial.toUpperCase().charCodeAt(0) % PALETTES.length]
}

// ── Site name map for mentions popover ───────────────────────────────────────

const MENTIONS_SITE_NAMES: Record<string, string> = {
  Z: 'Zillow', R: 'Realtor.com', T: 'Trulia', H: 'Homes.com',
  L: 'LoopNet', C: 'CoStar', B: 'Berkshire Hathaway', M: 'Movoto',
  D: 'Domain.com.au', N: 'Nearmap', A: 'Allhomes', P: 'PropertyGuru',
  S: 'Seek Real Estate', W: 'RealEstate.com.au', E: 'Estate Agents',
  F: 'First Home Buyer', G: 'Gumtree Property', I: 'Invest Smart',
  J: 'Just Listed', K: 'Keysite Realty', O: 'OneRoof', V: 'View.com.au',
}

// Extra site initials for overflow rows (consistent across data rows)
const OVERFLOW_EXTRAS = ['D', 'N', 'A', 'P', 'S', 'W', 'E', 'F', 'G', 'I', 'J', 'K', 'O', 'V', 'B', 'M', 'C']

function MentionsWithPopover({ items, overflow }: { items: { initial: string; color: string }[]; overflow: number }) {
  const [showPopover, setShowPopover] = useState(false)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })
  const overflowRef = useRef<HTMLSpanElement | null>(null)

  function handleOverflowEnter() {
    if (!overflowRef.current) return
    const rect = overflowRef.current.getBoundingClientRect()
    setPopoverPos({ top: rect.bottom + 6, left: rect.left - 80 })
    setShowPopover(true)
  }

  // All site names: visible items + overflow extras
  const allNames = [
    ...items.map(a => MENTIONS_SITE_NAMES[a.initial] ?? a.initial),
    ...OVERFLOW_EXTRAS.slice(0, overflow).map(k => MENTIONS_SITE_NAMES[k] ?? k),
  ]

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-1.5">
        {items.map((a, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] text-white flex-shrink-0"
            style={{ backgroundColor: a.color }}
          >
            {a.initial}
          </div>
        ))}
      </div>
      {overflow > 0 && (
        <span
          ref={overflowRef}
          className="text-[12px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
          onMouseEnter={handleOverflowEnter}
          onMouseLeave={() => setTimeout(() => setShowPopover(false), 200)}
        >
          +{overflow}
        </span>
      )}
      {showPopover && createPortal(
        <div
          className="fixed z-[9999] bg-background rounded-lg shadow-dropdown border border-border w-56 py-2"
          style={{ top: popoverPos.top, left: popoverPos.left }}
          onMouseEnter={() => setShowPopover(true)}
          onMouseLeave={() => setShowPopover(false)}
        >
          <p className="px-2 pt-1 pb-2 text-[11px] text-muted-foreground tracking-[0.4px] uppercase">
            All mentions ({allNames.length})
          </p>
          <ul className="max-h-52 overflow-y-auto">
            {allNames.map((name, i) => (
              <li key={i} className="px-2 py-1.5 hover:bg-surface-hover">
                <span className="text-[13px] text-foreground leading-[18px]">{name}</span>
              </li>
            ))}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  )
}

// ── Competitor citations card ──────────────────────────────────────────────────

const MOCK_EVIDENCE_COMPETITORS: Recommendation['competitors'] = [
  {
    id: 'aspect', name: 'Aspect Property Consultant',
    pageUrl: 'https://aspectpropertyconsultant.com.au',
    llmSnippet: "Aspect Property Consultant's appraisal hub clearly communicates their \"no obligation, no cost\" value promise with a simple form above the fold, capturing more leads from Dubbo property owners searching for valuations.",
    citedBy: [], totalCitations: 120, citationRank: 1, sourceGaps: [], whyTheyWin: '',
  },
  {
    id: 'ray-white', name: 'Ray White Dubbo',
    pageUrl: 'https://raywhitedubbo.com.au',
    llmSnippet: "Ray White Dubbo has a dedicated property appraisal page that answers the top questions AI surfaces for Dubbo sellers — including what a free appraisal covers, timelines, and what to expect from the process.",
    citedBy: [], totalCitations: 98, citationRank: 2, sourceGaps: [], whyTheyWin: '',
  },
  {
    id: 'elders', name: 'Elders Real Estate Dubbo',
    pageUrl: 'https://eldersrealestate.com.au/dubbo',
    llmSnippet: "Elders Real Estate Dubbo prominently features their free appraisal offer across their website, with suburb-specific landing pages that Gemini surfaces when homeowners ask about property values in the Dubbo area.",
    citedBy: [], totalCitations: 87, citationRank: 3, sourceGaps: [], whyTheyWin: '',
  },
]

// Per-competitor AEO total scores and sub-score values
// Weighted sums verified against DEFAULT_BLOG_SUBSCORES weights [10.2,16.3,8.5,30.5,11.5,22.9]
const COMP_AEO_SCORES = [84, 79, 81] // Aspect ~84, Ray White ~79, Elders ~81
const COMP_SUBSCORE_VALS = [
  [83, 85, 82, 84, 83, 84], // Aspect       → weighted avg ≈ 84
  [77, 79, 76, 80, 78, 80], // Ray White    → weighted avg ≈ 79
  [80, 81, 79, 82, 80, 82], // Elders       → weighted avg ≈ 81
]

const MOCK_COMP_CARDS = [
  {
    id: 'bowery',
    name: 'Bowery',
    initial: 'B',
    avatarBg: '#f59e0b',
    pageTitle: 'Bowery | Residential Property Sales',
    pageUrl: 'https://bowery.com.au',
    snippet: 'Bowery maintains dedicated suburb service pages for key Dubbo areas including Dubbo South, Delroy Park, and Whylandra,...',
    aeoScore: 79,
  },
  {
    id: 'ray-white',
    name: 'Ray White Dubbo',
    initial: 'R',
    avatarBg: '#374151',
    pageTitle: 'Ray White Dubbo | Residential Property Sales',
    pageUrl: 'https://raywhitedubbo.com.au',
    snippet: "Ray White Dubbo's suburb profile pages include median sale prices, days-on-market data, and local agent bios — making the...",
    aeoScore: 57,
  },
  {
    id: 'mcgrath',
    name: 'McGrath Dubbo',
    initial: 'M',
    avatarBg: '#7c3aed',
    pageTitle: 'McGrath Dubbo | Residential Property Sales',
    pageUrl: 'https://mcgrath.com.au',
    snippet: 'McGrath Dubbo has suburb-specific pages targeting rural and lifestyle property seekers in surrounding areas like Narromine a...',
    aeoScore: 41,
  },
]

function CompetitorAeoScore({ score }: { score: number }) {
  const r = 8
  const circ = 2 * Math.PI * r
  const pct = Math.min(score, 100) / 100
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[12px] font-light text-muted-foreground">AEO content score</span>
      <svg width="20" height="20" viewBox="0 0 20 20" style={{ transform: 'rotate(270deg)' }} className="flex-shrink-0">
        <circle cx="10" cy="10" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="2.5" />
        <circle cx="10" cy="10" r={r} fill="none" stroke="#4cae3d" strokeWidth="2.5" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" />
      </svg>
      <span className="text-[14px] font-normal leading-none" style={{ color: '#4cae3d' }}>{score}</span>
      <span className="text-[12px] font-light text-muted-foreground leading-none">/100</span>
    </div>
  )
}

function CompetitorCitationsCard({ rec }: { rec: Recommendation }) {
  const query = rec.promptsTriggeringThis[0]
    ?? 'Find real estate agencies near me specializing in residential property sales'

  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden">
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[16px] text-foreground font-normal leading-[24px]">Which competitor pages are cited by AI for</span>
          <button type="button" className="inline-flex items-center gap-1 text-[16px] text-primary font-normal leading-[24px] hover:underline">
            {query}
            <ChevronDown size={14} strokeWidth={1.6} absoluteStrokeWidth className="flex-shrink-0" />
          </button>
        </div>
        <p className="text-[12px] font-light text-muted-foreground mt-0.5">
          Analyze competitor blogs cited in AI-generated answers for prompts you are tracking
        </p>
      </div>

      {/* 3-column card grid */}
      <div className="px-4 pb-5 grid grid-cols-3 gap-4">
        {MOCK_COMP_CARDS.map(comp => (
          <div key={comp.id} className="rounded-lg bg-[var(--s-bg-secondary)] p-4 flex flex-col gap-2">
            {/* Avatar + name */}
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-normal text-white flex-shrink-0"
                style={{ backgroundColor: comp.avatarBg }}
              >
                {comp.initial}
              </span>
              <span className="text-[12px] font-light text-muted-foreground leading-none truncate">{comp.name}</span>
            </div>

            {/* Page link */}
            <a
              href={comp.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] font-normal text-primary hover:underline leading-[20px]"
            >
              {comp.pageTitle}
            </a>

            {/* Snippet */}
            <p className="text-[12px] font-light text-muted-foreground leading-[18px] flex-1">{comp.snippet}</p>

            {/* AEO score */}
            <CompetitorAeoScore score={comp.aeoScore} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── LLM Response Modal ─────────────────────────────────────────────────────────

const RESPONSE_AGENCIES_FULL = [
  { name: 'Raine & Horne Dubbo', description: "One of Dubbo's largest and longest-running agencies, specialising in residential sales, auctions, rentals, and investment properties. They sold over 200 properties in the last 12 months according to View.com.au.", badges: ['View'] },
  { name: 'Elders Real Estate Dubbo', description: 'Established local agency with more than 50 years operating in the Dubbo region. Strong focus on residential home sales, lifestyle properties, and auctions.', badges: ['Allhomes', '+2'] },
  { name: 'Ray White Dubbo', description: 'Well-known national brand with a strong Dubbo office specialising in residential property sales and property management across the region.', badges: [] },
  { name: 'Bob Berry Real Estate', description: 'Highly rated local agency known for residential sales and investment properties with a strong reputation among Dubbo homeowners and investors.', badges: [] },
  { name: 'Redden Family Real Estate', description: 'Family-run boutique agency specialising in personalised residential property sales services with excellent customer reviews.', badges: [] },
  { name: 'Matt Hansen Real Estate', description: 'Popular independent Dubbo agency focused on residential homes, investment properties, and local market expertise.', badges: [] },
  { name: 'Western Plains Real Estate', description: 'Local agency servicing residential sales and rentals throughout Dubbo and surrounding suburbs.', badges: [] },
  { name: 'Dubbo Real Estate Agency', description: 'Established agency offering residential property sales, leasing, and property management services.', badges: [] },
  { name: 'Peter Milling & Company - Livestock & Real Estate Agents Dubbo', description: 'Regional agency handling residential, rural, and lifestyle property sales.', badges: [] },
  { name: 'Brien Real Estate Agency', description: 'Smaller local agency focused on personalised property sales and management services.', badges: [] },
]

const RESPONSE_CITATIONS = [
  { id: 'raine', initial: 'R', avatarBg: '#e53935', name: 'Raine & Horne Dubbo', link: 'Raine & Horne Dubbo | Leading Property Agency in Dubbo', snippet: 'Raine & Horne Dubbo maintains dedicated suburb service pages for key Dubbo areas including Dubbo South, Delroy Park, and surrounding rural communities.' },
  { id: 'ray-white', initial: 'R', avatarBg: '#1a73e8', name: 'Ray White Dubbo', link: 'Ray White Dubbo | Real Estate Agents & Property Management', snippet: "Ray White Dubbo's suburb profile pages include median sale prices, days-on-market data, and local agent profiles to help buyers and sellers navigate the market." },
  { id: 'mcgrath', initial: 'M', avatarBg: '#7c3aed', name: 'McGrath Dubbo', link: 'McGrath Dubbo | Residential & Rural Property Specialists', snippet: 'McGrath Dubbo has suburb-specific pages targeting rural and lifestyle property seekers in surrounding areas, with consistent coverage of Dubbo residential sales.' },
]

function LLMResponseModal({ row, query, onClose }: { row: LLMResponseRow; query: string; onClose: () => void }) {
  return (
    <Dialog open={true} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          onInteractOutside={onClose}
          className="fixed left-1/2 top-1/2 z-[150] -translate-x-1/2 -translate-y-1/2 w-full max-w-[860px] bg-background rounded-xl shadow-modal flex flex-col overflow-hidden focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-5 pb-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <p className="text-[16px] text-foreground font-normal leading-[24px]">{query}</p>
            <p className="text-[12px] font-light text-muted-foreground mt-0.5">
              Prompt executed on {row.date} on ChatGPT for {row.location}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm">Accept</Button>
            <button
              onClick={onClose}
              className="size-[34px] flex items-center justify-center rounded hover:bg-surface-hover transition-colors"
            >
              <X size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto max-h-[80vh] flex flex-col gap-4 px-6 pt-5 pb-6">
          {/* Query bubble */}
          <div className="flex justify-end">
            <div className="bg-muted/60 rounded-xl px-4 py-2.5 max-w-[88%]">
              <p className="text-[13px] text-foreground leading-[20px]">{query}</p>
            </div>
          </div>

          {/* Map */}
          <div className="rounded-lg overflow-hidden relative select-none flex-shrink-0" style={{ height: '280px', minHeight: '280px', background: '#e8e0d5' }}>
            {/* Road network SVG — preserveAspectRatio none so viewBox fills the rectangle exactly */}
            <svg
              className="absolute inset-0"
              width="100%"
              height="100%"
              viewBox="0 0 860 280"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Block fill for road surfaces */}
              <rect width="860" height="280" fill="#e8e0d5"/>
              {/* Minor grid streets */}
              <line x1="0" y1="70" x2="860" y2="70" stroke="#d4c5b0" strokeWidth="2"/>
              <line x1="0" y1="100" x2="860" y2="100" stroke="#d4c5b0" strokeWidth="2"/>
              <line x1="0" y1="180" x2="860" y2="180" stroke="#d4c5b0" strokeWidth="2"/>
              <line x1="0" y1="220" x2="860" y2="220" stroke="#d4c5b0" strokeWidth="2"/>
              <line x1="180" y1="0" x2="180" y2="280" stroke="#d4c5b0" strokeWidth="2"/>
              <line x1="515" y1="0" x2="515" y2="280" stroke="#d4c5b0" strokeWidth="2"/>
              <line x1="660" y1="0" x2="660" y2="280" stroke="#d4c5b0" strokeWidth="2"/>
              {/* Main arterial — horizontal (wider road surface) */}
              <rect x="0" y="141" width="860" height="12" fill="#c9b89a"/>
              {/* Main arterial — vertical */}
              <rect x="356" y="0" width="12" height="280" fill="#c9b89a"/>
              {/* Peak Hill Rd diagonal */}
              <line x1="0" y1="103" x2="318" y2="280" stroke="#c9b89a" strokeWidth="7" strokeLinecap="round"/>
            </svg>

            {/* Green coverage blobs */}
            <div className="absolute pointer-events-none" style={{ top: '-10px', right: '-10px', width: 160, height: 160, background: 'radial-gradient(circle, rgba(34,197,94,0.30) 0%, transparent 65%)', borderRadius: '50%' }} />
            <div className="absolute pointer-events-none" style={{ bottom: '-5px', right: '50px', width: 110, height: 110, background: 'radial-gradient(circle, rgba(34,197,94,0.34) 0%, transparent 68%)', borderRadius: '50%' }} />

            {/* Fullscreen button */}
            <button type="button" className="absolute top-2 left-2 z-10 w-7 h-7 bg-white/95 border border-gray-200 rounded flex items-center justify-center shadow-sm hover:bg-surface-hover transition-colors">
              <Maximize2 size={11} strokeWidth={1.6} absoluteStrokeWidth className="text-text-secondary" />
            </button>

            {/* Time button */}
            <button type="button" className="absolute bottom-2 left-2 z-10 w-7 h-7 bg-white/95 border border-gray-200 rounded flex items-center justify-center shadow-sm hover:bg-surface-hover transition-colors">
              <Clock size={11} strokeWidth={1.6} absoluteStrokeWidth className="text-text-secondary" />
            </button>

            {/* Suburb labels */}
            <div className="absolute" style={{ top: '10%', left: '4%' }}><span className="text-[9px] font-normal text-text-secondary drop-shadow-sm">Churchill Gardens</span></div>
            <div className="absolute" style={{ top: '28%', left: '8%' }}><span className="text-[9px] font-normal text-text-secondary drop-shadow-sm">Delroy Gardens</span></div>
            <div className="absolute" style={{ top: '60%', left: '44%' }}><span className="text-[9px] font-normal text-text-secondary drop-shadow-sm">South Dubbo</span></div>
            <div className="absolute" style={{ top: '32%', left: '62%' }}><span className="text-[9px] font-normal text-text-secondary drop-shadow-sm">Yarrawonga</span></div>
            <div className="absolute" style={{ top: '50%', left: '63%' }}><span className="text-[9px] font-normal text-text-secondary drop-shadow-sm">Keswick</span></div>
            <div className="absolute" style={{ top: '72%', left: '52%' }}><span className="text-[9px] font-normal text-text-secondary drop-shadow-sm">Southlakes</span></div>

            {/* Peak Hill Rd diagonal label — rotated to match road angle */}
            <div className="absolute" style={{ top: '64%', left: '7%', transform: 'rotate(29deg)', transformOrigin: 'left center' }}>
              <span className="text-[8px] font-normal text-text-secondary whitespace-nowrap drop-shadow-sm">Peak Hill Rd</span>
            </div>

            {/* Rating pins */}
            <div className="absolute bg-white rounded-full px-2 py-[3px] shadow flex items-center gap-1 text-[10px] font-normal whitespace-nowrap" style={{ top: '16%', left: '42%' }}>
              <span className="text-yellow-400 text-[11px]">★</span><span className="text-text-primary">4.8</span>
            </div>
            <div className="absolute bg-white rounded-full px-2 py-[3px] shadow text-[10px] font-normal whitespace-nowrap text-text-primary" style={{ top: '27%', left: '35%' }}>
              Ray <span className="text-yellow-400 text-[11px]">★</span> 4.0 Dubbo
            </div>
            <div className="absolute bg-white rounded-full px-2 py-[3px] shadow flex items-center gap-1 text-[10px] font-normal whitespace-nowrap" style={{ top: '40%', left: '32%' }}>
              <span className="text-yellow-400 text-[11px]">★</span><span className="text-text-primary">3.7</span>
            </div>
            <div className="absolute bg-white rounded-full px-2 py-[3px] shadow text-[10px] font-normal whitespace-nowrap text-text-primary" style={{ top: '39%', left: '40%' }}>
              Matt Hansen Real Estate
            </div>
            <div className="absolute bg-white rounded-full px-2 py-[3px] shadow flex items-center gap-1 text-[10px] font-normal whitespace-nowrap" style={{ top: '65%', left: '50%' }}>
              <span className="text-yellow-400 text-[11px]">★</span><span className="text-text-primary">5.0</span>
            </div>
            <div className="absolute bg-white rounded-full px-2 py-[3px] shadow text-[10px] font-normal whitespace-nowrap text-text-secondary" style={{ top: '74%', left: '50%' }}>
              Redden Family Real Est...
            </div>
          </div>

          {/* AI response text */}
          <div>
            <p className="text-[14px] font-light text-foreground leading-[22px]">
              Here are some of the top real estate agencies in Dubbo, Australia that specialise in residential property sales:
            </p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {RESPONSE_AGENCIES_FULL.map((agency, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-[9px] w-[5px] h-[5px] rounded-full bg-foreground flex-shrink-0" />
                  <span className="text-[14px] font-light leading-[22px]">
                    <span className="text-primary font-normal">{agency.name}</span>
                    <span className="text-foreground"> — {agency.description}</span>
                    {agency.badges.length > 0 && (
                      <span className="inline-flex items-center gap-1 ml-1.5">
                        {agency.badges.map((b, j) => (
                          <span key={j} className="text-[11px] font-light border border-border rounded px-1.5 py-0.5 text-muted-foreground leading-none">{b}</span>
                        ))}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <p className="text-[14px] font-light text-foreground leading-[22px]">If you want, I can also help with:</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {['Best agencies specifically for selling homes', 'Agencies with strongest online reviews', 'Boutique vs large franchise comparison', 'Top-performing agents in Dubbo', 'Agencies best for investment properties or first-home buyers', 'Sentiment analysis of customer reviews across these agencies'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-[9px] w-[5px] h-[5px] rounded-full bg-foreground flex-shrink-0" />
                    <span className="text-[14px] font-light text-foreground leading-[22px]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Citations */}
          <div className="border-t border-border pt-4">
            <p className="text-[12px] font-light text-muted-foreground text-center mb-4">Citations ({RESPONSE_CITATIONS.length})</p>
            <div className="flex flex-col gap-2">
              {RESPONSE_CITATIONS.map(c => (
                <div key={c.id} className="flex flex-col gap-1 rounded-lg bg-muted/50 px-2 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-normal text-white flex-shrink-0" style={{ backgroundColor: c.avatarBg }}>{c.initial}</span>
                    <span className="text-[14px] font-normal text-foreground">{c.name}</span>
                  </div>
                  <a href="#" className="text-[14px] font-normal text-primary hover:underline leading-[20px] pl-7">{c.link}</a>
                  <p className="text-[12px] font-light text-muted-foreground leading-[18px] pl-7">{c.snippet}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

// ── LLM responses card ─────────────────────────────────────────────────────────

function LLMResponsesCard({ rec }: { rec: Recommendation }) {
  const [activePlatform, setActivePlatform] = useState<EvidencePlatform>('ChatGPT')
  const [selectedRow, setSelectedRow] = useState<LLMResponseRow | null>(null)

  const query = rec.promptsTriggeringThis[0]
    ?? 'Find real estate agencies near me specialising in residential property sales'

  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden">
      {selectedRow && (
        <LLMResponseModal row={selectedRow} query={query} onClose={() => setSelectedRow(null)} />
      )}

      <div className="px-4 py-4">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[16px] font-normal text-foreground leading-[24px]">What were the AI sites&apos; responses to</span>
          <button type="button" className="inline-flex items-center gap-1 text-[16px] font-normal text-primary leading-[24px] hover:underline">
            {query}
            <ChevronDown size={14} strokeWidth={1.6} absoluteStrokeWidth className="flex-shrink-0" />
          </button>
        </div>
        <p className="text-[12px] font-light text-muted-foreground mt-0.5">
          To generate this recommendation, we ran these prompts across LLMs. Here are the responses each AI site returned.
        </p>
      </div>

      {/* Platform tabs */}
      <TextTabsRow<EvidencePlatform>
        items={LLM_EVIDENCE_PLATFORMS.map(platform => ({ id: platform, label: platform }))}
        value={activePlatform}
        onChange={setActivePlatform}
        className="px-4"
      />

      {/* Table */}
      <div className="overflow-x-auto px-4">
        {/* Header row */}
        <div className="flex items-center py-2 border-b border-border">
          <span className="text-[12px] font-light text-muted-foreground w-[110px] flex-shrink-0">Date</span>
          <span className="text-[12px] font-light text-muted-foreground w-[130px] flex-shrink-0">Location</span>
          <span className="text-[12px] font-light text-muted-foreground w-[90px] flex-shrink-0 flex items-center gap-1">
            Mention
            <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 flex items-center justify-center text-[9px] text-muted-foreground flex-shrink-0">i</span>
          </span>
          <span className="text-[12px] font-light text-muted-foreground w-[100px] flex-shrink-0">Position</span>
          <span className="text-[12px] font-light text-muted-foreground w-[160px] flex-shrink-0">All mentions</span>
          <span className="text-[12px] font-light text-muted-foreground flex-1 min-w-0">Response</span>
        </div>

        {MOCK_LLM_ROWS.map((row, i) => (
          <div
            key={i}
            className={cn('group/table-row flex items-center py-5', i > 0 && 'border-t border-border')}
          >
            <span className="text-[13px] text-foreground w-[110px] flex-shrink-0">{row.date}</span>
            <span className="text-[13px] text-foreground w-[130px] flex-shrink-0">{row.location}</span>
            <div className="w-[90px] flex-shrink-0">
              {row.mentioned
                ? <img src={`${B}assets/rec/check_circle.svg`} alt="mentioned" className="w-6 h-6" />
                : <img src={`${B}assets/rec/Component 75-2.svg`} alt="not mentioned" className="w-6 h-6" />
              }
            </div>
            <div className="w-[100px] flex-shrink-0">
              {row.position !== null
                ? (
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] text-foreground">{row.position}</span>
                    {row.positionDelta !== null && row.positionDelta > 0 && (
                      <span className="text-[12px] text-text-primary">+{row.positionDelta}</span>
                    )}
                  </div>
                )
                : <span className="text-[13px] text-muted-foreground">—</span>
              }
            </div>
            <div className="w-[160px] flex-shrink-0">
              {row.mentions.length > 0
                ? <MentionsWithPopover items={row.mentions} overflow={row.mentionsOverflow} />
                : <span className="text-[12px] text-muted-foreground">No mention</span>
              }
            </div>

            {/* Response cell — "View response" fades in on row hover */}
            <div className="flex-1 min-w-0 relative flex items-center overflow-hidden">
              <span className="text-[13px] text-foreground leading-[20px] truncate w-full">
                {row.response}
              </span>
              <div className="absolute inset-y-0 right-0 flex items-center opacity-0 group-hover/table-row:opacity-100 transition-opacity pointer-events-none group-hover/table-row:pointer-events-auto">
                <div className="w-16 h-full bg-gradient-to-r from-transparent to-background flex-shrink-0" />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-[34px] text-[13px] whitespace-nowrap flex-shrink-0"
                  onClick={() => setSelectedRow(row)}
                >
                  View response
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

interface RecDetailViewProps {
  rec: Recommendation
  metrics: BusinessMetrics
  onBack: () => void
  onAccept: (id: string) => void
  onReject?: (id: string) => void
  onNavigateToContentHub?: (questions: { question: string; answer: string }[]) => void
  onNavigateToBlogCanvas?: () => void
  onCompleteRec?: (id: string) => void
  onRevertToPending?: (id: string) => void
}

const REJECT_REASONS = [
  "The recommendation doesn't apply to the business",
  "Previously accepted a similar recommendation",
  "The suggestion is unlikely to meaningfully improve performance.",
  "The recommendation contains errors or could misinform customers.",
] as const

interface RejectConfirmDialogProps {
  onCancel: () => void
  onConfirm: () => void
}

export function RejectConfirmDialog({ onCancel, onConfirm }: RejectConfirmDialogProps) {
  const [checkedReasons, setCheckedReasons] = useState<Set<string>>(new Set())
  const [removePermanently, setRemovePermanently] = useState(false)

  const toggleReason = (reason: string) => {
    setCheckedReasons(prev => {
      const next = new Set(prev)
      next.has(reason) ? next.delete(reason) : next.add(reason)
      return next
    })
  }

  return (
    <Dialog open={true} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          onInteractOutside={onCancel}
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[616px] max-w-[calc(100vw-48px)] bg-background rounded-xl shadow-modal flex flex-col overflow-hidden focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <p className="text-[16px] text-foreground font-normal leading-[24px]">Reject recommendation?</p>
          <button
            onClick={onCancel}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-hover transition-colors"
          >
            <X size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-6 px-6 py-2">
          {/* Reasons */}
          <div className="flex flex-col gap-2">
            <p className="text-[16px] text-foreground font-normal leading-[24px]">Tell us what didn't work</p>
            <div className="flex flex-col gap-2">
              {REJECT_REASONS.map(reason => (
                <label key={reason} className="flex items-center gap-1 cursor-pointer">
                  <Checkbox
                    checked={checkedReasons.has(reason)}
                    onCheckedChange={() => toggleReason(reason)}
                  />
                  <span className="text-[14px] text-muted-foreground leading-[20px]">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Remove permanently */}
          <div className="flex flex-col gap-2">
            <p className="text-[14px] text-foreground leading-[20px]">
              Rejecting this recommendation will hide it from your list for 30 days.
            </p>
            <label className="flex items-center gap-1 cursor-pointer">
              <Checkbox
                checked={removePermanently}
                onCheckedChange={v => setRemovePermanently(!!v)}
              />
              <span className="text-[12px] text-muted-foreground leading-[18px]">Remove permanently</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 pt-3 pb-6">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>
            Reject
          </Button>
        </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

export function RecDetailView({
  rec, metrics, onBack, onAccept, onReject,
  onNavigateToContentHub, onNavigateToBlogCanvas,
  onCompleteRec, onRevertToPending,
}: RecDetailViewProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const isBlog = rec.category === 'Content' && !!rec.aeoScore
  const isFAQ  = rec.category === 'FAQ'

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {showRejectDialog && (
        <RejectConfirmDialog
          onCancel={() => setShowRejectDialog(false)}
          onConfirm={() => {
            setShowRejectDialog(false)
            if (onReject) onReject(rec.id)
            toast.error('Recommendation rejected', {
              duration: 5000,
              icon: <X size={20} strokeWidth={1.6} absoluteStrokeWidth className="text-destructive" />,
            })
          }}
        />
      )}
      {/* Sticky top block: header + tab bar */}
      <div className="sticky top-0 z-30 bg-background flex-shrink-0">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onBack}
              className="flex items-center justify-center size-[34px] rounded hover:bg-surface-hover/60 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <ArrowLeft size={16} strokeWidth={1.6} absoluteStrokeWidth />
            </button>
            <p className="text-[18px] text-foreground font-normal truncate">{rec.title}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {rec.status === 'pending' && (
              <>
                {onReject && (
                  <Button variant="outline" size="sm" onClick={() => setShowRejectDialog(true)}>
                    Reject
                  </Button>
                )}
                <Button size="sm" onClick={() => {
                  onAccept(rec.id)
                  toast.success('Recommendation accepted', {
                    duration: 5000,
                    icon: <CheckCircle2 size={20} strokeWidth={1.6} absoluteStrokeWidth className="text-text-primary" />,
                  })
                }}>
                  Accept
                </Button>
              </>
            )}

            {rec.status === 'accepted' && (
              <>
                {(isBlog || isFAQ) && (
                  <Button variant="outline" size="sm" onClick={() => {
                    if (isBlog && onNavigateToBlogCanvas) onNavigateToBlogCanvas()
                    else if (isFAQ && onNavigateToContentHub) onNavigateToContentHub([])
                  }}>
                    {isBlog ? 'Edit blog' : 'Edit FAQs'}
                  </Button>
                )}
                <Button size="sm" onClick={() => {
                  if (onCompleteRec) {
                    onCompleteRec(rec.id)
                    toast.success('Recommendation completed', {
                      duration: 5000,
                      icon: <CheckCircle2 size={20} strokeWidth={1.6} absoluteStrokeWidth className="text-text-primary" />,
                    })
                  }
                }}>
                  Mark as done
                </Button>
              </>
            )}

            {rec.status === 'rejected' && onRevertToPending && (
              <Button variant="outline" size="sm" onClick={() => onRevertToPending(rec.id)}>
                Revert to pending
              </Button>
            )}

            {/* Dropdown always visible */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical size={16} strokeWidth={1.6} absoluteStrokeWidth />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Download</DropdownMenuItem>
                <DropdownMenuItem>Email recommendation</DropdownMenuItem>
                {(rec.status === 'accepted' || rec.status === 'rejected') && (
                  <DropdownMenuItem onClick={() => onRevertToPending?.(rec.id)}>
                    Revert to pending
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

      </div>{/* end sticky top block */}

      {/* Body */}
      <div className="px-6 py-4 flex flex-col gap-4">
        {rec.category === 'FAQ' ? (
          <FAQDetail rec={rec} metrics={metrics} onNavigateToContentHub={onNavigateToContentHub} />
        ) : rec.category === 'Content' && rec.aeoScore ? (
          <ContentDetail rec={rec} metrics={metrics} onAccept={() => onAccept(rec.id)} onNavigateToBlogCanvas={onNavigateToBlogCanvas} />
        ) : (
          <GenericDetail rec={rec} metrics={metrics} />
        )}
        <div className="h-4 flex-shrink-0" />
      </div>
    </div>
  )
}
