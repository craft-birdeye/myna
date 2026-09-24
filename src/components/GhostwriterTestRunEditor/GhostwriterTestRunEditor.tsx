import { useEffect, useRef, useState } from 'react'
import { Icon } from '../Icon/Icon'
import { DEFAULT_EVALUATIONS, EvalTable, QUALITY_EVALUATIONS } from '../FrontdeskTestRunEditor/FrontdeskTestRunEditor'
import type { GhostwriterTestRunEditorProps } from './GhostwriterTestRunEditor.types'

/** Response agent (23 Sep) Test tab — one page deeper than the test-run list, mirroring Front
 *  desk (Sep 23)'s own `FrontdeskTestRunEditor`: editable name, then a picker, then the same
 *  evaluation criteria. The picker here is a test suite instead of personas — reviews, not
 *  call/chat scenarios, are what this agent is tested against. */
export function GhostwriterTestRunEditor({ defaultName, testSuites, onBack, onRun }: GhostwriterTestRunEditorProps) {
  const [name, setName] = useState(defaultName)
  const [suiteId, setSuiteId] = useState<string | null>(null)
  const [qualityIds, setQualityIds] = useState<string[]>([])
  const [suiteOpen, setSuiteOpen] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const suiteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!suiteOpen) return
    function handleOutsideClick(event: MouseEvent) {
      if (suiteRef.current && !suiteRef.current.contains(event.target as Node)) setSuiteOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [suiteOpen])

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
          onClick={() => onRun({ name: name.trim() || defaultName, suite: selectedSuite, qualityEvaluationIds: qualityIds })}
          className="flex h-9 shrink-0 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
        >
          Run test
        </button>
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
