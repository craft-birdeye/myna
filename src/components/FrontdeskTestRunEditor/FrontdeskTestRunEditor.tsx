import { useEffect, useRef, useState } from 'react'
import { Icon } from '../Icon/Icon'
import type { TestPersonality } from '../TestPersonalitySection/TestPersonalitySection.types'
import type { FrontdeskTestSuite } from '../../data/frontdeskTestSessions'

/** Exported so `GhostwriterTestRunEditor` (Response agent (23 Sep)'s own test-run page) can
 *  show the identical evaluation criteria instead of a copy that could drift. */
export const DEFAULT_EVALUATIONS = [
  {
    id: 'response',
    label: 'Response evaluation',
    description: "Evaluates if the agent's response matches the desired response.",
  },
  {
    id: 'topic',
    label: 'Topic assertion',
    description: "Assesses the agent's ability to select the correct topic.",
  },
  {
    id: 'action',
    label: 'Action assertion',
    description: "Assesses the agent's ability to select the correct actions.",
  },
]

export const QUALITY_EVALUATIONS = [
  {
    id: 'completeness',
    label: 'Completeness',
    description: 'Evaluates if the response includes all necessary information.',
  },
  {
    id: 'coherence',
    label: 'Coherence',
    description: 'Evaluates if the response is easy to read and free of grammatical errors.',
  },
  {
    id: 'conciseness',
    label: 'Conciseness',
    description: 'Evaluates if the response is short but accurate.',
  },
  {
    id: 'latency',
    label: 'Latency',
    description: 'Tests the length of time, in milliseconds, the agent takes to respond.',
  },
]

export interface FrontdeskTestRunDraft {
  name: string
  personaIds: string[]
  qualityEvaluationIds: string[]
  suite: FrontdeskTestSuite | null
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex size-[18px] shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-control-border bg-surface'
      }`}
    >
      {checked && <Icon name="check" size={14} weight={500} className="text-white" />}
    </span>
  )
}

export function EvalTable({
  rows,
  selectable,
  selectedIds,
  onToggle,
  onToggleAll,
}: {
  rows: { id: string; label: string; description: string }[]
  selectable?: boolean
  selectedIds?: string[]
  onToggle?: (id: string) => void
  onToggleAll?: () => void
}) {
  const allSelected = selectable && rows.every((row) => selectedIds?.includes(row.id))
  return (
    <div className="overflow-hidden rounded-sm border border-border">
      <div className="grid grid-cols-[minmax(0,280px)_1fr] bg-surface-l2">
        <div className="flex items-center gap-sm border-r border-border px-md py-sm text-small text-text-secondary">
          {selectable && (
            <button type="button" aria-label="Select all response quality evaluations" onClick={onToggleAll}>
              <CheckBox checked={Boolean(allSelected)} />
            </button>
          )}
          Evaluation
          <Icon name="expand_more" size={16} className="text-text-icon" />
        </div>
        <div className="flex items-center gap-sm px-md py-sm text-small text-text-secondary">
          Description
          <Icon name="expand_more" size={16} className="text-text-icon" />
        </div>
      </div>
      {rows.map((row) => (
        <div key={row.id} className="grid grid-cols-[minmax(0,280px)_1fr] border-t border-border">
          <div className="flex items-center gap-sm border-r border-border px-md py-md text-body text-text-primary">
            {selectable && (
              <button type="button" aria-label={row.label} onClick={() => onToggle?.(row.id)}>
                <CheckBox checked={Boolean(selectedIds?.includes(row.id))} />
              </button>
            )}
            {row.label}
          </div>
          <p className="m-0 px-md py-md text-body text-text-secondary">{row.description}</p>
        </div>
      ))}
    </div>
  )
}

/** Front desk (Sep 23) Test tab — one page deeper than the test-run list. Editable name,
 *  the personalities from the Personality section, and the evaluations for this run. */
export function FrontdeskTestRunEditor({
  defaultName,
  personalities,
  testSuites,
  onBack,
  onRun,
}: {
  defaultName: string
  personalities: TestPersonality[]
  testSuites: FrontdeskTestSuite[]
  onBack: () => void
  onRun: (draft: FrontdeskTestRunDraft) => void
}) {
  const [name, setName] = useState(defaultName)
  const [personaIds, setPersonaIds] = useState<string[]>([])
  const [qualityIds, setQualityIds] = useState<string[]>([])
  const [personasOpen, setPersonasOpen] = useState(false)
  const [suiteId, setSuiteId] = useState<string | null>(null)
  const [suiteOpen, setSuiteOpen] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const personasRef = useRef<HTMLDivElement>(null)
  const suiteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!personasOpen) return
    function handleOutsideClick(event: MouseEvent) {
      if (personasRef.current && !personasRef.current.contains(event.target as Node)) setPersonasOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [personasOpen])

  useEffect(() => {
    if (!suiteOpen) return
    function handleOutsideClick(event: MouseEvent) {
      if (suiteRef.current && !suiteRef.current.contains(event.target as Node)) setSuiteOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [suiteOpen])

  const selectedPersonas = personalities.filter((personality) => personaIds.includes(personality.id))
  const personaLabel =
    selectedPersonas.length === 0
      ? 'Select personas'
      : selectedPersonas.length === 1
        ? selectedPersonas[0].name
        : `${selectedPersonas.length} personas selected`
  const selectedSuite = testSuites.find((suite) => suite.id === suiteId) ?? null

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex items-center justify-between gap-sm">
        <div className="flex min-w-0 items-center gap-sm">
          <button
            type="button"
            aria-label="Back"
            onClick={onBack}
            className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="arrow_back" size={20} />
          </button>
          <input
            ref={nameInputRef}
            value={name}
            aria-label="Test run name"
            onChange={(e) => setName(e.target.value)}
            style={{ fieldSizing: 'content' } as React.CSSProperties}
            className="max-w-full shrink border-0 border-b-2 border-transparent bg-transparent text-h3 text-text-primary outline-none focus:border-primary"
          />
          <button
            type="button"
            aria-label="Edit name"
            onClick={() => nameInputRef.current?.focus()}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="edit" size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={() =>
            onRun({
              name: name.trim() || defaultName,
              personaIds,
              qualityEvaluationIds: qualityIds,
              suite: selectedSuite,
            })
          }
          className="flex h-9 shrink-0 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
        >
          Run test
        </button>
      </div>

      <div ref={personasRef} className="relative flex max-w-[420px] flex-col gap-xs">
        <label className="text-body text-text-primary">Personas</label>
        <button
          type="button"
          aria-expanded={personasOpen}
          onClick={() => setPersonasOpen((open) => !open)}
          className="flex h-9 w-full items-center justify-between rounded-sm border border-border-input bg-surface px-md text-left text-body"
        >
          <span className={selectedPersonas.length > 0 ? 'truncate text-text-primary' : 'text-text-tertiary'}>{personaLabel}</span>
          <Icon name="expand_more" size={18} className="shrink-0 text-text-icon" />
        </button>
        {personasOpen && (
          <div className="absolute top-full z-20 mt-xs max-h-64 w-full overflow-y-auto rounded-sm border border-border bg-surface py-xs shadow-dropdown">
            {personalities.map((personality) => {
              const checked = personaIds.includes(personality.id)
              return (
                <button
                  key={personality.id}
                  type="button"
                  onClick={() =>
                    setPersonaIds((current) =>
                      current.includes(personality.id) ? current.filter((id) => id !== personality.id) : [...current, personality.id],
                    )
                  }
                  className="flex w-full items-center gap-sm px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                >
                  <CheckBox checked={checked} />
                  <span className="min-w-0 flex-1 truncate">{personality.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div ref={suiteRef} className="relative flex max-w-[420px] flex-col gap-xs">
        <label className="text-body text-text-primary">Test suite</label>
        <button
          type="button"
          aria-expanded={suiteOpen}
          onClick={() => setSuiteOpen((open) => !open)}
          className="flex h-9 w-full items-center justify-between rounded-sm border border-border-input bg-surface px-md text-left text-body"
        >
          <span className={selectedSuite ? 'truncate text-text-primary' : 'text-text-tertiary'}>
            {selectedSuite?.name ?? 'Select a test suite'}
          </span>
          <Icon name="expand_more" size={18} className="shrink-0 text-text-icon" />
        </button>
        {suiteOpen && (
          <div className="absolute top-full z-20 mt-xs max-h-64 w-full overflow-y-auto rounded-sm border border-border bg-surface py-xs shadow-dropdown">
            {testSuites.length === 0 ? (
              <p className="m-0 px-md py-sm text-body text-text-tertiary">No test suites yet.</p>
            ) : (
              testSuites.map((suite) => (
                <button
                  key={suite.id}
                  type="button"
                  onClick={() => {
                    setSuiteId(suite.id)
                    setSuiteOpen(false)
                  }}
                  className="flex w-full items-center px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                >
                  <span className="min-w-0 flex-1 truncate">{suite.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-md">
        <div>
          <h2 className="m-0 text-body text-text-primary">Evaluations</h2>
          <p className="m-0 mt-2xs text-small text-text-secondary">
            Choose the evaluations you want to perform for this batch test.
          </p>
        </div>
        <div className="flex flex-col gap-sm">
          <h3 className="m-0 text-body text-text-primary">Default evaluations</h3>
          <EvalTable rows={DEFAULT_EVALUATIONS} />
        </div>
        <div className="flex flex-col gap-sm">
          <h3 className="m-0 text-body text-text-primary">Response quality evaluations</h3>
          <EvalTable
            rows={QUALITY_EVALUATIONS}
            selectable
            selectedIds={qualityIds}
            onToggle={(id) =>
              setQualityIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
            }
            onToggleAll={() =>
              setQualityIds((current) =>
                QUALITY_EVALUATIONS.every((row) => current.includes(row.id)) ? [] : QUALITY_EVALUATIONS.map((row) => row.id),
              )
            }
          />
        </div>
      </div>
    </div>
  )
}
