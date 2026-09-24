import { useState } from 'react'
import { createPortal } from 'react-dom'

import '../../workflow/Molecules/PreviewPanel/PreviewPanel.css'
import { Icon } from '../Icon/Icon'
import { AiCoachSparkleIcon } from '../../assets/AiCoachSparkleIcon'
import { ChatBubble, ChatSystemLabel } from '../ChatBubble/ChatBubble'
import { ShareFeedbackModal } from '../ShareFeedbackModal/ShareFeedbackModal'
import type { VoiceChatDrawerProps } from './VoiceChatDrawer.types'

export function VoiceChatDrawer({
  open,
  messages,
  summary,
  feedbackPrefill,
  onSubmitFeedback,
  onTrackFeedback,
  onCoachAgentDirect,
  mode = 'voice',
  title,
  onClose,
}: VoiceChatDrawerProps) {
  const isChat = mode === 'chat'
  const [summaryOpen, setSummaryOpen] = useState(true)
  // Once a message's feedback is submitted, its "Coach agent" link becomes a "Track your
  // feedback" link pointing at the recommendation the feedback landed on.
  const [recIdByMessage, setRecIdByMessage] = useState<Record<string, string>>({})
  const [shareFeedbackId, setShareFeedbackId] = useState<string | null>(null)
  const headerTitle = title ?? (isChat ? 'Chat with Myna' : 'Call with Myna')

  const handleShareFeedbackSubmit = (details: string) => {
    if (shareFeedbackId === null) return
    const recId = onSubmitFeedback?.(details, shareFeedbackId)
    if (recId) setRecIdByMessage((prev) => ({ ...prev, [shareFeedbackId]: recId }))
    setShareFeedbackId(null)
  }

  if (!open) return null

  return createPortal(
    <div className="pp-details-overlay" onClick={onClose}>
      <div className="pp-details-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="pp-details">
          {/* Header */}
          <div className="pp-details__header">
            <button className="pp-details__back-btn" type="button" onClick={onClose} aria-label="Back">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="pp-details__title">{headerTitle}</span>
          </div>

          <div className="pp-details__body">
            {/* Summary card */}
            {summary && (
              <div className="pp-summary-card">
                <button
                  className="pp-summary-card__header"
                  type="button"
                  onClick={() => setSummaryOpen((v) => !v)}
                >
                  <span className="pp-summary-card__icon-wrap" aria-hidden>
                    <AiCoachSparkleIcon size={12} />
                  </span>
                  <span className="pp-summary-card__label">Summary</span>
                  <span className="material-symbols-outlined pp-summary-card__chevron">
                    {summaryOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {summaryOpen && <p className="pp-summary-card__body">{summary}</p>}
              </div>
            )}

            {/* Transcript — same bubble template as inbox; side padding matches summary card */}
            <div className="pp-details__transcript">
              {messages.map((m) => {
                if (m.role === 'system') {
                  return <ChatSystemLabel key={m.id} text={m.text} />
                }
                if (m.role === 'agent') {
                  const recId = recIdByMessage[String(m.id)]
                  return (
                    <ChatBubble key={m.id} sender="business" text={m.text}>
                      <div className="flex items-center gap-xs">
                        {recId ? (
                          <button
                            type="button"
                            onClick={() => onTrackFeedback?.(recId)}
                            className="group flex items-center gap-xs text-small text-text-action"
                          >
                            <Icon name="track_changes" size={16} />
                            <span className="group-hover:underline">Track your feedback</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              onCoachAgentDirect ? onCoachAgentDirect(String(m.id)) : setShareFeedbackId(String(m.id))
                            }
                            className="group flex items-center gap-xs text-small text-text-action"
                          >
                            <AiCoachSparkleIcon />
                            <span className="group-hover:underline">Coach agent</span>
                          </button>
                        )}
                        {m.time && (
                          <>
                            <span className="text-small text-text-tertiary">•</span>
                            <span className="text-small text-text-tertiary">{m.time}</span>
                          </>
                        )}
                      </div>
                    </ChatBubble>
                  )
                }
                return (
                  <ChatBubble key={m.id} sender="user" text={m.text} />
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <ShareFeedbackModal
        open={shareFeedbackId !== null}
        onClose={() => setShareFeedbackId(null)}
        onSubmit={handleShareFeedbackSubmit}
        initialDetails={feedbackPrefill}
      />
    </div>,
    document.body,
  )
}
