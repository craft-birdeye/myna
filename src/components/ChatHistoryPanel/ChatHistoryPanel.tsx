import { useRef, useState } from 'react'
import { Icon } from '../Icon/Icon'
import { useSubtleScrollbar } from '../../hooks/useSubtleScrollbar'
import { ChatHistoryPanelProps } from './ChatHistoryPanel.types'

export function ChatHistoryPanel({ title, items, selectedId, onSelect, onAllChats }: ChatHistoryPanelProps) {
  const [recentExpanded, setRecentExpanded] = useState(true)
  const navRef = useRef<HTMLElement | null>(null)
  useSubtleScrollbar(navRef)

  return (
    <aside className="flex h-full w-[222px] shrink-0 flex-col border-r border-border bg-surface-l2">
      <div className="flex h-[52px] shrink-0 flex-col justify-center px-2xl">
        <h1 className="text-h3 text-text-primary">{title}</h1>
      </div>

      <nav ref={navRef} className="scrollbar-subtle flex flex-1 flex-col gap-xs overflow-y-auto px-lg py-sm">
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={onAllChats}
            className="flex h-7 min-w-0 flex-1 items-center rounded-sm px-sm py-[6px] text-left transition-colors hover:bg-surface-selected"
          >
            <span className="min-w-0 flex-1 truncate text-body text-text-primary">New chat</span>
          </button>
          <button
            type="button"
            onClick={onAllChats}
            aria-label="New chat"
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover"
          >
            <Icon name="add" size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-xs">
          <button
            type="button"
            onClick={() => setRecentExpanded((e) => !e)}
            className="flex h-7 w-full items-center justify-between gap-sm rounded-sm px-sm py-[6px] hover:bg-surface-selected"
          >
            <span className="text-body text-text-primary">Recent chats</span>
            <Icon name={recentExpanded ? 'expand_less' : 'expand_more'} size={20} className="text-text-icon" />
          </button>

          {recentExpanded &&
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={item.id === selectedId ? 'page' : undefined}
                onClick={() => onSelect(item.id)}
                className={`flex h-7 w-full items-center gap-sm rounded-sm px-sm py-[6px] text-left transition-colors ${
                  item.id === selectedId ? 'bg-surface-selected' : 'hover:bg-surface-selected'
                }`}
              >
                <span className="min-w-0 flex-1 truncate text-body text-text-primary">{item.title}</span>
              </button>
            ))}
        </div>
      </nav>
    </aside>
  )
}
