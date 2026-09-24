import React, { createContext, useContext, useState } from 'react'
import { INITIAL_FALLBACK_FAILOVER, type FallbackFailoverConfig } from './fallbackFailoverData'

interface FallbackFailoverStore {
  config: FallbackFailoverConfig
  saveConfig: (next: FallbackFailoverConfig) => void
}

const FallbackFailoverStoreContext = createContext<FallbackFailoverStore | null>(null)

export function FallbackFailoverStoreProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<FallbackFailoverConfig>(INITIAL_FALLBACK_FAILOVER)

  const saveConfig = (next: FallbackFailoverConfig) => setConfig(next)

  return (
    <FallbackFailoverStoreContext.Provider value={{ config, saveConfig }}>
      {children}
    </FallbackFailoverStoreContext.Provider>
  )
}

export function useFallbackFailoverStore(): FallbackFailoverStore {
  const ctx = useContext(FallbackFailoverStoreContext)
  if (!ctx) throw new Error('useFallbackFailoverStore must be used inside FallbackFailoverStoreProvider')
  return ctx
}
