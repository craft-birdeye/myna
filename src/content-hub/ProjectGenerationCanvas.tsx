/**
 * ProjectGenerationCanvas — shows ContentCard items appearing one by one
 * as AI generates them. Cards start in 'generating' state and transition
 * to 'ready' after a staggered delay.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  ContentCard,
  type ContentType,
  type ContentCardProps,
  DIMENSIONS_BY_TYPE,
} from './shared/ContentCard';
import { type ContentCardType } from './shared/GenericSkeletonCard';
import type { ProjectBrief } from './NewProjectBrief';

// ─── Mock content pool ────────────────────────────────────────────────────────

interface MockContent {
  primaryText: string;
  secondaryText: string;
  editorialScore: number;
  lowestDimension: string;
  secondaryScore?: number;
  status: 'ready' | 'needs-work';
  warnings: string[];
}

const MOCK_POOL: Record<ContentType, MockContent[]> = {
  faq: [
    { primaryText: 'How do I respond to a negative review on Google?', secondaryText: 'Respond within 24 hours, acknowledge the feedback, and offer a direct resolution. Avoid copy-paste replies—personalize each response.', editorialScore: 88, lowestDimension: 'Originality', secondaryScore: 74, status: 'ready', warnings: [] },
    { primaryText: 'Can I delete a Google review from my business page?', secondaryText: "Business owners cannot directly delete reviews. You can flag reviews that violate Google's policies and request removal.", editorialScore: 72, lowestDimension: 'Brand voice', secondaryScore: 61, status: 'needs-work', warnings: ['Brand voice mismatch'] },
    { primaryText: 'How do I claim my Google Business Profile?', secondaryText: 'Search for your business on Google Maps, click "Claim this business" and follow the verification steps via phone, email, or postcard.', editorialScore: 91, lowestDimension: 'Originality', secondaryScore: 82, status: 'ready', warnings: [] },
    { primaryText: 'What is an AEO score and why does it matter?', secondaryText: 'AEO (Answer Engine Optimization) score measures how well your content is structured for AI answer engines like Google SGE and ChatGPT. Higher scores mean more citations.', editorialScore: 85, lowestDimension: 'Content readability', secondaryScore: 78, status: 'ready', warnings: [] },
    { primaryText: 'How often should I ask customers for reviews?', secondaryText: 'Best practice is to request reviews within 24–48 hours of a positive interaction. Once per transaction is ideal — too many requests feel spammy.', editorialScore: 80, lowestDimension: 'Factual accuracy', secondaryScore: 68, status: 'ready', warnings: [] },
  ],
  social: [
    { primaryText: 'Your reputation is your strongest asset. See how top local businesses turn reviews into revenue.', secondaryText: '#ReputationManagement #LocalBusiness #CustomerExperience #Birdeye', editorialScore: 91, lowestDimension: 'Visual alignment', secondaryScore: 82, status: 'ready', warnings: [] },
    { primaryText: 'Spring is here. Your outdoor space shouldn\'t look like it\'s still in February. 🌸 Let\'s fix that.', secondaryText: '#SpringLandscaping #YardGoals #HomeImprovement', editorialScore: 78, lowestDimension: 'Engagement potential', secondaryScore: 65, status: 'needs-work', warnings: ['Hashtag count low'] },
    { primaryText: 'Proud to complete 50+ commercial landscaping projects this quarter. Eco-friendly design that enhances curb appeal.', secondaryText: '#CommercialLandscaping #Sustainability #PropertyManagement', editorialScore: 86, lowestDimension: 'Brand voice', secondaryScore: 74, status: 'ready', warnings: [] },
    { primaryText: 'Transform your outdoor space this season 🌿 Our design team is ready to bring your vision to life.', secondaryText: '#Landscaping #OutdoorLiving #GardenDesign #SustainableLandscaping', editorialScore: 89, lowestDimension: 'Visual alignment', secondaryScore: 79, status: 'ready', warnings: [] },
  ],
  email: [
    { primaryText: 'Your Q2 reputation report is ready — here\'s what changed', secondaryText: 'Hi {{first_name}}, your review volume is up 18% this quarter. See which locations are outperforming and where to improve.', editorialScore: 86, lowestDimension: 'Personalization', secondaryScore: 38, status: 'ready', warnings: [] },
    { primaryText: 'We miss you, {{first_name}} — come back to a greener yard', secondaryText: 'It\'s been 6 months since your last visit. We\'d love to help you get things looking their best. 15% off your first service back.', editorialScore: 72, lowestDimension: 'Subject strength', secondaryScore: 24, status: 'needs-work', warnings: ['Open rate below benchmark'] },
  ],
  blog: [
    { primaryText: 'How Local Businesses Are Winning With AI-Powered Review Responses', secondaryText: '93% of consumers read reviews before purchasing. Speed and quality of your responses can make or break your reputation. Learn how AI is helping.', editorialScore: 89, lowestDimension: 'SEO optimization', secondaryScore: 77, status: 'ready', warnings: [] },
    { primaryText: '5 Ways to Improve Your Google Maps Ranking in 2025', secondaryText: 'Google Maps ranking is determined by relevance, distance, and prominence. Here\'s how to optimize each factor for your local business.', editorialScore: 84, lowestDimension: 'Content depth', secondaryScore: 71, status: 'ready', warnings: [] },
  ],
  response: [
    { primaryText: 'Thank you for the kind words, Sarah!', secondaryText: 'We\'re so glad your experience at our downtown location was exceptional. Our team works hard every day to make each visit feel personal.', editorialScore: 93, lowestDimension: 'Empathy', status: 'ready', warnings: [] },
    { primaryText: 'We\'re sorry to hear about your experience, James.', secondaryText: 'This is not the standard we hold ourselves to. Please reach out at [email] so we can make this right — your feedback matters to us.', editorialScore: 88, lowestDimension: 'Tone appropriateness', status: 'ready', warnings: [] },
    { primaryText: 'Thank you for taking the time to leave a review!', secondaryText: 'We really appreciate your kind words about our team. It means a lot to know we made a difference during your visit.', editorialScore: 81, lowestDimension: 'Brand voice', status: 'ready', warnings: [] },
  ],
};

function getMockContent(type: ContentType, index: number): MockContent {
  const pool = MOCK_POOL[type] ?? MOCK_POOL.faq;
  return pool[index % pool.length];
}

function makeDimensions(type: ContentType, score: number) {
  const labels = DIMENSIONS_BY_TYPE[type];
  const offsets = [5, -3, 2, -4];
  return labels.map((label, i) => ({
    label,
    score: Math.min(100, Math.max(0, score + offsets[i])),
  }));
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const CARD_WIDTH  = 500;
const CARD_HEIGHT = 210; // rough per-card height for layout
const COL_GAP     = 32;
const ROW_GAP     = 24;
const ORIGIN_X    = 48;
const ORIGIN_Y    = 48;

const COUNT_PER_TYPE: Partial<Record<ContentCardType, number>> = {
  faq:      5,
  social:   4,
  email:    2,
  blog:     2,
  response: 3,
};

// ─── Card definition ──────────────────────────────────────────────────────────

interface CardDef {
  id: string;
  type: ContentType;
  index: number;
  position: { x: number; y: number };
  delay: number; // seconds before this card starts generating
}

function buildLayout(types: ContentCardType[]): CardDef[] {
  const cards: CardDef[] = [];
  const colHeights = [ORIGIN_Y, ORIGIN_Y];
  let globalIdx = 0;

  types.forEach((rawType) => {
    const type: ContentType = rawType === 'ads' ? 'social' : (rawType as ContentType);
    const count = COUNT_PER_TYPE[rawType] ?? 2;

    for (let i = 0; i < count; i++) {
      const col = colHeights[0] <= colHeights[1] ? 0 : 1;
      const x = ORIGIN_X + col * (CARD_WIDTH + COL_GAP);
      const y = colHeights[col];

      cards.push({ id: `${rawType}-${i}`, type, index: i, position: { x, y }, delay: globalIdx * 0.9 });
      colHeights[col] += CARD_HEIGHT + ROW_GAP;
      globalIdx++;
    }
  });

  return cards;
}

// ─── Card state ───────────────────────────────────────────────────────────────

type CardStatus = 'generating' | 'ready' | 'needs-work';

interface CardState {
  status: CardStatus;
  content?: MockContent;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProjectGenerationCanvasProps {
  brief: ProjectBrief;
  contentTypes: ContentCardType[];
  onAllComplete: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ProjectGenerationCanvas = ({
  brief,
  contentTypes,
  onAllComplete,
}: ProjectGenerationCanvasProps) => {
  const cards = React.useMemo(() => buildLayout(contentTypes), [contentTypes]);

  // Track per-card status: generating → ready/needs-work
  const [cardStates, setCardStates] = useState<Record<string, CardState>>(() =>
    Object.fromEntries(cards.map((c) => [c.id, { status: 'generating' }])),
  );

  const [completedCount, setCompletedCount] = useState(0);
  const totalCards = cards.length;
  const allDone = completedCount >= totalCards;

  // Stagger timers: each card flips to ready after its delay + 1.8s generation time
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    cards.forEach((card) => {
      const t = setTimeout(() => {
        const content = getMockContent(card.type, card.index);
        setCardStates((prev) => ({
          ...prev,
          [card.id]: { status: content.status, content },
        }));
        setCompletedCount((c) => {
          const next = c + 1;
          if (next >= cards.length) onAllComplete();
          return next;
        });
      }, (card.delay + 1.8) * 1000);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Canvas dimensions
  const canvasWidth  = ORIGIN_X * 2 + CARD_WIDTH * 2 + COL_GAP;
  const canvasHeight = Math.max(
    ...cards.map((c) => c.position.y + CARD_HEIGHT),
    600,
  ) + ORIGIN_Y;

  const noop = useCallback(() => {}, []);

  return (
    <div className="flex flex-col h-full w-full bg-muted/30">
      {/* Status bar */}
      <div className="flex-shrink-0 bg-background border-b border-border px-6 py-2 flex items-center gap-4">
        {!allDone ? (
          <>
            <Loader2 size={16} strokeWidth={1.6} absoluteStrokeWidth className="animate-spin text-primary flex-shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[13px] text-foreground">
                Generating content for "{brief.name}"
              </span>
              <span className="text-[11px] text-muted-foreground">
                {completedCount} of {totalCards} pieces complete · {brief.locations.length} location{brief.locations.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden flex-shrink-0">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: totalCards > 0 ? `${(completedCount / totalCards) * 100}%` : '0%' }}
              />
            </div>
          </>
        ) : (
          <span className="text-[13px] text-foreground">
            ✓ All {totalCards} pieces generated — reviewing now
          </span>
        )}
      </div>

      {/* Scrollable canvas */}
      <div className="flex-grow overflow-auto">
        <div style={{ position: 'relative', width: canvasWidth, height: canvasHeight, minWidth: '100%' }}>
          {cards.map((card) => {
            const state = cardStates[card.id] ?? { status: 'generating' as CardStatus };
            const content = state.content;
            const dims = content
              ? makeDimensions(card.type, content.editorialScore)
              : [];

            const cardProps: ContentCardProps = {
              contentId:       card.id,
              type:            card.type,
              primaryText:     content?.primaryText    ?? '',
              secondaryText:   content?.secondaryText  ?? '',
              editorialScore:  content?.editorialScore ?? 0,
              lowestDimension: content?.lowestDimension ?? '',
              secondaryScore:  content?.secondaryScore,
              dimensions:      dims,
              status:          state.status,
              warnings:        content?.warnings ?? [],
              hardBlock:       false,
              position:        card.position,
              selected:        false,
              onSelect:         noop,
              onEdit:           noop,
              onRegenerate:     noop,
              onSchedule:       noop,
              onExport:         noop,
              onComment:        noop,
              onHistory:        noop,
              onClone:          noop,
              onDelete:         noop,
              onPositionChange: noop,
            };

            return <ContentCard key={card.id} {...cardProps} />;
          })}
        </div>
      </div>
    </div>
  );
};
