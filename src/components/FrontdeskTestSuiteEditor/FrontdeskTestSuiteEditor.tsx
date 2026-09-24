import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import { FRONTDESK_SCENARIO_SUGGESTIONS, type FrontdeskTestSuite } from '../../data/frontdeskTestSessions'
import type { FrontdeskTestSuiteEditorProps } from './FrontdeskTestSuiteEditor.types'

/** Cycled alongside `FRONTDESK_SCENARIO_SUGGESTIONS` for the "Generate scenarios" preview table
 *  — there's no real model behind this prototype, so each previewed row pairs a scenario with
 *  a plausible, generic resolution rather than a genuinely-reasoned one. */
const PREVIEW_OUTCOMES = [
  'Agent resolves the request and confirms the details back to the caller.',
  'Agent completes the booking and sends a confirmation.',
  'Agent verifies the details on file and answers the question directly.',
  'Agent cannot complete the request and hands off to a person with a summary.',
]

/** Pre-filled into the description textarea for a brand-new suite (not shown as a grey
 *  placeholder) — an editable example rather than empty text with instructions floating over
 *  it, so "Generate scenarios" always has something to work from without typing first. */
const DEFAULT_SCENARIO_DESCRIPTION =
  'A new patient calls to book a cleaning. A caller asks to reschedule, then changes their mind. Someone disputes a bill and asks to speak with a person.'

interface PreviewScenario {
  description: string
  outcome: string
}

function UploadScenariosModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean
  onClose: () => void
  onDone: (fileName: string) => void
}) {
  const [fileName, setFileName] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setFileName(null)
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/20" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-scenarios-title"
        className="relative flex w-full max-w-[480px] flex-col rounded-md bg-surface shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-sm border-b border-border px-2xl py-lg">
          <p id="upload-scenarios-title" className="m-0 text-h3 text-text-primary">
            Upload file
          </p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="px-2xl py-xl">
          {fileName ? (
            <div className="flex items-center gap-md rounded-md border border-border p-md">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-surface-selected text-text-icon">
                <Icon name="draft" size={20} />
              </span>
              <p className="m-0 min-w-0 flex-1 truncate text-body text-text-primary">{fileName}</p>
              <button
                type="button"
                aria-label="Remove file"
                onClick={() => setFileName(null)}
                className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setFileName('scenarios.xlsx')}
              className="flex w-full flex-col items-center gap-sm rounded-md border border-dashed border-border-selected px-lg py-xl text-body text-text-secondary hover:bg-surface-hover"
            >
              <Icon name="upload" size={20} className="text-text-icon" />
              Click or drag and drop
            </button>
          )}
        </div>
        <div className="flex items-center justify-end gap-md border-t border-border px-2xl py-md">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!fileName}
            onClick={() => fileName && onDone(fileName)}
            className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
              fileName ? 'bg-primary text-white hover:bg-primary-hover' : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** Front desk (Sep 23) — full-page create flow for a test suite. Name, an AI scenario count
 *  (or an uploaded file), and a description. Personas and evaluations live on a test run. */
export function FrontdeskTestSuiteEditor({
  existingSuite,
  onBack,
  onSave,
}: FrontdeskTestSuiteEditorProps) {
  const [name, setName] = useState(existingSuite?.name ?? 'New test suite')
  const [scenarioCount, setScenarioCount] = useState(
    String(existingSuite?.scenarioCount ?? (existingSuite ? existingSuite.scenarios.length : 5)),
  )
  const [description, setDescription] = useState(existingSuite?.description ?? DEFAULT_SCENARIO_DESCRIPTION)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(existingSuite?.uploadedFileName ?? null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [previewScenarios, setPreviewScenarios] = useState<PreviewScenario[]>([])
  const nameInputRef = useRef<HTMLInputElement>(null)

  /** Builds the preview table's rows — cycles the same suggestion pool "Create test cases"
   *  draws from when there's no custom description, so a description-less generate still
   *  produces varied rows instead of repeating one line N times. */
  function generatePreview() {
    const count = Math.max(0, Number(scenarioCount) || 0)
    const customText = description.trim()
    const rows: PreviewScenario[] = Array.from({ length: count }, (_, index) => ({
      description: customText || FRONTDESK_SCENARIO_SUGGESTIONS[index % FRONTDESK_SCENARIO_SUGGESTIONS.length],
      outcome: PREVIEW_OUTCOMES[index % PREVIEW_OUTCOMES.length],
    }))
    setPreviewScenarios(rows)
  }

  function save() {
    const scenarios =
      previewScenarios.length > 0
        ? previewScenarios.map((row) => ({ text: row.description, voice: true, chat: true }))
        : (() => {
            const count = Math.max(0, Number(scenarioCount) || 0)
            const example = description.trim() || 'AI-generated front desk scenario'
            return Array.from({ length: count }, (_, index) => ({
              text: `${example}${count > 1 ? ` (${index + 1})` : ''}`,
              voice: true,
              chat: true,
            }))
          })()
    if (uploadedFileName) {
      scenarios.push({
        text: `Scenarios uploaded from ${uploadedFileName}.`,
        voice: true,
        chat: true,
      })
    }
    const suite: FrontdeskTestSuite = {
      id: existingSuite?.id ?? `fd-suite-${Date.now()}`,
      name: name.trim() || 'New test suite',
      scenarios,
      createdAt: existingSuite?.createdAt ?? 'Just now',
      scenarioCount: scenarios.length,
      description: description.trim(),
      uploadedFileName: uploadedFileName ?? undefined,
      generating: true,
    }
    onSave(suite)
  }

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
            aria-label="Test suite name"
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
          onClick={save}
          className="flex h-9 shrink-0 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
        >
          Save test suite
        </button>
      </div>

      <div className="flex flex-col gap-xs">
        <div className="flex flex-wrap items-center gap-sm text-body text-text-primary">
          <span>Create</span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            aria-label="Number of test scenarios"
            value={scenarioCount}
            onChange={(e) => setScenarioCount(e.target.value.replace(/[^\d]/g, ''))}
            className="h-9 w-16 rounded-sm border border-border-input bg-surface px-sm text-center text-body text-text-primary outline-none focus:border-primary"
          />
          <span>test scenarios using AI</span>
        </div>
        <p className="m-0 text-small text-text-secondary">
          To manually add scenarios,{' '}
          <button type="button" onClick={() => setUploadOpen(true)} className="text-text-action underline">
            upload file
          </button>
          {uploadedFileName && <span className="text-text-tertiary"> · {uploadedFileName}</span>}
        </p>
      </div>

      <div className="flex flex-col gap-xs">
        <label className="text-body text-text-primary" htmlFor="suite-scenario-description">
          Describe the test scenarios
        </label>
        <textarea
          id="suite-scenario-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-sm border border-border bg-surface px-md py-sm text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
        />
        <button
          type="button"
          onClick={generatePreview}
          className="flex h-9 w-fit items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary transition-colors hover:bg-surface-l2"
        >
          Generate scenarios
        </button>
      </div>

      {previewScenarios.length > 0 && (
        <div className="overflow-hidden rounded-sm border border-border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-l2">
                <th className="border-b border-border px-md py-sm text-small text-text-secondary">Call description</th>
                <th className="border-b border-l border-border px-md py-sm text-small text-text-secondary">Expected outcome</th>
              </tr>
            </thead>
            <tbody>
              {previewScenarios.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="max-w-[320px] px-md py-md align-top text-body text-text-secondary">{row.description}</td>
                  <td className="max-w-[320px] border-l border-border px-md py-md align-top text-body text-text-secondary">
                    {row.outcome}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UploadScenariosModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onDone={(fileName) => {
          setUploadedFileName(fileName)
          setUploadOpen(false)
        }}
      />
    </div>
  )
}
