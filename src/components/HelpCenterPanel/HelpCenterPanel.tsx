import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icon/Icon'
import {
  HELP_ARTICLES,
  HELP_TOURS,
  HELP_VIDEOS,
  type HelpCenterPanelProps,
  type HelpCenterView,
} from './HelpCenterPanel.types'

const VIEW_TITLE: Record<HelpCenterView, string> = {
  home: 'Help',
  videos: 'Video tutorials',
  tours: 'Interactive tours',
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
    <label className="mt-lg flex h-9 items-center gap-sm rounded-sm border border-border-input bg-surface-selected px-md">
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
 * Workflow-canvas Help center — home hub plus Video tutorials, Interactive tours,
 * and Support articles. Parent owns placement (e.g. `.rr-chrome-right-panel`).
 */
export function HelpCenterPanel({ open, onClose, onStartTour }: HelpCenterPanelProps) {
  const [view, setView] = useState<HelpCenterView>('home')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) {
      setView('home')
      setQuery('')
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

  const tours = useMemo(
    () =>
      HELP_TOURS.filter(
        (t) =>
          !q ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
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
    <aside
      className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-surface"
      style={{ boxShadow: '0 2px 12px 1px rgba(33, 33, 33, 0.06)' }}
      role="dialog"
      aria-modal="false"
      aria-labelledby="help-center-title"
    >
      <header className="flex shrink-0 items-center gap-sm px-xl pt-xl pb-sm">
        {view !== 'home' && (
          <button
            type="button"
            aria-label="Back"
            onClick={goHome}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="arrow_back" size={20} />
          </button>
        )}
        <h2 id="help-center-title" className="m-0 min-w-0 flex-1 text-h3 text-text-primary">
          {VIEW_TITLE[view]}
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
        >
          <Icon name="close" size={20} />
        </button>
      </header>

      {view === 'home' ? (
        <div className="flex min-h-0 flex-1 flex-col px-xl pb-xl">
          <div className="flex flex-col gap-md overflow-auto py-sm">
            <HomeCard
              icon="play_circle"
              title="Video tutorials"
              description="Learn how to use Workflow Builder through step-by-step video tutorials."
              onClick={() => setView('videos')}
            />
            <HomeCard
              icon="explore"
              title="Interactive tours"
              description="Take guided tours to learn about key Workflow Builder features."
              onClick={() => setView('tours')}
            />
            <HomeCard
              icon="description"
              title="Support articles"
              description="Find detailed articles and guides to help you get started."
              onClick={() => setView('articles')}
            />
          </div>

          <div className="mt-auto border-t border-border pt-lg">
            <div className="flex items-start gap-md rounded-md bg-chip-info-bg px-lg py-md">
              <Icon name="chat_bubble_outline" size={22} className="mt-xs shrink-0 text-text-action" />
              <div className="min-w-0">
                <p className="m-0 text-body text-text-primary">Still need help?</p>
                <p className="m-0 mt-xs text-small text-text-secondary">
                  Contact support for instant chat or ticketing.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col px-xl pb-xl">
          <SearchField value={query} onChange={setQuery} />

          <div className="mt-lg min-h-0 flex-1 overflow-auto">
            {view === 'videos' && (
              <ul className="m-0 flex list-none flex-col gap-0 p-0">
                {videos.length === 0 ? (
                  <li className="py-2xl text-center text-body text-text-tertiary">No videos match your search.</li>
                ) : (
                  videos.map((video, i) => (
                    <li
                      key={video.id}
                      className={i > 0 ? 'border-t border-border' : ''}
                    >
                      <button
                        type="button"
                        className="group flex w-full items-start gap-md py-md text-left hover:bg-surface-hover"
                      >
                        <div
                          className={`relative flex h-[64px] w-[114px] shrink-0 items-center justify-center rounded-sm ${video.thumbClassName}`}
                        >
                          <Icon name="play_arrow" size={22} fill className="text-text-icon/50" />
                          <span className="absolute bottom-xs right-xs rounded-sm bg-tooltip/80 px-xs py-px text-[10px] leading-none text-white">
                            {video.duration}
                          </span>
                        </div>
                        <span className="min-w-0 flex-1 pt-xs">
                          <span className="block text-body text-text-primary">{video.title}</span>
                          <span className="mt-xs block line-clamp-2 text-small text-text-secondary">
                            {video.description}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}

            {view === 'tours' && (
              <ul className="m-0 flex list-none flex-col gap-0 p-0">
                {tours.length === 0 ? (
                  <li className="py-2xl text-center text-body text-text-tertiary">No tours match your search.</li>
                ) : (
                  tours.map((tour, i) => (
                    <li
                      key={tour.id}
                      className={`flex items-start gap-md py-lg ${i > 0 ? 'border-t border-border' : ''}`}
                    >
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-sm ${tour.iconBgClassName}`}
                      >
                        <Icon name={tour.icon} size={20} className={tour.iconColorClassName} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-body text-text-primary">{tour.title}</p>
                        <p className="m-0 mt-xs text-small text-text-secondary">{tour.description}</p>
                        <button
                          type="button"
                          onClick={() => onStartTour?.(tour.id)}
                          className="mt-sm text-body text-text-action hover:underline"
                        >
                          Start tour
                        </button>
                      </div>
                      <Icon name="chevron_right" size={20} className="mt-xs shrink-0 text-text-icon" />
                    </li>
                  ))
                )}
              </ul>
            )}

            {view === 'articles' && (
              <ul className="m-0 flex list-none flex-col gap-0 p-0">
                {articles.length === 0 ? (
                  <li className="py-2xl text-center text-body text-text-tertiary">No articles match your search.</li>
                ) : (
                  articles.map((article, i) => (
                    <li key={article.id}>
                      <button
                        type="button"
                        className={`flex w-full items-start gap-md py-lg text-left hover:bg-surface-hover ${
                          i > 0 ? 'border-t border-border' : ''
                        }`}
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-surface-selected">
                          <Icon name="article" size={20} className="text-text-icon" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-body text-text-primary">{article.title}</span>
                          <span className="mt-xs block text-small text-text-secondary">{article.description}</span>
                        </span>
                        <Icon name="chevron_right" size={20} className="mt-xs shrink-0 text-text-icon" />
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
  )
}

function HomeCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-md rounded-md border border-border bg-surface px-lg py-md text-left hover:bg-surface-hover"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-surface-selected">
        <Icon name={icon} size={22} className="text-text-icon" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body text-text-primary">{title}</span>
        <span className="mt-xs block text-small text-text-secondary">{description}</span>
      </span>
      <Icon name="chevron_right" size={20} className="shrink-0 text-text-icon" />
    </button>
  )
}
