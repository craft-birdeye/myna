import { useEffect, useMemo, useState, type ReactNode } from 'react'
import iconPlay from '../../assets/help-center/play.svg'
import iconFileText from '../../assets/help-center/file-text.svg'
import iconGlossary from '../../assets/help-center/glossary.svg'
import iconConstruction from '../../assets/help-center/construction.svg'
import iconFeedback from '../../assets/help-center/feedback.svg'
import { Icon } from '../Icon/Icon'
import { ShareFeedbackModal } from '../ShareFeedbackModal/ShareFeedbackModal'
import { Toast } from '../Toast/Toast'
import { HelpVideoModal } from './HelpVideoModal'
import {
  HELP_ARTICLES,
  HELP_VIDEOS,
  type HelpCenterPanelProps,
  type HelpCenterView,
  type HelpVideoItem,
} from './HelpCenterPanel.types'

const VIEW_TITLE: Record<HelpCenterView, string> = {
  home: 'Help center',
  videos: 'Video tutorials',
  articles: 'Support articles',
}

function SearchField({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex h-9 items-center gap-sm rounded-md border border-border-input bg-surface-icon px-md">
      <Icon name="search" size={18} className="shrink-0 text-text-icon" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search"
        className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
      />
    </label>
  )
}

/**
 * Workflow-canvas Help center — Figma Agent ARC `15865:4049` home hub plus
 * nested Video tutorials / Support articles lists; Glossary opens the
 * `15988:11969` popup.
 */
export function HelpCenterPanel({
  open,
  onClose,
  onStartTour,
  onOpenGlossary,
  onOpenUxImprovementSettings,
}: HelpCenterPanelProps) {
  const [view, setView] = useState<HelpCenterView>('home')
  const [query, setQuery] = useState('')
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackToastVisible, setFeedbackToastVisible] = useState(false)
  const [activeVideo, setActiveVideo] = useState<HelpVideoItem | null>(null)

  useEffect(() => {
    if (open) {
      setView('home')
      setQuery('')
      setFeedbackOpen(false)
      setActiveVideo(null)
    }
  }, [open])

  const q = query.trim().toLowerCase()

  const videos = useMemo(
    () =>
      HELP_VIDEOS.filter(
        (v) =>
          !q ||
          v.title.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q),
      ),
    [q],
  )

  const articles = useMemo(
    () =>
      HELP_ARTICLES.filter(
        (a) =>
          !q ||
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q),
      ),
    [q],
  )

  if (!open) return null

  function goHome() {
    setView('home')
    setQuery('')
  }

  return (
    <>
      <aside
        className="flex h-full w-full flex-col overflow-hidden rounded-md border border-border bg-surface"
        style={{ boxShadow: '0 2px 12px 1px rgba(33, 33, 33, 0.06)' }}
        role="dialog"
        aria-modal="false"
        aria-labelledby="help-center-title"
      >
        <header className="shrink-0 px-xl pt-2xl">
          <div className="flex h-9 items-center gap-sm">
            {view !== 'home' && (
              <button
                type="button"
                aria-label="Back"
                onClick={goHome}
                className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              >
                <Icon name="arrow_back" size={20} />
              </button>
            )}
            <h2
              id="help-center-title"
              className="m-0 min-w-0 flex-1 truncate text-[16px] leading-[22px] tracking-[-0.32px] text-text-primary"
            >
              {VIEW_TITLE[view]}
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </header>

        {view === 'home' ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-auto px-xl pb-xl pt-xl">
            <div className="flex flex-col gap-md">
              <NavCard
                iconSrc={iconPlay}
                iconSize={20}
                title="Video tutorials"
                description="Learn how to use Workflow Builder through step-by-step video tutorials."
                onClick={() => setView('videos')}
              />
              <NavCard
                iconSrc={iconFileText}
                iconSize={20}
                title="Support articles"
                description="Find detailed articles and guides to help you get started."
                onClick={() => setView('articles')}
              />
              <NavCard
                iconSrc={iconGlossary}
                iconSize={20}
                title="Glossary"
                description="Explore definitions and explanations for terms used across agent builder."
                showChevron={false}
                onClick={() => onOpenGlossary?.()}
              />
              <ActionCard
                iconSrc={iconConstruction}
                iconSize={18}
                title="Agent builder basics"
                description="Learn how to navigate the builder and create your first workflow."
                actionLabel="Start tour"
                onAction={() => onStartTour?.('workflow-basics')}
              />
              <ActionCard
                iconSrc={iconFeedback}
                iconSize={18}
                title="Share feedback"
                description="Tell us what's working and what we can improve."
                onClick={() => setFeedbackOpen(true)}
              />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col px-xl pb-xl pt-xl">
            <SearchField value={query} onChange={setQuery} />

            <div className="mt-lg min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
              {view === 'videos' && (
                <ul className="m-0 flex list-none flex-col gap-0 p-0">
                  {videos.length === 0 ? (
                    <li className="py-2xl text-center text-body text-text-tertiary">
                      No videos match your search.
                    </li>
                  ) : (
                    videos.map((video, i) => (
                      <li key={video.id}>
                        <button
                          type="button"
                          onClick={() => setActiveVideo(video)}
                          className={`group flex w-full items-start gap-md py-lg pr-sm text-left hover:bg-surface-hover ${
                            i > 0 ? 'border-t border-border' : ''
                          }`}
                        >
                          <VideoThumbnail src={video.thumbnail} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-body text-text-primary transition-colors group-hover:text-primary">
                              {video.title}
                            </span>
                            <span className="mt-xs block text-small text-text-secondary">
                              {video.description}
                            </span>
                          </span>
                          <span className="mt-xs shrink-0 text-small text-text-tertiary">
                            {video.duration}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}

              {view === 'articles' && (
                <ul className="m-0 flex list-none flex-col gap-0 p-0">
                  {articles.length === 0 ? (
                    <li className="py-2xl text-center text-body text-text-tertiary">
                      No articles match your search.
                    </li>
                  ) : (
                    articles.map((article, i) => (
                      <li key={article.id}>
                        <button
                          type="button"
                          className={`group flex w-full items-start gap-md py-lg pr-sm text-left hover:bg-surface-hover ${
                            i > 0 ? 'border-t border-border' : ''
                          }`}
                        >
                          <span className="inline-flex size-9 shrink-0 aspect-square items-center justify-center self-start overflow-hidden rounded-[8px] bg-[#eef2f6]">
                            <TokenIcon src={iconFileText} size={20} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-body text-text-primary transition-colors group-hover:text-primary">
                              {article.title}
                            </span>
                            <span className="mt-xs block text-small text-text-secondary">
                              {article.description}
                            </span>
                          </span>
                          <Icon
                            name="open_in_new"
                            size={18}
                            className="mt-xs shrink-0 text-text-secondary"
                          />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
        )}
      </aside>

      <ShareFeedbackModal
        open={feedbackOpen}
        variant="help"
        onClose={() => setFeedbackOpen(false)}
        onSubmit={() => {
          setFeedbackOpen(false)
          setFeedbackToastVisible(true)
        }}
        onOpenUxImprovementSettings={onOpenUxImprovementSettings}
      />

      <Toast
        message="Appreciate it! Thanks for the feedback!"
        visible={feedbackToastVisible}
        onClose={() => setFeedbackToastVisible(false)}
      />

      <HelpVideoModal
        open={activeVideo != null}
        title={activeVideo?.title ?? ''}
        onClose={() => setActiveVideo(null)}
      />
    </>
  )
}

function TokenIcon({ src, size = 20 }: { src: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="block shrink-0 bg-text-icon"
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  )
}

function VideoThumbnail({ src }: { src: string }) {
  return (
    <span className="relative block h-[45px] w-20 shrink-0 self-start overflow-hidden rounded-[8px] bg-[#eef2f6]">
      <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      <span className="absolute inset-0 bg-black/15" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/90">
          <TokenIcon src={iconPlay} size={12} />
        </span>
      </span>
    </span>
  )
}

function CardGlyph({ src, size }: { src: string; size: number }) {
  return (
    <span
      className="inline-flex size-10 shrink-0 aspect-square items-center justify-center self-start overflow-hidden rounded-[8px] bg-[#eef2f6]"
      aria-hidden="true"
    >
      <TokenIcon src={src} size={size} />
    </span>
  )
}

function NavCard({
  iconSrc,
  iconSize = 20,
  title,
  description,
  showChevron = true,
  onClick,
}: {
  iconSrc: string
  iconSize?: number
  title: string
  description: string
  showChevron?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-md rounded-sm border border-border bg-surface px-md py-md text-left hover:bg-surface-hover"
    >
      <CardGlyph src={iconSrc} size={iconSize} />
      <span className="min-w-0 flex-1">
        <span className="block text-body text-text-primary">{title}</span>
        <span className="mt-xs block text-small text-text-secondary">{description}</span>
      </span>
      {showChevron ? (
        <Icon name="chevron_right" size={16} className="shrink-0 text-text-icon" />
      ) : null}
    </button>
  )
}

function ActionCard({
  iconSrc,
  iconSize = 18,
  title,
  description,
  actionLabel,
  onAction,
  onClick,
}: {
  iconSrc: string
  iconSize?: number
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  onClick?: () => void
}) {
  const content: ReactNode = (
    <>
      <CardGlyph src={iconSrc} size={iconSize} />
      <span className="min-w-0 flex-1">
        <span className="block text-body text-text-primary">{title}</span>
        <span className="mt-xs block text-small text-text-secondary">
          {description}
          {actionLabel && onAction ? (
            <>
              {' '}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onAction()
                }}
                className="text-small text-text-action hover:underline"
              >
                {actionLabel}
              </button>
            </>
          ) : null}
        </span>
      </span>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-md rounded-sm border border-border bg-surface px-md py-md text-left hover:bg-surface-hover"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="flex w-full items-center gap-md rounded-sm border border-border bg-surface px-md py-md">
      {content}
    </div>
  )
}
