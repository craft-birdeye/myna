import { Icon } from '../Icon/Icon'
import { WorkflowViewerTab } from '../../screens/WorkflowViewerTab'
import { WorkflowPreviewPanelProps } from './WorkflowPreviewPanel.types'

const ICON_BUTTON = 'flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover hover:text-text-primary'

export function WorkflowPreviewPanel({ agentName, product, expanded, onExpand, onClose }: WorkflowPreviewPanelProps) {
  const title = `${agentName} workflow`

  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-l border-border bg-surface">
      <div className="flex shrink-0 items-center justify-between gap-sm bg-surface px-lg py-[18px]">
        <div className="flex min-w-0 items-center gap-sm">
          <button type="button" aria-label="Back" onClick={onClose} className={ICON_BUTTON}>
            <Icon name="arrow_back" size={20} />
          </button>
          <h3 className="truncate text-body text-text-primary">{title}</h3>
        </div>
        <div className="flex items-center gap-xs">
          {onExpand && (
            <button type="button" aria-label={expanded ? 'Collapse' : 'Expand'} onClick={onExpand} className={ICON_BUTTON}>
              <Icon name={expanded ? 'close_fullscreen' : 'open_in_full'} size={20} />
            </button>
          )}
          <button type="button" aria-label="Close workflow preview" onClick={onClose} className={ICON_BUTTON}>
            <Icon name="close" size={20} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <WorkflowViewerTab instanceName={agentName} product={product} onEdit={() => {}} />
      </div>
    </div>
  )
}
