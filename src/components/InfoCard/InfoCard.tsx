import { INFO_CARD_LAYOUT } from './InfoCard.types'
import type { InfoCardProps } from './InfoCard.types'
import { LibraryCardIcon } from '../LibraryCardIcon/LibraryCardIcon'

export function InfoCard({
  title,
  description,
  actionLabel = 'Use agent',
  onAction,
  previewLabel = 'Preview',
  onPreview,
  glyph,
  tone,
}: InfoCardProps) {
  return (
    <div className={INFO_CARD_LAYOUT.root}>
      {glyph ? (
        <div className="flex min-w-0 items-center gap-md">
          <LibraryCardIcon glyph={glyph} tone={tone} />
          <h3 className="min-w-0 flex-1 text-body leading-[22px] tracking-[-0.28px] text-text-primary">{title}</h3>
        </div>
      ) : (
        <h3 className={INFO_CARD_LAYOUT.title}>{title}</h3>
      )}
      <p className={INFO_CARD_LAYOUT.description}>{description}</p>
      <div className={INFO_CARD_LAYOUT.ctaShell}>
        <div className={INFO_CARD_LAYOUT.ctaInner}>
          <div className={INFO_CARD_LAYOUT.ctaWrap}>
            {onPreview && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview()
                }}
                className={INFO_CARD_LAYOUT.ctaSecondary}
              >
                {previewLabel}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onAction?.()
              }}
              className={INFO_CARD_LAYOUT.cta}
            >
              {actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
