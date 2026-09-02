import { Fragment, useState } from 'react'
import { ArrowUp, ChevronDown, ChevronRight, ChevronUp, Check, Info, Paperclip, X } from 'lucide-react'
import { DataTable, Link, TopNav } from '../components'
import { EMPLOYEE_IMPORT_HISTORY, EmployeeImportRecord } from '../data/employeeImportHistory'

const STEPS = ['Upload', 'Match', 'Import']

const MATCHED_COLUMNS = [
  { column: 'First name', required: false, sample: 'John', property: 'First name' },
  { column: 'Last name', required: false, sample: 'Doe', property: 'Last name' },
  { column: 'Email', required: true, sample: 'john.doe@birdeye.com', property: 'Email' },
  { column: 'Phone number', required: false, sample: '(972) 532-3521', property: 'Phone number' },
]

const BIRDEYE_PROPERTY_OPTIONS = ['First name', 'Last name', 'Location', 'Phone number', 'Email']

interface EmployeeBulkImportScreenProps {
  onBack: () => void
}

export function EmployeeBulkImportScreen({ onBack }: EmployeeBulkImportScreenProps) {
  const [step, setStep] = useState(0)
  const [fileName, setFileName] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(true)
  const [history, setHistory] = useState<EmployeeImportRecord[]>(EMPLOYEE_IMPORT_HISTORY)
  const [showTagBanner, setShowTagBanner] = useState(true)
  const [imported, setImported] = useState(false)

  const historyColumns = [
    {
      key: 'fileName' as const,
      label: 'File name',
      render: (_: unknown, row: EmployeeImportRecord) => (
        <div className="flex flex-col">
          <span className="text-text-action">{row.fileName}</span>
          <span className="text-small text-text-tertiary">{row.rowsImported} row{row.rowsImported === 1 ? '' : 's'} imported</span>
        </div>
      ),
    },
    { key: 'date' as const, label: 'Date', sortable: true },
    { key: 'importedBy' as const, label: 'Imported by' },
  ]

  function handleRemoveFile() {
    setFileName(null)
  }

  function finishImport() {
    setHistory((prev) => [
      { id: `${Date.now()}`, fileName: fileName ?? 'Employees_Import.xlsx', rowsImported: 1, date: 'Sep 02 2026', importedBy: 'Admin' },
      ...prev,
    ])
    setImported(true)
  }

  function handleCancel() {
    setStep(0)
    setFileName(null)
  }

  function handleReturn() {
    setStep(0)
    setFileName(null)
    setImported(false)
    setShowTagBanner(true)
    onBack()
  }

  return (
    <div className="flex h-full flex-col overflow-auto">
      <TopNav initials="S" />

      <div className="px-2xl pt-lg">
        {/* Breadcrumb */}
        <div className="flex items-center gap-xs">
          <Link as="button" onClick={onBack} className="text-body">
            Employees
          </Link>
          <ChevronRight className="size-4 text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth />
          <span className="text-body text-text-primary">Bulk import</span>
        </div>

        <h1 className="mt-3xl text-h3 text-text-primary">Import employees</h1>

        {/* Stepper */}
        <div className="mx-auto mt-4xl flex w-full max-w-[640px] items-start">
          {STEPS.map((label, i) => (
            <Fragment key={label}>
              <div className="flex flex-col items-center gap-xs">
                {i < step || (i === step && imported) ? (
                  <div className="flex size-xl items-center justify-center rounded-full bg-primary text-small text-white">
                    <Check className="size-4" strokeWidth={2.5} absoluteStrokeWidth />
                  </div>
                ) : (
                  <div
                    className={`flex size-xl items-center justify-center rounded-full border-2 text-small ${
                      i === step ? 'border-primary text-primary' : 'border-chip-neutral-text text-chip-neutral-text'
                    }`}
                  >
                    {i + 1}
                  </div>
                )}
                <span className={`text-body ${i <= step ? 'text-text-primary' : 'text-text-heading'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`mt-2.5 h-px flex-1 ${i < step || (i === step && imported) ? 'bg-primary' : 'bg-border-strong'}`} />}
            </Fragment>
          ))}
        </div>

        <div className={`mx-auto mt-2xl w-full ${step === 1 ? 'max-w-[960px]' : 'max-w-[640px]'}`}>
          {step === 0 && (
            <div className={`flex min-h-[220px] flex-col rounded-md border border-dashed border-border-strong ${fileName ? 'p-sm' : ''}`}>
              {fileName ? (
                <>
                  <div className="flex items-center justify-between gap-md rounded-sm bg-chip-neutral-bg px-lg py-md">
                    <div className="flex items-center gap-sm">
                      <Paperclip className="size-4 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                      <span className="text-body text-text-primary">{fileName}</span>
                    </div>
                    <button type="button" onClick={handleRemoveFile} className="text-body text-text-action hover:underline">
                      Remove
                    </button>
                  </div>
                  <div className="flex flex-1 items-center justify-center">
                    <div className="flex size-xl items-center justify-center rounded-full border-2 border-primary">
                      <Check className="size-4 text-primary" strokeWidth={2} absoluteStrokeWidth />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-sm px-2xl py-3xl">
                  <ArrowUp className="size-6 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                  <button
                    type="button"
                    onClick={() => {
                      setFileName('Employee list 2026')
                      setStep(1)
                    }}
                    className="text-body text-text-action hover:underline"
                  >
                    Upload spreadsheet
                  </button>
                  <p className="text-center text-body text-text-secondary">Drag and drop to upload your employees</p>
                  <p className="text-center text-body text-text-secondary">All .xlsx and .xls file types are supported</p>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <>
              <div className="flex rounded-md border border-dashed border-border-strong p-sm">
                <div className="flex flex-1 items-center gap-sm rounded-sm bg-chip-neutral-bg px-lg py-md">
                  <Paperclip className="size-4 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                  <span className="text-body text-text-primary">{fileName}</span>
                </div>
              </div>

              <h2 className="mt-2xl text-center text-body text-text-primary">Spreadsheet preview</h2>

              <div className="mt-lg">
                <div className="flex bg-surface-subtle px-lg py-sm text-small text-text-secondary">
                  <div className="w-[96px] shrink-0">Matched</div>
                  <div className="flex-1">Spreadsheet column</div>
                  <div className="flex-1">Sample data</div>
                  <div className="flex-1">Birdeye property</div>
                </div>
                {MATCHED_COLUMNS.map((c) => (
                  <div
                    key={c.column}
                    className="flex items-center border-t border-border px-lg py-md"
                  >
                    <div className="w-[96px] shrink-0">
                      <div className="flex size-6 items-center justify-center rounded-full bg-chip-success-text">
                        <Check className="size-4 text-white" strokeWidth={2.5} absoluteStrokeWidth />
                      </div>
                    </div>
                    <div className="flex-1 text-body text-text-primary">
                      {c.column}
                      {c.required ? '*' : ''}
                    </div>
                    <div className="flex-1 text-body text-[#212121]">{c.sample}</div>
                    <div className="relative flex-1">
                      <select
                        defaultValue={c.property}
                        className="w-full appearance-none rounded-sm border border-border-input bg-surface px-md py-sm pr-2xl text-body text-text-primary outline-none focus:border-primary"
                      >
                        {BIRDEYE_PROPERTY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-md top-1/2 size-4 -translate-y-1/2 text-text-icon"
                        strokeWidth={1.6}
                        absoluteStrokeWidth
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            imported ? (
              <div className="flex flex-col items-center gap-md rounded-md bg-surface-muted px-2xl py-3xl">
                <ArrowUp className="size-8 text-chip-success-text" strokeWidth={1.6} absoluteStrokeWidth />
                <h2 className="text-h3 text-chip-success-text">Your import has started</h2>
                <div className="mt-lg flex flex-col items-center gap-xs text-body text-text-primary">
                  <span className="flex items-center gap-xs">
                    <Info className="size-4 text-chip-success-text" strokeWidth={1.6} absoluteStrokeWidth />
                    This import might take a few minutes.
                  </span>
                  <span>No need to wait here, we'll take care of everything else.</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-md rounded-md bg-surface-muted px-2xl py-3xl">
                <ArrowUp className="size-8 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                <h2 className="text-base text-text-primary">We're ready to import</h2>
                <div className="flex items-center gap-xs text-body text-text-primary">
                  <Info className="size-4 text-chip-success-text" strokeWidth={1.6} absoluteStrokeWidth />
                  This import might take a few minutes.
                </div>
              </div>
            )
          )}

          {imported ? (
            <div className="mt-lg flex justify-end">
              <button
                type="button"
                onClick={handleReturn}
                className="rounded-sm bg-primary px-lg py-sm text-body text-white hover:bg-primary-hover"
              >
                Return to employees
              </button>
            </div>
          ) : (
            <>
              <div className={`mt-lg flex items-center gap-sm ${step === 2 ? 'justify-between' : 'justify-end'}`}>
                {step === 2 && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-sm px-lg py-sm text-body text-text-action hover:bg-surface-hover"
                  >
                    Cancel
                  </button>
                )}
                <div className="flex items-center gap-sm">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={() => setStep((s) => s - 1)}
                      className="rounded-sm px-lg py-sm text-body text-text-action hover:bg-surface-hover"
                    >
                      Back
                    </button>
                  )}
                  {step < 2 ? (
                    <button
                      type="button"
                      disabled={step === 0 && !fileName}
                      onClick={() => {
                        setStep((s) => s + 1)
                        setShowTagBanner(true)
                      }}
                      className={`rounded-sm px-lg py-sm text-body transition-colors ${
                        step === 0 && !fileName
                          ? 'cursor-not-allowed bg-surface-selected text-text-tertiary'
                          : 'bg-primary text-white hover:bg-primary-hover'
                      }`}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={finishImport}
                      className="rounded-sm bg-primary px-lg py-sm text-body text-white hover:bg-primary-hover"
                    >
                      Start import
                    </button>
                  )}
                </div>
              </div>

              {step === 0 && (
                <div className="mt-lg rounded-md bg-surface-subtle px-xl py-lg text-center text-body text-text-primary">
                  Download a{' '}
                  <button type="button" className="text-text-action hover:underline">
                    sample spreadsheet
                  </button>{' '}
                  to quickly start your import
                </div>
              )}

              {step === 2 && showTagBanner && (
                <div className="mt-lg flex items-start justify-between gap-md rounded-md bg-chip-info-bg px-lg py-md">
                  <div className="flex items-start gap-sm">
                    <Info className="mt-[2px] size-4 shrink-0 text-chip-info-text" strokeWidth={1.6} absoluteStrokeWidth />
                    <p className="text-body text-text-primary">
                      These employees will be automatically tagged with <span className="text-text-primary">bulk_import_09/02/2026</span>. You can filter employees using this tag.
                    </p>
                  </div>
                  <button type="button" aria-label="Dismiss" onClick={() => setShowTagBanner(false)} className="shrink-0 text-text-icon hover:text-text-primary">
                    <X className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Import history */}
        {step === 0 && (
          <div className="mx-auto mt-3xl w-full max-w-[900px] border-t border-border pb-3xl pt-xl">
            <button
              type="button"
              onClick={() => setHistoryOpen((o) => !o)}
              className="flex items-center gap-xs text-body text-text-primary"
            >
              Import history
              <ChevronUp className={`size-4 text-text-icon transition-transform ${historyOpen ? '' : 'rotate-180'}`} strokeWidth={1.6} absoluteStrokeWidth />
            </button>

            {historyOpen && (
              <div className="mt-lg">
                <DataTable columns={historyColumns} data={history as unknown as Record<string, unknown>[]} initialSortKey="date" initialSortDir="desc" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
