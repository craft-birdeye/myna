import { Icon } from '../../components'
import { SUPER_AGENT_DATA_SOURCES, SUPER_AGENT_REACH_APPS, type SuperAgentConnectionApp, type SuperAgentDataSource } from './superAgentSeedData'
import { SUPER_AGENT_CONNECTION_LOGOS } from './superAgentConnectionLogos'

// A real brand logo (when `logoSrc` is set) always wins over the Material-icon
// fallback — see superAgentConnectionLogos.ts for which brands have a bundled asset.
function ConnectionMark({ item }: { item: SuperAgentConnectionApp | SuperAgentDataSource }) {
  const logo = item.logoSrc ? SUPER_AGENT_CONNECTION_LOGOS[item.logoSrc] : undefined
  return (
    <span className={`flex size-9 shrink-0 items-center justify-center rounded-md ${item.iconClassName}`}>
      {logo ? <img src={logo} alt="" className="size-5" aria-hidden /> : <Icon name={item.icon ?? 'link'} size={20} />}
    </span>
  )
}

// Native "Connections" screen for the Super agent L1 module — same sticky header as
// My agents/Library; full-width, left-aligned card grids in place of the prototype's
// own `mx-auto`-centered version.
export function SuperAgentConnectionsScreen() {
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
            {SUPER_AGENT_REACH_APPS.map((app) => (
              <div key={app.id} className="flex flex-col gap-md rounded-md border border-border p-lg">
                <ConnectionMark item={app} />
                <div>
                  <h3 className="text-body text-text-primary">{app.name}</h3>
                  <p className="mt-xs text-body text-text-secondary">{app.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-body text-text-primary">Data sources</h2>
          <p className="mt-xs text-body text-text-secondary">
            What your agents can read from and write to. Agents ask for these as they need them, so you rarely have
            to come here.
          </p>
          <div className="mt-md grid grid-cols-1 gap-md sm:grid-cols-2">
            {SUPER_AGENT_DATA_SOURCES.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between gap-md rounded-md border border-border px-lg py-md"
              >
                <div className="flex items-center gap-md">
                  <ConnectionMark item={source} />
                  <div>
                    <h3 className="text-body text-text-primary">{source.name}</h3>
                    <p
                      className={`mt-xs text-small ${
                        source.state === 'reconnect' ? 'text-chip-danger-text' : 'text-text-tertiary'
                      }`}
                    >
                      {source.detail}
                    </p>
                  </div>
                </div>
                {source.state === 'connected' ? (
                  <span className="flex items-center gap-xs whitespace-nowrap text-small text-chip-success-text">
                    <span className="size-1.5 rounded-full bg-current" aria-hidden />
                    Connected
                  </span>
                ) : (
                  <button
                    type="button"
                    className={
                      source.state === 'reconnect'
                        ? 'flex h-9 shrink-0 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover'
                        : 'flex h-9 shrink-0 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2'
                    }
                  >
                    {source.state === 'reconnect' ? 'Reconnect' : 'Connect'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
