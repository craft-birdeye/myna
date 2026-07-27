import infoIconUrl from '../../assets/icon-info.svg'
import { Tooltip } from '../Tooltip/Tooltip'
import { TooltipVariant } from '../Tooltip/Tooltip.types'

interface InfoTooltipProps {
  text: string
  variant?: TooltipVariant
}

export function InfoTooltip({ text, variant = 'detail' }: InfoTooltipProps) {
  return (
    <Tooltip content={text} variant={variant}>
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
