import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  classifyFeedbackType,
  type GapType,
  type ProcedureStep,
  type RecommendationChange,
} from './recommendationsData'

const STORAGE_KEY = 'myna:recommendationOverrides'

export interface RecommendationOverride {
  /** Proposed-steps overrides, keyed by gap type — supports recommendations with multiple change sections. */
  changeStepOverrides?: Partial<Record<GapType, ProcedureStep[]>>
}

interface RecommendationOverridesStore {
  overrides: Record<string, RecommendationOverride>
  submitRefinement: (id: string, effectiveChanges: RecommendationChange[], text: string) => void
}

const RecommendationOverridesStoreContext = createContext<RecommendationOverridesStore | null>(null)

function loadInitial(): Record<string, RecommendationOverride> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/** Routes free-text feedback to whichever change section (procedure/knowledge/action) it best
 *  matches — reuses the same best-effort keyword classifier as Inbox feedback. Falls back to the
 *  recommendation's first section if the guessed type isn't actually present here. */
export function classifyRefinementTarget(text: string, availableTypes: GapType[]): GapType {
  const suggested = classifyFeedbackType(text)
  return availableTypes.includes(suggested) ? suggested : availableTypes[0]
}

export function RecommendationOverridesStoreProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, RecommendationOverride>>(loadInitial)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
    } catch {
      // localStorage unavailable (e.g. private browsing) — overrides stay in-memory for this session
    }
  }, [overrides])

  const submitRefinement = (id: string, effectiveChanges: RecommendationChange[], text: string) => {
    setOverrides((prev) => {
      const existing = prev[id] ?? {}
      const targetType = classifyRefinementTarget(text, effectiveChanges.map((c) => c.type))
      const targetChange = effectiveChanges.find((c) => c.type === targetType) ?? effectiveChanges[0]
      const newStep: ProcedureStep = { title: 'Refinement from copilot', bullets: [text] }

      return {
        ...prev,
        [id]: {
          changeStepOverrides: {
            ...existing.changeStepOverrides,
            [targetChange.type]: [...targetChange.proposedSteps, newStep],
          },
        },
      }
    })
  }

  return (
    <RecommendationOverridesStoreContext.Provider value={{ overrides, submitRefinement }}>
      {children}
    </RecommendationOverridesStoreContext.Provider>
  )
}

export function useRecommendationOverridesStore(): RecommendationOverridesStore {
  const ctx = useContext(RecommendationOverridesStoreContext)
  if (!ctx) throw new Error('useRecommendationOverridesStore must be used inside RecommendationOverridesStoreProvider')
  return ctx
}
