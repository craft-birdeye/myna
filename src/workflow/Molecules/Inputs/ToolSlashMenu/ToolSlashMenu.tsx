import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../../../../components/Icon/Icon'
import styles from './ToolSlashMenu.module.css'

/** Frontdesk agent tools for the slash `/` picker. */
export const SLASH_TOOLS = [
  {
    id: 'intent-identifier',
    name: 'Intent identifier',
    desc: 'Detects the caller\'s intent — such as booking, rescheduling, billing, or speaking to a person — so the agent can route the conversation correctly.',
    icon: 'build',
  },
  {
    id: 'transfer-call',
    name: 'Transfer_call',
    desc: 'Transfers the live call or chat to a human agent or department, optionally sharing a short summary of the conversation so far.',
    icon: 'build',
  },
  {
    id: 'agent-turn',
    name: 'agent_turn',
    desc: 'Hands the next speaking turn to the AI agent so it can continue the conversation, ask a follow-up, or deliver a response.',
    icon: 'build',
  },
  {
    id: 'initiate-voice-call',
    name: 'Initiate voice call',
    desc: 'Places an outbound voice call to the customer and continues based on whether the call is answered, rejected, missed, or goes to voicemail.',
    icon: 'build',
  },
  {
    id: 'end-conversation',
    name: 'End_conversation',
    desc: 'Ends the active conversation cleanly when the request is complete, the caller asks to hang up, or no further help is needed.',
    icon: 'build',
  },
]

export interface ToolSlashMenuTool {
  id: string
  name: string
  desc: string
  icon: string
}

interface ToolSlashMenuProps {
  open: boolean
  anchor: { top: number; left: number } | null
  onClose: () => void
  onSelect: (tool: ToolSlashMenuTool) => void
  tools?: ToolSlashMenuTool[]
}

export function ToolSlashMenu({
  open,
  anchor,
  onClose,
  onSelect,
  tools = SLASH_TOOLS,
}: ToolSlashMenuProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tools
    return tools.filter(
      (t) => t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q),
    )
  }, [tools, query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActiveIndex(0)
    const t = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || !anchor) return null

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const tool = filtered[activeIndex]
      if (tool) onSelect(tool)
    }
  }

  return createPortal(
    <div
      ref={rootRef}
      className={styles.menu}
      style={{ top: anchor.top, left: anchor.left }}
      role="listbox"
      aria-label="Tool"
      onKeyDown={handleKeyDown}
    >
      <div className={styles.header}>Tool</div>
      <div className={styles.search}>
        <Icon name="search" size={18} className={styles.searchIcon} />
        <input
          ref={searchRef}
          type="text"
          className={styles.searchInput}
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search tools"
        />
      </div>
      <div
        className={styles.list}
        onWheel={(e) => e.stopPropagation()}
      >
        {filtered.length === 0 ? (
          <p className={styles.empty}>No tools found</p>
        ) : (
          filtered.map((tool, i) => (
            <button
              key={tool.id}
              type="button"
              role="option"
              aria-selected={i === activeIndex}
              className={`${styles.item} ${i === activeIndex ? styles.itemActive : ''}`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => onSelect(tool)}
              title={tool.desc}
            >
              <Icon name={tool.icon} size={20} className={styles.itemIcon} />
              <span className={styles.itemText}>
                <span className={styles.itemName}>{tool.name}</span>
                <span className={styles.itemDesc}>{tool.desc}</span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>,
    document.body,
  )
}

/** Measure caret position for anchoring the slash menu. */
export function getCaretAnchor(editorEl: HTMLElement | null): { top: number; left: number } | null {
  if (!editorEl) return null
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) {
    const rect = editorEl.getBoundingClientRect()
    return { top: rect.top + 28, left: rect.left + 12 }
  }
  const range = sel.getRangeAt(0).cloneRange()
  range.collapse(true)
  let rect = range.getBoundingClientRect()
  if (!rect || (rect.top === 0 && rect.left === 0 && rect.width === 0)) {
    const marker = document.createElement('span')
    marker.textContent = '\u200b'
    range.insertNode(marker)
    rect = marker.getBoundingClientRect()
    marker.parentNode?.removeChild(marker)
    sel.removeAllRanges()
    sel.addRange(range)
  }
  return {
    top: rect.bottom + 6,
    left: rect.left,
  }
}
