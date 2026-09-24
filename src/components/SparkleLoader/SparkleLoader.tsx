/**
 * Animated gradient "AI" sparkle. When `spinning`, it rotates + pulses as a loading indicator
 * while the agent composes a response; otherwise it rests. Sits inside the `bg-ai-summary`
 * avatar disc beside every agent turn in the create-flow chats.
 */
export function SparkleLoader({
  size = 18,
  spinning = true,
  className,
}: {
  size?: number
  spinning?: boolean
  className?: string
}) {
  return (
    <span
      className={`sparkle-loader ${spinning ? 'is-spinning' : ''} ${className ?? ''}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <defs>
          <linearGradient id="sparkle-loader-grad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9b6cf0" />
            <stop offset="55%" stopColor="#6834b7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path
          d="M12 2 Q12 12 22 12 Q12 12 12 22 Q12 12 2 12 Q12 12 12 2 Z"
          fill="url(#sparkle-loader-grad)"
        />
      </svg>
    </span>
  )
}
