import infoIconUrl from '../../assets/icon-info.svg'
import { Tooltip } from '../Tooltip/Tooltip'
import { TooltipVariant } from '../Tooltip/Tooltip.types'

interface InfoTooltipProps {
  text: string
  variant?: TooltipVariant
  /** When set, shows a “Learn more” link under the copy (interactive so the link is clickable). */
  learnMoreHref?: string
  learnMoreLabel?: string
}

export function InfoTooltip({
  text,
  variant = 'detail',
  learnMoreHref,
  learnMoreLabel = 'Learn more',
}: InfoTooltipProps) {
  const content = learnMoreHref ? (
    <span className="flex flex-col gap-xs">
      <span>{text}</span>
      <a
        href={learnMoreHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-white no-underline hover:text-white hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {learnMoreLabel}
      </a>
    </span>
  ) : (
    text
  )

  return (
    <Tooltip content={content} variant={variant} interactive={Boolean(learnMoreHref)}>
      <button
        type="button"
        className="flex items-center justify-center text-text-tertiary hover:text-text-secondary"
        aria-label="More info"
      >
        <img src={infoIconUrl} alt="" width={16} height={16} className="opacity-40 hover:opacity-60" />
      </button>
    </Tooltip>
  )
}
