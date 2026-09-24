import aiAvatarChatSparkle from './ai-avatar-chat-sparkle.png'

const SIZE_CLASS: Record<number, string> = {
  16: 'size-4',
  20: 'size-5',
  24: 'size-6',
}

/** Circular Myna avatar (light-purple disc + sparkle) beside agent chat messages.
 *  Source asset is 50×50; rendered at `size` (default 24×24) via a fixed box + object-contain. */
export function AiAvatarChatIcon({ size = 24, className }: { size?: number; className?: string }) {
  const sizeClass = SIZE_CLASS[size]

  return (
    <span
      className={[
        'inline-block shrink-0 self-start overflow-hidden',
        sizeClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      <img src={aiAvatarChatSparkle} alt="" className="size-full object-contain" />
    </span>
  )
}
