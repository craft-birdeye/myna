/** Aero outline icons for message feedback / copy — stroke-based, currentColor. */

const strokeProps = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function ThumbUpIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        {...strokeProps}
        d="M7 11v10H4.5A1.5 1.5 0 0 1 3 19.5v-7A1.5 1.5 0 0 1 4.5 11H7Z"
      />
      <path
        {...strokeProps}
        d="M7 11l3.2-6.4A2.2 2.2 0 0 1 12.2 3.4c1.1.2 1.8 1.3 1.5 2.3L13 9h5.6a2.4 2.4 0 0 1 2.3 3l-1.8 7.2A2.2 2.2 0 0 1 17 21H7"
      />
    </svg>
  )
}

export function ThumbDownIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        {...strokeProps}
        d="M17 13V3h2.5A1.5 1.5 0 0 1 21 4.5v7A1.5 1.5 0 0 1 19.5 13H17Z"
      />
      <path
        {...strokeProps}
        d="M17 13l-3.2 6.4a2.2 2.2 0 0 1-2 1.2c-1.1-.2-1.8-1.3-1.5-2.3L11 15H5.4a2.4 2.4 0 0 1-2.3-3l1.8-7.2A2.2 2.2 0 0 1 7 3h10"
      />
    </svg>
  )
}

export function ContentCopyIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Back sheet */}
      <path
        {...strokeProps}
        d="M8 7.5V5.2C8 4.5 8.5 4 9.2 4h7.3c.3 0 .5.1.7.3l2.5 2.5c.2.2.3.4.3.7v9.3c0 .7-.5 1.2-1.2 1.2H16"
      />
      {/* Front sheet */}
      <path
        {...strokeProps}
        d="M5.2 8h7.6c.7 0 1.2.5 1.2 1.2v9.6c0 .7-.5 1.2-1.2 1.2H5.2c-.7 0-1.2-.5-1.2-1.2V9.2c0-.7.5-1.2 1.2-1.2Z"
      />
    </svg>
  )
}

export function CheckIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path {...strokeProps} d="M5 12.5 9.5 17 19 7.5" />
    </svg>
  )
}
