import type { LibraryCardGlyph, LibraryCardTone } from '../LibraryCardIcon/LibraryCardIcon'

export interface InfoCardProps {
  title: string
  description: string
  /** Hover CTA label (revealed on hover). */
  actionLabel?: string
  onAction?: () => void
  /** Optional secondary hover CTA (e.g. Preview). */
  previewLabel?: string
  onPreview?: () => void
  /** Optional create-library icon chip (matches create-agent landing cards). */
  glyph?: LibraryCardGlyph
  tone?: LibraryCardTone
}

export interface InfoCardListItemProps {
  title: string
  description: string
  /** Menu CTA label (revealed via row-hover three-dot menu). */
  actionLabel?: string
  onAction?: () => void
  previewLabel?: string
  onPreview?: () => void
  /** Omit top border on the first row. */
  first?: boolean
}

/** Library card layout — fixed height. Hover: AI gradient border, clamp description, reveal CTAs. */
export const INFO_CARD_LAYOUT = {
  root: 'info-card-ai-border group flex h-[192px] min-w-0 flex-col overflow-hidden rounded-md border border-border bg-surface px-lg pb-lg pt-lg transition-[border-color,box-shadow,background-color] hover:border-transparent hover:bg-surface hover:shadow-dropdown',
  title: 'min-w-0 shrink-0 line-clamp-2 text-[16px] leading-6 tracking-[-0.32px] text-text-primary',
  description:
    'mt-sm min-w-0 flex-1 overflow-hidden text-body text-text-secondary group-hover:line-clamp-2',
  /** Collapsed when idle; expands on hover. mt-auto keeps the row at the bottom of the fixed card. */
  ctaShell: 'mt-auto grid grid-rows-[0fr] group-hover:grid-rows-[1fr]',
  ctaInner: 'min-h-0 overflow-hidden',
  ctaWrap: 'flex items-center gap-sm pt-sm',
  cta: 'flex h-9 flex-1 items-center justify-center rounded-sm bg-primary px-lg text-body text-white opacity-0 transition-opacity hover:bg-primary-hover group-hover:opacity-100',
  ctaSecondary:
    'flex h-9 flex-1 items-center justify-center rounded-sm border border-border-strong bg-surface px-lg text-body text-text-primary opacity-0 transition-opacity hover:bg-surface-l2 group-hover:opacity-100',
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
