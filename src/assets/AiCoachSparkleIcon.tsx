import iconAgentsTwoStarSparkle from './icon-agents-two-star-sparkle.svg'

const SIZE_CLASS: Record<number, string> = {
  12: 'size-3',
  14: 'size-3.5',
  16: 'size-4',
}

/** Two-star sparkle mask — color inherits from parent (Coach agent link, summary card, etc.). */
export function AiCoachSparkleIcon({ size = 12, className }: { size?: number; className?: string }) {
  const sizeClass = SIZE_CLASS[size]

  return (
    <span
      className={['ai-flat-sparkle-icon', sizeClass, className].filter(Boolean).join(' ')}
      style={{
        WebkitMaskImage: `url("${iconAgentsTwoStarSparkle}")`,
        maskImage: `url("${iconAgentsTwoStarSparkle}")`,
      }}
      aria-hidden
    />
  )
}
