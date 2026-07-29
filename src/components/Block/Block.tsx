import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import type { BlockProps, BlockVariant } from './Block.types'

const BAR_VARIANT: Record<BlockVariant, string> = {
  neutral: 'bg-border',
  danger: 'bg-red-300',
  warning: 'bg-amber-300',
  success: 'bg-green-300',
  info: 'bg-blue-300',
}

/** A left-bar-quoted container for one "block" of the recommendation chat — Issue / Impact /
 *  Action needed, a testing result, a procedure change, etc. The bar's color signals what kind
 *  of block it is; the heading can optionally be collapsible. */
export function Block({
  heading,
  meta,
  variant = 'neutral',
  collapsible = false,
  defaultExpanded = true,
  children,
  className = '',
}: BlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const showBody = collapsible ? expanded : true

  return (
    <div className={`flex flex-col gap-xs ${className}`}>
      {heading &&
        (collapsible ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex w-fit items-center gap-xs text-body font-bold text-text-secondary"
          >
            <span>
              {heading}
              {meta && <span className="font-normal text-text-tertiary"> · {meta}</span>}
            </span>
            <Icon name={expanded ? 'expand_less' : 'expand_more'} size={16} className="text-text-icon" />
          </button>
        ) : (
          <p className="text-body font-bold text-text-secondary">
            {heading}
            {meta && <span className="font-normal text-text-tertiary"> · {meta}</span>}
          </p>
        ))}
      {showBody && children && (
        <div className="flex gap-md">
          <div className={`w-1 shrink-0 rounded-full ${BAR_VARIANT[variant]}`} />
          <div className="flex min-w-0 flex-1 flex-col gap-sm py-[2px]">{children}</div>
        </div>
      )}
    </div>
  )
}
