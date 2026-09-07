import { INFO_CARD_LAYOUT, INFO_CARD_LAYOUT_COMPACT } from './InfoCard.types'
import type { InfoCardProps } from './InfoCard.types'
import { LibraryCardIcon } from '../LibraryCardIcon/LibraryCardIcon'
import { Chip } from '../Chip/Chip'

export function InfoCard({
  title,
  description,
  actionLabel = 'Use agent',
  onAction,
  previewLabel = 'Preview',
  onPreview,
  glyph,
  tone,
  chipLabel,
  chipVariant,
  compact = false,
}: InfoCardProps) {
  const layout = compact ? INFO_CARD_LAYOUT_COMPACT : INFO_CARD_LAYOUT
  return (
    <div className={layout.root}>
      {glyph ? (
        <div className="flex min-w-0 items-center gap-md">
          <LibraryCardIcon glyph={glyph} tone={tone} />
          <h3
            className={
              compact
                ? 'min-w-0 flex-1 line-clamp-2 text-body leading-[22px] tracking-[-0.28px] text-text-primary'
                : 'min-w-0 flex-1 text-body leading-[22px] tracking-[-0.28px] text-text-primary'
            }
          >
            {title}
          </h3>
        </div>
      ) : (
        <h3 className={layout.title}>{title}</h3>
      )}
      <p className={layout.description}>{description}</p>
      {compact ? (
        <div className={INFO_CARD_LAYOUT_COMPACT.bottomSlot}>
          {chipLabel ? (
            <div className={INFO_CARD_LAYOUT_COMPACT.chip}>
              <Chip label={chipLabel} variant={chipVariant} />
            </div>
          ) : null}
          <div className={INFO_CARD_LAYOUT_COMPACT.ctaWrap}>
            {onPreview && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview()
                }}
                className={INFO_CARD_LAYOUT_COMPACT.ctaSecondary}
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
              className={INFO_CARD_LAYOUT_COMPACT.cta}
            >
              {actionLabel}
            </button>
          </div>
        </div>
      ) : (
        <div className={INFO_CARD_LAYOUT.bottomShell}>
          {chipLabel ? (
            <div className={INFO_CARD_LAYOUT.chip}>
              <Chip label={chipLabel} variant={chipVariant} />
            </div>
          ) : null}
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
      )}
    </div>
  )
}
