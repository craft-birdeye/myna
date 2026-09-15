import { useState } from 'react'
import { SUPER_AGENT_REACH_APPS } from './superAgentSeedData'
import { ChannelGlyph, type ChannelKey } from './ChannelGlyph'
import { ChannelConnectModal } from './ChannelConnectModal'
import { ChannelPreviewModal } from './ChannelPreviewModal'
import { ConnectorBrowser } from './ConnectorBrowser'

// Native "Connections" screen for the Super agent L1 module — same sticky header as
// My agents/Library; full-width, left-aligned card grids in place of the prototype's
// own `mx-auto`-centered version.
//
// "Reach your agents from another app" — each of the 4 cards now has a real brand
// mark (ChannelGlyph, ported from the prototype's own inline SVGs) and a "Connect"
// button. Connect opens `ChannelConnectModal` (ported from the prototype's own
// ChannelConnectModal: QR + pairing phrase + a glimpse of the thread). From there,
// "Open <App>" connects and opens `ChannelPreviewModal` — a phone-frame mock of the
// actual thread ("the mobile preview screen") — and "See how it reads" opens the same
// preview without connecting, matching the prototype's own connect/preview split.
//
// "Data sources" is now a categorized connector browser (`ConnectorBrowser`): a
// category rail + search over a catalog of real, accurately-branded connectors
// (superAgentConnectorCatalog.ts) instead of a flat list — connecting one of the 4
// messaging brands from inside the browser opens the same channel modal as the cards
// above, since it's the same underlying connection.
export function SuperAgentConnectionsScreen() {
  const [openChannel, setOpenChannel] = useState<ChannelKey | null>(null)
  const [previewChannel, setPreviewChannel] = useState<ChannelKey | null>(null)
  const [connectedChannels, setConnectedChannels] = useState<ChannelKey[]>([])

  const connectChannel = (channel: ChannelKey) => {
    setConnectedChannels((list) => (list.includes(channel) ? list : [...list, channel]))
    setOpenChannel(null)
    setPreviewChannel(channel)
  }

  return (
    <div className="flex h-full flex-col overflow-auto bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
        <div>
          <h1 className="text-h3 text-text-primary">Connections</h1>
          <p className="mt-xs text-body text-text-secondary">What your agents can read from and act on.</p>
        </div>
      </div>

      <div className="flex flex-col gap-2xl px-2xl py-lg">
        <section>
          <div className="flex items-baseline justify-between gap-md">
            <h2 className="text-body text-text-primary">Reach your agents from another app</h2>
            <span className="text-small text-text-tertiary">Pair once, every agent is reachable</span>
          </div>
          <div className="mt-md grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-4">
            {SUPER_AGENT_REACH_APPS.map((app) => {
              const channel = app.id as ChannelKey
              const connected = connectedChannels.includes(channel)
              return (
                <div key={app.id} className="flex flex-col gap-md rounded-md border border-border p-lg">
                  <div className="flex items-start justify-between gap-sm">
                    <span className="flex size-9 shrink-0 items-center justify-center">
                      <ChannelGlyph kind={channel} size={28} />
                    </span>
                    {connected && (
                      <span className="flex items-center gap-xs whitespace-nowrap text-small text-chip-success-text">
                        <span className="size-1.5 rounded-full bg-current" aria-hidden />
                        Connected
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-body text-text-primary">{app.name}</h3>
                    <p className="mt-xs text-body text-text-secondary">{app.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenChannel(channel)}
                    className="mt-auto flex h-9 items-center justify-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
                  >
                    {connected ? 'Manage' : 'Connect'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="text-body text-text-primary">Data sources</h2>
          <p className="mt-xs text-body text-text-secondary">
            What your agents can read from and write to. Agents ask for these as they need them, so you rarely have
            to come here.
          </p>
          <div className="mt-md">
            <ConnectorBrowser onConnectChannel={(channel) => channel && setOpenChannel(channel)} />
          </div>
        </section>
      </div>

      {openChannel && (
        <ChannelConnectModal
          channel={openChannel}
          connected={connectedChannels.includes(openChannel)}
          onClose={() => setOpenChannel(null)}
          onConnect={connectChannel}
          onPreview={(channel) => {
            setOpenChannel(null)
            setPreviewChannel(channel)
          }}
        />
      )}

      {previewChannel && <ChannelPreviewModal channel={previewChannel} onClose={() => setPreviewChannel(null)} />}
    </div>
  )
}
