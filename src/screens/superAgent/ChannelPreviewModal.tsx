import { useEffect, useState } from 'react'
import { Icon } from '../../components'
import { ChannelGlyph, type ChannelKey } from './ChannelGlyph'
import { SUPER_AGENT_CHANNEL_SETUP } from './superAgentSeedData'
import { SUPER_AGENT_CONNECTION_LOGOS } from './superAgentConnectionLogos'

// Ported from the prototype's own `ChannelPreview` + per-channel mocks
// (WhatsAppMock/TelegramMock/IMessageMock/SlackMock in public/super-agent-prototype.html)
// — the real "mobile preview screen": an iPhone-frame mock of the actual merged agent
// thread, channel-accurate chrome (WhatsApp's teal header + online status, Telegram's
// blue bot header, iMessage's white header + blue bubbles, Slack's channel header +
// named app rows), grouped agent replies with a small colored avatar + name label, and
// a composer whose send button swaps to a mic icon when empty — exactly like the
// prototype. Shown after "Open <App>" (connects) or "See how it reads" (preview only).
interface ThreadMessage {
  /** 'them' = the person previewing this screen (right-aligned, green/blue).
   *  'agent' = one of the workspace's agents. 'human' = another teammate in a
   *  shared group thread — same bubble side/style as 'agent', own name label. */
  from: 'them' | 'agent' | 'human'
  agentId?: string
  /** Display name for a 'human' sender, e.g. a teammate in the WhatsApp group. */
  senderName?: string
  text: string
}

const AGENT_META: Record<string, { name: string; color: string; initial: string }> = {
  'review-response': { name: 'Review Response Agent', color: '#F97066', initial: 'R' },
  frontdesk: { name: 'AI Front Desk Agent', color: '#7A5AF8', initial: 'F' },
  'appointment-booking': { name: 'Appointment Booking Agent', color: '#4F86F7', initial: 'A' },
  'listings-health': { name: 'Listings Health Agent', color: '#12B76A', initial: 'L' },
  'review-generation': { name: 'Review Generation Agent', color: '#F79009', initial: 'G' },
}

const HUMAN_COLORS = ['#F79009', '#12B76A', '#4F86F7', '#F97066', '#7A5AF8']

function humanColor(name: string) {
  const hash = name.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return HUMAN_COLORS[hash % HUMAN_COLORS.length]
}

/** A group's own use case: several teammates asking their agents things in one
 * shared WhatsApp thread — the agent replies like any other member of the group. */
const GROUP_SEED: ThreadMessage[] = [
  { from: 'human', senderName: 'Maria', text: 'Can someone check if the 2pm at Downtown is confirmed?' },
  {
    from: 'agent',
    agentId: 'appointment-booking',
    text: 'Confirmed — the patient replied yes this morning.',
  },
  { from: 'them', text: 'Perfect, thanks.' },
  { from: 'human', senderName: 'Diego', text: 'Any reviews need a response today?' },
  {
    from: 'agent',
    agentId: 'review-response',
    text: "One 1-star at Westside, 20 minutes ago. Drafting a reply now — I'll post it here once it's ready.",
  },
  { from: 'them', text: 'Let me see it before it goes out.' },
  {
    from: 'agent',
    agentId: 'review-response',
    text: "Sure — I'll hold it for your approval instead of posting it automatically.",
  },
  { from: 'human', senderName: 'Sarah', text: 'Front desk missed a couple calls this morning.' },
  {
    from: 'agent',
    agentId: 'frontdesk',
    text: 'Two — both handled. One rescheduled, one was a billing question I answered directly.',
  },
  { from: 'human', senderName: 'Maria', text: 'Did the reminder texts go out for tomorrow’s appointments?' },
  {
    from: 'agent',
    agentId: 'frontdesk',
    text: 'Yes — 18 sent. 2 patients already confirmed, and one asked to reschedule, which I’ve started.',
  },
  { from: 'human', senderName: 'Diego', text: 'Can we get more reviews from this week’s patients?' },
  {
    from: 'agent',
    agentId: 'review-generation',
    text: "12 patients seen this week haven't left one yet. I can send requests now if you want.",
  },
  { from: 'them', text: 'Yes, go ahead and send them.' },
  { from: 'human', senderName: 'Sarah', text: 'Are we still showing the old holiday hours anywhere?' },
  {
    from: 'agent',
    agentId: 'listings-health',
    text: 'Just Yelp now — Google and Facebook are fixed. Yelp needs a manual update on their side.',
  },
]

const UNIFIED_SEED: ThreadMessage[] = [
  { from: 'them', text: 'How did Westside do this week?' },
  {
    from: 'agent',
    agentId: 'review-response',
    text: 'Westside pulled up to 4.3 from 4.1. I answered 14 reviews and booked 6 appointments straight from replies. Two reviews still need your call — both mention wait time.',
  },
  { from: 'them', text: 'Any missed calls while I was in surgery?' },
  {
    from: 'agent',
    agentId: 'frontdesk',
    text: 'Four. I answered all of them — two were hours questions, one rescheduled, and one is a new implant enquiry worth following up.',
  },
  { from: 'them', text: "How's the new patient pipeline looking this month?" },
  {
    from: 'agent',
    agentId: 'appointment-booking',
    text: '22 new patients booked so far, up from 15 last month. 9 came straight from missed-call follow-ups and 4 from review replies.',
  },
  { from: 'them', text: 'Are we still showing the old holiday hours anywhere?' },
  {
    from: 'agent',
    agentId: 'listings-health',
    text: 'Three listings still do. I can fix Google and Facebook now — Yelp needs a manual update on their side.',
  },
]

function AgentAvatar({ agentId, size = 22 }: { agentId?: string; size?: number }) {
  const meta = agentId ? AGENT_META[agentId] : undefined
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full text-white"
      style={{ width: size, height: size, background: meta?.color ?? '#7A5AF8', fontSize: size * 0.42 }}
    >
      {meta?.initial ?? 'B'}
    </span>
  )
}

function HumanAvatar({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full text-white"
      style={{ width: size, height: size, background: humanColor(name), fontSize: size * 0.42 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

// iPhone-style frame (brushed-titanium edge + status bar) — purely cosmetic, ported
// from the prototype's own `PhoneFrame`.
function PhoneFrame({ children, statusLight = true }: { children: React.ReactNode; statusLight?: boolean }) {
  return (
    <div
      className="relative mx-auto w-full shrink-0 overflow-hidden shadow-modal"
      style={{
        maxWidth: 390,
        borderRadius: 36,
        padding: 4,
        background: 'linear-gradient(155deg, #9a9a9d 0%, #ececed 22%, #6f6f73 48%, #d7d7da 74%, #86868a 100%)',
      }}
    >
      <div className="relative overflow-hidden bg-white" style={{ borderRadius: 32 }}>
        <div
          className={`relative z-10 flex items-end justify-between px-6 pb-1.5 text-[11px] ${statusLight ? 'text-white' : 'text-black'}`}
          style={{ height: 36 }}
        >
          <span>9:41</span>
          <span className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black" style={{ top: 8, height: 22, width: 84 }} />
          <span className="flex items-center gap-1">
            <Icon name="signal_cellular_alt" size={13} />
            <Icon name="battery_full" size={15} />
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}

function ComposerBar({
  draft,
  onDraftChange,
  onSend,
  placeholder,
  bg,
  accent,
}: {
  draft: string
  onDraftChange: (v: string) => void
  onSend: () => void
  placeholder: string
  bg: string
  accent: string
}) {
  return (
    <div className="flex items-center gap-sm px-md py-sm" style={{ background: bg }}>
      <input
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSend()
        }}
        placeholder={placeholder}
        className="h-8 flex-1 rounded-full border border-border bg-white px-md text-small text-text-primary outline-none"
      />
      <span
        role="button"
        onClick={onSend}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-white"
        style={{ background: accent }}
        aria-label="Send"
      >
        <Icon name={draft.trim() ? 'arrow_upward' : 'mic'} size={16} />
      </span>
    </div>
  )
}

function senderKey(m: ThreadMessage) {
  if (m.from === 'agent') return `agent:${m.agentId}`
  if (m.from === 'human') return `human:${m.senderName}`
  return 'them'
}

function ThreadBubble({ m, mine, showLabel, style, textColor }: { m: ThreadMessage; mine: boolean; showLabel: boolean; style: React.CSSProperties; textColor: string }) {
  const meta = m.agentId ? AGENT_META[m.agentId] : undefined
  const displayName = m.from === 'agent' ? meta?.name : m.senderName
  return (
    <div className={`mb-sm flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%]">
        {showLabel && (
          <div className="mb-xs flex items-center gap-xs">
            {m.from === 'agent' ? <AgentAvatar agentId={m.agentId} size={16} /> : <HumanAvatar name={m.senderName ?? ''} size={16} />}
            <span className="text-small" style={{ color: style.background === '#fff' ? '#666' : undefined }}>
              {displayName}
            </span>
          </div>
        )}
        <div className="rounded-sm px-sm py-xs text-small leading-snug" style={{ ...style, color: textColor }}>
          {m.text}
        </div>
      </div>
    </div>
  )
}

function ChannelThread({ channel, thread }: { channel: ChannelKey; thread: ThreadMessage[] }) {
  const bgByChannel: Record<ChannelKey, string> = {
    whatsapp: '#E5DDD5',
    telegram: '#AFC7DC',
    imessage: '#fff',
    slack: '#fff',
  }
  return (
    <div className="quiet-scroll h-[600px] overflow-y-auto px-md py-md" style={{ background: bgByChannel[channel] }}>
      {thread.map((m, i) => {
        const mine = m.from === 'them'
        const showLabel = !mine && (i === 0 || senderKey(thread[i - 1]) !== senderKey(m))
        const bubbleStyle: React.CSSProperties =
          channel === 'whatsapp'
            ? { background: mine ? '#DCF8C6' : '#fff' }
            : channel === 'telegram'
              ? { background: mine ? '#EEFFDE' : '#fff', borderRadius: 12 }
              : channel === 'imessage'
                ? { background: mine ? '#007AFF' : '#E9E9EB', borderRadius: 18 }
                : { background: mine ? '#F4F4F4' : '#fff' }
        const textColor = channel === 'imessage' && mine ? '#fff' : '#111'
        return <ThreadBubble key={i} m={m} mine={mine} showLabel={showLabel} style={bubbleStyle} textColor={textColor} />
      })}
    </div>
  )
}

const PREVIEW_CHANNELS: { key: ChannelKey; name: string }[] = [
  { key: 'whatsapp', name: 'WhatsApp' },
  { key: 'telegram', name: 'Telegram' },
  { key: 'imessage', name: 'iMessage' },
  { key: 'slack', name: 'Slack' },
]

type PreviewMode = 'personal' | 'group'

/** A quick keyword router so a typed message gets a reply tied to what was
 * actually asked, instead of one generic "Done" line regardless of input. */
function routeReply(text: string): { agentId: string; text: string } {
  const q = text.toLowerCase()
  if (/review|rating|star/.test(q)) {
    return { agentId: 'review-response', text: "On it — pulling the latest reviews now and I'll draft replies to anything that needs one." }
  }
  if (/call|phone|missed|voicemail/.test(q)) {
    return { agentId: 'frontdesk', text: "Checking the call log now — I'll flag anything that needs you." }
  }
  if (/book|appointment|schedule|reschedule|calendar/.test(q)) {
    return { agentId: 'appointment-booking', text: 'I can check real availability and get that on the calendar — which location?' }
  }
  if (/listing|hours|address|google|facebook|yelp/.test(q)) {
    return { agentId: 'listings-health', text: "Checking your listings now — I'll flag anything showing the wrong hours or address." }
  }
  return { agentId: 'frontdesk', text: "Got it — I'll look into that and post an update here once I have something." }
}

export function ChannelPreviewModal({ channel, onClose }: { channel: ChannelKey; onClose: () => void }) {
  const [activeChannel, setActiveChannel] = useState(channel)
  // Every channel is modeled both ways: a personal 1:1 thread, or the agent
  // added into an existing group/channel like any other member — default to
  // the group use case since that's the primary pitch on the Connections card.
  const [mode, setMode] = useState<PreviewMode>('group')
  const setup = SUPER_AGENT_CHANNEL_SETUP[activeChannel]
  const isGroup = mode === 'group'
  const [thread, setThread] = useState<ThreadMessage[]>(isGroup ? GROUP_SEED : UNIFIED_SEED)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onClose])

  useEffect(() => {
    setThread(isGroup ? GROUP_SEED : UNIFIED_SEED)
    setDraft('')
  }, [activeChannel, mode])

  if (!setup) return null

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    setThread((t) => [...t, { from: 'them', text }])
    const reply = routeReply(text)
    setTimeout(() => {
      setThread((t) => [...t, { from: 'agent', agentId: reply.agentId, text: reply.text }])
    }, 700)
  }

  const header = {
    whatsapp: {
      bg: '#075E54',
      accent: '#25D366',
      title: isGroup ? 'Front Desk Team' : 'Birdeye Agents',
      subtitle: isGroup ? 'Maria, Diego, Sarah + agents' : 'online',
      textLight: true,
    },
    telegram: {
      bg: '#527DA3',
      accent: '#2AABEE',
      title: isGroup ? 'Front Desk Team' : 'Birdeye Agents',
      subtitle: isGroup ? 'group · Maria, Diego, Sarah' : 'bot',
      textLight: true,
    },
    imessage: {
      bg: '#F9F9F9',
      accent: '#007AFF',
      title: isGroup ? 'Front Desk Team' : 'Birdeye Agents',
      subtitle: isGroup ? 'Maria, Diego, Sarah' : '',
      textLight: false,
    },
    slack: {
      bg: '#3F0E40',
      accent: '#007A5A',
      title: isGroup ? '#front-desk-team' : 'Birdeye Agents',
      subtitle: isGroup ? 'Chen Family Dental' : 'Direct message',
      textLight: true,
    },
  }[activeChannel]

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-white">
      <div className="flex shrink-0 items-center gap-md bg-surface px-2xl py-lg">
        <img src={SUPER_AGENT_CONNECTION_LOGOS.birdeye} alt="" className="size-6 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-body text-text-primary">Your agents, in the apps you already use</h2>
          <p className="mt-xs text-small text-text-secondary">A preview — every task says what it costs before it runs.</p>
        </div>
        <div className="hidden items-center gap-xs rounded-full bg-surface-selected p-xs sm:flex">
          {PREVIEW_CHANNELS.map((c) => {
            const active = activeChannel === c.key
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setActiveChannel(c.key)}
                className={`flex h-8 items-center gap-xs rounded-full px-md text-small transition-colors ${
                  active ? 'bg-surface text-text-primary shadow-card' : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                <ChannelGlyph kind={c.key} size={14} />
                {c.name}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-icon transition-colors hover:bg-surface-hover"
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-md overflow-y-auto px-lg py-2xl">
        <div className="flex items-center gap-xs rounded-full bg-surface-selected p-xs">
          {(['personal', 'group'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex h-8 items-center rounded-full px-md text-small transition-colors ${
                mode === m ? 'bg-surface text-text-primary shadow-card' : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {m === 'personal' ? 'Personal' : 'Group chat'}
            </button>
          ))}
        </div>
        <PhoneFrame statusLight={header.textLight}>
          <div className={`flex items-center gap-sm px-md pb-sm pt-xs ${header.textLight ? 'text-white' : 'text-text-primary'}`} style={{ background: header.bg }}>
            <Icon name="chevron_left" size={18} />
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/90">
              {isGroup ? (
                <Icon name="groups" size={16} className="text-text-secondary" />
              ) : (
                <img src={SUPER_AGENT_CONNECTION_LOGOS.birdeye} alt="" className="size-4" aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className={`truncate text-small ${header.textLight ? 'text-white' : 'text-text-primary'}`}>{header.title}</div>
              {header.subtitle && <div className="truncate text-[11px] opacity-70">{header.subtitle}</div>}
            </div>
            {activeChannel === 'whatsapp' && (
              <span className="flex gap-md">
                <Icon name="call" size={16} />
                <Icon name="volume_up" size={16} />
              </span>
            )}
            {activeChannel === 'slack' && <Icon name="search" size={16} />}
          </div>

          <ChannelThread channel={activeChannel} thread={thread} />

          <ComposerBar draft={draft} onDraftChange={setDraft} onSend={send} placeholder="Message" bg="#F0F0F0" accent={header.accent} />
        </PhoneFrame>
      </div>
    </div>
  )
}
