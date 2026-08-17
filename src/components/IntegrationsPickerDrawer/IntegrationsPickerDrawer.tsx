import { useEffect, useMemo, useState } from 'react'
import { BackArrowIcon } from '../../assets/BackArrowIcon'
import { IntegrationListCard } from '../IntegrationListCard/IntegrationListCard'
import type { IntegrationsPickerDrawerProps } from './IntegrationsPickerDrawer.types'
import { Search } from 'lucide-react'

export function IntegrationsPickerDrawer({
  open,
  integrations,
  connectedIds,
  selectedId,
  onClose,
  onSave,
  onOpenIntegrationSettings,
}: IntegrationsPickerDrawerProps) {
  const [query, setQuery] = useState('')
  const [draftSelectedId, setDraftSelectedId] = useState<string | null>(selectedId)
  const [draftConnectedIds, setDraftConnectedIds] = useState<string[]>(connectedIds)

  useEffect(() => {
    if (open) {
      setDraftSelectedId(selectedId)
      setDraftConnectedIds(connectedIds)
      setQuery('')
    }
  }, [open, connectedIds, selectedId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return integrations
    return integrations.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
    )
  }, [integrations, query])

  const canSave =
    draftSelectedId !== null && draftConnectedIds.includes(draftSelectedId)

  return (
    <div className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        className={`absolute right-2 top-2 flex h-[calc(100%-16px)] w-[650px] max-w-[calc(92vw-8px)] flex-col overflow-hidden rounded-2xl bg-surface shadow-modal transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between px-2xl pb-lg pt-2xl">
          <div className="flex items-center gap-sm">
            <button
              type="button"
              aria-label="Back"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
            >
              <BackArrowIcon />
            </button>
            <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Integrations</h2>
          </div>
          <button
            type="button"
            onClick={() =>
              onSave({ selectedId: draftSelectedId, connectedIds: draftConnectedIds })
            }
            disabled={!canSave}
            className={`flex h-[34px] items-center rounded-md px-lg text-body transition-colors ${
              canSave
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
            }`}
          >
            Save
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-md overflow-hidden px-2xl pb-2xl">
          <div className="flex h-[34px] shrink-0 items-center gap-sm rounded-md border border-border-input bg-surface px-md">
            <Search className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search integration"
              className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-body text-text-tertiary">
                No integrations match your search.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-md">
              {filtered.map((integration) => (
                <IntegrationListCard
                  key={integration.id}
                  name={integration.name}
                  description={integration.description}
                  iconBg={integration.iconBg}
                  iconLabel={integration.iconLabel}
                  selected={
                    draftConnectedIds.includes(integration.id) &&
                    draftSelectedId === integration.id
                  }
                  connected={draftConnectedIds.includes(integration.id)}
                  onSelect={() => {
                    if (draftConnectedIds.includes(integration.id)) {
                      setDraftSelectedId(integration.id)
                    }
                  }}
                  onConnect={() => onOpenIntegrationSettings?.(integration.id)}
                  onOpenSettings={
                    onOpenIntegrationSettings
                      ? () => onOpenIntegrationSettings(integration.id)
                      : undefined
                  }
                  onView={
                    onOpenIntegrationSettings
                      ? () => onOpenIntegrationSettings(integration.id)
                      : undefined
                  }
                />
              ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
