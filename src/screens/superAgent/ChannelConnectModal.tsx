import { useEffect } from 'react'
import { Icon } from '../../components'
import { ChannelGlyph, type ChannelKey } from './ChannelGlyph'
import { QrMock } from './QrMock'
import { SUPER_AGENT_CHANNEL_SETUP } from './superAgentSeedData'

// Ported from the prototype's own `ChannelConnectModal` (public/super-agent-prototype.html):
// a QR + brand-colored hero (with a glimpse of the sample thread), numbered pairing
// steps, a pairing-phrase row, a privacy note, and a footer with "See how it reads"
// (preview only) and the primary "Open <App>" CTA (connects + previews). Re-styled with
// myna's own tokens/shared-chrome classes (CLAUDE.md §6.7) rather than the prototype's
// own CSS variables, but the copy/structure/QR-and-thread hero are kept identical.
export interface ChannelConnectModalProps {
  channel: ChannelKey
  connected: boolean
  onClose: () => void
  /** Marks the channel connected and opens the mobile preview. */
  onConnect: (channel: ChannelKey) => void
  /** Opens the mobile preview without connecting. */
  onPreview: (channel: ChannelKey) => void
}

export function ChannelConnectModal({ channel, connected, onClose, onConnect, onPreview }: ChannelConnectModalProps) {
  const setup = SUPER_AGENT_CHANNEL_SETUP[channel]

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onClose])

  if (!setup) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-lg"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-full w-full max-w-[620px] flex-col overflow-hidden rounded-md bg-surface shadow-modal">
        <div className="flex items-center gap-sm border-b border-border px-xl py-lg">
          <ChannelGlyph kind={channel} size={22} />
          <h2 className="min-w-0 flex-1 truncate text-h3 text-text-primary">Connect to {setup.name}</h2>
          {connected && (
            <span className="flex items-center gap-xs whitespace-nowrap text-small text-chip-success-text">
              <span className="size-1.5 rounded-full bg-current" aria-hidden />
              Connected
            </span>
          )}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-icon transition-colors hover:bg-surface-hover"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-xl py-xl">
          <div className="flex items-center gap-lg overflow-hidden rounded-md p-lg" style={{ background: setup.band }}>
            <span className="shrink-0 rounded-md bg-white p-sm shadow-modal">
              <QrMock size={132} />
            </span>
            <span className="relative hidden min-w-0 flex-1 self-end sm:block">
              <span className="block translate-y-sm overflow-hidden rounded-t-md bg-white px-sm pb-lg pt-sm shadow-modal">
                <span className="mb-sm flex items-center gap-xs">
                  <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-primary text-[10px] text-white">B</span>
                  <span className="text-small text-[#111]">Birdeye Super Agents</span>
                </span>
                <span
                  className="mb-xs ml-auto block w-fit max-w-[90%] rounded-sm px-sm py-xs text-small leading-snug text-[#111]"
                  style={{ background: channel === 'imessage' ? '#007AFF' : '#DCF8C6', color: channel === 'imessage' ? '#fff' : '#111' }}
                >
                  {setup.sample[0]}
                </span>
                <span className="block w-fit max-w-[90%] rounded-sm bg-[#F1F1F1] px-sm py-xs text-small leading-snug text-[#111]">
                  {setup.sample[1]}
                </span>
              </span>
            </span>
          </div>

          <p className="mt-lg text-body text-text-secondary">{setup.blurb}</p>

          <ol className="mt-lg flex flex-col gap-md">
            {setup.steps.map(([title, desc], i) => (
              <li key={title} className="flex gap-md">
                <span className="mt-[1px] flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-selected text-small text-text-secondary">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-body text-text-primary">{title}</span>
                  <span className="block text-small leading-snug text-text-secondary">{desc}</span>
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-lg flex items-center gap-md rounded-md bg-surface-selected px-md py-sm">
            <span className="text-small uppercase tracking-wide text-text-tertiary">Pairing phrase</span>
            <span className="font-mono text-body text-text-primary">BIRDEYE-4127</span>
            <span className="ml-auto text-small text-text-tertiary">{setup.handle}</span>
          </div>

          <div className="mt-md flex items-start gap-sm px-xs py-xs">
            <span className="mt-[2px] text-chip-success-text">
              <Icon name="shield" size={16} />
            </span>
            <p className="text-small leading-snug text-text-secondary">
              We only see the messages you send to your agents. Nothing else in {setup.name} is read, and you can
              disconnect at any time.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-sm border-t border-border px-xl py-lg">
          <button
            type="button"
            onClick={() => onPreview(channel)}
            className="flex h-9 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
          >
            See how it reads
          </button>
          <button
            type="button"
            onClick={() => onConnect(channel)}
            className="flex h-9 items-center gap-xs rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
          >
            {connected ? 'Reopen' : setup.cta}
            <Icon name="open_in_new" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
