import { cn } from '@/lib/utils'
import { Zap, Lightbulb, MapPin, TrendingUp } from 'lucide-react'
import { Button } from '@/contenthub-ui/button'
import type { Recommendation } from './recTypes'

// ── Effort chip ───────────────────────────────────────────────────────────────

function QuickWinChip() {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] leading-[18px] whitespace-nowrap font-normal text-text-secondary">
      <Zap size={12} strokeWidth={1.6} absoluteStrokeWidth className="flex-shrink-0" />
      Quick win
    </span>
  )
}

function BiggerLiftChip() {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] leading-[18px] whitespace-nowrap font-normal text-orange-600">
      <Lightbulb size={12} strokeWidth={1.6} absoluteStrokeWidth className="flex-shrink-0" />
      Bigger lift
    </span>
  )
}

function EffortChip({ effort }: { effort: Recommendation['effort'] }) {
  if (effort === 'Quick win') return <QuickWinChip />
  if (effort === 'Bigger lift') return <BiggerLiftChip />
  return null
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface RecListCardProps {
  rec: Recommendation
  onSelect: (id: string) => void
  onReject: (id: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RecListCard({ rec, onSelect, onReject }: RecListCardProps) {
  const locationCount = rec.locations ?? 1

  return (
    <div
      onClick={() => onSelect(rec.id)}
      className="border-b border-border px-8 py-5 cursor-pointer hover:bg-surface-hover transition-colors"
    >
      {/* Row 1: chips (left) + locations (right) */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-[11px] leading-[16px] whitespace-nowrap">
            {rec.category}
          </span>
          <EffortChip effort={rec.effort} />
        </div>

        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <MapPin size={12} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground flex-shrink-0" />
          <span className="text-[12px] text-muted-foreground leading-[18px] whitespace-nowrap">
            {locationCount} location{locationCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Row 2: title */}
      <p className="text-[14px] text-foreground leading-[22px] font-normal mb-1">
        {rec.title}
      </p>

      {/* Row 3: description in impact box */}
      <div className={cn(
        'flex items-start gap-2 rounded-md px-2 py-2 mt-4 mb-4',
        'bg-primary/5',
      )}>
        <TrendingUp size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-foreground flex-shrink-0 mt-0.5" />
        <span className="text-[13px] text-muted-foreground leading-[18px]">
          {rec.description}
        </span>
      </div>

      {/* Row 4: CTAs */}
      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
        <Button
          variant="outline"
          onClick={() => onSelect(rec.id)}
        >
          View details
        </Button>
        <Button
          variant="outline"
          onClick={() => onReject(rec.id)}
        >
          Reject
        </Button>
      </div>
    </div>
  )
}
