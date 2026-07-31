export interface ChatHistoryItem {
  id: string
  label: string
}

export interface ChatHistorySideNavProps {
  title: string
  chats: ChatHistoryItem[]
  activeChatId?: string
  onSelectChat?: (id: string) => void
  onNewChat?: () => void
}
