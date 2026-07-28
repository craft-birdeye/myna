/**
 * ContentScoreInfoTooltip
 *
 * Rich "How is content score calculated?" tooltip matching Figma node 8893:5755.
 * Drop this anywhere a content score ⓘ icon appears.
 *
 * Usage:
 *   <ContentScoreInfoTooltip side="bottom" />
 */

import * as React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/contenthub-ui/tooltip';

const SIGNALS = [
  { label: 'Intent match',         weight: '30%' },
  { label: 'Search visibility',    weight: '25%' },
  { label: 'Content depth',        weight: '20%' },
  { label: 'Brand alignment',      weight: '15%' },
  { label: 'Publishing readiness', weight: '10%' },
] as const;

const RANGES = [
  { dot: '#4cae3d', bg: '#f1faf0', label: 'Good to publish', range: '85 – 100' },
  { dot: '#fbc123', bg: '#fff9ea', label: 'Needs review',    range: '70 – 84'  },
  { dot: '#de1b0c', bg: '#feeceb', label: 'Not ready',       range: '0 – 69'   },
] as const;

interface ContentScoreInfoTooltipProps {
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}

export function ContentScoreInfoTooltip({
  side = 'bottom',
  sideOffset = 8,
}: ContentScoreInfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="img"
          aria-label="How is content score calculated?"
          className="flex size-4 flex-shrink-0 cursor-default select-none items-center justify-center rounded-full border border-muted-foreground/40"
        >
          <span className="text-[10px] italic leading-none text-muted-foreground" style={{ fontFamily: 'serif' }}>i</span>
        </div>
      </TooltipTrigger>

      <TooltipContent
        side={side}
        sideOffset={sideOffset}
        className="w-[280px] rounded-[6px] border-0 bg-white p-3 text-[#212121] shadow-[0px_4px_8px_0px_rgba(33,33,33,0.18)] [&>svg]:hidden"
      >
        <div className="flex flex-col gap-3">

          {/* Title + description */}
          <div className="flex flex-col gap-1">
            <p className="text-[12px] leading-[18px] text-[#212121]">How is content score calculated?</p>
            <p className="text-[12px] leading-[18px] text-[#8f8f8f]">
              A weighted model across five quality signals. Each signal is scored independently and combined to reflect how optimized, on-brand, and publish-ready your content is.
            </p>
          </div>

          {/* Signal weights */}
          <div className="flex flex-col gap-2">
            {SIGNALS.map(({ label, weight }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[12px] leading-[18px] text-[#212121]">{label}</span>
                <span className="text-[12px] leading-[18px] text-[#212121]">{weight}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-[#e0e0e0]" />

          {/* Score ranges */}
          <div className="flex flex-col gap-2">
            {RANGES.map(({ dot, bg, label, range }) => (
              <div
                key={label}
                className="flex items-center justify-between px-2 py-2 rounded-sm"
                style={{ backgroundColor: bg }}
              >
                <div className="flex items-center gap-1">
                  <div
                    className="size-3 rounded-full border-2 border-white shrink-0"
                    style={{ backgroundColor: dot }}
                  />
                  <span className="text-[12px] leading-[18px] text-[#212121]">{label}</span>
                </div>
                <span className="text-[12px] leading-[18px] text-[#212121]">{range}</span>
              </div>
            ))}
          </div>

        </div>
      </TooltipContent>
    </Tooltip>
  );
}
