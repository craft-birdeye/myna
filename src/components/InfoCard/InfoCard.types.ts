export interface InfoCardProps {
  title: string
  description: string
  /** Hover CTA label (revealed on hover). */
  actionLabel?: string
  onAction?: () => void
}

export interface InfoCardListItemProps {
  title: string
  description: string
  /** Menu CTA label (revealed via row-hover three-dot menu). */
  actionLabel?: string
  onAction?: () => void
  /** Omit top border on the first row. */
  first?: boolean
}

/** Library card layout — 16px padding, fixed 192px height. On hover: description clips to 2 lines to reveal the CTA without growing the card. */
export const INFO_CARD_LAYOUT = {
  root: 'group flex h-[192px] min-w-0 flex-col overflow-hidden rounded-md border border-border bg-surface p-lg transition-colors hover:bg-surface-hover',
  title: 'min-w-0 shrink-0 line-clamp-2 text-[16px] leading-6 tracking-[-0.32px] text-text-primary',
  description: 'mt-sm min-w-0 shrink-0 line-clamp-3 text-body text-text-secondary group-hover:line-clamp-2',
  ctaWrap: 'mt-auto shrink-0 pt-sm',
  cta: 'flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white opacity-0 transition-opacity hover:bg-primary-hover group-hover:opacity-100',
} as const

/** Library list row — 2-line description, three-dot menu on row hover. */
export const INFO_CARD_LIST_ITEM_LAYOUT = {
  row: 'group/row relative flex items-center gap-lg px-lg py-md transition-colors hover:bg-surface-hover',
  rowActive: 'bg-surface-hover',
  rowDivider: 'border-t border-border',
  body: 'min-w-0 flex-1',
  title: 'text-body text-text-primary',
  description: 'mt-xs line-clamp-2 text-body text-text-secondary',
  menuTrigger: 'flex size-7 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover',
  menu: 'absolute right-lg top-8 z-[110] min-w-[168px] rounded-sm border border-border bg-surface py-xs shadow-dropdown',
  menuItem: 'block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover',
} as const
