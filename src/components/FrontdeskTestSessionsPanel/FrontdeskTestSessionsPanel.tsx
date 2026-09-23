import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import { Chip } from '../Chip/Chip'
import { Tabs } from '../Tabs/Tabs'
import { ChatBubble, ChatSystemLabel } from '../ChatBubble/ChatBubble'
import { CallRecordingPlayer } from '../CallRecordingPlayer/CallRecordingPlayer'
import iconAgentsTwoStarSparkle from '../../assets/icon-agents-two-star-sparkle.svg'
import voicemailSample from '../../assets/voicemail_sample.mp3'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — untyped JS component
import PreviewPanel from '../../workflow/Molecules/PreviewPanel/PreviewPanel'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — untyped JS module
import { PREVIEW_GREETING, PREVIEW_DEMO_SCRIPT } from '../../workflow/Molecules/PreviewPanel/PreviewPanelViews'
import {
  FRONTDESK_TEST_BATCHES,
  FRONTDESK_SCENARIO_SUGGESTIONS,
  FRONTDESK_CUSTOM_TEST_REPLY,
  type FrontdeskTestBatch,
  type FrontdeskTestSession,
  type FrontdeskTestSuite,
  type FrontdeskTestTranscriptLine,
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

/** Front desk (Sep 23) full-page Test tab only — same three sections review-response's 23 Sep
 *  Test tab has (`TEST_SECTIONS` in GhostwriterTestRunPanel.tsx): a working "Tests" list, a
 *  "Test suite" saved-scenarios feature, and an inert "Test cycles" placeholder with no data
 *  model behind it yet, same as the reference. */
type FrontdeskTestSection = 'tests' | 'suite' | 'cycles'

const FRONTDESK_TEST_SECTIONS: { id: FrontdeskTestSection; label: string; icon: string; emptyCaption: string }[] = [
  { id: 'tests', label: 'Tests', icon: 'science', emptyCaption: 'Test a call or web chat scenario to see how your agent responds.' },
  { id: 'suite', label: 'Test suite', icon: 'fact_check', emptyCaption: 'A test suite is a saved set of call and web chat scenarios you can reuse across test runs.' },
  { id: 'cycles', label: 'Test cycles', icon: 'autorenew', emptyCaption: 'No test cycles yet.' },
]

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
 *  scripted reply. `onEnd` (Sep 23 full-page Test tab only — unset by Myna's floating mode) is
 *  called with the real exchanged transcript right before closing, so the caller can commit it
 *  as a new Tests card the same way a finished "Test call" does. */
function TestWebChatPreview({
  onClose,
  onEnd,
}: {
  onClose: () => void
  onEnd?: (transcript: FrontdeskTestTranscriptLine[]) => void
}) {
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

  function handleClose() {
    onEnd?.(messages.map((m) => ({ speaker: m.sender, text: m.text })))
    onClose()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <p className="m-0 text-body text-text-primary">Test Web Chat</p>
        <button
          type="button"
          onClick={handleClose}
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

interface ScenarioDraft {
  id: string
  text: string
  voice: boolean
  chat: boolean
}

function ChannelCheckbox({
  checked,
  label,
  onToggle,
}: {
  checked: boolean
  label: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-xs rounded-sm py-2xs text-body text-text-primary"
    >
      <span
        aria-hidden
        className={`flex size-[18px] shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
          checked ? 'border-primary bg-primary' : 'border-control-border bg-surface'
        }`}
      >
        {checked && <Icon name="check" size={14} weight={500} className="text-white" />}
      </span>
      {label}
    </button>
  )
}

/** "Create Test Cases" — opened from the LHS header. One or more scenarios, each its own
 *  paragraph description + which channel(s) to run it on; "Run test" turns every checked
 *  (scenario, channel) pair into a new session in its own "Myna"-tested batch. Portalled to
 *  `<body>` for the same reason `GhostwriterRunTestModal` is — the Ghostwriter shell's tab bar
 *  is a pinned `z-30`. */
function CreateTestCasesModal({
  open,
  onCancel,
  onRunTest,
  title = 'Create test cases',
  submitLabel = 'Run test',
}: {
  open: boolean
  onCancel: () => void
  onRunTest: (scenarios: { text: string; voice: boolean; chat: boolean }[]) => void
  /** Sep 23 full-page Test tab reuses this same scenario editor for "Create test suite" —
   *  saving a suite, not running one, so the header/submit copy need to say so. */
  title?: string
  submitLabel?: string
}) {
  const [scenarios, setScenarios] = useState<ScenarioDraft[]>([
    { id: 'scenario-1', text: '', voice: false, chat: false },
  ])
  const [suggestionIndex, setSuggestionIndex] = useState(0)

  if (!open) return null

  const isValid = (s: ScenarioDraft) => s.text.trim().length > 0 && (s.voice || s.chat)
  const canRunTest = scenarios.some(isValid)

  function updateScenario(id: string, patch: Partial<ScenarioDraft>) {
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function handleAddScenario() {
    setScenarios((prev) => [
      ...prev,
      { id: `scenario-${prev.length + 1}-${Date.now()}`, text: '', voice: false, chat: false },
    ])
  }

  function handleGenerateScenario(id: string) {
    const suggestion = FRONTDESK_SCENARIO_SUGGESTIONS[suggestionIndex % FRONTDESK_SCENARIO_SUGGESTIONS.length]
    setSuggestionIndex((i) => i + 1)
    updateScenario(id, { text: suggestion })
  }

  function handleClose() {
    setScenarios([{ id: 'scenario-1', text: '', voice: false, chat: false }])
    setSuggestionIndex(0)
    onCancel()
  }

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center" aria-hidden={!open}>
      <div onClick={handleClose} className="absolute inset-0 bg-black/20" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-test-cases-modal-title"
        className="relative flex max-h-[calc(100vh-130px)] w-full max-w-[640px] flex-col overflow-hidden rounded-md bg-surface shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-2xl py-lg">
          <h2 id="create-test-cases-modal-title" className="m-0 text-h3 text-text-primary">
            {title}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="scrollbar-subtle flex min-h-0 flex-1 flex-col gap-xl overflow-y-auto px-2xl pb-lg">
          {scenarios.map((scenario, i) => (
            <div key={scenario.id} className="flex flex-col gap-sm">
              <div className="flex items-center justify-between">
                <label className="text-small text-text-secondary">Scenario {i + 1}</label>
                <button
                  type="button"
                  onClick={() => handleGenerateScenario(scenario.id)}
                  className="flex items-center gap-xs rounded-sm px-sm py-2xs text-small text-text-action hover:bg-surface-hover"
                >
                  <TwoStarSparkleIcon size={14} className="text-[#8350CE]" />
                  Generate test case
                </button>
              </div>
              <textarea
                value={scenario.text}
                onChange={(e) => updateScenario(scenario.id, { text: e.target.value })}
                rows={3}
                placeholder="Describe what the caller says or wants…"
                className="w-full resize-none rounded-sm border border-border bg-surface px-md py-sm text-body text-text-primary outline-none focus:border-primary"
              />
              <div className="flex items-center gap-lg">
                <ChannelCheckbox
                  checked={scenario.voice}
                  label="Call"
                  onToggle={() => updateScenario(scenario.id, { voice: !scenario.voice })}
                />
                <ChannelCheckbox
                  checked={scenario.chat}
                  label="Web chat"
                  onToggle={() => updateScenario(scenario.id, { chat: !scenario.chat })}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddScenario}
            className="flex h-9 items-center gap-xs self-start rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary transition-colors hover:bg-surface-l2"
          >
            <Icon name="add" size={18} />
            Add Scenario
          </button>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-md border-t border-border px-2xl py-md">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canRunTest}
            onClick={() => {
              onRunTest(scenarios.filter(isValid))
              handleClose()
            }}
            className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
              !canRunTest
                ? 'cursor-not-allowed bg-surface-selected text-text-tertiary'
                : 'bg-primary text-white hover:bg-primary-hover'
            }`}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** Front desk (Sep 23) full-page Test tab only — vertical section switcher pinned above the
 *  list, same row treatment as review-response's `TestSectionNav` (h-7, rounded-sm,
 *  bg-surface-selected when active). */
function FrontdeskTestSectionNav({
  active,
  onSelect,
}: {
  active: FrontdeskTestSection
  onSelect: (section: FrontdeskTestSection) => void
}) {
  return (
    <nav className="flex flex-col gap-2xs px-sm py-xs">
      {FRONTDESK_TEST_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          aria-current={section.id === active ? 'page' : undefined}
          onClick={() => onSelect(section.id)}
          className={`flex h-7 w-full items-center gap-sm rounded-sm px-sm py-[6px] text-left transition-colors ${
            section.id === active ? 'bg-surface-selected' : 'hover:bg-surface-selected'
          }`}
        >
          <Icon name={section.icon} size={16} className="shrink-0 text-text-icon" />
          <span className="min-w-0 flex-1 truncate text-body text-text-primary">{section.label}</span>
        </button>
      ))}
    </nav>
  )
}

/** Front desk (Sep 23) full-page Test tab only — plain empty state for the not-yet-built
 *  "Test cycles" section, same shape as review-response's `TestSectionEmptyState`. */
function FrontdeskTestSectionEmptyState({ icon, caption }: { icon: string; caption: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-md px-lg text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-selected text-text-tertiary">
        <Icon name={icon} size={20} />
      </span>
      <p className="m-0 text-body text-text-secondary">{caption}</p>
    </div>
  )
}

/** Front desk (Sep 23) full-page Test tab only — the "Run test" CTA (header pill and centered
 *  empty-state button both use this), same shape as review-response's `TestCaseCtaButton` but
 *  with three items instead of two: "Test call"/"Test webchat" open the same right-side panel
 *  Front desk (Myna) already has, "Use test suite" opens the suite picker — greyed out until
 *  at least one suite has been saved. */
function FrontdeskRunTestCtaButton({
  variant,
  onTestCall,
  onTestWebchat,
  onUseTestSuite,
  hasTestSuites,
}: {
  variant: 'header' | 'empty'
  onTestCall: () => void
  onTestWebchat: () => void
  onUseTestSuite: () => void
  hasTestSuites: boolean
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-xs rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
      >
        Run test
        <Icon name="expand_more" size={16} />
      </button>
      {open && (
        <div
          className={`absolute z-[110] mt-xs min-w-[180px] rounded-sm border border-border bg-surface py-xs shadow-dropdown ${
            variant === 'header' ? 'right-0' : 'left-1/2 -translate-x-1/2'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onTestCall()
            }}
            className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
          >
            Test call
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onTestWebchat()
            }}
            className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
          >
            Test webchat
          </button>
          <button
            type="button"
            disabled={!hasTestSuites}
            onClick={() => {
              if (!hasTestSuites) return
              setOpen(false)
              onUseTestSuite()
            }}
            className={`block w-full px-md py-sm text-left text-body ${
              hasTestSuites ? 'text-text-primary hover:bg-surface-hover' : 'cursor-not-allowed text-text-tertiary'
            }`}
          >
            Use test suite
          </button>
        </div>
      )}
    </div>
  )
}

/** Front desk (Sep 23) full-page Test tab only — one card per test run, stacked in the central
 *  workspace (newest on top), same shape as review-response's `TestBatchSummaryCard`. Every
 *  batch here always reads as passing (front desk has no rating-style rule to compute a real
 *  failure from) — the underlying sessions can still individually read "Failed" once opened. */
function FrontdeskTestBatchSummaryCard({ batch, onClick }: { batch: FrontdeskTestBatch; onClick: () => void }) {
  const total = batch.sessions.length
  const passed = batch.sessions.filter((s) => s.outcome === 'passed').length
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-lg rounded-md border border-border p-lg text-left transition-colors hover:bg-surface-hover"
    >
      <div className="flex items-center gap-xs">
        {batch.testedBy === 'Myna' && <TwoStarSparkleIcon size={14} className="shrink-0 text-[#8350CE]" />}
        <div>
          <p className="m-0 text-body text-text-primary">
            {batch.suiteName && `${batch.suiteName} - `}
            {total} session{total === 1 ? '' : 's'} tested
          </p>
          <p className="m-0 mt-2xs text-small text-text-secondary">
            {batch.suiteName ? 'Suite tested by' : 'Tested by'} {batch.testedBy}
          </p>
        </div>
      </div>
      <div className="text-right">
        <Chip label={`${passed}/${total} passed`} variant={passed === total ? 'success' : 'warning'} />
        <p className="m-0 mt-2xs text-small text-text-secondary">{batch.testedAt}</p>
      </div>
    </button>
  )
}

/** Front desk (Sep 23) full-page Test tab only — slide-in panel opened by clicking a batch's
 *  summary card, same convention as review-response's `TestBatchReviewsPanel`: lists every
 *  session in that batch, picking one closes the slide-in and shows it on the right-side panel
 *  (`SessionDetail`, reused as-is). Portalled to `<body>` for the same reason that one is. */
function FrontdeskTestBatchSessionsPanel({
  open,
  batch,
  selectedId,
  onSelect,
  onClose,
}: {
  open: boolean
  batch: FrontdeskTestBatch | null
  selectedId: string | null
  onSelect: (id: string) => void
  onClose: () => void
}) {
  return createPortal(
    <div className={`fixed inset-0 z-[110] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-[480px] max-w-[92vw] flex-col bg-surface shadow-dropdown transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {batch && (
          <>
            <div className="flex shrink-0 items-center justify-between gap-sm border-b border-border px-2xl py-lg">
              <div>
                <p className="m-0 text-h3 text-text-primary">
                  {batch.sessions.length} session{batch.sessions.length === 1 ? '' : 's'} tested
                </p>
                <p className="m-0 mt-2xs text-small text-text-tertiary">{batch.testedAt}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="scrollbar-subtle flex-1 overflow-y-auto px-lg py-md">
              {batch.sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => onSelect(session.id)}
                  className={`flex w-full items-start gap-sm rounded-sm px-sm py-sm text-left transition-colors ${
                    session.id === selectedId ? 'bg-surface-selected' : 'hover:bg-surface-hover'
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
              ))}
            </div>
          </>
        )}
      </aside>
    </div>,
    document.body,
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
  layout = 'floating',
}: FrontdeskTestSessionsPanelProps) {
  const [channelTab, setChannelTab] = useState<'voice' | 'chat'>('voice')
  const [batches, setBatches] = useState<FrontdeskTestBatch[]>(FRONTDESK_TEST_BATCHES)
  const [createTestCasesOpen, setCreateTestCasesOpen] = useState(false)
  const [rhsMode, setRhsMode] = useState<'none' | 'session' | 'call-preview' | 'webchat-preview'>(
    layout === 'fullpage' ? 'none' : 'session',
  )

  // Sep 23 full-page Test tab only — Myna's floating mode never touches these.
  const [section, setSection] = useState<FrontdeskTestSection>('tests')
  const [suites, setSuites] = useState<FrontdeskTestSuite[]>([])
  const [createSuiteOpen, setCreateSuiteOpen] = useState(false)
  const [useSuiteModalOpen, setUseSuiteModalOpen] = useState(false)
  const [openBatch, setOpenBatch] = useState<FrontdeskTestBatch | null>(null)

  const filteredBatches = batches
    .map((batch) => ({ ...batch, sessions: batch.sessions.filter((s) => s.channel === channelTab) }))
    .filter((batch) => batch.sessions.length > 0)
  const allSessions = filteredBatches.flatMap((batch) => batch.sessions)
  const lastBatch = filteredBatches[filteredBatches.length - 1]
  const [selectedId, setSelectedId] = useState(lastBatch?.sessions[0]?.id ?? null)
  const selected = allSessions.find((s) => s.id === selectedId) ?? lastBatch?.sessions[0] ?? null

  // Shared by "Create test cases" (Myna) and both "Create test suite" and "Use test suite"
  // (Sep 23) — one batch per resulting session, same as the seeded human-tested batches, so
  // each case gets its own header instead of several cases sharing one.
  function buildBatchesFromDrafts(
    drafts: { text: string; voice: boolean; chat: boolean }[],
    suiteName?: string,
  ): FrontdeskTestBatch[] {
    const newBatches: FrontdeskTestBatch[] = []
    drafts.forEach((draft, i) => {
      const channels: ('voice' | 'chat')[] = [
        ...(draft.voice ? (['voice'] as const) : []),
        ...(draft.chat ? (['chat'] as const) : []),
      ]
      channels.forEach((channel) => {
        const session: FrontdeskTestSession = {
          id: `fd-test-custom-${Date.now()}-${i}-${channel}`,
          title: draft.text,
          channel,
          outcome: 'passed',
          durationSecs: channel === 'voice' ? 35 : undefined,
          audioUrl: channel === 'voice' ? voicemailSample : undefined,
          transcript: [
            { speaker: 'user', text: draft.text },
            { speaker: 'business', text: FRONTDESK_CUSTOM_TEST_REPLY },
          ],
        }
        newBatches.push({ testedAt: 'Just now', testedBy: 'Myna', sessions: [session], suiteName })
      })
    })
    return newBatches
  }

  function handleRunTestCases(drafts: { text: string; voice: boolean; chat: boolean }[]) {
    const newBatches = buildBatchesFromDrafts(drafts)
    if (newBatches.length === 0) return
    setBatches((prev) => [...prev, ...newBatches])
  }

  function handleSaveSuite(drafts: { text: string; voice: boolean; chat: boolean }[]) {
    if (drafts.length === 0) return
    const suite: FrontdeskTestSuite = {
      id: `fd-suite-${Date.now()}`,
      name: `Test suite ${suites.length + 1}`,
      scenarios: drafts,
      createdAt: 'Just now',
    }
    setSuites((prev) => [...prev, suite])
  }

  function handleUseSuite(suite: FrontdeskTestSuite) {
    const newBatches = buildBatchesFromDrafts(suite.scenarios, suite.name)
    if (newBatches.length === 0) return
    setBatches((prev) => [...prev, ...newBatches])
  }

  // Sep 23 full-page Test tab only — "once the test has ended" (not merely closed) is what
  // turns into a new Tests card, so these are wired to the panels' end-of-session hooks
  // (`onSessionEnded`/`onEnd`), not their plain ✕ close.
  function handleCallEnded() {
    const session: FrontdeskTestSession = {
      id: `fd-test-call-${Date.now()}`,
      title: 'Test call',
      channel: 'voice',
      outcome: 'passed',
      durationSecs: 48,
      audioUrl: voicemailSample,
      transcript: [
        { speaker: 'business', text: PREVIEW_GREETING },
        ...PREVIEW_DEMO_SCRIPT.map((line: { role: string; text: string }) => ({
          speaker: line.role === 'agent' ? ('business' as const) : ('user' as const),
          text: line.text,
        })),
      ],
    }
    setBatches((prev) => [...prev, { testedAt: 'Just now', testedBy: 'Myna', sessions: [session] }])
    setRhsMode('none')
  }

  function handleWebchatEnded(transcript: FrontdeskTestTranscriptLine[]) {
    const session: FrontdeskTestSession = {
      id: `fd-test-webchat-${Date.now()}`,
      title: 'Test webchat',
      channel: 'chat',
      outcome: 'passed',
      transcript,
    }
    setBatches((prev) => [...prev, { testedAt: 'Just now', testedBy: 'Myna', sessions: [session] }])
    setRhsMode('none')
  }

  function selectChannel(id: string) {
    setChannelTab(id as 'voice' | 'chat')
    setRhsMode('session')
  }

  if (layout === 'fullpage') {
    const sectionMeta = FRONTDESK_TEST_SECTIONS.find((s) => s.id === section) ?? FRONTDESK_TEST_SECTIONS[0]

    return (
      <div className={`relative h-full min-h-0 w-full overflow-hidden bg-surface ${className}`}>
      <div className="scrollbar-subtle flex h-full min-h-0 w-full flex-col overflow-y-auto px-lg py-xl">
        <div className="mx-auto flex w-full max-w-[1200px] flex-1 gap-2xl">
          <div className="flex w-[200px] shrink-0 flex-col border-r border-border pr-lg">
            <FrontdeskTestSectionNav active={section} onSelect={setSection} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col pl-lg">
            {section === 'tests' ? (
              <>
                <div className="mb-lg flex items-center justify-between">
                  <h1 className="m-0 text-h3 text-text-primary">Tests</h1>
                  {batches.length > 0 && (
                    <FrontdeskRunTestCtaButton
                      variant="header"
                      onTestCall={() => setRhsMode('call-preview')}
                      onTestWebchat={() => setRhsMode('webchat-preview')}
                      onUseTestSuite={() => setUseSuiteModalOpen(true)}
                      hasTestSuites={suites.length > 0}
                    />
                  )}
                </div>
                {batches.length > 0 ? (
                  <div className="flex flex-col gap-md">
                    {[...batches].reverse().map((batch, i) => (
                      <FrontdeskTestBatchSummaryCard key={i} batch={batch} onClick={() => setOpenBatch(batch)} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-md px-lg text-center">
                    <span className="flex size-10 items-center justify-center rounded-full bg-surface-selected text-text-tertiary">
                      <Icon name="science" size={20} />
                    </span>
                    <p className="m-0 max-w-[360px] text-body text-text-secondary">{sectionMeta.emptyCaption}</p>
                    <FrontdeskRunTestCtaButton
                      variant="empty"
                      onTestCall={() => setRhsMode('call-preview')}
                      onTestWebchat={() => setRhsMode('webchat-preview')}
                      onUseTestSuite={() => setUseSuiteModalOpen(true)}
                      hasTestSuites={suites.length > 0}
                    />
                  </div>
                )}
              </>
            ) : section === 'suite' ? (
              <>
                <div className="mb-lg flex items-center justify-between">
                  <h1 className="m-0 text-h3 text-text-primary">Test suite</h1>
                  {suites.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCreateSuiteOpen(true)}
                      className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
                    >
                      Create test suite
                    </button>
                  )}
                </div>
                {suites.length > 0 ? (
                  <div className="flex flex-col gap-md">
                    {suites.map((suite) => (
                      <div
                        key={suite.id}
                        className="flex w-full items-center justify-between gap-lg rounded-md border border-border p-lg text-left"
                      >
                        <div>
                          <p className="m-0 text-body text-text-primary">{suite.name}</p>
                          <p className="m-0 mt-2xs text-small text-text-tertiary">
                            {suite.scenarios.length} scenario{suite.scenarios.length === 1 ? '' : 's'}
                          </p>
                        </div>
                        <p className="m-0 shrink-0 text-small text-text-tertiary">{suite.createdAt}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-md px-lg text-center">
                    <span className="flex size-10 items-center justify-center rounded-full bg-surface-selected text-text-tertiary">
                      <Icon name="fact_check" size={20} />
                    </span>
                    <p className="m-0 max-w-[360px] text-body text-text-secondary">{sectionMeta.emptyCaption}</p>
                    <button
                      type="button"
                      onClick={() => setCreateSuiteOpen(true)}
                      className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
                    >
                      Create test suite
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="m-0 text-body text-text-primary">{sectionMeta.label}</p>
                <FrontdeskTestSectionEmptyState icon={sectionMeta.icon} caption={sectionMeta.emptyCaption} />
              </>
            )}
          </div>
        </div>
      </div>

        {rhsMode !== 'none' && (
          <div
            className={`absolute right-lg top-lg bottom-lg z-[60] w-[420px] overflow-y-auto scrollbar-subtle rounded-2xl border border-border bg-surface shadow-[0_2px_12px_1px_rgba(13,13,18,0.08)] ${
              rhsMode === 'session' ? 'p-lg' : ''
            }`}
          >
            {rhsMode === 'call-preview' ? (
              <PreviewPanel
                agentName="Front desk agent"
                onClose={() => setRhsMode('none')}
                onSessionEnded={handleCallEnded}
              />
            ) : rhsMode === 'webchat-preview' ? (
              <div className="flex h-full flex-col p-lg">
                <TestWebChatPreview onClose={() => setRhsMode('none')} onEnd={handleWebchatEnded} />
              </div>
            ) : selected ? (
              <SessionDetail session={selected} />
            ) : null}
          </div>
        )}

        <FrontdeskTestBatchSessionsPanel
          open={openBatch !== null}
          batch={openBatch}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id)
            setRhsMode('session')
            setOpenBatch(null)
          }}
          onClose={() => setOpenBatch(null)}
        />

        <CreateTestCasesModal
          open={createSuiteOpen}
          onCancel={() => setCreateSuiteOpen(false)}
          onRunTest={handleSaveSuite}
          title="Create test suite"
          submitLabel="Save test suite"
        />

        {useSuiteModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center" aria-hidden={!useSuiteModalOpen}>
            <div onClick={() => setUseSuiteModalOpen(false)} className="absolute inset-0 bg-black/20" />
            <div
              role="dialog"
              aria-modal="true"
              className="relative flex w-full max-w-[480px] flex-col rounded-md bg-surface shadow-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-sm border-b border-border px-2xl py-lg">
                <p className="m-0 text-h3 text-text-primary">Use test suite</p>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setUseSuiteModalOpen(false)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>
              <div className="flex flex-col gap-sm px-2xl py-xl">
                {suites.map((suite) => (
                  <button
                    key={suite.id}
                    type="button"
                    onClick={() => {
                      handleUseSuite(suite)
                      setUseSuiteModalOpen(false)
                    }}
                    className="flex w-full items-center justify-between gap-lg rounded-sm border border-border px-lg py-md text-left transition-colors hover:bg-surface-hover"
                  >
                    <p className="m-0 text-body text-text-primary">{suite.name}</p>
                    <p className="m-0 shrink-0 text-small text-text-tertiary">
                      {suite.scenarios.length} scenario{suite.scenarios.length === 1 ? '' : 's'}
                    </p>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-end gap-md border-t border-border px-2xl py-md">
                <button
                  type="button"
                  onClick={() => setUseSuiteModalOpen(false)}
                  className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative h-full min-h-0 w-full overflow-hidden ${className}`}>
      <div className="absolute inset-0">{centerContent}</div>

      <div className={`${FLOATING_PANEL_CLASS} left-lg flex w-[320px] flex-col p-md`}>
        <div className="flex items-center justify-between px-sm py-xs">
          <p className="m-0 text-body text-text-primary">Tests</p>
          <button
            type="button"
            onClick={() => setCreateTestCasesOpen(true)}
            className="rounded-sm px-sm py-xs text-body text-text-action transition-colors hover:bg-surface-hover"
          >
            Create test cases
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

      <CreateTestCasesModal
        open={createTestCasesOpen}
        onCancel={() => setCreateTestCasesOpen(false)}
        onRunTest={handleRunTestCases}
      />
    </div>
  )
}
