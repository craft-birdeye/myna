import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { ChatHistorySideNavProps } from './ChatHistorySideNav.types'

export function ChatHistorySideNav({ title, chats, activeChatId, onSelectChat, onNewChat }: ChatHistorySideNavProps) {
  const [query, setQuery] = useState('')
  const [recentExpanded, setRecentExpanded] = useState(true)

  const filteredChats = chats.filter((chat) => chat.label.toLowerCase().includes(query.toLowerCase()))

  return (
    <aside className="flex h-full w-[222px] shrink-0 flex-col border-r border-border bg-surface-l2">
      <div className="flex h-[52px] shrink-0 items-center px-2xl">
        <h1 className="truncate text-h3 text-text-primary">{title}</h1>
      </div>

      <div className="flex h-9 shrink-0 items-center gap-sm px-2xl">
        <Icon name="search" size={20} className="shrink-0 text-text-icon" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chats"
          className="w-full bg-transparent text-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
        />
      </div>

      <nav className="flex flex-1 flex-col gap-xs overflow-y-auto px-lg py-sm">
        <div className="flex h-7 shrink-0 items-center justify-between px-sm">
          <span className="text-body text-text-primary">All chats</span>
          <button
            type="button"
            aria-label="New chat"
            onClick={onNewChat}
            className="flex size-6 items-center justify-center rounded-sm transition-all hover:bg-surface-hover active:scale-90"
          >
            <Icon name="add_circle" size={20} fill className="text-text-action" />
          </button>
        </div>

        <div className="flex flex-col gap-xs">
          <button
            type="button"
            onClick={() => setRecentExpanded((prev) => !prev)}
            className="flex h-7 w-full items-center justify-between gap-sm rounded-sm px-sm py-[6px] transition-colors hover:bg-surface-selected"
          >
            <span className="text-body text-text-primary">Recent chats</span>
            <Icon
              name="expand_more"
              size={20}
              className={`text-text-icon transition-transform duration-200 ${recentExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-out ${recentExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
          >
            <div className="flex min-h-0 flex-col gap-xs overflow-hidden">
              {filteredChats.map((chat, index) => (
                <button
                  key={chat.id}
                  type="button"
                  aria-current={chat.id === activeChatId ? 'page' : undefined}
                  onClick={() => onSelectChat?.(chat.id)}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className={`agent-build-fade flex h-7 w-full items-center gap-sm rounded-sm px-sm py-[6px] text-left transition-colors ${
                    chat.id === activeChatId ? 'bg-surface-selected' : 'hover:bg-surface-selected'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-body text-text-primary">{chat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </aside>
  )
}
