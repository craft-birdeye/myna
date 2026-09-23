import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import { Chip } from '../Chip/Chip'
import { ReviewCardBody, StarRating } from '../ReviewCard/ReviewCard'
import { TestRunStepRow } from '../TestRunPanel/TestRunPanel'
import { Tabs } from '../Tabs/Tabs'
import type { Tab } from '../Tabs/Tabs.types'
import { SelectMenu } from '../SelectMenu/SelectMenu'
import { useTestRun } from '../../hooks/useTestRun'
import type { TestRunStatus } from '../../hooks/useTestRun'
import { buildTestRunSteps } from '../../data/testRunSteps'
import { REVIEW_RESPONSE_WORKFLOW } from '../../data/agentWorkflows'
import type { Review } from '../../data/reviewsData'
import type {
  GhostwriterTestRunPanelProps,
  TestRunBatch,
  TestSuite,
  TestSuiteCondition,
} from './GhostwriterTestRunPanel.types'

const TEST_RESULT_TABS: Tab[] = [
  { id: 'details', label: 'Details' },
  { id: 'preview', label: 'Preview' },
]

/** 23 Sep's three left-panel sections. 'suite' and 'cycles' have no data/design yet — they
 *  render a plain empty state until a real spec exists. */
type TestSection = 'cases' | 'suite' | 'cycles'

const TEST_SECTIONS: { id: TestSection; label: string; icon: string; emptyCaption: string }[] = [
  { id: 'cases', label: 'Test cases', icon: 'science', emptyCaption: 'Select a variety of reviews in your test case for best results.' },
  { id: 'suite', label: 'Test suite', icon: 'fact_check', emptyCaption: 'No test suites yet.' },
  { id: 'cycles', label: 'Test cycles', icon: 'autorenew', emptyCaption: 'No test cycles yet.' },
]

/** 23 Sep only — Test suite condition builder. Each field maps to a fixed operator set and,
 *  for operators that need one, a value control: rating → a star-rating picker, date → a
 *  single date or a range, source → a multi-select. Picking a field resets the row to that
 *  field's default operator instead of leaving a stale operator/value combination around. */
type ConditionField = TestSuiteCondition['field']

const CONDITION_FIELD_OPTIONS: { value: ConditionField; label: string }[] = [
  { value: 'rating', label: 'Latest review rating' },
  { value: 'date', label: 'Latest review date' },
  { value: 'source', label: 'Latest review source' },
]

const CONDITION_OPERATORS: Record<ConditionField, { value: string; label: string }[]> = {
  rating: [
    { value: 'is_blank', label: 'is blank' },
    { value: 'is_not_blank', label: 'is not blank' },
    { value: 'equals', label: 'equals to' },
    { value: 'not_equals', label: 'not equals to' },
    { value: 'greater_than', label: 'is greater than' },
    { value: 'less_than', label: 'is less than' },
  ],
  date: [
    { value: 'is_blank', label: 'is blank' },
    { value: 'is_not_blank', label: 'is not blank' },
    { value: 'between', label: 'between' },
    { value: 'before', label: 'before' },
    { value: 'after', label: 'after' },
    { value: 'is', label: 'is' },
  ],
  source: [{ value: 'in', label: 'in' }],
}

/** The default-selected operator per field — not just the first entry in
 *  `CONDITION_OPERATORS`, since that list's display order doesn't match which one starts
 *  checked. */
const DEFAULT_OPERATOR: Record<ConditionField, string> = {
  rating: 'is_not_blank',
  date: 'between',
  source: 'in',
}

/** Rating operators that need a star-rating value; the other rating operators (is/is not
 *  blank) don't. */
const RATING_VALUE_OPERATORS = ['equals', 'not_equals', 'greater_than', 'less_than']
/** Date operators that need a single date value, as opposed to "between"'s range or
 *  "is/is not blank"'s no value. */
const DATE_SINGLE_VALUE_OPERATORS = ['before', 'after', 'is']

const RATING_VALUE_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} star${n === 1 ? '' : 's'}` }))

const REVIEW_SOURCE_OPTIONS = [
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'instagram', label: 'Instagram' },
]

let conditionIdSeq = 0
function makeConditionId() {
  conditionIdSeq += 1
  return `cond-${conditionIdSeq}`
}

function defaultConditionForField(field: ConditionField): TestSuiteCondition {
  return {
    id: makeConditionId(),
    field,
    operator: DEFAULT_OPERATOR[field],
    dateRange: field === 'date' ? 'Sep 1, 2026 to Oct 31, 2026' : undefined,
    sourceValues: field === 'source' ? ['google', 'facebook'] : undefined,
  }
}

/** Applies an operator change, filling in that operator's value with a sensible default the
 *  first time it's picked (so switching to e.g. "is greater than" doesn't show an empty
 *  control) while leaving an already-set value alone if the operator is picked again. */
function applyOperatorChange(condition: TestSuiteCondition, operator: string): TestSuiteCondition {
  const next: TestSuiteCondition = { ...condition, operator }
  if (condition.field === 'rating' && RATING_VALUE_OPERATORS.includes(operator) && !next.ratingValue) {
    next.ratingValue = '3'
  }
  if (condition.field === 'date' && operator === 'between' && !next.dateRange) {
    next.dateRange = 'Sep 1, 2026 to Oct 31, 2026'
  }
  if (condition.field === 'date' && DATE_SINGLE_VALUE_OPERATORS.includes(operator) && !next.dateValue) {
    next.dateValue = 'Sep 1, 2026'
  }
  return next
}

/** Small dropdown trigger — pill button + anchored `SelectMenu` popover, same
 *  getBoundingClientRect anchoring `FilterPanel` uses for its own field popovers. Multi-select
 *  buffers picks locally until "Apply" (matching `SelectMenu`'s own multi+onApply contract);
 *  single-select commits immediately and closes. */
function InlineSelectTrigger({
  label,
  options,
  value,
  multi = false,
  searchable = false,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string[]
  multi?: boolean
  searchable?: boolean
  onChange: (value: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null)
  const [pending, setPending] = useState<string[]>(value)

  function handleToggle(e: React.MouseEvent<HTMLButtonElement>) {
    if (open) {
      setOpen(false)
      return
    }
    const r = e.currentTarget.getBoundingClientRect()
    setAnchor({ top: r.bottom + 4, left: r.left })
    setPending(value)
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        className="flex h-9 min-w-[160px] items-center gap-xs rounded-sm border border-border bg-surface-l2 px-md text-left text-body text-text-primary hover:bg-surface-hover"
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <Icon name="expand_more" size={16} className="shrink-0 text-text-icon" />
      </button>
      {open && anchor && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setOpen(false)} />
          <div className="fixed z-[110] w-[240px]" style={{ top: anchor.top, left: anchor.left }}>
            <SelectMenu
              options={options}
              value={multi ? pending : value}
              multi={multi}
              searchable={searchable}
              onChange={multi ? setPending : (v) => {
                onChange(v)
                setOpen(false)
              }}
              onApply={
                multi
                  ? () => {
                      onChange(pending)
                      setOpen(false)
                    }
                  : undefined
              }
            />
          </div>
        </>
      )}
    </>
  )
}

/** One condition row — "Where"/"and" prefix, field + operator pills, the field-specific value
 *  control, and a delete icon. */
function TestSuiteConditionRow({
  condition,
  isFirst,
  onChange,
  onRemove,
}: {
  condition: TestSuiteCondition
  isFirst: boolean
  onChange: (next: TestSuiteCondition) => void
  onRemove: () => void
}) {
  const fieldLabel = CONDITION_FIELD_OPTIONS.find((f) => f.value === condition.field)?.label ?? ''
  const operatorOptions = CONDITION_OPERATORS[condition.field]
  const operatorLabel = operatorOptions.find((o) => o.value === condition.operator)?.label ?? ''

  return (
    <div className="flex items-center gap-sm">
      <span className="w-12 shrink-0 text-body text-text-secondary">{isFirst ? 'Where' : 'and'}</span>
      <InlineSelectTrigger
        label={fieldLabel}
        options={CONDITION_FIELD_OPTIONS}
        value={[condition.field]}
        onChange={([val]) => onChange(defaultConditionForField(val as ConditionField))}
      />
      <InlineSelectTrigger
        label={operatorLabel}
        options={operatorOptions}
        value={[condition.operator]}
        onChange={([val]) => onChange(applyOperatorChange(condition, val))}
      />
      {condition.field === 'rating' && RATING_VALUE_OPERATORS.includes(condition.operator) && (
        <InlineSelectTrigger
          label={RATING_VALUE_OPTIONS.find((o) => o.value === condition.ratingValue)?.label ?? 'Select rating'}
          options={RATING_VALUE_OPTIONS}
          value={[condition.ratingValue ?? '3']}
          onChange={([val]) => onChange({ ...condition, ratingValue: val })}
        />
      )}
      {condition.field === 'date' && condition.operator === 'between' && (
        <input
          value={condition.dateRange ?? ''}
          onChange={(e) => onChange({ ...condition, dateRange: e.target.value })}
          className="h-9 flex-1 rounded-sm border border-border bg-surface px-md text-body text-text-primary outline-none focus:border-primary"
        />
      )}
      {condition.field === 'date' && DATE_SINGLE_VALUE_OPERATORS.includes(condition.operator) && (
        <input
          value={condition.dateValue ?? ''}
          onChange={(e) => onChange({ ...condition, dateValue: e.target.value })}
          className="h-9 flex-1 rounded-sm border border-border bg-surface px-md text-body text-text-primary outline-none focus:border-primary"
        />
      )}
      {condition.field === 'source' && (
        <InlineSelectTrigger
          label={
            condition.sourceValues && condition.sourceValues.length > 0
              ? `${condition.sourceValues.length} latest review source`
              : 'Select sources'
          }
          options={REVIEW_SOURCE_OPTIONS}
          value={condition.sourceValues ?? []}
          multi
          searchable
          onChange={(vals) => onChange({ ...condition, sourceValues: vals })}
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove condition"
        className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
      >
        <Icon name="delete" size={18} />
      </button>
    </div>
  )
}

/** The Conditions card in the Test suite editor — one row per condition, plus "Add condition". */
function TestSuiteConditionsBlock({
  conditions,
  onChange,
}: {
  conditions: TestSuiteCondition[]
  onChange: (next: TestSuiteCondition[]) => void
}) {
  return (
    <div className="rounded-md border border-border p-lg">
      <p className="m-0 mb-lg text-body text-text-primary">Conditions</p>
      <div className="flex flex-col gap-md">
        {conditions.map((condition, i) => (
          <TestSuiteConditionRow
            key={condition.id}
            condition={condition}
            isFirst={i === 0}
            onChange={(next) => onChange(conditions.map((c, ci) => (ci === i ? next : c)))}
            onRemove={() => onChange(conditions.filter((_, ci) => ci !== i))}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...conditions, defaultConditionForField('rating')])}
        className="mt-lg flex items-center gap-xs rounded-sm py-xs text-body text-text-action hover:bg-surface-hover"
      >
        <Icon name="add_circle" size={18} />
        Add condition
      </button>
    </div>
  )
}

/** Create-flow page for a new Test suite — back arrow + editable name (defaults to "New test
 *  suite") + the Conditions block + a bottom-right "Save test suite" CTA. Fills the same
 *  central-workspace column the Test cases cards sit in. */
function TestSuiteEditorPage({
  onBack,
  onSave,
}: {
  onBack: () => void
  onSave: (suite: TestSuite) => void
}) {
  const [name, setName] = useState('New test suite')
  const [conditions, setConditions] = useState<TestSuiteCondition[]>([defaultConditionForField('rating')])

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-center gap-sm">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
        >
          <Icon name="arrow_back" size={20} />
        </button>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 border-0 bg-transparent text-h3 text-text-primary outline-none"
        />
      </div>
      <TestSuiteConditionsBlock conditions={conditions} onChange={setConditions} />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onSave({ id: `suite-${Date.now()}`, name: name.trim() || 'New test suite', conditions })}
          className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
        >
          Save test suite
        </button>
      </div>
    </div>
  )
}

/** Test suite section's empty state (no suites saved yet) — explains what a suite is (a saved
 *  collection of curated/uploaded reviews) rather than the generic "Select a variety..." copy
 *  Test cases uses, since a suite isn't built the same way a test case is. */
function TestSuiteEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-md px-lg text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-selected text-text-tertiary">
        <Icon name="fact_check" size={20} />
      </span>
      <p className="m-0 max-w-[360px] text-body text-text-secondary">
        A test suite is a saved collection of curated or uploaded reviews you can reuse across test runs.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
      >
        Create test suite
      </button>
    </div>
  )
}

/** One saved Test suite, listed in the central workspace once at least one exists. */
function TestSuiteCard({ suite }: { suite: TestSuite }) {
  return (
    <div className="flex w-full items-center justify-between gap-lg rounded-md border border-border p-lg text-left">
      <p className="m-0 text-body text-text-primary">{suite.name}</p>
      <p className="m-0 text-small text-text-tertiary">
        {suite.conditions.length} condition{suite.conditions.length === 1 ? '' : 's'}
      </p>
    </div>
  )
}

/** Vertical section switcher pinned above the list — 23 Sep only. Same row treatment as
 *  `SideNav`'s flat leaves (h-7, rounded-sm, bg-surface-selected when active). */
function TestSectionNav({
  active,
  onSelect,
}: {
  active: TestSection
  onSelect: (section: TestSection) => void
}) {
  return (
    <nav className="flex flex-col gap-2xs px-sm py-xs">
      {TEST_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          aria-current={section.id === active ? 'page' : undefined}
          onClick={() => onSelect(section.id)}
          className={`flex h-7 w-full items-center gap-sm rounded-sm px-sm py-[6px] text-left transition-colors ${
            section.id === active ? 'bg-surface-selected' : 'hover:bg-surface-selected'
          }`}
        >
          <Icon name={section.icon} size={16} className="shrink-0 text-text-icon" />
          <span className="min-w-0 flex-1 truncate text-body text-text-primary">{section.label}</span>
        </button>
      ))}
    </nav>
  )
}

/** Plain empty state for the not-yet-built 'suite'/'cycles' sections. */
function TestSectionEmptyState({ icon, caption }: { icon: string; caption: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-md px-lg text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-selected text-text-tertiary">
        <Icon name={icon} size={20} />
      </span>
      <p className="m-0 text-body text-text-secondary">{caption}</p>
    </div>
  )
}

/** Same shell the canvas's own floating LHS ("Edit with AI") and RHS (node config / Test
 *  details) panels use: inset from the edges, rounded, elevated — not a flush column. Jay &
 *  Robin only — 23 Sep's `layout="fullpage"` never uses this. */
const FLOATING_PANEL_CLASS =
  'absolute top-lg bottom-lg z-10 overflow-y-auto scrollbar-subtle rounded-2xl border border-border bg-surface shadow-[0_2px_12px_1px_rgba(13,13,18,0.08)]'

/** Same steps the canvas's own "Run test" walks — built once from the static workflow data
 *  (title-identical to what the canvas cards show; the copy patching `WorkflowEditorScreen`
 *  does elsewhere only rewrites descriptions/goals, not the titles this reads). */
const JAY_ROBIN_TEST_RUN_STEPS = buildTestRunSteps(
  REVIEW_RESPONSE_WORKFLOW.nodes,
  REVIEW_RESPONSE_WORKFLOW.nodeDetails,
)

/** Left panel header, shared by the empty and filled states — the panel is titled "Test
 *  cases" regardless of whether any have been run yet. The "+ Add test case" button is only
 *  shown once there's already a list to add to; the empty state has its own centered CTA. */
function TestCasesPanelHeader({
  onAddTestCase,
  showAddButton = true,
}: {
  onAddTestCase?: () => void
  showAddButton?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-sm py-xs">
      <p className="m-0 text-body text-text-primary">Test cases</p>
      {showAddButton && (
        <button
          type="button"
          onClick={onAddTestCase}
          className="flex items-center gap-xs rounded-sm px-sm py-xs text-body text-text-action transition-colors hover:bg-surface-hover"
        >
          <Icon name="add" size={16} />
          Add test case
        </button>
      )}
    </div>
  )
}

/** LHS empty state — the centered "Add test case" CTA. Shared by both layouts; the caller
 *  supplies the outer chrome (floating card vs. plain full-page column). `ctaLabel` lets 23
 *  Sep read "Test case" while Jay & Robin keeps its original wording. */
function LhsEmptyContent({ onRunTest, ctaLabel = 'Add test case' }: { onRunTest?: () => void; ctaLabel?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-md px-lg text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-selected text-text-tertiary">
        <Icon name="science" size={20} />
      </span>
      <p className="m-0 text-body text-text-secondary">
        Select a variety of reviews in your test case for best results.
      </p>
      <button
        type="button"
        onClick={onRunTest}
        className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
      >
        {ctaLabel}
      </button>
    </div>
  )
}

/** One review row — reviewer, star rating, snippet, done checkmark. Shared by Jay & Robin's
 *  inline list (below) and 23 Sep's `TestBatchReviewsPanel` slide-in. */
function ReviewRow({
  review,
  active,
  onSelect,
}: {
  review: Review
  active: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(review.id)}
      className={`flex items-start gap-sm rounded-sm px-sm py-sm text-left transition-colors ${
        active ? 'bg-surface-selected' : 'hover:bg-surface-hover'
      }`}
    >
      <Icon name="check_circle" size={18} className="mt-[2px] shrink-0 text-accent-positive" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-sm">
          <span className="min-w-0 truncate text-body text-text-primary">{review.reviewerName}</span>
          <StarRating rating={review.rating} size={14} />
        </div>
        <p className="m-0 mt-2xs line-clamp-2 text-small text-text-tertiary">{review.text}</p>
      </div>
    </button>
  )
}

/** LHS filled state — Jay & Robin only (23 Sep's fullpage layout shows batch cards in the
 *  main/central workspace instead, via `TestBatchSummaryCard`). One group per batch, newest
 *  first (display only; the caller's default "most recent" selection still reads the batches
 *  array in run order), each with its reviews listed inline underneath. */
function LhsBatchesContent({
  batches,
  selectedId,
  onSelect,
}: {
  batches: TestRunBatch[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-col">
      {[...batches].reverse().map((batch, batchIndex) => (
        <div key={batchIndex} className={`flex flex-col gap-2xs ${batchIndex > 0 ? 'mt-lg' : ''}`}>
          <div className="flex items-center justify-between px-sm py-xs">
            <p className="m-0 text-small text-text-secondary">
              {batch.reviews.length} review{batch.reviews.length === 1 ? '' : 's'} tested
            </p>
            <p className="m-0 text-small text-text-secondary">{batch.testedAt}</p>
          </div>
          {batch.reviews.map((review) => (
            <ReviewRow key={review.id} review={review} active={review.id === selectedId} onSelect={onSelect} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** 23 Sep only — slide-in panel (same convention as `TranscriptSidePanel`/`ProcedureSidePanel`)
 *  opened by clicking a batch's header row in the collapsed LHS list. Portalled to `<body>`,
 *  same reason `GhostwriterRunTestModal` is: the Ghostwriter shell's tab bar is a pinned z-30. */
function TestBatchReviewsPanel({
  open,
  batch,
  selectedId,
  onSelect,
  onClose,
}: {
  open: boolean
  batch: TestRunBatch | null
  selectedId: string | null
  onSelect: (id: string) => void
  onClose: () => void
}) {
  return createPortal(
    <div className={`fixed inset-0 z-[110] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-[480px] max-w-[92vw] flex-col bg-surface shadow-dropdown transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {batch && (
          <>
            <div className="flex shrink-0 items-center justify-between gap-sm border-b border-border px-2xl py-lg">
              <div>
                <p className="m-0 text-h3 text-text-primary">
                  {batch.reviews.length} review{batch.reviews.length === 1 ? '' : 's'} tested
                </p>
                <p className="m-0 mt-2xs text-small text-text-tertiary">{batch.testedAt}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="scrollbar-subtle flex-1 overflow-y-auto px-lg py-md">
              <div className="flex flex-col">
                {batch.reviews.map((review) => (
                  <ReviewRow
                    key={review.id}
                    review={review}
                    active={review.id === selectedId}
                    onSelect={(id) => {
                      onSelect(id)
                      onClose()
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </aside>
    </div>,
    document.body,
  )
}

/** RHS empty state — placeholder line, no result yet. */
function RhsEmptyContent() {
  return (
    <div className="flex flex-1 items-center justify-center text-center">
      <p className="m-0 text-body text-text-tertiary">Add a test case to see the result here.</p>
    </div>
  )
}

/** RHS filled state's body — title/chip, Details/Preview tabs, then the run's own step list or
 *  the review's simulated reply. Pure presentation: takes the running test's state as props so
 *  both layouts can share this markup without duplicating it — the floating layout (Jay &
 *  Robin) drives it from the same `useTestRun` call feeding the canvas behind it, the full-page
 *  layout (23 Sep, no canvas) drives it from its own independent call. 23 Sep's
 *  `TestReviewDetailModal` sets `showReviewerHeader` so this row reads reviewer name + star
 *  rating instead of the plain "Test" label — Jay & Robin never passes it, so it's unaffected. */
function TestResultBody({
  review,
  status,
  stepStatuses,
  showReviewerHeader = false,
}: {
  review: Review
  status: TestRunStatus
  stepStatuses: ('pending' | 'running' | 'done')[]
  showReviewerHeader?: boolean
}) {
  const [resultTab, setResultTab] = useState<'details' | 'preview'>('details')

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center justify-between">
        {showReviewerHeader ? (
          <div>
            <p className="m-0 text-body text-text-primary">{review.reviewerName}</p>
            <div className="mt-2xs">
              <StarRating rating={review.rating} size={14} />
            </div>
          </div>
        ) : (
          <p className="m-0 text-body text-text-primary">Test</p>
        )}
        <Chip label="Passed" variant="success" />
      </div>
      <Tabs
        tabs={TEST_RESULT_TABS}
        activeTab={resultTab}
        onChange={(id) => setResultTab(id as 'details' | 'preview')}
        showBaseline={false}
      />
      {resultTab === 'details' ? (
        <div className="rounded-md border border-border p-lg">
          {JAY_ROBIN_TEST_RUN_STEPS.map((step, i) => (
            <TestRunStepRow
              key={step.id}
              step={step}
              status={stepStatuses[i] ?? 'pending'}
              isLast={i === JAY_ROBIN_TEST_RUN_STEPS.length - 1 && status !== 'complete'}
            />
          ))}
          {status === 'complete' && (
            <div className="flex items-center gap-md">
              <Icon name="check_circle" size={20} fill className="shrink-0 text-accent-positive" />
              <span className="text-small text-text-tertiary">Completed</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-border p-lg">
          <ReviewCardBody review={review} />
        </div>
      )}
    </div>
  )
}

/** Jay & Robin's floating layout: owns the one `useTestRun` call shared by the center canvas
 *  (highlighted nodes) and the floating right panel's step list, so they stay in lockstep —
 *  mounted fresh (via `key={review.id}` at the call site) every time the selected review
 *  changes, restarting the run instead of freezing on whichever review finished first. */
function ReviewWorkflowRun({
  review,
  centerContent,
}: {
  review: Review
  centerContent: GhostwriterTestRunPanelProps['centerContent']
}) {
  const { activeNodeId, doneNodeIds, status, stepStatuses } = useTestRun(JAY_ROBIN_TEST_RUN_STEPS)

  return (
    <>
      <div className="absolute inset-0">{centerContent({ activeNodeId, doneNodeIds })}</div>
      <div className={`${FLOATING_PANEL_CLASS} right-lg w-[420px] p-lg`}>
        <TestResultBody review={review} status={status} stepStatuses={stepStatuses} />
      </div>
    </>
  )
}

/** 23 Sep's full-page layout has no canvas to drive, so its RHS just needs its own
 *  independent `useTestRun` call — same restart-on-review-change trick via `key`. */
function FullPageResultPanel({ review, showReviewerHeader }: { review: Review; showReviewerHeader?: boolean }) {
  const { status, stepStatuses } = useTestRun(JAY_ROBIN_TEST_RUN_STEPS)
  return (
    <TestResultBody
      review={review}
      status={status}
      stepStatuses={stepStatuses}
      showReviewerHeader={showReviewerHeader}
    />
  )
}

/** 23 Sep only — one card per test run, stacked in the central workspace (newest on top),
 *  summarizing how many reviews, who ran it, when, and the pass count. Every review in this
 *  prototype passes (there's no failure path), so it's always total/total — the field exists
 *  so a future failing scenario has somewhere to show up. Clicking a card opens
 *  `TestBatchReviewsPanel` for that batch. */
function TestBatchSummaryCard({ batch, onClick }: { batch: TestRunBatch; onClick: () => void }) {
  const total = batch.reviews.length
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-lg rounded-md border border-border p-lg text-left transition-colors hover:bg-surface-hover"
    >
      <div>
        <p className="m-0 text-body text-text-primary">
          {total} review{total === 1 ? '' : 's'} tested
        </p>
        {batch.testedBy && <p className="m-0 mt-2xs text-small text-text-secondary">Tested by {batch.testedBy}</p>}
      </div>
      <div className="text-right">
        <p className="m-0 text-body text-text-primary">
          {total}/{total} passed
        </p>
        <p className="m-0 mt-2xs text-small text-text-tertiary">{batch.testedAt}</p>
      </div>
    </button>
  )
}

/** 23 Sep only — centered pop-up (same convention as `GhostwriterRunTestModal`) showing one
 *  review's full test result: the same `TestResultBody` (Chip + Details/Preview tabs + stepper)
 *  that used to sit inline on the RHS. Opened by picking a review inside
 *  `TestBatchReviewsPanel`. */
function TestReviewDetailModal({
  open,
  review,
  onClose,
}: {
  open: boolean
  review: Review | null
  onClose: () => void
}) {
  if (!open || !review) return null

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center" aria-hidden={!open}>
      <div onClick={onClose} className="absolute inset-0 bg-black/20" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[calc(100vh-130px)] w-full max-w-[720px] flex-col overflow-hidden rounded-md bg-surface shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-sm border-b border-border px-2xl py-lg">
          <p className="m-0 text-h3 text-text-primary">Review Details</p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="scrollbar-subtle flex-1 overflow-y-auto px-2xl py-lg">
          <FullPageResultPanel key={review.id} review={review} showReviewerHeader />
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** 23 Sep only — persistent page header for a section on the RHS ("main screen"/central
 *  workspace): title on the left, a "+ {ctaLabel}" CTA on the right. Test cases always shows
 *  its CTA, empty or not; Test suite passes `showCta={testSuites.length > 0}` so the header CTA
 *  only appears once there's a suite to show — the empty state carries its own centered CTA
 *  until then. */
function TestPageHeader({
  title,
  ctaLabel,
  onClickCta,
  showCta = true,
}: {
  title: string
  ctaLabel: string
  onClickCta?: () => void
  showCta?: boolean
}) {
  return (
    <div className="mb-lg flex items-center justify-between">
      <h1 className="m-0 text-h3 text-text-primary">{title}</h1>
      {showCta && (
        <button
          type="button"
          onClick={onClickCta}
          className="flex h-9 items-center gap-xs rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
        >
          <Icon name="add" size={16} />
          {ctaLabel}
        </button>
      )}
    </div>
  )
}

/** Create agent CTA — the Test tab, both before and after "Run test" is confirmed in
 *  `GhostwriterRunTestModal`. Two layouts:
 *
 *  - `layout="floating"` (default, Jay & Robin): the canvas (mounted by the caller via
 *    `centerContent`) fills the whole area full-bleed, with the reviews list and the result
 *    detail floating over it on the left/right — not flex columns dividing the width, and not
 *    swapped out for a different screen while empty.
 *  - `layout="fullpage"` (23 Sep): a plain full-page list+detail layout, same outer chrome as
 *    the Tools/Knowledge tabs (`bg-surface`, centered `max-w-[1200px]` column) — no canvas at
 *    all, so `centerContent` is never called.
 *
 *  Every picked review already has a simulated reply in `data/reviewsData.ts`, so each one
 *  reads as a passing run. */
export function GhostwriterTestRunPanel({
  batches,
  centerContent,
  onRunTest,
  className = '',
  layout = 'floating',
  testSuites = [],
  onSaveTestSuite,
}: GhostwriterTestRunPanelProps) {
  const allReviews = batches.flatMap((batch) => batch.reviews)
  const lastBatch = batches[batches.length - 1]
  const [selectedId, setSelectedId] = useState(lastBatch?.reviews[0]?.id ?? null)
  const selected = allReviews.find((r) => r.id === selectedId) ?? lastBatch?.reviews[0] ?? null
  const [section, setSection] = useState<TestSection>('cases')
  const [openBatch, setOpenBatch] = useState<TestRunBatch | null>(null)
  const [detailReview, setDetailReview] = useState<Review | null>(null)
  const [suiteEditorOpen, setSuiteEditorOpen] = useState(false)

  if (layout === 'fullpage') {
    const sectionMeta = TEST_SECTIONS.find((s) => s.id === section) ?? TEST_SECTIONS[0]

    return (
      <div className={`scrollbar-subtle flex h-full min-h-0 w-full flex-col overflow-y-auto bg-surface px-2xl py-xl ${className}`}>
        <div className="mx-auto flex w-full max-w-[1200px] flex-1 gap-2xl">
          <div className="flex w-[300px] shrink-0 flex-col border-r border-border pr-lg">
            <TestSectionNav active={section} onSelect={setSection} />
            {section === 'cycles' && <TestSectionEmptyState icon={sectionMeta.icon} caption={sectionMeta.emptyCaption} />}
          </div>
          <div className="flex min-w-0 flex-1 flex-col pl-lg">
            {section === 'cases' ? (
              <>
                <TestPageHeader title="Test cases" ctaLabel="Test case" onClickCta={onRunTest} />
                {batches.length > 0 ? (
                  <div className="flex flex-col gap-md">
                    {[...batches].reverse().map((batch, i) => (
                      <TestBatchSummaryCard key={i} batch={batch} onClick={() => setOpenBatch(batch)} />
                    ))}
                  </div>
                ) : (
                  <LhsEmptyContent onRunTest={onRunTest} ctaLabel="Test case" />
                )}
              </>
            ) : section === 'suite' ? (
              suiteEditorOpen ? (
                <TestSuiteEditorPage
                  onBack={() => setSuiteEditorOpen(false)}
                  onSave={(suite) => {
                    onSaveTestSuite?.(suite)
                    setSuiteEditorOpen(false)
                  }}
                />
              ) : (
                <>
                  <TestPageHeader
                    title="Test suite"
                    ctaLabel="Test suite"
                    onClickCta={() => setSuiteEditorOpen(true)}
                    showCta={testSuites.length > 0}
                  />
                  {testSuites.length > 0 ? (
                    <div className="flex flex-col gap-md">
                      {testSuites.map((suite) => (
                        <TestSuiteCard key={suite.id} suite={suite} />
                      ))}
                    </div>
                  ) : (
                    <TestSuiteEmptyState onCreate={() => setSuiteEditorOpen(true)} />
                  )}
                </>
              )
            ) : (
              <>
                <p className="m-0 text-body text-text-primary">{sectionMeta.label}</p>
                <TestSectionEmptyState icon={sectionMeta.icon} caption={sectionMeta.emptyCaption} />
              </>
            )}
          </div>
        </div>
        <TestBatchReviewsPanel
          open={openBatch !== null}
          batch={openBatch}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id)
            setDetailReview(allReviews.find((r) => r.id === id) ?? null)
            setOpenBatch(null)
          }}
          onClose={() => setOpenBatch(null)}
        />
        <TestReviewDetailModal
          open={detailReview !== null}
          review={detailReview}
          onClose={() => setDetailReview(null)}
        />
      </div>
    )
  }

  if (!selected) {
    return (
      <div className={`relative h-full min-h-0 w-full overflow-hidden ${className}`}>
        <div className="absolute inset-0">{centerContent({ activeNodeId: null, doneNodeIds: [] })}</div>
        <div className={`${FLOATING_PANEL_CLASS} left-lg flex w-[320px] flex-col p-md`}>
          <TestCasesPanelHeader showAddButton={false} />
          <LhsEmptyContent onRunTest={onRunTest} />
        </div>
        <div className={`${FLOATING_PANEL_CLASS} right-lg flex w-[420px] flex-col p-lg`}>
          <p className="m-0 text-body text-text-primary">Test</p>
          <RhsEmptyContent />
        </div>
      </div>
    )
  }

  return (
    <div className={`relative h-full min-h-0 w-full overflow-hidden ${className}`}>
      <div className={`${FLOATING_PANEL_CLASS} left-lg flex w-[320px] flex-col p-md`}>
        <TestCasesPanelHeader onAddTestCase={onRunTest} />
        <LhsBatchesContent batches={batches} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      <ReviewWorkflowRun key={selected.id} review={selected} centerContent={centerContent} />
    </div>
  )
}
