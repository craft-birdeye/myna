import { useEffect, useState } from 'react'
import { Icon } from '../Icon/Icon'
import { Chip } from '../Chip/Chip'
import { Tabs } from '../Tabs/Tabs'
import { ChatBubble, ChatSystemLabel } from '../ChatBubble/ChatBubble'
import { CallRecordingPlayer } from '../CallRecordingPlayer/CallRecordingPlayer'
import iconAgentsTwoStarSparkle from '../../assets/icon-agents-two-star-sparkle.svg'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — untyped JS component
import PreviewPanel from '../../workflow/Molecules/PreviewPanel/PreviewPanel'
import {
  FRONTDESK_TEST_BATCHES,
  FRONTDESK_GENERATED_TEST_POOL,
  type FrontdeskTestBatch,
  type FrontdeskTestSession,
} from '../../data/frontdeskTestSessions'
import type { FrontdeskTestSessionsPanelProps } from './FrontdeskTestSessionsPanel.types'

/** Same shell the canvas's own floating LHS ("Edit with AI") and RHS (node config / Test
 *  details) panels use: inset from the edges, rounded, elevated — not a flush column. Matches
 *  `GhostwriterTestRunPanel`'s `FLOATING_PANEL_CLASS` (Jay & Robin) so both Test tabs read as
 *  the same product pattern. z-[60] (above AgentBuilder's own top-right Help button, z-55)
 *  so the RHS panel's header never sits underneath it. */
const FLOATING_PANEL_CLASS =
  'absolute top-lg bottom-lg z-[60] overflow-y-auto scrollbar-subtle rounded-2xl border border-border bg-surface shadow-[0_2px_12px_1px_rgba(13,13,18,0.08)]'

const CHANNEL_TABS = [
  { id: 'voice', label: 'Call' },
  { id: 'chat', label: 'Web chat' },
]

const WEBCHAT_DEFAULT_PROMPT = "I'd like to book an appointment"

/** Two-star sparkle mask (`.ai-flat-sparkle-icon`, same asset as "Create with AI") — fills
 *  with `currentColor`, so it picks up whatever text color it's dropped next to. */
function TwoStarSparkleIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`ai-flat-sparkle-icon shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        maskImage: `url("${iconAgentsTwoStarSparkle}")`,
        WebkitMaskImage: `url("${iconAgentsTwoStarSparkle}")`,
      }}
    />
  )
}

function SessionDetail({ session }: { session: FrontdeskTestSession }) {
  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center justify-between">
        <p className="m-0 text-body text-text-primary">Preview</p>
        <Chip label={session.outcome === 'passed' ? 'Passed' : 'Failed'} variant={session.outcome === 'passed' ? 'success' : 'danger'} />
      </div>
      <div className="flex flex-col gap-2xs">
        <p className="m-0 text-body text-text-primary">{session.title}</p>
        <p className="m-0 text-small text-text-tertiary">
          {session.channel === 'voice' ? 'Voice call' : 'Web chat'}
        </p>
      </div>
      <div className="rounded-md border border-border p-lg">
        <div className="flex flex-col gap-2xl">
          {session.channel === 'voice' && (
            <>
              <ChatSystemLabel text="Call started" />
              <CallRecordingPlayer
                audioUrl={session.audioUrl}
                durationSecs={session.durationSecs}
                title={session.title}
              />
            </>
          )}
          {session.channel === 'chat' && <ChatSystemLabel text="Chat started" />}
          {session.transcript.map((line, i) => (
            <ChatBubble key={i} sender={line.speaker === 'business' ? 'business' : 'user'} text={line.text} />
          ))}
        </div>
      </div>
    </div>
  )
}

/** "Test webchat" — a live, minimal chat mock (not the historical session detail above, and
 *  not `PreviewPanel`'s own chat mode — that shares chrome with "Preview" and can't carry a
 *  different title). Clicking the composer prefills a canned message; Send appends it plus one
 *  scripted reply. */
function TestWebChatPreview({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ sender: 'business' | 'user'; text: string }[]>([
    { sender: 'business', text: 'Hi! How can I help you today?' },
  ])
  const [input, setInput] = useState('')

  function handleSend() {
    const text = input.trim()
    if (!text) return
    setMessages((prev) => [...prev, { sender: 'user', text }])
    setInput('')
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: 'business', text: "Got it — I'm taking care of that for you now." },
      ])
    }, 700)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <p className="m-0 text-body text-text-primary">Test Web Chat</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
        >
          <Icon name="close" size={18} />
        </button>
      </div>
      <div className="scrollbar-subtle mt-md flex flex-1 flex-col gap-lg overflow-y-auto">
        <ChatSystemLabel text="Chat started" />
        {messages.map((m, i) => (
          <ChatBubble key={i} sender={m.sender} text={m.text} />
        ))}
      </div>
      <div className="mt-md flex items-center gap-xs rounded-sm border border-border px-md py-sm">
        <input
          type="text"
          value={input}
          onFocus={() => {
            if (!input) setInput(WEBCHAT_DEFAULT_PROMPT)
          }}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend()
          }}
          placeholder="Send a message…"
          className="flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
        />
        <button
          type="button"
          onClick={handleSend}
          aria-label="Send"
          className="flex size-7 items-center justify-center rounded-sm text-text-action hover:bg-surface-hover"
        >
          <Icon name="send" size={18} />
        </button>
      </div>
    </div>
  )
}

/** Front desk (Myna)'s Test tab — same floating-panel language as `GhostwriterTestRunPanel`
 *  (Jay & Robin): the canvas (`centerContent`) fills the whole area full-bleed, with the test
 *  list and the right-hand result floating over it on the left/right, so the built workflow
 *  stays visible instead of being replaced by a different screen.
 *
 *  Two distinct right-hand states: picking a row from history shows a static recording +
 *  transcript ("Preview" — read-only, from `data/frontdeskTestSessions.ts`); "Test call" /
 *  "Test webchat" instead open a *live* run — the real `PreviewPanel` (same one Front desk
 *  agent (Sep 1) shows) for calls, or a minimal custom "Test Web Chat" composer for chat, since
 *  that needs its own title `PreviewPanel` can't carry. */
export function FrontdeskTestSessionsPanel({
  centerContent,
  className = '',
}: FrontdeskTestSessionsPanelProps) {
  const [channelTab, setChannelTab] = useState<'voice' | 'chat'>('voice')
  const [batches, setBatches] = useState<FrontdeskTestBatch[]>(FRONTDESK_TEST_BATCHES)
  const [generating, setGenerating] = useState(false)
  const [generateStep, setGenerateStep] = useState(0)
  const [rhsMode, setRhsMode] = useState<'session' | 'call-preview' | 'webchat-preview'>('session')

  const filteredBatches = batches
    .map((batch) => ({ ...batch, sessions: batch.sessions.filter((s) => s.channel === channelTab) }))
    .filter((batch) => batch.sessions.length > 0)
  const allSessions = filteredBatches.flatMap((batch) => batch.sessions)
  const lastBatch = filteredBatches[filteredBatches.length - 1]
  const [selectedId, setSelectedId] = useState(lastBatch?.sessions[0]?.id ?? null)
  const selected = allSessions.find((s) => s.id === selectedId) ?? lastBatch?.sessions[0] ?? null

  useEffect(() => {
    if (!generating) return
    if (generateStep >= FRONTDESK_GENERATED_TEST_POOL.length) {
      setGenerating(false)
      return
    }
    const timer = setTimeout(() => {
      setBatches((prev) => [...prev, FRONTDESK_GENERATED_TEST_POOL[generateStep]])
      setGenerateStep((s) => s + 1)
    }, 900)
    return () => clearTimeout(timer)
  }, [generating, generateStep])

  function handleGenerateTestCases() {
    if (generating) return
    setGenerating(true)
    setGenerateStep(0)
  }

  function selectChannel(id: string) {
    setChannelTab(id as 'voice' | 'chat')
    setRhsMode('session')
  }

  return (
    <div className={`relative h-full min-h-0 w-full overflow-hidden ${className}`}>
      <div className="absolute inset-0">{centerContent}</div>

      <div className={`${FLOATING_PANEL_CLASS} left-lg flex w-[320px] flex-col p-md`}>
        <div className="flex items-center justify-between px-sm py-xs">
          <p className="m-0 text-body text-text-primary">Tests</p>
          <button
            type="button"
            onClick={handleGenerateTestCases}
            disabled={generating}
            className="flex items-center gap-xs rounded-sm px-sm py-xs text-body text-text-action transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            <TwoStarSparkleIcon size={14} />
            {generating ? 'Generating…' : 'Generate testcases'}
          </button>
        </div>

        <div className="px-sm">
          <Tabs tabs={CHANNEL_TABS} activeTab={channelTab} onChange={selectChannel} showBaseline={false} />
        </div>

        <div className="px-sm py-sm">
          <button
            type="button"
            onClick={() => setRhsMode(channelTab === 'voice' ? 'call-preview' : 'webchat-preview')}
            className="flex h-9 w-full items-center justify-center gap-xs rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary transition-colors hover:bg-surface-l2"
          >
            <Icon name={channelTab === 'voice' ? 'call' : 'chat'} size={18} />
            {channelTab === 'voice' ? 'Test call' : 'Test webchat'}
          </button>
        </div>

        <div className="flex flex-col overflow-y-auto">
          {[...filteredBatches].reverse().map((batch, batchIndex) => (
            <div key={batchIndex} className={`flex flex-col gap-2xs ${batchIndex > 0 ? 'mt-lg' : ''}`}>
              <div className="flex items-center justify-between px-sm py-xs">
                <div className="flex items-center gap-xs">
                  {batch.testedBy === 'Myna' && <TwoStarSparkleIcon size={14} className="text-[#8350CE]" />}
                  <p className="m-0 text-small text-text-secondary">{batch.testedBy}</p>
                </div>
                <p className="m-0 text-small text-text-secondary">{batch.testedAt}</p>
              </div>
              {batch.sessions.map((session) => {
                const active = session.id === selectedId && rhsMode === 'session'
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(session.id)
                      setRhsMode('session')
                    }}
                    className={`flex items-start gap-sm rounded-sm px-sm py-sm text-left transition-colors ${
                      active ? 'bg-surface-selected' : 'hover:bg-surface-hover'
                    }`}
                  >
                    <Icon
                      name={session.outcome === 'passed' ? 'check_circle' : 'cancel'}
                      size={18}
                      className={`mt-[2px] shrink-0 ${
                        session.outcome === 'passed' ? 'text-accent-positive' : 'text-chip-danger-text'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="min-w-0 truncate text-body text-text-primary">{session.title}</span>
                      <p className="m-0 mt-2xs line-clamp-2 text-small text-text-tertiary">
                        {session.transcript[0]?.text}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className={`${FLOATING_PANEL_CLASS} right-lg w-[420px] ${rhsMode === 'session' ? 'p-lg' : ''}`}>
        {rhsMode === 'call-preview' ? (
          <PreviewPanel agentName="Front desk agent" onClose={() => setRhsMode('session')} />
        ) : rhsMode === 'webchat-preview' ? (
          <div className="flex h-full flex-col p-lg">
            <TestWebChatPreview onClose={() => setRhsMode('session')} />
          </div>
        ) : selected ? (
          <SessionDetail session={selected} />
        ) : (
          <div className="flex h-full flex-col">
            <p className="m-0 text-body text-text-primary">Preview</p>
            <div className="flex flex-1 items-center justify-center text-center">
              <p className="m-0 text-body text-text-tertiary">Run a test to see the result here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
