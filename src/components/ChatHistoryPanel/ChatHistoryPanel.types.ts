export interface ChatHistoryItem {
  id: string
  title: string
  prompt?: string
}

export interface ChatHistoryPanelProps {
  title: string
  items: ChatHistoryItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAllChats: () => void
}
