import { ChatBubble } from '../ChatBubble/ChatBubble'
import { Icon } from '../Icon/Icon'
import type { TranscriptSidePanelProps } from './TranscriptSidePanel.types'

/** Read-only slide-in panel showing a conversation's full transcript — opened from the "View
 *  Transcript" button on a "Reported conversation" block, matching `ProcedureSidePanel`'s own
 *  slide-in drawer convention. */
export function TranscriptSidePanel({ open, title = 'Transcript', lines, onClose }: TranscriptSidePanelProps) {
  return (
    <div className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-[560px] max-w-[92vw] flex-col bg-surface shadow-dropdown transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-sm border-b border-border px-2xl py-lg">
          <h2 className="min-w-0 truncate text-h3 text-text-primary">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2xl py-xl">
          <div className="flex flex-col gap-lg">
            {lines.map((line, i) => {
              const isAgent = line.speaker.toLowerCase().includes('myna')
              return (
                <ChatBubble key={i} sender={isAgent ? 'business' : 'user'} text={line.text}>
                  <span className="text-small text-text-tertiary">{line.speaker}</span>
                </ChatBubble>
              )
            })}
          </div>
        </div>
      </aside>
    </div>
  )
}
