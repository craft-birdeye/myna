import aiAgentSparkle from './ai-agent-sparkle.png'

const SIZE_CLASS: Record<number, string> = {
  14: 'size-3.5',
  16: 'size-4',
}

/** Sparkle mark for Myna/AI — beside "Myna" in the Recommendation tab and similar source labels.
 *  Source asset is 50×50; rendered at `size` (default 14×14) via a fixed box + object-contain. */
export function AiAgentIcon({ size = 14, className }: { size?: number; className?: string }) {
  const sizeClass = SIZE_CLASS[size]

  return (
    <span
      className={[
        'inline-block shrink-0 self-center overflow-hidden',
        sizeClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      <img src={aiAgentSparkle} alt="" className="size-full object-contain" />
    </span>
  )
}
