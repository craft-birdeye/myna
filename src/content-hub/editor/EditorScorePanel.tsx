/**
 * EditorScorePanel
 *
 * Right-side slide-in panel that shows the content score detail for a card.
 * Hidden (zero-width) by default; slides in when `open` is true.
 *
 * Delegates all visual rendering to ContentScorePanel (canonical design).
 */

import React from 'react';
import { cn } from '@/contenthub-ui/utils';
import {
  ContentScorePanel,
  type ScoreDim,
} from '../shared/ContentScorePanel';
import type { EditorConfig } from './editorConfig';

// ── Props ─────────────────────────────────────────────────────────────────────

interface EditorScorePanelProps {
  open: boolean;
  onClose: () => void;
  config: EditorConfig;
  dimensions?: EditorConfig['scoreDimensions'];
  /** Final display score (0–100), owned by the parent */
  score: number;
  /** Called when an improvement item resolves — parent adds bump to score */
  onItemFixed?: (bump: number) => void;
  /** Called immediately when an item's action is clicked — triggers canvas shimmer */
  onItemFixing?: () => void;
  /** Called immediately when "Fix all" is clicked — triggers canvas shimmer */
  onFixAll?: () => void;
  /** Override the auto-derived score label */
  scoreLabel?: string;
  /** Max number of improvement items to show */
  maxImprovements?: number;
  /** Which fix copy to surface — FAQ-specific or blog-specific. Default 'faq'. */
  improvementSet?: 'faq' | 'blog';
  /** Content changed since last score calculation */
  isStale?: boolean;
  /** User clicked "Recalculate score" */
  onRecalculate?: () => void;
  /** Score recalculation animation is running */
  isRecalculating?: boolean;
  /** Blog is currently being fully regenerated */
  isRegenerating?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EditorScorePanel({
  open,
  onClose,
  config,
  dimensions,
  score,
  onItemFixed,
  onItemFixing,
  onFixAll,
  scoreLabel,
  maxImprovements,
  improvementSet,
  isStale,
  onRecalculate,
  isRecalculating,
  isRegenerating,
}: EditorScorePanelProps) {
  const dims: ScoreDim[] = (dimensions ?? config.scoreDimensions).map(d => ({
    label: d.label,
    score: d.score,
    weight: undefined,
    description: d.description,
  }));

  return (
    <div
      className={cn(
        'flex-none flex flex-col h-full transition-all duration-200 overflow-hidden',
        open ? 'w-[300px]' : 'w-0',
      )}
      aria-hidden={!open}
    >
      {/* Inner wrapper — fixed width so content doesn't squish during slide transition */}
      <div className="w-[300px] flex flex-col flex-1 min-h-0 rounded-xl border border-border/60 bg-background overflow-hidden">
        <ContentScorePanel
          score={score}
          scoreLabel={scoreLabel ?? config.label + ' score'}
          dimensions={dims}
          showClose
          onClose={onClose}
          onItemFixed={onItemFixed}
          onItemFixing={onItemFixing}
          onFixAll={onFixAll}
          maxImprovements={maxImprovements}
          improvementSet={improvementSet}
          isStale={isStale}
          onRecalculate={onRecalculate}
          isRecalculating={isRecalculating}
          isRegenerating={isRegenerating}
        />
      </div>
    </div>
  );
}
