import type { MessageTemplate, TemplateCategory, TemplateKind } from '../../data/messageTemplateLibrary'

export interface MessageTemplateModalProps {
  open: boolean
  /** Drives the title, search placeholder and which seeded library is shown. */
  kind: TemplateKind
  onClose: () => void
  /** Picking a row commits immediately — the popup has no footer. */
  onSelect: (template: MessageTemplate) => void
  /** Override the seeded library (defaults to `getTemplateLibrary(kind)`). */
  categories?: TemplateCategory[]
  templates?: MessageTemplate[]
}

/** Popup box, and the gap it keeps from the RHS panel / viewport edges. `height` is fixed
 *  rather than a max, so switching category doesn't resize the card around its row count. */
export const MESSAGE_TEMPLATE_POPUP = { width: 680, height: 420, gap: 16 } as const

/**
 * A floating popup rather than a lightbox: no dimmed backdrop and no blocking layer, so the
 * canvas stays visible and interactive behind it. It floats over the canvas, vertically
 * centred and right-aligned just clear of the node-config RHS it was opened from (measured
 * at runtime, since the panel's width and offset vary with the builder chrome), and stays
 * short — the row list scrolls inside a fixed card height rather than filling the viewport.
 */
export const MESSAGE_TEMPLATE_LAYOUT = {
  dialog:
    'fixed z-[10080] flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-modal',
  header: 'flex shrink-0 items-center justify-between gap-md px-lg py-md',
  title: 'flex items-center gap-sm text-body text-text-primary',
  search:
    'flex h-9 w-[240px] items-center gap-sm rounded-sm border border-border-selected bg-surface px-md focus-within:border-primary',
  searchInput: 'min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary',
  closeBtn: 'flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover',
  body: 'flex min-h-0 flex-1 border-t border-border',
  rail: 'w-[240px] shrink-0 overflow-y-auto border-r border-border p-sm',
  /** Selection is a filled rounded pill inset from the rail edges, with a chevron on every
   *  row — not a left bar / blue label. */
  railRow:
    'flex w-full items-center gap-sm rounded-sm px-md py-md text-left text-body text-text-primary hover:bg-surface-hover',
  railRowActive: 'bg-surface-selected hover:bg-surface-selected',
  railLabel: 'min-w-0 flex-1',
  railCount: 'shrink-0 text-body',
  list: 'min-h-0 flex-1 overflow-y-auto px-lg',
  row: 'flex w-full items-center gap-md border-b border-border py-md text-left last:border-0 hover:bg-surface-hover',
  /** Mini rendering of the message itself — deliberately below the type scale, so it reads
   *  as a shrunken preview of the sent text rather than copy. */
  thumb: 'h-[72px] w-[96px] shrink-0 overflow-hidden rounded-sm bg-surface-l2 p-xs',
  thumbText: 'text-[6px] leading-[8px] text-text-primary',
  rowTitle: 'truncate text-body text-text-primary',
  rowBody: 'mt-xs line-clamp-1 text-body text-text-secondary',
} as const
