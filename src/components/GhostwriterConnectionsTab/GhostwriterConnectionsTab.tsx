import { Icon } from '../Icon/Icon'
import { Chip } from '../Chip/Chip'
import iconWhatsapp from '../../assets/icon-whatsapp.svg'
import iconGoogle from '../../assets/icon-google.svg'
import iconFacebook from '../../assets/icon-facebook.svg'

interface ReachCard {
  id: string
  label: string
  description: string
  iconSrc?: string
  glyph?: string
  glyphClassName?: string
}

const REACH_CARDS: ReachCard[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    description:
      'Add it to a group your team already messages in — it posts updates and takes requests right there, like any other member.',
    iconSrc: iconWhatsapp,
  },
  {
    id: 'slack',
    label: 'Slack',
    description:
      'Put the agents in a channel your team already watches, so anyone can see the work and approve it.',
    glyph: 'tag',
    glyphClassName: 'bg-[#f4ede8] text-[#4a154b]',
  },
  {
    id: 'imessage',
    label: 'iMessage',
    description:
      'A normal text thread — useful when you are away from a laptop and just want an answer.',
    glyph: 'sms',
    glyphClassName: 'bg-[#e7f9ea] text-[#34c759]',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    description: 'Runs as a bot, so approvals arrive as buttons rather than free text.',
    glyph: 'send',
    glyphClassName: 'bg-[#e6f4fd] text-[#229ed9]',
  },
]

type SourceStatus =
  | { kind: 'connected'; meta: string }
  | { kind: 'disconnected'; meta: string }
  | { kind: 'not-connected'; meta: string }

interface DataSource {
  id: string
  label: string
  iconSrc?: string
  glyph?: string
  status: SourceStatus
}

const DATA_SOURCES: DataSource[] = [
  { id: 'gbp', label: 'Google Business Profile', iconSrc: iconGoogle, status: { kind: 'connected', meta: '4 locations' } },
  { id: 'fb', label: 'Facebook Pages', iconSrc: iconFacebook, status: { kind: 'connected', meta: '4 pages' } },
  { id: 'surveys', label: 'Birdeye surveys', glyph: 'forum', status: { kind: 'connected', meta: 'Connected' } },
  { id: 'calendar', label: 'Appointment calendar', glyph: 'calendar_month', status: { kind: 'disconnected', meta: 'Lakeside disconnected' } },
  { id: 'phone', label: 'Phone number', glyph: 'call', status: { kind: 'connected', meta: '(555) 0100' } },
  { id: 'hubspot', label: 'HubSpot CRM', glyph: 'sync_alt', status: { kind: 'connected', meta: 'Connected' } },
  { id: 'elevenlabs', label: 'ElevenLabs voice', glyph: 'graphic_eq', status: { kind: 'connected', meta: 'Connected' } },
  { id: 'canva', label: 'Canva', glyph: 'palette', status: { kind: 'connected', meta: 'Connected' } },
  { id: 'webchat', label: 'Website chat', glyph: 'chat', status: { kind: 'connected', meta: 'Installed' } },
  { id: 'whatsapp-source', label: 'WhatsApp', glyph: 'chat_bubble', status: { kind: 'not-connected', meta: 'Not connected' } },
  { id: 'slack-source', label: 'Slack', glyph: 'tag', status: { kind: 'not-connected', meta: 'Not connected' } },
]

function DataSourceRow({ source }: { source: DataSource }) {
  return (
    <div className="flex items-center justify-between gap-md rounded-sm border border-border bg-surface px-lg py-md">
      <div className="flex min-w-0 items-center gap-md">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-surface-l2 text-text-icon">
          {source.iconSrc ? (
            <img src={source.iconSrc} alt="" className="size-5" />
          ) : (
            <Icon name={source.glyph ?? 'link'} size={20} />
          )}
        </span>
        <div className="min-w-0">
          <p className="m-0 text-body text-text-primary">{source.label}</p>
          <p
            className={`m-0 text-small ${
              source.status.kind === 'disconnected' ? 'text-chip-danger-text' : 'text-text-tertiary'
            }`}
          >
            {source.status.meta}
          </p>
        </div>
      </div>
      {source.status.kind === 'connected' ? (
        <Chip label="Connected" variant="success" showDot />
      ) : source.status.kind === 'disconnected' ? (
        <button
          type="button"
          className="flex h-9 shrink-0 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
        >
          Reconnect
        </button>
      ) : (
        <button
          type="button"
          className="flex h-9 shrink-0 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary transition-colors hover:bg-surface-l2"
        >
          Connect
        </button>
      )}
    </div>
  )
}

/** Create agent CTA (agent list view) flow only — the Tools tab. Read-only mock of what's
 *  reachable/connected at the account level; nothing here is specific to the draft agent. */
export function GhostwriterConnectionsTab() {
  return (
    <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto bg-surface px-2xl py-xl">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2xl">
        <div>
          <h1 className="m-0 text-h3 text-text-primary">Tools</h1>
          <p className="m-0 mt-xs text-small text-text-secondary">What your agents can read from and act on.</p>
        </div>

        <div className="flex flex-col gap-md">
          <div className="flex items-baseline justify-between gap-md">
            <h2 className="m-0 text-h3 text-text-primary">Reach your agents from another app</h2>
            <span className="text-small text-text-tertiary">Pair once, every agent is reachable</span>
          </div>
          <div className="grid grid-cols-4 gap-md">
            {REACH_CARDS.map((card) => (
              <div key={card.id} className="flex flex-col gap-md rounded-sm border border-border bg-surface p-lg">
                {card.iconSrc ? (
                  <img src={card.iconSrc} alt="" className="size-8" />
                ) : (
                  <span className={`flex size-8 items-center justify-center rounded-full ${card.glyphClassName}`}>
                    <Icon name={card.glyph ?? 'link'} size={18} />
                  </span>
                )}
                <div>
                  <p className="m-0 text-body text-text-primary">{card.label}</p>
                  <p className="m-0 mt-xs text-small text-text-secondary">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-md">
          <div>
            <h2 className="m-0 text-h3 text-text-primary">Data sources</h2>
            <p className="m-0 mt-xs text-small text-text-secondary">
              What your agents can read from and write to. Agents ask for these as they need them, so you rarely have to come here.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-md">
            {DATA_SOURCES.map((source) => (
              <DataSourceRow key={source.id} source={source} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
