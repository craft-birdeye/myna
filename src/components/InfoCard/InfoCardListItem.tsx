import { useState } from 'react'
import { MoreVertical } from 'lucide-react'
import { INFO_CARD_LIST_ITEM_LAYOUT } from './InfoCard.types'
import type { InfoCardListItemProps } from './InfoCard.types'

export function InfoCardListItem({
  title,
  description,
  actionLabel = 'Use agent',
  onAction,
  first = false,
}: InfoCardListItemProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className={`${INFO_CARD_LIST_ITEM_LAYOUT.row} ${menuOpen ? INFO_CARD_LIST_ITEM_LAYOUT.rowActive : ''} ${
        first ? '' : INFO_CARD_LIST_ITEM_LAYOUT.rowDivider
      }`}
    >
      <div className={INFO_CARD_LIST_ITEM_LAYOUT.body}>
        <h3 className={INFO_CARD_LIST_ITEM_LAYOUT.title}>{title}</h3>
        <p className={INFO_CARD_LIST_ITEM_LAYOUT.description}>{description}</p>
      </div>

      <div className={`relative shrink-0 ${menuOpen ? 'flex' : 'hidden group-hover/row:flex'}`}>
        <button
          type="button"
          aria-label="More actions"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((open) => !open)
          }}
          className={INFO_CARD_LIST_ITEM_LAYOUT.menuTrigger}
        >
          <MoreVertical className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-[105]" onClick={() => setMenuOpen(false)} />
            <div className={INFO_CARD_LIST_ITEM_LAYOUT.menu}>
              <button
                type="button"
                onClick={() => {
                  onAction?.()
                  setMenuOpen(false)
                }}
                className={INFO_CARD_LIST_ITEM_LAYOUT.menuItem}
              >
                {actionLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
