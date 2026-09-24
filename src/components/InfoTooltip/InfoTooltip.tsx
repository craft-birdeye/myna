import infoIconUrl from '../../assets/icon-info.svg'
import { Tooltip } from '../Tooltip/Tooltip'
import { TooltipVariant } from '../Tooltip/Tooltip.types'

interface InfoTooltipProps {
  text: string
  variant?: TooltipVariant
  /** When set, shows a “Learn more” link under the copy (interactive so the link is clickable). */
  learnMoreHref?: string
  /** Prefer over href — opens in-app help (e.g. glossary) instead of an external page. */
  onLearnMore?: () => void
  learnMoreLabel?: string
}

export function InfoTooltip({
  text,
  variant = 'detail',
  learnMoreHref,
  onLearnMore,
  learnMoreLabel = 'Learn more',
}: InfoTooltipProps) {
  const showLearnMore = Boolean(onLearnMore || learnMoreHref)
  const content = showLearnMore ? (
    <span className="flex flex-col gap-xs">
      <span>{text}</span>
      {onLearnMore ? (
        <button
          type="button"
          className="m-0 cursor-pointer border-0 bg-transparent p-0 text-left text-white underline-offset-2 hover:underline"
          onClick={(e) => {
            e.stopPropagation()
            onLearnMore()
          }}
        >
          {learnMoreLabel}
        </button>
      ) : (
        <a
          href={learnMoreHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white no-underline hover:text-white hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {learnMoreLabel}
        </a>
      )}
    </span>
  ) : (
    text
  )

  return (
    <Tooltip content={content} variant={variant} interactive={showLearnMore}>
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
